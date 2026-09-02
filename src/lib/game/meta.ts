const KEY = "stst-horde-v1";

export type Meta = {
  bestKills: number;
  bestTime: number;
  runs: number;
  muted: boolean;
};

export function defaultMeta(): Meta {
  return { bestKills: 0, bestTime: 0, runs: 0, muted: false };
}

export function loadMeta(): Meta {
  if (typeof window === "undefined") return defaultMeta();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultMeta();
    const p = JSON.parse(raw) as Partial<Meta>;
    return {
      bestKills: Number(p.bestKills) || 0,
      bestTime: Number(p.bestTime) || 0,
      runs: Number(p.runs) || 0,
      muted: Boolean(p.muted),
    };
  } catch {
    return defaultMeta();
  }
}

export function writeMeta(m: Meta) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export function recordRun(kills: number, time: number) {
  const m = loadMeta();
  m.runs += 1;
  m.bestKills = Math.max(m.bestKills, kills);
  m.bestTime = Math.max(m.bestTime, time);
  writeMeta(m);
  return m;
}

export function setMutedMeta(muted: boolean) {
  const m = loadMeta();
  m.muted = muted;
  writeMeta(m);
}
