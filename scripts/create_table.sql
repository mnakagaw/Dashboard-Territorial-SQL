-- =============================================================================
-- Dashboard Territorial — Phase 1: dataset_assets table
-- Canonical JSON asset store for municipal dashboard data.
-- Each row holds one JSON dataset (formerly a static .json file).
-- Designed for future normalization: asset_key becomes the migration anchor.
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'dataset_assets')
BEGIN
    CREATE TABLE dataset_assets (
        id              INT            IDENTITY(1,1) PRIMARY KEY,
        asset_key       NVARCHAR(100)  NOT NULL,          -- e.g. 'indicadores_basicos'
        version_no      INT            NOT NULL DEFAULT 1, -- incremented on update
        json_content    NVARCHAR(MAX)  NOT NULL,           -- raw JSON payload
        content_hash    CHAR(64)       NOT NULL,           -- SHA-256 of json_content
        source_name     NVARCHAR(200)  NULL,               -- original filename or source
        is_active       BIT            NOT NULL DEFAULT 1,  -- soft-delete / deactivation
        created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
        notes           NVARCHAR(500)  NULL                -- migration notes, etc.

        ,CONSTRAINT UQ_dataset_assets_key_version UNIQUE (asset_key, version_no)
    );

    -- Fast lookup by key + active flag (API hot path)
    CREATE INDEX IX_dataset_assets_key_active
        ON dataset_assets (asset_key, is_active)
        INCLUDE (json_content);

    PRINT 'Table [dataset_assets] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dataset_assets] already exists — skipping.';
END
GO

-- =============================================================================
-- Seed: GeoJSON metadata-only rows
-- The actual files remain as static assets (too large for NVARCHAR(MAX) column).
-- =============================================================================

-- adm2.json (~15 MB boundary GeoJSON equivalent)
IF NOT EXISTS (SELECT 1 FROM dataset_assets WHERE asset_key = 'adm2_json_meta')
BEGIN
    INSERT INTO dataset_assets (asset_key, version_no, json_content, content_hash, source_name, is_active, notes)
    VALUES (
        'adm2_json_meta',
        1,
        '{"type":"static_file","path":"/data/adm2.json","size_bytes":15385651,"format":"json"}',
        'metadata_only',
        'adm2.json',
        1,
        'Served as static file — 15 MB GeoJSON-equivalent. Not stored in SQL.'
    );
END

-- adm2.geojson (~596 KB)
IF NOT EXISTS (SELECT 1 FROM dataset_assets WHERE asset_key = 'adm2_geojson_meta')
BEGIN
    INSERT INTO dataset_assets (asset_key, version_no, json_content, content_hash, source_name, is_active, notes)
    VALUES (
        'adm2_geojson_meta',
        1,
        '{"type":"static_file","path":"/data/adm2.geojson","size_bytes":596186,"format":"geojson"}',
        'metadata_only',
        'adm2.geojson',
        1,
        'Served as static file — GeoJSON for Leaflet map layer.'
    );
END
GO

PRINT 'Seed data inserted.';
GO
