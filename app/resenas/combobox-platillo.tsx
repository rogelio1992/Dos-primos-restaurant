"use client";
import {useState} from "react";
import {Check, Store} from "lucide-react";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {Disparador, OpcionPlatillo, etiquetaDe} from "./selector-platillo";

// Búsqueda sin acentos ni mayúsculas: "cafe" encuentra "Café".
const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

type Props = {id?: string; platillos: OpcionPlatillo[]; valor: string; onChange: (valor: string) => void; abiertoInicial?: boolean};

export default function ComboboxPlatillo({id, platillos, valor, onChange, abiertoInicial = false}: Props) {
    const [abierto, setAbierto] = useState(abiertoInicial);
    const categorias = Array.from(new Set(platillos.map(p => p.categoria)));
    const elegir = (nuevo: string) => { onChange(nuevo); setAbierto(false); };

    return <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger asChild>
            <Disparador id={id} etiqueta={etiquetaDe(platillos, valor)} aria-expanded={abierto}/>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
            <Command filter={(texto, busqueda, claves) => normalizar([texto, ...(claves ?? [])].join(" ")).includes(normalizar(busqueda)) ? 1 : 0}>
                <CommandInput placeholder="Buscar platillo…" className="text-base md:text-sm"/>
                <CommandList className="max-h-72">
                    <CommandEmpty>No encontramos ese platillo.</CommandEmpty>
                    <CommandGroup>
                        {/* Siempre visible, busques lo que busques. */}
                        <CommandItem value="El lugar en general" forceMount onSelect={() => elegir("")}>
                            <Store className="text-rojo-texto"/>El lugar en general
                            <Check className={cn("ml-auto", valor === "" ? "opacity-100" : "opacity-0")}/>
                        </CommandItem>
                    </CommandGroup>
                    {categorias.map(cat => <CommandGroup key={cat} heading={cat}>
                        {platillos.filter(p => p.categoria === cat).map(p => <CommandItem key={p.id} value={`${p.nombre} ${p.id}`} keywords={[cat]} onSelect={() => elegir(String(p.id))}>
                            {p.nombre}
                            <Check className={cn("ml-auto", valor === String(p.id) ? "opacity-100" : "opacity-0")}/>
                        </CommandItem>)}
                    </CommandGroup>)}
                </CommandList>
            </Command>
        </PopoverContent>
    </Popover>;
}
