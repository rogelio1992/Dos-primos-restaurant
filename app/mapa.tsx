"use client";
import {useState} from "react";
import {RESTAURANTE} from "../lib/restaurante";

// El mapa de Google pesa más de 1 MB: solo se carga si la persona lo pide, para no gastarle datos a quien solo mira el menú.
export default function Mapa() {
    const [visible, setVisible] = useState(false);
    if (visible) return <div className="mapa">
        <iframe title={`Mapa: ${RESTAURANTE.direccion}`} src={`https://www.google.com/maps?q=${RESTAURANTE.coordenadas}&z=16&output=embed`}/>
    </div>;
    return <div className="mapa mapa-off">
        <span className="mapa-pin" aria-hidden="true"/>
        <p>{RESTAURANTE.direccion}</p>
        <div className="actions">
            <button className="button" onClick={() => setVisible(true)}>Ver mapa aquí</button>
            <a className="text-link" href={RESTAURANTE.mapa} target="_blank" rel="noreferrer">Abrir en Google Maps →</a>
        </div>
        <small>El mapa consume datos (≈1 MB).</small>
    </div>;
}
