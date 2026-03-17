# Tablero de Diagnóstico Territorial - República Dominicana

Tablero interactivo que presenta estadísticas territoriales de la República Dominicana a tres niveles: **municipio** (158), **provincia** (32) y **región** (10 regiones únicas de planificación).

## Descripción

Este tablero permite visualizar y comparar indicadores demográficos, económicos, educativos, de salud y de condición de vida, con las siguientes funcionalidades:

- **Selector territorial de tres niveles**:
  - **Municipio**: Selección en dos pasos (provincia → municipio)
  - **Provincia**: Vista agregada de todos los municipios de una provincia
  - **Región**: Vista agregada de todas las provincias de una región de planificación (Ley 345-22)
- **Indicadores demográficos**: Población total, distribución por sexo, pirámides de población (2010 y 2022)
- **Hogares y patrón urbano–rural**: Tamaño de hogar, distribución urbana/rural
- **Condición de vida**: Agua, saneamiento, electricidad, combustible, residuos sólidos, TIC
- **Educación**: Oferta educativa, eficiencia del sistema, niveles de instrucción
- **Economía y empleo**: Estructura productiva (DEE 2024), empresas por tamaño, sectores CIIU
- **Salud**: Establecimientos de salud por tipo y cobertura
- **Mapa interactivo**: Visualización geográfica con Leaflet + GeoJSON (pantalla), SVG estático (impresión)
- **Comparaciones nacionales**: Cada indicador se compara con el promedio nacional y provincial
- **Resumen narrativo (IA)**: Generación automática de diagnóstico territorial mediante ChatGPT
- **Tabla resumen de comparación**: Comparación municipio vs. provincia vs. nacional
- **Exportación PDF**: Generación de informes tipo "Diagnóstico Territorial" mediante impresión del navegador

## Niveles territoriales

| Nivel | Cantidad | Selector | Ejemplo |
|-------|----------|----------|---------|
| Municipio | 158 | Provincia → Municipio | Santo Domingo de Guzmán |
| Provincia | 32 | Dropdown directo | Provincia de Santiago |
| Región | 10 | Dropdown directo | Región Cibao Norte |

### Regiones Únicas de Planificación (Ley 345-22)

| Región | Provincias incluidas |
|--------|---------------------|
| Cibao Norte | Santiago, Puerto Plata, Espaillat |
| Cibao Sur | La Vega, Monseñor Nouel, Sánchez Ramírez |
| Cibao Nordeste | Duarte, Samaná, María Trinidad Sánchez, Hermanas Mirabal |
| Cibao Noroeste | Santiago Rodríguez, Valverde, Montecristi, Dajabón |
| Valdesia | San Cristóbal, Peravia, San José de Ocoa |
| Enriquillo | Barahona, Bahoruco, Pedernales, Independencia |
| El Valle | San Juan, Elías Piña, Azua |
| Yuma | La Altagracia, La Romana, El Seibo, Hato Mayor |
| Higuamo | San Pedro de Macorís, Monte Plata |
| Ozama o Metropolitana | Distrito Nacional, Santo Domingo |

Cuando se selecciona una provincia o región, los datos se agregan automáticamente a partir de los municipios que la componen. El resumen narrativo generado por IA adapta automáticamente su terminología al nivel territorial (Plan Municipal / Provincial / Regional de Desarrollo).

## Instalación (desarrollo)

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` en su navegador.

### Variables de Entorno (`.env`)

Para utilizar la funcionalidad del "Resumen Narrativo (IA)", es necesario configurar un archivo `.env` en la raíz del proyecto.

```env
# Habilitar el botón de generar narrativo
VITE_ENABLE_AI=true

# URL absoluta del backend PHP para la generación (para desarrollo local)
# Si no se define, se usará la ruta relativa '/api/generateNarrative.php'
VITE_API_URL=https://prodecare.net/dashboard/api/generateNarrative.php
```

### Nota sobre el `base` path

El archivo `vite.config.mjs` contiene la configuración `base: "/dashboard/"`. Este valor determina la ruta base de todos los assets (CSS, JS, imágenes) en el build de producción.

- **Para el servidor de producción** (prodecare.net/dashboard/): usar `base: "/dashboard/"`
- **Para uso offline o local**: cambiar a `base: "./"` antes de ejecutar `npm run build`
- **Para desarrollo** (`npm run dev`): el valor de `base` no afecta, ya que Vite usa la raíz del proyecto

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run build:node18` | Build de producción usando Node 18 vía `npx` |
| `npm run preview` | Vista previa del build |

## Estructura del Proyecto

```
├── src/                              # Código fuente principal
│   ├── App.jsx                       # Componente principal de la aplicación
│   ├── main.jsx                      # Punto de entrada de React
│   ├── index.css                     # Estilos globales
│   ├── print.css                     # Estilos para impresión / exportación PDF
│   │
│   ├── components/                   # Componentes React
│   │   ├── TopSelectionAndMap.jsx    # Selector territorial + mapa
│   │   ├── RDMap.jsx                 # Mapa interactivo (Leaflet)
│   │   ├── PrintMapSVG.jsx          # Mapa estático SVG para impresión
│   │   ├── charts.jsx                # Gráficos (población, economía, etc.)
│   │   ├── PyramidsRow.jsx           # Pirámides de población (2010 y 2022)
│   │   ├── EducacionDashboard.jsx    # Sección de educación
│   │   ├── SaludSection.jsx          # Sección de salud
│   │   ├── CondicionVidaSection.jsx  # Condiciones de vida
│   │   ├── DemografiaHogaresSection.jsx  # Demografía y hogares
│   │   ├── ResumenNarrativoSection.jsx   # Resumen narrativo (IA / ChatGPT)
│   │   ├── ResumenComparacionSection.jsx # Tabla de comparación territorial
│   │   └── ui/                       # Componentes UI reutilizables
│   │
│   ├── hooks/                        # React hooks personalizados
│   │   └── useMunicipioData.js       # Hook para cargar y agregar datos territoriales
│   │
│   └── utils/                        # Funciones utilitarias
│       ├── formatters.js             # Formateo de números/texto
│       └── calculations.js           # Cálculos estadísticos
│
├── public/                           # Archivos estáticos
│   └── data/                         # Datos JSON estáticos cargados vía fetch
│       ├── municipios_index.json     # Índice de 158 municipios
│       ├── regions_index.json        # Índice de regiones y sus provincias
│       ├── indicadores_basicos.json  # Población total, hombres, mujeres, crecimiento
│       ├── pyramids.json             # Pirámide de población por edad y sexo (2022)
│       ├── edad_sexo_2010.json       # Pirámide de población histórica (2010)
│       ├── economia_empleo.json      # Economía y empleo (DEE 2024)
│       ├── educacion.json            # Indicadores educativos
│       ├── educacion_nivel.json      # Nivel educativo por edad
│       ├── salud_establecimientos.json   # Establecimientos de salud
│       ├── condicion_vida.json       # Condiciones de vivienda
│       ├── hogares_resumen.json      # Resumen de hogares
│       ├── tic.json                  # Acceso a TIC
│       ├── national_*.json           # Promedios nacionales (8 archivos)
│       └── *_provincia.json          # Datos agregados por provincia
│
├── scripts/                          # Scripts de utilidad
│   ├── postbuild.mjs                 # Post-procesamiento del build
│   └── deploy.mjs                    # Despliegue a servidor FTP
│
├── index.html                        # HTML principal
├── vite.config.mjs                   # Configuración de Vite
├── tailwind.config.js                # Configuración de Tailwind CSS
├── postcss.config.cjs                # Configuración de PostCSS
└── package.json                      # Dependencias y scripts
```

## Tecnologías

- **React 18** + Vite
- **Leaflet** (mapas interactivos)
- **Recharts** (gráficos)
- **Tailwind CSS** (estilos)
- **OpenAI API** (resumen narrativo automático a través de un backend PHP)

## Datos

Los datos provienen de las siguientes fuentes:

- **Censo Nacional de Población y Vivienda 2022** (Fuentes Oficiales)
- **Directorio de Empresas y Establecimientos (DEE) 2024** (Fuentes Oficiales)
- **Anuario Estadístico Educativo** (MINERD)
- **Establecimientos de Salud 1878–2025** (SNS)

### Archivos de datos (`public/data/`)

| Archivo | Descripción |
|---------|-------------|
| `municipios_index.json` | Índice de 158 municipios (adm2_code, provincia, región) |
| `regions_index.json` | Índice de 10 regiones con sus provincias |
| `indicadores_basicos.json` | Población total, hombres, mujeres, crecimiento |
| `pyramids.json` | Pirámide de población por edad y sexo (2022) |
| `edad_sexo_2010.json` | Pirámide de población histórica (2010) |
| `hogares_resumen.json` | Total de hogares, personas por hogar |
| `tamano_hogar.json` | Distribución de tamaño de hogar (1-10+) |
| `poblacion_urbana_rural.json` | Población urbana vs rural |
| `condicion_vida.json` | Condiciones de vivienda (agua, electricidad, saneamiento) |
| `economia_empleo.json` | Economía y empleo (DEE 2024) |
| `educacion.json` | Indicadores educativos generales |
| `educacion_nivel.json` | Nivel educativo por grupo de edad |
| `educacion_oferta_municipal.json` | Oferta educativa (escuelas, universidades) |
| `salud_establecimientos.json` | Establecimientos de salud por tipo |
| `tic.json` | Acceso a tecnología (internet, computadora, celular) |

### Datos agregados por provincia (`*_provincia.json`)

Cada archivo de municipio tiene su equivalente agregado a nivel provincial.

### Promedios nacionales (`national_*.json`)

| Archivo | Descripción |
|---------|-------------|
| `national_basic.json` | Indicadores demográficos nacionales |
| `national_condicion_vida.json` | Condiciones de vida promedio nacional |
| `national_economia_empleo.json` | Economía y empleo nacional |
| `national_educacion_nivel.json` | Nivel educativo nacional |
| `national_educacion_oferta.json` | Oferta educativa nacional |
| `national_hogares.json` | Hogares promedio nacional |
| `national_salud_establecimientos.json` | Salud nacional |
| `national_tic.json` | Acceso TIC nacional |

### GeoJSON

| Archivo | Descripción |
|---------|-------------|
| `adm2.geojson` | Fronteras administrativas de municipios |
| `src/data/adm2.json` | GeoJSON bundled para el mapa interactivo |

## Deployment

- **Producción**: https://prodecare.net/dashboard/

Para desplegar al servidor FTP:
```bash
npm run build:node18
node scripts/deploy.mjs
```

> Nota: en algunos entornos con Node 24, `npm run build` puede fallar durante el build de Vite. En ese caso use `npm run build:node18`.

## Versión Offline (sin conexión a Internet)

La carpeta `dist-offline/` contiene una versión pre-compilada del tablero que se puede usar sin conexión a Internet.

### Cómo usar

1. Descargue la carpeta `dist-offline/` desde este repositorio (o cópiela a una USB).
2. Haga doble clic en `iniciar_servidor.bat` (requiere [Python](https://www.python.org/downloads/) o [Node.js](https://nodejs.org/)).
3. Abra su navegador en `http://localhost:8000`.

> ⚠️ **Nota**: Chrome y Edge **no permiten** abrir esta aplicación directamente desde el explorador de archivos (`file://`) debido a restricciones de seguridad (CORS). Debe usar el script de inicio o el navegador Firefox.

### Limitaciones del modo offline

| Función | Disponible offline | Razón |
|---------|-------------------|-------|
| Datos y gráficos | ✅ Sí | Todos los datos están incluidos |
| Impresión / PDF | ✅ Sí | Usa funciones del navegador |
| Mapa de fondo | ❌ No | Requiere conexión a OpenStreetMap |
| Resumen narrativo (IA) | ❌ No | Requiere conexión al servidor API |

### Cómo regenerar la versión offline

1. Cambie `base` en `vite.config.mjs` de `"/dashboard/"` a `"./"`
2. Ejecute `npm run build`
3. Copie la carpeta `dist/` como `dist-offline/`
4. Elimine `dist-offline/api/` si existe
5. Restaure `base` a `"/dashboard/"` en `vite.config.mjs`

## Licencia

MIT
