import Link from "next/link";
import UploadForm, { type CourseOption } from "@/components/UploadForm";
import { isResourceType } from "@/lib/constants";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function SubirPage({
  searchParams,
}: {
  searchParams: Promise<{ curso?: string; tipo?: string; padre?: string }>;
}) {
  const user = await requireUser();
  const { curso, tipo, padre } = await searchParams;
  const supabase = await createClient();

  const [{ data: approved }, { data: mine }] = await Promise.all([
    supabase.from("course_summary").select("id, code, name, faculty_name").order("faculty_name").order("code"),
    supabase
      .from("courses")
      .select("id, code, name, faculties(name)")
      .eq("proposed_by", user.id)
      .eq("status", "pending"),
  ]);

  const courses: CourseOption[] = [
    ...(approved ?? []).map((c) => ({ id: c.id, label: `${c.code} — ${c.name}`, group: c.faculty_name })),
    ...(mine ?? []).map((c) => ({
      id: c.id,
      label: `${c.code} — ${c.name} (propuesto, en revisión)`,
      group: "Mis cursos propuestos",
    })),
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Subir material</h1>
        <p className="text-sm text-neutral-500">
          Todo pasa por moderación antes de publicarse. Revisa que el archivo sea legible y no incluya datos
          personales (nombres, códigos de alumno, notas).
        </p>
      </div>
      <UploadForm
        userId={user.id}
        courses={courses}
        initial={{
          courseId: Number(curso) || null,
          type: isResourceType(tipo) ? tipo : "examen",
          parentId: padre ?? null,
        }}
      />
      <p className="text-sm text-neutral-500">
        ¿No encuentras tu curso? <Link href="/proponer-curso" className="text-brand-600 underline">Propónlo</Link>.
      </p>
    </div>
  );
}
