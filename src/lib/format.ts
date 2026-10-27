export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Ciclos recientes en formato PUCP (2025-2, 2025-1, 2025-0, ...). */
export function recentTerms(count = 15): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const current = now.getMonth() < 2 ? 0 : now.getMonth() < 7 ? 1 : 2;
  const terms: string[] = [];
  for (let y = year, t = current; terms.length < count; t--) {
    if (t < 0) {
      y--;
      t = 2;
    }
    terms.push(`${y}-${t}`);
  }
  return terms;
}

/** Limpia texto de búsqueda para usarlo en filtros PostgREST (.or / ilike). */
export function sanitizeSearch(q: string): string {
  return q.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);
}
