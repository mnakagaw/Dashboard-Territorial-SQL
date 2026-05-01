-- =====================================================================
-- Dashboard Territorial - Phase 2: Canonical Schema
-- Motor: MariaDB (compatible con SQL Server con ajustes mínimos)
-- Versión: 2.0 — Canonical Completion Package
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RAW / STAGING LAYER
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_import_batch (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_name VARCHAR(255) NOT NULL,
    source_filename VARCHAR(255) NOT NULL,
    import_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PROCESSING',
    records_total INT DEFAULT 0,
    records_processed INT DEFAULT 0,
    records_skipped INT DEFAULT 0,
    records_errors INT DEFAULT 0,
    notes TEXT
);

-- ---------------------------------------------------------------------
-- 2. DIMENSION TABLES
-- ---------------------------------------------------------------------

-- Territorio (jerarquía recursiva: nacional > región > provincia > municipio)
CREATE TABLE IF NOT EXISTS dim_territory (
    territory_id INT AUTO_INCREMENT PRIMARY KEY,
    territory_code VARCHAR(50) NOT NULL UNIQUE,
    territory_name VARCHAR(100) NOT NULL,
    territory_type VARCHAR(50) NOT NULL,
    parent_territory_id INT NULL,
    region_oficial_ley345 VARCHAR(100) NULL,
    FOREIGN KEY (parent_territory_id) REFERENCES dim_territory(territory_id)
);

-- Dominios temáticos
CREATE TABLE IF NOT EXISTS dim_domain (
    domain_id INT AUTO_INCREMENT PRIMARY KEY,
    domain_code VARCHAR(50) NOT NULL UNIQUE,
    domain_name VARCHAR(100) NOT NULL
);

-- Indicadores
CREATE TABLE IF NOT EXISTS dim_indicator (
    indicator_id INT AUTO_INCREMENT PRIMARY KEY,
    indicator_code VARCHAR(100) NOT NULL UNIQUE,
    indicator_name VARCHAR(255) NOT NULL,
    domain_id INT NOT NULL,
    unit VARCHAR(50) NULL,
    data_type VARCHAR(50) DEFAULT 'numeric',
    aggregation_method VARCHAR(50) NULL,
    display_hints VARCHAR(255) NULL,
    FOREIGN KEY (domain_id) REFERENCES dim_domain(domain_id)
);

-- Fuentes
CREATE TABLE IF NOT EXISTS dim_source (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    institution VARCHAR(100) NULL,
    source_type VARCHAR(100) NULL,
    source_ref VARCHAR(255) NULL,
    reference_year INT NULL,
    update_date DATETIME NULL,
    notes TEXT NULL
);

-- ---------------------------------------------------------------------
-- 3. BREAKDOWN DIMENSION
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_breakdown (
    breakdown_id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    code VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_breakdown (category, code)
);

-- Insert DEFAULT breakdown for flat indicators to solve NULL unique constraint issue
INSERT IGNORE INTO dim_breakdown (breakdown_id, category, code, label) VALUES (-1, 'none', 'total', 'Total / Flat');

-- ---------------------------------------------------------------------
-- 4. FACT TABLE (con UNIQUE CONSTRAINT para upsert seguro)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_statistic (
    fact_id INT AUTO_INCREMENT PRIMARY KEY,
    territory_id INT NOT NULL,
    indicator_id INT NOT NULL,
    source_id INT NOT NULL,
    batch_id INT NULL,
    period_year INT NOT NULL DEFAULT 0,
    breakdown_id INT NOT NULL DEFAULT -1,
    numeric_value DECIMAL(18, 4) NULL,
    text_value VARCHAR(255) NULL,
    quality_flag VARCHAR(50) DEFAULT 'oficial',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fact (territory_id, indicator_id, source_id, period_year, breakdown_id),
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

-- ---------------------------------------------------------------------
-- 5. ENTITY MODEL (Instalaciones Físicas)
-- ---------------------------------------------------------------------

-- Tipos de Instalación
CREATE TABLE IF NOT EXISTS dim_facility_type (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE
);

-- Instalaciones (Entities)
CREATE TABLE IF NOT EXISTS dim_facility (
    facility_id INT AUTO_INCREMENT PRIMARY KEY,
    territory_id INT NOT NULL,
    type_id INT NOT NULL,
    external_id VARCHAR(50) NULL,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    opening_year INT NULL,
    admin_region VARCHAR(100) NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (territory_id) REFERENCES dim_territory(territory_id),
    FOREIGN KEY (type_id) REFERENCES dim_facility_type(type_id)
);

CREATE INDEX idx_facility_territory ON dim_facility(territory_id);

-- ---------------------------------------------------------------------
-- 6. DELIVERY LAYER (dataset_assets)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dataset_assets (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_key     VARCHAR(100)   NOT NULL,
    version_no    INT            NOT NULL DEFAULT 1,
    json_content  LONGTEXT       NOT NULL,
    content_hash  VARCHAR(64)    NOT NULL,
    content_type  VARCHAR(50)    NOT NULL DEFAULT 'application/json',
    source_name   VARCHAR(200)   DEFAULT NULL,
    is_active     TINYINT(1)     NOT NULL DEFAULT 1,
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notes         TEXT           DEFAULT NULL,
    UNIQUE KEY uq_asset_version (asset_key, version_no)
);
CREATE INDEX idx_asset_active ON dataset_assets (asset_key, is_active);
CREATE INDEX idx_content_hash ON dataset_assets (content_hash);
