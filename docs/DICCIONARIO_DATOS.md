# Diccionario de Datos
## Dashboard para Diagnóstico Territorial - República Dominicana

**Versión:** 1.0  
**Fecha:** Febrero 2026

---

## Resumen de Archivos

El directorio `public/data/` contiene **36 archivos JSON** organizados en tres categorías:

| Categoría | Archivos | Descripción |
|-----------|----------|-------------|
| Municipal | 17 archivos | Datos a nivel de municipio (158 municipios) |
| Provincial | 11 archivos | Datos agregados por provincia (32 provincias) |
| Nacional | 8 archivos | Promedios y totales nacionales |

---

## 1. Índice y Datos Básicos

### municipios_index.json
**Descripción:** Índice de todos los municipios de la República Dominicana  
**Tipo:** Array de objetos  
**Registros:** 158

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `adm2_code` | string | Código ADM2 de 5 dígitos (ej: "01001") |
| `municipio` | string | Nombre del municipio |
| `provincia` | string | Nombre de la provincia |
| `region` | string | Región de planificación |

---

### indicadores_basicos.json
**Descripción:** Indicadores demográficos básicos del Censo 2022  
**Tipo:** Array de objetos  
**Registros:** 158

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `adm2_code` | string | Código ADM2 |
| `municipio` | string | Nombre del municipio |
| `provincia` | string | Nombre de la provincia |
| `region` | string | Región de planificación |
| `poblacion_total` | integer | Población total (Censo 2022) |
| `poblacion_hombres` | integer | Población masculina |
| `poblacion_mujeres` | integer | Población femenina |
| `viviendas_total` | integer | Total de viviendas |
| `viviendas_ocupadas` | integer | Viviendas ocupadas |
| `viviendas_desocupadas` | integer | Viviendas desocupadas |
| `poblacion_2010` | integer\|null | Población en Censo 2010 |
| `variacion_abs` | integer | Variación absoluta 2010-2022 |
| `variacion_pct` | float | Variación porcentual 2010-2022 |

---

## 2. Pirámides de Población

### pyramids.json
**Descripción:** Distribución por edad y sexo (Censo 2022)  
**Tipo:** Objeto con claves ADM2  
**Estructura:**
```json
{
  "adm2_code": {
    "age_groups": [
      { "age_group": "Menos de 1", "male": 920, "female": 829 },
      { "age_group": "1-4", "male": 3908, "female": 3521 },
      ...
    ]
  }
}
```

**Grupos de edad:** 22 grupos (Menos de 1, 1-4, 5-9, ... 95-99, 100 o más, No declarado)

### edad_sexo_2010.json
**Descripción:** Distribución por edad y sexo (Censo 2010)  
**Tipo:** Misma estructura que `pyramids.json`

---

## 3. Hogares

### hogares_resumen.json
**Descripción:** Resumen de hogares por municipio  
**Tipo:** Objeto con claves ADM2

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total_hogares` | integer | Número total de hogares |
| `tamano_promedio` | float | Personas promedio por hogar |
| `jefes_hombres` | integer | Hogares con jefe masculino |
| `jefes_mujeres` | integer | Hogares con jefe femenina |

### tamano_hogar.json
**Descripción:** Distribución de hogares por tamaño  
**Tipo:** Objeto con claves ADM2

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `1_persona` | integer | Hogares unipersonales |
| `2_personas` | integer | Hogares de 2 personas |
| `3_personas` | integer | Hogares de 3 personas |
| ... | ... | ... |
| `10_o_mas` | integer | Hogares de 10+ personas |

---

## 4. Condiciones de Vida

### condicion_vida.json
**Descripción:** Acceso a servicios básicos por municipio  
**Tipo:** Array de objetos  
**Fuente:** Censo 2022

**Estructura por municipio:**
```json
{
  "adm2_code": "02001",
  "municipio": "Azua",
  "provincia": "Azua",
  "region": "El Valle",
  "servicios": {
    "cocina_vivienda": { ... },
    "servicios_sanitarios": { ... },
    "agua_uso_domestico": { ... },
    "agua_para_beber": { ... },
    "combustible_cocinar": { ... },
    "alumbrado": { ... },
    "eliminacion_basura": { ... }
  }
}
```

**Detalle de servicios:**

| Servicio | Unidad | Categorías principales |
|----------|--------|------------------------|
| `cocina_vivienda` | viviendas | urbana, rural |
| `servicios_sanitarios` | hogares | inodoro, letrina, no_tiene |
| `agua_uso_domestico` | hogares | del_acueducto_dentro_de_la_vivienda, camion_tanque, etc. |
| `agua_para_beber` | hogares | botellones, acueducto, manantial, etc. |
| `combustible_cocinar` | hogares | gas_propano, carbon, lena, electricidad |
| `alumbrado` | hogares | energia_eletrica_del_tendido_publico, paneles_solares, etc. |
| `eliminacion_basura` | hogares | la_recoge_el_ayuntamiento, la_queman, etc. |

---

## 5. Economía y Empleo

### economia_empleo.json
**Descripción:** Estadísticas económicas del DEE 2024  
**Tipo:** Array de objetos  
**Fuente:** Directorio de Establecimientos Económicos

**Estructura:**
```json
{
  "adm2_code": "01001",
  "dee_2024": {
    "total_establishments": 39253,
    "total_employees": 1244797.5,
    "avg_employees_per_establishment": 31.71,
    "employment_size_bands": [ ... ],
    "sectors": [ ... ],
    "top_specialization": { ... }
  },
  "labor_market_2022": { ... }
}
```

**`employment_size_bands`:**
| Campo | Descripción |
|-------|-------------|
| `size_band` | micro_1_10, small_11_50, medium_51_150, large_151_plus |
| `label` | Etiqueta en español |
| `establishments` | Número de establecimientos |
| `employees` | Número de empleados |
| `employees_share` | Proporción del total (0-1) |

**`sectors`:**
| Campo | Descripción |
|-------|-------------|
| `ciiu_section` | Código CIIU (A-U) |
| `label` | Nombre del sector |
| `establishments` | Número de establecimientos |
| `employees` | Número de empleados |
| `lq` | Location Quotient (índice de especialización) |

---

## 6. Educación

### educacion_nivel.json
**Descripción:** Nivel educativo por grupo de edad  
**Tipo:** Objeto con claves ADM2

| Campo | Descripción |
|-------|-------------|
| `15_24_poblacion` | Población 15-24 años |
| `15_24_ninguno` | Sin educación (15-24) |
| `15_24_primaria` | Con primaria (15-24) |
| `15_24_secundaria` | Con secundaria (15-24) |
| `15_24_superior` | Con educación superior (15-24) |
| `25_64_poblacion` | Población 25-64 años |
| ... | (mismas categorías) |

### educacion_oferta_municipal.json
**Descripción:** Oferta educativa municipal  
**Tipo:** Objeto con claves ADM2

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `centros_educativos` | integer | Número de centros educativos |
| `institutos_tecnico` | integer | Institutos técnicos |
| `universidades` | integer | Sedes universitarias |
| `matricula_total` | integer | Matrícula total |

---

## 7. TIC (Tecnologías de Información)

### tic.json
**Descripción:** Acceso a TIC por municipio  
**Tipo:** Array de objetos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `adm2_code` | string | Código ADM2 |
| `internet` | integer | Hogares con internet |
| `computadora` | integer | Hogares con computadora |
| `celular` | integer | Hogares con celular |
| `internet_pct` | float | % hogares con internet |
| `computadora_pct` | float | % hogares con computadora |
| `celular_pct` | float | % hogares con celular |

---

## 8. Salud

### salud_establecimientos.json
**Descripción:** Establecimientos de salud por municipio  
**Tipo:** Objeto con claves ADM2  
**Fuente:** Servicio Nacional de Salud (SNS)

**Estructura por municipio:**
```json
{
  "adm2_code": {
    "total": 15,
    "por_tipo": {
      "HOSPITAL": 2,
      "CENTRO DIAGNOSTICO": 1,
      "CENTRO DE PRIMER NIVEL (CPN)": 8,
      ...
    },
    "establecimientos": [
      {
        "nombre": "Hospital Regional",
        "tipo": "HOSPITAL",
        "anio_apertura": 1985
      }
    ]
  }
}
```

---

## 9. Población Urbana/Rural

### poblacion_urbana_rural.json
**Descripción:** Distribución urbana/rural  
**Tipo:** Objeto con claves ADM2

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `urbana` | integer | Población urbana |
| `rural` | integer | Población rural |
| `urbana_pct` | float | % población urbana |
| `rural_pct` | float | % población rural |

---

## 10. Datos Nacionales

### national_basic.json
Promedios nacionales de indicadores básicos

### national_condicion_vida.json
Promedios nacionales de condiciones de vida

### national_economia_empleo.json
Totales y promedios nacionales del DEE 2024

### national_educacion_nivel.json
Promedios nacionales de nivel educativo

### national_hogares.json
Promedios nacionales de composición de hogares

### national_salud_establecimientos.json
Totales nacionales de establecimientos de salud

### national_tic.json
Promedios nacionales de acceso a TIC

---

## 11. Datos Geográficos

### adm2.geojson
**Descripción:** Fronteras municipales  
**Tipo:** GeoJSON FeatureCollection  
**Propiedades por feature:**
- `ADM2_ES`: Nombre del municipio
- `ADM2_PCODE`: Código ADM2
- `ADM1_ES`: Nombre de la provincia
- `ADM1_PCODE`: Código de provincia

---

## Claves de Identificación

### Código ADM2 (5 dígitos)
- **Formato:** `PPMM` donde:
  - `PP` = Código de provincia (01-32)
  - `MMM` = Código de municipio dentro de la provincia

- **Ejemplos:**
  - `01001` = Santo Domingo de Guzmán (Distrito Nacional)
  - `02001` = Azua (Provincia Azua)
  - `32003` = Santo Domingo Este (Santo Domingo)

### Código CIIU (1 letra)
Clasificación Industrial Internacional Uniforme:
| Código | Sector |
|--------|--------|
| A | Agricultura, ganadería, silvicultura y pesca |
| C | Industrias manufactureras |
| G | Comercio al por mayor y al por menor |
| I | Alojamiento y servicio de comidas |
| K | Actividades financieras y de seguros |
| O | Administración pública y defensa |
| P | Enseñanza |
| Q | Salud humana y asistencia social |

---

## Notas Técnicas

1. **Valores nulos:** Algunos campos pueden ser `null` cuando los datos no están disponibles
2. **Precisión decimal:** Los porcentajes se almacenan como decimales (0-100), no como fracciones
3. **Codificación:** Todos los archivos están en UTF-8
4. **Locale:** Usar `es-DO` para formateo de números
