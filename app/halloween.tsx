import type {CSSProperties, ReactNode} from "react";
import {Clock, MapPin} from "lucide-react";
import {RESTAURANTE} from "../lib/restaurante";

// Decoración de Halloween: solo SVG y CSS en el propio HTML, sin imágenes ni JS que descargar.
const MURCIELAGO = "M0 6C3 2 6 2 8 5 9 3 10 3 11 4L12 2 13 4C14 3 15 3 16 5 18 2 21 2 24 6 21 5 19 6 18 9 16 7 14 8 12 10 10 8 8 7 6 9 5 6 3 5 0 6Z";

// Telaraña de esquina: hilos desde la esquina y vueltas entre ellos. Coordenadas fijas para que servidor y navegador coincidan.
const ANGULOS = [0, 18, 36, 54, 72, 90].map(g => g * Math.PI / 180);
const punto = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
const TELA = [
    ...ANGULOS.map(a => `M0 0L${punto(118, a)}`),
    ...[28, 52, 78, 104].map(r => ANGULOS.slice(1).map((a, i) => `${i ? "" : `M${punto(r, ANGULOS[0])}`}Q${punto(r * .82, (a + ANGULOS[i]) / 2)} ${punto(r, a)}`).join(""))
].join("");

export function Telarana({className = ""}: {className?: string}) {
    return <svg className={`telarana ${className}`} viewBox="0 0 120 120" aria-hidden="true">
        <path d={TELA} fill="none" stroke="currentColor" strokeWidth=".8"/>
        <line x1="74" y1="0" x2="74" y2="58" stroke="currentColor" strokeWidth=".6"/>
        <circle cx="74" cy="62" r="4.5" fill="currentColor"/><circle cx="74" cy="56.5" r="2.6" fill="currentColor"/>
    </svg>;
}

export function Murcielagos() {
    return <div className="murcielagos" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <svg key={i} viewBox="0 0 24 11" style={{
        "--y": `${12 + (i * 17) % 55}%`,
        "--t": `${11 + (i * 5) % 8}s`,
        "--delay": `${-i * 3.7}s`,
        "--s": `${22 + (i * 9) % 20}px`
    } as CSSProperties}><path d={MURCIELAGO}/></svg>)}</div>;
}

export function AvisoHalloween() {
    return <p className="aviso-halloween"><span aria-hidden="true">🎃</span> ¡Halloween se vive en {RESTAURANTE.nombre}! · hasta el 31 de octubre <span aria-hidden="true">🦇</span></p>;
}

// Lo que dice el cartel de la campaña. El horario y el lugar son los del evento, no los de RESTAURANTE.
export const CAMPANA = {
    cinta: "Sabor, playa y diversión",
    oferta: ["Pizzas", "Hamburguesas", "Picaderas"],
    horario: "12:00 PM – 12:00 AM",
    lugar: "Playa La Caridad",
    frases: ["Halloween en Dos Primos", "Pizzas", "Hamburguesas", "Picaderas", "Sabor, playa y diversión"]
};

// Calabaza tallada con la cara encendida. idDegradado único por calabaza: dos <defs> con el mismo id chocan.
function Calabaza({idDegradado, className}: {idDegradado: string; className: string}) {
    return <svg className={`calabaza ${className}`} viewBox="0 0 100 90" aria-hidden="true">
        <defs><radialGradient id={idDegradado} cx=".5" cy=".55" r=".6"><stop offset="0" stopColor="#ffb347"/><stop offset=".65" stopColor="#e8590c"/><stop offset="1" stopColor="#7c2d12"/></radialGradient></defs>
        <path d="M47 18C46 10 49 4 56 1l3 3c-4 2-6 7-5 14Z" fill="#3f3a1a"/>
        <ellipse cx="30" cy="54" rx="24" ry="33" fill={`url(#${idDegradado})`}/>
        <ellipse cx="70" cy="54" rx="24" ry="33" fill={`url(#${idDegradado})`}/>
        <ellipse cx="50" cy="54" rx="25" ry="35" fill={`url(#${idDegradado})`}/>
        <path className="calabaza-cara" fill="#ffd43b" d="M27 45 37 31l7 15Zm46 0-10-14-7 15ZM47 54l3-7 3 7ZM24 62q26 22 52 0l-6 3-3 6-6-5-5 8-6-7-6 7-5-8-6 5-3-6Z"/>
    </svg>;
}

export function HeroHalloween({acciones}: {acciones: ReactNode}) {
    return <div className="hero-texto hero-halloween">
        <h1><span className="hw-grande">¡Halloween</span> <span className="hw-chica">se vive en {RESTAURANTE.nombre}!</span></h1>
        <p className="hw-cinta">{CAMPANA.cinta}</p>
        <p className="hw-oferta">{CAMPANA.oferta.map((o, i) => <span key={o}>{i > 0 && <b aria-hidden="true">•</b>}{o}</span>)}</p>
        <ul className="hw-datos">
            <li><Clock aria-hidden="true"/>{CAMPANA.horario}</li>
            <li><MapPin aria-hidden="true"/>{CAMPANA.lugar}</li>
        </ul>
        <div className="actions">{acciones}</div>
    </div>;
}

// Calabazas a los lados del hero y telaraña en la esquina de abajo, como en el cartel.
export function DecoracionHero() {
    return <>
        <Calabaza idDegradado="calabaza-a" className="calabaza-izq"/>
        <Calabaza idDegradado="calabaza-b" className="calabaza-der"/>
        <Telarana className="telarana-hero"/>
    </>;
}
