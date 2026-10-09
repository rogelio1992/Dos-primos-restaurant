import Link from "next/link";
import {getSupabasePublic} from "../lib/supabase-public";
import {FotoGaleria, Platillo, RESENA_COLUMNAS, RESTAURANTE, Resena, dinero, promedio, whatsappLink} from "../lib/restaurante";
import Brasas from "./brasas";
import Mapa from "./mapa";
import Galeria from "./galeria";
import Estrellas from "./estrellas";
import TarjetaResena from "./resenas/tarjeta";
import {getAjustes} from "../lib/ajustes";
import TransicionPagina from "./transicion-pagina";

export const dynamic = "force-dynamic";

const FRASES = ["A la parrilla", "Hecho al momento", "Para compartir", "Sabor de casa", "Fuego lento"];

export default async function Inicio() {
    const whatsapp = whatsappLink(RESTAURANTE.whatsapp);
    const {reservaciones_activas} = await getAjustes();
    let destacados: Platillo[] = [], fotos: FotoGaleria[] = [], resenas: Resena[] = [], estrellas: number[] = [];
    const db = getSupabasePublic();
    if (db) {
        const {data, error} = await db.from("platillos").select("id,categoria_id,nombre,descripcion,precio,foto_url,disponible,destacado,orden").eq("disponible", true).eq("destacado", true).order("orden").order("nombre").limit(RESTAURANTE.maxDestacados);
        if (!error && data) destacados = data;
        const galeria = await db.from("galeria").select("id,foto_url,miniatura_url,descripcion,orden").order("orden").order("id").limit(RESTAURANTE.maxGaleria);
        if (!galeria.error && galeria.data) fotos = galeria.data;
        const [r, e] = await Promise.all([
            db.from("resenas").select(RESENA_COLUMNAS).eq("estado", "publicada").order("created_at", {ascending: false}).limit(RESTAURANTE.resenasPortada),
            db.from("resenas").select("estrellas").eq("estado", "publicada")
        ]);
        if (!r.error && r.data) resenas = r.data as unknown as Resena[];
        if (!e.error && e.data) estrellas = e.data.map(x => x.estrellas);
    }
    const franja = [...FRASES, ...FRASES];
    return <TransicionPagina><main>
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

        {fotos.length > 0 && <section className="section seccion-galeria" id="el-lugar">
            <div className="destacados-head"><p className="eyebrow">EL LUGAR</p><h2>Ven a conocernos</h2></div>
            <Galeria fotos={fotos}/>
        </section>}

        {resenas.length > 0 && <section className="section seccion-resenas">
            <div className="destacados-head">
                <p className="eyebrow">LO QUE DICEN</p><h2>Nuestros clientes</h2>
                <div className="nota-portada"><strong>{promedio(estrellas).toFixed(1)}</strong><Estrellas valor={promedio(estrellas)}/><small>{estrellas.length} {estrellas.length === 1 ? "reseña" : "reseñas"}</small><Link className="text-link" href="/resenas">Ver todas y opinar →</Link></div>
            </div>
            <div className="resenas-portada">{resenas.map(r => <TarjetaResena key={r.id} r={r}/>)}</div>
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
    </main></TransicionPagina>;
}
