import type { Metadata, Viewport } from "next";

import "./globals.css";
import NavBar from "./components/nav-bar";

export const metadata: Metadata = {
  title: "SmartWash",
  description: "Gestion operativa y fidelizacion para lavanderias",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a121b" },
  ],
};

const APLICAR_TEMA = `(function(){try{var t=localStorage.getItem("sw-tema");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APLICAR_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col">
        <NavBar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
