"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteResource } from "@/app/actions/resources";

export default function DeleteResourceButton({ resourceId, redirectTo }: { resourceId: string; redirectTo: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (!window.confirm("¿Eliminar este material? Se borrará el archivo y sus votos. No se puede deshacer.")) return;
    startTransition(async () => {
      const result = await deleteResource(resourceId);
      if (result.error) return setError(result.error);
      router.push(redirectTo);
    });
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button onClick={onClick} disabled={pending}
        className="btn-secondary text-red-600 hover:border-red-400 hover:text-red-700">
        {pending ? "Eliminando…" : "Eliminar"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
