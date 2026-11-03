import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { playError, playFlip, playWin } from "@/lib/audio";
import { cn } from "@/lib/cn";
import { GUIDE, TUTORIAL_SEATS, tutorialPuzzle } from "@/lib/game/tutorial";
import type { ColorName, PlayerCell } from "@/lib/game/types";
import { COLORS } from "@/lib/game/types";
import { isSolved } from "@/lib/game/validator";
import { initialPlayer, toRuleCells } from "@/lib/game/view";
import { Board } from "./Board";
import { ColorMark, colorLabel } from "./CardFace";
import { useSettings } from "./settings";
import { WinOverlay } from "./WinOverlay";

const COLOR_BG: Record<ColorName, string> = {
  red: "bg-uno-red",
  yellow: "bg-uno-yellow",
  green: "bg-uno-green",
  blue: "bg-uno-blue",
};

export function GuidedPlay() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const [player, setPlayer] = useState<PlayerCell[]>(() => initialPlayer(tutorialPuzzle));
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [started] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  const beat = GUIDE[step] ?? GUIDE[0]!;
  const action = beat?.action;
  const spotlight = action?.cell ?? null;

  useEffect(() => {
    if (won) return;
    const id = window.setInterval(() => setElapsed(Date.now() - started), 500);
    return () => window.clearInterval(id);
  }, [started, won]);

  function leave() {
    if (!settings.guideOffered) update({ guideOffered: true });
    void navigate({ to: "/" });
  }

  function celebrate(nextPlayer: PlayerCell[]) {
    if (!isSolved(toRuleCells(tutorialPuzzle, nextPlayer))) return;
    setWon(true);
    playWin();
    update({ guideOffered: true, tutorialSeen: true });
  }

  function advance(nextPlayer: PlayerCell[]) {
    const next = step + 1;
    setNudge(null);
    if (next >= GUIDE.length) {
      celebrate(nextPlayer);
      return;
    }
    setStep(next);
  }

  function miss() {
    setNudge(beat?.wrong || "Not that one.");
    playError();
  }

  function onSelect(index: number) {
    if (won || !action) return;
    if (action.type === "select" && index === action.cell) {
      setSelected(index);
      setNudge(null);
      setStep((s) => s + 1);
      return;
    }
    if (index === action.cell) {
      setSelected(index);
      return;
    }
    miss();
  }

  function onNumber(n: number) {
    if (won || action?.type !== "number") {
      if (action) miss();
      return;
    }
    if (n !== action.n) {
      miss();
      return;
    }
    const next = player.map((cell, i) => (i === action.cell ? { ...cell, number: n, notes: [] } : cell));
    setPlayer(next);
    setSelected(action.cell);
    setMoves((m) => m + 1);
    const spec = tutorialPuzzle.cells[action.cell];
    if (spec?.kind === "wild") playFlip();
    advance(next);
  }

  function onColor(color: ColorName) {
    if (won || action?.type !== "color") {
      if (action) miss();
      return;
    }
    if (color !== action.color) {
      miss();
      return;
    }
    const next = player.map((cell, i) => (i === action.cell ? { ...cell, color, notes: [] } : cell));
    setPlayer(next);
    setSelected(action.cell);
    playFlip();
    advance(next);
  }

  const cardsDone = TUTORIAL_SEATS.filter((i) => {
    const cell = player[i];
    const spec = tutorialPuzzle.cells[i];
    if (!cell || !spec) return false;
    return cell.number != null && (spec.kind === "wild" || cell.color != null);
  }).length;

  const draftNumber = action?.type === "number" ? null : player[selected ?? -1]?.number ?? null;
  const draftColor = action?.type === "color" ? null : player[selected ?? -1]?.color ?? null;

  return (
    <main className="min-h-dvh bg-felt text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <header className="sticky top-0 z-20 flex items-center gap-2 bg-felt/95 py-2 backdrop-blur">
          <button
            type="button"
            aria-label="Home"
            onClick={leave}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-card active:scale-[0.96]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold">First game</h1>
            <p className="text-sm text-ink-soft">
              {cardsDone} of 5 cards
            </p>
          </div>
          <button type="button" onClick={leave} className="h-11 rounded-full bg-card px-4 text-sm font-semibold active:scale-[0.96]">
            Skip
          </button>
        </header>

        <div className="py-2">
          <Board
            puzzle={tutorialPuzzle}
            player={player}
            selected={selected}
            draftNumber={action?.type === "number" ? null : draftNumber}
            draftColor={action?.type === "color" ? null : draftColor}
            violations={[]}
            colorblind={settings.colorblind}
            onSelect={onSelect}
            spotlight={spotlight}
          />
        </div>

        <div className="sticky bottom-0 mt-auto space-y-2 bg-felt/95 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="rounded-3xl bg-card px-4 py-3" aria-live="polite">
            <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Walkthrough</p>
            <h2 className="font-display text-2xl leading-tight font-semibold">{beat?.title}</h2>
            <p className={cn("mt-1 text-sm", nudge ? "text-danger" : "text-ink-soft")}>{nudge ?? beat?.body}</p>
          </div>

          {action == null ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-12 w-full rounded-2xl bg-accent font-semibold text-accent-ink active:scale-[0.96]"
            >
              Deal me in
            </button>
          ) : (
            <>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const expected = action.type === "number" && action.n === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={action.type !== "number"}
                      onClick={() => onNumber(n)}
                      className={cn(
                        "h-12 rounded-xl text-lg font-extrabold active:scale-[0.96] disabled:opacity-40",
                        expected ? "bg-ink text-felt ring-2 ring-accent" : "bg-card",
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((color) => {
                  const expected = action.type === "color" && action.color === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      aria-label={colorLabel(color)}
                      disabled={action.type !== "color"}
                      onClick={() => onColor(color)}
                      className={cn(
                        "flex h-12 items-center justify-center rounded-full border-2 active:scale-[0.96] disabled:opacity-35",
                        COLOR_BG[color],
                        expected ? "border-ink ring-2 ring-accent" : "border-transparent",
                      )}
                    >
                      {settings.colorblind ? <ColorMark color={color} className="h-4 w-4 text-white" /> : null}
                      <span className="sr-only">{color}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {won ? (
        <WinOverlay
          message="That's the whole game."
          elapsedMs={elapsed}
          moves={moves}
          footer="Daily, free play, and study break use the same rules. Fewer clues, same table."
          primary="Today's puzzle"
          onPrimary={() => {
            update({ guideOffered: true, tutorialSeen: true });
            void navigate({ to: "/play", search: { mode: "daily", difficulty: "medium", fresh: false } });
          }}
          secondary="Home"
          onSecondary={leave}
        />
      ) : null}
    </main>
  );
}
