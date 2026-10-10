"use client";
import {useState} from "react";
import dynamic from "next/dynamic";
import {ChevronsUpDown, LoaderCircle} from "lucide-react";
import {cn} from "@/lib/utils";

export type OpcionPlatillo = {id: number; nombre: string; categoria: string};
type Props = {id?: string; platillos: OpcionPlatillo[]; valor: string; onChange: (valor: string) => void};

export const etiquetaDe = (platillos: OpcionPlatillo[], valor: string) => platillos.find(p => String(p.id) === valor)?.nombre ?? "El lugar en general";

// Botón con aspecto de campo. Lo usan el marcador liviano de abajo y el combobox real (como PopoverTrigger), así no cambia nada al cambiar uno por otro.
export function Disparador({etiqueta, cargando, className, "aria-expanded": expandido = false, ...props}: React.ComponentProps<"button"> & {etiqueta: string; cargando?: boolean}) {
    return <button type="button" role="combobox" aria-haspopup="listbox" aria-expanded={expandido} aria-controls={`${props.id ?? "selector"}-lista`}
        className={cn("flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-input/30 px-3 text-left text-base shadow-xs transition-[color,box-shadow] outline-none hover:bg-input/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm", className)} {...props}>
        <span className="truncate">{etiqueta}</span>
        {cargando ? <LoaderCircle className="size-4 shrink-0 animate-spin opacity-60"/> : <ChevronsUpDown className="size-4 shrink-0 opacity-50"/>}
    </button>;
}

// El combobox (Popover de Radix + cmdk) pesa ~30 KB: se descarga solo cuando la persona se acerca al selector.
const cargarCombobox = () => import("./combobox-platillo");
const ComboboxPlatillo = dynamic(cargarCombobox, {ssr: false, loading: () => <Disparador etiqueta="Cargando…" cargando disabled aria-expanded={false}/>});

export default function SelectorPlatillo({id, platillos, valor, onChange}: Props) {
    const [activo, setActivo] = useState(false);
    if (activo) return <ComboboxPlatillo id={id} platillos={platillos} valor={valor} onChange={onChange} abiertoInicial/>;
    return <Disparador id={id} etiqueta={etiquetaDe(platillos, valor)} aria-expanded={false}
        onPointerEnter={() => { cargarCombobox(); }} onFocus={() => { cargarCombobox(); }} onClick={() => setActivo(true)}/>;
}
