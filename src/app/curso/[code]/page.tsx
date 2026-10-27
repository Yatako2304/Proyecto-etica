import Link from "next/link";
import { notFound } from "next/navigation";
import ResourceCard from "@/components/ResourceCard";
import { RESOURCE_TYPES, isResourceType } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { CourseSummary, FeedResource } from "@/lib/types";

type Search = { tipo?: string; ciclo?: string; orden?: string };

export default async function CursoPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Search>;
}) {
  const { code } = await params;
  const { tipo, ciclo, orden } = await searchParams;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("course_summary")
    .select("*")
    .eq("code", decodeURIComponent(code).toUpperCase())
    .maybeSingle<CourseSummary>();
  if (!course) notFound();

  let query = supabase.from("resource_feed").select("*").eq("course_id", course.id);
  if (isResourceType(tipo)) query = query.eq("type", tipo);
  if (ciclo) query = query.eq("term", ciclo);
  query =
    orden === "recientes"
      ? query.order("created_at", { ascending: false })
      : query.order("score", { ascending: false }).order("created_at", { ascending: false });

  const [{ data }, { data: termRows }] = await Promise.all([
    query.limit(200),
    supabase.from("resource_feed").select("term").eq("course_id", course.id),
  ]);
  const resources = (data ?? []) as FeedResource[];
  const terms = [...new Set((termRows ?? []).map((r) => r.term as string))].sort().reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/facultad/${course.faculty_slug}`} className="text-sm text-brand-600 hover:underline">
            ← {course.faculty_name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">
            <span className="text-brand-600">{course.code}</span> {course.name}
          </h1>
        </div>
        <Link href={`/subir?curso=${course.id}`} className="btn-primary">+ Subir material</Link>
      </div>

      <form className="flex flex-wrap gap-2">
        <select name="tipo" defaultValue={tipo ?? ""} className="input w-auto">
          <option value="">Todos los tipos</option>
          {Object.entries(RESOURCE_TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select name="ciclo" defaultValue={ciclo ?? ""} className="input w-auto">
          <option value="">Todos los ciclos</option>
          {terms.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select name="orden" defaultValue={orden ?? "utiles"} className="input w-auto">
          <option value="utiles">Más útiles</option>
          <option value="recientes">Más recientes</option>
        </select>
        <button className="btn-secondary">Filtrar</button>
      </form>

      {resources.length === 0 ? (
        <div className="card text-center text-sm text-slate-500">
          Aún no hay material publicado con estos filtros. ¡Sé el primero en{" "}
          <Link href={`/subir?curso=${course.id}`} className="text-brand-600 underline">subir algo</Link>!
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}
