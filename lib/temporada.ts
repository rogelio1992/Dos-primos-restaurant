import {hoy} from "./restaurante";

// Temas por temporada, por fecha de Cuba ("MM-DD", ambos días incluidos). Se activan y se quitan solos cada año.
const TEMPORADAS = {
    halloween: {desde: "10-24", hasta: "10-31"}
} as const;

export type Temporada = keyof typeof TEMPORADAS;

export function temporadaActual(): Temporada | null {
    const dia = hoy().slice(5);
    const activa = (Object.keys(TEMPORADAS) as Temporada[]).find(t => dia >= TEMPORADAS[t].desde && dia <= TEMPORADAS[t].hasta);
    return activa ?? null;
}
