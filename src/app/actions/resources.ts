"use server";

import { revalidatePath } from "next/cache";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  SOLVABLE_TYPES,
  TERM_PATTERN,
  isResourceType,
} from "@/lib/constants";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type CreateResourceInput = {
  courseId: number;
  type: string;
  evaluation: string;
  term: string;
  professor: string;
  title: string;
  description: string;
  parentId: string | null;
  isAnonymous: boolean;
  filePath: string;
  fileMime: string;
  fileSize: number;
};

export async function createResource(input: CreateResourceInput): Promise<{ error?: string; id?: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const title = input.title.trim();
  if (!isResourceType(input.type)) return { error: "Tipo de material inválido." };
  if (title.length < 3 || title.length > 140) return { error: "El título debe tener entre 3 y 140 caracteres." };
  if (!TERM_PATTERN.test(input.term)) return { error: "Ciclo inválido (formato 2025-1)." };
  if (!(input.fileMime in ALLOWED_MIME_TYPES)) return { error: "Solo se aceptan PDF, JPG o PNG." };
  if (input.fileSize <= 0 || input.fileSize > MAX_FILE_BYTES) return { error: "El archivo supera los 20 MB." };
  if (!input.filePath.startsWith(`${user.id}/`)) return { error: "Ruta de archivo inválida." };

  // RLS: solo devuelve cursos aprobados o propuestos por el usuario.
  const { data: course } = await supabase.from("courses").select("id").eq("id", input.courseId).maybeSingle();
  if (!course) return { error: "Curso no encontrado." };

  let parentId: string | null = null;
  if (input.type === "solucionario" && input.parentId) {
    const { data: parent } = await supabase
      .from("resource_feed")
      .select("id, type, course_id")
      .eq("id", input.parentId)
      .maybeSingle();
    if (!parent || parent.course_id !== input.courseId || !SOLVABLE_TYPES.includes(parent.type)) {
      return { error: "El material que resuelves no es válido para este curso." };
    }
    parentId = parent.id;
  }

  const { data, error } = await supabase
    .from("resources")
    .insert({
      course_id: input.courseId,
      uploader_id: user.id,
      parent_id: parentId,
      type: input.type,
      evaluation: input.evaluation.trim().slice(0, 40) || null,
      term: input.term,
      professor: input.professor.trim().slice(0, 80) || null,
      title,
      description: input.description.trim().slice(0, 2000) || null,
      file_path: input.filePath,
      file_mime: input.fileMime,
      file_size: input.fileSize,
      is_anonymous: input.isAnonymous,
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo guardar el material. Inténtalo de nuevo." };
  revalidatePath("/mis-aportes");
  revalidatePath("/admin");
  return { id: data.id };
}

/** Lista exámenes/labs/tareas publicados del curso, para vincular un solucionario. */
export async function listSolvableResources(courseId: number) {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("resource_feed")
    .select("id, type, evaluation, term, title")
    .eq("course_id", courseId)
    .in("type", SOLVABLE_TYPES)
    .order("term", { ascending: false })
    .limit(200);
  return data ?? [];
}

/** Votar útil (+1) / no útil (-1). Votar lo mismo otra vez quita el voto. */
export async function vote(resourceId: string, value: 1 | -1): Promise<{ error?: string }> {
  const user = await requireUser();
  if (value !== 1 && value !== -1) return { error: "Voto inválido." };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("votes")
    .select("value")
    .eq("resource_id", resourceId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } =
    existing?.value === value
      ? await supabase.from("votes").delete().eq("resource_id", resourceId).eq("user_id", user.id)
      : await supabase
          .from("votes")
          .upsert({ resource_id: resourceId, user_id: user.id, value }, { onConflict: "resource_id,user_id" });

  if (error) return { error: "No se pudo registrar tu voto." };
  revalidatePath(`/recurso/${resourceId}`);
  return {};
}
