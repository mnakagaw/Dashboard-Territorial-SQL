/**
 * TopSelectionAndMap.jsx - Panel Superior con Selector y Mapa
 * 
 * Este componente muestra la sección superior del dashboard con:
 * - Selectores de provincia y municipio (columna izquierda)
 * - Indicadores básicos de población (columna izquierda)
 * - Mapa interactivo de República Dominicana (columna derecha)
 * 
 * Diseño responsivo:
 * - Móvil: Las columnas se apilan verticalmente
 * - Desktop (lg+): Las columnas se muestran lado a lado
 * - Impresión: Layout especial de 2 columnas (ver print.css)
 * 
 * Props principales:
 * - selectedProvince: Nombre de la provincia seleccionada
 * - selectionKey: Código ADM2 del municipio seleccionado
 * - handleMapSelect: Función que se ejecuta al hacer clic en el mapa
 */

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Select } from "./ui/select";
import { RDMap } from "./RDMap";
import { PrintMapSVG } from "./PrintMapSVG";
import { BasicIndicators } from "./charts";

export default function TopSelectionAndMap({
  selectedRegion,
  setSelectedRegion,
  selectedProvince,
  setSelectedProvince,
  selectionKey,
  setSelectionKey,
  regionOptions,
  provinciaOptions,
  municipioOptions,
  municipiosIndex,
  selectedMunicipio,
  indicadores,
  nationalBasic,
  selectedAdm2,
  isProvinceSelection,
  isRegionSelection,
  selectedProvinceScope,
  selectedRegionScope,
  handleMapSelect,
}) {
  return (
    /* Web: columnas verticales → horizontales en lg. Impresión: grid de 2 columnas */
    <div className="flex flex-col lg:flex-row gap-4 print-top-grid">

      {/* Columna izquierda: Información Básica + Selector */}
      <div className="lg:flex-[0.7] flex-1 space-y-3 print-info-basic">

        {/* Selector de región/provincia/municipio (oculto en impresión) */}
        <div className="hide-on-print">
          <Card className="one-dark-panel max-w-md w-full">
            <CardHeader className="pb-2">
              <CardTitle>Ubicación Geográfica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">

              {/* Región */}
              <div className="space-y-1 text-xs md:text-sm">
                <div className="text-[11px] text-white/70 md:text-xs">
                  Región (Ley 345-22)
                </div>
                <Select
                  value={selectedRegion}
                  onChange={(val) => {
                    setSelectedRegion(val);
                    setSelectedProvince(null);
                    setSelectionKey(null);
                  }}
                  options={regionOptions}
                  placeholder="Seleccione una región"
                  ariaLabel="Región (Ley 345-22)"
                />
              </div>

              {/* Provincia */}
              <div className="space-y-1 text-xs md:text-sm">
                <div className="text-[11px] text-white/70 md:text-xs">
                  Provincia
                </div>
                <Select
                  value={selectedProvince || (isRegionSelection ? "__all__" : null)}
                  onChange={(val) => {
                    if (val === "__all__") {
                      setSelectedProvince(null);
                      setSelectionKey(null);
                    } else {
                      setSelectedProvince(val);
                      setSelectionKey(null);
                    }
                  }}
                  disabled={!selectedRegion}
                  options={provinciaOptions}
                  placeholder="Seleccione una provincia"
                  ariaLabel="Provincia"
                />
              </div>

              {/* Municipio */}
              <div className="space-y-1 text-xs md:text-sm">
                <div className="text-[11px] text-white/70 md:text-xs">
                  Municipio
                </div>
                <Select
                  value={selectionKey || (isProvinceSelection ? "__all__" : null)}
                  onChange={(val) => {
                    if (val === "__all__") {
                      setSelectionKey(null);
                    } else {
                      setSelectionKey(val);
                    }
                  }}
                  disabled={!selectedProvince}
                  options={municipioOptions}
                  placeholder="Seleccione un municipio"
                  ariaLabel="Municipio"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Información básica */}
        <div className="print-info-basic-card">
          <BasicIndicators indicators={indicadores} national={nationalBasic} />
        </div>
      </div>

      {/* Right column: Map */}
      <div className="lg:flex-[1.3] flex-1 print-map-card">
        <Card className="one-dark-panel w-full h-full">
          <CardHeader>
            <CardTitle>Mapa interactivo</CardTitle>
          </CardHeader>
          <CardContent>
            <RDMap
              selectedAdm2={selectedAdm2}
              selectedProvince={isProvinceSelection ? selectedProvinceScope : null}
              selectedRegion={isRegionSelection ? selectedRegionScope : null}
              onSelectMunicipio={handleMapSelect}
            />
            {/* Static SVG map for print mode (hidden on screen) */}
            <PrintMapSVG
              selectedAdm2={selectedAdm2}
              selectedProvince={isProvinceSelection ? selectedProvinceScope : null}
              selectedRegion={isRegionSelection ? selectedRegionScope : null}
            />
            <p className="mt-2 text-[10px] text-white/55 md:text-xs">
              Fuente: División político-administrativa y cartografía oficial.
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
