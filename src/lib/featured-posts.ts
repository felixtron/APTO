/**
 * Portada: la noticia principal es el post publicado y destacado más reciente.
 * Si no hay ninguno, se usa el publicado más reciente. El resto sigue por fecha
 * y no repite la principal.
 *
 * `latestByDate` debe venir ordenado por createdAt descendente (empate por id).
 */
export function pickHomepagePosts<T extends { id: string }>(
  featured: T | null,
  latestByDate: readonly T[],
  limit = 4,
): T[] {
  if (!featured) return latestByDate.slice(0, limit);
  const rest = latestByDate.filter((post) => post.id !== featured.id);
  return [featured, ...rest].slice(0, limit);
}
