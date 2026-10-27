"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createResource, listSolvableResources } from "@/app/actions/resources";
import {
  ALLOWED_MIME_TYPES,
  EVALUATION_SUGGESTIONS,
  MAX_FILE_BYTES,
  RESOURCE_TYPES,
  STORAGE_BUCKET,
  type AllowedMime,
  type ResourceType,
} from "@/lib/constants";
import { formatBytes, recentTerms } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

export type CourseOption = { id: number; label: string; group: string };
type Solvable = Awaited<ReturnType<typeof listSolvableResources>>[number];

export default function UploadForm({
  userId,
  courses,
  initial,
}: {
  userId: string;
  courses: CourseOption[];
  initial: { courseId: number | null; type: ResourceType; parentId: string | null };
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<number | null>(initial.courseId);
  const [type, setType] = useState<ResourceType>(initial.type);
  const [parentId, setParentId] = useState<string>(initial.parentId ?? "");
  const [solvables, setSolvables] = useState<Solvable[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "saving">("idle");

  useEffect(() => {
    if (type !== "solucionario" || !courseId) {
      setSolvables([]);
      return;
    }
    let cancelled = false;
    listSolvableResources(courseId).then((rows) => !cancelled && setSolvables(rows));
    return () => {
      cancelled = true;
    };
  }, [type, courseId]);

  const groups = courses.reduce<Record<string, CourseOption[]>>((acc, c) => {
    (acc[c.group] ??= []).push(c);
    return acc;
  }, {});

  function pickFile(f: File | null) {
    setError(null);
    if (f && !(f.type in ALLOWED_MIME_TYPES)) {
      setError("Solo se aceptan archivos PDF, JPG o PNG.");
      return setFile(null);
    }
    if (f && f.size > MAX_FILE_BYTES) {
      setError(`El archivo pesa ${formatBytes(f.size)}; el máximo es 20 MB.`);
      return setFile(null);
    }
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!courseId) return setError("Elige un curso.");
    if (!file) return setError("Adjunta un archivo.");

    const form = new FormData(e.currentTarget);
    const ext = ALLOWED_MIME_TYPES[file.type as AllowedMime];
    const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

    setStatus("uploading");
    const { error: uploadError } = await createClient()
      .storage.from(STORAGE_BUCKET)
      .upload(filePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setStatus("idle");
      return setError("No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.");
    }

    setStatus("saving");
    const result = await createResource({
      courseId,
      type,
      evaluation: String(form.get("evaluation") ?? ""),
      term: String(form.get("term") ?? ""),
      professor: String(form.get("professor") ?? ""),
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      parentId: type === "solucionario" && parentId ? parentId : null,
      isAnonymous: form.get("anonymous") === "on",
      filePath,
      fileMime: file.type,
      fileSize: file.size,
    });

    if (result.error || !result.id) {
      setStatus("idle");
      return setError(result.error ?? "Error inesperado.");
    }
    router.push(`/recurso/${result.id}`);
  }

  const busy = status !== "idle";

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="course">Curso</label>
        <select id="course" required className="input" value={courseId ?? ""}
          onChange={(e) => { setCourseId(Number(e.target.value) || null); setParentId(""); }}>
          <option value="">Elige un curso…</option>
          {Object.entries(groups).map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="type">Tipo de material</label>
          <select id="type" className="input" value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
            {Object.entries(RESOURCE_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="evaluation">Evaluación (opcional)</label>
          <input id="evaluation" name="evaluation" list="evaluations" maxLength={40} className="input" placeholder="PC2, Examen parcial…" />
          <datalist id="evaluations">
            {EVALUATION_SUGGESTIONS.map((ev) => <option key={ev} value={ev} />)}
          </datalist>
        </div>
      </div>

      {type === "solucionario" && (
        <div>
          <label className="label" htmlFor="parent">¿Qué material resuelve? (opcional)</label>
          <select id="parent" className="input" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— Ninguno / no está publicado —</option>
            {solvables.map((s) => (
              <option key={s.id} value={s.id}>
                {s.term} · {s.evaluation ?? RESOURCE_TYPES[s.type as ResourceType]} · {s.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="term">Ciclo</label>
          <select id="term" name="term" required className="input" defaultValue={recentTerms()[1]}>
            {recentTerms().map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="professor">Profesor (opcional)</label>
          <input id="professor" name="professor" maxLength={80} className="input" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="title">Título</label>
        <input id="title" name="title" required minLength={3} maxLength={140} className="input"
          placeholder="Ej. PC2 — Límites y continuidad" />
      </div>

      <div>
        <label className="label" htmlFor="description">Descripción (opcional)</label>
        <textarea id="description" name="description" rows={3} maxLength={2000} className="input"
          placeholder="Temas que cubre, horario, observaciones…" />
      </div>

      <div>
        <label className="label" htmlFor="file">Archivo (PDF, JPG o PNG · máx. 20 MB)</label>
        <input id="file" type="file" accept="application/pdf,image/jpeg,image/png" required className="input"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
        {file && <p className="mt-1 text-xs text-slate-500">{file.name} · {formatBytes(file.size)}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="anonymous" className="size-4" />
        Publicar como anónimo (los moderadores sí verán tu alias)
      </label>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button className="btn-primary w-full" disabled={busy}>
        {status === "uploading" ? "Subiendo archivo…" : status === "saving" ? "Guardando…" : "Enviar a revisión"}
      </button>
    </form>
  );
}
