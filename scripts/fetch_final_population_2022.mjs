/**
 * Build a machine-readable municipal population source for the final X Census.
 *
 * ONE's final report is the primary source. Its PDF is protected by a browser
 * challenge in some environments, so this script reads City Population's
 * municipality transcription, which explicitly attributes the final figures to
 * ONE, and checks the result against ONE's published national total.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_URL = "https://www.citypopulation.de/en/domrep/admin/";
const OFFICIAL_REPORT_URL = "https://www.one.gob.do/media/xebmyq12/informe-general-xcnpv.pdf";
const EXPECTED_MUNICIPALITIES = 158;
const EXPECTED_TOTAL = 10_773_983;

const asNumber = (value) => Number(String(value).replaceAll(",", ""));
const decodeHtml = (value) => String(value)
  .replaceAll("&aacute;", "á")
  .replaceAll("&eacute;", "é")
  .replaceAll("&iacute;", "í")
  .replaceAll("&oacute;", "ó")
  .replaceAll("&uacute;", "ú")
  .replaceAll("&ntilde;", "ñ")
  .replaceAll("&#241;", "ñ")
  .replaceAll("&amp;", "&")
  .replace(/<[^>]+>/g, "")
  .trim();

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "DashboardTerritorialONE data audit" },
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

function parseIndex(html) {
  const rows = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = match[1];
    if (!/<td class="rstatus">Municipality<\/td>/i.test(rowHtml)) continue;

    const code = rowHtml.match(/<td class="rname" id="i(\d{4})"/i)?.[1];
    const name = rowHtml.match(/<span itemprop="name">([\s\S]*?)<\/span>/i)?.[1];
    const populations = [...rowHtml.matchAll(/<td class="rpop">([\d,]+)<\/td>/gi)]
      .map((item) => asNumber(item[1]));
    const detailPath = rowHtml.match(/<a itemprop="url" href="([^"]+)"/i)?.[1];
    if (!code || !name || populations.length < 3 || !detailPath) {
      throw new Error(`Could not parse municipality row: ${rowHtml.slice(0, 240)}`);
    }

    rows.push({
      adm2_code: `${code.slice(0, 2)}0${code.slice(2)}`,
      municipio: decodeHtml(name),
      poblacion_total: populations.at(-1),
      transcription_url: new URL(detailPath, INDEX_URL).href,
    });
  }
  return rows;
}

function parseGender(html, row) {
  const section = html.match(/Gender \(C 2022\)[\s\S]*?<\/tbody>/i)?.[0];
  const male = section?.match(/<td>Males<\/td><td class="rpop">([\d,]+)<\/td>/i)?.[1];
  const female = section?.match(/<td>Females<\/td><td class="rpop">([\d,]+)<\/td>/i)?.[1];
  if (!male || !female) throw new Error(`Gender table missing for ${row.adm2_code}`);
  return {
    ...row,
    poblacion_hombres: asNumber(male),
    poblacion_mujeres: asNumber(female),
  };
}

async function mapConcurrent(values, concurrency, mapper) {
  const result = new Array(values.length);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= values.length) return;
      result[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return result;
}

const indexHtml = await fetchText(INDEX_URL);
const municipalities = parseIndex(indexHtml);
if (municipalities.length !== EXPECTED_MUNICIPALITIES) {
  throw new Error(`Expected ${EXPECTED_MUNICIPALITIES} municipalities, found ${municipalities.length}`);
}

const records = await mapConcurrent(municipalities, 12, async (row) => {
  const html = await fetchText(row.transcription_url);
  return parseGender(html, row);
});

for (const row of records) {
  if (row.poblacion_hombres + row.poblacion_mujeres !== row.poblacion_total) {
    throw new Error(`Sex totals do not match population for ${row.adm2_code}`);
  }
}

const nationalTotal = records.reduce((sum, row) => sum + row.poblacion_total, 0);
if (nationalTotal !== EXPECTED_TOTAL) {
  throw new Error(`Expected national total ${EXPECTED_TOTAL}, found ${nationalTotal}`);
}

records.sort((a, b) => a.adm2_code.localeCompare(b.adm2_code));
const output = {
  source: {
    primary: OFFICIAL_REPORT_URL,
    transcription: INDEX_URL,
    note: "Final 2022 census figures transcribed by City Population and attributed there to ONE.",
  },
  national_total: nationalTotal,
  municipalities: records,
};

const outputPath = path.join(
  ROOT,
  "data_sources",
  "official",
  "final_population_2022_municipalities.json",
);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${records.length} final municipality records to ${outputPath}`);
