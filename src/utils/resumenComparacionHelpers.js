// src/utils/resumenComparacionHelpers.js
import { computeNivelPct } from "./educationHelpers";
import {
    getEducationEfficiencyOverride,
    getEducationLevelOverride,
} from "./educationEfficiencyOverrides";

// --------------------------------------------------------------------------
// Helpers (Internal)
// --------------------------------------------------------------------------

function getProvinciaRow(dataset, actualProvName) {
    if (!dataset || !actualProvName) return null;
    return dataset.find((r) => r.provincia === actualProvName) || null;
}

function getMunicipioRow(dataset, adm2) {
    if (!dataset || !adm2) return null;
    return (
        dataset.find(
            (r) => String(r.adm2_code).padStart(5, "0") === String(adm2).padStart(5, "0")
        ) || null
    );
}

function getProvinciaDemografia(indicadoresBasicosData, actualProvName) {
    if (!indicadoresBasicosData || !actualProvName) return null;
    const rows = indicadoresBasicosData.filter(
        (r) => r.provincia === actualProvName
    );
    if (!rows.length) return null;

    return {
        poblacion_total: rows.reduce((acc, r) => acc + (r.poblacion_total || 0), 0),
    };
}

// --------------------------------------------------------------------------
// Main Builder Function
// --------------------------------------------------------------------------
export function buildResumenComparacion({
    selectedMunicipio,
    indicadores, // Local Demog
    condVida, // Local CondVida (Parsed)
    econ, // Local Econ
    educ, // Local Educ (Records array)
    educNivel, // Local Educ Nivel (Map entry)
    tic, // Local Tic

    // Data Sources
    hogaresResumenData,
    poblacionUrbanaRuralData,
    educacionData,
    saludEstablecimientosData,

    // Province Data
    condicionVidaProvinciaData,
    ticProvinciaData,
    educacionNivelProvinciaData,
    economiaEmpleoProvinciaData,
    indicadoresBasicosData,
    hogaresResumenProvinciaData,
    poblacionUrbanaRuralProvinciaData,
    educacionProvinciaData,
    saludEstablecimientosProvinciaData,

    // Locally Aggregated (for Prov/Reg mode)
    hogaresResumenLocal,
    poblacionUrbanaRuralLocal,
    saludLocal,

    // National Data
    nationalBasic,
    nationalCondVida,
    nationalEcon,
    nationalTic,
    nationalEducNivel,
    nationalHogares,
    nationalSalud,
    nationalEducOferta,
    educacionOfertaMunicipalData,
}) {
    if (!selectedMunicipio) return [];

    const actualProvName = selectedMunicipio.provincia;
    const isProvinciaMode = !selectedMunicipio.adm2_code;
    const isNacionalMode = selectedMunicipio.region === "Nacional" || selectedMunicipio.municipio === "República Dominicana";
    const adm2 = selectedMunicipio.adm2_code;
    const isSingleMunicipioProvince = !!actualProvName && (
        indicadoresBasicosData?.filter((r) => r.provincia === actualProvName).length === 1
    );
    const educEfficiencyOverride = getEducationEfficiencyOverride({
        adm2Code: adm2,
        provincia: actualProvName,
    });
    const educLevelOverride = getEducationLevelOverride({
        adm2Code: adm2,
        provincia: actualProvName,
    });

    // --- 1. PREPARE ROBUST DATA SOURCES ---

    // Demographics (Province)
    const demogProv = getProvinciaDemografia(
        indicadoresBasicosData,
        actualProvName
    );

    // Province Rows
    const condVidaProv = getProvinciaRow(
        condicionVidaProvinciaData,
        actualProvName
    );
    const ticProv = getProvinciaRow(ticProvinciaData, actualProvName);
    const educNivelProv = getProvinciaRow(
        educacionNivelProvinciaData,
        actualProvName
    );
    const econProv = getProvinciaRow(economiaEmpleoProvinciaData, actualProvName);

    const hogaresProv = getProvinciaRow(
        hogaresResumenProvinciaData,
        actualProvName
    );
    const pobUrbProv = getProvinciaRow(
        poblacionUrbanaRuralProvinciaData,
        actualProvName
    );
    const educProv = getProvinciaRow(educacionProvinciaData, actualProvName);
    const saludProv = getProvinciaRow(
        saludEstablecimientosProvinciaData,
        actualProvName
    );

    // Municipal Rows
    const hogaresMun = hogaresResumenLocal || (isProvinciaMode
        ? null
        : getMunicipioRow(hogaresResumenData, adm2));
    const pobUrbMun = poblacionUrbanaRuralLocal || (isProvinciaMode
        ? null
        : getMunicipioRow(poblacionUrbanaRuralData, adm2));
    const educMun = isProvinciaMode
        ? null
        : getMunicipioRow(educacionData, adm2);

    const saludMun = (() => {
        if (saludLocal?.centros) return saludLocal;
        if (saludLocal && adm2 && saludLocal[String(adm2).padStart(5, "0")]) {
            return saludLocal[String(adm2).padStart(5, "0")];
        }
        if (isProvinciaMode) return null;
        if (!saludEstablecimientosData) return null;
        return saludEstablecimientosData[String(adm2).padStart(5, "0")] || null;
    })();

    // --- 2. GETTER FUNCTIONS ---

    // -- DEMOGRAFIA: Personas por hogar --
    const getPersonasPorHogar = (scope) => {
        if (scope === "mun") {
            if (isNacionalMode) return nationalHogares?.personas_por_hogar;
            return hogaresMun?.personas_por_hogar;
        }
        if (scope === "prov") return hogaresProv?.personas_por_hogar;
        if (scope === "nac") return nationalHogares?.personas_por_hogar;
        return null;
    };

    // -- DEMOGRAFIA: % Población Urbana --
    const getPoblacionUrbanaPct = (scope) => {
        if (scope === "mun") {
            if (isNacionalMode) return getPoblacionUrbanaPct("nac");
            if (!pobUrbMun || !pobUrbMun.poblacion_total) return null;
            const urb = pobUrbMun.urbana ?? pobUrbMun.poblacion_urbana ?? 0;
            return (urb / pobUrbMun.poblacion_total) * 100;
        }
        if (scope === "prov") {
            if (!pobUrbProv || !pobUrbProv.poblacion_total) return null;
            const urb = pobUrbProv.urbana ?? pobUrbProv.poblacion_urbana ?? 0;
            return (urb / pobUrbProv.poblacion_total) * 100;
        }
        if (scope === "nac") {
            if (
                poblacionUrbanaRuralProvinciaData &&
                poblacionUrbanaRuralProvinciaData.length
            ) {
                const total = poblacionUrbanaRuralProvinciaData.reduce(
                    (a, b) => a + (b.poblacion_total || 0),
                    0
                );
                const urb = poblacionUrbanaRuralProvinciaData.reduce(
                    (a, b) => a + (b.urbana || b.poblacion_urbana || 0),
                    0
                );
                if (total > 0) return (urb / total) * 100;
            }
            return null;
        }
        return null;
    };

    // -- CONDICION VIDA --
    const getCondVidaPct = (source, group, category, scope) => {
        if (scope === "mun" && isNacionalMode) {
            source = nationalCondVida;
        }
        if (!source) return null;
        // Parsed?
        if (source[group]?.categorias?.[category]?.pct !== undefined) {
            return source[group].categorias[category].pct;
        }
        // Raw?
        const root = source.servicios || source;
        const map = {
            sanitarios: "servicios_sanitarios",
            agua_domestico: "agua_uso_domestico",
            basura: "eliminacion_basura",
        };
        const key = map[group] || group;
        const grp = root[key];
        if (!grp) return null;

        const total = grp.total;
        const catVal = grp.categorias?.[category];
        if (typeof catVal === "number" && total > 0) {
            return (catVal / total) * 100;
        }
        return null;
    };

    // -- TIC --
    const getTicPct = (obj, scope) => {
        if (scope === "mun" && isNacionalMode) obj = nationalTic;
        return obj?.rate_used != null
            ? obj.rate_used * 100
            : obj?.internet?.rate_used != null
                ? obj.internet.rate_used * 100
                : null;
    };

    // -- EDUCACION: Abandono Secundaria --
    const getAbandono = (scope) => {
        if (scope === "mun") {
            if (isNacionalMode) return getAbandono("nac");
            if (isProvinciaMode) {
                if (educ && educ.length > 0) {
                    let sum = 0; let count = 0;
                    educ.forEach(p => {
                        const ab = p.anuario?.eficiencia?.secundario?.abandono;
                        if (typeof ab === 'number') { sum += ab; count++; }
                    });
                    if (count > 0) return sum / count;
                }
            }
            return educMun?.anuario?.eficiencia?.secundario?.abandono
                ?? educEfficiencyOverride?.secundario?.abandono
                ?? null;
        }
        if (scope === "prov") {
            return educProv?.anuario?.eficiencia?.secundario?.abandono
                ?? educEfficiencyOverride?.secundario?.abandono
                ?? null;
        }
        if (scope === "nac") {
            if (educacionData && educacionOfertaMunicipalData) {
                let totalMatricula = 0;
                let sumaPonderada = 0;

                const matriculaMap = new Map();
                educacionOfertaMunicipalData.forEach((m) => {
                    const mat = m.niveles?.secundario?.matricula || 0;
                    if (mat > 0)
                        matriculaMap.set(String(m.adm2_code).padStart(5, "0"), mat);
                });

                educacionData.forEach((m) => {
                    const adm2 = String(m.adm2_code).padStart(5, "0");
                    const abandono = m.anuario?.eficiencia?.secundario?.abandono;
                    const matricula = matriculaMap.get(adm2);

                    if (abandono != null && matricula) {
                        totalMatricula += matricula;
                        sumaPonderada += abandono * matricula;
                    }
                });

                if (totalMatricula > 0) {
                    return sumaPonderada / totalMatricula;
                }
            }
            return (
                nationalEducOferta?.eficiencia?.secundario?.abandono ??
                nationalEducOferta?.anuario?.eficiencia?.secundario?.abandono
            );
        }
        return null;
    };

    // -- EDUCACION: Nivel --
    const getEducPct = (dataObj, type, scope) => {
        if (scope === "mun" && isNacionalMode) dataObj = nationalEducNivel;
        let nivelSource = null;
        if (Array.isArray(dataObj) && dataObj[0]?.nivel) {
            nivelSource = dataObj[0].nivel;
        } else if (dataObj?.niveles) {
            nivelSource = dataObj.niveles;
        } else if (dataObj?.nivel) {
            nivelSource = dataObj.nivel;
        } else if (dataObj?.provincia) {
            nivelSource = dataObj.nivel;
        }

        if (!nivelSource && scope !== "nac") {
            nivelSource = educLevelOverride;
        }

        const computed = computeNivelPct(nivelSource);
        if (!computed) return null;
        return type === "ninguno"
            ? computed.ninguno
            : computed.secundaria_superior;
    };

    // -- ECONOMIA: Empleos / 1000 hab --
    const getEmpleosMil = (scope) => {
        let employees = 0;
        let pop = 0;

        if (scope === "mun") {
            if (isNacionalMode) return getEmpleosMil("nac");
            employees = econ?.dee_2024?.total_employees || 0;
            pop = indicadores?.poblacion_total || 0;
        } else if (scope === "prov") {
            employees = econProv?.dee_2024?.total_employees || 0;
            pop = demogProv?.poblacion_total || 0;
        } else if (scope === "nac") {
            employees = nationalEcon?.dee_2024?.total_employees || 0;
            pop = nationalBasic?.poblacion_total || 0;
        }

        if (employees > 0 && pop > 0) {
            return (employees / pop) * 1000;
        }
        return null;
    };

    // -- ECONOMIA: Micro --
    const getMicroPct = (dataObj, scope) => {
        if (scope === "mun" && isNacionalMode) dataObj = nationalEcon;
        const root = dataObj?.dee_2024 || dataObj;
        if (!root?.employment_size_bands) return null;
        const band = root.employment_size_bands.find(
            (b) => b.size_band === "micro_1_10"
        );
        if (band && root.total_establishments > 0)
            return (band.establishments / root.total_establishments) * 100;
        return null;
    };

    // -- SALUD: Centros / 10k --
    const getSalud10k = (scope) => {
        let centros = 0;
        let pop = 0;

        if (scope === "mun") {
            if (isNacionalMode) return getSalud10k("nac");
            centros = saludMun?.centros?.length || 0;
            pop = indicadores?.poblacion_total || 0;
        } else if (scope === "prov") {
            centros = saludProv?.centros?.length || 0;
            pop = demogProv?.poblacion_total || 0;
        } else if (scope === "nac") {
            centros = nationalSalud?.total_centros || 0;
            pop = nationalBasic?.poblacion_total || 0;
        }

        if (centros > 0 && pop > 0) {
            return (centros / pop) * 10000;
        }
        return null;
    };

    // --- 3. BUILD ROWS ---
    // Formatters
    const fmtNum = (v) => (v ? v.toLocaleString("es-DO") : "s/i");
    const fmtPct = (v) => (v != null ? `${v.toFixed(1)}%` : "s/i");
    const fmtDec = (v) => (v != null ? `${v.toFixed(1)}` : "s/i");
    const fmtDec2 = (v) => (v != null ? v.toFixed(2) : "s/i");

    const rows = [
        {
            group: "Demografía / Hogares",
            rows: [
                {
                    id: "poblacion_total",
                    label: "Población total (2022)",
                    unidad: "personas",
                    municipio: indicadores?.poblacion_total,
                    provincia: demogProv?.poblacion_total,
                    nacional: nationalBasic?.poblacion_total,
                    fmt: fmtNum,
                },
                {
                    id: "personas_por_hogar",
                    label: "Personas por hogar (promedio)",
                    unidad: "personas/hogar",
                    municipio: getPersonasPorHogar("mun"),
                    provincia: getPersonasPorHogar("prov"),
                    nacional: getPersonasPorHogar("nac"),
                    fmt: fmtDec,
                },
                {
                    id: "poblacion_urbana",
                    label: "% Población urbana",
                    unidad: "porcentaje",
                    municipio: getPoblacionUrbanaPct("mun"),
                    provincia: getPoblacionUrbanaPct("prov"),
                    nacional: getPoblacionUrbanaPct("nac"),
                    fmt: fmtPct,
                },
            ],
        },
        {
            group: "Servicios Básicos (Hogares)",
            rows: [
                {
                    id: "agua_acueducto",
                    label: "% Acueducto dentro vivienda",
                    unidad: "porcentaje",
                    municipio: getCondVidaPct(
                        condVida,
                        "agua_domestico",
                        "del_acueducto_dentro_de_la_vivienda",
                        "mun"
                    ),
                    provincia: getCondVidaPct(
                        condVidaProv,
                        "agua_domestico",
                        "del_acueducto_dentro_de_la_vivienda",
                        "prov"
                    ),
                    nacional: getCondVidaPct(
                        nationalCondVida,
                        "agua_domestico",
                        "del_acueducto_dentro_de_la_vivienda",
                        "nac"
                    ),
                    fmt: fmtPct,
                },
                {
                    id: "inodoro_privado",
                    label: "% Inodoro privado",
                    unidad: "porcentaje",
                    municipio: getCondVidaPct(condVida, "sanitarios", "inodoro", "mun"),
                    provincia: getCondVidaPct(condVidaProv, "sanitarios", "inodoro", "prov"),
                    nacional: getCondVidaPct(nationalCondVida, "sanitarios", "inodoro", "nac"),
                    fmt: fmtPct,
                },
                {
                    id: "basura_ayuntamiento",
                    label: "% Recogida basura ayuntamiento",
                    unidad: "porcentaje",
                    municipio: getCondVidaPct(
                        condVida,
                        "basura",
                        "la_recoge_el_ayuntamiento",
                        "mun"
                    ),
                    provincia: getCondVidaPct(
                        condVidaProv,
                        "basura",
                        "la_recoge_el_ayuntamiento",
                        "prov"
                    ),
                    nacional: getCondVidaPct(
                        nationalCondVida,
                        "basura",
                        "la_recoge_el_ayuntamiento",
                        "nac"
                    ),
                    fmt: fmtPct,
                },
            ],
        },
        {
            group: "TIC",
            rows: [
                {
                    id: "internet_hogares",
                    label: "% Acceso a Internet",
                    unidad: "porcentaje",
                    municipio: getTicPct(tic, "mun"),
                    provincia: getTicPct(ticProv, "prov"),
                    nacional: getTicPct(nationalTic, "nac"),
                    fmt: fmtPct,
                },
            ],
        },
        {
            group: "Educación (Población 3+ años)",
            rows: [
                {
                    id: "educ_ninguno",
                    label: "% Sin ningún nivel educativo",
                    unidad: "porcentaje",
                    municipio: getEducPct(educNivel, "ninguno", "mun"),
                    provincia: getEducPct(educNivelProv, "ninguno", "prov"),
                    nacional: getEducPct(nationalEducNivel, "ninguno", "nac"),
                    fmt: fmtPct,
                },
                {
                    id: "educ_secundaria_plus",
                    label: "% Secundaria o superior",
                    unidad: "porcentaje",
                    municipio: getEducPct(educNivel, "secundaria_plus", "mun"),
                    provincia: getEducPct(educNivelProv, "secundaria_plus", "prov"),
                    nacional: getEducPct(nationalEducNivel, "secundaria_plus", "nac"),
                    fmt: fmtPct,
                },
                {
                    id: "abandono_secundaria",
                    label: "% Abandono en secundaria",
                    unidad: "porcentaje",
                    municipio: getAbandono("mun"),
                    provincia: getAbandono("prov"),
                    nacional: getAbandono("nac"),
                    fmt: fmtPct,
                },
            ],
        },
        {
            group: "Economía",
            rows: [
                {
                    id: "microempresas",
                    label: "% Microempresas (del total)",
                    unidad: "porcentaje",
                    municipio: getMicroPct(econ, "mun"),
                    provincia: getMicroPct(econProv, "prov"),
                    nacional: getMicroPct(nationalEcon, "nac"),
                    fmt: fmtPct,
                },
                {
                    id: "empleos_mil_hab",
                    label: "Empleos por cada 1,000 hab.",
                    unidad: "empleos/1000hab",
                    municipio: getEmpleosMil("mun"),
                    provincia: getEmpleosMil("prov"),
                    nacional: getEmpleosMil("nac"),
                    fmt: fmtDec,
                },
            ],
        },
        {
            group: "Salud (Estimado)",
            rows: [
                {
                    id: "centros_salud_10k",
                    label: "Centros de salud por cada 10k hab.",
                    unidad: "centros/10khab",
                    municipio: getSalud10k("mun"),
                    provincia: getSalud10k("prov"),
                    nacional: getSalud10k("nac"),
                    fmt: fmtDec2,
                },
            ],
        },
    ];

    if (isSingleMunicipioProvince && !isProvinciaMode && !isNacionalMode) {
        return rows.map((group) => ({
            ...group,
            rows: group.rows.map((row) => ({
                ...row,
                municipio: row.municipio ?? row.provincia,
                provincia: row.provincia ?? row.municipio,
            })),
        }));
    }

    return rows;
}
