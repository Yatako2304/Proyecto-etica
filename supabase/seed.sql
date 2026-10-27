-- Catálogo inicial. Los cursos son una muestra de referencia:
-- revisa y corrige códigos/nombres con la oferta oficial antes de abrir la app.

insert into public.faculties (slug, name) values
  ('eeggcc', 'Estudios Generales Ciencias'),
  ('eeggll', 'Estudios Generales Letras'),
  ('ciencias-e-ingenieria', 'Ciencias e Ingeniería'),
  ('ciencias-sociales', 'Ciencias Sociales'),
  ('derecho', 'Derecho'),
  ('gestion', 'Gestión y Alta Dirección'),
  ('ciencias-contables', 'Ciencias Contables'),
  ('arquitectura', 'Arquitectura y Urbanismo'),
  ('arte-y-diseno', 'Arte y Diseño'),
  ('comunicaciones', 'Ciencias y Artes de la Comunicación'),
  ('educacion', 'Educación'),
  ('letras', 'Letras y Ciencias Humanas'),
  ('psicologia', 'Psicología'),
  ('artes-escenicas', 'Artes Escénicas')
on conflict (slug) do nothing;

insert into public.courses (faculty_id, code, name, status)
select f.id, c.code, c.name, 'approved'
from (values
  ('eeggcc', '1MAT05', 'Cálculo Diferencial'),
  ('eeggcc', '1MAT06', 'Cálculo Integral'),
  ('eeggcc', '1MAT07', 'Cálculo en Varias Variables'),
  ('eeggcc', '1FIS01', 'Física 1'),
  ('eeggcc', '1FIS02', 'Física 2'),
  ('eeggcc', '1QUI01', 'Química 1'),
  ('eeggcc', '1INF01', 'Fundamentos de Programación'),
  ('eeggll', '1LIN01', 'Comunicación Académica'),
  ('eeggll', '1MAT01', 'Matemáticas para la Economía y Finanzas 1'),
  ('eeggll', '1ECO01', 'Introducción a la Economía')
) as c(faculty_slug, code, name)
join public.faculties f on f.slug = c.faculty_slug
on conflict (code) do nothing;
