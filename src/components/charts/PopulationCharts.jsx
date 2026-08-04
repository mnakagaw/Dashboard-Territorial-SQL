/**
 * PopulationCharts.jsx - Gráficos de Población
 *
 * Componentes de visualización relacionados con datos demográficos:
 * - BasicIndicators: Tarjeta de información básica del municipio
 * - PopulationPyramid: Pirámide de población 2022
 * - PopulationPyramid2010: Pirámide de población 2010
 * - GenderRatio: Distribución por sexo (pie chart)
 * - UrbanRuralCard: Población urbana vs rural
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
} from "recharts";
import { Users, BarChartBig, Building2 } from "lucide-react";

export const BLUE = "#3b6f9c";
export const RED = "#b6125a";
export const COLORS = ["#50102c", "#b6125a", "#d5a62a", "#217d7a", "#3b6f9c", "#7c6fb2"];

function getSymmetricAxisMax(records) {
    const maximum = Math.max(
        0,
        ...records.flatMap((record) => [Math.abs(Number(record.male) || 0), Math.abs(Number(record.female) || 0)])
    );
    if (maximum === 0) return 1;

    const magnitude = 10 ** Math.floor(Math.log10(maximum));
    const normalized = maximum / magnitude;
    const niceStep = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return niceStep * magnitude;
}

function formatPyramidTooltip(value, name) {
    return [Math.abs(Number(value) || 0).toLocaleString("es-DO"), name];
}

function formatPyramidAxisTick(value) {
    const absolute = Math.abs(Number(value) || 0);
    if (absolute >= 1_000_000) {
        return `${(absolute / 1_000_000).toLocaleString("es-DO", { maximumFractionDigits: 1 })} M`;
    }
    if (absolute >= 1_000) {
        return `${(absolute / 1_000).toLocaleString("es-DO", { maximumFractionDigits: 0 })} mil`;
    }
    return absolute.toLocaleString("es-DO");
}

function formatPyramidAgeLabel(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s*-\s*/g, "–")
        .replace(/\s+/g, "\u00a0");
}

/* -------------------------------------------------------
   BasicIndicators
--------------------------------------------------------- */
export function BasicIndicators({ indicators, national }) {
    if (!indicators) return null;
    const { poblacion_total, poblacion_2010, poblacion_hombres, poblacion_mujeres, municipio, provincia } = indicators;
    const natTotal = national?.poblacion_total ?? null;
    const natTotal2010 = national?.poblacion_total_2010 ?? null;
    const natH = national?.poblacion_hombres ?? null;
    const natM = national?.poblacion_mujeres ?? null;

    let variacion = null;
    if (poblacion_total != null && poblacion_2010 != null) {
        variacion = ((poblacion_total - poblacion_2010) / poblacion_2010) * 100;
    }
    const variacionColor = variacion == null ? "text-slate-400" : variacion >= 0 ? "text-green-600" : "text-red-600";
    const variacionText = variacion == null ? "" : `${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%`;

    let rdVariacion = null;
    if (natTotal != null && natTotal2010 != null) {
        rdVariacion = ((natTotal - natTotal2010) / natTotal2010) * 100;
    }
    const rdVariacionColor = rdVariacion == null ? "text-slate-400" : rdVariacion >= 0 ? "text-green-600" : "text-red-600";
    const rdVariacionText = rdVariacion == null ? "" : `${rdVariacion >= 0 ? "+" : ""}${rdVariacion.toFixed(1)}%`;

    return (
        <Card className="border-sky-100 bg-sky-50/70 print-basic-indicators">
            <CardHeader className="border-b border-sky-100/70">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">
                        <Users className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-bold text-blue-600">Información básica</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs md:text-sm">
                <div className="font-semibold text-slate-800">{municipio}{provincia ? `, ${provincia}` : ""}</div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="text-[11px] text-slate-500 md:text-xs">Población total</div>
                        <div className="flex items-center gap-2">
                            <div className="text-base font-semibold md:text-lg">{(poblacion_total ?? 0).toLocaleString("es-DO")}</div>
                            {variacion != null && <div className={`text-xs font-semibold ${variacionColor}`}>{variacionText}</div>}
                        </div>
                        {poblacion_2010 != null && <div className="text-[11px] text-slate-500">2010: {poblacion_2010.toLocaleString("es-DO")}</div>}
                        {natTotal != null && (
                            <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-2">
                                RD (2022): {natTotal.toLocaleString("es-DO")}
                                {rdVariacion != null && <span className={`text-[10px] font-semibold ${rdVariacionColor}`}>{rdVariacionText}</span>}
                            </div>
                        )}
                        {natTotal2010 != null && <div className="text-[11px] text-slate-500">RD 2010: {natTotal2010.toLocaleString("es-DO")}</div>}
                    </div>
                    <div>
                        <div className="text-[11px] text-slate-500 md:text-xs">Hombres / Mujeres</div>
                        <div className="text-sm">H: {(poblacion_hombres ?? 0).toLocaleString("es-DO")} · M: {(poblacion_mujeres ?? 0).toLocaleString("es-DO")}</div>
                        {(natH != null && natM != null) && (
                            <div className="mt-0.5 text-[10px] text-slate-500">RD H: {natH.toLocaleString("es-DO")} · RD M: {natM.toLocaleString("es-DO")}</div>
                        )}
                    </div>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Fuente: Censo Nacional de Población y Vivienda 2022.</p>
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------
   PopulationPyramid
--------------------------------------------------------- */
export function PopulationPyramid({ pyramid }) {
    if (!pyramid || !pyramid.length) return null;
    const ordered = [...pyramid].reverse();
    const data = ordered.map((g) => ({ age_group: formatPyramidAgeLabel(g.age_group), male: -(g.male ?? 0), female: g.female ?? 0 }));
    const axisMax = getSymmetricAxisMax(data);

    return (
        <Card className="border-sky-100 bg-sky-50/70 print-pyramid print-card flex flex-col">
            <CardHeader className="border-b border-sky-100/70">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600"><BarChartBig className="h-5 w-5" /></div>
                    <CardTitle className="text-lg font-bold text-blue-600">Pirámide de población 2022</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="h-64 md:h-72 flex flex-col justify-between print-graph-content">
                <div className="w-full h-full print-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" stackOffset="sign" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                            <XAxis
                                type="number"
                                domain={[-axisMax, axisMax]}
                                tickCount={5}
                                tick={{ fontSize: 10 }}
                                tickFormatter={formatPyramidAxisTick}
                            />
                            <YAxis dataKey="age_group" type="category" width={72} interval={0} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={formatPyramidTooltip} />
                            <Bar dataKey="male" stackId="stack" fill={BLUE} name="Hombres" />
                            <Bar dataKey="female" stackId="stack" fill={RED} name="Mujeres" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-slate-400 mt-0 pt-1 leading-tight mb-0">Fuente: Censo 2022 (Cuadro 2, Vol III).</p>
            </CardContent>
        </Card>
    );
}

export function PopulationPyramid2010({ pyramid }) {
    if (!pyramid || !pyramid.length) return null;
    const ordered = [...pyramid].reverse();
    const data = ordered.map((g) => ({
        ...g,
        age_group: formatPyramidAgeLabel(g.age_group),
        male: -Math.abs(g.male || 0),
        female: Math.abs(g.female || 0),
    }));
    const axisMax = getSymmetricAxisMax(data);

    return (
        <Card className="border-slate-200 bg-slate-50/80 print-pyramid print-card flex flex-col">
            <CardHeader className="border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-700"><BarChartBig className="h-4 w-4" /></div>
                    <CardTitle className="text-sm font-semibold text-slate-900">Pirámide de población 2010</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="h-64 md:h-72 flex flex-col justify-between print-graph-content">
                <div className="w-full h-full print-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" stackOffset="sign" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                            <XAxis
                                type="number"
                                domain={[-axisMax, axisMax]}
                                tickCount={5}
                                tick={{ fontSize: 10 }}
                                tickFormatter={formatPyramidAxisTick}
                            />
                            <YAxis dataKey="age_group" type="category" width={72} interval={0} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={formatPyramidTooltip} />
                            <Bar dataKey="male" stackId="stack" fill="#8f7380" name="Hombres" />
                            <Bar dataKey="female" stackId="stack" fill="#c9b4bd" name="Mujeres" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-slate-400 mt-0 pt-1 leading-tight mb-0">Fuente: Censo 2010.</p>
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------
   GenderRatio
--------------------------------------------------------- */
export function GenderRatio({ indicators, national }) {
    if (!indicators) return null;
    const hombres = indicators.poblacion_hombres ?? 0;
    const mujeres = indicators.poblacion_mujeres ?? 0;
    const total = hombres + mujeres || 1;
    const data = [{ name: "Hombres", value: hombres }, { name: "Mujeres", value: mujeres }];
    const natH = national?.poblacion_hombres ?? 0;
    const natM = national?.poblacion_mujeres ?? 0;
    const natTotal = natH + natM || 1;

    return (
        <Card className="border-sky-100 bg-sky-50/70 print-gender-ratio print-card">
            <CardHeader className="border-b border-sky-100/70">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600"><Users className="h-5 w-5" /></div>
                    <CardTitle className="text-lg font-bold text-blue-600">Composición por sexo 2022</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex h-auto flex-col justify-between gap-4 md:h-72 md:gap-2 print-gender-content">
                <div className="flex flex-col md:flex-row flex-1 items-center justify-between gap-4 gender-inner-content">
                    <div className="h-64 w-full md:h-full md:w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} dataKey="value" nameKey="name" outerRadius={70} innerRadius={35} paddingAngle={3} startAngle={90} endAngle={-270}>
                                    <Cell key="male" fill={BLUE} />
                                    <Cell key="female" fill={RED} />
                                </Pie>
                                <Tooltip formatter={(val, name) => [`${((val / total) * 100).toFixed(1)}%`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 space-y-1 text-xs md:text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600">Hombres</span>
                            <span className="font-semibold">{((hombres / total) * 100 || 0).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600">Mujeres</span>
                            <span className="font-semibold">{((mujeres / total) * 100 || 0).toFixed(1)}%</span>
                        </div>
                        <div className="mt-2 border-t border-slate-100 pt-1 text-[10px] text-slate-500">
                            RD H: {((natH / natTotal) * 100 || 0).toFixed(1)}% · RD M: {((natM / natTotal) * 100 || 0).toFixed(1)}%
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-0 pt-1 leading-tight mb-0">Fuente: Censo 2022.</p>
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------
   UrbanRuralCard
--------------------------------------------------------- */
export function UrbanRuralCard({ poblacion }) {
    if (!poblacion) return null;
    const { urbana = 0, rural = 0, total } = poblacion;
    const t = total ?? (urbana + rural);
    const uPct = (poblacion.urbana_pct ?? (urbana * 100) / t) || 0;
    const rPct = (poblacion.rural_pct ?? (rural * 100) / t) || 0;

    return (
        <Card className="border-sky-100 bg-sky-50/70 print-card print-stat-card">
            <CardHeader className="border-b border-sky-100/70">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700"><Building2 className="h-4 w-4" /></div>
                    <CardTitle className="text-sm font-semibold text-sky-900">Población urbana / rural</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs md:text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-slate-600">Urbana</span>
                    <span className="font-semibold">{urbana.toLocaleString("es-DO")} <span className="ml-1 text-[11px] text-slate-500">({uPct.toFixed(1)}%)</span></span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-600">Rural</span>
                    <span className="font-semibold">{rural.toLocaleString("es-DO")} <span className="ml-1 text-[11px] text-slate-500">({rPct.toFixed(1)}%)</span></span>
                </div>
            </CardContent>
        </Card>
    );
}
