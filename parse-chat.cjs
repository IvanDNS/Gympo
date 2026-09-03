/**
 * parse-chat.js
 *
 * Lee el _chat.txt exportado de WhatsApp y genera src/data/asistencias.json
 * agrupando por fecha, con la lista de personas que fueron y las fotos de ese día.
 *
 * USO:
 *   1. Coloca este archivo en la raíz de tu proyecto Astro (gympo-web/).
 *   2. Coloca el _chat.txt exportado en la misma carpeta (o ajusta la ruta abajo).
 *   3. Corre: node parse-chat.js
 *   4. Revisa el resultado en src/data/asistencias.json
 *   5. Copia las fotos (los archivos .jpg listados) a public/fotos/
 */

const fs = require("fs");
const path = require("path");

// --- CONFIGURA ESTAS RUTAS SEGÚN TU CASO ---
const CHAT_TXT_PATH = "./_chat.txt";
const OUTPUT_JSON_PATH = "./src/data/asistencias.json";
// --------------------------------------------

function parseChat(rawText) {
  // Normaliza saltos de línea y quita el carácter invisible U+200E que WhatsApp
  // agrega al inicio de algunas líneas.
  const text = rawText.replace(/\r\n/g, "\n").replace(/\u200e/g, "");

  // Cada mensaje empieza con [DD-MM-AA, H:MM:SS a. m./p. m.] Nombre: contenido
  // Usamos un regex que captura el inicio de cada mensaje para separar bien
  // los mensajes multilínea (como el de "Y aproveche de venir en la\nMañana").
  const messageStartRegex =
    /\[(\d{2})-(\d{2})-(\d{2}), \d{1,2}:\d{2}:\d{2}\s*(?:a\.\s*m\.|p\.\s*m\.)\]\s*([^:]+):\s*/g;

  const matches = [...text.matchAll(messageStartRegex)];
  const entries = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const [, dd, mm, yy, nombre] = match;
    const startOfContent = match.index + match[0].length;
    const endOfContent =
      i + 1 < matches.length ? matches[i + 1].index : text.length;
    const content = text.slice(startOfContent, endOfContent).trim();

    // Año de 2 dígitos -> asumimos 20XX
    const fecha = `20${yy}-${mm}-${dd}`;

    entries.push({ fecha, nombre: nombre.trim(), content });
  }

  // Extrae fotos (ignora stickers .webp y otros adjuntos que no sean imagen "PHOTO")
  const adjuntoRegex = /<adjunto:\s*([^>]+)>/g;

  const porFecha = {};

  for (const entry of entries) {
    const adjuntos = [...entry.content.matchAll(adjuntoRegex)].map(
      (m) => m[1].trim()
    );

    const fotos = adjuntos.filter((nombreArchivo) =>
      /PHOTO/i.test(nombreArchivo)
    );

    if (fotos.length === 0) continue;

    if (!porFecha[entry.fecha]) {
      porFecha[entry.fecha] = { fecha: entry.fecha, personas: new Set(), fotos: [] };
    }

    porFecha[entry.fecha].personas.add(entry.nombre);
    porFecha[entry.fecha].fotos.push(...fotos);
  }

  // Convierte a array y Set -> array, ordenado por fecha
  return Object.values(porFecha)
    .map((d) => ({
      fecha: d.fecha,
      personas: [...d.personas],
      fotos: d.fotos,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function main() {
  if (!fs.existsSync(CHAT_TXT_PATH)) {
    console.error(`No encontré el archivo: ${CHAT_TXT_PATH}`);
    process.exit(1);
  }

  const rawText = fs.readFileSync(CHAT_TXT_PATH, "utf-8");
  const resultado = parseChat(rawText);

  const outDir = path.dirname(OUTPUT_JSON_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(resultado, null, 2), "utf-8");

  const totalFotos = resultado.reduce((acc, d) => acc + d.fotos.length, 0);
  console.log(`Listo. ${resultado.length} días con registro, ${totalFotos} fotos totales.`);
  console.log(`Guardado en: ${OUTPUT_JSON_PATH}`);
  console.log(`\nRecuerda copiar las fotos listadas en el JSON a public/fotos/`);
}

main();