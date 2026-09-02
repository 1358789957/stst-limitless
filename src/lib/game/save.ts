import { SAVE_KEY, SAVE_VERSION, SPIRITS } from "./content";
import type { GameSave } from "./types";

export function defaultSave(): GameSave {
  const statsHp = 18;
  return {
    version: SAVE_VERSION,
    started: false,
    energy: 0,
    lifetime: 0,
    ascended: 0,
    prestige: 0,
    wave: 0,
    spiritHp: statsHp,
    spiritMax: statsHp,
    spiritId: SPIRITS[0]!.id,
    tech: {},
    familiars: {},
    achievements: [],
    clicks: 0,
    kills: 0,
    blackFlashes: 0,
    bestCombo: 0,
    domainUntil: 0,
    domainCdUntil: 0,
    skillCd: {},
    muted: false,
    lastTickAt: Date.now(),
  };
}

function migrate(raw: GameSave): GameSave {
  const base = defaultSave();
  const merged: GameSave = {
    ...base,
    ...raw,
    tech: { ...base.tech, ...(raw.tech ?? {}) },
    familiars: { ...base.familiars, ...(raw.familiars ?? {}) },
    skillCd: { ...base.skillCd, ...(raw.skillCd ?? {}) },
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    version: SAVE_VERSION,
  };
  return merged;
}

export function loadSave(): GameSave {
  if (typeof window === "undefined") return defaultSave();
  try {
    const txt = window.localStorage.getItem(SAVE_KEY);
    if (!txt) return defaultSave();
    const parsed = JSON.parse(txt) as GameSave;
    return migrate(parsed);
  } catch {
    return defaultSave();
  }
}

export function writeSave(save: GameSave) {
  if (typeof window === "undefined") return;
  try {
    const blob = JSON.stringify({ ...save, lastTickAt: Date.now() });
    window.localStorage.setItem(SAVE_KEY, blob);
  } catch {
    /* quota / private mode */
  }
}

export function exportSave(save: GameSave) {
  return JSON.stringify(save, null, 2);
}

export function importSave(text: string): GameSave | null {
  try {
    const parsed = JSON.parse(text) as GameSave;
    if (typeof parsed !== "object" || parsed == null) return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
