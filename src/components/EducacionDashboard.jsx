// src/components/EducacionDashboard.jsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GraduationCap } from "lucide-react";
import {
  getEducationEfficiencyOverride,
  getEducationInfrastructureOverride,
  getEducationLevelOverride,
  mergeEducationEfficiency,
  mergeEducationInfrastructure,
  mergeEducationLevel,
} from "../utils/educationEfficiencyOverrides";

/* ============================================================
   3 色テーマ（Educación のオレンジ系 UI に合わせた配色）
============================================================ */
const CHART_COLORS = {
  abandono: "#f59e0b",
  promocion: "#22c55e",
  reprobacion: "#ef4444",
};

/* ============================================================
   Nivel de instrucción 用カラー
============================================================ */
const NIVEL_COLORS = {
  ninguno: "#94a3b8",
  preprimaria: "#38bdf8",
  primaria: "#34d399",
  secundaria: "#fbbf24",
  superior: "#f43f5e",
};

/* ============================================================
   Tooltip
============================================================ */
function CycleTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: "white",
        padding: "6px 10px",
        borderRadius: "6px",
        border: "1px solid #ddd",
        fontSize: "12px",
      }}
    >
      <div>
        <strong>{label}</strong>
      </div>
      <div>{typeof item.value === "number" ? parseFloat(item.value.toFixed(2)) : item.value}% (RD: {item.payload.rd})</div>
    </div>
  );
}

/* ============================================================
   単純カード
============================================================ */
function StatCard({ label, v, rd }) {
  if (v == null || Number.isNaN(v)) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200 print-card">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-semibold text-slate-400">—</div>
        <div className="text-xs text-slate-400">(RD: {rd})</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200 print-card">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">
        {typeof v === "number" ? parseFloat(v.toFixed(2)) : v}{" "}
        <span className="text-xs text-slate-500">(RD: {rd})</span>
      </div>
    </div>
  );
}

/* ============================================================
   円グラフカード（Inicial / Primario / Secundario）
============================================================ */
function CycleChartCard({ title, data }) {
  const pieData = [
    {
      name: "Abandono",
      key: "abandono",
      value: data.abandono,
      rd: data.rd_abandono,
    },
    {
      name: "Promoción",
      key: "promocion",
      value: data.promocion,
      rd: data.rd_promocion,
    },
    {
      name: "Reprobación",
      key: "reprobacion",
      value: data.reprobacion,
      rd: data.rd_reprobacion,
    },
  ];

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col items-center print-card">
      <h3 className="text-lg font-bold text-orange-700 mb-3">{title}</h3>

      <div className="flex flex-col md:flex-row items-center gap-5 w-full">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={35}
                paddingAngle={1}
                startAngle={90}
                endAngle={450}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={CHART_COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip content={<CycleTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 text-xs space-y-1">
          {pieData.map((d) => (
            <div key={d.key} className="flex flex-col print-flex mb-1">
              <span
                className="font-medium flex items-center gap-1"
                style={{ color: CHART_COLORS[d.key] }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-sm"
                  style={{ backgroundColor: CHART_COLORS[d.key] }}
                />
                {d.name}:
              </span>
              <span className="pl-3 mt-0.5">
                {typeof d.value === "number" ? parseFloat(d.value.toFixed(2)) : d.value}%{" "}
                <span className="text-slate-500 text-xs">(RD: {d.rd})</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Utility
============================================================ */
function toPct(value, base) {
  if (value == null || !base || base === 0) return null;
  return Number(((value * 100) / base).toFixed(1));
}

/* ============================================================
   Main Component
============================================================ */
export default function EducacionDashboard({
  records,
  selectedMunicipio,
  isProvinceSelection,
  isRegionSelection,
  educacionNivel,
  regionsIndexData,
  educacionData,
  educacionOfertaMunicipalData,
  educacionOfertaMunicipalProvinciaData,
  nationalEducOferta,
}) {
  const muni = records?.[0] || null;

  if (!muni) return <div>No hay datos disponibles.</div>;

  /* ---------------------------
     Oferta Educativa
  --------------------------- */
  const oferta = (() => {
    // National selection
    if (isRegionSelection && (selectedMunicipio?.region === "Nacional" || selectedMunicipio?.region?.toLowerCase() === "nacional")) {
      return nationalEducOferta;
    }

    // Region selection
    if (isRegionSelection && selectedMunicipio?.region && regionsIndexData) {
      const regionName = selectedMunicipio.region;
      const reg = regionsIndexData.find((r) => r.name === regionName);
      if (reg && reg.provincias) {
        const provs = reg.provincias;
        const relevantOfertas = provs
          .map((p) => educacionOfertaMunicipalProvinciaData.find((o) => o.provincia === p))
          .filter(Boolean);
        if (relevantOfertas.length > 0) {
          const agg = {
            centros_total: 0,
            niveles: {
              inicial_primario: { centros: 0, matricula: 0 },
              secundario: { centros: 0, matricula: 0 },
              adultos: { centros: 0, matricula: 0 }
            }
          };
          for (const o of relevantOfertas) {
            agg.centros_total += (o.centros_total || 0);
            if (o.niveles) {
              if (o.niveles.inicial_primario) {
                agg.niveles.inicial_primario.centros += (o.niveles.inicial_primario.centros || 0);
                agg.niveles.inicial_primario.matricula += (o.niveles.inicial_primario.matricula || 0);
              }
              if (o.niveles.secundario) {
                agg.niveles.secundario.centros += (o.niveles.secundario.centros || 0);
                agg.niveles.secundario.matricula += (o.niveles.secundario.matricula || 0);
              }
              if (o.niveles.adultos) {
                agg.niveles.adultos.centros += (o.niveles.adultos.centros || 0);
                agg.niveles.adultos.matricula += (o.niveles.adultos.matricula || 0);
              }
            }
          }
          return agg;
        }
      }
      return null;
    }

    // Provincia selection
    if (isProvinceSelection && selectedMunicipio?.provincia) {
      const provinciaName = String(selectedMunicipio.provincia).trim();
      return educacionOfertaMunicipalProvinciaData.find(
        (o) => String(o.provincia).trim() === provinciaName
      ) || null;
    }

    const candidates = [];
    if (muni.codigo_adm2 != null) {
      const code = String(muni.codigo_adm2).padStart(5, "0");
      candidates.push((o) => String(o.adm2_code).padStart(5, "0") === code);
    }
    if (muni.adm2_code != null) {
      const code = String(muni.adm2_code).padStart(5, "0");
      candidates.push((o) => String(o.adm2_code).padStart(5, "0") === code);
    }
    if (muni.municipio) {
      const name = String(muni.municipio).trim();
      candidates.push((o) => String(o.municipio).trim() === name);
    }
    for (const match of candidates) {
      const hit = educacionOfertaMunicipalData.find(match);
      if (hit) return hit;
    }
    return null;
  })();

  /* ---------------------------
     Anuario fallback
  --------------------------- */
  let infra = muni?.anuario?.infraestructura || null;
  let efic = muni?.anuario?.eficiencia || null;

  const distritoCodeFromAnuario = (() => {
    const raw = muni?.anuario?.distrito_educativo;
    if (!raw) return null;
    const match = String(raw).match(/\d{4}/);
    return match ? match[0] : null;
  })();

  const distritoCode =
    distritoCodeFromAnuario ||
    (oferta ? String(oferta.distrito_educativo).padStart(4, "0") : null);

  const distritoRecord = distritoCode && !isRegionSelection && !isProvinceSelection
    ? educacionData.find(
      (d) =>
        String(d.distrito_educativo || d.distrito_educativo_code).padStart(
          4,
          "0"
        ) === distritoCode
    )
    : null;

  if (!infra && distritoRecord?.anuario?.infraestructura) {
    infra = distritoRecord.anuario.infraestructura;
  }
  if (!efic && distritoRecord?.anuario?.eficiencia) {
    efic = distritoRecord.anuario.eficiencia;
  }

  const shouldAggregate = isRegionSelection || (isProvinceSelection && (!infra || !efic));

  // If we should aggregate (e.g. Region mode, or missing Province mode), aggregate from all 'records'
  if (shouldAggregate && records && records.length > 0) {
    const aggInfra = {};
    const aggEfic = { inicial: {}, primario: {}, secundario: {} };
    let cInfra = 0;
    let cEficInit = 0, cEficPrim = 0, cEficSec = 0;

    for (const r of records) {
      const pInfra = r.anuario?.infraestructura;
      if (pInfra) {
        cInfra++;
        ['aulas_por_plantel', 'secciones_por_centro', 'secciones_por_aula', 'docentes_por_centro', 'alumnos_por_centro', 'alumnos_por_aula', 'alumnos_por_seccion', 'alumnos_por_docente'].forEach(k => {
          aggInfra[k] = (aggInfra[k] || 0) + (pInfra[k] || 0);
        });
      }

      const pEfic = r.anuario?.eficiencia;
      if (pEfic) {
        if (pEfic.inicial) {
          cEficInit++;
          ['abandono', 'promocion', 'reprobacion'].forEach(k => {
            aggEfic.inicial[k] = (aggEfic.inicial[k] || 0) + (pEfic.inicial[k] || 0);
          });
        }
        if (pEfic.primario) {
          cEficPrim++;
          ['abandono', 'promocion', 'reprobacion'].forEach(k => {
            aggEfic.primario[k] = (aggEfic.primario[k] || 0) + (pEfic.primario[k] || 0);
          });
        }
        if (pEfic.secundario) {
          cEficSec++;
          ['abandono', 'promocion', 'reprobacion'].forEach(k => {
            aggEfic.secundario[k] = (aggEfic.secundario[k] || 0) + (pEfic.secundario[k] || 0);
          });
        }
      }
    }

    if (cInfra > 0) {
      infra = {};
      Object.keys(aggInfra).forEach(k => infra[k] = aggInfra[k] / cInfra);
    }
    if (cEficInit > 0 || cEficPrim > 0 || cEficSec > 0) {
      efic = { inicial: {}, primario: {}, secundario: {} };
      if (cEficInit > 0) ['abandono', 'promocion', 'reprobacion'].forEach(k => efic.inicial[k] = aggEfic.inicial[k] / cEficInit);
      if (cEficPrim > 0) ['abandono', 'promocion', 'reprobacion'].forEach(k => efic.primario[k] = aggEfic.primario[k] / cEficPrim);
      if (cEficSec > 0) ['abandono', 'promocion', 'reprobacion'].forEach(k => efic.secundario[k] = aggEfic.secundario[k] / cEficSec);
    }
  }

  const eficienciaOverride = getEducationEfficiencyOverride({
    adm2Code: selectedMunicipio?.adm2_code || muni?.adm2_code,
    provincia: selectedMunicipio?.provincia || muni?.provincia,
  });
  const infraestructuraOverride = getEducationInfrastructureOverride({
    adm2Code: selectedMunicipio?.adm2_code || muni?.adm2_code,
    provincia: selectedMunicipio?.provincia || muni?.provincia,
  });
  const nivelOverride = getEducationLevelOverride({
    adm2Code: selectedMunicipio?.adm2_code || muni?.adm2_code,
    provincia: selectedMunicipio?.provincia || muni?.provincia,
  });

  infra = mergeEducationInfrastructure(infra || {}, infraestructuraOverride);
  efic = mergeEducationEfficiency(efic || {}, eficienciaOverride);

  const RD = {
    inicial: { abandono: 1.4, promocion: 98.6, reprobacion: 0.0 },
    primario: { abandono: 2.6, promocion: 92.3, reprobacion: 5.1 },
    secundario: { abandono: 5.2, promocion: 88.8, reprobacion: 6.6 },
  };

  /* ---------------------------
     Nivel de instrucción
  --------------------------- */
  const nivelRow = (() => {
    if (educacionNivel && educacionNivel.length > 0) {
      return educacionNivel[0];
    }
    if (!muni.adm2_code) return null;
    const code = String(muni.adm2_code).padStart(5, "0");
    return (
      educacionData.find(
        (r) => String(r.adm2_code).padStart(5, "0") === code
      ) || null
    );
  })();

  const nivel = mergeEducationLevel(nivelRow?.nivel || null, nivelOverride);

  const totalNivel =
    nivel &&
    [
      nivel.ninguno?.total ?? 0,
      nivel.preprimaria?.total ?? 0,
      nivel.primaria?.total ?? 0,
      nivel.secundaria?.total ?? 0,
      nivel.superior?.total ?? 0,
    ].reduce((a, b) => a + b, 0);

  const pct =
    nivel && totalNivel
      ? {
        ninguno: toPct(nivel.ninguno?.total, totalNivel),
        preprimaria: toPct(nivel.preprimaria?.total, totalNivel),
        primaria: toPct(nivel.primaria?.total, totalNivel),
        secundaria: toPct(nivel.secundaria?.total, totalNivel),
        superior: toPct(nivel.superior?.total, totalNivel),
      }
      : null;

  const nivelPieData =
    nivel && pct
      ? [
        { name: "Ninguno", key: "ninguno", value: pct.ninguno ?? 0 },
        { name: "Preprimaria", key: "preprimaria", value: pct.preprimaria ?? 0 },
        { name: "Primaria/Básica", key: "primaria", value: pct.primaria ?? 0 },
        { name: "Secundaria/Media", key: "secundaria", value: pct.secundaria ?? 0 },
        { name: "Universitaria/Superior", key: "superior", value: pct.superior ?? 0 },
      ]
      : [];

  function levelShares(levelObj) {
    if (!levelObj) return null;
    const base = levelObj.total ?? 0;
    if (!base) return null;
    return {
      urbano_h: toPct(levelObj.urbano_h, base),
      urbano_m: toPct(levelObj.urbano_m, base),
      rural_h: toPct(levelObj.rural_h, base),
      rural_m: toPct(levelObj.rural_m, base),
    };
  }

  const shares = nivel
    ? {
      ninguno: levelShares(nivel.ninguno),
      preprimaria: levelShares(nivel.preprimaria),
      primaria: levelShares(nivel.primaria),
      secundaria: levelShares(nivel.secundaria),
      superior: levelShares(nivel.superior),
    }
    : null;

  return (
    <div className="
      my-6 rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm 
      print-no-margin print-no-padding print-allow-break
    ">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-orange-200 rounded-full flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-orange-700" />
        </div>
        <h2 className="text-xl font-bold text-orange-700">
          Educación – contexto general
        </h2>
      </div>

      <h3 className="text-lg font-semibold">
        {selectedMunicipio?.municipio || muni.municipio}
      </h3>
      {selectedMunicipio?.provincia && (
        <div className="text-sm text-slate-600 mb-3">
          Provincia: {selectedMunicipio.provincia}
        </div>
      )}

      {/* Oferta + Nivel */}
      <div className="grid gap-4 md:grid-cols-[1fr,1.35fr] mb-6 items-start print-grid print-grid-2">
        {/* Oferta Educativa */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200 print-card">
          <h3 className="font-semibold text-orange-700 mb-2">
            {isRegionSelection
              ? `Oferta Educativa – Región ${selectedMunicipio?.region}`
              : isProvinceSelection
                ? `Oferta Educativa – Provincia ${selectedMunicipio?.provincia || muni.provincia}`
                : `Oferta Educativa – Municipio ${muni.municipio}`}
          </h3>

          {oferta ? (
            <>
              <p>
                <strong>Total centros educativos:</strong> {oferta.centros_total}
              </p>

              <p className="mt-1">
                <strong>Inicial–Primario:</strong>{" "}
                {oferta.niveles?.inicial_primario?.centros} centros (
                {oferta.niveles?.inicial_primario?.matricula} estudiantes)
              </p>

              <p className="mt-1">
                <strong>Secundario:</strong>{" "}
                {oferta.niveles?.secundario?.centros} centros (
                {oferta.niveles?.secundario?.matricula} estudiantes)
              </p>

              <p className="mt-1">
                <strong>Adultos:</strong>{" "}
                {oferta.niveles?.adultos?.centros} centros (
                {oferta.niveles?.adultos?.matricula} estudiantes)
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              {isRegionSelection
                ? "Resumen de centros no disponible para la región completa."
                : isProvinceSelection
                  ? "No hay datos sobre oferta educativa para esta provincia."
                  : "No hay datos sobre oferta educativa para este municipio."}
            </p>
          )}
        </div>

        {/* Nivel de instrucción */}
        {nivel && pct && shares && (
          <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200 print-card">
            <h3 className="font-semibold text-orange-700 mb-3">
              Nivel de instrucción – Censo 2022
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-[0.55fr,1fr] gap-3 items-center print-grid print-grid-2">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nivelPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={70}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {nivelPieData.map((d) => (
                        <Cell key={d.key} fill={NIVEL_COLORS[d.key]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, name]}
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="space-y-1 text-xs">
                {nivelPieData.map((d) => {
                  const s = shares[d.key];
                  const pctValue = pct[d.key];
                  return (
                    <li key={d.key} className="flex gap-2 items-start">
                      <span
                        className="inline-block w-3 h-3 mt-[3px] rounded-sm"
                        style={{ backgroundColor: NIVEL_COLORS[d.key] }}
                      />
                      <div>
                        <span className="font-medium">{d.name}:</span>{" "}
                        {pctValue != null ? `${pctValue}%` : "—"}
                        <div className="text-[10px] text-slate-500 leading-tight">
                          Urb H:{s?.urbano_h ?? "—"} / M:{s?.urbano_m ?? "—"} ·
                          Rur H:{s?.rural_h ?? "—"} / M:{s?.rural_m ?? "—"}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Distrito Educativo */}
      {(() => {
        let label = null;
        if (isRegionSelection || isProvinceSelection) {
          label = "Multiple";
          // Special case: if the province is DN and only has one municipality with one district (1503)? 
          // Wait, Distrito Nacional HAS ONE municipality (DN), but that municipality has MULTIPLE districts.
          // Let's just use Multiple for any Region/Province scope to be accurate and safe.
        } else {
          const labelFromAnuario = muni?.anuario?.distrito_educativo;
          const labelFromOferta = oferta
            ? `${oferta.distrito_educativo} ${oferta.distrito_nombre || ""}`
            : null;
          label = labelFromAnuario || labelFromOferta;
        }

        return (
          <div className="mb-4 print-card">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Distrito educativo
              </span>
              <span className="text-base font-semibold text-slate-900">
                {label || "—"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {label === "Multiple"
                ? "Los indicadores siguientes representan un promedio consolidado de los distritos correspondientes."
                : "Los indicadores siguientes corresponden al distrito educativo."}
            </p>
          </div>
        );
      })()}

      {/* Infraestructura */}
      {/* ============================
          Infraestructura educativa
         ============================ */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-700 mb-2">
          Infraestructura educativa
        </h3>

        <div className="grid gap-3 md:grid-cols-4 educacion-infra-grid">
          <StatCard label="Aulas por plantel" v={infra.aulas_por_plantel} rd={8.8} />
          <StatCard label="Secciones por centro" v={infra.secciones_por_centro} rd={9.8} />
          <StatCard label="Secciones por aula" v={infra.secciones_por_aula} rd={1.3} />
          <StatCard label="Docentes por centro" v={infra.docentes_por_centro} rd={16.5} />
          <StatCard label="Alumnos por centro" v={infra.alumnos_por_centro} rd={202.7} />
          <StatCard label="Alumnos por aula" v={infra.alumnos_por_aula} rd={27.2} />
          <StatCard label="Alumnos por sección" v={infra.alumnos_por_seccion} rd={20} />
          <StatCard label="Alumnos por docente" v={infra.alumnos_por_docente} rd={12.9} />
        </div>
      </div>

      {/* Eficiencia */}
      <h3 className="font-semibold text-slate-700 mt-6 mb-3">
        Eficiencia del sistema educativo
      </h3>

      <div className="grid md:grid-cols-3 gap-4 educacion-eficiencia-grid">
        <CycleChartCard
          title="Inicial"
          data={{
            abandono: efic.inicial?.abandono ?? null,
            promocion: efic.inicial?.promocion ?? null,
            reprobacion: efic.inicial?.reprobacion ?? null,
            rd_abandono: RD.inicial.abandono,
            rd_promocion: RD.inicial.promocion,
            rd_reprobacion: RD.inicial.reprobacion,
          }}
        />

        <CycleChartCard
          title="Primario"
          data={{
            abandono: efic.primario?.abandono ?? null,
            promocion: efic.primario?.promocion ?? null,
            reprobacion: efic.primario?.reprobacion ?? null,
            rd_abandono: RD.primario.abandono,
            rd_promocion: RD.primario.promocion,
            rd_reprobacion: RD.primario.reprobacion,
          }}
        />

        <CycleChartCard
          title="Secundario"
          data={{
            abandono: efic.secundario?.abandono ?? null,
            promocion: efic.secundario?.promocion ?? null,
            reprobacion: efic.secundario?.reprobacion ?? null,
            rd_abandono: RD.secundario.abandono,
            rd_promocion: RD.secundario.promocion,
            rd_reprobacion: RD.secundario.reprobacion,
          }}
        />
      </div>

      <p className="mt-4 text-[10px] text-slate-500 print-card">
        Fuente: MINERD, Anuario Estadístico Educativo y Censo 2022.
      </p>
    </div>
  );
}
