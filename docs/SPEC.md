# ExamBank PUCP — Especificación del MVP

Banco comunitario de exámenes pasados, solucionarios, apuntes, laboratorios y tareas para estudiantes de la PUCP.
Proyecto estudiantil, **no oficial** de la PUCP.

## Decisiones

| Tema | Decisión |
|---|---|
| Acceso | Solo usuarios con correo `@pucp.edu.pe` (ver y subir requieren sesión) |
| Login | Correo PUCP + contraseña (Supabase Auth). Solo se valida el dominio, sin confirmación por correo |
| Contenido | Exámenes (PC, parciales, finales), solucionarios, apuntes/resúmenes, laboratorios y tareas |
| Organización | Facultad → Curso → Recurso (tipo, evaluación, ciclo, profesor opcional) |
| Interacción | Votos útil / no útil |
| Moderación | Aprobación previa: nada se publica hasta que un admin lo apruebe |
| Autoría | Se muestra el alias por defecto; el usuario puede subir anónimo (el admin sí ve el autor) |
| Archivos | PDF, JPG, PNG — máx. 20 MB, con vista previa en el navegador |
| Almacenamiento | Supabase (Postgres + Storage privado) |
| Catálogo | Semilla inicial de facultades/cursos; los usuarios proponen cursos faltantes y el admin aprueba |
| Admins | Correos listados en la variable `ADMIN_EMAILS` |
| Stack | Next.js (App Router) full-stack + Tailwind CSS, web responsive |

## Pantallas

- `/` — Portada (sin sesión) con acceso a login/registro.
- `/login`, `/registro` — Autenticación; el registro pide alias público.
- `/explorar` — Facultades + buscador de cursos por código o nombre.
- `/facultad/[slug]` — Cursos de la facultad con cantidad de recursos.
- `/curso/[code]` — Recursos aprobados con filtros (tipo, ciclo) y orden (más útiles / recientes).
- `/recurso/[id]` — Vista previa, descarga, votos y solucionarios vinculados.
- `/subir` — Formulario de subida (el archivo va directo a Storage).
- `/proponer-curso` — Proponer un curso que no está en el catálogo.
- `/mis-aportes` — Estado de lo que subí (pendiente / aprobado / rechazado + motivo).
- `/admin` — Cola de moderación de recursos y cursos.

## Seguridad

- Un trigger en `auth.users` rechaza cualquier registro cuyo correo no termine en `@pucp.edu.pe`, aunque se llame a la API directamente.
- RLS: los usuarios solo leen recursos aprobados mediante la vista `resource_feed`, que oculta el autor de los anónimos y la ruta del archivo.
- El bucket de Storage es privado. Las descargas pasan por `/api/archivo/[id]`, que valida permisos y entrega una URL firmada de 60 s.
- Las acciones de admin se ejecutan en el servidor con la service-role key, solo para correos de `ADMIN_EMAILS`.

## Fuera del MVP (siguientes pasos)

Comentarios, reportes, favoritos, verificación real de correo, búsqueda de texto completo dentro de PDFs, notificaciones.
