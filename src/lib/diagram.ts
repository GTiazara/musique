import { chordShapes, type ChordShape } from '../data/chord-shapes';
import type { ShapeData } from './morceau-schema';

/** Doigt transmis à svguitar : [corde, case ou « x », numéro de doigt]. La corde 6 est le mi grave. */
export type DiagramFinger = [number, number | 'x'] | [number, number, string];

export type DiagramBarre = {
  fromString: number;
  toString: number;
  fret: number;
  text?: string;
};

export type DiagramView = {
  name: string;
  known: boolean;
  position: number;
  fretCount: number;
  fingers: DiagramFinger[];
  barres: DiagramBarre[];
};

/**
 * Case relative au début du diagramme.
 * svguitar compte les cases à partir de `position` : la case 1 du dessin est cette position.
 */
function relativeFret(absolute: number, position: number): number {
  return position === 1 ? absolute : absolute - position + 1;
}

/**
 * Décide où commence le manche dessiné.
 * Un accord avec une corde à vide reste collé au sillet. Un barré plus haut démarre à sa première case.
 */
function diagramWindow(frets: Array<number | 'x'>): { position: number; fretCount: number } {
  const pressed = frets.filter((fret): fret is number => typeof fret === 'number' && fret > 0);
  if (pressed.length === 0) return { position: 1, fretCount: 4 };
  const hasOpen = frets.some((fret) => fret === 0);
  const min = Math.min(...pressed);
  const max = Math.max(...pressed);
  const position = !hasOpen && min > 1 ? min : 1;
  const relativeMax = relativeFret(max, position);
  return { position, fretCount: Math.max(4, relativeMax) };
}

/**
 * Une corde est-elle couverte par la barre à cette case relative ?
 * `stringNumber` suit svguitar : 6 est le mi grave.
 */
function underBarre(stringNumber: number, relative: number, barre: DiagramBarre): boolean {
  const low = Math.max(barre.fromString, barre.toString);
  const high = Math.min(barre.fromString, barre.toString);
  return stringNumber <= low && stringNumber >= high && relative === barre.fret;
}

/**
 * Transforme une position écrite (mi grave → mi aigu) en données de diagramme.
 * Reçoit la forme et le nom affiché. Les doigts posés sur la barre ne sont pas redessinés.
 */
export function diagramFromShape(name: string, shape: ChordShape): DiagramView {
  const { position, fretCount } = diagramWindow(shape.frets);
  const barres: DiagramBarre[] = [];
  if (shape.barre) {
    barres.push({
      fromString: shape.barre.from,
      toString: shape.barre.to,
      fret: relativeFret(shape.barre.fret, position),
      text: shape.barre.finger ? String(shape.barre.finger) : undefined,
    });
  }

  const fingers: DiagramFinger[] = [];
  shape.frets.forEach((fret, index) => {
    // L'index 0 est le mi grave, donc la corde 6 de svguitar.
    const stringNumber = 6 - index;
    if (fret === 'x') {
      fingers.push([stringNumber, 'x']);
      return;
    }
    if (fret === 0) return;
    const relative = relativeFret(fret, position);
    if (barres.some((barre) => underBarre(stringNumber, relative, barre))) return;
    const finger = shape.fingers?.[index] ?? 0;
    if (finger > 0) fingers.push([stringNumber, relative, String(finger)]);
    else fingers.push([stringNumber, relative]);
  });

  return { name, known: true, position, fretCount, fingers, barres };
}

/**
 * Choisit la position d'un accord : celle du morceau, sinon le dictionnaire.
 * Reçoit le nom et les formes du fichier. Une forme du morceau remplace le dictionnaire.
 */
export function resolveDiagram(name: string, overrides: ShapeData[]): DiagramView {
  const override = [...overrides].reverse().find((shape) => shape.name === name);
  const shape = override ?? chordShapes[name];
  if (!shape) {
    return { name, known: false, position: 1, fretCount: 4, fingers: [], barres: [] };
  }
  return diagramFromShape(name, shape);
}

/**
 * Diagrammes d'un morceau, dans l'ordre de la grille.
 * Les formes déclarées mais absentes de la grille suivent, pour rester visibles.
 */
export function resolveDiagrams(names: string[], overrides: ShapeData[]): DiagramView[] {
  const ordered = [...names];
  for (const shape of overrides) {
    if (!ordered.includes(shape.name)) ordered.push(shape.name);
  }
  return ordered.map((name) => resolveDiagram(name, overrides));
}
