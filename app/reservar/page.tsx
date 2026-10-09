"use client";
import {FormEvent, useEffect, useState} from "react";
import {RESTAURANTE, hoy} from "../../lib/restaurante";

export default function Reservar() {
    const [mensaje, setMensaje] = useState(""), [enviando, setEnviando] = useState(false), [listo, setListo] = useState(false);
    // La página se genera al publicar; la fecha de hoy se calcula en el navegador.
    const [minimo, setMinimo] = useState(""), [fecha, setFecha] = useState("");
    useEffect(() => { setMinimo(hoy()); setFecha(hoy()); }, []);

    async function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (enviando) return;
        const form = event.currentTarget;
        setEnviando(true);
        setMensaje("");
        try {
            const response = await fetch("/api/reservaciones", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(Object.fromEntries(new FormData(form)))});
            const result = await response.json();
            if (response.ok && result.ok) { form.reset(); setFecha(hoy()); setListo(true); setMensaje(`¡Listo! Recibimos tu solicitud. ${RESTAURANTE.nombre} te confirmará la mesa por teléfono o WhatsApp.`); }
            else setMensaje(result.error || "No se pudo registrar la reservación.");
        } catch { setMensaje("No se pudo conectar. Inténtalo nuevamente."); }
        finally { setEnviando(false); }
    }

    return <main className="section narrow">
        <p className="eyebrow">RESERVACIONES</p>
        <h1>Reserva tu mesa</h1>
        <p className="intro">Déjanos tus datos y te confirmamos la reservación.</p>
        <form className="card form" onSubmit={enviar} onChange={() => listo && setListo(false)}>
            <label>Nombre<input required name="nombre" maxLength={120} placeholder="¿A nombre de quién?"/></label>
            <label>Teléfono / WhatsApp<input required name="telefono" type="tel" maxLength={40}/></label>
            <div className="row">
                <label>Fecha<input required name="fecha" type="date" min={minimo} value={fecha} onChange={e => setFecha(e.target.value)}/></label>
                <label>Hora<select required name="hora" defaultValue=""><option value="" disabled>Elige</option>{RESTAURANTE.horasReserva.map(h => <option key={h}>{h}</option>)}</select></label>
                <label>Personas<input required name="personas" type="number" min={1} max={RESTAURANTE.maxPersonas} defaultValue={2}/></label>
            </div>
            <label>Comentarios (opcional)<textarea name="notas" maxLength={500} rows={3} placeholder="Cumpleaños, silla para bebé, alergias…"/></label>
            <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
            <button className="button" disabled={enviando}>{enviando ? "Enviando…" : "Solicitar reservación"}</button>
            {mensaje && <p className={listo ? "notice ok" : "notice"} role="status">{mensaje}</p>}
        </form>
    </main>;
}
