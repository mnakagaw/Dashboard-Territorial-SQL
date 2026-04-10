# Arquitectura Dimensional (Fase 2: Canonical Schema)

Este documento detalla la estructura y propósito de la **Capa Canónica de Datos Estadísticos** para el Dashboard Territorial. El objetivo es evolucionar el modelo de almacenamiento inicial hacia una arquitectura robusta, trazable y estándar para una oficina nacional de estadística (ONE).

---

## 1. Visión Arquitectónica y Capas de Datos

Para alcanzar la máxima automatización e integridad, definimos un pipeline de datos compuesto por tres capas:

1. **Original Source Layer (Capa Origen / Cruda)**
   - Corresponde a los archivos de microdatos, censos, y registros administrativos originales administrados por la ONE.
   - En el ecosistema del proyecto, se representa mediante una tabla de control o área de carga de ingesta (`raw_import_batch`), manteniendo la trazabilidad histórica de qué archivo alimentó la base de datos.
   
2. **Canonical Statistical Data Layer (Fase 2 - Modelo Actual)**
   - Una base de datos relacional normalizada y estructurada mediante modelos dimensionales (Esquema en Estrella).
   - Funciona como la **fuente de la verdad unificada (Single Source of Truth)**. La información deja de tener estructuras anidadas propietarias de la interfaz gráfica y pasa a organizarse bajo ejes analíticos formales.
   
3. **Delivery Layer / API Views (Fase 1 - Caché de Activos JSON)**
   - La tabla preexistente `dataset_assets` con su columna `json_content`.
   - **Nota crucial**: La Fase 1 **no se deprecia ni se elimina**. Esta capa actúa como un *cache de alto rendimiento* o *delivery artifact*. Las vistas o APIs (ASP.NET Core) consultan directamente esta capa para enviar JSON a la aplicación web SPA de forma instantánea.

**El objetivo ideal (Ideal Target):**
`Original Source → Canonical Data Layer → Delivery Views / APIs`

Al actualizar un origen de datos en el sistema central, el modelo canónico procesa las transformaciones mediante reglas de negocio, y posteriormente inyecta automáticamente el paquete final actualizado estructurado en la capa `dataset_assets`.

---

## 2. Modelo Dimensional: Esquema en Estrella

El corazón del *Canonical Schema* está diseñado a través de un Modelo en Estrella con dimensiones jerárquicas adaptadas a agregaciones espaciales.

### Tablas de Soporte e Ingesta
- **`raw_import_batch`**: Todo dato cargado al sistema genera un lote de trazabilidad. Esto le permite a los especialistas identificar fecha de subida, usuario, o nombres de archivo fuentes exactos.

### Dimensiones Principales (Dimensions)
Las dimensiones proveen el contexto (el *qué*, *dónde*, y *el contexto de origen*) de las métricas.

1. **`dim_territory`**: Consolida la compleja topología de la República Dominicana. Contiene la relación recursiva Padre-Hijo para realizar validaciones geográficas y "roll-ups" (Ej. agrupar datos de múltiples Municipios hacia su respectiva Provincia y Región).
2. **`dim_domain` / `dim_indicator`**: Maestro de índices numéricos. Asocia reglas de agregación (suma, promedio) de las variables oficiales, asegurando que el análisis de datos inter-territorial sea matemáticamente lícito.
3. **`dim_source`**: Amplía significativamente la capacidad de auditar la información. Requiere institución de origen, años de referencia exactos y soporte documental de URL o metodología, requerimiento crítico para los metadatos de las oficinas estadísticas nacionales.

### Tabla de Hechos (Fact Table)
- **`fact_statistic`**: Modelo que intercepta el entorno geográfico, el indicador analizado, la fuente original y la trazabilidad de ingesta contra un valor (`numeric_value` o `text_value`). Este modelo es excepcionalmente flexible frente al alta de nuevos indicadores simples.

---

## 3. Escalabilidad de Datos: Estructuras Simples y Complejas

En este punto es indispensable distinguir entre métricas planas y jerárquicas relacionales:

- **Métricas Planas (Flat Indicators)**: Aquellos indicadores puntuales que arrojan un único valor por territorio para un año en particular. Por ejemplo: *Población Total*, *Hogares Ocupados*, *Tasa de Pobreza*. Se almacenan **directamente** en el `fact_statistic` propuesto en la presente Fase.

- **Datasets Anidados y Complejos (Nested Breakdowns)**: Ciertos campos exigen cortes multifactoriales. Por ejemplo:
  - *Población categorizada por Rangos de Edad y Sexo a la vez.*
  - *Entidades escolares por Tipo de Oferta y Sector.*
  Este modelo en estrella reserva el espacio para extensiones futuras (Ej. crear tablas como `dim_demographic_slice` conectadas a `fact_statistic_breakdown`). Los datasets anidados no serán forzados artificialmente en `fact_statistic` estándar, postergándolos para una expansión de *Slice Dimensions*.
  
