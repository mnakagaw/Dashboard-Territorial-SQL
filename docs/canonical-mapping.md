# Mapeo de Atributos: Canonical Schema (Fase 2)

El siguiente diccionario define cómo los atributos presentes en los activos estáticos JSON (Phase 1 o Capa de Delivery) van a trasladarse a la estructura de la base de datos tabular (Fase 2 o Modelo Dimensional). 

Para comprender la migración de datos, es cardinal distinguir el nivel de profundidad técnica:

1. **Flat Indicators (Métricas Simples)**: Pueden migrarse de inmediato mapeándose a un único ID en el campo `indicator_id` e inyectando luego el escalar en la tabla core `fact_statistic`.
2. **Breakdowns / Slice Dimensions (Estructuras Jerárquicas Complejas)**: Casos de uso multifactorial cuyas distribuciones espaciales requieren tablas de desglose complementarias. Estos **no entrarán en `fact_statistic` nativo**, sino en extensiones de dimensión que se implementarán a futuro.

---

## 1. Domain: `indicadores_basicos` / `national_basic`

Los sets poblacionales básicos del Censo (Corte 2022 y 2010) son ideales candidatos "Flat" para inicializar la Fase 2 y poblar la tabla dimensional `fact_statistic`.

| JSON Atributo Original (Phase 1) | Canonical: `indicator_code` (Phase 2) | Razón de Agregación | Tipo de Dato Fact |
| :--- | :--- | :--- | :--- |
| `poblacion_total` | `dem_pop_total` | Suma | Numeric |
| `poblacion_hombres` | `dem_pop_male_2022` | Suma | Numeric |
| `poblacion_mujeres`| `dem_pop_female_2022`| Suma | Numeric |
| `poblacion_total_2010`| `dem_pop_total_2010`| Suma | Numeric |
| `viviendas_total` | `dem_viv_total` | Suma | Numeric |
| `viviendas_ocupadas`| `dem_viv_ocup` | Suma | Numeric |
| `variacion_pct` | `dem_pop_var_pct` | Promedio Ponderado | Numeric | 

*Nota*: `dem_pop_var_pct` no se suma directamente sino que exige como regla analítica recálculo por fórmula matemática para consolidaciones geográficas a nivel Región o Provincia.

---

## 2. Domain: Condición de Vida & Hogares (`condicion_vida`, `tic`, `hogares_resumen`)

Mayormente compuestas de porcentajes y escalares fijos de encuestas base, por lo que adaptan sin alteración a `fact_statistic`.

| JSON Atributo Original | Canonical: `indicator_code` | Razón de Agregación | Tipo de Dato Fact |
| :--- | :--- | :--- | :--- |
| `agua_red_publica_porcentaje` | `cv_agua_red_pct` | Promedio Ponderado | Numeric |
| `saneamiento_inodoro_porcentaje` | `cv_saneta_inod_pct`| Promedio Ponderado | Numeric |
| `alumbrado_red_publica_porcentaje` | `cv_alum_red_pct` | Promedio Ponderado | Numeric |
| `tic_celular_porcentaje` | `tic_celular_pct` | Promedio Ponderado | Numeric |
| `personas_por_hogar_promedio` | `hog_size_avg` | Promedio Ponderado | Numeric |

---

## 3. Extensiones Sectoriales Complejas (Breakdowns Proyectados)

Los escenarios demuestran un quiebre del diseño "Flat". Exigen expansión en una etapa futura que asigne una *Slice Dimension*. Estos grupos se migrarán hacia extensiones como `fact_statistic_breakdown`.

### A. Dominio Educación (`educacion`, `educacion_nivel`, `educacion_oferta_municipal`)

- **Estructura Problemática**: Nivel Instrucción Poblacional por Rango de Edad. (Ej. Población 0-4 años, Sin Educación, etc.)
- **Enfoque Canonical Proyectado**: Creación de la dimensión secundaria `dim_educational_slice (slice_id, age_range, attainment_level)` combinada con una métrica genérica de distribución `edu_poblacion_count`.

### B. Dominio Salud (`salud_establecimientos`)

- **Estructura Problemática**: Entidades físicas que atienden a la geografía, separadas por Nivel de Atención.  
- **Enfoque Canonical Proyectado**: Despliegue de dimensión secundaria `dim_facility_slice (slice_id, facility_type, hierarchy_level)`.

### C. Distribución Etaria y Económica (`pyramids`, `economia_empleo`)

- Al igual que la Salud, ambas poseen clasificaciones ramificadas (Masculino contra Femenino subdividido por un decil exacto). Se requiere proyectar la infraestructura a dimensión de sectores de empleo (CIIU) previo a almacenar en el repositorio general.
