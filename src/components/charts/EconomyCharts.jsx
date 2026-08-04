/**
 * EconomyCharts.jsx - Gráficos de Economía y Empleo
 *
 * Componente principal:
 * - EconomyEmployment: Economía y empleo (DEE 2024)
 *   Incluye sectores CIIU, tamaño de empresas, densidad empresarial
 */

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LabelList,
} from "recharts";
import { Briefcase } from "lucide-react";
import { COLORS } from "./PopulationCharts";

const ECON_BAR = "#b6125a";
const ECON_ACCENT = "#69143a";

const CustomBarLabel = ({ x, y, width, height, value }) => {
    if (value == null) return null;
    if (height < 22) {
        return (
            <text x={x + width / 2} y={y - 5} textAnchor="middle" fill={ECON_BAR} fontSize={11} fontWeight={600}>
                {value.toLocaleString("es-DO")}
            </text>
        );
    }
    return (
        <text x={x + width / 2} y={y + 14} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight={700}>
            {value.toLocaleString("es-DO")}
        </text>
    );
};

/* -------------------------------------------------------
   EconomyEmployment
--------------------------------------------------------- */
export function EconomyEmployment({
    econ,
    nationalEcon,
    indicators,
    nationalPopulation,
}) {
    if (!econ && !nationalEcon) {
        return (
            <Card className="end-section end-section--economic economy-end-section no-break print-card">
                <CardHeader className="border-b border-white/10">
                    <div className="flex items-center gap-3 print-flex">
                        <div className="end-section-icon h-8 w-8 text-sm">
                            <Briefcase className="h-4 w-4" />
                        </div>
                        <CardTitle className="end-section-title text-sm font-semibold">
                            Economía y empleo
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-rose-800">
                        No hay datos de economía y empleo cargados para este municipio todavía.
                    </p>
                    <p className="mt-2 text-[10px] text-rose-700">
                        Fuente: DEE 2024 y Censo 2022.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const dee = econ?.dee_2024 ?? {};
    const lm = econ?.labor_market_2022 ?? {};
    const ndee = nationalEcon?.dee_2024 ?? {};

    const rawBands = dee.employment_size_bands?.filter(
        (b) => typeof b.establishments === "number" && b.establishments > 0
    ) ?? [];

    const totalEmployees = dee.total_employees ?? null;

    const sizeBands = rawBands.map((b) => {
        const employeesShare =
            typeof b.employees_share === "number"
                ? b.employees_share
                : totalEmployees && b.employees != null
                    ? (b.employees ?? 0) / totalEmployees
                    : null;
        const employeesCount =
            b.employees != null
                ? b.employees
                : totalEmployees && employeesShare != null
                    ? totalEmployees * employeesShare
                    : null;
        return {
            ...b,
            employees_share: employeesShare,
            employees_count: employeesCount,
        };
    });

    const sectorsRaw =
        dee.sectors?.filter(
            (s) => typeof s.establishments === "number" && s.establishments > 0
        ) ?? [];

    const sectors = sectorsRaw.map((s) => {
        const avgEmployees =
            s.establishments && s.employees != null
                ? s.employees / s.establishments
                : null;
        const share =
            typeof s.employees_share === "number"
                ? s.employees_share
                : totalEmployees
                    ? (s.employees ?? 0) / totalEmployees
                    : null;
        return { ...s, avgEmployees, employees_share: share };
    });

    const muniPop = indicators?.poblacion_total ?? null;
    const muniDensity =
        muniPop && dee.total_establishments != null
            ? dee.total_establishments / (muniPop / 1000)
            : null;
    const natPop = nationalPopulation ?? null;
    const natDensity =
        natPop && ndee.total_establishments != null
            ? ndee.total_establishments / (natPop / 1000)
            : null;
    const densityDiff =
        muniDensity != null && natDensity != null
            ? muniDensity - natDensity
            : null;
    const topSpec = dee.top_specialization ?? null;

    return (
        <Card className="end-section end-section--economic economy-end-section no-break print-card">
            <CardHeader className="border-b border-white/10">
                <div className="flex items-center gap-3 print-flex">
                    <div className="end-section-icon h-8 w-8 text-sm">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <CardTitle className="end-section-title text-lg font-bold">
                        Economía y empleo{" "}
                        <span className="font-normal text-base">
                            (DEE 2024 + Censo 2022)
                        </span>
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 text-xs md:text-sm">
                {/* 指標グリッド */}
                <div className="grid gap-4 md:grid-cols-4 print-grid print-grid-2">
                    {[
                        {
                            label: "Total de establecimientos (DEE 2024)",
                            muni: dee.total_establishments,
                            nat: ndee.total_establishments,
                        },
                        {
                            label: "Empleo total (DEE 2024)",
                            muni: totalEmployees != null ? totalEmployees.toLocaleString("es-DO", { maximumFractionDigits: 2 }) : null,
                            nat: ndee.total_employees != null ? ndee.total_employees.toLocaleString("es-DO", { maximumFractionDigits: 2 }) : null,
                        },
                        {
                            label: "Tamaño promedio de establecimiento",
                            muni: dee.avg_employees_per_establishment != null
                                ? `${dee.avg_employees_per_establishment.toLocaleString("es-DO", { maximumFractionDigits: 1 })} personas`
                                : null,
                            nat: ndee.avg_employees_per_establishment != null
                                ? `${ndee.avg_employees_per_establishment.toLocaleString("es-DO", { maximumFractionDigits: 1 })} personas`
                                : null,
                        },
                        {
                            label: "Establecimientos por 1,000 hab.",
                            muni: muniDensity != null
                                ? muniDensity.toLocaleString("es-DO", { maximumFractionDigits: 1 })
                                : null,
                            nat: natDensity != null
                                ? natDensity.toLocaleString("es-DO", { maximumFractionDigits: 1 })
                                : null,
                            extra: muniPop != null ? `Población: ${muniPop.toLocaleString("es-DO")}` : null,
                            diff: densityDiff,
                        },
                    ].map((item, idx) => (
                        <div key={idx} className="no-break">
                            <div className="text-[11px] text-slate-700">{item.label}</div>
                            <div className="text-xl font-bold text-rose-900">{item.muni ?? "—"}</div>
                            {item.nat != null && (
                                <div className="mt-0.5 text-[10px] text-rose-800">
                                    RD: {item.nat}
                                    {item.diff != null && (
                                        <span className="ml-1 text-[10px]">
                                            ({item.diff >= 0 ? "+" : ""}
                                            {item.diff.toLocaleString("es-DO", { maximumFractionDigits: 1 })})
                                        </span>
                                    )}
                                </div>
                            )}
                            {item.extra && <div className="text-[10px] text-rose-800">{item.extra}</div>}
                        </div>
                    ))}
                </div>

                {/* 円グラフ & 棒グラフ */}
                <div className="grid gap-4 md:grid-cols-2 print-grid print-grid-2">
                    <div className="no-break md:h-64">
                        <div className="mb-1 text-[11px] font-semibold text-rose-900 md:text-xs">
                            Distribución del empleo por tamaño de empresa
                        </div>
                        {sizeBands.length ? (
                            <div className="flex flex-col md:flex-row gap-4 print-flex">
                                <div className="w-full md:flex-1">
                                    <div className="h-72 md:h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={sizeBands}
                                                    dataKey="employees_share"
                                                    nameKey="label"
                                                    outerRadius={80}
                                                    innerRadius={40}
                                                    paddingAngle={2}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                >
                                                    {sizeBands.map((b, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="w-full md:w-44 space-y-1 text-[10px] md:text-xs overflow-y-auto max-h-full">
                                    {sizeBands.map((b, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <span className="mt-[5px] inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <div>
                                                <div className="font-semibold text-slate-800 leading-tight">{b.label}</div>
                                                <div className="text-slate-600">
                                                    {b.employees_count != null ? b.employees_count.toLocaleString("es-DO", { maximumFractionDigits: 2 }) : "—"}
                                                    <span className="ml-1 text-[10px] text-slate-500">({(b.employees_share * 100).toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-[11px] text-rose-800">Aún no hay datos de empleo por tamaño de empresa.</p>
                        )}
                    </div>

                    <div className="h-64 md:h-[270px] no-break">
                        <div className="mb-1 text-[11px] font-semibold text-rose-900 md:text-xs">
                            Empresas por rango de empleo (DEE 2024)
                        </div>
                        {sizeBands.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sizeBands}>
                                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="establishments" fill={ECON_BAR}>
                                        <LabelList content={<CustomBarLabel />} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-[11px] text-rose-800">Aún no hay datos de establecimientos por rango de empleo.</p>
                        )}
                    </div>
                </div>

                {/* CIIU セクター */}
                <div className="space-y-2 no-break">
                    <div className="text-[11px] font-semibold text-rose-900 md:text-xs">
                        Principales secciones CIIU (DEE 2024)
                    </div>
                    {sectors.length ? (
                        <div className="grid gap-4 md:grid-cols-[1fr_1.7fr] print-grid print-grid-2">
                            <div className="h-72 md:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sectors}
                                            dataKey="employees_share"
                                            nameKey="label"
                                            outerRadius={100}
                                            innerRadius={50}
                                            paddingAngle={2}
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {sectors.map((s, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-1 text-[10px] md:text-xs">
                                {sectors.map((s, idx) => (
                                    <div key={idx} className="border-b border-rose-100 pb-1 last:border-b-0">
                                        <div className="flex items-center gap-2 mb-0.5 print-flex">
                                            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="font-semibold text-slate-800">{s.label}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700 print-flex">
                                            <span>Est.: <span className="font-semibold">{s.establishments.toLocaleString("es-DO")}</span></span>
                                            {s.employees != null && (
                                                <span>
                                                    Emp.: <span className="font-semibold">{s.employees.toLocaleString("es-DO", { maximumFractionDigits: 2 })}</span>
                                                    <span className="ml-1 text-[10px] text-slate-500">({(s.employees_share * 100).toFixed(1)}%)</span>
                                                </span>
                                            )}
                                            {s.avgEmployees != null && (
                                                <span>
                                                    Emp./est.: <span className="font-semibold">{s.avgEmployees.toLocaleString("es-DO", { maximumFractionDigits: 1 })}</span>
                                                </span>
                                            )}
                                            {s.lq != null && (
                                                <span className={`economy-lq-badge inline-flex items-center rounded-full px-1.5 py-0.5 font-semibold ${s.lq >= 1.2 ? "economy-lq-badge--high" : "economy-lq-badge--base"}`}>
                                                    LQ {s.lq.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {topSpec && topSpec.label && (
                                    <div className="mt-1 text-[10px] text-rose-800">
                                        Sector más especializado (LQ): <span className="font-semibold">{topSpec.label} {topSpec.lq != null && ` (LQ: ${topSpec.lq.toFixed(2)})`}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-[11px] text-rose-800">Aún no hay datos de estructura sectorial por secciones CIIU.</p>
                    )}
                </div>
                <p className="mt-1 text-[10px] text-rose-700">Fuente: DEE 2024 y Censo Nacional de Población y Vivienda 2022.</p>
            </CardContent>
        </Card>
    );
}
