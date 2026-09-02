const UNITS: { v: number; s: string }[] = [
  { v: 1e44, s: "载" },
  { v: 1e40, s: "正" },
  { v: 1e36, s: "涧" },
  { v: 1e32, s: "沟" },
  { v: 1e28, s: "穰" },
  { v: 1e24, s: "秭" },
  { v: 1e20, s: "垓" },
  { v: 1e16, s: "京" },
  { v: 1e12, s: "兆" },
  { v: 1e8, s: "亿" },
  { v: 1e4, s: "万" },
];

export function formatCE(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return "∞";
  if (n < 0) return "-" + formatCE(-n, digits);
  if (n < 1000) return n < 10 ? (Math.round(n * 10) / 10).toString() : Math.floor(n).toString();
  if (n < 10000) return Math.floor(n).toLocaleString("zh-CN");
  for (const u of UNITS) {
    if (n >= u.v) {
      const x = n / u.v;
      const d = x >= 100 ? 0 : x >= 10 ? 1 : 2;
      return x.toFixed(Math.min(d, digits - 1)) + u.s;
    }
  }
  return n.toExponential(2);
}

export function formatRate(n: number): string {
  return formatCE(n) + "/秒";
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}秒`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
