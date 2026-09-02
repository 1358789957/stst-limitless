import { create } from "zustand";
import {
  ACHIEVEMENTS,
  DOMAIN_COOLDOWN,
  DOMAIN_DURATION,
  FAMILIARS,
  LINES,
  OFFLINE_CAP_MS,
  OFFLINE_RATE,
  PRESTIGE_AT,
  SKILL_CD,
  TECHNIQUES,
} from "./content";
import { emit } from "./events";
import {
  derive,
  familiarCost,
  isBossWave,
  prestigeGain,
  spiritStats,
  techCost,
  type Derived,
} from "./formulas";
import { defaultSave, loadSave, writeSave } from "./save";
import type { GameSave, SkillId, TabId } from "./types";
import {
  sfxBuy,
  sfxClick,
  sfxCrit,
  sfxDomain,
  sfxKill,
  sfxPrestige,
  sfxSkill,
} from "./audio";

export type GameStore = GameSave & {
  tab: TabId;
  combo: number;
  lastClickAt: number;
  line: string;
  bootstrapped: boolean;
  offlineGain: number;
  derived: Derived;
  hydrate: () => void;
  tick: (dt: number) => void;
  click: (nx: number, ny: number) => void;
  buyTech: (id: string, max: boolean) => void;
  buyFamiliar: (id: string, max: boolean) => void;
  activateDomain: () => void;
  castSkill: (id: SkillId) => void;
  prestigeNow: () => void;
  startRun: () => void;
  setTab: (t: TabId) => void;
  toggleMute: () => void;
  hardReset: () => void;
  applyImported: (s: GameSave) => void;
  persist: () => void;
};

function grant(state: GameSave, id: string) {
  if (state.achievements.includes(id)) return;
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  state.achievements = [...state.achievements, id];
  if (def) emit({ type: "achieve", name: def.name });
}

function applyEnergy(state: GameSave, amount: number) {
  if (amount <= 0) return;
  state.energy += amount;
  state.lifetime += amount;
  state.ascended += amount;
}

function refillSpirit(state: GameSave) {
  const st = spiritStats(state.wave);
  state.spiritId = st.spirit.id;
  state.spiritMax = st.hp;
  state.spiritHp = st.hp;
}

function resolveKills(next: GameSave) {
  while (next.spiritHp <= 0) {
    const st = spiritStats(next.wave);
    applyEnergy(next, st.reward);
    next.kills += 1;
    grant(next, "first-kill");
    if (st.boss) grant(next, "boss");
    if (next.kills >= 100) grant(next, "k100");
    emit({
      type: "kill",
      name: st.boss ? `遭遇·${st.spirit.name}` : st.spirit.name,
      reward: st.reward,
      boss: st.boss,
    });
    sfxKill();
    next.wave += 1;
    refillSpirit(next);
  }
}

let saveAccum = 0;

export const useGame = create<GameStore>((set, get) => ({
  ...defaultSave(),
  tab: "arts",
  combo: 0,
  lastClickAt: 0,
  line: "狱门之后，从零开始。",
  bootstrapped: false,
  offlineGain: 0,
  derived: derive(defaultSave()),

  hydrate: () => {
    if (get().bootstrapped) return;
    const loaded = loadSave();
    const now = Date.now();
    let offlineGain = 0;
    if (loaded.started && loaded.lastTickAt) {
      const elapsed = Math.min(OFFLINE_CAP_MS, Math.max(0, now - loaded.lastTickAt));
      const d = derive(loaded, now);
      offlineGain = d.idle * (elapsed / 1000) * OFFLINE_RATE;
      loaded.energy += offlineGain;
      loaded.lifetime += offlineGain;
      loaded.ascended += offlineGain;
      const hunt = d.huntDps * (elapsed / 1000) * OFFLINE_RATE;
      let hp = loaded.spiritHp - hunt;
      let wave = loaded.wave;
      let kills = loaded.kills;
      while (hp <= 0 && wave < loaded.wave + 40) {
        const st = spiritStats(wave);
        applyEnergy(loaded, st.reward);
        kills += 1;
        wave += 1;
        hp += spiritStats(wave).hp;
      }
      loaded.wave = wave;
      loaded.kills = kills;
      if (hp <= 0) {
        loaded.wave = wave;
        refillSpirit(loaded);
      } else {
        loaded.spiritHp = hp;
        const st = spiritStats(wave);
        loaded.spiritId = st.spirit.id;
        loaded.spiritMax = st.hp;
      }
    }
    loaded.lastTickAt = now;
    set({
      ...loaded,
      bootstrapped: true,
      offlineGain,
      derived: derive(loaded, now),
      line: loaded.started ? "欢迎回来。" : "狱门之后，从零开始。",
    });
  },

  persist: () => {
    const s = get();
    writeSave({
      version: s.version,
      started: s.started,
      energy: s.energy,
      lifetime: s.lifetime,
      ascended: s.ascended,
      prestige: s.prestige,
      wave: s.wave,
      spiritHp: s.spiritHp,
      spiritMax: s.spiritMax,
      spiritId: s.spiritId,
      tech: s.tech,
      familiars: s.familiars,
      achievements: s.achievements,
      clicks: s.clicks,
      kills: s.kills,
      blackFlashes: s.blackFlashes,
      bestCombo: s.bestCombo,
      domainUntil: s.domainUntil,
      domainCdUntil: s.domainCdUntil,
      skillCd: s.skillCd,
      muted: s.muted,
      lastTickAt: Date.now(),
    });
  },

  tick: (dt) => {
    const now = Date.now();
    set((prev) => {
      const next: GameSave = { ...prev, tech: { ...prev.tech }, familiars: { ...prev.familiars } };
      const d = derive(next, now);
      const gain = d.idle * dt;
      applyEnergy(next, gain);
      next.spiritHp -= d.huntDps * dt;
      let combo = prev.combo;
      if (now - prev.lastClickAt > 700) combo = 0;
      resolveKills(next);
      const rankNow = d.rank;
      const rankAfter = derive(next, now).rank;
      if (rankAfter.id !== rankNow.id) {
        emit({ type: "rank", name: rankAfter.name });
        if (rankAfter.id === "special") grant(next, "special");
      }
      return {
        ...next,
        combo,
        derived: derive(next, now),
      };
    });
    saveAccum += dt;
    if (saveAccum > 4) {
      saveAccum = 0;
      get().persist();
    }
  },

  click: (nx, ny) => {
    const now = Date.now();
    set((prev) => {
      const next: GameSave = { ...prev, tech: { ...prev.tech }, familiars: { ...prev.familiars } };
      const d = derive(next, now);
      const combo = now - prev.lastClickAt < 700 ? prev.combo + 1 : 1;
      const comboMult = 1 + Math.min(combo, 40) * 0.028;
      let crit = Math.random() < d.critChance * (combo >= 4 ? 1.45 : 1);
      if (combo >= 10 && Math.random() < 0.08) crit = true;
      const amount = d.click * comboMult * (crit ? d.critMult : 1);
      applyEnergy(next, amount);
      next.clicks += 1;
      next.spiritHp -= d.clickDamage * comboMult * (crit ? 1.8 : 1);
      if (crit) {
        next.blackFlashes += 1;
        grant(next, "flash");
        sfxCrit();
      } else {
        sfxClick();
      }
      grant(next, "first-click");
      if (combo >= 20) grant(next, "combo20");
      const line = crit
        ? "黑闪。"
        : LINES[(next.clicks + combo) % LINES.length]!;
      resolveKills(next);
      emit({
        type: "click",
        x: nx,
        y: ny,
        amount,
        crit,
      });
      return {
        ...next,
        combo,
        lastClickAt: now,
        bestCombo: Math.max(prev.bestCombo, combo),
        derived: derive(next, now),
        line,
      };
    });
  },

  buyTech: (id, max) => {
    set((prev) => {
      const next: GameSave = { ...prev, tech: { ...prev.tech }, familiars: { ...prev.familiars } };
      const def = TECHNIQUES.find((t) => t.id === id);
      if (!def || next.lifetime < def.unlockAt) return prev;
      let bought = 0;
      for (;;) {
        const d = derive(next);
        const lv = next.tech[id] ?? 0;
        const cost = techCost(id, lv, d.costFactor);
        if (next.energy < cost) break;
        next.energy -= cost;
        next.tech[id] = lv + 1;
        bought += 1;
        if (!max || bought >= 50) break;
      }
      if (bought === 0) return prev;
      sfxBuy();
      if ((next.tech.domain ?? 0) >= 1) grant(next, "domain");
      return { ...next, derived: derive(next), line: def.name + "。" };
    });
  },

  buyFamiliar: (id, max) => {
    set((prev) => {
      const next: GameSave = { ...prev, tech: { ...prev.tech }, familiars: { ...prev.familiars } };
      const def = FAMILIARS.find((t) => t.id === id);
      if (!def || next.lifetime < def.unlockAt) return prev;
      let bought = 0;
      for (;;) {
        const d = derive(next);
        const lv = next.familiars[id] ?? 0;
        const cost = familiarCost(id, lv, d.costFactor);
        if (next.energy < cost) break;
        next.energy -= cost;
        next.familiars[id] = lv + 1;
        bought += 1;
        if (!max || bought >= 50) break;
      }
      if (bought === 0) return prev;
      sfxBuy();
      return { ...next, derived: derive(next), line: def.name + " 就位。" };
    });
  },

  activateDomain: () => {
    const now = Date.now();
    set((prev) => {
      if ((prev.tech.domain ?? 0) < 1) return prev;
      if (now < prev.domainCdUntil) return prev;
      sfxDomain();
      emit({ type: "domain" });
      const next = {
        ...prev,
        achievements: [...prev.achievements],
        domainUntil: now + DOMAIN_DURATION,
        domainCdUntil: now + DOMAIN_COOLDOWN,
        line: "术域展开。无量空域。",
      };
      grant(next, "domain");
      return { ...next, derived: derive(next, now) };
    });
  },

  castSkill: (id) => {
    const now = Date.now();
    set((prev) => {
      if ((prev.tech[id] ?? 0) < 1) return prev;
      if (now < (prev.skillCd[id] ?? 0)) return prev;
      const next: GameSave = {
        ...prev,
        tech: { ...prev.tech },
        familiars: { ...prev.familiars },
        skillCd: { ...prev.skillCd },
        achievements: [...prev.achievements],
      };
      const lv = next.tech[id] ?? 1;
      const d = derive(next, now);
      const boss = isBossWave(next.wave);
      let dmg = 0;
      let line = "";
      if (id === "blue") {
        dmg = next.spiritMax * (0.28 + lv * 0.02);
        applyEnergy(next, d.click * 14);
        line = "苍。";
        grant(next, "blue");
      } else if (id === "red") {
        dmg = next.spiritMax * (0.55 + lv * 0.02);
        applyEnergy(next, d.click * 28);
        line = "赫。";
      } else {
        dmg = boss ? next.spiritMax * 0.5 : next.spiritHp;
        applyEnergy(next, d.click * 64);
        line = "虚式。";
        grant(next, "purple");
      }
      next.spiritHp -= dmg;
      next.skillCd[id] = now + SKILL_CD[id];
      sfxSkill(id);
      emit({ type: "skill", id });
      resolveKills(next);
      return { ...next, derived: derive(next, now), line };
    });
  },

  prestigeNow: () => {
    const prev = get();
    const gained = prestigeGain(prev.lifetime);
    if (gained <= 0) return;
    sfxPrestige();
    emit({ type: "prestige", gained });
    set((s) => {
      const next = defaultSave();
      next.started = true;
      next.prestige = s.prestige + gained;
      next.ascended = s.ascended;
      next.achievements = s.achievements;
      next.muted = s.muted;
      next.bestCombo = s.bestCombo;
      next.blackFlashes = s.blackFlashes;
      next.kills = s.kills;
      next.clicks = s.clicks;
      grant(next, "prestige");
      refillSpirit(next);
      return {
        ...s,
        ...next,
        tab: "arts",
        combo: 0,
        derived: derive(next),
        line: `最强残核 +${gained}。再开。`,
      };
    });
    get().persist();
  },

  startRun: () => {
    set((s) => {
      const next = { ...s, started: true, lastTickAt: Date.now() };
      if (next.spiritMax <= 0) refillSpirit(next);
      return { ...next, derived: derive(next), line: "吾乃最强。" };
    });
    get().persist();
  },

  setTab: (t) => set({ tab: t }),

  toggleMute: () => {
    set((s) => {
      const muted = !s.muted;
      return { ...s, muted };
    });
  },

  hardReset: () => {
    const next = defaultSave();
    set({
      ...next,
      bootstrapped: true,
      tab: "arts",
      combo: 0,
      derived: derive(next),
      line: "全部清掉了。",
      offlineGain: 0,
    });
    get().persist();
  },

  applyImported: (s) => {
    set({
      ...s,
      bootstrapped: true,
      derived: derive(s),
      tab: "arts",
      combo: 0,
      line: "读档完成。",
    });
    get().persist();
  },
}));

export { PRESTIGE_AT };
