import Estrellas from "../estrellas";
import {RESTAURANTE, Resena, fechaCorta} from "../../lib/restaurante";

export default function TarjetaResena({r}: {r: Resena}) {
    return <article className="resena">
        <div className="resena-cabeza">
            <span className="resena-inicial" aria-hidden="true">{r.nombre.charAt(0).toUpperCase()}</span>
            <div><b>{r.nombre}</b><small>{fechaCorta(r.created_at)} · {r.platillos?.nombre ?? "El lugar"}</small></div>
            <Estrellas valor={r.estrellas}/>
        </div>
        <p className="resena-texto">{r.comentario}</p>
        {r.respuesta && <div className="resena-respuesta"><b>Respuesta de {RESTAURANTE.nombre}</b><p>{r.respuesta}</p></div>}
    </article>;
}
