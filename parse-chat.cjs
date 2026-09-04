/**
 * parse-chat.cjs
 *
 * Lee _chat.txt y genera DOS archivos:
 *  - src/data/asistencias.json : agrupado por fecha (para el Calendario)
 *  - src/data/fotos.json       : una fila por foto con su fecha Y su dueño real (para la Galería)
 *
 * USO: node parse-chat.cjs
 */

const fs = require("fs");
const path = require("path");

const CHAT_TXT_PATH = "./_chat.txt";
const OUTPUT_ASISTENCIAS = "./src/data/asistencias.json";
const OUTPUT_FOTOS = "./src/data/fotos.json";

function parseChat(rawText) {
  const text = rawText.replace(/\r\n/g, "\n").replace(/\u200e/g, "");

  const messageStartRegex =
    /\[(\d{2})-(\d{2})-(\d{2}), \d{1,2}:\d{2}:\d{2}\s*(?:a\.\s*m\.|p\.\s*m\.)\]\s*([^:]+):\s*/g;

  const matches = [...text.matchAll(messageStartRegex)];
  const entries = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const [, dd, mm, yy, nombre] = match;
    const startOfContent = match.index + match[0].length;
    const endOfContent = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const content = text.slice(startOfContent, endOfContent).trim();
    const fecha = `20${yy}-${mm}-${dd}`;
    entries.push({ fecha, nombre: nombre.trim(), content });
  }

  const adjuntoRegex = /<adjunto:\s*([^>]+)>/g;

  // Fotos individuales, con su dueño real
  const fotosIndividuales = [];
  // Agrupación por fecha (para el calendario)
  const porFecha = {};

  for (const entry of entries) {
    const adjuntos = [...entry.content.matchAll(adjuntoRegex)].map((m) => m[1].trim());
    const fotos = adjuntos.filter((nombreArchivo) => /PHOTO/i.test(nombreArchivo));

    if (fotos.length === 0) continue;

    for (const foto of fotos) {
      fotosIndividuales.push({ fecha: entry.fecha, nombre: entry.nombre, foto });
    }

    if (!porFecha[entry.fecha]) {
      porFecha[entry.fecha] = { fecha: entry.fecha, personas: new Set(), fotos: [] };
    }
    porFecha[entry.fecha].personas.add(entry.nombre);
    porFecha[entry.fecha].fotos.push(...fotos);
  }

  const asistencias = Object.values(porFecha)
    .map((d) => ({ fecha: d.fecha, personas: [...d.personas], fotos: d.fotos }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  fotosIndividuales.sort((a, b) => a.fecha.localeCompare(b.fecha));

  return { asistencias, fotos: fotosIndividuales };
}

function main() {
  if (!fs.existsSync(CHAT_TXT_PATH)) {
    console.error(`No encontré el archivo: ${CHAT_TXT_PATH}`);
    process.exit(1);
  }

  const rawText = fs.readFileSync(CHAT_TXT_PATH, "utf-8");
  const { asistencias, fotos } = parseChat(rawText);

  for (const outPath of [OUTPUT_ASISTENCIAS, OUTPUT_FOTOS]) {
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_ASISTENCIAS, JSON.stringify(asistencias, null, 2), "utf-8");
  fs.writeFileSync(OUTPUT_FOTOS, JSON.stringify(fotos, null, 2), "utf-8");

  console.log(`asistencias.json: ${asistencias.length} días`);
  console.log(`fotos.json: ${fotos.length} fotos individuales, con dueño real`);
}

main();
