/**
 * deploy.mjs - Script de despliegue FTP
 * 
 * Este script sube los archivos de producción a un servidor web via FTP.
 * Se ejecuta con: npm run deploy
 * 
 * Requisitos:
 * 1. Archivo .env con las credenciales FTP:
 *    - FTP_HOST: Dirección del servidor (ej: ftp.midominio.com)
 *    - FTP_USER: Usuario FTP
 *    - FTP_PASS: Contraseña FTP
 *    - FTP_REMOTE_ROOT: Carpeta destino en el servidor (ej: /public_html)
 * 
 * 2. Ejecutar primero: npm run build (para generar la carpeta dist/)
 * 
 * ¿Cómo funciona?
 * 1. Busca una carpeta de build (dist, dist_prod, etc.)
 * 2. Conecta al servidor FTP usando las credenciales del .env
 * 3. Sube todos los archivos al servidor
 */

import 'dotenv/config';  // Carga las variables de entorno desde .env
import * as ftp from 'basic-ftp';  // Biblioteca para conexión FTP
import path from 'path';
import fs from 'fs';

// ============================================
// CONFIGURACIÓN
// ============================================

// Lista de posibles carpetas de build (en orden de prioridad)
const CANDIDATE_DIRS = process.env.DEPLOY_BUILD_DIR
    ? [process.env.DEPLOY_BUILD_DIR]
    : ['dist', 'dist_prod', 'dist_prod_v2', 'dist_prod_v3'];
let BUILD_DIR = null;

// Buscar la primera carpeta de build que exista
for (const dir of CANDIDATE_DIRS) {
    if (fs.existsSync(dir)) {
        BUILD_DIR = dir;
        break;
    }
}

// Carpeta destino en el servidor remoto
const REMOTE_ROOT = process.env.FTP_REMOTE_ROOT || '/public_html';

// ============================================
// FUNCIÓN PRINCIPAL DE DESPLIEGUE
// ============================================

async function deploy() {
    // Crear cliente FTP
    const client = new ftp.Client();
    // client.ftp.verbose = true;  // Descomentar para ver logs detallados

    // Leer credenciales desde variables de entorno
    const host = process.env.FTP_HOST;
    const user = process.env.FTP_USER;
    const password = process.env.FTP_PASS;

    // Validar que existan las credenciales
    if (!host || !user || !password) {
        console.error("❌ Error: Faltan credenciales FTP en el archivo .env");
        console.error("Asegúrese de que FTP_HOST, FTP_USER y FTP_PASS estén configurados.");
        process.exit(1);  // Salir con código de error
    }

    // Validar que exista la carpeta de build
    if (!BUILD_DIR) {
        console.error(`❌ Error: No se encontró carpeta de build.`);
        console.error(`Carpetas verificadas: ${CANDIDATE_DIRS.join(', ')}`);
        console.error(`Ejecute primero: npm run build`);
        process.exit(1);
    }

    try {
        // Paso 1: Conectar al servidor FTP
        console.log(`🔌 Conectando a ${host} como ${user}...`);
        await client.access({
            host,
            user,
            password,
            secure: false  // Cambiar a true para FTPS (más seguro)
        });

        // Paso 2: Navegar a la carpeta destino
        console.log(`📂 Carpeta remota: ${REMOTE_ROOT}`);
        await client.ensureDir(REMOTE_ROOT);

        // Paso 3: Subir todos los archivos
        console.log(`🚀 Iniciando subida desde '${BUILD_DIR}'...`);
        await client.uploadFromDir(BUILD_DIR);

        console.log("✅ ¡Despliegue completado exitosamente!");

    } catch (err) {
        console.error("❌ El despliegue falló:", err);
        process.exit(1);
    } finally {
        // Siempre cerrar la conexión al terminar
        client.close();
    }
}

// Ejecutar la función de despliegue y esperar a que finalice antes de que los
// scripts de verificación o limpieza continúen.
await deploy();
