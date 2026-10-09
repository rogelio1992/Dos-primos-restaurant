import {getSupabasePublic} from "../../lib/supabase-public";
import {RESENA_COLUMNAS, Resena, promedio} from "../../lib/restaurante";
import Estrellas from "../estrellas";
import FormularioResena from "./formulario";
import TarjetaResena from "./tarjeta";

export const dynamic = "force-dynamic";
export const metadata = {title: "Reseñas | Dos Primos"};

export default async function Resenas({searchParams}: {searchParams: {platillo?: string}}) {
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
    const inicial = platillos.some(p => String(p.id) === searchParams.platillo) ? String(searchParams.platillo) : "";
    return <main className="section">
        <p className="eyebrow">LO QUE DICEN</p>
        <h1>Reseñas</h1>
        <div className="resenas-layout">
            <aside>
                {todas.length > 0 && <div className="resumen card">
                    <div className="resumen-nota"><strong>{media.toFixed(1)}</strong><div><Estrellas valor={media} grande/><small>{todas.length} {todas.length === 1 ? "reseña" : "reseñas"}</small></div></div>
                    {[5, 4, 3, 2, 1].map(n => {
                        const cuantas = todas.filter(x => x === n).length;
                        return <div key={n} className="barra"><span>{n} ★</span><i><b style={{width: `${(cuantas / todas.length) * 100}%`}}/></i><span>{cuantas}</span></div>;
                    })}
                </div>}
                <FormularioResena platillos={platillos} inicial={inicial}/>
            </aside>
            <div className="resenas-lista">
                {resenas.map(r => <TarjetaResena key={r.id} r={r}/>)}
                {!resenas.length && <p className="empty">Todavía no hay reseñas publicadas. ¡Sé el primero en contarnos qué te pareció!</p>}
            </div>
        </div>
    </main>;
}
