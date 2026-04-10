<?php
/**
 * data.php — PHP API for CoreServer (SQL Server backend)
 *
 * Endpoint: /api/data.php?key={assetKey}
 *   or with URL rewrite: /api/data/{assetKey}
 *
 * Returns the raw JSON content from dataset_assets table,
 * fully compatible with the original static JSON files.
 *
 * Prerequisites:
 *   - PHP sqlsrv or pdo_sqlsrv extension enabled
 *   - SQL Server connection configured in .env.local (same directory)
 *
 * .env.local format:
 *   SQL_SERVER=localhost\SQLEXPRESS
 *   SQL_DATABASE=DashboardTerritorial
 *   SQL_USER=
 *   SQL_PASSWORD=
 */

// ---- Load config from .env.local ----
$envFile = __DIR__ . '/.env.local';
$config = [];
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $config[trim($parts[0])] = trim($parts[1]);
        }
    }
}

$server   = $config['SQL_SERVER']   ?? 'localhost\\SQLEXPRESS';
$database = $config['SQL_DATABASE'] ?? 'DashboardTerritorial';
$user     = $config['SQL_USER']     ?? '';
$password = $config['SQL_PASSWORD'] ?? '';

// ---- Parse request ----
// Support both: ?key=indicadores_basicos  and  PATH_INFO /indicadores_basicos
$assetKey = '';
if (isset($_GET['key'])) {
    $assetKey = trim($_GET['key']);
} elseif (isset($_SERVER['PATH_INFO'])) {
    $assetKey = trim($_SERVER['PATH_INFO'], '/');
}

// ---- List mode (no key specified) ----
if ($assetKey === '') {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');

    try {
        $pdo = buildConnection($server, $database, $user, $password);
        $stmt = $pdo->query("
            SELECT asset_key, version_no, content_hash, source_name, updated_at, notes
            FROM dataset_assets
            WHERE is_active = 1
            ORDER BY asset_key
        ");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// ---- Validate key (prevent SQL injection via whitelist chars) ----
if (!preg_match('/^[a-z0-9_]+$/', $assetKey)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid asset key format.']);
    exit;
}

// ---- Fetch dataset ----
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = buildConnection($server, $database, $user, $password);

    $stmt = $pdo->prepare("
        SELECT json_content
        FROM dataset_assets
        WHERE asset_key = :key AND is_active = 1
    ");
    $stmt->execute([':key' => $assetKey]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => "Dataset '$assetKey' not found or inactive."]);
        exit;
    }

    // Return raw JSON exactly as stored — no re-encoding
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    echo $row['json_content'];

} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

// =============================================================================
// Helper: build PDO connection
// =============================================================================
function buildConnection(string $server, string $database, string $user, string $password): PDO
{
    // Try pdo_sqlsrv first (Windows), fall back to dblib (Linux/FreeBSD)
    if (extension_loaded('pdo_sqlsrv')) {
        $dsn = "sqlsrv:Server=$server;Database=$database;TrustServerCertificate=1";
        if ($user) {
            return new PDO($dsn, $user, $password);
        }
        // Windows auth (trusted connection)
        return new PDO($dsn);
    }

    if (extension_loaded('pdo_dblib')) {
        $dsn = "dblib:host=$server;dbname=$database;charset=UTF-8";
        return new PDO($dsn, $user, $password);
    }

    throw new RuntimeException(
        'No SQL Server PDO driver found. Install pdo_sqlsrv or pdo_dblib extension.'
    );
}
