"use client";
import {FormEvent, useState} from "react";
import {CircleAlert, CircleCheck, Star} from "lucide-react";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {NativeSelect, NativeSelectOption} from "@/components/ui/native-select";
import {Textarea} from "@/components/ui/textarea";
import {cn} from "@/lib/utils";

const TEXTOS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "¡Excelente!"];

// Ajusta la altura del comentario a lo escrito en navegadores sin field-sizing de CSS (Firefox, Safari viejo).
function ajustarAlto(el: HTMLTextAreaElement) {
    if (CSS.supports("field-sizing", "content")) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
}

export default function FormularioResena({platillos, inicial}: {platillos: {id: number; nombre: string}[]; inicial: string}) {
    const [estrellas, setEstrellas] = useState(0), [encima, setEncima] = useState(0), [sobre, setSobre] = useState(inicial);
    const [mensaje, setMensaje] = useState(""), [enviando, setEnviando] = useState(false), [listo, setListo] = useState(false);
    const mostradas = encima || estrellas;

    async function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (enviando) return;
        if (!estrellas) return setMensaje("Elige de 1 a 5 estrellas.");
        const form = event.currentTarget;
        setEnviando(true); setMensaje("");
        try {
            const datos = {...Object.fromEntries(new FormData(form)), estrellas, platillo_id: sobre || null};
            const response = await fetch("/api/resenas", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(datos)});
            const result = await response.json();
            if (response.ok && result.ok) { form.reset(); form.querySelectorAll("textarea").forEach(t => { t.style.height = ""; }); setEstrellas(0); setListo(true); setMensaje("¡Gracias por tu reseña! La publicaremos en cuanto la revisemos."); }
            else setMensaje(result.error || "No se pudo enviar la reseña.");
        } catch { setMensaje("No se pudo conectar. Inténtalo nuevamente."); }
        finally { setEnviando(false); }
    }

    return <Card className="relative overflow-hidden py-6 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-linear-to-r before:from-brasa before:via-rojo-texto before:to-rojo">
        <CardHeader className="px-6">
            <CardTitle className="font-display text-2xl tracking-wide uppercase">Deja tu reseña</CardTitle>
            <CardDescription>Tu opinión nos ayuda a mejorar. La publicamos después de revisarla.</CardDescription>
        </CardHeader>
        <CardContent className="px-6">
            <form className="flex flex-col gap-5" onSubmit={enviar} onChange={() => listo && setListo(false)}>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="resena-sobre">¿Sobre qué quieres opinar?</Label>
                    <NativeSelect id="resena-sobre" wrapperClassName="w-full" className="h-11" value={sobre} onChange={e => setSobre(e.target.value)}>
                        <NativeSelectOption value="">El lugar en general</NativeSelectOption>
                        {platillos.map(p => <NativeSelectOption key={p.id} value={p.id}>{p.nombre}</NativeSelectOption>)}
                    </NativeSelect>
                </div>

                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                    <legend className="mb-2 p-0 text-sm font-medium">Tu calificación</legend>
                    <div className="flex items-center gap-1" onMouseLeave={() => setEncima(0)}>
                        {[1, 2, 3, 4, 5].map(n => <label key={n} className="cursor-pointer rounded-md p-0.5 transition-transform hover:scale-115 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50" onMouseEnter={() => setEncima(n)}>
                            <input type="radio" name="estrellas-radio" value={n} checked={estrellas === n} onChange={() => setEstrellas(n)} className="sr-only"/>
                            <Star aria-hidden="true" className={cn("size-9 transition-colors", n <= mostradas ? "fill-brasa text-brasa drop-shadow-[0_0_8px_rgba(255,154,60,.55)]" : "fill-transparent text-border")}/>
                            <span className="sr-only">{n} {n === 1 ? "estrella" : "estrellas"}</span>
                        </label>)}
                    </div>
                    <span className="text-sm text-muted-foreground" aria-live="polite">{TEXTOS[mostradas] || "Toca las estrellas"}</span>
                </fieldset>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="resena-nombre">Tu nombre</Label>
                    <Input id="resena-nombre" required name="nombre" maxLength={60} placeholder="Como quieres que aparezca" className="h-11"/>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="resena-comentario">Comentario</Label>
                    {/* field-sizing-content (de shadcn) la hace crecer con el texto; resize-none quita la esquina de arrastre. */}
                    <Textarea id="resena-comentario" required name="comentario" minLength={5} maxLength={600} placeholder="¿Qué te gustó? ¿Qué podemos mejorar?" className="min-h-28 resize-none" onInput={e => ajustarAlto(e.currentTarget)}/>
                </div>
                <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
                <Button type="submit" size="lg" disabled={enviando}>{enviando ? "Enviando…" : "Enviar reseña"}</Button>
                {mensaje && <Alert variant={listo ? "exito" : "destructive"} role="status">
                    {listo ? <CircleCheck/> : <CircleAlert/>}
                    <AlertDescription>{mensaje}</AlertDescription>
                </Alert>}
            </form>
        </CardContent>
    </Card>;
}
