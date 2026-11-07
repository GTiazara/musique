<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { DiagramView } from '../lib/diagram';

const props = defineProps<{ diagrams: DiagramView[] }>();
const hosts = ref<HTMLElement[]>([]);

/**
 * Garde l'élément qui recevra le dessin d'un accord.
 * Vue passe aussi des composants : seuls les éléments HTML sont conservés.
 */
function setHost(element: unknown, index: number): void {
  if (element instanceof HTMLElement) hosts.value[index] = element;
}

/**
 * Dessine chaque position connue avec svguitar.
 * Un accord sans position reste un texte : la librairie n'a rien à tracer.
 */
async function drawDiagrams(): Promise<void> {
  if (!props.diagrams.some((diagram) => diagram.known)) return;
  const { SVGuitarChord } = await import('svguitar');
  props.diagrams.forEach((diagram, index) => {
    const host = hosts.value[index];
    if (!host || !diagram.known) return;
    host.replaceChildren();
    new SVGuitarChord(host)
      .configure({
        frets: diagram.fretCount,
        position: diagram.position,
        orientation: 'vertical',
        // Le titre doit être dans la config : avec fixedDiagramPosition, svguitar
        // efface le titre s'il n'est porté que par l'accord.
        title: diagram.name,
        color: '#f2eadf',
        titleColor: '#e0ad7d',
        fingerColor: '#c68d5b',
        fingerTextColor: '#201913',
        fingerTextSize: 22,
        backgroundColor: 'none',
        showFretMarkers: false,
        fretSize: 1.35,
        strokeWidth: 2,
        nutWidth: 8,
        fontFamily: 'Georgia, "Times New Roman", serif',
        titleFontSize: 40,
        fixedDiagramPosition: true,
        svgTitle: `Diagramme de l'accord ${diagram.name}`,
      })
      .chord({
        title: diagram.name,
        position: diagram.position,
        fingers: diagram.fingers,
        barres: diagram.barres,
      })
      .draw();
  });
}

onMounted(() => {
  void drawDiagrams();
});
</script>

<template>
  <ul class="diagram-list">
    <li v-for="(diagram, index) in diagrams" :key="`${diagram.name}-${index}`" class="diagram">
      <div v-if="diagram.known" :ref="(element) => setHost(element, index)" class="diagram-host"></div>
      <div v-else class="diagram-missing">
        <strong>{{ diagram.name }}</strong>
        <span>Ajoute une position dans le morceau pour afficher les doigts.</span>
      </div>
    </li>
  </ul>
</template>
