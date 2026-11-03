import { BOXES, CELLS, COLS, NEIGHBORS, ROWS, SIZE } from "./grid";
import type { ColorName } from "./types";

export type ViolationType =
  | "number-row"
  | "number-col"
  | "number-box"
  | "adjacent-color"
  | "row-palette"
  | "col-palette"
  | "box-color-cap"
  | "clue-color"
  | "wild-color";

export interface Violation {
  type: ViolationType;
  cells: number[];
}

/** The board as the player sees it, plus the bindings the rules need. */
export interface RuleCell {
  number: number | null;
  color: ColorName | null;
  wild: boolean;
  clueColor: ColorName | null;
}

function numberClashes(
  units: readonly (readonly number[])[],
  cells: readonly RuleCell[],
  type: ViolationType,
): Violation[] {
  const out: Violation[] = [];
  for (const unit of units) {
    const seen = new Map<number, number[]>();
    for (const i of unit) {
      const n = cells[i]?.number;
      if (n == null) continue;
      const list = seen.get(n);
      if (list) list.push(i);
      else seen.set(n, [i]);
    }
    for (const idxs of seen.values()) {
      if (idxs.length > 1) out.push({ type, cells: idxs });
    }
  }
  return out;
}

function paletteIssue(
  units: readonly (readonly number[])[],
  cells: readonly RuleCell[],
  type: ViolationType,
): Violation[] {
  const out: Violation[] = [];
  for (const unit of units) {
    let full = true;
    const present = new Set<ColorName>();
    const colored: number[] = [];
    for (const i of unit) {
      const cell = cells[i];
      if (!cell || cell.wild) continue;
      if (!cell.color) {
        full = false;
        break;
      }
      present.add(cell.color);
      colored.push(i);
    }
    if (full && present.size < 4) out.push({ type, cells: colored });
  }
  return out;
}

/**
 * Live rule check. Palette misses are reported only once a row or column
 * has a color on every non-wild cell — otherwise the player is still dealing.
 * Duplicate numbers, bad neighbors, box caps, clue mismatches, and colored
 * wilds are reported as soon as they exist.
 */
export function findViolations(cells: readonly RuleCell[]): Violation[] {
  if (cells.length !== CELLS) return [{ type: "number-row", cells: [] }];
  const out: Violation[] = [];

  out.push(...numberClashes(ROWS, cells, "number-row"));
  out.push(...numberClashes(COLS, cells, "number-col"));
  out.push(...numberClashes(BOXES, cells, "number-box"));

  for (let i = 0; i < CELLS; i++) {
    const a = cells[i];
    if (!a?.color || a.wild) continue;
    for (const j of NEIGHBORS[i] ?? []) {
      if (j < i) continue;
      const b = cells[j];
      if (!b?.color || b.wild) continue;
      if (a.color === b.color) out.push({ type: "adjacent-color", cells: [i, j] });
    }
  }

  for (let b = 0; b < 6; b++) {
    const buckets = new Map<ColorName, number[]>();
    for (const i of BOXES[b] ?? []) {
      const cell = cells[i];
      if (!cell?.color || cell.wild) continue;
      const list = buckets.get(cell.color);
      if (list) list.push(i);
      else buckets.set(cell.color, [i]);
    }
    for (const idxs of buckets.values()) {
      if (idxs.length > 2) out.push({ type: "box-color-cap", cells: idxs });
    }
  }

  out.push(...paletteIssue(ROWS, cells, "row-palette"));
  out.push(...paletteIssue(COLS, cells, "col-palette"));

  for (let i = 0; i < CELLS; i++) {
    const cell = cells[i];
    if (!cell) continue;
    if (cell.clueColor && cell.color && cell.color !== cell.clueColor) {
      out.push({ type: "clue-color", cells: [i] });
    }
    if (cell.wild && cell.color) out.push({ type: "wild-color", cells: [i] });
  }

  return out;
}

export function conflictIndexSet(violations: readonly Violation[]): Set<number> {
  const set = new Set<number>();
  for (const v of violations) for (const i of v.cells) set.add(i);
  return set;
}

export function isComplete(cells: readonly RuleCell[]): boolean {
  if (cells.length !== CELLS) return false;
  return cells.every((c) => c.number != null && (c.wild || c.color != null));
}

/** Win condition: full board, every rule satisfied. Not "matches the stored colors". */
export function isSolved(cells: readonly RuleCell[]): boolean {
  return isComplete(cells) && findViolations(cells).length === 0;
}

export function emptyRuleCell(): RuleCell {
  return { number: null, color: null, wild: false, clueColor: null };
}

export { SIZE };
