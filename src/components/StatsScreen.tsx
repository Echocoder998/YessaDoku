import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { dateKey, formatClock } from "@/lib/dates";
import type { Difficulty } from "@/lib/game/types";
import { currentStreak, loadStats, type Stats } from "@/lib/stats";

const LEVELS: Difficulty[] = ["easy", "medium", "hard"];

export function StatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  const view = stats ?? {
    solved: { easy: 0, medium: 0, hard: 0 },
    bestMs: { easy: null, medium: null, hard: null },
    totalSolved: 0,
    streak: 0,
    longestStreak: 0,
    lastDailySolved: null,
    version: 1 as const,
  };
  const streak = currentStreak(view, dateKey());

  return (
    <main className="min-h-dvh bg-felt text-ink">
      <div className="mx-auto min-h-dvh max-w-md px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-8">
        <header className="flex items-center gap-2 py-2">
          <Link to="/" aria-label="Home" className="flex h-11 w-11 items-center justify-center rounded-full bg-card">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-3xl font-semibold">Your table</h1>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-table p-4 text-cream">
            <p className="text-sm opacity-80">Daily streak</p>
            <p className="font-display text-4xl font-semibold">{streak}</p>
          </div>
          <div className="rounded-3xl border border-line bg-card p-4">
            <p className="text-sm text-ink-soft">Longest streak</p>
            <p className="font-display text-4xl font-semibold">{view.longestStreak}</p>
          </div>
        </section>

        <p className="mt-6 text-sm text-ink-soft">{view.totalSolved} puzzles cleared</p>
        <ul className="mt-2 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
          {LEVELS.map((level) => (
            <li key={level} className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="font-semibold capitalize">{level}</p>
                <p className="text-sm text-ink-soft">{view.solved[level]} solved</p>
              </div>
              <p className="font-display text-xl font-semibold">
                {view.bestMs[level] == null ? "—" : formatClock(view.bestMs[level]!)}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-soft">Daily games count as medium. Study break counts as easy, if you finish it.</p>
      </div>
    </main>
  );
}
