import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatClock } from "@/lib/dates";
import { COLORS } from "@/lib/game/types";

export function WinOverlay({
  message,
  elapsedMs,
  moves,
  footer,
  primary,
  onPrimary,
  secondary,
  onSecondary,
}: {
  message: string;
  elapsedMs: number;
  moves: number;
  footer?: string;
  primary: string;
  onPrimary: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  const reduce = useReducedMotion();
  const [bits] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.35,
      duration: 1.6 + Math.random() * 1.1,
      color: COLORS[i % COLORS.length] ?? "red",
      spin: Math.random() * 80 - 40,
    })),
  );

  const tone: Record<string, string> = {
    red: "bg-uno-red",
    yellow: "bg-uno-yellow",
    green: "bg-uno-green",
    blue: "bg-uno-blue",
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4">
      {reduce
        ? null
        : bits.map((bit) => (
            <motion.span
              key={bit.id}
              aria-hidden
              className={`pointer-events-none absolute top-0 h-3 w-2 rounded-sm ${tone[bit.color]}`}
              style={{ left: `${bit.left}%` }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{ y: "100vh", opacity: 0.2, rotate: bit.spin }}
              transition={{ duration: bit.duration, delay: bit.delay, ease: "easeIn" }}
            />
          ))}
      <motion.div
        role="dialog"
        aria-labelledby="win-title"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
        className="relative w-full max-w-sm rounded-3xl bg-card p-6 text-center text-ink"
      >
        <motion.div
          initial={reduce ? undefined : { scale: 1.6, rotate: -16, opacity: 0 }}
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.28 }}
          className="mx-auto mb-4 w-fit rounded-2xl border-4 border-uno-red px-4 py-1 font-display text-5xl font-bold tracking-wide text-uno-red"
        >
          UNO!
        </motion.div>
        <h2 id="win-title" className="font-display text-2xl font-semibold">
          {message}
        </h2>
        <p className="mt-3 text-ink-soft">
          {formatClock(elapsedMs)} · {moves} {moves === 1 ? "move" : "moves"}
        </p>
        {footer ? <p className="mt-3 text-sm text-ink-soft">{footer}</p> : null}
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" onClick={onPrimary} className="h-12 rounded-2xl bg-accent font-semibold text-accent-ink active:scale-[0.96]">
            {primary}
          </button>
          {secondary && onSecondary ? (
            <button type="button" onClick={onSecondary} className="h-12 rounded-2xl border border-line bg-well font-semibold active:scale-[0.96]">
              {secondary}
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

export function StudyEnd({ onHome }: { onHome: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/45 p-4">
      <div role="dialog" aria-labelledby="study-end-title" className="w-full max-w-sm rounded-3xl bg-card p-6 text-center text-ink">
        <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">Time</p>
        <h2 id="study-end-title" className="mt-2 font-display text-3xl leading-tight font-semibold">
          Back to studying, you've got this!
        </h2>
        <p className="mt-3 text-ink-soft">Close the deck. Your notes are right where you left them.</p>
        <button type="button" onClick={onHome} className="mt-5 h-12 w-full rounded-2xl bg-table font-semibold text-cream active:scale-[0.96]">
          Back to the books
        </button>
      </div>
    </div>
  );
}
