import type {Metadata} from "next";
import Link from "next/link";
import {RESTAURANTE} from "../lib/restaurante";
import {Archivo_Black} from "next/font/google";
import "./globals.css";

// Next descarga la fuente al compilar y la sirve desde el propio sitio (solo caracteres latinos): sin pedir nada a Google en cada visita.
const titulos = Archivo_Black({weight: "400", subsets: ["latin"], display: "swap", variable: "--font-titulos"});

export const metadata: Metadata = {
    title: `${RESTAURANTE.nombre} | Restaurante`,
    description: `${RESTAURANTE.lema}. Conoce nuestro menú y reserva tu mesa.`
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
    return <html lang="es" className={titulos.variable}><body>
        <header className="header">
            <Link href="/" className="brand"><img src="/logo.webp" alt={RESTAURANTE.nombre} width={344} height={193}/></Link>
            <nav aria-label="Navegación principal"><Link href="/menu">Menú</Link><Link href="/#visitanos">Visítanos</Link><Link className="button" href="/reservar">Reservar mesa</Link></nav>
        </header>
        {children}
        <footer className="footer"><span>{RESTAURANTE.nombre} · {RESTAURANTE.lema}</span><Link href="/admin/login">Acceso administración</Link></footer>
    </body></html>;
}
