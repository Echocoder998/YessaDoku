import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Eraser, HelpCircle, Pencil, RotateCcw, Settings, Undo2 } from "lucide-react";
import { personal } from "@/config/personal";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/dates";
import { clearSlot } from "@/lib/game/progress";
import type { ColorName, Difficulty, GameMode } from "@/lib/game/types";
import { COLORS } from "@/lib/game/types";
import { Board } from "./Board";
import { ColorMark, colorLabel } from "./CardFace";
import { SettingsSheet } from "./SettingsSheet";
import { useSettings } from "./settings";
import { Tutorial } from "./Tutorial";
import { useSession } from "./use-session";
import { StudyEnd, WinOverlay } from "./WinOverlay";

const COLOR_BG: Record<ColorName, string> = {
  red: "bg-uno-red",
  yellow: "bg-uno-yellow",
  green: "bg-uno-green",
  blue: "bg-uno-blue",
};

export function PlayScreen({ mode, difficulty, fresh }: { mode: GameMode; difficulty: Difficulty; fresh: boolean }) {
  const { settings, update, ready: settingsReady } = useSettings();
  const session = useSession(mode, difficulty, fresh, settings.conflicts);
  const navigate = useNavigate();
  useEffect(() => {
    if (!fresh) return;
    void navigate({
      to: "/play",
      search: { mode, difficulty, fresh: false },
      replace: true,
    });
  }, [difficulty, fresh, mode, navigate]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  useEffect(() => {
    if (!settingsReady || settings.tutorialSeen) return;
    setTutorialOpen(true);
  }, [settingsReady, settings.tutorialSeen]);

  const title = mode === "daily" ? "Daily table" : mode === "study" ? "Study break" : `${cap(session.puzzle?.difficulty ?? difficulty)} table`;
  const spec = session.selected != null ? session.puzzle?.cells[session.selected] : null;
  const selectedCell = session.selected != null ? session.player[session.selected] : null;
  const locked = selectedCell?.locked ?? false;
  const wild = spec?.kind === "wild";
  const clue = spec?.kind === "clue" ? spec.solutionColor : null;

  function closeTutorial() {
    setTutorialOpen(false);
    if (!settings.tutorialSeen) update({ tutorialSeen: true });
  }

  function goHome() {
    if (session.phase === "study-end") clearSlot("study");
    void navigate({ to: "/" });
  }

  return (
    <main className="min-h-dvh bg-felt text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <header className="sticky top-0 z-20 flex items-center gap-2 bg-felt/95 py-2 backdrop-blur">
          <Link to="/" aria-label="Home" className="flex h-11 w-11 items-center justify-center rounded-full bg-card active:scale-[0.96]">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold">{title}</h1>
            <p className="text-sm text-ink-soft">
              {mode === "study" ? formatClock(session.studyLeftMs) : formatClock(session.elapsedMs)}
              <span> · {session.moveCount} moves</span>
            </p>
          </div>
          <button type="button" aria-label="How to play" onClick={() => setTutorialOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-card active:scale-[0.96]">
            <HelpCircle className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Settings" onClick={() => setSettingsOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-card active:scale-[0.96]">
            <Settings className="h-5 w-5" />
          </button>
        </header>

        <div className="py-2">
          {!session.ready || !session.puzzle ? (
            <div className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-line text-ink-soft">
              {session.failed ? "The deck jammed." : "Shuffling the deck…"}
            </div>
          ) : (
            <Board
              puzzle={session.puzzle}
              player={session.player}
              selected={session.selected}
              draftNumber={session.draftNumber}
              draftColor={session.draftColor}
              violations={session.violations}
              colorblind={settings.colorblind}
              onSelect={session.select}
            />
          )}
        </div>

        <p className="min-h-6 text-center text-sm text-ink-soft">
          {session.failed
            ? "Try another shuffle."
            : session.notesMode
              ? "Notes on. Tap a number to pencil it in."
              : locked
                ? "That card is already on the table."
                : wild
                  ? "Wild card. It only wants a number."
                  : clue
                    ? `This seat only takes ${clue}.`
                    : session.selected == null
                      ? "Tap a seat, then a number and a color."
                      : "Number and color. Either can change later."}
        </p>

        <div className="sticky bottom-0 mt-auto space-y-2 bg-felt/95 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="grid grid-cols-4 gap-2">
            <ToolButton
              label="Draw 2"
              detail={`${session.draw2Left}`}
              disabled={session.phase !== "play" || session.draw2Left <= 0}
              onClick={session.draw2}
            />
            <ToolButton
              label="Reverse"
              detail={`${session.reverseLeft}`}
              disabled={session.phase !== "play" || session.reverseLeft <= 0}
              onClick={session.reverse}
              icon={<RotateCcw className="h-4 w-4" />}
            />
            <ToolButton label="Undo" disabled={session.phase !== "play"} onClick={session.undo} icon={<Undo2 className="h-4 w-4" />} />
            <ToolButton label="Erase" disabled={session.phase !== "play" || locked} onClick={session.erase} icon={<Eraser className="h-4 w-4" />} />
          </div>

          <button
            type="button"
            aria-pressed={session.notesMode}
            onClick={session.toggleNotes}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-2xl border font-semibold active:scale-[0.96]",
              session.notesMode ? "border-ink bg-ink text-felt" : "border-line bg-card",
            )}
          >
            <Pencil className="h-4 w-4" />
            Notes
          </button>

          <div className="grid grid-cols-6 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const on = selectedCell?.number === n || session.draftNumber === n;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={session.phase !== "play" || locked || session.selected == null}
                  onClick={() => session.pickNumber(n)}
                  className={cn(
                    "h-12 rounded-xl text-lg font-extrabold active:scale-[0.96] disabled:opacity-40",
                    on ? "bg-ink text-felt" : "bg-card",
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((color) => {
              const blocked = wild || (clue != null && clue !== color) || session.notesMode;
              const on = selectedCell?.color === color || session.draftColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  aria-label={colorLabel(color)}
                  disabled={session.phase !== "play" || locked || session.selected == null || blocked}
                  onClick={() => session.pickColor(color)}
                  className={cn(
                    "flex h-12 items-center justify-center gap-1 rounded-full border-2 active:scale-[0.96] disabled:opacity-35",
                    COLOR_BG[color],
                    on ? "border-ink" : "border-transparent",
                  )}
                >
                  {settings.colorblind ? <ColorMark color={color} className="h-4 w-4 text-white" /> : null}
                  <span className="sr-only">{color}</span>
                </button>
              );
            })}
          </div>
          {session.failed ? (
            <button type="button" onClick={session.retry} className="h-12 w-full rounded-2xl bg-accent font-semibold text-accent-ink">
              Shuffle again
            </button>
          ) : null}
        </div>
      </div>

      {session.phase === "won" ? (
        <WinOverlay
          message={session.winMessage || "UNO!"}
          elapsedMs={session.elapsedMs}
          moves={session.moveCount}
          footer={mode === "study" ? "Back to studying, you've got this!" : `For ${personal.herName}.`}
          primary={mode === "daily" ? "Home" : mode === "study" ? "Back to studying" : "New puzzle"}
          onPrimary={() => {
            if (mode === "free") session.newDeal();
            else goHome();
          }}
          secondary={mode === "free" ? "Home" : undefined}
          onSecondary={mode === "free" ? goHome : undefined}
        />
      ) : null}
      {session.phase === "study-end" ? <StudyEnd onHome={goHome} /> : null}

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onTutorial={() => {
          setSettingsOpen(false);
          setTutorialOpen(true);
        }}
        onGuide={() => {
          setSettingsOpen(false);
          void navigate({ to: "/tutorial" });
        }}
      />
      <Tutorial open={tutorialOpen} onClose={closeTutorial} />
    </main>
  );
}

function ToolButton({
  label,
  detail,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  detail?: string;
  disabled?: boolean;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-14 flex-col items-center justify-center rounded-2xl bg-card text-sm font-semibold active:scale-[0.96] disabled:opacity-40"
    >
      <span className="flex items-center gap-1">
        {icon}
        {label}
      </span>
      {detail != null ? <span className="text-xs text-ink-soft">{detail} left</span> : null}
    </button>
  );
}

function cap(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
