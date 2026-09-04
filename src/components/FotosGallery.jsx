import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import fotosData from "../data/fotos.json";
import { useExcepciones } from "../lib/useExcepciones";
import { fotosEliminadasSet } from "../lib/excepciones";
import "./FotosGallery.css";

const TWEEN_FACTOR_BASE = 0.62; // qué tan rápido caen escala/rotación al alejarse del centro
const ROTACION_MAX = 32; // grados de giro de las tarjetas laterales

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export default function FotosGallery() {
  const { excepciones } = useExcepciones();
  const eliminadas = useMemo(() => fotosEliminadasSet(excepciones), [excepciones]);

  const personas = useMemo(() => {
    const set = new Set();
    fotosData.forEach((f) => set.add(f.nombre));
    return [...set].sort();
  }, []);

  const [personaSeleccionada, setPersonaSeleccionada] = useState(personas[0] || "");

  const fotos = useMemo(() => {
    if (!personaSeleccionada) return [];
    return fotosData
      .filter((f) => f.nombre === personaSeleccionada && !eliminadas.has(f.foto))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [personaSeleccionada, eliminadas]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    containScroll: false,
    dragFree: false,
  });

  const tweenNodes = useRef([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [puedeAnterior, setPuedeAnterior] = useState(false);
  const [puedeSiguiente, setPuedeSiguiente] = useState(false);

  const registrarNodos = useCallback(() => {
    if (!emblaApi) return;
    tweenNodes.current = emblaApi.slideNodes().map((slide) =>
      slide.querySelector(".fg-tarjeta")
    );
  }, [emblaApi]);

  const aplicarEfecto = useCallback(
    (api) => {
      const engine = api.internalEngine();
      const scrollProgress = api.scrollProgress();
      const tweenFactor = TWEEN_FACTOR_BASE * api.scrollSnapList().length;

      api.scrollSnapList().forEach((snap, snapIndex) => {
        let diff = snap - scrollProgress;
        const slidesEnSnap = engine.slideRegistry[snapIndex] || [];

        slidesEnSnap.forEach((slideIndex) => {
          const nodo = tweenNodes.current[slideIndex];
          if (!nodo) return;
          const distancia = clamp(diff * tweenFactor, -1, 1);
          const escala = 1 - Math.abs(distancia) * 0.28;
          const rotacion = distancia * -ROTACION_MAX;
          const opacidad = 1 - Math.abs(distancia) * 0.6;
          nodo.style.transform = `scale(${escala}) rotateY(${rotacion}deg)`;
          nodo.style.opacity = opacidad;
        });
      });
    },
    []
  );

  const actualizarBotones = useCallback((api) => {
    setPuedeAnterior(api.canScrollPrev());
    setPuedeSiguiente(api.canScrollNext());
    setIndiceActual(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    registrarNodos();
    aplicarEfecto(emblaApi);
    actualizarBotones(emblaApi);

    emblaApi.on("reInit", registrarNodos);
    emblaApi.on("reInit", () => aplicarEfecto(emblaApi));
    emblaApi.on("reInit", () => actualizarBotones(emblaApi));
    emblaApi.on("scroll", () => aplicarEfecto(emblaApi));
    emblaApi.on("select", () => actualizarBotones(emblaApi));

    return () => {
      emblaApi.off("reInit", registrarNodos);
      emblaApi.off("scroll", () => aplicarEfecto(emblaApi));
      emblaApi.off("select", () => actualizarBotones(emblaApi));
    };
  }, [emblaApi, registrarNodos, aplicarEfecto, actualizarBotones]);

  const fotoActual = fotos[indiceActual];

  return (
    <div className="fg-wrapper">
      <div className="fg-selector">
        <label htmlFor="persona-select" className="fg-label">
          Persona
        </label>
        <select
          id="persona-select"
          className="fg-select"
          value={personaSeleccionada}
          onChange={(e) => setPersonaSeleccionada(e.target.value)}
        >
          {personas.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <span className="fg-contador">{fotos.length} fotos</span>
      </div>

      {fotos.length === 0 && (
        <p className="fg-vacio">No hay fotos registradas para esta persona.</p>
      )}

      {fotos.length > 0 && (
        <>
          <div className="fg-carrusel-fila">
            <button
              className="fg-flecha"
              onClick={() => emblaApi && emblaApi.scrollPrev()}
              disabled={!puedeAnterior}
            >
              ←
            </button>

            <div className="fg-viewport" ref={emblaRef}>
              <div className="fg-contenedor">
                {fotos.map((item, i) => (
                  <div className="fg-slide" key={`${item.fecha}-${i}`}>
                    <div className="fg-tarjeta">
                      <img
                        src={`/fotos/${item.foto}`}
                        alt={`Foto del ${item.fecha}`}
                        loading="lazy"
                        draggable={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="fg-flecha"
              onClick={() => emblaApi && emblaApi.scrollNext()}
              disabled={!puedeSiguiente}
            >
              →
            </button>
          </div>

          {fotoActual && <p className="fg-fecha-actual">{fotoActual.fecha}</p>}

          <div className="fg-barra-contenedor">
            <input
              type="range"
              className="fg-barra-scrubber"
              min={0}
              max={Math.max(fotos.length - 1, 0)}
              value={indiceActual}
              onChange={(e) => {
                const nuevoIndice = Number(e.target.value);
                setIndiceActual(nuevoIndice);
                if (emblaApi) emblaApi.scrollTo(nuevoIndice);
              }}
              style={{
                "--progreso": `${(indiceActual / Math.max(fotos.length - 1, 1)) * 100}%`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}