import { describe, expect, it } from "vitest";
import { BOXES } from "./grid";
import { Rng } from "./rng";
import { countSolutions, generateNumberGrid, isValidNumberGrid } from "./solver";

describe("number solver", () => {
  it("uses six 2×3 boxes", () => {
    expect(BOXES[0]).toEqual([0, 1, 2, 6, 7, 8]);
    expect(BOXES[1]).toEqual([3, 4, 5, 9, 10, 11]);
    expect(BOXES[2]).toEqual([12, 13, 14, 18, 19, 20]);
    expect(BOXES[5]).toEqual([27, 28, 29, 33, 34, 35]);
  });

  it("rejects a row that already repeats a number", () => {
    const clues = new Array(36).fill(0);
    clues[0] = 1;
    clues[1] = 1;
    expect(countSolutions(clues, 2)).toBe(0);
  });

  it("rejects a box that already repeats a number", () => {
    const clues = new Array(36).fill(0);
    clues[0] = 4;
    clues[7] = 4;
    expect(countSolutions(clues, 2)).toBe(0);
  });

  it("treats an empty grid as non-unique", () => {
    expect(countSolutions(new Array(36).fill(0), 2)).toBe(2);
  });

  it("fills a valid grid with exactly one solution", () => {
    const grid = generateNumberGrid(new Rng(3));
    expect(grid).not.toBeNull();
    expect(isValidNumberGrid(grid!)).toBe(true);
    expect(countSolutions(grid!, 2)).toBe(1);
  });

  it("keeps a unique solution after one cell is cleared", () => {
    const grid = generateNumberGrid(new Rng(5))!;
    const clues = grid.slice();
    clues[0] = 0;
    expect(countSolutions(clues, 2)).toBe(1);
  });

  it("reports a second solution once a necessary clue is removed", () => {
    const grid = generateNumberGrid(new Rng(4))!;
    const clues = grid.slice();
    for (let i = 0; i < 36; i++) {
      const prev = clues[i]!;
      clues[i] = 0;
      if (countSolutions(clues, 2) !== 1) clues[i] = prev;
    }
    const keep = clues.findIndex((n) => n !== 0);
    expect(keep).toBeGreaterThan(-1);
    const loosened = clues.slice();
    loosened[keep] = 0;
    expect(countSolutions(loosened, 2)).toBe(2);
  });

  it("is deterministic for a seed", () => {
    const a = generateNumberGrid(new Rng(21));
    const b = generateNumberGrid(new Rng(21));
    expect(a).toEqual(b);
  });
});
