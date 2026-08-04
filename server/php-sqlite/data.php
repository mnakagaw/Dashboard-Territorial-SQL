<?php
/**
 * Read-only SQLite delivery API for Dashboard Territorial.
 *
 * GET /ONE/api/data.php             List active datasets.
 * GET /ONE/api/data.php?key={key}   Return one raw JSON dataset.
 */

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, If-None-Match');
header('X-Content-Type-Options: nosniff');

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($method !== 'GET') {
    header('Allow: GET, OPTIONS');
    sendJson(['error' => 'Method not allowed.'], 405);
}

try {
    $databasePath = resolveDatabasePath();
    $pdo = new PDO('sqlite:' . $databasePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec('PRAGMA query_only = ON');
    $pdo->exec('PRAGMA busy_timeout = 5000');

    $key = isset($_GET['key']) ? trim((string) $_GET['key']) : '';
    if ($key === '') {
        listDatasets($pdo);
    }

    if (!preg_match('/^[a-z0-9_]{1,100}$/', $key)) {
        sendJson(['error' => 'Invalid dataset key.'], 400);
    }

    $statement = $pdo->prepare(
        'SELECT json_content, content_hash, content_type '
        . 'FROM active_dataset_assets WHERE asset_key = :key LIMIT 1'
    );
    $statement->execute([':key' => $key]);
    $asset = $statement->fetch();

    if (!$asset) {
        sendJson(['error' => "Dataset '{$key}' not found or inactive."], 404);
    }

    $etag = '"' . $asset['content_hash'] . '"';
    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
        header('ETag: ' . $etag);
        http_response_code(304);
        exit;
    }

    header('Content-Type: ' . $asset['content_type'] . '; charset=utf-8');
    header('Cache-Control: public, max-age=300, must-revalidate');
    header('ETag: ' . $etag);
    echo $asset['json_content'];
} catch (Throwable $error) {
    error_log('Dashboard Territorial SQLite API: ' . $error->getMessage());
    sendJson(['error' => 'Dataset service is temporarily unavailable.'], 503);
}

function resolveDatabasePath(): string
{
    $configured = getenv('ONE_SQLITE_PATH');
    $candidates = [];
    if (is_string($configured) && $configured !== '') {
        $candidates[] = $configured;
    }

    // V1 CORESERVER layout:
    // /virtual/{account}/public_html/prodecare.net/ONE/api/data.php
    $candidates[] = dirname(__DIR__, 4) . '/sqlite_data/dashboard_territorial.sqlite3';

    if (isset($_SERVER['DOCUMENT_ROOT'])) {
        $candidates[] = dirname((string) $_SERVER['DOCUMENT_ROOT'], 2)
            . '/sqlite_data/dashboard_territorial.sqlite3';
    }

    foreach ($candidates as $candidate) {
        if (is_file($candidate) && is_readable($candidate)) {
            $resolved = realpath($candidate);
            if ($resolved !== false) {
                return $resolved;
            }
        }
    }

    throw new RuntimeException('SQLite database was not found or is not readable.');
}

function listDatasets(PDO $pdo): void
{
    $rows = $pdo->query(
        'SELECT asset_key, version_no, content_hash, source_name, updated_at, notes '
        . 'FROM active_dataset_assets ORDER BY asset_key'
    )->fetchAll();
    sendJson($rows, 200);
}

function sendJson(array $payload, int $status): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
