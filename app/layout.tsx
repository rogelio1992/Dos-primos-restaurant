import type {Metadata} from "next";
import Link from "next/link";
import {RESTAURANTE} from "../lib/restaurante";
import {getAjustes} from "../lib/ajustes";
import Analitica from "./analitica";
import {Archivo_Black} from "next/font/google";
import "./globals.css";

// Next descarga la fuente al compilar y la sirve desde el propio sitio (solo caracteres latinos): sin pedir nada a Google en cada visita.
const titulos = Archivo_Black({weight: "400", subsets: ["latin"], display: "swap", variable: "--font-titulos"});

export const metadata: Metadata = {
    title: `${RESTAURANTE.nombre} | Restaurante`,
    description: `${RESTAURANTE.lema}. Conoce nuestro menú y visítanos.`
};

export default async function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
    const {reservaciones_activas} = await getAjustes();
    return <html lang="es" className={titulos.variable} data-scroll-behavior="smooth"><body>
        <header className="header" style={{viewTransitionName: "encabezado"}}>
            <Link href="/" className="brand"><img src="/logo.webp" alt={RESTAURANTE.nombre} width={344} height={193}/></Link>
            <nav aria-label="Navegación principal"><Link href="/menu">Menú</Link><Link href="/#visitanos">Visítanos</Link><Link href="/resenas">Reseñas</Link>{reservaciones_activas && <Link className="button" href="/reservar">Reservar mesa</Link>}</nav>
        </header>
        {children}
        {/* Sin enlace al panel: el personal entra escribiendo /admin. */}
        <footer className="footer"><span>{RESTAURANTE.nombre} · {RESTAURANTE.lema}</span></footer>
        <Analitica/>
    </body></html>;
}
