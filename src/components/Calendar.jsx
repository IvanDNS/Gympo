import { useState, useMemo } from "react";
import asistencias from "../data/asistencias.json";
import "./Calendar.css";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

function pad(n) {
  return String(n).padStart(2, "0");
}

export default function Calendar() {
  // Indexa las asistencias por fecha para acceso rápido: { "2025-11-18": {...} }
  const dataByDate = useMemo(() => {
    const map = {};
    asistencias.forEach((d) => {
      map[d.fecha] = d;
    });
    return map;
  }, []);

  // Lista única de personas para el filtro
  const personas = useMemo(() => {
    const set = new Set();
    asistencias.forEach((d) => d.personas.forEach((p) => set.add(p)));
    return ["Todos", ...[...set].sort()];
  }, []);

  const [personaFiltro, setPersonaFiltro] = useState("Todos");
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  // Genera la lista de meses a mostrar, desde el primer registro hasta el último
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

  function diaMarcado(fechaStr) {
    const registro = dataByDate[fechaStr];
    if (!registro) return false;
    if (personaFiltro === "Todos") return true;
    return registro.personas.includes(personaFiltro);
  }

  function buildMonthGrid(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    // Ajusta para que la semana empiece en Lunes (getDay() da 0=Domingo)
    const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  const registroSeleccionado = diaSeleccionado ? dataByDate[diaSeleccionado] : null;

  return (
    <div className="calendar-wrapper">
      <div className="persona-filtro">
        {personas.map((p) => (
          <button
            key={p}
            className={`chip ${personaFiltro === p ? "chip-activo" : ""}`}
            onClick={() => setPersonaFiltro(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="meses-grid">
        {meses.map(({ year, month }) => {
          const cells = buildMonthGrid(year, month);
          return (
            <div className="mes-card" key={`${year}-${month}`}>
              <h3>
                {MESES[month - 1]} {year}
              </h3>
              <div className="dias-header">
                {DIAS_SEMANA.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="dias-grid">
                {cells.map((d, i) => {
                  if (d === null) {
                    return <span key={i} className="dia vacio" />;
                  }
                  const fechaStr = `${year}-${pad(month)}-${pad(d)}`;
                  const marcado = diaMarcado(fechaStr);
                  return (
                    <button
                      key={i}
                      className={`dia ${marcado ? "dia-verde" : ""}`}
                      disabled={!marcado}
                      onClick={() => marcado && setDiaSeleccionado(fechaStr)}
                      title={marcado ? dataByDate[fechaStr].personas.join(", ") : ""}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {registroSeleccionado && (
        <div className="modal-overlay" onClick={() => setDiaSeleccionado(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="cerrar" onClick={() => setDiaSeleccionado(null)}>
              ✕
            </button>
            <h3>{diaSeleccionado}</h3>
            <p className="modal-personas">{registroSeleccionado.personas.join(", ")}</p>
            <div className="fotos-grid">
              {registroSeleccionado.fotos.map((foto, i) => (
                <img key={i} src={`/fotos/${foto}`} alt={`Foto del ${diaSeleccionado}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}