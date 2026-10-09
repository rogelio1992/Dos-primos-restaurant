import type {CSSProperties} from "react";

// Chispas que suben desde el fondo del hero. Posiciones fijas (no Math.random) para que el HTML del servidor y el del navegador coincidan.
export default function Brasas({cantidad = 28}: {cantidad?: number}) {
    return <div className="brasas" aria-hidden="true">{Array.from({length: cantidad}, (_, i) => <span key={i} style={{
        "--x": `${(i * 37) % 100}%`,
        "--dx": `${((i * 53) % 120) - 60}px`,
        "--s": `${2 + (i % 4)}px`,
        "--d": `${5 + (i * 7) % 6}s`,
        "--delay": `${-((i * 13) % 9)}s`
    } as CSSProperties}/>)}</div>;
}
