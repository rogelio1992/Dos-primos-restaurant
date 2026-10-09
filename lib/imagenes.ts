// Utilidades de imágenes para /admin (solo navegador).

// Reduce la foto en el navegador antes de subirla (WebP, o JPEG si el navegador no sabe generar WebP).
// Una foto de celular de 3-4 MB queda en decenas de KB: es lo que luego descarga cada visitante.
export async function comprimir(archivo: File, maxLado: number, calidad = 0.78): Promise<Blob> {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, maxLado / Math.max(imagen.width, imagen.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imagen.width * escala); canvas.height = Math.round(imagen.height * escala);
    canvas.getContext("2d")!.drawImage(imagen, 0, 0, canvas.width, canvas.height);
    const exportar = (tipo: string) => new Promise<Blob | null>(listo => canvas.toBlob(listo, tipo, calidad));
    // Safari viejo no sabe generar WebP y devuelve PNG: en ese caso usar JPEG.
    const webp = await exportar("image/webp");
    const blob = webp?.type === "image/webp" ? webp : await exportar("image/jpeg");
    if (!blob) throw new Error("No se pudo procesar la imagen");
    return blob;
}

export const extension = (blob: Blob) => blob.type === "image/webp" ? "webp" : "jpg";

// Ruta dentro del bucket si la URL es de nuestro Storage; null si es un enlace externo.
export function rutaEnBucket(url: string | null | undefined, bucket: string) {
    const marca = `/storage/v1/object/public/${bucket}/`;
    return url?.includes(marca) ? url.split(marca)[1] : null;
}
