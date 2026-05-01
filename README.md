# Dashboard Territorial (SQL) — República Dominicana

Tablero interactivo de diagnóstico territorial de la República Dominicana, con datos almacenados en **base de datos SQL** (MariaDB / SQL Server).

🌐 **Demo**: [https://prodecare.net/dbt/](https://prodecare.net/dbt/)

## Descripción

Visualización y comparación de indicadores territoriales a tres niveles: **municipio** (158), **provincia** (32) y **región** (10).

### Funcionalidades principales

- **Selector territorial de tres niveles** (Región → Provincia → Municipio)
- **Indicadores demográficos**: Población, pirámides de población (2010 y 2022)
- **Hogares**: Tamaño de hogar, distribución urbana/rural
- **Condición de vida**: Agua, saneamiento, electricidad, combustible, residuos, TIC
- **Educación**: Oferta educativa, eficiencia del sistema, niveles de instrucción
- **Economía y empleo**: Estructura productiva (DEE 2024), sectores CIIU
- **Salud**: Establecimientos de salud por tipo y cobertura
- **Mapa interactivo**: Leaflet + GeoJSON
- **Comparación territorial**: Municipio vs. provincia vs. nacional
- **Resumen narrativo (IA)**: Diagnóstico automático vía ChatGPT
- **Exportación PDF**: Impresión tipo informe

## Arquitectura de Datos (Capa Canónica)
 
 El sistema se rige por un **Esquema Canónico Normalizado (Phase 2)** que actúa como única fuente de verdad (*Single Source of Truth*), garantizando la integridad de las estadísticas territoriales.
 
 ```
 ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
 │   Data Source   │────▶│ Canonical Layer │────▶│ Delivery Layer  │
 │ (Censas/Excel)  │     │ (Star Schema)   │     │ (JSON Cache)    │
 └─────────────────┘     └─────────────────┘     └─────────────────┘
          │                       │                       │
     Scripts ETL           fact_statistic           dataset_assets
    (Idempotentes)         (Normalizado)          (Frontend ready)
 ```
 
 ### 1. Capa Canónica (Star Schema)
 
 Los datos se organizan en un esquema en estrella diseñado para responder a cualquier consulta estadística:
 
 - **`dim_territory`**: Jerarquía geográfica recursiva (Nacional → Región → Provincia → Municipio).
 - **`dim_indicator`**: Catálogo de indicadores con métodos de agregación definidos.
 - **`dim_breakdown`**: Modelo de desgloses unificado para datos complejos (sexo, edad, nivel educativo, sectores CIIU).
 - **`dim_facility`**: Modelo de entidades para infraestructuras georreferenciadas (Salud).
 - **`fact_statistic`**: Tabla de hechos con integridad referencial y bloqueos de duplicidad por `period_year` y `breakdown_id`.
 
 ### 2. Capa de Entrega (Delivery Layer)
 
 Para mantener el rendimiento óptimo del dashboard React, existe la tabla `dataset_assets`. Esta capa almacena los objetos JSON necesarios para el frontend, los cuales son **regenerados íntegramente** desde la Capa Canónica cada vez que hay una actualización.
 
 ### Bases de Datos Soportadas
 
 | Entorno | Motor | Estado |
 |---------|---------|--------|
 | **Desarrollo / CoreServer** | MariaDB 10.11+ | ✅ 100% Funcional |
 | **Producción ONE** | SQL Server 2022+ | ✅ DDL T-SQL Incluido |

## Instalación (desarrollo local)

```bash
npm install
npm run dev
```

El tablero funciona **sin base de datos** en modo local — carga datos directamente desde los archivos JSON estáticos (`public/data/`).

Para conectar a la API SQL, configure `VITE_API_BASE` en `.env.development`:

```env
VITE_API_BASE=https://prodecare.net/dbt
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (datos estáticos) |
| `npm run build:node18` | Build de producción (requiere Node 18 vía npx) |
| `npm run deploy` | Despliegue al servidor FTP |

> ⚠️ En entornos con Node 24, use `npm run build:node18` en lugar de `npm run build`.

## Estructura del Proyecto

```
├── src/
│   ├── App.jsx                          # Componente principal
│   ├── main.jsx                         # Punto de entrada React
│   ├── index.css / print.css            # Estilos globales e impresión
│   │
│   ├── components/                      # Componentes React
│   │   ├── TopSelectionAndMap.jsx       # Selector territorial + mapa
│   │   ├── RDMap.jsx                    # Mapa interactivo (Leaflet)
│   │   ├── PrintMapSVG.jsx             # Mapa SVG para impresión
│   │   ├── charts.jsx                   # Gráficos (población, economía)
│   │   ├── PyramidsRow.jsx              # Pirámides de población
│   │   ├── EducacionDashboard.jsx       # Sección de educación
│   │   ├── SaludSection.jsx             # Sección de salud
│   │   ├── CondicionVidaSection.jsx     # Condiciones de vida
│   │   ├── DemografiaHogaresSection.jsx # Demografía y hogares
│   │   ├── ResumenNarrativoSection.jsx  # Resumen narrativo (IA)
│   │   └── ResumenComparacionSection.jsx # Tabla comparativa
│   │
│   ├── hooks/
│   │   ├── useDataLoader.js             # Carga de datos (JSON estático o API)
│   │   └── useMunicipioData.js          # Filtrado y agregación de datos
│   │
│   └── utils/                           # Funciones utilitarias
│
├── public/
│   ├── data/                            # Datos JSON estáticos (36 archivos)
│   │   ├── indicadores_basicos.json
│   │   ├── pyramids.json
│   │   ├── adm2.json                    # GeoJSON (estático, no en SQL)
│   │   ├── adm2.geojson
│   │   └── ...
│   │
│   └── api/                             # Backend PHP (prodecare.net)
│       ├── data.php                     # API: GET ?key={asset_key}
│       ├── generateNarrative.php        # API: Resumen narrativo (ChatGPT)
│       ├── import_data.php              # Importador JSON → MariaDB
│       ├── .env.local                   # Credenciales DB (no en Git)
│       └── .htaccess                    # Protección de archivos sensibles
│
├── server/                              # Backend ASP.NET Core (entorno producción)
│   ├── Program.cs
│   ├── server.csproj
│   ├── Controllers/DataController.cs
│   └── Services/DataService.cs
│
├── scripts/
│   ├── create_table.sql                 # DDL — SQL Server
│   ├── create_table_mariadb.sql         # DDL — MariaDB
│   ├── import_json_to_sql.js            # Importador (SQL Server, local)
│   ├── import_json_to_mariadb.js        # Importador (MariaDB, local)
│   ├── postbuild.mjs                    # Post-procesamiento del build
│   └── deploy.mjs                       # Despliegue FTP
│
├── vite.config.mjs                      # Configuración Vite (base: /dbt/)
└── package.json
```

## Datos

### Fuentes

- **Censo Nacional de Población y Vivienda 2022** (ONE)
- **Directorio de Empresas y Establecimientos (DEE) 2024** (ONE)
- **Anuario Estadístico Educativo** (MINERD)
- **Establecimientos de Salud 1878–2025** (SNS)

### Datasets en SQL (36 archivos)

| Categoría | Datasets |
|-----------|----------|
| **Índices** | `municipios_index`, `regions_index` |
| **Demografía** | `indicadores_basicos`, `pyramids`, `edad_sexo_2010`, `poblacion_urbana_rural` |
| **Hogares** | `hogares_resumen`, `tamano_hogar` |
| **Condición de vida** | `condicion_vida`, `tic` |
| **Educación** | `educacion`, `educacion_nivel`, `educacion_oferta_municipal` |
| **Economía** | `economia_empleo` |
| **Salud** | `salud_establecimientos` |
| **Nacionales** | `national_basic`, `national_condicion_vida`, `national_economia_empleo`, ... |
| **Provinciales** | `*_provincia` (11 archivos agregados por provincia) |

## Deployment

### prodecare.net (pruebas)

```bash
npm run build:node18
npm run deploy
```

Luego importar datos a MariaDB:
```
https://prodecare.net/dbt/api/import_data.php
```

> ⚠️ **Eliminar `import_data.php` del servidor después de la importación.**

### Entorno ASP.NET Core (producción futura)

```bash
cd server
dotnet run
```

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, Vite, Recharts, Leaflet |
| Estilos | Tailwind CSS |
| API (pruebas) | PHP + PDO (MariaDB) |
| API (producción) | ASP.NET Core 8 + ADO.NET |
| Base de datos | MariaDB (prodecare.net) / SQL Server (Producción) |
| IA | OpenAI API (ChatGPT) vía backend PHP |

## Licencia

MIT

---

<details>
<summary>🇯🇵 日本語ドキュメント</summary>

## 概要

ドミニカ共和国の自治体別診断ダッシュボード（SQL版）。人口、経済、教育、医療、生活条件のデータを3段階（市区町村・県・地域）で可視化・比較できます。

## アーキテクチャ

- **フロントエンド**: React 18 + Vite SPA
- **データ格納**: MariaDB `dataset_assets` テーブル（JSONカラム方式）
- **API**: PHP（prodecare.net試験環境）/ ASP.NET Core（ASP.NET本番環境）
- **GeoJSON**: 静的ファイルとして配信（15MB超のためSQLに格納しない）

## データ切り替え

`useDataLoader.js` の `buildDataUrl()` が環境変数 `VITE_API_BASE` に基づいてデータソースを自動切替：

- **未設定**: 静的JSONファイル（`public/data/`）から直接読み込み
- **設定済**: SQL API（`/api/data.php?key=xxx`）経由で取得

UIコンポーネントは一切変更不要（完全後方互換）。

## テーブル設計

`dataset_assets` テーブルには以下の管理列を持つ：

| 列名 | 用途 |
|------|------|
| `asset_key` | データセット識別キー（将来の正規化アンカー） |
| `version_no` | バージョン番号 |
| `json_content` | JSONデータ本体 |
| `content_hash` | SHA-256ハッシュ（変更検知） |
| `is_active` | 有効/無効フラグ |

## ローカル開発

```bash
npm install
npm run dev          # 静的JSONで動作（DB不要）
npm run build:node18 # Node 24環境ではこちらを使用
npm run deploy       # FTPデプロイ
```

## デプロイURL

- **試験環境**: https://prodecare.net/dbt/
- **GitHubリポジトリ**: https://github.com/mnakagaw/Dashboard-Territorial-SQL

</details>
