"use client";
import {useEffect, useRef, useState} from "react";

// Fila de categorías fija arriba, deslizable de lado. Resalta la sección que se está viendo y la trae a la vista dentro de la fila.
export default function CategoriasMenu({categorias}: {categorias: {id: number; nombre: string}[]}) {
    const [actual, setActual] = useState<number | null>(null);
    const pista = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const secciones = categorias.map(c => document.getElementById(`cat-${c.id}`)).filter((s): s is HTMLElement => !!s);
        // La actual es la última sección cuyo título ya pasó por debajo de la fila (con margen); arriba de todo, ninguna.
        let pendiente = 0;
        const revisar = () => {
            pendiente = 0;
            const linea = 200;
            const pasada = secciones.filter(s => s.getBoundingClientRect().top <= linea).pop();
            setActual(pasada ? Number(pasada.id.slice(4)) : null);
        };
        const alDesplazar = () => { if (!pendiente) pendiente = requestAnimationFrame(revisar); };
        revisar();
        addEventListener("scroll", alDesplazar, {passive: true});
        return () => { removeEventListener("scroll", alDesplazar); cancelAnimationFrame(pendiente); };
    }, [categorias]);

    useEffect(() => {
        const fila = pista.current, chip = fila?.querySelector<HTMLElement>(`[data-id="${actual}"]`);
        if (!fila || !chip) return;
        // Centra el chip dentro de la fila sin mover la página (scrollIntoView también desplazaría la ventana).
        fila.scrollTo({left: chip.offsetLeft - (fila.clientWidth - chip.offsetWidth) / 2, behavior: "smooth"});
    }, [actual]);

    return <nav className="chips" aria-label="Categorías">
        <div className="chips-pista" ref={pista}>{categorias.map(c => <a key={c.id} data-id={c.id} href={`#cat-${c.id}`}
            className={c.id === actual ? "activa" : undefined} aria-current={c.id === actual ? "location" : undefined}>{c.nombre}</a>)}</div>
    </nav>;
}
