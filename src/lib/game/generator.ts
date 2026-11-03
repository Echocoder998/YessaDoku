import { assignColors } from "./colors";
import { CELLS, boxOf } from "./grid";
import { mixSeed, Rng } from "./rng";
import { countSolutions, generateNumberGrid, isValidNumberGrid } from "./solver";
import type { CellKind, Difficulty, Puzzle, PuzzleCell } from "./types";

const SPEC = {
  easy: { givens: 18, slack: 2, clues: 8, wildMin: 1, wildMax: 1, draw2: 2 },
  medium: { givens: 14, slack: 2, clues: 5, wildMin: 1, wildMax: 2, draw2: 1 },
  hard: { givens: 11, slack: 2, clues: 2, wildMin: 2, wildMax: 2, draw2: 0 },
} as const;

function clueNumbers(numbers: readonly number[], given: readonly boolean[]): number[] {
  const grid = new Array<number>(CELLS);
  for (let i = 0; i < CELLS; i++) grid[i] = given[i] ? (numbers[i] ?? 0) : 0;
  return grid;
}

/**
 * Remove numbers while the number solution stays unique.
 * Stops at the target. If a pass gets stuck just above the target, that's ok
 * within slack; otherwise the caller retries with a fresh grid.
 */
function digNumbers(
  numbers: readonly number[],
  wilds: readonly boolean[],
  rng: Rng,
  target: number,
  slack: number,
): boolean[] | null {
  const given = wilds.map((w) => !w);
  let count = 0;
  for (const g of given) if (g) count++;

  for (let pass = 0; pass < 6 && count > target; pass++) {
    const order = rng.shuffle(
      given.map((_, i) => i).filter((i) => given[i]),
    );
    let removed = false;
    for (const i of order) {
      if (count <= target) break;
      given[i] = false;
      if (countSolutions(clueNumbers(numbers, given), 2) === 1) {
        count--;
        removed = true;
      } else {
        given[i] = true;
      }
    }
    if (!removed) break;
  }

  if (count > target + slack) return null;
  return given;
}

function pickSpread(candidates: readonly number[], k: number, rng: Rng): number[] {
  if (k <= 0 || candidates.length === 0) return [];
  const shuffled = rng.shuffle(candidates);
  const picked: number[] = [];
  const used = new Set<number>();
  for (const i of shuffled) {
    if (picked.length >= k) break;
    const b = boxOf(i);
    if (used.has(b)) continue;
    used.add(b);
    picked.push(i);
  }
  if (picked.length < k) {
    for (const i of shuffled) {
      if (picked.length >= k) break;
      if (!picked.includes(i)) picked.push(i);
    }
  }
  return picked;
}

function tryOnce(rng: Rng, difficulty: Difficulty): Omit<Puzzle, "seed"> | null {
  const spec = SPEC[difficulty];
  const numbers = generateNumberGrid(rng);
  if (!numbers || !isValidNumberGrid(numbers)) return null;

  const wildCount = spec.wildMin + rng.int(spec.wildMax - spec.wildMin + 1);
  const wilds = new Array<boolean>(CELLS).fill(false);
  for (const i of rng.shuffle([...Array(CELLS).keys()]).slice(0, wildCount)) wilds[i] = true;

  const colors = assignColors(wilds, rng);
  if (!colors) return null;

  const given = digNumbers(numbers, wilds, rng, spec.givens, spec.slack);
  if (!given) return null;

  const removed: number[] = [];
  for (let i = 0; i < CELLS; i++) if (!wilds[i] && !given[i]) removed.push(i);
  const clueSet = new Set(pickSpread(removed, Math.min(spec.clues, removed.length), rng));

  const cells: PuzzleCell[] = numbers.map((n, i) => {
    const wild = wilds[i] === true;
    let kind: CellKind;
    if (wild) kind = "wild";
    else if (given[i]) kind = "given";
    else if (clueSet.has(i)) kind = "clue";
    else kind = "empty";
    return {
      solutionNumber: n,
      solutionColor: wild ? null : (colors[i] ?? null),
      kind,
    };
  });

  return {
    difficulty,
    cells,
    draw2Max: spec.draw2,
    reverseMax: 2,
  };
}

/**
 * Deterministic puzzle. Attempts up to 50 times on this seed, then bumps the
 * seed and tries again. The value returned for a given seed never changes,
 * because every retry is itself seeded.
 */
export function generatePuzzle(seed: number, difficulty: Difficulty): Puzzle {
  const base = seed >>> 0 || 1;
  for (let bump = 0; bump < 40; bump++) {
    const s = (base + bump) >>> 0 || 1;
    for (let attempt = 0; attempt < 50; attempt++) {
      const made = tryOnce(new Rng(mixSeed(s, attempt + 1)), difficulty);
      if (made) return { ...made, seed: base };
    }
  }
  throw new Error("Could not generate a YessaDoku puzzle");
}

export function givenCount(puzzle: Puzzle): number {
  return puzzle.cells.filter((c) => c.kind === "given").length;
}

export function clueCount(puzzle: Puzzle): number {
  return puzzle.cells.filter((c) => c.kind === "clue").length;
}

export function wildCount(puzzle: Puzzle): number {
  return puzzle.cells.filter((c) => c.kind === "wild").length;
}
