/**
 * Catégories autorisées pour un morceau.
 * Ajouter une entrée ici l'autorise dans le schéma et crée sa page.
 */
export const categories = [
  { slug: 'rock', label: 'Rock' },
  { slug: 'pop', label: 'Pop' },
  { slug: 'folk', label: 'Folk' },
  { slug: 'blues', label: 'Blues' },
  { slug: 'chanson', label: 'Chanson française' },
  { slug: 'variete', label: 'Variété française' },
  { slug: 'reaggae', label: 'Reggae' },
  { slug: 'slowrock', label: 'Slow Rock' },
  { slug: 'classic', label: 'Classique' }
] as const;

export const categorySlugs = categories.map((item) => item.slug) as [
  (typeof categories)[number]['slug'],
  ...(typeof categories)[number]['slug'][],
];

export const difficulties = ['debutant', 'intermediaire', 'avance'] as const;

export const difficultyLabels: Record<(typeof difficulties)[number], string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

export const statuses = ['a-apprendre', 'en-cours', 'maitrise'] as const;

export const statusLabels: Record<(typeof statuses)[number], string> = {
  'a-apprendre': 'À apprendre',
  'en-cours': 'En cours',
  maitrise: 'Maîtrisé',
};

/**
 * Libellé affiché pour un slug de catégorie.
 * Reçoit le slug. Renvoie le nom lisible, ou le slug s'il est inconnu.
 */
export function categoryLabel(slug: string): string {
  return categories.find((item) => item.slug === slug)?.label ?? slug;
}

/**
 * Libellé affiché pour un niveau.
 * Reçoit le slug du niveau. Renvoie le libellé français.
 */
export function difficultyLabel(slug: string): string {
  if (slug === 'debutant' || slug === 'intermediaire' || slug === 'avance') {
    return difficultyLabels[slug];
  }
  return slug;
}

/**
 * Libellé affiché pour une progression.
 * Reçoit le slug du statut. Renvoie le libellé français.
 */
export function statusLabel(slug: string): string {
  if (slug === 'a-apprendre' || slug === 'en-cours' || slug === 'maitrise') {
    return statusLabels[slug];
  }
  return slug;
}
