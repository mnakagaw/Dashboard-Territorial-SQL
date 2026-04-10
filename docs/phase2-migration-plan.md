# Plan de Migración: Fase 2 (Canonical Schema)

Este plan establece la ruta progresiva para transicionar la información desde los activos estáticos actuales hacia el modelo relacional dimensional (Canonical Schema).

## Principios de la Migración

1. **Sin Disrupciones (Zero Downtime)**: La migración ocurre en segundo plano (Backend/DB). El Frontend y los usuarios no experimentarán caídas porque la capa de caché (`dataset_assets` de la Fase 1) seguirá activa e intacta.
2. **Tabular Primero, Complejo Después**: Migraremos primero todo lo estadísticamente "plano" (escala 1:1 territorial) y dejaremos las jerarquías anidadas complejas temporalmente exclusivas en su formato JSON original dentro de la Fase 1 hasta extender el modelo.

---

## Fases de Implementación

### Paso 1: Inicialización del Catálogo y DDL
- Ejecutar en MariaDB/SQL Server el script maestro: `scripts/create_canonical_tables.sql`.
- Configurar formalmente el diccionario `dim_domain` llenándolo con ejes maestros ("Demografía", "Salud", "Educación", "Economía").
- Llenar `dim_source` con datos del Censo 2022 y anuarios correspondientes como la fuente inmutable.

### Paso 2: Poblar la Tabla Maestra Espacial (`dim_territory`)
*El fundamento primario sobre el que descansan los cruces estadísticos.*
1. Validar que los 158 municipios, 32 provincias y 10 regiones estén reflejados.
2. Inyectar datos derivándolos del catálogo fundacional `municipios_index.json` o su original del Banco de Datos.
3. Asegurar la jerarquía configurando el campo fundamental `parent_territory_id`.

### Paso 3: Migrar Core Indicators (Flattened Metrics)
*Corresponde a la traducción de los ejes analíticos que solo entregan un escalar por locación (1 variable = 1 territorio).*
- Afrontaremos progresivamente:
  1. `indicadores_basicos` y `national_basic` (Asegurando población, viviendas).
  2. `condicion_vida` (Agua, Electricidad, Inodoro - porcentajes netos).
  3. `hogares_resumen` y `tic`.
- **Estrategia ETL**: 
  1. Insertar el tipo de dato métrico en `dim_indicator`.
  2. Subir/Referenciar los datos fuente a la tabla de validación rápida `raw_import_batch`.
  3. Ejecutar los scripts de mapeo que alimentarán automáticamente `fact_statistic` asociando las llaves foráneas.

### Paso 4: Recreación Inversa del Eje Delivery (Phase 1)
*Demostrar el "Valor de Retorno" de la base de datos hacia la app web.*
1. Una vez guardada la migración básica anterior en el almacén central (Fact Table), programaremos las Vistas o Store Procedures probatorias.
2. Extraerán variables desde el `fact_statistic`, las pivotearán mediante la cláusula `FOR JSON AUTO / PATH` del lado de SQL, sobrescribiendo por la fuerza los registros JSON equivalentes en la tabla puente `dataset_assets`.
3. Validar de esta manera que la migración ha tomado las riendas completas del ecosistema.

### Paso 5: Expansión Hacia Datos Anatómicos Anidados (Casos Difíciles)
*Las métricas que exigen profundidad relacional "N a N" serán contenidas hasta desplegar las extensiones Dimensional Slice.*
1.  **Educación**: Exige segmentar rangos etarios. En el futuro, construir `dim_education_slice` y fact correspondiente.
2.  **Pirámides Poblacionales**: Separación por deciles cruzado con variables Masculino/Femenino. Conllevará ampliación relacional de cortes espaciales.
3.  **Salud y Economía**: Similar nivel de desagregación jerárquica.

Hasta que no alcancen esa madurez, continuaremos sosteniendo sus activos exclusivamente desde el mecanismo inicial JSON-to-Assets.
