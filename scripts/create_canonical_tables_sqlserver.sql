-- =====================================================================
-- Dashboard Territorial - Phase 2: Canonical Schema
-- Motor: SQL Server (Transact-SQL)
-- Versión: 2.0 — Canonical Completion Package
-- =====================================================================

-- 1. RAW / STAGING LAYER
IF OBJECT_ID('raw_import_batch', 'U') IS NULL
CREATE TABLE raw_import_batch (
    batch_id INT IDENTITY(1,1) PRIMARY KEY,
    batch_name NVARCHAR(255) NOT NULL,
    source_filename NVARCHAR(255) NOT NULL,
    import_date DATETIME2 DEFAULT GETDATE(),
    status NVARCHAR(50) DEFAULT 'PROCESSING',
    records_total INT DEFAULT 0,
    records_processed INT DEFAULT 0,
    records_skipped INT DEFAULT 0,
    records_errors INT DEFAULT 0,
    notes NVARCHAR(MAX)
);

-- 2. DIMENSION TABLES
IF OBJECT_ID('dim_territory', 'U') IS NULL
CREATE TABLE dim_territory (
    territory_id INT IDENTITY(1,1) PRIMARY KEY,
    territory_code NVARCHAR(50) NOT NULL UNIQUE,
    territory_name NVARCHAR(100) NOT NULL,
    territory_type NVARCHAR(50) NOT NULL,
    parent_territory_id INT NULL,
    region_oficial_ley345 NVARCHAR(100) NULL,
    FOREIGN KEY (parent_territory_id) REFERENCES dim_territory(territory_id)
);

IF OBJECT_ID('dim_domain', 'U') IS NULL
CREATE TABLE dim_domain (
    domain_id INT IDENTITY(1,1) PRIMARY KEY,
    domain_code NVARCHAR(50) NOT NULL UNIQUE,
    domain_name NVARCHAR(100) NOT NULL
);

IF OBJECT_ID('dim_indicator', 'U') IS NULL
CREATE TABLE dim_indicator (
    indicator_id INT IDENTITY(1,1) PRIMARY KEY,
    indicator_code NVARCHAR(100) NOT NULL UNIQUE,
    indicator_name NVARCHAR(255) NOT NULL,
    domain_id INT NOT NULL,
    unit NVARCHAR(50) NULL,
    data_type NVARCHAR(50) DEFAULT 'numeric',
    aggregation_method NVARCHAR(50) NULL,
    display_hints NVARCHAR(255) NULL,
    FOREIGN KEY (domain_id) REFERENCES dim_domain(domain_id)
);

IF OBJECT_ID('dim_source', 'U') IS NULL
CREATE TABLE dim_source (
    source_id INT IDENTITY(1,1) PRIMARY KEY,
    source_name NVARCHAR(255) NOT NULL,
    institution NVARCHAR(100) NULL,
    source_type NVARCHAR(100) NULL,
    source_ref NVARCHAR(255) NULL,
    reference_year INT NULL,
    update_date DATETIME2 NULL,
    notes NVARCHAR(MAX) NULL
);

-- 3. BREAKDOWN DIMENSION
IF OBJECT_ID('dim_breakdown', 'U') IS NULL
CREATE TABLE dim_breakdown (
    breakdown_id INT IDENTITY(1,1) PRIMARY KEY,
    category NVARCHAR(50) NOT NULL,
    code NVARCHAR(100) NOT NULL,
    label NVARCHAR(255) NOT NULL,
    CONSTRAINT uq_breakdown UNIQUE (category, code)
);

-- 4. FACT TABLE
IF OBJECT_ID('fact_statistic', 'U') IS NULL
CREATE TABLE fact_statistic (
    fact_id INT IDENTITY(1,1) PRIMARY KEY,
    territory_id INT NOT NULL,
    indicator_id INT NOT NULL,
    source_id INT NOT NULL,
    batch_id INT NULL,
    period_year INT NOT NULL DEFAULT 0,
    breakdown_id INT NOT NULL DEFAULT -1,
    numeric_value DECIMAL(18, 4) NULL,
    text_value NVARCHAR(255) NULL,
    quality_flag NVARCHAR(50) DEFAULT 'oficial',
    updated_at DATETIME2 DEFAULT GETDATE(),
    -- En SQL Server, para permitir multiples NULLs en un UNIQUE INDEX, 
    -- se puede usar un índice filtrado en lugar de CONSTRAINT UNIQUE,
    -- o asegurar que el valor por defecto de breakdown_id sea 0 en lugar de NULL.
    -- Aquí usamos CONSTRAINT UNIQUE asumiendo que insertaremos un valor 0 (o "N/A" row) 
    -- en dim_breakdown para los "totales".
    CONSTRAINT uq_fact UNIQUE (territory_id, indicator_id, source_id, period_year, breakdown_id),
    FOREIGN KEY (territory_id) REFERENCES dim_territory(territory_id),
    FOREIGN KEY (indicator_id) REFERENCES dim_indicator(indicator_id),
    FOREIGN KEY (source_id) REFERENCES dim_source(source_id),
    FOREIGN KEY (batch_id) REFERENCES raw_import_batch(batch_id),
    FOREIGN KEY (breakdown_id) REFERENCES dim_breakdown(breakdown_id)
);

CREATE INDEX idx_fact_territory ON fact_statistic(territory_id);
CREATE INDEX idx_fact_indicator ON fact_statistic(indicator_id);
CREATE INDEX idx_fact_period ON fact_statistic(period_year);
CREATE INDEX idx_fact_breakdown ON fact_statistic(breakdown_id);

-- 5. ENTITY MODEL (Instalaciones Físicas)
IF OBJECT_ID('dim_facility_type', 'U') IS NULL
CREATE TABLE dim_facility_type (
    type_id INT IDENTITY(1,1) PRIMARY KEY,
    type_name NVARCHAR(100) NOT NULL UNIQUE
);

IF OBJECT_ID('dim_facility', 'U') IS NULL
CREATE TABLE dim_facility (
    facility_id INT IDENTITY(1,1) PRIMARY KEY,
    territory_id INT NOT NULL,
    type_id INT NOT NULL,
    external_id NVARCHAR(50) NULL,
    name NVARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    opening_year INT NULL,
    admin_region NVARCHAR(100) NULL,
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (territory_id) REFERENCES dim_territory(territory_id),
    FOREIGN KEY (type_id) REFERENCES dim_facility_type(type_id)
);
CREATE INDEX idx_facility_territory ON dim_facility(territory_id);
GO

-- ---------------------------------------------------------------------
-- 6. DELIVERY LAYER (dataset_assets)
-- ---------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'dataset_assets')
BEGIN
    CREATE TABLE dataset_assets (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        asset_key     NVARCHAR(100)   NOT NULL,
        version_no    INT            NOT NULL DEFAULT 1,
        json_content  NVARCHAR(MAX)  NOT NULL,
        content_hash  NVARCHAR(64)   NOT NULL,
        content_type  NVARCHAR(50)   NOT NULL DEFAULT 'application/json',
        source_name   NVARCHAR(200)  NULL,
        is_active     BIT            NOT NULL DEFAULT 1,
        created_at    DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
        updated_at    DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
        notes         NVARCHAR(MAX)  NULL,
        CONSTRAINT uq_asset_version UNIQUE (asset_key, version_no)
    );
    CREATE INDEX idx_asset_active ON dataset_assets (asset_key, is_active);
    CREATE INDEX idx_content_hash ON dataset_assets (content_hash);
END;
GO

-- =====================================================================
-- DELIVERY: Regenerar dataset_assets desde canonical
-- =====================================================================
-- Ejemplo: Regenerar 'indicadores_basicos' como JSON desde fact_statistic
--
-- UPDATE dataset_assets
-- SET json_content = (
--   SELECT t.territory_code AS adm2_code,
--          t.territory_name AS municipio,
--          p.territory_name AS provincia,
--          t.region_oficial_ley345 AS region,
--          MAX(CASE WHEN i.indicator_code='dem_pop_total' THEN f.numeric_value END) AS poblacion_total,
--          MAX(CASE WHEN i.indicator_code='dem_pop_male_2022' THEN f.numeric_value END) AS poblacion_hombres,
--          MAX(CASE WHEN i.indicator_code='dem_pop_female_2022' THEN f.numeric_value END) AS poblacion_mujeres,
--          MAX(CASE WHEN i.indicator_code='dem_viv_total' THEN f.numeric_value END) AS viviendas_total,
--          MAX(CASE WHEN i.indicator_code='dem_viv_ocup' THEN f.numeric_value END) AS viviendas_ocupadas,
--          MAX(CASE WHEN i.indicator_code='dem_viv_desocup' THEN f.numeric_value END) AS viviendas_desocupadas,
--          MAX(CASE WHEN i.indicator_code='dem_pop_total_2010' THEN f.numeric_value END) AS poblacion_2010,
--          MAX(CASE WHEN i.indicator_code='dem_pop_var_abs' THEN f.numeric_value END) AS variacion_abs,
--          MAX(CASE WHEN i.indicator_code='dem_pop_var_pct' THEN f.numeric_value END) AS variacion_pct
--   FROM fact_statistic f
--   JOIN dim_territory t ON f.territory_id = t.territory_id
--   JOIN dim_territory p ON t.parent_territory_id = p.territory_id
--   JOIN dim_indicator i ON f.indicator_id = i.indicator_id
--   WHERE t.territory_type = 'municipio'
--     AND i.domain_id = (SELECT domain_id FROM dim_domain WHERE domain_code='demography')
--   GROUP BY t.territory_code, t.territory_name, p.territory_name, t.region_oficial_ley345
--   FOR JSON PATH
-- ),
-- version_no = version_no + 1, updated_at = GETDATE()
-- WHERE asset_key = 'indicadores_basicos';
-- =====================================================================
