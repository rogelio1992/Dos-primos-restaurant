"use client";
import {FormEvent, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {getSupabaseClient} from "../../../lib/supabase";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [mensaje, setMensaje] = useState(""), [ocupado, setOcupado] = useState(false);
    useEffect(() => {
        getSupabaseClient()?.auth.getUser().then(({data}) => { if (data.user) router.replace("/admin"); });
    }, [router]);

    async function entrar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const db = getSupabaseClient();
        if (!db) return setMensaje("Faltan las variables de Supabase en Vercel.");
        setOcupado(true);
        const {error} = await db.auth.signInWithPassword({email, password});
        setOcupado(false);
        if (error) setMensaje("Correo o contraseña incorrectos.");
        else router.replace("/admin");
    }

    return <main className="section narrow">
        <h1>Administración</h1>
        <form className="card form" onSubmit={entrar}>
            <label>Correo<input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label>
            <label>Contraseña<input type="password" required value={password} onChange={e => setPassword(e.target.value)}/></label>
            <button className="button" disabled={ocupado}>{ocupado ? "Entrando…" : "Iniciar sesión"}</button>
            {mensaje && <p className="notice" role="status">{mensaje}</p>}
        </form>
    </main>;
}
