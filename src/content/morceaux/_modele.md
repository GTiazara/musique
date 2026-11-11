---
title: Modèle à copier
artist: Artiste
description: Fichier d'exemple, non publié. Copie-le pour ajouter un morceau.
category: folk
difficulty: intermediaire
status: a-apprendre
capo: 2
capoNote: Selon la version
key: Am
tags: [modele]
publishedAt: 2026-11-04
updatedAt: 2026-11-04
draft: true
shapes:
  - name: Cadd9
    frets: [x, 3, 2, 0, 3, 0]
    fingers: [0, 3, 2, 0, 4, 0]
---

Le nom du fichier devient l'adresse. `mon-morceau.md` donne `/morceaux/mon-morceau`.

`draft: true` garde ce fichier hors du site. Passe-le à `false` pour le publier.

## Format recommandé pour la grille (Accords au-dessus des paroles)

Pour une lisibilité optimale, place la ligne d'accords directement au-dessus de la ligne de paroles avec des espaces pour caler chaque accord sur le bon mot ou la bonne syllabe :

```grille
# Couplet 1
    C                       C
Moi je n'étais rien mais voilà qu'aujourd'hui,
   C/B                   C/B
Je suis le gardien du sommeil de ses nuits,
            Am            Am
Je l'aime à mourir.

# Refrain
    F                       G
Elle n'a qu'à ouvrir l'espace de ses bras,
          C                       C/B
Pour tout reconstruire, pour tout reconstruire.
```

## Variante compacte (Accords entre crochets)

Tu peux également utiliser la notation entre crochets au sein de la ligne de texte :

```grille
# Couplet
[Am]Les crochets posent l'accord au-dessus [Cadd9]des mots qui suivent.
[G] [D] [Am]
```

Cadd9 n'est pas dans le dictionnaire : la position déclarée dans le frontmatter `shapes` sert automatiquement de diagramme.

```tab
e|---0---
B|---1---
G|---0---
D|---2---
A|---0---
E|-------
```
