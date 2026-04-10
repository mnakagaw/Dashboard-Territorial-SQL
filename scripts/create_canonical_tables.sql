-- =====================================================================
-- Dashboard Territorial - Phase 2: Canonical Schema
-- Motor: MariaDB (Diseño y sintaxis portables a SQL Server)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RAW / STAGING LAYER (Trazabilidad de Ingesta)
-- ---------------------------------------------------------------------
-- Registra cada lote de importación proveniente de archivos originales.
CREATE TABLE raw_import_batch (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_name VARCHAR(255) NOT NULL,          -- Ej: 'Carga Censo 2022 - Demografia'
    source_filename VARCHAR(255) NOT NULL,     -- Ej: 'censo_2022_final.xlsx'
    import_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PROCESSING',   -- 'PROCESSING', 'SUCCESS', 'FAILED'
    records_processed INT DEFAULT 0,
    notes TEXT
);

-- (Opcional) Tablas temporales de carga cruda irían aquí.
-- Ej: CREATE TABLE stg_censo_raw ( ... )

-- ---------------------------------------------------------------------
-- 2. CANONICAL LAYER (Tablas Dimensionales)
-- ---------------------------------------------------------------------

-- Dimensión: Territorio (Catálogo Oficial de Jerarquías)
CREATE TABLE dim_territory (
    territory_id INT AUTO_INCREMENT PRIMARY KEY,
    territory_code VARCHAR(50) NOT NULL UNIQUE, -- Código oficial (Ej. '01001')
    territory_name VARCHAR(100) NOT NULL,
    territory_type VARCHAR(50) NOT NULL,        -- 'municipio', 'provincia', 'region', 'nacional'
    parent_territory_id INT NULL,               -- Relación recursiva
    region_oficial_ley345 VARCHAR(100) NULL,    -- Clasificación específica (Ley 345-22)
    FOREIGN KEY (parent_territory_id) REFERENCES dim_territory(territory_id)
);

-- Dimensión: Dominios (Categorías Temáticas)
CREATE TABLE dim_domain (
    domain_id INT AUTO_INCREMENT PRIMARY KEY,
    domain_code VARCHAR(50) NOT NULL UNIQUE,
    domain_name VARCHAR(100) NOT NULL           -- 'Demografía', 'Salud', 'Educación'
);

-- Dimensión: Indicadores Estatísticos
CREATE TABLE dim_indicator (
    indicator_id INT AUTO_INCREMENT PRIMARY KEY,
    indicator_code VARCHAR(100) NOT NULL UNIQUE, -- Ej: 'pob_tot', 'tasa_desocup'
    indicator_name VARCHAR(255) NOT NULL,
    domain_id INT NOT NULL,
    unit VARCHAR(50) NULL,                       -- 'absoluto', 'porcentaje', 'tasa_por_10k'
    data_type VARCHAR(50) NULL,                  -- 'numeric', 'text'
    aggregation_method VARCHAR(50) NULL,         -- 'sum', 'avg', 'weighted_avg' (Regla para agregar)
    display_hints VARCHAR(255) NULL,             -- Pistas para formato en UI
    FOREIGN KEY (domain_id) REFERENCES dim_domain(domain_id)
);

-- Dimensión: Fuentes (Trazabilidad de la Información Oficial)
CREATE TABLE dim_source (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,           -- Ej: 'X Censo Nacional de Población y Vivienda'
    institution VARCHAR(100) NULL,               -- Ej: 'ONE', 'MINERD', 'SNS'
    source_type VARCHAR(100) NULL,               -- Ej: 'Censo', 'Encuesta', 'Registro Administrativo'
    source_ref VARCHAR(255) NULL,                -- URL o Documento Oficial
    reference_year INT NULL,                     -- Año de los datos
    update_date DATETIME NULL,                   -- Fecha de publicación oficial
    notes TEXT NULL
);

-- ---------------------------------------------------------------------
-- 3. CANONICAL LAYER (Tabla de Hechos Central)
-- ---------------------------------------------------------------------

-- Hechos Core: Estadísticas Planas (Flat Indicators)
CREATE TABLE fact_statistic (
    fact_id INT AUTO_INCREMENT PRIMARY KEY,
    territory_id INT NOT NULL,
    indicator_id INT NOT NULL,
    source_id INT NOT NULL,
    batch_id INT NULL,                           -- Trazabilidad al registro de ingesta
    period_year INT NULL,                        -- Año específico del corte transversal
    numeric_value DECIMAL(18, 4) NULL,           -- Valor estadístico escalar
    text_value VARCHAR(255) NULL,                -- Para variables categóricas o notas exóticas
    quality_flag VARCHAR(50) NULL,               -- 'oficial', 'estimado', 'provisional'
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (territory_id) REFERENCES dim_territory(territory_id),
    FOREIGN KEY (indicator_id) REFERENCES dim_indicator(indicator_id),
    FOREIGN KEY (source_id) REFERENCES dim_source(source_id),
    FOREIGN KEY (batch_id) REFERENCES raw_import_batch(batch_id)
);

-- Índices de rendimiento
CREATE INDEX idx_fact_territory ON fact_statistic(territory_id);
CREATE INDEX idx_fact_indicator ON fact_statistic(indicator_id);
CREATE INDEX idx_fact_period ON fact_statistic(period_year);

-- =====================================================================
-- NOTA DE EXTENSIBILIDAD PARA DATASETS COMPLEJOS (Breakdown / Slice)
-- Para indicadores anidados (ej. Educación por Nivel y Edad), se 
-- crearán DIMENSIONES SECUNDARIAS y tablas de hechos específicas en el futuro.
-- Ejemplo futuro:
-- CREATE TABLE dim_demographic_slice ( slice_id, sex, age_group );
-- CREATE TABLE fact_statistic_breakdown ( fact_id, slice_id, numeric_value );
-- =====================================================================
