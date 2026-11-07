import { describe, expect, it } from 'vitest';
import { morceauSchema } from '../src/lib/morceau-schema';

const valid = {
  title: 'Titre',
  artist: 'Artiste',
  description: 'Extrait',
  category: 'folk',
  difficulty: 'debutant',
  publishedAt: '2026-11-04',
  updatedAt: '2026-11-04',
};

describe('morceauSchema', () => {
  it('accepte un morceau minimal', () => {
    expect(morceauSchema.safeParse(valid).success).toBe(true);
  });

  it('rejette une catégorie inconnue', () => {
    expect(morceauSchema.safeParse({ ...valid, category: 'jazz' }).success).toBe(false);
  });

  it('rejette une position qui n’a pas six cordes', () => {
    const shapes = [{ name: 'C', frets: [0, 1, 0] }];
    expect(morceauSchema.safeParse({ ...valid, shapes }).success).toBe(false);
  });
});
