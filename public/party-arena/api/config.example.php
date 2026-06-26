<?php
// Danielux Party Arena — configuración de ejemplo.
// 1) Copia este archivo como config.local.php en el hosting.
// 2) Rellena los datos de tu base de datos MariaDB/MySQL.
// 3) NO subas config.local.php a GitHub con contraseñas reales.

return [
    'db_host' => 'localhost',
    'db_name' => 'TU_BASE_DE_DATOS',
    'db_user' => 'TU_USUARIO',
    'db_pass' => 'TU_CONTRASEÑA',
    'db_charset' => 'utf8mb4',

    // Dominios desde los que permites jugar. Añade tu dominio principal.
    // Si estás probando rápido puedes dejar ['*'], pero para producción mejor limita.
    'allowed_origins' => [
        'https://danielux.es',
        'https://www.danielux.es',
        'https://danielux135.github.io',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
    ],
];
