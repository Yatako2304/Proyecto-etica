import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";

export default function ConfigurarPage() {
  if (isSupabaseConfigured()) redirect("/");

  const steps = [
    <>Crea un proyecto en <a className="text-brand-600 underline" href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a> (región sugerida: South America – São Paulo).</>,
    <>En <b>SQL Editor</b>, ejecuta <code>supabase/schema.sql</code> y luego <code>supabase/seed.sql</code>.</>,
    <>En <b>Authentication → Sign In / Providers → Email</b>, desactiva <b>Confirm email</b>.</>,
    <>En <b>Project Settings → API</b>, copia la URL, la <code>anon</code> key y la <code>service_role</code> key.</>,
    <>Copia <code>.env.example</code> como <code>.env.local</code>, pega los valores y pon tu correo en <code>ADMIN_EMAILS</code>.</>,
    <>Reinicia el servidor: <code>npm run dev</code>.</>,
  ];

  return (
    <div className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Falta configurar Supabase</h1>
      <p className="text-neutral-600">
        La app necesita un proyecto de Supabase para la base de datos, el login y los archivos.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
