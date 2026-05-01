/**
 * etl_phase2_mariadb.js — Canonical Final Handoff Package (Full 36 Datasets)
 * 
 * Ingests all metrics from the 36 JSON data files into the Star Schema.
 * Implements Temporal Normalization (2010/2022/2024 via period_year).
 */

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "public", "data");

function padCode(code) {
  if (code == null) return null;
  const s = String(code);
  if (s === '0') return '00'; 
  return s.padStart(5, '0');
}

function formatLabel(str) {
  if (!str) return '';
  return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function main() {
  let mysql;
  try {
    mysql = await import("mysql2/promise");
    if (mysql.default) mysql = mysql.default;
  } catch {
    console.error("❌ mysql2 not found.");
    process.exit(1);
  }
  try { const d = await import("dotenv"); (d.default || d).config(); } catch {}

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "carapicha_dbt",
    user: process.env.DB_USER || "carapicha",
    password: process.env.DB_PASS || "",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    charset: "utf8mb4",
  });
  console.log("🚀 Starting Full Canonical ETL (36 Datasets)...\n");

  const [batchRes] = await conn.execute(
    `INSERT INTO raw_import_batch (batch_name, source_filename, status) VALUES (?, ?, 'PROCESSING')`,
    ["Canonical Final Handoff ETL — 36 Datasets", "Full Pipeline"]
  );
  const batchId = batchRes.insertId;

  // 1. Dimensions
  const domains = [
    ['demography', 'Demografía'], ['household', 'Hogares y Vivienda'], 
    ['tic', 'TIC'], ['economy', 'Economía y Empleo'], 
    ['health', 'Salud'], ['education', 'Educación'], 
    ['living_conditions', 'Condición de Vida'], ['territory', 'Información Territorial']
  ];
  for (const [c, n] of domains) await conn.execute(`INSERT IGNORE INTO dim_domain (domain_code, domain_name) VALUES (?, ?)`, [c, n]);
  const [domRows] = await conn.execute(`SELECT domain_id, domain_code FROM dim_domain`);
  const domMap = Object.fromEntries(domRows.map(r => [r.domain_code, r.domain_id]));

  const sources = [
    ['X Censo Nacional 2022', 'ONE', 'Censo', 2022],
    ['IX Censo Nacional 2010', 'ONE', 'Censo', 2010],
    ['DEE 2024', 'ONE', 'Registro Administrativo', 2024],
    ['MINERD 2022', 'MINERD', 'Registro Administrativo', 2022],
    ['SNS 2022', 'SNS', 'Registro Administrativo', 2022],
  ];
  for (const [n, i, t, y] of sources) await conn.execute(`INSERT IGNORE INTO dim_source (source_name, institution, source_type, reference_year) VALUES (?, ?, ?, ?)`, [n, i, t, y]);
  const [srcRows] = await conn.execute(`SELECT source_id, reference_year, institution FROM dim_source`);
  const getSrc = (inst, year) => srcRows.find(r => r.institution === inst && r.reference_year === year)?.source_id;

  const indicators = [
    { code: 'dem_pop_total', name: 'Población Total', domain: 'demography', agg: 'sum' },
    { code: 'dem_pop_male', name: 'Población Hombres', domain: 'demography', agg: 'sum' },
    { code: 'dem_pop_female', name: 'Población Mujeres', domain: 'demography', agg: 'sum' },
    { code: 'dem_viv_total', name: 'Viviendas Totales', domain: 'demography', agg: 'sum' },
    { code: 'dem_viv_ocup', name: 'Viviendas Ocupadas', domain: 'demography', agg: 'sum' },
    { code: 'dem_viv_desocup', name: 'Viviendas Desocupadas', domain: 'demography', agg: 'sum' },
    { code: 'dem_pop_var_abs', name: 'Variación Poblacional Absoluta', domain: 'demography', agg: 'sum' },
    { code: 'dem_pop_var_pct', name: 'Variación Poblacional Porcentual', domain: 'demography', agg: 'weighted_avg' },
    { code: 'dem_pop_urban', name: 'Población Urbana', domain: 'demography', agg: 'sum' },
    { code: 'dem_pop_rural', name: 'Población Rural', domain: 'demography', agg: 'sum' },
    { code: 'hog_total', name: 'Hogares Totales', domain: 'household', agg: 'sum' },
    { code: 'hog_pop', name: 'Población en Hogares', domain: 'household', agg: 'sum' },
    { code: 'hog_size_avg', name: 'Personas por Hogar (Promedio)', domain: 'household', agg: 'weighted_avg' },
    { code: 'tic_internet_total', name: 'TIC - Base Internet', domain: 'tic', agg: 'sum' },
    { code: 'tic_internet_used', name: 'TIC - Usuarios Internet', domain: 'tic', agg: 'sum' },
    { code: 'tic_internet_rate', name: 'TIC - Tasa Internet', domain: 'tic', agg: 'weighted_avg' },
    { code: 'tic_cellular_total', name: 'TIC - Base Celular', domain: 'tic', agg: 'sum' },
    { code: 'tic_cellular_used', name: 'TIC - Usuarios Celular', domain: 'tic', agg: 'sum' },
    { code: 'tic_cellular_rate', name: 'TIC - Tasa Celular', domain: 'tic', agg: 'weighted_avg' },
    { code: 'tic_computer_total', name: 'TIC - Base Comp', domain: 'tic', agg: 'sum' },
    { code: 'tic_computer_used', name: 'TIC - Usuarios Comp', domain: 'tic', agg: 'sum' },
    { code: 'tic_computer_rate', name: 'TIC - Tasa Comp', domain: 'tic', agg: 'weighted_avg' },
    { code: 'eco_establishments', name: 'Establecimientos DEE', domain: 'economy', agg: 'sum' },
    { code: 'eco_employees', name: 'Empleados DEE', domain: 'economy', agg: 'sum' },
    { code: 'eco_avg_employees', name: 'Promedio Emp/Est', domain: 'economy', agg: 'weighted_avg' },
    { code: 'edu_efficiency_dropout', name: 'Educación - Abandono', domain: 'education', agg: 'weighted_avg' },
    { code: 'edu_efficiency_promotion', name: 'Educación - Promoción', domain: 'education', agg: 'weighted_avg' },
    { code: 'edu_efficiency_reprobation', name: 'Educación - Reprobación', domain: 'education', agg: 'weighted_avg' },
    { code: 'edu_pop_level', name: 'Población por Nivel Educativo', domain: 'education', agg: 'sum' },
    { code: 'edu_offer_schools', name: 'Centros Educativos', domain: 'education', agg: 'sum' },
    { code: 'heal_est_counts', name: 'Establecimientos Salud Contados', domain: 'health', agg: 'sum' },
    { code: 'cv_cocina_vivienda', name: 'Condición Vida - Cocina', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_servicios_sanitarios', name: 'Condición Vida - Sanitarios', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_agua_uso_domestico', name: 'Condición Vida - Agua Doméstica', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_agua_para_beber', name: 'Condición Vida - Agua Beber', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_combustible_cocinar', name: 'Condición Vida - Combustible', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_alumbrado', name: 'Condición Vida - Alumbrado', domain: 'living_conditions', agg: 'sum' },
    { code: 'cv_eliminacion_basura', name: 'Condición Vida - Basura', domain: 'living_conditions', agg: 'sum' },
    { code: 'dem_pyramid', name: 'Pirámide Poblacional', domain: 'demography', agg: 'sum' },
  ];
  for (const ind of indicators) {
    await conn.execute(`INSERT IGNORE INTO dim_indicator (indicator_code, indicator_name, domain_id, aggregation_method) VALUES (?, ?, ?, ?)`, 
      [ind.code, ind.name, domMap[ind.domain], ind.agg]);
  }
  const [indRows] = await conn.execute(`SELECT indicator_id, indicator_code FROM dim_indicator`);
  const indMap = Object.fromEntries(indRows.map(r => [r.indicator_code, r.indicator_id]));

  // 2. Hierarchy (Ingesting municipios_index and regions_index)
  console.log("🌐 Updating Hierarchy...");
  await conn.execute(`INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type) VALUES ('00', 'República Dominicana', 'nacional')`);
  const [[{ territory_id: nacId }]] = await conn.execute(`SELECT territory_id FROM dim_territory WHERE territory_code='00'`);
  const regions = JSON.parse(await readFile(join(DATA_DIR, "regions_index.json"), "utf8"));
  for (const r of regions) await conn.execute(`INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id) VALUES (?, ?, 'region', ?)`, [r.id, r.name, nacId]);
  const munis = JSON.parse(await readFile(join(DATA_DIR, "municipios_index.json"), "utf8"));
  for (const m of munis) {
    const pCode = m.adm2_code.substring(0, 2);
    const pName = m.provincia;
    const [pRows] = await conn.execute(`SELECT territory_id FROM dim_territory WHERE territory_code=? AND territory_type='provincia'`, [pCode]);
    let pId = pRows.length ? pRows[0].territory_id : null;
    if(!pId) {
        await conn.execute(`INSERT INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id) VALUES (?, ?, 'provincia', ?)`, [pCode, pName, nacId]);
        const [[pNew]] = await conn.execute(`SELECT LAST_INSERT_ID() as id`);
        pId = pNew.id;
    }
    await conn.execute(`INSERT IGNORE INTO dim_territory (territory_code, territory_name, territory_type, parent_territory_id, region_oficial_ley345) VALUES (?, ?, 'municipio', ?, ?)`, [m.adm2_code, m.municipio, pId, m.region]);
  }
  const [terrRows] = await conn.execute(`SELECT territory_id, territory_code FROM dim_territory`);
  const terrMap = Object.fromEntries(terrRows.map(r => [r.territory_code, r.territory_id]));

  // 3. Breakdown Manager
  const breakMap = {};
  async function getBreakdownId(category, code, label) {
    if(!category || !code) return -1;
    const key = `${category}:${code}`;
    if (breakMap[key]) return breakMap[key];
    await conn.execute(`INSERT IGNORE INTO dim_breakdown (category, code, label) VALUES (?, ?, ?)`, [category, code, label]);
    const [[row]] = await conn.execute(`SELECT breakdown_id FROM dim_breakdown WHERE category=? AND code=?`, [category, code]);
    breakMap[key] = row.breakdown_id;
    return breakMap[key];
  }

  let totalFactCount = 0;
  async function upsertFact(tc, ic, sid, val, yr = 2022, bid = -1) {
    if (val == null || val === '' || Number.isNaN(val)) return;
    const tId = terrMap[padCode(tc)];
    const iId = indMap[ic];
    if (!tId || !iId) return;
    await conn.execute(
      `INSERT INTO fact_statistic (territory_id, indicator_id, source_id, batch_id, period_year, breakdown_id, numeric_value, quality_flag)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'oficial')
       ON DUPLICATE KEY UPDATE numeric_value = VALUES(numeric_value), batch_id = VALUES(batch_id), updated_at = NOW()`,
      [tId, iId, sid, batchId, yr, bid, val]
    );
    totalFactCount++;
  }

  // 4. Ingest All 36 Files
  const s2022 = getSrc('ONE', 2022);
  const s2010 = getSrc('ONE', 2010);
  const s2024 = getSrc('ONE', 2024);
  const sEdu = getSrc('MINERD', 2022);
  const sHea = getSrc('SNS', 2022);

  async function processFile(file, handler) {
    console.log(`   📂 Ingesting ${file}...`);
    try {
        const data = JSON.parse(await readFile(join(DATA_DIR, file), "utf8"));
        await handler(data);
    } catch(e) { console.warn(`   ⚠️  Failed to process ${file}: ${e.message}`); }
  }

  // -- Basics --
  await processFile("national_basic.json", async d => {
    await upsertFact('00', 'dem_pop_total', s2022, d.poblacion_total);
    await upsertFact('00', 'dem_pop_total', s2010, d.poblacion_total_2010, 2010);
    await upsertFact('00', 'dem_pop_male', s2022, d.poblacion_hombres);
    await upsertFact('00', 'dem_pop_female', s2022, d.poblacion_mujeres);
    await upsertFact('00', 'hog_total', s2022, d.hogares_en_viviendas_particulares_ocupadas);
    await upsertFact('00', 'hog_pop', s2022, d.poblacion_en_hogares_particulares);
    await upsertFact('00', 'hog_size_avg', s2022, d.personas_por_hogar_promedio);
  });
  await processFile("indicadores_basicos.json", async data => {
    for(const m of data) {
        await upsertFact(m.adm2_code, 'dem_pop_total', s2022, m.poblacion_total);
        await upsertFact(m.adm2_code, 'dem_pop_total', s2010, m.poblacion_2010, 2010);
        await upsertFact(m.adm2_code, 'dem_pop_male', s2022, m.poblacion_hombres);
        await upsertFact(m.adm2_code, 'dem_pop_female', s2022, m.poblacion_mujeres);
        await upsertFact(m.adm2_code, 'dem_pop_var_abs', s2022, m.variacion_abs);
        await upsertFact(m.adm2_code, 'dem_pop_var_pct', s2022, m.variacion_pct);
        await upsertFact(m.adm2_code, 'dem_viv_total', s2022, m.viviendas_total);
        await upsertFact(m.adm2_code, 'dem_viv_ocup', s2022, m.viviendas_ocupadas);
        await upsertFact(m.adm2_code, 'dem_viv_desocup', s2022, m.viviendas_desocupadas);
    }
  });

  // -- Hogares --
  for(const f of ["hogares_resumen.json", "hogares_resumen_provincia.json", "national_hogares.json"]) {
    await processFile(f, async data => {
        const list = Array.isArray(data) ? data : [data];
        for(const h of list) {
            const tc = h.adm2_code || h.provincia_code || (f.startsWith('national')?'00':null);
            await upsertFact(tc, 'hog_total', s2022, h.hogares_total || h.hogares_en_viviendas_particulares_ocupadas);
            await upsertFact(tc, 'hog_pop', s2022, h.poblacion_en_hogares || h.poblacion_en_hogares_particulares);
            await upsertFact(tc, 'hog_size_avg', s2022, h.personas_por_hogar || h.personas_por_hogar_promedio);
        }
    });
  }

  // -- TIC --
  for(const f of ["tic.json", "tic_provincia.json", "national_tic.json"]) {
    await processFile(f, async data => {
        const list = Array.isArray(data) ? data : [data];
        for(const t of list) {
            const tc = t.adm2_code || t.provincia_code || (f.startsWith('national')?'00':null);
            for(const m of ['internet','cellular','computer']) {
                if(t[m]) {
                    await upsertFact(tc, `tic_${m}_total`, s2022, t[m].total);
                    await upsertFact(tc, `tic_${m}_used`, s2022, t[m].used);
                    await upsertFact(tc, `tic_${m}_rate`, s2022, t[m].rate_used);
                }
            }
        }
    });
  }

  // -- Breakdown: Tamano Hogar --
  for(const f of ["tamano_hogar.json", "tamano_hogar_provincia.json"]) {
    await processFile(f, async data => {
        for(const h of data) {
            const tc = h.adm2_code || h.provincia_code;
            const bId = await getBreakdownId('hog_size_members', h.miembros, `${h.miembros} miembros`);
            await upsertFact(tc, 'hog_total', s2022, h.hogares, 2022, bId);
        }
    });
  }

  // -- Breakdown: Urbana/Rural --
  for(const f of ["poblacion_urbana_rural.json", "poblacion_urbana_rural_provincia.json"]) {
    await processFile(f, async data => {
        for(const r of data) {
            const tc = r.adm2_code || r.provincia_code;
            const bU = await getBreakdownId('zone_type', 'urbano', 'Urbano');
            const bR = await getBreakdownId('zone_type', 'rural', 'Rural');
            await upsertFact(tc, 'dem_pop_total', s2022, r.urbana, 2022, bU);
            await upsertFact(tc, 'dem_pop_total', s2022, r.rural, 2022, bR);
        }
    });
  }

  // -- Life Conditions --
  for(const f of ["condicion_vida.json", "condicion_vida_provincia.json", "national_condicion_vida.json"]) {
    await processFile(f, async data => {
        const list = Array.isArray(data) ? data : [data];
        for(const doc of list) {
            const tc = doc.adm2_code || doc.provincia_code || (f.startsWith('national')?'00':null);
            if(!doc.servicios) continue;
            for(const [k, v] of Object.entries(doc.servicios)) {
                const ind = `cv_${k}`;
                await upsertFact(tc, ind, s2022, v.total);
                for(const [cat, val] of Object.entries(v.categorias || {})) {
                    const bId = await getBreakdownId(`cv_${k}`, cat, formatLabel(cat));
                    await upsertFact(tc, ind, s2022, val, 2022, bId);
                }
            }
        }
    });
  }

  // -- Pyramids (2010/2022) --
  for(const f of ["pyramids.json", "pyramids_provincia.json", "edad_sexo_2010.json", "edad_sexo_2010_provincia.json"]) {
    await processFile(f, async data => {
        const yr = f.includes('2010') ? 2010 : 2022;
        const src = yr === 2010 ? s2010 : s2022;
        const entries = Array.isArray(data) ? data.map(x => [x.adm2_code || x.provincia_code, x]) : Object.entries(data);
        for(const [tc, d] of entries) {
            for(const r of d.age_groups || []) {
                const age = String(r.age_group).replace(/\s+/g, '_');
                const bM = await getBreakdownId('pyr_sex_age', `male_${age}`, `Hombre ${r.age_group}`);
                const bF = await getBreakdownId('pyr_sex_age', `female_${age}`, `Mujer ${r.age_group}`);
                await upsertFact(tc, 'dem_pyramid', src, r.male, yr, bM);
                await upsertFact(tc, 'dem_pyramid', src, r.female, yr, bF);
            }
        }
    });
  }

  // -- Economy --
  for(const f of ["economia_empleo.json", "economia_empleo_provincia.json", "national_economia_empleo.json"]) {
    await processFile(f, async data => {
        const list = Array.isArray(data) ? data : [data];
        for(const e of list) {
            const tc = e.adm2_code || e.provincia_code || (f.startsWith('national')?'00':null);
            const d = e.dee_2024 || e.dee_nacional;
            if(!d) continue;
            const mapE = { total_establishments: 'eco_establishments', total_employees: 'eco_employees', avg_employees_per_establishment: 'eco_avg_employees' };
            for(const [k,v] of Object.entries(mapE)) await upsertFact(tc, v, s2024, d[k], 2024);
            for(const sb of d.employment_size_bands || []) {
                const bId = await getBreakdownId('eco_size_band', sb.size_band, sb.label);
                await upsertFact(tc, 'eco_establishments', s2024, sb.establishments, 2024, bId);
                await upsertFact(tc, 'eco_employees', s2024, sb.employees, 2024, bId);
            }
            for(const s of d.sectors || []) {
                const bId = await getBreakdownId('eco_sector', s.ciiu_section, s.label);
                await upsertFact(tc, 'eco_establishments', s2024, s.establishments, 2024, bId);
                await upsertFact(tc, 'eco_employees', s2024, s.employees, 2024, bId);
            }
        }
    });
  }

  // -- Education --
  for(const f of ["educacion.json", "educacion_provincia.json"]) {
    await processFile(f, async data => {
        for(const ed of data) {
            if(!ed.anuario?.eficiencia) continue;
            for(const [lvl, stat] of Object.entries(ed.anuario.eficiencia)) {
                const bId = await getBreakdownId('edu_level', lvl, formatLabel(lvl));
                await upsertFact(ed.adm2_code || ed.provincia_code, 'edu_efficiency_dropout', sEdu, stat.abandono, 2022, bId);
                await upsertFact(ed.adm2_code || ed.provincia_code, 'edu_efficiency_promotion', sEdu, stat.promocion, 2022, bId);
            }
        }
    });
  }
  for(const f of ["educacion_nivel.json", "educacion_nivel_provincia.json", "national_educacion_nivel.json"]) {
    await processFile(f, async data => {
        const list = Array.isArray(data) ? data : [data];
        for(const en of list) {
            const tc = en.adm2_code || en.provincia_code || (f.startsWith('national')?'00':null);
            for(const [lvl, v] of Object.entries(en.nivel || {})) {
                for(const m of ['total','h','m','urbano_total','rural_total']) {
                   const bId = await getBreakdownId('edu_pop_level_m', `${lvl}_${m}`, `${formatLabel(lvl)} ${formatLabel(m)}`);
                   await upsertFact(tc, 'edu_pop_level', s2022, v[m], 2022, bId);
                }
            }
        }
    });
  }
  for(const f of ["educacion_oferta_municipal.json", "educacion_oferta_municipal_provincia.json", "national_educacion_oferta.json"]) {
      await processFile(f, async data => {
          const list = Array.isArray(data) ? data : [data];
          for(const eo of list) {
              const tc = eo.adm2_code || eo.provincia_code || (f.startsWith('national')?'00':null);
              await upsertFact(tc, 'edu_offer_schools', sEdu, eo.total_centros_educativos || eo.centros_educativos_total);
          }
      });
  }

  // -- Health & Facilities --
  const hFacData = await loadFile("salud_establecimientos.json");
  if(hFacData) {
      await conn.execute("TRUNCATE TABLE dim_facility");
      for(const [tc, s] of Object.entries(hFacData)) {
          for(const c of s.centros || []) {
              await conn.execute(`INSERT IGNORE INTO dim_facility_type (type_name) VALUES (?)`, [c.tipo_centro]);
              const [[ty]] = await conn.execute(`SELECT type_id FROM dim_facility_type WHERE type_name=?`, [c.tipo_centro]);
              await conn.execute(`INSERT INTO dim_facility (territory_id, type_id, external_id, name, latitude, longitude, admin_region) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [terrMap[tc], ty.id, c.id_centro, c.nombre, c.latitud, c.longitud, c.regional_salud]);
          }
      }
  }
  for(const f of ["salud_establecimientos_provincia.json", "national_salud_establecimientos.json"]) {
      await processFile(f, async data => {
          const list = Array.isArray(data) ? data : [data];
          for(const s of list) {
              const tc = s.provincia_code || (f.startsWith('national')?'00':null);
              await upsertFact(tc, 'heal_est_counts', sHea, s.total_centros || s.centros_total);
          }
      });
  }

  await conn.execute(`UPDATE raw_import_batch SET status='SUCCESS', records_processed=?, updated_at=NOW() WHERE batch_id=?`, [totalFactCount, batchId]);
  console.log(`\n🏁 Total facts in star schema: ${totalFactCount}`);
  await conn.end();
}

main().catch(console.error);
