export const SIZE = 6;
export const CELLS = 36;
export const BOX_ROWS = 2;
export const BOX_COLS = 3;

export function rowOf(i: number): number {
  return (i / SIZE) | 0;
}

export function colOf(i: number): number {
  return i % SIZE;
}

/** Six 2×3 boxes, two across and three down. */
export function boxOf(i: number): number {
  return ((rowOf(i) / BOX_ROWS) | 0) * 2 + ((colOf(i) / BOX_COLS) | 0);
}

function collect(pred: (i: number) => boolean): number[] {
  const out: number[] = [];
  for (let i = 0; i < CELLS; i++) if (pred(i)) out.push(i);
  return out;
}

export const ROWS: readonly (readonly number[])[] = Array.from({ length: SIZE }, (_, r) =>
  collect((i) => rowOf(i) === r),
);

export const COLS: readonly (readonly number[])[] = Array.from({ length: SIZE }, (_, c) =>
  collect((i) => colOf(i) === c),
);

export const BOXES: readonly (readonly number[])[] = Array.from({ length: 6 }, (_, b) =>
  collect((i) => boxOf(i) === b),
);

export const NEIGHBORS: readonly (readonly number[])[] = Array.from({ length: CELLS }, (_, i) => {
  const r = rowOf(i);
  const c = colOf(i);
  const n: number[] = [];
  if (r > 0) n.push(i - SIZE);
  if (r < SIZE - 1) n.push(i + SIZE);
  if (c > 0) n.push(i - 1);
  if (c < SIZE - 1) n.push(i + 1);
  return n;
});
