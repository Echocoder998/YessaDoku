import { describe, expect, it } from "vitest";
import { GUIDE, tutorialPuzzle } from "./tutorial";
import { findViolations, isSolved } from "./validator";
import { initialPlayer, toRuleCells } from "./view";

describe("tutorial table", () => {
  it("starts legal and solves on the scripted cards", () => {
    const start = toRuleCells(tutorialPuzzle, initialPlayer(tutorialPuzzle));
    expect(findViolations(start)).toEqual([]);

    const player = initialPlayer(tutorialPuzzle);
    for (const beat of GUIDE) {
      const action = beat.action;
      if (!action) continue;
      const spec = tutorialPuzzle.cells[action.cell];
      expect(spec).toBeTruthy();
      if (action.type === "number") expect(action.n).toBe(spec?.solutionNumber);
      if (action.type === "color") expect(action.color).toBe(spec?.solutionColor);
      if (action.type === "number") {
        const cell = player[action.cell];
        if (cell) cell.number = action.n;
      }
      if (action.type === "color") {
        const cell = player[action.cell];
        if (cell) cell.color = action.color;
      }
    }

    expect(isSolved(toRuleCells(tutorialPuzzle, player))).toBe(true);
  });
});
