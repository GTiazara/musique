import { describe, expect, it } from 'vitest';
import { formatKey, publishedCount, publishedMorceaux, searchDocuments } from '../src/lib/morceaux';
import { morceauMatchesQuery } from '../src/lib/search';

describe('morceaux publiés', () => {
  it('retire le brouillon de la liste, de la recherche et des compteurs', () => {
    const all = [entry('visible', false), entry('secret', true)];
    expect(publishedMorceaux(all).map((item) => item.id)).toEqual(['visible']);
    expect(searchDocuments(all).map((item) => item.id)).toEqual(['visible']);
    expect(publishedCount(all)).toBe(1);
  });
});

describe('formatKey', () => {
  it('formate correctement les clés majeures et mineures', () => {
    expect(formatKey('F')).toEqual({ code: 'F', name: 'Fa majeur', fullName: 'Fa majeur (F)' });
    expect(formatKey('Fm')).toEqual({ code: 'Fm', name: 'Fa mineur', fullName: 'Fa mineur (Fm)' });
    expect(formatKey('Bm')).toEqual({ code: 'Bm', name: 'Si mineur', fullName: 'Si mineur (Bm)' });
    expect(formatKey('Eb')).toEqual({ code: 'Eb', name: 'Mi♭ majeur', fullName: 'Mi♭ majeur (Eb)' });
  });

  it('gère les valeurs nulles ou vides', () => {
    expect(formatKey(undefined)).toBeNull();
    expect(formatKey('')).toBeNull();
    expect(formatKey('   ')).toBeNull();
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

  it('trouve un morceau par sa tonalité', () => {
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
      key: 'Bm',
    };
    expect(morceauMatchesQuery(morceau, 'Bm')).toBe(true);
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
