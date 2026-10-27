"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp } from "@/app/actions/auth";

export default function AuthForm({ mode, next }: { mode: "login" | "registro"; next?: string }) {
  const isSignup = mode === "registro";
  const [state, action, pending] = useActionState(isSignup ? signUp : signIn, undefined);

  return (
    <div className="card mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{isSignup ? "Crear cuenta" : "Ingresar"}</h1>
        <p className="text-sm text-slate-500">Solo para estudiantes con correo @pucp.edu.pe</p>
      </div>

      <form action={action} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label className="label" htmlFor="email">Correo PUCP</label>
          <input id="email" name="email" type="email" required className="input"
            placeholder="a20251234@pucp.edu.pe" autoComplete="email" />
        </div>
        {isSignup && (
          <div>
            <label className="label" htmlFor="alias">Alias público</label>
            <input id="alias" name="alias" required minLength={3} maxLength={24} className="input"
              placeholder="ej. cachimbo_2025" pattern="[A-Za-z0-9_.\-]{3,24}" />
            <p className="mt-1 text-xs text-slate-500">Es lo que verán los demás. Nunca mostramos tu correo.</p>
          </div>
        )}
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" required minLength={isSignup ? 8 : 1}
            className="input" autoComplete={isSignup ? "new-password" : "current-password"} />
        </div>

        {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}

        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "Un momento…" : isSignup ? "Crear cuenta" : "Ingresar"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        {isSignup ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
        <Link href={isSignup ? "/login" : "/registro"} className="font-medium text-brand-600 hover:underline">
          {isSignup ? "Ingresa" : "Regístrate"}
        </Link>
      </p>
    </div>
  );
}
