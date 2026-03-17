/**
 * RDMap.jsx - Mapa Interactivo de República Dominicana
 *
 * Este componente renderiza un mapa interactivo usando Leaflet que muestra:
 * - Todos los municipios de República Dominicana (155)
 * - El municipio/provincia/región seleccionado resaltado en rojo
 * - Tooltips con el nombre del municipio al pasar el cursor
 *
 * La impresión se maneja por PrintMapSVG.jsx (componente aparte),
 * NO por este componente.
 */

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

export function RDMap({ selectedAdm2, selectedProvince, selectedRegion, onSelectMunicipio }) {
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await loadJson("adm2.json");
        setGeojson(data);
      } catch (e) {
        console.error("Error cargando GeoJSON", e);
      }
    }
    load();
  }, []);

  const [regionsIndex, setRegionsIndex] = useState([]);
  useEffect(() => {
    loadJson("regions_index.json")
      .then((data) => setRegionsIndex(data))
      .catch((error) => console.error("Error cargando índice de regiones", error));
  }, []);

  const styleFeature = (feature) => {
    const prov = feature.properties.provincia;
    const adm2 = feature.properties.adm2_code;

    let isSelected = false;

    if (selectedAdm2) {
      isSelected = adm2 === selectedAdm2;
    } else if (selectedProvince) {
      isSelected = prov === selectedProvince;
    } else if (selectedRegion) {
      if (selectedRegion === "nacional") {
        isSelected = true;
      } else {
        const regObj = regionsIndex.find(r => r.id === selectedRegion);
        if (regObj) {
          isSelected = regObj.provincias.includes(prov);
        }
      }
    }

    return {
      color: isSelected ? "#b91c1c" : "#64748b",
      weight: isSelected ? 2 : 1,
      fillColor: isSelected ? "#fecaca" : "#e2e8f0",
      fillOpacity: isSelected ? 0.9 : 0.6,
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        if (onSelectMunicipio) {
          onSelectMunicipio(
            feature.properties.adm2_code,
            feature.properties.provincia
          );
        }
      },
    });
    if (feature.properties.municipio) {
      layer.bindTooltip(feature.properties.municipio, { direction: "center" });
    }
  };

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 print-map-wrapper">
      <MapContainer
        center={[18.9, -70.2]}
        zoom={7.2}
        zoomSnap={0.1}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={60}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OSM"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geojson && (
          <GeoJSON key={selectedAdm2 || selectedProvince || selectedRegion || 'all'} data={geojson} style={styleFeature} onEachFeature={onEachFeature} />
        )}
      </MapContainer>
    </div>
  );
}
