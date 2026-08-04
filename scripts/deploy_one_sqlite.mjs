/**
 * Atomically upload the SQLite database, stage the read-only PHP API, verify
 * the API, and then publish the ONE frontend.
 */

import 'dotenv/config';
import * as ftp from 'basic-ftp';
import fs from 'node:fs';
import path from 'node:path';

const client = new ftp.Client();
const preparedBuild = fs.readFileSync('.one-build-path', 'utf8').trim();
const localDatabase = path.resolve('sqlite', 'dashboard_territorial.sqlite3');
const localApi = path.resolve(preparedBuild, 'api', 'data.php');
const remoteDatabaseDir = '/sqlite_data';
const remoteDatabase = `${remoteDatabaseDir}/dashboard_territorial.sqlite3`;
const remoteTemporary = `${remoteDatabase}.uploading`;
const remoteApiDir = '/public_html/prodecare.net/ONE/api';
const remoteApi = `${remoteApiDir}/data.php`;

if (!fs.existsSync(localDatabase) || !fs.existsSync(localApi)) {
  throw new Error('SQLite database or prepared ONE API is missing.');
}

async function remoteFileExists(directory, filename) {
  const entries = await client.list(directory);
  return entries.some((entry) => entry.name === filename && entry.type === 1);
}

async function tryChmod(mode, target) {
  try {
    await client.send(`SITE CHMOD ${mode} ${target}`);
  } catch {
    console.warn(`Warning: server did not accept CHMOD ${mode} for ${target}.`);
  }
}

try {
  await client.access({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    secure: false,
  });

  await client.ensureDir(remoteDatabaseDir);
  await tryChmod('700', remoteDatabaseDir);
  if (await remoteFileExists(remoteDatabaseDir, path.basename(remoteTemporary))) {
    await client.remove(remoteTemporary);
  }
  await client.uploadFrom(localDatabase, remoteTemporary);
  await tryChmod('600', remoteTemporary);

  const localSize = fs.statSync(localDatabase).size;
  const uploadedSize = await client.size(remoteTemporary);
  if (localSize !== uploadedSize) {
    throw new Error(`SQLite upload size mismatch (${localSize} != ${uploadedSize}).`);
  }

  if (await remoteFileExists(remoteDatabaseDir, path.basename(remoteDatabase))) {
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    await client.rename(remoteDatabase, `${remoteDatabase}.backup-${stamp}`);
  }
  await client.rename(remoteTemporary, remoteDatabase);
  await tryChmod('600', remoteDatabase);

  await client.ensureDir(remoteApiDir);
  await client.uploadFrom(localApi, remoteApi);
  await client.uploadFrom(
    path.resolve(preparedBuild, 'api', '.htaccess'),
    `${remoteApiDir}/.htaccess`,
  );
  await client.uploadFrom(
    path.resolve(preparedBuild, 'api', '.user.ini'),
    `${remoteApiDir}/.user.ini`,
  );
} finally {
  client.close();
}

const apiUrl = `https://prodecare.net/ONE/api/data.php?t=${Date.now()}`;
const response = await fetch(apiUrl, { headers: { 'cache-control': 'no-cache' } });
if (!response.ok) {
  throw new Error(`SQLite API preflight failed with HTTP ${response.status}.`);
}
const datasets = await response.json();
if (!Array.isArray(datasets) || datasets.length !== 36) {
  throw new Error(`SQLite API returned ${datasets.length ?? 'invalid'} datasets; expected 36.`);
}

console.log('SQLite database and read-only API verified.');
await import('./deploy_one.mjs');

// Remove obsolete public copies of statistical datasets. The two map files
// and the region index intentionally remain static because map components load
// them directly; all other statistics must come from SQLite.
const cleanupClient = new ftp.Client();
const remoteDataDir = '/public_html/prodecare.net/ONE/data';
const keepStatic = new Set(['adm2.json', 'adm2.geojson', 'regions_index.json']);
try {
  await cleanupClient.access({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    secure: false,
  });
  const entries = await cleanupClient.list(remoteDataDir);
  for (const entry of entries) {
    if (entry.type === 1 && entry.name.endsWith('.json') && !keepStatic.has(entry.name)) {
      await cleanupClient.remove(`${remoteDataDir}/${entry.name}`);
    }
  }
} finally {
  cleanupClient.close();
}

console.log('Obsolete public JSON copies removed; SQLite is authoritative.');
