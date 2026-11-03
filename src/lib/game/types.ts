export const COLORS = ["red", "yellow", "green", "blue"] as const;
export type ColorName = (typeof COLORS)[number];

export type Difficulty = "easy" | "medium" | "hard";
export type GameMode = "daily" | "free" | "study";
export type CellKind = "given" | "clue" | "wild" | "empty";

export interface PuzzleCell {
  solutionNumber: number;
  /** Null only on wild cells. Draw 2 reads this for every other cell. */
  solutionColor: ColorName | null;
  kind: CellKind;
}

export interface Puzzle {
  /** The seed passed to generatePuzzle. Same seed + difficulty ⇒ same puzzle. */
  seed: number;
  difficulty: Difficulty;
  cells: PuzzleCell[];
  draw2Max: number;
  reverseMax: number;
}

export interface PlayerCell {
  number: number | null;
  color: ColorName | null;
  notes: number[];
  locked: boolean;
}
