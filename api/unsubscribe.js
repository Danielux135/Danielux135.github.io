import { getFirestoreToken, firestoreRequest } from './subscribe.js';

function page(title, body, color = '#5eead4') {
  return `<!DOCTYPE html><html><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} · FoskIA</title>
</head>
<body style="background:#0a1628;font-family:Georgia,serif;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px">
  <div style="max-width:420px;text-align:center">
    <div style="color:#5eead4;font-size:28px;font-weight:900;letter-spacing:-.02em;margin-bottom:32px">FoskIA.</div>
    <h1 style="color:${color};font-size:22px;font-weight:700;margin:0 0 16px">${title}</h1>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 32px">${body}</p>
    <a href="https://danielux135.github.io/blog/" style="background:#5eead4;color:#0a1628;padding:11px 26px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">Volver al blog</a>
    <p style="color:#334155;font-size:11px;margin-top:32px">
      Proyecto de <a href="https://danielux135.github.io/" style="color:#5eead4;text-decoration:none">Daniel Bort Guzmán</a>
    </p>
  </div>
</body></html>`;
}

export default async function handler(req, res) {
  const email = req.query?.email || (req.url && new URL(req.url, 'http://x').searchParams.get('email'));
  if (!email) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(page('Enlace inválido', 'No se ha encontrado la dirección de correo en el enlace.', '#f87171'));
  }

  try {
    const token = await getFirestoreToken();
    const docId = Buffer.from(email.toLowerCase()).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

    const existing = await firestoreRequest(token, 'GET', `/subscribers/${docId}`);
    if (!existing.fields) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(page(
        'Ya estabas dado de baja',
        `No hemos encontrado <strong style="color:#f1f5f9">${email}</strong> en nuestra lista.`,
        '#94a3b8'
      ));
    }

    await firestoreRequest(token, 'DELETE', `/subscribers/${docId}`);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(page(
      '¡Baja confirmada!',
      `<strong style="color:#f1f5f9">${email}</strong> ha sido eliminado de la lista de FoskIA. No recibirás más correos.`
    ));
  } catch (err) {
    console.error(err);
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(page('Error inesperado', 'No se pudo procesar tu solicitud. Inténtalo de nuevo más tarde.', '#f87171'));
  }
}
