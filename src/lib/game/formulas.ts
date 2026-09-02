import { FAMILIARS, PRESTIGE_AT, RANKS, SPIRITS, TECHNIQUES } from "./content";
import type { GameSave, SpiritDef } from "./types";

export type Derived = {
  globalMult: number;
  idle: number;
  click: number;
  critChance: number;
  critMult: number;
  costFactor: number;
  rank: (typeof RANKS)[number];
  domainActive: boolean;
  huntDps: number;
  clickDamage: number;
};

export function currentRank(ascended: number) {
  let r = RANKS[0]!;
  for (const x of RANKS) {
    if (ascended >= x.lifetime) r = x;
  }
  return r;
}

export function spiritForWave(wave: number): SpiritDef {
  let pick = SPIRITS[0]!;
  for (const s of SPIRITS) {
    if (wave >= s.minWave) pick = s;
  }
  return pick;
}

export function isBossWave(wave: number) {
  return (wave + 1) % 10 === 0;
}

export function waveScale(wave: number) {
  return Math.pow(1.195, wave);
}

export function spiritStats(wave: number) {
  const s = spiritForWave(wave);
  const k = waveScale(wave);
  const boss = isBossWave(wave);
  return {
    spirit: s,
    hp: Math.floor(s.baseHp * k * (boss ? 3.4 : 1)),
    reward: s.reward * k * (boss ? 4.2 : 1),
    boss,
  };
}

export function derive(state: GameSave, now = Date.now()): Derived {
  const rank = currentRank(state.ascended);
  const eyes = state.tech.eyes ?? 0;
  const rct = state.tech.rct ?? 0;
  const flash = state.tech.flash ?? 0;
  const domainLv = state.tech.domain ?? 0;
  const domainActive = now < state.domainUntil;
  const prestigeMult = 1 + state.prestige * 0.14;
  const eyesMult = 1 + eyes * 0.07;
  const domainMult = domainActive ? 7 + domainLv * 0.4 : 1;
  const globalMult = prestigeMult * eyesMult * rank.mult * domainMult;

  let idle = 0;
  for (const t of TECHNIQUES) {
    const lv = state.tech[t.id] ?? 0;
    idle += t.prod * lv;
  }
  for (const f of FAMILIARS) {
    const lv = state.familiars[f.id] ?? 0;
    idle += f.prod * lv;
  }
  idle *= globalMult;

  const click = (1 + rct * 0.35) * globalMult * (1 + Math.min(12, eyes) * 0.04);
  const critChance = Math.min(0.28, 0.03 + flash * 0.012);
  const critMult = 2.4 + flash * 0.18;
  const costFactor = Math.pow(0.965, eyes);
  const huntDps = idle * 0.55;
  const clickDamage = click * 6;

  return {
    globalMult,
    idle,
    click,
    critChance,
    critMult,
    costFactor,
    rank,
    domainActive,
    huntDps,
    clickDamage,
  };
}

export function techCost(id: string, level: number, costFactor: number) {
  const t = TECHNIQUES.find((x) => x.id === id);
  if (!t) return Infinity;
  return t.baseCost * Math.pow(t.costMult, level) * costFactor;
}

export function familiarCost(id: string, level: number, costFactor: number) {
  const t = FAMILIARS.find((x) => x.id === id);
  if (!t) return Infinity;
  return t.baseCost * Math.pow(t.costMult, level) * costFactor;
}

export function prestigeGain(lifetime: number) {
  if (lifetime < PRESTIGE_AT) return 0;
  return Math.max(1, Math.floor(Math.sqrt(lifetime / PRESTIGE_AT)));
}

export function isUnlocked(unlockAt: number, lifetime: number) {
  return lifetime >= unlockAt;
}
