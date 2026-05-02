/**
 * import_json_to_mariadb.js
 *
 * Bulk-imports all dashboard JSON files from public/data/ into the
 * dataset_assets MariaDB table on CoreServer.
 *
 * Skips: adm2.json and adm2.geojson (static-file GeoJSON — metadata only).
 *
 * Prerequisites:
 *   npm install mysql2 dotenv
 *
 * Usage:
 *   node scripts/import_json_to_mariadb.js
 *
 * Environment variables (via .env or shell):
 *   DB_HOST     — e.g. localhost
 *   DB_NAME     — e.g. carapicha_dbt
 *   DB_USER     — e.g. carapicha
 *   DB_PASS     — database password
 *   DB_PORT     — optional, default 3306
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

function canonicalJsonContent(content) {
  return content
    .replaceAll("Sanchez Ramírez", "Sánchez Ramírez")
    .replaceAll("Sanchez Ramirez", "Sánchez Ramírez")
    .replaceAll("Sánchez Ramirez", "Sánchez Ramírez");
}

// ---- Main ----
async function main() {
  // Dynamic import so the script parses even if mysql2 isn't installed yet
  let mysql;
  try {
    mysql = await import("mysql2/promise");
    if (mysql.default) mysql = mysql.default;
  } catch {
    console.error(
      "❌  'mysql2' package not found. Install it first:\n    npm install mysql2 dotenv"
    );
    process.exit(1);
  }

  // Load .env if available
  try {
    const dotenv = await import("dotenv");
    (dotenv.default || dotenv).config();
  } catch {
    // dotenv is optional
  }

  // ---- Build connection config ----
  const config = {
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "carapicha_dbt",
    user: process.env.DB_USER || "carapicha",
    password: process.env.DB_PASS || "",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    charset: "utf8mb4",
  };

  console.log(`📡  Connecting to ${config.host}:${config.port} / ${config.database} ...`);
  const conn = await mysql.createConnection(config);
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
    const assetKey = basename(file, ".json");
    const filePath = join(DATA_DIR, file);
    const content = canonicalJsonContent(await readFile(filePath, "utf8"));
    const hash = sha256(content);

    // Check if row exists and hash matches
    const [rows] = await conn.execute(
      "SELECT id, content_hash, version_no FROM dataset_assets WHERE asset_key = ? AND is_active = 1",
      [assetKey]
    );

    if (rows.length > 0) {
      const row = rows[0];
      if (row.content_hash.trim() === hash) {
        console.log(`  ⏭  ${assetKey} — unchanged (hash match)`);
        skipped++;
        continue;
      }
      // Update existing row (bump version)
      const newVersion = row.version_no + 1;
      await conn.execute(
        `UPDATE dataset_assets
         SET json_content = ?, content_hash = ?, source_name = ?,
             version_no = ?, updated_at = NOW()
         WHERE asset_key = ? AND is_active = 1`,
        [content, hash, file, newVersion, assetKey]
      );
      console.log(`  🔄  ${assetKey} — updated to v${newVersion}`);
      updated++;
    } else {
      // Insert new row
      await conn.execute(
        `INSERT INTO dataset_assets
           (asset_key, version_no, json_content, content_hash, source_name, is_active)
         VALUES (?, 1, ?, ?, ?, 1)`,
        [assetKey, content, hash, file]
      );
      console.log(`  ✅  ${assetKey} — inserted (v1)`);
      inserted++;
    }
  }

  console.log(`\n🏁  Done. Inserted: ${inserted}  Updated: ${updated}  Skipped: ${skipped}`);
  await conn.end();
}

main().catch((err) => {
  console.error("💥  Import failed:", err);
  process.exit(1);
});
