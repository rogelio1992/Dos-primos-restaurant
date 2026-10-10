"use client";
import {useCallback, useEffect, useState} from "react";
import {Eye, EyeOff, Inbox, MessageSquareReply, Send, Store, Trash2, Undo2, UtensilsCrossed} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {cn} from "@/lib/utils";
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
        // Una respuesta escrita sin guardar se guarda junto con el cambio; si no, se perdería al recargar la lista.
        const respuesta = (respuestas[r.id] ?? "").trim().slice(0, 600);
        const cambioRespuesta = respuesta !== r.respuesta ? {respuesta, respondida_at: respuesta ? new Date().toISOString() : null} : {};
        const {error} = await db.from("resenas").update({estado, ...cambioRespuesta}).eq("id", r.id);
        if (error) return avisar("No se pudo cambiar la reseña.");
        const conRespuesta = respuesta && respuesta !== r.respuesta ? " con tu respuesta" : "";
        avisar(estado === "publicada" ? `Reseña publicada${conRespuesta}: ya se ve en el sitio.` : estado === "oculta" ? "Reseña oculta: ya no se ve en el sitio." : "Reseña devuelta a pendientes.");
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

    return <section className="flex flex-col gap-4">
        <div role="tablist" aria-label="Filtrar reseñas" className="inline-flex w-fit gap-1 rounded-full border bg-muted p-1">
            {(Object.keys(FILTROS) as Filtro[]).map(f => <button key={f} role="tab" aria-selected={f === filtro} onClick={() => setFiltro(f)}
                className={cn("inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", f === filtro ? "bg-fuego text-white shadow" : "text-muted-foreground hover:text-foreground")}>
                {FILTROS[f]}
                {conteo[f] ? <Badge className={cn("h-5 min-w-5 px-1.5 tabular-nums", f === filtro ? "bg-white/20 text-white" : f === "pendiente" ? "bg-rojo-texto text-white" : "bg-secondary text-secondary-foreground")}>{conteo[f]}</Badge> : null}
            </button>)}
        </div>

        {lista.map(r => {
            const borrador = respuestas[r.id] ?? "";
            return <Card key={r.id} className="gap-4 py-5">
                <CardHeader className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5">
                    <Estrellas valor={r.estrellas}/>
                    <span className="font-semibold">{r.nombre}</span>
                    <Badge variant="outline" className="gap-1 text-muted-foreground">{r.platillos ? <UtensilsCrossed/> : <Store/>}{r.platillos?.nombre ?? "El lugar"}</Badge>
                    <span className="ml-auto text-xs text-muted-foreground">{fechaCorta(r.created_at)}</span>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-5">
                    <p className="m-0 leading-relaxed whitespace-pre-line">{r.comentario}</p>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`respuesta-${r.id}`} className="text-muted-foreground"><MessageSquareReply className="size-3.5"/>Tu respuesta (opcional, se publica debajo de la reseña)</Label>
                        <Textarea id={`respuesta-${r.id}`} maxLength={600} value={borrador} onChange={e => setRespuestas({...respuestas, [r.id]: e.target.value})} placeholder="¡Gracias por visitarnos!…" className="min-h-16 resize-none"/>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {r.estado !== "publicada" && <Button size="sm" onClick={() => cambiarEstado(r, "publicada")}><Eye/>Publicar{borrador.trim() && borrador.trim() !== r.respuesta ? " con respuesta" : ""}</Button>}
                        {borrador !== r.respuesta && r.estado === "publicada" && <Button size="sm" onClick={() => responder(r)}><Send/>Guardar respuesta</Button>}
                        {borrador !== r.respuesta && r.estado !== "publicada" && <Button size="sm" variant="secondary" onClick={() => responder(r)}>Guardar respuesta</Button>}
                        {r.estado !== "oculta" && <Button size="sm" variant="outline" onClick={() => cambiarEstado(r, "oculta")}><EyeOff/>Ocultar</Button>}
                        {r.estado === "oculta" && <Button size="sm" variant="outline" onClick={() => cambiarEstado(r, "pendiente")}><Undo2/>A pendientes</Button>}
                        <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => borrar(r)}><Trash2/>Borrar</Button>
                    </div>
                </CardContent>
            </Card>;
        })}
        {!lista.length && <Card className="items-center gap-2 border-dashed py-10 text-center text-muted-foreground">
            <Inbox className="size-8"/>
            <p className="m-0">{filtro === "pendiente" ? "No hay reseñas por revisar." : `No hay reseñas ${FILTROS[filtro].toLowerCase()}.`}</p>
        </Card>}
    </section>;
}
