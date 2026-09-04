/**
 * Combina los datos base generados por parse-chat.cjs con las excepciones
 * que la gente vaya agregando desde el botón de configuración.
 */

// Devuelve una copia de `asistenciasBase` con personas agregadas/quitadas
// y fotos eliminadas ya aplicadas.
export function aplicarExcepciones(asistenciasBase, excepciones) {
  const agregarPorFecha = {};
  const quitarPorFecha = {};
  const fotosEliminadas = fotosEliminadasSet(excepciones);

  for (const e of excepciones) {
    if (e.personas_agregar) {
      if (!agregarPorFecha[e.fecha]) agregarPorFecha[e.fecha] = new Set();
      agregarPorFecha[e.fecha].add(e.personas_agregar);
    }
    if (e.personas_quitar) {
      if (!quitarPorFecha[e.fecha]) quitarPorFecha[e.fecha] = new Set();
      quitarPorFecha[e.fecha].add(e.personas_quitar);
    }
  }

  return asistenciasBase.map((dia) => {
    const personas = new Set(dia.personas);
    for (const p of agregarPorFecha[dia.fecha] || []) personas.add(p);
    for (const p of quitarPorFecha[dia.fecha] || []) personas.delete(p);
    const fotos = dia.fotos.filter((f) => !fotosEliminadas.has(f));
    return { ...dia, personas: [...personas], fotos };
  });
}

export function fotosEliminadasSet(excepciones) {
  const set = new Set();
  for (const e of excepciones) {
    if (e.eliminada && e.foto) set.add(e.foto);
  }
  return set;
}