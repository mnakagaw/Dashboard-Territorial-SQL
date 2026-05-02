# Especificación del Sistema
## Dashboard para Diagnóstico Territorial - República Dominicana

**Versión:** 1.0  
**Fecha:** Febrero 2026  

---

## 1. Descripción General

### 1.1 Propósito
Dashboard interactivo para visualizar estadísticas municipales de la República Dominicana, permitiendo a funcionarios públicos, investigadores y ciudadanos acceder a indicadores demográficos, económicos, educativos y de salud a nivel municipal.

### 1.2 Alcance
- Cobertura de **158 municipios** de la República Dominicana
- Datos del **Censo 2022** y **Encuesta DEE 2024**
- Visualización web responsiva con exportación a PDF

### 1.3 URLs de Producción
- Principal: https://prodecare.net/dashboard/
- Respaldo: https://mnakagaw.github.io/dashboard-municipal/

---

## 2. Arquitectura del Sistema

### 2.1 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Estilos | Tailwind CSS |
| Mapas | Leaflet + GeoJSON |
| Gráficos | Recharts |
| Exportación PDF | jsPDF + html2canvas |
| Hosting | GitHub Pages / FTP |

### 2.2 Estructura de Directorios

```
├── src/                    # Código fuente
│   ├── App.jsx             # Componente principal
│   ├── components/         # Componentes React (12 archivos)
│   ├── hooks/              # Hooks personalizados
│   ├── utils/              # Funciones utilitarias
│   └── data/               # GeoJSON bundled
├── public/data/            # Archivos JSON de datos (36 archivos)
├── scripts/                # Scripts de build y deploy
└── dist/                   # Build de producción
```

### 2.3 Flujo de Datos

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  JSON Files     │ ──▶ │ useMunicipioData │ ──▶ │  React Components │
│  (public/data/) │     │  (hook principal)│     │  (visualización)  │
└─────────────────┘     └──────────────────┘     └───────────────────┘
```

---

## 3. Módulos Funcionales

### 3.1 Selector de Territorio
- **Componente:** `TopSelectionAndMap.jsx`
- **Funcionalidad:** Selección en 2 pasos (Provincia → Municipio)
- **Opción adicional:** Seleccionar provincia completa para ver agregados

### 3.2 Mapa Interactivo
- **Componente:** `RDMap.jsx`
- **Tecnología:** Leaflet + react-leaflet
- **Datos:** GeoJSON de municipios (ADM2)
- **Interacción:** Click para seleccionar municipio, hover para tooltip

### 3.3 Indicadores Demográficos
- **Componentes:** `BasicIndicators`, `PyramidsRow`, `DemografiaHogaresSection`
- **Datos mostrados:**
  - Población total (2022 vs 2010)
  - Distribución por sexo
  - Pirámides de población
  - Hogares y tamaño de hogar
  - Población urbana/rural

### 3.4 Condiciones de Vida
- **Componente:** `CondicionVidaSection.jsx`
- **Indicadores:**
  - Acceso a agua potable
  - Servicios sanitarios
  - Alumbrado eléctrico
  - Combustible para cocinar
  - Acceso a TIC (internet, computadora, celular)

### 3.5 Educación
- **Componente:** `EducacionDashboard.jsx`
- **Datos:**
  - Nivel educativo por grupo de edad
  - Oferta educativa municipal (centros, universidades)
  - Comparación con promedio nacional

### 3.6 Economía y Empleo
- **Componente:** `EconomyEmployment` (en `charts.jsx`)
- **Fuente:** DEE 2024
- **Indicadores:**
  - Total de establecimientos y empleos
  - Distribución por tamaño de empresa
  - Sectores CIIU (comercio, manufactura, servicios)
  - Índice de especialización (LQ)

### 3.7 Salud
- **Componente:** `SaludSection.jsx`
- **Datos:** Establecimientos de salud por tipo (SNS 1878-2025)

### 3.8 Resumen Comparativo
- **Componente:** `ResumenComparacionSection.jsx`
- **Funcionalidad:** Tabla comparativa Municipio vs Provincia vs Nacional

### 3.9 Resumen Narrativo (IA)
- **Componente:** `ResumenNarrativoSection.jsx`
- **Backend:** PHP con API de OpenAI/Gemini
- **Funcionalidad:** Genera diagnóstico narrativo automatizado

### 3.10 Exportación PDF
- **Trigger:** Botón "Imprimir (exportar PDF)"
- **Tecnología:** CSS de impresión (`print.css`) + navegador
- **Formato:** Diseño optimizado para A4

---

## 4. Fuentes de Datos

| Fuente | Archivos | Descripción |
|--------|----------|-------------|
| Censo 2022 | `indicadores_basicos.json`, `pyramids.json`, `condicion_vida.json`, etc. | Datos demográficos y sociales |
| DEE 2024 | `economia_empleo.json` | Estadísticas empresariales |
| MINERD | `educacion.json`, `educacion_nivel.json` | Indicadores educativos |
| SNS | `salud_establecimientos.json` | Establecimientos de salud |
| IGN / IDERD | `adm2.json`, `adm2.geojson` | Límites municipales ADM2 (`RD_MUNICIPIOS`) |

Fuente cartográfica: Instituto Geográfico Nacional (IGN) - Infraestructura de
Datos Espaciales de la República Dominicana (IDERD), capa `RD_MUNICIPIOS`:
https://geoportal.iderd.gob.do/layers/geonode:RD_MUNICIPIOS/metadata_detail

---

## 5. Configuración y Despliegue

### 5.1 Variables de Entorno (.env)
```
VITE_API_URL=         # URL del backend PHP (opcional)
FTP_HOST=             # Servidor FTP para deploy
FTP_USER=             # Usuario FTP
FTP_PASS=             # Contraseña FTP
FTP_REMOTE_ROOT=      # Carpeta destino (/public_html)
```

### 5.2 Scripts de NPM
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (localhost:5173) |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |
| `npm run deploy` | Despliegue FTP |

### 5.3 GitHub Actions
- Archivo: `.github/workflows/deploy.yml`
- Trigger: Push a `main`
- Acción: Build automático + deploy a GitHub Pages

---

## 6. Consideraciones de Rendimiento

- **Lazy loading:** Datos JSON cargados bajo demanda
- **Memoización:** `useMemo` para cálculos costosos
- **Code splitting:** Vite genera chunks optimizados
- **Tamaño típico de build:** ~2.5 MB (incluyendo datos)

---

## 7. Limitaciones Conocidas

1. **API de IA:** Requiere servidor PHP con acceso a API externa
2. **Datos offline:** Los datos están embebidos, no hay sincronización en tiempo real
3. **Compatibilidad:** Optimizado para navegadores modernos (Chrome, Firefox, Edge, Safari)
