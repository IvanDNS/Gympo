import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export function useExcepciones() {
  const [excepciones, setExcepciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase.from("excepciones").select("*");
    if (error) {
      console.error("Error cargando excepciones:", error.message);
    } else {
      setExcepciones(data || []);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  async function agregarPersonaADia(fecha, nombre) {
    await supabase.from("excepciones").insert({ fecha, personas_agregar: nombre });
    await recargar();
  }

  async function quitarPersonaDeDia(fecha, nombre) {
    await supabase.from("excepciones").insert({ fecha, personas_quitar: nombre });
    await recargar();
  }

  async function eliminarFoto(fecha, foto) {
    await supabase.from("excepciones").insert({ fecha, foto, eliminada: true });
    await recargar();
  }

  return { excepciones, cargando, agregarPersonaADia, quitarPersonaDeDia, eliminarFoto, recargar };
}