import { colOf, rowOf } from "./grid";
import type { ColorName, Puzzle, PuzzleCell } from "./types";

const NUMBERS = [
  1, 2, 3, 4, 5, 6, 4, 5, 6, 1, 2, 3, 2, 3, 1, 5, 6, 4, 5, 6, 4, 2, 3, 1, 3, 1, 2, 6, 4, 5, 6, 4, 5, 3, 1, 2,
] as const;

const COLOR_CYCLE = ["red", "yellow", "green", "blue"] as const;

/** Seats the player fills, in the order the coach deals them. */
export const TUTORIAL_SEATS = [5, 8, 14, 35, 27] as const;

function colorAt(index: number): ColorName {
  return COLOR_CYCLE[(rowOf(index) + colOf(index)) % 4] ?? "red";
}

function cells(): PuzzleCell[] {
  return NUMBERS.map((n, i) => {
    if (i === 35) return { solutionNumber: n, solutionColor: null, kind: "wild" as const };
    if (i === 8) return { solutionNumber: n, solutionColor: colorAt(i), kind: "clue" as const };
    if (i === 5 || i === 14 || i === 27) return { solutionNumber: n, solutionColor: colorAt(i), kind: "empty" as const };
    return { solutionNumber: n, solutionColor: colorAt(i), kind: "given" as const };
  });
}

/** A tiny, fixed table. Five open cards, then the board is solved. */
export const tutorialPuzzle: Puzzle = {
  seed: 1,
  difficulty: "easy",
  cells: cells(),
  draw2Max: 0,
  reverseMax: 0,
};

export type GuideAction =
  | { type: "select"; cell: number }
  | { type: "number"; cell: number; n: number }
  | { type: "color"; cell: number; color: ColorName };

export interface GuideBeat {
  title: string;
  body: string;
  wrong: string;
  action?: GuideAction;
}

export const GUIDE: GuideBeat[] = [
  {
    title: "Your first table.",
    body: "I'll point. You deal. Five cards, and then UNO.",
    wrong: "",
  },
  {
    title: "Tap the open seat.",
    body: "The top row is almost full. One card is still face-down.",
    wrong: "Top row, last seat. It's glowing.",
    action: { type: "select", cell: 5 },
  },
  {
    title: "The missing number is 6.",
    body: "A row holds 1 through 6 once. 1, 2, 3, 4, and 5 are already here.",
    wrong: "That number is already in this row. The open one is 6.",
    action: { type: "number", cell: 5, n: 6 },
  },
  {
    title: "Yellow, not red.",
    body: "The card on the left is red. Cards that share an edge cannot share a color.",
    wrong: "Neighbors clash. Yellow keeps it off the red.",
    action: { type: "color", cell: 5, color: "yellow" },
  },
  {
    title: "A color clue.",
    body: "See the blue border? That seat can only be blue. Tap it.",
    wrong: "Second row, the seat with the blue border.",
    action: { type: "select", cell: 8 },
  },
  {
    title: "Still a 6.",
    body: "The color is promised. The number is not. This row is missing 6.",
    wrong: "This row already has the other numbers. Deal a 6.",
    action: { type: "number", cell: 8, n: 6 },
  },
  {
    title: "Seal it blue.",
    body: "The border was the promise. Tap blue and the card flips in.",
    wrong: "Only blue belongs on a blue border.",
    action: { type: "color", cell: 8, color: "blue" },
  },
  {
    title: "Don't match the neighbor.",
    body: "Blue is sitting right above this seat. Edges cannot match. Tap the open card under it.",
    wrong: "Third row, under the blue card you just played.",
    action: { type: "select", cell: 14 },
  },
  {
    title: "This seat wants a 1.",
    body: "Look across the row. 1 is the number that isn't there yet.",
    wrong: "The missing number in this row is 1.",
    action: { type: "number", cell: 14, n: 1 },
  },
  {
    title: "Red finishes the row.",
    body: "Green, blue, and yellow are already in this row. It still needs red, and red doesn't touch the blue above.",
    wrong: "Red. The row needs it, and it doesn't clash with the blue.",
    action: { type: "color", cell: 14, color: "red" },
  },
  {
    title: "A wild.",
    body: "The black card opts out of color. It only wants a number. Tap it.",
    wrong: "Bottom corner. The black card.",
    action: { type: "select", cell: 35 },
  },
  {
    title: "Just a 2.",
    body: "No color this time. The row is missing 2.",
    wrong: "Wilds don't take a color. The number is 2.",
    action: { type: "number", cell: 35, n: 2 },
  },
  {
    title: "Last card.",
    body: "One seat left. Same idea: the missing number, then the missing color.",
    wrong: "Fifth row, the open seat.",
    action: { type: "select", cell: 27 },
  },
  {
    title: "The row is missing 6.",
    body: "You don't need me for this one, but here it is.",
    wrong: "6 is the one that isn't in the row yet.",
    action: { type: "number", cell: 27, n: 6 },
  },
  {
    title: "Blue, and that's UNO.",
    body: "This row already has red, yellow, and green. Blue closes it.",
    wrong: "Blue is the color this row still doesn't have.",
    action: { type: "color", cell: 27, color: "blue" },
  },
];
