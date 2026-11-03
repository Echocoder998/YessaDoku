import { BOXES, CELLS, COLS, ROWS, SIZE, boxOf, colOf, rowOf } from "./grid";
import { Rng } from "./rng";

const FULL = 0b1111110; // bits 1..6

function popcount(m: number): number {
  let c = 0;
  let x = m;
  while (x) {
    x &= x - 1;
    c++;
  }
  return c;
}

/**
 * How many number solutions the clue grid has, capped at `limit`.
 * `clues[i]` is 0 for empty or 1–6 for a given. Wilds are just empty numbers.
 */
export function countSolutions(clues: readonly number[], limit = 2): number {
  if (clues.length !== CELLS) return 0;
  const rowMask = new Uint8Array(SIZE);
  const colMask = new Uint8Array(SIZE);
  const boxMask = new Uint8Array(6);
  const empties: number[] = [];

  for (let i = 0; i < CELLS; i++) {
    const n = clues[i] ?? 0;
    if (!n) {
      empties.push(i);
      continue;
    }
    if (n < 1 || n > 6) return 0;
    const bit = 1 << n;
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    if (rowMask[r]! & bit || colMask[c]! & bit || boxMask[b]! & bit) return 0;
    rowMask[r] = (rowMask[r]! | bit) as number;
    colMask[c] = (colMask[c]! | bit) as number;
    boxMask[b] = (boxMask[b]! | bit) as number;
  }

  function maskAt(i: number): number {
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    return (~(rowMask[r]! | colMask[c]! | boxMask[b]!)) & FULL;
  }

  function search(k: number): number {
    if (k === empties.length) return 1;
    let bestAt = k;
    let bestMask = 0;
    let bestCount = 99;
    for (let t = k; t < empties.length; t++) {
      const mask = maskAt(empties[t]!);
      const cnt = popcount(mask);
      if (cnt === 0) return 0;
      if (cnt < bestCount) {
        bestCount = cnt;
        bestMask = mask;
        bestAt = t;
        if (cnt === 1) break;
      }
    }
    if (bestAt !== k) {
      const tmp = empties[k]!;
      empties[k] = empties[bestAt]!;
      empties[bestAt] = tmp;
    }
    const i = empties[k]!;
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    let found = 0;
    for (let n = 1; n <= 6; n++) {
      const bit = 1 << n;
      if ((bestMask & bit) === 0) continue;
      rowMask[r] = (rowMask[r]! | bit) as number;
      colMask[c] = (colMask[c]! | bit) as number;
      boxMask[b] = (boxMask[b]! | bit) as number;
      found += search(k + 1);
      rowMask[r] = (rowMask[r]! ^ bit) as number;
      colMask[c] = (colMask[c]! ^ bit) as number;
      boxMask[b] = (boxMask[b]! ^ bit) as number;
      if (found >= limit) return found;
    }
    return found;
  }

  return search(0);
}

export function isValidNumberGrid(nums: readonly number[]): boolean {
  if (nums.length !== CELLS) return false;
  for (const unit of [ROWS, COLS, BOXES]) {
    for (const cells of unit) {
      const seen = new Set<number>();
      for (const i of cells) {
        const n = nums[i] ?? 0;
        if (n < 1 || n > 6 || seen.has(n)) return false;
        seen.add(n);
      }
    }
  }
  return true;
}

/** Randomized fill. Returns null only if the search somehow fails (it shouldn't). */
export function generateNumberGrid(rng: Rng): number[] | null {
  const grid = new Uint8Array(CELLS);
  const rowMask = new Uint8Array(SIZE);
  const colMask = new Uint8Array(SIZE);
  const boxMask = new Uint8Array(6);

  function bt(i: number): boolean {
    if (i === CELLS) return true;
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    const used = rowMask[r]! | colMask[c]! | boxMask[b]!;
    const nums = rng.shuffle([1, 2, 3, 4, 5, 6]);
    for (const n of nums) {
      const bit = 1 << n;
      if (used & bit) continue;
      grid[i] = n;
      rowMask[r] = (rowMask[r]! | bit) as number;
      colMask[c] = (colMask[c]! | bit) as number;
      boxMask[b] = (boxMask[b]! | bit) as number;
      if (bt(i + 1)) return true;
      rowMask[r] = (rowMask[r]! ^ bit) as number;
      colMask[c] = (colMask[c]! ^ bit) as number;
      boxMask[b] = (boxMask[b]! ^ bit) as number;
      grid[i] = 0;
    }
    return false;
  }

  if (!bt(0)) return null;
  return Array.from(grid);
}
