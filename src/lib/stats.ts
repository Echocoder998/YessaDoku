import { shiftDateKey } from "./dates";
import { loadJSON, saveJSON } from "./storage";
import type { Difficulty, GameMode } from "./game/types";

const KEY = "ccs.stats";

export interface Stats {
  version: 1;
  solved: Record<Difficulty, number>;
  bestMs: Record<Difficulty, number | null>;
  totalSolved: number;
  streak: number;
  longestStreak: number;
  lastDailySolved: string | null;
}

export interface SolveEvent {
  difficulty: Difficulty;
  elapsedMs: number;
  mode: GameMode;
  /** Local date the daily puzzle belonged to. Ignored for other modes. */
  dateKey: string | null;
}

export function emptyStats(): Stats {
  return {
    version: 1,
    solved: { easy: 0, medium: 0, hard: 0 },
    bestMs: { easy: null, medium: null, hard: null },
    totalSolved: 0,
    streak: 0,
    longestStreak: 0,
    lastDailySolved: null,
  };
}

export function currentStreak(stats: Stats, today: string): number {
  if (!stats.lastDailySolved) return 0;
  if (stats.lastDailySolved === today) return stats.streak;
  if (stats.lastDailySolved === shiftDateKey(today, -1)) return stats.streak;
  return 0;
}

export function applySolve(stats: Stats, event: SolveEvent): Stats {
  if (event.mode === "daily" && event.dateKey && stats.lastDailySolved === event.dateKey) {
    return stats;
  }
  const next: Stats = {
    ...stats,
    solved: { ...stats.solved, [event.difficulty]: stats.solved[event.difficulty] + 1 },
    bestMs: { ...stats.bestMs },
    totalSolved: stats.totalSolved + 1,
  };
  const prevBest = stats.bestMs[event.difficulty];
  if (prevBest == null || event.elapsedMs < prevBest) {
    next.bestMs[event.difficulty] = Math.max(0, Math.round(event.elapsedMs));
  }
  if (event.mode === "daily" && event.dateKey) {
    const yesterday = shiftDateKey(event.dateKey, -1);
    const streak = stats.lastDailySolved === yesterday ? stats.streak + 1 : 1;
    next.streak = streak;
    next.longestStreak = Math.max(stats.longestStreak, streak);
    next.lastDailySolved = event.dateKey;
  }
  return next;
}

function normalize(raw: Partial<Stats> | null): Stats {
  const base = emptyStats();
  if (!raw || raw.version !== 1) return base;
  return {
    ...base,
    ...raw,
    solved: { ...base.solved, ...raw.solved },
    bestMs: { ...base.bestMs, ...raw.bestMs },
  };
}

export function loadStats(): Stats {
  return normalize(loadJSON<Stats>(KEY));
}

export function saveStats(stats: Stats): void {
  saveJSON(KEY, stats);
}

export function recordSolve(event: SolveEvent): Stats {
  const next = applySolve(loadStats(), event);
  saveStats(next);
  return next;
}
