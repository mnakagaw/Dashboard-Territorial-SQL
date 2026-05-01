/**
 * db_init.js — Execute create_canonical_tables.sql via Node.js
 */
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  let mysql;
  try {
    mysql = await import("mysql2/promise");
    if (mysql.default) mysql = mysql.default;
  } catch {
    console.error("❌ mysql2 not found.");
    process.exit(1);
  }
  try { const d = await import("dotenv"); (d.default || d).config(); } catch {}

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "carapicha",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "carapicha_dbt",
    multipleStatements: true,
  });

  console.log("📂 Reading scripts/create_canonical_tables.sql...");
  const sql = await readFile(join(__dirname, "create_canonical_tables.sql"), "utf8");

  console.log("🚀 Executing SQL...");
  await conn.query(sql);

  console.log("✅ Schema initialized.");
  await conn.end();
}

main().catch(console.error);
