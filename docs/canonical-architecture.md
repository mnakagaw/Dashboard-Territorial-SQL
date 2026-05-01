# Arquitectura de Datos: Canonical Schema (Fase 2)

Este documento describe la arquitectura de datos del Dashboard Territorial, con énfasis en la transición desde un almacén de activos JSON (Fase 1) hacia un modelo relacional dimensional normalizado (Fase 2).

---

## Fases del Sistema

| Fase | Nombre | Descripción | Estado |
|------|--------|-------------|--------|
| **Phase 1** | Delivery Layer | Tabla `dataset_assets` con `json_content`. El frontend React consume estos activos optimizados. | ✅ Operativo |
| **Phase 2** | Canonical Layer | Esquema en estrella normalizado con modelos de desglose (Breakdowns) y entidades. | ✅ Completado |
| **Ideal** | Automated Continuity | Original Source → Canonical → Delivery. Flujo automatizado de actualización de punta a punta. | ✅ Implementado |

### Relación entre Fases

- La Fase 1 (`dataset_assets`) **no se elimina**. Es la capa de entrega (*delivery artifact*) que el frontend React consume.
- La Fase 2 es la capa canónica: la fuente de verdad estructurada. Los datos se normalizan aquí y, desde aquí, se regeneran los JSON de `dataset_assets`.
- En la operación ideal de producción (ONE / SQL Server), las actualizaciones ocurren en las tablas canónicas y las vistas de entrega se regeneran automáticamente.

---

## Capas de Datos

### 1. Original Source Layer (Capa de Origen)

Corresponde a los datos maestros administrados por la ONE: censos, encuestas, registros administrativos. En el proyecto, la tabla `raw_import_batch` registra cada lote de importación, proporcionando trazabilidad completa sobre qué archivos alimentaron la base de datos y cuándo.

### 2. Canonical Layer (Capa Canónica — Fase 2)

Un esquema en estrella (*star schema*) compuesto por:

**Dimensiones:**
- `dim_territory` — Jerarquía territorial recursiva (Nacional → Región → Provincia → Municipio). Contiene los 158 municipios, 32 provincias, 10 regiones y 1 registro nacional.
- `dim_domain` — Ejes temáticos: Demografía, Hogares, TIC, Economía, Salud, Educación, Condición de Vida.
- `dim_indicator` — Catálogo de indicadores con regla de agregación (`sum`, `avg`, `weighted_avg`) y unidad de medida.
- `dim_source` — Fuentes documentales: nombre, institución, tipo (Censo/Encuesta/Registro), año de referencia, URL o referencia oficial.

**Tabla de Hechos:**
- `fact_statistic` — Intersección de territorio × indicador × fuente → valor numérico. Incluye `UNIQUE (territory_id, indicator_id, source_id, period_year)` para garantizar integridad y permitir operaciones UPSERT seguras.

**Ingesta:**
- `raw_import_batch` — Registro de cada operación de carga: origen, fecha, estado, conteo de registros procesados.

### 3. Delivery Layer (Capa de Entrega — Fase 1)

La tabla `dataset_assets` almacena JSON preformateados listos para consumo directo por la API PHP/ASP.NET y el frontend React. Los JSON de esta capa se regeneran desde el canonical mediante scripts o procedimientos almacenados.

---

## Indicadores Planos vs. Datos Complejos

### Indicadores Planos (Flat Indicators)

Indicadores que producen un único valor escalar por territorio. Se almacenan directamente en `fact_statistic` estableciendo `breakdown_id` como `NULL`.

Ejemplos: Población total, viviendas ocupadas, tasa de uso de internet, total de establecimientos.

### Datos Complejos (Breakdowns)

Datasets con distribuciones internas que requieren ejes adicionales (edad, sexo, tipo de establecimiento, sector económico CIIU).

Para no hiperfragmentar `fact_statistic` agregando docenas de columnas para cada eje (edad, sexo, educación), utilizamos un **Modelo de Desgloses (Breakdown Model) Unificado**:

- **`dim_breakdown`** — Define los cortes estadísticos: `breakdown_id`, `category` (ej. 'sex_age', 'education_level', 'ciiu_section'), `code` y `label`.
- **`fact_statistic`** — Tiene una Foreign Key opcional a `breakdown_id`. Cuando un hecho representa la "Población Femenina de 15 a 19 años", el `breakdown_id` no es NULL, enlazando directamente al segmento demográfico.

Esto permite que todos los datasets complejos estén canónicamente estructurados:
- `condicion_vida` (Agua, Combustible, etc.)
- `pyramids` (Sexo × Edad)
- `educacion` (Eficiencia por Nivel)
- `economia_empleo` (Distribución Sectorial CIIU y Tamaño)

### Entidades Físicas (Entity Model)

Para datos que no son agregados estadísticos sino entidades individuales con geolocalización (ej. hospitales, escuelas).
- **`dim_facility_type`** — Tipos de entidades (ej. "Hospital Infantil", "Centro de Primer Nivel").
- **`dim_facility`** — Cada infraestructura tiene `territory_id`, nombre, latitud, longitud.
- Implementado para: `salud_establecimientos`.

---

## Flujo de Actualización (Pipeline)

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Datos       │     │   Canonical     │     │   Delivery       │
│  Originales  │ ──► │   Schema        │ ──► │   (dataset_      │
│  (ONE/Censo) │     │ (fact_statistic)│     │    assets)       │
└──────────────┘     └─────────────────┘     └──────────────────┘
       ↑                      ↑                       ↑
  raw_import_batch      UPSERT idempotente     regenerate_delivery.js
  (trazabilidad)        (seguro re-ejecutar)   (o FOR JSON en SQL Server)
```

### En SQL Server (Producción ONE):
1. El equipo de datos actualiza las tablas canónicas mediante procedimientos almacenados o SSIS.
2. Un procedimiento ejecuta `FOR JSON PATH` para pivotar `fact_statistic` al formato JSON esperado.
3. El resultado se inserta/actualiza en `dataset_assets`.
4. La API ASP.NET Core sirve el JSON actualizado al dashboard sin necesidad de redeploy.

---

## SQL Server: Consideraciones de Migración

| Aspecto | MariaDB (actual) | SQL Server (producción) |
|---------|-------------------|------------------------|
| Auto-incremento | `AUTO_INCREMENT` | `IDENTITY(1,1)` |
| Texto Unicode | `VARCHAR` + `utf8mb4` | `NVARCHAR` |
| Fecha precisa | `DATETIME` | `DATETIME2` |
| UPSERT | `ON DUPLICATE KEY UPDATE` | `MERGE ... WHEN MATCHED THEN UPDATE WHEN NOT MATCHED THEN INSERT` |
| JSON nativo | `JSON_EXTRACT()` | `FOR JSON PATH` / `OPENJSON()` |
| Índices | `CREATE INDEX` | Igual |
| DDL idempotente | `IF NOT EXISTS` | `IF OBJECT_ID(...) IS NULL` |

Ambos DDLs están disponibles en `scripts/`:
- `create_canonical_tables.sql` — MariaDB
- `create_canonical_tables_sqlserver.sql` — SQL Server
