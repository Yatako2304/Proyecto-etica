// Verifica la conexión con Supabase y que el esquema esté completo.
// Uso: node --env-file=.env.local scripts/check-supabase.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const checks = [
  ["facultades", admin.from("faculties").select("*", { count: "exact", head: true })],
  ["cursos", admin.from("courses").select("*", { count: "exact", head: true })],
  ["vista course_summary", admin.from("course_summary").select("*", { count: "exact", head: true })],
  ["vista resource_feed", admin.from("resource_feed").select("*", { count: "exact", head: true })],
  ["anon NO puede leer cursos", anon.from("course_summary").select("*", { count: "exact", head: true })],
];

for (const [name, query] of checks) {
  const { count, error } = await query;
  console.log(`${error ? "✗" : "✓"} ${name}: ${error ? error.message : count}`);
}

const { data: buckets, error } = await admin.storage.listBuckets();
console.log(`${error ? "✗" : "✓"} bucket resources: ${error ? error.message : buckets.some((b) => b.id === "resources") ? "existe" : "NO existe"}`);
