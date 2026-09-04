import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import asistenciasBase from "../data/asistencias.json";
import { useExcepciones } from "../lib/useExcepciones";
import { aplicarExcepciones } from "../lib/excepciones";
import "./MesGrande.css";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

function pad(n) {
  return String(n).padStart(2, "0");
}

export default function MesGrande() {
  const { excepciones, agregarPersonaADia, quitarPersonaDeDia, eliminarFoto } =
    useExcepciones();

  const asistencias = useMemo(
    () => aplicarExcepciones(asistenciasBase, excepciones),
    [excepciones]
  );

  const dataByDate = useMemo(() => {
    const map = {};
    asistencias.forEach((d) => {
      map[d.fecha] = d;
    });
    return map;
  }, [asistencias]);

  // Lista de TODOS los nombres conocidos (incluye los agregados por excepción),
  // para poder ofrecerlos en el selector de "agregar persona"
  const todosLosNombres = useMemo(() => {
    const set = new Set();
    asistenciasBase.forEach((d) => d.personas.forEach((p) => set.add(p)));
    excepciones.forEach((e) => {
      if (e.personas_agregar) set.add(e.personas_agregar);
    });
    return [...set].sort();
  }, [excepciones]);

  const personas = useMemo(() => {
    const set = new Set();
    asistencias.forEach((d) => d.personas.forEach((p) => set.add(p)));
    return ["Todos", ...[...set].sort()];
  }, [asistencias]);

  const meses = useMemo(() => {
    const fechas = Object.keys(dataByDate).sort();
    if (fechas.length === 0) return [];
    const [y0, m0] = fechas[0].split("-").map(Number);
    const [y1, m1] = fechas[fechas.length - 1].split("-").map(Number);
    const list = [];
    let y = y0;
    let m = m0;
    while (y < y1 || (y === y1 && m <= m1)) {
      list.push({ year: y, month: m });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return list;
  }, [dataByDate]);

  const mesInicial = useMemo(() => {
    const hoy = new Date();
    const idx = meses.findIndex(
      (m) => m.year === hoy.getFullYear() && m.month === hoy.getMonth() + 1
    );
    return idx >= 0 ? idx : Math.max(meses.length - 1, 0);
  }, [meses]);

  const [mesIndex, setMesIndex] = useState(mesInicial);
  const [direccion, setDireccion] = useState(0);
  const [personaFiltro, setPersonaFiltro] = useState("Todos");
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [nombreAAgregar, setNombreAAgregar] = useState("");
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  const mesActual = meses[mesIndex];

  function diaMarcado(fechaStr) {
    const registro = dataByDate[fechaStr];
    if (!registro) return false;
    if (personaFiltro === "Todos") return true;
    return registro.personas.includes(personaFiltro);
  }

  function buildMonthGrid(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  function irMesAnterior() {
    if (mesIndex > 0) {
      setDireccion(-1);
      setMesIndex(mesIndex - 1);
      setDiaSeleccionado(null);
    }
  }

  function irMesSiguiente() {
    if (mesIndex < meses.length - 1) {
      setDireccion(1);
      setMesIndex(mesIndex + 1);
      setDiaSeleccionado(null);
    }
  }

  function alternarEdicion() {
    if (modoEdicion) {
      setModoEdicion(false);
      return;
    }
    const clave = window.prompt("Clave de edición:");
    if (clave === "1212") {
      setModoEdicion(true);
    } else if (clave !== null) {
      window.alert("Clave incorrecta");
    }
  }

  if (!mesActual) return null;

  const cells = buildMonthGrid(mesActual.year, mesActual.month);
  const registroSeleccionado = diaSeleccionado ? dataByDate[diaSeleccionado] : null;

  return (
    <div className="mg-layout">
      <div className="mg-calendario">
        <div className="mg-header">
          <button className="mg-flecha" onClick={irMesAnterior} disabled={mesIndex === 0}>
            ←
          </button>
          <div className="mg-header-titulo">
            <AnimatePresence mode="wait" custom={direccion}>
              <motion.h2
                key={mesIndex}
                custom={direccion}
                initial={{ opacity: 0, x: direccion >= 0 ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direccion >= 0 ? -24 : 24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {MESES[mesActual.month - 1]} {mesActual.year}
              </motion.h2>
            </AnimatePresence>
          </div>
          <button
            className="mg-flecha"
            onClick={irMesSiguiente}
            disabled={mesIndex === meses.length - 1}
          >
            →
          </button>
        </div>

        <div className="mg-dias-header">
          {DIAS_SEMANA.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className="mg-dias-grid-contenedor">
          <AnimatePresence mode="wait" custom={direccion}>
            <motion.div
              className="mg-dias-grid"
              key={mesIndex}
              custom={direccion}
              initial={{ opacity: 0, x: direccion >= 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direccion >= 0 ? -40 : 40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {cells.map((d, i) => {
                if (d === null) return <span key={i} className="mg-dia mg-vacio" />;
                const fechaStr = `${mesActual.year}-${pad(mesActual.month)}-${pad(d)}`;
                const marcado = diaMarcado(fechaStr);
                const seleccionado = fechaStr === diaSeleccionado;
                return (
                  <button
                    key={i}
                    className={`mg-dia ${marcado ? "mg-dia-verde" : ""} ${
                      seleccionado ? "mg-dia-seleccionado" : ""
                    }`}
                    disabled={!marcado}
                    onClick={() => setDiaSeleccionado(fechaStr)}
                  >
                    {d}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mg-panel">
        <div className="mg-panel-seccion">
          <label className="mg-panel-label">Persona</label>
          <div className="mg-persona-filtro">
            {personas.map((p) => (
              <button
                key={p}
                className={`mg-chip ${personaFiltro === p ? "mg-chip-activo" : ""}`}
                onClick={() => setPersonaFiltro(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mg-panel-seccion mg-panel-fotos">
          <AnimatePresence mode="wait">
            {!registroSeleccionado && (
              <motion.p
                key="placeholder"
                className="mg-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Selecciona un día marcado en verde
              </motion.p>
            )}

            {registroSeleccionado && (
              <motion.div
                key={diaSeleccionado}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="mg-fecha">{diaSeleccionado}</p>

                {!modoEdicion && (
                  <p className="mg-personas">{registroSeleccionado.personas.join(", ")}</p>
                )}

                {modoEdicion && (
                  <div className="mg-edicion-personas">
                    {registroSeleccionado.personas.map((p) => (
                      <span key={p} className="mg-persona-chip">
                        {p}
                        <button
                          className="mg-quitar-btn"
                          onClick={() => quitarPersonaDeDia(diaSeleccionado, p)}
                          title="Quitar de este día"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <div className="mg-agregar-persona">
                      <input
                        list="lista-nombres"
                        className="mg-input-nombre"
                        placeholder="Agregar persona…"
                        value={nombreAAgregar}
                        onChange={(e) => setNombreAAgregar(e.target.value)}
                      />
                      <datalist id="lista-nombres">
                        {todosLosNombres.map((n) => (
                          <option key={n} value={n} />
                        ))}
                      </datalist>
                      <button
                        className="mg-boton-agregar"
                        disabled={!nombreAAgregar.trim()}
                        onClick={() => {
                          agregarPersonaADia(diaSeleccionado, nombreAAgregar.trim());
                          setNombreAAgregar("");
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div className="mg-fotos-grid">
                  {registroSeleccionado.fotos.map((foto, i) => (
                    <div key={i} className="mg-foto-item" onClick={() => setFotoAmpliada(foto)}>
                      <img src={`/fotos/${foto}`} alt={`Foto del ${diaSeleccionado}`} />
                      {modoEdicion && (
                        <button
                          className="mg-borrar-foto"
                          title="Eliminar esta foto"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarFoto(diaSeleccionado, foto);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        className={`mg-config-btn ${modoEdicion ? "mg-config-activo" : ""}`}
        onClick={alternarEdicion}
        title={modoEdicion ? "Salir de edición" : "Editar días y fotos"}
      >
        ⚙️
      </button>

      <AnimatePresence>
        {fotoAmpliada && (
          <motion.div
            className="mg-lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setFotoAmpliada(null)}
          >
            <motion.img
              src={`/fotos/${fotoAmpliada}`}
              alt="Foto ampliada"
              className="mg-lightbox-img"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button className="mg-lightbox-cerrar" onClick={() => setFotoAmpliada(null)}>
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}