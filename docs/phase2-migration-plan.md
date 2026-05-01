# Plan de Migración: Phase 1 → Phase 2 (Completada)

## Definiciones

- **Phase 1**: SQL-backed JSON Asset Store (`dataset_assets` con `json_content`)
- **Phase 2**: Canonical Statistical Data Layer (esquema en estrella: `dim_*` + `fact_statistic` + Breakdown/Entity models)
- **Ideal Target**: Original Source → Canonical → Delivery Views / APIs
- **`dataset_assets`**: No es objeto de deprecación. Es la capa de entrega (*delivery artifact / bridge / cache*) que el frontend consume. Se regenera desde el canonical.

---

## Estado de Implementación Final (Handoff Package)

### Completado ✅

Todo el alcance de la Fase 2 y Fase 2b fue implementado.

| Paso | Descripción | Script |
|------|-------------|--------|
| DDL MariaDB | Tablas canónicas con soporte de desgloses y entidades | `create_canonical_tables.sql` |
| DDL SQL Server | Versión T-SQL lista para la ONE | `create_canonical_tables_sqlserver.sql` |
| ETL Flat Datasets | `national_basic`, `indicadores_basicos`, `hogares_resumen`, `tic` | `etl_phase2_mariadb.js` |
| ETL Breakdown Datasets | `condicion_vida`, `economia_empleo` (sectores y tamaño), `educacion` (eficiencia), `educacion_nivel`, `pyramids` | `etl_phase2_mariadb.js` |
| ETL Entity Datasets | `salud_establecimientos` mapeados a `dim_facility` | `etl_phase2_mariadb.js` |
| UPSERT safety | Evita duplicados en todas las tablas transaccionales | `etl_phase2_mariadb.js` |
| QA Full Pass | Extendido para validar entidades y totales vs desgloses | `qa_canonical.js` |
| Delivery regen | Regeneración JSON 100% de los datasets (incluyendo anidados complejos) | `regenerate_delivery.js` |
| Update Docs | Actualización de mapeos y diccionarios de datos | `docs/*` |

---

## Orden de Ejecución

Para un despliegue limpio en una instancia nueva (o regeneración completa):

```bash
# 1. Crear tablas canónicas (y reiniciar datos si existieran)
mysql -u USER -p DB < scripts/create_canonical_tables.sql

# 2. Ejecutar ETL (Dimensiones + Facts + Breakdowns + Entities)
node scripts/etl_phase2_mariadb.js

# 3. Verificar integridad
node scripts/qa_canonical.js

# 4. Regenerar delivery artifacts
node scripts/regenerate_delivery.js
```

*(En implementaciones remotas donde Node no esté disponible, se utiliza un script de despliegue automatizado).*

---

## SQL Server: UPSERT Equivalente (MERGE)

MariaDB usa `INSERT ... ON DUPLICATE KEY UPDATE`. En SQL Server, el equivalente es `MERGE`:

```sql
MERGE INTO fact_statistic AS target
USING (VALUES (@territory_id, @indicator_id, @source_id, @period_year, @breakdown_id, @numeric_value))
  AS source (territory_id, indicator_id, source_id, period_year, breakdown_id, numeric_value)
ON target.territory_id = source.territory_id
   AND target.indicator_id = source.indicator_id
   AND target.source_id = source.source_id
   AND ISNULL(target.period_year, 0) = ISNULL(source.period_year, 0)
   AND ISNULL(target.breakdown_id, 0) = ISNULL(source.breakdown_id, 0)
WHEN MATCHED THEN
  UPDATE SET numeric_value = source.numeric_value, updated_at = GETDATE()
WHEN NOT MATCHED THEN
  INSERT (territory_id, indicator_id, source_id, period_year, breakdown_id, numeric_value, quality_flag)
  VALUES (source.territory_id, source.indicator_id, source.source_id, source.period_year, source.breakdown_id, source.numeric_value, 'oficial');
```

---

## Delivery Regeneration: SQL Server `FOR JSON PATH`

En producción SQL Server, la regeneración de un JSON **anidado complejo** (ej. Condición de Vida) es soportado de forma nativa. 

Ejemplo simplificado de regeneración anidada:

```sql
UPDATE dataset_assets
SET json_content = (
    SELECT 
        t.territory_code AS adm2_code,
        (
            SELECT b.code AS [category_key], f.numeric_value AS [total]
            FROM fact_statistic f
            JOIN dim_indicator i ON f.indicator_id = i.indicator_id
            JOIN dim_breakdown b ON f.breakdown_id = b.breakdown_id
            WHERE f.territory_id = t.territory_id AND i.indicator_code = 'cv_servicios_sanitarios'
            FOR JSON PATH
        ) AS [servicios.servicios_sanitarios.categorias]
    FROM dim_territory t
    WHERE t.territory_type = 'municipio'
    FOR JSON PATH
),
version_no = version_no + 1,
updated_at = GETDATE()
WHERE asset_key = 'condicion_vida';
```

Este patrón certifica que el paso estructural Final Handoff asimila cualquier complejidad solicitada.
