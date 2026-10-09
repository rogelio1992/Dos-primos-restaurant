import Link from "next/link";
import {getSupabasePublic} from "../../lib/supabase-public";
import {Categoria, Platillo, dinero} from "../../lib/restaurante";

export const dynamic = "force-dynamic";
export const metadata = {title: "Menú | Dos Primos"};

export default async function Menu() {
    let categorias: Categoria[] = [], platillos: Platillo[] = [];
    const db = getSupabasePublic();
    if (db) {
        const [c, p] = await Promise.all([
            db.from("categorias").select("id,nombre,orden").order("orden").order("nombre"),
            db.from("platillos").select("id,categoria_id,nombre,descripcion,precio,foto_url,disponible,orden").eq("disponible", true).order("orden").order("nombre")
        ]);
        if (!c.error && c.data) categorias = c.data;
        if (!p.error && p.data) platillos = p.data;
    }
    const conPlatillos = categorias.filter(c => platillos.some(p => p.categoria_id === c.id));
    return <main className="section">
        <p className="eyebrow">NUESTRO MENÚ</p>
        <h1>Menú</h1>
        {conPlatillos.length > 0 && <nav className="chips" aria-label="Categorías">{conPlatillos.map(c => <a key={c.id} href={`#cat-${c.id}`}>{c.nombre}</a>)}</nav>}
        {conPlatillos.map(c => <section key={c.id} id={`cat-${c.id}`} className="category">
            <h2>{c.nombre}</h2>
            <div className="dishes">{platillos.filter(p => p.categoria_id === c.id).map(p => <article key={p.id} className="dish">
                {p.foto_url && <img src={p.foto_url} alt={p.nombre} loading="lazy"/>}
                <div><div className="dish-title"><h3>{p.nombre}</h3><span>{dinero(p.precio)}</span></div>{p.descripcion && <p>{p.descripcion}</p>}</div>
            </article>)}</div>
        </section>)}
        {!conPlatillos.length && <p className="empty">El menú se está preparando. Mientras tanto, <Link href="/reservar">reserva tu mesa</Link>.</p>}
    </main>;
}
