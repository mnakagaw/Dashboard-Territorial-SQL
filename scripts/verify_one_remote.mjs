/** Verify that the deployed SQLite API matches all local delivery JSON. */

import fs from 'node:fs';
import crypto from 'node:crypto';

const apiUrl = 'https://prodecare.net/ONE/api/data.php';
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const noCache = { headers: { 'cache-control': 'no-cache' } };

const listResponse = await fetch(`${apiUrl}?t=${Date.now()}`, noCache);
if (!listResponse.ok) {
  throw new Error(`Dataset catalog returned HTTP ${listResponse.status}.`);
}
const datasets = await listResponse.json();

const checks = await Promise.all(datasets.map(async (row) => {
  const response = await fetch(
    `${apiUrl}?key=${encodeURIComponent(row.asset_key)}&t=${Date.now()}`,
    noCache,
  );
  const remoteBytes = Buffer.from(await response.arrayBuffer());
  const localBytes = fs.readFileSync(`public/data/${row.asset_key}.json`);
  let validJson = true;
  try {
    JSON.parse(remoteBytes.toString('utf8'));
  } catch {
    validJson = false;
  }
  const localHash = hash(localBytes);
  return {
    key: row.asset_key,
    status: response.status,
    validJson,
    hashMatch: hash(remoteBytes) === localHash,
    etagMatch: response.headers.get('etag') === `"${localHash}"`,
  };
}));

const failed = checks.filter((item) => (
  item.status !== 200
  || !item.validJson
  || !item.hashMatch
  || !item.etagMatch
));

const sample = datasets[0];
const conditional = await fetch(`${apiUrl}?key=${sample.asset_key}`, {
  headers: { 'if-none-match': `"${sample.content_hash}"` },
});

if (datasets.length !== 36 || failed.length > 0 || conditional.status !== 304) {
  console.error(JSON.stringify({ datasets: datasets.length, failed, conditional: conditional.status }, null, 2));
  process.exit(1);
}

console.log('Remote SQLite API verification OK: 36/36 datasets, hashes and ETags match.');
