import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/session";

export default async function Header() {
  const configured = isSupabaseConfigured();
  const user = configured ? await getSessionUser() : null;

  return (
    <header className="border-t-4 border-b border-t-brand-600 border-b-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={user ? "/explorar" : "/"} className="flex items-center gap-2.5">
          <Image src="/logo-mark.png" alt="" width={40} height={36} priority className="h-9 w-auto" />
          <span className="text-lg font-extrabold uppercase tracking-wide text-brand-600">
            ExamBank <span className="text-neutral-950">PUCP</span>
          </span>
        </Link>

        {user ? (
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/explorar" className="font-medium text-neutral-700 hover:text-brand-600">Explorar</Link>
            <Link href="/subir" className="font-medium text-neutral-700 hover:text-brand-600">Subir</Link>
            <Link href="/mis-aportes" className="font-medium text-neutral-700 hover:text-brand-600">Mis aportes</Link>
            {user.isAdmin && (
              <Link href="/admin" className="font-semibold text-amber-700 hover:text-amber-800">Moderación</Link>
            )}
            <span className="hidden text-neutral-400 sm:inline">|</span>
            <span className="text-neutral-500">@{user.alias}</span>
            <form action={signOut}>
              <button className="text-neutral-500 hover:text-red-600">Salir</button>
            </form>
          </nav>
        ) : configured && (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="font-medium text-neutral-700 hover:text-brand-600">Ingresar</Link>
            <Link href="/registro" className="btn-primary">Crear cuenta</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
