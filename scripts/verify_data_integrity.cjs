const fs = require('fs');
const path = require('path');

console.log('CWD:', process.cwd());

const indexPath = path.join(process.cwd(), 'src/data/municipios_index.json');
const geoPath = path.join(process.cwd(), 'public/data/adm2.geojson');

console.log('Index Path:', indexPath);
console.log('Geo Path:', geoPath);

if (!fs.existsSync(indexPath)) {
    console.error('ERROR: Index file not found');
    process.exit(1);
}
if (!fs.existsSync(geoPath)) {
    console.error('ERROR: Geo file not found');
    process.exit(1);
}

try {
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

    console.log(`Index items: ${indexData.length}`);
    console.log(`GeoJSON features: ${geoData.features.length}`);

    const indexIds = new Set(indexData.map(m => m.adm2_code));
    const geoIds = new Set(geoData.features.map(f => f.properties.adm2_code));

    const missingInGeo = [...indexIds].filter(id => !geoIds.has(id));
    const missingInIndex = [...geoIds].filter(id => !indexIds.has(id));

    console.log('Missing in GeoJSON:', missingInGeo);
    console.log('Missing in Index:', missingInIndex);

    const geoTypes = new Set(geoData.features.map(f => typeof f.properties.adm2_code));
    const indexTypes = new Set(indexData.map(m => typeof m.adm2_code));

    console.log('GeoJSON adm2_code types:', [...geoTypes]);
    console.log('Index adm2_code types:', [...indexTypes]);

    if (missingInGeo.length || missingInIndex.length) {
        console.error('ERROR: Territory index and GeoJSON are not aligned.');
        process.exit(1);
    }

    console.log('Territory index and GeoJSON are aligned.');
} catch (e) {
    console.error('Error parsing files:', e);
    process.exit(1);
}
