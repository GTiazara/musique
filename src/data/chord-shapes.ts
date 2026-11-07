/**
 * Forme d'accord connue du site.
 * `frets` va de la corde de mi grave (index 0) à la corde de mi aigu (index 5).
 * 0 = corde à vide, `x` = corde muette, un nombre = la case appuyée.
 * `barre.from` et `barre.to` comptent comme sur une guitare : 6 est le mi grave, 1 le mi aigu.
 */
export type ChordShape = {
  frets: Array<number | 'x'>;
  fingers?: number[];
  barre?: { fret: number; from: number; to: number; finger?: number };
};

/**
 * Positions ouvertes usuelles. Un morceau peut les remplacer dans son frontmatter.
 * La clé est le nom écrit entre crochets dans la grille, accents et casse compris.
 */
export const chordShapes: Record<string, ChordShape> = {
  C: { frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  C7: { frets: ['x', 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  D: { frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  D7: { frets: ['x', 'x', 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  Dsus4: { frets: ['x', 'x', 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },
  Dm: { frets: ['x', 'x', 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  E: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  E7: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  Em7: { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  F: {
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 1, from: 6, to: 1, finger: 1 },
  },
  G: { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  A: { frets: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  A7: { frets: ['x', 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  A7sus4: { frets: ['x', 0, 2, 0, 3, 0], fingers: [0, 0, 2, 0, 3, 0] },
  Am: { frets: ['x', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  Am7: { frets: ['x', 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  B7: { frets: ['x', 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  Bm: {
    frets: ['x', 2, 4, 4, 3, 2],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 2, from: 5, to: 1, finger: 1 },
  },
};
