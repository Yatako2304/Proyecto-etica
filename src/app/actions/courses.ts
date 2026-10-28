"use server";

import { revalidatePath } from "next/cache";
import { COURSE_CODE_PATTERN } from "@/lib/constants";
import { requireUser } from "@/lib/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type ProposeState = { error?: string; message?: string } | undefined;

export async function proposeCourse(_prev: ProposeState, formData: FormData): Promise<ProposeState> {
  const user = await requireUser();
  const facultyId = Number(formData.get("faculty_id"));
  const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const name = String(formData.get("name") ?? "").trim();

  if (!facultyId) return { error: "Elige una facultad." };
  if (!COURSE_CODE_PATTERN.test(code)) return { error: "El código debe tener 3–10 letras o números (ej. 1MAT05)." };
  if (name.length < 3 || name.length > 120) return { error: "El nombre debe tener entre 3 y 120 caracteres." };

  // El código es único globalmente; se consulta con admin para ver también los pendientes de otros.
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("courses")
    .select("id, status")
    .eq("code", code)
    .maybeSingle();
  if (existing?.status === "approved") return { error: `El curso ${code} ya existe. Búscalo en Explorar.` };
  if (existing?.status === "pending") return { error: `El curso ${code} ya fue propuesto y está en revisión.` };

  // Un curso rechazado no bloquea el código: la nueva propuesta reemplaza a la anterior.
  if (existing?.status === "rejected") {
    const { error } = await admin
      .from("courses")
      .update({ faculty_id: facultyId, name, proposed_by: user.id, status: "pending" })
      .eq("id", existing.id);
    if (error) return { error: "No se pudo enviar la propuesta." };
    revalidatePath("/admin");
    return { message: `¡Listo! ${code} quedó en revisión. Ya puedes subir material a este curso.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .insert({ faculty_id: facultyId, code, name, proposed_by: user.id, status: "pending" });
  if (error) return { error: "No se pudo enviar la propuesta." };

  revalidatePath("/admin");
  return { message: `¡Listo! ${code} quedó en revisión. Ya puedes subir material a este curso.` };
}
