import Link from "next/link";
import {getSupabasePublic} from "../lib/supabase-public";
import {Platillo, RESTAURANTE, dinero, whatsappLink} from "../lib/restaurante";
import Brasas from "./brasas";
import Mapa from "./mapa";
import {getAjustes} from "../lib/ajustes";

export const dynamic = "force-dynamic";

const FRASES = ["A la parrilla", "Hecho al momento", "Para compartir", "Sabor de casa", "Fuego lento"];

export default async function Inicio() {
    const whatsapp = whatsappLink(RESTAURANTE.whatsapp);
    const {reservaciones_activas} = await getAjustes();
    let destacados: Platillo[] = [];
    const db = getSupabasePublic();
    if (db) {
        const {data, error} = await db.from("platillos").select("id,categoria_id,nombre,descripcion,precio,foto_url,disponible,destacado,orden").eq("disponible", true).eq("destacado", true).order("orden").order("nombre").limit(RESTAURANTE.maxDestacados);
        if (!error && data) destacados = data;
    }
    const franja = [...FRASES, ...FRASES];
    return <main>
        <section className="hero-fuego">
            <Brasas/>
            <div className="hero-inner">
                <div className="hero-texto">
                    <p className="eyebrow">BIENVENIDOS A {RESTAURANTE.nombre.toUpperCase()}</p>
                    <h1 className="titulo-fuego">{RESTAURANTE.lema}</h1>
                    <p className="intro">Platillos hechos al momento, en un lugar para venir con la familia y los amigos.</p>
                    <div className="actions">{reservaciones_activas ? <><Link className="button" href="/reservar">Reservar mesa</Link><Link className="text-link" href="/menu">Ver el menú →</Link></> : <Link className="button" href="/menu">Ver el menú</Link>}</div>
                </div>
                <div className="hero-marca"><img src="/logo.webp" alt="" width={344} height={193}/></div>
            </div>
        </section>

        <div className="franja" aria-hidden="true"><div>{franja.map((f, i) => <span key={i}>{f}<b>✦</b></span>)}</div></div>

        {destacados.length > 0 && <section className="section destacados">
            <div className="destacados-head"><p className="eyebrow">DEL FUEGO A TU MESA</p><h2>Los favoritos de la casa</h2><Link className="text-link" href="/menu">Ver todo el menú →</Link></div>
            <div className="destacados-grid">{destacados.map((p, i) => <article key={p.id} className="destacado">
                <span className="destacado-num">0{i + 1}</span>
                {p.foto_url && <img src={p.foto_url} alt={p.nombre} loading="lazy"/>}
                <h3>{p.nombre}</h3>
                {p.descripcion && <p>{p.descripcion}</p>}
                <strong>{dinero(p.precio)}</strong>
            </article>)}</div>
        </section>}

        <section className="section visitanos" id="visitanos">
            <article className="tarjeta"><p className="eyebrow">HORARIO</p><h2>{RESTAURANTE.horario}</h2></article>
            {RESTAURANTE.direccion && <article className="tarjeta"><p className="eyebrow">DÓNDE ESTAMOS</p><h2>{RESTAURANTE.direccion}</h2><a className="text-link" href={RESTAURANTE.mapa} target="_blank" rel="noreferrer">Cómo llegar →</a></article>}
            {whatsapp && <article className="tarjeta"><p className="eyebrow">CONTACTO</p><h2>Escríbenos</h2><a className="text-link" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp →</a></article>}
            {reservaciones_activas ? <Link href="/reservar" className="tarjeta tarjeta-fuego"><p className="eyebrow">¿VIENEN EN GRUPO?</p><h2>Aparta tu mesa</h2><span>Reservar →</span></Link>
                : <Link href="/menu" className="tarjeta tarjeta-fuego"><p className="eyebrow">¿YA TIENES HAMBRE?</p><h2>Mira el menú</h2><span>Ver el menú →</span></Link>}
        </section>
        <div className="section">
            <Mapa/>
        </div>
    </main>;
}
