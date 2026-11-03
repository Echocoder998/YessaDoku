import { describe, expect, it } from "vitest";
import { generatePuzzle } from "./generator";
import type { Puzzle } from "./types";
import {
  conflictIndexSet,
  findViolations,
  isSolved,
  type RuleCell,
} from "./validator";

function blank(): RuleCell[] {
  return Array.from({ length: 36 }, () => ({
    number: null,
    color: null,
    wild: false,
    clueColor: null,
  }));
}

function typesOf(cells: RuleCell[]): string[] {
  return findViolations(cells).map((v) => v.type);
}

function fromSolution(puzzle: Puzzle, filled: boolean): RuleCell[] {
  return puzzle.cells.map((c) => ({
    number: filled || c.kind === "given" ? c.solutionNumber : null,
    color: filled || c.kind === "given" ? c.solutionColor : null,
    wild: c.kind === "wild",
    clueColor: c.kind === "clue" ? c.solutionColor : null,
  }));
}

describe("validator", () => {
  it("catches a repeated number in a row, column, and box", () => {
    const row = blank();
    row[0]!.number = 3;
    row[4]!.number = 3;
    expect(typesOf(row)).toContain("number-row");

    const col = blank();
    col[1]!.number = 2;
    col[1 + 18]!.number = 2;
    expect(typesOf(col)).toContain("number-col");

    const box = blank();
    box[0]!.number = 5;
    box[7]!.number = 5;
    expect(typesOf(box)).toContain("number-box");
    expect(typesOf(box)).not.toContain("number-row");
    expect(typesOf(box)).not.toContain("number-col");
  });

  it("catches orthogonally adjacent cards that share a color", () => {
    const cells = blank();
    cells[0]!.color = "red";
    cells[1]!.color = "red";
    expect(typesOf(cells)).toContain("adjacent-color");
  });

  it("does not treat a wild as a color, even beside matching neighbors", () => {
    const cells = blank();
    cells[0]!.color = "blue";
    cells[1]!.wild = true;
    cells[2]!.color = "blue";
    expect(findViolations(cells)).toEqual([]);
  });

  it("catches a box with more than two cards of one color", () => {
    const cells = blank();
    // Ends of the top slice plus the diagonal center: three reds, none orthogonal.
    cells[0]!.color = "red";
    cells[2]!.color = "red";
    cells[7]!.color = "red";
    expect(typesOf(cells)).toContain("box-color-cap");
    expect(typesOf(cells)).not.toContain("adjacent-color");
  });

  it("catches a finished row or column that misses a color", () => {
    const row = blank();
    const stripe = ["red", "yellow", "red", "yellow", "red", "yellow"] as const;
    stripe.forEach((color, i) => {
      row[i]!.color = color;
    });
    expect(typesOf(row)).toContain("row-palette");

    const col = blank();
    for (let r = 0; r < 6; r++) col[r * 6]!.color = r % 2 === 0 ? "green" : "blue";
    expect(typesOf(col)).toContain("col-palette");
  });

  it("does not flag a palette miss while the row is still open", () => {
    const cells = blank();
    cells[0]!.color = "red";
    cells[1]!.color = "yellow";
    expect(typesOf(cells)).not.toContain("row-palette");
  });

  it("catches a clue played in the wrong color and a wild that was given a color", () => {
    const cells = blank();
    cells[4]!.clueColor = "yellow";
    cells[4]!.color = "blue";
    cells[5]!.wild = true;
    cells[5]!.color = "red";
    const types = typesOf(cells);
    expect(types).toContain("clue-color");
    expect(types).toContain("wild-color");
  });

  it("accepts a generated solution and rejects each broken rule on it", () => {
    const puzzle = generatePuzzle(9, "easy");
    const solved = fromSolution(puzzle, true);
    expect(isSolved(solved)).toBe(true);
    expect(findViolations(fromSolution(puzzle, false))).toEqual([]);

    const dup = solved.map((c) => ({ ...c }));
    dup[1]!.number = dup[0]!.number;
    expect(isSolved(dup)).toBe(false);
    expect(typesOf(dup)).toContain("number-row");

    const touch = solved.map((c) => ({ ...c }));
    const host = touch.findIndex((c, i) => !c.wild && i % 6 < 5 && !touch[i + 1]!.wild);
    expect(host).toBeGreaterThan(-1);
    touch[host + 1]!.color = touch[host]!.color;
    expect(typesOf(touch)).toContain("adjacent-color");

    const capped = solved.map((c) => ({ ...c, clueColor: null }));
    const boxCells = [0, 1, 2, 6, 7, 8].filter((i) => !capped[i]!.wild);
    expect(boxCells.length).toBeGreaterThan(2);
    for (const i of boxCells) capped[i]!.color = "red";
    // Separating neighbors may still be adjacent reds; either violation is a failed rule.
    expect(isSolved(capped)).toBe(false);
    const failed = typesOf(capped);
    expect(failed.includes("box-color-cap") || failed.includes("adjacent-color")).toBe(true);

    const pale = solved.map((c) => ({ ...c }));
    for (let i = 0; i < 6; i++) {
      if (!pale[i]!.wild) pale[i]!.color = i % 2 === 0 ? "red" : "yellow";
    }
    expect(typesOf(pale)).toContain("row-palette");

    expect(conflictIndexSet(findViolations(pale)).size).toBeGreaterThan(0);
  });
});
