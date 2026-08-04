const fs = require('fs');
const path = require('path');

console.log('CWD:', process.cwd());

const indexPath = path.join(process.cwd(), 'src/data/municipios_index.json');
const geoPath = path.join(process.cwd(), 'public/data/adm2.geojson');
const publicDataPath = path.join(process.cwd(), 'public/data');
const sourceDataPath = path.join(process.cwd(), 'src/data');

function assertCondition(condition, message) {
    if (!condition) throw new Error(message);
}

function readPublic(filename) {
    return JSON.parse(fs.readFileSync(path.join(publicDataPath, filename), 'utf8'));
}

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

    const pyramid2010Files = [
        'edad_sexo_2010.json',
        'edad_sexo_2010_provincia.json',
    ];

    for (const filename of pyramid2010Files) {
        const publicData = readPublic(filename);
        const sourceData = JSON.parse(fs.readFileSync(path.join(sourceDataPath, filename), 'utf8'));

        if (JSON.stringify(publicData) !== JSON.stringify(sourceData)) {
            console.error(`ERROR: public/data/${filename} differs from src/data/${filename}.`);
            process.exit(1);
        }
    }

    const pyramid2010 = readPublic('edad_sexo_2010.json');
    const pyramidKeys = new Set();
    const duplicatePyramidKeys = [];

    for (const row of pyramid2010) {
        const key = `${row.adm2_code}|${row.age_group}`;
        if (pyramidKeys.has(key)) duplicatePyramidKeys.push(key);
        pyramidKeys.add(key);
    }

    if (duplicatePyramidKeys.length) {
        console.error(
            `ERROR: Duplicate 2010 pyramid rows: ${[...new Set(duplicatePyramidKeys)].join(', ')}`
        );
        process.exit(1);
    }

    const auditedFiles = [
        'indicadores_basicos.json',
        'national_basic.json',
        'educacion_nivel.json',
        'educacion_nivel_provincia.json',
        'national_educacion_nivel.json',
        'tic.json',
        'tic_provincia.json',
        'national_tic.json',
        'national_hogares.json',
        'educacion_oferta_municipal_provincia.json',
        'national_educacion_oferta.json',
        'salud_establecimientos.json',
        'salud_establecimientos_provincia.json',
        'national_salud_establecimientos.json',
    ];

    for (const filename of auditedFiles) {
        const publicData = readPublic(filename);
        const sourceData = JSON.parse(fs.readFileSync(path.join(sourceDataPath, filename), 'utf8'));
        assertCondition(
            JSON.stringify(publicData) === JSON.stringify(sourceData),
            `public/data/${filename} differs from src/data/${filename}.`
        );
    }

    const pyramidTotal = pyramid2010.reduce(
        (sum, row) => sum + (row.male || 0) + (row.female || 0),
        0
    );
    const pedroBrandTotal = pyramid2010
        .filter((row) => /Pedro Brand/i.test(row.municipio || ''))
        .reduce((sum, row) => sum + (row.male || 0) + (row.female || 0), 0);
    assertCondition(pyramidTotal === 9_250_163, `2010 pyramid total is ${pyramidTotal}, expected 9,250,163.`);
    assertCondition(pedroBrandTotal === 72_306, `Pedro Brand 2010 pyramid total is ${pedroBrandTotal}, expected 72,306.`);

    const indicators = readPublic('indicadores_basicos.json');
    const nationalBasic = readPublic('national_basic.json');
    const populationTotal = indicators.reduce((sum, row) => sum + (row.poblacion_total || 0), 0);
    const populationMen = indicators.reduce((sum, row) => sum + (row.poblacion_hombres || 0), 0);
    const populationWomen = indicators.reduce((sum, row) => sum + (row.poblacion_mujeres || 0), 0);
    const samana = indicators.find((row) => row.adm2_code === '20001');
    assertCondition(indicators.length === 158, `Expected 158 basic-indicator rows, found ${indicators.length}.`);
    assertCondition(populationTotal === 10_773_983, `2022 population total is ${populationTotal}, expected 10,773,983.`);
    assertCondition(populationMen + populationWomen === populationTotal, '2022 male/female totals do not equal population total.');
    assertCondition(nationalBasic.poblacion_total === populationTotal, 'national_basic population differs from municipality sum.');
    assertCondition(samana?.poblacion_total === 63_359, `Samaná population is ${samana?.poblacion_total}, expected 63,359.`);

    const education = readPublic('educacion_nivel.json');
    const educationProvinces = readPublic('educacion_nivel_provincia.json');
    const nationalEducation = readPublic('national_educacion_nivel.json');
    const educationCodes = new Set(education.map((row) => row.adm2_code));
    const expectedCodes = new Set(indexData.map((row) => row.adm2_code));
    const educationMissing = [...expectedCodes].filter((code) => !educationCodes.has(code));
    const levelKeys = ['ninguno', 'preprimaria', 'primaria', 'secundaria', 'superior'];
    const sumEducation = (rows) => rows.reduce(
        (sum, row) => sum + levelKeys.reduce((subtotal, key) => subtotal + (row.nivel?.[key]?.total || 0), 0),
        0
    );
    assertCondition(education.length === 158 && educationCodes.size === 158, 'Education-level data must have one unique row per municipality.');
    assertCondition(educationMissing.length === 0, `Education-level municipalities missing: ${educationMissing.join(', ')}.`);
    assertCondition(educationProvinces.length === 32, `Expected 32 education provinces, found ${educationProvinces.length}.`);
    assertCondition(sumEducation(educationProvinces) === nationalEducation.poblacion_3_mas, 'Education province sum differs from national total.');

    const tic = readPublic('tic.json');
    const ticProvinces = readPublic('tic_provincia.json');
    const nationalTic = readPublic('national_tic.json');
    const ticCodes = new Set(tic.map((row) => String(row.adm2_code).padStart(5, '0')));
    assertCondition(tic.length === 158 && ticCodes.size === 158, 'TIC data must have one unique row per municipality.');
    assertCondition(ticCodes.has('01001'), 'TIC data is missing Distrito Nacional.');
    assertCondition(ticProvinces.length === 32, `Expected 32 TIC provinces, found ${ticProvinces.length}.`);
    assertCondition(tic.some((row) => row.internet?.used !== row.cellular?.used), 'Internet and smartphone values are still duplicated.');
    for (const field of ['internet', 'cellular', 'computer']) {
        const total = ticProvinces.reduce((sum, row) => sum + (row[field]?.total || 0), 0);
        const used = ticProvinces.reduce((sum, row) => sum + (row[field]?.used || 0), 0);
        assertCondition(total === nationalTic[field].total, `${field} province denominator differs from national value.`);
        assertCondition(used === nationalTic[field].used, `${field} province numerator differs from national value.`);
    }

    const nationalHouseholds = readPublic('national_hogares.json');
    assertCondition(nationalHouseholds.hogares_total === 3_726_048, 'National household count must be 3,726,048.');
    assertCondition(
        Math.abs(nationalHouseholds.personas_por_hogar - (10_723_451 / 3_726_048)) < 1e-12,
        'National persons-per-household ratio is inconsistent.'
    );

    const educationOffers = readPublic('educacion_oferta_municipal.json');
    const educationOfferProvinces = readPublic('educacion_oferta_municipal_provincia.json');
    const nationalEducationOffer = readPublic('national_educacion_oferta.json');
    const municipalOfferTotal = educationOffers.reduce((sum, row) => sum + (row.centros_total || 0), 0);
    const provinceOfferTotal = educationOfferProvinces.reduce((sum, row) => sum + (row.centros_total || 0), 0);
    assertCondition(nationalEducationOffer.centros_total === municipalOfferTotal, 'National education-offer total differs from municipalities.');
    assertCondition(provinceOfferTotal === municipalOfferTotal, 'Education-offer province total differs from municipalities.');

    const health = readPublic('salud_establecimientos.json');
    const healthProvinces = readPublic('salud_establecimientos_provincia.json');
    const nationalHealth = readPublic('national_salud_establecimientos.json');
    const municipalHealthTotal = Object.values(health).reduce((sum, row) => sum + (row.centros?.length || 0), 0);
    const provinceHealthTotal = healthProvinces.reduce((sum, row) => sum + (row.centros?.length || 0), 0);
    assertCondition(Object.keys(health).length === 158, 'Health data must include all 158 municipality keys.');
    assertCondition(nationalHealth.total_centros === municipalHealthTotal, 'National health total differs from municipalities.');
    assertCondition(provinceHealthTotal === municipalHealthTotal, 'Health province total differs from municipalities.');

    console.log('Territory index and GeoJSON are aligned.');
    console.log('Audited population, education, TIC, household, education-offer, health and 2010 pyramid controls passed.');
} catch (e) {
    console.error('Error parsing files:', e);
    process.exit(1);
}
