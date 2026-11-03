import { Lock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ColorName } from "@/lib/game/types";

const FACE: Record<ColorName, string> = {
  red: "bg-uno-red",
  yellow: "bg-uno-yellow",
  green: "bg-uno-green",
  blue: "bg-uno-blue",
};

const INK: Record<ColorName, string> = {
  red: "text-uno-red-ink",
  yellow: "text-uno-yellow-ink",
  green: "text-uno-green-ink",
  blue: "text-uno-blue-ink",
};

const LABEL: Record<ColorName, string> = {
  red: "red diamond",
  yellow: "yellow star",
  green: "green circle",
  blue: "blue triangle",
};

export function ColorMark({ color, className }: { color: ColorName; className?: string }) {
  const cls = className ?? "h-3 w-3";
  if (color === "red") {
    return (
      <svg viewBox="0 0 12 12" className={cls} aria-hidden>
        <path d="M6 1.1 10.7 6 6 10.9 1.3 6Z" fill="currentColor" />
      </svg>
    );
  }
  if (color === "yellow") {
    return (
      <svg viewBox="0 0 12 12" className={cls} aria-hidden>
        <path
          d="M6 .9 7.45 4.35 11.1 4.55 8.25 6.9 9.15 10.5 6 8.55 2.85 10.5 3.75 6.9.9 4.55l3.65-.2Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (color === "green") {
    return (
      <svg viewBox="0 0 12 12" className={cls} aria-hidden>
        <circle cx="6" cy="6" r="4.3" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 12 12" className={cls} aria-hidden>
      <path d="M6 1.2 11.1 10.6H.9Z" fill="currentColor" />
    </svg>
  );
}

export function colorLabel(color: ColorName): string {
  return LABEL[color];
}

interface FaceProps {
  color: ColorName | "wild" | null;
  number: number | null;
  locked?: boolean;
  colorblind?: boolean;
  ghost?: boolean;
  notes?: number[];
  flipKey?: string;
}

export function CardFace({ color, number, locked, colorblind, ghost, notes, flipKey }: FaceProps) {
  const reduce = useReducedMotion();
  const noteList = notes ?? [];
  const showNotes = color == null && number == null && noteList.length > 0;

  const body = showNotes ? (
    <span className="grid h-full w-full grid-cols-3 place-items-center px-0.5 text-xs font-semibold text-ink-soft">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <span key={n} className={noteList.includes(n) ? "opacity-100" : "opacity-0"}>
          {n}
        </span>
      ))}
    </span>
  ) : color == null && number == null ? (
    <span className="block h-full w-full" />
  ) : color == null ? (
    <span className="relative flex h-full w-full items-center justify-center rounded-[22%] bg-card shadow-sm ring-1 ring-line">
      <span className="flex h-[64%] w-[58%] items-center justify-center rounded-full bg-white font-sans text-lg font-extrabold text-ink">
        {number}
      </span>
    </span>
  ) : color === "wild" ? (
    <span className="relative flex h-full w-full items-center justify-center rounded-[22%] bg-uno-wild shadow-sm">
      <span className="wild-pie flex h-[64%] w-[58%] items-center justify-center rounded-full">
        <span className="flex h-[62%] w-[62%] items-center justify-center rounded-full bg-white font-sans text-lg font-extrabold text-ink">
          {number ?? "?"}
        </span>
      </span>
    </span>
  ) : (
    <span className={cn("relative flex h-full w-full items-center justify-center rounded-[22%] shadow-sm", FACE[color])}>
      <span
        className={cn(
          "flex h-[64%] w-[58%] flex-col items-center justify-center rounded-full bg-white font-sans text-lg font-extrabold leading-none",
          INK[color],
        )}
      >
        {number ?? "?"}
        {colorblind ? <ColorMark color={color} className="mt-0.5 h-2.5 w-2.5" /> : null}
      </span>
      {colorblind ? (
        <span className={cn("absolute bottom-0.5 left-0.5 rounded-full bg-white p-0.5", INK[color])} title={LABEL[color]}>
          <ColorMark color={color} className="h-2.5 w-2.5" />
        </span>
      ) : null}
      {locked ? (
        <span className="absolute top-0.5 right-0.5 rounded-full bg-white p-0.5 text-ink">
          <Lock className="h-2.5 w-2.5" aria-hidden />
        </span>
      ) : null}
    </span>
  );

  if (!flipKey) return <span className={cn("block h-full w-full", ghost && "opacity-80")}>{body}</span>;

  return (
    <motion.span
      key={flipKey}
      className={cn("block h-full w-full", ghost && "opacity-80")}
      initial={reduce ? { opacity: 0.6 } : { rotateY: 88, opacity: 0.7 }}
      animate={{ rotateY: 0, opacity: ghost ? 0.8 : 1 }}
      transition={{ type: "spring", duration: 0.32, bounce: 0 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {body}
    </motion.span>
  );
}
