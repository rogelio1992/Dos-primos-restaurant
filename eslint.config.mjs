import {defineConfig, globalIgnores} from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
    ...nextVitals,
    {
        rules: {
            // Las fotos ya se suben comprimidas desde /admin; next/image las pasaría por el optimizador de Vercel (costo y límites).
            "@next/next/no-img-element": "off",
            // Regla nueva de React 19: marca cargar datos al montar (useEffect(() => { cargar(); })). Se deja como aviso.
            "react-hooks/set-state-in-effect": "warn"
        }
    },
    globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".claude/**"])
]);
