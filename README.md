# Guitarothèque

Répertoire de guitare statique. Chaque morceau est un fichier Markdown. Le build produit des pages HTML. Le JavaScript du navigateur ne sert qu'aux filtres, à la recherche et aux diagrammes d'accords.

## Démarrer

```bash
npm install
npm run dev
```

`npm run build` écrit le site dans `dist/`. `npm test` vérifie la grille, les diagrammes et le schéma.

## Publication

Le workflow GitHub Pages publie sur `https://musique.gtiazara.fr`, à la racine : `SITE_URL=https://musique.gtiazara.fr` et `SITE_BASE=/`. Dans les paramètres GitHub Pages du dépôt, le domaine personnalisé doit être `musique.gtiazara.fr`.

Pour publier sous un sous-dossier, adapter ces deux variables dans `.github/workflows/pages.yml`. Après un changement de base, reconstruire et redéployer tout le dossier `dist/`, HTML et assets ensemble.

## Ajouter un morceau

1. Copie `src/content/morceaux/_modele.md`.
2. Renomme le fichier. `mon-morceau.md` devient l'adresse `/morceaux/mon-morceau`.
3. Remplis le frontmatter. `draft: true` exclut le morceau du site.
4. La catégorie doit être un slug de `src/data/categories.ts`. Pour un nouveau style, ajoute-le à cette liste.

Un fichier invalide fait échouer le build.

## Grille, doigtés, tablature

Dans un bloc `grille`, `[G7]` se place au-dessus des mots qui suivent. Une ligne `# Refrain` est un repère, pas un accord. Chaque fiche affiche en haut les diagrammes des accords relevés dans ses blocs `grille`, dans leur ordre de première apparition.

Utilise de préférence la notation entre crochets : elle positionne l'accord sur les paroles et alimente automatiquement les diagrammes. Les anciennes grilles conservent aussi leurs diagrammes quand une ligne ne contient que des noms d'accords séparés par des espaces, par exemple `C   Am   F   G`.

Les positions courantes sont dans `src/data/chord-shapes.ts` : emploie simplement leur nom dans la grille, par exemple `[C]`, `[Am]` ou `[G]`. Pour un doigté particulier ou un accord absent du dictionnaire, ajoute `shapes` dans le morceau : six valeurs du mi grave au mi aigu (`0` à vide, `x` muette, sinon la case), `fingers` de 1 à 4, et éventuellement `barre` (`from` / `to` de 6 à 1). Une forme locale porte exactement le même nom que l'accord de la grille et remplace une éventuelle forme globale.

Un bloc `tab` affiche une tablature en caractères, espaces conservés.

Les diagrammes sont dessinés par [svguitar](https://github.com/omnibrain/svguitar) dans le navigateur. Le reste de la page est du HTML.

## Architecture

Même principe que DevFiches : Astro en export statique, collection de contenu validée par un schéma, îlots Vue seulement là où il y a une interaction. Pas de serveur, pas de compte, pas de base. Les brouillons remplacent l'ancien stockage privé du navigateur : ce qui est publié est dans Git.

## Ressources: 
https://www.boiteachansons.net/partitions/francis-cabrel/je-l-aime-a-mourir
