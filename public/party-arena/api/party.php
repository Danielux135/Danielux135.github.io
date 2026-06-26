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
    $mode = (string)$round['mode'];
    $viewerId = $viewer ? (int)$viewer['id'] : 0;

    if ($mode === 'impostor') {
        $secrets = $state['secrets'] ?? [];
        $state['yourWord'] = $secrets[(string)$viewerId] ?? null;
        $state['youAreImpostor'] = isset($state['impostor_id']) && (int)$state['impostor_id'] === $viewerId;
        unset($state['secrets']);
        if (($round['phase'] ?? '') !== 'results') unset($state['impostor_id'], $state['normalWord'], $state['impostorWord']);
    }
    if ($mode === 'mentira') {
        if (($round['phase'] ?? '') !== 'vote' && ($round['phase'] ?? '') !== 'results') {
            unset($state['fakeAnswers']);
        }
    }

    $submitted = [];
    foreach (($state['answers'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    foreach (($state['clues'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    foreach (($state['votes'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;
    foreach (($state['hits'] ?? []) as $pid => $_) $submitted[(string)$pid] = true;

    return [
        'id' => (int)$round['id'],
        'mode' => $mode,
        'status' => (string)$round['status'],
        'phase' => (string)$round['phase'],
        'roundIndex' => (int)$round['round_index'],
        'startedAtMs' => (int)$round['started_at_ms'],
        'endsAtMs' => $round['ends_at_ms'] ? (int)$round['ends_at_ms'] : null,
        'serverNowMs' => now_ms(),
        'state' => $state,
        'submitted' => $submitted,
    ];
}
function state_response(PDO $pdo, array $room, ?array $viewer = null): array {
    if ($viewer) update_online($pdo, (int)$viewer['id']);
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
function challenge_pool(): array {
    return [
        ['lang'=>'JavaScript','code'=>"function sumar(a, b) {\n  return a - b;\n}", 'options'=>['Cambiar - por +','Quitar return','Cambiar function por class','Añadir console.log'], 'correct'=>0],
        ['lang'=>'CSS','code'=>".card {\n  display: flex;\n  justify-content: middle;\n}", 'options'=>['Usar justify-content: center','Cambiar flex por grid','Quitar .card','Añadir position fixed'], 'correct'=>0],
        ['lang'=>'HTML','code'=>"<img src=\"logo.png\">\n<a href=\"/jugar\">Entrar", 'options'=>['Cerrar la etiqueta a con </a>','Cambiar img por div','Quitar href','Añadir script'], 'correct'=>0],
        ['lang'=>'C#','code'=>"int edad = \"18\";\nConsole.WriteLine(edad);", 'options'=>['Cambiar "18" por 18','Usar var edad = false','Quitar Console.WriteLine','Cambiar int por string[]'], 'correct'=>0],
        ['lang'=>'Git','code'=>"git commit -m Arreglo final\ngit push origin main", 'options'=>['Poner el mensaje entre comillas','Usar git delete','Cambiar main por master siempre','Quitar commit'], 'correct'=>0],
    ];
}
function word_pairs(): array {
    return [
        ['normal'=>'JavaScript', 'impostor'=>'TypeScript'],
        ['normal'=>'HTML', 'impostor'=>'XML'],
        ['normal'=>'Spotify', 'impostor'=>'SoundCloud'],
        ['normal'=>'GitHub', 'impostor'=>'GitLab'],
        ['normal'=>'Mario Kart', 'impostor'=>'Crash Team Racing'],
        ['normal'=>'Pizza', 'impostor'=>'Hamburguesa'],
        ['normal'=>'Beat', 'impostor'=>'Melodía'],
        ['normal'=>'Servidor', 'impostor'=>'Hosting'],
    ];
}
function mentira_pool(): array {
    return [
        ['question'=>'¿Qué significa realmente CSS?', 'real'=>'Cascading Style Sheets'],
        ['question'=>'¿Qué comando sube cambios a GitHub?', 'real'=>'git push'],
        ['question'=>'¿Qué lenguaje ejecuta el navegador de forma nativa?', 'real'=>'JavaScript'],
        ['question'=>'¿Qué etiqueta carga una hoja CSS?', 'real'=>'link'],
    ];
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
        $allowedModes = ['impostor','bug-race','boss-coop','rhythm-royale','mentira'];
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
            $pair = word_pairs()[array_rand(word_pairs())];
            $impostorId = $playerIds[array_rand($playerIds)];
            $secrets = [];
            foreach ($playerIds as $pid) $secrets[(string)$pid] = ($pid === $impostorId) ? $pair['impostor'] : $pair['normal'];
            $state = ['normalWord'=>$pair['normal'], 'impostorWord'=>$pair['impostor'], 'impostor_id'=>$impostorId, 'secrets'=>$secrets, 'clues'=>[], 'votes'=>[], 'scores'=>[]];
            $phase = 'clue';
            $duration = 45000;
        } elseif ($mode === 'bug-race') {
            $pool = challenge_pool();
            $challenge = $pool[array_rand($pool)];
            $state = ['challenge'=>$challenge, 'answers'=>[], 'scores'=>[]];
            $phase = 'answer';
            $duration = 20000;
        } elseif ($mode === 'boss-coop') {
            $hp = max(2200, count($players) * 1100);
            $state = ['boss'=>'EL BUG SUPREMO', 'hp'=>$hp, 'maxHp'=>$hp, 'hits'=>[], 'events'=>[], 'scores'=>[]];
            $phase = 'battle';
            $duration = 60000;
            $pdo->prepare('UPDATE party_players SET damage = 0 WHERE room_id = ?')->execute([(int)$room['id']]);
        } elseif ($mode === 'rhythm-royale') {
            $state = ['bpm'=>120, 'duration'=>30000, 'scores'=>[], 'submissions'=>[]];
            $phase = 'rhythm';
            $duration = 34000;
        } elseif ($mode === 'mentira') {
            $q = mentira_pool()[array_rand(mentira_pool())];
            $state = ['question'=>$q['question'], 'realAnswer'=>$q['real'], 'fakeAnswers'=>[], 'votes'=>[], 'scores'=>[]];
            $phase = 'write';
            $duration = 45000;
        } else {
            fail('Modo no válido.');
        }
        $started = now_ms() + 1200;
        $ends = $started + $duration;
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
            if ($phase === 'clue') {
                $clue = mb_substr(trim(strip_tags((string)($payload['clue'] ?? ''))), 0, 80);
                if ($clue !== '') $state['clues'][$pid] = $clue;
                if (count($state['clues']) >= count(players_for_room($pdo, (int)$room['id']))) $phase = 'vote';
            } elseif ($phase === 'vote') {
                if (!isset($state['votes'][$pid])) {
                    $vote = (int)($payload['vote'] ?? 0);
                    $state['votes'][$pid] = $vote;
                }
                if (count($state['votes']) >= count(players_for_room($pdo, (int)$room['id']))) {
                    $impostor = (int)($state['impostor_id'] ?? 0);
                    $caughtVotes = 0;
                    foreach ($state['votes'] as $voter => $vote) {
                        if ((int)$vote === $impostor) {
                            $caughtVotes++;
                            $pdo->prepare('UPDATE party_players SET score = score + 600 WHERE id = ?')->execute([(int)$voter]);
                        }
                    }
                    if ($caughtVotes < max(1, ceil(count(players_for_room($pdo, (int)$room['id'])) / 2))) {
                        $pdo->prepare('UPDATE party_players SET score = score + 900 WHERE id = ?')->execute([$impostor]);
                        $state['winner'] = 'impostor';
                    } else {
                        $state['winner'] = 'crew';
                    }
                    $phase = 'results';
                    $pdo->prepare('UPDATE party_rounds SET status = \'results\', phase = \'results\', ended_at = NOW() WHERE id = ?')->execute([(int)$round['id']]);
                    $pdo->prepare('UPDATE party_rooms SET status = \'results\' WHERE id = ?')->execute([(int)$room['id']]);
                }
            }
        } elseif ($mode === 'mentira') {
            if ($phase === 'write') {
                $fake = mb_substr(trim(strip_tags((string)($payload['fake'] ?? ''))), 0, 100);
                if ($fake !== '') $state['fakeAnswers'][$pid] = $fake;
                if (count($state['fakeAnswers']) >= count(players_for_room($pdo, (int)$room['id']))) $phase = 'vote';
            } elseif ($phase === 'vote') {
                if (!isset($state['votes'][$pid])) $state['votes'][$pid] = (string)($payload['vote'] ?? 'real');
                if (count($state['votes']) >= count(players_for_room($pdo, (int)$room['id']))) {
                    foreach ($state['votes'] as $voter => $vote) {
                        if ($vote === 'real') $pdo->prepare('UPDATE party_players SET score = score + 500 WHERE id = ?')->execute([(int)$voter]);
                        elseif (isset($state['fakeAnswers'][$vote])) $pdo->prepare('UPDATE party_players SET score = score + 350 WHERE id = ?')->execute([(int)$vote]);
                    }
                    $phase = 'results';
                    $pdo->prepare('UPDATE party_rounds SET status = \'results\', phase = \'results\', ended_at = NOW() WHERE id = ?')->execute([(int)$round['id']]);
                    $pdo->prepare('UPDATE party_rooms SET status = \'results\' WHERE id = ?')->execute([(int)$room['id']]);
                }
            }
        } elseif ($mode === 'boss-coop' && $phase === 'battle') {
            $damage = random_int(24, 82);
            $crit = random_int(1, 100) <= 12;
            if ($crit) $damage *= 3;
            $state['hp'] = max(0, (int)$state['hp'] - $damage);
            $state['hits'][$pid] = (($state['hits'][$pid] ?? 0) + $damage);
            $state['events'][] = ['player'=>$viewer['name'], 'damage'=>$damage, 'crit'=>$crit, 'at'=>now_ms()];
            $state['events'] = array_slice($state['events'], -8);
            $pdo->prepare('UPDATE party_players SET score = score + ?, damage = damage + ? WHERE id = ?')->execute([$damage, $damage, (int)$viewer['id']]);
            if ((int)$state['hp'] <= 0) {
                $phase = 'results';
                $pdo->prepare('UPDATE party_rounds SET status = \'results\', phase = \'results\', ended_at = NOW() WHERE id = ?')->execute([(int)$round['id']]);
                $pdo->prepare('UPDATE party_rooms SET status = \'results\' WHERE id = ?')->execute([(int)$room['id']]);
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

        $pdo->prepare('UPDATE party_rounds SET phase = ?, state_json = ? WHERE id = ?')->execute([$phase, jenc($state), (int)$round['id']]);
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
        $pdo->prepare('UPDATE party_rounds SET status = \'results\', phase = \'results\', ended_at = NOW() WHERE room_id = ? AND status = \'playing\'')->execute([(int)$room['id']]);
        $pdo->prepare('UPDATE party_rooms SET status = \'results\' WHERE id = ?')->execute([(int)$room['id']]);
        $room = room_by_code($pdo, $code);
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

    fail('Acción no soportada: ' . $action, 404);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail('Error interno: ' . $e->getMessage(), 500);
}
