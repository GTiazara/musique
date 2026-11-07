import { grilleToHtml, tabToHtml } from './grille';

type MdNode = {
  type: string;
  value?: string;
  lang?: string;
};

/**
 * Remplace les blocs `grille` et `tab` par le HTML du morceau.
 * Un autre bloc de code reste du code. Sans ces blocs, l'arbre ne change pas.
 */
export function remarkGrille() {
  return (tree: { children?: MdNode[] }) => {
    for (const node of tree.children ?? []) {
      if (node.type !== 'code' || !node.lang) continue;
      const lang = node.lang.toLowerCase();
      if (lang !== 'grille' && lang !== 'tab') continue;
      const source = node.value ?? '';
      node.type = 'html';
      node.value = lang === 'grille' ? grilleToHtml(source) : tabToHtml(source);
      delete node.lang;
    }
  };
}
