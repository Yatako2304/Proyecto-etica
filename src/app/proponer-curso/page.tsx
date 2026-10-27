import ProposeCourseForm from "@/components/ProposeCourseForm";
import { createClient } from "@/lib/supabase/server";

export default async function ProponerCursoPage() {
  const supabase = await createClient();
  const { data: faculties } = await supabase.from("faculties").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Proponer un curso</h1>
        <p className="text-sm text-neutral-500">
          Usa el código oficial del curso tal como aparece en tu horario. Un moderador lo revisará.
        </p>
      </div>
      <ProposeCourseForm faculties={faculties ?? []} />
    </div>
  );
}
