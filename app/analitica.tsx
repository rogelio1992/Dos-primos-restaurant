"use client";
import {Analytics} from "@vercel/analytics/next";

// Visitas en Vercel → Analytics. No cuenta /admin, para que las entradas al panel no inflen las estadísticas.
export default function Analitica() {
    return <Analytics beforeSend={evento => evento.url.includes("/admin") ? null : evento}/>;
}
