import { describe, expect, it } from 'vitest';
import {
  detectCharsPerBeat,
  isStringLine,
  midiToFreq,
  parseTab,
  STANDARD_TUNING_MIDI,
} from '../src/lib/tab-player';

describe('tab-player - utilitaires musicaux', () => {
  it('calcule la fréquence correcte pour A4 (440 Hz) et les cordes à vide', () => {
    expect(Math.round(midiToFreq(69))).toBe(440);
    // Corde de La à vide = A2 (MIDI 45) = 110 Hz
    expect(Math.round(midiToFreq(45))).toBe(110);
  });

  it('détecte les lignes de cordes de guitare', () => {
    expect(isStringLine('e|---0---|')).toBe(true);
    expect(isStringLine('B|---1---|')).toBe(true);
    expect(isStringLine('G|---0---|')).toBe(true);
    expect(isStringLine('D|---2---|')).toBe(true);
    expect(isStringLine('A|-3-----|')).toBe(true);
    expect(isStringLine('E|-------|')).toBe(true);
    expect(isStringLine('   C   G   ')).toBe(false);
  });

  it('estime la largeur de mesure et la subdivision', () => {
    // Mesure large ~32 caractères
    const wideLine = 'e|---------0---------------0-------|---------0---------------0-------|';
    expect(detectCharsPerBeat(wideLine)).toBe(8);

    // Mesure moyenne ~16 caractères
    const standardLine = 'e|---0---1---0---|---0---1---0---|';
    expect(detectCharsPerBeat(standardLine)).toBe(4);
  });
});

describe('tab-player - parseur de tablature', () => {
  const sampleTab = `
   C
e|---------0-------|
B|-------1---1-----|
G|-----0-------0---|
D|-----------------|
A|-3---------------|
E|-----------------|
`;

  it('extrait un système avec les notes et positions exactes', () => {
    const systems = parseTab(sampleTab, 0);
    expect(systems).toHaveLength(1);

    const system = systems[0]!;
    expect(system.stringLines).toHaveLength(6);
    expect(system.events.length).toBeGreaterThan(0);

    // Première note : Corde de La (index 4), case 3 => C3 (MIDI 48)
    const firstEvent = system.events[0]!;
    expect(firstEvent.notes[0]?.fret).toBe(3);
    expect(firstEvent.notes[0]?.midi).toBe(STANDARD_TUNING_MIDI[4] + 3); // 45 + 3 = 48
  });

  it('prend en compte le capodastre', () => {
    // Avec capo 5 (comme Je l'aime à mourir)
    const systems = parseTab(sampleTab, 5);
    const firstEvent = systems[0]!.events[0]!;
    // Corde de La (45) + capo 5 + frette 3 = 53 (F3)
    expect(firstEvent.notes[0]?.midi).toBe(53);
    expect(Math.round(firstEvent.notes[0]?.freq ?? 0)).toBe(175);
  });

  it('gère les tablatures multi-systèmes (sauts de ligne) comme des séquences distinctes', () => {
    const multiTab = `
   Am                                Dm
e|---------0---------------0-------|---------1---------------1-------|
B|-------1---1-----------1---1-----|-------3---3-----------3---3-----|
G|-----2-------2-------2-------2---|-----2-------2-------2-------2---|
D|---------------------------------|-0---------------0---------------|
A|-0---------------0---------------|---------------------------------|
E|---------------------------------|---------------------------------|

   F                                 G
e|---------1---------------1-------|---------3---------------3-------|
B|-------1---1-----------1---1-----|-------0---0-----------0---0-----|
G|-----2-------2-------2-------2---|-----0-------0-------0-------0---|
D|---------------------------------|---------------------------------|
A|---------------------------------|---------------------------------|
E|-1---------------1---------------|-3---------------3---------------|
`;
    const systems = parseTab(multiTab, 0);
    expect(systems).toHaveLength(2);
    expect(systems[0]!.stringLines).toHaveLength(6);
    expect(systems[1]!.stringLines).toHaveLength(6);

    // Système 1 démarre sur la basse La (A2 = 45)
    expect(systems[0]!.events[0]!.notes[0]?.midi).toBe(45);
    // Système 2 démarre sur la basse Fa (F2 = 41)
    expect(systems[1]!.events[0]!.notes[0]?.midi).toBe(41);
  });
});
