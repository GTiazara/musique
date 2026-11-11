import { categoryLabel, difficultyLabel, statusLabel } from '../data/categories';
import { chordNamesInMarkdown } from './grille';
import { resolveDiagrams, type DiagramView } from './diagram';
import { headingsFromMarkdown, plainTextFromMarkdown } from './search';
import { withBase } from './paths';
import type { ShapeData } from './morceau-schema';

export type MorceauEntryLike = {
  id: string;
  body?: string;
  data: {
    title: string;
    artist: string;
    description: string;
    category: string;
    difficulty: string;
    status: string;
    capo: number;
    capoNote?: string;
    key?: string;
    tags: string[];
    updatedAt: Date;
    draft?: boolean;
    shapes: ShapeData[];
  };
};

/**
 * Morceaux visibles sur le site.
 * Un brouillon n'entre ni dans la liste, ni dans la recherche, ni dans les compteurs.
 */
export function publishedMorceaux<T extends { data: { draft?: boolean } }>(entries: T[]): T[] {
  return entries.filter((entry) => entry.data.draft !== true);
}

/**
 * Nombre de morceaux publiés.
 * Reçoit tous les morceaux, brouillons compris. Ne compte pas les brouillons.
 */
export function publishedCount<T extends { data: { draft?: boolean } }>(entries: T[]): number {
  return publishedMorceaux(entries).length;
}

/**
 * Trie les morceaux de la mise à jour la plus récente à la plus ancienne.
 * Reçoit des morceaux déjà filtrés.
 */
export function sortByUpdatedDesc<T extends { data: { updatedAt: Date } }>(entries: T[]): T[] {
  return [...entries].sort(
    (left, right) => right.data.updatedAt.getTime() - left.data.updatedAt.getTime(),
  );
}

/**
 * Compte les valeurs distinctes d'un champ.
 * Sert aux compteurs de l'accueil, calculés sur les morceaux publiés seulement.
 */
export function distinctCount<T>(entries: T[], pick: (entry: T) => string): number {
  return new Set(entries.map(pick)).size;
}

export type SearchDocument = {
  id: string;
  href: string;
  title: string;
  artist: string;
  description: string;
  category: string;
  categoryLabel: string;
  difficulty: string;
  difficultyLabel: string;
  status: string;
  statusLabel: string;
  capo: number;
  key?: string;
  chords: string[];
  headings: string[];
  body: string;
};

/**
 * Document d'index pour un morceau publié.
 * Reçoit le morceau et la base d'adresse. Le corps inclus est le texte brut.
 */
export function toSearchDocument(entry: MorceauEntryLike, base = '/'): SearchDocument {
  const markdown = entry.body ?? '';
  return {
    id: entry.id,
    href: withBase(`/morceaux/${entry.id}`, base),
    title: entry.data.title,
    artist: entry.data.artist,
    description: entry.data.description,
    category: entry.data.category,
    categoryLabel: categoryLabel(entry.data.category),
    difficulty: entry.data.difficulty,
    difficultyLabel: difficultyLabel(entry.data.difficulty),
    status: entry.data.status,
    statusLabel: statusLabel(entry.data.status),
    capo: entry.data.capo,
    key: entry.data.key,
    chords: chordNamesInMarkdown(markdown),
    headings: headingsFromMarkdown(markdown),
    body: plainTextFromMarkdown(markdown),
  };
}

/**
 * Index de recherche.
 * Reçoit tous les morceaux. Les brouillons en sont absents.
 */
export function searchDocuments(entries: MorceauEntryLike[], base = '/'): SearchDocument[] {
  return publishedMorceaux(entries).map((entry) => toSearchDocument(entry, base));
}

/**
 * Diagrammes à dessiner pour un morceau.
 * L'ordre suit la grille. Une forme du fichier remplace le dictionnaire du même nom.
 */
export function diagramsFor(entry: MorceauEntryLike): DiagramView[] {
  const names = chordNamesInMarkdown(entry.body ?? '');
  return resolveDiagrams(names, entry.data.shapes);
}

/**
 * Texte du capodastre, ou une chaîne vide s'il n'y a rien à dire.
 * Reçoit la case et la note libre. La case 0 n'est affichée que si une note l'accompagne.
 */
export function capoLabel(capo: number, capoNote?: string): string {
  const parts: string[] = [];
  if (capo > 0) parts.push(`Capo case ${capo}`);
  if (capoNote) parts.push(capoNote);
  return parts.join(' · ');
}

export type FormattedKey = {
  code: string;
  name: string;
  fullName: string;
};

const KEY_NAMES: Record<string, string> = {
  C: 'Do majeur',
  Cm: 'Do mineur',
  'C#': 'Do♯ majeur',
  'C#m': 'Do♯ mineur',
  Db: 'Ré♭ majeur',
  D: 'Ré majeur',
  Dm: 'Ré mineur',
  'D#m': 'Ré♯ mineur',
  Eb: 'Mi♭ majeur',
  Ebm: 'Mi♭ mineur',
  E: 'Mi majeur',
  Em: 'Mi mineur',
  F: 'Fa majeur',
  Fm: 'Fa mineur',
  'F#': 'Fa♯ majeur',
  'F#m': 'Fa♯ mineur',
  Gb: 'Sol♭ majeur',
  G: 'Sol majeur',
  Gm: 'Sol mineur',
  'G#': 'Sol♯ majeur',
  'G#m': 'Sol♯ mineur',
  Ab: 'La♭ majeur',
  Abm: 'La♭ mineur',
  A: 'La majeur',
  Am: 'La mineur',
  'A#': 'La♯ majeur',
  'A#m': 'La♯ mineur',
  Bb: 'Si♭ majeur',
  Bbm: 'Si♭ mineur',
  B: 'Si majeur',
  Bm: 'Si mineur',
};

/**
 * Formate la clé (tonalité) d'un morceau avec son code et son nom complet en français.
 * Exemple: "Fm" -> { code: "Fm", name: "Fa mineur", fullName: "Fa mineur (Fm)" }
 */
export function formatKey(key?: string): FormattedKey | null {
  if (!key) return null;
  const trimmed = key.trim();
  if (!trimmed) return null;
  const name =
    KEY_NAMES[trimmed] ??
    (trimmed.endsWith('m') ? `${trimmed.slice(0, -1)} mineur` : `${trimmed} majeur`);
  return {
    code: trimmed,
    name,
    fullName: `${name} (${trimmed})`,
  };
}
