"use server";

import { redirect } from "next/navigation";
import { ALIAS_PATTERN } from "@/lib/constants";
import { isPucpEmail } from "@/lib/env";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string } | undefined;

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/explorar";
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isPucpEmail(email)) return { error: "Usa tu correo @pucp.edu.pe." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Correo o contraseña incorrectos." };

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const alias = String(formData.get("alias") ?? "").trim();

  if (!isPucpEmail(email)) return { error: "Solo se aceptan correos @pucp.edu.pe." };
  if (!ALIAS_PATTERN.test(alias)) {
    return { error: "El alias debe tener 3–24 caracteres: letras, números, punto, guion o guion bajo." };
  }
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const admin = createAdminClient();
  // En ILIKE "_" es comodín: se escapa para comparar el alias literal (sin distinguir mayúsculas).
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .ilike("alias", alias.replace(/_/g, "\\_"))
    .maybeSingle();
  if (taken) return { error: "Ese alias ya está en uso. Prueba otro." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { alias } } });
  if (error) {
    if (/registered|exists/i.test(error.message)) return { error: "Ese correo ya tiene una cuenta." };
    return { error: "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }
  if (!data.session) {
    return {
      message: "Cuenta creada. Desactiva 'Confirm email' en Supabase o confirma el correo para ingresar.",
    };
  }

  redirect("/explorar");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
