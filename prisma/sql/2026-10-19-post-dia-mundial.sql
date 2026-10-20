-- Noticia del Día Mundial de la Terapia Ocupacional 2026 (blog /noticias).
-- Inserta la publicación una sola vez; si ya existe el slug no hace nada.
-- No requiere cambios de esquema, puede aplicarse antes o después del deploy.
INSERT INTO "Post" ("id", "title", "slug", "excerpt", "content", "coverImage", "category", "published", "featured", "source", "publishedAt", "createdAt", "updatedAt")
VALUES (
  'post_dia_mundial_2026',
  'Día Mundial de la Terapia Ocupacional 2026: La participación importa',
  'dia-mundial-terapia-ocupacional-2026',
  'Del 27 al 31 de octubre abrimos gratis nuestra biblioteca de conferencias, en un evento conjunto de APTO y COTEOC. Regístrate sin costo y sin membresía.',
  $c$El 27 de octubre celebramos el Día Mundial de la Terapia Ocupacional bajo el lema "La participación importa". Para conmemorarlo, la Asociación de Profesionales en Terapia Ocupacional (APTO) y el Colegio de Terapeutas Ocupacionales de México (COTEOC) organizan juntos un evento gratuito.

Del 27 al 31 de octubre de 2026 abrimos a toda la comunidad nuestra biblioteca de conferencias, talleres y sesiones académicas de ediciones anteriores, que normalmente es exclusiva para miembros.

* El acceso es gratuito y no requiere membresía.
* Solo necesitas registrarte con tu nombre y correo electrónico.
* Podrás filtrar las grabaciones por tema: infancia y neurodesarrollo, salud mental, rehabilitación, comunidad y justicia ocupacional, sexualidad y diversidad funcional, tecnología, y profesión y ética.

Regístrate en https://apto.org.mx/dia-mundial

La participación es lo que sostiene a la profesión: en la clínica, en la comunidad, en la formación y en las asociaciones que nos representan. Si quieres seguir participando, conoce cómo unirte a APTO en https://apto.org.mx/membresia o al Colegio en https://www.coteoc.mx/$c$,
  '/dia-mundial/banner.jpg',
  'EVENTOS',
  true,
  true,
  'MANUAL',
  now(),
  now(),
  now()
)
ON CONFLICT ("slug") DO NOTHING;

-- Verificación: debe devolver 1 fila.
SELECT "slug", "published", "featured" FROM "Post" WHERE "slug" = 'dia-mundial-terapia-ocupacional-2026';
