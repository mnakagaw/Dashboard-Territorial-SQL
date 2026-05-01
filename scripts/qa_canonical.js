/**
 * qa_canonical.js — Comprehensive Canonical Data Audit (36 Datasets)
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
    database: process.env.DB_NAME || "carapicha_dbt",
    user: process.env.DB_USER || "carapicha",
    password: process.env.DB_PASS || "",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    charset: "utf8mb4",
  });
  console.log("🧐 Running Canonical Audit (36 Datasets)...\n");

  const tests = [
      { name: "Duplicate Records (Same Territory, Indicator, Year, Breakdown)",
        query: `SELECT territory_id, indicator_id, period_year, breakdown_id, count(*) as cnt 
                FROM fact_statistic 
                GROUP BY territory_id, indicator_id, period_year, breakdown_id 
                HAVING cnt > 1` },
      { name: "Orphan Indicators (Not in dim_indicator)",
        query: `SELECT count(*) as orphans FROM fact_statistic WHERE indicator_id NOT IN (SELECT indicator_id FROM dim_indicator)` },
      { name: "Orphan Territories (Not in dim_territory)",
        query: `SELECT count(*) as orphans FROM fact_statistic WHERE territory_id NOT IN (SELECT territory_id FROM dim_territory)` },
      { name: "Orphan Breakdowns (NotNull and not in dim_breakdown)",
        query: `SELECT count(*) as orphans FROM fact_statistic WHERE breakdown_id <> -1 AND breakdown_id NOT IN (SELECT breakdown_id FROM dim_breakdown)` },
      { name: "Null Indicator/Territory/Year",
        query: `SELECT count(*) as nulls FROM fact_statistic WHERE indicator_id IS NULL OR territory_id IS NULL OR period_year IS NULL` },
      { name: "Coverage Reach (Indicators used in fact_statistic)",
        query: `SELECT count(distinct indicator_id) as coverage FROM fact_statistic` },
      { name: "Territory Reach",
        query: `SELECT territory_type, count(distinct t.territory_id) as count
                FROM fact_statistic f JOIN dim_territory t ON f.territory_id = t.territory_id
                GROUP BY territory_type` }
  ];

  let pass = true;
  for (const t of tests) {
      console.log(`🔍 [TEST] ${t.name}...`);
      const [rows] = await conn.execute(t.query);
      if (t.name.includes("Coverage") || t.name.includes("Reach")) {
          console.table(rows);
      } else if (rows.length > 0 && (rows[0].cnt > 0 || rows[0].orphans > 0 || rows[0].nulls > 0)) {
          console.error(`   ❌ FAIL: Issues found!`);
          console.table(rows);
          pass = false;
      } else {
          console.log(`   ✅ PASS`);
      }
  }

  // Cross-Territory Audit
  console.log("\n🧪 [AUDIT] Provincial Totals vs Municipal Sums (Sample: dem_pop_total 2022)...");
  const [auditRows] = await conn.execute(`
    SELECT p.territory_name, p.territory_code, f_prov.numeric_value as prov_val, SUM(f_muni.numeric_value) as muni_sum
    FROM dim_territory p
    JOIN fact_statistic f_prov ON p.territory_id = f_prov.territory_id
    JOIN dim_indicator i ON f_prov.indicator_id = i.indicator_id
    JOIN dim_territory m ON m.parent_territory_id = p.territory_id
    JOIN fact_statistic f_muni ON m.territory_id = f_muni.territory_id AND f_muni.indicator_id = i.indicator_id
    WHERE i.indicator_code = 'dem_pop_total' AND p.territory_type = 'provincia' AND f_prov.period_year = 2022 AND f_muni.period_year = 2022 AND f_prov.breakdown_id = -1 AND f_muni.breakdown_id = -1
    GROUP BY p.territory_id, f_prov.numeric_value
  `);
  
  let mismatchCount = 0;
  for (const r of auditRows) {
      const diff = Math.abs(r.prov_val - r.muni_sum);
      if (diff > 10) { // Allowed small diff for rounding or source discrepancies
          console.warn(`   ⚠️  Mismatch in ${r.territory_name} (${r.territory_code}): Prov=${r.prov_val}, MuniSum=${r.muni_sum} (Diff: ${diff})`);
          mismatchCount++;
      }
  }
  if (mismatchCount === 0) console.log("   ✅ All Provincial totals match Municipal sums within tolerance.");

  console.log(`\n🏁 Audit Complete. Status: ${pass ? 'CLEAN' : 'DIRTY'}`);
  await conn.end();
}

main().catch(console.error);
