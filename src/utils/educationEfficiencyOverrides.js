const DISTRITO_NACIONAL_EFFICIENCY = {
    inicial: { abandono: 1.8, promocion: 98.2, reprobacion: 0.0 },
    primario: { abandono: 1.8, promocion: 95.7, reprobacion: 2.5 },
    secundario: { abandono: 3.5, promocion: 92.7, reprobacion: 3.8 },
};

const DISTRITO_NACIONAL_INFRASTRUCTURE = {
    aulas_por_plantel: 16.87,
    secciones_por_centro: 13.37,
    secciones_por_aula: 1.43,
    docentes_por_centro: 20.9,
    alumnos_por_centro: 287.7,
    alumnos_por_aula: 40.63,
    alumnos_por_seccion: 21.57,
    alumnos_por_docente: 19.97,
};

const DISTRITO_NACIONAL_LEVEL = {
    ninguno: {
        total: 51998,
        urbano_h: 25951,
        urbano_m: 26047,
        rural_h: 0,
        rural_m: 0,
    },
    preprimaria: {
        total: 48919,
        urbano_h: 24161,
        urbano_m: 24758,
        rural_h: 0,
        rural_m: 0,
    },
    primaria: {
        total: 263370,
        urbano_h: 133506,
        urbano_m: 129864,
        rural_h: 0,
        rural_m: 0,
    },
    secundaria: {
        total: 288437,
        urbano_h: 143670,
        urbano_m: 144767,
        rural_h: 0,
        rural_m: 0,
    },
    superior: {
        total: 334537,
        urbano_h: 141722,
        urbano_m: 192815,
        rural_h: 0,
        rural_m: 0,
    },
};

const DISTRITO_NACIONAL_TIC_PERSONAL_TOTAL = 956569;
const DISTRITO_NACIONAL_TIC_PERSONAL = {
    internet: {
        total: DISTRITO_NACIONAL_TIC_PERSONAL_TOTAL,
        used: 824719,
        rate_used: 824719 / DISTRITO_NACIONAL_TIC_PERSONAL_TOTAL,
    },
    cellular: {
        total: DISTRITO_NACIONAL_TIC_PERSONAL_TOTAL,
        used: 801016,
        rate_used: 801016 / DISTRITO_NACIONAL_TIC_PERSONAL_TOTAL,
    },
    computer: {
        total: DISTRITO_NACIONAL_TIC_PERSONAL_TOTAL,
        used: 256383 + 388233,
        rate_used: (256383 + 388233) / DISTRITO_NACIONAL_TIC_PERSONAL_TOTAL,
    },
};

const DISTRITO_NACIONAL_HOUSEHOLD_INTERNET = 242517 / 365548;

function isDistritoNacionalScope({ adm2Code, provincia }) {
    return String(adm2Code || "").padStart(5, "0") === "01001" || provincia === "Distrito Nacional";
}

export function getEducationEfficiencyOverride({ adm2Code, provincia }) {
    if (isDistritoNacionalScope({ adm2Code, provincia })) {
        return DISTRITO_NACIONAL_EFFICIENCY;
    }
    return null;
}

export function getEducationInfrastructureOverride({ adm2Code, provincia }) {
    if (isDistritoNacionalScope({ adm2Code, provincia })) {
        return DISTRITO_NACIONAL_INFRASTRUCTURE;
    }
    return null;
}

export function getEducationLevelOverride({ adm2Code, provincia }) {
    if (isDistritoNacionalScope({ adm2Code, provincia })) {
        return DISTRITO_NACIONAL_LEVEL;
    }
    return null;
}

export function getTicPersonalOverride({ adm2Code, provincia }) {
    if (isDistritoNacionalScope({ adm2Code, provincia })) {
        return DISTRITO_NACIONAL_TIC_PERSONAL;
    }
    return null;
}

export function getHouseholdInternetOverride({ adm2Code, provincia }) {
    if (isDistritoNacionalScope({ adm2Code, provincia })) {
        return DISTRITO_NACIONAL_HOUSEHOLD_INTERNET;
    }
    return null;
}

export function mergeEducationEfficiency(base, override) {
    if (!override) return base;

    return {
        inicial: {
            ...base?.inicial,
            ...override.inicial,
        },
        primario: {
            ...base?.primario,
            ...override.primario,
        },
        secundario: {
            ...base?.secundario,
            ...override.secundario,
        },
    };
}

export function mergeEducationInfrastructure(base, override) {
    if (!override) return base;
    return {
        ...base,
        ...override,
    };
}

export function mergeEducationLevel(base, override) {
    if (!override) return base;
    return {
        ...base,
        ...override,
    };
}

export function mergeTicPersonal(base, override) {
    if (!override) return base;
    return {
        ...base,
        internet: {
            ...base?.internet,
            ...override.internet,
        },
        cellular: {
            ...base?.cellular,
            ...override.cellular,
        },
        computer: {
            ...base?.computer,
            ...override.computer,
        },
    };
}
