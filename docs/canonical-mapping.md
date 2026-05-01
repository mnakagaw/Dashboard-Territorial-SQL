# Mapeo de Atributos: JSON (Fase 1) → Canonical Schema (Fase 2 Completa)

Este documento define cómo cada campo de los archivos JSON estáticos se traduce al modelo dimensional canónico, incluyendo los modelos de Desgloses (Breakdown) y Entidades (Entity).

---

## Leyenda

| Columna | Significado |
|---------|-------------|
| **JSON Field** | Nombre del atributo en el archivo JSON original |
| **indicator_code** | Código asignado en `dim_indicator` |
| **Aggregation** | Método para roll-up geográfico (`sum`, `weighted_avg`) |
| **Status** | ✅ Implementado |

---

## 1. `national_basic` → Dominio: `demography` + `household`

| JSON Field | indicator_code | Aggregation | Status |
|------------|---------------|-------------|--------|
| `poblacion_total` | `dem_pop_total` | sum | ✅ |
| `poblacion_hombres` | `dem_pop_male_2022` | sum | ✅ |
| `poblacion_mujeres` | `dem_pop_female_2022` | sum | ✅ |
| `poblacion_total_2010` | `dem_pop_total_2010` | sum | ✅ |
| `hogares_en_viviendas_particulares_ocupadas` | `hog_total` | sum | ✅ |
| `poblacion_en_hogares_particulares` | `hog_pop` | sum | ✅ |
| `personas_por_hogar_promedio` | `hog_size_avg` | weighted_avg | ✅ |

**Delivery regeneration**: ✅ Completada

---

## 2. `indicadores_basicos` → Dominio: `demography`

| JSON Field | indicator_code | Aggregation | Status |
|------------|---------------|-------------|--------|
| `poblacion_total` | `dem_pop_total` | sum | ✅ |
| `poblacion_hombres` | `dem_pop_male_2022` | sum | ✅ |
| `poblacion_mujeres` | `dem_pop_female_2022` | sum | ✅ |
| `poblacion_2010` | `dem_pop_total_2010` | sum | ✅ |
| `viviendas_total` | `dem_viv_total` | sum | ✅ |
| `viviendas_ocupadas` | `dem_viv_ocup` | sum | ✅ |
| `viviendas_desocupadas` | `dem_viv_desocup` | sum | ✅ |
| `variacion_abs` | `dem_pop_var_abs` | sum | ✅ |
| `variacion_pct` | `dem_pop_var_pct` | weighted_avg | ✅ |

**Delivery regeneration**: ✅ Completada

---

## 3. `hogares_resumen` → Dominio: `household`

| JSON Field | indicator_code | Aggregation | Status |
|------------|---------------|-------------|--------|
| `hogares_total` | `hog_total` | sum | ✅ |
| `poblacion_en_hogares` | `hog_pop` | sum | ✅ |
| `personas_por_hogar` | `hog_size_avg` | weighted_avg | ✅ |

**Delivery regeneration**: ✅ Completada

---

## 4. `tic` → Dominio: `tic`

| JSON Field | indicator_code | Aggregation | Status |
|------------|---------------|-------------|--------|
| `internet.total` | `tic_internet_total` | sum | ✅ |
| `internet.used` | `tic_internet_used` | sum | ✅ |
| `internet.rate_used` | `tic_internet_rate` | weighted_avg | ✅ |
| `cellular.total` | `tic_cellular_total` | sum | ✅ |
| `cellular.used` | `tic_cellular_used` | sum | ✅ |
| `cellular.rate_used` | `tic_cellular_rate` | weighted_avg | ✅ |
| `computer.total` | `tic_computer_total` | sum | ✅ |
| `computer.used` | `tic_computer_used` | sum | ✅ |
| `computer.rate_used` | `tic_computer_rate` | weighted_avg | ✅ |

**Delivery regeneration**: ✅ Completada

---

## 5. `economia_empleo` → Dominio: `economy`

### Totales Planos y Desgloses

| JSON Field | indicator_code | Desglose (Breakdown Axis) | Status |
|------------|---------------|-------------|--------|
| `dee_2024.total_establishments` | `eco_establishments` | N/A (Total) | ✅ |
| `dee_2024.total_employees` | `eco_employees` | N/A (Total) | ✅ |
| `dee_2024.avg_employees_per_establishment` | `eco_avg_employees` | N/A (Total) | ✅ |
| `dee_2024.employment_size_bands[]` | _mismos_ | `eco_size_band` | ✅ |
| `dee_2024.sectors[]` | _mismos_ | `eco_ciiu_section` | ✅ |

**Delivery regeneration**: ✅ Completada (incluye nested JSON a partir de los registros de desglose).

---

## 6. `condicion_vida` → Dominio: `living_conditions`

### Estructura y Desgloses

Cada servicio mantiene un total plano y su correspondiente distribución porcentual a través de `dim_breakdown`.

| JSON Field | indicator_code | Desglose (Breakdown Axis) | Status |
|------------|---------------|-------------|--------|
| `servicios.cocina_vivienda` | `cv_cocina_vivienda` | `cv_cocina_vivienda` | ✅ |
| `servicios.servicios_sanitarios` | `cv_servicios_sanitarios` | `cv_servicios_sanitarios`| ✅ |
| `servicios.agua_uso_domestico` | `cv_agua_uso_domestico` | `cv_agua_uso_domestico` | ✅ |
| `servicios.agua_para_beber` | `cv_agua_para_beber` | `cv_agua_para_beber` | ✅ |
| `servicios.combustible_cocinar`| `cv_combustible_cocinar` | `cv_combustible_cocinar` | ✅ |
| `servicios.alumbrado` | `cv_alumbrado` | `cv_alumbrado` | ✅ |
| `servicios.eliminacion_basura` | `cv_eliminacion_basura` | `cv_eliminacion_basura` | ✅ |

**Delivery regeneration**: ✅ Reconstruye el objeto anidado íntegramente.

---

## 7. `salud_establecimientos` → Dominio: `health`

### Modelo de Entidad

Este es un **dataset de entidades individuales**. Se migró al Entity Model (`dim_facility` / `dim_facility_type`).

| Propiedad Hija | Destino | Status |
|----------------|-------------|--------|
| `id_centro` | `dim_facility.external_id` | ✅ |
| `nombre` | `dim_facility.name` | ✅ |
| `tipo_centro` | `dim_facility_type` (Relación FK) | ✅ |
| `regional_salud`| `dim_facility.admin_region` | ✅ |
| `latitud`, `longitud` | `dim_facility.latitude`/`longitude` | ✅ |

**Delivery regeneration**: ✅ Completada. Reconstruye el listado completo consultando de `dim_facility`.

---

## 8. `educacion` / `educacion_nivel` / `pyramids` (Desgloses)

| Dataset | indicator_code | Desglose (Breakdown Axis) | Status |
|---------|----------------|---------------------------|--------|
| `pyramids` | `dem_pyramid` | `pyramid_sex_age` (sexo x grupo etario) | ✅ |
| `educacion` | `edu_efficiency_*` | `edu_level` (abandono, promoción...) | ✅ |
| `educacion_nivel`| `edu_pop_level` | `edu_pop_level_zone_sex` | ✅ |

**Delivery regeneration**: ✅ Completada para todas las arquitecturas complejas.

---

## Resumen de Estado (Fase 2 Canónica Final)

| Dataset | Tipo (Modelo) | ETL | Delivery Regen | Fase |
|---------|------|-----|---------------|------|
| `national_basic` | Flat | ✅ | ✅ | 2 |
| `indicadores_basicos` | Flat | ✅ | ✅ | 2 |
| `hogares_resumen` | Flat | ✅ | ✅ | 2 |
| `tic` | Flat | ✅ | ✅ | 2 |
| `economia_empleo` (Total + Sectors/Bands)| Flat + Breakdown | ✅ | ✅ | 2 |
| `condicion_vida` | Breakdown | ✅ | ✅ | 2 |
| `salud_establecimientos` | Entity | ✅ | ✅ | 2 |
| `educacion` | Breakdown | ✅ | ✅ | 2 |
| `educacion_nivel` | Breakdown | ✅ | ✅ | 2 |
| `pyramids` | Breakdown | ✅ | ✅ | 2 |

Todos los datasets están en la Capa Canónica como `Single Source of Truth` y la capa de entrega se regenera desde el motor de base de datos.
