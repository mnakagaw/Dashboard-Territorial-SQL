/**
 * App.jsx - Componente Principal de la Aplicación
 *
 * Este es el componente raíz del Tablero de Diagnóstico Territorial.
 * Utiliza DashboardContext para compartir estado con todos los componentes hijos.
 *
 * Estructura del Dashboard:
 * ┌─────────────────────────────────────────────┐
 * │  Header (título, botón imprimir)            │
 * ├─────────────────────────────────────────────┤
 * │  TopSelectionAndMap (selector + mapa)       │
 * ├─────────────────────────────────────────────┤
 * │  PyramidsRow (pirámides 2022 vs 2010)       │
 * ├─────────────────────────────────────────────┤
 * │  DemografiaHogaresSection                   │
 * ├─────────────────────────────────────────────┤
 * │  CondicionVidaSection (agua, luz, TIC)      │
 * ├─────────────────────────────────────────────┤
 * │  EducacionDashboard                         │
 * ├─────────────────────────────────────────────┤
 * │  EconomyEmployment (DEE 2024)               │
 * ├─────────────────────────────────────────────┤
 * │  SaludSection                               │
 * ├─────────────────────────────────────────────┤
 * │  ResumenComparacionSection                  │
 * ├─────────────────────────────────────────────┤
 * │  ResumenNarrativoSection (IA opcional)      │
 * └─────────────────────────────────────────────┘
 */

import React from "react";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";

// Componentes de sección del dashboard
import TopSelectionAndMap from "./components/TopSelectionAndMap";
import PyramidsRow from "./components/PyramidsRow";
import DemografiaHogaresSection from "./components/DemografiaHogaresSection";
import CondicionVidaSection from "./components/CondicionVidaSection";
import EducacionDashboard from "./components/EducacionDashboard";
import SaludSection from "./components/SaludSection";
import ResumenComparacionSection from "./components/ResumenComparacionSection";
import ResumenNarrativoSection from "./components/ResumenNarrativoSection";
import { EconomyEmployment } from "./components/charts";

export default function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

function DashboardContent() {
  const ctx = useDashboard();

  const {
    selectedRegion,
    setSelectedRegion,
    selectedProvince,
    setSelectedProvince,
    selectionKey,
    setSelectionKey,
    handleMapSelect,
    handlePrint,

    municipiosIndex,
    regionsIndexData,
    municipioOptions,
    provinciaOptions,
    regionOptions,
    isProvinceSelection,
    isRegionSelection,
    selectedAdm2,
    selectedProvinceScope,
    selectedRegionScope,
    selectedMunicipio,

    pyramid,
    pyramid2010,
    indicadores,
    econ,

    hogaresResumen,
    hogaresTamanoRecords,
    poblacionUrbanaRural,

    nationalBasic,
    nationalEcon,
    tic,
    condicionVida,
    condicionVidaRaw,
    nationalCondicionVida,

    saludEstablecimientos,
    educacionRecords,
    educacionNivel,

    nationalTic,
    nationalEducNivel,
    nationalEducOferta,
    nationalHogares,
    nationalSalud,
    educacionData,
    educacionOfertaMunicipalData,
    educacionOfertaMunicipalProvinciaData,

    resumenComparacionRows,
  } = ctx;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 flex flex-col md:flex-row gap-3 md:gap-6 items-start md:items-center justify-between">
          <div className="text-center md:text-left flex-1">
            <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
              Diagnóstico Territorial
              {selectedMunicipio?.municipio
                ? ` – ${selectedMunicipio.municipio}`
                : ""}
            </h1>
            <p className="text-xs text-slate-500 md:text-sm">
              Panel de diagnóstico territorial – población, salud, economía y
              empleo, educación
            </p>
          </div>

          {/* Imprimir */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-[10px] text-slate-400 md:text-xs text-right">
              Fuente: Censo 2022, DEE 2024, Anuario Estadístico 2024.
            </div>
            <button
              onClick={handlePrint}
              className="hide-on-print text-xs md:text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              🖨️ Imprimir (exportar PDF)
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main
        id="dashboard-pdf"
        className="w-full mx-auto flex flex-col gap-4 md:gap-5 px-2 sm:px-4 py-4 md:py-6 md:max-w-6xl"
      >
        <TopSelectionAndMap
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedProvince={selectedProvince}
          setSelectedProvince={setSelectedProvince}
          selectionKey={selectionKey}
          setSelectionKey={setSelectionKey}
          regionOptions={regionOptions}
          provinciaOptions={provinciaOptions}
          municipioOptions={municipioOptions}
          municipiosIndex={municipiosIndex}
          selectedMunicipio={selectedMunicipio}
          indicadores={indicadores}
          nationalBasic={nationalBasic}
          selectedAdm2={selectedAdm2}
          isProvinceSelection={isProvinceSelection}
          isRegionSelection={isRegionSelection}
          selectedProvinceScope={selectedProvinceScope}
          selectedRegionScope={selectedRegionScope}
          handleMapSelect={handleMapSelect}
        />

        <PyramidsRow
          indicadores={indicadores}
          nationalBasic={nationalBasic}
          pyramid={pyramid}
          pyramid2010={pyramid2010}
        />

        <DemografiaHogaresSection
          hogaresResumen={hogaresResumen}
          poblacionUrbanaRural={poblacionUrbanaRural}
          hogaresTamanoRecords={hogaresTamanoRecords}
          isProvinceSelection={isProvinceSelection}
          isRegionSelection={isRegionSelection}
        />

        <CondicionVidaSection
          condicionVida={condicionVida}
          condicionVidaRaw={condicionVidaRaw}
          nationalCondicionVida={nationalCondicionVida}
          tic={tic}
        />

        <div className="page-break"></div>

        <EducacionDashboard
          records={educacionRecords}
          selectedMunicipio={selectedMunicipio}
          isProvinceSelection={isProvinceSelection}
          isRegionSelection={isRegionSelection}
          educacionNivel={educacionNivel}
          regionsIndexData={regionsIndexData}
          educacionData={educacionData}
          educacionOfertaMunicipalData={educacionOfertaMunicipalData}
          educacionOfertaMunicipalProvinciaData={educacionOfertaMunicipalProvinciaData}
          nationalEducOferta={nationalEducOferta}
        />

        <div className="page-break"></div>

        <EconomyEmployment
          econ={econ}
          nationalEcon={nationalEcon}
          indicators={indicadores}
          nationalPopulation={nationalBasic?.poblacion_total}
        />

        <div className="page-break"></div>

        <SaludSection
          selectedAdm2={selectedAdm2}
          selectedMunicipio={selectedMunicipio}
          saludEstablecimientos={saludEstablecimientos}
          isProvinceSelection={isProvinceSelection}
          isRegionSelection={isRegionSelection}
        />

        <ResumenComparacionSection
          selectedMunicipio={selectedMunicipio}
          rows={resumenComparacionRows}
        />

        <div className="page-break"></div>

        <ResumenNarrativoSection
          municipio={selectedMunicipio?.municipio}
          indicators={indicadores}
          condVida={condicionVida}
          econ={econ}
          educ={educacionRecords}
          tic={tic}
          salud={saludEstablecimientos}
          nationalBasic={nationalBasic}
          nationalCondVida={nationalCondicionVida}
          nationalEcon={nationalEcon}
          nationalTic={nationalTic}
          nationalEducNivel={nationalEducNivel}
          nationalEducOferta={nationalEducOferta}
          nationalHogares={nationalHogares}
          nationalSalud={nationalSalud}
          educNivel={educacionNivel}
          resumenComparacion={resumenComparacionRows}
        />
      </main>
    </div>
  );
}
