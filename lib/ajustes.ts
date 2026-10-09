import {cache} from "react";
import {getSupabasePublic} from "./supabase-public";

export type Ajustes = {reservaciones_activas: boolean};

// Si la tabla no existe todavía o Supabase no responde, el sitio se comporta como antes: reservaciones abiertas.
const PREDETERMINADOS: Ajustes = {reservaciones_activas: true};

// cache(): el layout y la página piden los ajustes en la misma visita, pero se consultan una sola vez.
export const getAjustes = cache(async (): Promise<Ajustes> => {
    const db = getSupabasePublic();
    if (!db) return PREDETERMINADOS;
    const {data, error} = await db.from("ajustes").select("reservaciones_activas").maybeSingle();
    return error || !data ? PREDETERMINADOS : data;
});
