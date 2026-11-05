import {ChevronDown, Plus} from "lucide-react";
import {Agrego, dinero} from "../../lib/restaurante";

// "Queso (50g)" → nombre "Queso" y porción "50g", para mostrar la porción aparte y más tenue.
const separar = (texto: string) => {
    const m = texto.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    return m ? {nombre: m[1], porcion: m[2]} : {nombre: texto, porcion: ""};
};

// Desplegable de agregos de una categoría. <details> nativo: abre y cierra sin JavaScript, con teclado y lector de pantalla.
export default function Agregos({categoria, agregos}: {categoria: string; agregos: Pick<Agrego, "id" | "nombre" | "precio">[]}) {
    const desde = Math.min(...agregos.map(a => a.precio));
    return <details className="agregos" aria-label={`Agregos para ${categoria}`}>
        <summary>
            <span className="agregos-icono" aria-hidden="true"><Plus/></span>
            <span className="agregos-titulo">
                <b>Agrégale lo que quieras</b>
                <small>{agregos.length} {agregos.length === 1 ? "opción" : "opciones"} · desde {dinero(desde)}</small>
            </span>
            <span className="agregos-flecha" aria-hidden="true"><ChevronDown/></span>
        </summary>
        <ul>{agregos.map(a => {
            const {nombre, porcion} = separar(a.nombre);
            return <li key={a.id}>
                <span className="agrego-nombre">{nombre}{porcion && <small>{porcion}</small>}</span>
                <span className="agrego-puntos" aria-hidden="true"/>
                <b>+{dinero(a.precio)}</b>
            </li>;
        })}</ul>
    </details>;
}
