import type {Metadata} from "next";
export const metadata: Metadata = {title: "Administración | Dos Primos", robots: {index: false, follow: false}};
export default function AdminLayout({children}: {children: React.ReactNode}) { return <>{children}</>; }
