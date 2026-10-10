"use client";
import {FormEvent, useState} from "react";

// Ajusta la altura del comentario a lo escrito (para navegadores sin field-sizing de CSS).
function ajustarAlto(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
}

export default function FormularioResena({platillos, inicial}: {platillos: {id: number; nombre: string}[]; inicial: string}) {
    const [estrellas, setEstrellas] = useState(0), [sobre, setSobre] = useState(inicial);
    const [mensaje, setMensaje] = useState(""), [enviando, setEnviando] = useState(false), [listo, setListo] = useState(false);
    const TEXTOS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "¡Excelente!"];

    async function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (enviando) return;
        if (!estrellas) return setMensaje("Elige de 1 a 5 estrellas.");
        const form = event.currentTarget;
        setEnviando(true); setMensaje("");
        try {
            const datos = {...Object.fromEntries(new FormData(form)), estrellas, platillo_id: sobre || null};
            const response = await fetch("/api/resenas", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(datos)});
            const result = await response.json();
            if (response.ok && result.ok) { form.reset(); form.querySelectorAll("textarea").forEach(t => { t.style.height = ""; }); setEstrellas(0); setListo(true); setMensaje("¡Gracias por tu reseña! La publicaremos en cuanto la revisemos."); }
            else setMensaje(result.error || "No se pudo enviar la reseña.");
        } catch { setMensaje("No se pudo conectar. Inténtalo nuevamente."); }
        finally { setEnviando(false); }
    }

    return <form className="card form" onSubmit={enviar} onChange={() => listo && setListo(false)}>
        <h2>Deja tu reseña</h2>
        <label>¿Sobre qué quieres opinar?<select value={sobre} onChange={e => setSobre(e.target.value)}>
            <option value="">El lugar en general</option>
            {platillos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select></label>
        <fieldset className="elegir-estrellas">
            <legend>Tu calificación</legend>
            <div>{[1, 2, 3, 4, 5].map(n => <label key={n} className={n <= estrellas ? "on" : ""}>
                <input type="radio" name="estrellas-radio" value={n} checked={estrellas === n} onChange={() => setEstrellas(n)}/>
                <span aria-hidden="true">★</span><span className="sr-only">{n} {n === 1 ? "estrella" : "estrellas"}</span>
            </label>)}</div>
            <small>{TEXTOS[estrellas] || "Toca las estrellas"}</small>
        </fieldset>
        <label>Tu nombre<input required name="nombre" maxLength={60} placeholder="Como quieres que aparezca"/></label>
        <label>Comentario<textarea className="auto-alto" required name="comentario" minLength={5} maxLength={600} rows={4} placeholder="¿Qué te gustó? ¿Qué podemos mejorar?" onInput={e => ajustarAlto(e.currentTarget)}/></label>
        <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
        <button className="button" disabled={enviando}>{enviando ? "Enviando…" : "Enviar reseña"}</button>
        {mensaje && <p className={listo ? "notice ok" : "notice"} role="status">{mensaje}</p>}
    </form>;
}
