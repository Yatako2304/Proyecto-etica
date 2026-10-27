# ExamBank PUCP

Banco comunitario de exámenes pasados, solucionarios, apuntes, laboratorios y tareas para estudiantes de la PUCP.
Proyecto estudiantil, no oficial. Especificación completa en [docs/SPEC.md](docs/SPEC.md).

🌐 **App en producción:** https://exambank-pucp.vercel.app

Cada push a `main` se despliega automáticamente en Vercel.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage)

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (región sugerida: *South America – São Paulo*).
2. **SQL Editor → New query**: pega y ejecuta [`supabase/schema.sql`](supabase/schema.sql), luego [`supabase/seed.sql`](supabase/seed.sql).
3. **Authentication → Sign In / Providers → Email**: desactiva **Confirm email** (solo validamos el dominio `@pucp.edu.pe`).
4. **Project Settings → API**: copia `Project URL`, la key `anon` y la key `service_role`.

> Los cursos de `seed.sql` son una muestra de referencia: verifica códigos y nombres con la oferta oficial.

> ¿Ya creaste la base con una versión anterior de `schema.sql`? Ejecuta también
> [`supabase/fix-votos.sql`](supabase/fix-votos.sql): corrige los votos "Útil / No útil", que fallaban
> al votar material subido por otra persona.

### 2. Variables de entorno

Copia `.env.example` como `.env.local` y completa:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # secreta, solo servidor
ADMIN_EMAILS=tu.correo@pucp.edu.pe # moderadores, separados por coma
```

### 3. Ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Si falta la configuración, la app te muestra los pasos en `/configurar`.

## Flujo

1. El estudiante se registra con su correo `@pucp.edu.pe` y un alias.
2. Explora facultad → curso → material, filtra por tipo y ciclo, vota lo útil.
3. Sube material (PDF/JPG/PNG ≤ 20 MB); queda **en revisión**.
4. Un moderador (correo en `ADMIN_EMAILS`) lo aprueba o rechaza con motivo en `/admin`.

## Estructura

```
supabase/          esquema SQL (tablas, RLS, vistas, storage) y datos semilla
src/middleware.ts  sesión y protección de rutas
src/lib/           env, clientes Supabase, sesión, control de acceso, constantes
src/app/actions/   server actions (auth, recursos y votos, cursos, moderación)
src/app/api/archivo/[id]  entrega archivos con URL firmada tras validar permisos
src/app/…          páginas (explorar, facultad, curso, recurso, subir, mis-aportes, admin)
src/components/    componentes de UI
```
