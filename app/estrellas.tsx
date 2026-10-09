// Cinco estrellas grises con una capa encendida encima recortada al porcentaje: admite medios puntos (4.5).
export default function Estrellas({valor, grande = false}: {valor: number; grande?: boolean}) {
    return <span className={grande ? "estrellas grande" : "estrellas"} role="img" aria-label={`${valor} de 5 estrellas`}>
        <span style={{width: `${(valor / 5) * 100}%`}}>★★★★★</span>★★★★★
    </span>;
}
