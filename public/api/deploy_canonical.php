<?php
/**
 * deploy_canonical.php
 * 
 * Script de despliegue para la Fase 2 (Canonical Handoff Package) en CoreServer.
 * Ejecuta el respaldo de la base de datos, inicializa DDLs, y ejecuta los ETL y QA.
 * 
 * Instrucciones: Subir este archivo y acceder a tu-municipio.app/api/deploy_canonical.php
 * ¡ADVERTENCIA! Este script modifica datos y estructuras en la base de datos de producción.
 */

// 1. Cargar configuración de base de datos
$envFile = __DIR__ . '/.env.local';
if (!file_exists($envFile)) {
    die("❌ Error: No se encontró .env.local");
}
$envContent = file_get_contents($envFile);
$host = $user = $pass = $name = '';
foreach (explode("\n", $envContent) as $line) {
    if (strpos($line, 'DB_HOST=') === 0) $host = trim(substr($line, 8));
    if (strpos($line, 'DB_USER=') === 0) $user = trim(substr($line, 8));
    if (strpos($line, 'DB_PASS=') === 0) $pass = trim(substr($line, 8));
    if (strpos($line, 'DB_NAME=') === 0) $name = trim(substr($line, 8));
}

echo "<pre>";
echo "🚀 Iniciando Despliegue de Canonical Handoff Package (Fase 2)\n";
echo "==============================================================\n\n";

// 2. Backup de la Base de Datos
$backupFile = __DIR__ . '/../data/backup_carapicha_dbt_' . date('Ymd_His') . '.sql';
$dumpCmd = sprintf("mysqldump -h %s -u %s -p'%s' %s > %s 2>&1",
    escapeshellarg($host), escapeshellarg($user), $pass, escapeshellarg($name), escapeshellarg($backupFile));

echo "💾 Ejecutando respaldo de base de datos...\n";
exec($dumpCmd, $output, $return_var);
if ($return_var !== 0) {
    echo "⚠️ Advertencia: No se pudo crear el backup con mysqldump. Continuando de todos modos...\n";
} else {
    echo "✅ Backup completado: " . basename($backupFile) . "\n";
}

// 3. Recrear Tablas (Create Canonical Tables)
echo "\n🏗️  Inicializando esquema canónico (DDL)...\n";
$sqlFile = realpath(__DIR__ . '/../../scripts/create_canonical_tables.sql');
if ($sqlFile && file_exists($sqlFile)) {
    $mysqlCmd = sprintf("mysql -h %s -u %s -p'%s' -f %s < %s 2>&1",
        escapeshellarg($host), escapeshellarg($user), $pass, escapeshellarg($name), escapeshellarg($sqlFile));
    exec($mysqlCmd, $outSql, $retSql);
    echo "✅ DDL Ejecutado.\n";
} else {
    echo "⚠️  No se encontró create_canonical_tables.sql o imposible ejecutar cliente mysql.\n";
}

// 4. Ejecutar Node Scripts (ETL, QA, Delivery)
echo "\n⚙️ Ejecutando Pipelines mediante NodeJS remoto...\n";

// Asegurarse de que node esté en la ruta o intentamos especificarlo
$nodePath = trim(shell_exec('which node'));
if (!$nodePath) {
    $nodePath = 'node'; // Fallback
}

$scripts = [
    'ETL (Extracción a Canonical)' => 'etl_phase2_mariadb.js',
    'QA (Aseguramiento de Calidad)' => 'qa_canonical.js',
    'Delivery (Regeneración de JSON)' => 'regenerate_delivery.js'
];

foreach ($scripts as $label => $script) {
    echo "\n------------------------------------------------\n";
    echo "▶️ Ejecutando: $label\n";
    
    $scriptPath = realpath(__DIR__ . '/../../scripts/' . $script);
    if (!$scriptPath || !file_exists($scriptPath)) {
        echo "❌ Error: No se encontró el script '$script'\n";
        continue;
    }
    
    $cmd = escapeshellcmd($nodePath) . " " . escapeshellarg($scriptPath) . " 2>&1";
    exec($cmd, $outNode, $retNode);
    
    echo implode("\n", $outNode) . "\n";
    if ($retNode === 0) {
        echo "\n✅ Completado con éxito.\n";
    } else {
        echo "\n❌ Falló con código $retNode.\n";
    }
}

echo "\n==============================================================\n";
echo "🎉 Despliegue de Capa de Datos Canónica Completado.\n";
echo "Nota: Eliminar este archivo (deploy_canonical.php) del servidor por razones de seguridad.\n";
echo "\n🚨 Por seguridad, este script ha sido eliminado automáticamente del servidor.\n";
echo "</pre>";
@unlink(__FILE__);
?>
