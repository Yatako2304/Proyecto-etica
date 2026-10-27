import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/session";

export default async function Header() {
  const configured = isSupabaseConfigured();
  const user = configured ? await getSessionUser() : null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={user ? "/explorar" : "/"} className="text-lg font-bold text-brand-700">
          ExamBank <span className="text-slate-900">PUCP</span>
        </Link>

        {user ? (
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/explorar" className="text-slate-600 hover:text-brand-700">Explorar</Link>
            <Link href="/subir" className="text-slate-600 hover:text-brand-700">Subir</Link>
            <Link href="/mis-aportes" className="text-slate-600 hover:text-brand-700">Mis aportes</Link>
            {user.isAdmin && (
              <Link href="/admin" className="font-semibold text-amber-700 hover:text-amber-800">Moderación</Link>
            )}
            <span className="hidden text-slate-400 sm:inline">|</span>
            <span className="text-slate-500">@{user.alias}</span>
            <form action={signOut}>
              <button className="text-slate-500 hover:text-red-600">Salir</button>
            </form>
          </nav>
        ) : configured && (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-slate-600 hover:text-brand-700">Ingresar</Link>
            <Link href="/registro" className="btn-primary">Crear cuenta</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
