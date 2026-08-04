import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

export default function ResumenComparacionSection({
    selectedMunicipio,
    rows, // Now receiving pre-calculated rows
}) {

    // Don't render if no specific selection context or missing key data
    if (!selectedMunicipio || !rows) return null;

    const actualProvName = selectedMunicipio.provincia;
    // Mode check: if selectedMunicipio has no adm2_code, it's virtually a "Province Mode" selection
    const isProvinciaMode = !selectedMunicipio.adm2_code;

    return (
        <Card className="end-section end-section--institutional comparison-end-section no-break print-card mt-6">
            <CardHeader className="py-3 border-b border-white/10">
                <CardTitle className="end-section-title text-sm font-bold flex items-center gap-2">
                    📊 Resumen de Comparación
                </CardTitle>
                <p className="end-section-subtitle text-xs">
                    Comparativa de indicadores clave: Local vs. Provincial vs. Nacional
                </p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <div className="w-full overflow-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-white/[0.05] text-white/75">
                            <tr className="border-b border-white/10">
                                <th className="py-2 pl-4 text-left font-semibold w-1/3">Indicador</th>
                                <th className="py-2 text-right font-bold text-white bg-white/[0.07] px-2">
                                    {selectedMunicipio.municipio || "Municipio"}
                                </th>
                                {!isProvinciaMode && (
                                    <th className="py-2 text-right font-semibold text-white/75 px-2">
                                        Prov. {actualProvName}
                                    </th>
                                )}
                                <th className="py-2 text-right text-white/55 pr-4 px-2">
                                    País
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((section, idx) => (
                                <React.Fragment key={idx}>
                                    <tr className="bg-white/[0.06]">
                                        <td colSpan={isProvinciaMode ? 3 : 4} className="py-1.5 pl-4 font-semibold text-white/80 text-[11px] uppercase tracking-wider">
                                            {section.group}
                                        </td>
                                    </tr>
                                    {section.rows.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-white/[0.04] border-b border-white/10 last:border-0">
                                            <td className="py-2 pl-4 text-white/70">
                                                {row.label}
                                            </td>
                                            <td className="py-2 px-2 text-right font-medium text-white bg-white/[0.06]">
                                                {row.fmt(row.municipio)}
                                            </td>
                                            {!isProvinciaMode && (
                                                <td className="py-2 px-2 text-right text-white/75">
                                                    {row.fmt(row.provincia)}
                                                </td>
                                            )}
                                            <td className="py-2 px-2 text-right text-white/55 pr-4">
                                                {row.fmt(row.nacional)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
