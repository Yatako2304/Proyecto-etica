export const RESOURCE_TYPES = {
  examen: "Examen",
  solucionario: "Solucionario",
  apuntes: "Apuntes y resúmenes",
  laboratorio: "Laboratorio",
  tarea: "Tarea",
} as const;

export type ResourceType = keyof typeof RESOURCE_TYPES;

export function isResourceType(value: unknown): value is ResourceType {
  return typeof value === "string" && value in RESOURCE_TYPES;
}

/** Tipos que pueden tener solucionarios vinculados. */
export const SOLVABLE_TYPES: ResourceType[] = ["examen", "laboratorio", "tarea"];

export const EVALUATION_SUGGESTIONS = [
  "PC1", "PC2", "PC3", "PC4", "PC5",
  "Examen parcial", "Examen final", "Examen sustitutorio",
  "Lab 1", "Lab 2", "Lab 3", "Lab 4",
];

export const ALLOWED_MIME_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export type AllowedMime = keyof typeof ALLOWED_MIME_TYPES;

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const STORAGE_BUCKET = "resources";

export const TERM_PATTERN = /^\d{4}-[0-2]$/;

export const ALIAS_PATTERN = /^[A-Za-z0-9_.-]{3,24}$/;

export const COURSE_CODE_PATTERN = /^[A-Z0-9]{3,10}$/;

export type Status = "pending" | "approved" | "rejected";

export const STATUS_LABELS: Record<Status, string> = {
  pending: "En revisión",
  approved: "Publicado",
  rejected: "Rechazado",
};
