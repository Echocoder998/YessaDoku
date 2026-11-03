import { describe, expect, it } from "vitest";
import { colorGridError, latinColoring } from "./colors";
import { clueCount, generatePuzzle, givenCount, wildCount } from "./generator";
import { countSolutions, isValidNumberGrid } from "./solver";
import type { Difficulty } from "./types";

const RANGES: Record<Difficulty, [number, number]> = {
  easy: [18, 20],
  medium: [14, 16],
  hard: [11, 13],
};

describe("generator", () => {
  it("accepts every shift of the Latin coloring", () => {
    for (const flip of [false, true]) {
      for (let shift = 0; shift < 4; shift++) {
        expect(colorGridError(latinColoring(shift, flip))).toBeNull();
      }
    }
  });

  it("deals a unique number solution whose colors already obey the rules", () => {
    const difficulties: Difficulty[] = ["easy", "medium", "hard"];
    for (const difficulty of difficulties) {
      for (const seed of [1, 2, 7, 42]) {
        const started = performance.now();
        const puzzle = generatePuzzle(seed, difficulty);
        const elapsed = performance.now() - started;
        expect(elapsed).toBeLessThan(1000);

        expect(puzzle.seed).toBe(seed);
        expect(puzzle.difficulty).toBe(difficulty);
        expect(generatePuzzle(seed, difficulty)).toEqual(puzzle);

        const numbers = puzzle.cells.map((c) => c.solutionNumber);
        expect(isValidNumberGrid(numbers)).toBe(true);

        const clues = puzzle.cells.map((c) => (c.kind === "given" ? c.solutionNumber : 0));
        expect(countSolutions(clues, 2)).toBe(1);

        const colors = puzzle.cells.map((c) => c.solutionColor);
        expect(colorGridError(colors)).toBeNull();

        const givens = givenCount(puzzle);
        expect(givens).toBeGreaterThanOrEqual(RANGES[difficulty][0]);
        expect(givens).toBeLessThanOrEqual(RANGES[difficulty][1]);

        if (difficulty === "easy") {
          expect(wildCount(puzzle)).toBe(1);
          expect(clueCount(puzzle)).toBe(8);
          expect(puzzle.draw2Max).toBe(2);
        } else if (difficulty === "medium") {
          expect(wildCount(puzzle)).toBeGreaterThanOrEqual(1);
          expect(wildCount(puzzle)).toBeLessThanOrEqual(2);
          expect(clueCount(puzzle)).toBe(5);
          expect(puzzle.draw2Max).toBe(1);
        } else {
          expect(wildCount(puzzle)).toBe(2);
          expect(clueCount(puzzle)).toBe(2);
          expect(puzzle.draw2Max).toBe(0);
        }
        expect(puzzle.reverseMax).toBe(2);

        for (const cell of puzzle.cells) {
          if (cell.kind === "wild") {
            expect(cell.solutionColor).toBeNull();
          } else {
            expect(cell.solutionColor).not.toBeNull();
          }
          if (cell.kind === "clue" || cell.kind === "given") {
            expect(cell.solutionColor).not.toBeNull();
          }
        }
      }
    }
  });
});
