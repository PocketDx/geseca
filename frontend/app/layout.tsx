import type { Metadata } from "next";

import "./globals.css";
import NavBar from "./components/nav-bar";

export const metadata: Metadata = {
  title: "SmartWash",
  description: "Gestion operativa y fidelizacion para lavanderias",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full">
      <body className="flex min-h-full flex-col">
        <NavBar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}