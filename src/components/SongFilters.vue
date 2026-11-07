<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = defineProps<{
  listId: string;
  emptyId: string;
  showCategory: boolean;
  categories: { slug: string; label: string }[];
}>();

const category = ref('');
const difficulty = ref('');
const status = ref('');

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
 * Cache les cartes qui ne correspondent pas aux filtres choisis.
 * Si aucune carte ne reste, le message de liste vide devient visible.
 */
function applyFilters(): void {
  const list = document.getElementById(props.listId);
  const empty = document.getElementById(props.emptyId);
  if (!list || !empty) return;
  let visible = 0;
  list.querySelectorAll<HTMLElement>('[data-category]').forEach((item) => {
    const categoryOk = !category.value || item.dataset.category === category.value;
    const levelOk = !difficulty.value || item.dataset.difficulty === difficulty.value;
    const statusOk = !status.value || item.dataset.status === status.value;
    const show = categoryOk && levelOk && statusOk;
    item.hidden = !show;
    if (show) visible += 1;
  });
  empty.hidden = visible !== 0;
}

onMounted(applyFilters);
</script>

<template>
  <form class="filters" @submit.prevent="applyFilters">
    <label v-if="showCategory">
      Catégorie
      <select v-model="category" @change="applyFilters">
        <option value="">Toutes</option>
        <option v-for="item in categories" :key="item.slug" :value="item.slug">
          {{ item.label }}
        </option>
      </select>
    </label>
    <label>
      Niveau
      <select v-model="difficulty" @change="applyFilters">
        <option value="">Tous les niveaux</option>
        <option v-for="level in levels" :key="level.slug" :value="level.slug">
          {{ level.label }}
        </option>
      </select>
    </label>
    <label>
      Progression
      <select v-model="status" @change="applyFilters">
        <option value="">Toutes</option>
        <option v-for="item in statuses" :key="item.slug" :value="item.slug">
          {{ item.label }}
        </option>
      </select>
    </label>
  </form>
</template>
