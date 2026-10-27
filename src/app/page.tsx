import Image from "next/image";
import Link from "next/link";
import { RESOURCE_TYPES } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="space-y-12 py-6">
      <section className="space-y-5 text-center">
        <Image src="/logo.png" alt="ExamBank PUCP" width={900} height={511} priority
          className="mx-auto h-auto w-56 sm:w-72" />
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
          Los exámenes pasados de la PUCP,
          <br />
          <span className="text-brand-600">en un solo lugar.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-neutral-600">
          Encuentra prácticas calificadas, parciales, finales y sus solucionarios, organizados por facultad y
          curso. Hecho por y para estudiantes PUCP.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/registro" className="btn-primary">Crear cuenta con correo PUCP</Link>
          <Link href="/login" className="btn-secondary">Ya tengo cuenta</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Organizado", "Facultad → curso → evaluación y ciclo. Encuentra la PC2 de 2024-1 en segundos."],
          ["Revisado", "Todo lo que se sube pasa por moderación antes de publicarse."],
          ["Comunitario", "Vota los mejores solucionarios y sube los tuyos, con tu alias o de forma anónima."],
        ].map(([title, text]) => (
          <div key={title} className="card border-t-4 border-t-brand-600">
            <h2 className="font-semibold uppercase tracking-wide text-brand-700">{title}</h2>
            <p className="mt-1 text-sm text-neutral-600">{text}</p>
          </div>
        ))}
      </section>

      <section className="text-center text-sm text-neutral-500">
        Puedes encontrar: {Object.values(RESOURCE_TYPES).join(" · ")}
      </section>
    </div>
  );
}
