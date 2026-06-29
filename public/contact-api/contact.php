<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = [
    'https://danielux.es',
    'https://www.danielux.es',
    'https://danielux135.github.io',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400): void
{
    respond([
        'ok' => false,
        'error' => $message,
    ], $status);
}

function clean_header_value(string $value): string
{
    return trim(str_replace(["\r", "\n"], ' ', $value));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('Método no permitido.', 405);
}

$raw = trim(file_get_contents('php://input') ?: '');

if (strncmp($raw, "\xEF\xBB\xBF", 3) === 0) {
    $raw = substr($raw, 3);
}

$data = json_decode($raw, true);

if (!is_array($data) && !empty($_POST)) {
    $data = $_POST;
}

if (!is_array($data)) {
    fail('JSON inválido.');
}

$name = trim((string)($data['name'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$message = trim((string)($data['message'] ?? ''));
$website = trim((string)($data['website'] ?? ''));

// Campo trampa anti-spam. Si viene relleno, fingimos éxito.
if ($website !== '') {
    respond(['ok' => true, 'message' => 'Mensaje enviado correctamente.']);
}

if ($name === '' || mb_strlen($name, 'UTF-8') > 80) {
    fail('Nombre inválido.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email, 'UTF-8') > 120) {
    fail('Email inválido.');
}

if ($message === '' || mb_strlen($message, 'UTF-8') > 3000) {
    fail('Mensaje inválido.');
}

$to = 'contacto@danielux.es';
$subject = 'Nuevo mensaje desde danielux.es';
$safeName = clean_header_value($name);
$safeEmail = clean_header_value($email);

$body = "Has recibido un nuevo mensaje desde danielux.es:\n\n";
$body .= "Nombre: {$name}\n";
$body .= "Email: {$email}\n\n";
$body .= "Mensaje:\n{$message}\n\n";
$body .= "---\n";
$body .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'desconocida') . "\n";
$body .= "User-Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'desconocido') . "\n";
$body .= "Fecha: " . date('Y-m-d H:i:s') . "\n";

$headers = [
    'From: Danielux Web <contacto@danielux.es>',
    "Reply-To: {$safeName} <{$safeEmail}>",
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = mail($to, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    fail('No se pudo enviar el mensaje. Inténtalo más tarde.', 500);
}

respond([
    'ok' => true,
    'message' => 'Mensaje enviado correctamente.',
]);
