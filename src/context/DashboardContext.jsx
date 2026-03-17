/**
 * DashboardContext.jsx - Context de Estado Global del Dashboard
 *
 * Centraliza todo el estado y lógica de selección del dashboard,
 * eliminando la necesidad de props drilling desde App.jsx.
 *
 * Uso en componentes hijos:
 *   import { useDashboard } from "../context/DashboardContext";
 *   const { selectedMunicipio, indicadores, ... } = useDashboard();
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import useMunicipioData from "../hooks/useMunicipioData";
import { buildResumenComparacion } from "../utils/resumenComparacionHelpers";

const DashboardContext = createContext(null);

export const useDashboard = () => {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
    return ctx;
};

export function DashboardProvider({ children }) {
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectionKey, setSelectionKey] = useState(null);

    const data = useMunicipioData(selectedRegion, selectedProvince, selectionKey);

    const {
        municipiosIndex,
        regionsIndexData,
    } = data;

    // Auto-select first region/province/municipio on load
    useEffect(() => {
        if (!selectedRegion && regionsIndexData.length) {
            const firstReg = regionsIndexData[0];
            setSelectedRegion(firstReg.id);

            const firstProv = firstReg.provincias[0];
            setSelectedProvince(firstProv);

            const firstMuni = municipiosIndex.find(m => m.provincia === firstProv);
            if (firstMuni) setSelectionKey(firstMuni.adm2_code);
        }
    }, [regionsIndexData, municipiosIndex, selectedRegion]);

    const handleMapSelect = (adm2) => {
        const muni = municipiosIndex.find(m => m.adm2_code === adm2)
                   || municipiosIndexData.find(m => m.adm2_code === adm2);
        if (muni) {
            const prov = muni.provincia;
            setSelectedProvince(prov);
            const reg = regionsIndexData.find(r => r.provincias.includes(prov));
            if (reg) setSelectedRegion(reg.id);
        }
        setSelectionKey(adm2);
    };

    const handlePrint = () => {
        window.print();
    };

    // Build comparison rows
    const resumenComparacionRows = buildResumenComparacion({
        selectedMunicipio: data.selectedMunicipio,
        indicadores: data.indicadores,
        condVida: data.condicionVida,
        econ: data.econ,
        educ: data.educacionRecords,
        educNivel: data.educacionNivel,
        tic: data.tic,

        hogaresResumenData: data.hogaresResumenData,
        poblacionUrbanaRuralData: data.poblacionUrbanaRuralData,
        educacionData: data.educacionData,
        saludEstablecimientosData: data.saludEstablecimientosData,
        hogaresResumenLocal: data.hogaresResumen,
        poblacionUrbanaRuralLocal: data.poblacionUrbanaRural,
        saludLocal: data.saludEstablecimientos,

        condicionVidaProvinciaData: data.condicionVidaProvinciaData,
        ticProvinciaData: data.ticProvinciaData,
        educacionNivelProvinciaData: data.educacionNivelProvinciaData,
        economiaEmpleoProvinciaData: data.economiaEmpleoProvinciaData,
        indicadoresBasicosData: data.indicadoresBasicosData,
        hogaresResumenProvinciaData: data.hogaresResumenProvinciaData,
        poblacionUrbanaRuralProvinciaData: data.poblacionUrbanaRuralProvinciaData,
        educacionProvinciaData: data.educacionProvinciaData,
        saludEstablecimientosProvinciaData: data.saludEstablecimientosProvinciaData,

        nationalBasic: data.nationalBasic,
        nationalCondVida: data.nationalCondicionVida,
        nationalEcon: data.nationalEcon,
        nationalTic: data.nationalTic,
        nationalEducNivel: data.nationalEducNivel,
        nationalHogares: data.nationalHogares,
        nationalSalud: data.nationalSalud,
        nationalEducOferta: data.nationalEducOferta,
        educacionOfertaMunicipalData: data.educacionOfertaMunicipalData,
        educacionOfertaMunicipalProvinciaData: data.educacionOfertaMunicipalProvinciaData,
    });

    const value = {
        // Selection state
        selectedRegion,
        setSelectedRegion,
        selectedProvince,
        setSelectedProvince,
        selectionKey,
        setSelectionKey,

        // Handlers
        handleMapSelect,
        handlePrint,

        // All data from useMunicipioData
        ...data,

        // Pre-built comparison rows
        resumenComparacionRows,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}
