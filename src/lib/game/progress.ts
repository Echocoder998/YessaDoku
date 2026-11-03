import type { GameMode, PlayerCell, Puzzle } from "./types";
import { loadJSON, saveJSON } from "../storage";
import { cloneCell } from "./view";

const KEY = "ccs.progress";

export interface HistEntry {
  index: number;
  before: PlayerCell;
}

export type PlayPhase = "play" | "won" | "study-end";

export interface SavedGame {
  version: 1;
  mode: GameMode;
  difficulty: Puzzle["difficulty"];
  dateKey: string | null;
  puzzle: Puzzle;
  player: PlayerCell[];
  history: HistEntry[];
  draw2Left: number;
  reverseLeft: number;
  moveCount: number;
  elapsedMs: number;
  studyRemainingMs: number | null;
  phase: PlayPhase;
  winMessage: string;
  recorded: boolean;
  notesMode: boolean;
}

interface ProgressFile {
  version: 1;
  daily?: SavedGame;
  free?: SavedGame;
  study?: SavedGame;
}

function cellOk(value: unknown): value is PlayerCell {
  if (!value || typeof value !== "object") return false;
  const cell = value as PlayerCell;
  return Array.isArray(cell.notes) && typeof cell.locked === "boolean";
}

export function isSavedGame(value: unknown): value is SavedGame {
  if (!value || typeof value !== "object") return false;
  const saved = value as SavedGame;
  return (
    saved.version === 1 &&
    !!saved.puzzle &&
    Array.isArray(saved.puzzle.cells) &&
    saved.puzzle.cells.length === 36 &&
    Array.isArray(saved.player) &&
    saved.player.length === 36 &&
    saved.player.every(cellOk)
  );
}

function readFile(): ProgressFile {
  const raw = loadJSON<ProgressFile>(KEY);
  if (!raw || raw.version !== 1) return { version: 1 };
  return raw;
}

export function loadSlot(mode: GameMode): SavedGame | null {
  const file = readFile();
  const slot = file[mode];
  if (!isSavedGame(slot)) return null;
  const history = Array.isArray(slot.history)
    ? slot.history.filter(
        (entry) => entry && cellOk(entry.before) && typeof entry.index === "number" && entry.index >= 0 && entry.index < 36,
      )
    : [];
  return { ...slot, history };
}

export function saveSlot(saved: SavedGame): void {
  const file = readFile();
  const player = saved.player.map(cloneCell);
  const history = saved.history
    .filter((entry) => entry && cellOk(entry.before) && entry.index >= 0 && entry.index < 36)
    .map((entry) => ({ index: entry.index, before: cloneCell(entry.before) }));
  file[saved.mode] = { ...saved, version: 1, player, history };
  saveJSON(KEY, file);
}

export function clearSlot(mode: GameMode): void {
  const file = readFile();
  delete file[mode];
  saveJSON(KEY, file);
}
