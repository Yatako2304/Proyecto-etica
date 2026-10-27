import "server-only";
import type { ResourceType, Status } from "@/lib/constants";
import type { SessionUser } from "@/lib/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type ViewableResource = {
  id: string;
  parent_id: string | null;
  uploader_id: string;
  type: ResourceType;
  evaluation: string | null;
  term: string;
  professor: string | null;
  title: string;
  description: string | null;
  file_path: string;
  file_mime: string;
  file_size: number;
  is_anonymous: boolean;
  status: Status;
  reject_reason: string | null;
  created_at: string;
  courses: { id: number; code: string; name: string; status: Status };
  profiles: { alias: string; email: string };
  score: number;
  upvotes: number;
  downvotes: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Devuelve el recurso si el usuario puede verlo: publicado, subido por él, o es admin.
 * La autorización se decide con el cliente del usuario (RLS); solo después se usa
 * el cliente admin para leer la fila completa (ruta del archivo, autor real).
 */
export async function getViewableResource(id: string, user: SessionUser): Promise<ViewableResource | null> {
  if (!UUID_PATTERN.test(id)) return null;

  const supabase = await createClient();
  const { data: feed } = await supabase
    .from("resource_feed")
    .select("score, upvotes, downvotes")
    .eq("id", id)
    .maybeSingle();

  if (!feed && !user.isAdmin) {
    const { data: own } = await supabase.from("resources").select("id").eq("id", id).maybeSingle();
    if (!own) return null;
  }

  const { data } = await createAdminClient()
    .from("resources")
    // FK explícita: resources↔profiles también se relacionan a través de votes.
    .select("*, courses(id, code, name, status), profiles!resources_uploader_id_fkey(alias, email)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  return { ...data, score: feed?.score ?? 0, upvotes: feed?.upvotes ?? 0, downvotes: feed?.downvotes ?? 0 };
}
