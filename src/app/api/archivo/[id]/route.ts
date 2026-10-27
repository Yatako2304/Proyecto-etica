import { NextResponse, type NextRequest } from "next/server";
import { getViewableResource } from "@/lib/access";
import { ALLOWED_MIME_TYPES, STORAGE_BUCKET, type AllowedMime } from "@/lib/constants";
import { getSessionUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/server";

/** Entrega el archivo con una URL firmada de corta duración, tras validar permisos. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const resource = await getViewableResource(id, user);
  if (!resource) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const ext = ALLOWED_MIME_TYPES[resource.file_mime as AllowedMime] ?? "bin";
  const filename = `${resource.courses.code}-${resource.term}-${resource.title}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9-]+/g, "_")
    .slice(0, 80);

  const download = request.nextUrl.searchParams.has("descargar");
  const { data, error } = await createAdminClient()
    .storage.from(STORAGE_BUCKET)
    .createSignedUrl(resource.file_path, 60, download ? { download: `${filename}.${ext}` } : undefined);

  if (error || !data) return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
