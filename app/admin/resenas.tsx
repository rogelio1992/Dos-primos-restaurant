"use client";
import {useCallback, useEffect, useState} from "react";
import {getSupabaseClient} from "../../lib/supabase";
import {RESENA_COLUMNAS, Resena, fechaCorta} from "../../lib/restaurante";
import Estrellas from "../estrellas";

type Filtro = "pendiente" | "publicada" | "oculta";
const FILTROS: Record<Filtro, string> = {pendiente: "Pendientes", publicada: "Publicadas", oculta: "Ocultas"};

export default function ResenasEditor({avisar}: {avisar: (texto: string) => void}) {
    const db = getSupabaseClient()!;
    const [filtro, setFiltro] = useState<Filtro>("pendiente");
    const [lista, setLista] = useState<Resena[]>([]), [conteo, setConteo] = useState<Record<string, number>>({});
    const [respuestas, setRespuestas] = useState<Record<number, string>>({});

    const cargar = useCallback(async () => {
        const [r, todos] = await Promise.all([
            db.from("resenas").select(RESENA_COLUMNAS).eq("estado", filtro).order("created_at", {ascending: false}),
            db.from("resenas").select("estado")
        ]);
        if (r.error || todos.error) return avisar("No se pudieron cargar las reseñas. Revisa que el SQL de reseñas esté ejecutado en Supabase.");
        const datos = r.data as unknown as Resena[];
        setLista(datos);
        setRespuestas(Object.fromEntries(datos.map(x => [x.id, x.respuesta])));
        setConteo(todos.data.reduce<Record<string, number>>((c, x) => ({...c, [x.estado]: (c[x.estado] ?? 0) + 1}), {}));
    }, [db, filtro, avisar]);
    useEffect(() => { cargar(); }, [cargar]);

    async function cambiarEstado(r: Resena, estado: Filtro) {
        const {error} = await db.from("resenas").update({estado}).eq("id", r.id);
        if (error) return avisar("No se pudo cambiar la reseña.");
        avisar(estado === "publicada" ? "Reseña publicada: ya se ve en el sitio." : estado === "oculta" ? "Reseña oculta: ya no se ve en el sitio." : "Reseña devuelta a pendientes.");
        cargar();
    }

    async function responder(r: Resena) {
        const respuesta = (respuestas[r.id] ?? "").trim().slice(0, 600);
        const {error} = await db.from("resenas").update({respuesta, respondida_at: respuesta ? new Date().toISOString() : null}).eq("id", r.id);
        if (error) return avisar("No se pudo guardar la respuesta.");
        avisar(respuesta ? (r.estado === "publicada" ? "Respuesta publicada." : "Respuesta guardada. Se verá cuando publiques la reseña.") : "Respuesta borrada.");
        cargar();
    }

    async function borrar(r: Resena) {
        if (!confirm(`¿Borrar para siempre la reseña de ${r.nombre}? Si solo no quieres mostrarla, mejor ocúltala.`)) return;
        const {error} = await db.from("resenas").delete().eq("id", r.id);
        if (error) avisar("No se pudo borrar la reseña."); else cargar();
    }

    return <section>
        <nav className="tabs">{(Object.keys(FILTROS) as Filtro[]).map(f => <button key={f} className={f === filtro ? "active" : ""} onClick={() => setFiltro(f)}>
            {FILTROS[f]} {conteo[f] ? <span className={f === "pendiente" ? "insignia" : ""}>{conteo[f]}</span> : null}
        </button>)}</nav>
        {lista.map(r => <article key={r.id} className="res resena-admin">
            <Estrellas valor={r.estrellas}/>
            <div>
                <b>{r.nombre}</b> · {r.platillos?.nombre ?? "El lugar"} · <small>{fechaCorta(r.created_at)}</small>
                <p>{r.comentario}</p>
                <label>Tu respuesta (opcional, se publica debajo de la reseña)
                    <textarea rows={2} maxLength={600} value={respuestas[r.id] ?? ""} onChange={e => setRespuestas({...respuestas, [r.id]: e.target.value})} placeholder="¡Gracias por visitarnos!…"/>
                </label>
                {(respuestas[r.id] ?? "") !== r.respuesta && <button className="text-link" onClick={() => responder(r)}>Guardar respuesta</button>}
            </div>
            <div className="resena-admin-acciones">
                {r.estado !== "publicada" && <button className="button" onClick={() => cambiarEstado(r, "publicada")}>Publicar</button>}
                {r.estado !== "oculta" && <button className="text-link" onClick={() => cambiarEstado(r, "oculta")}>Ocultar</button>}
                {r.estado === "oculta" && <button className="text-link" onClick={() => cambiarEstado(r, "pendiente")}>A pendientes</button>}
                <button className="text-link danger" onClick={() => borrar(r)}>Borrar</button>
            </div>
        </article>)}
        {!lista.length && <p className="empty">{filtro === "pendiente" ? "No hay reseñas por revisar." : `No hay reseñas ${FILTROS[filtro].toLowerCase()}.`}</p>}
    </section>;
}
