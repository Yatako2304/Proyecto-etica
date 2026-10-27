import Link from "next/link";
import { RESOURCE_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { FeedResource } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  examen: "bg-brand-600 text-white",
  solucionario: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
  apuntes: "bg-neutral-900 text-white",
  laboratorio: "bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-300",
  tarea: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
};

export function TypeBadge({ type }: { type: FeedResource["type"] }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[type]}`}>
      {RESOURCE_TYPES[type]}
    </span>
  );
}

export default function ResourceCard({ resource }: { resource: FeedResource }) {
  return (
    <Link href={`/recurso/${resource.id}`}
      className="card flex items-start justify-between gap-4 transition hover:border-brand-500 hover:shadow">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={resource.type} />
          {resource.evaluation && <span className="text-xs font-medium text-neutral-600">{resource.evaluation}</span>}
          <span className="text-xs text-neutral-500">{resource.term}</span>
        </div>
        <h3 className="truncate font-semibold text-neutral-900">{resource.title}</h3>
        <p className="text-xs text-neutral-500">
          {resource.professor ? `Prof. ${resource.professor} · ` : ""}
          {resource.author_alias ? `@${resource.author_alias}` : "Anónimo"} · {formatDate(resource.created_at)}
        </p>
      </div>
      <div className="shrink-0 text-center">
        <div className={`text-lg font-bold ${resource.score > 0 ? "text-brand-600" : resource.score < 0 ? "text-red-600" : "text-neutral-400"}`}>
          {resource.score > 0 ? `+${resource.score}` : resource.score}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-neutral-400">útil</div>
      </div>
    </Link>
  );
}
