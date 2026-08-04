# Fuentes de Datos

## Resumen

Todos los datos están pre-procesados como archivos JSON en `public/data/`.
No se consultan APIs externas para datos estadísticos; todo está incluido en el build.

## Fuentes Principales

| Fuente | Institución | Año | Datos que provee |
|--------|------------|-----|------------------|
| Censo Nacional de Población y Vivienda | Fuentes Oficiales | 2022 | Población, hogares, vivienda, educación, condiciones de vida, TIC |
| Censo Nacional (histórico) | Fuentes Oficiales | 2010 | Pirámide de población 2010 (comparación) |
| Directorio de Empresas y Establecimientos (DEE) | Fuentes Oficiales | 2024 | Economía, empleo, estructura productiva |
| Anuario Estadístico Educativo | MINERD | 2024 | Oferta educativa, eficiencia del sistema |
| Registro de Establecimientos de Salud | SNS | 2025 | Centros de salud por tipo y ubicación |
| Límites municipales ADM2 (`RD_MUNICIPIOS`) | Instituto Geográfico Nacional (IGN) - Infraestructura de Datos Espaciales de la República Dominicana (IDERD) | s/f | Polígonos municipales para `adm2.json` y `adm2.geojson` |

## Archivos de Datos (`public/data/`)

### Datos por Municipio (nivel base)

| Archivo | Descripción | Fuente | Registros |
|---------|-------------|--------|-----------|
| `municipios_index.json` | Índice: adm2_code, provincia, región | Fuentes Oficiales | 158 municipios |
| `regions_index.json` | Índice de 10 regiones y sus provincias | Ley 345-22 | 10 regiones |
| `indicadores_basicos.json` | Población total, hombres, mujeres, crecimiento 2010-2022 | Censo 2022 | 158 |
| `pyramids.json` | Pirámide de población por edad y sexo | Censo 2022 | 158 |
| `edad_sexo_2010.json` | Pirámide de población histórica | Censo 2010 | 155 |
| `hogares_resumen.json` | Total hogares, personas por hogar | Censo 2022 | 158 |
| `tamano_hogar.json` | Distribución por tamaño (1-10+ personas) | Censo 2022 | 158 |
| `poblacion_urbana_rural.json` | Población urbana vs rural | Censo 2022 | 158 |
| `condicion_vida.json` | Agua, saneamiento, electricidad, combustible, residuos | Censo 2022 | 158 |
| `economia_empleo.json` | Empresas, empleo, sectores CIIU | DEE 2024 | 158 |
| `educacion.json` | Indicadores educativos (oferta, eficiencia) | MINERD 2024 | 158 |
| `educacion_nivel.json` | Nivel de instrucción por edad | Censo 2022 | 158 |
| `educacion_oferta_municipal.json` | Escuelas, universidades por municipio | MINERD 2024 | 158 |
| `salud_establecimientos.json` | Establecimientos de salud por tipo | SNS 2025 | 158 |
| `tic.json` | Internet, computadora, celular | Censo 2022 | 158 |

### Datos Agregados por Provincia (`*_provincia.json`)

Cada archivo de municipio tiene su equivalente agregado a nivel provincial.
Los valores se calculan como suma (poblaciones, hogares) o promedio ponderado (tasas).

### Promedios Nacionales (`national_*.json`)

| Archivo | Contenido |
|---------|-----------|
| `national_basic.json` | Población total, hogares, personas por hogar |
| `national_condicion_vida.json` | Promedios nacionales de servicios básicos |
| `national_economia_empleo.json` | Estructura productiva nacional |
| `national_educacion_nivel.json` | Nivel educativo nacional |
| `national_educacion_oferta.json` | Oferta educativa nacional |
| `national_hogares.json` | Hogares y tamaño promedio |
| `national_salud_establecimientos.json` | Red de salud nacional |
| `national_tic.json` | Acceso TIC nacional |

### GeoJSON

| Archivo | Descripción |
|---------|-------------|
| `public/data/adm2.geojson` | Fronteras administrativas municipales ADM2 |
| `public/data/adm2.json` | Mismo GeoJSON, usado por el mapa interactivo y el mapa de impresión |

**Fuente cartográfica:** Instituto Geográfico Nacional (IGN) - Infraestructura
de Datos Espaciales de la República Dominicana (IDERD), capa `RD_MUNICIPIOS`:
https://geoportal.iderd.gob.do/layers/geonode:RD_MUNICIPIOS/metadata_detail

## Proceso de Actualización de Datos

1. Obtener datos crudos (PDF, XLSX) de la fuente oficial.
2. Cuando se actualice la población final, ejecutar `npm run data:fetch:population-final`.
3. Reconstruir los conjuntos auditados con `npm run data:rebuild:audit`. Este proceso
   actualiza las copias sincronizadas de `public/data/` y `src/data/`.
4. Verificar integridad con `npm run verify` (`scripts/verify_data_integrity.cjs`).
5. Regenerar SQLite con `npm run sqlite:init` y validarlo con `npm run sqlite:verify`.
6. Reconstruir la entrega para ONE con `npm run build:one`.

Los controles de auditoría verifican, entre otros, la población final del X Censo
(10,773,983 habitantes), la pirámide 2010 (9,250,163 habitantes, sin claves
duplicadas), 158 municipios únicos en educación y TIC, 3,726,048 hogares y la
igualdad de los totales municipales, provinciales y nacionales de educación y salud.

> **Nota**: Los scripts requieren los archivos fuente originales en `data_sources/`.
> Las fuentes incluidas en una entrega deben conservarse junto con el script para que
> la generación sea reproducible.
