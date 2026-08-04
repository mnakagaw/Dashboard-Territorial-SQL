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
 * └─────────────────────────────────────────────┘
 */

import React from "react";
import { Printer } from "lucide-react";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";

// Componentes de sección del dashboard
import TopSelectionAndMap from "./components/TopSelectionAndMap";
import PyramidsRow from "./components/PyramidsRow";
import DemografiaHogaresSection from "./components/DemografiaHogaresSection";
import CondicionVidaSection from "./components/CondicionVidaSection";
import EducacionDashboard from "./components/EducacionDashboard";
import SaludSection from "./components/SaludSection";
import ResumenComparacionSection from "./components/ResumenComparacionSection";
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

    nationalEducOferta,
    educacionData,
    educacionOfertaMunicipalData,
    educacionOfertaMunicipalProvinciaData,

    resumenComparacionRows,
  } = ctx;

  const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

  return (
    <div className="one-dashboard min-h-screen">
      {/* HEADER */}
      <header className="one-header border-b border-white/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-5 border-b border-white/20 pb-3">
            <div className="one-brand-lockup relative w-[245px] sm:w-[300px]">
              <img
                src={assetUrl("brand/tu-municipio-logo-white.png")}
                alt="Tu Municipio en cifras"
                className="block h-auto w-full"
              />
              <span className="one-dashboard-word">Dashboard</span>
            </div>
            <img
              src={assetUrl("brand/one-institutional-logo-white.png")}
              alt="Gobierno de la República Dominicana, Hacienda y Economía, Oficina Nacional de Estadística"
              className="hidden h-auto w-[190px] sm:block"
            />
          </div>

          <div className="flex flex-col gap-4 py-5 md:flex-row md:items-end md:justify-between">
            <div className="text-center md:text-left">
              <h1 className="text-lg font-bold text-white md:text-xl">
                Diagnóstico Territorial
                {selectedMunicipio?.municipio
                  ? ` - ${selectedMunicipio.municipio}`
                  : ""}
              </h1>
              <p className="mt-1 text-xs text-white/75 md:text-sm">
                Panel de diagnóstico territorial - población, salud, economía, empleo y educación
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="one-print-button hide-on-print inline-flex items-center justify-center gap-2 self-center rounded-md border border-white/70 px-3 py-2 text-xs font-medium text-white transition hover:bg-white hover:text-[#50102c] md:self-auto md:text-sm"
            >
              <Printer aria-hidden="true" className="h-4 w-4" />
              Imprimir (exportar PDF)
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main
        id="dashboard-pdf"
        className="w-full mx-auto flex flex-col gap-4 md:gap-5 px-2 sm:px-4 py-4 md:py-6 md:max-w-6xl"
      >
        <section className="one-demography-shell space-y-4 md:space-y-5">
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
        </section>

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
      </main>

      <footer className="one-footer border-t border-white/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:text-left">
          <img
            src={assetUrl("brand/one-institutional-logo-white.png")}
            alt="Gobierno de la República Dominicana, Hacienda y Economía, Oficina Nacional de Estadística"
            className="h-auto w-[175px]"
          />
          <p className="text-[10px] leading-relaxed text-white/60 sm:max-w-md sm:text-right">
            Tu Municipio en cifras · Panel de diagnóstico territorial
          </p>
        </div>
      </footer>
    </div>
  );
}
