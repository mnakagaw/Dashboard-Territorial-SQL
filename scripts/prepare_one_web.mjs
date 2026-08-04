/**
 * Create the FTP-ready ONE build without server-side administration scripts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'dist');
const buildName = `dist-one-sqlite-${Date.now()}`;
const destination = path.join(root, buildName);
const sqliteApiSource = path.join(root, 'server', 'php-sqlite');
const staticDataFiles = new Set([
  'data/adm2.json',
  'data/adm2.geojson',
  'data/regions_index.json',
]);

if (!fs.existsSync(path.join(source, 'index.html'))) {
  throw new Error('dist/index.html not found. Build the ONE mode first.');
}

fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, {
  recursive: true,
  filter: (sourcePath) => {
    const relative = path.relative(source, sourcePath).split(path.sep).join('/');
    if (relative === 'api' || relative.startsWith('api/')) return false;
    if (relative === 'old' || relative.startsWith('old/')) return false;
    if (relative === 'data' || relative === '') return true;
    if (relative.startsWith('data/')) return staticDataFiles.has(relative);
    return true;
  },
});

const sqliteApiDestination = path.join(destination, 'api');
fs.mkdirSync(sqliteApiDestination, { recursive: true });
for (const filename of ['data.php', '.htaccess', '.user.ini']) {
  fs.copyFileSync(
    path.join(sqliteApiSource, filename),
    path.join(sqliteApiDestination, filename),
  );
}
fs.writeFileSync(path.join(root, '.one-build-path'), buildName, 'utf8');

console.log(`ONE web package ready: ${destination}`);
