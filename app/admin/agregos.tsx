"use client";
import {FormEvent, useState} from "react";
import {getSupabaseClient} from "../../lib/supabase";
import {Agrego, Categoria, dinero} from "../../lib/restaurante";

const vacio = {id: 0, nombre: "", precio: 0};

// Agregos de una categoría (p. ej. jamón, queso extra para Pizzas). Se editan en línea, sin abrir ventana.
export default function AgregosCategoria({categoria, agregos, avisar, recargar}: {categoria: Categoria; agregos: Agrego[]; avisar: (texto: string) => void; recargar: () => void}) {
    const db = getSupabaseClient()!;
    const [abierto, setAbierto] = useState(agregos.length > 0);
    const [form, setForm] = useState(vacio), [guardando, setGuardando] = useState(false);

    async function guardar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nombre = form.nombre.trim();
        if (!nombre || guardando) return;
        setGuardando(true);
        const datos = {nombre, precio: form.precio};
        const {error} = form.id
            ? await db.from("agregos").update(datos).eq("id", form.id)
            : await db.from("agregos").insert({...datos, categoria_id: categoria.id, orden: agregos.length + 1});
        setGuardando(false);
        if (error) return avisar("No se pudo guardar el agrego. Revisa que el SQL de agregos esté ejecutado en Supabase.");
        avisar(form.id ? "Agrego actualizado." : `Agrego añadido a ${categoria.nombre}.`);
        setForm(vacio); recargar();
    }

    async function disponible(a: Agrego, valor: boolean) {
        const {error} = await db.from("agregos").update({disponible: valor}).eq("id", a.id);
        if (error) avisar("No se pudo cambiar el agrego."); else recargar();
    }

    async function borrar(a: Agrego) {
        if (!confirm(`¿Borrar el agrego ${a.nombre}? Si solo se acabó, mejor desmárcalo como disponible.`)) return;
        const {error} = await db.from("agregos").delete().eq("id", a.id);
        if (error) avisar("No se pudo borrar el agrego."); else { if (form.id === a.id) setForm(vacio); recargar(); }
    }

    if (!abierto) return <button className="text-link agregos-abrir" onClick={() => setAbierto(true)}>+ Agregos para {categoria.nombre.toLowerCase()}</button>;
    return <div className="agregos-admin">
        <h3>Agregos <small>· se suman al precio de cualquier platillo de {categoria.nombre}</small></h3>
        {agregos.map(a => <div key={a.id} className={`agrego-fila ${a.disponible ? "" : "agotado"}`}>
            <span>{a.nombre}</span>
            <b>+{dinero(a.precio)}</b>
            <label className="check"><input type="checkbox" checked={a.disponible} onChange={e => disponible(a, e.target.checked)}/> Disponible</label>
            <span><button className="text-link" onClick={() => setForm({id: a.id, nombre: a.nombre, precio: a.precio})}>Editar</button> <button className="text-link danger" onClick={() => borrar(a)}>Borrar</button></span>
        </div>)}
        <form className="toolbar agrego-form" onSubmit={guardar}>
            <label>{form.id ? "Editar agrego" : "Nuevo agrego"}<input required maxLength={60} value={form.nombre} placeholder="Ej. Jamón" onChange={e => setForm({...form, nombre: e.target.value})}/></label>
            <label>Precio extra<input required type="number" min={0} value={form.precio} onChange={e => setForm({...form, precio: Number(e.target.value)})}/></label>
            <button className="button" disabled={guardando}>{guardando ? "Guardando…" : form.id ? "Guardar" : "Agregar"}</button>
            {form.id ? <button type="button" className="text-link" onClick={() => setForm(vacio)}>Cancelar</button> : null}
        </form>
    </div>;
}
