import {clsx, type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

// Une clases de Tailwind resolviendo conflictos (la usan los componentes de components/ui, de shadcn).
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
