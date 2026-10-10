import {MessageSquareReply, Store, UtensilsCrossed} from "lucide-react";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import Estrellas from "../estrellas";
import {RESTAURANTE, Resena, fechaCorta} from "../../lib/restaurante";

export default function TarjetaResena({r, className}: {r: Resena; className?: string}) {
    return <Card className={`relative gap-4 overflow-hidden bg-linear-to-br from-[#2a201d] to-card to-60% py-5 transition-colors hover:border-rojo-texto/40 ${className ?? ""}`}>
        {/* Comilla grande de fondo */}
        <span aria-hidden="true" className="pointer-events-none absolute -top-4 right-4 font-display text-[110px] leading-none text-rojo-texto/10 select-none">“</span>
        <CardHeader className="flex items-center gap-3 px-5">
            <Avatar className="size-10">
                <AvatarFallback className="bg-fuego font-display text-lg text-white">{r.nombre.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <p className="m-0 truncate font-semibold">{r.nombre}</p>
                <p className="m-0 text-xs text-muted-foreground">{fechaCorta(r.created_at)}</p>
            </div>
            <Estrellas valor={r.estrellas}/>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-5">
            <Badge variant="outline" className="gap-1 border-rojo-texto/30 text-muted-foreground">
                {r.platillos ? <UtensilsCrossed/> : <Store/>}{r.platillos?.nombre ?? "El lugar"}
            </Badge>
            <p className="m-0 leading-relaxed whitespace-pre-line">{r.comentario}</p>
            {r.respuesta && <div className="rounded-lg border-l-2 border-rojo-texto bg-rojo-texto/5 px-4 py-3">
                <p className="m-0 mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-rojo-texto uppercase"><MessageSquareReply className="size-3.5"/>Respuesta de {RESTAURANTE.nombre}</p>
                <p className="m-0 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{r.respuesta}</p>
            </div>}
        </CardContent>
    </Card>;
}
