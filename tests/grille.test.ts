import { describe, expect, it } from 'vitest';
import {
  chordNamesInMarkdown,
  grilleToHtml,
  isChordName,
  parseGrille,
  parseGrilleLine,
} from '../src/lib/grille';

describe('noms d’accords', () => {
  it('accepte les formes usuelles et refuse un mot', () => {
    expect(isChordName('Em7')).toBe(true);
    expect(isChordName('Dsus4')).toBe(true);
    expect(isChordName('A7sus4')).toBe(true);
    expect(isChordName('F#m')).toBe(true);
    expect(isChordName('Bb')).toBe(true);
    expect(isChordName('C/G')).toBe(true);
    expect(isChordName('Couplet')).toBe(false);
  });
});

describe('ligne de grille', () => {
  it('pose chaque accord sur le texte qui suit', () => {
    const line = parseGrilleLine('[C]Au clair de la [G7]lune');
    expect(line).toEqual({
      kind: 'music',
      chunks: [
        { chord: 'C', lyric: 'Au clair de la ' },
        { chord: 'G7', lyric: 'lune' },
      ],
    });
  });

  it('laisse les paroles avant le premier accord', () => {
    const line = parseGrilleLine('Mon ami [C]Pierrot');
    expect(line).toEqual({
      kind: 'music',
      chunks: [
        { chord: '', lyric: 'Mon ami ' },
        { chord: 'C', lyric: 'Pierrot' },
      ],
    });
  });

  it('traite une ligne # comme un repère', () => {
    expect(parseGrilleLine('# Couplet')).toEqual({ kind: 'section', text: 'Couplet' });
  });
});

describe('html de grille', () => {
  it('échappe le texte des paroles', () => {
    const html = grilleToHtml('[C]<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});

describe('accords cités', () => {
  it('garde l’ordre de première apparition dans les blocs grille', () => {
    const markdown = ['```grille', '[C]a [G]b', '[C]c', '```', 'hors bloc [Am]'].join('\n');
    expect(chordNamesInMarkdown(markdown)).toEqual(['C', 'G']);
  });

  it('lit les lignes d’accords séparées des anciennes grilles', () => {
    const markdown = ['```grille', 'C       C/B C/D', 'Une ligne de paroles', 'Am      Dm', '```'].join('\n');
    expect(chordNamesInMarkdown(markdown)).toEqual(['C', 'C/B', 'C/D', 'Am', 'Dm']);
  });
});

describe('grille avec accords au-dessus des paroles (style 2 lignes)', () => {
  it('associe les accords placés au-dessus aux syllabes de la ligne suivante', () => {
    const source = [
      '[Verse 1]',
      '    C                       C',
      "Moi je n'étais rien mais voilà qu'aujourd'hui,",
    ].join('\n');
    const lines = parseGrille(source);
    expect(lines[0]).toEqual({ kind: 'section', text: 'Verse 1' });
    expect(lines[1]).toEqual({
      kind: 'music',
      chunks: [
        { chord: '', lyric: 'Moi ' },
        { chord: 'C', lyric: "je n'étais rien mais voi" },
        { chord: 'C', lyric: "là qu'aujourd'hui," },
      ],
    });
  });

  it('gère les lignes d’accords autonomes (intro / instrumental)', () => {
    const source = 'C       C/B C/D';
    const lines = parseGrille(source);
    expect(lines[0]?.kind).toBe('music');
    if (lines[0]?.kind === 'music') {
      expect(lines[0].chunks.map((c) => c.chord)).toEqual(['C', 'C/B', 'C/D']);
    }
  });
});
