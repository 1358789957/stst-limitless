import type { Atlas } from "./atlas.ts";
import {
  sfxCrit,
  sfxDash,
  sfxDomain,
  sfxHit,
  sfxHurt,
  sfxKill,
  sfxLevel,
  sfxOver,
  sfxSkill,
} from "./audio.ts";
import { CHAR_MAP, type CharId } from "./characters.ts";
import {
  emptyWeps,
  fieldMuts,
  forgeDamageMul,
  forgeRateMul,
  isAnvilId,
  LEVEL_HP,
  levelHp,
  MAX_ANVIL_CHAIN,
  rollPicks,
  shapeMul,
  shopClosesOn,
  shouldChainAnvil,
  UPGRADE_MAP,
  type Offer,
  type UpgradeId,
} from "./upgrades.ts";

export const WORLD = 2200;
export const CLEAR_TIME = 180;
export const DASH_COOLDOWN = 2.15;
export const ARRIVE = 12;
export const EXTRA_START: Record<CharId, UpgradeId> = {
  gojo: "red",
  sukuna: "cleave",
};

export const ACTIVE_START: Record<CharId, UpgradeId> = {
  gojo: "fist",
  sukuna: "slash",
};

export const STARTERS: Record<CharId, UpgradeId[]> = {
  gojo: ["limitless", "fist"],
  sukuna: ["slash", "cleave"],
};

export const PUNCH_BASE = 3.2;
export const RED_BASE = 0.72;
export const BLUE_BASE = 2.4;
export const SLASH_BASE = 3.4;
export const CLEAVE_PCT = 0.03;

const MAX_E = 200;
const MAX_B = 280;
const MAX_G = 180;
const MAX_FX = 240;
const MAX_LASER = 8;
const MAX_FIELD = 18;
const MAX_HAZ = 24;

export type DmgKind = "contact" | "projectile" | "laser" | "explosion";
export type HitTag = "none" | "rim" | "slash" | "cleave" | "dash";

export const DMG_KIND_NAME: Record<DmgKind, string> = {
  contact: "接触",
  projectile: "弹道",
  laser: "激光",
  explosion: "爆炸",
};

type Kind = 0 | 1 | 2 | 3;

type Enemy = {
  alive: boolean;
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  max: number;
  dmg: number;
  xp: number;
  spd: number;
  hurt: number;
  seed: number;
  elite: boolean;
  mark: number;
  atk: number;
};

type Bullet = {
  alive: boolean;
  kind: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  life: number;
  pierce: number;
  homing: number;
};

type Chain = {
  x: number;
  y: number;
  hops: number;
  wait: number;
  dmg: number;
  kind: 0 | 1 | 2;
  reach: number;
};

type Laser = {
  alive: boolean;
  hue: 0 | 1 | 2;
  ang: number;
  sweep: number;
  len: number;
  wide: number;
  life: number;
  max: number;
  dmg: number;
  acc: number;
};

type Field = {
  alive: boolean;
  x: number;
  y: number;
  r: number;
  life: number;
  dmg: number;
  acc: number;
  hue: 0 | 1;
};

type Hazard = {
  alive: boolean;
  style: 0 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  life: number;
  ang: number;
  len: number;
  kind: DmgKind;
};

type Gem = { alive: boolean; x: number; y: number; v: number };
type Fx = {
  alive: boolean;
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  kind: number;
  text: string;
  crit: boolean;
  ang: number;
};

const KINDS = [
  { hp: 10, spd: 82, dmg: 8, xp: 1, r: 13, h: 48, sprite: "fly" as const },
  { hp: 32, spd: 58, dmg: 12, xp: 2, r: 18, h: 54, sprite: "mouth" as const },
  { hp: 48, spd: 118, dmg: 14, xp: 4, r: 15, h: 60, sprite: "blood" as const },
  { hp: 520, spd: 44, dmg: 26, xp: 30, r: 36, h: 110, sprite: "disaster" as const },
];

function xpNeed(level: number) {
  if (level < 5) return 7 + level * 3;
  return Math.floor(20 * Math.pow(1.24, level - 5));
}

function orbitCount(lv: number) {
  if (lv <= 0) return 0;
  if (lv >= 4) return 4;
  if (lv >= 2) return 3;
  return 2;
}

function orbitDist(lv: number, base: number) {
  return base + (lv >= 3 ? 22 : lv * 6);
}

function purpleCdFor(p: number) {
  return [0, 5.6, 4.9, 4.4, 3.8][Math.min(4, Math.max(0, p))] ?? 5.6;
}

function domainCdFor(d: number) {
  return [0, 22, 18, 15][Math.min(3, Math.max(0, d))] ?? 22;
}

function redCdFor(rate: number) {
  return 1.15 / forgeRateMul(rate);
}

function blueCdFor(rate: number) {
  return 0.85 / forgeRateMul(rate);
}

function cleaveCdFor(rate: number) {
  return 0.72 / forgeRateMul(rate);
}

function flameCdFor(f: number) {
  return [0, 3.1, 2.8, 2.5, 2.2][Math.min(4, Math.max(0, f))] ?? 3.1;
}

function rayCdFor(lv: number) {
  return [0, 1.55, 1.4, 1.25, 1.1][Math.min(4, Math.max(0, lv))] ?? 1.55;
}

function beamCdFor(lv: number) {
  return [0, 1.7, 1.5, 1.35, 1.2][Math.min(4, Math.max(0, lv))] ?? 1.7;
}

function punchCdFor(rate: number) {
  return 0.34 / forgeRateMul(rate);
}

function slashCdFor(rate: number) {
  return 0.4 / forgeRateMul(rate);
}

function angDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len <= 0 ? 0 : clamp(((px - ax) * dx + (py - ay) * dy) / len, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

export type HudSnap = {
  hp: number;
  maxHp: number;
  xp: number;
  need: number;
  level: number;
  time: number;
  clearTime: number;
  kills: number;
  wave: number;
  paused: boolean;
  userPaused: boolean;
  over: boolean;
  won: boolean;
  picks: Offer[] | null;
  weps: { id: UpgradeId; lv: number }[];
  domainCd: number;
  domainMax: number;
  domainReady: boolean;
  dashCd: number;
  dashMax: number;
  dashReady: boolean;
  purpleCd: number;
  purpleMax: number;
  purpleReady: boolean;
  line: string;
  charId: CharId;
  skills: SkillSlot[];
  shell: number;
  shellLeak: boolean;
  bfWindow: number;
  bfBuff: number;
  activeName: string;
  activeCd: number;
  activeMax: number;
  activeReady: boolean;
  adapt: {
    rank: number;
    fill: number;
    need: number;
    focus: DmgKind | null;
    on: DmgKind | null;
    held: DmgKind | null;
    turns: number;
  } | null;
  anvilChain: number;
  forgeChain: boolean;
};

export type SkillSlot = {
  key: "Q" | "W" | "E" | "R";
  name: string;
  ready: boolean;
  unlocked: boolean;
  cd: number;
  max: number;
  rank: number;
};

export type HordeOpts = {
  extraStart?: boolean;
};

export class HordeSim {
  atlas: Atlas | null = null;
  ax = 0;
  ay = 0;
  stickX = 0;
  stickY = 0;
  injected: Set<string> | null = null;
  keys = new Set<string>();
  wantDomain = false;
  wantDash = false;
  wantSecondary = false;
  wantBurst = false;
  wantPurple = false;
  wantFire = false;
  hasMove = false;
  hasAim = false;
  tx = 0;
  ty = 0;
  aimX = 0;
  aimY = 0;
  moveStickX = 0;
  moveStickY = 0;
  fireStickX = 0;
  fireStickY = 0;
  charId: CharId = "gojo";

  x = WORLD / 2;
  y = WORLD / 2;
  vx = 0;
  vy = 0;
  facing = -Math.PI / 2;
  yaw = 0;
  r = 16;
  hp = 100;
  maxHp = 100;
  invuln = 0;
  pickup = 56;
  speed = 210;
  crit = 0.08;
  critDmg = 2.1;
  regen = 0;
  lv = 1;
  xp = 0;
  need = xpNeed(0);
  kills = 0;
  time = 0;
  anim = 0;
  freeze = 0;
  paused = false;
  userPaused = false;
  over = false;
  won = false;
  recorded = false;
  extraStart = false;
  usedDomain = false;
  sawBoss = false;
  shake = 0;
  line = "吾乃最强。";
  weps: Record<UpgradeId, number> = emptyWeps();
  cd: Record<string, number> = {};
  domainCd = 0;
  dashCd = 0;
  purpleCd = 0;
  dashT = 0;
  dashDur = 0.1;
  dx0 = 0;
  dy0 = 0;
  dx1 = 0;
  dy1 = 0;
  picks: Offer[] | null = null;
  lastPick: UpgradeId | null = null;
  camx = WORLD / 2;
  camy = WORLD / 2;
  spawnAcc = 0;
  nextBoss = 108;
  nextChamp = 28;
  nextBlood = 70;
  hitstop = 0;
  healAcc = 0;
  trail: { x: number; y: number; flip: boolean }[] = [];
  chains: Chain[] = [];
  lasers: Laser[] = [];
  fields: Field[] = [];
  li = 0;
  fi2 = 0;
  hazards: Hazard[] = [];
  hi = 0;
  bfWindow = 0;
  bfBuff = 0;
  bfCd = 0;
  bfHits = 0;
  bfPunch = 0;
  bfArmedSecond = false;
  bfCharges = 0;
  slashQuiet = 0;
  slashArmed = false;
  overload = 0;
  shellLeak = false;
  shellPress = 0;
  shellLoad = 0;
  shellCap = 5.2;
  fieldAcc = 0;
  adaptFill = 0;
  adaptFocus: DmgKind | null = null;
  adaptOn: DmgKind | null = null;
  adaptHeld: DmgKind | null = null;
  adaptTurns = 0;
  adaptPulse = 0;
  lastHurt: DmgKind | null = null;
  anvilChain = 0;
  pendingShops = 0;
  forgeChain = false;
  forgeRng: () => number = Math.random;
  punchHits = 0;

  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  gems: Gem[] = [];
  fx: Fx[] = [];
  ei = 0;
  bi = 0;
  gi = 0;
  fi = 0;

  constructor(charId: CharId = "gojo", opts?: HordeOpts) {
    this.reset(charId, opts);
  }

  reset(charId?: CharId, opts?: HordeOpts) {
    if (charId) this.charId = charId;
    if (opts?.extraStart != null) this.extraStart = opts.extraStart;
    const ch = CHAR_MAP[this.charId];
    this.x = WORLD / 2;
    this.y = WORLD / 2;
    this.vx = 0;
    this.vy = 0;
    this.facing = -Math.PI / 2;
    this.yaw = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.invuln = 0;
    this.pickup = 56;
    this.speed = 200;
    this.crit = 0.08;
    this.critDmg = 2.2;
    this.regen = 0;
    this.lv = 1;
    this.xp = 0;
    this.need = xpNeed(0);
    this.kills = 0;
    this.time = 0;
    this.anim = 0;
    this.freeze = 0;
    this.paused = false;
    this.userPaused = false;
    this.over = false;
    this.won = false;
    this.recorded = false;
    this.usedDomain = false;
    this.sawBoss = false;
    this.shake = 0;
    this.line = ch.line;
    this.weps = emptyWeps();
    if (this.charId === "gojo") {
      this.weps.limitless = 1;
      this.weps.fist = 1;
    } else {
      this.weps.slash = 1;
      this.weps.cleave = 1;
    }
    if (this.extraStart && this.charId === "gojo") this.weps.red = 1;
    this.anvilChain = 0;
    this.pendingShops = 0;
    this.forgeChain = false;
    this.punchHits = 0;
    this.cd = {};
    this.domainCd = 0;
    this.dashCd = 0;
    this.purpleCd = 0;
    this.dashT = 0;
    this.picks = null;
    this.lastPick = null;
    this.camx = this.x;
    this.camy = this.y;
    this.spawnAcc = 0;
    this.nextBoss = 108;
    this.nextChamp = 28;
    this.nextBlood = 70;
    this.hitstop = 0;
    this.healAcc = 0;
    this.trail = [];
    this.chains = [];
    this.lasers = Array.from({ length: MAX_LASER }, () => this.emptyLaser());
    this.fields = Array.from({ length: MAX_FIELD }, () => this.emptyField());
    this.hazards = Array.from({ length: MAX_HAZ }, () => this.emptyHaz());
    this.li = 0;
    this.fi2 = 0;
    this.hi = 0;
    this.bfWindow = 0;
    this.bfBuff = 0;
    this.bfCd = 0;
    this.bfHits = 0;
    this.bfPunch = 0;
    this.bfArmedSecond = false;
    this.bfCharges = 0;
    this.slashQuiet = 0;
    this.slashArmed = false;
    this.overload = 0;
    this.shellLeak = false;
    this.shellPress = 0;
    this.shellLoad = 0;
    this.shellCap = 5.2;
    this.fieldAcc = 0;
    this.adaptFill = 0;
    this.adaptFocus = null;
    this.adaptOn = null;
    this.adaptHeld = null;
    this.adaptTurns = 0;
    this.adaptPulse = 0;
    this.lastHurt = null;
    this.wantDomain = false;
    this.wantDash = false;
    this.wantSecondary = false;
    this.wantBurst = false;
    this.wantPurple = false;
    this.wantFire = false;
    this.hasMove = false;
    this.hasAim = false;
    this.tx = this.x;
    this.ty = this.y;
    this.aimX = this.x;
    this.aimY = this.y;
    this.moveStickX = 0;
    this.moveStickY = 0;
    this.fireStickX = 0;
    this.fireStickY = 0;
    this.enemies = Array.from({ length: MAX_E }, () => this.emptyE());
    this.bullets = Array.from({ length: MAX_B }, () => this.emptyB());
    this.gems = Array.from({ length: MAX_G }, () => ({ alive: false, x: 0, y: 0, v: 1 }));
    this.fx = Array.from({ length: MAX_FX }, () => this.emptyFx());
    this.ei = 0;
    this.bi = 0;
    this.gi = 0;
    this.fi = 0;
    this.applyStats();
  }

  emptyE(): Enemy {
    return {
      alive: false,
      kind: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 12,
      hp: 1,
      max: 1,
      dmg: 1,
      xp: 1,
      spd: 40,
      hurt: 0,
      seed: Math.random(),
      elite: false,
      mark: 0,
      atk: 0.8,
    };
  }
  emptyB(): Bullet {
    return {
      alive: false,
      kind: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 6,
      dmg: 1,
      life: 1,
      pierce: 0,
      homing: 0,
    };
  }
  emptyFx(): Fx {
    return {
      alive: false,
      x: 0,
      y: 0,
      r: 8,
      life: 0.4,
      max: 0.4,
      kind: 0,
      text: "",
      crit: false,
      ang: 0,
    };
  }

  emptyLaser(): Laser {
    return {
      alive: false,
      hue: 0,
      ang: 0,
      sweep: 0,
      len: 220,
      wide: 8,
      life: 0,
      max: 0.5,
      dmg: 8,
      acc: 0,
    };
  }

  emptyField(): Field {
    return { alive: false, x: 0, y: 0, r: 40, life: 0, dmg: 6, acc: 0, hue: 0 };
  }

  emptyHaz(): Hazard {
    return {
      alive: false,
      style: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 6,
      dmg: 8,
      life: 0,
      ang: 0,
      len: 0,
      kind: "projectile",
    };
  }

  setKeys(codes: string[]) {
    this.injected = new Set(codes);
  }

  getYaw() {
    return this.yaw;
  }
  getSpeed() {
    return Math.hypot(this.vx, this.vy);
  }
  getX() {
    return this.x;
  }

  hud(): HudSnap {
    const weps = (Object.keys(this.weps) as UpgradeId[])
      .filter((id) => this.weps[id] > 0)
      .map((id) => ({ id, lv: this.weps[id] }));
    const P = this.weps.purple;
    const D = this.weps.domain;
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      xp: this.xp,
      need: this.need,
      level: this.lv,
      time: this.time,
      clearTime: CLEAR_TIME,
      kills: this.kills,
      wave: 1 + Math.floor(this.time / 20),
      paused: this.paused,
      userPaused: this.userPaused,
      over: this.over,
      won: this.won,
      picks: this.picks,
      weps,
      domainCd: this.domainCd,
      domainMax: domainCdFor(D),
      domainReady: D > 0 && this.domainCd <= 0,
      dashCd: this.dashCd,
      dashMax: DASH_COOLDOWN,
      dashReady: this.dashCd <= 0 && this.dashT <= 0,
      purpleCd: this.purpleCd,
      purpleMax: purpleCdFor(P),
      purpleReady: P > 0 && this.purpleCd <= 0,
      line: this.line,
      charId: this.charId,
      skills: this.skillSlots(),
      shell: this.shellCap > 0 ? this.shellLoad / this.shellCap : 0,
      shellLeak: this.shellLeak,
      bfWindow: this.bfWindow,
      bfBuff: this.bfBuff,
      activeName: this.charId === "gojo" ? "拳脚" : "解",
      activeCd: this.charId === "gojo" ? (this.cd.punch ?? 0) : (this.cd.slash ?? 0),
      activeMax: this.charId === "gojo" ? punchCdFor(this.weps.rate) : slashCdFor(this.weps.rate),
      activeReady:
        this.charId === "gojo"
          ? (this.cd.punch ?? 0) <= 0
          : this.weps.slash > 0 && (this.cd.slash ?? 0) <= 0,
      anvilChain: this.anvilChain,
      forgeChain: this.forgeChain,
      adapt:
        this.charId === "sukuna" && this.weps.adapt > 0
          ? {
              rank: this.weps.adapt,
              fill: this.adaptFill,
              need: this.adaptNeed(),
              focus: this.adaptFocus,
              on: this.adaptOn,
              held: this.adaptHeld,
              turns: this.adaptTurns,
            }
          : null,
    };
  }

  skillSlots(): SkillSlot[] {
    const gojo = this.charId === "gojo";
    const wId: UpgradeId = gojo ? "red" : "cleave";
    const eId: UpgradeId = gojo ? "purple" : "flame";
    const wLv = this.weps[wId];
    const eLv = this.weps[eId];
    const wMax = gojo ? redCdFor(this.weps.rate) : cleaveCdFor(this.weps.rate);
    const eMax = gojo ? purpleCdFor(eLv) : flameCdFor(eLv);
    const wCd = this.cd[wId] ?? 0;
    const eCd = gojo ? this.purpleCd : (this.cd.flame ?? 0);
    const ch = CHAR_MAP[this.charId];
    return [
      {
        key: "Q",
        name: ch.dashName,
        unlocked: true,
        ready: this.dashCd <= 0 && this.dashT <= 0,
        cd: this.dashCd,
        max: DASH_COOLDOWN,
        rank: 0,
      },
      {
        key: "W",
        name: gojo ? UPGRADE_MAP[wId].name : "捌",
        unlocked: wLv > 0,
        ready: wLv > 0 && wCd <= 0,
        cd: wCd,
        max: wMax,
        rank: wLv,
      },
      {
        key: "E",
        name: UPGRADE_MAP[eId].name,
        unlocked: eLv > 0,
        ready: eLv > 0 && eCd <= 0,
        cd: eCd,
        max: eMax,
        rank: eLv,
      },
      {
        key: "R",
        name: ch.domainName.slice(0, 2),
        unlocked: this.weps.domain > 0,
        ready: this.weps.domain > 0 && this.domainCd <= 0,
        cd: this.domainCd,
        max: domainCdFor(this.weps.domain),
        rank: this.weps.domain,
      },
    ];
  }

  togglePause() {
    if (this.over || this.picks) return;
    this.userPaused = !this.userPaused;
    this.paused = this.userPaused;
    this.wantDash = false;
    this.wantSecondary = false;
    this.wantBurst = false;
    this.wantPurple = false;
    this.wantDomain = false;
    this.wantFire = false;
  }

  choose(id: UpgradeId) {
    if (!this.picks) return;
    const offer = this.picks.find((p) => p.id === id);
    const def = UPGRADE_MAP[id];
    if (!def) return;
    const lv = (this.weps[id] ?? 0) + 1;
    this.weps[id] = Math.min(def.max, lv);
    this.lastPick = id;
    this.applyStats();
    this.maybeGrantSixRed();
    sfxLevel();
    if (shopClosesOn(id)) {
      this.line = offer ? `${offer.name}。质变收口。` : `${def.name}。收口。`;
      this.closeShop();
      return;
    }
    if (isAnvilId(id)) {
      if (this.anvilChain >= MAX_ANVIL_CHAIN) {
        this.line = `${def.name}。砧满了。`;
        this.closeShop();
        return;
      }
      if (shouldChainAnvil(this.anvilChain, this.forgeRng)) {
        this.anvilChain += 1;
        this.forgeChain = true;
        this.line = `${def.name}。连抽。再锻。`;
        this.offer({ resume: true });
        return;
      }
      this.line = `${def.name}。专属入砧。`;
      this.closeShop();
      return;
    }
    this.closeShop();
  }

  closeShop() {
    this.picks = null;
    this.anvilChain = 0;
    this.forgeChain = false;
    this.pendingShops = Math.max(0, this.pendingShops - 1);
    if (this.pendingShops > 0) this.offer();
    else this.paused = this.userPaused;
  }

  applyStats() {
    const eyes = this.weps.eyes + this.weps.sense;
    const f = this.weps.flash;
    const r = this.weps.rct;
    const s = this.weps.speed;
    this.pickup = 52 + eyes * 34;
    this.crit = Math.min(0.22, 0.06 + f * 0.03);
    this.critDmg = 2.1 + f * 0.12;
    this.regen = r * 2.2;
    this.maxHp = levelHp(this.lv) + r * 18;
    this.hp = Math.min(this.maxHp, this.hp);
    this.speed = 200 * (1 + s * 0.2);
    this.shellCap = this.shellCapacity();
  }

  adaptNeed() {
    const a = this.weps.adapt;
    return a >= 3 ? 3 : a >= 2 ? 3.4 : 4.2;
  }

  flashGap() {
    return Math.max(0.22, 0.64 - this.weps.flash * 0.12);
  }

  flashWindow() {
    return 0.18 + this.weps.flash * 0.14;
  }

  flashBuff() {
    return 0.9 + this.weps.flash * 0.4;
  }

  bfMult() {
    return 1.65 + this.weps.flash * 0.42;
  }

  verbDmg(base: number) {
    return base * forgeDamageMul(this.weps.power) * shapeMul(this.weps);
  }

  maybeGrantSixRed() {
    if (this.charId !== "gojo" || this.weps.red >= 1) return;
    if (this.lv >= 2 || this.time >= 20) {
      this.weps.red = 1;
      this.line = "六赫。自己会打。";
    }
  }

  shellRadius() {
    if (this.charId !== "gojo" || this.weps.limitless < 1) return 0;
    return 56 + this.weps.infRad * 14 + this.weps.linger * 8 + this.weps.size * 4;
  }

  shellCapacity() {
    if (this.charId !== "gojo") return 1;
    return 24 + this.weps.infCap * 10;
  }

  shellRegen() {
    if (this.charId !== "gojo") return 1;
    return 16 + this.weps.infCap * 5;
  }

  fieldDps() {
    const punchDps = this.verbDmg(PUNCH_BASE) / punchCdFor(this.weps.rate);
    return punchDps * 0.2;
  }

  enemyMass(e: Enemy) {
    if (e.kind === 3) return 5;
    if (e.kind === 2) return e.elite ? 5 : 3.4;
    if (e.elite) return 4;
    const late = this.time / 90 * 0.2 + (this.time > 45 && fieldMuts(this.weps) < 1 ? 0.35 : 0);
    if (e.kind === 1) return 0.55 + late;
    return 0.22 + late;
  }

  sureHit(e: Enemy) {
    return e.elite || e.kind === 2 || e.kind === 3;
  }

  fodder(e: Enemy) {
    return !this.sureHit(e);
  }

  cleaveCut(e: Enemy) {
    const pct = (CLEAVE_PCT + 0.004 * this.weps.power) * shapeMul(this.weps);
    let harden = 1;
    if (e.kind === 1) harden = 0.74;
    if (e.kind === 2) harden = 0.58;
    if (e.kind === 3) harden = 0.15;
    if (e.elite && e.kind !== 3) harden *= 0.5;
    return e.max * pct * harden;
  }

  adaptFactor(kind: DmgKind) {
    const r = this.weps.adapt;
    if (r < 1) return 1;
    if (this.adaptOn === kind) return [1, 0.45, 0.32, 0.22][Math.min(3, r)] ?? 0.45;
    if (r >= 3 && this.adaptHeld === kind) return 0.55;
    return 1;
  }

  adaptHitBonus(e: Enemy) {
    const r = this.weps.adapt;
    if (r < 1) return 1;
    const kinds: DmgKind[] = [];
    if (this.adaptOn) kinds.push(this.adaptOn);
    if (r >= 3 && this.adaptHeld) kinds.push(this.adaptHeld);
    let m = 1;
    const add = 0.28 + r * 0.12;
    for (const k of kinds) {
      if (k === "contact" && (e.kind === 0 || e.kind === 1)) m += add;
      if (k === "projectile" && e.kind === 2) m += add;
      if ((k === "laser" || k === "explosion") && e.kind === 3) m += add;
    }
    return m;
  }

  feedAdapt(kind: DmgKind) {
    if (this.weps.adapt < 1) return;
    if (this.adaptOn === kind) return;
    if (this.adaptFocus && this.adaptFocus !== kind) {
      this.adaptFill *= this.weps.adapt >= 2 ? 0.35 : 0.08;
      this.adaptFocus = kind;
      this.line = "轮转。换一种。";
    } else {
      this.adaptFocus = kind;
    }
    this.adaptFill += 1;
    if (this.adaptFill >= this.adaptNeed()) this.turnWheel(kind);
  }

  turnWheel(kind: DmgKind) {
    if (this.weps.adapt >= 3 && this.adaptOn && this.adaptOn !== kind) this.adaptHeld = this.adaptOn;
    this.adaptOn = kind;
    this.adaptFill = 0;
    this.adaptFocus = null;
    this.adaptPulse = 1.1;
    this.adaptTurns += 1;
    this.shake = Math.max(this.shake, 7);
    this.line = `适应。${DMG_KIND_NAME[kind]}。`;
    this.pushFx(this.x, this.y, 52, 0.4, 20, "轮", true);
  }

  openBfWindow() {
    if (this.weps.flash < 1) return;
    this.bfWindow = Math.max(this.bfWindow, this.flashWindow());
  }

  tryBlackFlash(e: Enemy, tag: HitTag) {
    if (this.weps.flash < 1) return false;
    if (this.bfCd > 0 && this.bfCharges <= 0) return false;
    let open = this.bfWindow > 0;
    if (tag === "rim" || tag === "dash") open = true;
    if ((tag === "slash" || tag === "cleave") && this.slashArmed) open = true;
    if (!open) {
      if (tag === "slash" || tag === "cleave") {
        this.slashQuiet = 0;
        this.slashArmed = false;
      }
      return false;
    }
    this.triggerBlackFlash(e);
    if (tag === "slash" || tag === "cleave") {
      this.slashQuiet = 0;
      this.slashArmed = false;
    }
    return true;
  }

  triggerBlackFlash(e: Enemy) {
    const extra = this.bfCharges > 0;
    this.bfCharges = 0;
    this.bfWindow = 0;
    this.bfBuff = this.flashBuff();
    this.bfCd = Math.max(1.35, 2.55 - this.weps.flash * 0.4);
    if (this.weps.flash >= 3 && !extra) this.bfArmedSecond = true;
    this.bfHits += 1;
    this.bfPunch = 1;
    this.shake = Math.max(this.shake, 18);
    this.hitstop = Math.max(this.hitstop, 0.14);
    this.pushFx(e.x, e.y, 50, 0.42, 5, "黑闪", true);
    this.pushFx(this.x, this.y, 90, 0.18, 19, "", true);
    this.line = "对上了。";
    sfxCrit();
  }

  aimAng() {
    const stick = Math.hypot(this.fireStickX, this.fireStickY);
    if (stick > 0.22) return Math.atan2(this.fireStickY, this.fireStickX);
    if (this.hasAim) return Math.atan2(this.aimY - this.y, this.aimX - this.x);
    return this.facing;
  }

  setAimWorld(x: number, y: number) {
    this.hasAim = true;
    this.aimX = x;
    this.aimY = y;
  }

  setAimFromScreen(sx: number, sy: number, w: number, h: number) {
    this.setAimWorld(this.camx - w / 2 + sx, this.camy - h / 2 + sy);
  }

  setMoveStick(x: number, y: number) {
    this.moveStickX = x;
    this.moveStickY = y;
  }

  setFireStick(x: number, y: number) {
    this.fireStickX = x;
    this.fireStickY = y;
    if (Math.hypot(x, y) > 0.25) {
      this.wantFire = true;
      this.hasAim = true;
      this.aimX = this.x + x * 420;
      this.aimY = this.y + y * 420;
    } else {
      this.wantFire = false;
    }
  }

  castActive() {
    const ang = this.aimAng();
    this.facing = ang;
    this.yaw = Math.atan2(-Math.cos(ang), -Math.sin(ang));
    if (this.charId === "gojo") this.firePunch(ang);
    else this.fireSlash(ang);
  }

  firePunch(ang: number) {
    if (!this.readyCd("punch", punchCdFor(this.weps.rate))) return;
    this.punchHits += 1;
    const reach = 48 + this.weps.linger * 12;
    const wide = 0.7 + this.weps.size * 0.1;
    const dmg = this.verbDmg(PUNCH_BASE);
    const focus = this.weps.focus >= 1;
    const extra = focus ? 0 : this.weps.more;
    const forks = focus ? 0 : this.weps.split;
    for (let i = 0; i <= extra; i++) this.punchStrike(ang, reach, wide, dmg);
    for (let i = 0; i < forks; i++) {
      const off = (i - (forks - 1) / 2) * 0.32;
      this.punchStrike(ang + off, reach, wide, dmg * 0.7);
    }
    this.pushFx(this.x + Math.cos(ang) * 22, this.y + Math.sin(ang) * 22, 18 + this.weps.size * 4, 0.16, 1, "", false, ang);
    sfxHit();
  }

  punchStrike(ang: number, reach: number, wide: number, dmg: number) {
    let hit: Enemy | null = null;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > reach + e.r) continue;
      if (angDiff(Math.atan2(dy, dx), ang) > wide) continue;
      this.hurtEnemy(e, dmg, (dx / (d || 1)) * 40, (dy / (d || 1)) * 40, false, "none");
      hit = e;
    }
    if (hit && this.weps.chain > 0) {
      this.queueHop(hit.x, hit.y, this.weps.chain, dmg * 0.75, 1, 96 + this.weps.linger * 18);
    }
  }

  fireBlue() {
    if (this.weps.blue < 1) return;
    if (!this.readyCd("blue", blueCdFor(this.weps.rate))) return;
    const t = this.nearest(this.x, this.y);
    const ang = t ? Math.atan2(t.y - this.y, t.x - this.x) : this.facing;
    const focus = this.weps.focus >= 1;
    const n = focus ? 1 : 1 + this.weps.more;
    const dmg = this.verbDmg(BLUE_BASE);
    const size = (focus ? 16 : 8) * (1 + this.weps.size * 0.18);
    const life = 2.2 + this.weps.linger * 0.2;
    const forks = focus ? 0 : this.weps.split;
    for (let i = 0; i < n; i++) {
      const a = ang + (i - (n - 1) / 2) * 0.18;
      this.shot(0, this.x, this.y, Math.cos(a) * 280, Math.sin(a) * 280, dmg, life, 0, 0.45, size);
    }
    for (let i = 0; i < forks; i++) {
      const a = ang + (i - (forks - 1) / 2) * 0.28;
      this.shot(0, this.x, this.y, Math.cos(a) * 260, Math.sin(a) * 260, dmg * 0.7, life, 0, 0.4, size * 0.85);
    }
  }

  fireSlash(ang: number) {
    if (this.weps.slash < 1) return;
    if (!this.readyCd("slash", slashCdFor(this.weps.rate))) return;
    const focus = this.weps.focus >= 1;
    const n = focus ? 1 : 1 + this.weps.more;
    const dmg = this.verbDmg(SLASH_BASE);
    const size = (focus ? 20 : 12) * (1 + this.weps.size * 0.18);
    const life = 0.42 + this.weps.linger * 0.08;
    const forks = focus ? 0 : this.weps.split;
    for (let i = 0; i < n; i++) {
      const a = ang + (i - (n - 1) / 2) * 0.2;
      this.shot(4, this.x, this.y, Math.cos(a) * 520, Math.sin(a) * 520, dmg, life, 0, 0, size);
    }
    for (let i = 0; i < forks; i++) {
      const a = ang + (i - (forks - 1) / 2) * 0.3;
      this.shot(4, this.x, this.y, Math.cos(a) * 500, Math.sin(a) * 500, dmg * 0.7, life, 0, 0, size * 0.85);
    }
  }

  hurtPlayer(raw: number, kind: DmgKind) {
    if (this.over) return;
    const dmg = raw * this.adaptFactor(kind);
    this.feedAdapt(kind);
    this.lastHurt = kind;
    this.hp -= dmg;
    this.invuln = kind === "contact" ? 0.7 : 0.42;
    this.shake = Math.max(this.shake, kind === "contact" ? 8 : 6);
    sfxHurt();
    this.line = CHAR_MAP[this.charId].hitLine;
  }

  finish(won: boolean) {
    if (this.over) return;
    this.over = true;
    this.won = won;
    this.hp = won ? this.hp : 0;
    if (won) this.time = Math.max(this.time, CLEAR_TIME);
    this.paused = false;
    this.userPaused = false;
    this.picks = null;
    this.line = won ? "时间到。还站着。" : "……就这？不，再来。";
    sfxOver(won);
  }

  tick(dt: number) {
    if (this.over) return;
    if (this.paused) {
      this.wantDash = false;
      this.wantSecondary = false;
      this.wantBurst = false;
      this.wantPurple = false;
      this.wantDomain = false;
      this.wantFire = false;
      return;
    }
    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      this.fxStep(Math.min(dt, 0.05));
      return;
    }
    const step = Math.min(dt, 0.05);
    this.time += step;
    this.maybeGrantSixRed();
    this.anim += step;
    this.invuln = Math.max(0, this.invuln - step);
    this.freeze = Math.max(0, this.freeze - step);
    this.domainCd = Math.max(0, this.domainCd - step);
    this.dashCd = Math.max(0, this.dashCd - step);
    this.purpleCd = Math.max(0, this.purpleCd - step);
    this.bfWindow = Math.max(0, this.bfWindow - step);
    const hadBuff = this.bfBuff > 0;
    this.bfBuff = Math.max(0, this.bfBuff - step);
    if (hadBuff && this.bfBuff <= 0 && this.bfArmedSecond) {
      this.bfArmedSecond = false;
      this.bfCharges = 1;
      this.bfCd = 0.12;
    }
    this.bfCd = Math.max(0, this.bfCd - step);
    this.bfPunch = Math.max(0, this.bfPunch - step * 4.2);
    this.adaptPulse = Math.max(0, this.adaptPulse - step);
    this.slashQuiet += step;
    if (this.weps.flash > 0 && this.slashQuiet >= this.flashGap()) this.slashArmed = true;
    for (const k of Object.keys(this.cd)) {
      this.cd[k] = Math.max(0, (this.cd[k] ?? 0) - step);
    }
    if (this.regen > 0 && this.hp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.regen * step);
      this.healAcc += step;
      if (this.healAcc > 0.55) {
        this.healAcc = 0;
        const amt = this.regen * 0.55;
        this.pushFx(this.x, this.y - 36, 0, 0.55, 6, `+${amt.toFixed(0)}`, false);
      }
    }

    this.readMove();
    if (this.wantDash) this.castDash();
    this.wantDash = false;
    if (this.wantSecondary) this.castW();
    this.wantSecondary = false;
    if (this.wantBurst || this.wantPurple) this.castE();
    this.wantBurst = false;
    this.wantPurple = false;
    if (this.wantDomain) this.castDomain();
    this.wantDomain = false;
    if (this.wantFire || Math.hypot(this.fireStickX, this.fireStickY) > 0.25) this.castActive();

    if (this.dashT > 0) {
      this.stepDash(step);
    } else {
      const mag = Math.hypot(this.ax, this.ay);
      if (mag > 0.12) {
        const nx = this.ax / mag;
        const ny = this.ay / mag;
        this.vx = nx * this.speed;
        this.vy = ny * this.speed;
        this.facing = Math.atan2(this.vy, this.vx);
        this.yaw = Math.atan2(-this.vx, -this.vy);
      } else {
        this.vx = 0;
        this.vy = 0;
      }
      this.x = clamp(this.x + this.vx * step, 40, WORLD - 40);
      this.y = clamp(this.y + this.vy * step, 40, WORLD - 40);
    }
    if (this.wantFire || Math.hypot(this.fireStickX, this.fireStickY) > 0.25) {
      this.facing = this.aimAng();
      this.yaw = Math.atan2(-Math.cos(this.facing), -Math.sin(this.facing));
    }
    if (this.getSpeed() > 40) {
      this.trail.unshift({ x: this.x, y: this.y, flip: Math.cos(this.facing) < 0 });
      const cap = 3 + this.weps.speed * 2;
      if (this.trail.length > cap) this.trail.length = cap;
    } else if (this.trail.length) {
      this.trail.pop();
    }
    this.camx += (this.x - this.camx) * Math.min(1, 7 * step);
    this.camy += (this.y - this.camy) * Math.min(1, 7 * step);

    this.spawn(step);
    this.moveEnemies(step);
    this.fire(step);
    this.moveBullets(step);
    this.stepChains(step);
    this.stepLasers(step);
    this.stepFields(step);
    this.stepHazards(step);
    this.stepShell(step);
    this.gemsStep(step);
    this.fxStep(step);
    this.contact();
    this.shake = Math.max(0, this.shake - step * 20);

    if (this.hp <= 0 && !this.over) this.finish(false);
    else if (this.time >= CLEAR_TIME && !this.over) this.finish(true);
  }

  setMoveTarget(x: number, y: number) {
    this.hasMove = true;
    this.tx = clamp(x, 40, WORLD - 40);
    this.ty = clamp(y, 40, WORLD - 40);
  }

  setMoveFromScreen(sx: number, sy: number, w: number, h: number) {
    this.setMoveTarget(this.camx - w / 2 + sx, this.camy - h / 2 + sy);
  }

  clearMove() {
    this.hasMove = false;
  }

  readyCd(id: string, base: number) {
    if ((this.cd[id] ?? 0) > 0) return false;
    this.cd[id] = base;
    return true;
  }

  readMove() {
    const src = this.injected ?? this.keys;
    if (src.has("KeyQ")) this.wantDash = true;
    if (src.has("KeyW")) this.wantSecondary = true;
    if (src.has("KeyE")) this.wantBurst = true;
    if (src.has("KeyR")) this.wantDomain = true;

    const stick = Math.hypot(this.moveStickX, this.moveStickY);
    if (stick > 0.18) {
      this.hasMove = false;
      this.ax = this.moveStickX;
      this.ay = this.moveStickY;
      return;
    }

    let ax = 0;
    let ay = 0;
    if (src.has("ArrowLeft")) ax -= 1;
    if (src.has("ArrowRight")) ax += 1;
    if (src.has("ArrowUp")) ay -= 1;
    if (src.has("ArrowDown")) ay += 1;
    const keys = Math.hypot(ax, ay);
    if (keys > 0.12) {
      this.hasMove = false;
      if (keys > 1) {
        ax /= keys;
        ay /= keys;
      }
      this.ax = ax;
      this.ay = ay;
      return;
    }

    if (this.hasMove) {
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      const d = Math.hypot(dx, dy);
      if (d <= ARRIVE) {
        this.hasMove = false;
        this.ax = 0;
        this.ay = 0;
        return;
      }
      this.ax = dx / d;
      this.ay = dy / d;
      return;
    }

    this.ax = 0;
    this.ay = 0;
  }

  castW() {
    if (this.charId === "gojo") this.volleyRed();
    else this.volleyCleave();
  }

  castE() {
    if (this.charId === "gojo") this.castPurple();
    else this.volleyFlame();
  }

  volleyRed() {
    if (this.weps.red < 1) return;
    if (!this.readyCd("red", redCdFor(this.weps.rate))) return;
    const t = this.nearest(this.x, this.y);
    const baseAng = t ? Math.atan2(t.y - this.y, t.x - this.x) : this.facing;
    const focus = this.weps.focus >= 1;
    const n = focus ? 1 : 6 + this.weps.more;
    const dmg = this.verbDmg(RED_BASE);
    const size = (focus ? 10 : 4.2) * (1 + this.weps.size * 0.18);
    const life = 0.55 + this.weps.linger * 0.06;
    const forks = focus ? 0 : this.weps.split;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * (focus ? 0 : 0.16);
      const ang = baseAng + spread;
      this.shot(1, this.x, this.y, Math.cos(ang) * 430, Math.sin(ang) * 430, dmg, life, 0, 0, size);
    }
    for (let i = 0; i < forks; i++) {
      const ang = baseAng + (i - (forks - 1) / 2) * 0.28;
      this.shot(1, this.x, this.y, Math.cos(ang) * 400, Math.sin(ang) * 400, dmg * 0.7, life, 0, 0, size * 0.85);
    }
  }

  volleyCleave() {
    if (this.weps.cleave < 1) return;
    if (!this.readyCd("cleave", cleaveCdFor(this.weps.rate))) return;
    const rad = 54 + this.weps.linger * 16 + this.weps.size * 6;
    const cap = this.weps.focus >= 1 ? 1 : 1 + this.weps.more;
    this.cleave(rad, cap);
  }

  volleyFlame() {
    const F = this.weps.flame;
    if (F < 1) return;
    if (!this.readyCd("flame", flameCdFor(F))) return;
    const t = this.nearest(this.x, this.y);
    const ang = t ? Math.atan2(t.y - this.y, t.x - this.x) : this.facing;
    const n = F >= 3 ? 2 : 1;
    const size = 8 + F * 2.4;
    for (let i = 0; i < n; i++) {
      const off = n === 1 ? 0 : (i - 0.5) * 0.22;
      this.shot(
        5,
        this.x,
        this.y,
        Math.cos(ang + off) * 400,
        Math.sin(ang + off) * 400,
        22 + F * 7,
        0.9,
        0,
        0,
        size,
      );
    }
    if (F >= 2) {
      this.spawnLaser(2, ang, 0.15, 240 + F * 30, 8 + F * 2.5, 0.28 + F * 0.04, 16 + F * 5);
    }
    sfxSkill("red");
  }

  spawn(dt: number) {
    const t = this.time;
    const late = t > 100 ? (t - 100) * 0.09 : 0;
    const rate = t < 22 ? 1.55 + t * 0.035 : 2.05 + t * 0.068 + late;
    this.spawnAcc += dt * rate;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      let kind: Kind = 0;
      const roll = Math.random();
      if (t > 70 && roll < 0.14) kind = 2;
      else if (t > 24 && roll < 0.36) kind = 1;
      else if (t > 48 && roll < 0.2) kind = 2;
      this.birth(kind, { near: t > 18 && Math.random() < 0.45 });
    }
    if (t >= this.nextChamp) {
      this.birth(1, { elite: true, near: true });
      this.nextChamp += 46;
      this.line = "众口。别被围住。";
    }
    if (t >= this.nextBlood) {
      this.birth(2, { elite: true, near: true });
      this.nextBlood += 52;
      this.line = "血涂。屠宰场自己站起来了。";
    }
    if (t >= this.nextBoss) {
      this.birth(3, { near: true });
      this.nextBoss += 55;
      this.sawBoss = true;
      this.shake = Math.max(this.shake, 12);
      this.line = "灾核。别眨眼。";
    }
  }

  birth(kind: Kind, opts?: { elite?: boolean; near?: boolean }) {
    let e: Enemy | null = null;
    for (let i = 0; i < MAX_E; i++) {
      const idx = (this.ei + i) % MAX_E;
      if (!this.enemies[idx]!.alive) {
        e = this.enemies[idx]!;
        this.ei = idx + 1;
        break;
      }
    }
    if (!e) return;
    const k = KINDS[kind]!;
    let x = 0;
    let y = 0;
    if (opts?.near) {
      const a = Math.random() * Math.PI * 2;
      const dist = rand(380, 620);
      x = clamp(this.x + Math.cos(a) * dist, 20, WORLD - 20);
      y = clamp(this.y + Math.sin(a) * dist, 20, WORLD - 20);
    } else {
      const side = Math.floor(Math.random() * 4);
      const margin = 30;
      if (side === 0) {
        x = rand(0, WORLD);
        y = -margin;
      } else if (side === 1) {
        x = WORLD + margin;
        y = rand(0, WORLD);
      } else if (side === 2) {
        x = rand(0, WORLD);
        y = WORLD + margin;
      } else {
        x = -margin;
        y = rand(0, WORLD);
      }
    }
    const scale = 1 + this.time / 115 + (this.time > 120 ? (this.time - 120) * 0.01 : 0);
    const elite = Boolean(opts?.elite) || kind === 3;
    e.alive = true;
    e.kind = kind;
    e.x = x;
    e.y = y;
    e.r = k.r * (elite && kind !== 3 ? 1.35 : 1);
    e.max = k.hp * scale * (elite && kind !== 3 ? 3.4 : 1);
    e.hp = e.max;
    e.dmg = k.dmg * (elite ? 1.25 : 1);
    e.xp = k.xp * (elite && kind !== 3 ? 4 : 1);
    e.spd = k.spd * (elite && kind !== 3 ? 0.92 : 1);
    e.hurt = 0;
    e.seed = Math.random();
    e.elite = elite;
    e.mark = 0;
    e.atk = kind === 3 ? 1.35 : kind === 2 ? 0.85 + Math.random() * 0.4 : 2;
  }

  moveEnemies(dt: number) {
    const slow = this.freeze > 0 ? 0.08 : 1;
    const R = this.shellRadius();
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.hurt = Math.max(0, e.hurt - dt);
      e.mark = Math.max(0, e.mark - dt);
      e.atk = Math.max(0, e.atk - dt);
      const dx = this.x - e.x;
      const dy = this.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      let spd = e.spd * slow;
      const inField = R > 0 && d < R + e.r + 10;
      const blocked = inField && this.fodder(e) && !this.shellLeak;
      if (blocked) spd *= 0.22;
      else if (inField && this.sureHit(e) && !this.shellLeak) spd *= 0.88;
      e.vx = (dx / d) * spd;
      e.vy = (dy / d) * spd;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (blocked) {
        const nd = Math.hypot(e.x - this.x, e.y - this.y) || 1;
        if (nd < R - 2) {
          const nx = (e.x - this.x) / nd;
          const ny = (e.y - this.y) / nd;
          e.x = this.x + nx * (R - 1);
          e.y = this.y + ny * (R - 1);
        }
      }
      if (e.atk <= 0) this.enemyAttack(e);
    }
  }

  nearest(fromx: number, fromy: number): Enemy | null {
    let best: Enemy | null = null;
    let bd = 1e9;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = (e.x - fromx) ** 2 + (e.y - fromy) ** 2;
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  fire(_dt: number) {
    const aim = this.nearest(this.x, this.y);
    if (!this.wantFire && Math.hypot(this.fireStickX, this.fireStickY) < 0.25 && aim && Math.hypot(this.vx, this.vy) < 8) {
      this.facing = Math.atan2(aim.y - this.y, aim.x - this.x);
    }

    const tickCd = (id: string, base: number) => this.readyCd(id, base);

    if (this.weps.red > 0) this.volleyRed();
    if (this.weps.blue > 0) this.fireBlue();

    const C = this.weps.clone;
    if (C > 0) {
      const n = orbitCount(C);
      const dist = orbitDist(C, 48);
      for (let i = 0; i < n; i++) {
        const a = this.anim * (C >= 4 ? 2.8 : 2.2) + (i / n) * Math.PI * 2;
        this.orbitHit(this.x + Math.cos(a) * dist, this.y + Math.sin(a) * dist, 10 + C * 2.4, 11 + C * 2);
      }
    }

    if (this.weps.cleave > 0) this.volleyCleave();

    const Ray = this.weps.ray;
    if (Ray > 0 && tickCd("ray", rayCdFor(Ray))) {
      const t = aim ?? this.nearest(this.x, this.y);
      const ang = t ? Math.atan2(t.y - this.y, t.x - this.x) : this.facing;
      const life = Ray >= 3 ? 0.82 : 0.52;
      const wide = 7 + Ray * 3.2;
      const len = 260 + Ray * 40;
      this.spawnLaser(0, ang - 0.7, 2.4, len, wide, life, 9 + Ray * 3);
      if (Ray >= 4) this.spawnLaser(0, ang + 0.7, -2.4, len, wide * 0.85, life, 8 + Ray * 2);
      this.line = "六瞳。锁。";
    }

    const Bm = this.weps.beam;
    if (Bm > 0 && tickCd("beam", beamCdFor(Bm))) {
      const t = aim ?? this.nearest(this.x, this.y);
      const ang = t ? Math.atan2(t.y - this.y, t.x - this.x) : this.facing;
      const life = Bm >= 3 ? 0.7 : 0.4;
      const wide = 6 + Bm * 2.8;
      const len = 320 + Bm * 50;
      this.spawnLaser(1, ang - 0.9, 3.1, len, wide, life, 11 + Bm * 3.5);
      if (Bm >= 4) this.spawnLaser(1, ang + 0.9, -3.1, len, wide * 0.9, life, 10 + Bm * 3);
      this.line = "解。一线。";
    }

    const Bl = this.weps.blades;
    if (Bl > 0) {
      const n = orbitCount(Bl);
      const dist = orbitDist(Bl, 50);
      for (let i = 0; i < n; i++) {
        const a = this.anim * (Bl >= 4 ? 3.1 : 2.6) + (i / n) * Math.PI * 2;
        this.orbitHit(this.x + Math.cos(a) * dist, this.y + Math.sin(a) * dist, 11 + Bl * 2.2, 12 + Bl * 2);
      }
    }
  }

  ring(rad: number, dmg: number, kind: number) {
    this.ringAt(this.x, this.y, rad, dmg, kind);
  }

  ringAt(x: number, y: number, rad: number, dmg: number, kind: number, rimFlash = false) {
    this.pushFx(x, y, rad, 0.48, kind === 1 ? 3 : kind === 3 ? 3 : 1, "", false);
    this.pushFx(x, y, rad * 0.45, 0.22, 18, "", false);
    const band = 8 + this.weps.flash * 6;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < rad + e.r) {
        const nx = (e.x - x) / (d || 1);
        const ny = (e.y - y) / (d || 1);
        const onRim = rimFlash && d > rad - band;
        this.hurtEnemy(e, dmg, nx * 90, ny * 90, false, onRim ? "rim" : "none");
      }
    }
  }

  orbitHit(x: number, y: number, dmg: number, rad = 12) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if ((e.x - x) ** 2 + (e.y - y) ** 2 < (e.r + rad) ** 2) {
        this.hurtEnemy(e, dmg * 0.08, 0, 0);
      }
    }
  }

  cleave(rad: number, cap = 1) {
    let hopped = 0;
    let tagged = false;
    this.pushFx(this.x, this.y, rad, 0.28, 8, "", false, this.facing);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.pushFx(this.x + Math.cos(a) * (rad * 0.55), this.y + Math.sin(a) * (rad * 0.55), rad * 0.28, 0.2, 9, "", false, a);
    }
    const hits = this.enemies
      .filter((e) => e.alive && Math.hypot(e.x - this.x, e.y - this.y) <= rad + e.r)
      .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))
      .slice(0, Math.max(1, cap));
    const forks = this.weps.focus >= 1 ? 0 : this.weps.split;
    for (const e of hits) {
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      const tag: HitTag = !tagged && this.slashArmed ? "cleave" : "none";
      if (tag === "cleave") tagged = true;
      const cut = this.cleaveCut(e);
      this.hurtEnemy(e, cut, (dx / d) * 70, (dy / d) * 70, false, tag);
      for (let i = 0; i < forks; i++) this.hurtEnemy(e, cut * 0.7, 0, 0, true, "none");
      if (this.weps.chain > 0) this.queueHop(e.x, e.y, this.weps.chain, cut * 0.75, 2, 96 + this.weps.linger * 18);
      if (this.weps.plague > 0 && hopped < 2) {
        e.mark = 0.45;
        this.spreadPlague(e.x, e.y);
        hopped += 1;
      }
    }
  }

  shot(
    kind: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
    dmg: number,
    life: number,
    pierce: number,
    homing: number,
    r = 6,
  ) {
    let b: Bullet | null = null;
    for (let i = 0; i < MAX_B; i++) {
      const idx = (this.bi + i) % MAX_B;
      if (!this.bullets[idx]!.alive) {
        b = this.bullets[idx]!;
        this.bi = idx + 1;
        break;
      }
    }
    if (!b) return;
    b.alive = true;
    b.kind = kind;
    b.x = x;
    b.y = y;
    b.vx = vx;
    b.vy = vy;
    b.r = r;
    b.dmg = dmg;
    b.life = life;
    b.pierce = pierce;
    b.homing = homing;
  }

  moveBullets(dt: number) {
    for (const b of this.bullets) {
      if (!b.alive) continue;
      if (b.homing > 0) {
        const t = this.nearest(b.x, b.y);
        if (t) {
          const dx = t.x - b.x;
          const dy = t.y - b.y;
          const d = Math.hypot(dx, dy) || 1;
          b.vx += (dx / d) * 980 * dt;
          b.vy += (dy / d) * 980 * dt;
          const sp = Math.hypot(b.vx, b.vy);
          const cap = 340;
          if (sp > cap) {
            b.vx = (b.vx / sp) * cap;
            b.vy = (b.vy / sp) * cap;
          }
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if ((b.kind === 0 || b.kind === 1 || b.kind === 2) && Math.random() < 0.45) {
        this.pushFx(b.x, b.y, b.kind === 2 ? b.r : 4, 0.12, b.kind === 1 ? 13 : 15, "", false, Math.atan2(b.vy, b.vx));
      }
      if (b.life <= 0) {
        if (b.kind === 2 && this.weps.purple >= 3) {
          this.ringAt(b.x, b.y, 48 + this.weps.purple * 10, 18 + this.weps.purple * 6, 1);
        }
        b.alive = false;
        continue;
      }
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 > (e.r + b.r) ** 2) continue;
        const nx = (e.x - b.x) / 8;
        const ny = (e.y - b.y) / 8;
        this.hurtEnemy(e, b.dmg, nx * 40, ny * 40, false, b.kind === 4 ? "slash" : "none");
        if (b.kind === 0 && this.weps.ripple > 0) this.spreadRipple(e.x, e.y, false);
        if (this.weps.chain > 0) {
          this.queueHop(e.x, e.y, this.weps.chain, b.dmg * 0.75, b.kind === 4 ? 2 : 1, 96 + this.weps.linger * 18);
        }
        if (b.kind === 4 && this.weps.plague >= 4) {
          this.queueHop(e.x, e.y, Math.min(3, this.weps.plague), b.dmg * 0.5, 2, 120);
        }
        if (b.kind === 5) {
          const F = this.weps.flame;
          const boom = [0, 40, 62, 70, 92][Math.min(4, F)] ?? 40;
          this.ringAt(b.x, b.y, boom, 10 + F * 5, 3);
          b.alive = false;
          break;
        }
        if (b.pierce <= 0) {
          b.alive = false;
          break;
        }
        b.pierce -= 1;
      }
    }
  }

  hurtEnemy(e: Enemy, raw: number, kx: number, ky: number, fromChain = false, tag: HitTag = "none") {
    const flashed = !fromChain && this.tryBlackFlash(e, tag);
    const crit = flashed || fromChain || this.bfBuff > 0 || Math.random() < this.crit;
    let dmg = raw * (crit ? this.critDmg : 1);
    if (flashed || this.bfBuff > 0) dmg *= this.bfMult() / (crit ? this.critDmg : 1);
    dmg *= this.adaptHitBonus(e);
    e.hp -= dmg;
    e.hurt = 0.12;
    e.x += kx * 0.016;
    e.y += ky * 0.016;
    this.pushFx(e.x, e.y - 18, 0, 0.55, 2, `${Math.floor(dmg)}`, crit);
    for (let i = 0; i < (crit ? 6 : 3); i++) {
      this.pushFx(e.x, e.y, 6, 0.16, 13, "", crit, Math.random() * Math.PI * 2);
    }
    if (e.hp <= 0) {
      e.alive = false;
      this.kills += 1;
      this.drop(e.x, e.y, e.xp);
      this.pushFx(e.x, e.y, e.r * 3.4, 0.4, 18, "", false);
      this.pushFx(e.x, e.y, e.r * 2.6, 0.34, 4, "", false);
      this.bloodSpray(e.x, e.y);
      if (this.weps.ripple >= 4) this.spreadRipple(e.x, e.y, true);
      if (e.kind === 3) this.shake = Math.max(this.shake, 12);
      else this.shake = Math.max(this.shake, 3);
      if (this.kills % 8 === 0) sfxKill();
      else sfxHit();
    }
  }

  bloodSpray(x: number, y: number) {
    this.pushFx(x, y, 56, 0.5, 10, "", false);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      this.pushFx(x + Math.cos(a) * 12, y + Math.sin(a) * 10, 10, 0.34, 11, "", false, a);
    }
  }

  spreadRipple(x: number, y: number, fromKill: boolean) {
    const R = this.weps.ripple;
    if (R < 1) return;
    if (!fromKill && !this.readyCd("rippleHop", 0.12)) return;
    const hops = R >= 4 ? 3 : R >= 2 ? 2 : 1;
    this.queueHop(x, y, hops, 8 + R * 3, 1, 88 + R * 22);
    if (R >= 3) this.spawnField(x, y, 46 + R * 10, 0.7 + R * 0.12, 6 + R * 2, 0);
  }

  spreadPlague(x: number, y: number) {
    const P = this.weps.plague;
    if (P < 1) return;
    const hops = P >= 4 ? 3 : P >= 2 ? 2 : 1;
    this.queueHop(x, y, hops, 9 + P * 3.5, 2, 96 + P * 20);
    if (P >= 3) this.spawnField(x, y, 50 + P * 12, 0.55, 7 + P * 2, 1);
  }

  queueHop(x: number, y: number, hops: number, dmg: number, kind: 0 | 1 | 2, reach: number) {
    if (kind === 0) return;
    this.chains.push({ x, y, hops, wait: 0.07, dmg, kind, reach });
    this.pushFx(x, y, 26, 0.2, kind === 1 ? 16 : 17, "", false);
  }

  stepChains(dt: number) {
    for (const c of this.chains) {
      c.wait -= dt;
      if (c.wait > 0) continue;
      let best: Enemy | null = null;
      let bd = 1e9;
      const reach = c.reach || 120;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - c.x, e.y - c.y);
        if (d < 22 || d > reach) continue;
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
      if (!best) {
        c.hops = 0;
        continue;
      }
      const ang = Math.atan2(best.y - c.y, best.x - c.x);
      this.pushFx((c.x + best.x) / 2, (c.y + best.y) / 2, bd * 0.52, 0.2, 14, "", false, ang);
      if (c.kind === 1) this.pushFx(best.x, best.y, 34, 0.28, 16, "", false);
      if (c.kind === 2) this.pushFx(best.x, best.y, 36, 0.28, 17, "", false);
      this.hurtEnemy(best, c.dmg, 0, 0, true);
      c.x = best.x;
      c.y = best.y;
      c.hops -= 1;
      c.wait = 0.08;
    }
    this.chains = this.chains.filter((c) => c.hops > 0);
  }

  spawnLaser(
    hue: 0 | 1 | 2,
    ang: number,
    sweep: number,
    len: number,
    wide: number,
    life: number,
    dmg: number,
  ) {
    let L: Laser | null = null;
    for (let i = 0; i < MAX_LASER; i++) {
      const idx = (this.li + i) % MAX_LASER;
      if (!this.lasers[idx]!.alive) {
        L = this.lasers[idx]!;
        this.li = idx + 1;
        break;
      }
    }
    if (!L) return;
    L.alive = true;
    L.hue = hue;
    L.ang = ang;
    L.sweep = sweep;
    L.len = len;
    L.wide = wide;
    L.life = life;
    L.max = life;
    L.dmg = dmg;
    L.acc = 0;
    this.shake = Math.max(this.shake, hue === 0 ? 4 : 5);
  }

  stepLasers(dt: number) {
    for (const L of this.lasers) {
      if (!L.alive) continue;
      L.life -= dt;
      L.ang += L.sweep * dt;
      L.acc += dt;
      const x2 = this.x + Math.cos(L.ang) * L.len;
      const y2 = this.y + Math.sin(L.ang) * L.len;
      if (L.acc >= 0.07) {
        L.acc = 0;
        for (const e of this.enemies) {
          if (!e.alive) continue;
          const d = distToSeg(e.x, e.y, this.x, this.y, x2, y2);
          if (d < e.r + L.wide) this.hurtEnemy(e, L.dmg * 0.35, 0, 0);
        }
        this.pushFx((this.x + x2) / 2, (this.y + y2) / 2, L.len * 0.45, 0.1, 15, "", false, L.ang);
      }
      if (L.life <= 0) L.alive = false;
    }
  }

  spawnField(x: number, y: number, r: number, life: number, dmg: number, hue: 0 | 1) {
    let f: Field | null = null;
    for (let i = 0; i < MAX_FIELD; i++) {
      const idx = (this.fi2 + i) % MAX_FIELD;
      if (!this.fields[idx]!.alive) {
        f = this.fields[idx]!;
        this.fi2 = idx + 1;
        break;
      }
    }
    if (!f) return;
    f.alive = true;
    f.x = x;
    f.y = y;
    f.r = r;
    f.life = life;
    f.dmg = dmg;
    f.acc = 0;
    f.hue = hue;
    this.pushFx(x, y, r, 0.3, hue ? 17 : 16, "", false);
  }

  stepFields(dt: number) {
    for (const f of this.fields) {
      if (!f.alive) continue;
      f.life -= dt;
      f.acc += dt;
      if (f.acc >= 0.16) {
        f.acc = 0;
        this.pushFx(f.x, f.y, f.r, 0.18, f.hue ? 17 : 16, "", false);
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (Math.hypot(e.x - f.x, e.y - f.y) < f.r + e.r) this.hurtEnemy(e, f.dmg * 0.2, 0, 0, true);
        }
      }
      if (f.life <= 0) f.alive = false;
    }
  }

  enemyAttack(e: Enemy) {
    const d = Math.hypot(e.x - this.x, e.y - this.y);
    if (e.kind === 2) {
      e.atk = e.elite ? 1.35 : 1.85;
      const ang = Math.atan2(this.y - e.y, this.x - e.x);
      this.spawnHazard(0, e.x, e.y, Math.cos(ang) * 210, Math.sin(ang) * 210, 7, e.dmg * 0.7, 1.6, ang, 0, "projectile");
    } else if (e.kind === 3) {
      e.atk = 2.15;
      if (d < 150) {
        this.pushFx(e.x, e.y, 130, 0.35, 3, "", false);
        if (d < 128 && this.invuln <= 0) this.hurtPlayer(e.dmg * 0.85, "explosion");
      } else {
        const ang = Math.atan2(this.y - e.y, this.x - e.x);
        this.spawnHazard(1, e.x, e.y, 0, 0, 10, e.dmg * 0.55, 0.42, ang, 360, "laser");
      }
    } else {
      e.atk = 2.2;
    }
  }

  spawnHazard(
    style: 0 | 1,
    x: number,
    y: number,
    vx: number,
    vy: number,
    r: number,
    dmg: number,
    life: number,
    ang: number,
    len: number,
    kind: DmgKind,
  ) {
    let h: Hazard | null = null;
    for (let i = 0; i < MAX_HAZ; i++) {
      const idx = (this.hi + i) % MAX_HAZ;
      if (!this.hazards[idx]!.alive) {
        h = this.hazards[idx]!;
        this.hi = idx + 1;
        break;
      }
    }
    if (!h) return;
    h.alive = true;
    h.style = style;
    h.x = x;
    h.y = y;
    h.vx = vx;
    h.vy = vy;
    h.r = r;
    h.dmg = dmg;
    h.life = life;
    h.ang = ang;
    h.len = len;
    h.kind = kind;
  }

  stepHazards(dt: number) {
    for (const h of this.hazards) {
      if (!h.alive) continue;
      h.life -= dt;
      if (h.style === 0) {
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        if (this.invuln <= 0 && Math.hypot(h.x - this.x, h.y - this.y) < h.r + this.r) {
          this.hurtPlayer(h.dmg, h.kind);
          h.alive = false;
        }
      } else {
        const x2 = h.x + Math.cos(h.ang) * h.len;
        const y2 = h.y + Math.sin(h.ang) * h.len;
        if (this.invuln <= 0 && distToSeg(this.x, this.y, h.x, h.y, x2, y2) < this.r + 8) {
          this.hurtPlayer(h.dmg, h.kind);
        }
      }
      if (h.life <= 0) h.alive = false;
    }
  }

  stepShell(dt: number) {
    if (this.charId !== "gojo" || this.weps.limitless < 1) {
      this.shellLoad = 0;
      this.shellLeak = false;
      this.shellPress = 0;
      this.overload = 0;
      return;
    }
    const R = this.shellRadius();
    const C = this.shellCapacity();
    this.shellCap = C;
    let press = 0;
    this.fieldAcc += dt;
    const tick = this.fieldAcc >= 0.16;
    const dps = this.fieldDps() * (this.shellLeak ? 0.4 : 1);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d > R + e.r + 8) continue;
      press += this.enemyMass(e);
      if (this.fodder(e) && tick) this.hurtEnemy(e, dps * 0.16, 0, 0, true);
    }
    for (const h of this.hazards) {
      if (!h.alive) continue;
      if (Math.hypot(h.x - this.x, h.y - this.y) < R + 16) press += 1.7;
    }
    this.shellPress = press;
    const regen = this.shellRegen();
    if (press > regen * 0.12) this.shellLoad += press * dt;
    if (press < regen) {
      const drain = (regen - press) * dt * (this.shellLeak ? 0.42 : 1);
      this.shellLoad = Math.max(0, this.shellLoad - drain);
    }
    if (this.shellLeak) {
      if (this.shellLoad < C * 0.55 && press < regen) this.shellLeak = false;
    } else if (this.shellLoad >= C) {
      this.shellLeak = true;
      this.line = "无下限。满了。";
    }
    this.overload = C > 0 ? this.shellLoad / C : 0;
    if (tick) this.fieldAcc = 0;
  }

  castDash() {
    if (this.dashCd > 0 || this.dashT > 0) return;
    let nx = this.ax;
    let ny = this.ay;
    if (this.hasMove && Math.hypot(this.tx - this.x, this.ty - this.y) > 4) {
      nx = this.tx - this.x;
      ny = this.ty - this.y;
    }
    if (Math.hypot(nx, ny) < 0.12) {
      nx = Math.cos(this.facing);
      ny = Math.sin(this.facing);
    } else {
      const m = Math.hypot(nx, ny);
      nx /= m;
      ny /= m;
    }
    const dist = this.charId === "gojo" ? 175 : 200;
    this.dx0 = this.x;
    this.dy0 = this.y;
    this.dx1 = clamp(this.x + nx * dist, 40, WORLD - 40);
    this.dy1 = clamp(this.y + ny * dist, 40, WORLD - 40);
    this.facing = Math.atan2(ny, nx);
    this.yaw = Math.atan2(-nx, -ny);
    this.dashT = 0.001;
    this.dashDur = this.charId === "gojo" ? 0.09 : 0.14;
    this.dashCd = DASH_COOLDOWN;
    this.invuln = Math.max(this.invuln, 0.42);
    this.line = this.charId === "gojo" ? "无下限。踏。" : "解。踏过去。";
    this.pushFx(this.x, this.y, 40, 0.18, this.charId === "gojo" ? 1 : 9, "", false, this.facing);
    sfxDash(this.charId === "sukuna" ? "sukuna" : "gojo");
  }

  stepDash(dt: number) {
    this.dashT += dt;
    const u = Math.min(1, this.dashT / this.dashDur);
    const ease = 1 - (1 - u) * (1 - u);
    this.x = this.dx0 + (this.dx1 - this.dx0) * ease;
    this.y = this.dy0 + (this.dy1 - this.dy0) * ease;
    this.vx = (this.dx1 - this.dx0) / this.dashDur;
    this.vy = (this.dy1 - this.dy0) / this.dashDur;
    if (this.charId === "sukuna") {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = distToSeg(e.x, e.y, this.dx0, this.dy0, this.x, this.y);
        if (d < e.r + 18 && e.hurt <= 0) this.hurtEnemy(e, this.verbDmg(8), 0, 0, false, "dash");
      }
    }
    if (u >= 1) {
      this.dashT = 0;
      this.x = this.dx1;
      this.y = this.dy1;
      this.vx = 0;
      this.vy = 0;
      this.openBfWindow();
      if (this.charId === "gojo") this.pushFx(this.x, this.y, 46, 0.22, 1, "", false);
      else this.pushFx(this.x, this.y, 52, 0.22, 9, "", false, this.facing);
    }
  }

  castPurple() {
    const P = this.weps.purple;
    if (P < 1 || this.purpleCd > 0) return;
    const t = this.nearest(this.x, this.y);
    const ang = t ? Math.atan2(t.y - this.y, t.x - this.x) : this.facing;
    const size = 12 + P * 4.2;
    const vx = Math.cos(ang) * 720;
    const vy = Math.sin(ang) * 720;
    this.shot(2, this.x, this.y, vx, vy, this.verbDmg(36 + P * 8), 0.78, 14, 0, size);
    if (P >= 3) {
      const o = 20;
      const px = -Math.sin(ang) * o;
      const py = Math.cos(ang) * o;
      this.shot(2, this.x + px, this.y + py, vx, vy, 36 + P * 12, 0.78, 14, 0, size * 0.88);
    }
    for (let i = 1; i <= 8; i++) {
      this.pushFx(
        this.x + Math.cos(ang) * (42 * i),
        this.y + Math.sin(ang) * (42 * i),
        18 + P * 4,
        0.22,
        12,
        "",
        false,
        ang,
      );
    }
    this.spawnLaser(0, ang, 0, 420 + P * 30, 10 + P * 3, 0.18, 12);
    this.purpleCd = purpleCdFor(P);
    this.shake = Math.max(this.shake, 12);
    this.line = "苍。赫。虚式。";
    sfxSkill("purple");
  }

  drop(x: number, y: number, v: number) {
    for (let n = 0; n < v; n++) {
      let g: Gem | null = null;
      for (let i = 0; i < MAX_G; i++) {
        const idx = (this.gi + i) % MAX_G;
        if (!this.gems[idx]!.alive) {
          g = this.gems[idx]!;
          this.gi = idx + 1;
          break;
        }
      }
      if (!g) return;
      g.alive = true;
      g.x = x + rand(-10, 10);
      g.y = y + rand(-10, 10);
      g.v = 1;
    }
  }

  gemsStep(dt: number) {
    for (const g of this.gems) {
      if (!g.alive) continue;
      const dx = this.x - g.x;
      const dy = this.y - g.y;
      const d = Math.hypot(dx, dy);
      if (d < this.pickup * 2.4) {
        const pull = d < this.pickup ? 520 : 180;
        g.x += (dx / (d || 1)) * pull * dt;
        g.y += (dy / (d || 1)) * pull * dt;
      }
      if (d < 22) {
        g.alive = false;
        this.xp += g.v;
        while (this.xp >= this.need && !this.paused) {
          this.xp -= this.need;
          this.lv += 1;
          this.need = xpNeed(this.lv - 1);
          this.pendingShops += 1;
          this.applyStats();
          this.hp = Math.min(this.maxHp, this.hp + LEVEL_HP);
          this.maybeGrantSixRed();
          if (!this.picks) this.offer();
        }
      }
    }
  }

  offer(opts?: { resume?: boolean }) {
    if (!opts?.resume) {
      this.anvilChain = 0;
      this.forgeChain = false;
    }
    const picks = rollPicks(this.charId, this.weps, this.time, this.lv, this.forgeRng, this.lastPick);
    if (picks.length === 0) {
      this.hp = Math.min(this.maxHp, this.hp + 24);
      this.line = "已经满了。多活一会儿。";
      this.picks = null;
      this.paused = this.userPaused;
      return;
    }
    this.picks = picks;
    this.paused = true;
    this.line = this.forgeChain ? "连抽。再锻一次。" : "锻造器。伤已经不随等级涨。";
    sfxLevel();
  }

  contact() {
    if (this.invuln > 0) return;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d >= e.r + this.r - 2) continue;
      if (this.fodder(e) && !this.shellLeak && this.shellRadius() > 0) continue;
      this.hurtPlayer(e.dmg, "contact");
      const nx = (this.x - e.x) / (d || 1);
      const ny = (this.y - e.y) / (d || 1);
      this.x = clamp(this.x + nx * 28, 40, WORLD - 40);
      this.y = clamp(this.y + ny * 28, 40, WORLD - 40);
      break;
    }
  }

  castDomain() {
    if (this.weps.domain < 1 || this.domainCd > 0) return;
    const lv = this.weps.domain;
    this.domainCd = domainCdFor(lv);
    this.freeze = 1.1 + lv * 0.3;
    this.usedDomain = true;
    this.shake = Math.max(this.shake, 14);
    this.invuln = Math.max(this.invuln, 0.55);
    this.pushFx(this.x, this.y, 240 + lv * 20, 0.55, this.charId === "sukuna" ? 3 : 1, "", false);
    if (this.charId === "sukuna") {
      this.ring(200 + lv * 24, 70 + lv * 26, 3);
      for (let i = 0; i < 10 + lv * 3; i++) {
        const a = (i / (10 + lv * 3)) * Math.PI * 2;
        this.pushFx(this.x + Math.cos(a) * 80, this.y + Math.sin(a) * 80, 40 + lv * 6, 0.35, 9, "", false, a);
      }
      this.line = `术域展开。${CHAR_MAP.sukuna.domainName}。`;
    } else {
      this.ring(210 + lv * 20, 80 + lv * 28, 1);
      this.line = `术域展开。${CHAR_MAP.gojo.domainName}。`;
    }
    sfxDomain();
  }

  pushFx(
    x: number,
    y: number,
    r: number,
    life: number,
    kind: number,
    text: string,
    crit: boolean,
    ang = 0,
  ) {
    let f: Fx | null = null;
    for (let i = 0; i < MAX_FX; i++) {
      const idx = (this.fi + i) % MAX_FX;
      if (!this.fx[idx]!.alive) {
        f = this.fx[idx]!;
        this.fi = idx + 1;
        break;
      }
    }
    if (!f) return;
    f.alive = true;
    f.x = x;
    f.y = y;
    f.r = r;
    f.life = life;
    f.max = life;
    f.kind = kind;
    f.text = text;
    f.crit = crit;
    f.ang = ang;
  }

  fxStep(dt: number) {
    for (const f of this.fx) {
      if (!f.alive) continue;
      f.life -= dt;
      if (f.kind === 2) f.y -= 28 * dt;
      if (f.kind === 11) {
        f.x += Math.cos(f.ang) * 90 * dt;
        f.y += Math.sin(f.ang) * 90 * dt + 40 * dt;
      }
      if (f.life <= 0) f.alive = false;
    }
  }

  drawLasers(ctx: CanvasRenderingContext2D, camx: number, camy: number) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const L of this.lasers) {
      if (!L.alive) continue;
      const a = Math.max(0.25, L.life / Math.max(0.05, L.max));
      const x1 = this.x - camx;
      const y1 = this.y - camy;
      const x2 = x1 + Math.cos(L.ang) * L.len;
      const y2 = y1 + Math.sin(L.ang) * L.len;
      const col = L.hue === 1 ? "196,76,76" : L.hue === 2 ? "255,120,70" : "126,232,228";
      ctx.strokeStyle = `rgba(${col},${0.22 * a})`;
      ctx.lineWidth = L.wide * 3.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${col},${0.7 * a})`;
      ctx.lineWidth = L.wide * 1.35;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(239,232,216,${0.9 * a})`;
      ctx.lineWidth = Math.max(2, L.wide * 0.35);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const atlas = this.atlas;
    const jx = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const jy = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const camx = this.camx - w / 2 + jx;
    const camy = this.camy - h / 2 + jy;

    ctx.fillStyle = "#08080c";
    ctx.fillRect(0, 0, w, h);

    if (atlas) {
      const tile = atlas.floor;
      const tw = tile.width;
      const th = tile.height;
      const x0 = Math.floor(camx / tw) * tw;
      const y0 = Math.floor(camy / th) * th;
      for (let y = y0; y < camy + h + th; y += th) {
        for (let x = x0; x < camx + w + tw; x += tw) {
          ctx.drawImage(tile, x - camx, y - camy, tw, th);
        }
      }
    }
    ctx.fillStyle = "rgba(8,8,12,0.42)";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle =
      this.charId === "sukuna" ? "rgba(196,76,76,0.16)" : "rgba(126,232,228,0.12)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0 - camx, 0 - camy, WORLD, WORLD);

    if (this.freeze > 0) {
      ctx.fillStyle =
        this.charId === "sukuna"
          ? `rgba(196,76,76,${0.08 + this.freeze * 0.08})`
          : `rgba(126,232,228,${0.08 + this.freeze * 0.08})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (this.bfPunch > 0) {
      ctx.fillStyle = `rgba(8,8,12,${0.42 * this.bfPunch})`;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(239,232,216,${0.55 * this.bfPunch})`;
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, w - 16, h - 16);
    }

    const shellR = this.shellRadius();
    if (shellR > 0) {
      const px = this.x - camx;
      const py = this.y - camy;
      const load = this.overload;
      const strain = load > 0.7 || this.shellLeak;
      const flicker = strain && Math.floor(this.anim * 18) % 2 === 0;
      const a = this.shellLeak ? 0.16 : flicker ? 0.18 : 0.32 + Math.min(0.25, load * 0.2);
      ctx.strokeStyle = this.shellLeak ? `rgba(196,76,76,${a})` : `rgba(126,232,228,${a})`;
      ctx.lineWidth = this.shellLeak ? 1.4 : strain ? 1.8 : 2.6;
      ctx.beginPath();
      ctx.arc(px, py, shellR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = this.shellLeak ? `rgba(196,76,76,0.04)` : `rgba(126,232,228,0.05)`;
      ctx.beginPath();
      ctx.arc(px, py, shellR, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.charId === "sukuna" && this.weps.adapt > 0) {
      const px = this.x - camx;
      const py = this.y - camy;
      const kinds: DmgKind[] = ["contact", "projectile", "laser", "explosion"];
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(this.anim * 0.7 + this.adaptTurns * 1.2);
      for (let i = 0; i < 4; i++) {
        const a0 = (i / 4) * Math.PI * 2;
        const k = kinds[i]!;
        const on = this.adaptOn === k || this.adaptHeld === k;
        ctx.strokeStyle = on ? "rgba(196,76,76,0.85)" : "rgba(239,232,216,0.28)";
        ctx.lineWidth = on ? 3 : 1.4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a0) * 10, Math.sin(a0) * 10);
        ctx.lineTo(Math.cos(a0) * 26, Math.sin(a0) * 26);
        ctx.stroke();
      }
      if (this.adaptPulse > 0) {
        ctx.strokeStyle = `rgba(196,76,76,${this.adaptPulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (this.hasMove) {
      const mx = this.tx - camx;
      const my = this.ty - camy;
      ctx.strokeStyle =
        this.charId === "sukuna" ? "rgba(196,76,76,0.7)" : "rgba(126,232,228,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mx - 5, my);
      ctx.lineTo(mx + 5, my);
      ctx.moveTo(mx, my - 5);
      ctx.lineTo(mx, my + 5);
      ctx.stroke();
    }

    if (this.weps.eyes + this.weps.sense > 0) {
      ctx.strokeStyle =
        this.charId === "sukuna" ? "rgba(196,76,76,0.28)" : "rgba(126,232,228,0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x - camx, this.y - camy, this.pickup, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const g of this.gems) {
      if (!g.alive) continue;
      const gx = g.x - camx;
      const gy = g.y - camy;
      if (gx < -8 || gy < -8 || gx > w + 8 || gy > h + 8) continue;
      ctx.fillStyle = this.charId === "sukuna" ? "#c44c4c" : "#7ee8e4";
      ctx.beginPath();
      ctx.moveTo(gx, gy - 6);
      ctx.lineTo(gx + 5, gy);
      ctx.lineTo(gx, gy + 6);
      ctx.lineTo(gx - 5, gy);
      ctx.closePath();
      ctx.fill();
    }

    for (const b of this.bullets) {
      if (!b.alive) continue;
      const bx = b.x - camx;
      const by = b.y - camy;
      if (atlas && b.kind === 0) {
        const fr = atlas.orb[Math.floor(this.anim * 10) % 4]!;
        const s = b.r * 3.4;
        ctx.drawImage(fr, bx - s / 2, by - s / 2, s, s);
      } else if (atlas && b.kind === 4) {
        const fr = atlas.slash[Math.floor(this.anim * 14) % 4]!;
        const s = b.r * 3.6;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.drawImage(fr, -s / 2, -s / 2, s, s);
        ctx.restore();
      } else if (b.kind === 5) {
        ctx.fillStyle = "#c44c4c";
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(239,232,216,0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (b.kind === 2) {
        const ang = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(ang);
        const grd = ctx.createLinearGradient(-b.r * 9, 0, b.r * 2.4, 0);
        grd.addColorStop(0, "rgba(126,232,228,0)");
        grd.addColorStop(0.45, "rgba(168,132,255,0.78)");
        grd.addColorStop(1, "rgba(239,232,216,0.95)");
        ctx.fillStyle = grd;
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r * 9.2, b.r * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(239,232,216,0.9)";
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r * 7.2, b.r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(126,232,228,0.95)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = b.kind === 1 ? "#c44c4c" : "#efe8d8";
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fill();
        if (b.kind === 1) {
          ctx.strokeStyle = "rgba(239,232,216,0.55)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    for (const h of this.hazards) {
      if (!h.alive) continue;
      if (h.style === 0) {
        ctx.fillStyle = "rgba(196,76,76,0.8)";
        ctx.beginPath();
        ctx.arc(h.x - camx, h.y - camy, h.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "rgba(255,120,70,0.7)";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(h.x - camx, h.y - camy);
        ctx.lineTo(h.x + Math.cos(h.ang) * h.len - camx, h.y + Math.sin(h.ang) * h.len - camy);
        ctx.stroke();
        ctx.restore();
      }
    }

    this.drawLasers(ctx, camx, camy);

    const C = this.weps.clone;
    if (C > 0 && atlas) {
      const n = orbitCount(C);
      const dist = orbitDist(C, 48);
      const fr = atlas.orb[Math.floor(this.anim * 8) % 4]!;
      const s = 16 + C * 7;
      for (let i = 0; i < n; i++) {
        const a = this.anim * 2.2 + (i / n) * Math.PI * 2;
        const oxp = this.x + Math.cos(a) * dist - camx;
        const oyp = this.y + Math.sin(a) * dist - camy;
        ctx.drawImage(fr, oxp - s / 2, oyp - s / 2, s, s);
      }
    }

    const Bl = this.weps.blades;
    if (Bl > 0 && atlas) {
      const n = orbitCount(Bl);
      const dist = orbitDist(Bl, 50);
      const fr = atlas.slash[Math.floor(this.anim * 12) % 4]!;
      const s = 22 + Bl * 8;
      for (let i = 0; i < n; i++) {
        const a = this.anim * 2.6 + (i / n) * Math.PI * 2;
        const oxp = this.x + Math.cos(a) * dist - camx;
        const oyp = this.y + Math.sin(a) * dist - camy;
        ctx.save();
        ctx.translate(oxp, oyp);
        ctx.rotate(a + Math.PI / 2);
        ctx.drawImage(fr, -s / 2, -s / 2, s, s);
        ctx.restore();
      }
    }

    const drawables: { y: number; draw: () => void }[] = [];

    for (const e of this.enemies) {
      if (!e.alive) continue;
      const k = KINDS[e.kind]!;
      drawables.push({
        y: e.y,
        draw: () => {
          const ex = e.x - camx;
          const ey = e.y - camy;
          if (ex < -80 || ey < -80 || ex > w + 80 || ey > h + 80) return;
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.beginPath();
          ctx.ellipse(ex, ey + 6, e.r * 0.9, e.r * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          if (e.elite) {
            ctx.strokeStyle = e.kind === 3 ? "rgba(196,76,76,0.7)" : "rgba(196,76,76,0.45)";
            ctx.lineWidth = e.kind === 3 ? 3 : 2;
            ctx.beginPath();
            ctx.ellipse(ex, ey + 8, e.r * 1.15, e.r * 0.42, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (atlas) {
            const sheet = atlas[k.sprite];
            const fr = sheet[Math.floor(this.anim * 8 + e.seed * 4) % 4]!;
            const hgt = k.h * (e.elite && e.kind !== 3 ? 1.28 : 1);
            const wid = hgt * (fr.width / fr.height);
            ctx.save();
            if (e.hurt > 0) ctx.globalAlpha = 0.55;
            const flip = e.x > this.x;
            if (flip) {
              ctx.translate(ex, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(fr, -wid / 2, ey - hgt + e.r * 0.35, wid, hgt);
            } else {
              ctx.drawImage(fr, ex - wid / 2, ey - hgt + e.r * 0.35, wid, hgt);
            }
            ctx.restore();
          }
          if (e.mark > 0) {
            ctx.strokeStyle = `rgba(196,76,76,${0.35 + e.mark})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ex, ey - 8, e.r + 6, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (e.kind === 3 || e.elite || e.hp < e.max) {
            const bw = e.kind === 3 ? 44 : 32;
            ctx.fillStyle = "rgba(8,8,12,0.7)";
            ctx.fillRect(ex - bw / 2, ey + 10, bw, 3);
            ctx.fillStyle = e.elite ? "#c44c4c" : "#7ee8e4";
            ctx.fillRect(ex - bw / 2, ey + 10, bw * clamp(e.hp / e.max, 0, 1), 3);
          }
        },
      });
    }

    drawables.push({
      y: this.y,
      draw: () => {
        const px = this.x - camx;
        const py = this.y - camy;
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(px, py + 8, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        if (atlas) {
          const moving = this.getSpeed() > 28 || this.dashT > 0;
          const ch = CHAR_MAP[this.charId];
          const sheet = moving
            ? ch.sprite === "sukuna"
              ? atlas.sukunaWalk
              : atlas.heroWalk
            : atlas[ch.sprite];
          const fr = sheet[Math.floor(this.anim * (moving ? 10 : 6)) % 4]!;
          const hgt = 78;
          const wid = hgt * (fr.width / fr.height);
          const flip = Math.cos(this.facing) < 0;
          const drawOne = (x: number, y: number, alpha: number) => {
            ctx.save();
            ctx.globalAlpha = alpha;
            if (flip) {
              ctx.translate(x, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(fr, -wid / 2, y - hgt + 10, wid, hgt);
            } else {
              ctx.drawImage(fr, x - wid / 2, y - hgt + 10, wid, hgt);
            }
            ctx.restore();
          };
          this.trail.forEach((g, i) => {
            drawOne(g.x - camx, g.y - camy, 0.12 + (1 - i / this.trail.length) * 0.18);
          });
          const blink = this.invuln > 0 && Math.floor(this.invuln * 16) % 2 === 0;
          drawOne(px, py, blink ? 0.45 : 1);
        }
      },
    });

    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();

    for (const f of this.fx) {
      if (!f.alive) continue;
      const a = f.life / f.max;
      const fx = f.x - camx;
      const fy = f.y - camy;
      if (f.kind === 1 || f.kind === 3) {
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = f.kind === 3 ? `rgba(196,76,76,${0.75 * a})` : `rgba(126,232,228,${0.75 * a})`;
        ctx.lineWidth = 3 + a * 6;
        ctx.beginPath();
        ctx.arc(fx, fy, f.r * (1.2 - a * 0.35), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = f.kind === 3 ? `rgba(196,76,76,${0.12 * a})` : `rgba(126,232,228,${0.12 * a})`;
        ctx.beginPath();
        ctx.arc(fx, fy, f.r * (0.7 - a * 0.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      } else if (f.kind === 4) {
        ctx.fillStyle = `rgba(239,232,216,${0.38 * a})`;
        ctx.beginPath();
        ctx.arc(fx, fy, f.r * (1 - a), 0, Math.PI * 2);
        ctx.fill();
      } else if (f.kind === 5) {
        ctx.fillStyle = `rgba(8,8,12,${0.45 * a})`;
        ctx.beginPath();
        ctx.arc(fx, fy, f.r * (1.4 - a * 0.3), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(239,232,216,${0.9 * a})`;
        ctx.lineWidth = 2 + this.weps.flash;
        for (let i = 0; i < 3 + this.weps.flash; i++) {
          const ang = f.ang + i * 0.7;
          ctx.beginPath();
          ctx.moveTo(fx - Math.cos(ang) * f.r, fy - Math.sin(ang) * f.r);
          ctx.lineTo(fx + Math.cos(ang) * f.r * 1.4, fy + Math.sin(ang) * f.r * 1.4);
          ctx.stroke();
        }
        ctx.font = "700 16px IBM Plex Mono, monospace";
        ctx.fillStyle = "#efe8d8";
        ctx.globalAlpha = a;
        ctx.textAlign = "center";
        ctx.fillText("黑闪", fx, fy - f.r);
        ctx.globalAlpha = 1;
      } else if (f.kind === 6 && f.text) {
        ctx.font = "600 13px IBM Plex Mono, monospace";
        ctx.fillStyle = "#7ee8e4";
        ctx.globalAlpha = a;
        ctx.textAlign = "center";
        ctx.fillText(f.text, fx, fy);
        ctx.globalAlpha = 1;
      } else if (f.kind === 8 || f.kind === 9) {
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(f.ang);
        ctx.strokeStyle = `rgba(239,232,216,${0.7 * a})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-f.r, 0);
        ctx.lineTo(f.r, 0);
        ctx.stroke();
        ctx.strokeStyle = `rgba(196,76,76,${0.8 * a})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-f.r * 0.8, 4);
        ctx.lineTo(f.r * 0.8, -4);
        ctx.stroke();
        ctx.restore();
      } else if (f.kind === 10 && atlas) {
        const idx = Math.min(3, Math.floor((1 - a) * 4));
        const img = atlas.gore[idx]!;
        const s = f.r * 2.2;
        ctx.globalAlpha = Math.min(1, a + 0.2);
        ctx.drawImage(img, fx - s / 2, fy - s / 2, s, s);
        ctx.globalAlpha = 1;
      } else if (f.kind === 11) {
        ctx.fillStyle = `rgba(196,76,76,${0.85 * a})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 3 + (1 - a) * 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.kind === 12) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.translate(fx, fy);
        ctx.rotate(f.ang);
        ctx.strokeStyle = `rgba(180,140,255,${0.85 * a})`;
        ctx.lineWidth = 8 + (1 - a) * 10;
        ctx.beginPath();
        ctx.moveTo(-f.r * 1.6, 0);
        ctx.lineTo(f.r * 1.8, 0);
        ctx.stroke();
        ctx.strokeStyle = `rgba(239,232,216,${0.95 * a})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-f.r, 0);
        ctx.lineTo(f.r * 2.2, 0);
        ctx.stroke();
        ctx.restore();
      } else if (f.kind === 13) {
        ctx.fillStyle = `rgba(239,232,216,${0.9 * a})`;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(f.ang) * (1 - a) * 16, fy + Math.sin(f.ang) * (1 - a) * 16, 2 + a * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.kind === 14) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.translate(fx, fy);
        ctx.rotate(f.ang);
        const col = f.crit ? "196,180,255" : "126,232,228";
        ctx.strokeStyle = `rgba(${col},${0.95 * a})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-f.r, 0);
        ctx.lineTo(-f.r * 0.3, 7);
        ctx.lineTo(f.r * 0.2, -6);
        ctx.lineTo(f.r, 0);
        ctx.stroke();
        ctx.strokeStyle = `rgba(239,232,216,${0.8 * a})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      } else if (f.kind === 15) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.translate(fx, fy);
        ctx.rotate(f.ang);
        ctx.strokeStyle = `rgba(168,140,255,${0.45 * a})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-f.r, 0);
        ctx.lineTo(f.r, 0);
        ctx.stroke();
        ctx.restore();
      } else if (f.kind === 16 || f.kind === 17) {
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle =
          f.kind === 17 ? `rgba(196,76,76,${0.7 * a})` : `rgba(126,232,228,${0.7 * a})`;
        ctx.lineWidth = 3 + a * 3;
        ctx.beginPath();
        ctx.arc(fx, fy, f.r * (1.05 - a * 0.15), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle =
          f.kind === 17 ? `rgba(196,76,76,${0.1 * a})` : `rgba(126,232,228,${0.1 * a})`;
        ctx.beginPath();
        ctx.arc(fx, fy, f.r * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      } else if (f.kind === 18) {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(239,232,216,${0.35 * a})`;
        ctx.beginPath();
        ctx.arc(fx, fy, f.r * (1.3 - a * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(126,232,228,${0.7 * a})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      } else if (f.kind === 19) {
        ctx.strokeStyle = `rgba(8,8,12,${0.7 * a})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(fx, fy, f.r * (1.1 - a * 0.3), 0, Math.PI * 2);
        ctx.stroke();
      } else if (f.kind === 20) {
        ctx.strokeStyle = `rgba(196,76,76,${0.8 * a})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx, fy, f.r * (1.2 - a * 0.4), 0, Math.PI * 2);
        ctx.stroke();
        if (f.text) {
          ctx.font = "700 14px IBM Plex Mono, monospace";
          ctx.fillStyle = "#c44c4c";
          ctx.globalAlpha = a;
          ctx.textAlign = "center";
          ctx.fillText(f.text, fx, fy - f.r);
          ctx.globalAlpha = 1;
        }
      } else if (f.kind === 2 && f.text) {
        ctx.font = f.crit ? "700 16px IBM Plex Mono, monospace" : "500 12px IBM Plex Mono, monospace";
        ctx.fillStyle = f.crit ? "#efe8d8" : "#7ee8e4";
        ctx.globalAlpha = a;
        ctx.textAlign = "center";
        ctx.fillText(f.text, fx, fy);
        ctx.globalAlpha = 1;
      }
    }
  }
}
