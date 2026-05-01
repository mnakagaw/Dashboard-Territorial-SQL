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
