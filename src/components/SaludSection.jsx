// src/components/SaludSection.jsx
import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Stethoscope } from "lucide-react";

/**
 * SaludSection.jsx - Sección de Salud
 * 
 * Muestra los establecimientos de salud del municipio por tipo.
 * 
 * Props:
 *  - selectedAdm2: Código ADM2 del municipio (ej: "01001")
 *  - selectedMunicipio: Objeto municipio de useMunicipioData
 *  - saludEstablecimientos: Datos procesados desde salud_establecimientos.json
 *  - isProvinceSelection: true si se seleccionó una provincia completa
 */
export default function SaludSection({
  selectedAdm2,
  selectedMunicipio,
  saludEstablecimientos,
  isProvinceSelection,
  isRegionSelection,
}) {
  const centros = useMemo(() => {
    return saludEstablecimientos?.centros || [];
  }, [saludEstablecimientos]);

  const resumenPorTipo = useMemo(() => {
    const acc = {};
    for (const c of centros) {
      const tipo = (c.tipo_centro || "SIN CLASIFICAR").toUpperCase();
      acc[tipo] = (acc[tipo] || 0) + 1;
    }
    return acc;
  }, [centros]);

  const total = centros.length;
  const tituloMunicipio =
    selectedMunicipio?.municipio || "este municipio";

  // Orden de tipos de establecimientos a mostrar
  const orderedTipos = [
    "CENTRO DIAGNOSTICO",
    "HOSPITAL INFANTIL",
    "HOSPITAL MEDIANA COMPLEJIDAD",
    "HOSPITAL ALTA COMPLEJIDAD",
    "CONSULTORIO",
    "CENTRO DE PRIMER NIVEL",
    "CENTRO DE ZONA",
    "HOSPITAL MATERNO",
    "HOSPITAL MATERNO-INFANTIL",
    "HOSPITAL TRAUMATOLÓGICO",
    "CENTRO AMBULATORIO",
    "CENTRO COMUNITARIO",
  ];

  // Dividir en 2 columnas
  const mid = Math.ceil(orderedTipos.length / 2);
  const leftTipos = orderedTipos.slice(0, mid);
  const rightTipos = orderedTipos.slice(mid);

  const getCount = (tipo) => resumenPorTipo[tipo] || 0;

  return (
    <section id="salud-tipos-centro" className="w-full">
      <Card className="w-full rounded-3xl bg-amber-50 border-amber-100">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-amber-900">
              <Stethoscope className="h-5 w-5" />
              Salud – Establecimientos de Salud (tipo de centro)
            </CardTitle>
            <div className="text-xs md:text-sm text-slate-700">
              Total en {isRegionSelection && selectedMunicipio?.municipio === "República Dominicana" ? "país" : isRegionSelection ? "región" : isProvinceSelection ? "provincia" : "municipio"}:{" "}
              <span className="font-semibold">
                {tituloMunicipio} ({total})
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Tabla izquierda */}
            <table className="w-full text-xs md:text-sm">
              <tbody>
                {leftTipos.map((tipo) => (
                  <tr key={tipo} className="border-b last:border-0">
                    <td className="py-1 pr-2">
                      {tipo
                        .toLowerCase()
                        .replace(/\b\w/g, (m) => m.toUpperCase())}
                    </td>
                    <td className="py-1 pl-2 text-right font-mono">
                      {getCount(tipo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Tabla derecha */}
            <table className="w-full text-xs md:text-sm">
              <tbody>
                {rightTipos.map((tipo) => (
                  <tr key={tipo} className="border-b last:border-0">
                    <td className="py-1 pr-2">
                      {tipo
                        .toLowerCase()
                        .replace(/\b\w/g, (m) => m.toUpperCase())}
                    </td>
                    <td className="py-1 pl-2 text-right font-mono">
                      {getCount(tipo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-[10px] md:text-xs text-orange-700">
            Fuente: Establecimientos de Salud, 1878–2025 SNS
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
