-- Danielux Party Arena — MariaDB/MySQL schema
-- Importa este archivo en phpMyAdmin o en el panel de base de datos del hosting.
-- Recomendado: MariaDB 10.4+ o MySQL 8+. También funciona con MariaDB más antiguo porque los estados se guardan como LONGTEXT JSON.

CREATE TABLE IF NOT EXISTS party_rooms (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(8) NOT NULL,
  host_token CHAR(64) NOT NULL,
  status ENUM('lobby','playing','results','finished') NOT NULL DEFAULT 'lobby',
  current_mode VARCHAR(48) DEFAULT NULL,
  round_number INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_party_rooms_code (code),
  KEY idx_party_rooms_status (status),
  KEY idx_party_rooms_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS party_players (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id INT UNSIGNED NOT NULL,
  token CHAR(64) NOT NULL,
  name VARCHAR(32) NOT NULL,
  avatar VARCHAR(24) NOT NULL DEFAULT 'bot-blue',
  score INT NOT NULL DEFAULT 0,
  damage INT NOT NULL DEFAULT 0,
  is_host TINYINT(1) NOT NULL DEFAULT 0,
  online_until DATETIME DEFAULT NULL,
  meta_json LONGTEXT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_party_players_token (token),
  UNIQUE KEY uq_party_players_room_name (room_id, name),
  KEY idx_party_players_room (room_id),
  CONSTRAINT fk_party_players_room FOREIGN KEY (room_id) REFERENCES party_rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS party_rounds (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id INT UNSIGNED NOT NULL,
  mode VARCHAR(48) NOT NULL,
  round_index INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('playing','results','finished') NOT NULL DEFAULT 'playing',
  phase VARCHAR(32) NOT NULL DEFAULT 'play',
  state_json LONGTEXT NOT NULL,
  started_at_ms BIGINT UNSIGNED NOT NULL DEFAULT 0,
  ends_at_ms BIGINT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_party_rounds_room_status (room_id, status),
  CONSTRAINT fk_party_rounds_room FOREIGN KEY (room_id) REFERENCES party_rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS party_actions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id INT UNSIGNED NOT NULL,
  round_id INT UNSIGNED DEFAULT NULL,
  player_id INT UNSIGNED DEFAULT NULL,
  action_type VARCHAR(48) NOT NULL,
  payload_json LONGTEXT NULL,
  points_awarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_party_actions_round (round_id),
  KEY idx_party_actions_player (player_id),
  KEY idx_party_actions_room (room_id),
  CONSTRAINT fk_party_actions_room FOREIGN KEY (room_id) REFERENCES party_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_party_actions_round FOREIGN KEY (round_id) REFERENCES party_rounds(id) ON DELETE SET NULL,
  CONSTRAINT fk_party_actions_player FOREIGN KEY (player_id) REFERENCES party_players(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS party_chat (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id INT UNSIGNED NOT NULL,
  player_id INT UNSIGNED DEFAULT NULL,
  message VARCHAR(220) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_party_chat_room (room_id, id),
  CONSTRAINT fk_party_chat_room FOREIGN KEY (room_id) REFERENCES party_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_party_chat_player FOREIGN KEY (player_id) REFERENCES party_players(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
