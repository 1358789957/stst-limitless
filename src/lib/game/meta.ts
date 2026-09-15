import type { CharId } from "./characters.ts";

const KEY = "stst-horde-v1";

export type Meta = {
  bestKills: number;
  bestTime: number;
  bestLevel: number;
  runs: number;
  muted: boolean;
  sukunaUnlocked: boolean;
  extraStart: boolean;
  cleared: boolean;
  notes: string[];
};

export type RunResult = {
  kills: number;
  time: number;
  level: number;
  won: boolean;
  charId: CharId;
  usedDomain: boolean;
  sawBoss: boolean;
};

export function defaultMeta(): Meta {
  return {
    bestKills: 0,
    bestTime: 0,
    bestLevel: 0,
    runs: 0,
    muted: false,
    sukunaUnlocked: false,
    extraStart: false,
    cleared: false,
    notes: [],
  };
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export function loadMeta(): Meta {
  if (typeof window === "undefined") return defaultMeta();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultMeta();
    const p = JSON.parse(raw) as Partial<Meta>;
    const runs = Number(p.runs) || 0;
    const notes = asStringArray(p.notes);
    return {
      bestKills: Number(p.bestKills) || 0,
      bestTime: Number(p.bestTime) || 0,
      bestLevel: Number(p.bestLevel) || 0,
      runs,
      muted: Boolean(p.muted),
      sukunaUnlocked: Boolean(p.sukunaUnlocked) || runs >= 1,
      extraStart: Boolean(p.extraStart),
      cleared: Boolean(p.cleared),
      notes,
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

function grantNote(m: Meta, id: string, unlocked: string[], label: string) {
  if (m.notes.includes(id)) return;
  m.notes = [...m.notes, id];
  unlocked.push(label);
}

export function recordRun(result: RunResult): { meta: Meta; unlocked: string[] } {
  const m = loadMeta();
  const unlocked: string[] = [];
  m.runs += 1;
  m.bestKills = Math.max(m.bestKills, result.kills);
  m.bestTime = Math.max(m.bestTime, result.time);
  m.bestLevel = Math.max(m.bestLevel, result.level);

  grantNote(m, "n-first", unlocked, "档案 · 狱门之后");

  if (!m.sukunaUnlocked) {
    m.sukunaUnlocked = true;
    unlocked.push("解锁 宿傩");
  }
  grantNote(m, "n-sukuna", unlocked, "档案 · 灾祸");

  if (result.sawBoss) grantNote(m, "n-boss", unlocked, "档案 · 灾核");
  if (result.usedDomain) grantNote(m, "n-domain", unlocked, "档案 · 展开");

  if (!m.extraStart && (result.won || result.time >= 90)) {
    m.extraStart = true;
    unlocked.push("起手加一");
  }

  if (result.won) {
    if (!m.cleared) {
      m.cleared = true;
      unlocked.push("通关");
    }
    grantNote(m, "n-clear", unlocked, "档案 · 最强");
  }

  writeMeta(m);
  return { meta: m, unlocked };
}

export function setMutedMeta(muted: boolean) {
  const m = loadMeta();
  m.muted = muted;
  writeMeta(m);
}

export function isCharUnlocked(id: CharId, meta: Meta) {
  if (id === "sukuna") return meta.sukunaUnlocked;
  return true;
}
