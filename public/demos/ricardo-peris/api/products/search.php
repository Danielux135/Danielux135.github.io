<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/chatbot/bootstrap.php';

PerisHttp::requireMethod('GET');
PerisHttp::sameOrigin();

if (PerisConfig::get('APP_ENV', 'production') === 'production') {
    PerisHttp::json(['ok' => false, 'error' => ['code' => 'not_found', 'message' => 'No disponible.']], 404);
}

try {
    $query = PerisSecurity::cleanText($_GET['q'] ?? null, 200);
    $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? (int) $_GET['limit'] : 10;
    $products = (new PerisRealProductRepository())->searchProducts($query, $limit);
    $diagnosticProducts = array_map(static fn(array $product): array => [
        'codigo' => $product['codigo'],
        'referencia' => $product['referencia'],
        'descripcion' => $product['name'],
        'codigo_barras' => $product['codigo_barras'],
    ], $products);
    PerisHttp::json(['ok' => true, 'count' => count($diagnosticProducts), 'products' => $diagnosticProducts]);
} catch (InvalidArgumentException $error) {
    PerisHttp::json(['ok' => false, 'error' => ['code' => 'validation_error', 'message' => $error->getMessage()]], 422);
} catch (Throwable $error) {
    error_log('[peris-products] ' . $error->getMessage());
    PerisHttp::json(['ok' => false, 'error' => ['code' => 'database_unavailable', 'message' => 'No se puede consultar el catálogo real.']], 503);
}
