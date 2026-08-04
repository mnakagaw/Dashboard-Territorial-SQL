-- Dashboard Territorial — SQLite development and handoff schema
-- This mirrors the canonical MariaDB / SQL Server model while keeping the
-- delivery-layer JSON contract used by the current React application.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS raw_import_batch (
    batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_name TEXT NOT NULL,
    source_filename TEXT NOT NULL,
    import_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'PROCESSING',
    records_total INTEGER NOT NULL DEFAULT 0,
    records_processed INTEGER NOT NULL DEFAULT 0,
    records_skipped INTEGER NOT NULL DEFAULT 0,
    records_errors INTEGER NOT NULL DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS dim_territory (
    territory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    territory_code TEXT NOT NULL UNIQUE,
    territory_name TEXT NOT NULL,
    territory_type TEXT NOT NULL CHECK (
        territory_type IN ('nacional', 'region', 'provincia', 'municipio')
    ),
    parent_territory_id INTEGER,
    region_oficial_ley345 TEXT,
    FOREIGN KEY (parent_territory_id) REFERENCES dim_territory(territory_id)
);

CREATE TABLE IF NOT EXISTS dim_domain (
    domain_id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain_code TEXT NOT NULL UNIQUE,
    domain_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dim_indicator (
    indicator_id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicator_code TEXT NOT NULL UNIQUE,
    indicator_name TEXT NOT NULL,
    domain_id INTEGER NOT NULL,
    unit TEXT,
    data_type TEXT NOT NULL DEFAULT 'numeric',
    aggregation_method TEXT,
    display_hints TEXT,
    FOREIGN KEY (domain_id) REFERENCES dim_domain(domain_id)
);

CREATE TABLE IF NOT EXISTS dim_source (
    source_id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_name TEXT NOT NULL,
    institution TEXT,
    source_type TEXT,
    source_ref TEXT,
    reference_year INTEGER,
    update_date TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS dim_breakdown (
    breakdown_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    UNIQUE (category, code)
);

INSERT OR IGNORE INTO dim_breakdown (breakdown_id, category, code, label)
VALUES (-1, 'none', 'total', 'Total / Flat');

CREATE TABLE IF NOT EXISTS fact_statistic (
    fact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    territory_id INTEGER NOT NULL,
    indicator_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
    batch_id INTEGER,
    period_year INTEGER NOT NULL DEFAULT 0,
    breakdown_id INTEGER NOT NULL DEFAULT -1,
    numeric_value NUMERIC,
    text_value TEXT,
    quality_flag TEXT NOT NULL DEFAULT 'oficial',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (
        territory_id,
        indicator_id,
        source_id,
        period_year,
        breakdown_id
    ),
    FOREIGN KEY (territory_id) REFERENCES dim_territory(territory_id),
    FOREIGN KEY (indicator_id) REFERENCES dim_indicator(indicator_id),
    FOREIGN KEY (source_id) REFERENCES dim_source(source_id),
    FOREIGN KEY (batch_id) REFERENCES raw_import_batch(batch_id),
    FOREIGN KEY (breakdown_id) REFERENCES dim_breakdown(breakdown_id)
);

CREATE INDEX IF NOT EXISTS idx_fact_territory
    ON fact_statistic (territory_id);
CREATE INDEX IF NOT EXISTS idx_fact_indicator
    ON fact_statistic (indicator_id);
CREATE INDEX IF NOT EXISTS idx_fact_period
    ON fact_statistic (period_year);
CREATE INDEX IF NOT EXISTS idx_fact_breakdown
    ON fact_statistic (breakdown_id);

CREATE TABLE IF NOT EXISTS dim_facility_type (
    type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS dim_facility (
    facility_id INTEGER PRIMARY KEY AUTOINCREMENT,
    territory_id INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    external_id TEXT,
    name TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    opening_year INTEGER,
    admin_region TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (territory_id) REFERENCES dim_territory(territory_id),
    FOREIGN KEY (type_id) REFERENCES dim_facility_type(type_id)
);

CREATE INDEX IF NOT EXISTS idx_facility_territory
    ON dim_facility (territory_id);

CREATE TABLE IF NOT EXISTS dataset_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_key TEXT NOT NULL,
    version_no INTEGER NOT NULL DEFAULT 1 CHECK (version_no > 0),
    json_content TEXT NOT NULL CHECK (json_valid(json_content)),
    content_hash TEXT NOT NULL CHECK (length(content_hash) = 64),
    content_type TEXT NOT NULL DEFAULT 'application/json',
    source_name TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE (asset_key, version_no)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_dataset_asset_active
    ON dataset_assets (asset_key)
    WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_asset_active
    ON dataset_assets (asset_key, is_active);
CREATE INDEX IF NOT EXISTS idx_content_hash
    ON dataset_assets (content_hash);

CREATE VIEW IF NOT EXISTS active_dataset_assets AS
SELECT
    asset_key,
    version_no,
    json_content,
    content_hash,
    content_type,
    source_name,
    updated_at,
    notes
FROM dataset_assets
WHERE is_active = 1;
