<?php
/*
Danielux Party Arena API
- PHP + MariaDB/MySQL
- Endpoint único por POST JSON
- Pensado para 2-8 jugadores con polling cada 700-1000ms
*/

declare(strict_types=1);

$configPath = __DIR__ . '/config.local.php';
$config = file_exists($configPath)
    ? require $configPath
    : require __DIR__ . '/config.example.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = $config['allowed_origins'] ?? [];
if (in_array('*', $allowed, true)) {
    header('Access-Control-Allow-Origin: *');
} elseif ($origin && in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function out(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(string $message, int $status = 400, array $extra = []): void {
    out(['ok' => false, 'error' => $message] + $extra, $status);
}
function now_ms(): int { return (int) floor(microtime(true) * 1000); }
function token(): string { return bin2hex(random_bytes(32)); }
function clean_name(string $name): string {
    $name = trim(strip_tags($name));
    $name = preg_replace('/\s+/u', ' ', $name) ?? $name;
    $name = mb_substr($name, 0, 32);
    return $name !== '' ? $name : 'Jugador';
}
function clean_code(string $code): string {
    return strtoupper(preg_replace('/[^A-Z0-9]/i', '', $code) ?? '');
}
function jenc(array $data): string { return json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); }
function jdec(?string $json): array {
    if (!$json) return [];
    $v = json_decode($json, true);
    return is_array($v) ? $v : [];
}

try {
    if (($config['db_name'] ?? '') === 'TU_BASE_DE_DATOS') {
        fail('La API no está configurada. Crea config.local.php con tus datos de MariaDB/MySQL.', 500);
    }
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $config['db_host'] ?? 'localhost',
        $config['db_name'] ?? '',
        $config['db_charset'] ?? 'utf8mb4'
    );
    $pdo = new PDO($dsn, $config['db_user'] ?? '', $config['db_pass'] ?? '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (Throwable $e) {
    fail('No se pudo conectar con la base de datos: ' . $e->getMessage(), 500);
}

$raw = file_get_contents('php://input') ?: '';
$raw = trim($raw);

// Compatibilidad extra para pruebas desde PowerShell/curl y clientes que añaden BOM.
if (strncmp($raw, "\xEF\xBB\xBF", 3) === 0) {
    $raw = substr($raw, 3);
}

$body = json_decode($raw, true);

// Algunos clientes pueden mandar el JSON envuelto como string.
if (!is_array($body) && strlen($raw) >= 2) {
    $first = $raw[0];
    $last = $raw[strlen($raw) - 1];
    if (($first === "'" && $last === "'") || ($first === '"' && $last === '"')) {
        $unwrapped = substr($raw, 1, -1);
        $body = json_decode($unwrapped, true);
    }
}

// Fallback para formularios POST clásicos.
if (!is_array($body) && !empty($_POST)) {
    $body = $_POST;
}

if (!is_array($body)) {
    fail('JSON inválido.', 400, [
        'received_length' => strlen($raw),
        'received_preview' => mb_substr($raw, 0, 120),
    ]);
}
$action = (string)($body['action'] ?? '');

function room_by_code(PDO $pdo, string $code, bool $lock = false): ?array {
    $sql = 'SELECT * FROM party_rooms WHERE code = ?' . ($lock ? ' FOR UPDATE' : '');
    $st = $pdo->prepare($sql);
    $st->execute([$code]);
    $r = $st->fetch();
    return $r ?: null;
}
function player_by_token(PDO $pdo, int $roomId, string $token): ?array {
    if ($token === '') return null;
    $st = $pdo->prepare('SELECT * FROM party_players WHERE room_id = ? AND token = ?');
    $st->execute([$roomId, $token]);
    $p = $st->fetch();
    return $p ?: null;
}
function players_for_room(PDO $pdo, int $roomId): array {
    $st = $pdo->prepare('SELECT id, name, avatar, score, damage, is_host, online_until, joined_at FROM party_players WHERE room_id = ? ORDER BY is_host DESC, score DESC, id ASC');
    $st->execute([$roomId]);
    $now = time();
    return array_map(function ($p) use ($now) {
        $p['id'] = (int)$p['id'];
        $p['score'] = (int)$p['score'];
        $p['damage'] = (int)$p['damage'];
        $p['is_host'] = (bool)$p['is_host'];
        $p['online'] = !empty($p['online_until']) && strtotime((string)$p['online_until']) >= $now;
        unset($p['online_until']);
        return $p;
    }, $st->fetchAll());
}
function active_round(PDO $pdo, int $roomId, bool $lock = false): ?array {
    $sql = 'SELECT * FROM party_rounds WHERE room_id = ? AND status IN (\'playing\',\'results\') ORDER BY id DESC LIMIT 1' . ($lock ? ' FOR UPDATE' : '');
    $st = $pdo->prepare($sql);
    $st->execute([$roomId]);
    $r = $st->fetch();
    return $r ?: null;
}
function update_online(PDO $pdo, int $playerId): void {
    $st = $pdo->prepare('UPDATE party_players SET online_until = DATE_ADD(NOW(), INTERVAL 20 SECOND) WHERE id = ?');
    $st->execute([$playerId]);
}
function assert_host(array $room, ?array $player, array $body): void {
    $hostToken = (string)($body['hostToken'] ?? '');
    $ok = ($hostToken !== '' && hash_equals((string)$room['host_token'], $hostToken)) || ($player && !empty($player['is_host']));
    if (!$ok) fail('Solo el host puede hacer eso.', 403);
}
function public_round_state(array $round, ?array $viewer, array $players): array {
    $state = jdec($round['state_json'] ?? '{}');
    $rawState = $state;
    $mode = (string)$round['mode'];
    $viewerId = $viewer ? (int)$viewer['id'] : 0;

    if ($mode === 'impostor') {
        $secrets = $state['secrets'] ?? [];
        $roles = $state['playerRoles'] ?? [];
        $state['yourWord'] = $secrets[(string)$viewerId] ?? null;
        $state['yourRole'] = $roles[(string)$viewerId] ?? 'civil';
        $state['youAreImpostor'] = isset($state['impostor_id']) && (int)$state['impostor_id'] === $viewerId;
        unset($state['secrets']);
        if (($round['phase'] ?? '') !== 'results') {
            unset($state['impostor_id'], $state['normalWord'], $state['impostorWord'], $state['playerRoles']);
        }
    }
    if ($mode === 'mentira') {
        $phase = (string)($round['phase'] ?? '');
        $viewerKey = (string)$viewerId;
        $yourFakeEntry = $state['fakeAnswers'][$viewerKey] ?? null;
        if ($yourFakeEntry !== null) {
            $state['yourFakeAnswer'] = mentira_fake_text($yourFakeEntry);
            if (is_array($yourFakeEntry)) $state['yourDoubleBluff'] = !empty($yourFakeEntry['double']);
        }
        if ($viewerId > 0 && $yourFakeEntry !== null) $state['yourOptionId'] = 'p_' . $viewerId;
        $state['canUseFifty'] = empty(($state['jokers'][$viewerKey] ?? [])['fifty']);
        $state['fiftyRemoved'] = ($state['jokers'][$viewerKey] ?? [])['removed'] ?? [];
        if ($phase !== 'results') {
            unset($state['realAnswer'], $state['fakeBank'], $state['explanation'], $state['scoreBreakdown'], $state['pointsAwarded'], $state['medals'], $state['summary'], $state['fooledBy'], $state['votesResolved'], $state['detectiveStreaks']);
            if (!empty(($state['modifier'] ?? [])['hideCategory'])) unset($state['category']);
            if ($phase === 'vote') {
                $publicOptions = [];
                foreach (($state['options'] ?? []) as $option) {
                    $publicOptions[] = ['id'=>(string)($option['id'] ?? ''), 'text'=>(string)($option['text'] ?? '')];
                }
                $state['options'] = $publicOptions;
                $ownVote = ($rawState['votes'] ?? [])[$viewerKey] ?? null;
                $state['votes'] = $ownVote !== null ? [$viewerKey => $ownVote] : [];
                unset($state['voteTimes'], $state['jokers']);
            } else {
                unset($state['options'], $state['votes'], $state['voteTimes'], $state['jokers']);
            }
            unset($state['fakeAnswers']);
        }
    }
    if ($mode === 'boton-prohibido') {
        $phase = (string)($round['phase'] ?? 'press');
        $viewerKey = (string)$viewerId;
        $idx = (string)(int)($rawState['current'] ?? 0);
        $current = $rawState['sequence'][(int)($rawState['current'] ?? 0)] ?? null;
        if (is_array($current)) {
            $state['currentButton'] = $current;
            if (!in_array($phase, ['reveal','results'], true)) unset($state['currentButton']['kind']);
        }
        $state['yourForbiddenChoice'] = ($rawState['choices'][$idx][$viewerKey] ?? null);
        $state['yourForbiddenOutcome'] = null;
        foreach (($rawState['outcomes'][$idx] ?? []) as $row) {
            if (is_array($row) && (string)($row['playerId'] ?? '') === $viewerKey) $state['yourForbiddenOutcome'] = $row;
        }
        $state['canUseScanner'] = empty(($rawState['tools'][$viewerKey] ?? [])['scan']);
        $state['canUseLock'] = empty(($rawState['tools'][$viewerKey] ?? [])['lock']);
        $state['scannerResult'] = ($rawState['tools'][$viewerKey] ?? [])['scanResult'] ?? null;
        if ($phase === 'press') {
            $publicChoices = [];
            foreach (($rawState['choices'][$idx] ?? []) as $pid => $choice) {
                $publicChoices[(string)$pid] = ((string)$pid === $viewerKey) ? $choice : ['chosen'=>true, 'action'=>'secret'];
            }
            $state['choices'] = [$idx => $publicChoices];
            unset($state['sequence'], $state['outcomes'], $state['lastOutcome'], $state['history'], $state['medals'], $state['finalRows']);
        } elseif ($phase === 'reveal') {
            unset($state['sequence']);
        }
    }
    if ($mode === 'quiz') {
        $viewerKey = (string)$viewerId;
        $idx = (string)(int)($rawState['current'] ?? 0);
        $state['yourQuizAnswer'] = ($rawState['answers'][$idx][$viewerKey] ?? null);
        $state['canUseFifty'] = empty(($rawState['jokers'][$viewerKey] ?? [])['fifty']);
        $state['canUseFreeze'] = empty(($rawState['jokers'][$viewerKey] ?? [])['freeze']);
        $state['fiftyRemoved'] = ($rawState['jokers'][$viewerKey] ?? [])['removed'] ?? [];
    }

    if ($mode === 'subasta') {
        $phase = (string)($round['phase'] ?? 'bid');
        $viewerKey = (string)$viewerId;
        $idx = (string)(int)($rawState['current'] ?? 0);
        $currentLot = $rawState['lots'][(int)$idx] ?? ($rawState['challenge'] ?? []);
        $publicLot = $currentLot;
        if ($phase === 'bid') {
            unset($publicLot['value'], $publicLot['explanation']);
        }
        $state['challenge'] = $publicLot;
        if (isset($state['lots']) && is_array($state['lots'])) {
            foreach ($state['lots'] as $i => $lot) {
                if ((string)$i !== $idx || $phase === 'bid') {
                    unset($state['lots'][$i]['value'], $state['lots'][$i]['explanation'], $state['lots'][$i]['extra']);
                }
            }
        }
        $state['yourBid'] = ($rawState['bids'][$idx][$viewerKey] ?? null);
        $state['yourCredits'] = (int)(($rawState['credits'] ?? [])[$viewerKey] ?? ($rawState['initialCredits'] ?? 0));
        $state['analyzeCost'] = subasta_analyze_cost($rawState, $viewerKey);
        $state['insuranceCost'] = subasta_insurance_cost($rawState, $viewerKey);
        $state['bidMs'] = subasta_bid_ms($rawState);
        $state['revealMs'] = subasta_reveal_ms();
        $state['minDecisionMs'] = subasta_min_decision_ms();
        $state['phaseStartedMs'] = (int)($rawState['phaseStartedMs'] ?? (int)($round['started_at_ms'] ?? now_ms()));
        $state['revealedExtra'] = ($rawState['revealedClues'][$idx][$viewerKey] ?? null);
        if ($phase === 'bid') {
            $publicBids = [];
            foreach (($rawState['bids'][$idx] ?? []) as $pid => $bid) {
                if ((string)$pid === $viewerKey) {
                    $publicBids[(string)$pid] = $bid;
                } else {
                    $publicBids[(string)$pid] = ['locked'=>true, 'stance'=>$bid['stance'] ?? 'Secreto', 'bot'=>!empty($bid['bot'])];
                }
            }
            $state['bids'] = [$idx => $publicBids];
            unset($state['history'], $state['lastResult'], $state['summary'], $state['finalRows'], $state['medals']);
        }
    }

    $submitted = [];
    if ($mode === 'quiz') {
        $quizIndexKey = (string)(int)($rawState['current'] ?? 0);
        foreach ((($rawState['answers'] ?? [])[$quizIndexKey] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    } else {
        foreach (($rawState['answers'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    }
    foreach (($rawState['clues'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    foreach (($rawState['fakeAnswers'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    foreach (($rawState['votes'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    if ($mode === 'boss-coop') {
        $turnKey = (string)(int)($state['turn'] ?? 1);
        foreach ((($rawState['choices'] ?? [])[$turnKey] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    } else {
        foreach (($rawState['hits'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    }
    foreach (($rawState['outcomes'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    foreach (($rawState['submissions'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;

    $publicEndsAtMs = $round['ends_at_ms'] ? (int)$round['ends_at_ms'] : null;
    // Boss Cooperativo funciona por subturnos dentro de una misma ronda.
    // La UI y el autoprogress deben mirar el cierre del turno actual, no el
    // ends_at_ms heredado de la ronda, porque si no el contador puede mostrar
    // 20+ segundos y el boss parece que nunca ataca.
    if ($mode === 'boss-coop' && isset($state['turnEndsAtMs'])) {
        $publicEndsAtMs = (int)$state['turnEndsAtMs'];
    }

    return [
        'id' => (int)$round['id'],
        'mode' => $mode,
        'status' => (string)$round['status'],
        'phase' => (string)$round['phase'],
        'roundIndex' => (int)$round['round_index'],
        'startedAtMs' => (int)$round['started_at_ms'],
        'endsAtMs' => $publicEndsAtMs,
        'serverNowMs' => now_ms(),
        'state' => $state,
        'submitted' => $submitted,
    ];
}
function state_response(PDO $pdo, array $room, ?array $viewer = null): array {
    if ($viewer) update_online($pdo, (int)$viewer['id']);
    boss_auto_progress_room($pdo, $room);
    mentira_auto_progress_room($pdo, $room);
    quiz_auto_progress_room($pdo, $room);
    subasta_auto_progress_room($pdo, $room);
    forbidden_auto_progress_room($pdo, $room);
    $room = room_by_code($pdo, (string)$room['code']) ?: $room;
    $players = players_for_room($pdo, (int)$room['id']);
    $round = active_round($pdo, (int)$room['id']);
    $chatSt = $pdo->prepare('SELECT c.message, c.created_at, p.name FROM party_chat c LEFT JOIN party_players p ON p.id = c.player_id WHERE c.room_id = ? ORDER BY c.id DESC LIMIT 10');
    $chatSt->execute([(int)$room['id']]);
    $chat = array_reverse($chatSt->fetchAll());
    return [
        'ok' => true,
        'serverNowMs' => now_ms(),
        'room' => [
            'code' => $room['code'],
            'status' => $room['status'],
            'currentMode' => $room['current_mode'],
            'roundNumber' => (int)$room['round_number'],
        ],
        'you' => $viewer ? ['id' => (int)$viewer['id'], 'name' => $viewer['name'], 'score' => (int)$viewer['score'], 'isHost' => (bool)$viewer['is_host']] : null,
        'players' => $players,
        'round' => $round ? public_round_state($round, $viewer, $players) : null,
        'chat' => $chat,
    ];
}

function add_pool_ids(string $prefix, array $items): array {
    foreach ($items as $i => $item) {
        if (!isset($item['id']) || (string)$item['id'] === '') {
            $items[$i]['id'] = sprintf('%s-%02d', $prefix, $i + 1);
        }
    }
    return $items;
}
function pool_item_id(array $item): string {
    if (isset($item['id']) && (string)$item['id'] !== '') return (string)$item['id'];
    return substr(sha1(jenc($item)), 0, 16);
}
function content_fingerprint(array $item): string {
    if (isset($item['lang'], $item['code'])) return 'code:' . sha1((string)$item['lang'] . '|' . (string)$item['code']);
    if (isset($item['question'])) return 'question:' . sha1((string)$item['question']);
    if (isset($item['normal'], $item['impostor'])) return 'impostor:' . sha1((string)$item['normal'] . '|' . (string)$item['impostor']);
    if (isset($item['name'])) return 'boss:' . sha1((string)$item['name']);
    if (isset($item['title'], $item['bpm'])) return 'track:' . sha1((string)$item['title'] . '|' . (string)$item['bpm']);
    if (isset($item['label'])) return 'button:' . sha1((string)$item['label']);
    return 'raw:' . sha1(jenc($item));
}
function used_content_fingerprints(PDO $pdo, int $roomId, string $mode): array {
    $st = $pdo->prepare('SELECT state_json FROM party_rounds WHERE room_id = ? AND mode = ? ORDER BY id ASC LIMIT 500');
    $st->execute([$roomId, $mode]);
    $used = [];
    foreach ($st->fetchAll() as $row) {
        $state = jdec($row['state_json'] ?? '{}');
        foreach (['challenge','pair','lie','bossData','track'] as $key) {
            if (isset($state[$key]) && is_array($state[$key])) $used[content_fingerprint($state[$key])] = true;
        }
        if (isset($state['question'])) $used[content_fingerprint(['question'=>$state['question']])] = true;
        if (isset($state['normalWord'], $state['impostorWord'])) $used[content_fingerprint(['normal'=>$state['normalWord'], 'impostor'=>$state['impostorWord']])] = true;
        if (isset($state['boss'])) $used[content_fingerprint(['name'=>$state['boss']])] = true;
        foreach (($state['buttons'] ?? []) as $button) {
            if (is_array($button)) $used[content_fingerprint($button)] = true;
        }
    }
    return $used;
}
function used_content_ids(PDO $pdo, int $roomId, string $mode): array {
    $st = $pdo->prepare('SELECT state_json FROM party_rounds WHERE room_id = ? AND mode = ? ORDER BY id ASC LIMIT 500');
    $st->execute([$roomId, $mode]);
    $used = [];
    foreach ($st->fetchAll() as $row) {
        $state = jdec($row['state_json'] ?? '{}');
        foreach (['contentId','pairId','questionId','challengeId','bossId','rhythmId','buttonSetId'] as $key) {
            if (isset($state[$key]) && (string)$state[$key] !== '') $used[(string)$state[$key]] = true;
        }
        foreach (['challenge','pair','lie','bossData','track'] as $key) {
            if (isset($state[$key]) && is_array($state[$key]) && isset($state[$key]['id'])) {
                $used[(string)$state[$key]['id']] = true;
            }
        }
        foreach (($state['lots'] ?? []) as $lot) {
            if (is_array($lot) && isset($lot['id'])) $used[(string)$lot['id']] = true;
        }
    }
    return $used;
}
function pick_unused_pool_item(PDO $pdo, int $roomId, string $mode, array $pool): array {
    $pool = array_values($pool);
    if (!$pool) fail('No hay contenido disponible para este minijuego.', 500);
    $used = used_content_ids($pdo, $roomId, $mode);
    $usedFingerprints = used_content_fingerprints($pdo, $roomId, $mode);
    $available = array_values(array_filter($pool, fn($item) => !isset($used[pool_item_id($item)]) && !isset($usedFingerprints[content_fingerprint($item)])));
    if (!$available) $available = $pool; // si ya se ha visto todo, reinicia el ciclo automáticamente
    return $available[random_int(0, count($available) - 1)];
}
function shuffle_answer_options(array $item): array {
    if (!isset($item['options'], $item['correct']) || !is_array($item['options'])) return $item;
    $correctIndex = (int)$item['correct'];
    $correctValue = $item['options'][$correctIndex] ?? null;
    $options = $item['options'];
    shuffle($options);
    $newCorrect = array_search($correctValue, $options, true);
    $item['options'] = $options;
    $item['correct'] = $newCorrect === false ? $correctIndex : (int)$newCorrect;
    return $item;
}
function pick_unused_answer_item(PDO $pdo, int $roomId, string $mode, array $pool): array {
    return shuffle_answer_options(pick_unused_pool_item($pdo, $roomId, $mode, $pool));
}
function used_button_ids(PDO $pdo, int $roomId): array {
    $st = $pdo->prepare('SELECT state_json FROM party_rounds WHERE room_id = ? AND mode = ? ORDER BY id ASC LIMIT 500');
    $st->execute([$roomId, 'boton-prohibido']);
    $used = [];
    foreach ($st->fetchAll() as $row) {
        $state = jdec($row['state_json'] ?? '{}');
        foreach (($state['buttons'] ?? []) as $button) {
            if (is_array($button) && isset($button['id'])) $used[(string)$button['id']] = true;
        }
    }
    return $used;
}

function challenge_pool(): array {
    return add_pool_ids('bug', [
        ['lang'=>'HTML', 'code'=>'<a href="/portfolio">Ver portfolio
<section>Contenido</section>', 'options'=>['Cambiar <a> por <button>','Cerrar el enlace con </a>','Quitar el href','Meter section dentro de head'], 'correct'=>1],
        ['lang'=>'HTML', 'code'=>'<img src="avatar.png">', 'options'=>['Añadir alt descriptivo','Cambiar img por picture siempre','Quitar src','Poner display:flex en HTML'], 'correct'=>0],
        ['lang'=>'HTML', 'code'=>'<label for="email">Email</label>
<input id="correo" type="email">', 'options'=>['Cambiar type a text','Hacer que for coincida con id','Quitar el label','Usar name="label"'], 'correct'=>1],
        ['lang'=>'HTML', 'code'=>'<ul>
  <span>Inicio</span>
  <span>Blog</span>
</ul>', 'options'=>['Usar <li> dentro de <ul>','Cambiar ul por div siempre','Poner los span en head','Añadir autoplay'], 'correct'=>0],
        ['lang'=>'HTML', 'code'=>'<button>Guardar</button>
<form id="settings">...</form>', 'options'=>['Usar siempre <input>','Poner type="button" si no debe enviar formulario','Quitar el texto del botón','Cambiar form por section'], 'correct'=>1],
        ['lang'=>'HTML', 'code'=>'<h1>DanieluxOS</h1>
<h1>Contacto</h1>', 'options'=>['Usar solo un h1 principal por página/sección lógica','Cambiar ambos a p','Eliminar todos los títulos','Meter h1 dentro de script'], 'correct'=>0],
        ['lang'=>'HTML', 'code'=>'<script src="app.js" />
<div id="app"></div>', 'options'=>['Cerrar script con </script>','Cambiar div por img','Quitar src','Poner script dentro de title'], 'correct'=>0],
        ['lang'=>'HTML', 'code'=>'<input type="text" placeholder="Nombre completo">', 'options'=>['Sustituir placeholder por value','Añadir label real asociado al input','Cambiar type a password','Quitar el input'], 'correct'=>1],
        ['lang'=>'CSS', 'code'=>'.card {
  display: flex;
  justify-content: middle;
}', 'options'=>['Usar justify-content: center','Cambiar flex por table','Quitar la clase .card','Usar align-text: middle'], 'correct'=>0],
        ['lang'=>'CSS', 'code'=>'.modal {
  z-index: 9999;
}', 'options'=>['Añadir position si debe apilarse','Cambiar z-index por opacity','Usar z-index: top','Ponerlo en HTML'], 'correct'=>0],
        ['lang'=>'CSS', 'code'=>'.grid {
  display: grid;
  grid-template-column: 1fr 1fr;
}', 'options'=>['Usar grid-template-columns','Cambiar grid por inline','Usar column-template-grid','Quitar 1fr'], 'correct'=>0],
        ['lang'=>'CSS', 'code'=>'.title {
  font-size: 32;
}', 'options'=>['Añadir unidad: 32px, 2rem, etc.','Cambiar font-size por text-size','Usar font: big','Quitar la regla'], 'correct'=>0],
        ['lang'=>'CSS', 'code'=>'.btn {
  transition: transform .3;
}', 'options'=>['Añadir unidad de tiempo: .3s','Cambiar transform por translate','Usar transition: yes','Poner !important'], 'correct'=>0],
        ['lang'=>'CSS', 'code'=>'.hero {
  display: flexbox;
}', 'options'=>['Usar display: flex','Usar display: box-flex','Cambiar hero por id','Añadir float:center'], 'correct'=>0],
        ['lang'=>'CSS', 'code'=>'@media (max-width: 768) {
  .menu { display: none; }
}', 'options'=>['Añadir unidad: 768px','Cambiar max-width por width-max','Quitar los paréntesis','Usar media="mobile"'], 'correct'=>0],
        ['lang'=>'CSS', 'code'=>'<div class="card"></div>

#card {
  padding: 20px;
}', 'options'=>['Cambiar #card por .card','Cambiar class por href','Usar padding: auto','Quitar el div'], 'correct'=>0],
        ['lang'=>'CSS', 'code'=>'.panel {
  background: #fffff;
}', 'options'=>['Usar un hex válido como #ffffff','Cambiar background por bg','Añadir comillas al color','Usar color: background'], 'correct'=>0],
        ['lang'=>'CSS', 'code'=>'.card {
  position: absolute;
  margin: 0 auto;
}', 'options'=>['Centrar con left:50% y transform o usar layout normal','Cambiar absolute por bold','Usar margin:center','Meterlo en un <center>'], 'correct'=>0],
        ['lang'=>'JavaScript', 'code'=>'function sumar(a, b) {
  return a - b;
}', 'options'=>['Cambiar - por +','Quitar return','Cambiar function por class','Añadir console.log'], 'correct'=>0],
        ['lang'=>'JavaScript', 'code'=>'const count = 0;
count++;', 'options'=>['Cambiar const por let','Usar count = count + "1"','Declarar count dos veces','Meterlo en CSS'], 'correct'=>0],
        ['lang'=>'JavaScript', 'code'=>'if (score = 10) {
  win();
}', 'options'=>['Usar comparación: score === 10','Cambiar if por for','Usar score == true','Quitar las llaves'], 'correct'=>0],
        ['lang'=>'JavaScript DOM', 'code'=>'document.querySelectorAll(".btn")
  .addEventListener("click", play);', 'options'=>['Recorrer la NodeList con forEach','Cambiar .btn por #btn siempre','Usar onclick en body','Quitar el evento'], 'correct'=>0],
        ['lang'=>'JavaScript DOM', 'code'=>'const title = document.querySelector("#title");
title.textContent = "Hola";', 'options'=>['Comprobar que title existe antes de usarlo','Cambiar textContent por innerSQL','Usar document.title solamente','Quitar el selector'], 'correct'=>0],
        ['lang'=>'JavaScript', 'code'=>'const nums = [1, 2, 3];
const dobles = nums.map(n => { n * 2 });', 'options'=>['Añadir return o quitar las llaves','Cambiar map por alert','Usar n ** "2"','Poner dobles como var global'], 'correct'=>0],
        ['lang'=>'JavaScript Fetch', 'code'=>'const res = fetch("/api/user");
const data = res.json();', 'options'=>['Usar await en fetch y en res.json()','Cambiar json por html','Quitar const','Usar setTimeout'], 'correct'=>0],
        ['lang'=>'JavaScript', 'code'=>'const config = JSON.parse(localStorage.getItem("config"));
console.log(config.theme);', 'options'=>['Dar fallback si config es null','Usar JSON.stringify para leer','Cambiar theme por color siempre','Guardar en sessionStorage sin leer'], 'correct'=>0],
        ['lang'=>'JavaScript', 'code'=>'setInterval(spawnEnemy, 1000);
// al salir de la pantalla...', 'options'=>['Guardar el id y hacer clearInterval','Usar setInterval dos veces','Poner 0ms siempre','Borrar spawnEnemy'], 'correct'=>0],
        ['lang'=>'JavaScript Modules', 'code'=>'import { startGame } from "utils.js";', 'options'=>['Usar ruta relativa: "./utils.js"','Cambiar import por require en navegador','Añadir href','Usar src="utils.js" dentro del import'], 'correct'=>0],
        ['lang'=>'JavaScript Class', 'code'=>'class Player {
  constructor(name) {
    name = name;
  }
}', 'options'=>['Asignar this.name = name','Cambiar class por object','Usar constructor = name','Quitar el parámetro'], 'correct'=>0],
        ['lang'=>'JavaScript', 'code'=>'const total = "10" + 5;', 'options'=>['Convertir "10" a número antes de sumar','Cambiar + por &&','Usar total.length','Poner 5 entre comillas también'], 'correct'=>0],
        ['lang'=>'JavaScript Events', 'code'=>'button.addEventListener("click", save());', 'options'=>['Pasar la función: save, no save()','Cambiar click por submit siempre','Usar addEvent','Quitar button'], 'correct'=>0],
        ['lang'=>'MySQL', 'code'=>'SELECT * users;', 'options'=>['Añadir FROM: SELECT * FROM users;','Cambiar SELECT por GET','Usar WHERE sin condición','Añadir comillas a users'], 'correct'=>0],
        ['lang'=>'MySQL', 'code'=>'DELETE users WHERE id = 4;', 'options'=>['Usar DELETE FROM users WHERE id = 4;','Cambiar DELETE por REMOVE','Quitar WHERE','Usar DROP DATABASE'], 'correct'=>0],
        ['lang'=>'MySQL', 'code'=>'SELECT * FROM users
WHERE deleted_at = NULL;', 'options'=>['Usar IS NULL','Usar == NULL','Usar LIKE NULL','Cambiar NULL por "null"'], 'correct'=>0],
        ['lang'=>'MySQL', 'code'=>'CREATE TABLE users (
  id INT,
  email VARCHAR
);', 'options'=>['Definir VARCHAR(255) y clave primaria si toca','Cambiar INT por IMAGE','Usar email LIST','Quitar paréntesis'], 'correct'=>0],
        ['lang'=>'MySQL', 'code'=>'SELECT * FROM users
ORDER username BY ASC;', 'options'=>['Usar ORDER BY username ASC','Usar SORT username','Cambiar ASC por UP','Quitar SELECT'], 'correct'=>0],
        ['lang'=>'MySQL', 'code'=>'SELECT user_id, COUNT(*) AS total
FROM orders
WHERE total > 3
GROUP BY user_id;', 'options'=>['Usar HAVING total > 3','Cambiar COUNT por SUM siempre','Quitar GROUP BY','Usar WHERE después de GROUP BY'], 'correct'=>0],
        ['lang'=>'MySQL', 'code'=>'SELECT * FROM users
JOIN orders ON id = user_id;', 'options'=>['Calificar columnas: users.id = orders.user_id','Quitar el JOIN','Usar id == user_id','Cambiar users por *'], 'correct'=>0],
        ['lang'=>'MySQL', 'code'=>'INSERT INTO users (name, email)
VALUES (Daniel, daniel@example.com);', 'options'=>['Poner strings entre comillas','Cambiar INSERT por PUSH','Quitar columnas','Usar comillas en la tabla'], 'correct'=>0],
        ['lang'=>'MySQL Seguridad', 'code'=>'$sql = "SELECT * FROM users WHERE name = " . $_GET["name"];', 'options'=>['Usar consultas preparadas con parámetros','Añadir más concatenación','Guardar la query en localStorage','Cambiar SELECT por DELETE'], 'correct'=>0],
        ['lang'=>'MySQL', 'code'=>'UPDATE users SET email = "new@mail.com";', 'options'=>['Añadir WHERE si solo quieres un usuario','Cambiar UPDATE por EDIT','Usar SELECT primero y ya está','Quitar SET'], 'correct'=>0],
        ['lang'=>'PHP', 'code'=>'$name = $_POST["name"];
echo "Hola " . $name;', 'options'=>['Validar/escapar y usar $_POST["name"] ?? ""','Cambiar POST por CSS','Quitar echo siempre','Usar eval'], 'correct'=>0],
        ['lang'=>'PHP API', 'code'=>'echo json_encode($data);', 'options'=>['Enviar header Content-Type: application/json','Cambiar json_encode por alert','Poner HTML dentro del JSON','Usar print_r siempre'], 'correct'=>0],
        ['lang'=>'PHP Seguridad', 'code'=>'if ($_GET["password"] === $user["password"]) {
  login();
}', 'options'=>['Guardar hash y comprobar con password_verify','Comparar contraseñas en la URL','Usar md5 sin salt y listo','Quitar el login'], 'correct'=>0],
        ['lang'=>'Git', 'code'=>'git commit -m Arreglo final', 'options'=>['Poner el mensaje entre comillas','Cambiar commit por upload','Ejecutar git init cada vez','Quitar -m'], 'correct'=>0],
        ['lang'=>'Git', 'code'=>'.env.local
config.local.php
node_modules/', 'options'=>['Meterlos en .gitignore si son secretos/pesados','Subirlos siempre a GitHub','Renombrarlos a index.html','Hacer commit solo de node_modules'], 'correct'=>0],
        ['lang'=>'HTTP / Deploy', 'code'=>'fetch("http://mi-api.com/data")
// desde una web publicada en HTTPS', 'options'=>['Usar HTTPS también en la API','Cambiar fetch por ftp','Desactivar CSS','Usar puerto 21'], 'correct'=>0],
        ['lang'=>'API / CORS', 'code'=>'Access to fetch at /api blocked by CORS policy', 'options'=>['Configurar CORS en el servidor/API','Quitar todos los botones','Cambiar JSON por JPG','Usar z-index'], 'correct'=>0],
        ['lang'=>'Vite', 'code'=>'<img src="/assets/logo.svg">
// funciona en dev, falla al publicar en subcarpeta', 'options'=>['Revisar base/rutas públicas del build','Cambiar svg por exe','Poner la imagen en SQL','Usar <script> para cargar imágenes'], 'correct'=>0],
        ['lang'=>'Accesibilidad', 'code'=>'<div onclick="openMenu()">Menú</div>', 'options'=>['Usar button o añadir rol/teclado correctamente','Cambiar div por span sin más','Quitar el texto','Usar solo hover'], 'correct'=>0],
    ]);
}
function word_pairs(): array {
    return add_pool_ids('impostor', [
        ['theme'=>'Frontend', 'normal'=>'JavaScript', 'impostor'=>'TypeScript', 'hint'=>'Lenguajes y tooling del navegador'],
        ['theme'=>'Frontend', 'normal'=>'HTML', 'impostor'=>'XML', 'hint'=>'Marcado, etiquetas y estructura'],
        ['theme'=>'Frontend', 'normal'=>'CSS', 'impostor'=>'Sass', 'hint'=>'Estilos, layout y apariencia'],
        ['theme'=>'Bases de datos', 'normal'=>'MySQL', 'impostor'=>'PostgreSQL', 'hint'=>'SQL, tablas y consultas'],
        ['theme'=>'Backend', 'normal'=>'PHP', 'impostor'=>'Laravel', 'hint'=>'Servidor, rutas y lógica backend'],
        ['theme'=>'Git', 'normal'=>'GitHub', 'impostor'=>'GitLab', 'hint'=>'Repositorios, issues y despliegues'],
        ['theme'=>'Build tools', 'normal'=>'Vite', 'impostor'=>'Webpack', 'hint'=>'Empaquetado, dev server y build'],
        ['theme'=>'APIs', 'normal'=>'API REST', 'impostor'=>'Webhook', 'hint'=>'Comunicación entre servicios'],
        ['theme'=>'Web', 'normal'=>'Frontend', 'impostor'=>'Backend', 'hint'=>'Capas de una aplicación web'],
        ['theme'=>'Infra', 'normal'=>'Servidor', 'impostor'=>'Hosting', 'hint'=>'Dónde vive y responde una web'],
        ['theme'=>'Dominios', 'normal'=>'Dominio', 'impostor'=>'Subdominio', 'hint'=>'Direcciones web y DNS'],
        ['theme'=>'Redes', 'normal'=>'DNS', 'impostor'=>'CDN', 'hint'=>'Resolución, caché y entrega'],
        ['theme'=>'Seguridad', 'normal'=>'HTTPS', 'impostor'=>'HTTP', 'hint'=>'Protocolos web y certificados'],
        ['theme'=>'Datos', 'normal'=>'JSON', 'impostor'=>'XML', 'hint'=>'Formatos para intercambiar información'],
        ['theme'=>'Navegador', 'normal'=>'localStorage', 'impostor'=>'sessionStorage', 'hint'=>'Persistencia en cliente'],
        ['theme'=>'Gráficos', 'normal'=>'Canvas', 'impostor'=>'SVG', 'hint'=>'Dibujo y gráficos en la web'],
        ['theme'=>'DOM', 'normal'=>'querySelector', 'impostor'=>'getElementById', 'hint'=>'Seleccionar elementos HTML'],
        ['theme'=>'JavaScript', 'normal'=>'Promise', 'impostor'=>'Callback', 'hint'=>'Asincronía y respuestas futuras'],
        ['theme'=>'JavaScript', 'normal'=>'Fetch', 'impostor'=>'Axios', 'hint'=>'Peticiones HTTP desde JS'],
        ['theme'=>'CSS layout', 'normal'=>'Flexbox', 'impostor'=>'Grid', 'hint'=>'Ordenar elementos en pantalla'],
        ['theme'=>'CSS responsive', 'normal'=>'Media query', 'impostor'=>'Container query', 'hint'=>'Adaptar diseño a tamaños'],
        ['theme'=>'Accesibilidad', 'normal'=>'Label', 'impostor'=>'Placeholder', 'hint'=>'Formularios que se entienden bien'],
        ['theme'=>'Accesibilidad', 'normal'=>'Alt text', 'impostor'=>'Title tooltip', 'hint'=>'Ayuda para imágenes y lectura'],
        ['theme'=>'MySQL', 'normal'=>'SELECT', 'impostor'=>'INSERT', 'hint'=>'Operaciones SQL básicas'],
        ['theme'=>'MySQL', 'normal'=>'JOIN', 'impostor'=>'UNION', 'hint'=>'Combinar datos en consultas'],
        ['theme'=>'MySQL', 'normal'=>'Índice', 'impostor'=>'Clave foránea', 'hint'=>'Rendimiento y estructura de tablas'],
        ['theme'=>'PHP', 'normal'=>'PDO', 'impostor'=>'mysqli', 'hint'=>'Conexión segura a base de datos'],
        ['theme'=>'PHP', 'normal'=>'password_hash', 'impostor'=>'md5', 'hint'=>'Contraseñas y seguridad'],
        ['theme'=>'HTTP', 'normal'=>'GET', 'impostor'=>'POST', 'hint'=>'Métodos de petición'],
        ['theme'=>'HTTP', 'normal'=>'CORS', 'impostor'=>'CSRF', 'hint'=>'Seguridad entre web y servidor'],
        ['theme'=>'Git', 'normal'=>'Commit', 'impostor'=>'Push', 'hint'=>'Guardar cambios y subirlos'],
        ['theme'=>'Git', 'normal'=>'Branch', 'impostor'=>'Fork', 'hint'=>'Versiones paralelas del código'],
        ['theme'=>'Vite', 'normal'=>'npm run build', 'impostor'=>'npm run preview', 'hint'=>'Comandos de proyecto frontend'],
        ['theme'=>'Debug', 'normal'=>'Console log', 'impostor'=>'Breakpoint', 'hint'=>'Encontrar errores'],
        ['theme'=>'Errores', 'normal'=>'404', 'impostor'=>'500', 'hint'=>'Estados HTTP de error'],
        ['theme'=>'Performance', 'normal'=>'Lazy loading', 'impostor'=>'Preload', 'hint'=>'Carga de recursos'],
        ['theme'=>'Seguridad web', 'normal'=>'XSS', 'impostor'=>'SQL injection', 'hint'=>'Ataques comunes'],
        ['theme'=>'UI', 'normal'=>'Modal', 'impostor'=>'Toast', 'hint'=>'Componentes de interfaz'],
        ['theme'=>'UI', 'normal'=>'Navbar', 'impostor'=>'Sidebar', 'hint'=>'Navegación de una web'],
        ['theme'=>'JavaScript', 'normal'=>'Array map', 'impostor'=>'Array filter', 'hint'=>'Métodos funcionales de arrays'],
        ['theme'=>'JavaScript', 'normal'=>'Event listener', 'impostor'=>'Mutation observer', 'hint'=>'Reaccionar a cambios o acciones'],
        ['theme'=>'Arquitectura', 'normal'=>'SPA', 'impostor'=>'MPA', 'hint'=>'Tipos de navegación web'],
        ['theme'=>'Deploy', 'normal'=>'GitHub Pages', 'impostor'=>'Cloudflare Pages', 'hint'=>'Publicar webs estáticas'],
        ['theme'=>'Assets', 'normal'=>'SVG', 'impostor'=>'PNG', 'hint'=>'Formatos visuales'],
        ['theme'=>'CSS', 'normal'=>'Variable CSS', 'impostor'=>'Clase CSS', 'hint'=>'Reutilizar estilos'],
        ['theme'=>'Audio web', 'normal'=>'Web Audio API', 'impostor'=>'HTMLAudioElement', 'hint'=>'Sonido y visualización'],
        ['theme'=>'Juegos', 'normal'=>'Hitbox', 'impostor'=>'Collider', 'hint'=>'Colisiones y mecánicas'],
        ['theme'=>'Juegos', 'normal'=>'Cooldown', 'impostor'=>'Combo', 'hint'=>'Reglas de acción en gameplay'],
        ['theme'=>'Contenido', 'normal'=>'Blog JSON', 'impostor'=>'RSS feed', 'hint'=>'Publicar entradas y noticias'],
        ['theme'=>'Portfolio', 'normal'=>'Demo frontend', 'impostor'=>'Landing page', 'hint'=>'Piezas para enseñar trabajo'],
        ['theme'=>'HTML', 'normal'=>'Formulario', 'impostor'=>'Tabla', 'hint'=>'Estructuras HTML de interacción'],
        ['theme'=>'HTML', 'normal'=>'Button', 'impostor'=>'Anchor', 'hint'=>'Elementos clicables'],
        ['theme'=>'HTML', 'normal'=>'Section', 'impostor'=>'Article', 'hint'=>'Semántica de contenido'],
        ['theme'=>'HTML', 'normal'=>'Meta viewport', 'impostor'=>'Charset', 'hint'=>'Configuración del documento'],
        ['theme'=>'CSS', 'normal'=>'Transition', 'impostor'=>'Animation', 'hint'=>'Movimiento y respuesta visual'],
        ['theme'=>'CSS', 'normal'=>'Box shadow', 'impostor'=>'Text shadow', 'hint'=>'Profundidad visual'],
        ['theme'=>'CSS', 'normal'=>'Margin', 'impostor'=>'Padding', 'hint'=>'Espaciado externo e interno'],
        ['theme'=>'CSS', 'normal'=>'Position fixed', 'impostor'=>'Position absolute', 'hint'=>'Colocación en pantalla'],
        ['theme'=>'CSS', 'normal'=>'Z-index', 'impostor'=>'Opacity', 'hint'=>'Capas y visibilidad'],
        ['theme'=>'JavaScript', 'normal'=>'addEventListener', 'impostor'=>'onclick', 'hint'=>'Eventos del navegador'],
        ['theme'=>'JavaScript', 'normal'=>'async await', 'impostor'=>'then catch', 'hint'=>'Estilos de asincronía'],
        ['theme'=>'JavaScript', 'normal'=>'JSON.parse', 'impostor'=>'JSON.stringify', 'hint'=>'Convertir JSON'],
        ['theme'=>'JavaScript', 'normal'=>'setInterval', 'impostor'=>'setTimeout', 'hint'=>'Temporizadores'],
        ['theme'=>'JavaScript', 'normal'=>'classList', 'impostor'=>'dataset', 'hint'=>'Manipular elementos'],
        ['theme'=>'MySQL', 'normal'=>'WHERE', 'impostor'=>'HAVING', 'hint'=>'Filtrado de filas y grupos'],
        ['theme'=>'MySQL', 'normal'=>'ORDER BY', 'impostor'=>'GROUP BY', 'hint'=>'Ordenar y agrupar'],
        ['theme'=>'MySQL', 'normal'=>'LIMIT', 'impostor'=>'OFFSET', 'hint'=>'Paginación de resultados'],
        ['theme'=>'MySQL', 'normal'=>'Primary key', 'impostor'=>'Unique key', 'hint'=>'Identificadores en tablas'],
        ['theme'=>'PHP', 'normal'=>'json_encode', 'impostor'=>'json_decode', 'hint'=>'Enviar y leer JSON'],
        ['theme'=>'PHP', 'normal'=>'prepare', 'impostor'=>'query', 'hint'=>'Consultas PDO'],
        ['theme'=>'PHP', 'normal'=>'session', 'impostor'=>'cookie', 'hint'=>'Persistencia del usuario'],
        ['theme'=>'HTTP', 'normal'=>'200 OK', 'impostor'=>'201 Created', 'hint'=>'Respuestas correctas'],
        ['theme'=>'HTTP', 'normal'=>'401', 'impostor'=>'403', 'hint'=>'Permisos y autenticación'],
        ['theme'=>'DevOps', 'normal'=>'Cloudflare Worker', 'impostor'=>'PHP API', 'hint'=>'Proxy y servidor'],
        ['theme'=>'Git', 'normal'=>'Pull request', 'impostor'=>'Merge commit', 'hint'=>'Colaboración en repos'],
        ['theme'=>'Git', 'normal'=>'git status', 'impostor'=>'git log', 'hint'=>'Inspeccionar cambios'],
        ['theme'=>'Vite', 'normal'=>'public', 'impostor'=>'src', 'hint'=>'Carpetas del proyecto'],
        ['theme'=>'Testing', 'normal'=>'Bug report', 'impostor'=>'Feature request', 'hint'=>'Calidad y tareas'],
        ['theme'=>'UX', 'normal'=>'Feedback visual', 'impostor'=>'Microinteracción', 'hint'=>'Sensación de respuesta'],
    ]);
}


function mentira_pool(): array {
    $json = <<<'JSON'
[
  {
    "category": "HTML",
    "difficulty": 1,
    "question": "¿Qué etiqueta HTML se usaba antiguamente para texto parpadeante?",
    "real": "<blink>",
    "fakes": [
      "<flash>",
      "<pulse>",
      "<marquee-blink>"
    ]
  },
  {
    "category": "HTML",
    "difficulty": 1,
    "question": "¿Qué etiqueta enlaza una hoja CSS externa?",
    "real": "<link>",
    "fakes": [
      "<style src=\"style.css\">",
      "<css href=\"style.css\">",
      "<script rel=\"stylesheet\">"
    ]
  },
  {
    "category": "HTML",
    "difficulty": 1,
    "question": "¿Qué atributo da texto alternativo a una imagen?",
    "real": "alt",
    "fakes": [
      "title",
      "label",
      "description"
    ]
  },
  {
    "category": "HTML",
    "difficulty": 1,
    "question": "¿Qué etiqueta representa la navegación principal?",
    "real": "<nav>",
    "fakes": [
      "<navbar>",
      "<menuitem>",
      "<navigation>"
    ]
  },
  {
    "category": "HTML",
    "difficulty": 1,
    "question": "¿Qué etiqueta representa el contenido principal de la página?",
    "real": "<main>",
    "fakes": [
      "<content>",
      "<primary>",
      "<body-main>"
    ]
  },
  {
    "category": "HTML",
    "difficulty": 1,
    "question": "¿Qué atributo conecta un label con un input?",
    "real": "for",
    "fakes": [
      "to",
      "target",
      "namefor"
    ]
  },
  {
    "category": "HTML",
    "difficulty": 2,
    "question": "¿Qué etiqueta permite cargar JavaScript externo?",
    "real": "<script src=\"app.js\"></script>",
    "fakes": [
      "<js href=\"app.js\">",
      "<link script=\"app.js\">",
      "<code src=\"app.js\">"
    ]
  },
  {
    "category": "HTML",
    "difficulty": 2,
    "question": "¿Qué atributo abre un enlace en una pestaña nueva?",
    "real": "target=\"_blank\"",
    "fakes": [
      "newtab=\"true\"",
      "href=\"blank\"",
      "window=\"new\""
    ]
  },
  {
    "category": "HTML",
    "difficulty": 2,
    "question": "¿Qué atributo hace obligatorio un input?",
    "real": "required",
    "fakes": [
      "mandatory",
      "needed",
      "validate"
    ]
  },
  {
    "category": "HTML",
    "difficulty": 2,
    "question": "¿Qué etiqueta agrupa opciones dentro de un select?",
    "real": "<optgroup>",
    "fakes": [
      "<optiongroup>",
      "<selectgroup>",
      "<groupoption>"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 1,
    "question": "¿Qué propiedad CSS activa Flexbox?",
    "real": "display: flex",
    "fakes": [
      "flex: true",
      "layout: flex",
      "position: flex"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 1,
    "question": "¿Qué propiedad CSS activa Grid?",
    "real": "display: grid",
    "fakes": [
      "grid: true",
      "layout: grid",
      "position: grid"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 1,
    "question": "¿Qué selector apunta a una clase llamada card?",
    "real": ".card",
    "fakes": [
      "#card",
      "card",
      "@card"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 1,
    "question": "¿Qué selector apunta a un id llamado app?",
    "real": "#app",
    "fakes": [
      ".app",
      "app",
      "@app"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 1,
    "question": "¿Qué propiedad controla el espacio interno?",
    "real": "padding",
    "fakes": [
      "margin",
      "gap",
      "outline"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 1,
    "question": "¿Qué propiedad controla el espacio externo?",
    "real": "margin",
    "fakes": [
      "padding",
      "border-spacing",
      "inset"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 2,
    "question": "¿Qué propiedad redondea esquinas?",
    "real": "border-radius",
    "fakes": [
      "corner-radius",
      "radius-border",
      "round-corners"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 2,
    "question": "¿Qué propiedad controla el orden de capas?",
    "real": "z-index",
    "fakes": [
      "layer-index",
      "stack-order",
      "depth"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 2,
    "question": "¿Qué propiedad define columnas en CSS Grid?",
    "real": "grid-template-columns",
    "fakes": [
      "grid-columns-template",
      "columns-grid",
      "template-grid-columns"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 2,
    "question": "¿Qué propiedad separa elementos en flex/grid?",
    "real": "gap",
    "fakes": [
      "space-between-items",
      "item-spacing",
      "grid-gap-only"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 3,
    "question": "¿Qué pseudoclase detecta el foco de teclado visible?",
    "real": "focus-visible",
    "fakes": [
      "keyboard-focus",
      "focus-keyboard",
      "tab-focus"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 3,
    "question": "¿Qué función CSS permite elegir entre mínimo, ideal y máximo?",
    "real": "clamp()",
    "fakes": [
      "range()",
      "between()",
      "limit()"
    ]
  },
  {
    "category": "CSS",
    "difficulty": 3,
    "question": "¿Qué unidad equivale al 1% del ancho del viewport?",
    "real": "vw",
    "fakes": [
      "vh",
      "vmin",
      "remw"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 1,
    "question": "¿Qué método convierte texto JSON en objeto JavaScript?",
    "real": "JSON.parse()",
    "fakes": [
      "JSON.decode()",
      "JSON.toObject()",
      "parse.JSON()"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 1,
    "question": "¿Qué método convierte un objeto en texto JSON?",
    "real": "JSON.stringify()",
    "fakes": [
      "JSON.encode()",
      "JSON.toText()",
      "string.JSON()"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 1,
    "question": "¿Qué método selecciona el primer elemento que coincide?",
    "real": "document.querySelector()",
    "fakes": [
      "document.selectOne()",
      "document.getFirst()",
      "document.find()"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 1,
    "question": "¿Qué método añade un listener de evento?",
    "real": "addEventListener()",
    "fakes": [
      "listenEvent()",
      "onEventAdd()",
      "eventPush()"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 1,
    "question": "¿Qué evento se dispara al pulsar un botón?",
    "real": "click",
    "fakes": [
      "press",
      "tapbutton",
      "buttondown"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 2,
    "question": "¿Qué método de array transforma cada elemento?",
    "real": "map()",
    "fakes": [
      "filter()",
      "reduce()",
      "find()"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 2,
    "question": "¿Qué método de array deja solo algunos elementos?",
    "real": "filter()",
    "fakes": [
      "map()",
      "sliceEach()",
      "where()"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 2,
    "question": "¿Qué palabra espera una Promise dentro de async?",
    "real": "await",
    "fakes": [
      "wait",
      "yield promise",
      "pause"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 2,
    "question": "¿Qué API permite guardar datos simples en el navegador?",
    "real": "localStorage",
    "fakes": [
      "browserDB",
      "clientFiles",
      "DOMStorageOnly"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 2,
    "question": "¿Qué propiedad permite leer atributos data-*?",
    "real": "dataset",
    "fakes": [
      "dataMap",
      "attributes.data",
      "dataList"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 3,
    "question": "¿Qué método cancela el comportamiento por defecto de un formulario?",
    "real": "preventDefault()",
    "fakes": [
      "stopDefault()",
      "cancelSubmit()",
      "blockEvent()"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 3,
    "question": "¿Qué operador evita errores al acceder a propiedades opcionales?",
    "real": "?.",
    "fakes": [
      "??",
      "::",
      ".?"
    ]
  },
  {
    "category": "JavaScript",
    "difficulty": 3,
    "question": "¿Qué función programa una ejecución repetida por intervalo?",
    "real": "setInterval()",
    "fakes": [
      "repeatTimeout()",
      "loopTimer()",
      "setLoop()"
    ]
  },
  {
    "category": "MySQL",
    "difficulty": 1,
    "question": "¿Qué cláusula SQL filtra filas?",
    "real": "WHERE",
    "fakes": [
      "FILTER",
      "HAVING ROWS",
      "ONLY"
    ]
  },
  {
    "category": "MySQL",
    "difficulty": 1,
    "question": "¿Qué cláusula SQL ordena resultados?",
    "real": "ORDER BY",
    "fakes": [
      "SORT BY",
      "GROUP SORT",
      "ORDER ASC BY"
    ]
  },
  {
    "category": "MySQL",
    "difficulty": 1,
    "question": "¿Qué cláusula SQL limita la cantidad de filas?",
    "real": "LIMIT",
    "fakes": [
      "COUNT ONLY",
      "MAX ROWS",
      "STOP AT"
    ]
  },
  {
    "category": "MySQL",
    "difficulty": 2,
    "question": "¿Qué cláusula SQL agrupa filas?",
    "real": "GROUP BY",
    "fakes": [
      "COLLECT BY",
      "MERGE BY",
      "BUNDLE BY"
    ]
  },
  {
    "category": "MySQL",
    "difficulty": 2,
    "question": "¿Qué cláusula SQL filtra grupos agregados?",
    "real": "HAVING",
    "fakes": [
      "WHERE GROUP",
      "FILTER GROUPS",
      "ONLY GROUP"
    ]
  },
  {
    "category": "MySQL",
    "difficulty": 2,
    "question": "¿Qué sentencia SQL inserta datos?",
    "real": "INSERT INTO",
    "fakes": [
      "PUSH INTO",
      "ADD ROW",
      "CREATE DATA"
    ]
  },
  {
    "category": "MySQL",
    "difficulty": 2,
    "question": "¿Qué sentencia SQL modifica filas existentes?",
    "real": "UPDATE",
    "fakes": [
      "CHANGE",
      "MODIFY ROW",
      "SET TABLE"
    ]
  },
  {
    "category": "MySQL",
    "difficulty": 2,
    "question": "¿Qué sentencia SQL elimina filas?",
    "real": "DELETE FROM",
    "fakes": [
      "REMOVE ROW",
      "DROP ROW",
      "ERASE FROM"
    ]
  },
  {
    "category": "MySQL",
    "difficulty": 3,
    "question": "¿Qué tipo de unión devuelve coincidencias de ambas tablas?",
    "real": "INNER JOIN",
    "fakes": [
      "CENTER JOIN",
      "MATCH JOIN",
      "BOTH JOIN"
    ]
  },
  {
    "category": "MySQL",
    "difficulty": 3,
    "question": "¿Qué mecanismo evita inyección SQL en consultas PHP/MySQL?",
    "real": "consultas preparadas",
    "fakes": [
      "concatenar strings",
      "escapar con CSS",
      "usar SELECT *"
    ]
  },
  {
    "category": "PHP",
    "difficulty": 1,
    "question": "¿Qué función PHP codifica datos como JSON?",
    "real": "json_encode()",
    "fakes": [
      "json_pack()",
      "to_json()",
      "json_stringify()"
    ]
  },
  {
    "category": "PHP",
    "difficulty": 1,
    "question": "¿Qué función PHP decodifica JSON?",
    "real": "json_decode()",
    "fakes": [
      "json_parse()",
      "from_json()",
      "json_unstringify()"
    ]
  },
  {
    "category": "PHP",
    "difficulty": 2,
    "question": "¿Qué superglobal contiene datos enviados por POST?",
    "real": "$_POST",
    "fakes": [
      "$POST",
      "$_BODY",
      "$_FORM"
    ]
  },
  {
    "category": "PHP",
    "difficulty": 2,
    "question": "¿Qué método de PDO prepara una consulta?",
    "real": "prepare()",
    "fakes": [
      "ready()",
      "statement()",
      "sqlPrepare()"
    ]
  },
  {
    "category": "PHP",
    "difficulty": 2,
    "question": "¿Qué función inicia una sesión en PHP?",
    "real": "session_start()",
    "fakes": [
      "start_session()",
      "session_open()",
      "cookie_session()"
    ]
  },
  {
    "category": "PHP",
    "difficulty": 3,
    "question": "¿Qué función convierte caracteres especiales en entidades HTML?",
    "real": "htmlspecialchars()",
    "fakes": [
      "html_escape()",
      "safe_html()",
      "escapeTags()"
    ]
  },
  {
    "category": "Git",
    "difficulty": 1,
    "question": "¿Qué comando guarda cambios en el repositorio local?",
    "real": "git commit",
    "fakes": [
      "git push",
      "git save",
      "git upload"
    ]
  },
  {
    "category": "Git",
    "difficulty": 1,
    "question": "¿Qué comando sube commits al remoto?",
    "real": "git push",
    "fakes": [
      "git pull",
      "git send",
      "git upload"
    ]
  },
  {
    "category": "Git",
    "difficulty": 1,
    "question": "¿Qué comando descarga cambios del remoto?",
    "real": "git pull",
    "fakes": [
      "git push",
      "git download",
      "git syncdown"
    ]
  },
  {
    "category": "Git",
    "difficulty": 2,
    "question": "¿Qué comando muestra archivos cambiados?",
    "real": "git status",
    "fakes": [
      "git state",
      "git changes",
      "git current"
    ]
  },
  {
    "category": "Git",
    "difficulty": 2,
    "question": "¿Qué comando crea una rama?",
    "real": "git branch",
    "fakes": [
      "git fork",
      "git path",
      "git split"
    ]
  },
  {
    "category": "Git",
    "difficulty": 2,
    "question": "¿Qué comando cambia de rama de forma moderna?",
    "real": "git switch",
    "fakes": [
      "git jump",
      "git change",
      "git move"
    ]
  },
  {
    "category": "Git",
    "difficulty": 3,
    "question": "¿Qué archivo evita subir cosas al repo?",
    "real": ".gitignore",
    "fakes": [
      "git.exclude",
      "ignore.json",
      ".gitblock"
    ]
  },
  {
    "category": "HTTP",
    "difficulty": 1,
    "question": "¿Qué código HTTP significa “No encontrado”?",
    "real": "404",
    "fakes": [
      "403",
      "500",
      "204"
    ]
  },
  {
    "category": "HTTP",
    "difficulty": 1,
    "question": "¿Qué código HTTP suele indicar éxito?",
    "real": "200",
    "fakes": [
      "201 siempre",
      "100",
      "302"
    ]
  },
  {
    "category": "HTTP",
    "difficulty": 2,
    "question": "¿Qué código HTTP indica error interno del servidor?",
    "real": "500",
    "fakes": [
      "404",
      "301",
      "204"
    ]
  },
  {
    "category": "HTTP",
    "difficulty": 2,
    "question": "¿Qué método HTTP suele crear recursos?",
    "real": "POST",
    "fakes": [
      "GET",
      "TRACE",
      "HEAD"
    ]
  },
  {
    "category": "HTTP",
    "difficulty": 3,
    "question": "¿Qué cabecera indica que una API devuelve JSON?",
    "real": "Content-Type: application/json",
    "fakes": [
      "Accept: text/html",
      "JSON-Type: true",
      "Response: json"
    ]
  },
  {
    "category": "APIs",
    "difficulty": 2,
    "question": "¿Qué función del navegador hace peticiones HTTP modernas?",
    "real": "fetch()",
    "fakes": [
      "requestHTTP()",
      "ajaxFetch()",
      "http.get()"
    ]
  },
  {
    "category": "APIs",
    "difficulty": 2,
    "question": "¿Qué significa CORS?",
    "real": "Cross-Origin Resource Sharing",
    "fakes": [
      "Client-Origin Request Security",
      "Cross Online Resource Sync",
      "Cloudflare Origin Redirect System"
    ]
  },
  {
    "category": "APIs",
    "difficulty": 3,
    "question": "¿Qué formato se usa mucho para intercambiar datos en APIs web?",
    "real": "JSON",
    "fakes": [
      "PSD",
      "EXE",
      "WAV"
    ]
  },
  {
    "category": "Seguridad",
    "difficulty": 2,
    "question": "¿Qué ataque intenta inyectar JavaScript en una página?",
    "real": "XSS",
    "fakes": [
      "CSRF",
      "DDoS",
      "SMTP"
    ]
  },
  {
    "category": "Seguridad",
    "difficulty": 3,
    "question": "¿Qué ataque aprovecha peticiones autenticadas sin permiso del usuario?",
    "real": "CSRF",
    "fakes": [
      "XSS",
      "SQL JOIN",
      "CORS OK"
    ]
  },
  {
    "category": "Seguridad",
    "difficulty": 3,
    "question": "¿Qué debes hacer antes de imprimir texto de usuario en HTML?",
    "real": "escaparlo",
    "fakes": [
      "comprimirlo",
      "subirlo a Git",
      "ponerlo en mayúsculas"
    ]
  },
  {
    "category": "Vite",
    "difficulty": 1,
    "question": "¿Qué carpeta suele generar Vite al compilar?",
    "real": "dist",
    "fakes": [
      "builded",
      "public_html_php",
      "node_cache"
    ]
  },
  {
    "category": "Vite",
    "difficulty": 2,
    "question": "¿Qué comando suele compilar un proyecto Vite?",
    "real": "npm run build",
    "fakes": [
      "npm run preview",
      "vite upload",
      "git build"
    ]
  },
  {
    "category": "Vite",
    "difficulty": 2,
    "question": "¿Qué carpeta se copia tal cual al build en Vite?",
    "real": "public",
    "fakes": [
      "src",
      "node_modules",
      "api_private"
    ]
  },
  {
    "category": "Accesibilidad",
    "difficulty": 2,
    "question": "¿Qué atributo indica a lectores de pantalla el nombre de un botón sin texto?",
    "real": "aria-label",
    "fakes": [
      "screen-name",
      "reader-text",
      "alt-button"
    ]
  },
  {
    "category": "Accesibilidad",
    "difficulty": 2,
    "question": "¿Qué elemento HTML debe usarse para acciones clicables?",
    "real": "button",
    "fakes": [
      "div",
      "span",
      "article"
    ]
  },
  {
    "category": "Curiosidades tech",
    "difficulty": 3,
    "question": "¿Cuál fue el primer dominio .com registrado?",
    "real": "symbolics.com",
    "fakes": [
      "internet.com",
      "web.net",
      "computer.com"
    ]
  },
  {
    "category": "Curiosidades tech",
    "difficulty": 3,
    "question": "¿Qué etiqueta famosa hacía desplazarse texto horizontalmente?",
    "real": "<marquee>",
    "fakes": [
      "<scroll>",
      "<slide>",
      "<move>"
    ]
  }
]

JSON;
    $items = json_decode($json, true);
    return add_pool_ids('mentira', is_array($items) ? $items : []);
}

function mentira_modifiers(): array {
    return [
        ['id'=>'normal', 'label'=>'Ronda clásica', 'desc'=>'Miente creíble y encuentra la verdad.', 'writeMs'=>30000, 'voteMs'=>15000, 'deceptionMult'=>1, 'hideCategory'=>false, 'strict'=>false],
        ['id'=>'relampago', 'label'=>'Ronda relámpago', 'desc'=>'Menos tiempo para inventar. Decide rápido.', 'writeMs'=>22000, 'voteMs'=>12000, 'deceptionMult'=>1, 'hideCategory'=>false, 'strict'=>false],
        ['id'=>'doble', 'label'=>'Doble farol', 'desc'=>'Las mentiras que engañan valen más.', 'writeMs'=>30000, 'voteMs'=>15000, 'deceptionMult'=>2, 'hideCategory'=>false, 'strict'=>false],
        ['id'=>'maldita', 'label'=>'Ronda maldita', 'desc'=>'La categoría se oculta hasta la revelación.', 'writeMs'=>30000, 'voteMs'=>15000, 'deceptionMult'=>1, 'hideCategory'=>true, 'strict'=>false],
        ['id'=>'espejo', 'label'=>'Ronda espejo', 'desc'=>'No vale copiar demasiado la respuesta real.', 'writeMs'=>30000, 'voteMs'=>15000, 'deceptionMult'=>1, 'hideCategory'=>false, 'strict'=>true],
    ];
}

function mentira_pick_modifier(int $roundNumber): array {
    $mods = mentira_modifiers();
    if ($roundNumber <= 1) return $mods[0];
    $idx = abs(crc32('mentira-' . $roundNumber . '-' . now_ms())) % count($mods);
    return $mods[$idx];
}

function mentira_latest_streaks(PDO $pdo, int $roomId): array {
    $st = $pdo->prepare("SELECT state_json FROM party_rounds WHERE room_id = ? AND mode = 'mentira' AND status IN ('results','finished') ORDER BY id DESC LIMIT 1");
    $st->execute([$roomId]);
    $row = $st->fetch();
    if (!$row) return [];
    $state = jdec($row['state_json'] ?? '{}');
    return is_array($state['detectiveStreaks'] ?? null) ? $state['detectiveStreaks'] : [];
}

function mentira_pick_question(PDO $pdo, int $roomId, int $roundNumber): array {
    $targetDifficulty = $roundNumber <= 2 ? 1 : ($roundNumber <= 5 ? 2 : 3);
    $pool = array_values(array_filter(mentira_pool(), function ($item) use ($targetDifficulty) {
        return (int)($item['difficulty'] ?? 1) <= $targetDifficulty;
    }));
    if (!$pool) $pool = mentira_pool();
    return pick_unused_pool_item($pdo, $roomId, 'mentira', $pool);
}


function mentira_category_context(string $category): string {
    $key = strtolower(trim($category));
    $map = [
        'git' => 'Estás en una carpeta de proyecto usando Git/GitHub desde la terminal.',
        'mysql' => 'Estás escribiendo una consulta SQL para una base de datos MySQL/MariaDB.',
        'sql' => 'Estás escribiendo una consulta SQL para una base de datos MySQL/MariaDB.',
        'javascript' => 'Estás programando lógica de navegador con JavaScript.',
        'html' => 'Estás escribiendo la estructura de una página web con HTML.',
        'css' => 'Estás ajustando el diseño visual de una web con CSS.',
        'php' => 'Estás tocando backend PHP, normalmente recibiendo datos y hablando con MySQL.',
        'http' => 'Estás revisando una petición o respuesta HTTP entre frontend y servidor.',
        'apis' => 'Estás conectando el frontend con un servicio externo o endpoint de backend.',
        'seguridad' => 'Estás evitando fallos típicos de seguridad web.',
        'vite' => 'Estás trabajando en un proyecto frontend moderno compilado con Vite.',
        'npm' => 'Estás usando Node/npm para instalar dependencias o ejecutar scripts.',
    ];
    return $map[$key] ?? 'Estás resolviendo una pregunta técnica de desarrollo web.';
}

function mentira_lie_tip_for(array $q): string {
    $category = strtolower((string)($q['category'] ?? 'Tech'));
    $real = (string)($q['real'] ?? '');
    $map = [
        'git' => 'Haz que tu mentira parezca un comando de Git real, por ejemplo con formato “git algo”.',
        'mysql' => 'Usa palabras que suenen a SQL, como SELECT, WHERE, ROW, TABLE o UPDATE.',
        'sql' => 'Usa palabras que suenen a SQL, como SELECT, WHERE, ROW, TABLE o UPDATE.',
        'javascript' => 'Una mentira buena parece una API real de JS: camelCase, paréntesis o JSON.',
        'html' => 'Puedes inventar una etiqueta o atributo que suene semántico, pero no copies la respuesta real.',
        'css' => 'Las mentiras de CSS cuelan mejor si parecen propiedades reales con guiones.',
        'php' => 'Haz que parezca una función de PHP: snake_case o nombre técnico.',
        'http' => 'Usa códigos, métodos o cabeceras que parezcan de red.',
    ];
    return $map[$category] ?? ('Intenta que tu mentira tenga el mismo estilo que “' . $real . '”, pero con un detalle falso.');
}

function mentira_explanation_for(array $q): string {
    $category = strtolower((string)($q['category'] ?? 'Tech'));
    $real = (string)($q['real'] ?? '');
    $question = (string)($q['question'] ?? '');
    $map = [
        'git' => 'En Git/GitHub, “' . $real . '” es la opción correcta para esa acción del repositorio.',
        'mysql' => 'En MySQL/MariaDB, “' . $real . '” es la palabra o sentencia usada en ese tipo de consulta.',
        'sql' => 'En MySQL/MariaDB, “' . $real . '” es la palabra o sentencia usada en ese tipo de consulta.',
        'javascript' => 'En JavaScript, “' . $real . '” es la API, método o sintaxis correcta para ese caso.',
        'html' => 'En HTML, “' . $real . '” es la etiqueta o atributo correcto para esa parte de la página.',
        'css' => 'En CSS, “' . $real . '” es la propiedad o valor correcto para conseguir ese efecto visual.',
        'php' => 'En PHP, “' . $real . '” es la función o técnica correcta para ese trabajo de backend.',
        'http' => 'En HTTP, “' . $real . '” es el código, método o concepto correcto para esa situación.',
        'apis' => 'En una integración con APIs, “' . $real . '” es el concepto o técnica correcta.',
        'seguridad' => 'En seguridad web, “' . $real . '” es la opción correcta para reducir ese riesgo.',
    ];
    $base = $map[$category] ?? ('La respuesta correcta era “' . $real . '”.');
    return $base . ' Pregunta: ' . $question;
}

function mentira_required_players(array $players): array {
    $online = array_values(array_filter($players, fn($p) => !empty($p['online'])));
    return $online ?: array_values($players);
}

function mentira_clean_text($value, int $max = 100): string {
    $text = (string)$value;
    $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? '';
    $text = preg_replace('/\s+/u', ' ', trim($text)) ?? '';
    if (function_exists('mb_substr')) return mb_substr($text, 0, $max, 'UTF-8');
    return substr($text, 0, $max);
}

function mentira_norm($value): string {
    $text = html_entity_decode(mentira_clean_text($value, 160), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = function_exists('mb_strtolower') ? mb_strtolower($text, 'UTF-8') : strtolower($text);
    $text = preg_replace('/[`"\']+/u', '', $text) ?? $text;
    $text = preg_replace('/\s+/u', ' ', trim($text)) ?? '';
    return $text;
}

function mentira_fake_text($entry): string {
    if (is_array($entry)) return mentira_clean_text($entry['text'] ?? '', 100);
    return mentira_clean_text($entry, 100);
}

function mentira_validate_fake(string $fake, array $state): ?string {
    $real = (string)($state['realAnswer'] ?? '');
    $norm = mentira_norm($fake);
    $realNorm = mentira_norm($real);
    $len = function_exists('mb_strlen') ? mb_strlen($fake, 'UTF-8') : strlen($fake);
    if ($len < 3) return 'Esa mentira es demasiado corta.';
    if (!preg_match('/[\p{L}\p{N}_#.<>():$\-]/u', $fake)) return 'Escribe algo que parezca una respuesta real.';
    $banned = ['xd','x d','asdf','qwerty','patata','no se','no sé','ni idea','aaaa','test','prueba'];
    if (in_array($norm, $banned, true)) return 'Esa mentira es demasiado obvia. Intenta que parezca real.';
    if ($norm === $realNorm) return 'No puedes escribir la respuesta verdadera como mentira.';
    foreach (($state['fakeAnswers'] ?? []) as $entry) {
        if (mentira_norm(mentira_fake_text($entry)) === $norm) return 'Ya existe una mentira igual. Inventa otra.';
    }
    $pct = 0.0;
    if ($realNorm !== '' && $norm !== '') similar_text($norm, $realNorm, $pct);
    $strict = !empty(($state['modifier'] ?? [])['strict']);
    if ($pct >= ($strict ? 78 : 92)) return 'Se parece demasiado a la respuesta real. Haz un farol distinto.';
    return null;
}

function mentira_generated_fake(array $state, array $used, int $slot = 0): string {
    $bank = $state['fakeBank'] ?? [];
    if (!is_array($bank)) $bank = [];
    $generic = ['undefined', 'null', 'auto', 'default', 'main()', 'server.push()', 'data-bind', 'response.ok()', 'index.html', 'npm run fix', 'SELECT ALL', 'git save', 'display: auto', 'HTTP 299'];
    $candidates = array_values(array_merge($bank, $generic));
    $offset = count($candidates) ? ($slot % count($candidates)) : 0;
    for ($i = 0; $i < count($candidates); $i++) {
        $candidate = mentira_clean_text($candidates[($offset + $i) % count($candidates)], 100);
        if ($candidate === '') continue;
        $norm = mentira_norm($candidate);
        if (!isset($used[$norm]) && $norm !== mentira_norm($state['realAnswer'] ?? '')) return $candidate;
    }
    return 'respuesta_' . ($slot + 1);
}

function mentira_prepare_options(array $players, array &$state): void {
    if (!empty($state['optionsPrepared']) && !empty($state['options'])) return;
    if (!isset($state['fakeAnswers']) || !is_array($state['fakeAnswers'])) $state['fakeAnswers'] = [];
    $used = [mentira_norm($state['realAnswer'] ?? '') => true];
    foreach ($state['fakeAnswers'] as $pid => $entry) {
        $text = mentira_fake_text($entry);
        if ($text === '') { unset($state['fakeAnswers'][$pid]); continue; }
        if (!is_array($entry)) $state['fakeAnswers'][$pid] = ['text'=>$text, 'auto'=>false, 'double'=>false, 'at'=>now_ms()];
        else $state['fakeAnswers'][$pid]['text'] = $text;
        $used[mentira_norm($text)] = true;
    }

    $required = mentira_required_players($players);
    $slot = 0;
    foreach ($required as $p) {
        $pid = (string)(int)$p['id'];
        if (isset($state['fakeAnswers'][$pid])) continue;
        $auto = mentira_generated_fake($state, $used, $slot++);
        $state['fakeAnswers'][$pid] = ['text'=>$auto, 'auto'=>true, 'double'=>false, 'at'=>now_ms()];
        $used[mentira_norm($auto)] = true;
    }

    $options = [['id'=>'real', 'text'=>mentira_clean_text($state['realAnswer'] ?? 'Respuesta real', 100), 'kind'=>'real', 'ownerId'=>null, 'auto'=>false, 'double'=>false]];
    foreach ($state['fakeAnswers'] as $pid => $entry) {
        $text = mentira_fake_text($entry);
        if ($text === '') continue;
        $options[] = ['id'=>'p_' . (int)$pid, 'text'=>$text, 'kind'=>'player', 'ownerId'=>(int)$pid, 'auto'=>!empty($entry['auto']), 'double'=>!empty($entry['double'])];
    }
    $botIndex = 0;
    while (count($options) < 4) {
        $bot = mentira_generated_fake($state, $used, 20 + $botIndex);
        $used[mentira_norm($bot)] = true;
        $options[] = ['id'=>'bot_' . $botIndex, 'text'=>$bot, 'kind'=>'bot', 'ownerId'=>null, 'auto'=>true, 'double'=>false];
        $botIndex++;
    }
    shuffle($options);
    $state['options'] = $options;
    $state['optionsPrepared'] = true;
    $state['voteStartedAtMs'] = now_ms();
    if (!isset($state['jokers']) || !is_array($state['jokers'])) $state['jokers'] = [];
}

function mentira_option_map(array $state): array {
    $map = [];
    foreach (($state['options'] ?? []) as $option) {
        if (isset($option['id'])) $map[(string)$option['id']] = $option;
    }
    return $map;
}

function mentira_all_wrote(array $state, array $players): bool {
    $required = mentira_required_players($players);
    if (!$required) return true;
    foreach ($required as $p) {
        if (!isset(($state['fakeAnswers'] ?? [])[(string)(int)$p['id']])) return false;
    }
    return true;
}

function mentira_all_voted(array $state, array $players): bool {
    $required = mentira_required_players($players);
    if (!$required) return true;
    foreach ($required as $p) {
        if (!isset(($state['votes'] ?? [])[(string)(int)$p['id']])) return false;
    }
    return true;
}

function mentira_vote_ms(array $state): int {
    return (int)(($state['modifier'] ?? [])['voteMs'] ?? 10000);
}

function mentira_apply_fifty(array &$state, string $pid): void {
    mentira_prepare_options([], $state);
    if (!empty(($state['jokers'][$pid] ?? [])['fifty'])) return;
    $own = 'p_' . (int)$pid;
    $candidates = [];
    foreach (($state['options'] ?? []) as $option) {
        $id = (string)($option['id'] ?? '');
        if ($id !== 'real' && $id !== $own) $candidates[] = $id;
    }
    shuffle($candidates);
    $removeCount = count($state['options'] ?? []) >= 5 ? 2 : 1;
    $removed = array_slice($candidates, 0, $removeCount);
    $state['jokers'][$pid]['fifty'] = true;
    $state['jokers'][$pid]['removed'] = $removed;
}

function mentira_resolve_round(PDO $pdo, array $players, array &$state): void {
    if (!empty($state['resolved'])) return;
    mentira_prepare_options($players, $state);
    $map = mentira_option_map($state);
    $votes = $state['votes'] ?? [];
    $voteTimes = $state['voteTimes'] ?? [];
    $scores = [];
    $breakdown = [];
    $fooledBy = [];
    $lieVotes = [];
    $rows = [];
    $streaks = $state['streaks'] ?? [];
    $newStreaks = [];
    $deceptionMult = (int)(($state['modifier'] ?? [])['deceptionMult'] ?? 1);

    foreach ($players as $p) {
        $pid = (string)(int)$p['id'];
        $scores[$pid] = 0;
        $breakdown[$pid] = [];
        $fooledBy[$pid] = [];
        $newStreaks[$pid] = 0;
    }

    foreach ($votes as $voter => $voteIdRaw) {
        $voter = (string)(int)$voter;
        $voteId = (string)$voteIdRaw;
        $option = $map[$voteId] ?? null;
        if (!$option) continue;
        $isReal = $voteId === 'real';
        $votedText = (string)($option['text'] ?? '');
        if ($isReal) {
            $scores[$voter] = ($scores[$voter] ?? 0) + 100;
            $breakdown[$voter][] = '+100 por encontrar la verdad';
            $at = (int)($voteTimes[$voter] ?? now_ms());
            if (!empty($state['voteStartedAtMs']) && ($at - (int)$state['voteStartedAtMs']) <= 4000) {
                $scores[$voter] += 20;
                $breakdown[$voter][] = '+20 por votar rápido y acertar';
            }
            $newStreaks[$voter] = (int)($streaks[$voter] ?? 0) + 1;
            if ($newStreaks[$voter] >= 3) {
                $scores[$voter] += 40;
                $breakdown[$voter][] = '+40 racha detective x' . $newStreaks[$voter];
            }
        } else {
            $owner = isset($option['ownerId']) ? (string)(int)$option['ownerId'] : '';
            $newStreaks[$voter] = 0;
            if ($owner !== '' && $owner !== $voter && empty($option['auto'])) {
                $mult = $deceptionMult * (!empty($option['double']) ? 2 : 1);
                $gain = 50 * $mult;
                $scores[$owner] = ($scores[$owner] ?? 0) + $gain;
                $breakdown[$owner][] = '+' . $gain . ' por engañar a ' . $voter;
                $fooledBy[$owner][] = $voter;
                $lieVotes[$owner] = ($lieVotes[$owner] ?? 0) + 1;
            }
        }
        $rows[] = ['playerId'=>(int)$voter, 'vote'=>$voteId, 'text'=>$votedText, 'correct'=>$isReal, 'ownerId'=>$option['ownerId'] ?? null, 'auto'=>!empty($option['auto'])];
    }

    $topOwner = null;
    $topVotes = 0;
    foreach ($lieVotes as $owner => $count) {
        if ($count > $topVotes) { $topVotes = $count; $topOwner = (string)$owner; }
    }
    if ($topOwner !== null && $topVotes > 0) {
        $scores[$topOwner] = ($scores[$topOwner] ?? 0) + 25;
        $breakdown[$topOwner][] = '+25 mentira más votada';
    }

    foreach (($state['fakeAnswers'] ?? []) as $pid => $entry) {
        $pid = (string)(int)$pid;
        if (!empty($entry['double']) && empty($entry['auto']) && empty($fooledBy[$pid])) {
            $scores[$pid] = ($scores[$pid] ?? 0) - 25;
            $breakdown[$pid][] = '-25 doble farol fallido';
        }
    }

    foreach ($scores as $pid => $points) {
        $points = (int)$points;
        if ($points !== 0) add_score($pdo, (int)$pid, $points);
        $scores[$pid] = $points;
    }

    $fastest = null;
    foreach ($rows as $row) {
        $pid = (string)$row['playerId'];
        if (!$row['correct']) continue;
        $t = (int)($voteTimes[$pid] ?? PHP_INT_MAX);
        if ($fastest === null || $t < $fastest['at']) $fastest = ['playerId'=>(int)$pid, 'at'=>$t];
    }
    $premiumText = '';
    if ($topOwner !== null) {
        foreach (($state['options'] ?? []) as $option) {
            if ((string)($option['ownerId'] ?? '') === $topOwner) { $premiumText = (string)($option['text'] ?? ''); break; }
        }
    }

    $state['pointsAwarded'] = $scores;
    $state['scoreBreakdown'] = $breakdown;
    $state['fooledBy'] = $fooledBy;
    $state['votesResolved'] = $rows;
    $state['detectiveStreaks'] = $newStreaks;
    $state['medals'] = [
        'bestLiar' => $topOwner ? ['playerId'=>(int)$topOwner, 'fooled'=>$topVotes] : null,
        'bestDetective' => $fastest ? ['playerId'=>(int)$fastest['playerId']] : null,
        'premiumLie' => $premiumText ? ['playerId'=>(int)$topOwner, 'text'=>$premiumText, 'votes'=>$topVotes] : null,
    ];
    $state['summary'] = [
        'realAnswer'=>(string)($state['realAnswer'] ?? ''),
        'correctVotes'=>count(array_filter($rows, fn($r) => !empty($r['correct']))),
        'fooledVotes'=>count(array_filter($rows, fn($r) => empty($r['correct']))),
    ];
    $state['resolved'] = true;
}

function mentira_auto_progress_room(PDO $pdo, array $room): void {
    if ($pdo->inTransaction()) return;
    $round = active_round($pdo, (int)$room['id']);
    if (!$round || (string)$round['mode'] !== 'mentira' || (string)$round['status'] !== 'playing') return;
    $phase = (string)$round['phase'];
    if (!in_array($phase, ['write','vote'], true)) return;
    $state = jdec($round['state_json']);
    $players = players_for_room($pdo, (int)$room['id']);
    $due = !empty($round['ends_at_ms']) && now_ms() >= (int)$round['ends_at_ms'];
    $ready = $phase === 'write' ? mentira_all_wrote($state, $players) : mentira_all_voted($state, $players);
    if (!$due && !$ready) return;
    $pdo->beginTransaction();
    try {
        $roomLocked = room_by_code($pdo, (string)$room['code'], true);
        if (!$roomLocked) { $pdo->rollBack(); return; }
        $lockedRound = active_round($pdo, (int)$roomLocked['id'], true);
        if (!$lockedRound || (string)$lockedRound['mode'] !== 'mentira' || (string)$lockedRound['status'] !== 'playing') { $pdo->rollBack(); return; }
        $phase = (string)$lockedRound['phase'];
        $state = jdec($lockedRound['state_json']);
        $players = players_for_room($pdo, (int)$roomLocked['id']);
        if ($phase === 'write') {
            mentira_prepare_options($players, $state);
            $ends = now_ms() + mentira_vote_ms($state);
            $pdo->prepare("UPDATE party_rounds SET phase = 'vote', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), $ends, (int)$lockedRound['id']]);
            $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
        } elseif ($phase === 'vote') {
            mentira_resolve_round($pdo, $players, $state);
            $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([jenc($state), (int)$lockedRound['id']]);
            $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
    }
}


function quiz_pool(): array {
    $items = json_decode(<<<'JSON'
[{"category":"HTML","difficulty":1,"context":"Estás creando un enlace en una página HTML para llevar al usuario a otra sección.","question":"¿Qué etiqueta se usa para crear un enlace?","options":["<a>","<link>","<href>","<navlink>"],"correct":0,"explanation":"La etiqueta <a> crea enlaces. El destino se indica normalmente con el atributo href."},{"category":"HTML","difficulty":1,"context":"Estás añadiendo una imagen de perfil y quieres que sea accesible para lectores de pantalla.","question":"¿Qué atributo describe una imagen?","options":["alt","title","aria-img","description"],"correct":0,"explanation":"alt proporciona texto alternativo para imágenes cuando no se ven o se leen con tecnologías de asistencia."},{"category":"HTML","difficulty":1,"context":"Estás organizando la estructura principal de una página con cabecera, contenido y pie.","question":"¿Qué etiqueta representa el contenido principal?","options":["<main>","<primary>","<content>","<body-main>"],"correct":0,"explanation":"<main> marca el contenido principal y ayuda a navegación semántica y accesibilidad."},{"category":"HTML","difficulty":1,"context":"Estás creando un formulario y quieres que al pulsar el texto del label se enfoque el input correcto.","question":"¿Qué atributo del label debe coincidir con el id del input?","options":["for","href","target","name"],"correct":0,"explanation":"El atributo for del label debe coincidir con el id del input asociado."},{"category":"HTML","difficulty":2,"context":"Estás cargando un archivo JavaScript externo llamado app.js en tu HTML.","question":"¿Qué etiqueta es correcta?","options":["<script src=\"app.js\"></script>","<js href=\"app.js\">","<script href=\"app.js\">","<link src=\"app.js\">"],"correct":0,"explanation":"JavaScript externo se carga con <script src=\"...\"></script>. La etiqueta script no se autocierra."},{"category":"HTML","difficulty":2,"context":"Tienes una zona de navegación principal con enlaces a Inicio, Blog y Contacto.","question":"¿Qué etiqueta semántica encaja mejor?","options":["<nav>","<section role=\"links\">","<navbar>","<menuitem>"],"correct":0,"explanation":"<nav> representa una sección de navegación principal o relevante."},{"category":"HTML","difficulty":2,"context":"Estás haciendo una lista de elementos dentro de un <ul>.","question":"¿Qué etiqueta debe envolver cada elemento de la lista?","options":["<li>","<item>","<span>","<row>"],"correct":0,"explanation":"En listas <ul> u <ol>, cada elemento debe ir dentro de <li>."},{"category":"HTML","difficulty":2,"context":"Quieres abrir un enlace externo en una pestaña nueva.","question":"¿Qué atributo se usa normalmente?","options":["target=\"_blank\"","newtab=\"true\"","open=\"tab\"","href=\"_blank\""],"correct":0,"explanation":"target=\"_blank\" abre el enlace en una pestaña o ventana nueva."},{"category":"HTML","difficulty":2,"context":"Estás añadiendo un campo donde el usuario escribe su correo.","question":"¿Qué type de input ayuda a validar email?","options":["email","mail","text-email","address"],"correct":0,"explanation":"<input type=\"email\"> activa validación y teclado adaptado en móviles."},{"category":"HTML","difficulty":3,"context":"Quieres que un botón dentro de un formulario no envíe el formulario al hacer clic.","question":"¿Qué atributo conviene añadir?","options":["type=\"button\"","submit=\"false\"","role=\"static\"","prevent=\"submit\""],"correct":0,"explanation":"Un <button> dentro de un formulario puede enviar por defecto; type=\"button\" evita ese envío."},{"category":"CSS","difficulty":1,"context":"Estás diseñando una tarjeta y quieres separar su contenido del borde interior.","question":"¿Qué propiedad controla el espacio interno?","options":["padding","margin","gap","outline"],"correct":0,"explanation":"padding es el espacio entre el contenido y el borde del elemento."},{"category":"CSS","difficulty":1,"context":"Quieres separar una tarjeta de otros elementos de alrededor.","question":"¿Qué propiedad controla el espacio externo?","options":["margin","padding","border-spacing","inner-gap"],"correct":0,"explanation":"margin crea espacio por fuera del elemento."},{"category":"CSS","difficulty":1,"context":"Estás centrando elementos con Flexbox en horizontal.","question":"¿Qué propiedad alinea en el eje principal?","options":["justify-content","align-text","center-items","content-align"],"correct":0,"explanation":"justify-content alinea elementos en el eje principal de un contenedor flex."},{"category":"CSS","difficulty":1,"context":"Quieres activar Flexbox en un contenedor.","question":"¿Qué declaración CSS es correcta?","options":["display: flex","display: flexbox","layout: flex","position: flex"],"correct":0,"explanation":"display: flex activa el modelo Flexbox."},{"category":"CSS","difficulty":2,"context":"Estás creando un layout de tarjetas en filas y columnas.","question":"¿Qué propiedad define columnas en CSS Grid?","options":["grid-template-columns","grid-columns-template","columns-grid","template-grid-columns"],"correct":0,"explanation":"grid-template-columns define el tamaño y número de columnas de una grid."},{"category":"CSS","difficulty":2,"context":"Un modal aparece por detrás de otros elementos y necesitas controlar el apilado.","question":"¿Qué propiedad controla la capa visual?","options":["z-index","layer","depth","stack-order"],"correct":0,"explanation":"z-index controla el orden de apilado, pero funciona con elementos posicionados."},{"category":"CSS","difficulty":2,"context":"Quieres redondear las esquinas de un botón.","question":"¿Qué propiedad usas?","options":["border-radius","corner-radius","radius-border","box-round"],"correct":0,"explanation":"border-radius redondea las esquinas de cajas y botones."},{"category":"CSS","difficulty":2,"context":"Estás haciendo una animación suave al pasar el ratón por un botón.","question":"¿Qué propiedad define la transición?","options":["transition","animation-delay","smooth","transform-time"],"correct":0,"explanation":"transition permite animar cambios de propiedades como transform, opacity o background."},{"category":"CSS","difficulty":3,"context":"Quieres que una barra superior se mantenga visible al hacer scroll.","question":"¿Qué posición la fija respecto al viewport?","options":["position: fixed","position: static","display: fixed","float: viewport"],"correct":0,"explanation":"position: fixed coloca el elemento respecto a la ventana del navegador."},{"category":"CSS","difficulty":3,"context":"Estás adaptando la web para móvil con una media query.","question":"¿Qué unidad falta normalmente en max-width: 768?","options":["px","rem-only","vh","fr"],"correct":0,"explanation":"Las media queries de anchura suelen usar unidades como px: max-width: 768px."},{"category":"CSS","difficulty":3,"context":"Quieres cambiar el color de texto de todos los enlaces dentro de .menu.","question":"¿Qué selector apunta a enlaces dentro de .menu?","options":[".menu a",".menu + a","#menu.a","a.menu > all"],"correct":0,"explanation":".menu a selecciona cualquier enlace descendiente dentro de un elemento con clase menu."},{"category":"CSS","difficulty":3,"context":"Estás creando variables de color para cambiar temas fácilmente.","question":"¿Cómo se usa una variable CSS llamada --accent?","options":["color: var(--accent)","color: use(--accent)","color: $accent","var-color: accent"],"correct":0,"explanation":"Las custom properties se leen con var(--nombre)."},{"category":"JavaScript","difficulty":1,"context":"Quieres declarar una variable cuyo valor pueda cambiar más tarde.","question":"¿Qué palabra clave usarías?","options":["let","const","fixed","define"],"correct":0,"explanation":"let permite reasignar el valor de una variable."},{"category":"JavaScript","difficulty":1,"context":"Quieres declarar una referencia que no se pueda reasignar.","question":"¿Qué palabra clave usarías?","options":["const","let","var mutable","lock"],"correct":0,"explanation":"const impide reasignar la variable, aunque objetos y arrays internos puedan mutarse."},{"category":"JavaScript","difficulty":1,"context":"Tienes un objeto y quieres convertirlo en texto JSON para enviarlo a una API.","question":"¿Qué método usas?","options":["JSON.stringify()","JSON.parse()","Object.toJSON()","JSON.text()"],"correct":0,"explanation":"JSON.stringify() convierte valores JavaScript en texto JSON."},{"category":"JavaScript","difficulty":1,"context":"Recibes texto JSON desde una API y quieres convertirlo en objeto JavaScript.","question":"¿Qué método usas?","options":["JSON.parse()","JSON.stringify()","JSON.object()","parse.JSON()"],"correct":0,"explanation":"JSON.parse() convierte texto JSON válido en valores JavaScript."},{"category":"JavaScript","difficulty":2,"context":"Seleccionas varios botones con document.querySelectorAll(\".btn\").","question":"¿Qué devuelve querySelectorAll?","options":["Una NodeList","Un único elemento","Un string HTML","Un objeto JSON"],"correct":0,"explanation":"querySelectorAll devuelve una NodeList con todos los elementos que coinciden."},{"category":"JavaScript","difficulty":2,"context":"Quieres reaccionar al clic de un botón sin escribir onclick en HTML.","question":"¿Qué método añade un listener?","options":["addEventListener","listenClick","onEventAdd","eventPush"],"correct":0,"explanation":"addEventListener permite registrar funciones para eventos como click, input o submit."},{"category":"JavaScript","difficulty":2,"context":"Tienes un array de números y quieres crear otro array con cada número duplicado.","question":"¿Qué método encaja mejor?","options":["map","filter","find","join"],"correct":0,"explanation":"map transforma cada elemento y devuelve un nuevo array."},{"category":"JavaScript","difficulty":2,"context":"Tienes un array de productos y quieres quedarte solo con los baratos.","question":"¿Qué método filtra elementos?","options":["filter","map","reduce","split"],"correct":0,"explanation":"filter devuelve un nuevo array con los elementos que cumplen una condición."},{"category":"JavaScript","difficulty":3,"context":"Llamas a fetch y quieres esperar a que termine antes de seguir.","question":"¿Qué palabra clave se usa en funciones async?","options":["await","pause","waitFor","hold"],"correct":0,"explanation":"await espera una promesa dentro de una función async."},{"category":"JavaScript","difficulty":3,"context":"Quieres comprobar valor y tipo para evitar conversiones raras.","question":"¿Qué operador compara estrictamente?","options":["===","==","=","=>"],"correct":0,"explanation":"=== compara valor y tipo. == puede hacer conversiones implícitas."},{"category":"JavaScript","difficulty":3,"context":"Estás guardando una preferencia simple del usuario en el navegador.","question":"¿Qué API persiste datos entre sesiones?","options":["localStorage","sessionFrame","cookieCSS","browserFile"],"correct":0,"explanation":"localStorage guarda pares clave/valor en el navegador hasta que se borran."},{"category":"JavaScript","difficulty":3,"context":"Quieres evitar que un formulario recargue la página al enviarse.","question":"¿Qué método llamas en el evento submit?","options":["event.preventDefault()","event.stopPage()","form.noReload()","submit.cancelReload()"],"correct":0,"explanation":"preventDefault() cancela el comportamiento por defecto, como enviar y recargar."},{"category":"JavaScript","difficulty":4,"context":"Tienes una operación asíncrona que puede fallar y quieres capturar errores.","question":"¿Qué bloque se usa normalmente?","options":["try/catch","if/error","catch/then/if","error {}"],"correct":0,"explanation":"try/catch captura errores lanzados en código síncrono y con await dentro de async."},{"category":"JavaScript","difficulty":4,"context":"Quieres copiar un array sin modificar el original usando sintaxis moderna.","question":"¿Qué operador puede expandir elementos?","options":["...","+++","spread()","=>"],"correct":0,"explanation":"El spread operator (...) permite copiar o expandir arrays y objetos."},{"category":"Git/GitHub","difficulty":1,"context":"Estás trabajando en un proyecto con Git y quieres ver qué archivos han cambiado antes de hacer commit.","question":"¿Qué comando usarías?","options":["git status","git pull","git init","git history"],"correct":0,"explanation":"git status muestra archivos modificados, staged y sin seguimiento."},{"category":"Git/GitHub","difficulty":1,"context":"Has cambiado archivos y quieres preparar uno para el próximo commit.","question":"¿Qué comando lo añade al área staging?","options":["git add archivo","git save archivo","git stage-upload","git commit archivo"],"correct":0,"explanation":"git add prepara cambios para incluirlos en el próximo commit."},{"category":"Git/GitHub","difficulty":1,"context":"Ya has preparado cambios y quieres guardar una versión local con mensaje.","question":"¿Qué comando crea el commit?","options":["git commit -m \"mensaje\"","git push -m \"mensaje\"","git save -m \"mensaje\"","git upload commit"],"correct":0,"explanation":"git commit guarda los cambios preparados en el historial local."},{"category":"Git/GitHub","difficulty":2,"context":"Tienes commits locales y quieres subirlos a GitHub.","question":"¿Qué comando usas normalmente?","options":["git push","git pull","git clone","git status"],"correct":0,"explanation":"git push envía commits locales al repositorio remoto."},{"category":"Git/GitHub","difficulty":2,"context":"Quieres traer cambios nuevos de GitHub a tu copia local.","question":"¿Qué comando descarga e integra cambios?","options":["git pull","git push","git upload","git commit"],"correct":0,"explanation":"git pull trae cambios del remoto y los integra en la rama actual."},{"category":"Git/GitHub","difficulty":2,"context":"Vas a empezar una funcionalidad sin tocar directamente main.","question":"¿Qué comando crea una rama nueva?","options":["git branch nombre","git main nombre","git fork local","git path nombre"],"correct":0,"explanation":"git branch nombre crea una rama. También puedes usar git checkout -b o git switch -c."},{"category":"Git/GitHub","difficulty":3,"context":"Quieres cambiarte a una rama existente llamada feature-ui.","question":"¿Qué comando moderno usarías?","options":["git switch feature-ui","git jump feature-ui","git branch use feature-ui","git move feature-ui"],"correct":0,"explanation":"git switch cambia entre ramas de forma clara."},{"category":"Git/GitHub","difficulty":3,"context":"No quieres subir node_modules ni archivos temporales al repositorio.","question":"¿Qué archivo define exclusiones?","options":[".gitignore","package-lock.json","robots.txt","ignore.git"],"correct":0,"explanation":".gitignore indica patrones de archivos que Git debe ignorar."},{"category":"Git/GitHub","difficulty":3,"context":"Quieres ver los commits recientes del proyecto.","question":"¿Qué comando muestra el historial?","options":["git log","git history","git commits","git timeline"],"correct":0,"explanation":"git log muestra el historial de commits."},{"category":"Git/GitHub","difficulty":4,"context":"Has hecho cambios locales pero quieres guardarlos temporalmente sin commitear.","question":"¿Qué comando los guarda en una pila temporal?","options":["git stash","git pause","git shelf-save","git temp commit"],"correct":0,"explanation":"git stash guarda cambios temporalmente para recuperarlos después."},{"category":"MySQL","difficulty":1,"context":"Estás consultando una tabla de usuarios y quieres traer datos.","question":"¿Qué sentencia SQL lee filas?","options":["SELECT","READ","GET","SHOW ROWS"],"correct":0,"explanation":"SELECT consulta datos de una o varias tablas."},{"category":"MySQL","difficulty":1,"context":"Quieres filtrar resultados para mostrar solo usuarios activos.","question":"¿Qué cláusula filtra filas?","options":["WHERE","FILTER BY","ONLY","HAVING ROWS"],"correct":0,"explanation":"WHERE filtra filas antes de devolver resultados."},{"category":"MySQL","difficulty":1,"context":"Quieres ordenar productos por precio de menor a mayor.","question":"¿Qué cláusula ordena resultados?","options":["ORDER BY","SORT","GROUP SORT","ARRANGE BY"],"correct":0,"explanation":"ORDER BY ordena los resultados por una o varias columnas."},{"category":"MySQL","difficulty":2,"context":"Quieres añadir un nuevo usuario a una tabla.","question":"¿Qué sentencia inserta filas?","options":["INSERT INTO","ADD ROW","PUSH INTO","CREATE DATA"],"correct":0,"explanation":"INSERT INTO añade nuevas filas a una tabla."},{"category":"MySQL","difficulty":2,"context":"Quieres cambiar el email de un usuario existente.","question":"¿Qué sentencia modifica filas existentes?","options":["UPDATE","CHANGE ROW","MODIFY TABLE ROW","ALTER VALUE"],"correct":0,"explanation":"UPDATE modifica filas existentes, normalmente combinado con WHERE."},{"category":"MySQL","difficulty":2,"context":"Quieres borrar una fila concreta de una tabla.","question":"¿Qué sentencia elimina filas?","options":["DELETE","REMOVE ROW","DROP VALUE","CLEAR ONE"],"correct":0,"explanation":"DELETE elimina filas. DROP se usa para eliminar tablas u objetos completos."},{"category":"MySQL","difficulty":3,"context":"Quieres evitar inyección SQL al usar datos de formularios en PHP.","question":"¿Qué técnica es la más segura?","options":["Consultas preparadas","Concatenar strings","Usar GET siempre","Quitar comillas manualmente"],"correct":0,"explanation":"Las consultas preparadas separan SQL de datos y evitan inyecciones comunes."},{"category":"MySQL","difficulty":3,"context":"Tienes pedidos y usuarios en tablas separadas y quieres combinarlos.","question":"¿Qué operación combina filas relacionadas?","options":["JOIN","MERGE VIEW","CONNECT ROWS","UNION WHERE"],"correct":0,"explanation":"JOIN combina datos de tablas relacionadas mediante una condición."},{"category":"MySQL","difficulty":3,"context":"Quieres contar cuántos pedidos hay por usuario.","question":"¿Qué cláusula agrupa resultados?","options":["GROUP BY","COUNT BY","ORDER GROUP","SUM ROWS"],"correct":0,"explanation":"GROUP BY agrupa filas para usar funciones como COUNT, SUM o AVG."},{"category":"MySQL","difficulty":4,"context":"Quieres limitar una consulta a los 10 primeros resultados para una lista compacta.","question":"¿Qué cláusula usas en MySQL?","options":["LIMIT 10","TOP 10","ONLY 10","MAXROWS 10"],"correct":0,"explanation":"LIMIT restringe cuántas filas devuelve MySQL."},{"category":"PHP/backend","difficulty":1,"context":"Estás recibiendo datos JSON enviados al backend PHP.","question":"¿Qué función decodifica JSON en PHP?","options":["json_decode","json_parse","JSON.decode","decode_json_file"],"correct":0,"explanation":"json_decode convierte JSON en arrays u objetos PHP."},{"category":"PHP/backend","difficulty":1,"context":"Quieres devolver una respuesta JSON desde una API en PHP.","question":"¿Qué función codifica datos como JSON?","options":["json_encode","json_stringify","JSON.encode","encode_json_file"],"correct":0,"explanation":"json_encode convierte arrays u objetos PHP en texto JSON."},{"category":"PHP/backend","difficulty":2,"context":"Estás usando PDO para conectarte a MySQL.","question":"¿Qué método ejecuta una consulta preparada?","options":["execute()","run()","send()","queryPrepared()"],"correct":0,"explanation":"En PDO, prepare() crea la consulta y execute() la ejecuta con datos."},{"category":"PHP/backend","difficulty":2,"context":"Quieres leer el cuerpo crudo de una petición POST con JSON.","question":"¿Qué stream especial se usa en PHP?","options":["php://input","request://body","$_POST_RAW","body://json"],"correct":0,"explanation":"php://input permite leer el cuerpo crudo de la petición."},{"category":"PHP/backend","difficulty":3,"context":"Quieres enviar una cabecera indicando que la respuesta es JSON.","question":"¿Qué Content-Type corresponde?","options":["application/json","text/json-html","json/plain","application/php-json"],"correct":0,"explanation":"application/json es el tipo MIME estándar para respuestas JSON."},{"category":"PHP/backend","difficulty":3,"context":"Una operación puede fallar y quieres capturar excepciones en PHP.","question":"¿Qué estructura se usa?","options":["try/catch","if fail","error block","catch only"],"correct":0,"explanation":"try/catch captura excepciones lanzadas dentro del bloque try."},{"category":"PHP/backend","difficulty":4,"context":"Quieres evitar que un valor de usuario rompa HTML al imprimirlo.","question":"¿Qué función ayuda a escapar salida HTML en PHP?","options":["htmlspecialchars","strip_sql","safe_echo","escapeHTMLNow"],"correct":0,"explanation":"htmlspecialchars convierte caracteres especiales en entidades HTML seguras."},{"category":"PHP/backend","difficulty":4,"context":"Quieres iniciar una transacción para varias operaciones SQL que deben completarse juntas.","question":"¿Qué método de PDO la inicia?","options":["beginTransaction()","startSafe()","transactionOpen()","lockBegin()"],"correct":0,"explanation":"beginTransaction() inicia una transacción que luego puedes confirmar o revertir."},{"category":"HTTP/APIs","difficulty":1,"context":"Haces una petición web y todo ha ido bien.","question":"¿Qué código HTTP indica éxito general?","options":["200","404","500","301"],"correct":0,"explanation":"200 OK indica que la petición se completó correctamente."},{"category":"HTTP/APIs","difficulty":1,"context":"El usuario entra en una URL que no existe.","question":"¿Qué código HTTP significa “No encontrado”?","options":["404","403","500","201"],"correct":0,"explanation":"404 Not Found indica que el recurso solicitado no existe o no se encuentra."},{"category":"HTTP/APIs","difficulty":2,"context":"Creas un recurso nuevo desde una API.","question":"¿Qué código HTTP suele indicar “creado”?","options":["201","200","204","302"],"correct":0,"explanation":"201 Created se usa cuando la petición crea un recurso correctamente."},{"category":"HTTP/APIs","difficulty":2,"context":"Tu frontend llama a una API en otro dominio y el navegador la bloquea.","question":"¿Qué política está interviniendo?","options":["CORS","DNSSEC","FTP","OAuth"],"correct":0,"explanation":"CORS controla qué orígenes pueden leer respuestas de una API desde el navegador."},{"category":"HTTP/APIs","difficulty":2,"context":"Quieres pedir datos sin modificar nada en el servidor.","question":"¿Qué método HTTP se usa normalmente?","options":["GET","POST","PATCH","DELETE"],"correct":0,"explanation":"GET se usa para solicitar datos sin efectos secundarios intencionados."},{"category":"HTTP/APIs","difficulty":3,"context":"Quieres enviar datos para crear algo en una API.","question":"¿Qué método HTTP se usa normalmente?","options":["POST","GET","HEAD","OPTIONS"],"correct":0,"explanation":"POST suele enviar datos para crear recursos o ejecutar acciones."},{"category":"HTTP/APIs","difficulty":3,"context":"Quieres modificar parcialmente un recurso existente.","question":"¿Qué método HTTP encaja mejor?","options":["PATCH","TRACE","CONNECT","HEAD"],"correct":0,"explanation":"PATCH se usa para actualizaciones parciales de un recurso."},{"category":"HTTP/APIs","difficulty":3,"context":"Una API te responde “sin contenido” tras borrar algo correctamente.","question":"¿Qué código HTTP lo representa?","options":["204","200","404","418"],"correct":0,"explanation":"204 No Content indica éxito sin cuerpo de respuesta."},{"category":"HTTP/APIs","difficulty":4,"context":"Quieres autenticar peticiones con un token enviado en cabecera.","question":"¿Qué cabecera se usa comúnmente?","options":["Authorization","Auth-Token-HTML","Login","X-Password"],"correct":0,"explanation":"Authorization suele transportar tokens, por ejemplo Bearer tokens."},{"category":"HTTP/APIs","difficulty":4,"context":"El navegador hace una petición previa OPTIONS antes de ciertas llamadas CORS.","question":"¿Cómo se llama esa comprobación?","options":["preflight","warmup","handshake CSS","beforefetch"],"correct":0,"explanation":"El preflight es una petición OPTIONS que verifica permisos CORS antes de la petición real."},{"category":"Vite/npm","difficulty":1,"context":"Has descargado un proyecto con package.json y necesitas instalar dependencias.","question":"¿Qué comando ejecutas?","options":["npm install","npm build","node install package","git npm install"],"correct":0,"explanation":"npm install instala las dependencias definidas en package.json."},{"category":"Vite/npm","difficulty":2,"context":"Quieres arrancar el servidor de desarrollo de un proyecto Vite.","question":"¿Qué script suele usarse?","options":["npm run dev","npm start vite-html","vite deploy","node public/index.html"],"correct":0,"explanation":"En Vite, npm run dev suele iniciar el servidor de desarrollo."},{"category":"Vite/npm","difficulty":2,"context":"Quieres generar la versión final optimizada de la web.","question":"¿Qué comando suele compilar el proyecto?","options":["npm run build","npm run dev","git build","node compile-web"],"correct":0,"explanation":"npm run build genera los archivos optimizados normalmente en dist."},{"category":"Vite/npm","difficulty":2,"context":"Has compilado con Vite y quieres probar el build localmente.","question":"¿Qué script suele servir una preview?","options":["npm run preview","npm run dev-build","vite test html","git preview"],"correct":0,"explanation":"npm run preview sirve localmente el resultado del build."},{"category":"Vite/npm","difficulty":3,"context":"Vite genera archivos para subir a producción.","question":"¿Qué carpeta suele contener el build final?","options":["dist","build_cache","public_html_src","vite_modules"],"correct":0,"explanation":"dist suele contener los archivos finales generados por Vite."},{"category":"Accesibilidad/UX","difficulty":2,"context":"Quieres que un botón sea entendible sin depender solo de un icono.","question":"¿Qué mejora ayuda a accesibilidad?","options":["Texto visible o aria-label","Solo color rojo","Más z-index","Quitar focus"],"correct":0,"explanation":"Los controles deben tener nombre accesible mediante texto visible o aria-label."},{"category":"Accesibilidad/UX","difficulty":2,"context":"Un usuario navega con teclado y necesita ver dónde está el foco.","question":"¿Qué no deberías eliminar sin alternativa?","options":["outline/focus visible","border-radius","box-shadow","background-image"],"correct":0,"explanation":"El foco visible es clave para navegación con teclado."},{"category":"Seguridad web","difficulty":3,"context":"Imprimes texto escrito por usuarios dentro de HTML.","question":"¿Qué riesgo aparece si no escapas la salida?","options":["XSS","CORS","DNS","FTP leak"],"correct":0,"explanation":"XSS ocurre cuando contenido no confiable se interpreta como código en la página."},{"category":"Seguridad web","difficulty":3,"context":"Guardas contraseñas de usuarios en una base de datos.","question":"¿Qué deberías guardar en vez de la contraseña en claro?","options":["Un hash seguro","El texto original","Base64 reversible","El email como contraseña"],"correct":0,"explanation":"Las contraseñas deben almacenarse como hashes seguros, no en texto plano."}]
JSON, true);
    return add_pool_ids('quiz', is_array($items) ? $items : []);
}

function quiz_required_players(array $players): array {
    $online = array_values(array_filter($players, fn($p) => !empty($p['online'])));
    return $online ?: $players;
}
function quiz_total_questions(array $players): int {
    $active = count(quiz_required_players($players));
    return $active <= 1 ? 10 : 8;
}
function quiz_used_question_ids(PDO $pdo, int $roomId): array {
    $st = $pdo->prepare('SELECT state_json FROM party_rounds WHERE room_id = ? AND mode = ? ORDER BY id DESC LIMIT 80');
    $st->execute([$roomId, 'quiz']);
    $used = [];
    foreach ($st->fetchAll() as $row) {
        $state = jdec($row['state_json'] ?? '{}');
        foreach (($state['quizIds'] ?? []) as $id) $used[(string)$id] = true;
        if (isset($state['contentId'])) $used[(string)$state['contentId']] = true;
        if (isset($state['challenge']['id'])) $used[(string)$state['challenge']['id']] = true;
    }
    return $used;
}
function quiz_modifier_for(int $index, array $question): array {
    $n = $index + 1;
    if ($n % 7 === 0) return ['id'=>'jackpot','label'=>'Ronda jackpot','short'=>'Jackpot','pointsMult'=>1.35,'speedMult'=>1.35,'timeMs'=>11000,'note'=>'Más puntos si aciertas.'];
    if ($n % 5 === 0) return ['id'=>'turbo','label'=>'Ronda turbo','short'=>'Turbo','pointsMult'=>1.0,'speedMult'=>2.0,'timeMs'=>7000,'note'=>'Menos tiempo, más bonus de velocidad.'];
    if (($question['difficulty'] ?? 1) >= 3 && $n % 4 === 0) return ['id'=>'trampa','label'=>'Ronda trampa','short'=>'Trampa','pointsMult'=>1.15,'speedMult'=>1.0,'timeMs'=>10500,'note'=>'Opciones parecidas. Lee fino.'];
    if ($n % 6 === 0) return ['id'=>'blind','label'=>'Categoría oculta','short'=>'Oculta','pointsMult'=>1.1,'speedMult'=>1.0,'timeMs'=>10000,'hideCategory'=>true,'note'=>'La categoría se revela después.'];
    if ($n % 3 === 0) return ['id'=>'seguridad','label'=>'Ronda seguridad','short'=>'Seguridad','pointsMult'=>1.0,'speedMult'=>1.0,'timeMs'=>12000,'note'=>'Pregunta algo más táctica: fallar rompe la racha.'];
    return ['id'=>'classic','label'=>'Ronda clásica','short'=>'Clásica','pointsMult'=>1.0,'speedMult'=>1.0,'timeMs'=>10000,'note'=>'Acierta rápido para sumar más.'];
}
function quiz_pick_sequence(PDO $pdo, int $roomId, array $players): array {
    $pool = quiz_pool();
    $used = quiz_used_question_ids($pdo, $roomId);
    $available = array_values(array_filter($pool, fn($q) => !isset($used[pool_item_id($q)])));
    if (count($available) < quiz_total_questions($players)) $available = $pool;
    shuffle($available);
    $total = min(quiz_total_questions($players), count($available));
    $sequence = [];
    for ($i = 0; $i < $total; $i++) {
        $q = shuffle_answer_options($available[$i]);
        $q['id'] = pool_item_id($q);
        $q['number'] = $i + 1;
        $q['total'] = $total;
        $q['modifier'] = quiz_modifier_for($i, $q);
        $sequence[] = $q;
    }
    return $sequence;
}
function quiz_current_question(array $state): array {
    $idx = max(0, (int)($state['current'] ?? 0));
    return (($state['questions'] ?? [])[$idx] ?? ($state['challenge'] ?? [])) ?: [];
}
function quiz_question_duration(array $question): int {
    return (int)(($question['modifier'] ?? [])['timeMs'] ?? 10000);
}
function quiz_reveal_duration(): int { return 3200; }
function quiz_current_answers(array $state): array {
    $idx = (string)(int)($state['current'] ?? 0);
    return (($state['answers'] ?? [])[$idx] ?? []);
}
function quiz_all_answered(array $state, array $players): bool {
    $required = quiz_required_players($players);
    if (!$required) return false;
    $answers = quiz_current_answers($state);
    foreach ($required as $p) {
        if (!isset($answers[(string)(int)$p['id']])) return false;
    }
    return true;
}
function quiz_init_player(array &$state, int $pid): void {
    $key = (string)$pid;
    if (!isset($state['stats'][$key])) $state['stats'][$key] = ['correct'=>0,'wrong'=>0,'miss'=>0,'points'=>0,'fastestMs'=>null,'hot'=>0,'lightningHits'=>0];
    if (!isset($state['streaks'][$key])) $state['streaks'][$key] = 0;
    if (!isset($state['bestStreaks'][$key])) $state['bestStreaks'][$key] = 0;
    if (!isset($state['lightning'][$key])) $state['lightning'][$key] = 0;
}
function quiz_apply_fifty(array &$state, int $pid): void {
    $key = (string)$pid;
    if (!empty(($state['jokers'][$key] ?? [])['fifty'])) return;
    $q = quiz_current_question($state);
    $correct = (int)($q['correct'] ?? -1);
    $wrong = [];
    foreach (($q['options'] ?? []) as $i => $_) if ((int)$i !== $correct) $wrong[] = (int)$i;
    shuffle($wrong);
    $state['jokers'][$key]['fifty'] = true;
    $state['jokers'][$key]['removed'] = array_slice($wrong, 0, 2);
}
function quiz_apply_freeze(array &$state, int $pid): void {
    $key = (string)$pid;
    if (!empty(($state['jokers'][$key] ?? [])['freeze'])) return;
    $state['jokers'][$key]['freeze'] = true;
    $state['freezeUsedBy'][$key] = now_ms();
    $state['questionEndsAtMs'] = max((int)($state['questionEndsAtMs'] ?? 0), now_ms()) + 3000;
}
function quiz_resolve_question(PDO $pdo, array $players, array &$state): void {
    $idx = (int)($state['current'] ?? 0);
    $idxKey = (string)$idx;
    if (!empty(($state['resolvedQuestions'] ?? [])[$idxKey])) return;
    $q = quiz_current_question($state);
    $correctIndex = (int)($q['correct'] ?? -1);
    $duration = max(1000, (int)($state['questionDurationMs'] ?? quiz_question_duration($q)));
    $started = (int)($state['questionStartedAtMs'] ?? now_ms());
    $modifier = $q['modifier'] ?? ['id'=>'classic','pointsMult'=>1,'speedMult'=>1];
    $answers = quiz_current_answers($state);
    $rows = [];
    foreach (quiz_required_players($players) as $p) {
        $pid = (int)$p['id'];
        $key = (string)$pid;
        quiz_init_player($state, $pid);
        $entry = $answers[$key] ?? null;
        if (!is_array($entry)) {
            $entry = ['answer'=>-1,'at'=>now_ms(),'timeout'=>true];
            $state['answers'][$idxKey][$key] = $entry;
        }
        $answer = (int)($entry['answer'] ?? -1);
        $elapsed = max(0, (int)($entry['at'] ?? now_ms()) - $started);
        $correct = $answer === $correctIndex;
        $hot = $elapsed <= 2000 && empty($entry['timeout']);
        $points = 0;
        $speedBonus = 0;
        $streakBonus = 0;
        $hotBonus = 0;
        $lightningBonus = 0;
        if ($correct) {
            $state['streaks'][$key] = (int)($state['streaks'][$key] ?? 0) + 1;
            $state['bestStreaks'][$key] = max((int)($state['bestStreaks'][$key] ?? 0), (int)$state['streaks'][$key]);
            $speedRatio = max(0, min(1, 1 - ($elapsed / $duration)));
            $speedBonus = (int)round($speedRatio * 60 * (float)($modifier['speedMult'] ?? 1));
            $streak = (int)$state['streaks'][$key];
            $streakBonus = $streak >= 2 ? min(90, 12 * $streak) : 0;
            $hotBonus = $hot ? 50 : 0;
            $subtotal = 100 + $speedBonus + $streakBonus + $hotBonus;
            if (($modifier['id'] ?? '') === 'jackpot') $subtotal += 100;
            if (($modifier['id'] ?? '') === 'trampa') $subtotal += 35;
            if (($modifier['id'] ?? '') === 'blind') $subtotal += 25;
            if ((int)($state['lightning'][$key] ?? 0) > 0) {
                $lightningBonus = (int)round($subtotal * 0.5);
                $subtotal += $lightningBonus;
                $state['lightning'][$key] = max(0, (int)$state['lightning'][$key] - 1);
                $state['stats'][$key]['lightningHits'] = (int)($state['stats'][$key]['lightningHits'] ?? 0) + 1;
            }
            if ($streak >= 5 && (int)($state['lightning'][$key] ?? 0) === 0) {
                $state['lightning'][$key] = 2;
                $state['lightningActivated'][$key] = true;
            }
            $points = (int)round($subtotal * (float)($modifier['pointsMult'] ?? 1));
            $state['stats'][$key]['correct'] = (int)($state['stats'][$key]['correct'] ?? 0) + 1;
            if ($hot) $state['stats'][$key]['hot'] = (int)($state['stats'][$key]['hot'] ?? 0) + 1;
            $fast = $state['stats'][$key]['fastestMs'];
            if ($fast === null || $elapsed < (int)$fast) $state['stats'][$key]['fastestMs'] = $elapsed;
        } else {
            $wasHotWrong = $hot && $answer >= 0;
            $points = $wasHotWrong ? -25 : 0;
            $state['streaks'][$key] = 0;
            if (!empty($entry['timeout'])) $state['stats'][$key]['miss'] = (int)($state['stats'][$key]['miss'] ?? 0) + 1;
            else $state['stats'][$key]['wrong'] = (int)($state['stats'][$key]['wrong'] ?? 0) + 1;
        }
        $state['answers'][$idxKey][$key]['correct'] = $correct;
        $state['answers'][$idxKey][$key]['points'] = $points;
        $state['answers'][$idxKey][$key]['elapsedMs'] = $elapsed;
        $state['answers'][$idxKey][$key]['hot'] = $hot;
        $state['answers'][$idxKey][$key]['speedBonus'] = $speedBonus;
        $state['answers'][$idxKey][$key]['streakBonus'] = $streakBonus;
        $state['answers'][$idxKey][$key]['hotBonus'] = $hotBonus;
        $state['answers'][$idxKey][$key]['lightningBonus'] = $lightningBonus;
        $state['stats'][$key]['points'] = (int)($state['stats'][$key]['points'] ?? 0) + $points;
        if ($points !== 0) add_score($pdo, $pid, $points);
        $rows[] = ['playerId'=>$pid,'answer'=>$answer,'correct'=>$correct,'points'=>$points,'elapsedMs'=>$elapsed,'timeout'=>!empty($entry['timeout']),'streak'=>(int)($state['streaks'][$key] ?? 0)];
    }
    usort($rows, fn($a, $b) => ($b['points'] <=> $a['points']) ?: ($a['elapsedMs'] <=> $b['elapsedMs']));
    $state['lastResult'] = ['index'=>$idx,'correct'=>$correctIndex,'question'=>$q['question'] ?? '', 'explanation'=>$q['explanation'] ?? '', 'rows'=>$rows, 'modifier'=>$modifier];
    $state['resolvedQuestions'][$idxKey] = true;
}
function quiz_finish_game(array $players, array &$state): void {
    $summary = [];
    foreach (quiz_required_players($players) as $p) {
        $pid = (int)$p['id'];
        $key = (string)$pid;
        quiz_init_player($state, $pid);
        $stats = $state['stats'][$key] ?? [];
        $correct = (int)($stats['correct'] ?? 0);
        $wrong = (int)($stats['wrong'] ?? 0);
        $miss = (int)($stats['miss'] ?? 0);
        $total = max(1, count($state['questions'] ?? []));
        $accuracy = (int)round(($correct / $total) * 100);
        $rank = 'Aprendiz HTML';
        if ($accuracy >= 95) $rank = 'Máquina de StackOverflow';
        elseif ($accuracy >= 85) $rank = 'Debugger Legendario';
        elseif ($accuracy >= 70) $rank = 'Dev Relámpago';
        elseif ($accuracy >= 50) $rank = 'Junior con Café';
        $summary[$key] = [
            'playerId'=>$pid,
            'correct'=>$correct,
            'wrong'=>$wrong,
            'miss'=>$miss,
            'points'=>(int)($stats['points'] ?? 0),
            'bestStreak'=>(int)($state['bestStreaks'][$key] ?? 0),
            'fastestMs'=>$stats['fastestMs'] ?? null,
            'hot'=>(int)($stats['hot'] ?? 0),
            'accuracy'=>$accuracy,
            'rank'=>$rank,
        ];
    }
    $rows = array_values($summary);
    usort($rows, fn($a, $b) => ($b['points'] <=> $a['points']) ?: ($b['correct'] <=> $a['correct']));
    $fastRows = array_values(array_filter($rows, fn($r) => $r['fastestMs'] !== null));
    usort($fastRows, fn($a, $b) => (int)$a['fastestMs'] <=> (int)$b['fastestMs']);
    $streakRows = $rows; usort($streakRows, fn($a, $b) => $b['bestStreak'] <=> $a['bestStreak']);
    $state['summary'] = $summary;
    $state['medals'] = [
        'brain'=> $rows[0] ?? null,
        'speed'=> $fastRows[0] ?? null,
        'streak'=> $streakRows[0] ?? null,
    ];
    $state['resolved'] = true;
}
function quiz_next_or_finish(PDO $pdo, array $players, array &$state): string {
    $next = (int)($state['current'] ?? 0) + 1;
    $total = count($state['questions'] ?? []);
    if ($next >= $total) {
        quiz_finish_game($players, $state);
        return 'results';
    }
    $state['current'] = $next;
    $q = $state['questions'][$next];
    $state['challenge'] = $q;
    $state['questionStartedAtMs'] = now_ms();
    $state['questionDurationMs'] = quiz_question_duration($q);
    $state['questionEndsAtMs'] = now_ms() + (int)$state['questionDurationMs'];
    unset($state['lastResult']);
    return 'answer';
}
function quiz_auto_progress_room(PDO $pdo, array $room): void {
    $round = active_round($pdo, (int)$room['id']);
    if (!$round || (string)$round['mode'] !== 'quiz' || (string)$round['status'] !== 'playing') return;
    $phase = (string)$round['phase'];
    $state = jdec($round['state_json']);
    $players = players_for_room($pdo, (int)$room['id']);
    $due = !empty($round['ends_at_ms']) && now_ms() >= (int)$round['ends_at_ms'];
    $ready = $phase === 'answer' && quiz_all_answered($state, $players);
    if (!$due && !$ready) return;
    $pdo->beginTransaction();
    try {
        $roomLocked = room_by_code($pdo, (string)$room['code'], true);
        if (!$roomLocked) { $pdo->rollBack(); return; }
        $lockedRound = active_round($pdo, (int)$roomLocked['id'], true);
        if (!$lockedRound || (string)$lockedRound['mode'] !== 'quiz' || (string)$lockedRound['status'] !== 'playing') { $pdo->rollBack(); return; }
        $phase = (string)$lockedRound['phase'];
        $state = jdec($lockedRound['state_json']);
        $players = players_for_room($pdo, (int)$roomLocked['id']);
        if ($phase === 'answer') {
            quiz_resolve_question($pdo, $players, $state);
            $pdo->prepare("UPDATE party_rounds SET phase = 'reveal', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), now_ms() + quiz_reveal_duration(), (int)$lockedRound['id']]);
            $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
        } elseif ($phase === 'reveal') {
            $nextPhase = quiz_next_or_finish($pdo, $players, $state);
            if ($nextPhase === 'results') {
                $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([jenc($state), (int)$lockedRound['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            } else {
                $pdo->prepare("UPDATE party_rounds SET phase = 'answer', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), (int)$state['questionEndsAtMs'], (int)$lockedRound['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
    }
}

function subasta_pool(): array {
    $json = <<<'JSON'
[
  {
    "name": "Dominio .dev de 4 letras",
    "category": "Hosting",
    "rarity": "Legendario",
    "risk": "Medio",
    "value": 185,
    "tags": [
      "Hosting",
      "Marca"
    ],
    "clues": [
      "Corto, fácil de recordar y perfecto para portfolio.",
      "La extensión .dev ya suena a proyecto serio.",
      "La única duda: quizá no encaje con todas las marcas."
    ],
    "extra": "Tiene nombre pronunciable y no parece generado por accidente.",
    "explanation": "Los dominios cortos y recordables suelen conservar valor. Si lo compras barato, es un activo de marca muy bueno."
  },
  {
    "name": "Plugin de WordPress abandonado",
    "category": "Legacy",
    "rarity": "Raro",
    "risk": "Alto",
    "value": -70,
    "tags": [
      "Legacy",
      "Seguridad"
    ],
    "clues": [
      "Última actualización: hace 6 años.",
      "Promete hacer de todo con un botón.",
      "Tiene reviews antiguas muy buenas."
    ],
    "extra": "Los últimos comentarios preguntan si sigue funcionando en PHP 8.",
    "explanation": "La deuda técnica y los riesgos de seguridad pesan más que la nostalgia. Barato puede salir caro."
  },
  {
    "name": "Snippet CSS para centrar divs",
    "category": "CSS",
    "rarity": "Común",
    "risk": "Bajo",
    "value": 45,
    "tags": [
      "Frontend",
      "CSS"
    ],
    "clues": [
      "Tres líneas, cero dependencias.",
      "Funciona con Flexbox moderno.",
      "La documentación es un comentario bastante claro."
    ],
    "extra": "No usa position absolute ni hacks raros.",
    "explanation": "Un snippet pequeño, moderno y fácil de mantener tiene valor real porque ahorra tiempo sin meter deuda."
  },
  {
    "name": "API de clima gratuita",
    "category": "APIs",
    "rarity": "Raro",
    "risk": "Medio",
    "value": 65,
    "tags": [
      "Backend",
      "APIs"
    ],
    "clues": [
      "Plan gratuito generoso.",
      "Tiene límite diario, pero no es ridículo.",
      "La documentación incluye ejemplos reales."
    ],
    "extra": "Los cambios de pricing se avisan con 30 días.",
    "explanation": "No es oro puro, pero una API gratis con límites claros y buena documentación puede ser un buen chollo."
  },
  {
    "name": "Base de datos sin índices",
    "category": "MySQL",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -95,
    "tags": [
      "MySQL",
      "Legacy",
      "Performance"
    ],
    "clues": [
      "Tiene millones de filas.",
      "Las consultas funcionan… hasta que hay usuarios.",
      "Nadie sabe quién diseñó el esquema."
    ],
    "extra": "Hay SELECT con LIKE '%texto%' en producción.",
    "explanation": "Sin índices, el rendimiento se hunde rápido. Esto no es una compra: es una deuda técnica con intereses."
  },
  {
    "name": "Servidor VPS con descuento eterno",
    "category": "Hosting",
    "rarity": "Épico",
    "risk": "Medio",
    "value": 105,
    "tags": [
      "Hosting",
      "DevOps"
    ],
    "clues": [
      "Buen precio mensual.",
      "NVMe y tráfico suficiente.",
      "El panel parece de otra época."
    ],
    "extra": "La letra pequeña no menciona subida automática de precio.",
    "explanation": "Si el descuento es real y el hardware acompaña, puede ser una gran compra pese a un panel feo."
  },
  {
    "name": "Tema premium nulled",
    "category": "Seguridad",
    "rarity": "Maldito",
    "risk": "Crítico",
    "value": -140,
    "tags": [
      "Seguridad",
      "Legacy"
    ],
    "clues": [
      "Parece premium, pero viene de una web sospechosa.",
      "Trae 18 plugins dentro del zip.",
      "El vendedor dice '100% limpio' demasiadas veces."
    ],
    "extra": "Incluye un archivo llamado updater-backdoor.php.",
    "explanation": "Los themes nulled son una bomba de seguridad. Lo barato aquí puede acabar en web infectada."
  },
  {
    "name": "Librería JavaScript con 3 dependencias",
    "category": "JavaScript",
    "rarity": "Común",
    "risk": "Bajo",
    "value": 55,
    "tags": [
      "Frontend",
      "JavaScript"
    ],
    "clues": [
      "Hace una cosa concreta.",
      "El bundle no crece mucho.",
      "Tiene tests básicos."
    ],
    "extra": "Sus dependencias también están mantenidas.",
    "explanation": "Una librería pequeña, enfocada y mantenida puede merecer la pena si evita código propio frágil."
  },
  {
    "name": "Framework nuevo con mucho hype",
    "category": "JavaScript",
    "rarity": "Épico",
    "risk": "Alto",
    "value": -35,
    "tags": [
      "Frontend",
      "JavaScript",
      "Hype"
    ],
    "clues": [
      "Todo Twitter habla de él.",
      "La documentación cambia cada semana.",
      "Aún no tiene versión estable."
    ],
    "extra": "El tutorial oficial empieza con 'esto puede romperse'.",
    "explanation": "El hype no siempre se convierte en valor. Si cambia demasiado rápido, te cobra en migraciones."
  },
  {
    "name": "Script PHP heredado",
    "category": "PHP",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -80,
    "tags": [
      "PHP",
      "Legacy"
    ],
    "clues": [
      "Funciona en local.",
      "Tiene variables globales por todas partes.",
      "Nadie se atreve a tocarlo."
    ],
    "extra": "Mezcla HTML, SQL y lógica en el mismo archivo.",
    "explanation": "Puede seguir funcionando, pero mantenerlo es lento y peligroso. La deuda pesa más que el ahorro inicial."
  },
  {
    "name": "Paquete npm con 2 descargas semanales",
    "category": "JavaScript",
    "rarity": "Común",
    "risk": "Medio",
    "value": -25,
    "tags": [
      "JavaScript",
      "Legacy"
    ],
    "clues": [
      "El README es prometedor.",
      "La comunidad es literalmente una persona.",
      "No hay issues porque casi nadie lo usa."
    ],
    "extra": "El último publish fue hace 4 años.",
    "explanation": "Puede ser útil, pero si falla estás solo. En producción, esa soledad cuesta."
  },
  {
    "name": "CDN con plan gratis generoso",
    "category": "Performance",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 95,
    "tags": [
      "Performance",
      "Hosting",
      "DevOps"
    ],
    "clues": [
      "Caché global incluida.",
      "SSL automático.",
      "Panel bastante claro."
    ],
    "extra": "Tiene reglas de caché personalizables sin pagar.",
    "explanation": "Un CDN decente mejora rendimiento y estabilidad. Si el plan gratis es claro, es una compra fuerte."
  },
  {
    "name": "Certificado SSL wildcard",
    "category": "Seguridad",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 70,
    "tags": [
      "Seguridad",
      "Hosting"
    ],
    "clues": [
      "Cubre todos los subdominios.",
      "Renovación automatizable.",
      "Útil si tienes varias demos o APIs."
    ],
    "extra": "Se integra con el panel del hosting.",
    "explanation": "No es flashy, pero simplifica despliegues y evita errores de certificados en subdominios."
  },
  {
    "name": "Diseño Figma impecable",
    "category": "Diseño/UX",
    "rarity": "Épico",
    "risk": "Bajo",
    "value": 120,
    "tags": [
      "Diseño",
      "Frontend"
    ],
    "clues": [
      "Componentes ordenados.",
      "Auto-layout bien usado.",
      "Incluye estados mobile y desktop."
    ],
    "extra": "Los nombres de capas tienen sentido humano.",
    "explanation": "Un diseño bien preparado ahorra muchísimas horas de implementación y reduce decisiones improvisadas."
  },
  {
    "name": "Repositorio con 10k estrellas y 400 issues",
    "category": "GitHub",
    "rarity": "Épico",
    "risk": "Alto",
    "value": -20,
    "tags": [
      "GitHub",
      "Legacy",
      "Hype"
    ],
    "clues": [
      "Muy popular hace años.",
      "Último release: hace 2 años.",
      "Hay forks activos, pero el original duerme."
    ],
    "extra": "Los issues críticos tienen respuestas de 2021.",
    "explanation": "Las estrellas no garantizan mantenimiento. Popularidad antigua puede ser solo una trampa con buen marketing."
  },
  {
    "name": "Landing page clonada de una plantilla",
    "category": "Frontend",
    "rarity": "Común",
    "risk": "Medio",
    "value": 15,
    "tags": [
      "Frontend",
      "Diseño"
    ],
    "clues": [
      "Se ve bonita en la demo.",
      "Pesa más de lo que debería.",
      "Todos los botones tienen el mismo CTA."
    ],
    "extra": "El CSS incluye 900 líneas que no se usan.",
    "explanation": "Puede servir de punto de partida, pero no vale mucho si viene inflada y poco diferenciada."
  },
  {
    "name": "Config .env subida por error",
    "category": "Seguridad",
    "rarity": "Maldito",
    "risk": "Crítico",
    "value": -160,
    "tags": [
      "Seguridad",
      "GitHub"
    ],
    "clues": [
      "Contiene claves reales.",
      "Alguien la metió en un commit antiguo.",
      "El repo fue público durante días."
    ],
    "extra": "La clave de API sigue activa.",
    "explanation": "Una credencial filtrada no se compra, se revoca. Es una pérdida directa y urgente."
  },
  {
    "name": "Automatización con GitHub Actions",
    "category": "GitHub",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 90,
    "tags": [
      "GitHub",
      "DevOps"
    ],
    "clues": [
      "Build y deploy automáticos.",
      "Tiene caché de dependencias.",
      "Falla rápido cuando algo rompe."
    ],
    "extra": "Incluye secrets separados por entorno.",
    "explanation": "Una buena automatización reduce errores humanos y hace los despliegues mucho más cómodos."
  },
  {
    "name": "Consulta SQL con JOIN optimizado",
    "category": "MySQL",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 85,
    "tags": [
      "MySQL",
      "Performance",
      "Backend"
    ],
    "clues": [
      "Usa índices adecuados.",
      "Evita N+1 queries.",
      "Devuelve solo columnas necesarias."
    ],
    "extra": "El EXPLAIN no da miedo.",
    "explanation": "Una query bien diseñada puede ahorrar más que cambiar de servidor. Buen rendimiento es valor real."
  },
  {
    "name": "Tabla users con contraseñas MD5",
    "category": "Seguridad",
    "rarity": "Maldito",
    "risk": "Crítico",
    "value": -150,
    "tags": [
      "Seguridad",
      "MySQL",
      "Legacy"
    ],
    "clues": [
      "Hash muy corto.",
      "Sin salt.",
      "El sistema dice 'así ha funcionado siempre'."
    ],
    "extra": "Hay usuarios con contraseña '123456'.",
    "explanation": "MD5 no es adecuado para contraseñas. Migrar a password_hash/password_verify es obligatorio."
  },
  {
    "name": "Microcopy perfecto para formularios",
    "category": "UX",
    "rarity": "Común",
    "risk": "Bajo",
    "value": 50,
    "tags": [
      "Diseño",
      "UX"
    ],
    "clues": [
      "Mensajes de error claros.",
      "Explica qué pasó y cómo arreglarlo.",
      "No culpa al usuario."
    ],
    "extra": "Incluye textos para estados vacíos.",
    "explanation": "Buen texto UX reduce frustración y soporte. No parece espectacular, pero se nota muchísimo."
  },
  {
    "name": "Bundle JS de 3 MB",
    "category": "Performance",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -90,
    "tags": [
      "Performance",
      "JavaScript"
    ],
    "clues": [
      "Carga lenta en móvil.",
      "Incluye librerías que solo se usan una vez.",
      "El Lighthouse llora."
    ],
    "extra": "Hay tres date pickers distintos en producción.",
    "explanation": "Un bundle enorme empeora experiencia y conversión. Optimizarlo vale más que comprarlo."
  },
  {
    "name": "Sistema de caché bien configurado",
    "category": "Performance",
    "rarity": "Épico",
    "risk": "Bajo",
    "value": 130,
    "tags": [
      "Performance",
      "Backend",
      "DevOps"
    ],
    "clues": [
      "Cachea assets con hashes.",
      "No cachea respuestas privadas.",
      "Tiene invalidación clara."
    ],
    "extra": "Distingue HTML, API y assets estáticos.",
    "explanation": "La caché bien hecha acelera sin romper datos. Es uno de los mejores activos técnicos."
  },
  {
    "name": "API sin documentación",
    "category": "APIs",
    "rarity": "Raro",
    "risk": "Alto",
    "value": -45,
    "tags": [
      "APIs",
      "Backend"
    ],
    "clues": [
      "Responde rápido.",
      "No sabes todos los parámetros.",
      "Los ejemplos están desactualizados."
    ],
    "extra": "El endpoint de autenticación devuelve errores distintos cada día.",
    "explanation": "Una API sin documentación cuesta integración, depuración y mantenimiento. El valor real cae mucho."
  },
  {
    "name": "Endpoint REST limpio",
    "category": "APIs",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 80,
    "tags": [
      "APIs",
      "Backend"
    ],
    "clues": [
      "Usa códigos HTTP coherentes.",
      "Errores en JSON claro.",
      "Autenticación documentada."
    ],
    "extra": "Incluye paginación y filtros consistentes.",
    "explanation": "Una API predecible ahorra tiempo y reduce bugs. Buena compra para cualquier proyecto."
  },
  {
    "name": "Panel admin sin autenticación",
    "category": "Seguridad",
    "rarity": "Maldito",
    "risk": "Crítico",
    "value": -180,
    "tags": [
      "Seguridad",
      "Backend"
    ],
    "clues": [
      "La URL no está enlazada, pero existe.",
      "Alguien dijo 'nadie la encontrará'.",
      "Permite editar contenido."
    ],
    "extra": "Google ya la indexó.",
    "explanation": "La seguridad por ocultación no vale. Un admin sin auth es una catástrofe esperando turno."
  },
  {
    "name": "Componente accesible de modal",
    "category": "Accesibilidad",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 75,
    "tags": [
      "Frontend",
      "UX",
      "Accesibilidad"
    ],
    "clues": [
      "Atrapa foco correctamente.",
      "Cierra con Escape.",
      "Tiene roles ARIA adecuados."
    ],
    "extra": "Devuelve el foco al botón que lo abrió.",
    "explanation": "La accesibilidad bien resuelta mejora calidad y evita bugs molestos para teclado/lectores."
  },
  {
    "name": "Carrusel infinito sin pausa",
    "category": "UX",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -45,
    "tags": [
      "Frontend",
      "UX"
    ],
    "clues": [
      "Se mueve solo.",
      "No respeta reduce-motion.",
      "En móvil se pelea con el scroll."
    ],
    "extra": "No se puede pausar con teclado.",
    "explanation": "Un carrusel intrusivo puede empeorar la experiencia. Si no respeta al usuario, resta valor."
  },
  {
    "name": "Worker de Cloudflare proxy",
    "category": "Backend",
    "rarity": "Épico",
    "risk": "Bajo",
    "value": 115,
    "tags": [
      "Backend",
      "APIs",
      "DevOps"
    ],
    "clues": [
      "Oculta claves del frontend.",
      "Permite controlar CORS.",
      "Puede cachear respuestas públicas."
    ],
    "extra": "Tiene logs claros y fallback al origen.",
    "explanation": "Un proxy bien hecho protege secretos, simplifica CORS y puede mejorar rendimiento."
  },
  {
    "name": "Worker con URL hardcodeada vieja",
    "category": "Backend",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -75,
    "tags": [
      "Backend",
      "APIs",
      "Legacy"
    ],
    "clues": [
      "Funcionaba antes del cambio de dominio.",
      "Nadie actualizó variables de entorno.",
      "Los errores son 502 intermitentes."
    ],
    "extra": "El deploy correcto está en otra cuenta.",
    "explanation": "Un proxy apuntando a un origen viejo genera bugs fantasma difíciles de diagnosticar."
  },
  {
    "name": "Backup automático diario",
    "category": "DevOps",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 95,
    "tags": [
      "DevOps",
      "Seguridad"
    ],
    "clues": [
      "Se ejecuta sin intervención.",
      "Guarda varias versiones.",
      "Se probó una restauración real."
    ],
    "extra": "Avisa si falla el backup.",
    "explanation": "Un backup que se ha probado vale muchísimo más que una promesa de backup."
  },
  {
    "name": "Backup que nunca se ha restaurado",
    "category": "DevOps",
    "rarity": "Común",
    "risk": "Alto",
    "value": -40,
    "tags": [
      "DevOps",
      "Legacy"
    ],
    "clues": [
      "Existe una carpeta llamada backups_final_final.",
      "Nadie sabe si está completa.",
      "Pesa muchísimo."
    ],
    "extra": "El último archivo tiene fecha sospechosa.",
    "explanation": "Un backup no probado es casi una superstición. Puede salvarte o fallar justo cuando importa."
  },
  {
    "name": "Logo SVG con colores editables",
    "category": "Diseño",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 65,
    "tags": [
      "Diseño",
      "Frontend"
    ],
    "clues": [
      "Usa currentColor.",
      "No trae raster incrustado.",
      "Escala sin pixelarse."
    ],
    "extra": "Se adapta a tema claro y oscuro.",
    "explanation": "Un SVG limpio y adaptable encaja perfecto en una web con temas y personalización."
  },
  {
    "name": "Logo PNG a 128px",
    "category": "Diseño",
    "rarity": "Común",
    "risk": "Medio",
    "value": -10,
    "tags": [
      "Diseño"
    ],
    "clues": [
      "Se ve bien en pequeño.",
      "En pantallas retina se emborrona.",
      "No puedes cambiar color fácilmente."
    ],
    "extra": "El fondo blanco viene pegado.",
    "explanation": "No es inútil, pero limita temas, escalado y acabado profesional."
  },
  {
    "name": "Formulario con validación real",
    "category": "Frontend",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 80,
    "tags": [
      "Frontend",
      "UX",
      "Seguridad"
    ],
    "clues": [
      "Valida en cliente y servidor.",
      "Muestra errores útiles.",
      "Evita envíos duplicados."
    ],
    "extra": "Incluye estados loading y success.",
    "explanation": "Un formulario robusto parece simple, pero evita muchos fallos reales de producto."
  },
  {
    "name": "Formulario que solo valida en frontend",
    "category": "Seguridad",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -85,
    "tags": [
      "Frontend",
      "Seguridad"
    ],
    "clues": [
      "El botón se desactiva con JS.",
      "El backend confía en todo.",
      "Con DevTools se salta fácil."
    ],
    "extra": "No sanitiza campos en servidor.",
    "explanation": "La validación frontend ayuda a UX, pero la seguridad debe vivir también en backend."
  },
  {
    "name": "Sistema de emails con doble opt-in",
    "category": "Backend",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 90,
    "tags": [
      "Backend",
      "UX",
      "Seguridad"
    ],
    "clues": [
      "Confirma suscripción por correo.",
      "Reduce registros falsos.",
      "Evita quejas de spam."
    ],
    "extra": "Guarda fecha y origen del consentimiento.",
    "explanation": "Para newsletters, un opt-in bien hecho mejora entregabilidad y confianza."
  },
  {
    "name": "Newsletter sin baja visible",
    "category": "UX",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -90,
    "tags": [
      "UX",
      "Seguridad"
    ],
    "clues": [
      "Enviar es fácil, darse de baja no.",
      "El enlace está escondido.",
      "Los usuarios se enfadan rápido."
    ],
    "extra": "Los correos acaban en spam por quejas.",
    "explanation": "Sin baja clara, el sistema pierde confianza y puede dañar la reputación del dominio."
  },
  {
    "name": "Migración SQL reversible",
    "category": "MySQL",
    "rarity": "Épico",
    "risk": "Bajo",
    "value": 115,
    "tags": [
      "MySQL",
      "Backend",
      "DevOps"
    ],
    "clues": [
      "Tiene up y down.",
      "Se probó en staging.",
      "No bloquea tablas enormes."
    ],
    "extra": "Incluye copia previa de seguridad.",
    "explanation": "Una migración pensada reduce miedo al deploy y permite corregir errores con rapidez."
  },
  {
    "name": "ALTER TABLE en producción sin backup",
    "category": "MySQL",
    "rarity": "Maldito",
    "risk": "Crítico",
    "value": -170,
    "tags": [
      "MySQL",
      "DevOps",
      "Legacy"
    ],
    "clues": [
      "La tabla es grande.",
      "Se ejecuta viernes tarde.",
      "No hay plan de rollback."
    ],
    "extra": "El comando lo copió alguien de StackOverflow sin leerlo entero.",
    "explanation": "Modificar estructura en producción sin backup ni plan puede tumbar la web y perder datos."
  },
  {
    "name": "README con instalación clara",
    "category": "GitHub",
    "rarity": "Común",
    "risk": "Bajo",
    "value": 55,
    "tags": [
      "GitHub",
      "UX"
    ],
    "clues": [
      "Explica requisitos.",
      "Tiene comandos de instalación.",
      "Incluye variables de entorno de ejemplo."
    ],
    "extra": "También dice cómo ejecutar tests/build.",
    "explanation": "Un buen README baja la barrera de entrada y evita perder tiempo preguntando lo básico."
  },
  {
    "name": "README que dice 'próximamente'",
    "category": "GitHub",
    "rarity": "Común",
    "risk": "Medio",
    "value": -20,
    "tags": [
      "GitHub",
      "Legacy"
    ],
    "clues": [
      "El proyecto parece interesante.",
      "No explica cómo arrancarlo.",
      "El autor lo entendía en 2022."
    ],
    "extra": "Hay capturas de una versión que ya no existe.",
    "explanation": "Sin instrucciones, cada instalación se convierte en arqueología."
  },
  {
    "name": "Dockerfile pequeño y limpio",
    "category": "DevOps",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 85,
    "tags": [
      "DevOps",
      "Backend"
    ],
    "clues": [
      "Usa imagen ligera.",
      "No copia secretos.",
      "Cachea capas bien."
    ],
    "extra": "El contenedor arranca con usuario no root.",
    "explanation": "Un Dockerfile bien hecho facilita despliegues reproducibles y reduce riesgos."
  },
  {
    "name": "Dockerfile de 2 GB",
    "category": "DevOps",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -60,
    "tags": [
      "DevOps",
      "Performance"
    ],
    "clues": [
      "Instala medio sistema operativo.",
      "Copia node_modules del host.",
      "Tarda siglos en build."
    ],
    "extra": "Incluye herramientas de debug en producción.",
    "explanation": "Una imagen gigante cuesta tiempo, transferencia y superficie de ataque."
  },
  {
    "name": "Test E2E del flujo principal",
    "category": "Testing",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 80,
    "tags": [
      "Testing",
      "UX"
    ],
    "clues": [
      "Cubre el camino feliz.",
      "Falla cuando rompe login o compra.",
      "Corre en CI."
    ],
    "extra": "Graba screenshot al fallar.",
    "explanation": "Un test E2E bien elegido detecta roturas importantes sin probarlo todo manualmente."
  },
  {
    "name": "Test que siempre pasa",
    "category": "Testing",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -35,
    "tags": [
      "Testing",
      "Legacy"
    ],
    "clues": [
      "Comprueba que true es true.",
      "El coverage parece alto.",
      "No cubre nada crítico."
    ],
    "extra": "Si borra media app, sigue verde.",
    "explanation": "Los tests decorativos dan falsa seguridad. Peor que no tenerlos, porque engañan."
  },
  {
    "name": "Sistema de temas claro/oscuro",
    "category": "Frontend",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 70,
    "tags": [
      "Frontend",
      "Diseño",
      "UX"
    ],
    "clues": [
      "Usa variables CSS.",
      "Respeta preferencias del sistema.",
      "No rompe contraste."
    ],
    "extra": "Los SVG también heredan color.",
    "explanation": "Un buen sistema de temas mejora percepción y mantenimiento visual."
  },
  {
    "name": "Tema claro con texto gris sobre blanco",
    "category": "UX",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -55,
    "tags": [
      "UX",
      "Diseño"
    ],
    "clues": [
      "Se ve minimalista en la maqueta.",
      "En portátil barato no se lee.",
      "Los botones parecen desactivados."
    ],
    "extra": "El contraste no pasa WCAG básico.",
    "explanation": "El diseño bonito que no se lee pierde su función. La accesibilidad también es calidad."
  },
  {
    "name": "Analítica respetuosa sin cookies invasivas",
    "category": "Privacidad",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 65,
    "tags": [
      "UX",
      "Seguridad"
    ],
    "clues": [
      "Mide lo necesario.",
      "No persigue al usuario por internet.",
      "Carga rápido."
    ],
    "extra": "No bloquea la página si falla.",
    "explanation": "Saber qué ocurre sin invadir al usuario es un equilibrio valioso."
  },
  {
    "name": "Pop-up de cookies gigante",
    "category": "UX",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -45,
    "tags": [
      "UX",
      "Legacy"
    ],
    "clues": [
      "Ocupa media pantalla.",
      "El botón aceptar brilla más.",
      "Reaparece demasiado."
    ],
    "extra": "En móvil tapa el CTA principal.",
    "explanation": "Un mal banner puede arruinar la primera impresión y bajar conversiones."
  },
  {
    "name": "Buscador con debounce",
    "category": "JavaScript",
    "rarity": "Común",
    "risk": "Bajo",
    "value": 60,
    "tags": [
      "JavaScript",
      "UX",
      "Performance"
    ],
    "clues": [
      "No dispara petición por cada tecla.",
      "Muestra loading corto.",
      "Cancela resultados viejos."
    ],
    "extra": "Maneja búsqueda vacía sin romper.",
    "explanation": "El debounce correcto hace que una búsqueda parezca fluida y no machaque la API."
  },
  {
    "name": "Buscador que consulta cada tecla",
    "category": "Performance",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -50,
    "tags": [
      "JavaScript",
      "Performance"
    ],
    "clues": [
      "Funciona en local.",
      "En producción hace demasiadas peticiones.",
      "Los resultados llegan desordenados."
    ],
    "extra": "No cancela fetch anteriores.",
    "explanation": "Sin control de frecuencia, la búsqueda carga el backend y crea resultados inconsistentes."
  },
  {
    "name": "Autenticación con sesiones seguras",
    "category": "Seguridad",
    "rarity": "Épico",
    "risk": "Bajo",
    "value": 125,
    "tags": [
      "Backend",
      "Seguridad"
    ],
    "clues": [
      "Cookies HttpOnly.",
      "Expiración razonable.",
      "Protección CSRF donde toca."
    ],
    "extra": "No guarda tokens en localStorage sin necesidad.",
    "explanation": "La autenticación bien diseñada evita sustos grandes y da confianza al sistema."
  },
  {
    "name": "Token JWT eterno en localStorage",
    "category": "Seguridad",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -100,
    "tags": [
      "Seguridad",
      "Backend"
    ],
    "clues": [
      "No caduca nunca.",
      "Se lee desde cualquier script.",
      "La app no sabe revocarlo."
    ],
    "extra": "Un XSS pequeño se vuelve un incendio grande.",
    "explanation": "Los tokens eternos y accesibles por JS amplifican el daño de cualquier vulnerabilidad frontend."
  },
  {
    "name": "Optimización de imágenes con srcset",
    "category": "Performance",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 75,
    "tags": [
      "Performance",
      "Frontend"
    ],
    "clues": [
      "Sirve tamaños distintos.",
      "Usa formatos modernos.",
      "No manda imagen enorme a móvil."
    ],
    "extra": "Incluye width/height para evitar saltos.",
    "explanation": "Imágenes optimizadas aceleran carga y mejoran estabilidad visual."
  },
  {
    "name": "Hero con vídeo de 80 MB",
    "category": "Performance",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -85,
    "tags": [
      "Performance",
      "Diseño"
    ],
    "clues": [
      "Queda espectacular en fibra.",
      "En móvil tarda demasiado.",
      "No tiene poster ligero."
    ],
    "extra": "Se reproduce antes de que el usuario quiera verlo.",
    "explanation": "Un vídeo pesado puede hacer que nadie vea lo bonito que era. Rendimiento primero."
  },
  {
    "name": "Mini juego frontend en un solo HTML",
    "category": "Frontend",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 70,
    "tags": [
      "Frontend",
      "Diseño"
    ],
    "clues": [
      "No necesita backend.",
      "Tiene CSS y JS ordenados.",
      "Se puede copiar y probar rápido."
    ],
    "extra": "El footer acredita al autor correctamente.",
    "explanation": "Una demo autocontenida es práctica para portfolio y para enseñar trabajo sin instalación."
  },
  {
    "name": "Demo que depende de 14 CDNs",
    "category": "Frontend",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -55,
    "tags": [
      "Frontend",
      "Performance",
      "Legacy"
    ],
    "clues": [
      "Carga si todos los CDNs responden.",
      "Cada librería hace una cosa mínima.",
      "Offline no muestra nada."
    ],
    "extra": "Uno de los CDNs tiene CORS raro.",
    "explanation": "Demasiadas dependencias externas vuelven la demo frágil y lenta."
  },
  {
    "name": "Sistema de logs con contexto",
    "category": "Backend",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 80,
    "tags": [
      "Backend",
      "DevOps"
    ],
    "clues": [
      "Incluye request id.",
      "No filtra contraseñas.",
      "Permite rastrear errores reales."
    ],
    "extra": "Distingue warning, error y info.",
    "explanation": "Los logs buenos convierten bugs misteriosos en problemas localizables."
  },
  {
    "name": "Logs que imprimen tokens",
    "category": "Seguridad",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -120,
    "tags": [
      "Seguridad",
      "Backend"
    ],
    "clues": [
      "Ayudaron a depurar una vez.",
      "Ahora guardan secretos en texto plano.",
      "Nadie limpia los logs antiguos."
    ],
    "extra": "Los backups también guardan esos logs.",
    "explanation": "Loguear secretos crea fugas silenciosas. Debug barato, riesgo caro."
  },
  {
    "name": "Mapa interactivo accesible",
    "category": "Frontend",
    "rarity": "Épico",
    "risk": "Medio",
    "value": 110,
    "tags": [
      "Frontend",
      "UX",
      "Accesibilidad"
    ],
    "clues": [
      "Funciona con ratón y teclado.",
      "Tiene estados hover/focus.",
      "No depende solo del color."
    ],
    "extra": "La versión mobile usa lista alternativa.",
    "explanation": "Una interacción compleja bien resuelta demuestra calidad real y atención al detalle."
  },
  {
    "name": "Mapa que solo funciona con hover",
    "category": "UX",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -50,
    "tags": [
      "UX",
      "Frontend"
    ],
    "clues": [
      "En escritorio parece guay.",
      "En móvil no existe hover.",
      "No hay alternativa táctil."
    ],
    "extra": "Los usuarios no saben qué pulsar.",
    "explanation": "Diseñar solo para hover rompe móvil y accesibilidad. La interacción debe tener alternativa."
  },
  {
    "name": "Pipeline de build limpio",
    "category": "DevOps",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 90,
    "tags": [
      "DevOps",
      "Performance"
    ],
    "clues": [
      "Instala dependencias reproducibles.",
      "Genera dist limpio.",
      "Falla si hay errores de sintaxis."
    ],
    "extra": "No sube archivos temporales al deploy.",
    "explanation": "Un build fiable reduce errores tontos y hace los cambios más seguros."
  },
  {
    "name": "Dist mezclado con archivos viejos",
    "category": "DevOps",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -70,
    "tags": [
      "DevOps",
      "Legacy"
    ],
    "clues": [
      "A veces se ve la versión nueva.",
      "A veces carga JS antiguo.",
      "Nadie limpió dist antes de compilar."
    ],
    "extra": "Hay assets duplicados con nombres parecidos.",
    "explanation": "Mezclar builds viejos y nuevos provoca bugs fantasma y cachés imposibles."
  },
  {
    "name": "Iconos SVG propios",
    "category": "Diseño",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 65,
    "tags": [
      "Diseño",
      "Frontend"
    ],
    "clues": [
      "No dependen de fuentes externas.",
      "Se pueden colorear con CSS.",
      "Escalan bien."
    ],
    "extra": "Tienen fallback si no carga nada.",
    "explanation": "Iconos controlados y ligeros evitan glitches de fuentes y mantienen estilo consistente."
  },
  {
    "name": "FontAwesome roto en producción",
    "category": "Frontend",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -40,
    "tags": [
      "Frontend",
      "UX"
    ],
    "clues": [
      "En local se veía perfecto.",
      "En producción salen cuadrados raros.",
      "La fuente no carga por ruta/CORS."
    ],
    "extra": "Los botones pierden significado sin icono.",
    "explanation": "Depender de fuentes externas para iconos puede romper UI. Mejor tener símbolos o SVG de respaldo."
  },
  {
    "name": "Prompt de IA muy específico",
    "category": "IA/Hype",
    "rarity": "Común",
    "risk": "Bajo",
    "value": 55,
    "tags": [
      "IA",
      "UX"
    ],
    "clues": [
      "Da contexto y restricciones.",
      "Pide formato de salida claro.",
      "Incluye ejemplos."
    ],
    "extra": "También dice qué NO debe hacer.",
    "explanation": "Un buen prompt no es magia, pero reduce iteraciones y resultados basura."
  },
  {
    "name": "Prompt de IA 'hazlo bonito'",
    "category": "IA/Hype",
    "rarity": "Común",
    "risk": "Medio",
    "value": -15,
    "tags": [
      "IA",
      "Hype"
    ],
    "clues": [
      "Es muy breve.",
      "No define objetivo.",
      "Luego toca corregirlo todo."
    ],
    "extra": "El resultado tiene lorem ipsum con neones.",
    "explanation": "Sin dirección clara, la IA rellena huecos con clichés. Sale rápido, pero no necesariamente útil."
  },
  {
    "name": "Sistema de feature flags",
    "category": "Backend",
    "rarity": "Épico",
    "risk": "Bajo",
    "value": 105,
    "tags": [
      "Backend",
      "DevOps"
    ],
    "clues": [
      "Permite activar funciones poco a poco.",
      "Tiene rollback rápido.",
      "Se puede segmentar por usuario."
    ],
    "extra": "Los flags viejos se limpian.",
    "explanation": "Los feature flags reducen riesgo en lanzamientos y hacen más seguro experimentar."
  },
  {
    "name": "Función beta activada a todos",
    "category": "DevOps",
    "rarity": "Maldito",
    "risk": "Alto",
    "value": -95,
    "tags": [
      "DevOps",
      "UX"
    ],
    "clues": [
      "Solo se probó en local.",
      "No tiene rollback.",
      "Los usuarios descubren los bugs."
    ],
    "extra": "El botón beta está en producción sin aviso.",
    "explanation": "Lanzar sin control convierte usuarios en testers involuntarios y complica revertir."
  },
  {
    "name": "Accesibilidad de teclado completa",
    "category": "Accesibilidad",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 85,
    "tags": [
      "Accesibilidad",
      "UX",
      "Frontend"
    ],
    "clues": [
      "Todo se puede tabular.",
      "El foco se ve claro.",
      "Enter/Escape hacen lo esperado."
    ],
    "extra": "El orden de tabulación tiene sentido.",
    "explanation": "La navegación por teclado mejora accesibilidad y también la sensación de calidad general."
  },
  {
    "name": "Botón invisible al foco",
    "category": "Accesibilidad",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -35,
    "tags": [
      "Accesibilidad",
      "UX"
    ],
    "clues": [
      "Con ratón parece funcionar.",
      "Con teclado no sabes dónde estás.",
      "El outline fue eliminado por estética."
    ],
    "extra": "No hay estilo :focus-visible.",
    "explanation": "Quitar el foco visible rompe navegación por teclado. Es un fallo pequeño con impacto grande."
  },
  {
    "name": "Cache busting por hash",
    "category": "Performance",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 75,
    "tags": [
      "Performance",
      "DevOps"
    ],
    "clues": [
      "Los assets cambian de nombre al compilar.",
      "Permite cache largo.",
      "Evita JS viejo tras deploy."
    ],
    "extra": "El HTML referencia siempre el asset correcto.",
    "explanation": "El cache busting bien hecho evita que el usuario juegue con una versión antigua sin saberlo."
  },
  {
    "name": "Ctrl+F5 como estrategia de deploy",
    "category": "DevOps",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -45,
    "tags": [
      "DevOps",
      "UX"
    ],
    "clues": [
      "Funciona si el usuario obedece.",
      "No escala.",
      "Cada bug parece caché."
    ],
    "extra": "El soporte empieza todas las frases con 'prueba a refrescar'.",
    "explanation": "Forzar refrescos manuales es síntoma de pipeline/cache mal configurados."
  },
  {
    "name": "Sistema de i18n con diccionario",
    "category": "Frontend",
    "rarity": "Raro",
    "risk": "Bajo",
    "value": 80,
    "tags": [
      "Frontend",
      "UX"
    ],
    "clues": [
      "Textos separados por idioma.",
      "Mantiene estado al cambiar idioma.",
      "No duplica HTML entero."
    ],
    "extra": "Los botones se adaptan a textos largos.",
    "explanation": "Un i18n ordenado permite crecer sin convertir cada cambio en tres copias manuales."
  },
  {
    "name": "Traducción pegada en HTML duplicado",
    "category": "Frontend",
    "rarity": "Maldito",
    "risk": "Medio",
    "value": -55,
    "tags": [
      "Frontend",
      "Legacy"
    ],
    "clues": [
      "Funciona al principio.",
      "Cada idioma tiene markup distinto.",
      "Un bug se arregla en un idioma y en otro no."
    ],
    "extra": "El selector de idioma no sabe qué versión está activa.",
    "explanation": "Duplicar estructura por idioma escala fatal y provoca inconsistencias."
  }
]
JSON;
    return add_pool_ids('subasta', json_decode($json, true) ?: []);
}
function subasta_total_rounds(array $players): int { return count($players) <= 1 ? 7 : 8; }
function subasta_bid_ms(array $state): int {
    $event = $state['marketEvents'][(string)(int)($state['current'] ?? 0)] ?? [];
    $ms = (int)($event['bidMs'] ?? 30000);
    // Nunca dejamos Subasta en 10-15s: el jugador necesita leer lote, pistas, herramientas y confirmar.
    if (($event['id'] ?? '') === 'turbo') return max(22000, $ms);
    return max(30000, $ms);
}
function subasta_reveal_ms(): int { return 8500; }
function subasta_min_decision_ms(): int { return 9000; }
function subasta_can_resolve_early(array $state): bool {
    $started = (int)($state['phaseStartedMs'] ?? 0);
    return $started > 0 && now_ms() - $started >= subasta_min_decision_ms();
}
function subasta_start_credits(array $players): int { return count($players) <= 1 ? 150 : 120; }
function subasta_event_pool(): array {
    return [
        ['id'=>'normal','label'=>'Mercado estable','note'=>'Tienes 30 segundos: lee pistas, decide puja y confirma.','bidMs'=>30000],
        ['id'=>'black-friday','label'=>'Black Friday técnico','note'=>'Analizar cuesta 5 créditos menos. Buena ronda para mirar una pista extra antes de apostar.','bidMs'=>30000,'analyzeDiscount'=>5],
        ['id'=>'ia-hype','label'=>'Hype de IA','note'=>'Los lotes de IA pueden ser oro o humo. Mira riesgo y pistas antes de dejarte llevar.','bidMs'=>30000,'tag'=>'IA','valueGood'=>35,'valueBad'=>-35],
        ['id'=>'legacy-crisis','label'=>'Crisis Legacy','note'=>'Lo antiguo puede ser reliquia o deuda técnica. Ojo con mantenimiento y compatibilidad.','bidMs'=>30000,'tag'=>'Legacy','valueGood'=>-20,'valueBad'=>-40],
        ['id'=>'security-panic','label'=>'Pánico de seguridad','note'=>'Seguridad y backups suben. Los lotes inseguros se vuelven mucho más peligrosos.','bidMs'=>30000,'tag'=>'Seguridad','valueGood'=>30,'valueBad'=>-35],
        ['id'=>'turbo','label'=>'Ronda turbo','note'=>'Ronda más rápida, pero no instantánea: 22 segundos para decidir.','bidMs'=>22000],
        ['id'=>'glitch','label'=>'Ronda glitch','note'=>'Una pista puede sonar demasiado optimista. Analizar es especialmente útil.','bidMs'=>30000,'glitch'=>true],
        ['id'=>'jackpot','label'=>'Jackpot del mercado','note'=>'Valor extremo amplificado: puedes remontar o hundirte. Seguro recomendado si dudas.','bidMs'=>30000,'valueMultiplier'=>1.25],
    ];
}
function subasta_pick_event(int $roundIndex): array {
    $pool = subasta_event_pool();
    if ($roundIndex === 0) return $pool[0];
    $event = $pool[random_int(0, count($pool) - 1)];
    return $event;
}
function subasta_pick_sequence(PDO $pdo, int $roomId, array $players): array {
    $total = subasta_total_rounds($players);
    $pool = subasta_pool();
    $used = used_content_ids($pdo, $roomId, 'subasta');
    $available = array_values(array_filter($pool, fn($lot) => !isset($used[(string)($lot['id'] ?? '')])));
    if (count($available) < $total) $available = $pool;
    shuffle($available);
    return array_slice($available, 0, $total);
}
function subasta_bot_profiles(): array {
    return [
        ['id'=>'bot_conservador','name'=>'AuditBot','avatar'=>'bot-blue','style'=>'conservative','mood'=>'Puja poco y evita riesgos altos.'],
        ['id'=>'bot_hype','name'=>'HypeBot','avatar'=>'bot-pink','style'=>'hype','mood'=>'Se emociona con rarezas épicas y legendarias.'],
        ['id'=>'bot_troll','name'=>'TrollBid','avatar'=>'bot-yellow','style'=>'troll','mood'=>'A veces sube el precio solo para meter presión.'],
    ];
}
function subasta_init_state(PDO $pdo, int $roomId, array $players): array {
    $lots = subasta_pick_sequence($pdo, $roomId, $players);
    $start = subasta_start_credits($players);
    $credits = [];
    foreach ($players as $p) $credits[(string)(int)$p['id']] = $start;
    $bots = [];
    if (count($players) <= 1) {
        $bots = subasta_bot_profiles();
        foreach ($bots as $bot) $credits[(string)$bot['id']] = $start;
    }
    $events = [];
    foreach ($lots as $i => $_) $events[(string)$i] = subasta_pick_event($i);
    return [
        'contentId'=>'subasta-set-' . substr(sha1(jenc(array_map(fn($l) => $l['id'] ?? '', $lots))), 0, 12),
        'lots'=>$lots,
        'challenge'=>$lots[0] ?? [],
        'current'=>0,
        'total'=>count($lots),
        'initialCredits'=>$start,
        'credits'=>$credits,
        'clarityVersion'=>5,
        'phaseStartedMs'=>now_ms(),
        'bots'=>$bots,
        'marketEvents'=>$events,
        'bids'=>[],
        'revealedClues'=>[],
        'owned'=>[],
        'history'=>[],
        'effects'=>[],
        'submissions'=>[],
        'scores'=>[],
        'instructions'=>[
            'Objetivo: acabar con más capital que los rivales.',
            'Cada lote tiene valor real oculto. Puja menos de lo que crees que vale.',
            'Si ganas: valor real menos puja = beneficio o pérdida. Analizar y seguro ayudan a decidir.'
        ],
    ];
}
function subasta_current_key(array $state): string { return (string)(int)($state['current'] ?? 0); }
function subasta_current_lot(array $state): array { $i = (int)($state['current'] ?? 0); return $state['lots'][$i] ?? ($state['challenge'] ?? []); }
function subasta_current_event(array $state): array { return $state['marketEvents'][subasta_current_key($state)] ?? ['id'=>'normal','label'=>'Mercado estable','note'=>'Tienes 30 segundos para leer, analizar y confirmar.','bidMs'=>30000]; }
function subasta_analyze_cost(array $state, string $pid): int {
    $cost = 10 - (int)(subasta_current_event($state)['analyzeDiscount'] ?? 0);
    if (!empty(($state['effects'][$pid] ?? [])['audit'])) $cost = max(0, $cost - 5);
    return max(0, $cost);
}
function subasta_insurance_cost(array $state, string $pid): int { return !empty(($state['effects'][$pid] ?? [])['cheapInsurance']) ? 10 : 15; }
function subasta_actual_value(array $lot, array $event): int {
    $value = (int)($lot['value'] ?? 0);
    $tags = array_map('strval', $lot['tags'] ?? []);
    if (!empty($event['tag']) && in_array((string)$event['tag'], $tags, true)) {
        $value += $value >= 0 ? (int)($event['valueGood'] ?? 0) : (int)($event['valueBad'] ?? 0);
    }
    if (!empty($event['valueMultiplier'])) $value = (int)round($value * (float)$event['valueMultiplier']);
    return $value;
}
function subasta_active_player_keys(array $players): array {
    $online = array_values(array_filter($players, fn($p) => !empty($p['online'])));
    if (!$online) $online = $players;
    return array_map(fn($p) => (string)(int)$p['id'], $online);
}
function subasta_bid_bucket(array $lot, array $event): int {
    $value = subasta_actual_value($lot, $event);
    $risk = (string)($lot['risk'] ?? 'Medio');
    $rarity = (string)($lot['rarity'] ?? 'Común');
    $expected = $value * 0.55;
    if (in_array($risk, ['Alto','Crítico'], true)) $expected -= 25;
    if (in_array($rarity, ['Épico','Legendario'], true)) $expected += 20;
    if ($rarity === 'Maldito') $expected -= 45;
    return (int)round(max(0, min(140, $expected)) / 5) * 5;
}
function subasta_bot_bid(array $bot, array $lot, array $event, int $credits): array {
    $base = subasta_bid_bucket($lot, $event);
    $style = (string)($bot['style'] ?? 'conservative');
    if ($style === 'conservative') $base = (int)round($base * 0.72);
    if ($style === 'hype' && in_array((string)($lot['rarity'] ?? ''), ['Épico','Legendario'], true)) $base += 35;
    if ($style === 'troll') $base += random_int(-15, 45);
    $risk = (string)($lot['risk'] ?? 'Medio');
    if ($risk === 'Crítico') $base -= 45;
    if ($risk === 'Alto') $base -= 20;
    $bid = max(0, min($credits, (int)round($base / 5) * 5));
    $stance = $bid <= 0 ? 'Paso' : ($bid >= max(80, $credits * 0.55) ? 'Voy fuerte' : 'Me interesa');
    return ['bid'=>$bid,'insurance'=>false,'stance'=>$stance,'at'=>now_ms() + random_int(20, 900),'bot'=>true];
}
function subasta_all_bids_ready(array $state, array $players): bool {
    $key = subasta_current_key($state);
    $bids = $state['bids'][$key] ?? [];
    foreach (subasta_active_player_keys($players) as $pid) {
        if (!isset($bids[$pid])) return false;
    }
    return true;
}
function subasta_prepare_missing_and_bots(array &$state, array $players): void {
    $key = subasta_current_key($state);
    if (!isset($state['bids'][$key]) || !is_array($state['bids'][$key])) $state['bids'][$key] = [];
    foreach (subasta_active_player_keys($players) as $pid) {
        if (!isset($state['bids'][$key][$pid])) $state['bids'][$key][$pid] = ['bid'=>0,'insurance'=>false,'stance'=>'Paso','at'=>now_ms(),'auto'=>true];
    }
    $lot = subasta_current_lot($state);
    $event = subasta_current_event($state);
    foreach (($state['bots'] ?? []) as $bot) {
        $bid = (string)$bot['id'];
        if (!isset($state['bids'][$key][$bid])) $state['bids'][$key][$bid] = subasta_bot_bid($bot, $lot, $event, (int)(($state['credits'] ?? [])[$bid] ?? 0));
    }
}
function subasta_participant_name(string $id, array $players, array $state): string {
    foreach ($players as $p) if ((string)(int)$p['id'] === $id) return (string)$p['name'];
    foreach (($state['bots'] ?? []) as $bot) if ((string)$bot['id'] === $id) return (string)$bot['name'];
    return 'Mercader';
}
function subasta_lot_label(int $value, int $net): string {
    if ($value < -80 || $net < -90) return 'Bomba técnica';
    if ($value < 0) return 'Estafa';
    if ($net >= 100) return 'Tesorazo';
    if ($net >= 45) return 'Chollazo';
    if ($net >= 0) return 'Compra decente';
    return 'Sobrepago';
}
function subasta_apply_lot_effect(string $winner, array $lot, array &$state, array &$notes): void {
    $name = (string)($lot['name'] ?? '');
    $tags = array_map('strval', $lot['tags'] ?? []);
    if (strpos($name, 'CDN') !== false || in_array('Performance', $tags, true)) {
        $state['effects'][$winner]['audit'] = true;
        $notes[] = 'Efecto: tus próximos análisis cuestan un poco menos.';
    }
    if (strpos($name, 'Backup') !== false) {
        $state['effects'][$winner]['backup'] = true;
        $notes[] = 'Efecto: backup preparado para amortiguar una pérdida futura.';
    }
    if (strpos($name, 'Seguridad') !== false || in_array('Seguridad', $tags, true)) {
        $state['effects'][$winner]['cheapInsurance'] = true;
        $notes[] = 'Efecto: el seguro te cuesta menos en futuras rondas.';
    }
}
function subasta_resolve_lot(PDO $pdo, array $players, array &$state): void {
    $key = subasta_current_key($state);
    if (!empty(($state['history'][$key] ?? [])['resolved'])) return;
    subasta_prepare_missing_and_bots($state, $players);
    $lot = subasta_current_lot($state);
    $event = subasta_current_event($state);
    $bids = $state['bids'][$key] ?? [];
    $winner = null; $winnerBid = 0; $winnerAt = PHP_INT_MAX;
    foreach ($bids as $pid => $entry) {
        $bid = max(0, (int)($entry['bid'] ?? 0));
        $at = (int)($entry['at'] ?? PHP_INT_MAX);
        if ($bid > $winnerBid || ($bid === $winnerBid && $bid > 0 && $at < $winnerAt)) {
            $winner = (string)$pid; $winnerBid = $bid; $winnerAt = $at;
        }
    }
    $value = subasta_actual_value($lot, $event);
    $net = 0; $label = 'Sin venta'; $notes = [];
    if ($winner !== null && $winnerBid > 0) {
        $net = $value - $winnerBid;
        if (!empty(($state['effects'][$winner] ?? [])['backup']) && $net < 0) {
            $net += min(35, abs($net));
            unset($state['effects'][$winner]['backup']);
            $notes[] = 'Backup usado: la pérdida se amortigua.';
        }
        $insured = !empty($bids[$winner]['insurance']);
        if ($insured && $net < 0) {
            $net = (int)ceil($net / 2);
            $notes[] = 'Seguro activado: pérdida reducida a la mitad.';
        }
        $state['credits'][$winner] = max(0, (int)(($state['credits'][$winner] ?? 0)) + $net);
        $state['owned'][$winner][] = ['id'=>$lot['id'] ?? '', 'name'=>$lot['name'] ?? '', 'tags'=>$lot['tags'] ?? [], 'value'=>$value, 'bid'=>$winnerBid, 'net'=>$net, 'rarity'=>$lot['rarity'] ?? 'Común'];
        subasta_apply_lot_effect($winner, $lot, $state, $notes);
        $label = subasta_lot_label($value, $net);
    }
    $rows = [];
    foreach ($bids as $pid => $entry) {
        $rows[] = ['playerId'=>(string)$pid,'name'=>subasta_participant_name((string)$pid, $players, $state),'bid'=>(int)($entry['bid'] ?? 0),'insurance'=>!empty($entry['insurance']),'stance'=>(string)($entry['stance'] ?? ''),'bot'=>!empty($entry['bot']),'winner'=>$winner !== null && (string)$pid === $winner,'auto'=>!empty($entry['auto'])];
    }
    usort($rows, fn($a, $b) => ($b['bid'] <=> $a['bid']));
    $state['history'][$key] = [
        'resolved'=>true,
        'lot'=>$lot,
        'event'=>$event,
        'winner'=>$winner,
        'winnerName'=>$winner ? subasta_participant_name($winner, $players, $state) : 'Sin comprador',
        'winnerBid'=>$winnerBid,
        'value'=>$value,
        'net'=>$net,
        'label'=>$label,
        'rows'=>$rows,
        'notes'=>$notes,
        'explanation'=>(string)($lot['explanation'] ?? 'El valor real dependía de riesgo, mantenimiento y utilidad del lote.'),
    ];
    $state['lastResult'] = $state['history'][$key];
}
function subasta_combo_bonus(array $owned): array {
    $tags = [];
    foreach ($owned as $lot) foreach (($lot['tags'] ?? []) as $tag) $tags[(string)$tag] = ($tags[(string)$tag] ?? 0) + 1;
    $bonus = 0; $labels = [];
    if (($tags['Frontend'] ?? 0) >= 1 && (($tags['Backend'] ?? 0) >= 1) && (($tags['MySQL'] ?? 0) >= 1)) { $bonus += 50; $labels[] = 'Stack completo +50'; }
    if (($tags['Hosting'] ?? 0) >= 1 && (($tags['Seguridad'] ?? 0) >= 1) && (($tags['Performance'] ?? 0) >= 1)) { $bonus += 45; $labels[] = 'Infraestructura decente +45'; }
    foreach ($tags as $tag => $count) {
        if ($count >= 3 && !in_array($tag, ['Legacy'], true)) { $bonus += 30; $labels[] = "Colección {$tag} +30"; break; }
    }
    if (($tags['Legacy'] ?? 0) >= 3) { $bonus -= 40; $labels[] = 'Deuda técnica legacy -40'; }
    return ['bonus'=>$bonus,'labels'=>$labels,'tags'=>$tags];
}
function subasta_finish_game(PDO $pdo, array $players, array &$state): void {
    if (!empty($state['resolved'])) return;
    $summary = [];
    $start = (int)($state['initialCredits'] ?? 120);
    foreach (($state['credits'] ?? []) as $pid => $credits) {
        $owned = $state['owned'][$pid] ?? [];
        $combo = subasta_combo_bonus($owned);
        $final = max(0, (int)$credits + (int)$combo['bonus']);
        $summary[(string)$pid] = [
            'playerId'=>(string)$pid,
            'name'=>subasta_participant_name((string)$pid, $players, $state),
            'credits'=>(int)$credits,
            'comboBonus'=>(int)$combo['bonus'],
            'finalCredits'=>$final,
            'ownedCount'=>count($owned),
            'combos'=>$combo['labels'],
            'bot'=>strpos((string)$pid, 'bot_') === 0,
        ];
    }
    $rows = array_values($summary);
    usort($rows, fn($a, $b) => ($b['finalCredits'] <=> $a['finalCredits']));
    $bestBuy = null; $worstBuy = null; $allIn = null;
    foreach (($state['history'] ?? []) as $r) {
        if (empty($r['winner'])) continue;
        $entry = ['playerId'=>$r['winner'], 'name'=>$r['winnerName'], 'lot'=>$r['lot']['name'] ?? 'Lote', 'net'=>(int)$r['net'], 'bid'=>(int)$r['winnerBid']];
        if ($bestBuy === null || $entry['net'] > $bestBuy['net']) $bestBuy = $entry;
        if ($worstBuy === null || $entry['net'] < $worstBuy['net']) $worstBuy = $entry;
        if ($entry['bid'] >= $start * 0.75 && ($allIn === null || $entry['net'] > $allIn['net'])) $allIn = $entry;
    }
    foreach ($players as $p) {
        $pid = (string)(int)$p['id'];
        $points = max(0, (int)(($summary[$pid] ?? [])['finalCredits'] ?? 0));
        add_score($pdo, (int)$p['id'], $points);
        $state['scores'][$pid] = $points;
    }
    $state['summary'] = $summary;
    $state['finalRows'] = $rows;
    $state['medals'] = ['winner'=>$rows[0] ?? null, 'bestBuy'=>$bestBuy, 'worstBuy'=>$worstBuy, 'allIn'=>$allIn];
    $state['resolved'] = true;
}
function subasta_next_or_finish(PDO $pdo, array $players, array &$state): string {
    $next = (int)($state['current'] ?? 0) + 1;
    $total = count($state['lots'] ?? []);
    if ($next >= $total) {
        subasta_finish_game($pdo, $players, $state);
        return 'results';
    }
    $state['current'] = $next;
    $state['challenge'] = $state['lots'][$next] ?? [];
    unset($state['lastResult']);
    return 'bid';
}
function subasta_auto_progress_room(PDO $pdo, array $room): void {
    if ($pdo->inTransaction()) return;
    $round = active_round($pdo, (int)$room['id']);
    if (!$round || (string)$round['mode'] !== 'subasta' || (string)$round['status'] !== 'playing') return;
    $phase = (string)$round['phase'];
    if (!in_array($phase, ['bid','reveal'], true)) return;
    $state = jdec($round['state_json']);
    $players = players_for_room($pdo, (int)$room['id']);
    // Repara rondas creadas con la versión antigua de 11-15s para que el jugador tenga tiempo real.
    if ($phase === 'bid' && (int)($state['clarityVersion'] ?? 0) < 5) {
        $state['clarityVersion'] = 5;
        $state['phaseStartedMs'] = now_ms();
        $pdo->prepare("UPDATE party_rounds SET state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), now_ms() + subasta_bid_ms($state), (int)$round['id']]);
        return;
    }
    $due = !empty($round['ends_at_ms']) && now_ms() >= (int)$round['ends_at_ms'];
    $ready = $phase === 'bid' && subasta_all_bids_ready($state, $players) && subasta_can_resolve_early($state);
    if (!$due && !$ready) return;
    $pdo->beginTransaction();
    try {
        $roomLocked = room_by_code($pdo, (string)$room['code'], true);
        if (!$roomLocked) { $pdo->rollBack(); return; }
        $lockedRound = active_round($pdo, (int)$roomLocked['id'], true);
        if (!$lockedRound || (string)$lockedRound['mode'] !== 'subasta' || (string)$lockedRound['status'] !== 'playing') { $pdo->rollBack(); return; }
        $phase = (string)$lockedRound['phase'];
        $state = jdec($lockedRound['state_json']);
        $players = players_for_room($pdo, (int)$roomLocked['id']);
        if ($phase === 'bid') {
            subasta_resolve_lot($pdo, $players, $state);
            $state['phaseStartedMs'] = now_ms();
            $pdo->prepare("UPDATE party_rounds SET phase = 'reveal', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), now_ms() + subasta_reveal_ms(), (int)$lockedRound['id']]);
            $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
        } elseif ($phase === 'reveal') {
            $nextPhase = subasta_next_or_finish($pdo, $players, $state);
            if ($nextPhase === 'results') {
                $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([jenc($state), (int)$lockedRound['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            } else {
                $state['phaseStartedMs'] = now_ms();
                $state['clarityVersion'] = 3;
                $pdo->prepare("UPDATE party_rounds SET phase = 'bid', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), now_ms() + subasta_bid_ms($state), (int)$lockedRound['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
    }
}

function boss_pool(): array {
    return add_pool_ids('boss', [
        ['name'=>'EL BUG SUPREMO', 'hpMult'=>1.00, 'dmgMult'=>1.00, 'armor'=>4, 'trait'=>'Mutación adaptativa', 'weak'=>'attack', 'icon'=>'fa-solid fa-bug', 'flavor'=>'Aprende de cada error del equipo. Cuando nadie le cubre, castiga al más vulnerable sin piedad.'],
        ['name'=>'LA EXCEPCIÓN FANTASMA', 'hpMult'=>0.92, 'dmgMult'=>1.10, 'armor'=>2, 'trait'=>'Aparición impredecible', 'weak'=>'protect', 'icon'=>'fa-solid fa-ghost', 'flavor'=>'Desaparece entre turnos y reaparece donde menos se espera. Sin escudo, el golpe es devastador.'],
        ['name'=>'EL NULL DEVORADOR', 'hpMult'=>1.06, 'dmgMult'=>0.96, 'armor'=>5, 'trait'=>'Drenaje de esencia', 'weak'=>'boost', 'icon'=>'fa-solid fa-circle-xmark', 'flavor'=>'Cada ataque le devuelve vida mientras vacía la vuestra. Solo un boost masivo puede detener el ciclo.'],
        ['name'=>'LA PROMESA INFINITA', 'hpMult'=>1.12, 'dmgMult'=>0.93, 'armor'=>3, 'trait'=>'Carga catastrófica', 'weak'=>'attack', 'icon'=>'fa-solid fa-infinity', 'flavor'=>'Acumula energía sin descanso. Si nadie la interrumpe, el golpe final borra a todo el equipo de un trazo.'],
        ['name'=>'EL CSS IMPOSIBLE', 'hpMult'=>0.96, 'dmgMult'=>1.04, 'armor'=>6, 'trait'=>'Capas de escudo mutable', 'weak'=>'boost', 'icon'=>'fa-solid fa-layer-group', 'flavor'=>'Sus defensas cambian de layout cada ronda. El boost es la única herramienta que rompe su arquitectura.'],
        ['name'=>'EL JOIN MALDITO', 'hpMult'=>1.00, 'dmgMult'=>1.06, 'armor'=>4, 'trait'=>'Focus implacable', 'weak'=>'protect', 'icon'=>'fa-solid fa-link', 'flavor'=>'Detecta al jugador más débil y lo persigue sin tregua. Cubridlo o el equipo pierde a su eslabón más crítico.'],
        ['name'=>'EL CORS DEL ABISMO', 'hpMult'=>1.08, 'dmgMult'=>1.05, 'armor'=>3, 'trait'=>'Barrido interdimensional', 'weak'=>'protect', 'icon'=>'fa-solid fa-shield-virus', 'flavor'=>'Sus barridos atraviesan todas las capas de red. El muro coordinado del equipo es el único escudo posible.'],
        ['name'=>'EL BUILD ROTO', 'hpMult'=>0.98, 'dmgMult'=>1.00, 'armor'=>5, 'trait'=>'Compilación caótica', 'weak'=>'boost', 'icon'=>'fa-solid fa-hammer', 'flavor'=>'Alterna entre blindaje total y ventanas de burst explosivo. El timing del boost decide la batalla.'],
        ['name'=>'LA QUERY SIN ÍNDICE', 'hpMult'=>1.16, 'dmgMult'=>0.92, 'armor'=>9, 'trait'=>'Fortaleza monolítica', 'weak'=>'boost', 'icon'=>'fa-solid fa-database', 'flavor'=>'Una muralla viviente que absorbe el daño directo. Solo los ataques potenciados al máximo pueden quebrar su núcleo.'],
        ['name'=>'EL EVENT LOOP ROTO', 'hpMult'=>0.93, 'dmgMult'=>1.14, 'armor'=>2, 'trait'=>'Bucle de destrucción', 'weak'=>'attack', 'icon'=>'fa-solid fa-arrows-spin', 'flavor'=>'Encadena ataques en bucle infinito. El daño coordinado es la única forma de romper el ciclo antes de que sea tarde.'],
        ['name'=>'EL Z-INDEX DEMONÍACO', 'hpMult'=>1.02, 'dmgMult'=>1.03, 'armor'=>5, 'trait'=>'Planos superpuestos', 'weak'=>'boost', 'icon'=>'fa-solid fa-cubes-stacked', 'flavor'=>'Cada capa defensiva que rompes revela otra más oscura. El boost es la única herramienta que atraviesa todos sus planos.'],
        ['name'=>'EL DEPLOY DEL VIERNES', 'hpMult'=>1.06, 'dmgMult'=>1.10, 'armor'=>4, 'trait'=>'Enrage exponencial', 'weak'=>'protect', 'icon'=>'fa-solid fa-rocket', 'flavor'=>'Cada turno que pasa sin derrotarlo lo vuelve más letal. El tiempo corre en su favor: no dejéis que llegue al límite.'],
        ['name'=>'EL DEADLOCK ETERNO', 'hpMult'=>1.04, 'dmgMult'=>0.98, 'armor'=>7, 'trait'=>'Bloqueo total', 'weak'=>'boost', 'icon'=>'fa-solid fa-lock', 'flavor'=>'Congela las acciones del equipo si nadie sincroniza. Un solo boost bien ejecutado es suficiente para liberarlo todo.'],
        ['name'=>'LA RECURSIÓN SIN FIN', 'hpMult'=>1.20, 'dmgMult'=>0.90, 'armor'=>4, 'trait'=>'Copias infinitas', 'weak'=>'attack', 'icon'=>'fa-solid fa-code-branch', 'flavor'=>'Cada ronda invoca copias de sí misma que amplifican el daño recibido. El ataque puro y sostenido es la única salida.'],
        ['name'=>'EL MERGE CONFLICT', 'hpMult'=>1.00, 'dmgMult'=>1.08, 'armor'=>5, 'trait'=>'Reversión de daño', 'weak'=>'attack', 'icon'=>'fa-solid fa-code-merge', 'flavor'=>'Revierte el daño recibido si el equipo no ataca en sincronía total. O todos a la vez, o nadie hace daño real.'],
    ]);
}

function boss_intents(): array {
    return [
        ['type'=>'sweep', 'label'=>'Barrido de errores', 'icon'=>'fa-solid fa-wind', 'text'=>'Daño a todo el equipo. PROTEGER crea muro y reduce mucho el golpe.', 'counter'=>'protect'],
        ['type'=>'focus', 'label'=>'Null pointer marcado', 'icon'=>'fa-solid fa-crosshairs', 'text'=>'Va a por quien tenga más aggro o menos vida. PROTEGER puede interceptar.', 'counter'=>'protect'],
        ['type'=>'charge', 'label'=>'Carga crítica', 'icon'=>'fa-solid fa-bolt', 'text'=>'Si el equipo hace daño suficiente, se interrumpe. Si no, golpe brutal.', 'counter'=>'attack'],
        ['type'=>'shield', 'label'=>'Escudo de compilación', 'icon'=>'fa-solid fa-shield-halved', 'text'=>'Tiene armadura extra este turno. BOOST y ataques cargados la rompen mejor.', 'counter'=>'boost'],
        ['type'=>'drain', 'label'=>'Memory leak', 'icon'=>'fa-solid fa-droplet', 'text'=>'Daña y se cura. Mucho daño reduce la curación.', 'counter'=>'attack'],
        ['type'=>'glitch', 'label'=>'Glitch caótico', 'icon'=>'fa-solid fa-virus', 'text'=>'Golpea objetivos aleatorios y castiga BOOST sin cobertura.', 'counter'=>'protect'],
        ['type'=>'rupture', 'label'=>'Ruptura de escudos', 'icon'=>'fa-solid fa-burst', 'text'=>'Rompe parte del escudo antes de pegar. Mejor atacar o rematar.', 'counter'=>'attack'],
    ];
}
function boss_pick_intent(array $state): array {
    $turn = (int)($state['turn'] ?? 1);
    $hp = max(0, (int)($state['bossHp'] ?? ($state['hp'] ?? 1)));
    $max = max(1, (int)($state['maxBossHp'] ?? ($state['maxHp'] ?? 1)));
    $rage = (int)($state['rage'] ?? 0);
    if ($turn >= (int)($state['maxTurns'] ?? 8) || ($hp / $max) <= 0.25 || $rage >= 7) {
        $late = [
            ['type'=>'enrage', 'label'=>'Enrage de producción', 'icon'=>'fa-solid fa-fire-flame-curved', 'text'=>'Ataque brutal de final de combate. Escudos o burst final.', 'counter'=>'protect'],
            ['type'=>'charge', 'label'=>'Carga crítica', 'icon'=>'fa-solid fa-bolt', 'text'=>'Si hacéis suficiente daño, se interrumpe. Si no, pega muy fuerte.', 'counter'=>'attack'],
            ['type'=>'drain', 'label'=>'Memory leak', 'icon'=>'fa-solid fa-droplet', 'text'=>'Intentará curarse para alargar la pelea. Haced daño.', 'counter'=>'attack'],
        ];
        return $late[array_rand($late)];
    }
    $pool = boss_intents();
    // Evita repetir exactamente el mismo patrón demasiadas veces.
    $lastType = (string)(($state['intent'] ?? [])['type'] ?? '');
    for ($i = 0; $i < 4; $i++) {
        $pick = $pool[array_rand($pool)];
        if (($pick['type'] ?? '') !== $lastType) return $pick;
    }
    return $pool[array_rand($pool)];
}
function boss_ensure_state(array &$state, array $players): bool {
    $beforeRepair = jenc($state);
    $state['bossHp'] = max(0, (int)($state['bossHp'] ?? ($state['hp'] ?? 1)));
    $state['maxBossHp'] = max(1, (int)($state['maxBossHp'] ?? ($state['maxHp'] ?? 1)));
    $state['hp'] = $state['bossHp'];
    $state['maxHp'] = $state['maxBossHp'];
    $state['turn'] = max(1, (int)($state['turn'] ?? 1));
    $state['turnDurationMs'] = max(5000, min(10000, (int)($state['turnDurationMs'] ?? 8000)));
    $state['maxTurns'] = max(8, min(12, (int)($state['maxTurns'] ?? 10)));
    $oldBalanceVersion = (int)($state['balanceVersion'] ?? 0);
    $activePlayersForBalance = boss_required_players($players);
    $activeCountForBalance = max(1, count($activePlayersForBalance));
    $targetPlayerMaxHp = $activeCountForBalance <= 1 ? 150 : ($activeCountForBalance === 2 ? 135 : 130);
    if ($oldBalanceVersion < 9) {
        $bossData = is_array($state['bossData'] ?? null) ? $state['bossData'] : [];
        if ($activeCountForBalance <= 1) {
            $baseBossHp = 385;
        } elseif ($activeCountForBalance === 2) {
            $baseBossHp = 720;
        } elseif ($activeCountForBalance === 3) {
            $baseBossHp = 1040;
        } else {
            $baseBossHp = 1040 + (($activeCountForBalance - 3) * 285);
        }
        $targetMaxHp = (int)round($baseBossHp * (float)($bossData['hpMult'] ?? 1));
        if ($targetMaxHp > 0 && (int)$state['maxBossHp'] !== $targetMaxHp) {
            $ratio = max(0.08, min(1.0, (int)$state['bossHp'] / max(1, (int)$state['maxBossHp'])));
            $state['maxBossHp'] = $targetMaxHp;
            $state['bossHp'] = max(1, min($targetMaxHp, (int)round($targetMaxHp * $ratio)));
            $state['hp'] = $state['bossHp'];
            $state['maxHp'] = $state['maxBossHp'];
        }
        $state['maxTurns'] = $activeCountForBalance <= 1 ? max((int)$state['maxTurns'], 10) : max((int)$state['maxTurns'], max(9, min(12, 8 + (int)ceil($activeCountForBalance / 2))));
        $state['balanceVersion'] = 9;
    }

    // Boss no usa el temporizador largo de la ronda. Usa subturnos de 5-10s.
    // Si una ronda antigua trae 40-60s guardados en state_json, lo reparamos aquí
    // para que el boss ataque sí o sí al terminar el subturno real.
    $now = now_ms();
    $duration = (int)$state['turnDurationMs'];
    $ends = isset($state['turnEndsAtMs']) ? (int)$state['turnEndsAtMs'] : 0;
    if ($ends <= 0) {
        $state['turnStartedAtMs'] = $now;
        $state['turnEndsAtMs'] = $now + $duration;
    } else {
        if (!isset($state['turnStartedAtMs']) || (int)$state['turnStartedAtMs'] <= 0) {
            $state['turnStartedAtMs'] = max(0, $ends - $duration);
        }
        if ($ends > $now + $duration + 1200) {
            $state['turnStartedAtMs'] = $now;
            $state['turnEndsAtMs'] = $now + $duration;
        }
    }
    if (!isset($state['fighters']) || !is_array($state['fighters'])) $state['fighters'] = [];
    foreach ($players as $p) {
        $pid = (string)(int)$p['id'];
        if (!isset($state['fighters'][$pid]) || !is_array($state['fighters'][$pid])) {
            $state['fighters'][$pid] = ['hp'=>$targetPlayerMaxHp, 'maxHp'=>$targetPlayerMaxHp, 'shield'=>0, 'boost'=>0, 'aggro'=>0, 'vulnerable'=>0, 'damageTaken'=>0, 'lastMove'=>null, 'points'=>0, 'downed'=>false];
        }
        $f =& $state['fighters'][$pid];
        $previousMaxHp = max(1, (int)($f['maxHp'] ?? $targetPlayerMaxHp));
        $f['maxHp'] = $targetPlayerMaxHp;
        $f['hp'] = max(0, min($f['maxHp'], (int)($f['hp'] ?? $f['maxHp'])));
        if ($oldBalanceVersion < 9 && $previousMaxHp < $targetPlayerMaxHp) {
            $ratio = max(0.20, min(1.0, (int)$f['hp'] / $previousMaxHp));
            $f['hp'] = min($targetPlayerMaxHp, max((int)$f['hp'], (int)round($targetPlayerMaxHp * $ratio)) + 12);
        }
        $f['shield'] = max(0, min(140, (int)($f['shield'] ?? 0)));
        $f['boost'] = max(0, min(4, (int)($f['boost'] ?? 0)));
        $f['aggro'] = max(0, min(999, (int)($f['aggro'] ?? 0)));
        $f['vulnerable'] = max(0, min(3, (int)($f['vulnerable'] ?? 0)));
        $f['damageTaken'] = max(0, (int)($f['damageTaken'] ?? 0));
        $f['points'] = (int)($f['points'] ?? 0);
        $f['downed'] = $f['hp'] <= 0;
        unset($f);
    }
    if (!isset($state['choices']) || !is_array($state['choices'])) $state['choices'] = [];
    if (!isset($state['events']) || !is_array($state['events'])) $state['events'] = [];
    if (!isset($state['turnHistory']) || !is_array($state['turnHistory'])) $state['turnHistory'] = [];
    if (!isset($state['hits']) || !is_array($state['hits'])) $state['hits'] = [];
    if (!isset($state['intent']) || !is_array($state['intent'])) $state['intent'] = boss_pick_intent($state);
    return jenc($state) !== $beforeRepair;
}
function boss_player_name(array $players, int $id): string {
    foreach ($players as $p) if ((int)$p['id'] === $id) return (string)$p['name'];
    return 'Jugador';
}
function boss_required_players(array $players): array {
    $online = array_values(array_filter($players, fn($p) => !empty($p['online'])));
    return $online ?: $players;
}
function boss_alive_ids(array $state, array $players): array {
    $ids = [];
    foreach ($players as $p) {
        $pid = (string)(int)$p['id'];
        if ((int)(($state['fighters'][$pid] ?? [])['hp'] ?? 0) > 0) $ids[] = (int)$p['id'];
    }
    return $ids;
}
function boss_all_players_down(array $state, array $players): bool {
    foreach ($players as $p) {
        $pid = (string)(int)$p['id'];
        if ((int)(($state['fighters'][$pid] ?? [])['hp'] ?? 0) > 0) return false;
    }
    return true;
}
function boss_current_choices(array $state): array {
    $turnKey = (string)(int)($state['turn'] ?? 1);
    return is_array(($state['choices'] ?? [])[$turnKey] ?? null) ? $state['choices'][$turnKey] : [];
}
function boss_all_required_chose(array $state, array $players): bool {
    $choices = boss_current_choices($state);
    $required = boss_required_players($players);
    if (count($required) <= 0) return false;
    foreach ($required as $p) {
        $pid = (string)(int)$p['id'];
        if (!isset($choices[$pid])) return false;
    }
    return true;
}
function boss_turn_due(array $state): bool {
    $ends = (int)($state['turnEndsAtMs'] ?? 0);
    return $ends > 0 && $ends <= now_ms();
}
function boss_award(PDO $pdo, int $playerId, int $points, int $damage = 0): void {
    if ($points <= 0 && $damage <= 0) return;
    $pdo->prepare('UPDATE party_players SET score = score + ?, damage = damage + ? WHERE id = ?')->execute([max(0, $points), max(0, $damage), $playerId]);
}
function boss_finish(PDO $pdo, array $players, array &$state, string $outcome, string $reason): string {
    if (!empty($state['resolved'])) return 'results';
    $state['outcome'] = $outcome;
    $state['outcomeReason'] = $reason;
    $state['resolved'] = true;
    $state['finishedAtMs'] = now_ms();
    if (!isset($state['lastResolution']) || !is_array($state['lastResolution'])) $state['lastResolution'] = [];
    $state['lastResolution']['finished'] = true;
    $state['events'][] = ['type'=>'finish', 'label'=>$outcome === 'victory' ? 'VICTORIA' : 'DERROTA', 'text'=>$reason, 'at'=>now_ms()];
    if ($outcome === 'victory') {
        foreach ($players as $p) {
            $pid = (string)(int)$p['id'];
            $alive = (int)(($state['fighters'][$pid] ?? [])['hp'] ?? 0) > 0;
            $bonus = $alive ? 420 : 220;
            boss_award($pdo, (int)$p['id'], $bonus, 0);
            $state['fighters'][$pid]['points'] = (int)(($state['fighters'][$pid] ?? [])['points'] ?? 0) + $bonus;
        }
    }
    $state['events'] = array_slice($state['events'], -24);
    return 'results';
}
function boss_apply_damage_to_player(array &$state, array $players, int $id, int $raw, int $teamShield, array &$turnEvents, string $reason): int {
    $pid = (string)$id;
    if (!isset($state['fighters'][$pid])) return 0;
    $f =& $state['fighters'][$pid];
    if ((int)$f['hp'] <= 0) { unset($f); return 0; }
    $move = (string)($f['lastMove'] ?? 'miss');
    $raw = max(1, (int)$raw);
    $soloHero = count(boss_required_players($players)) <= 1;

    // PROTEGER reduce, pero SIEMPRE hay daño de chip. En solo, el jugador recibe margen extra
    // porque no hay nadie que pueda cubrirle, revivirle o repartir el focus del boss.
    if ($move === 'protect') $raw = (int)round($raw * ($soloHero ? 0.52 : 0.66));
    if ($move === 'miss') $raw = (int)round($raw * ($soloHero ? 1.10 : 1.22));
    if ((int)($f['vulnerable'] ?? 0) > 0) $raw = (int)round($raw * ($soloHero ? (1.08 + ((int)$f['vulnerable'] * 0.04)) : (1.12 + ((int)$f['vulnerable'] * 0.06))));
    if ($reason === 'rupture') {
        $f['shield'] = (int)round((int)($f['shield'] ?? 0) * 0.18);
        $raw = (int)round($raw * 1.12);
    }

    $personalShield = max(0, (int)($f['shield'] ?? 0));
    $virtualTeamShield = max(0, (int)$teamShield);
    $totalShield = $personalShield + $virtualTeamShield;
    $maxAbsorb = (int)floor($raw * ($soloHero ? 0.72 : 0.62)); // nunca absorbe el 100%.
    $blocked = min($totalShield, max(0, $maxAbsorb));
    $chip = $blocked > 0 ? max(2, (int)ceil($raw * ($soloHero ? 0.07 : 0.10))) : 0;
    $taken = max($chip, $raw - $blocked);
    $taken = min($raw, max(0, $taken));

    // Consume primero el escudo personal visible; el muro de equipo es virtual y desaparece al final del golpe.
    $personalConsumed = min($personalShield, $blocked);
    $f['shield'] = max(0, min(90, $personalShield - $personalConsumed));
    $f['hp'] = max(0, (int)$f['hp'] - $taken);
    $f['damageTaken'] = (int)($f['damageTaken'] ?? 0) + $taken;

    if ($blocked > 0) {
        $turnEvents[] = ['type'=>'hit', 'playerId'=>$id, 'player'=>boss_player_name($players, $id), 'label'=>'DAÑO', 'text'=>"{$reason}: recibe {$taken} de daño ({$blocked} bloqueado, daño de chip aplicado).", 'damage'=>$taken, 'blocked'=>$blocked, 'at'=>now_ms()];
    } else {
        $turnEvents[] = ['type'=>'hit', 'playerId'=>$id, 'player'=>boss_player_name($players, $id), 'label'=>'DAÑO', 'text'=>"{$reason}: recibe {$taken} de daño directo.", 'damage'=>$taken, 'blocked'=>0, 'at'=>now_ms()];
    }
    if ((int)$f['hp'] <= 0) {
        $f['downed'] = true;
        $turnEvents[] = ['type'=>'down', 'playerId'=>$id, 'player'=>boss_player_name($players, $id), 'label'=>'CAÍDO', 'text'=>'Puede elegir REBOOT para levantarse en el próximo turno, pero el equipo pierde presión.', 'damage'=>0, 'at'=>now_ms()];
    }
    unset($f);
    return $taken;
}
function boss_resolve_turn(PDO $pdo, array $players, array &$state, bool $fast = false): string {
    boss_ensure_state($state, $players);
    if (!empty($state['resolved'])) return 'results';
    $turn = (int)$state['turn'];
    $turnKey = (string)$turn;
    $choices = boss_current_choices($state);
    $intent = $state['intent'];
    $boss = $state['bossData'] ?? [];
    $combatPlayers = boss_required_players($players);
    $playerCount = max(1, count($combatPlayers));
    $soloHero = $playerCount <= 1;
    $aliveBefore = boss_alive_ids($state, $combatPlayers);
    if (!$aliveBefore) return boss_finish($pdo, $players, $state, 'defeat', 'Todo el equipo ha caído.');

    $counts = ['attack'=>0, 'protect'=>0, 'boost'=>0, 'miss'=>0];
    foreach ($combatPlayers as $p) {
        $pid = (string)(int)$p['id'];
        $move = (string)(($choices[$pid] ?? [])['move'] ?? 'miss');
        if (!in_array($move, ['attack','protect','boost'], true)) $move = 'miss';
        $counts[$move]++;
    }
    $aliveCount = max(1, count($aliveBefore));
    $triad = $counts['attack'] > 0 && $counts['protect'] > 0 && $counts['boost'] > 0 && $playerCount >= 3;
    $focusFire = $counts['attack'] >= max(1, (int)ceil($aliveCount * 0.55));
    $wall = $counts['protect'] >= max(1, (int)ceil($playerCount * 0.34));
    $overclock = $counts['boost'] >= max(1, (int)ceil($playerCount * 0.34));
    $fastSync = $fast && $counts['miss'] === 0;
    $turtling = $counts['protect'] > 0 && $counts['attack'] === 0 && $counts['boost'] === 0;
    $synergies = [];
    if ($triad) $synergies[] = 'Trinidad: +15% daño y -10% daño recibido';
    if ($focusFire) $synergies[] = 'Focus fire: ataques coordinados';
    if ($wall) $synergies[] = 'Muro: escudo de equipo e interceptación';
    if ($overclock) $synergies[] = 'Overclock: los boosts cargan más';
    if ($fastSync) $synergies[] = 'Sincronía rápida: bonus por elegir todos';
    if ($turtling) $synergies[] = 'Guard break: si todo el equipo solo defiende, el boss atraviesa escudos';

    $teamDamage = 0;
    $teamShield = $wall ? ($soloHero ? 18 : 10 + $playerCount * 3) : 0;
    $turnEvents = [];
    $protectors = [];
    $attackers = [];
    $boosters = [];
    $armor = max(0, (int)($boss['armor'] ?? 0) - ($soloHero ? 5 : 2));
    $weak = (string)($boss['weak'] ?? 'attack');
    $rage = max(0, (int)($state['rage'] ?? 0));

    foreach ($combatPlayers as $p) {
        $id = (int)$p['id'];
        $pid = (string)$id;
        $name = (string)$p['name'];
        $f =& $state['fighters'][$pid];
        $move = (string)(($choices[$pid] ?? [])['move'] ?? 'miss');
        if (!in_array($move, ['attack','protect','boost'], true)) $move = 'miss';
        if ((int)$f['hp'] <= 0 && $move !== 'protect') $move = 'miss';
        $f['lastMove'] = $move;
        $damage = 0;
        $points = 0;
        $label = 'SIN ACCIÓN';
        $detail = 'No eligió a tiempo: sin daño y sin escudo.';
        $crit = false;
        $boostUsed = 0;

        if ((int)$f['hp'] <= 0 && $move === 'protect') {
            $f['hp'] = min((int)$f['maxHp'], 32 + ($wall ? 12 : 0));
            $f['shield'] = 18 + ($wall ? 8 : 0);
            $f['downed'] = false;
            $f['vulnerable'] = 0;
            $points = 150;
            $label = 'REBOOT';
            $detail = 'Vuelve al combate con escudo de emergencia.';
            $protectors[] = $id;
        } elseif ((int)$f['hp'] > 0 && $move === 'protect') {
            $protectors[] = $id;
            $damage = $soloHero ? random_int(12, 20) : random_int(6, 12); // counter pequeño para que no sea turno muerto
            $f['shield'] = min($soloHero ? 110 : 90, (int)$f['shield'] + ($soloHero ? 42 : 28 + $playerCount));
            $f['aggro'] = max(0, (int)$f['aggro'] - 18);
            $f['vulnerable'] = 0;
            $points = 70;
            $label = 'PROTEGER';
            $detail = 'Escudo grande, baja aggro e intercepta ataques peligrosos.';
        } elseif ((int)$f['hp'] > 0 && $move === 'boost') {
            $boosters[] = $id;
            $damage = $soloHero ? random_int(14, 24) : random_int(8, 16);
            $gain = 1 + ($overclock ? 1 : 0);
            $f['boost'] = min(4, (int)$f['boost'] + $gain);
            $f['aggro'] = (int)$f['aggro'] + ($soloHero ? 7 : 12);
            $f['vulnerable'] = min(3, (int)$f['vulnerable'] + ($soloHero ? 0 : 1));
            $points = 80;
            $label = 'BOOST';
            $detail = $overclock ? 'Carga doble por overclock, pero quedas vulnerable.' : 'Prepara daño futuro, pero quedas vulnerable.';
        } elseif ((int)$f['hp'] > 0 && $move === 'attack') {
            $attackers[] = $id;
            $boostUsed = (int)$f['boost'];
            $f['boost'] = 0;
            $base = $soloHero ? random_int(88, 118) : random_int(66, 92);
            $damage = $base + $boostUsed * ($soloHero ? random_int(72, 92) : random_int(52, 68));
            $critChance = ($soloHero ? 12 : 8) + $boostUsed * ($soloHero ? 10 : 8) + ($fastSync ? 5 : 0);
            $crit = random_int(1, 100) <= $critChance;
            if ($crit) $damage = (int)round($damage * 1.6);
            $f['aggro'] = (int)$f['aggro'] + 16 + $boostUsed * 9;
            $f['vulnerable'] = max(0, (int)$f['vulnerable'] - 1);
            $label = $boostUsed > 0 ? 'ATAQUE CARGADO' : 'ATACAR';
            $detail = $boostUsed > 0 ? "Consume {$boostUsed} carga(s) de boost." : 'Daño estable, genera aggro.';
        }

        if ($damage > 0) {
            if ($triad) $damage = (int)round($damage * 1.15);
            if ($focusFire && $move === 'attack') $damage = (int)round($damage * 1.13);
            if ($fastSync) $damage = (int)round($damage * 1.06);
            if ($weak === $move) $damage = (int)round($damage * 1.12);
            if (($intent['type'] ?? '') === 'shield' && $move !== 'boost' && $boostUsed <= 0) $damage = (int)round($damage * 0.68);
            $reducedByArmor = max(0, $armor + (($intent['type'] ?? '') === 'shield' ? 7 : 0) - ($move === 'boost' ? 4 : 0) - $boostUsed * 4);
            $damage = max(1, $damage - $reducedByArmor);
            $state['bossHp'] = max(0, (int)$state['bossHp'] - $damage);
            $state['hp'] = $state['bossHp'];
            $state['hits'][$pid] = (int)(($state['hits'][$pid] ?? 0) + $damage);
            $teamDamage += $damage;
            $points += $damage;
        }
        if ($triad) $points += 30;
        if ($wall && $move === 'protect') $points += 35;
        if ($overclock && $move === 'boost') $points += 35;
        if ($focusFire && $move === 'attack') $points += 25;
        if ($points > 0) {
            $f['points'] = (int)($f['points'] ?? 0) + $points;
            boss_award($pdo, $id, $points, $damage);
        }
        $turnEvents[] = ['type'=>'player', 'playerId'=>$id, 'player'=>$name, 'move'=>$move, 'label'=>$label, 'damage'=>$damage, 'crit'=>$crit, 'points'=>$points, 'text'=>$detail, 'at'=>now_ms()];
        unset($f);
    }

    if ($wall) {
        foreach ($players as $p) {
            $pid = (string)(int)$p['id'];
            if ((int)(($state['fighters'][$pid] ?? [])['hp'] ?? 0) <= 0) {
                $state['fighters'][$pid]['hp'] = 28;
                $state['fighters'][$pid]['shield'] = 24;
                $state['fighters'][$pid]['downed'] = false;
                $turnEvents[] = ['type'=>'synergy', 'label'=>'REANIMACIÓN DE MURO', 'text'=>boss_player_name($players, (int)$p['id']) . ' vuelve al combate por el muro.', 'at'=>now_ms()];
                break;
            }
        }
    }

    $interrupted = false;
    $threshold = $soloHero ? (55 + $rage * 8) : (45 + $playerCount * 34 + $rage * 10);
    if (($intent['type'] ?? '') === 'charge' && $teamDamage >= $threshold) {
        $interrupted = true;
        $turnEvents[] = ['type'=>'synergy', 'label'=>'INTERRUPCIÓN', 'text'=>"Carga cortada: {$teamDamage}/{$threshold} daño.", 'at'=>now_ms()];
    }

    $bossDamageDone = 0;
    $bossText = '';
    if ((int)$state['bossHp'] <= 0) {
        $state['lastResolution'] = ['turn'=>$turn, 'teamDamage'=>$teamDamage, 'bossDamage'=>0, 'synergies'=>$synergies, 'intent'=>$intent, 'events'=>$turnEvents, 'summary'=>'El equipo tumba al boss antes de su ataque.', 'counts'=>$counts, 'choices'=>$choices, 'interrupted'=>$interrupted];
        $state['events'] = array_slice(array_merge($state['events'], $turnEvents), -24);
        return boss_finish($pdo, $players, $state, 'victory', 'El equipo ha destruido al boss.');
    }

    $aliveIds = boss_alive_ids($state, $combatPlayers);
    $base = (int)round(($soloHero ? (14 + $rage * 2) : (24 + $playerCount * 5 + $rage * 5)) * (float)($boss['dmgMult'] ?? 1));
    $type = (string)($intent['type'] ?? 'sweep');
    if ($interrupted) {
        $bossText = 'Carga interrumpida: daño residual a todo el equipo.';
        foreach ($aliveIds as $id) $bossDamageDone += boss_apply_damage_to_player($state, $players, $id, random_int(5, 10), $teamShield, $turnEvents, 'residual');
    } else {
        $targets = [];
        $rawByTarget = [];
        if ($type === 'focus') {
            $best = null; $bestScore = -999;
            foreach ($aliveIds as $id) {
                $pid = (string)$id;
                $hpNow = (int)$state['fighters'][$pid]['hp'];
                $score = (int)$state['fighters'][$pid]['aggro'] + (120 - $hpNow) + ((int)($state['fighters'][$pid]['vulnerable'] ?? 0) * 18);
                if ($score > $bestScore) { $bestScore = $score; $best = $id; }
            }
            $target = $best ?? $aliveIds[array_rand($aliveIds)];
            if ($protectors) {
                $target = $protectors[array_rand($protectors)];
                $bossText = 'Un protector intercepta el focus.';
            } else {
                $bossText = 'El boss castiga al jugador más expuesto.';
            }
            $targets = [$target];
            $rawByTarget[(string)$target] = ($soloHero ? random_int($base + 14, $base + 24) : random_int($base + 24, $base + 42));
        } elseif ($type === 'drain') {
            $targets = $aliveIds;
            $bossText = 'Memory leak: daño de área y curación parcial.';
            foreach ($targets as $id) $rawByTarget[(string)$id] = ($soloHero ? random_int($base + 3, $base + 11) : random_int($base + 1, $base + 12));
            $heal = $soloHero ? max(0, 22 - (int)round($teamDamage * 0.18)) : max(0, 55 - (int)round($teamDamage * 0.25));
            if ($heal > 0) {
                $state['bossHp'] = min((int)$state['maxBossHp'], (int)$state['bossHp'] + $heal);
                $state['hp'] = $state['bossHp'];
                $turnEvents[] = ['type'=>'boss', 'label'=>'DRENAJE', 'text'=>"El boss recupera {$heal} HP.", 'damage'=>0, 'at'=>now_ms()];
            }
        } elseif ($type === 'glitch') {
            $targets = $aliveIds;
            shuffle($targets);
            $targets = array_slice($targets, 0, min(count($targets), max(1, (int)ceil($playerCount / 2))));
            $bossText = 'Glitch caótico: objetivos aleatorios.';
            foreach ($targets as $id) {
                $pid = (string)$id;
                $vulnerableBoost = (($state['fighters'][$pid]['lastMove'] ?? '') === 'boost') && !$protectors;
                $rawByTarget[(string)$id] = ($soloHero ? random_int($base + 7, $base + 17) + ($vulnerableBoost ? 8 : 0) : random_int($base + 8, $base + 24) + ($vulnerableBoost ? 18 : 0));
            }
        } elseif ($type === 'enrage') {
            $targets = $aliveIds;
            $bossText = 'Enrage: golpe masivo de final de combate.';
            foreach ($targets as $id) $rawByTarget[(string)$id] = ($soloHero ? random_int($base + 15, $base + 25) : random_int($base + 20, $base + 38));
        } elseif ($type === 'charge') {
            $targets = $aliveIds;
            $bossText = 'La carga no se ha interrumpido.';
            foreach ($targets as $id) $rawByTarget[(string)$id] = ($soloHero ? random_int($base + 13, $base + 23) : random_int($base + 18, $base + 34));
        } elseif ($type === 'rupture') {
            $targets = $aliveIds;
            $bossText = 'Ruptura: el boss rompe escudos antes de dañar.';
            foreach ($targets as $id) $rawByTarget[(string)$id] = ($soloHero ? random_int($base + 8, $base + 18) : random_int($base + 8, $base + 22));
        } else {
            $targets = $aliveIds;
            $bossText = $type === 'shield' ? 'Escudo activo: contraataque moderado.' : 'Barrido de errores al equipo.';
            foreach ($targets as $id) $rawByTarget[(string)$id] = ($soloHero ? random_int($base + 5, $base + 14) : random_int($base + 4, $base + 18));
        }
        foreach ($targets as $id) {
            $raw = max(1, (int)($rawByTarget[(string)$id] ?? $base));
            if ($triad) $raw = (int)round($raw * 0.9);
            if ($turtling) $raw += $soloHero ? max(2, (int)ceil($rage / 2)) : 8 + $rage;
            $bossDamageDone += boss_apply_damage_to_player($state, $players, $id, $raw, $teamShield, $turnEvents, $type);
        }
        if ($turtling) {
            $turnEvents[] = ['type'=>'boss', 'label'=>'GUARD BREAK', 'text'=>'Defender sin atacar ni boostear vuelve al equipo predecible: el boss atraviesa escudos.', 'damage'=>0, 'at'=>now_ms()];
        }
    }

    foreach ($players as $p) {
        $pid = (string)(int)$p['id'];
        $state['fighters'][$pid]['shield'] = max(0, (int)round((int)($state['fighters'][$pid]['shield'] ?? 0) * 0.42));
        $state['fighters'][$pid]['aggro'] = max(0, (int)round((int)($state['fighters'][$pid]['aggro'] ?? 0) * 0.68));
        $state['fighters'][$pid]['vulnerable'] = max(0, (int)($state['fighters'][$pid]['vulnerable'] ?? 0) - 1);
        $state['fighters'][$pid]['downed'] = (int)($state['fighters'][$pid]['hp'] ?? 0) <= 0;
    }

    $turnEvents[] = ['type'=>'boss', 'label'=>$intent['label'] ?? 'Ataque del boss', 'text'=>$bossText, 'damage'=>$bossDamageDone, 'at'=>now_ms()];
    $summary = $teamDamage . ' daño al boss · ' . $bossDamageDone . ' daño recibido';
    $state['lastResolution'] = ['turn'=>$turn, 'teamDamage'=>$teamDamage, 'bossDamage'=>$bossDamageDone, 'synergies'=>$synergies, 'intent'=>$intent, 'events'=>$turnEvents, 'summary'=>$summary, 'interrupted'=>$interrupted, 'counts'=>$counts, 'choices'=>$choices];
    $state['turnHistory'][] = $state['lastResolution'];
    $state['turnHistory'] = array_slice($state['turnHistory'], -10);
    $state['events'] = array_slice(array_merge($state['events'], $turnEvents), -24);
    $state['rage'] = $rage + 1;

    if ((int)$state['bossHp'] <= 0) return boss_finish($pdo, $players, $state, 'victory', 'El equipo ha destruido al boss.');
    if (boss_all_players_down($state, $combatPlayers)) return boss_finish($pdo, $players, $state, 'defeat', 'Todo el equipo activo ha caído.');
    if ($turn >= (int)$state['maxTurns']) return boss_finish($pdo, $players, $state, 'defeat', 'El boss llegó a enrage máximo antes de caer.');

    $state['turn'] = $turn + 1;
    $state['intent'] = boss_pick_intent($state);
    $state['turnStartedAtMs'] = now_ms();
    $state['turnEndsAtMs'] = $state['turnStartedAtMs'] + (int)$state['turnDurationMs'];
    $state['hp'] = $state['bossHp'];
    $state['maxHp'] = $state['maxBossHp'];
    return 'battle';
}
function boss_auto_progress_room(PDO $pdo, array $room): void {
    if ($pdo->inTransaction()) return;
    $round = active_round($pdo, (int)$room['id']);
    if (!$round || (string)$round['mode'] !== 'boss-coop' || (string)$round['status'] !== 'playing' || (string)$round['phase'] !== 'battle') return;
    $state = jdec($round['state_json']);
    $players = players_for_room($pdo, (int)$room['id']);
    $repairedClock = boss_ensure_state($state, $players);
    if (!boss_turn_due($state) && !boss_all_required_chose($state, $players)) {
        if ($repairedClock) {
            $pdo->prepare("UPDATE party_rounds SET state_json = ?, ends_at_ms = ? WHERE id = ?")
                ->execute([jenc($state), (int)$state['turnEndsAtMs'], (int)$round['id']]);
        }
        return;
    }
    $pdo->beginTransaction();
    try {
        $roomLocked = room_by_code($pdo, (string)$room['code'], true);
        if (!$roomLocked) { $pdo->rollBack(); return; }
        $lockedRound = active_round($pdo, (int)$roomLocked['id'], true);
        if (!$lockedRound || (string)$lockedRound['mode'] !== 'boss-coop' || (string)$lockedRound['status'] !== 'playing' || (string)$lockedRound['phase'] !== 'battle') { $pdo->rollBack(); return; }
        $state = jdec($lockedRound['state_json']);
        $players = players_for_room($pdo, (int)$roomLocked['id']);
        boss_ensure_state($state, $players);
        if (!boss_turn_due($state) && !boss_all_required_chose($state, $players)) { $pdo->rollBack(); return; }
        $phase = boss_resolve_turn($pdo, $players, $state, boss_all_required_chose($state, $players));
        if ($phase === 'results') {
            $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([jenc($state), (int)$lockedRound['id']]);
            $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
        } else {
            $pdo->prepare("UPDATE party_rounds SET status = 'playing', phase = ?, state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([$phase, jenc($state), (int)$state['turnEndsAtMs'], (int)$lockedRound['id']]);
            $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Boss auto progress failed: ' . $e->getMessage());
    }
}

function rhythm_pool(): array {
    return add_pool_ids('rhythm', [
        ['title'=>'Eastern Gate Pulse', 'bpm'=>120],
        ['title'=>'Neon Commit', 'bpm'=>126],
        ['title'=>'CSS Combo', 'bpm'=>132],
        ['title'=>'Bug Sprint', 'bpm'=>140],
        ['title'=>'Terminal Groove', 'bpm'=>118],
        ['title'=>'Deploy Rush', 'bpm'=>128],
        ['title'=>'Arcade Merge', 'bpm'=>134],
        ['title'=>'Syntax Fever', 'bpm'=>145],
    ]);
}
function forbidden_button_bank(): array {
    $items = json_decode(<<<'JSON'
[{"name": "Botón de Producción", "kind": "trap", "risk": "Alto", "clue": "No lo pruebes en viernes.", "hint": "Huele a trampa: aguantar suele ser mejor que tocar producción.", "explanation": "Pulsar en producción sin contexto casi siempre sale caro. Quien aguantó demostró sangre fría."}, {"name": "Botón de Deploy Dorado", "kind": "prize", "risk": "Medio", "clue": "El primero que se atreva puede llevarse el release.", "hint": "Puede premiar al primer click, pero si todos dudan se escapa.", "explanation": "Era una ventana de deploy limpia: el primero en pulsar se llevó el premio principal."}, {"name": "Botón de Merge Conflict", "kind": "split", "risk": "Alto", "clue": "Demasiadas manos rompen la rama.", "hint": "Si crees que varios pulsarán, aguantar puede ser la jugada buena.", "explanation": "Un merge conflict castiga el caos: un único click era controlado, varios clicks rompían la rama."}, {"name": "Botón Bomba de Caché", "kind": "bomb", "risk": "Muy alto", "clue": "Si nadie lo toca, el sistema se estabiliza solo.", "hint": "Parece peligroso para todos. Aguantar tiene valor.", "explanation": "Era una bomba compartida: si alguien la tocaba, el equipo sufría. No tocarla era la solución."}, {"name": "Botón Jackpot del Último Segundo", "kind": "jackpot", "risk": "Alto", "clue": "El último segundo brilla más que todos los demás.", "hint": "Si vas a pulsar, el timing importa muchísimo.", "explanation": "Solo valía la pena pulsar casi al final. El click temprano era puro ansia."}, {"name": "Botón Mentiroso", "kind": "liar", "risk": "Medio", "clue": "La advertencia parece demasiado obvia para ser verdad.", "hint": "La pista puede estar intentando asustarte.", "explanation": "Era un botón mentiroso: parecía mala idea, pero castigaba la indecisión."}, {"name": "Botón Ladrón de Ranking", "kind": "thief", "risk": "Medio", "clue": "El líder debería vigilar su bolsillo.", "hint": "Sirve para remontar si alguien va por delante.", "explanation": "El botón robaba valor del líder simbólico. Buena herramienta para recortar distancia."}, {"name": "Botón Sacrificio de Backup", "kind": "sacrifice", "risk": "Medio", "clue": "Pulsarlo ayuda... pero quizá no a quien lo pulsa.", "hint": "Puede ser útil si quieres salvar puntos del grupo.", "explanation": "El pulsador pagaba parte del coste para que los demás sumaran. Muy noble, poco rentable para el dedo."}, {"name": "Botón Glitch de Milisegundos", "kind": "glitch", "risk": "Variable", "clue": "El efecto cambia mientras lo miras.", "hint": "No es seguro: el momento exacto puede alterar el resultado.", "explanation": "Era un glitch temporal. Pulsar podía salir bien o mal según el instante."}, {"name": "Botón Eco del Turno Anterior", "kind": "echo", "risk": "Variable", "clue": "Este botón recuerda lo que acaba de pasar.", "hint": "Piensa en la ronda anterior: puede repetir su lógica.", "explanation": "El botón eco imitaba la energía de la ronda anterior, así que la memoria importaba."}, {"name": "Botón Cookie Sospechosa", "kind": "thief", "risk": "Medio", "clue": "Aceptar todo sin leer suele beneficiar a alguien.", "hint": "Puede robar valor al que va ganando.", "explanation": "Como una cookie agresiva: quien pulsa acepta condiciones raras y mueve puntos."}, {"name": "Botón de Semáforo Rojo", "kind": "trap", "risk": "Alto", "clue": "Está rojo por una razón.", "hint": "La paciencia parece más segura.", "explanation": "La señal era honesta. Pulsar el rojo era comerse la penalización."}, {"name": "Botón de Semáforo Verde", "kind": "prize", "risk": "Bajo", "clue": "La luz verde no dura para siempre.", "hint": "Si confías en la pista, pulsar temprano puede pagar.", "explanation": "Era una oportunidad clara: el primer click se llevó el bonus."}, {"name": "Botón Anti-Spam", "kind": "split", "risk": "Alto", "clue": "Un click bien. Dos clicks, desastre.", "hint": "Si todos parecen nerviosos, mejor aguantar.", "explanation": "El sistema toleraba un solo click; varios clicks activaban el castigo anti-spam."}, {"name": "Botón de Pánico General", "kind": "bomb", "risk": "Muy alto", "clue": "El panel dice: calma. Literalmente calma.", "hint": "Si nadie pulsa, se gana más de lo que parece.", "explanation": "El pánico era el enemigo. Nadie necesitaba tocarlo para ganar."}, {"name": "Botón del Último Frame", "kind": "jackpot", "risk": "Alto", "clue": "Quien espere demasiado poco pierde; quien espere justo gana.", "hint": "Busca la ventana final si eres valiente.", "explanation": "La ronda premiaba timing, no solo valor. Pulsar al final era la jugada maestra."}, {"name": "Botón de Clickbait", "kind": "liar", "risk": "Medio", "clue": "NO PULSES. Premio garantizado. Seguro. De verdad.", "hint": "Suena contradictorio porque lo es.", "explanation": "Era clickbait: la frase intentaba manipularte. Había que leer entre líneas."}, {"name": "Botón Firewall", "kind": "shield", "risk": "Medio", "clue": "Protegerse puede convertir el peligro en puntos.", "hint": "Blindaje tiene premio extra en esta ronda.", "explanation": "El firewall premiaba cubrirse: blindarse fue mejor que arriesgar un click."}, {"name": "Botón de Auditoría", "kind": "wait", "risk": "Bajo", "clue": "Revisar antes de actuar evita bugs caros.", "hint": "Aguantar es una decisión activa, no pasar de jugar.", "explanation": "La auditoría recompensaba no precipitarse. Esperar también es jugar."}, {"name": "Botón de Hype IA", "kind": "trap", "risk": "Alto", "clue": "Promete hacerlo todo en un click.", "hint": "Demasiado bonito para ser verdad.", "explanation": "El hype vendía humo. Pulsar compraba la promesa; aguantar evitaba la estafa."}, {"name": "Botón Open Source Legendario", "kind": "prize", "risk": "Medio", "clue": "Mucha gente lo usa, pero alguien tiene que dar el primer paso.", "hint": "Puede ser una oportunidad buena si eres rápido.", "explanation": "Era un proyecto sólido. Pulsar primero fue como encontrar una joya mantenida."}, {"name": "Botón de Base de Datos en Producción", "kind": "bomb", "risk": "Muy alto", "clue": "Una consulta sin WHERE puede doler a todos.", "hint": "Si alguien toca esto, salpica.", "explanation": "Era una bomba de base de datos: un click irresponsable afectaba a todos."}, {"name": "Botón de Hotfix Nocturno", "kind": "jackpot", "risk": "Alto", "clue": "A veces el arreglo bueno llega al límite.", "hint": "El final de la cuenta atrás puede valer mucho.", "explanation": "El hotfix necesitaba temple. Pulsar demasiado pronto no arreglaba nada."}, {"name": "Botón de Pull Request", "kind": "split", "risk": "Medio", "clue": "Una revisión basta. Diez revisiones bloquean el merge.", "hint": "Un solo pulsador sale bien; varios generan caos.", "explanation": "Una persona tomando responsabilidad funcionaba. Demasiada gente tocando a la vez lo rompía."}, {"name": "Botón de Revert", "kind": "wait", "risk": "Bajo", "clue": "A veces la mejor acción es no añadir otro cambio.", "hint": "Aguantar puede darte puntos limpios.", "explanation": "No tocar el sistema evitó empeorar el fallo. Buen autocontrol."}, {"name": "Botón de Licencia Dudosa", "kind": "trap", "risk": "Alto", "clue": "Gratis hasta que lees la letra pequeña.", "hint": "Blindaje ayuda, aguantar ayuda más.", "explanation": "La letra pequeña castigaba el click impulsivo."}, {"name": "Botón de Dominio Premium", "kind": "prize", "risk": "Medio", "clue": "El nombre bueno se lo lleva quien decide rápido.", "hint": "Puede premiar la valentía temprana.", "explanation": "Era una oportunidad limitada: quien actuó primero consiguió valor."}, {"name": "Botón de Rate Limit", "kind": "split", "risk": "Medio", "clue": "Demasiadas peticiones y la API te echa.", "hint": "Si pulsan muchos, el sistema castiga.", "explanation": "La API soportaba una acción, no una avalancha."}, {"name": "Botón de CORS Maldito", "kind": "liar", "risk": "Medio", "clue": "Bloqueado por política extraña. Quizá el bloqueo es el engaño.", "hint": "Puede que pulsar rompa el bloqueo.", "explanation": "La advertencia era más confusa que útil. El botón mentía sobre su peligro real."}, {"name": "Botón de SSL Caducado", "kind": "trap", "risk": "Alto", "clue": "El navegador ya te está avisando.", "hint": "No ignores señales de seguridad.", "explanation": "El aviso de seguridad era real. Pulsarlo no era valentía, era accidente."}, {"name": "Botón CDN Estable", "kind": "shield", "risk": "Bajo", "clue": "La protección bien puesta mejora todo.", "hint": "Blindarse puede ser la jugada óptima.", "explanation": "El CDN actuó como escudo: quien se blindó aprovechó mejor la ronda."}, {"name": "Botón Stack Overflow 2012", "kind": "glitch", "risk": "Variable", "clue": "Funciona... dependiendo del día.", "hint": "Puede salir bien o mal según el timing.", "explanation": "La solución vieja era impredecible. A veces salva, a veces rompe."}, {"name": "Botón de Memoria Caché", "kind": "echo", "risk": "Variable", "clue": "Lo que hiciste antes todavía está en memoria.", "hint": "Recuerda la ronda anterior.", "explanation": "La caché repetía patrones. Quien recordaba la ronda anterior tenía ventaja."}, {"name": "Botón de Oferta Limitada", "kind": "prize", "risk": "Medio", "clue": "Solo el primero ve el descuento.", "hint": "Premia decisión rápida.", "explanation": "Era una oferta real: el primer click capturó el valor."}, {"name": "Botón de Malware Bonito", "kind": "trap", "risk": "Muy alto", "clue": "Tiene icono precioso y cero confianza.", "hint": "La estética no lo hace seguro.", "explanation": "Era malware con maquillaje. Pulsarlo fue caer en la portada."}, {"name": "Botón de Rama Protegida", "kind": "shield", "risk": "Medio", "clue": "La protección de rama existe por algo.", "hint": "Blindaje gana valor aquí.", "explanation": "La rama protegida premió cubrirse antes de actuar."}, {"name": "Botón de Silencio Incómodo", "kind": "wait", "risk": "Bajo", "clue": "Nadie dice nada. Eso también es información.", "hint": "Aguantar puede ser la lectura correcta.", "explanation": "El silencio era la respuesta: no había que tocarlo."}, {"name": "Botón de All-In Sospechoso", "kind": "jackpot", "risk": "Muy alto", "clue": "Si vas, ve al final. Si no, no vayas.", "hint": "Pulsar temprano es mala idea.", "explanation": "Era una apuesta extrema: solo el timing perfecto la hacía rentable."}, {"name": "Botón de Líder Codicioso", "kind": "thief", "risk": "Medio", "clue": "Quien va primero tiene más que perder.", "hint": "Puede servir para recortar al líder.", "explanation": "El botón movía puntos desde arriba hacia quien arriesgaba."}, {"name": "Botón de Equipo Noble", "kind": "sacrifice", "risk": "Medio", "clue": "Uno cae para que otros avancen.", "hint": "Pulsar puede beneficiar al resto más que a ti.", "explanation": "Fue una jugada de equipo: el pulsador asumió coste y otros ganaron."}, {"name": "Botón de Latencia", "kind": "glitch", "risk": "Variable", "clue": "El retardo cambia la jugada.", "hint": "Timing raro: no todo click vale igual.", "explanation": "La latencia convirtió el botón en una ruleta controlada por segundos."}, {"name": "Botón de Commit Limpio", "kind": "prize", "risk": "Bajo", "clue": "Todo está verde. ¿Quién firma el commit?", "hint": "Pulsar primero parece razonable.", "explanation": "El commit estaba limpio: decidir rápido sumó puntos."}, {"name": "Botón de Console.log Olvidado", "kind": "trap", "risk": "Medio", "clue": "Parece inofensivo, hasta que llega producción.", "hint": "No todo lo pequeño es seguro.", "explanation": "El detalle olvidado generó coste. Aguantar evitó ruido."}, {"name": "Botón de Variables de Entorno", "kind": "bomb", "risk": "Muy alto", "clue": "Un secreto filtrado no afecta solo a una persona.", "hint": "Cuidado: puede castigar a todos.", "explanation": "Tocar secretos en caliente salpicó a todo el equipo."}, {"name": "Botón de Diseño Perfecto", "kind": "prize", "risk": "Medio", "clue": "El primer mockup convincente gana la sala.", "hint": "Puede premiar iniciativa.", "explanation": "Era una buena decisión visual. El primero se llevó el impacto."}, {"name": "Botón de Modal Infinito", "kind": "split", "risk": "Alto", "clue": "Si todos abren un modal, nadie ve la página.", "hint": "Un click quizá vale; varios bloquean.", "explanation": "Demasiados modales causaron desastre. Un solo click era manejable."}, {"name": "Botón de Rollback Seguro", "kind": "wait", "risk": "Bajo", "clue": "Antes de correr, respira y mira el historial.", "hint": "Aguantar tiene premio.", "explanation": "La paciencia evitó empeorar el despliegue."}, {"name": "Botón de Feature Flag", "kind": "shield", "risk": "Medio", "clue": "Activar con protección permite apagar rápido.", "hint": "Blindaje es fuerte aquí.", "explanation": "La feature flag premió cubrirse: riesgo controlado, puntos limpios."}, {"name": "Botón de Framework con Hype", "kind": "liar", "risk": "Medio", "clue": "Todos dicen que no lo pulses porque no lo entienden.", "hint": "La masa puede equivocarse.", "explanation": "El rechazo era más miedo que realidad. Pulsar tuvo premio."}, {"name": "Botón de Node Modules", "kind": "bomb", "risk": "Alto", "clue": "Si lo tocas, pesa para todos.", "hint": "Puede convertirse en problema global.", "explanation": "La carpeta infinita castigó al grupo cuando alguien la tocó."}, {"name": "Botón de Minificación", "kind": "glitch", "risk": "Variable", "clue": "Al comprimir, algo puede cambiar.", "hint": "El timing decide si optimiza o rompe.", "explanation": "La minificación tuvo resultado variable: potencia o bug según momento."}, {"name": "Botón de Preview Local", "kind": "prize", "risk": "Bajo", "clue": "En local todo parece funcionar.", "hint": "Puede ser premio fácil, pero no te confíes siempre.", "explanation": "Esta vez la preview era real y útil. Click rápido, puntos limpios."}, {"name": "Botón de Viernes 18:00", "kind": "trap", "risk": "Muy alto", "clue": "El calendario grita que no.", "hint": "Aguantar es casi seguro.", "explanation": "Desplegar en viernes tarde es deporte extremo. Mala idea tocarlo."}, {"name": "Botón de Dependencia Fantasma", "kind": "echo", "risk": "Variable", "clue": "El pasado de tu package-lock vuelve.", "hint": "La ronda anterior importa.", "explanation": "Una dependencia fantasma repitió patrones antiguos. Memoria = ventaja."}, {"name": "Botón de Refactor Valiente", "kind": "jackpot", "risk": "Alto", "clue": "Si lo haces al final, parece magia. Si lo haces antes, caos.", "hint": "La ventana final es clave.", "explanation": "El refactor necesitaba el momento justo. Premió el último segundo."}, {"name": "Botón de QA Paciente", "kind": "wait", "risk": "Bajo", "clue": "El test que no ejecutas es el que falla.", "hint": "Aguantar y revisar suma.", "explanation": "QA premió la paciencia. No pulsar también era una decisión."}, {"name": "Botón de Escudo Humano", "kind": "shield", "risk": "Medio", "clue": "Si dudas, cúbrete. Esta vez no es cobardía.", "hint": "Blindaje puede ser el mejor movimiento.", "explanation": "El escudo absorbió el riesgo y convirtió duda en puntos."}, {"name": "Botón de Oferta Clickbait", "kind": "liar", "risk": "Medio", "clue": "Última oportunidad, 100% seguro, sin riesgos.", "hint": "La frase suena falsa, pero el juego puede estar doblando el engaño.", "explanation": "Era una ronda mentirosa: la pista exagerada escondía una oportunidad real."}, {"name": "Botón de Cola de Builds", "kind": "split", "risk": "Medio", "clue": "Una build entra; cinco builds atascan todo.", "hint": "Si crees que otros pulsarán, espera.", "explanation": "La cola aceptaba una acción. Múltiples clicks bloquearon el pipeline."}, {"name": "Botón de Incidencia Global", "kind": "bomb", "risk": "Muy alto", "clue": "Un toque y soporte recibe tickets.", "hint": "Peligro compartido: mejor calma.", "explanation": "Era una incidencia global. El botón afectó a todos cuando alguien lo pulsó."}]
JSON, true);
    return add_pool_ids('forbidden', $items ?: []);
}
function forbidden_decision_ms(): int { return 14000; }
function forbidden_reveal_ms(): int { return 7500; }
function forbidden_round_count(array $players): int { return count($players) <= 1 ? 8 : 7; }
function forbidden_pick_sequence(PDO $pdo, int $roomId, array $players): array {
    $pool = forbidden_button_bank();
    $used = used_content_fingerprints($pdo, $roomId, 'boton-prohibido');
    $available = array_values(array_filter($pool, fn($item) => !isset($used[content_fingerprint($item)])));
    if (count($available) < forbidden_round_count($players)) $available = $pool;
    shuffle($available);
    return array_slice($available, 0, forbidden_round_count($players));
}
function forbidden_current_button(array $state): array {
    $idx = (int)($state['current'] ?? 0);
    return $state['sequence'][$idx] ?? ['name'=>'Botón misterioso','kind'=>'trap','risk'=>'?','clue'=>'Algo no encaja.','hint'=>'Elige con cuidado.','explanation'=>'El botón no tenía datos suficientes.'];
}
function forbidden_key(array $state): string { return (string)(int)($state['current'] ?? 0); }
function forbidden_action_label(string $action): string { return ['press'=>'Pulsar','wait'=>'Aguantar','shield'=>'Blindaje','locked'=>'Candado'][$action] ?? 'Sin decidir'; }
function forbidden_action_icon(string $action): string { return ['press'=>'🔴','wait'=>'🧊','shield'=>'🛡','locked'=>'🔒'][$action] ?? '•'; }
function forbidden_kind_title(string $kind): string { return ['prize'=>'Botón premio','trap'=>'Botón trampa','bomb'=>'Botón bomba','thief'=>'Botón ladrón','sacrifice'=>'Botón sacrificio','jackpot'=>'Botón jackpot','liar'=>'Botón mentiroso','echo'=>'Botón eco','glitch'=>'Botón glitch','split'=>'Botón reparto','shield'=>'Botón blindaje','wait'=>'Botón paciencia'][$kind] ?? 'Botón prohibido'; }
function forbidden_init_state(PDO $pdo, int $roomId, array $players): array {
    $sequence = forbidden_pick_sequence($pdo, $roomId, $players);
    return ['contentId'=>'forbidden-set-' . substr(sha1(jenc(array_map(fn($b) => $b['id'] ?? $b['name'], $sequence))), 0, 12),'sequence'=>$sequence,'current'=>0,'total'=>count($sequence),'phaseStartedMs'=>now_ms(),'durationMs'=>forbidden_decision_ms(),'choices'=>[],'outcomes'=>[],'scores'=>[],'stats'=>[],'history'=>[],'tools'=>[],'instructions'=>['Lee la pista del botón.','Elige Pulsar, Aguantar o Blindaje antes de que acabe el tiempo.','Pulsar puede dar premio o castigo; Aguantar gana contra trampas; Blindaje reduce riesgos.']];
}
function forbidden_ensure_state(array &$state, PDO $pdo, int $roomId, array $players): void {
    if (!isset($state['sequence']) || !is_array($state['sequence']) || !$state['sequence']) $state = forbidden_init_state($pdo, $roomId, $players);
    if (!isset($state['total'])) $state['total'] = count($state['sequence']);
    if (!isset($state['durationMs'])) $state['durationMs'] = forbidden_decision_ms();
    if (!isset($state['phaseStartedMs'])) $state['phaseStartedMs'] = now_ms();
}
function forbidden_choice_count(array $state, array $players): int { $key = forbidden_key($state); $choices = $state['choices'][$key] ?? []; $count = 0; foreach ($players as $p) if (isset($choices[(string)(int)$p['id']])) $count++; return $count; }
function forbidden_all_chose(array $state, array $players): bool { return count($players) > 0 && forbidden_choice_count($state, $players) >= count($players); }
function forbidden_add_stat(array &$state, string $pid, string $key, int $inc = 1): void { if (!isset($state['stats'][$pid])) $state['stats'][$pid] = []; $state['stats'][$pid][$key] = (int)($state['stats'][$pid][$key] ?? 0) + $inc; }
function forbidden_score_player(PDO $pdo, int $playerId, int $points): void { if ($points !== 0) add_score($pdo, $playerId, $points); }
function forbidden_calc_points(string $kind, string $action, bool $isFirst, bool $late, bool $anyPress, int $pressCount): array {
    $points=0; $title=''; $text=''; $tone='info';
    if ($kind === 'prize') { if ($action==='press' && $isFirst) { $points=120; $title='Primer click ganador'; $text='Te atreviste antes que nadie y capturaste el premio.'; $tone='good'; } elseif ($action==='press') { $points=45; $title='Click tardío'; $text='Pulsaste, pero alguien llegó antes.'; } elseif ($action==='shield') { $points=5; $title='Demasiada cautela'; $text='Era un premio. El blindaje no hacía falta.'; } else { $points=0; $title='Oportunidad perdida'; $text='Era un botón bueno, pero decidiste no tocarlo.'; } }
    elseif ($kind === 'trap') { if ($action==='press') { $points=-80; $title='Caíste en la trampa'; $text='La pista avisaba: este botón castigaba el click impulsivo.'; $tone='bad'; } elseif ($action==='shield') { $points=30; $title='Blindaje correcto'; $text='Evitaste la trampa casi entera.'; $tone='good'; } else { $points=55; $title='Sangre fría'; $text='Aguantaste una trampa y sumaste limpio.'; $tone='good'; } }
    elseif ($kind === 'bomb') { if ($anyPress) { if ($action==='press') { $points=-85; $title='Activaste la bomba'; $text='El botón salpicaba a toda la sala.'; $tone='bad'; } elseif ($action==='shield') { $points=-5; $title='Escudo a tiempo'; $text='Alguien pulsó, pero tu blindaje amortiguó el golpe.'; } else { $points=-25; $title='Daño colateral'; $text='No pulsaste, pero la bomba era compartida.'; $tone='bad'; } } else { if ($action==='shield') { $points=35; $title='Protección tranquila'; $text='Nadie pulsó. Tu escudo fue prudente.'; $tone='good'; } else { $points=65; $title='Equipo paciente'; $text='Nadie tocó la bomba. Perfecto.'; $tone='good'; } } }
    elseif ($kind === 'split') { if ($pressCount===1) { if ($action==='press') { $points=145; $title='Único valiente'; $text='Solo tú pulsaste: el sistema lo aceptó.'; $tone='good'; } elseif ($action==='shield') { $points=15; $title='Escudo conservador'; $text='Alguien se llevó el premio único.'; } else { $points=20; $title='Aguantaste el caos'; $text='No ganaste el premio, pero evitaste bloquear la ronda.'; } } elseif ($pressCount>1) { if ($action==='press') { $points=-65; $title='Conflicto de clicks'; $text='Demasiados pulsaron y el sistema castigó.'; $tone='bad'; } elseif ($action==='shield') { $points=25; $title='Te cubriste del conflicto'; $text='Buen escudo ante el spam de clicks.'; $tone='good'; } else { $points=55; $title='No entraste al conflicto'; $text='Dejaste que otros rompieran la rama.'; $tone='good'; } } else { $points=$action==='shield'?20:35; $title='Todos aguantaron'; $text='Nadie arriesgó, pero tampoco hubo desastre.'; $tone='good'; } }
    elseif ($kind === 'jackpot') { if ($action==='press' && $late) { $points=175; $title='Último frame'; $text='Pulsaste en la ventana perfecta.'; $tone='good'; } elseif ($action==='press') { $points=-55; $title='Demasiado pronto'; $text='El jackpot solo pagaba al final.'; $tone='bad'; } elseif ($action==='shield') { $points=0; $title='Blindaje inútil'; $text='No había daño si no pulsabas.'; } else { $points=10; $title='Sin riesgo'; $text='No te la jugaste. Poco premio, cero drama.'; } }
    elseif ($kind === 'liar') { if ($action==='press') { $points=115; $title='Leíste el engaño'; $text='La pista intentaba asustarte. Pulsar era correcto.'; $tone='good'; } elseif ($action==='shield') { $points=15; $title='Duda razonable'; $text='Te protegiste, pero el botón no era tan malo.'; } else { $points=-30; $title='Te engañó la pista'; $text='Parecía trampa, pero esa era la trampa mental.'; $tone='bad'; } }
    elseif ($kind === 'thief') { if ($action==='press') { $points=85; $title='Robo ejecutado'; $text='Usaste el botón para recortar distancia.'; $tone='good'; } elseif ($action==='shield') { $points=20; $title='Cartera cerrada'; $text='Te cubriste por si había robo.'; } else { $points=5; $title='Miraste el robo pasar'; $text='No arriesgaste, casi no sumas.'; } }
    elseif ($kind === 'sacrifice') { if ($action==='press') { $points=-35; $title='Sacrificio noble'; $text='Pagaste un coste para ayudar a los demás.'; $tone='bad'; } elseif ($anyPress) { $points=$action==='shield'?35:50; $title='Te beneficiaron'; $text='Alguien se sacrificó y tú sumaste.'; $tone='good'; } else { $points=$action==='shield'?10:15; $title='Nadie se sacrificó'; $text='Ronda tranquila, premio pequeño.'; } }
    elseif ($kind === 'shield') { if ($action==='shield') { $points=80; $title='Escudo perfecto'; $text='Esta ronda premiaba blindarse.'; $tone='good'; } elseif ($action==='press') { $points=-25; $title='Te faltó protección'; $text='Pulsar sin escudo no era la jugada.'; $tone='bad'; } else { $points=25; $title='Prudente'; $text='Aguantar funcionó, pero el escudo valía más.'; } }
    elseif ($kind === 'wait') { if ($action==='wait') { $points=85; $title='Paciencia premium'; $text='La mejor acción era no tocar nada.'; $tone='good'; } elseif ($action==='shield') { $points=35; $title='Cautela decente'; $text='Te protegiste, aunque aguantar bastaba.'; } else { $points=-45; $title='Click innecesario'; $text='Pulsar rompió una ronda que pedía calma.'; $tone='bad'; } }
    else { if ($action==='press') { $points=$late?110:-45; $title=$points>=0?'Glitch favorable':'Glitch hostil'; $text=$points>=0?'El momento exacto te favoreció.':'El glitch te mordió por timing.'; $tone=$points>=0?'good':'bad'; } elseif ($action==='shield') { $points=25; $title='Escudo contra glitch'; $text='No brilló, pero redujo incertidumbre.'; } else { $points=15; $title='Observador prudente'; $text='No entraste en el glitch.'; } }
    return ['points'=>$points,'title'=>$title,'text'=>$text,'tone'=>$tone];
}
function forbidden_resolve_round(PDO $pdo, array $players, array &$state, bool $fillMissing = true): void {
    $idx=(int)($state['current']??0); $key=(string)$idx; $button=forbidden_current_button($state); $kind=(string)($button['kind']??'trap');
    if ($kind==='echo') { $prev=$state['history'][(string)($idx-1)]??null; $kind=(string)(($prev['resolvedKind']??null)?:'trap'); if ($kind==='echo') $kind='trap'; }
    $started=(int)($state['phaseStartedMs']??now_ms()); $duration=(int)($state['durationMs']??forbidden_decision_ms());
    if (!isset($state['choices'][$key])) $state['choices'][$key]=[];
    if ($fillMissing) foreach ($players as $p) { $pid=(string)(int)$p['id']; if (!isset($state['choices'][$key][$pid])) $state['choices'][$key][$pid]=['action'=>'wait','auto'=>true,'at'=>now_ms()]; }
    $choices=$state['choices'][$key]??[]; $pressers=[]; $first=null; $firstAt=PHP_INT_MAX;
    foreach ($players as $p) { $pid=(string)(int)$p['id']; if (($choices[$pid]['action']??'wait')==='press') { $pressers[]=$pid; $at=(int)($choices[$pid]['at']??now_ms()); if ($at<$firstAt) { $firstAt=$at; $first=$pid; } } }
    $anyPress=count($pressers)>0; $pressCount=count($pressers); $rows=[]; $leader=null; $leaderScore=-1;
    foreach ($players as $p) if ((int)($p['score']??0)>$leaderScore) { $leaderScore=(int)($p['score']??0); $leader=(string)(int)$p['id']; }
    $extra=[];
    foreach ($players as $p) {
        $pid=(string)(int)$p['id']; $choice=$choices[$pid]??['action'=>'wait','auto'=>true,'at'=>now_ms()]; $action=(string)($choice['action']??'wait'); if ($action==='locked') $action='wait';
        $elapsed=max(0,(int)($choice['at']??now_ms())-$started); $late=$elapsed>=max(0,$duration-2300);
        $r=forbidden_calc_points($kind,$action,$pid===$first,$late,$anyPress,$pressCount); $points=(int)$r['points'];
        if ($kind==='thief' && $action==='press' && $leader && $leader!==$pid) $extra[$leader]=($extra[$leader]??0)-25;
        if (!empty($choice['locked'])) { $points += 10; $r['title'].=' 🔒'; $r['text'].=' El candado añadió autocontrol.'; }
        if ($points>0) forbidden_add_stat($state,$pid,$action==='press'?'goodPress':($action==='shield'?'goodShield':'goodWait'));
        if ($points<0) forbidden_add_stat($state,$pid,'badClicks');
        forbidden_add_stat($state,$pid,$action==='press'?'presses':($action==='shield'?'shields':'waits'));
        $state['scores'][$pid]=(int)($state['scores'][$pid]??0)+$points; forbidden_score_player($pdo,(int)$pid,$points);
        $rows[]=['playerId'=>$pid,'name'=>(string)($p['name']??('Jugador '.$pid)),'action'=>$action,'actionLabel'=>forbidden_action_label($action),'icon'=>forbidden_action_icon($action),'points'=>$points,'title'=>$r['title'],'text'=>$r['text'],'tone'=>$r['tone'],'elapsedMs'=>$action==='press'?$elapsed:null,'auto'=>!empty($choice['auto']),'locked'=>!empty($choice['locked'])];
    }
    foreach ($extra as $pid=>$delta) { $state['scores'][$pid]=(int)($state['scores'][$pid]??0)+(int)$delta; forbidden_score_player($pdo,(int)$pid,(int)$delta); foreach ($rows as &$row) if ((string)$row['playerId']===(string)$pid) { $row['points']+=(int)$delta; $row['text'].=' El botón ladrón te quitó 25 pts.'; if ($row['points']<0) $row['tone']='bad'; } unset($row); }
    $best=null; $worst=null; foreach ($rows as $row) { if ($best===null || (int)$row['points']>(int)$best['points']) $best=$row; if ($worst===null || (int)$row['points']<(int)$worst['points']) $worst=$row; }
    $state['outcomes'][$key]=$rows; $state['lastOutcome']=['round'=>$idx+1,'button'=>$button,'resolvedKind'=>$kind,'kindTitle'=>forbidden_kind_title($kind),'anyPress'=>$anyPress,'pressCount'=>$pressCount,'best'=>$best,'worst'=>$worst,'rows'=>$rows,'explanation'=>(string)($button['explanation']??'')]; $state['history'][$key]=$state['lastOutcome'];
}
function forbidden_next_or_finish(array $players, array &$state): string { $next=(int)($state['current']??0)+1; if ($next>=(int)($state['total']??count($state['sequence']??[]))) { forbidden_finish_game($players,$state); return 'results'; } $state['current']=$next; $state['phaseStartedMs']=now_ms(); $state['durationMs']=forbidden_decision_ms(); return 'press'; }
function forbidden_finish_game(array $players, array &$state): void {
    $rows=[]; foreach ($players as $p) { $pid=(string)(int)$p['id']; $st=$state['stats'][$pid]??[]; $rows[]=['playerId'=>$pid,'name'=>(string)($p['name']??('Jugador '.$pid)),'points'=>(int)($state['scores'][$pid]??0),'presses'=>(int)($st['presses']??0),'waits'=>(int)($st['waits']??0),'shields'=>(int)($st['shields']??0),'badClicks'=>(int)($st['badClicks']??0),'goodPress'=>(int)($st['goodPress']??0),'goodWait'=>(int)($st['goodWait']??0),'goodShield'=>(int)($st['goodShield']??0)]; }
    usort($rows, fn($a,$b)=>(int)$b['points']<=>(int)$a['points']);
    $state['finalRows']=$rows; $state['medals']=['winner'=>$rows[0]??null,'coldBlood'=>$rows?array_reduce($rows,fn($best,$r)=>$best===null||(int)$r['goodWait']>(int)$best['goodWait']?$r:$best):null,'clickAddict'=>$rows?array_reduce($rows,fn($best,$r)=>$best===null||(int)$r['presses']>(int)$best['presses']?$r:$best):null,'shield'=>$rows?array_reduce($rows,fn($best,$r)=>$best===null||(int)$r['goodShield']>(int)$best['goodShield']?$r:$best):null,'victim'=>$rows?array_reduce($rows,fn($best,$r)=>$best===null||(int)$r['badClicks']>(int)$best['badClicks']?$r:$best):null];
}
function forbidden_auto_progress_room(PDO $pdo, array $room): void {
    $round=active_round($pdo,(int)$room['id']); if (!$round || (string)$round['mode']!=='boton-prohibido' || (string)$round['status']!=='playing') return; if (empty($round['ends_at_ms']) || now_ms() < (int)$round['ends_at_ms']) return;
    try { $pdo->beginTransaction(); $roomLocked=room_by_code($pdo,(string)$room['code'],true); $lockedRound=active_round($pdo,(int)$roomLocked['id'],true); if (!$lockedRound || (string)$lockedRound['mode']!=='boton-prohibido' || (string)$lockedRound['status']!=='playing') { $pdo->rollBack(); return; } $state=jdec($lockedRound['state_json']); $players=players_for_room($pdo,(int)$roomLocked['id']); forbidden_ensure_state($state,$pdo,(int)$roomLocked['id'],$players); $phase=(string)$lockedRound['phase']; if ($phase==='press') { forbidden_resolve_round($pdo,$players,$state,true); $pdo->prepare("UPDATE party_rounds SET phase = 'reveal', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), now_ms()+forbidden_reveal_ms(), (int)$lockedRound['id']]); } elseif ($phase==='reveal') { $next=forbidden_next_or_finish($players,$state); if ($next==='results') { $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([jenc($state),(int)$lockedRound['id']]); $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]); } else { $pdo->prepare("UPDATE party_rounds SET phase = 'press', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), now_ms()+forbidden_decision_ms(), (int)$lockedRound['id']]); } } $pdo->commit(); } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); error_log('Forbidden auto progress failed: '.$e->getMessage()); }
}

function add_score(PDO $pdo, int $playerId, int $points): void {
    if ($points >= 0) {
        $pdo->prepare('UPDATE party_players SET score = score + ? WHERE id = ?')->execute([$points, $playerId]);
    } else {
        $pdo->prepare('UPDATE party_players SET score = GREATEST(0, score + ?) WHERE id = ?')->execute([$points, $playerId]);
    }
}

function clean_impostor_text(string $value, int $limit = 60): string {
    $value = trim(strip_tags($value));
    $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
    return mb_substr($value, 0, $limit);
}
function normalize_guess(string $value): string {
    $value = mb_strtolower(trim($value));
    $value = strtr($value, ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ü'=>'u','ñ'=>'n']);
    return preg_replace('/[^a-z0-9+#]+/u', '', $value) ?? '';
}
function clue_suspicion(array $state, string $clue, string $style, string $pid): array {
    $flags = [];
    $heat = 0;
    $clean = mb_strtolower($clue);
    $normal = mb_strtolower((string)($state['normalWord'] ?? ''));
    $impostor = mb_strtolower((string)($state['impostorWord'] ?? ''));
    if (mb_strlen($clue) <= 3) { $heat += 2; $flags[] = 'demasiado corta'; }
    if ($normal !== '' && mb_strpos($clean, $normal) !== false) { $heat += 5; $flags[] = 'casi dice la palabra civil'; }
    if ($impostor !== '' && mb_strpos($clean, $impostor) !== false) { $heat += 3; $flags[] = 'muy pegada a la palabra trampa'; }
    foreach (($state['clues'] ?? []) as $otherPid => $other) {
        $otherText = is_array($other) ? (string)($other['text'] ?? '') : (string)$other;
        if ((string)$otherPid !== $pid && normalize_guess($otherText) !== '' && normalize_guess($otherText) === normalize_guess($clue)) {
            $heat += 3;
            $flags[] = 'pista repetida';
            break;
        }
    }
    if ($style === 'riesgo') { $heat += 2; $flags[] = 'pista arriesgada'; }
    elseif ($style === 'tecnica') { $heat += 1; }
    elseif ($style === 'abstracta') { $heat = max(0, $heat - 1); }
    $role = (string)(($state['playerRoles'] ?? [])[$pid] ?? 'civil');
    if ($role === 'impostor') $heat += 1;
    return ['heat'=>max(0, min(9, $heat)), 'flags'=>array_values(array_unique($flags))];
}
function resolve_impostor_round(PDO $pdo, array $players, array &$state): void {
    if (!empty($state['resolved'])) return;
    $impostor = (int)($state['impostor_id'] ?? 0);
    $playerIds = array_map(fn($p) => (int)$p['id'], $players);
    $votes = $state['votes'] ?? [];
    $voteCounts = [];
    foreach ($playerIds as $id) $voteCounts[(string)$id] = 0;
    foreach ($votes as $voter => $vote) {
        $vote = (int)$vote;
        if (isset($voteCounts[(string)$vote])) $voteCounts[(string)$vote]++;
    }
    $caughtVotes = $voteCounts[(string)$impostor] ?? 0;
    $threshold = max(1, (int)ceil(count($players) / 2));
    $crewWins = $caughtVotes >= $threshold;
    $normalGuess = normalize_guess((string)($state['normalWord'] ?? ''));
    $impostorGuess = normalize_guess((string)(($state['wordGuesses'] ?? [])[(string)$impostor] ?? ''));
    $guessCorrect = $impostorGuess !== '' && $normalGuess !== '' && $impostorGuess === $normalGuess;
    $awards = [];
    foreach ($players as $p) {
        $id = (int)$p['id'];
        $points = 0;
        $vote = (int)($votes[(string)$id] ?? 0);
        if ($id !== $impostor && $vote === $impostor) $points += 650;
        if ($crewWins && $id !== $impostor) $points += 250;
        if (!$crewWins && $id === $impostor) $points += 1000;
        if ($id === $impostor && $guessCorrect) $points += $crewWins ? 150 : 350;
        if ($points > 0) add_score($pdo, $id, $points);
        $awards[(string)$id] = $points;
    }
    $state['voteCounts'] = $voteCounts;
    $state['caughtVotes'] = $caughtVotes;
    $state['threshold'] = $threshold;
    $state['winner'] = $crewWins ? 'crew' : 'impostor';
    $state['impostorGuessCorrect'] = $guessCorrect;
    $state['pointsAwarded'] = $awards;
    $state['resolved'] = true;
}


try {
    if ($action === 'createRoom') {
        $name = clean_name((string)($body['name'] ?? 'Host'));
        $hostToken = token();
        $playerToken = token();
        $avatars = ['bot-blue','bot-pink','bot-green','bot-yellow','bot-purple','bot-cyan','bot-red','bot-mint'];
        for ($i = 0; $i < 20; $i++) {
            $code = (string)random_int(1000, 9999);
            try {
                $pdo->beginTransaction();
                $st = $pdo->prepare('INSERT INTO party_rooms (code, host_token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 12 HOUR))');
                $st->execute([$code, $hostToken]);
                $roomId = (int)$pdo->lastInsertId();
                $st = $pdo->prepare('INSERT INTO party_players (room_id, token, name, avatar, is_host, online_until) VALUES (?, ?, ?, ?, 1, DATE_ADD(NOW(), INTERVAL 20 SECOND))');
                $st->execute([$roomId, $playerToken, $name, $avatars[0]]);
                $pdo->commit();
                $room = room_by_code($pdo, $code);
                $viewer = player_by_token($pdo, $roomId, $playerToken);
                out(state_response($pdo, $room, $viewer) + ['hostToken' => $hostToken, 'playerToken' => $playerToken]);
            } catch (PDOException $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                continue;
            }
        }
        fail('No se pudo crear una sala libre.', 500);
    }

    $code = clean_code((string)($body['code'] ?? ''));
    if ($code === '') fail('Código de sala requerido.');
    $room = room_by_code($pdo, $code);
    if (!$room) fail('Sala no encontrada.', 404);
    $tokenIn = (string)($body['playerToken'] ?? '');
    $viewer = player_by_token($pdo, (int)$room['id'], $tokenIn);

    if ($action === 'joinRoom') {
        $name = clean_name((string)($body['name'] ?? 'Jugador'));
        $countSt = $pdo->prepare('SELECT COUNT(*) FROM party_players WHERE room_id = ?');
        $countSt->execute([(int)$room['id']]);
        $playerCount = (int)$countSt->fetchColumn();
        if ($playerCount >= 8) fail('La sala está llena.');
        $exists = $pdo->prepare('SELECT id FROM party_players WHERE room_id = ? AND name = ?');
        $exists->execute([(int)$room['id'], $name]);
        if ($exists->fetch()) $name = mb_substr($name, 0, 26) . random_int(10, 99);
        $avatars = ['bot-blue','bot-pink','bot-green','bot-yellow','bot-purple','bot-cyan','bot-red','bot-mint'];
        $n = $playerCount;
        $playerToken = token();
        $st = $pdo->prepare('INSERT INTO party_players (room_id, token, name, avatar, online_until) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 20 SECOND))');
        $st->execute([(int)$room['id'], $playerToken, $name, $avatars[$n % count($avatars)]]);
        $viewer = player_by_token($pdo, (int)$room['id'], $playerToken);
        out(state_response($pdo, $room, $viewer) + ['playerToken' => $playerToken]);
    }

    if (!$viewer && !in_array($action, ['getState'], true)) fail('Jugador no válido. Vuelve a entrar a la sala.', 403);
    if ($action === 'getState') {
        out(state_response($pdo, $room, $viewer));
    }

    if ($action === 'bossTick') {
        boss_auto_progress_room($pdo, $room);
        $room = room_by_code($pdo, $code) ?: $room;
        $viewer = $viewer ? player_by_token($pdo, (int)$room['id'], $tokenIn) : null;
        out(state_response($pdo, $room, $viewer));
    }

    if ($action === 'sendChat') {
        $msg = trim(strip_tags((string)($body['message'] ?? '')));
        $msg = mb_substr($msg, 0, 220);
        if ($msg !== '') {
            $st = $pdo->prepare('INSERT INTO party_chat (room_id, player_id, message) VALUES (?, ?, ?)');
            $st->execute([(int)$room['id'], (int)$viewer['id'], $msg]);
        }
        out(state_response($pdo, $room, $viewer));
    }

    if ($action === 'setMode') {
        assert_host($room, $viewer, $body);
        $mode = preg_replace('/[^a-z0-9\-]/', '', strtolower((string)($body['mode'] ?? 'impostor'))) ?: 'impostor';
        $allowedModes = ['impostor','bug-race','boss-coop','rhythm-royale','mentira','quiz','boton-prohibido','subasta'];
        if (!in_array($mode, $allowedModes, true)) fail('Modo no válido.');
        $st = $pdo->prepare('UPDATE party_rooms SET current_mode = ?, status = \'lobby\' WHERE id = ?');
        $st->execute([$mode, (int)$room['id']]);
        $room = room_by_code($pdo, $code);
        out(state_response($pdo, $room, $viewer));
    }

    if ($action === 'startRound') {
        assert_host($room, $viewer, $body);
        $mode = preg_replace('/[^a-z0-9\-]/', '', strtolower((string)($body['mode'] ?? ($room['current_mode'] ?: 'impostor')))) ?: 'impostor';
        $players = players_for_room($pdo, (int)$room['id']);
        if (count($players) < 1) fail('No hay jugadores.');
        $playerIds = array_map(fn($p) => (int)$p['id'], $players);
        $duration = 30000;
        $phase = 'play';
        $state = ['answers'=>[], 'events'=>[]];
        if ($mode === 'impostor') {
            if (count($players) < 3) fail('Impostor de palabras necesita al menos 3 jugadores: con 2 se sabe quién es el impostor.', 400);
            $pair = pick_unused_pool_item($pdo, (int)$room['id'], 'impostor', word_pairs());
            $impostorId = $playerIds[random_int(0, count($playerIds) - 1)];
            $secrets = [];
            $roles = [];
            foreach ($playerIds as $pid) {
                $isImpostor = $pid === $impostorId;
                $secrets[(string)$pid] = $isImpostor ? $pair['impostor'] : $pair['normal'];
                $roles[(string)$pid] = $isImpostor ? 'impostor' : 'civil';
            }
            $turnOrder = $playerIds;
            shuffle($turnOrder);
            $state = [
                'contentId'=>$pair['id'],
                'theme'=>$pair['theme'] ?? 'Palabras web',
                'hint'=>$pair['hint'] ?? 'Da una pista útil, pero no digas la palabra literal.',
                'normalWord'=>$pair['normal'],
                'impostorWord'=>$pair['impostor'],
                'impostor_id'=>$impostorId,
                'secrets'=>$secrets,
                'playerRoles'=>$roles,
                'turnOrder'=>$turnOrder,
                'clues'=>[],
                'votes'=>[],
                'wordGuesses'=>[],
                'suspicion'=>[],
                'scores'=>[],
            ];
            $phase = 'clue';
            $duration = 60000;
        } elseif ($mode === 'bug-race') {
            $challenge = pick_unused_answer_item($pdo, (int)$room['id'], 'bug-race', challenge_pool());
            $state = ['contentId'=>$challenge['id'], 'challenge'=>$challenge, 'answers'=>[], 'scores'=>[]];
            $phase = 'answer';
            $duration = 20000;
        } elseif ($mode === 'boss-coop') {
            $boss = pick_unused_pool_item($pdo, (int)$room['id'], 'boss-coop', boss_pool());
            $activePlayers = boss_required_players($players);
            $playerCount = max(1, count($activePlayers));
            $maxTurns = $playerCount <= 1 ? 10 : max(9, min(12, 8 + (int)ceil($playerCount / 2)));
            $turnDuration = 8000;
            // Balance v9: modo héroe para 1 jugador. Antes un solo jugador peleaba contra ~680 HP
            // y recibía daño pensado para grupo; ahora el boss escala de verdad por jugadores activos.
            if ($playerCount <= 1) {
                $baseBossHp = 385;
                $playerMaxHp = 150;
            } elseif ($playerCount === 2) {
                $baseBossHp = 720;
                $playerMaxHp = 135;
            } elseif ($playerCount === 3) {
                $baseBossHp = 1040;
                $playerMaxHp = 130;
            } else {
                $baseBossHp = 1040 + (($playerCount - 3) * 285);
                $playerMaxHp = 130;
            }
            $hp = (int)round($baseBossHp * (float)$boss['hpMult']);
            $fighters = [];
            foreach ($players as $p) {
                $fighters[(string)(int)$p['id']] = ['hp'=>$playerMaxHp, 'maxHp'=>$playerMaxHp, 'shield'=>0, 'boost'=>0, 'aggro'=>0, 'vulnerable'=>0, 'damageTaken'=>0, 'lastMove'=>null, 'points'=>0, 'downed'=>false];
            }
            $state = [
                'contentId'=>$boss['id'], 'boss'=>$boss['name'], 'bossData'=>$boss,
                'bossHp'=>$hp, 'maxBossHp'=>$hp, 'hp'=>$hp, 'maxHp'=>$hp,
                'turn'=>1, 'maxTurns'=>$maxTurns, 'turnDurationMs'=>$turnDuration, 'turnStartedAtMs'=>now_ms(), 'turnEndsAtMs'=>now_ms() + $turnDuration,
                'intent'=>boss_pick_intent(['turn'=>1, 'bossHp'=>$hp, 'maxBossHp'=>$hp, 'maxTurns'=>$maxTurns]),
                'fighters'=>$fighters, 'choices'=>[], 'hits'=>[], 'events'=>[], 'turnHistory'=>[], 'rage'=>0, 'balanceVersion'=>9, 'scores'=>[]
            ];
            $phase = 'battle';
            $duration = $turnDuration;
            $pdo->prepare('UPDATE party_players SET damage = 0 WHERE room_id = ?')->execute([(int)$room['id']]);
        } elseif ($mode === 'rhythm-royale') {
            $track = pick_unused_pool_item($pdo, (int)$room['id'], 'rhythm-royale', rhythm_pool());
            $state = ['contentId'=>$track['id'], 'track'=>$track, 'trackTitle'=>$track['title'], 'bpm'=>$track['bpm'], 'duration'=>30000, 'scores'=>[], 'submissions'=>[]];
            $phase = 'rhythm';
            $duration = 34000;
        } elseif ($mode === 'mentira') {
            $roundNumber = (int)($room['round_number'] ?? 0) + 1;
            $q = mentira_pick_question($pdo, (int)$room['id'], $roundNumber);
            $modifier = mentira_pick_modifier($roundNumber);
            $state = [
                'contentId'=>$q['id'],
                'question'=>$q['question'],
                'context'=>$q['context'] ?? mentira_category_context((string)($q['category'] ?? 'Tech')),
                'lieTip'=>$q['lieTip'] ?? mentira_lie_tip_for($q),
                'explanation'=>$q['explanation'] ?? mentira_explanation_for($q),
                'realAnswer'=>$q['real'],
                'category'=>$q['category'] ?? 'Tech',
                'difficulty'=>(int)($q['difficulty'] ?? 1),
                'fakeBank'=>$q['fakes'] ?? [],
                'fakeAnswers'=>[],
                'votes'=>[],
                'voteTimes'=>[],
                'scores'=>[],
                'streaks'=>mentira_latest_streaks($pdo, (int)$room['id']),
                'modifier'=>$modifier,
                'instructions'=>[
                    'Inventa una respuesta falsa que parezca real.',
                    'Luego vota cuál de todas las cartas es la verdadera.',
                    'Puntúas por acertar la verdad y por engañar a otros.'
                ]
            ];
            $phase = 'write';
            $duration = (int)($modifier['writeMs'] ?? 30000);
        } elseif ($mode === 'quiz') {
            $sequence = quiz_pick_sequence($pdo, (int)$room['id'], $players);
            if (!$sequence) fail('No hay preguntas de quiz disponibles.', 500);
            $first = $sequence[0];
            $duration = quiz_question_duration($first);
            $startedQuiz = now_ms();
            $state = [
                'contentId'=>'quiz-set-' . substr(sha1(jenc(array_map(fn($q) => $q['id'] ?? '', $sequence))), 0, 12),
                'quizIds'=>array_map(fn($q) => (string)($q['id'] ?? ''), $sequence),
                'questions'=>$sequence,
                'challenge'=>$first,
                'current'=>0,
                'questionStartedAtMs'=>$startedQuiz,
                'questionDurationMs'=>$duration,
                'questionEndsAtMs'=>$startedQuiz + $duration,
                'answers'=>[], 'scores'=>[], 'stats'=>[], 'streaks'=>[], 'bestStreaks'=>[], 'jokers'=>[], 'lightning'=>[], 'events'=>[],
                'instructions'=>['Lee el contexto.', 'Responde antes de que acabe el tiempo.', 'Acierto + velocidad + racha = más puntos.']
            ];
            $phase = 'answer';
        } elseif ($mode === 'boton-prohibido') {
            $state = forbidden_init_state($pdo, (int)$room['id'], $players);
            $phase = 'press';
            $duration = forbidden_decision_ms();
        } elseif ($mode === 'subasta') {
            $state = subasta_init_state($pdo, (int)$room['id'], $players);
            $phase = 'bid';
            $duration = subasta_bid_ms($state);
        } else {
            fail('Modo no válido.');
        }
        $started = now_ms() + 1200;
        if ($mode === 'boss-coop' && $phase === 'battle') {
            $state['turnStartedAtMs'] = $started;
            $state['turnEndsAtMs'] = $started + (int)($state['turnDurationMs'] ?? 8000);
            $ends = (int)$state['turnEndsAtMs'];
        } elseif ($mode === 'quiz' && $phase === 'answer') {
            $state['questionStartedAtMs'] = $started;
            $state['questionEndsAtMs'] = $started + $duration;
            $ends = (int)$state['questionEndsAtMs'];
        } elseif ($mode === 'boton-prohibido' && $phase === 'press') {
            $state['phaseStartedMs'] = $started;
            $state['durationMs'] = $duration;
            $ends = $started + $duration;
        } elseif ($mode === 'subasta' && $phase === 'bid') {
            $state['phaseStartedMs'] = $started;
            $state['clarityVersion'] = 3;
            $ends = $started + $duration;
        } else {
            $ends = $started + $duration;
        }
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE party_rounds SET status = \'finished\', ended_at = NOW() WHERE room_id = ? AND status IN (\'playing\',\'results\')')->execute([(int)$room['id']]);
        $pdo->prepare('UPDATE party_rooms SET status = \'playing\', current_mode = ?, round_number = round_number + 1 WHERE id = ?')->execute([$mode, (int)$room['id']]);
        $st = $pdo->prepare('INSERT INTO party_rounds (room_id, mode, round_index, status, phase, state_json, started_at_ms, ends_at_ms) VALUES (?, ?, (SELECT round_number FROM party_rooms WHERE id = ?), \'playing\', ?, ?, ?, ?)');
        $st->execute([(int)$room['id'], $mode, (int)$room['id'], $phase, jenc($state), $started, $ends]);
        $pdo->commit();
        $room = room_by_code($pdo, $code);
        out(state_response($pdo, $room, $viewer));
    }

    if ($action === 'submitAction') {
        $pdo->beginTransaction();
        $room = room_by_code($pdo, $code, true);
        $viewer = player_by_token($pdo, (int)$room['id'], (string)($body['playerToken'] ?? ''));
        if (!$viewer) { $pdo->rollBack(); fail('Jugador no válido.', 403); }
        $round = active_round($pdo, (int)$room['id'], true);
        if (!$round) { $pdo->rollBack(); fail('No hay ronda activa.'); }
        $state = jdec($round['state_json']);
        $mode = (string)$round['mode'];
        $phase = (string)$round['phase'];
        $pid = (string)$viewer['id'];
        $points = 0;
        $payload = $body['payload'] ?? [];
        if (!is_array($payload)) $payload = [];
        $endsAtMs = null;

        if ($mode === 'bug-race' && $phase === 'answer') {
            if (isset($state['answers'][$pid])) { $pdo->commit(); out(state_response($pdo, $room, $viewer)); }
            $answer = (int)($payload['answer'] ?? -1);
            $correct = (int)($state['challenge']['correct'] ?? -2);
            $remaining = max(0, ((int)$round['ends_at_ms'] - now_ms()) / 1000);
            $points = ($answer === $correct) ? (500 + (int)round($remaining * 45)) : 0;
            $state['answers'][$pid] = ['answer'=>$answer, 'correct'=>$answer === $correct, 'points'=>$points, 'at'=>now_ms()];
            if ($points > 0) $pdo->prepare('UPDATE party_players SET score = score + ? WHERE id = ?')->execute([$points, (int)$viewer['id']]);
            if (count($state['answers']) >= count(players_for_room($pdo, (int)$room['id']))) {
                $phase = 'results';
                $pdo->prepare('UPDATE party_rounds SET status = \'results\', phase = \'results\', ended_at = NOW() WHERE id = ?')->execute([(int)$round['id']]);
                $pdo->prepare('UPDATE party_rooms SET status = \'results\' WHERE id = ?')->execute([(int)$room['id']]);
            }
        } elseif ($mode === 'impostor') {
            $playersNow = players_for_room($pdo, (int)$room['id']);
            $validPlayerIds = array_map(fn($p) => (int)$p['id'], $playersNow);
            if ($phase === 'clue') {
                if (!isset($state['clues'][$pid])) {
                    $clue = clean_impostor_text((string)($payload['clue'] ?? ''), 52);
                    $style = 'neutra';
                    if ($clue !== '') {
                        $analysis = clue_suspicion($state, $clue, $style, $pid);
                        $state['clues'][$pid] = ['text'=>$clue, 'style'=>$style, 'heat'=>$analysis['heat'], 'flags'=>$analysis['flags'], 'at'=>now_ms()];
                        $state['suspicion'][$pid] = $analysis['heat'];
                    }
                }
                if (count($state['clues']) >= count($playersNow)) {
                    $phase = 'vote';
                    $endsAtMs = now_ms() + 45000;
                }
            } elseif ($phase === 'vote') {
                if (!isset($state['votes'][$pid])) {
                    $vote = (int)($payload['vote'] ?? 0);
                    if (!in_array($vote, $validPlayerIds, true) || $vote === (int)$viewer['id']) $vote = 0;
                    if ($vote > 0) $state['votes'][$pid] = $vote;
                    if ((int)($state['impostor_id'] ?? 0) === (int)$viewer['id']) {
                        $guess = clean_impostor_text((string)($payload['wordGuess'] ?? ''), 40);
                        if ($guess !== '') $state['wordGuesses'][$pid] = $guess;
                    }
                }
                if (count($state['votes']) >= count($playersNow)) {
                    resolve_impostor_round($pdo, $playersNow, $state);
                    $phase = 'results';
                    $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', ended_at = NOW() WHERE id = ?")->execute([(int)$round['id']]);
                    $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$room['id']]);
                }
            }
        } elseif ($mode === 'mentira') {
            $playersNow = players_for_room($pdo, (int)$room['id']);
            if ($phase === 'write') {
                if (isset($state['fakeAnswers'][$pid])) { $pdo->commit(); out(state_response($pdo, $room, $viewer)); }
                $fake = mentira_clean_text($payload['fake'] ?? '', 100);
                $error = $fake !== '' ? mentira_validate_fake($fake, $state) : 'Escribe una mentira antes de enviar.';
                if ($error !== null) { $pdo->rollBack(); fail($error, 422); }
                $state['fakeAnswers'][$pid] = ['text'=>$fake, 'auto'=>false, 'double'=>!empty($payload['doubleBluff']), 'at'=>now_ms()];
                if (mentira_all_wrote($state, $playersNow)) {
                    mentira_prepare_options($playersNow, $state);
                    $phase = 'vote';
                    $endsAtMs = now_ms() + mentira_vote_ms($state);
                } else {
                    $endsAtMs = (int)($round['ends_at_ms'] ?? (now_ms() + 30000));
                }
            } elseif ($phase === 'vote') {
                mentira_prepare_options($playersNow, $state);
                if (!empty($payload['joker']) && (string)$payload['joker'] === 'fifty') {
                    mentira_apply_fifty($state, $pid);
                    $endsAtMs = (int)($round['ends_at_ms'] ?? (now_ms() + mentira_vote_ms($state)));
                } else {
                    if (isset($state['votes'][$pid])) { $pdo->commit(); out(state_response($pdo, $room, $viewer)); }
                    $vote = mentira_clean_text($payload['vote'] ?? '', 40);
                    $map = mentira_option_map($state);
                    if (!isset($map[$vote])) { $pdo->rollBack(); fail('Esa opción ya no está disponible.', 422); }
                    if ($vote === ('p_' . (int)$pid)) { $pdo->rollBack(); fail('No puedes votar tu propia mentira.', 422); }
                    $removed = ($state['jokers'][$pid] ?? [])['removed'] ?? [];
                    if (in_array($vote, $removed, true)) { $pdo->rollBack(); fail('Esa opción fue descartada por tu comodín.', 422); }
                    $state['votes'][$pid] = $vote;
                    $state['voteTimes'][$pid] = now_ms();
                    if (mentira_all_voted($state, $playersNow)) {
                        mentira_resolve_round($pdo, $playersNow, $state);
                        $phase = 'results';
                        $endsAtMs = null;
                        $points = (int)(($state['pointsAwarded'] ?? [])[$pid] ?? 0);
                        $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([(int)$round['id']]);
                        $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$room['id']]);
                    } else {
                        $endsAtMs = (int)($round['ends_at_ms'] ?? (now_ms() + mentira_vote_ms($state)));
                    }
                }
            }
        } elseif ($mode === 'quiz') {
            $playersNow = players_for_room($pdo, (int)$room['id']);
            $idxKey = (string)(int)($state['current'] ?? 0);
            if ($phase === 'answer') {
                if (!empty($payload['joker'])) {
                    $joker = (string)$payload['joker'];
                    if ($joker === 'fifty') quiz_apply_fifty($state, (int)$viewer['id']);
                    if ($joker === 'freeze') quiz_apply_freeze($state, (int)$viewer['id']);
                    $endsAtMs = (int)($state['questionEndsAtMs'] ?? $round['ends_at_ms'] ?? (now_ms() + 10000));
                } else {
                    if (isset($state['answers'][$idxKey][$pid])) { $pdo->commit(); out(state_response($pdo, $room, $viewer)); }
                    $q = quiz_current_question($state);
                    $answer = (int)($payload['answer'] ?? -1);
                    $optionCount = count($q['options'] ?? []);
                    if ($answer < 0 || $answer >= $optionCount) { $pdo->rollBack(); fail('Respuesta no válida.', 422); }
                    $state['answers'][$idxKey][$pid] = ['answer'=>$answer, 'at'=>now_ms()];
                    if (quiz_all_answered($state, $playersNow)) {
                        quiz_resolve_question($pdo, $playersNow, $state);
                        $phase = 'reveal';
                        $endsAtMs = now_ms() + quiz_reveal_duration();
                    } else {
                        $endsAtMs = (int)($state['questionEndsAtMs'] ?? $round['ends_at_ms'] ?? (now_ms() + quiz_question_duration($q)));
                    }
                }
            } elseif ($phase === 'reveal') {
                $endsAtMs = (int)($round['ends_at_ms'] ?? (now_ms() + quiz_reveal_duration()));
            }
        } elseif ($mode === 'boton-prohibido') {
            $playersNow = players_for_room($pdo, (int)$room['id']);
            forbidden_ensure_state($state, $pdo, (int)$room['id'], $playersNow);
            $key = forbidden_key($state);
            if (!isset($state['choices'][$key]) || !is_array($state['choices'][$key])) $state['choices'][$key] = [];
            if (!isset($state['tools'][$pid]) || !is_array($state['tools'][$pid])) $state['tools'][$pid] = [];
            if ($phase === 'press') {
                $tool = (string)($payload['forbiddenTool'] ?? '');
                if ($tool === 'scan') {
                    if (empty($state['tools'][$pid]['scan'])) {
                        $button = forbidden_current_button($state);
                        $kind = (string)($button['kind'] ?? 'trap');
                        $dangerKinds = ['trap','bomb','split'];
                        $scanText = in_array($kind, $dangerKinds, true) ? 'Lectura: peligro alto. Aguantar o blindarse parece razonable.' : (in_array($kind, ['prize','liar','jackpot'], true) ? 'Lectura: hay premio potencial. Pulsar puede ser buena idea si el timing encaja.' : 'Lectura: resultado raro. El blindaje reduce sustos.');
                        $state['tools'][$pid]['scan'] = true;
                        $state['tools'][$pid]['scanResult'] = $scanText;
                    }
                    $endsAtMs = (int)($round['ends_at_ms'] ?? (now_ms() + forbidden_decision_ms()));
                } else {
                    $actionChoice = (string)($payload['forbiddenAction'] ?? 'press');
                    if (!in_array($actionChoice, ['press','wait','shield','lock'], true)) $actionChoice = 'press';
                    $locked = false;
                    if ($actionChoice === 'lock') {
                        if (!empty($state['tools'][$pid]['lock'])) { $pdo->rollBack(); fail('Ya usaste Candado en esta partida.', 422); }
                        $state['tools'][$pid]['lock'] = true;
                        $actionChoice = 'wait';
                        $locked = true;
                    }
                    $state['choices'][$key][$pid] = ['action'=>$actionChoice, 'at'=>now_ms(), 'locked'=>$locked];
                    if (forbidden_all_chose($state, $playersNow)) {
                        forbidden_resolve_round($pdo, $playersNow, $state, true);
                        $phase = 'reveal';
                        $endsAtMs = now_ms() + forbidden_reveal_ms();
                    } else {
                        $endsAtMs = (int)($round['ends_at_ms'] ?? (now_ms() + forbidden_decision_ms()));
                    }
                }
            } elseif ($phase === 'reveal') {
                $endsAtMs = (int)($round['ends_at_ms'] ?? (now_ms() + forbidden_reveal_ms()));
            }
        } elseif ($mode === 'subasta') {
            $playersNow = players_for_room($pdo, (int)$room['id']);
            $key = subasta_current_key($state);
            if (!isset($state['bids'][$key]) || !is_array($state['bids'][$key])) $state['bids'][$key] = [];
            if ($phase === 'bid') {
                $auctionAction = (string)($payload['auctionAction'] ?? 'bid');
                $credits = (int)(($state['credits'][$pid] ?? $state['initialCredits'] ?? 120));
                if ($auctionAction === 'analyze') {
                    if (!isset($state['revealedClues'][$key])) $state['revealedClues'][$key] = [];
                    if (!isset($state['revealedClues'][$key][$pid])) {
                        $cost = subasta_analyze_cost($state, $pid);
                        if ($credits < $cost) { $pdo->rollBack(); fail('No tienes créditos suficientes para analizar.', 422); }
                        $lot = subasta_current_lot($state);
                        $state['credits'][$pid] = max(0, $credits - $cost);
                        $state['revealedClues'][$key][$pid] = (string)($lot['extra'] ?? 'No hay pista extra: el mercado también sabe callarse.');
                        $points = -$cost;
                    }
                    $endsAtMs = (int)($round['ends_at_ms'] ?? (now_ms() + subasta_bid_ms($state)));
                } else {
                    $bid = (int)($payload['bid'] ?? 0);
                    if (!empty($payload['allIn'])) $bid = $credits;
                    $bid = max(0, min($credits, $bid));
                    $bid = (int)round($bid / 5) * 5;
                    $insurance = !empty($payload['insurance']);
                    $prevInsurance = !empty(($state['bids'][$key][$pid] ?? [])['insurance']);
                    $insuranceCost = subasta_insurance_cost($state, $pid);
                    if ($insurance && !$prevInsurance) {
                        if ($credits < $insuranceCost) { $pdo->rollBack(); fail('No tienes créditos suficientes para activar seguro.', 422); }
                        $state['credits'][$pid] = max(0, $credits - $insuranceCost);
                        $credits = (int)$state['credits'][$pid];
                        $bid = min($bid, $credits);
                    } elseif (!$insurance && $prevInsurance) {
                        $state['credits'][$pid] = $credits + $insuranceCost;
                        $credits = (int)$state['credits'][$pid];
                    }
                    $stance = trim(strip_tags((string)($payload['stance'] ?? 'Secreto')));
                    $stance = mb_substr($stance !== '' ? $stance : 'Secreto', 0, 24);
                    $state['bids'][$key][$pid] = ['bid'=>$bid, 'insurance'=>$insurance, 'stance'=>$stance, 'at'=>now_ms()];
                    $state['submissions'][$pid] = ['bid'=>$bid, 'insurance'=>$insurance, 'stance'=>$stance, 'round'=>(int)$key, 'at'=>now_ms()];
                    if (subasta_all_bids_ready($state, $playersNow) && subasta_can_resolve_early($state)) {
                        subasta_resolve_lot($pdo, $playersNow, $state);
                        $state['phaseStartedMs'] = now_ms();
                        $phase = 'reveal';
                        $endsAtMs = now_ms() + subasta_reveal_ms();
                    } else {
                        $endsAtMs = (int)($round['ends_at_ms'] ?? (now_ms() + subasta_bid_ms($state)));
                    }
                }
            } elseif ($phase === 'reveal') {
                $endsAtMs = (int)($round['ends_at_ms'] ?? (now_ms() + subasta_reveal_ms()));
            }
        } elseif ($mode === 'boss-coop' && $phase === 'battle') {
            boss_ensure_state($state, players_for_room($pdo, (int)$room['id']));
            if (!empty($state['resolved'])) { $pdo->commit(); out(state_response($pdo, $room, $viewer)); }
            $turn = (int)($state['turn'] ?? 1);
            $turnKey = (string)$turn;
            if (!isset($state['choices'][$turnKey]) || !is_array($state['choices'][$turnKey])) $state['choices'][$turnKey] = [];
            if (isset($state['choices'][$turnKey][$pid])) { $pdo->commit(); out(state_response($pdo, $room, $viewer)); }
            $move = preg_replace('/[^a-z\-]/', '', strtolower((string)($payload['move'] ?? 'attack')));
            if (!in_array($move, ['protect','attack','boost'], true)) $move = 'attack';
            $fighter = $state['fighters'][$pid] ?? ['hp'=>100];
            if ((int)($fighter['hp'] ?? 0) <= 0 && $move !== 'protect') $move = 'protect';
            $state['choices'][$turnKey][$pid] = ['move'=>$move, 'at'=>now_ms()];
            $playersNow = players_for_room($pdo, (int)$room['id']);
            if (boss_all_required_chose($state, $playersNow) || boss_turn_due($state)) {
                $phase = boss_resolve_turn($pdo, $playersNow, $state, boss_all_required_chose($state, $playersNow));
                $endsAtMs = $phase === 'results' ? null : (int)$state['turnEndsAtMs'];
                if ($phase === 'results') {
                    $pdo->prepare('UPDATE party_rounds SET status = \'results\', phase = \'results\', ended_at = NOW() WHERE id = ?')->execute([(int)$round['id']]);
                    $pdo->prepare('UPDATE party_rooms SET status = \'results\' WHERE id = ?')->execute([(int)$room['id']]);
                }
            } else {
                $endsAtMs = (int)($state['turnEndsAtMs'] ?? ($round['ends_at_ms'] ?? now_ms() + 8000));
            }

        } elseif ($mode === 'rhythm-royale' && $phase === 'rhythm') {
            if (!isset($state['submissions'][$pid])) {
                $score = max(0, min(999999, (int)($payload['score'] ?? 0)));
                $accuracy = max(0, min(100, (float)($payload['accuracy'] ?? 0)));
                $combo = max(0, min(999, (int)($payload['combo'] ?? 0)));
                $points = (int)round($score / 10 + $accuracy * 8 + $combo * 5);
                $state['submissions'][$pid] = ['score'=>$score, 'accuracy'=>$accuracy, 'combo'=>$combo, 'points'=>$points];
                $pdo->prepare('UPDATE party_players SET score = score + ? WHERE id = ?')->execute([$points, (int)$viewer['id']]);
            }
            if (count($state['submissions']) >= count(players_for_room($pdo, (int)$room['id']))) {
                $phase = 'results';
                $pdo->prepare('UPDATE party_rounds SET status = \'results\', phase = \'results\', ended_at = NOW() WHERE id = ?')->execute([(int)$round['id']]);
                $pdo->prepare('UPDATE party_rooms SET status = \'results\' WHERE id = ?')->execute([(int)$room['id']]);
            }
        } else {
            // Ronda expirada o acción no aplicable: no rompe la partida.
        }

        if ($endsAtMs !== null) {
            $pdo->prepare('UPDATE party_rounds SET phase = ?, state_json = ?, ends_at_ms = ? WHERE id = ?')->execute([$phase, jenc($state), $endsAtMs, (int)$round['id']]);
        } else {
            $pdo->prepare('UPDATE party_rounds SET phase = ?, state_json = ? WHERE id = ?')->execute([$phase, jenc($state), (int)$round['id']]);
        }
        $pdo->prepare('INSERT INTO party_actions (room_id, round_id, player_id, action_type, payload_json, points_awarded) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([(int)$room['id'], (int)$round['id'], (int)$viewer['id'], $mode, jenc($payload), $points]);
        $pdo->commit();
        $room = room_by_code($pdo, $code);
        $viewer = player_by_token($pdo, (int)$room['id'], (string)($body['playerToken'] ?? ''));
        out(state_response($pdo, $room, $viewer));
    }


    if ($action === 'backToLobby') {
        assert_host($room, $viewer, $body);
        $pdo->prepare("UPDATE party_rounds SET status = 'finished', ended_at = COALESCE(ended_at, NOW()) WHERE room_id = ? AND status IN ('playing','results')")->execute([(int)$room['id']]);
        $pdo->prepare("UPDATE party_rooms SET status = 'lobby' WHERE id = ?")->execute([(int)$room['id']]);
        $room = room_by_code($pdo, $code);
        out(state_response($pdo, $room, $viewer));
    }

    if ($action === 'finishRound') {
        assert_host($room, $viewer, $body);
        $pdo->beginTransaction();
        $roomLocked = room_by_code($pdo, $code, true);
        $round = active_round($pdo, (int)$roomLocked['id'], true);
        if ($round && (string)$round['mode'] === 'boss-coop' && (string)$round['status'] === 'playing') {
            $state = jdec($round['state_json']);
            $playersNow = players_for_room($pdo, (int)$roomLocked['id']);
            boss_ensure_state($state, $playersNow);
            $ends = (int)($state['turnEndsAtMs'] ?? ($round['ends_at_ms'] ?? 0));
            if ((string)$round['phase'] === 'battle' && empty($state['resolved']) && (boss_turn_due($state) || boss_all_required_chose($state, $playersNow))) {
                $newPhase = boss_resolve_turn($pdo, $playersNow, $state, false);
                if ($newPhase === 'results') {
                    $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([jenc($state), (int)$round['id']]);
                    $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
                } else {
                    $pdo->prepare("UPDATE party_rounds SET status = 'playing', phase = ?, state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([$newPhase, jenc($state), (int)$state['turnEndsAtMs'], (int)$round['id']]);
                    $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
                }
            }
        } elseif ($round && (string)$round['mode'] === 'mentira' && (string)$round['status'] === 'playing') {
            $state = jdec($round['state_json']);
            $playersNow = players_for_room($pdo, (int)$roomLocked['id']);
            $roundPhase = (string)$round['phase'];
            if ($roundPhase === 'write') {
                mentira_prepare_options($playersNow, $state);
                $nextEnds = now_ms() + mentira_vote_ms($state);
                $pdo->prepare("UPDATE party_rounds SET phase = 'vote', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), $nextEnds, (int)$round['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            } elseif ($roundPhase === 'vote') {
                mentira_resolve_round($pdo, $playersNow, $state);
                $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([jenc($state), (int)$round['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            } else {
                $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', ended_at = NOW() WHERE id = ?")->execute([(int)$round['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            }
        } elseif ($round && (string)$round['mode'] === 'impostor' && (string)$round['status'] === 'playing') {
            $state = jdec($round['state_json']);
            $roundPhase = (string)$round['phase'];
            if ($roundPhase === 'clue') {
                $nextEnds = now_ms() + 45000;
                $pdo->prepare("UPDATE party_rounds SET phase = 'vote', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), $nextEnds, (int)$round['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            } elseif ($roundPhase === 'vote') {
                $playersNow = players_for_room($pdo, (int)$roomLocked['id']);
                resolve_impostor_round($pdo, $playersNow, $state);
                $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW() WHERE id = ?")->execute([jenc($state), (int)$round['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            } else {
                $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', ended_at = NOW() WHERE id = ?")->execute([(int)$round['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            }
        } elseif ($round && (string)$round['mode'] === 'quiz' && (string)$round['status'] === 'playing') {
            $state = jdec($round['state_json']);
            $playersNow = players_for_room($pdo, (int)$roomLocked['id']);
            $roundPhase = (string)$round['phase'];
            if ($roundPhase === 'answer') {
                quiz_resolve_question($pdo, $playersNow, $state);
                $pdo->prepare("UPDATE party_rounds SET phase = 'reveal', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), now_ms() + quiz_reveal_duration(), (int)$round['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            } elseif ($roundPhase === 'reveal') {
                $nextPhase = quiz_next_or_finish($pdo, $playersNow, $state);
                if ($nextPhase === 'results') {
                    $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([jenc($state), (int)$round['id']]);
                    $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
                } else {
                    $pdo->prepare("UPDATE party_rounds SET phase = 'answer', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), (int)$state['questionEndsAtMs'], (int)$round['id']]);
                    $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
                }
            } else {
                quiz_finish_game($playersNow, $state);
                $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([jenc($state), (int)$round['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            }
        } elseif ($round && (string)$round['mode'] === 'boton-prohibido' && (string)$round['status'] === 'playing') {
            $state = jdec($round['state_json']);
            $playersNow = players_for_room($pdo, (int)$roomLocked['id']);
            forbidden_ensure_state($state, $pdo, (int)$roomLocked['id'], $playersNow);
            $roundPhase = (string)$round['phase'];
            if ($roundPhase === 'press') {
                forbidden_resolve_round($pdo, $playersNow, $state, true);
                $pdo->prepare("UPDATE party_rounds SET phase = 'reveal', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), now_ms() + forbidden_reveal_ms(), (int)$round['id']]);
                $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
            } elseif ($roundPhase === 'reveal') {
                $nextPhase = forbidden_next_or_finish($playersNow, $state);
                if ($nextPhase === 'results') {
                    $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', state_json = ?, ended_at = NOW(), ends_at_ms = NULL WHERE id = ?")->execute([jenc($state), (int)$round['id']]);
                    $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
                } else {
                    $pdo->prepare("UPDATE party_rounds SET phase = 'press', state_json = ?, ends_at_ms = ? WHERE id = ?")->execute([jenc($state), now_ms() + forbidden_decision_ms(), (int)$round['id']]);
                    $pdo->prepare("UPDATE party_rooms SET status = 'playing' WHERE id = ?")->execute([(int)$roomLocked['id']]);
                }
            }
        } else {
            $pdo->prepare("UPDATE party_rounds SET status = 'results', phase = 'results', ended_at = NOW() WHERE room_id = ? AND status = 'playing'")->execute([(int)$roomLocked['id']]);
            $pdo->prepare("UPDATE party_rooms SET status = 'results' WHERE id = ?")->execute([(int)$roomLocked['id']]);
        }
        $pdo->commit();
        $room = room_by_code($pdo, $code);
        $viewer = player_by_token($pdo, (int)$room['id'], (string)($body['playerToken'] ?? ''));
        out(state_response($pdo, $room, $viewer));
    }

    if ($action === 'resetRoom') {
        assert_host($room, $viewer, $body);
        $pdo->prepare('UPDATE party_rounds SET status = \'finished\', ended_at = NOW() WHERE room_id = ?')->execute([(int)$room['id']]);
        $pdo->prepare('UPDATE party_rooms SET status = \'lobby\', current_mode = NULL, round_number = 0 WHERE id = ?')->execute([(int)$room['id']]);
        $pdo->prepare('UPDATE party_players SET score = 0, damage = 0 WHERE room_id = ?')->execute([(int)$room['id']]);
        $room = room_by_code($pdo, $code);
        out(state_response($pdo, $room, $viewer));
    }

    if ($action === 'changeAvatar') {
        $validAvatars = [
            'char-warrior','char-mage','char-bot','char-ghost',
            'char-ninja','char-cat','char-alien','char-dragon',
            'bot-cyan','bot-purple','bot-green','bot-red','bot-pink','bot-yellow',
        ];
        $avatar = (string)($body['avatar'] ?? '');
        if (!in_array($avatar, $validAvatars, true)) fail('Avatar no válido.', 400);
        $pdo->prepare('UPDATE party_players SET avatar = ? WHERE id = ?')->execute([$avatar, (int)$viewer['id']]);
        $viewer['avatar'] = $avatar;
        out(state_response($pdo, $room, $viewer));
    }

    fail('Acción no soportada: ' . $action, 404);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail('Error interno: ' . $e->getMessage(), 500);
}
