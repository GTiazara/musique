import { describe, expect, it } from 'vitest';
import { diagramFromShape, resolveDiagram, resolveDiagrams } from '../src/lib/diagram';
import { chordShapes } from '../src/data/chord-shapes';

describe('diagramme', () => {
  it('dessine le fa en barré, sans redessiner les doigts du barré', () => {
    const diagram = diagramFromShape('F', chordShapes.F!);
    expect(diagram.position).toBe(1);
    expect(diagram.barres).toEqual([
      { fromString: 6, toString: 1, fret: 1, text: '1' },
    ]);
    expect(diagram.fingers).toEqual([
      [5, 3, '3'],
      [4, 3, '4'],
      [3, 2, '2'],
    ]);
  });

  it('laisse un accord ouvert au sillet', () => {
    const diagram = diagramFromShape('C', chordShapes.C!);
    expect(diagram.position).toBe(1);
    expect(diagram.fingers).toContainEqual([6, 'x']);
    expect(diagram.fingers).toContainEqual([5, 3, '3']);
  });

  it('préfère la position écrite dans le morceau', () => {
    const diagram = resolveDiagram('Em7', [
      { name: 'Em7', frets: [0, 2, 2, 0, 3, 0], fingers: [0, 2, 3, 0, 4, 0] },
    ]);
    expect(diagram.fingers).toContainEqual([2, 3, '4']);
  });

  it('signale un accord sans position connue', () => {
    const [diagram] = resolveDiagrams(['Cadd9'], []);
    expect(diagram?.known).toBe(false);
  });
});
