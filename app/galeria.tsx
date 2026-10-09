"use client";
import {addTransitionType, startTransition, useCallback, useEffect, useRef, useState, ViewTransition} from "react";
import type {FotoGaleria} from "../lib/restaurante";

type Paso = "foto-siguiente" | "foto-anterior";
// i: foto abierta; proporcion: ancho/alto, leída de la miniatura para que la foto grande tenga la misma forma al transformarse.
type Vista = {i: number; proporcion: number};

// Mosaico con miniaturas livianas; la foto grande solo se descarga si la persona la abre.
export default function Galeria({fotos}: {fotos: FotoGaleria[]}) {
    const [vista, setVista] = useState<Vista | null>(null);
    const cerrarRef = useRef<HTMLButtonElement>(null);
    const miniaturas = useRef<(HTMLImageElement | null)[]>([]);

    // Abrir, pasar o cerrar dentro de una Transition: así React anima el cambio con <ViewTransition>.
    const mostrar = useCallback((i: number | null, paso?: Paso) => {
        const img = i === null ? null : miniaturas.current[i];
        startTransition(() => {
            if (paso) addTransitionType(paso);
            setVista(i === null ? null : {i, proporcion: img?.naturalWidth ? img.naturalWidth / img.naturalHeight : 4 / 3});
        });
    }, []);
    const mover = useCallback((paso: Paso) => {
        if (!vista) return;
        mostrar((vista.i + (paso === "foto-siguiente" ? 1 : -1) + fotos.length) % fotos.length, paso);
    }, [vista, fotos.length, mostrar]);

    const abierta = vista?.i ?? null;
    useEffect(() => {
        if (abierta === null) return;
        cerrarRef.current?.focus();
        // Detrás del visor, deja visible la miniatura de la foto actual: al cerrar, la foto vuelve a ella en vez de volar fuera de la pantalla.
        miniaturas.current[abierta]?.closest("button")?.scrollIntoView({block: "nearest", inline: "nearest", behavior: "instant"});
    }, [abierta]);

    useEffect(() => {
        if (abierta === null) return;
        const teclas = (e: KeyboardEvent) => {
            if (e.key === "Escape") mostrar(null);
            if (e.key === "ArrowRight") mover("foto-siguiente");
            if (e.key === "ArrowLeft") mover("foto-anterior");
        };
        document.addEventListener("keydown", teclas);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", teclas); document.body.style.overflow = ""; };
    }, [abierta, mostrar, mover]);

    const foto = vista ? fotos[vista.i] : null;
    return <>
        {/* data-n: con menos de 6 fotos el mosaico usa una composición propia para no dejar huecos. */}
        <div className="galeria" data-n={Math.min(fotos.length, 6)}>{fotos.map((f, i) => {
            const miniatura = <img ref={el => { miniaturas.current[i] = el; }} src={f.miniatura_url} alt={f.descripcion} loading="lazy" decoding="async"/>;
            return <button key={f.id} type="button" className="galeria-item" onClick={() => mostrar(i)} aria-label={`Ver foto ${i + 1}${f.descripcion ? `: ${f.descripcion}` : ""}`}>
                {/* Un nombre solo puede estar montado una vez: con el visor abierto, las miniaturas lo ceden a la foto grande. */}
                {vista === null ? <ViewTransition name={`foto-${f.id}`} share="foto-morph" default="none">{miniatura}</ViewTransition> : miniatura}
                {f.descripcion && <span>{f.descripcion}</span>}
            </button>;
        })}</div>
        {fotos.length > 1 && <p className="galeria-pista" aria-hidden="true">Desliza para ver más →</p>}

        {foto && vista && <ViewTransition enter="visor-entra" exit="visor-sale" default="none">
            <div className="visor" role="dialog" aria-modal="true" aria-label="Foto del lugar" onClick={e => { if (e.target === e.currentTarget) mostrar(null); }}>
                <figure onClick={e => { if (e.target === e.currentTarget) mostrar(null); }}>
                    {/* key: cada foto es una entrada nueva, para que anterior/siguiente deslice; name: se empareja con su miniatura al abrir y cerrar. */}
                    <ViewTransition key={foto.id} name={`foto-${foto.id}`} share="foto-morph" default="none"
                        enter={{"foto-siguiente": "foto-desde-derecha", "foto-anterior": "foto-desde-izquierda", default: "none"}}
                        exit={{"foto-siguiente": "foto-hacia-izquierda", "foto-anterior": "foto-hacia-derecha", default: "none"}}>
                        <div className="visor-foto" style={{"--proporcion": vista.proporcion} as React.CSSProperties}>
                            {/* La miniatura (ya descargada) se ve al instante; la grande se pinta encima cuando llega.
                                loading="lazy" en la grande: si no, React espera a que se descargue antes de animar y el toque no responde en conexiones lentas. */}
                            <img src={foto.miniatura_url} alt=""/>
                            <img src={foto.foto_url} alt={foto.descripcion} loading="lazy"/>
                        </div>
                    </ViewTransition>
                </figure>
                <div className="visor-barra">
                    <span>{vista.i + 1} / {fotos.length}{foto.descripcion && ` · ${foto.descripcion}`}</span>
                    {fotos.length > 1 && <><button type="button" onClick={() => mover("foto-anterior")} aria-label="Anterior">←</button><button type="button" onClick={() => mover("foto-siguiente")} aria-label="Siguiente">→</button></>}
                    <button type="button" ref={cerrarRef} onClick={() => mostrar(null)} aria-label="Cerrar">✕</button>
                </div>
            </div>
        </ViewTransition>}
    </>;
}
