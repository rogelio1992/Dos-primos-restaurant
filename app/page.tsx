import Link from "next/link";
import {RESTAURANTE, whatsappLink} from "../lib/restaurante";

export default function Inicio() {
    const whatsapp = whatsappLink(RESTAURANTE.whatsapp);
    return <main>
        <section className="hero">
            <p className="eyebrow">BIENVENIDOS A {RESTAURANTE.nombre.toUpperCase()}</p>
            <h1>{RESTAURANTE.lema}</h1>
            <p className="intro">Platillos hechos al momento, en un lugar para venir con la familia y los amigos.</p>
            <div className="actions"><Link className="button" href="/reservar">Reservar mesa</Link><Link className="text-link" href="/menu">Ver el menú →</Link></div>
        </section>
        <section className="section visit" id="visitanos">
            <div><h2>Horario</h2><p>{RESTAURANTE.horario}</p></div>
            {RESTAURANTE.direccion && <div><h2>Dónde estamos</h2><p>{RESTAURANTE.direccion}</p><a className="text-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(RESTAURANTE.direccion)}`} target="_blank" rel="noreferrer">Cómo llegar →</a></div>}
            {whatsapp && <div><h2>Contacto</h2><a className="text-link" href={whatsapp} target="_blank" rel="noreferrer">Escríbenos por WhatsApp →</a></div>}
        </section>
    </main>;
}
