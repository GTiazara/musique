<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { parseTab, playGuitarPluck } from '../lib/tab-player';

const props = withDefaults(
  defineProps<{
    capo?: number;
  }>(),
  {
    capo: 0,
  },
);

type ActivePlayer = {
  stop: () => void;
};

const activePlayers: ActivePlayer[] = [];
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

onMounted(() => {
  const preElements = document.querySelectorAll<HTMLPreElement>('.reading pre.tab-sheet');

  preElements.forEach((pre) => {
    const rawText = pre.textContent || '';
    const systems = parseTab(rawText, props.capo);

    // Ne s'active que si la tablature contient de vraies cordes et des notes jouables
    if (systems.length === 0 || !systems.some((s) => s.events.length > 0)) {
      return;
    }

    // Création du conteneur du lecteur
    const wrapper = document.createElement('div');
    wrapper.className = 'tab-player-box';

    // Remplacement du pre par le wrapper
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    // État du lecteur
    let isPlaying = false;
    let isLooping = false;
    let bpm = 75;
    let timerId: number | null = null;
    let currentSystemIdx = 0;
    let currentColIdx = 0;

    // Recréer le contenu du PRE en cellules découpées pour la mise en surbrillance
    pre.innerHTML = '';
    pre.classList.add('tab-interactive');

    systems.forEach((system, sysIdx) => {
      if (sysIdx > 0) {
        const gap = document.createElement('div');
        gap.className = 'tab-gap';
        pre.appendChild(gap);
      }

      // En-têtes éventuels (ex. accords au-dessus)
      system.headerLines.forEach((header) => {
        const hDiv = document.createElement('div');
        hDiv.className = 'tab-header-line';
        hDiv.textContent = header;
        pre.appendChild(hDiv);
      });

      // Lignes de cordes du système
      system.stringLines.forEach((strLine, sIdx) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'tab-line-row';

        // Corde préfixe (ex: "e|")
        const prefixSpan = document.createElement('span');
        prefixSpan.className = 'tab-prefix';
        prefixSpan.textContent = strLine.name + '|';
        rowDiv.appendChild(prefixSpan);

        // Colonnes de notes et tirets
        for (let col = 0; col < strLine.text.length; col++) {
          const char = strLine.text[col]!;
          const cell = document.createElement('span');
          cell.className = 'tab-cell';
          cell.dataset.system = String(sysIdx);
          cell.dataset.col = String(col);
          cell.dataset.string = String(sIdx);
          cell.textContent = char;

          // Détecter si cette cellule contient une note
          const eventAtCol = system.events.find((e) => e.colIndex === col);
          const noteAtCell = eventAtCol?.notes.find((n) => n.stringIndex === sIdx);

          if (noteAtCell) {
            cell.classList.add('has-note');
            cell.title = `Corde ${strLine.name} frette ${noteAtCell.fret} (${Math.round(noteAtCell.freq)} Hz)`;
            cell.addEventListener('click', (ev) => {
              ev.stopPropagation();
              const ctx = getAudioContext();
              playGuitarPluck(ctx, noteAtCell.freq, 1.2, noteAtCell.isBass);
              highlightColumn(sysIdx, col, 150);
            });
          }

          rowDiv.appendChild(cell);
        }

        pre.appendChild(rowDiv);
      });
    });

    // Barre d'outils du lecteur
    const toolbar = document.createElement('div');
    toolbar.className = 'tab-player-toolbar';
    toolbar.innerHTML = `
      <div class="tab-toolbar-left">
        <button type="button" class="tab-btn tab-btn-play" title="Lancer / Arrêter">
          <span class="icon">▶</span> <span class="label">Écouter</span>
        </button>
        <button type="button" class="tab-btn tab-btn-stop" title="Arrêter">
          <span class="icon">⏹</span>
        </button>
        <button type="button" class="tab-btn tab-btn-loop" title="Répéter en boucle">
          <span class="icon">🔁</span>
        </button>
      </div>
      <div class="tab-toolbar-right">
        <div class="tab-bpm-control">
          <button type="button" class="tab-bpm-btn tab-bpm-minus" title="Ralentir">−</button>
          <span class="tab-bpm-value">${bpm} BPM</span>
          <button type="button" class="tab-bpm-btn tab-bpm-plus" title="Accélérer">+</button>
        </div>
        ${props.capo > 0 ? `<span class="tab-capo-pill">Capo ${props.capo}</span>` : ''}
      </div>
    `;

    wrapper.insertBefore(toolbar, pre);

    const playBtn = toolbar.querySelector<HTMLButtonElement>('.tab-btn-play')!;
    const stopBtn = toolbar.querySelector<HTMLButtonElement>('.tab-btn-stop')!;
    const loopBtn = toolbar.querySelector<HTMLButtonElement>('.tab-btn-loop')!;
    const minusBtn = toolbar.querySelector<HTMLButtonElement>('.tab-bpm-minus')!;
    const plusBtn = toolbar.querySelector<HTMLButtonElement>('.tab-bpm-plus')!;
    const bpmVal = toolbar.querySelector<HTMLElement>('.tab-bpm-value')!;

    function highlightColumn(sysIdx: number, col: number, duration = 0) {
      pre.querySelectorAll('.tab-cell.is-active').forEach((el) => el.classList.remove('is-active'));
      const activeCells = pre.querySelectorAll(`.tab-cell[data-system="${sysIdx}"][data-col="${col}"]`);
      activeCells.forEach((el) => el.classList.add('is-active'));

      if (duration > 0) {
        setTimeout(() => {
          activeCells.forEach((el) => el.classList.remove('is-active'));
        }, duration);
      }
    }

    function clearHighlight() {
      pre.querySelectorAll('.tab-cell.is-active').forEach((el) => el.classList.remove('is-active'));
    }

    function stopPlayback() {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
      isPlaying = false;
      currentSystemIdx = 0;
      currentColIdx = 0;
      clearHighlight();
      playBtn.querySelector('.icon')!.textContent = '▶';
      playBtn.querySelector('.label')!.textContent = 'Écouter';
      playBtn.classList.remove('is-playing');
    }

    function startPlayback() {
      const audioCtx = getAudioContext();
      isPlaying = true;
      playBtn.querySelector('.icon')!.textContent = '⏸';
      playBtn.querySelector('.label')!.textContent = 'Pause';
      playBtn.classList.add('is-playing');

      // Vitesse basée sur le nombre de colonnes par temps du premier système
      const charsPerBeat = systems[0]?.charsPerBeat || 4;
      const stepMs = Math.max(30, Math.round((60000 / bpm) / charsPerBeat));

      timerId = window.setInterval(() => {
        let activeSys = systems[currentSystemIdx];
        if (!activeSys) {
          stopPlayback();
          return;
        }

        // Si on arrive au bout du système actuel, on passe séquentiellement au suivant !
        if (currentColIdx >= activeSys.totalCols) {
          currentSystemIdx++;
          currentColIdx = 0;

          if (currentSystemIdx >= systems.length) {
            if (isLooping) {
              currentSystemIdx = 0;
              currentColIdx = 0;
            } else {
              stopPlayback();
              return;
            }
          }

          activeSys = systems[currentSystemIdx];
          if (!activeSys) {
            stopPlayback();
            return;
          }
        }

        // Surbrillance uniquement sur la colonne du système qui joue actuellement
        highlightColumn(currentSystemIdx, currentColIdx);

        // Déclencher les notes du système actif
        const event = activeSys.events.find((e) => e.colIndex === currentColIdx);
        if (event) {
          event.notes.forEach((note) => {
            playGuitarPluck(audioCtx, note.freq, 1.2, note.isBass);
          });
        }

        currentColIdx++;
      }, stepMs);
    }

    playBtn.addEventListener('click', () => {
      if (isPlaying) {
        if (timerId !== null) {
          clearInterval(timerId);
          timerId = null;
        }
        isPlaying = false;
        playBtn.querySelector('.icon')!.textContent = '▶';
        playBtn.querySelector('.label')!.textContent = 'Reprendre';
        playBtn.classList.remove('is-playing');
      } else {
        startPlayback();
      }
    });

    stopBtn.addEventListener('click', () => {
      stopPlayback();
    });

    loopBtn.addEventListener('click', () => {
      isLooping = !isLooping;
      loopBtn.classList.toggle('is-active', isLooping);
    });

    minusBtn.addEventListener('click', () => {
      if (bpm > 40) {
        bpm -= 5;
        bpmVal.textContent = `${bpm} BPM`;
        if (isPlaying) {
          stopPlayback();
          startPlayback();
        }
      }
    });

    plusBtn.addEventListener('click', () => {
      if (bpm < 200) {
        bpm += 5;
        bpmVal.textContent = `${bpm} BPM`;
        if (isPlaying) {
          stopPlayback();
          startPlayback();
        }
      }
    });

    activePlayers.push({ stop: stopPlayback });
  });
});

onUnmounted(() => {
  activePlayers.forEach((p) => p.stop());
  if (sharedAudioCtx && sharedAudioCtx.state !== 'closed') {
    sharedAudioCtx.close();
    sharedAudioCtx = null;
  }
});
</script>

<template>
  <div class="tab-player-anchor" aria-hidden="true"></div>
</template>
