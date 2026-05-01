const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'src/data/municipios_index.json');
const geoPath = path.join(process.cwd(), 'public/data/adm2.geojson');

if (!fs.existsSync(indexPath) || !fs.existsSync(geoPath)) {
    console.error('Files not found');
    process.exit(1);
}

const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

const indexProvinces = {};
indexData.forEach(m => {
    indexProvinces[m.adm2_code] = m.provincia;
});

const geoProvinces = {};
geoData.features.forEach(f => {
    geoProvinces[f.properties.adm2_code] = f.properties.provincia;
});

const mismatches = [];
const allCodes = new Set([...Object.keys(indexProvinces), ...Object.keys(geoProvinces)]);

allCodes.forEach(code => {
    const p1 = indexProvinces[code];
    const p2 = geoProvinces[code];
    if (p1 && p2 && p1 !== p2) {
        mismatches.push({ code, index: p1, geo: p2 });
    }
});

console.log('Total codes checked:', allCodes.size);
console.log('Mismatches found:', mismatches.length);

if (mismatches.length > 0) {
    console.log('First 5 mismatches:', mismatches.slice(0, 5));
    process.exit(1);
}

console.log('No province name mismatches found.');
