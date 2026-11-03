import type { PlayerCell, Puzzle } from "./types";
import type { RuleCell } from "./validator";

export function cloneCell(cell: PlayerCell): PlayerCell {
  return {
    number: cell.number,
    color: cell.color,
    notes: cell.notes.slice(),
    locked: cell.locked,
  };
}

export function initialPlayer(puzzle: Puzzle): PlayerCell[] {
  return puzzle.cells.map((cell) =>
    cell.kind === "given"
      ? { number: cell.solutionNumber, color: cell.solutionColor, notes: [], locked: true }
      : { number: null, color: null, notes: [], locked: false },
  );
}

export function toRuleCells(puzzle: Puzzle, player: readonly PlayerCell[]): RuleCell[] {
  return player.map((cell, i) => {
    const spec = puzzle.cells[i];
    return {
      number: cell?.number ?? null,
      color: cell?.color ?? null,
      wild: spec?.kind === "wild",
      clueColor: spec?.kind === "clue" ? spec.solutionColor : null,
    };
  });
}
