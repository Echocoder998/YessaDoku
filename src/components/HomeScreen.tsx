import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Flame, HelpCircle, Lock, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { personal } from "@/config/personal";
import { cn } from "@/lib/cn";
import { dateKey, formatWhen } from "@/lib/dates";
import type { Difficulty } from "@/lib/game/types";
import { loadSlot } from "@/lib/game/progress";
import { currentStreak, loadStats, type Stats } from "@/lib/stats";
import { CardFace } from "./CardFace";
import { Logo } from "./Logo";
import { SettingsSheet } from "./SettingsSheet";
import { useSettings } from "./settings";
import { Tutorial } from "./Tutorial";

const LEVELS: Difficulty[] = ["easy", "medium", "hard"];

export function HomeScreen() {
  const { settings, update, ready } = useSettings();
  const navigate = useNavigate();
  const [openSettings, setOpenSettings] = useState(false);
  const [openTutorial, setOpenTutorial] = useState(false);
  const [offerGuide, setOfferGuide] = useState(false);
  const [openSecret, setOpenSecret] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [today, setToday] = useState("Today");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [freeLabel, setFreeLabel] = useState<string | null>(null);
  const [studyLabel, setStudyLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || settings.guideOffered) return;
    setOfferGuide(true);
  }, [ready, settings.guideOffered]);

  useEffect(() => {
    const loaded = loadStats();
    setStats(loaded);
    const now = dateKey();
    setToday(formatWhen(now));
    const free = loadSlot("free");
    if (free && free.phase === "play") setFreeLabel(`Resume ${free.difficulty}`);
    const study = loadSlot("study");
    if (study?.phase === "play") setStudyLabel("Resume break");
  }, []);

  const solved = stats?.totalSolved ?? 0;
  const need = personal.secretUnlockAt;
  const unlocked = solved >= need;
  const streak = stats ? currentStreak(stats, dateKey()) : 0;
  const dailyDone = stats?.lastDailySolved === dateKey();

  function startGuide() {
    setOfferGuide(false);
    if (!settings.guideOffered) update({ guideOffered: true });
    void navigate({ to: "/tutorial" });
  }

  function dismissGuide() {
    setOfferGuide(false);
    if (!settings.guideOffered) update({ guideOffered: true });
  }

  function closeTutorial() {
    setOpenTutorial(false);
    if (!settings.tutorialSeen) update({ tutorialSeen: true });
  }

  return (
    <main className="min-h-dvh bg-felt text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <div>
              <p className="font-display text-lg leading-none font-semibold">YessaDoku</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" aria-label="How to play" onClick={() => setOpenTutorial(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-card active:scale-[0.96]">
              <HelpCircle className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Settings" onClick={() => setOpenSettings(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-card active:scale-[0.96]">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6">
          <h1 className="font-display text-5xl leading-none font-semibold tracking-tight">Hi {personal.herName}!</h1>
          <p className="mt-3 max-w-xs text-lg text-ink-soft">Uno in one hand, Sudoku in the other. I shuffled this for you.</p>
          <div className="mt-5 flex items-end gap-2">
            <Fan color="red" n={1} tilt={-12} />
            <Fan color="yellow" n={4} tilt={-2} />
            <Fan color="green" n={2} tilt={8} />
            <Fan color="wild" n={6} tilt={14} />
          </div>
        </motion.section>

        <Link
          to="/tutorial"
          onClick={() => {
            if (!settings.guideOffered) update({ guideOffered: true });
          }}
          className="mt-6 block rounded-3xl bg-accent p-5 text-accent-ink active:scale-[0.96]"
        >
          <p className="text-sm font-semibold tracking-wide uppercase opacity-80">Tutorial</p>
          <p className="mt-1 font-display text-3xl font-semibold">Walk through a game</p>
          <p className="mt-1 text-sm opacity-90">Five cards, dealt with you. Then you know the table.</p>
        </Link>

        <Link
          to="/play"
          search={{ mode: "daily", difficulty: "medium", fresh: false }}
          className="mt-3 block rounded-3xl bg-table p-5 text-cream active:scale-[0.96]"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold tracking-wide uppercase opacity-80">Daily puzzle</p>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Flame className="h-4 w-4" />
              {streak}
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-semibold">{dailyDone ? "You already won today" : "Today's table"}</p>
          <p className="mt-1 text-sm opacity-80">{today} · medium · one a day</p>
        </Link>

        <section className="mt-3 rounded-3xl border border-line bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Free play</h2>
            {freeLabel ? <span className="text-sm text-ink-soft">{freeLabel}</span> : null}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={difficulty === level}
                onClick={() => setDifficulty(level)}
                className={cn(
                  "h-11 rounded-2xl font-semibold capitalize active:scale-[0.96]",
                  difficulty === level ? "bg-ink text-felt" : "bg-well",
                )}
              >
                {level}
              </button>
            ))}
          </div>
          <Link
            to="/play"
            search={{ mode: "free", difficulty, fresh: freeLabel != null && !freeLabel.toLowerCase().includes(difficulty) }}
            className="mt-3 flex h-12 items-center justify-center rounded-2xl bg-accent font-semibold text-accent-ink active:scale-[0.96]"
          >
            {freeLabel?.toLowerCase().includes(difficulty) ? freeLabel : "Deal a puzzle"}
          </Link>
        </section>

        <Link
          to="/play"
          search={{ mode: "study", difficulty: "easy", fresh: studyLabel == null }}
          className="mt-3 flex items-center gap-3 rounded-3xl border border-line bg-card p-4 active:scale-[0.96]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-well">
            <BookOpen className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-2xl font-semibold">{studyLabel ?? "Study break"}</span>
            <span className="text-sm text-ink-soft">Five quiet minutes, then the books again.</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => unlocked && setOpenSecret(true)}
          className="mt-3 rounded-3xl border border-line bg-card p-4 text-left active:scale-[0.96]"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-display text-2xl font-semibold">
              {unlocked ? <Sparkles className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              Secret
            </span>
            <span className="text-sm text-ink-soft">
              {unlocked ? "Open" : `${Math.min(solved, need)} / ${need}`}
            </span>
          </div>
          <span className="mt-3 block h-2 overflow-hidden rounded-full bg-well">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (solved / need) * 100)}%` }} />
          </span>
          <span className="mt-2 block text-sm text-ink-soft">
            {unlocked ? "A note, for when the puzzles started adding up." : "Solve a few puzzles. Something is waiting."}
          </span>
        </button>

        <Link to="/stats" className="mt-4 text-center text-sm font-semibold text-ink-soft underline-offset-4 hover:underline">
          Streaks and best times
        </Link>
      </div>

      {offerGuide ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 text-ink" role="dialog" aria-labelledby="guide-offer">
            <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">First game</p>
            <h2 id="guide-offer" className="mt-1 font-display text-3xl font-semibold">
              Want me to deal one with you?
            </h2>
            <p className="mt-2 text-ink-soft">Five cards. I point at the seat, the number, and the color. Then the table is yours.</p>
            <button type="button" onClick={startGuide} className="mt-5 h-12 w-full rounded-2xl bg-accent font-semibold text-accent-ink">
              Walk me through it
            </button>
            <button type="button" onClick={dismissGuide} className="mt-2 h-12 w-full rounded-2xl bg-well font-semibold">
              Not now
            </button>
          </div>
        </div>
      ) : null}

      {openSecret ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 p-3 sm:items-center" onClick={() => setOpenSecret(false)}>
          <article
            className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 text-ink"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">For you</p>
            <h2 className="mt-1 font-display text-3xl font-semibold">Hi {personal.herName}.</h2>
            {personal.secretPhoto ? (
              <img src={personal.secretPhoto} alt="" className="mt-4 max-h-64 w-full rounded-2xl object-cover" />
            ) : null}
            <p className="mt-4 text-base leading-relaxed whitespace-pre-wrap">{personal.secretMessage}</p>
            <button type="button" onClick={() => setOpenSecret(false)} className="mt-5 h-12 w-full rounded-2xl bg-ink font-semibold text-felt">
              Close
            </button>
          </article>
        </div>
      ) : null}

      <SettingsSheet
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        onTutorial={() => {
          setOpenSettings(false);
          setOpenTutorial(true);
        }}
        onGuide={() => {
          setOpenSettings(false);
          startGuide();
        }}
      />
      <Tutorial open={openTutorial} onClose={closeTutorial} />
    </main>
  );
}

function Fan({ color, n, tilt }: { color: "red" | "yellow" | "green" | "wild"; n: number; tilt: number }) {
  return (
    <div className="h-16 w-12" style={{ transform: `rotate(${tilt}deg)` }}>
      <CardFace color={color === "wild" ? "wild" : color} number={n} />
    </div>
  );
}
