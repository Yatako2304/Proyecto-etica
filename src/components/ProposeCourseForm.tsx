"use client";

import Link from "next/link";
import { useActionState } from "react";
import { proposeCourse } from "@/app/actions/courses";

export default function ProposeCourseForm({ faculties }: { faculties: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(proposeCourse, undefined);

  return (
    <form action={action} className="card space-y-4">
      <div>
        <label className="label" htmlFor="faculty_id">Facultad</label>
        <select id="faculty_id" name="faculty_id" required className="input" defaultValue="">
          <option value="" disabled>Elige una facultad…</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="code">Código</label>
          <input id="code" name="code" required maxLength={10} className="input uppercase" placeholder="1MAT05" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">Nombre del curso</label>
          <input id="name" name="name" required maxLength={120} className="input" placeholder="Cálculo Diferencial" />
        </div>
      </div>

      {state?.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state?.message && (
        <p className="rounded-md bg-brand-50 p-3 text-sm text-brand-700">
          {state.message} <Link href="/subir" className="font-semibold underline">Subir material</Link>
        </p>
      )}

      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Enviando…" : "Proponer curso"}
      </button>
    </form>
  );
}
