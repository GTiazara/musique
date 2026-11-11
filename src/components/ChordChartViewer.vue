<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  src: string;
  alt: string;
}>();

const scale = ref(1);
const isFullscreen = ref(false);
const translateX = ref(0);
const translateY = ref(0);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);

const transformStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  cursor: scale.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'zoom-in',
}));

function zoomIn(): void {
  scale.value = Math.min(scale.value + 0.3, 3);
}

function zoomOut(): void {
  scale.value = Math.max(scale.value - 0.3, 0.8);
  if (scale.value <= 1) {
    translateX.value = 0;
    translateY.value = 0;
  }
}

function resetZoom(): void {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
}

function toggleFullscreen(): void {
  isFullscreen.value = !isFullscreen.value;
  resetZoom();
}

function handleImageClick(): void {
  if (scale.value === 1) {
    scale.value = 1.8;
  } else {
    resetZoom();
  }
}

function onMouseDown(e: MouseEvent): void {
  if (scale.value <= 1) return;
  isDragging.value = true;
  startX.value = e.clientX - translateX.value;
  startY.value = e.clientY - translateY.value;
}

function onMouseMove(e: MouseEvent): void {
  if (!isDragging.value) return;
  translateX.value = e.clientX - startX.value;
  translateY.value = e.clientY - startY.value;
}

function onMouseUp(): void {
  isDragging.value = false;
}
</script>

<template>
  <div class="chord-viewer" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="chord-viewer-toolbar">
      <div class="toolbar-left">
        <button type="button" class="btn" title="Zoom avant" @click="zoomIn">
          <span>+</span>
        </button>
        <button type="button" class="btn" title="Zoom arrière" @click="zoomOut">
          <span>−</span>
        </button>
        <button type="button" class="btn" title="Réinitialiser" @click="resetZoom">
          <span>{{ Math.round(scale * 100) }}%</span>
        </button>
      </div>
      <div class="toolbar-right">
        <button
          type="button"
          class="btn"
          :title="isFullscreen ? 'Quitter le plein écran' : 'Plein écran'"
          @click="toggleFullscreen"
        >
          <span>{{ isFullscreen ? '✕ Fermer' : '⛶ Plein écran' }}</span>
        </button>
        <a :href="src" target="_blank" rel="noopener noreferrer" class="btn btn-primary" title="Ouvrir l'image en haute définition">
          <span>↗ Haute résolution</span>
        </a>
      </div>
    </div>

    <div
      class="chord-viewer-stage"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <div class="image-wrapper" :style="transformStyle" @click="handleImageClick">
        <img :src="src" :alt="alt" class="chord-chart-img" draggable="false" />
      </div>
    </div>

    <div class="chord-viewer-hint">
      <span>💡 Astuce : clique sur l'image pour zoomer ou utilise les commandes pour explorer la grille.</span>
    </div>
  </div>
</template>

<style scoped>
.chord-viewer {
  display: flex;
  flex-direction: column;
  background: #171d21;
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  margin: 20px 0 32px;
}

.chord-viewer-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 16px;
  background: #1f252a;
  border-bottom: 1px solid var(--line);
  z-index: 2;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #283139;
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.btn:hover {
  background: #39434b;
  border-color: var(--copper);
  color: var(--copper-2);
}

.btn-primary {
  background: var(--copper);
  color: var(--ink);
  border-color: var(--copper-2);
  text-decoration: none;
}

.btn-primary:hover {
  background: var(--copper-2);
  color: var(--ink);
  text-decoration: none;
}

.chord-viewer-stage {
  position: relative;
  width: 100%;
  min-height: 550px;
  max-height: 75vh;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #121619;
  padding: 20px;
  touch-action: pan-x pan-y;
}

.image-wrapper {
  display: inline-block;
  transition: transform 0.1s ease-out;
  transform-origin: top center;
  max-width: 100%;
}

.chord-chart-img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  background: #ffffff;
}

.chord-viewer-hint {
  padding: 8px 16px;
  background: #1a2024;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--muted);
  text-align: center;
}

/* Mode Plein écran */
.chord-viewer.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  border-radius: 0;
  margin: 0;
  width: 100vw;
  height: 100vh;
}

.chord-viewer.is-fullscreen .chord-viewer-stage {
  max-height: calc(100vh - 100px);
  height: 100%;
}

@media (max-width: 600px) {
  .chord-viewer-stage {
    min-height: 400px;
    padding: 10px;
  }
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
}
</style>
