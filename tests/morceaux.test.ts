import { describe, expect, it } from 'vitest';
import { publishedCount, publishedMorceaux, searchDocuments } from '../src/lib/morceaux';
import { morceauMatchesQuery } from '../src/lib/search';

describe('morceaux publiés', () => {
  it('retire le brouillon de la liste, de la recherche et des compteurs', () => {
    const all = [entry('visible', false), entry('secret', true)];
    expect(publishedMorceaux(all).map((item) => item.id)).toEqual(['visible']);
    expect(searchDocuments(all).map((item) => item.id)).toEqual(['visible']);
    expect(publishedCount(all)).toBe(1);
  });
});

describe('recherche', () => {
  it('ignore la casse et les accents', () => {
    const morceau = {
      title: 'Hallelujah',
      artist: 'Léonard',
      description: 'Folk',
      headings: [],
      body: '',
      chords: [],
      category: 'folk',
      difficulty: 'debutant',
      status: 'a-apprendre',
    };
    expect(morceauMatchesQuery(morceau, 'leonard')).toBe(true);
    expect(morceauMatchesQuery(morceau, 'absent')).toBe(false);
  });
});

function entry(id: string, draft: boolean) {
  return {
    id,
    body: '```grille\n[C]a\n```\n',
    data: {
      title: id,
      artist: 'Artiste',
      description: 'Extrait',
      category: 'folk',
      difficulty: 'debutant',
      status: 'a-apprendre' as const,
      capo: 0,
      tags: [],
      updatedAt: new Date('2026-11-04'),
      draft,
      shapes: [],
    },
  };
}
