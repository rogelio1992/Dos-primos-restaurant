import {redirect} from "next/navigation";
import {getAjustes} from "../../lib/ajustes";
import Formulario from "./formulario";
import TransicionPagina from "../transicion-pagina";

export const dynamic = "force-dynamic";

// Con las reservaciones desactivadas en /admin, esta página no existe para el público: enlaces viejos llevan al inicio.
export default async function Reservar() {
    if (!(await getAjustes()).reservaciones_activas) redirect("/");
    return <TransicionPagina><Formulario/></TransicionPagina>;
}
