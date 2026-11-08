<script setup lang="ts">
import { ref } from 'vue';
import { withBase } from '../lib/paths';

const open = ref(false);
const base = import.meta.env.BASE_URL || '/';

/**
 * Ouvre ou ferme le menu lorsque les liens ne tiennent plus sur la ligne.
 * Sur un grand écran, les liens restent visibles à côté, sans ce bouton.
 */
function toggleMenu(): void {
  open.value = !open.value;
}

/**
 * Adresse d'un lien du menu, préfixée par la base du site.
 */
function href(path: string): string {
  return withBase(path, base);
}
</script>

<template>
  <button
    type="button"
    class="menu-button"
    :aria-expanded="open"
    aria-controls="menu-mobile"
    @click="toggleMenu"
  >
    Menu
  </button>
  <nav id="menu-mobile" class="mobile-panel" :class="{ 'is-open': open }" aria-label="Menu">
    <a :href="href('/')">Accueil</a>
    <a :href="href('/morceaux')">Morceaux</a>
    <a :href="href('/recherche')">Recherche</a>
    <a :href="href('/categories')">Catégories</a>
    <a :href="href('/a-propos')">À propos</a>
  </nav>
</template>
