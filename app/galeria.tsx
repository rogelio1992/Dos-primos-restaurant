"use client";
import {useCallback, useEffect, useRef, useState} from "react";
import type {FotoGaleria} from "../lib/restaurante";

// Mosaico con miniaturas livianas; la foto grande solo se descarga si la persona la abre.
export default function Galeria({fotos}: {fotos: FotoGaleria[]}) {
    const [abierta, setAbierta] = useState<number | null>(null);
    const cerrarRef = useRef<HTMLButtonElement>(null);
    const mover = useCallback((paso: number) => setAbierta(i => i === null ? null : (i + paso + fotos.length) % fotos.length), [fotos.length]);

    useEffect(() => {
        if (abierta === null) return;
        cerrarRef.current?.focus();
        const teclas = (e: KeyboardEvent) => {
            if (e.key === "Escape") setAbierta(null);
            if (e.key === "ArrowRight") mover(1);
            if (e.key === "ArrowLeft") mover(-1);
        };
        document.addEventListener("keydown", teclas);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", teclas); document.body.style.overflow = ""; };
    }, [abierta, mover]);

    const foto = abierta === null ? null : fotos[abierta];
    return <>
        <div className="galeria">{fotos.map((f, i) => <button key={f.id} type="button" className="galeria-item" onClick={() => setAbierta(i)} aria-label={`Ver foto ${i + 1}${f.descripcion ? `: ${f.descripcion}` : ""}`}>
            <img src={f.miniatura_url} alt={f.descripcion} loading="lazy" decoding="async"/>
            {f.descripcion && <span>{f.descripcion}</span>}
        </button>)}</div>
        {fotos.length > 1 && <p className="galeria-pista" aria-hidden="true">Desliza para ver más →</p>}

        {foto && <div className="visor" role="dialog" aria-modal="true" aria-label="Foto del lugar" onClick={e => { if (e.target === e.currentTarget) setAbierta(null); }}>
            {/* La miniatura (ya descargada) se ve de fondo mientras llega la grande. */}
            <figure style={{backgroundImage: `url(${foto.miniatura_url})`}}>
                <img key={foto.id} src={foto.foto_url} alt={foto.descripcion}/>
            </figure>
            <div className="visor-barra">
                <span>{abierta! + 1} / {fotos.length}{foto.descripcion && ` · ${foto.descripcion}`}</span>
                {fotos.length > 1 && <><button type="button" onClick={() => mover(-1)} aria-label="Anterior">←</button><button type="button" onClick={() => mover(1)} aria-label="Siguiente">→</button></>}
                <button type="button" ref={cerrarRef} onClick={() => setAbierta(null)} aria-label="Cerrar">✕</button>
            </div>
        </div>}
    </>;
}
