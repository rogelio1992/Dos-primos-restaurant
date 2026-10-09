import Link from "next/link";
import {getSupabasePublic} from "../../lib/supabase-public";
import {Categoria, Platillo, dinero, promedio} from "../../lib/restaurante";
import {getAjustes} from "../../lib/ajustes";
import Estrellas from "../estrellas";

export const dynamic = "force-dynamic";
export const metadata = {title: "Menú | Dos Primos"};

export default async function Menu() {
    let categorias: Categoria[] = [], platillos: Omit<Platillo, "destacado">[] = [];
    // Estrellas publicadas de cada platillo, para mostrar su promedio.
    const notas: Record<number, number[]> = {};
    const db = getSupabasePublic();
    if (db) {
        const [c, p, r] = await Promise.all([
            db.from("categorias").select("id,nombre,orden").order("orden").order("nombre"),
            db.from("platillos").select("id,categoria_id,nombre,descripcion,precio,foto_url,disponible,orden").eq("disponible", true).order("orden").order("nombre"),
            db.from("resenas").select("platillo_id,estrellas").eq("estado", "publicada").not("platillo_id", "is", null)
        ]);
        if (!c.error && c.data) categorias = c.data;
        if (!p.error && p.data) platillos = p.data;
        if (!r.error && r.data) for (const {platillo_id, estrellas} of r.data) (notas[platillo_id] ??= []).push(estrellas);
    }
    const conPlatillos = categorias.filter(c => platillos.some(p => p.categoria_id === c.id));
    return <main className="section">
        <p className="eyebrow">NUESTRO MENÚ</p>
        <h1>Menú</h1>
        {conPlatillos.length > 0 && <nav className="chips" aria-label="Categorías">{conPlatillos.map(c => <a key={c.id} href={`#cat-${c.id}`}>{c.nombre}</a>)}</nav>}
        {conPlatillos.map((c, i) => <section key={c.id} id={`cat-${c.id}`} className="category">
            <h2><span className="cat-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{c.nombre}</h2>
            <div className="dishes">{platillos.filter(p => p.categoria_id === c.id).map(p => <article key={p.id} className="dish">
                {p.foto_url && <img src={p.foto_url} alt={p.nombre} loading="lazy"/>}
                <div><div className="dish-title"><h3>{p.nombre}</h3><span>{dinero(p.precio)}</span></div>{p.descripcion && <p>{p.descripcion}</p>}
                    <div className="dish-nota">{notas[p.id] ? <><Estrellas valor={promedio(notas[p.id])}/><small>{promedio(notas[p.id]).toFixed(1)} ({notas[p.id].length})</small></> : null}<Link href={`/resenas?platillo=${p.id}`}>Opinar</Link></div>
                </div>
            </article>)}</div>
        </section>)}
        {!conPlatillos.length && <p className="empty">El menú se está preparando.{(await getAjustes()).reservaciones_activas && <> Mientras tanto, <Link href="/reservar">reserva tu mesa</Link>.</>}</p>}
    </main>;
}
