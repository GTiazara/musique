/**
 * Réduit un texte pour la comparaison.
 * Reçoit le texte affiché. Renvoie la forme minuscule sans accents.
 */
export function normalizeForSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/**
 * Titres du corps, dans l'ordre du texte.
 * Reçoit le Markdown. Ne renvoie pas les titres du frontmatter.
 */
export function headingsFromMarkdown(markdown: string): string[] {
  return [...markdown.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1]!.trim());
}

/**
 * Réduit le Markdown en texte recherchable.
 * Reçoit le corps. Garde les mots des grilles et des tablatures.
 */
export function plainTextFromMarkdown(markdown: string): string {
  return markdown
    .replace(/```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]/g, '$1 ')
    .replace(/[`*_>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type SearchableMorceau = {
  title: string;
  artist: string;
  description: string;
  headings: string[];
  body: string;
  chords: string[];
  category: string;
  difficulty: string;
  status: string;
};

/**
 * Indique si chaque mot de la requête est présent dans le morceau.
 * La casse et les accents sont ignorés. Une requête vide laisse passer le morceau.
 */
export function morceauMatchesQuery(morceau: SearchableMorceau, query: string): boolean {
  const words = normalizeForSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeForSearch(
    [
      morceau.title,
      morceau.artist,
      morceau.description,
      morceau.headings.join(' '),
      morceau.chords.join(' '),
      morceau.body,
    ].join('\n'),
  );
  return words.every((word) => haystack.includes(word));
}

/**
 * Applique les filtres de catégorie, de niveau et de progression.
 * Une valeur vide signifie « tous ». Les filtres se cumulent.
 */
export function matchesFilters(
  morceau: { category: string; difficulty: string; status: string },
  category: string,
  difficulty: string,
  status: string,
): boolean {
  if (category && morceau.category !== category) return false;
  if (difficulty && morceau.difficulty !== difficulty) return false;
  if (status && morceau.status !== status) return false;
  return true;
}
