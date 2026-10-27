import Link from "next/link";
import { approveCourse, approveResource, rejectCourse, rejectResource } from "@/app/actions/admin";
import { TypeBadge } from "@/components/ResourceCard";
import type { ResourceType } from "@/lib/constants";
import { formatBytes, formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/server";

type PendingResource = {
  id: string;
  type: ResourceType;
  evaluation: string | null;
  term: string;
  title: string;
  file_size: number;
  is_anonymous: boolean;
  created_at: string;
  courses: { code: string; name: string; status: string };
  profiles: { alias: string; email: string };
};

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: resources }, { data: courses }] = await Promise.all([
    admin
      .from("resources")
      .select("id, type, evaluation, term, title, file_size, is_anonymous, created_at, courses(code, name, status), profiles!resources_uploader_id_fkey(alias, email)")
      .eq("status", "pending")
      .order("created_at")
      .returns<PendingResource[]>(),
    admin
      .from("courses")
      .select("id, code, name, created_at, faculties(name), profiles(alias, email)")
      .eq("status", "pending")
      .order("created_at"),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Moderación</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cursos propuestos ({courses?.length ?? 0})</h2>
        {!courses?.length && <p className="text-sm text-neutral-500">Nada pendiente.</p>}
        {courses?.map((c) => {
          const faculty = c.faculties as unknown as { name: string } | null;
          const proposer = c.profiles as unknown as { alias: string; email: string } | null;
          return (
            <div key={c.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold"><span className="text-brand-600">{c.code}</span> {c.name}</div>
                <div className="text-xs text-neutral-500">
                  {faculty?.name} · por @{proposer?.alias} ({proposer?.email}) · {formatDate(c.created_at)}
                </div>
              </div>
              <div className="flex gap-2">
                <form action={approveCourse}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="btn-primary">Aprobar</button>
                </form>
                <form action={rejectCourse}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="btn-secondary text-red-600 hover:border-red-400 hover:text-red-700">Rechazar</button>
                </form>
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Material pendiente ({resources?.length ?? 0})</h2>
        {!resources?.length && <p className="text-sm text-neutral-500">Nada pendiente.</p>}
        {resources?.map((r) => (
          <div key={r.id} className="card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={r.type} />
                  <span className="text-xs text-neutral-500">
                    {r.courses.code} {r.courses.name} · {r.evaluation ?? ""} {r.term}
                  </span>
                  {r.courses.status !== "approved" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      Curso aún no aprobado
                    </span>
                  )}
                </div>
                <div className="font-semibold">{r.title}</div>
                <div className="text-xs text-neutral-500">
                  @{r.profiles.alias} ({r.profiles.email}){r.is_anonymous ? " · pidió anonimato" : ""} ·{" "}
                  {formatBytes(r.file_size)} · {formatDate(r.created_at)}
                </div>
              </div>
              <Link href={`/recurso/${r.id}`} target="_blank" className="btn-secondary">Revisar archivo ↗</Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
              <form action={approveResource}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn-primary">Aprobar</button>
              </form>
              <form action={rejectResource} className="flex flex-1 gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input name="reason" className="input" placeholder="Motivo del rechazo (ilegible, duplicado, datos personales…)" />
                <button className="btn-secondary text-red-600 hover:border-red-400 hover:text-red-700">Rechazar</button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
