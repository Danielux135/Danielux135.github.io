# Danielux Party Arena — instalación rápida

## Qué se ha añadido

- `/party-arena/`: frontend del hub multijugador.
- `/party-arena/api/party.php`: API PHP para salas online, solo si decides autohospedar la API.
- `/party-arena/api/install.sql`: tablas MariaDB/MySQL.
- `/party-arena/api/config.example.php`: plantilla de configuración segura.

## Base de datos recomendada

Usa **MariaDB** si tu hosting la ofrece. Para este proyecto es lo mejor porque normalmente viene con hostings compartidos, funciona perfecto con PHP y MySQL/MariaDB son compatibles para estas tablas.

## Crear la base de datos

1. Entra en el panel de control del dominio.
2. Abre **Hosting Web / Microhosting** o la sección de bases de datos.
3. Activa el microhosting si todavía no está activo.
4. Crea una base de datos MariaDB/MySQL.
5. Crea un usuario con contraseña.
6. Asigna ese usuario a la base de datos con permisos completos.
7. Abre phpMyAdmin o el importador SQL.
8. Importa este archivo:

```txt
public/party-arena/api/install.sql
```

## Subir la API al hosting

Lo ideal es tener el frontend público apuntando al Worker y, si hace falta, una API PHP privada detrás:

```txt
danielux.es          -> GitHub Pages / portfolio
danielux-api-proxy.dlux135.workers.dev      -> Cloudflare Worker
```

Si vas a autohospedar la API, sube dentro estos archivos:

```txt
party.php
config.example.php
config.local.php
install.sql  (opcional, después de importar puedes borrarlo)
```

Crea `config.local.php` copiando `config.example.php` y rellenando los datos reales:

```php
<?php
return [
    'db_host' => 'localhost',
    'db_name' => 'NOMBRE_DE_TU_BD',
    'db_user' => 'USUARIO_DE_TU_BD',
    'db_pass' => 'CONTRASEÑA_DE_TU_BD',
    'db_charset' => 'utf8mb4',
    'allowed_origins' => [
        'https://danielux.es',
        'https://www.danielux.es',
        'https://danielux135.github.io'
    ],
];
```

No subas `config.local.php` con credenciales reales a GitHub.

## DNS / dominio

En **Dominio y DNS**, crea un registro para el subdominio de API.

La opción depende de lo que te dé el hosting:

```txt
api    A        IP_DEL_HOSTING
```

o:

```txt
api    CNAME    host-del-proveedor.com
```

Si el hosting permite crear el subdominio desde el panel, créalo primero y luego apunta DNS como indique el proveedor.

## Conectar el frontend con la API

Abre la página:

```txt
/party-arena/
```

Pulsa **Configurar API** y pega:

```txt
https://danielux-api-proxy.dlux135.workers.dev/api/party
```

El frontend ya usa este Worker por defecto. Solo cambia la URL si sabes que tu despliegue apunta a otra API.

## Flujo de prueba

1. Abre `/party-arena/` en una pestaña.
2. Crea sala como host.
3. Copia el código.
4. Abre otra pestaña o el móvil.
5. Únete con otro nombre.
6. El host elige modo e inicia ronda.

## Modos incluidos en esta primera implantación

- Impostor de Palabras.
- Carrera de Bugs.
- Boss Cooperativo.
- Rhythm Battle Royale simple con Web Audio.
- Mentira Express.

Son versiones base para que el sistema ya exista. La idea es pulir cada modo después sin rehacer la arquitectura.
