-- =============================================================================
-- Dashboard Territorial — Phase 1: dataset_assets table (MariaDB / MySQL)
-- Canonical JSON asset store for municipal dashboard data.
-- =============================================================================
-- NOTE: This is the MariaDB version for CoreServer.
-- See create_table.sql for the SQL Server version (ONE production).
-- =============================================================================

CREATE TABLE IF NOT EXISTS `dataset_assets` (
    `id`            BIGINT AUTO_INCREMENT PRIMARY KEY,
    `asset_key`     VARCHAR(100)   NOT NULL,            -- e.g. 'indicadores_basicos'
    `version_no`    INT            NOT NULL DEFAULT 1,   -- incremented on update
    `json_content`  LONGTEXT       NOT NULL,             -- raw JSON payload
    `content_hash`  VARCHAR(64)    NOT NULL,             -- SHA-256 of json_content
    `content_type`  VARCHAR(50)    NOT NULL DEFAULT 'application/json',
    `source_name`   VARCHAR(200)   DEFAULT NULL,         -- original filename or source
    `is_active`     TINYINT(1)     NOT NULL DEFAULT 1,   -- soft-delete / deactivation
    `created_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `notes`         TEXT           DEFAULT NULL,          -- migration notes, etc.

    UNIQUE KEY `uq_asset_version` (`asset_key`, `version_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fast lookup by key + active flag (API hot path)
CREATE INDEX `idx_asset_active` ON `dataset_assets` (`asset_key`, `is_active`);
CREATE INDEX `idx_content_hash` ON `dataset_assets` (`content_hash`);

-- =============================================================================
-- Seed: GeoJSON metadata-only rows
-- =============================================================================

INSERT IGNORE INTO `dataset_assets` (`asset_key`, `version_no`, `json_content`, `content_hash`, `source_name`, `is_active`, `notes`)
VALUES
    ('adm2_json_meta', 1,
     '{"type":"static_file","path":"/data/adm2.json","size_bytes":15890578,"format":"json"}',
     'metadata_only', 'adm2.json', 1,
     'Served as static file — 15 MB GeoJSON-equivalent. Not stored in DB.'),

    ('adm2_geojson_meta', 1,
     '{"type":"static_file","path":"/data/adm2.geojson","size_bytes":15890578,"format":"geojson"}',
     'metadata_only', 'adm2.geojson', 1,
     'Served as static file — GeoJSON for Leaflet map layer.');
