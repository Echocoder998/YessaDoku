import { cn } from "@/lib/cn";
import { boxOf, colOf, rowOf } from "@/lib/game/grid";
import type { ColorName, PlayerCell, Puzzle } from "@/lib/game/types";
import { CardFace, ColorMark, colorLabel } from "./CardFace";

const CLUE_RING: Record<ColorName, string> = {
  red: "border-uno-red",
  yellow: "border-uno-yellow",
  green: "border-uno-green",
  blue: "border-uno-blue",
};

const CLUE_INK: Record<ColorName, string> = {
  red: "text-uno-red-ink",
  yellow: "text-uno-yellow-ink",
  green: "text-uno-green-ink",
  blue: "text-uno-blue-ink",
};

function peerSet(index: number): Set<number> {
  const set = new Set<number>();
  const r = rowOf(index);
  const c = colOf(index);
  const br = Math.floor(r / 2) * 2;
  const bc = Math.floor(c / 3) * 3;
  for (let k = 0; k < 6; k++) {
    set.add(r * 6 + k);
    set.add(k * 6 + c);
  }
  for (let rr = br; rr < br + 2; rr++) {
    for (let cc = bc; cc < bc + 3; cc++) set.add(rr * 6 + cc);
  }
  return set;
}

interface BoardProps {
  puzzle: Puzzle;
  player: PlayerCell[];
  selected: number | null;
  draftNumber: number | null;
  draftColor: ColorName | null;
  violations: number[];
  colorblind: boolean;
  onSelect: (index: number) => void;
  spotlight?: number | null;
}

export function Board({
  puzzle,
  player,
  selected,
  draftNumber,
  draftColor,
  violations,
  colorblind,
  onSelect,
  spotlight = null,
}: BoardProps) {
  const peers = selected == null ? null : peerSet(selected);
  const clash = new Set(violations);

  return (
    <div
      className="grid w-full grid-cols-6 overflow-hidden rounded-2xl border-2 border-ink bg-card select-none"
      role="grid"
      aria-label="YessaDoku board"
      style={{ perspective: 800 }}
    >
      {puzzle.cells.map((spec, index) => {
        const cell = player[index];
        const r = rowOf(index);
        const c = colOf(index);
        const active = selected === index;
        const inPeer = peers?.has(index) && !active;
        const bad = clash.has(index);
        const coached = spotlight === index;
        const clue = spec.kind === "clue" ? spec.solutionColor : null;
        const wild = spec.kind === "wild";
        const previewColor = active && cell && !cell.locked ? (draftColor ?? cell.color) : cell?.color ?? null;
        const previewNumber = active && cell && !cell.locked ? (draftNumber ?? cell.number) : cell?.number ?? null;
        const ghost = active && (draftNumber != null || draftColor != null) && (cell?.number == null || cell?.color == null);
        const faceColor = wild ? "wild" : previewColor;
        const showFace = wild || previewColor != null || previewNumber != null || (cell?.notes.length ?? 0) > 0;
        const label = describeCell(index, spec.kind, previewNumber, wild ? "wild" : previewColor, cell?.locked ?? false);

        return (
          <button
            key={index}
            type="button"
            role="gridcell"
            aria-selected={active}
            aria-label={label}
            data-cell={index}
            onClick={() => onSelect(index)}
            className={cn(
              "relative aspect-square bg-well p-0.5 transition-transform duration-150 ease-out active:scale-[0.96]",
              c < 5 && (c % 3 === 2 ? "border-r-2 border-r-ink" : "border-r border-r-line"),
              r < 5 && (r % 2 === 1 ? "border-b-2 border-b-ink" : "border-b border-b-line"),
              inPeer && "bg-felt-deep",
              coached && "z-10 ring-2 ring-inset ring-accent",
              !coached && (active || bad) && "z-10 ring-2 ring-inset",
              !coached && (bad ? "ring-danger" : active && "ring-ink"),
            )}
          >
            {clue && !previewColor ? (
              <span
                className={cn(
                  "pointer-events-none absolute inset-1 flex items-end justify-end rounded-lg border-2 bg-well",
                  CLUE_RING[clue],
                )}
              >
                {colorblind ? (
                  <span className={cn("m-0.5 rounded-full bg-white p-0.5", CLUE_INK[clue])}>
                    <ColorMark color={clue} className="h-2.5 w-2.5" />
                  </span>
                ) : null}
              </span>
            ) : null}
            {showFace && cell ? (
              <CardFace
                color={faceColor}
                number={previewNumber}
                locked={cell.locked}
                colorblind={colorblind && !wild}
                ghost={ghost}
                notes={!previewNumber && !previewColor && !wild ? cell.notes : []}
                flipKey={cell.locked || previewNumber != null || previewColor != null ? `${index}-${previewNumber}-${previewColor}` : undefined}
              />
            ) : null}
            <span className="sr-only">box {boxOf(index) + 1}</span>
          </button>
        );
      })}
    </div>
  );
}

function describeCell(
  index: number,
  kind: string,
  number: number | null,
  color: ColorName | "wild" | null,
  locked: boolean,
): string {
  const where = `row ${rowOf(index) + 1}, column ${colOf(index) + 1}`;
  if (kind === "wild") return `${where}, wild card${number ? `, number ${number}` : ", choose a number"}`;
  if (locked && number && color && color !== "wild") return `${where}, locked ${colorLabel(color)} ${number}`;
  if (number && color && color !== "wild") return `${where}, ${colorLabel(color)} ${number}`;
  if (kind === "clue") return `${where}, color clue, empty`;
  return `${where}, empty`;
}
