/**
 * useDataLoader.js - Hook de Carga de Datos
 *
 * Responsable de cargar todos los archivos JSON al iniciar la aplicación.
 * Separado de useMunicipioData para mejorar la mantenibilidad.
 *
 * Retorna un objeto con todos los datasets crudos (sin filtrar).
 */

import { useEffect, useState } from "react";
import { buildCondicionVidaParsed } from "../utils/dataHelpers";

function buildDataUrl(fileName) {
    return `${import.meta.env.BASE_URL}data/${fileName}`;
}

async function loadJson(fileName) {
    const response = await fetch(buildDataUrl(fileName));
    if (!response.ok) {
        throw new Error(`Failed to load ${fileName}: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export default function useDataLoader() {
    const [loaded, setLoaded] = useState(false);

    // Index
    const [regionsIndexData, setRegionsIndexData] = useState([]);

    // Todos los conjuntos de datos principales
    const [municipiosIndexData, setMunicipiosIndexData] = useState([]);
    const [indicadoresBasicosData, setIndicadoresBasicosData] = useState([]);
    const [pyramidsData, setPyramidsData] = useState([]);
    const [economiaEmpleoData, setEconomiaEmpleoData] = useState([]);
    const [educacionData, setEducacionData] = useState([]);
    const [educacionNivelData, setEducacionNivelData] = useState([]);

    const [pyramid2010Data, setPyramid2010Data] = useState([]);
    const [adm2Map2010, setAdm2Map2010] = useState({});

    const [hogaresResumenData, setHogaresResumenData] = useState([]);
    const [hogaresTamanoData, setHogaresTamanoData] = useState([]);
    const [poblacionUrbanaRuralData, setPoblacionUrbanaRuralData] = useState([]);

    // Conjuntos de datos a nivel provincial
    const [educacionProvinciaData, setEducacionProvinciaData] = useState([]);
    const [hogaresResumenProvinciaData, setHogaresResumenProvinciaData] = useState([]);
    const [hogaresTamanoProvinciaData, setHogaresTamanoProvinciaData] = useState([]);
    const [poblacionUrbanaRuralProvinciaData, setPoblacionUrbanaRuralProvinciaData] = useState([]);
    const [ticProvinciaData, setTicProvinciaData] = useState([]);
    const [condicionVidaProvinciaData, setCondicionVidaProvinciaData] = useState([]);
    const [saludEstablecimientosProvinciaData, setSaludEstablecimientosProvinciaData] = useState([]);
    const [economiaEmpleoProvinciaData, setEconomiaEmpleoProvinciaData] = useState([]);
    const [educacionNivelProvinciaData, setEducacionNivelProvinciaData] = useState([]);
    const [pyramidsProvinciaData, setPyramidsProvinciaData] = useState([]);
    const [pyramid2010ProvinciaData, setPyramid2010ProvinciaData] = useState([]);

    // Datos de oferta educativa municipal (para promedios ponderados)
    const [educacionOfertaMunicipalData, setEducacionOfertaMunicipalData] = useState([]);
    const [educacionOfertaMunicipalProvinciaData, setEducacionOfertaMunicipalProvinciaData] = useState([]);

    // Datos de TIC (Tecnologías de Información y Comunicación)
    const [ticData, setTicData] = useState([]);

    // Condición de Vida
    const [condicionVidaData, setCondicionVidaData] = useState([]);
    const [nationalCondicionVida, setNationalCondicionVida] = useState(null);

    // Conjuntos de datos a nivel nacional
    const [nationalBasic, setNationalBasic] = useState([]);
    const [nationalEcon, setNationalEcon] = useState([]);

    // Datos de establecimientos de salud
    const [saludEstablecimientosData, setSaludEstablecimientosData] = useState({});

    // Datos nacionales adicionales para comparación
    const [nationalTic, setNationalTic] = useState(null);
    const [nationalEducNivel, setNationalEducNivel] = useState(null);
    const [nationalEducOferta, setNationalEducOferta] = useState(null);
    const [nationalHogares, setNationalHogares] = useState(null);
    const [nationalSalud, setNationalSalud] = useState(null);

    // ---------------------------------------------------------------------------
    // Cargar archivos JSON (incluye datos nacionales)
    // ---------------------------------------------------------------------------
    useEffect(() => {
        async function loadAll() {
            try {
                // ---- Nivel Municipal
                const [
                    municipiosIndexData,
                    indicadoresBasicosData,
                    pyramidsData,
                    economiaEmpleoData,
                    educacionData,
                    educacionNivelData,
                    pyramid2010Data,
                    adm2Map2010,
                    hogaresResumenData,
                    hogaresTamanoData,
                    poblacionUrbanaRuralData,
                    ticData,
                    saludEstablecimientosData,
                    condicionVidaData,
                    educacionOfertaMunicipalData,
                    educacionOfertaMunicipalProvinciaData,
                    regionsIndexData,
                ] = await Promise.all([
                    loadJson("municipios_index.json"),
                    loadJson("indicadores_basicos.json"),
                    loadJson("pyramids.json"),
                    loadJson("economia_empleo.json"),
                    loadJson("educacion.json"),
                    loadJson("educacion_nivel.json"),
                    loadJson("edad_sexo_2010.json"),
                    loadJson("adm2_map_2010.json"),
                    loadJson("hogares_resumen.json"),
                    loadJson("tamano_hogar.json"),
                    loadJson("poblacion_urbana_rural.json"),
                    loadJson("tic.json"),
                    loadJson("salud_establecimientos.json"),
                    loadJson("condicion_vida.json"),
                    loadJson("educacion_oferta_municipal.json"),
                    loadJson("educacion_oferta_municipal_provincia.json"),
                    loadJson("regions_index.json"),
                ]);

                setMunicipiosIndexData(municipiosIndexData);
                setIndicadoresBasicosData(indicadoresBasicosData);
                setPyramidsData(pyramidsData);
                setEconomiaEmpleoData(economiaEmpleoData);
                setEducacionData(educacionData);
                setEducacionNivelData(educacionNivelData);
                setPyramid2010Data(pyramid2010Data);
                setAdm2Map2010(adm2Map2010);
                setHogaresResumenData(hogaresResumenData);
                setHogaresTamanoData(hogaresTamanoData);
                setPoblacionUrbanaRuralData(poblacionUrbanaRuralData);
                setTicData(ticData);
                setSaludEstablecimientosData(saludEstablecimientosData);
                setCondicionVidaData(condicionVidaData);
                setEducacionOfertaMunicipalData(educacionOfertaMunicipalData);
                setEducacionOfertaMunicipalProvinciaData(educacionOfertaMunicipalProvinciaData);
                setRegionsIndexData(regionsIndexData);

                // ---- Provincia Level Data ----
                const [
                    educacionProvinciaData,
                    hogaresResumenProvinciaData,
                    hogaresTamanoProvinciaData,
                    poblacionUrbanaRuralProvinciaData,
                    ticProvinciaData,
                    condicionVidaProvinciaData,
                    saludEstablecimientosProvinciaData,
                    economiaEmpleoProvinciaData,
                    educacionNivelProvinciaData,
                    pyramidsProvinciaData,
                    pyramid2010ProvinciaData,
                ] = await Promise.all([
                    loadJson("educacion_provincia.json"),
                    loadJson("hogares_resumen_provincia.json"),
                    loadJson("tamano_hogar_provincia.json"),
                    loadJson("poblacion_urbana_rural_provincia.json"),
                    loadJson("tic_provincia.json"),
                    loadJson("condicion_vida_provincia.json"),
                    loadJson("salud_establecimientos_provincia.json"),
                    loadJson("economia_empleo_provincia.json"),
                    loadJson("educacion_nivel_provincia.json"),
                    loadJson("pyramids_provincia.json"),
                    loadJson("edad_sexo_2010_provincia.json"),
                ]);

                setEducacionProvinciaData(educacionProvinciaData);
                setHogaresResumenProvinciaData(hogaresResumenProvinciaData);
                setHogaresTamanoProvinciaData(hogaresTamanoProvinciaData);
                setPoblacionUrbanaRuralProvinciaData(poblacionUrbanaRuralProvinciaData);
                setTicProvinciaData(ticProvinciaData);
                setCondicionVidaProvinciaData(condicionVidaProvinciaData);
                setSaludEstablecimientosProvinciaData(saludEstablecimientosProvinciaData);
                setEconomiaEmpleoProvinciaData(economiaEmpleoProvinciaData);
                setEducacionNivelProvinciaData(educacionNivelProvinciaData);
                setPyramidsProvinciaData(pyramidsProvinciaData);
                setPyramid2010ProvinciaData(pyramid2010ProvinciaData);

                // ---- Nivel Nacional ----
                const [
                    nationalBasic,
                    nationalEcon,
                    nationalTic,
                    nationalEducNivel,
                    nationalEducOferta,
                    nationalHogares,
                    nationalSalud,
                    nationalCondicionVidaRaw,
                ] = await Promise.all([
                    loadJson("national_basic.json"),
                    loadJson("national_economia_empleo.json"),
                    loadJson("national_tic.json"),
                    loadJson("national_educacion_nivel.json"),
                    loadJson("national_educacion_oferta.json"),
                    loadJson("national_hogares.json"),
                    loadJson("national_salud_establecimientos.json"),
                    loadJson("national_condicion_vida.json"),
                ]);

                setNationalBasic(nationalBasic);
                setNationalEcon(nationalEcon);
                setNationalTic(nationalTic);
                setNationalEducNivel(nationalEducNivel);
                setNationalEducOferta(nationalEducOferta);
                setNationalHogares(nationalHogares);
                setNationalSalud(nationalSalud);

                const nationalWrapped = {
                    servicios: {
                        servicios_sanitarios: nationalCondicionVidaRaw.servicios_sanitarios,
                        agua_uso_domestico: nationalCondicionVidaRaw.agua_uso_domestico,
                        agua_para_beber: nationalCondicionVidaRaw.agua_para_beber,
                        combustible_cocinar: nationalCondicionVidaRaw.combustible_cocinar,
                        alumbrado: nationalCondicionVidaRaw.alumbrado,
                        eliminacion_basura: nationalCondicionVidaRaw.eliminacion_basura,
                    },
                };
                setNationalCondicionVida(buildCondicionVidaParsed(nationalWrapped));

                setLoaded(true);
            } catch (err) {
                console.error("🔥 Data loading failed:", err);
            }
        }

        loadAll();
    }, []);

    return {
        loaded,
        regionsIndexData,
        municipiosIndexData,
        indicadoresBasicosData,
        pyramidsData,
        economiaEmpleoData,
        educacionData,
        educacionNivelData,
        pyramid2010Data,
        adm2Map2010,
        hogaresResumenData,
        hogaresTamanoData,
        poblacionUrbanaRuralData,
        educacionProvinciaData,
        hogaresResumenProvinciaData,
        hogaresTamanoProvinciaData,
        poblacionUrbanaRuralProvinciaData,
        ticProvinciaData,
        condicionVidaProvinciaData,
        saludEstablecimientosProvinciaData,
        economiaEmpleoProvinciaData,
        educacionNivelProvinciaData,
        pyramidsProvinciaData,
        pyramid2010ProvinciaData,
        educacionOfertaMunicipalData,
        educacionOfertaMunicipalProvinciaData,
        ticData,
        condicionVidaData,
        nationalCondicionVida,
        nationalBasic,
        nationalEcon,
        saludEstablecimientosData,
        nationalTic,
        nationalEducNivel,
        nationalEducOferta,
        nationalHogares,
        nationalSalud,
    };
}
