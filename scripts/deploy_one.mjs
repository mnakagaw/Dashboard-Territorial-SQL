/** Deploy the latest validated ONE build to https://prodecare.net/ONE/. */

import fs from 'node:fs';

process.env.DEPLOY_BUILD_DIR = fs.existsSync('.one-build-path')
    ? fs.readFileSync('.one-build-path', 'utf8').trim()
    : 'dist-one';
process.env.FTP_REMOTE_ROOT = '/public_html/prodecare.net/ONE';

await import('./deploy.mjs');
