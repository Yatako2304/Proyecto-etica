import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamBank PUCP",
  description: "Banco comunitario de exámenes pasados, solucionarios y apuntes para estudiantes PUCP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          ExamBank PUCP es un proyecto estudiantil y no es un servicio oficial de la PUCP.
        </footer>
      </body>
    </html>
  );
}
