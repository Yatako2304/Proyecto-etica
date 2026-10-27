"use server";

import { revalidatePath } from "next/cache";
import { STORAGE_BUCKET } from "@/lib/constants";
import { requireAdmin } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/server";

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/explorar");
  revalidatePath("/mis-aportes");
}

export async function approveResource(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await createAdminClient()
    .from("resources")
    .update({ status: "approved", reject_reason: null, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  refresh();
}

export async function rejectResource(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300) || "No cumple las normas de la comunidad.";
  const admin = createAdminClient();

  const { data } = await admin
    .from("resources")
    .update({ status: "rejected", reject_reason: reason, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select("file_path")
    .maybeSingle();
  // El archivo rechazado no se vuelve a servir: se borra para no ocupar espacio.
  if (data?.file_path) await admin.storage.from(STORAGE_BUCKET).remove([data.file_path]);
  refresh();
}

export async function approveCourse(formData: FormData) {
  await requireAdmin();
  await createAdminClient().from("courses").update({ status: "approved" }).eq("id", Number(formData.get("id")));
  refresh();
}

export async function rejectCourse(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const admin = createAdminClient();
  await admin.from("courses").update({ status: "rejected" }).eq("id", id);

  // Lo pendiente de un curso rechazado no puede publicarse.
  const { data: orphaned } = await admin
    .from("resources")
    .update({ status: "rejected", reject_reason: "El curso fue rechazado.", reviewed_at: new Date().toISOString() })
    .eq("course_id", id)
    .eq("status", "pending")
    .select("file_path");
  if (orphaned?.length) await admin.storage.from(STORAGE_BUCKET).remove(orphaned.map((r) => r.file_path));
  refresh();
}
