/**
 * import_json_to_sql.js
 *
 * Bulk-imports all dashboard JSON files from public/data/ into the
 * dataset_assets SQL Server table.
 *
 * Skips: adm2.json and adm2.geojson (static-file GeoJSON — metadata only).
 *
 * Prerequisites:
 *   npm install mssql dotenv
 *
 * Usage:
 *   node scripts/import_json_to_sql.js
 *
 * Environment variables (via .env or shell):
 *   SQL_SERVER   — e.g. localhost\SQLEXPRESS or tcp:myserver.database.windows.net,1433
 *   SQL_DATABASE — e.g. DashboardTerritorial
 *   SQL_USER     — SQL auth user  (omit for Windows auth)
 *   SQL_PASSWORD  — SQL auth password
 *   SQL_TRUST_CERT — set to 'true' for dev self-signed certs
 */

import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// ---- Resolve paths ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "public", "data");

// ---- Files to skip (served as static assets) ----
const SKIP_FILES = new Set(["adm2.json", "adm2.geojson"]);

// ---- SHA-256 helper ----
function sha256(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

// ---- Main ----
async function main() {
  // Dynamic import so the script still parses even if mssql isn't installed yet
  let sql;
  try {
    sql = await import("mssql");
    // Handle both ESM default export styles
    if (sql.default) sql = sql.default;
  } catch {
    console.error(
      "❌  'mssql' package not found. Install it first:\n    npm install mssql dotenv"
    );
    process.exit(1);
  }

  // Load .env if available
  try {
    const dotenv = await import("dotenv");
    (dotenv.default || dotenv).config();
  } catch {
    // dotenv is optional — env vars can come from shell
  }

  // ---- Build connection config ----
  const config = {
    server: process.env.SQL_SERVER || "localhost\\SQLEXPRESS",
    database: process.env.SQL_DATABASE || "DashboardTerritorial",
    options: {
      encrypt: false,
      trustServerCertificate:
        process.env.SQL_TRUST_CERT === "true" || true,
    },
  };

  if (process.env.SQL_USER) {
    config.user = process.env.SQL_USER;
    config.password = process.env.SQL_PASSWORD;
  } else {
    // Windows integrated auth
    config.options.trustedConnection = true;
  }

  console.log(
    `📡  Connecting to ${config.server} / ${config.database} ...`
  );
  const pool = await sql.connect(config);
  console.log("✅  Connected.\n");

  // ---- Enumerate JSON files ----
  const files = (await readdir(DATA_DIR))
    .filter((f) => f.endsWith(".json") && !SKIP_FILES.has(f))
    .sort();

  console.log(`📂  Found ${files.length} JSON files to import.\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const assetKey = basename(file, ".json"); // e.g. 'indicadores_basicos'
    const filePath = join(DATA_DIR, file);
    const content = await readFile(filePath, "utf8");
    const hash = sha256(content);

    // Check if row exists and hash matches
    const existing = await pool
      .request()
      .input("key", sql.NVarChar(100), assetKey)
      .query(
        "SELECT id, content_hash, version_no FROM dataset_assets WHERE asset_key = @key AND is_active = 1"
      );

    if (existing.recordset.length > 0) {
      const row = existing.recordset[0];
      if (row.content_hash === hash) {
        console.log(`  ⏭  ${assetKey} — unchanged (hash match)`);
        skipped++;
        continue;
      }
      // Update existing row (bump version)
      const newVersion = row.version_no + 1;
      await pool
        .request()
        .input("key", sql.NVarChar(100), assetKey)
        .input("json", sql.NVarChar(sql.MAX), content)
        .input("hash", sql.Char(64), hash)
        .input("source", sql.NVarChar(200), file)
        .input("version", sql.Int, newVersion)
        .query(`
          UPDATE dataset_assets
          SET json_content  = @json,
              content_hash  = @hash,
              source_name   = @source,
              version_no    = @version,
              updated_at    = GETDATE()
          WHERE asset_key   = @key AND is_active = 1
        `);
      console.log(`  🔄  ${assetKey} — updated to v${newVersion}`);
      updated++;
    } else {
      // Insert new row
      await pool
        .request()
        .input("key", sql.NVarChar(100), assetKey)
        .input("json", sql.NVarChar(sql.MAX), content)
        .input("hash", sql.Char(64), hash)
        .input("source", sql.NVarChar(200), file)
        .query(`
          INSERT INTO dataset_assets
            (asset_key, version_no, json_content, content_hash, source_name, is_active)
          VALUES
            (@key, 1, @json, @hash, @source, 1)
        `);
      console.log(`  ✅  ${assetKey} — inserted (v1)`);
      inserted++;
    }
  }

  console.log(`\n🏁  Done. Inserted: ${inserted}  Updated: ${updated}  Skipped: ${skipped}`);
  await pool.close();
}

main().catch((err) => {
  console.error("💥  Import failed:", err);
  process.exit(1);
});
