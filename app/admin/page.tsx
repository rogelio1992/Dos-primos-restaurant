"use client";
import {FormEvent, useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {getSupabaseClient} from "../../lib/supabase";
import {Categoria, ESTADOS, Platillo, Reservacion, dinero, hoy} from "../../lib/restaurante";

type Vista = "reservaciones" | "menu";
const vacio = {id: 0, categoria_id: 0, nombre: "", descripcion: "", precio: 0, foto_url: "", disponible: true, orden: 0};

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
        <nav className="tabs">{(["reservaciones", "menu"] as Vista[]).map(v => <button key={v} className={v === vista ? "active" : ""} onClick={() => { setVista(v); setAviso(""); }}>{v === "menu" ? "Menú" : "Reservaciones"}</button>)}</nav>
        {aviso && <p className="notice" role="status">{aviso}</p>}
        {vista === "reservaciones" ? <Reservaciones avisar={setAviso}/> : <MenuEditor avisar={setAviso}/>}
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

    async function cambiar(id: number, estado: string) {
        const {error} = await db.from("reservaciones").update({estado}).eq("id", id);
        if (error) avisar("No se pudo actualizar la reservación."); else cargar();
    }

    const personas = lista.filter(r => r.estado !== "cancelada").reduce((total, r) => total + r.personas, 0);
    return <section>
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

    async function guardar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editando) return;
        const {id, ...datos} = {...editando, nombre: editando.nombre.trim(), foto_url: editando.foto_url?.trim() || null};
        const {error} = id ? await db.from("platillos").update(datos).eq("id", id) : await db.from("platillos").insert(datos);
        if (error) return avisar("No se pudo guardar el platillo.");
        setEditando(null); avisar("Platillo guardado."); cargar();
    }

    async function borrarPlatillo(p: Platillo) {
        if (!confirm(`¿Borrar ${p.nombre}? Si solo se acabó, mejor márcalo como no disponible.`)) return;
        const {error} = await db.from("platillos").delete().eq("id", p.id);
        if (error) avisar("No se pudo borrar el platillo."); else cargar();
    }

    return <section>
        <form className="toolbar" onSubmit={nuevaCategoria}><label>Nueva categoría<input name="nombre" placeholder="Ej. Tacos"/></label><button className="button">Agregar</button></form>
        {categorias.map(c => <div key={c.id} className="category">
            <div className="admin-head"><h2>{c.nombre}</h2><div><button className="text-link" onClick={() => setEditando({...vacio, categoria_id: c.id})}>+ Platillo</button> <button className="text-link danger" onClick={() => borrarCategoria(c)}>Borrar</button></div></div>
            {platillos.filter(p => p.categoria_id === c.id).map(p => <article key={p.id} className={p.disponible ? "res" : "res cancelada"}>
                <strong>{dinero(p.precio)}</strong>
                <div><b>{p.nombre}</b>{!p.disponible && " · No disponible"}{p.descripcion && <p>{p.descripcion}</p>}</div>
                <div><button className="text-link" onClick={() => setEditando({...p, foto_url: p.foto_url ?? ""})}>Editar</button> <button className="text-link danger" onClick={() => borrarPlatillo(p)}>Borrar</button></div>
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
            <label>URL de la foto (opcional)<input type="url" value={editando.foto_url ?? ""} onChange={e => setEditando({...editando, foto_url: e.target.value})}/></label>
            <label className="check"><input type="checkbox" checked={editando.disponible} onChange={e => setEditando({...editando, disponible: e.target.checked})}/> Disponible en el menú</label>
            <div className="actions"><button className="button">Guardar</button><button type="button" className="text-link" onClick={() => setEditando(null)}>Cancelar</button></div>
        </form></div>}
    </section>;
}
