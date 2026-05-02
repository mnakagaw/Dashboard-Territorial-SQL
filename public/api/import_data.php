<?php
/**
 * import_data.php — Server-side JSON → MariaDB bulk importer
 * Run: https://prodecare.net/dbt/api/import_data.php
 * DELETE THIS FILE after import!
 */
set_time_limit(300);
ini_set('memory_limit', '256M');

// ---- Load DB config ----
$envFile = __DIR__ . '/.env.local';
$config = array();
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || $trimmed[0] === '#') continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $config[trim($parts[0])] = trim($parts[1]);
        }
    }
}

$dbHost = isset($config['DB_HOST']) ? $config['DB_HOST'] : 'localhost';
$dbName = isset($config['DB_NAME']) ? $config['DB_NAME'] : 'carapicha_dbt';
$dbUser = isset($config['DB_USER']) ? $config['DB_USER'] : '';
$dbPass = isset($config['DB_PASS']) ? $config['DB_PASS'] : '';

header('Content-Type: text/plain; charset=utf-8');
echo "=== Dashboard Territorial — JSON Import ===\n\n";

$skipFiles = array('adm2.json', 'adm2.geojson');
$dataDir = realpath(__DIR__ . '/../data');

if (!$dataDir || !is_dir($dataDir)) {
    die("ERROR: Data directory not found: " . __DIR__ . "/../data\n");
}
echo "Data dir: $dataDir\n";

try {
    $dsn = "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, array(
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ));
    echo "Connected to $dbHost / $dbName\n\n";
} catch (Exception $e) {
    die("DB connection failed: " . $e->getMessage() . "\n");
}

$files = glob("$dataDir/*.json");
$files = array_filter($files, function ($f) use ($skipFiles) {
    return !in_array(basename($f), $skipFiles);
});
sort($files);

echo "Found " . count($files) . " JSON files.\n\n";

function canonical_json_content($content) {
    return str_replace(
        array('Sanchez Ramírez', 'Sanchez Ramirez', 'Sánchez Ramirez'),
        'Sánchez Ramírez',
        $content
    );
}

$stmtCheck = $pdo->prepare(
    "SELECT id, content_hash, version_no FROM dataset_assets WHERE asset_key = :key AND is_active = 1"
);
$stmtInsert = $pdo->prepare(
    "INSERT INTO dataset_assets (asset_key, version_no, json_content, content_hash, source_name, is_active)
     VALUES (:key, 1, :json, :hash, :source, 1)"
);
$stmtUpdate = $pdo->prepare(
    "UPDATE dataset_assets
     SET json_content = :json, content_hash = :hash, source_name = :source,
         version_no = :version, updated_at = NOW()
     WHERE asset_key = :key AND is_active = 1"
);

$inserted = 0;
$updated = 0;
$skipped = 0;
$errors = 0;

foreach ($files as $filePath) {
    $fileName = basename($filePath);
    $assetKey = basename($fileName, '.json');
    $content = file_get_contents($filePath);

    if ($content === false) {
        echo "  ERR $assetKey — failed to read\n";
        $errors++;
        continue;
    }

    $content = canonical_json_content($content);
    $hash = hash('sha256', $content);
    $sizeKB = round(strlen($content) / 1024, 1);

    $stmtCheck->execute(array(':key' => $assetKey));
    $existing = $stmtCheck->fetch();

    if ($existing) {
        if (trim($existing['content_hash']) === $hash) {
            echo "  SKIP $assetKey ({$sizeKB}KB)\n";
            $skipped++;
            continue;
        }
        $newVersion = $existing['version_no'] + 1;
        $stmtUpdate->execute(array(
            ':json'    => $content,
            ':hash'    => $hash,
            ':source'  => $fileName,
            ':version' => $newVersion,
            ':key'     => $assetKey,
        ));
        echo "  UPD  $assetKey v$newVersion ({$sizeKB}KB)\n";
        $updated++;
    } else {
        $stmtInsert->execute(array(
            ':key'    => $assetKey,
            ':json'   => $content,
            ':hash'   => $hash,
            ':source' => $fileName,
        ));
        echo "  NEW  $assetKey v1 ({$sizeKB}KB)\n";
        $inserted++;
    }

    if (ob_get_level()) ob_flush();
    flush();
}

echo "\nDone! Inserted=$inserted Updated=$updated Skipped=$skipped Errors=$errors\n";
echo "\n** DELETE THIS FILE from the server! **\n";
