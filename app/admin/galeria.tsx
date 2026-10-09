"use client";
import {useCallback, useEffect, useState} from "react";
import {getSupabaseClient} from "../../lib/supabase";
import {comprimir, extension, rutaEnBucket} from "../../lib/imagenes";
import {FotoGaleria, RESTAURANTE} from "../../lib/restaurante";

const BUCKET = "galeria";

export default function GaleriaEditor({avisar}: {avisar: (texto: string) => void}) {
    const db = getSupabaseClient()!;
    const [fotos, setFotos] = useState<FotoGaleria[]>([]), [progreso, setProgreso] = useState("");
    const cargar = useCallback(async () => {
        const {data, error} = await db.from("galeria").select("*").order("orden").order("id");
        if (error) avisar("No se pudo cargar la galería. Revisa que el SQL de la galería esté ejecutado en Supabase."); else setFotos(data);
    }, [db, avisar]);
    useEffect(() => { cargar(); }, [cargar]);

    const libres = RESTAURANTE.maxGaleria - fotos.length;

    async function subir(lista: FileList | null) {
        const elegidos = Array.from(lista ?? []).filter(f => f.type.startsWith("image/"));
        if (!elegidos.length) return;
        if (libres <= 0) return avisar(`Ya hay ${RESTAURANTE.maxGaleria} fotos, el límite de la galería. Borra alguna para subir otra.`);
        const aSubir = elegidos.slice(0, libres);
        let orden = Math.max(0, ...fotos.map(f => f.orden));
        let fallidas = 0;
        for (let i = 0; i < aSubir.length; i++) {
            const archivo = aSubir[i];
            setProgreso(`Subiendo ${i + 1} de ${aSubir.length}…`);
            try {
                // Grande (solo se descarga al abrirla) y miniatura (la que se ve en el mosaico).
                const [grande, mini] = await Promise.all([comprimir(archivo, 1400, 0.8), comprimir(archivo, 640, 0.72)]);
                const base = crypto.randomUUID();
                const rutas = [`${base}.${extension(grande)}`, `${base}-mini.${extension(mini)}`];
                const subidas = await Promise.all([
                    db.storage.from(BUCKET).upload(rutas[0], grande, {contentType: grande.type, cacheControl: "31536000"}),
                    db.storage.from(BUCKET).upload(rutas[1], mini, {contentType: mini.type, cacheControl: "31536000"})
                ]);
                if (subidas.some(s => s.error)) { await db.storage.from(BUCKET).remove(rutas); fallidas++; continue; }
                const url = (ruta: string) => db.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
                const {error} = await db.from("galeria").insert({foto_url: url(rutas[0]), miniatura_url: url(rutas[1]), orden: ++orden});
                if (error) { await db.storage.from(BUCKET).remove(rutas); fallidas++; }
            } catch {
                fallidas++;
            }
        }
        setProgreso("");
        const sobrantes = elegidos.length - aSubir.length;
        avisar([
            fallidas ? `${fallidas} foto(s) no se pudieron subir.` : "Fotos subidas.",
            sobrantes ? `${sobrantes} no se subieron porque la galería admite ${RESTAURANTE.maxGaleria} fotos.` : ""
        ].join(" ").trim());
        cargar();
    }

    async function guardarDescripcion(foto: FotoGaleria, descripcion: string) {
        if (descripcion.trim() === foto.descripcion) return;
        const {error} = await db.from("galeria").update({descripcion: descripcion.trim().slice(0, 120)}).eq("id", foto.id);
        if (error) avisar("No se pudo guardar la descripción."); else cargar();
    }

    // Intercambia el orden con la foto vecina.
    async function mover(i: number, paso: -1 | 1) {
        const a = fotos[i], b = fotos[i + paso];
        if (!a || !b) return;
        // Si dos fotos tienen el mismo orden, separarlas para que el intercambio tenga efecto.
        const [ordenA, ordenB] = a.orden === b.orden ? [b.orden + paso, a.orden] : [b.orden, a.orden];
        const r = await Promise.all([db.from("galeria").update({orden: ordenA}).eq("id", a.id), db.from("galeria").update({orden: ordenB}).eq("id", b.id)]);
        if (r.some(x => x.error)) avisar("No se pudo cambiar el orden.");
        cargar();
    }

    async function borrar(foto: FotoGaleria) {
        if (!confirm("¿Borrar esta foto de la galería?")) return;
        const {error} = await db.from("galeria").delete().eq("id", foto.id);
        if (error) return avisar("No se pudo borrar la foto.");
        const rutas = [rutaEnBucket(foto.foto_url, BUCKET), rutaEnBucket(foto.miniatura_url, BUCKET)].filter((r): r is string => !!r);
        if (rutas.length) await db.storage.from(BUCKET).remove(rutas);
        cargar();
    }

    return <section>
        <div className="ajuste">
            <div className="admin-head">
                <p className="contador-destacados">Fotos en la galería: <b>{fotos.length} de {RESTAURANTE.maxGaleria}</b></p>
                <label className={`button boton-archivo ${progreso || libres <= 0 ? "deshabilitado" : ""}`}>{progreso || "Subir fotos"}<input type="file" accept="image/*" multiple disabled={!!progreso || libres <= 0} onChange={e => { subir(e.target.files); e.target.value = ""; }}/></label>
            </div>
            <p>Puedes elegir varias a la vez. La primera sale grande en la portada; mezcla fotos horizontales y verticales. Se reducen antes de subirlas para ahorrar datos.</p>
            {libres <= 0 && <p className="notice">Llegaste al límite de {RESTAURANTE.maxGaleria} fotos. Borra alguna para subir otra.</p>}
        </div>
        <div className="galeria-admin">{fotos.map((f, i) => <article key={f.id}>
            <img src={f.miniatura_url} alt={f.descripcion} loading="lazy"/>
            {i === 0 && <span className="insignia">Grande</span>}
            <input defaultValue={f.descripcion} placeholder="Descripción (opcional)" maxLength={120} onBlur={e => guardarDescripcion(f, e.target.value)} aria-label="Descripción de la foto"/>
            <div className="galeria-admin-acciones">
                <button type="button" className="text-link" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Mover antes">←</button>
                <button type="button" className="text-link" disabled={i === fotos.length - 1} onClick={() => mover(i, 1)} aria-label="Mover después">→</button>
                <button type="button" className="text-link danger" onClick={() => borrar(f)}>Borrar</button>
            </div>
        </article>)}</div>
        {!fotos.length && <p className="empty">Todavía no hay fotos. Mientras la galería esté vacía, la portada no muestra esta sección.</p>}
    </section>;
}
