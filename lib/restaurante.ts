// Datos fijos del restaurante. Cambiarlos aquí hasta que se puedan editar desde /admin.
export const RESTAURANTE = {
    nombre: "Dos Primos",
    lema: "Cocina casera para compartir",
    direccion: "Vía Blanca, Peñas Altas, Matanzas, Cuba",
    // Enlace para "Cómo llegar" y coordenadas para el mapa de la portada.
    mapa: "https://maps.app.goo.gl/56y5njCMzXCNYCeH8",
    coordenadas: "23.039539,-81.533936",
    horario: "Martes a domingo · 13:00 a 22:00",
    whatsapp: "",
    zonaHoraria: "America/Havana",
    moneda: "CUP",
    // Horas que se ofrecen en el formulario de reservación.
    horasReserva: ["13:00", "13:30", "14:00", "14:30", "15:00", "19:00", "19:30", "20:00", "20:30", "21:00"],
    maxPersonas: 20,
    // Tarjetas de "Los favoritos de la casa" en la portada. El mismo límite está en supabase/schema.sql (limite_destacados).
    maxDestacados: 3
};

export type Categoria = {id: number; nombre: string; orden: number};
export type Platillo = {id: number; categoria_id: number; nombre: string; descripcion: string; precio: number; foto_url: string | null; disponible: boolean; destacado: boolean; orden: number};
export type Reservacion = {id: number; nombre: string; telefono: string; fecha: string; hora: string; personas: number; estado: string; notas: string; created_at: string};

export const ESTADOS: Record<string, string> = {pendiente: "Pendiente", confirmada: "Confirmada", cancelada: "Cancelada", completada: "Completada", no_asistio: "No asistió"};

// Formato cubano ($8,900) con el código al final, para que no se confunda con dólares.
export const dinero = (valor: number) => `${new Intl.NumberFormat("es-CU", {style: "currency", currency: RESTAURANTE.moneda, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0}).format(valor)} ${RESTAURANTE.moneda}`;

export const hoy = () => new Date().toLocaleDateString("en-CA", {timeZone: RESTAURANTE.zonaHoraria});

export const whatsappLink = (numero: string) => {
    const digitos = numero.replace(/\D/g, "");
    return digitos ? `https://wa.me/${digitos}` : null;
};
