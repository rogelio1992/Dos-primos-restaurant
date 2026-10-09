"use client";
import {FormEvent, useCallback, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {getSupabaseClient} from "../../lib/supabase";
import {comprimir, extension, rutaEnBucket} from "../../lib/imagenes";
import GaleriaEditor from "./galeria";
import ResenasEditor from "./resenas";
import {Categoria, ESTADOS, Platillo, RESTAURANTE, Reservacion, dinero, hoy} from "../../lib/restaurante";

type Vista = "reservaciones" | "menu" | "galeria" | "resenas";
const VISTAS: Record<Vista, string> = {reservaciones: "Reservaciones", menu: "Menú", galeria: "Galería", resenas: "Reseñas"};
const vacio = {id: 0, categoria_id: 0, nombre: "", descripcion: "", precio: 0, foto_url: "", disponible: true, destacado: false, orden: 0};
const BUCKET = "platillos";

export default function Admin() {
    const router = useRouter();
    const db = getSupabaseClient();
    const [estado, setEstado] = useState<"cargando" | "sin-permiso" | "listo">("cargando");
    const [vista, setVista] = useState<Vista>("reservaciones");
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        if (!db) return router.replace("/admin/login");
        db.auth.getUser().then(async ({data}) => {
            if (!data.user) return router.replace("/admin/login");
            const {data: perfil} = await db.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
            setEstado(perfil?.role === "admin" ? "listo" : "sin-permiso");
        });
    }, [db, router]);

    async function salir() {
        await db?.auth.signOut();
        router.replace("/admin/login");
    }

    if (estado === "cargando") return <main className="section"><p>Cargando…</p></main>;
    if (estado === "sin-permiso") return <main className="section narrow"><h1>Sin acceso</h1><p className="intro">Esta cuenta no es administradora. Agrégala a la tabla <code>profiles</code> en Supabase.</p><button className="button" onClick={salir}>Cerrar sesión</button></main>;
    return <main className="section">
        <div className="admin-head"><h1>Administración</h1><button className="text-link" onClick={salir}>Cerrar sesión</button></div>
        <nav className="tabs">{(Object.keys(VISTAS) as Vista[]).map(v => <button key={v} className={v === vista ? "active" : ""} onClick={() => { setVista(v); setAviso(""); }}>{VISTAS[v]}</button>)}</nav>
        {aviso && <p className="notice" role="status">{aviso}</p>}
        {vista === "reservaciones" && <Reservaciones avisar={setAviso}/>}
        {vista === "menu" && <MenuEditor avisar={setAviso}/>}
        {vista === "galeria" && <GaleriaEditor avisar={setAviso}/>}
        {vista === "resenas" && <ResenasEditor avisar={setAviso}/>}
    </main>;
}

function Reservaciones({avisar}: {avisar: (texto: string) => void}) {
    const db = getSupabaseClient()!;
    const [fecha, setFecha] = useState(hoy()), [lista, setLista] = useState<Reservacion[]>([]);
    const cargar = useCallback(async () => {
        const {data, error} = await db.from("reservaciones").select("*").eq("fecha", fecha).order("hora");
        if (error) avisar("No se pudieron cargar las reservaciones."); else setLista(data);
    }, [db, fecha, avisar]);
    useEffect(() => { cargar(); }, [cargar]);

    // null mientras carga o si falta la tabla "ajustes" en Supabase.
    const [activas, setActivas] = useState<boolean | null>(null), [cambiando, setCambiando] = useState(false);
    useEffect(() => {
        db.from("ajustes").select("reservaciones_activas").maybeSingle().then(({data, error}) => {
            if (error || !data) avisar("No se pudo leer si las reservaciones están activas. Revisa que el SQL de ajustes esté ejecutado en Supabase.");
            else setActivas(data.reservaciones_activas);
        });
    }, [db, avisar]);

    async function alternar(valor: boolean) {
        setCambiando(true);
        const {error} = await db.from("ajustes").update({reservaciones_activas: valor}).eq("id", true);
        setCambiando(false);
        if (error) return avisar("No se pudo cambiar el ajuste de reservaciones.");
        setActivas(valor);
        avisar(valor ? "Reservaciones activadas: el sitio vuelve a mostrar el botón y el formulario." : "Reservaciones desactivadas: el sitio ya no muestra nada de reservas.");
    }

    async function cambiar(id: number, estado: string) {
        const {error} = await db.from("reservaciones").update({estado}).eq("id", id);
        if (error) avisar("No se pudo actualizar la reservación."); else cargar();
    }

    const personas = lista.filter(r => r.estado !== "cancelada").reduce((total, r) => total + r.personas, 0);
    return <section>
        <div className={`ajuste ${activas ? "on" : ""}`}>
            <label className="check"><input type="checkbox" checked={!!activas} disabled={activas === null || cambiando} onChange={e => alternar(e.target.checked)}/> Admitir reservaciones en línea</label>
            <p>{activas === null ? "Cargando…" : activas ? "El sitio muestra el botón “Reservar mesa” y el formulario." : "El sitio no muestra nada de reservas y no acepta solicitudes nuevas."}</p>
        </div>
        <div className="toolbar"><label>Fecha<input type="date" value={fecha} onChange={e => setFecha(e.target.value)}/></label><p>{lista.length} reservaciones · {personas} personas</p></div>
        <div className="table">{lista.map(r => <article key={r.id} className={`res ${r.estado}`}>
            <strong>{r.hora.slice(0, 5)}</strong>
            <div><b>{r.nombre}</b> · {r.personas} personas<br/><a href={`tel:${r.telefono}`}>{r.telefono}</a>{r.notas && <p>{r.notas}</p>}</div>
            <select value={r.estado} onChange={e => cambiar(r.id, e.target.value)} aria-label={`Estado de ${r.nombre}`}>{Object.entries(ESTADOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}</select>
        </article>)}</div>
        {!lista.length && <p className="empty">No hay reservaciones para este día.</p>}
    </section>;
}

function MenuEditor({avisar}: {avisar: (texto: string) => void}) {
    const db = getSupabaseClient()!;
    const [categorias, setCategorias] = useState<Categoria[]>([]), [platillos, setPlatillos] = useState<Platillo[]>([]);
    const [editando, setEditando] = useState<typeof vacio | null>(null);
    const [archivo, setArchivo] = useState<File | null>(null), [guardando, setGuardando] = useState(false);
    const vistaPrevia = useMemo(() => archivo ? URL.createObjectURL(archivo) : null, [archivo]);
    useEffect(() => () => { if (vistaPrevia) URL.revokeObjectURL(vistaPrevia); }, [vistaPrevia]);
    // Destacados sin contar el que se está editando: así se puede desmarcar o volver a guardar uno que ya lo era.
    const otrosDestacados = platillos.filter(p => p.destacado && p.id !== editando?.id).length;
    const limiteLleno = otrosDestacados >= RESTAURANTE.maxDestacados;
    const cargar = useCallback(async () => {
        const [c, p] = await Promise.all([db.from("categorias").select("*").order("orden").order("nombre"), db.from("platillos").select("*").order("orden").order("nombre")]);
        if (c.error || p.error) return avisar("No se pudo cargar el menú.");
        setCategorias(c.data); setPlatillos(p.data);
    }, [db, avisar]);
    useEffect(() => { cargar(); }, [cargar]);

    async function nuevaCategoria(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget, nombre = String(new FormData(form).get("nombre") ?? "").trim();
        if (!nombre) return;
        const {error} = await db.from("categorias").insert({nombre, orden: categorias.length + 1});
        if (error) avisar("No se pudo crear la categoría."); else { form.reset(); cargar(); }
    }

    async function borrarCategoria(c: Categoria) {
        if (platillos.some(p => p.categoria_id === c.id)) return avisar("Primero mueve o borra los platillos de esa categoría.");
        if (!confirm(`¿Borrar la categoría ${c.nombre}?`)) return;
        const {error} = await db.from("categorias").delete().eq("id", c.id);
        if (error) avisar("No se pudo borrar la categoría."); else cargar();
    }

    function abrir(datos: typeof vacio) { setArchivo(null); setEditando(datos); }

    function elegirFoto(lista: FileList | null) {
        const elegido = lista?.[0];
        if (!elegido) return;
        if (!elegido.type.startsWith("image/")) return avisar("Ese archivo no es una imagen.");
        setArchivo(elegido);
    }

    async function guardar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editando || guardando) return;
        if (editando.destacado && limiteLleno) return avisar(`Ya hay ${RESTAURANTE.maxDestacados} platillos destacados. Desmarca uno antes de destacar este.`);
        setGuardando(true);
        try {
            const anterior = platillos.find(p => p.id === editando.id)?.foto_url ?? null;
            let foto_url: string | null = editando.foto_url.trim() || null;
            if (archivo) {
                const blob = await comprimir(archivo, 800);
                const ruta = `${crypto.randomUUID()}.${extension(blob)}`;
                const subida = await db.storage.from(BUCKET).upload(ruta, blob, {contentType: blob.type, cacheControl: "31536000"});
                if (subida.error) return avisar("No se pudo subir la foto. Revisa que el SQL de fotos esté ejecutado en Supabase.");
                foto_url = db.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
            }
            const {id, ...datos} = {...editando, nombre: editando.nombre.trim(), foto_url};
            const {error} = id ? await db.from("platillos").update(datos).eq("id", id) : await db.from("platillos").insert(datos);
            if (error) return avisar(error.message.includes("destacados") ? `Ya hay ${RESTAURANTE.maxDestacados} platillos destacados. Desmarca uno antes de destacar este.` : "No se pudo guardar el platillo.");
            // La foto vieja ya no la usa nadie: borrarla para no ocupar espacio. Si falla no pasa nada.
            const vieja = anterior !== foto_url ? rutaEnBucket(anterior, BUCKET) : null;
            if (vieja) await db.storage.from(BUCKET).remove([vieja]);
            setEditando(null); setArchivo(null); avisar("Platillo guardado."); cargar();
        } catch {
            avisar("No se pudo procesar la foto. Prueba con otra imagen.");
        } finally {
            setGuardando(false);
        }
    }

    async function borrarPlatillo(p: Platillo) {
        if (!confirm(`¿Borrar ${p.nombre}? Si solo se acabó, mejor márcalo como no disponible.`)) return;
        const {error} = await db.from("platillos").delete().eq("id", p.id);
        if (error) return avisar("No se pudo borrar el platillo.");
        const ruta = rutaEnBucket(p.foto_url, BUCKET);
        if (ruta) await db.storage.from(BUCKET).remove([ruta]);
        cargar();
    }

    const totalDestacados = platillos.filter(p => p.destacado).length;
    const foto = vistaPrevia ?? editando?.foto_url;
    return <section>
        <p className="contador-destacados">★ Destacados en la portada: <b>{totalDestacados} de {RESTAURANTE.maxDestacados}</b></p>
        <form className="toolbar" onSubmit={nuevaCategoria}><label>Nueva categoría<input name="nombre" placeholder="Ej. Tacos"/></label><button className="button">Agregar</button></form>
        {categorias.map(c => <div key={c.id} className="category">
            <div className="admin-head"><h2>{c.nombre}</h2><div><button className="text-link" onClick={() => abrir({...vacio, categoria_id: c.id})}>+ Platillo</button> <button className="text-link danger" onClick={() => borrarCategoria(c)}>Borrar</button></div></div>
            {platillos.filter(p => p.categoria_id === c.id).map(p => <article key={p.id} className={p.disponible ? "res" : "res cancelada"}>
                <strong>{dinero(p.precio)}</strong>
                <div className="platillo-admin">{p.foto_url && <img src={p.foto_url} alt="" loading="lazy"/>}<div><b>{p.nombre}</b>{p.destacado && <span className="insignia">★ Destacado</span>}{!p.disponible && " · No disponible"}{p.descripcion && <p>{p.descripcion}</p>}</div></div>
                <div><button className="text-link" onClick={() => abrir({...p, foto_url: p.foto_url ?? ""})}>Editar</button> <button className="text-link danger" onClick={() => borrarPlatillo(p)}>Borrar</button></div>
            </article>)}
        </div>)}
        {editando && <div className="modal" role="dialog" aria-modal="true"><form className="card form" onSubmit={guardar}>
            <h2>{editando.id ? "Editar platillo" : "Nuevo platillo"}</h2>
            <label>Nombre<input required value={editando.nombre} onChange={e => setEditando({...editando, nombre: e.target.value})}/></label>
            <label>Descripción<textarea rows={2} value={editando.descripcion} onChange={e => setEditando({...editando, descripcion: e.target.value})}/></label>
            <div className="row">
                <label>Precio<input required type="number" min={0} value={editando.precio} onChange={e => setEditando({...editando, precio: Number(e.target.value)})}/></label>
                <label>Categoría<select value={editando.categoria_id} onChange={e => setEditando({...editando, categoria_id: Number(e.target.value)})}>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
                <label>Orden<input type="number" value={editando.orden} onChange={e => setEditando({...editando, orden: Number(e.target.value)})}/></label>
            </div>
            <div className="foto-campo">
                <span>Foto (opcional)</span>
                {foto ? <img src={foto} alt="Vista previa"/> : <div className="foto-vacia">Sin foto</div>}
                <div className="actions">
                    <label className="button boton-archivo">{foto ? "Cambiar foto" : "Elegir foto"}<input type="file" accept="image/*" onChange={e => { elegirFoto(e.target.files); e.target.value = ""; }}/></label>
                    {foto && <button type="button" className="text-link danger" onClick={() => { setArchivo(null); setEditando({...editando, foto_url: ""}); }}>Quitar foto</button>}
                </div>
                {archivo && <small>Se reducirá antes de subirla para que el menú cargue rápido.</small>}
            </div>
            <label className="check"><input type="checkbox" checked={editando.disponible} onChange={e => setEditando({...editando, disponible: e.target.checked})}/> Disponible en el menú</label>
            <label className="check"><input type="checkbox" checked={editando.destacado} disabled={!editando.destacado && limiteLleno} onChange={e => setEditando({...editando, destacado: e.target.checked})}/> ★ Destacar en la portada ({otrosDestacados + (editando.destacado ? 1 : 0)} de {RESTAURANTE.maxDestacados})</label>
            {!editando.destacado && limiteLleno && <p className="notice">Ya hay {RESTAURANTE.maxDestacados} platillos destacados, que es el límite de tarjetas de la portada. Desmarca uno para poder destacar este.</p>}
            {editando.destacado && !editando.disponible && <p className="notice">Un platillo no disponible no se muestra en la portada aunque esté destacado.</p>}
            <div className="actions"><button className="button" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button><button type="button" className="text-link" onClick={() => setEditando(null)}>Cancelar</button></div>
        </form></div>}
    </section>;
}
