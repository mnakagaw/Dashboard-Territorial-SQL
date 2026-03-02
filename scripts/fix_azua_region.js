const fs = require('fs');
const path = require('path');

const targetDirs = ['public/data', 'src/data'];

let totalModifications = 0;
let modifiedFiles = [];

function fixRegionInObject(obj) {
    let modified = false;

    // Check if it's an array
    if (Array.isArray(obj)) {
        for (let item of obj) {
            if (item && typeof item === 'object') {
                if (item.provincia === 'Azua' && item.region === 'Valdesia') {
                    item.region = 'El Valle';
                    modified = true;
                    totalModifications++;
                }
                // Recursively check nested objects/arrays if needed (though usually it's flat in these jsons)
                if (fixRegionInObject(item)) {
                    modified = true;
                }
            }
        }
    } else if (obj && typeof obj === 'object') {
        // If it's a dictionary-like object where values might be the records
        for (let key in obj) {
            let item = obj[key];
            if (item && typeof item === 'object') {
                if (item.provincia === 'Azua' && item.region === 'Valdesia') {
                    item.region = 'El Valle';
                    modified = true;
                    totalModifications++;
                }
                if (fixRegionInObject(item)) {
                    modified = true;
                }
            }
        }
    }

    return modified;
}

function processDirectory(dir) {
    const fullDir = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullDir)) return;

    const files = fs.readdirSync(fullDir);
    for (let file of files) {
        if (file.endsWith('.json')) {
            const filePath = path.join(fullDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');

                // Quick string check to avoid parsing unnecessary files
                if (content.includes('Valdesia') && content.includes('Azua')) {
                    const data = JSON.parse(content);
                    const isModified = fixRegionInObject(data);

                    if (isModified) {
                        fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n');
                        modifiedFiles.push(path.join(dir, file));
                    }
                }
            } catch (err) {
                console.error(`Error processing ${filePath}:`, err);
            }
        }
    }
}

targetDirs.forEach(processDirectory);

// Fix DICCIONARIO_DATOS.md
const docPath = path.join(__dirname, '..', 'docs', 'DICCIONARIO_DATOS.md');
if (fs.existsSync(docPath)) {
    let docContent = fs.readFileSync(docPath, 'utf8');
    if (docContent.includes('"region": "Valdesia"') && docContent.includes('"provincia": "Azua"')) {
        docContent = docContent.replace(
            /"provincia": "Azua",\s*"region": "Valdesia"/g,
            '"provincia": "Azua",\n  "region": "El Valle"'
        );
        fs.writeFileSync(docPath, docContent);
        modifiedFiles.push('docs/DICCIONARIO_DATOS.md');
    }
}

// Ensure the counts match user request for testing
let azuaCount = 0;
let azuaValdesiaCount = 0;
let azuaElValleCount = 0;
let totalMunicipios = 0;

try {
    const munIndex = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/municipios_index.json')));
    totalMunicipios = munIndex.length;
    munIndex.forEach(m => {
        if (m.provincia === 'Azua') {
            azuaCount++;
            if (m.region === 'Valdesia') azuaValdesiaCount++;
            if (m.region === 'El Valle') azuaElValleCount++;
        }
    });
} catch (e) { }

console.log("=== Reporte de Modificaciones ===");
console.log(`Archivos modificados: \n  - ${modifiedFiles.join('\n  - ')}`);
console.log(`Total de reemplazos ('Valdesia' -> 'El Valle' en Azua): ${totalModifications}`);
console.log("\n=== Verificación de Calidad ===");
console.log(`(A) provincia=="Azua" totales: ${azuaCount} (Esperado: 10)`);
console.log(`(B) provincia=="Azua" && region=="El Valle": ${azuaElValleCount} (Esperado: 10)`);
console.log(`(C) provincia=="Azua" && region=="Valdesia": ${azuaValdesiaCount} (Esperado: 0)`);
console.log(`(D) Total de municipios: ${totalMunicipios} (Esperado: 158)`);
