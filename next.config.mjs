/** @type {import('next').NextConfig} */
const nextConfig = {
    // El logo casi nunca cambia: que el teléfono lo guarde una semana en vez de volver a preguntar en cada visita.
    // Si se reemplaza el logo, cambiar el nombre del archivo para que todos vean el nuevo.
    async headers() {
        return [{source: "/logo.webp", headers: [{key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400"}]}];
    }
};

export default nextConfig;
