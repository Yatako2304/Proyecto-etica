import Link from "next/link";
import { TypeBadge } from "@/components/ResourceCard";
import { STATUS_LABELS, type Status } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { OwnResource } from "@/lib/types";

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-brand-50 text-brand-700",
  rejected: "bg-red-50 text-red-700",
};

export default async function MisAportesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: resources }, { data: courses }] = await Promise.all([
    supabase
      .from("resources")
      .select("id, type, evaluation, term, title, status, reject_reason, created_at, courses(code, name)")
      .eq("uploader_id", user.id)
      .order("created_at", { ascending: false })
      .returns<OwnResource[]>(),
    supabase
      .from("courses")
      .select("id, code, name, status")
      .eq("proposed_by", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis aportes</h1>
        <Link href="/subir" className="btn-primary">+ Subir material</Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-neutral-700">Material subido ({resources?.length ?? 0})</h2>
        {!resources?.length ? (
          <p className="text-sm text-neutral-500">Aún no has subido nada.</p>
        ) : (
          resources.map((r) => (
            <Link key={r.id} href={`/recurso/${r.id}`} className="card flex items-start justify-between gap-3 hover:border-brand-500">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={r.type} />
                  <span className="text-xs text-neutral-500">{r.courses?.code} · {r.evaluation ?? ""} {r.term}</span>
                </div>
                <div className="truncate font-semibold">{r.title}</div>
                {r.status === "rejected" && r.reject_reason && (
                  <p className="text-xs text-red-600">Motivo: {r.reject_reason}</p>
                )}
                <p className="text-xs text-neutral-400">{formatDate(r.created_at)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                {STATUS_LABELS[r.status]}
              </span>
            </Link>
          ))
        )}
      </section>

      {!!courses?.length && (
        <section className="space-y-3">
          <h2 className="font-semibold text-neutral-700">Cursos propuestos</h2>
          {courses.map((c) => (
            <div key={c.id} className="card flex items-center justify-between">
              <span><b>{c.code}</b> {c.name}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[c.status as Status]}`}>
                {STATUS_LABELS[c.status as Status]}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
