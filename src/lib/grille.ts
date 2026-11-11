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
 * Indique si une ligne est un repère de section.
 * Accepte les lignes commençant par # (ex: # Couplet 1)
 * et les en-têtes entre crochets (ex: [Verse 1], [Intro], [Chorus], [Refrain], [Pont], [Instrumental]).
 */
export function parseSectionLine(line: string): { isSection: boolean; text: string } {
  const trimmed = line.trim();
  if (trimmed.startsWith('#')) {
    return { isSection: true, text: trimmed.replace(/^#\s*/, '') };
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!isChordName(inner)) {
      return { isSection: true, text: inner };
    }
  }
  return { isSection: false, text: '' };
}

/**
 * Indique si une ligne ne contient que des noms d'accords (séparés par des espaces)
 * et éventuellement des annotations musicales courtes comme (x2), x2, %, |.
 */
export function isChordOnlyLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('#')) return false;
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!isChordName(inner)) return false;
  }
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((token) => {
    const cleanToken = token.replace(/^\(+|\)+$/g, '');
    return (
      isChordName(token) ||
      isChordName(cleanToken) ||
      /^x\d+$/i.test(token) ||
      token === '%' ||
      token === '|'
    );
  });
}

type ChordToken = {
  name: string;
  startIndex: number;
};

function extractChordsWithPositions(line: string): ChordToken[] {
  const chords: ChordToken[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    chords.push({
      name: match[0],
      startIndex: match.index,
    });
  }
  return chords;
}

/**
 * Associe une ligne d'accords et une ligne de paroles selon les positions de colonnes.
 */
function pairChordAndLyricLine(chordLine: string, lyricLine: string): SheetLine {
  const chords = extractChordsWithPositions(chordLine);
  if (chords.length === 0) {
    return { kind: 'music', chunks: [{ chord: '', lyric: lyricLine }] };
  }

  const chunks: SheetChunk[] = [];
  const firstChord = chords[0]!;

  // Paroles avant le premier accord
  if (firstChord.startIndex > 0) {
    const leadingLyric = lyricLine.slice(0, firstChord.startIndex);
    chunks.push({ chord: '', lyric: leadingLyric });
  }

  for (let i = 0; i < chords.length; i++) {
    const current = chords[i]!;
    const next = chords[i + 1];
    const from = current.startIndex;
    const to = next ? next.startIndex : undefined;

    let segmentLyric = '';
    if (from < lyricLine.length) {
      segmentLyric = to !== undefined ? lyricLine.slice(from, to) : lyricLine.slice(from);
    }
    chunks.push({ chord: current.name, lyric: segmentLyric });
  }

  return { kind: 'music', chunks };
}

/**
 * Découpe une ligne d'accords seule (intro, instrumental, etc.) en morceaux avec espacements.
 */
function parseStandaloneChordLine(chordLine: string): SheetLine {
  const chords = extractChordsWithPositions(chordLine);
  if (chords.length === 0) return { kind: 'blank' };

  const chunks: SheetChunk[] = [];
  for (let i = 0; i < chords.length; i++) {
    const current = chords[i]!;
    const next = chords[i + 1];
    const spacingLength = next ? Math.max(1, next.startIndex - (current.startIndex + current.name.length)) : 1;
    chunks.push({ chord: current.name, lyric: ' '.repeat(spacingLength) });
  }
  return { kind: 'music', chunks };
}

/**
 * Découpe une ligne de grille en accords posés sur le texte qui suit.
 * Reçoit une ligne. Une ligne `# Couplet` devient un repère de section.
 */
export function parseGrilleLine(line: string): SheetLine {
  const trimmed = line.trim();
  if (!trimmed) return { kind: 'blank' };

  const section = parseSectionLine(line);
  if (section.isSection) {
    return { kind: 'section', text: section.text };
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
 * Prend en charge :
 * 1. La notation inline entre crochets ([C]Paroles)
 * 2. La notation sur deux lignes (Ligne d'accords au-dessus de la ligne de paroles)
 * 3. Les lignes d'accords instrumentales / intros
 * 4. Les sections (# Couplet ou [Verse 1])
 */
export function parseGrille(source: string): SheetLine[] {
  const rawLines = source.replace(/\r\n/g, '\n').split('\n');
  const result: SheetLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]!;
    const trimmed = line.trim();

    if (!trimmed) {
      result.push({ kind: 'blank' });
      continue;
    }

    const section = parseSectionLine(line);
    if (section.isSection) {
      result.push({ kind: 'section', text: section.text });
      continue;
    }

    // Si la ligne contient des crochets d'accords explicites [C], utiliser le parseur inline
    if (/\[[A-G][^\]]*\]/.test(line)) {
      result.push(parseGrilleLine(line));
      continue;
    }

    // Si la ligne est uniquement composée d'accords (style accords au-dessus des paroles)
    if (isChordOnlyLine(line)) {
      // Regarder si la ligne suivante est une ligne de paroles
      const nextLine = rawLines[i + 1];
      const nextTrimmed = nextLine ? nextLine.trim() : '';
      const nextSection = nextLine ? parseSectionLine(nextLine) : { isSection: false };

      if (
        nextLine !== undefined &&
        nextTrimmed.length > 0 &&
        !nextSection.isSection &&
        !isChordOnlyLine(nextLine) &&
        !/\[[A-G][^\]]*\]/.test(nextLine)
      ) {
        // Associer la ligne d'accords à la ligne de paroles suivante
        result.push(pairChordAndLyricLine(line, nextLine));
        i++; // Passer la ligne de paroles consommée
        continue;
      }

      // Ligne d'accords autonome (Intro, Instrumental, etc.)
      result.push(parseStandaloneChordLine(line));
      continue;
    }

    // Ligne de texte ordinaire
    result.push(parseGrilleLine(line));
  }

  return result;
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
