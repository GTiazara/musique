/**
/**
 * Moteur d'analyse et de lecture de tablatures guitare pour Guitarothèque.
 * Convertit une tablature ASCII 6 cordes en événements musicaux Web Audio.
 */

/** Accordage standard (du mi aigu à la corde de mi grave) : E4, B3, G3, D3, A2, E2. */
export const STANDARD_TUNING_MIDI = [64, 59, 55, 50, 45, 40] as const;

export type TabNote = {
  stringIndex: number; // 0 = mi aigu, 5 = mi grave
  stringName: string;
  fret: number;
  midi: number;
  freq: number;
  isBass: boolean;
};

export type TabColumnEvent = {
  colIndex: number;
  notes: TabNote[];
};

export type TabSystem = {
  headerLines: string[];
  stringLines: Array<{ name: string; text: string; raw: string }>;
  totalCols: number;
  charsPerBeat: number;
  events: TabColumnEvent[];
};

/**
 * Calcule la fréquence en Hertz d'une note MIDI.
 */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const STRING_PREFIX_REGEX = /^\s*([eEbBgGdDaA])\s*\|/;

/**
 * Détecte si une ligne commence par une corde de guitare suivie d'une barre : e|, B|, G|, etc.
 */
export function isStringLine(line: string): boolean {
  return STRING_PREFIX_REGEX.test(line);
}

/**
 * Estime le nombre de caractères par temps (noire) à partir de la largeur d'une mesure (distance entre barres |).
 * Dans les tablatures ASCII :
 * - Mesure standard à ~32 caractères => 8 caractères par temps (1 temps = 8 doubles croches/subdivisions)
 * - Mesure standard à ~16 caractères => 4 caractères par temps
 * - Mesure standard à ~8 caractères => 2 caractères par temps
 */
export function detectCharsPerBeat(line: string): number {
  const barPositions: number[] = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '|') {
      barPositions.push(i);
    }
  }

  if (barPositions.length >= 2) {
    const diffs: number[] = [];
    for (let i = 1; i < barPositions.length; i++) {
      const diff = barPositions[i]! - barPositions[i - 1]! - 1;
      if (diff > 4) diffs.push(diff);
    }
    if (diffs.length > 0) {
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      if (avg >= 24) return 8;
      if (avg >= 12) return 4;
      if (avg >= 6) return 2;
    }
  }

  return 4; // Défaut : 4 caractères par temps
}

/**
 * Analyse un texte brut de tablature pour en extraire les systèmes jouables.
 */
export function parseTab(source: string, capo = 0): TabSystem[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const systems: TabSystem[] = [];

  let currentHeaders: string[] = [];
  let currentStringLines: Array<{ name: string; text: string; raw: string }> = [];

  function flushSystem() {
    if (currentStringLines.length >= 4) {
      // Normaliser sur 6 cordes si possible
      const count = currentStringLines.length;
      const totalCols = Math.max(...currentStringLines.map((s) => s.text.length));
      const charsPerBeat = detectCharsPerBeat(currentStringLines[0]?.raw ?? '');

      const events: TabColumnEvent[] = [];

      for (let col = 0; col < totalCols; col++) {
        const notesInCol: TabNote[] = [];

        for (let sIdx = 0; sIdx < count; sIdx++) {
          const strObj = currentStringLines[sIdx]!;
          const char = strObj.text[col];

          if (char && char >= '0' && char <= '9') {
            // Regarder si c'est un nombre à 2 chiffres
            let fretStr = char;
            const nextChar = strObj.text[col + 1];
            if (nextChar && nextChar >= '0' && nextChar <= '9') {
              fretStr += nextChar;
            }

            const fret = parseInt(fretStr, 10);
            // Associer l'index de corde à STANDARD_TUNING_MIDI
            // Si 6 cordes : sIdx 0 = mi aigu (64), sIdx 5 = mi grave (40)
            const stringIndex = count === 6 ? sIdx : Math.min(sIdx, 5);
            const baseMidi = STANDARD_TUNING_MIDI[stringIndex] ?? 64;
            const midi = baseMidi + capo + fret;
            const freq = midiToFreq(midi);
            const isBass = stringIndex >= 3; // Ré, La, Mi grave

            notesInCol.push({
              stringIndex,
              stringName: strObj.name,
              fret,
              midi,
              freq,
              isBass,
            });
          }
        }

        if (notesInCol.length > 0) {
          events.push({ colIndex: col, notes: notesInCol });
        }
      }

      systems.push({
        headerLines: [...currentHeaders],
        stringLines: [...currentStringLines],
        totalCols,
        charsPerBeat,
        events,
      });
    }

    currentHeaders = [];
    currentStringLines = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentStringLines.length >= 4) {
        flushSystem();
      }
      continue;
    }

    const match = line.match(STRING_PREFIX_REGEX);
    if (match) {
      const name = match[1]!;
      const barIndex = line.indexOf('|');
      const text = line.slice(barIndex + 1);
      currentStringLines.push({ name, text, raw: line });

      if (currentStringLines.length === 6) {
        flushSystem();
      }
    } else {
      if (currentStringLines.length === 0) {
        currentHeaders.push(line);
      } else {
        flushSystem();
        currentHeaders.push(line);
      }
    }
  }

  if (currentStringLines.length >= 4) {
    flushSystem();
  }

  return systems;
}

/**
 * Joue le son d'une corde de guitare pincée via Web Audio API.
 */
export function playGuitarPluck(
  audioCtx: AudioContext,
  freq: number,
  duration = 1.2,
  isBass = false,
): void {
  const now = audioCtx.currentTime;

  // Master Gain avec enveloppe d'attaque rapide et extinction exponentielle
  const noteGain = audioCtx.createGain();
  const volume = isBass ? 0.35 : 0.28;
  noteGain.gain.setValueAtTime(0, now);
  noteGain.gain.linearRampToValueAtTime(volume, now + 0.006);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  // Transitoire percussif du doigt / médiator
  const clickLength = Math.floor(audioCtx.sampleRate * 0.015);
  const clickBuffer = audioCtx.createBuffer(1, clickLength, audioCtx.sampleRate);
  const channelData = clickBuffer.getChannelData(0);
  for (let i = 0; i < clickLength; i++) {
    channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickLength * 0.2));
  }
  const clickSource = audioCtx.createBufferSource();
  clickSource.buffer = clickBuffer;
  const clickFilter = audioCtx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.setValueAtTime(freq * 2.5, now);
  clickFilter.Q.setValueAtTime(3, now);
  clickSource.connect(clickFilter);
  clickFilter.connect(noteGain);
  clickSource.start(now);

  // Harmonique fondamentale (triangle pour la rondeur acoustique)
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, now);

  // 2ème harmonique (chaleur du bois)
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, now);
  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0.35, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.65);
  osc2.connect(gain2);
  gain2.connect(noteGain);

  // 3ème harmonique (brillance métallique de la corde)
  const osc3 = audioCtx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(freq * 3, now);
  const gain3 = audioCtx.createGain();
  gain3.gain.setValueAtTime(0.18, now);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.45);
  osc3.connect(gain3);
  gain3.connect(noteGain);

  // Filtre corps de résonance (atténue les ultra-aigus naturellement)
  const bodyFilter = audioCtx.createBiquadFilter();
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.setValueAtTime(Math.min(freq * 6, 6500), now);
  bodyFilter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + duration);

  osc1.connect(noteGain);
  noteGain.connect(bodyFilter);
  bodyFilter.connect(audioCtx.destination);

  osc1.start(now);
  osc2.start(now);
  osc3.start(now);

  osc1.stop(now + duration);
  osc2.stop(now + duration);
  osc3.stop(now + duration);
}
