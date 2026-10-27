import Link from "next/link";
import { sanitizeSearch } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { CourseSummary } from "@/lib/types";

export default async function ExplorarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = sanitizeSearch(q);
  const supabase = await createClient();

  const [{ data: faculties }, { data: courses }] = await Promise.all([
    supabase.from("faculties").select("id, slug, name").order("name"),
    supabase.from("course_summary").select("faculty_id, resource_count"),
  ]);

  let results: CourseSummary[] = [];
  if (query) {
    const { data } = await supabase
      .from("course_summary")
      .select("*")
      .or(`code.ilike.%${query}%,name.ilike.%${query}%`)
      .order("resource_count", { ascending: false })
      .limit(30);
    results = (data ?? []) as CourseSummary[];
  }

  const stats = new Map<number, { courses: number; resources: number }>();
  for (const c of courses ?? []) {
    const s = stats.get(c.faculty_id) ?? { courses: 0, resources: 0 };
    s.courses += 1;
    s.resources += c.resource_count;
    stats.set(c.faculty_id, s);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Explorar</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} className="input" placeholder="Busca un curso por código o nombre (ej. 1MAT05, Física)" />
          <button className="btn-primary">Buscar</button>
        </form>
      </div>

      {query && (
        <section className="space-y-3">
          <h2 className="font-semibold text-slate-700">Resultados para “{query}”</h2>
          {results.length === 0 ? (
            <p className="text-sm text-slate-500">
              No encontramos ese curso. <Link href="/proponer-curso" className="text-brand-600 underline">Propónlo aquí</Link>.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((c) => (
                <Link key={c.id} href={`/curso/${c.code}`} className="card hover:border-brand-500">
                  <div className="text-xs font-semibold text-brand-600">{c.code} · {c.faculty_name}</div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.resource_count} recursos</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-700">Facultades</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(faculties ?? []).map((f) => {
            const s = stats.get(f.id);
            return (
              <Link key={f.id} href={`/facultad/${f.slug}`} className="card hover:border-brand-500">
                <div className="font-semibold">{f.name}</div>
                <div className="text-xs text-slate-500">
                  {s?.courses ?? 0} cursos · {s?.resources ?? 0} recursos
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
