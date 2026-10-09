import {ViewTransition} from "react";

// Fundido al cambiar entre páginas públicas. Va en cada página (no en el layout: el layout persiste y nunca dispara enter/exit).
// Las páginas del header son hermanas, así que es un fundido y no un deslizamiento: no hay "más adentro" ni "atrás".
export default function TransicionPagina({children}: {children: React.ReactNode}) {
    return <ViewTransition enter="pagina-entra" exit="pagina-sale" default="none">{children}</ViewTransition>;
}
