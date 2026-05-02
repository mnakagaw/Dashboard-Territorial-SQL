/**
 * dataHelpers.test.js - Tests para funciones utilitarias de datos
 */
import { describe, it, expect } from "vitest";
import {
    normalizeAdm2,
    normalizeName,
    sameProvinceName,
    provinceListIncludes,
    buildLongMap,
    buildProvinceMap,
    buildCondicionVidaParsed,
} from "./dataHelpers";

// ---------------------------------------------------------------------------
// normalizeAdm2
// ---------------------------------------------------------------------------
describe("normalizeAdm2", () => {
    it("returns null for falsy input", () => {
        expect(normalizeAdm2(null)).toBeNull();
        expect(normalizeAdm2(undefined)).toBeNull();
        expect(normalizeAdm2("")).toBeNull();
        expect(normalizeAdm2(0)).toBeNull();
    });

    it("pads short codes to 5 digits", () => {
        expect(normalizeAdm2("1")).toBe("00001");
        expect(normalizeAdm2("42")).toBe("00042");
        expect(normalizeAdm2("123")).toBe("00123");
        expect(normalizeAdm2("1234")).toBe("01234");
    });

    it("keeps 5-digit codes as-is", () => {
        expect(normalizeAdm2("12345")).toBe("12345");
    });

    it("converts numbers to strings", () => {
        expect(normalizeAdm2(42)).toBe("00042");
        expect(normalizeAdm2(12345)).toBe("12345");
    });

    it("trims whitespace", () => {
        expect(normalizeAdm2("  42  ")).toBe("00042");
    });
});

describe("province name normalization", () => {
    it("normalizes accents and whitespace", () => {
        expect(normalizeName(" Sánchez  Ramírez ")).toBe("sanchez ramirez");
    });

    it("compares province names without accents", () => {
        expect(sameProvinceName("Sánchez Ramírez", "Sanchez Ramírez")).toBe(true);
    });

    it("checks province lists without accents", () => {
        expect(provinceListIncludes(["Sánchez Ramírez"], "Sanchez Ramírez")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// buildLongMap
// ---------------------------------------------------------------------------
describe("buildLongMap", () => {
    it("returns empty Map for null/undefined input", () => {
        expect(buildLongMap(null).size).toBe(0);
        expect(buildLongMap(undefined).size).toBe(0);
        expect(buildLongMap([]).size).toBe(0);
    });

    it("groups rows by normalized adm2_code", () => {
        const data = [
            { adm2_code: "1", indicator: "A", value: 10 },
            { adm2_code: "1", indicator: "B", value: 20 },
            { adm2_code: "2", indicator: "A", value: 30 },
        ];
        const map = buildLongMap(data);
        expect(map.size).toBe(2);
        expect(map.get("00001")).toHaveLength(2);
        expect(map.get("00002")).toHaveLength(1);
    });

    it("skips rows without adm2_code", () => {
        const data = [
            { adm2_code: null, indicator: "A" },
            { adm2_code: "1", indicator: "B" },
        ];
        const map = buildLongMap(data);
        expect(map.size).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// buildProvinceMap
// ---------------------------------------------------------------------------
describe("buildProvinceMap", () => {
    it("returns empty Map for null/undefined input", () => {
        expect(buildProvinceMap(null).size).toBe(0);
        expect(buildProvinceMap(undefined).size).toBe(0);
        expect(buildProvinceMap([]).size).toBe(0);
    });

    it("groups rows by provincia", () => {
        const data = [
            { provincia: "Sánchez Ramírez", value: 1 },
            { provincia: "Sanchez Ramírez", value: 2 },
            { provincia: "Santiago", value: 3 },
        ];
        const map = buildProvinceMap(data);
        expect(map.size).toBe(2);
        expect(map.get("sanchez ramirez")).toHaveLength(2);
        expect(map.get("santiago")).toHaveLength(1);
    });

    it("skips rows without provincia", () => {
        const data = [
            { provincia: null, value: 1 },
            { provincia: "Santiago", value: 2 },
        ];
        const map = buildProvinceMap(data);
        expect(map.size).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// buildCondicionVidaParsed
// ---------------------------------------------------------------------------
describe("buildCondicionVidaParsed", () => {
    it("returns null for null/undefined input", () => {
        expect(buildCondicionVidaParsed(null)).toBeNull();
        expect(buildCondicionVidaParsed(undefined)).toBeNull();
        expect(buildCondicionVidaParsed({})).toBeNull();
    });

    it("parses servicios_sanitarios correctly", () => {
        const raw = {
            servicios: {
                servicios_sanitarios: {
                    total: 100,
                    categorias: { inodoro: 80, letrina: 20 },
                },
            },
        };
        const result = buildCondicionVidaParsed(raw);
        expect(result).not.toBeNull();
        expect(result.sanitarios.total).toBe(100);
        expect(result.sanitarios.categorias.inodoro.abs).toBe(80);
        expect(result.sanitarios.categorias.inodoro.pct).toBe(80);
        expect(result.sanitarios.categorias.letrina.abs).toBe(20);
        expect(result.sanitarios.categorias.letrina.pct).toBe(20);
    });

    it("handles zero total gracefully", () => {
        const raw = {
            servicios: {
                servicios_sanitarios: {
                    total: 0,
                    categorias: { inodoro: 0 },
                },
            },
        };
        const result = buildCondicionVidaParsed(raw);
        expect(result.sanitarios.categorias.inodoro.pct).toBe(0);
    });

    it("parses all service types", () => {
        const raw = {
            servicios: {
                servicios_sanitarios: { total: 10, categorias: { a: 10 } },
                agua_uso_domestico: { total: 20, categorias: { b: 20 } },
                agua_para_beber: { total: 30, categorias: { c: 30 } },
                alumbrado: { total: 40, categorias: { d: 40 } },
                combustible_cocinar: { total: 50, categorias: { e: 50 } },
                eliminacion_basura: { total: 60, categorias: { f: 60 } },
            },
        };
        const result = buildCondicionVidaParsed(raw);
        expect(result.sanitarios).toBeDefined();
        expect(result.agua_domestico).toBeDefined();
        expect(result.agua_beber).toBeDefined();
        expect(result.alumbrado).toBeDefined();
        expect(result.combustible).toBeDefined();
        expect(result.basura).toBeDefined();
    });
});
