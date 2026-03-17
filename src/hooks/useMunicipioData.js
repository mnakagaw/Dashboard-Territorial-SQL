/**
 * useMunicipioData.js - Hook Principal de Datos
 *
 * Este es el hook más importante de la aplicación. Se encarga de:
 * 1. Obtener datos crudos desde useDataLoader
 * 2. Filtrar los datos según el municipio/provincia/región seleccionado
 * 3. Proporcionar los datos procesados a todos los componentes
 *
 * Flujo de datos:
 * ┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
 * │  useDataLoader   │ ──► │ useMunicipioData │ ──► │  React Components │
 * │  (carga JSON)    │     │  (filtra/agrega) │     │  (charts, maps)   │
 * └─────────────────┘     └──────────────────┘     └───────────────────┘
 *
 * Parámetros:
 * @param {string} regionId - ID de la región seleccionada
 * @param {string} provinceName - Nombre de la provincia seleccionada
 * @param {string} adm2Code - Código ADM2 o "prov:NombreProvincia"
 *
 * Retorna un objeto con todos los datos filtrados para el municipio/provincia
 * seleccionado, listos para usar en los componentes.
 */

// src/hooks/useMunicipioData.js
import { useMemo } from "react";
import useDataLoader from "./useDataLoader";
import {
  normalizeAdm2,
  buildLongMap,
  buildProvinceMap,
  buildCondicionVidaParsed,
} from "../utils/dataHelpers";

// ---------------------------------------------------------------------------
// Main Hook
// ---------------------------------------------------------------------------
export default function useMunicipioData(regionId, provinceName, adm2Code) {
  // Obtener todos los datos crudos desde el data loader
  const raw = useDataLoader();

  const {
    loaded,
    regionsIndexData,
    municipiosIndexData,
    indicadoresBasicosData,
    pyramidsData,
    economiaEmpleoData,
    educacionData,
    educacionNivelData,
    pyramid2010Data,
    adm2Map2010,
    hogaresResumenData,
    hogaresTamanoData,
    poblacionUrbanaRuralData,
    educacionProvinciaData,
    hogaresResumenProvinciaData,
    hogaresTamanoProvinciaData,
    poblacionUrbanaRuralProvinciaData,
    ticProvinciaData,
    condicionVidaProvinciaData,
    saludEstablecimientosProvinciaData,
    economiaEmpleoProvinciaData,
    educacionNivelProvinciaData,
    pyramidsProvinciaData,
    pyramid2010ProvinciaData,
    educacionOfertaMunicipalData,
    educacionOfertaMunicipalProvinciaData,
    ticData,
    condicionVidaData,
    nationalCondicionVida,
    nationalBasic,
    nationalEcon,
    saludEstablecimientosData,
    nationalTic,
    nationalEducNivel,
    nationalEducOferta,
    nationalHogares,
    nationalSalud,
  } = raw;

  // ---------------------------------------------------------------------------
  // Índices
  // ---------------------------------------------------------------------------
  const municipiosIndex = useMemo(() => {
    return [...municipiosIndexData].sort((a, b) => {
      if (a.provincia === b.provincia) {
        return a.municipio.localeCompare(b.municipio, "es-DO");
      }
      return a.provincia.localeCompare(b.provincia, "es-DO");
    });
  }, [municipiosIndexData]);

  const provincias = useMemo(() => {
    const set = new Set(municipiosIndex.map((m) => m.provincia));
    return [...set].sort((a, b) => a.localeCompare(b, "es-DO"));
  }, [municipiosIndex]);

  // ---------------------------------------------------------------------------
  // Lógica de selección
  // ---------------------------------------------------------------------------
  const isRegionSelection = useMemo(() => !!regionId && !provinceName && !adm2Code, [regionId, provinceName, adm2Code]);
  const isProvinceSelection = useMemo(() => !!provinceName && !adm2Code, [provinceName, adm2Code]);
  const selectedAdm2 = adm2Code;

  const selectedRegionScope = regionId;
  const selectedProvinceScope = provinceName;
  const selectedAdm2Norm = normalizeAdm2(selectedAdm2);

  const selectedMunicipio = useMemo(() => {
    if (selectedAdm2) {
      return municipiosIndex.find((m) => m.adm2_code === selectedAdm2) || null;
    }
    if (isProvinceSelection && selectedProvinceScope) {
      return {
        adm2_code: null,
        municipio: `Provincia de ${selectedProvinceScope}`,
        provincia: selectedProvinceScope,
        region: municipiosIndex.find((m) => m.provincia === selectedProvinceScope)?.region || "",
      };
    }
    if (isRegionSelection && selectedRegionScope) {
      if (selectedRegionScope === "nacional") {
        return {
          adm2_code: null,
          municipio: "República Dominicana",
          provincia: null,
          region: "Nacional",
        };
      }
      const reg = regionsIndexData.find((r) => r.id === selectedRegionScope);
      return {
        adm2_code: null,
        municipio: `Región ${reg?.name || selectedRegionScope}`,
        provincia: null,
        region: reg?.name || selectedRegionScope,
      };
    }
    return null;
  }, [municipiosIndex, selectedAdm2, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, regionsIndexData]);

  // ---------------------------------------------------------------------------
  // Mapas de datos agrupados
  // ---------------------------------------------------------------------------
  const indicadoresMap = useMemo(() => {
    const m = new Map();
    for (const r of indicadoresBasicosData) {
      m.set(normalizeAdm2(r.adm2_code), r);
    }
    return m;
  }, [indicadoresBasicosData]);

  const econMap = useMemo(() => {
    const m = new Map();
    for (const r of economiaEmpleoData) {
      m.set(normalizeAdm2(r.adm2_code), r);
    }
    return m;
  }, [economiaEmpleoData]);

  const pyramidMap = useMemo(() => pyramidsData || {}, [pyramidsData]);

  const pyramid2010Map = useMemo(() => {
    const m = new Map();
    for (const r of pyramid2010Data) {
      const key = normalizeAdm2(r.adm2_code);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push({
        age_group: r.age_group,
        male: r.male,
        female: r.female,
      });
    }
    return m;
  }, [pyramid2010Data]);

  const educacionMap = useMemo(() => buildLongMap(educacionData), [educacionData]);

  const educacionNivelMap = useMemo(
    () => buildLongMap(educacionNivelData),
    [educacionNivelData]
  );

  const hogaresResumenMap = useMemo(
    () => buildLongMap(hogaresResumenData),
    [hogaresResumenData]
  );
  const hogaresTamanoMap = useMemo(
    () => buildLongMap(hogaresTamanoData),
    [hogaresTamanoData]
  );
  const poblacionUrbanaRuralMap = useMemo(
    () => buildLongMap(poblacionUrbanaRuralData),
    [poblacionUrbanaRuralData]
  );

  // Mapas a nivel provincial
  const educacionProvinciaMap = useMemo(() => buildProvinceMap(educacionProvinciaData), [educacionProvinciaData]);
  const hogaresResumenProvinciaMap = useMemo(() => buildProvinceMap(hogaresResumenProvinciaData), [hogaresResumenProvinciaData]);
  const hogaresTamanoProvinciaMap = useMemo(() => buildProvinceMap(hogaresTamanoProvinciaData), [hogaresTamanoProvinciaData]);
  const poblacionUrbanaRuralProvinciaMap = useMemo(() => buildProvinceMap(poblacionUrbanaRuralProvinciaData), [poblacionUrbanaRuralProvinciaData]);
  const ticProvinciaMap = useMemo(() => buildProvinceMap(ticProvinciaData), [ticProvinciaData]);
  const saludEstablecimientosProvinciaMap = useMemo(() => buildProvinceMap(saludEstablecimientosProvinciaData), [saludEstablecimientosProvinciaData]);
  const economiaEmpleoProvinciaMap = useMemo(() => buildProvinceMap(economiaEmpleoProvinciaData), [economiaEmpleoProvinciaData]);
  const educacionNivelProvinciaMap = useMemo(() => buildProvinceMap(educacionNivelProvinciaData), [educacionNivelProvinciaData]);
  const pyramidsProvinciaMap = useMemo(() => buildProvinceMap(pyramidsProvinciaData), [pyramidsProvinciaData]);
  const pyramid2010ProvinciaMap = useMemo(() => buildProvinceMap(pyramid2010ProvinciaData), [pyramid2010ProvinciaData]);

  // ---------------------------------------------------------------------------
  // Indicadores básicos
  // ---------------------------------------------------------------------------
  const indicadores = useMemo(() => {
    if (selectedAdm2) {
      return indicadoresMap.get(normalizeAdm2(selectedAdm2)) || null;
    }

    if (isProvinceSelection && selectedProvinceScope) {
      const rows = indicadoresBasicosData.filter(
        (r) => r.provincia === selectedProvinceScope
      );
      if (!rows.length) return null;

      const sum = (field) => rows.reduce((a, r) => a + (r[field] ?? 0), 0);

      return {
        adm2_code: null,
        municipio: `Provincia de ${selectedProvinceScope}`,
        provincia: selectedProvinceScope,
        poblacion_total: sum("poblacion_total"),
        poblacion_2010: sum("poblacion_2010"),
        poblacion_hombres: sum("poblacion_hombres"),
        poblacion_mujeres: sum("poblacion_mujeres"),
      };
    }

    if (isRegionSelection && selectedRegionScope) {
      if (selectedRegionScope === "nacional" && nationalBasic) {
        return {
          adm2_code: null,
          municipio: "República Dominicana",
          provincia: null,
          region: "Nacional",
          poblacion_total: nationalBasic.poblacion_total,
          poblacion_2010: nationalBasic.poblacion_2010,
          poblacion_hombres: nationalBasic.poblacion_hombres,
          poblacion_mujeres: nationalBasic.poblacion_mujeres,
        };
      }
      const reg = regionsIndexData.find((r) => r.id === selectedRegionScope);
      const provincesInRegion = reg?.provincias || [];
      const rows = indicadoresBasicosData.filter((r) =>
        provincesInRegion.includes(r.provincia)
      );
      if (!rows.length) return null;

      const sum = (field) => rows.reduce((a, r) => a + (r[field] ?? 0), 0);

      return {
        adm2_code: null,
        municipio: `Región ${reg?.name || selectedRegionScope}`,
        provincia: null,
        region: reg?.name || selectedRegionScope,
        poblacion_total: sum("poblacion_total"),
        poblacion_2010: sum("poblacion_2010"),
        poblacion_hombres: sum("poblacion_hombres"),
        poblacion_mujeres: sum("poblacion_mujeres"),
      };
    }

    return null;
  }, [
    selectedAdm2,
    isProvinceSelection,
    selectedProvinceScope,
    isRegionSelection,
    selectedRegionScope,
    indicadoresBasicosData,
    indicadoresMap,
    regionsIndexData,
  ]);

  // ---------------------------------------------------------------------------
  // Otros conjuntos de datos
  // ---------------------------------------------------------------------------
  const econ = useMemo(() => {
    if (selectedAdm2) {
      return econMap.get(normalizeAdm2(selectedAdm2)) || null;
    }
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = economiaEmpleoProvinciaMap.get(selectedProvinceScope) || [];
      return rows[0] || null;
    }
    if (isRegionSelection && selectedRegionScope) {
      if (selectedRegionScope === "nacional") return nationalEcon;
      const reg = regionsIndexData.find((r) => r.id === selectedRegionScope);
      const provinces = reg?.provincias || [];
      const allRows = provinces.flatMap(p => economiaEmpleoProvinciaMap.get(p) || []);

      if (!allRows.length) return null;

      // Agregar campos simples
      const total_establishments = allRows.reduce((sum, r) => sum + (r.dee_2024?.total_establishments || 0), 0);
      const total_employees = allRows.reduce((sum, r) => sum + (r.dee_2024?.total_employees || 0), 0);

      // Agregar franjas de tamaño de empresa
      const bandsMap = {};
      allRows.forEach(row => {
        (row.dee_2024?.employment_size_bands || []).forEach(b => {
          if (!bandsMap[b.size_band]) {
            bandsMap[b.size_band] = { size_band: b.size_band, label: b.label, establishments: 0, employees: 0 };
          }
          bandsMap[b.size_band].establishments += (b.establishments || 0);
          bandsMap[b.size_band].employees += (b.employees || 0);
        });
      });
      const bands = Object.values(bandsMap).map(b => ({
        ...b,
        employees_share: total_employees > 0 ? b.employees / total_employees : 0
      }));

      // Agregar sectores (CIIU)
      const sectorsMap = {};
      allRows.forEach(row => {
        (row.dee_2024?.sectors || []).forEach(s => {
          const key = s.label || s.section;
          if (!sectorsMap[key]) {
            sectorsMap[key] = { label: s.label, section: s.section, establishments: 0, employees: 0 };
          }
          sectorsMap[key].establishments += (s.establishments || 0);
          sectorsMap[key].employees += (s.employees || 0);
        });
      });
      const aggregatedSectors = Object.values(sectorsMap).map(s => ({
        ...s,
        employees_share: total_employees > 0 ? s.employees / total_employees : 0,
        lq: null // LQ requiere comparación nacional, se omite para agregaciones regionales
      }));

      // Especialización principal
      const topSpec = aggregatedSectors.length > 0
        ? aggregatedSectors.reduce((best, s) => s.establishments > (best?.establishments || 0) ? s : best, null)
        : null;

      return {
        dee_2024: {
          total_establishments,
          total_employees,
          avg_employees_per_establishment: total_establishments > 0 ? total_employees / total_establishments : 0,
          employment_size_bands: bands,
          sectors: aggregatedSectors,
          top_specialization: topSpec
        }
      };
    }
    return null;
  }, [econMap, selectedAdm2, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, economiaEmpleoProvinciaMap, regionsIndexData]);

  const pyramid = useMemo(() => {
    if (selectedAdm2) {
      const entry = pyramidMap[selectedAdm2];
      return entry?.age_groups || [];
    }
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = pyramidsProvinciaMap.get(selectedProvinceScope) || [];
      return rows[0]?.age_groups || [];
    }
    if (isRegionSelection && selectedRegionScope) {
      const isNacional = selectedRegionScope === "nacional";
      const provinces = isNacional ? provincias : (regionsIndexData.find((r) => r.id === selectedRegionScope)?.provincias || []);
      const allRows = provinces.flatMap(p => pyramidsProvinciaMap.get(p) || []);

      if (!allRows.length) return [];

      // Agregar por grupo de edad
      const ageGroupMap = {};
      allRows.forEach(row => {
        (row.age_groups || []).forEach(g => {
          if (!ageGroupMap[g.age_group]) {
            ageGroupMap[g.age_group] = { age_group: g.age_group, male: 0, female: 0 };
          }
          ageGroupMap[g.age_group].male += (g.male || 0);
          ageGroupMap[g.age_group].female += (g.female || 0);
        });
      });
      return Object.values(ageGroupMap);
    }
    return [];
  }, [pyramidMap, pyramidsProvinciaMap, selectedAdm2, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, regionsIndexData]);

  // Pirámide 2010
  const selectedAdm22010 = useMemo(() => {
    if (!selectedAdm2Norm || isProvinceSelection || isRegionSelection) return null;
    const code2010 = adm2Map2010[selectedAdm2Norm];
    return code2010 ? normalizeAdm2(code2010) : null;
  }, [selectedAdm2Norm, isProvinceSelection, isRegionSelection, adm2Map2010]);

  const pyramid2010 = useMemo(() => {
    if (selectedAdm22010) {
      return pyramid2010Map.get(selectedAdm22010) || [];
    }
    if (isProvinceSelection && selectedProvinceScope) {
      return pyramid2010ProvinciaMap.get(selectedProvinceScope) || [];
    }
    if (isRegionSelection && selectedRegionScope) {
      const isNacional = selectedRegionScope === "nacional";
      const provinces = isNacional ? provincias : (regionsIndexData.find((r) => r.id === selectedRegionScope)?.provincias || []);
      const allRows = provinces.flatMap(p => pyramid2010ProvinciaMap.get(p) || []);

      if (!allRows.length) return [];

      const ageGroupMap = {};
      allRows.forEach(row => {
        if (!ageGroupMap[row.age_group]) {
          ageGroupMap[row.age_group] = { age_group: row.age_group, male: 0, female: 0 };
        }
        ageGroupMap[row.age_group].male += (row.male || 0);
        ageGroupMap[row.age_group].female += (row.female || 0);
      });
      return Object.values(ageGroupMap);
    }
    return [];
  }, [selectedAdm22010, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, pyramid2010Map, pyramid2010ProvinciaMap, regionsIndexData]);


  // ---------------------------------------------------------------------------
  // Registros por ADM2
  // ---------------------------------------------------------------------------
  const householdsAggregation = (rows) => {
    if (!rows.length) return null;
    const hogares_total = rows.reduce((a, r) => a + (r.hogares_total || 0), 0);
    const poblacion_en_hogares = rows.reduce((a, r) => a + (r.poblacion_en_hogares || 0), 0);
    return {
      hogares_total,
      poblacion_en_hogares,
      personas_por_hogar: hogares_total > 0 ? poblacion_en_hogares / hogares_total : 0
    };
  };

  const hogaresResumen = useMemo(() => {
    if (selectedAdm2Norm) {
      const rows = hogaresResumenMap.get(selectedAdm2Norm) || [];
      return rows[0] || null;
    }
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = hogaresResumenProvinciaMap.get(selectedProvinceScope) || [];
      return rows[0] || null;
    }
    if (isRegionSelection && selectedRegionScope) {
      const isNacional = selectedRegionScope === "nacional";
      const provinces = isNacional ? provincias : (regionsIndexData.find(r => r.id === selectedRegionScope)?.provincias || []);
      const allRows = provinces.flatMap(p => hogaresResumenProvinciaMap.get(p) || []);
      return householdsAggregation(allRows);
    }
    return null;
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, hogaresResumenMap, hogaresResumenProvinciaMap, regionsIndexData]);

  const hogaresTamanoRecords = useMemo(() => {
    if (selectedAdm2Norm) {
      return hogaresTamanoMap.get(selectedAdm2Norm) || [];
    }
    if (isProvinceSelection && selectedProvinceScope) {
      return hogaresTamanoProvinciaMap.get(selectedProvinceScope) || [];
    }
    if (isRegionSelection && selectedRegionScope) {
      const isNacional = selectedRegionScope === "nacional";
      const provinces = isNacional ? provincias : (regionsIndexData.find(r => r.id === selectedRegionScope)?.provincias || []);
      const allRows = provinces.flatMap(p => hogaresTamanoProvinciaMap.get(p) || []);

      const sizeMap = {};
      allRows.forEach(r => {
        const t = r.tamano || r.miembros;
        const v = r.total || r.hogares || 0;
        if (!t) return;
        if (!sizeMap[t]) sizeMap[t] = { miembros: t, hogares: 0 };
        sizeMap[t].hogares += v;
      });
      return Object.values(sizeMap);
    }
    return [];
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, hogaresTamanoMap, hogaresTamanoProvinciaMap, regionsIndexData]);

  const poblacionUrbanaRural = useMemo(() => {
    if (selectedAdm2Norm) {
      const rows = poblacionUrbanaRuralMap.get(selectedAdm2Norm) || [];
      return rows[0] || null;
    }
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = poblacionUrbanaRuralProvinciaMap.get(selectedProvinceScope) || [];
      return rows[0] || null;
    }
    if (isRegionSelection && selectedRegionScope) {
      const isNacional = selectedRegionScope === "nacional";
      const provinces = isNacional ? provincias : (regionsIndexData.find(r => r.id === selectedRegionScope)?.provincias || []);
      const allRows = provinces.flatMap(p => poblacionUrbanaRuralProvinciaMap.get(p) || []);
      if (!allRows.length) return null;
      return {
        poblacion_total: allRows.reduce((a, r) => a + (r.poblacion_total || 0), 0),
        urbana: allRows.reduce((a, r) => a + (r.urbana || 0), 0),
        rural: allRows.reduce((a, r) => a + (r.rural || 0), 0)
      };
    }
    return null;
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, poblacionUrbanaRuralMap, poblacionUrbanaRuralProvinciaMap, regionsIndexData]);

  const educacionRecords = useMemo(() => {
    if (selectedAdm2Norm) {
      return educacionMap.get(selectedAdm2Norm) || [];
    }
    if (isProvinceSelection && selectedProvinceScope) {
      return educacionProvinciaMap.get(selectedProvinceScope) || [];
    }
    if (isRegionSelection && selectedRegionScope) {
      const isNacional = selectedRegionScope === "nacional";
      const provinces = isNacional ? provincias : (regionsIndexData.find(r => r.id === selectedRegionScope)?.provincias || []);
      return provinces.flatMap(p => educacionProvinciaMap.get(p) || []);
    }
    return [];
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, educacionMap, educacionProvinciaMap, regionsIndexData]);

  const educacionNivel = useMemo(() => {
    if (selectedAdm2Norm) {
      return educacionNivelMap.get(selectedAdm2Norm) || [];
    }
    if (isProvinceSelection && selectedProvinceScope) {
      return educacionNivelProvinciaMap.get(selectedProvinceScope) || [];
    }
    if (isRegionSelection && selectedRegionScope) {
      const isNacional = selectedRegionScope === "nacional";
      const provinces = isNacional ? provincias : (regionsIndexData.find(r => r.id === selectedRegionScope)?.provincias || []);
      const allRows = provinces.flatMap(p => educacionNivelProvinciaMap.get(p) || []);

      const nivelMap = {};
      allRows.forEach(r => {
        if (!nivelMap[r.nivel]) {
          nivelMap[r.nivel] = { nivel: r.nivel, label: r.label, total: 0, male: 0, female: 0 };
        }
        nivelMap[r.nivel].total += (r.total || 0);
        nivelMap[r.nivel].male += (r.male || 0);
        nivelMap[r.nivel].female += (r.female || 0);
      });
      return Object.values(nivelMap);
    }
    return [];
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, educacionNivelMap, educacionNivelProvinciaMap, regionsIndexData]);

  // ---------------------------------------------------------------------------
  // Mapa de TIC (datos sin procesar, el componente convierte a %)
  // ---------------------------------------------------------------------------
  const ticMap = useMemo(() => {
    const m = new Map();
    for (const r of ticData || []) {
      const key = normalizeAdm2(r.adm2_code);
      if (!key) continue;
      m.set(key, r);
    }
    return m;
  }, [ticData]);

  const tic = useMemo(() => {
    if (selectedAdm2Norm) {
      return ticMap.get(selectedAdm2Norm) || null;
    }
    if (isProvinceSelection && selectedProvinceScope) {
      const rows = ticProvinciaMap.get(selectedProvinceScope) || [];
      return rows[0] || null;
    }
    if (isRegionSelection && selectedRegionScope) {
      const isNacional = selectedRegionScope === "nacional";
      const provinces = isNacional ? provincias : (regionsIndexData.find((r) => r.id === selectedRegionScope)?.provincias || []);
      const allRows = provinces.flatMap(p => ticProvinciaMap.get(p) || []);

      if (!allRows.length) return null;

      const aggregate = (field) => {
        const total = allRows.reduce((a, r) => a + (r[field]?.total || 0), 0);
        const used = allRows.reduce((a, r) => a + (r[field]?.used || 0), 0);
        return { total, used, rate_used: total > 0 ? used / total : 0 };
      };

      return {
        internet: aggregate("internet"),
        cellular: aggregate("cellular"),
        computer: aggregate("computer")
      };
    }
    return null;
  }, [selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, ticMap, ticProvinciaMap, regionsIndexData]);

  // ---------------------------------------------------------------------------
  // Condición de Vida (municipio)
  // ---------------------------------------------------------------------------
  const condicionVidaRaw = useMemo(() => {
    if (selectedAdm2Norm) {
      return condicionVidaData.find((c) => String(c.adm2_code).padStart(5, "0") === selectedAdm2Norm) || null;
    }
    if (isProvinceSelection && selectedProvinceScope) {
      return condicionVidaProvinciaData.find(c => c.provincia === selectedProvinceScope) || null;
    }
    if (isRegionSelection && selectedRegionScope) {
      const isNacional = selectedRegionScope === "nacional";
      const provinces = isNacional ? provincias : (regionsIndexData.find((r) => r.id === selectedRegionScope)?.provincias || []);
      const allRows = provinces.map(p => condicionVidaProvinciaData.find(c => c.provincia === p)).filter(Boolean);

      if (!allRows.length) return null;

      const aggregateService = (serviceKey) => {
        const total = allRows.reduce((sum, r) => sum + (r.servicios?.[serviceKey]?.total || 0), 0);
        const categorias = {};
        allRows.forEach(r => {
          Object.entries(r.servicios?.[serviceKey]?.categorias || {}).forEach(([cat, val]) => {
            categorias[cat] = (categorias[cat] || 0) + val;
          });
        });
        return { total, categorias };
      };

      return {
        servicios: {
          servicios_sanitarios: aggregateService("servicios_sanitarios"),
          agua_uso_domestico: aggregateService("agua_uso_domestico"),
          agua_para_beber: aggregateService("agua_para_beber"),
          alumbrado: aggregateService("alumbrado"),
          combustible_cocinar: aggregateService("combustible_cocinar"),
          eliminacion_basura: aggregateService("eliminacion_basura")
        }
      };
    }
    return null;
  }, [condicionVidaData, condicionVidaProvinciaData, selectedAdm2Norm, isProvinceSelection, selectedProvinceScope, isRegionSelection, selectedRegionScope, regionsIndexData]);

  const condicionVida = useMemo(() => {
    return buildCondicionVidaParsed(condicionVidaRaw);
  }, [condicionVidaRaw]);

  // ---------------------------------------------------------------------------
  // Opciones para los selectores desplegables
  // ---------------------------------------------------------------------------
  const regionOptions = useMemo(() => {
    const list = regionsIndexData.map((reg) => ({
      value: reg.id,
      label: reg.name,
    }));
    list.unshift({
      value: "nacional",
      label: "Total de República Dominicana",
    });
    return list;
  }, [regionsIndexData]);

  const provinciaOptions = useMemo(() => {
    let list = [];
    if (regionId) {
      const reg = regionsIndexData.find((r) => r.id === regionId);
      list = reg?.provincias || [];
    } else {
      list = provincias;
    }

    const opts = list.map((p) => ({ value: p, label: p }));

    // Añadir opción "Región Completa" a nivel de Provincia si se seleccionó una región
    if (regionId) {
      const reg = regionsIndexData.find((r) => r.id === regionId);
      opts.unshift({
        value: `__all__`,
        label: `${reg?.name || regionId} (región completa)`,
      });
    }

    return opts;
  }, [provincias, regionsIndexData, regionId]);

  const municipioOptions = useMemo(() => {
    if (!provinceName) return [];

    const list = municipiosIndex.filter((m) => m.provincia === provinceName);
    const opts = list.map((m) => ({
      value: m.adm2_code,
      label: m.municipio,
    }));

    // Añadir opción "Provincia Completa" a nivel de Municipio
    opts.unshift({
      value: `__all__`,
      label: `${provinceName} (provincia completa)`,
    });

    return opts;
  }, [municipiosIndex, provinceName]);

  // ---------------------------------------------------------------------------
  // Retorno
  // ---------------------------------------------------------------------------
  return {
    loaded,

    municipiosIndex,
    provincias,
    regionsIndexData,
    municipioOptions,
    provinciaOptions,
    regionOptions,

    isProvinceSelection,
    isRegionSelection,
    selectedAdm2,
    selectedProvinceScope,
    selectedRegionScope,
    selectedMunicipio,

    indicadores,
    econ,
    pyramid,
    pyramid2010,

    educacionRecords,
    educacionNivel,

    hogaresResumen,
    hogaresTamanoRecords,
    poblacionUrbanaRural,

    nationalBasic,
    nationalEcon,

    tic,
    condicionVida,
    condicionVidaRaw,
    nationalCondicionVida,
    saludEstablecimientos: (() => {
      if (selectedAdm2Norm) return saludEstablecimientosData;
      if (isProvinceSelection && selectedProvinceScope) {
        return (saludEstablecimientosProvinciaMap.get(selectedProvinceScope) || [])[0] || null;
      }
      if (isRegionSelection && selectedRegionScope) {
        if (selectedRegionScope === "nacional") {
          const allProvsHealth = Array.from(saludEstablecimientosProvinciaMap.values()).map(v => v[0]).filter(Boolean);
          if (!allProvsHealth.length) return null;
          const allCentros = allProvsHealth.flatMap(h => h.centros || []);
          return {
            provincia: "República Dominicana",
            total: allCentros.length,
            centros: allCentros
          };
        }
        const reg = regionsIndexData.find(r => r.id === selectedRegionScope);
        const provinces = reg?.provincias || [];
        const allProvsHealth = provinces.map(p => (saludEstablecimientosProvinciaMap.get(p) || [])[0]).filter(Boolean);
        if (!allProvsHealth.length) return null;

        // Combinar todos los centros de salud
        const allCentros = allProvsHealth.flatMap(h => h.centros || []);
        return {
          provincia: `Región ${reg?.name}`,
          total: allCentros.length,
          centros: allCentros
        };
      }
      return null;
    })(),

    saludEstablecimientosProvincia: saludEstablecimientosProvinciaData,

    // Expuesto para la tabla de comparación
    hogaresResumenData,
    hogaresResumenProvinciaData,
    poblacionUrbanaRuralData,
    poblacionUrbanaRuralProvinciaData,
    nationalHogares,
    educacionData,
    educacionProvinciaData,
    saludEstablecimientosData,
    saludEstablecimientosProvinciaData,
    nationalSalud,
    nationalBasic,
    nationalEcon,
    nationalTic,
    nationalEducNivel,
    nationalEducOferta,

    condicionVidaProvinciaData,
    ticProvinciaData,
    educacionNivelProvinciaData,
    economiaEmpleoProvinciaData,
    indicadoresBasicosData,
    educacionOfertaMunicipalData,
    educacionOfertaMunicipalProvinciaData,
  };
}
