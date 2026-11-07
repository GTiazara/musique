/**
 * Préfixe une adresse interne avec la base du site.
 * Reçoit le chemin et la base (`/` en local). Renvoie l'adresse publiée.
 */
export function withBase(path: string, base = '/'): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${path.replace(/^\//, '')}`;
}
