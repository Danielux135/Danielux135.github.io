import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const filePath = path.join(rootDir, 'public', 'foskia', 'index.html');

const replacements = [
  ['Bolet�n diario � autónomo', 'Boletín diario · autónomo'],
  ['Bolet�n diario � aut�nomo', 'Boletín diario · autónomo'],
  ['Butllet� diari � aut��nom', 'Butlletí diari · autònom'],
  ['<div class="n" id="stat-eds">�</div>', '<div class="n" id="stat-eds">—</div>'],
  ['intervenci�n humana', 'intervención humana'],
  ['�Apuntado! Te llegar� la pr�xima edición.', '¡Apuntado! Te llegará la próxima edición.'],
  ['todav�a.', 'todavía.'],
  ['Abriendo edición�', 'Abriendo edición…'],
  ['�Se acaba pronto!', '¡Se acaba pronto!'],
  ['�Chollazo!', '¡Chollazo!'],
  ['�Copiado!', '¡Copiado!'],
  ['�Comentario publicado!', '¡Comentario publicado!'],
  ['05:30 � Despierta', '05:30 · Despierta'],
  ['categor�a', 'categoría'],
  ['Opening edition�', 'Opening edition…'],
  ['05:30 � Wakes up', '05:30 · Wakes up'],
  ['m�n', 'món'],
  ['intel�lig��ncia', 'intel·ligència'],
  ['�ltimes', 'últimes'],
  ['ci��ncia', 'ciència'],
  ['Ci��ncia', 'Ciència'],
  ['Autom��tic', 'Automàtic'],
  ['autom��tica', 'automàtica'],
  ['edici�', 'edició'],
  ['not�cia', 'notícia'],
  ['Carregant edicions�', 'Carregant edicions…'],
  ['An��lisi', 'Anàlisi'],
  ['Ning�', 'Ningú'],
  ['enllaç�', 'enllaç'],
  ['arribar�� la pr��xima edici�.', 'arribarà la pròxima edició.'],
  ['Et arribar�� la pr��xima edició.', 'Et arribarà la pròxima edició.'],
  ['pr��xima', 'pròxima'],
  ['arribar��', 'arribarà'],
  ['05:30 � Es desperta', '05:30 · Es desperta'],
  ['març�', 'març'],
  ['Ya est�s suscrito con ese email.', 'Ya estás suscrito con ese email.'],
  ['Ja est��s subscrit amb eixe email.', 'Ja estàs subscrit amb eixe email.'],
];

let html = readFileSync(filePath, 'utf8');
for (const [from, to] of replacements) {
  html = html.split(from).join(to);
}
writeFileSync(filePath, html, 'utf8');

console.log('FoskIA index text fixed.');
