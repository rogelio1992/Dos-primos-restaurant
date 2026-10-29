"use client";
import {startTransition, useEffect, useRef, useState, ViewTransition} from "react";
import {createPortal} from "react-dom";

// Foto del platillo que se agranda al tocarla. Es el mismo archivo que ya se ve en la tarjeta (≤800 px): verla en grande no gasta datos.
export default function FotoPlatillo({id, src, nombre, precio}: {id: number; src: string; nombre: string; precio: string}) {
    // Ancho/alto de la foto, leída de la miniatura para que la grande tenga su forma real; null = cerrada.
    const [proporcion, setProporcion] = useState<number | null>(null);
    const imgRef = useRef<HTMLImageElement>(null), cerrarRef = useRef<HTMLButtonElement>(null);
    const abierta = proporcion !== null;

    // Dentro de una Transition para que <ViewTransition> anime la foto de la tarjeta al visor y de vuelta.
    const abrir = () => {
        const img = imgRef.current;
        startTransition(() => setProporcion(img?.naturalWidth ? img.naturalWidth / img.naturalHeight : 1));
    };
    const cerrar = () => startTransition(() => setProporcion(null));

    useEffect(() => {
        if (!abierta) return;
        cerrarRef.current?.focus();
        const teclas = (e: KeyboardEvent) => { if (e.key === "Escape") startTransition(() => setProporcion(null)); };
        document.addEventListener("keydown", teclas);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", teclas); document.body.style.overflow = ""; };
    }, [abierta]);

    const miniatura = <img ref={imgRef} src={src} alt={nombre} loading="lazy"/>;
    return <>
        <button type="button" className="dish-foto" onClick={abrir} aria-label={`Ver foto de ${nombre}`}>
            {/* Un nombre solo puede estar montado una vez: con el visor abierto, la tarjeta lo cede a la foto grande. */}
            {abierta ? miniatura : <ViewTransition name={`platillo-${id}`} share="foto-morph" default="none">{miniatura}</ViewTransition>}
        </button>
        {/* En un portal: la tarjeta se mueve al pasar el mouse (transform) y eso rompería el position: fixed del visor. */}
        {abierta && createPortal(<ViewTransition enter="visor-entra" exit="visor-sale" default="none">
            <div className="visor" role="dialog" aria-modal="true" aria-label={nombre} onClick={e => { if (e.target === e.currentTarget) cerrar(); }}>
                <figure onClick={e => { if (e.target === e.currentTarget) cerrar(); }}>
                    <ViewTransition name={`platillo-${id}`} share="foto-morph" default="none">
                        <div className="visor-foto visor-platillo" style={{"--proporcion": proporcion} as React.CSSProperties}><img src={src} alt={nombre}/></div>
                    </ViewTransition>
                </figure>
                <div className="visor-barra">
                    <span><b className="visor-titulo">{nombre}</b> · {precio}</span>
                    <button type="button" ref={cerrarRef} onClick={cerrar} aria-label="Cerrar">✕</button>
                </div>
            </div>
        </ViewTransition>, document.body)}
    </>;
}
