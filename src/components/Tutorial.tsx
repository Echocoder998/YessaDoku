import { useState } from "react";
import { personal } from "@/config/personal";
import { cn } from "@/lib/cn";
import type { ColorName } from "@/lib/game/types";
import { CardFace, ColorMark } from "./CardFace";

const STEPS = 5;

export function Tutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [demoNumber, setDemoNumber] = useState<number | null>(null);
  const [demoColor, setDemoColor] = useState<ColorName | null>(null);
  if (!open) return null;

  const placed = demoNumber != null && demoColor != null;
  const nextBlocked = step === 3 && !placed;

  function close() {
    setStep(0);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-3 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="tutorial-title"
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-5 text-ink"
      >
        <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">
          How to play · {step + 1} / {STEPS}
        </p>
        <div className="mt-3">
          {step === 0 ? <StepNumbers /> : null}
          {step === 1 ? <StepColors /> : null}
          {step === 2 ? <StepSpecials /> : null}
          {step === 3 ? (
            <StepDeal
              number={demoNumber}
              color={demoColor}
              onNumber={setDemoNumber}
              onColor={setDemoColor}
            />
          ) : null}
          {step === 4 ? <StepPowers /> : null}
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => (step === 0 ? close() : setStep((s) => s - 1))}
            className="h-12 flex-1 rounded-2xl border border-line bg-well font-semibold active:scale-[0.96]"
          >
            {step === 0 ? "Skip" : "Back"}
          </button>
          <button
            type="button"
            disabled={nextBlocked}
            onClick={() => (step === STEPS - 1 ? close() : setStep((s) => s + 1))}
            className="h-12 flex-[1.4] rounded-2xl bg-accent font-semibold text-accent-ink active:scale-[0.96] disabled:opacity-40"
          >
            {step === STEPS - 1 ? "Deal me in" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepNumbers() {
  return (
    <div>
      <h2 id="tutorial-title" className="font-display text-3xl leading-tight font-semibold">
        Hi {personal.herName}. Numbers first.
      </h2>
      <p className="mt-2 text-ink-soft">
        It is a 6×6 Sudoku. Every row, every column, and every 2×3 box holds 1 through 6 exactly once.
      </p>
      <div className="mt-4 grid grid-cols-6 gap-1">
        {[1, 2, 3, 4, 5, 6].map((n, i) => (
          <div key={n} className="aspect-square">
            <CardFace color={(["red", "yellow", "green", "blue", "red", "yellow"] as const)[i]!} number={n} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft">That row is happy. A repeated 4 would not be.</p>
    </div>
  );
}

function StepColors() {
  return (
    <div>
      <h2 id="tutorial-title" className="font-display text-3xl leading-tight font-semibold">
        Then the deck has opinions.
      </h2>
      <ul className="mt-3 space-y-3 text-sm">
        <li className="rounded-2xl bg-well p-3">
          <span className="font-semibold">Neighbors clash.</span> Two cards that share an edge cannot share a color. Diagonals are fine.
          <span className="mt-2 flex gap-1">
            <Mini color="red" n={1} />
            <Mini color="blue" n={2} />
            <Mini color="red" n={3} bad />
          </span>
        </li>
        <li className="rounded-2xl bg-well p-3">
          <span className="font-semibold">Rows and columns need all four colors</span> at least once: red, yellow, green, blue.
        </li>
        <li className="rounded-2xl bg-well p-3">
          <span className="font-semibold">A 2×3 box holds at most two</span> cards of the same color.
        </li>
      </ul>
    </div>
  );
}

function StepSpecials() {
  return (
    <div>
      <h2 id="tutorial-title" className="font-display text-3xl leading-tight font-semibold">
        Clues, and one wild.
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-well p-3">
          <div className="relative mx-auto aspect-square w-16 rounded-xl border-2 border-uno-blue bg-card">
            <span className="absolute right-1 bottom-1 text-uno-blue-ink">
              <ColorMark color="blue" />
            </span>
          </div>
          <p className="mt-2 text-sm">
            A colored border is a promise. Only that color can land there. You still choose the number.
          </p>
        </div>
        <div className="rounded-2xl bg-well p-3">
          <div className="mx-auto aspect-square w-16">
            <CardFace color="wild" number={null} />
          </div>
          <p className="mt-2 text-sm">A wild has no color. It skips every color rule. You only give it a number.</p>
        </div>
      </div>
    </div>
  );
}

function StepDeal({
  number,
  color,
  onNumber,
  onColor,
}: {
  number: number | null;
  color: ColorName | null;
  onNumber: (n: number) => void;
  onColor: (c: ColorName) => void;
}) {
  return (
    <div>
      <h2 id="tutorial-title" className="font-display text-3xl leading-tight font-semibold">
        Tap, then deal.
      </h2>
      <p className="mt-2 text-ink-soft">Pick a number and a color. The card flips in when it has both. Try it.</p>
      <div className="mx-auto mt-4 w-20">
        <div className="aspect-square">
          <CardFace
            color={color}
            number={number}
            flipKey={color && number ? `${color}${number}` : undefined}
            ghost={!(color && number)}
          />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-6 gap-1">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onNumber(n)}
            className={cn(
              "h-11 rounded-xl font-extrabold active:scale-[0.96]",
              number === n ? "bg-ink text-felt" : "bg-well",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {(["red", "yellow", "green", "blue"] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => onColor(c)}
            className={cn(
              "flex h-12 items-center justify-center rounded-full border-2 active:scale-[0.96]",
              c === "red" && "bg-uno-red",
              c === "yellow" && "bg-uno-yellow",
              c === "green" && "bg-uno-green",
              c === "blue" && "bg-uno-blue",
              color === c ? "border-ink" : "border-transparent",
            )}
          >
            <ColorMark color={c} className="h-4 w-4 text-white" />
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPowers() {
  return (
    <div>
      <h2 id="tutorial-title" className="font-display text-3xl leading-tight font-semibold">
        Two Uno tricks.
      </h2>
      <div className="mt-3 space-y-3 text-sm">
        <p className="rounded-2xl bg-well p-3">
          <span className="font-semibold">DRAW 2</span> flips two empty cards face-up from the deck and locks them. Easy gets two uses, Medium one, Hard none.
        </p>
        <p className="rounded-2xl bg-well p-3">
          <span className="font-semibold">REVERSE</span> takes back your last three moves. Two uses, every difficulty. Plain Undo is free, and Erase clears the card you are holding.
        </p>
        <p className="rounded-2xl bg-well p-3">
          Pencil notes live under the Notes button. The clock pauses if you leave the table. When every rule is happy, you get a big UNO.
        </p>
      </div>
    </div>
  );
}

function Mini({ color, n, bad }: { color: ColorName; n: number; bad?: boolean }) {
  return (
    <span className={cn("mt-2 block h-12 w-10", bad && "ring-2 ring-danger rounded-[22%]")}>
      <CardFace color={color} number={n} />
    </span>
  );
}
