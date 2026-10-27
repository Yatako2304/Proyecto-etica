import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CourseSummary } from "@/lib/types";

export default async function FacultadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: faculty } = await supabase.from("faculties").select("id, name").eq("slug", slug).maybeSingle();
  if (!faculty) notFound();

  const { data } = await supabase
    .from("course_summary")
    .select("*")
    .eq("faculty_id", faculty.id)
    .order("code");
  const courses = (data ?? []) as CourseSummary[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/explorar" className="text-sm text-brand-600 hover:underline">← Facultades</Link>
        <h1 className="mt-1 text-2xl font-bold">{faculty.name}</h1>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-slate-500">Aún no hay cursos en esta facultad.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <Link key={c.id} href={`/curso/${c.code}`} className="card flex items-center justify-between hover:border-brand-500">
              <div>
                <div className="text-xs font-semibold text-brand-600">{c.code}</div>
                <div className="font-semibold">{c.name}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {c.resource_count}
              </span>
            </Link>
          ))}
        </div>
      )}

      <p className="text-sm text-slate-500">
        ¿Falta un curso? <Link href="/proponer-curso" className="text-brand-600 underline">Propónlo</Link>.
      </p>
    </div>
  );
}
