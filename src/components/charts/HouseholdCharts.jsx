/**
 * HouseholdCharts.jsx - Gráficos de Hogares
 *
 * Componentes de visualización relacionados con hogares:
 * - HouseholdsTotalCard: Total de hogares
 * - PersonsPerHouseholdCard: Personas por hogar
 * - HouseholdSizeChart: Tamaño de hogares (1-10+)
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
    LabelList,
} from "recharts";
import { Home, Users, BarChart3 } from "lucide-react";

/* -------------------------------------------------------
   HouseholdsTotalCard
--------------------------------------------------------- */
export function HouseholdsTotalCard({ resumen }) {
    if (!resumen) return null;
    const hogares = resumen.hogares_total ?? resumen.hogares ?? null;
    return (
        <Card className="border-sky-100 bg-sky-50/70 print-card print-stat-card">
            <CardHeader className="border-b border-sky-100/70">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700"><Home className="h-4 w-4" /></div>
                    <CardTitle className="text-sm font-semibold text-sky-900">Hogares totales</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="text-xs md:text-sm">
                <div className="text-[11px] text-slate-500 md:text-xs">Hogares</div>
                <div className="text-base font-semibold md:text-lg">{hogares != null ? hogares.toLocaleString("es-DO") : "—"}</div>
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------
   PersonsPerHouseholdCard
--------------------------------------------------------- */
export function PersonsPerHouseholdCard({ resumen }) {
    if (!resumen) return null;
    const pph = resumen.personas_por_hogar ?? null;
    return (
        <Card className="border-sky-100 bg-sky-50/70 print-card print-stat-card">
            <CardHeader className="border-b border-sky-100/70">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700"><Users className="h-4 w-4" /></div>
                    <CardTitle className="text-sm font-semibold text-sky-900">Personas por hogar</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="text-xs md:text-sm">
                <div className="text-[11px] text-slate-500 md:text-xs">Promedio</div>
                <div className="text-base font-semibold md:text-lg">{pph != null ? pph.toLocaleString("es-DO", { maximumFractionDigits: 2 }) : "—"}</div>
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------
   HouseholdSizeChart
--------------------------------------------------------- */
export function HouseholdSizeChart({ records }) {
    if (!records || !records.length) return null;
    const hasTotalZone = records.some((r) => String(r.zona || "").toLowerCase().includes("total"));
    const base = hasTotalZone ? records.filter((r) => String(r.zona || "").toLowerCase().includes("total")) : records;

    const grouped = {};
    for (const row of base) {
        const label = String(row.miembros || "").trim();
        if (!label) continue;
        const val = Number(row.hogares ?? 0);
        if (!grouped[label]) grouped[label] = 0;
        grouped[label] += isNaN(val) ? 0 : val;
    }
    const data = Object.entries(grouped)
        .map(([label, hogares]) => {
            const m = label.match(/\d+/);
            return { label, hogares, order: m ? parseInt(m[0], 10) : 999 };
        })
        .sort((a, b) => a.order - b.order);
    const BAR_COLOR = "#861547";

    return (
        <Card className="border-sky-100 bg-sky-50/70 h-full flex flex-col">
            <CardHeader className="border-b border-sky-100/70">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700"><BarChart3 className="h-4 w-4" /></div>
                    <CardTitle className="text-sm font-semibold text-sky-900">Tamaño de los hogares (1–10+)</CardTitle>
                </div>
            </CardHeader>
            {/* Contenido del gráfico para impresión */}
            <CardContent className="h-64 md:h-72 print-graph-content">
                <div className="w-full h-full print-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 28, right: 14, bottom: 8, left: 22 }}
                        >
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
                            <YAxis
                                width={72}
                                tick={{ fontSize: 10 }}
                                tickMargin={8}
                                allowDecimals={false}
                                tickFormatter={(v) => Number(v).toLocaleString("es-DO")}
                            />
                            <Tooltip formatter={(value) => [Number(value).toLocaleString("es-DO"), "Hogares"]} />
                            <Bar dataKey="hogares" fill={BAR_COLOR} radius={[4, 4, 0, 0]}>
                                <LabelList
                                    dataKey="hogares"
                                    position="top"
                                    offset={8}
                                    formatter={(v) => Number(v).toLocaleString("es-DO")}
                                    style={{ fontSize: 10 }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
