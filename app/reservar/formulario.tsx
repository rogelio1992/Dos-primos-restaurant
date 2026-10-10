"use client";
import {FormEvent, useEffect, useState} from "react";
import {CalendarDays, CircleAlert, CircleCheck, Clock, Users} from "lucide-react";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {NativeSelect, NativeSelectOption} from "@/components/ui/native-select";
import {Textarea} from "@/components/ui/textarea";
import {cn} from "@/lib/utils";
import {RESTAURANTE, hoy} from "../../lib/restaurante";

export default function Formulario() {
    const [mensaje, setMensaje] = useState(""), [enviando, setEnviando] = useState(false), [listo, setListo] = useState(false);
    // La página se genera al publicar; la fecha de hoy se calcula en el navegador.
    const [minimo, setMinimo] = useState(""), [fecha, setFecha] = useState("");
    useEffect(() => { setMinimo(hoy()); setFecha(hoy()); }, []);

    async function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (enviando) return;
        const form = event.currentTarget;
        setEnviando(true);
        setMensaje("");
        try {
            const response = await fetch("/api/reservaciones", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(Object.fromEntries(new FormData(form)))});
            const result = await response.json();
            if (response.ok && result.ok) { form.reset(); setFecha(hoy()); setListo(true); setMensaje(`¡Listo! Recibimos tu solicitud. ${RESTAURANTE.nombre} te confirmará la mesa por teléfono o WhatsApp.`); }
            else setMensaje(result.error || "No se pudo registrar la reservación.");
        } catch { setMensaje("No se pudo conectar. Inténtalo nuevamente."); }
        finally { setEnviando(false); }
    }

    return <main className="section narrow">
        <p className="eyebrow">RESERVACIONES</p>
        <h1>Reserva tu mesa</h1>
        <p className="intro">Déjanos tus datos y te confirmamos la reservación.</p>
        <Card className="relative mt-6 overflow-hidden py-6 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-linear-to-r before:from-brasa before:via-rojo-texto before:to-rojo">
            <CardContent className="px-6">
                <form className="flex flex-col gap-5" onSubmit={enviar} onChange={() => listo && setListo(false)}>
                    <Campo id="r-nombre" etiqueta="Nombre"><Input id="r-nombre" required name="nombre" maxLength={120} placeholder="¿A nombre de quién?" className="h-11"/></Campo>
                    <Campo id="r-telefono" etiqueta="Teléfono / WhatsApp"><Input id="r-telefono" required name="telefono" type="tel" maxLength={40} placeholder="+53 5…" className="h-11"/></Campo>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <Campo id="r-fecha" etiqueta="Fecha" icono={<CalendarDays/>} className="col-span-2 sm:col-span-1"><Input id="r-fecha" required name="fecha" type="date" min={minimo} value={fecha} onChange={e => setFecha(e.target.value)} className="h-11 scheme-dark"/></Campo>
                        <Campo id="r-hora" etiqueta="Hora" icono={<Clock/>}>
                            <NativeSelect id="r-hora" required name="hora" defaultValue="" wrapperClassName="w-full" className="h-11">
                                <NativeSelectOption value="" disabled>Elige</NativeSelectOption>
                                {RESTAURANTE.horasReserva.map(h => <NativeSelectOption key={h} value={h}>{h}</NativeSelectOption>)}
                            </NativeSelect>
                        </Campo>
                        <Campo id="r-personas" etiqueta="Personas" icono={<Users/>}><Input id="r-personas" required name="personas" type="number" min={1} max={RESTAURANTE.maxPersonas} defaultValue={2} className="h-11"/></Campo>
                    </div>
                    <Campo id="r-notas" etiqueta="Comentarios (opcional)"><Textarea id="r-notas" name="notas" maxLength={500} placeholder="Cumpleaños, silla para bebé, alergias…" className="min-h-24 resize-none"/></Campo>
                    <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
                    <Button type="submit" size="lg" disabled={enviando}>{enviando ? "Enviando…" : "Solicitar reservación"}</Button>
                    {mensaje && <Alert variant={listo ? "exito" : "destructive"} role="status">
                        {listo ? <CircleCheck/> : <CircleAlert/>}
                        <AlertDescription>{mensaje}</AlertDescription>
                    </Alert>}
                </form>
            </CardContent>
        </Card>
    </main>;
}

function Campo({id, etiqueta, icono, className, children}: {id: string; etiqueta: string; icono?: React.ReactNode; className?: string; children: React.ReactNode}) {
    return <div className={cn("flex flex-col gap-2", className)}>
        <Label htmlFor={id} className="[&>svg]:size-3.5 [&>svg]:text-rojo-texto">{icono}{etiqueta}</Label>
        {children}
    </div>;
}
