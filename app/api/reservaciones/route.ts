import {NextRequest, NextResponse} from "next/server";
import {getSupabaseAdmin} from "../../../lib/supabase-admin";
import {RESTAURANTE, hoy} from "../../../lib/restaurante";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const nombre = String(body.nombre ?? "").trim(), telefono = String(body.telefono ?? "").trim(), notas = String(body.notas ?? "").trim().slice(0, 500);
        const fecha = String(body.fecha ?? ""), hora = String(body.hora ?? ""), personas = Number(body.personas);
        // "website" es un campo oculto: si viene lleno, lo envió un bot.
        if (body.website || !nombre || !telefono) return NextResponse.json({error: "Completa tu nombre y teléfono."}, {status: 400});
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha < hoy()) return NextResponse.json({error: "Elige una fecha a partir de hoy."}, {status: 400});
        if (!RESTAURANTE.horasReserva.includes(hora)) return NextResponse.json({error: "Elige una hora de la lista."}, {status: 400});
        if (!Number.isInteger(personas) || personas < 1 || personas > RESTAURANTE.maxPersonas) return NextResponse.json({error: `Las reservaciones en línea son de 1 a ${RESTAURANTE.maxPersonas} personas.`}, {status: 400});
        const {error} = await getSupabaseAdmin().from("reservaciones").insert({nombre: nombre.slice(0, 120), telefono: telefono.slice(0, 40), fecha, hora, personas, notas});
        if (error) throw error;
        return NextResponse.json({ok: true});
    } catch {
        return NextResponse.json({error: "No se pudo registrar la reservación. Inténtalo nuevamente."}, {status: 500});
    }
}
