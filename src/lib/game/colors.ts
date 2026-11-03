import { BOXES, CELLS, COLS, NEIGHBORS, ROWS, SIZE, boxOf, colOf, rowOf } from "./grid";
import { Rng } from "./rng";
import { COLORS, type ColorName } from "./types";

/**
 * Null means "no color" (a wild). A complete coloring of the non-wild cells
 * must satisfy all three color rules.
 */
export function colorGridError(colors: readonly (ColorName | null)[]): string | null {
  if (colors.length !== CELLS) return "wrong length";

  for (let i = 0; i < CELLS; i++) {
    const a = colors[i];
    if (!a) continue;
    for (const j of NEIGHBORS[i] ?? []) {
      if (j < i) continue;
      if (colors[j] && colors[j] === a) return `adjacent ${i} and ${j} are both ${a}`;
    }
  }

  for (let r = 0; r < SIZE; r++) {
    const seen = new Set<ColorName>();
    for (const i of ROWS[r] ?? []) {
      const c = colors[i];
      if (c) seen.add(c);
    }
    if (seen.size < 4) return `row ${r} is missing a color`;
  }

  for (let c = 0; c < SIZE; c++) {
    const seen = new Set<ColorName>();
    for (const i of COLS[c] ?? []) {
      const color = colors[i];
      if (color) seen.add(color);
    }
    if (seen.size < 4) return `column ${c} is missing a color`;
  }

  for (let b = 0; b < 6; b++) {
    const counts = [0, 0, 0, 0];
    for (const i of BOXES[b] ?? []) {
      const color = colors[i];
      if (!color) continue;
      counts[COLORS.indexOf(color)]! += 1;
    }
    for (let k = 0; k < 4; k++) {
      if (counts[k]! > 2) return `box ${b} has more than 2 ${COLORS[k]}`;
    }
  }

  return null;
}

/** Diagonal Latin coloring. Valid for every shift, with or without a horizontal flip. */
export function latinColoring(shift: number, flipH: boolean): ColorName[] {
  const out: ColorName[] = [];
  for (let i = 0; i < CELLS; i++) {
    const c = flipH ? SIZE - 1 - colOf(i) : colOf(i);
    const id = (rowOf(i) + c + shift) % 4;
    out.push(COLORS[id]!);
  }
  return out;
}

function tryPattern(wilds: readonly boolean[], rng: Rng): (ColorName | null)[] | null {
  const perm = rng.shuffle([0, 1, 2, 3]);
  const shift = rng.int(4);
  const flipH = rng.int(2) === 1;
  const colors: (ColorName | null)[] = new Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    if (wilds[i]) {
      colors[i] = null;
      continue;
    }
    const c = flipH ? SIZE - 1 - colOf(i) : colOf(i);
    const id = perm[(rowOf(i) + c + shift) % 4]!;
    colors[i] = COLORS[id]!;
  }
  return colorGridError(colors) ? null : colors;
}

/**
 * Assign colors so all 3 rules hold. Wilds stay null.
 * Tries shifted Latin patterns first (instant when a wild lands on a duplicate),
 * then a pattern-guided backtracker. Returns null if this wild layout is too
 * tangled to finish inside the node budget.
 */
export function assignColors(wilds: readonly boolean[], rng: Rng): (ColorName | null)[] | null {
  for (let t = 0; t < 24; t++) {
    const hit = tryPattern(wilds, rng);
    if (hit) return hit;
  }
  return backtrackColors(wilds, rng);
}

function backtrackColors(wilds: readonly boolean[], rng: Rng): (ColorName | null)[] | null {
  const perm = rng.shuffle([0, 1, 2, 3]);
  const shift = rng.int(4);
  const preferred = new Int8Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    preferred[i] = perm[(rowOf(i) + colOf(i) + shift) % 4]!;
  }
  const altOrder = rng.shuffle([0, 1, 2, 3]);

  const color = new Int8Array(CELLS);
  color.fill(-1);
  const open: number[] = [];
  const slotsRow = new Int8Array(SIZE);
  const slotsCol = new Int8Array(SIZE);
  for (let i = 0; i < CELLS; i++) {
    if (wilds[i]) {
      color[i] = -2;
    } else {
      open.push(i);
      slotsRow[rowOf(i)] = (slotsRow[rowOf(i)] ?? 0) + 1;
      slotsCol[colOf(i)] = (slotsCol[colOf(i)] ?? 0) + 1;
    }
  }

  const rowCount = new Int8Array(SIZE * 4);
  const colCount = new Int8Array(SIZE * 4);
  const boxCount = new Int8Array(6 * 4);
  const filledRow = new Int8Array(SIZE);
  const filledCol = new Int8Array(SIZE);
  let nodes = 0;
  const LIMIT = 30_000;

  function feasible(i: number, colr: number): boolean {
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    if ((boxCount[b * 4 + colr] ?? 0) >= 2) return false;
    if (c > 0 && color[i - 1] === colr) return false;
    if (c < 5 && color[i + 1] === colr) return false;
    if (r > 0 && color[i - SIZE] === colr) return false;
    if (r < 5 && color[i + SIZE] === colr) return false;

    const rowMax = (slotsRow[r] ?? 0) - 3;
    const colMax = (slotsCol[c] ?? 0) - 3;
    if ((rowCount[r * 4 + colr] ?? 0) + 1 > rowMax) return false;
    if ((colCount[c * 4 + colr] ?? 0) + 1 > colMax) return false;

    let rowMissing = 0;
    let colMissing = 0;
    for (let k = 0; k < 4; k++) {
      if ((rowCount[r * 4 + k] ?? 0) + (k === colr ? 1 : 0) === 0) rowMissing++;
      if ((colCount[c * 4 + k] ?? 0) + (k === colr ? 1 : 0) === 0) colMissing++;
    }
    const rowLeft = (slotsRow[r] ?? 0) - ((filledRow[r] ?? 0) + 1);
    const colLeft = (slotsCol[c] ?? 0) - ((filledCol[c] ?? 0) + 1);
    if (rowMissing > rowLeft) return false;
    if (colMissing > colLeft) return false;
    return true;
  }

  function place(i: number, colr: number): void {
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    color[i] = colr;
    rowCount[r * 4 + colr] = (rowCount[r * 4 + colr] ?? 0) + 1;
    colCount[c * 4 + colr] = (colCount[c * 4 + colr] ?? 0) + 1;
    boxCount[b * 4 + colr] = (boxCount[b * 4 + colr] ?? 0) + 1;
    filledRow[r] = (filledRow[r] ?? 0) + 1;
    filledCol[c] = (filledCol[c] ?? 0) + 1;
  }

  function unplace(i: number, colr: number): void {
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    color[i] = -1;
    rowCount[r * 4 + colr] = (rowCount[r * 4 + colr] ?? 1) - 1;
    colCount[c * 4 + colr] = (colCount[c * 4 + colr] ?? 1) - 1;
    boxCount[b * 4 + colr] = (boxCount[b * 4 + colr] ?? 1) - 1;
    filledRow[r] = (filledRow[r] ?? 1) - 1;
    filledCol[c] = (filledCol[c] ?? 1) - 1;
  }

  function bt(k: number): boolean {
    if (k === open.length) return true;
    if (++nodes > LIMIT) return false;
    const i = open[k]!;
    const pref = preferred[i] ?? 0;
    const order: number[] = [pref];
    for (const a of altOrder) if (a !== pref) order.push(a);
    for (const colr of order) {
      if (!feasible(i, colr)) continue;
      place(i, colr);
      if (bt(k + 1)) return true;
      unplace(i, colr);
    }
    return false;
  }

  if (!bt(0) || nodes > LIMIT) return null;

  const colors: (ColorName | null)[] = new Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    colors[i] = color[i] === -2 ? null : COLORS[color[i]!] ?? null;
  }
  return colorGridError(colors) ? null : colors;
}
