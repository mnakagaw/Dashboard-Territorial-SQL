// src/components/CondicionVidaSection.jsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Leaf } from "lucide-react";

export default function CondicionVidaSection({
  condicionVida,
  condicionVidaRaw,
  nationalCondicionVida,
  tic,
}) {
  if (!condicionVida) return null;

  const keyMap = {
    sanitarios: "sanitarios",
    agua_domestico: "agua_domestico",
    agua_beber: "agua_beber",
    alumbrado: "alumbrado",
    combustible: "combustible",
    basura: "basura",
  };

  const labels = {
    inodoro: "Inodoro",
    letrina: "Letrina",
    no_tiene: "No tiene",
    sin_informacion: "Sin información",
    del_acueducto_dentro_de_la_vivienda: "Acueducto dentro",
    del_acueducto_en_el_patio_de_la_vivienda: "Acueducto patio",
    de_una_llave_publica: "Llave pública",
    de_una_llave_de_otra_vivienda: "Llave de otra viv.",
    de_un_tubo_de_la_calle: "Tubo de calle",
    manantial_rio_arroyo: "Manantial / río",
    pozo_tubular: "Pozo tubular",
    pozo_cavado: "Pozo cavado",
    lluvia: "Agua lluvia",
    camion_tanque: "Camión tanque",
    camioncito_procesada: "Camioncito proc.",
    botellones: "Botellones",
    otro: "Otro",
    energia_eletrica_del_tendido_publico: "Electric. pública",
    lampara_de_gas_propano: "Lámpara propano",
    lampara_de_gas_kerosene: "Lámpara kerosene",
    energia_electrica_de_planta_propia: "Planta propia",
    paneles_solares: "Paneles solares",
    gas_propano: "Gas propano",
    carbon: "Carbón",
    lena: "Leña",
    electricidad: "Electricidad",
    no_cocina: "No cocina",
    la_recoge_el_ayuntamiento: "Recolección municipal",
    la_recoge_una_empresa_privada: "Empresa privada",
    la_queman: "La queman",
    la_tiran_en_el_patio_o_sola: "La tiran en patio",
    la_tiran_en_un_vertedero: "Vertedero",
    la_tiran_en_un_rio_o_canada: "Río / cañada",
    otros: "Otros",
  };

  const formatLabel = (key) => labels[key] || key.replace(/_/g, " ");

  const getNationalPct = (municipioKey, catKey) => {
    if (!nationalCondicionVida) return null;
    const nationalKey = keyMap[municipioKey];
    if (!nationalKey) return null;

    const block = nationalCondicionVida[nationalKey];
    if (!block?.categorias) return null;

    return block.categorias?.[catKey]?.pct ?? null;
  };

  const renderCategorias = (municipioKey, categorias) =>
    Object.entries(categorias).map(([catKey, obj]) => {
      const rdPct = getNationalPct(municipioKey, catKey);

      return (
        <div
          key={catKey}
          className="flex justify-between print-flex border-b border-emerald-50 py-0.5 text-xs"
        >
          <span>{formatLabel(catKey)}:</span>
          <span className="text-right">
            {obj.abs.toLocaleString("es-DO")} ({obj.pct.toFixed(1)}%)
            {rdPct !== null && (
              <span className="ml-2 text-[10px] text-emerald-700">
                RD: {rdPct.toFixed(1)}%
              </span>
            )}
          </span>
        </div>
      );
    });

  const renderCard = (title, keyName) => {
    const block = condicionVida[keyName];
    if (!block) return null;

    return (
      <Card className="border-emerald-100 bg-white shadow-sm no-break print-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-emerald-900">
            {title}
          </CardTitle>
          <div className="text-[10px] text-emerald-700">
            Total: {block.total.toLocaleString("es-DO")} (100%)
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-0.5">
          {renderCategorias(keyName, block.categorias)}
        </CardContent>
      </Card>
    );
  };

  const renderTIC = () => {
    if (!tic) {
      return (
        <Card className="border-emerald-100 bg-white shadow-sm no-break print-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-900">
              TIC – acceso personal (5+ años)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[10px] text-slate-500">
            No hay datos TIC.
          </CardContent>
        </Card>
      );
    }

    const pct = (obj) =>
      obj?.rate_used != null ? (obj.rate_used * 100).toFixed(1) : "–";

    return (
      <Card className="border-emerald-100 bg-white shadow-sm no-break print-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-emerald-900">
            TIC – acceso personal (5+ años)
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0 text-xs space-y-1">
          <div className="flex justify-between print-flex">
            <span>Acceso a Internet:</span> <span>{pct(tic.internet)}%</span>
          </div>
          <div className="flex justify-between print-flex">
            <span>Smartphone:</span> <span>{pct(tic.cellular)}%</span>
          </div>
          <div className="flex justify-between print-flex">
            <span>Computadora:</span> <span>{pct(tic.computer)}%</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="mt-4 print-grid no-break">
      <Card className="border-emerald-100 bg-emerald-50/60 no-break print-card">
        <CardHeader className="border-b border-emerald-100 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-emerald-600">
            <Leaf className="h-5 w-5" />
            Condición de vida / Servicios básicos
          </CardTitle>
          <p className="text-[10px] text-emerald-800">Hogares (Censo 2022)</p>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">

          {/* 上段 3 カード */}
          <div className="grid md:grid-cols-3 gap-3 print-grid print-grid-3">
            {renderCard("Servicios sanitarios", "sanitarios")}
            {renderCard("Agua para uso doméstico", "agua_domestico")}
            {renderCard("Agua para beber", "agua_beber")}
          </div>

          {/* 下段 3 + TIC */}
          {/* 下段 3 + TIC */}
          <div className="grid md:grid-cols-4 gap-3 condicion-print-grid-4">
            {renderCard("Alumbrado principal", "alumbrado")}
            {renderCard("Combustible para cocinar", "combustible")}
            {renderCard("Eliminación de basura", "basura")}
            {renderTIC()}
          </div>

        </CardContent>
      </Card>
    </section>
  );
}
