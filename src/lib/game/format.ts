export function formatClock(t: number) {
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}
