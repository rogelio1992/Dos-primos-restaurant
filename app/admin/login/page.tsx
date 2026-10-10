"use client";
import {FormEvent, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {CircleAlert, LockKeyhole} from "lucide-react";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {getSupabaseClient} from "../../../lib/supabase";
import {RESTAURANTE} from "../../../lib/restaurante";

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

    return <main className="section flex min-h-[70vh] items-center justify-center">
        <Card className="relative w-full max-w-sm overflow-hidden py-7 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-linear-to-r before:from-brasa before:via-rojo-texto before:to-rojo">
            <CardHeader className="items-center gap-3 px-7 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-fuego text-white shadow-[0_8px_24px_-8px_rgba(240,97,79,.7)]"><LockKeyhole className="size-5"/></span>
                <CardTitle className="font-display text-2xl tracking-wide uppercase">Administración</CardTitle>
                <CardDescription>Acceso solo para el personal de {RESTAURANTE.nombre}.</CardDescription>
            </CardHeader>
            <CardContent className="px-7">
                <form className="flex flex-col gap-4" onSubmit={entrar}>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="login-correo">Correo</Label>
                        <Input id="login-correo" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="h-11"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="login-clave">Contraseña</Label>
                        <Input id="login-clave" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="h-11"/>
                    </div>
                    <Button type="submit" size="lg" className="mt-2" disabled={ocupado}>{ocupado ? "Entrando…" : "Iniciar sesión"}</Button>
                    {mensaje && <Alert variant="destructive" role="status"><CircleAlert/><AlertDescription>{mensaje}</AlertDescription></Alert>}
                </form>
            </CardContent>
        </Card>
    </main>;
}
