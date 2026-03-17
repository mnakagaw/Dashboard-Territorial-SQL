/**
 * PrintMapSVG.jsx - Static SVG Map for Print Mode
 *
 * This component renders a simple SVG map from GeoJSON data,
 * completely bypassing Leaflet's complex DOM/SVG/Canvas layer.
 * Chrome's print preview cannot render Leaflet's internal SVG correctly
 * (due to translate3d, stacking contexts, etc.), so we use this
 * plain SVG instead, which Chrome can always print.
 *
 * Hidden on screen, shown only in @media print via CSS.
 */

import React, { useEffect, useState, useMemo } from "react";

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

// Simple equirectangular projection with latitude correction
// For the Dominican Republic (~18°N), cos(18°) ≈ 0.951
const LAT_CENTER = 18.7;
const COS_LAT = Math.cos((LAT_CENTER * Math.PI) / 180);

function projectLonLat(lon, lat) {
    // Equirectangular projection: x = lon * cos(lat0), y = lat
    // This preserves the aspect ratio correctly for the DR's latitude
    const x = lon * COS_LAT;
    const y = -lat; // Negate because SVG Y increases downward
    return [x, y];
}

export function PrintMapSVG({
    selectedAdm2,
    selectedProvince,
    selectedRegion,
}) {
    const [geojson, setGeojson] = useState(null);
    const [regionsIndex, setRegionsIndex] = useState([]);

    useEffect(() => {
        loadJson("adm2.json")
            .then((data) => setGeojson(data))
            .catch((error) => console.error("Error loading print GeoJSON", error));
        loadJson("regions_index.json")
            .then((data) => setRegionsIndex(data))
            .catch((error) => console.error("Error loading print region index", error));
    }, []);

    const svgData = useMemo(() => {
        if (!geojson) return null;

        // Calculate bounds in projected coordinates
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;

        // Project all features and track bounds
        const projected = geojson.features.map((feature) => {
            const { type, coordinates } = feature.geometry;

            let polygons;
            if (type === "Polygon") {
                polygons = [coordinates];
            } else if (type === "MultiPolygon") {
                polygons = coordinates;
            } else {
                polygons = [];
            }

            const projectedPolygons = polygons.map((polygon) =>
                polygon.map((ring) =>
                    ring.map(([lon, lat]) => {
                        const [px, py] = projectLonLat(lon, lat);
                        if (px < minX) minX = px;
                        if (px > maxX) maxX = px;
                        if (py < minY) minY = py;
                        if (py > maxY) maxY = py;
                        return [px, py];
                    })
                )
            );

            return { feature, projectedPolygons };
        });

        // SVG dimensions with padding
        const padding = 10;
        const svgWidth = 500;
        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        const scale = (svgWidth - padding * 2) / boundsWidth;
        const svgHeight = boundsHeight * scale + padding * 2;

        // Generate SVG path data for each feature
        const paths = projected.map(({ feature, projectedPolygons }, mapIdx) => {
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
                    const regObj = regionsIndex.find((r) => r.id === selectedRegion);
                    if (regObj) {
                        isSelected = regObj.provincias.includes(prov);
                    }
                }
            }

            // Convert projected coordinates to SVG path string
            const d = projectedPolygons
                .map((polygon) =>
                    polygon
                        .map((ring) => {
                            const points = ring.map(([px, py]) => {
                                const sx = (px - minX) * scale + padding;
                                const sy = (py - minY) * scale + padding;
                                return `${sx.toFixed(2)},${sy.toFixed(2)}`;
                            });
                            return `M${points.join("L")}Z`;
                        })
                        .join(" ")
                )
                .join(" ");

            return {
                d,
                isSelected,
                key: `${adm2 || feature.properties.shapeName}-${mapIdx}`,
            };
        });

        return { paths, svgWidth, svgHeight };
    }, [geojson, regionsIndex, selectedAdm2, selectedProvince, selectedRegion]);

    if (!svgData) return null;

    return (
        <div className="print-map-svg-container" style={{ display: 'none' }}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${svgData.svgWidth} ${svgData.svgHeight}`}
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                style={{ background: "white" }}
            >
                {/* Draw non-selected first, then selected on top */}
                {svgData.paths
                    .filter((p) => !p.isSelected)
                    .map((p) => (
                        <path
                            key={p.key}
                            d={p.d}
                            fill="#e2e8f0"
                            fillOpacity="0.6"
                            stroke="#64748b"
                            strokeWidth="0.5"
                        />
                    ))}
                {svgData.paths
                    .filter((p) => p.isSelected)
                    .map((p) => (
                        <path
                            key={p.key}
                            d={p.d}
                            fill="#fecaca"
                            fillOpacity="0.9"
                            stroke="#b91c1c"
                            strokeWidth="1.2"
                        />
                    ))}
            </svg>
        </div>
    );
}
