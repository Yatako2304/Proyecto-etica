import type { ResourceType, Status } from "@/lib/constants";

/** Fila de la vista resource_feed (solo recursos aprobados). */
export type FeedResource = {
  id: string;
  course_id: number;
  parent_id: string | null;
  type: ResourceType;
  evaluation: string | null;
  term: string;
  professor: string | null;
  title: string;
  description: string | null;
  file_mime: string;
  file_size: number;
  created_at: string;
  author_alias: string | null;
  score: number;
  upvotes: number;
  downvotes: number;
};

/** Fila de la vista course_summary (solo cursos aprobados). */
export type CourseSummary = {
  id: number;
  code: string;
  name: string;
  faculty_id: number;
  faculty_slug: string;
  faculty_name: string;
  resource_count: number;
};

export type OwnResource = {
  id: string;
  type: ResourceType;
  evaluation: string | null;
  term: string;
  title: string;
  status: Status;
  reject_reason: string | null;
  created_at: string;
  courses: { code: string; name: string } | null;
};
