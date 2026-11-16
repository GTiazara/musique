/**
 * Extrait l'identifiant YouTube d'une URL (watch?v=, youtu.be/, embed/, shorts/).
 * Retourne une chaîne vide si l'URL n'est pas une vidéo YouTube identifiable.
 */
export function extractYouTubeId(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] ?? '';
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.has('v')) {
        return parsed.searchParams.get('v') ?? '';
      }
      const parts = parsed.pathname.split('/');
      const embedIdx = parts.indexOf('embed');
      if (embedIdx !== -1 && parts[embedIdx + 1]) {
        return parts[embedIdx + 1];
      }
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx !== -1 && parts[shortsIdx + 1]) {
        return parts[shortsIdx + 1];
      }
    }
  } catch {
    // ignore invalid URLs
  }
  const match = urlStr.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );
  return match ? match[1] : '';
}
