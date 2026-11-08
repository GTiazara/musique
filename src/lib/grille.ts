/** Nom d'accord tel qu'on l'écrit dans une grille : Em7, Dsus4, F#m, Bb, C/G. */
const CHORD_NAME =
  /^[A-G](?:#|b)?(?:m|min|maj|dim|aug|sus|add|M)?\d{0,2}(?:sus[24]|add\d{1,2}|maj\d{1,2}|m\d{1,2}|b5|#5|b9|#9|°|ø|\+)*(?:\/[A-G](?:#|b)?)?$/;

export type SheetChunk = { chord: string; lyric: string };

export type SheetLine =
  | { kind: 'section'; text: string }
  | { kind: 'music'; chunks: SheetChunk[] }
  | { kind: 'blank' };

/**
 * Indique si le texte entre crochets est un accord, et non un mot ordinaire.
 * Reçoit le contenu sans les crochets. « Couplet » est refusé, « Em7 » est accepté.
 */
export function isChordName(value: string): boolean {
  return CHORD_NAME.test(value.trim());
}

/**
 * Découpe une ligne de grille en accords posés sur le texte qui suit.
 * Reçoit une ligne. Une ligne `# Couplet` devient un repère de section.
 */
export function parseGrilleLine(line: string): SheetLine {
  const trimmed = line.trim();
  if (!trimmed) return { kind: 'blank' };
  if (trimmed.startsWith('#')) {
    return { kind: 'section', text: trimmed.replace(/^#\s*/, '') };
  }

  const token = /\[([^\]]+)\]/g;
  const chunks: SheetChunk[] = [];
  let chord = '';
  let lyric = '';
  let last = 0;
  let found = false;
  for (const match of line.matchAll(token)) {
    const raw = (match[1] ?? '').trim();
    const between = line.slice(last, match.index);
    last = (match.index ?? 0) + match[0].length;
    // Un crochet qui n'est pas un accord reste dans les paroles.
    if (!isChordName(raw)) {
      lyric += between + match[0];
      continue;
    }
    found = true;
    chunks.push({ chord, lyric: lyric + between });
    chord = raw;
    lyric = '';
  }
  if (!found) return { kind: 'music', chunks: [{ chord: '', lyric: line }] };
  chunks.push({ chord, lyric: lyric + line.slice(last) });
  // La ligne commençait par un accord : le premier morceau est vide.
  if (chunks[0] && !chunks[0].chord && !chunks[0].lyric) chunks.shift();
  return { kind: 'music', chunks };
}

/**
 * Lit un bloc de grille, lignes conservées.
 * Reçoit le texte du bloc, sans les délimiteurs. Renvoie les lignes typées.
 */
export function parseGrille(source: string): SheetLine[] {
  return source.replace(/\r\n/g, '\n').split('\n').map(parseGrilleLine);
}

/**
 * Échappe un texte avant de l'insérer dans le HTML.
 * Reçoit le texte du morceau. Renvoie le texte affichable.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}

/**
 * HTML d'une grille, accords au-dessus des syllabes.
 * Reçoit le texte du bloc. Le résultat est du HTML déjà échappé.
 */
export function grilleToHtml(source: string): string {
  const lines = parseGrille(source).map((line) => {
    if (line.kind === 'blank') return '<div class="sheet-gap"></div>';
    if (line.kind === 'section') {
      return `<p class="sheet-section">${escapeHtml(line.text)}</p>`;
    }
    const chunks = line.chunks
      .map((chunk) => {
        const chord = chunk.chord
          ? `<span class="sheet-chord">${escapeHtml(chunk.chord)}</span>`
          : '<span class="sheet-chord sheet-chord-empty"></span>';
        return `<span class="sheet-chunk">${chord}<span class="sheet-lyric">${escapeHtml(chunk.lyric)}</span></span>`;
      })
      .join('');
    return `<p class="sheet-line">${chunks}</p>`;
  });
  return `<div class="sheet">${lines.join('')}</div>`;
}

/**
 * HTML d'une tablature, espaces conservés.
 * Reçoit le texte du bloc. Renvoie un bloc préformaté échappé.
 */
export function tabToHtml(source: string): string {
  return `<pre class="tab-sheet">${escapeHtml(source.replace(/\r\n/g, '\n'))}</pre>`;
}

/**
 * Noms d'accords dans l'ordre de première apparition.
 * Reçoit le Markdown du morceau. Seuls les blocs `grille` sont lus.
 */
export function chordNamesInMarkdown(markdown: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const addName = (name: string): void => {
    if (seen.has(name)) return;
    seen.add(name);
    names.push(name);
  };
  const fences = markdown.matchAll(/```grille[^\n]*\r?\n([\s\S]*?)```/g);
  for (const fence of fences) {
    const source = fence[1] ?? '';
    for (const line of parseGrille(source)) {
      if (line.kind !== 'music') continue;
      for (const chunk of line.chunks) {
        if (chunk.chord) addName(chunk.chord);
      }
    }

    // Certaines anciennes fiches alignent les accords sur une ligne séparée,
    // sans crochets. On les reconnaît seulement si toute la ligne est composée
    // d'accords : les paroles ordinaires ne peuvent donc pas être prises pour
    // des diagrammes.
    for (const sourceLine of source.replace(/\r\n/g, '\n').split('\n')) {
      const tokens = sourceLine.trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0 || !tokens.every(isChordName)) continue;
      for (const token of tokens) addName(token);
    }
  }
  return names;
}
