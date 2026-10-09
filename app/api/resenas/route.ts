import {createHash} from "crypto";
import {NextRequest, NextResponse} from "next/server";
import {getSupabaseAdmin} from "../../../lib/supabase-admin";

const POR_HORA = 3;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const nombre = String(body.nombre ?? "").trim().slice(0, 60), comentario = String(body.comentario ?? "").trim().slice(0, 600);
        const estrellas = Number(body.estrellas), platillo_id = body.platillo_id ? Number(body.platillo_id) : null;
        // "website" es un campo oculto: si viene lleno, lo envió un bot.
        if (body.website || !nombre || comentario.length < 5) return NextResponse.json({error: "Escribe tu nombre y un comentario de al menos 5 letras."}, {status: 400});
        if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) return NextResponse.json({error: "Elige de 1 a 5 estrellas."}, {status: 400});

        const db = getSupabaseAdmin();
        if (platillo_id !== null) {
            const {data} = await db.from("platillos").select("id").eq("id", platillo_id).eq("disponible", true).maybeSingle();
            if (!data) return NextResponse.json({error: "Ese platillo ya no está en el menú."}, {status: 400});
        }

        // Huella de la conexión (no se guarda la IP): máximo POR_HORA reseñas por hora desde el mismo lugar.
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "";
        const ip_hash = createHash("sha256").update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY}`).digest("hex").slice(0, 32);
        const haceUnaHora = new Date(Date.now() - 3600_000).toISOString();
        const {count} = await db.from("resenas").select("id", {count: "exact", head: true}).eq("ip_hash", ip_hash).gte("created_at", haceUnaHora);
        if ((count ?? 0) >= POR_HORA) return NextResponse.json({error: "Ya recibimos varias reseñas tuyas. Inténtalo más tarde."}, {status: 429});

        const {error} = await db.from("resenas").insert({nombre, comentario, estrellas, platillo_id, ip_hash});
        if (error) throw error;
        return NextResponse.json({ok: true});
    } catch {
        return NextResponse.json({error: "No se pudo enviar la reseña. Inténtalo nuevamente."}, {status: 500});
    }
}
