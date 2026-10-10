import {getSupabasePublic} from "../../lib/supabase-public";
import {RESENA_COLUMNAS, Resena, promedio} from "../../lib/restaurante";
import {MessageSquareHeart, Star} from "lucide-react";
import {Card, CardContent} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import Estrellas from "../estrellas";
import FormularioResena from "./formulario";
import TarjetaResena from "./tarjeta";
import TransicionPagina from "../transicion-pagina";

export const dynamic = "force-dynamic";
export const metadata = {title: "Reseñas | Dos Primos"};

export default async function Resenas({searchParams}: {searchParams: Promise<{platillo?: string}>}) {
    const {platillo} = await searchParams;
    let resenas: Resena[] = [], platillos: {id: number; nombre: string}[] = [], todas: number[] = [];
    const db = getSupabasePublic();
    if (db) {
        const [r, p, e] = await Promise.all([
            db.from("resenas").select(RESENA_COLUMNAS).eq("estado", "publicada").order("created_at", {ascending: false}).limit(60),
            db.from("platillos").select("id,nombre").eq("disponible", true).order("nombre"),
            // Solo las estrellas de todas las publicadas, para el promedio y la gráfica (la lista se corta en 60).
            db.from("resenas").select("estrellas").eq("estado", "publicada")
        ]);
        if (!r.error && r.data) resenas = r.data as unknown as Resena[];
        if (!p.error && p.data) platillos = p.data;
        if (!e.error && e.data) todas = e.data.map(x => x.estrellas);
    }
    const media = promedio(todas);
    const inicial = platillos.some(p => String(p.id) === platillo) ? String(platillo) : "";
    return <TransicionPagina><main className="section">
        <p className="eyebrow">LO QUE DICEN</p>
        <h1>Reseñas</h1>
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(320px,400px)_1fr]">
            {/* Celular: resumen → reseñas → formulario (contents deja que los hijos del aside se ordenen en la grilla). Escritorio: resumen y formulario a la izquierda. */}
            <aside className="contents lg:sticky lg:top-5 lg:flex lg:flex-col lg:gap-5">
                {todas.length > 0 && <Card className="order-1 gap-4 py-6 lg:order-none">
                    <CardContent className="flex flex-col gap-4 px-6">
                        <div className="flex items-center gap-4">
                            <strong className="font-display text-6xl leading-none font-normal texto-fuego">{media.toFixed(1)}</strong>
                            <div className="flex flex-col gap-1"><Estrellas valor={media} grande/><span className="text-sm text-muted-foreground">{todas.length} {todas.length === 1 ? "reseña" : "reseñas"}</span></div>
                        </div>
                        <Separator/>
                        <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Reseñas por estrellas">{[5, 4, 3, 2, 1].map(n => {
                            const cuantas = todas.filter(x => x === n).length;
                            return <li key={n} className="grid grid-cols-[2.25rem_1fr_1.75rem] items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">{n}<Star className="size-3.5 fill-brasa text-brasa"/></span>
                                <span className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-fuego" style={{width: `${(cuantas / todas.length) * 100}%`}}/></span>
                                <span className="text-right tabular-nums">{cuantas}</span>
                            </li>;
                        })}</ul>
                    </CardContent>
                </Card>}
                <div className="order-3 lg:order-none"><FormularioResena platillos={platillos} inicial={inicial}/></div>
            </aside>
            <div className="order-2 flex flex-col gap-4 lg:order-none">
                {resenas.map(r => <TarjetaResena key={r.id} r={r}/>)}
                {!resenas.length && <Card className="items-center gap-3 border-dashed py-12 text-center">
                    <MessageSquareHeart className="size-10 text-rojo-texto"/>
                    <p className="m-0 text-muted-foreground">Todavía no hay reseñas publicadas.<br/>¡Sé el primero en contarnos qué te pareció!</p>
                </Card>}
            </div>
        </div>
    </main></TransicionPagina>;
}
