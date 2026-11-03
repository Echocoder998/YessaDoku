export function dateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y || 2000, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return dateKey(dt);
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatWhen(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y || 2000, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
