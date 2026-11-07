<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { matchesFilters, morceauMatchesQuery, type SearchableMorceau } from '../lib/search';
import { withBase } from '../lib/paths';

type Result = SearchableMorceau & {
  id: string;
  href: string;
  categoryLabel: string;
  difficultyLabel: string;
  statusLabel: string;
};

const props = defineProps<{
  categories: { slug: string; label: string }[];
}>();

const query = ref('');
const category = ref('');
const difficulty = ref('');
const status = ref('');
const documents = ref<Result[]>([]);
const ready = ref(false);

const levels = [
  { slug: 'debutant', label: 'Débutant' },
  { slug: 'intermediaire', label: 'Intermédiaire' },
  { slug: 'avance', label: 'Avancé' },
];

const statuses = [
  { slug: 'a-apprendre', label: 'À apprendre' },
  { slug: 'en-cours', label: 'En cours' },
  { slug: 'maitrise', label: 'Maîtrisé' },
];

/**
 * Résultats visibles : la requête et les filtres se cumulent.
 * Une requête sans mot correspondant donne une liste vide.
 */
const results = computed(() =>
  documents.value.filter(
    (morceau) =>
      morceauMatchesQuery(morceau, query.value) &&
      matchesFilters(morceau, category.value, difficulty.value, status.value),
  ),
);

/**
 * Charge l'index produit au build et lit `q` dans l'adresse.
 * L'index ne contient que des morceaux publiés.
 */
async function loadIndex(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  query.value = params.get('q') ?? '';
  const response = await fetch(withBase('/search-index.json', import.meta.env.BASE_URL || '/'));
  documents.value = (await response.json()) as Result[];
  ready.value = true;
}

onMounted(() => {
  void loadIndex();
});
</script>

<template>
  <form class="filters" action="#" @submit.prevent>
    <label>
      Recherche
      <input v-model="query" type="search" name="q" />
    </label>
    <label>
      Catégorie
      <select v-model="category">
        <option value="">Toutes</option>
        <option v-for="item in props.categories" :key="item.slug" :value="item.slug">
          {{ item.label }}
        </option>
      </select>
    </label>
    <label>
      Niveau
      <select v-model="difficulty">
        <option value="">Tous les niveaux</option>
        <option v-for="level in levels" :key="level.slug" :value="level.slug">
          {{ level.label }}
        </option>
      </select>
    </label>
    <label>
      Progression
      <select v-model="status">
        <option value="">Toutes</option>
        <option v-for="item in statuses" :key="item.slug" :value="item.slug">
          {{ item.label }}
        </option>
      </select>
    </label>
  </form>
  <p v-if="ready && results.length === 0" class="empty">Aucun morceau ne correspond à cette recherche.</p>
  <ul v-else class="card-grid">
    <li v-for="morceau in results" :key="morceau.id" class="card">
      <div class="card-body">
        <h2 class="song-title"><a :href="morceau.href">{{ morceau.title }}</a></h2>
        <p class="artist">{{ morceau.artist }}</p>
        <p class="meta">
          <span class="pill">{{ morceau.categoryLabel }}</span>
          <span class="pill">{{ morceau.difficultyLabel }}</span>
          <span class="pill">{{ morceau.statusLabel }}</span>
        </p>
        <p class="excerpt">{{ morceau.description }}</p>
      </div>
    </li>
  </ul>
</template>
