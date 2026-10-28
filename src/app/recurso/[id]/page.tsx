import Link from "next/link";
import { notFound } from "next/navigation";
import ResourceCard, { TypeBadge } from "@/components/ResourceCard";
import DeleteResourceButton from "@/components/DeleteResourceButton";
import VoteButtons from "@/components/VoteButtons";
import { getViewableResource } from "@/lib/access";
import { SOLVABLE_TYPES, STATUS_LABELS } from "@/lib/constants";
import { formatBytes, formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { FeedResource } from "@/lib/types";

export default async function RecursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const resource = await getViewableResource(id, user);
  if (!resource) notFound();

  const supabase = await createClient();
  const isPublished = resource.status === "approved";
  const fileUrl = `/api/archivo/${resource.id}`;

  const [{ data: myVote }, { data: solutions }, { data: parent }] = await Promise.all([
    supabase.from("votes").select("value").eq("resource_id", resource.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("resource_feed").select("*").eq("parent_id", resource.id).order("score", { ascending: false }),
    resource.parent_id
      ? supabase.from("resource_feed").select("id, title, evaluation, term").eq("id", resource.parent_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isOwner = resource.uploader_id === user.id;
  const showRealAuthor = user.isAdmin || isOwner;
  const author = resource.is_anonymous
    ? `Anónimo${showRealAuthor ? ` (@${resource.profiles.alias}${user.isAdmin ? ` · ${resource.profiles.email}` : ""})` : ""}`
    : `@${resource.profiles.alias}`;

  return (
    <div className="space-y-6">
      <Link href={`/curso/${resource.courses.code}`} className="text-sm text-brand-600 hover:underline">
        ← {resource.courses.code} {resource.courses.name}
      </Link>

      {!isPublished && (
        <div className={`rounded-lg p-3 text-sm ${resource.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
          <b>{STATUS_LABELS[resource.status]}.</b>{" "}
          {resource.status === "pending"
            ? "Solo tú y los moderadores pueden ver este material hasta que sea aprobado."
            : `Motivo: ${resource.reject_reason ?? "sin detalle"}`}
        </div>
      )}

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={resource.type} />
          {resource.evaluation && <span className="text-sm font-medium text-neutral-700">{resource.evaluation}</span>}
          <span className="text-sm text-neutral-500">Ciclo {resource.term}</span>
        </div>
        <h1 className="text-2xl font-bold">{resource.title}</h1>
        {parent && (
          <p className="text-sm">
            Resuelve:{" "}
            <Link href={`/recurso/${parent.id}`} className="text-brand-600 underline">
              {parent.title} ({parent.evaluation ?? ""} {parent.term})
            </Link>
          </p>
        )}
        {resource.description && <p className="whitespace-pre-line text-sm text-neutral-700">{resource.description}</p>}
        <p className="text-xs text-neutral-500">
          {resource.professor && <>Prof. {resource.professor} · </>}
          Subido por {author} · {formatDate(resource.created_at)} · {formatBytes(resource.file_size)}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
          {isPublished && !isOwner ? (
            <VoteButtons
              resourceId={resource.id}
              initial={{ mine: (myVote?.value ?? 0) as -1 | 0 | 1, up: resource.upvotes, down: resource.downvotes }}
            />
          ) : isPublished ? (
            <span className="text-sm text-neutral-500">
              Es tu aporte · 👍 {resource.upvotes} · 👎 {resource.downvotes}
            </span>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-start gap-2">
            {(isOwner || user.isAdmin) && (
              <DeleteResourceButton resourceId={resource.id} redirectTo={`/curso/${resource.courses.code}`} />
            )}
            <a href={fileUrl} target="_blank" rel="noreferrer" className="btn-secondary">Abrir</a>
            <a href={`${fileUrl}?descargar`} className="btn-primary">Descargar</a>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {resource.file_mime === "application/pdf" ? (
          <iframe src={fileUrl} title={resource.title} className="h-[75vh] w-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl} alt={resource.title} className="mx-auto max-h-[80vh] w-auto" />
        )}
      </div>

      {isPublished && SOLVABLE_TYPES.includes(resource.type) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Solucionarios ({solutions?.length ?? 0})</h2>
            <Link
              href={`/subir?curso=${resource.courses.id}&tipo=solucionario&padre=${resource.id}`}
              className="btn-secondary"
            >
              + Subir solucionario
            </Link>
          </div>
          {(solutions as FeedResource[] | null)?.length ? (
            (solutions as FeedResource[]).map((s) => <ResourceCard key={s.id} resource={s} />)
          ) : (
            <p className="text-sm text-neutral-500">Nadie ha subido un solucionario todavía.</p>
          )}
        </section>
      )}
    </div>
  );
}
