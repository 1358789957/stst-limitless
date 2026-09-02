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
import { emptyWeps, rollPicks, UPGRADE_MAP, type Offer, type UpgradeId } from "./upgrades.ts";

export const WORLD = 2200;
export const CLEAR_TIME = 180;
export const DASH_COOLDOWN = 2.15;
export const ARRIVE = 12;
export const EXTRA_START: Record<CharId, UpgradeId> = {
  gojo: "blue",
  sukuna: "cleave",
};

const MAX_E = 200;
const MAX_B = 280;
const MAX_G = 180;
const MAX_FX = 140;

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

function redCdFor(r: number) {
  return [0, 1.15, 1.0, 0.88, 0.78][Math.min(4, Math.max(0, r))] ?? 1.15;
}

function cleaveCdFor(c: number) {
  return [0, 1.2, 1.05, 0.95, 0.85][Math.min(4, Math.max(0, c))] ?? 1.2;
}

function flameCdFor(f: number) {
  return [0, 3.1, 2.8, 2.5, 2.2][Math.min(4, Math.max(0, f))] ?? 3.1;
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
  hasMove = false;
  tx = 0;
  ty = 0;
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
  chains: { x: number; y: number; hops: number; wait: number; dmg: number }[] = [];

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
    this.weps[ch.start as UpgradeId] = 1;
    if (this.extraStart) this.weps[EXTRA_START[this.charId]] = 1;
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
    this.wantDomain = false;
    this.wantDash = false;
    this.wantSecondary = false;
    this.wantBurst = false;
    this.wantPurple = false;
    this.hasMove = false;
    this.tx = this.x;
    this.ty = this.y;
    this.enemies = Array.from({ length: MAX_E }, () => this.emptyE());
    this.bullets = Array.from({ length: MAX_B }, () => this.emptyB());
    this.gems = Array.from({ length: MAX_G }, () => ({ alive: false, x: 0, y: 0, v: 1 }));
    this.fx = Array.from({ length: MAX_FX }, () => this.emptyFx());
    this.ei = 0;
    this.bi = 0;
    this.gi = 0;
    this.fi = 0;
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
    };
  }

  skillSlots(): SkillSlot[] {
    const gojo = this.charId === "gojo";
    const wId: UpgradeId = gojo ? "red" : "cleave";
    const eId: UpgradeId = gojo ? "purple" : "flame";
    const wLv = this.weps[wId];
    const eLv = this.weps[eId];
    const wMax = gojo ? redCdFor(wLv) : cleaveCdFor(wLv);
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
        name: UPGRADE_MAP[wId].name,
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
    this.picks = null;
    this.paused = this.userPaused;
    this.line = offer ? `${offer.name}。${offer.tag}。` : `${def.name}。`;
    sfxLevel();
  }

  applyStats() {
    const eyes = this.weps.eyes + this.weps.sense;
    const f = this.weps.flash;
    const r = this.weps.rct;
    const s = this.weps.speed;
    this.pickup = 52 + eyes * 34;
    this.crit = Math.min(0.5, 0.07 + f * 0.06);
    this.critDmg = 2.2 + f * 0.35;
    this.regen = r * 2.2;
    this.maxHp = 100 + r * 18;
    this.hp = Math.min(this.maxHp, this.hp);
    this.speed = 200 * (1 + s * 0.2);
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
      return;
    }
    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      this.fxStep(Math.min(dt, 0.05));
      return;
    }
    const step = Math.min(dt, 0.05);
    this.time += step;
    this.anim += step;
    this.invuln = Math.max(0, this.invuln - step);
    this.freeze = Math.max(0, this.freeze - step);
    this.domainCd = Math.max(0, this.domainCd - step);
    this.dashCd = Math.max(0, this.dashCd - step);
    this.purpleCd = Math.max(0, this.purpleCd - step);
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
    this.gemsStep(step);
    this.fxStep(step);
    this.contact();
    this.shake = Math.max(0, this.shake - step * 28);

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
    const R = this.weps.red;
    if (R < 1) return;
    if (!this.readyCd("red", redCdFor(R))) return;
    const n = [0, 3, 5, 5, 7][Math.min(4, R)] ?? 3;
    const size = 4.2 + R * 1.35;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * (R >= 2 ? 0.2 : 0.14);
      const ang = this.facing + spread;
      this.shot(1, this.x, this.y, Math.cos(ang) * 430, Math.sin(ang) * 430, 9 + R * 3, 0.55, 0, 0, size);
    }
    if (R >= 4) {
      for (let i = -1; i <= 1; i++) {
        const ang = this.facing + i * 0.1;
        this.shot(1, this.x, this.y, Math.cos(ang) * 390, Math.sin(ang) * 390, 10, 0.5, 0, 0, size * 0.85);
      }
    }
    this.shake = Math.max(this.shake, R >= 3 ? 5 : 3);
    sfxSkill("red");
  }

  volleyCleave() {
    const Cl = this.weps.cleave;
    if (Cl < 1) return;
    if (!this.readyCd("cleave", cleaveCdFor(Cl))) return;
    const rad = [0, 68, 86, 102, 118][Math.min(4, Cl)] ?? 68;
    const arc = [0, 0.75, 1.05, 1.4, Math.PI][Math.min(4, Cl)] ?? 0.75;
    this.cleave(rad, arc, 16 + Cl * 5);
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
  }

  moveEnemies(dt: number) {
    const slow = this.freeze > 0 ? 0.08 : 1;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.hurt = Math.max(0, e.hurt - dt);
      const dx = this.x - e.x;
      const dy = this.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.vx = (dx / d) * e.spd * slow;
      e.vy = (dy / d) * e.spd * slow;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
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

  fire(dt: number) {
    const aim = this.nearest(this.x, this.y);
    if (aim && Math.hypot(this.vx, this.vy) < 8) {
      this.facing = Math.atan2(aim.y - this.y, aim.x - this.x);
    }

    const tickCd = (id: string, base: number) => this.readyCd(id, base);

    const L = this.weps.limitless;
    if (L > 0 && tickCd("limitless", L >= 4 ? 0.42 : L >= 3 ? 0.52 : L >= 2 ? 0.62 : 0.72)) {
      this.ring(78 + (L - 1) * 22, 16 + L * 3, 0);
      if (L >= 3) this.ring(40 + L * 8, 11 + L * 2, 0);
    }

    const B = this.weps.blue;
    if (B > 0 && tickCd("blue", Math.max(0.52, 1.02 - B * 0.08))) {
      const n = B >= 4 ? 3 : B >= 2 ? 2 : 1;
      const size = 8 + B * 3.2;
      const pierce = B >= 3 ? 1 : 0;
      for (let i = 0; i < n; i++) {
        const t = aim ?? this.nearest(this.x, this.y);
        const ang = t
          ? Math.atan2(t.y - this.y, t.x - this.x) + (i - (n - 1) / 2) * 0.2
          : this.facing;
        this.shot(0, this.x, this.y, Math.cos(ang) * 280, Math.sin(ang) * 280, 10 + B * 4, 2.4, pierce, 1, size);
      }
      sfxSkill("blue");
    }

    if (this.weps.red > 0) this.volleyRed();

    const C = this.weps.clone;
    if (C > 0) {
      const n = orbitCount(C);
      const dist = orbitDist(C, 48);
      for (let i = 0; i < n; i++) {
        const a = this.anim * (C >= 4 ? 2.8 : 2.2) + (i / n) * Math.PI * 2;
        this.orbitHit(this.x + Math.cos(a) * dist, this.y + Math.sin(a) * dist, 10 + C * 2.4, 11 + C * 2);
      }
    }

    const S = this.weps.slash;
    if (S > 0 && tickCd("slash", Math.max(0.34, 0.64 - S * 0.04))) {
      const n = S >= 4 ? 2 : S >= 2 ? 2 : 1;
      const size = 12 + S * 3.4;
      const pierce = S >= 3 ? 2 : 0;
      for (let i = 0; i < n; i++) {
        const t = aim ?? this.nearest(this.x, this.y);
        const ang = t
          ? Math.atan2(t.y - this.y, t.x - this.x) + (i - (n - 1) / 2) * 0.22
          : this.facing;
        this.shot(4, this.x, this.y, Math.cos(ang) * 520, Math.sin(ang) * 520, 12 + S * 3.6, 0.44 + S * 0.03, pierce, 0, size);
      }
      if (S >= 4) {
        const cross = this.facing + Math.PI / 2;
        this.shot(4, this.x, this.y, Math.cos(cross) * 500, Math.sin(cross) * 500, 12 + S * 3, 0.4, 1, 0, size);
        this.shot(4, this.x, this.y, Math.cos(cross + Math.PI) * 500, Math.sin(cross + Math.PI) * 500, 12 + S * 3, 0.4, 1, 0, size);
      }
    }

    if (this.weps.cleave > 0) this.volleyCleave();

    if (this.weps.flame > 0) this.volleyFlame();

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

  ringAt(x: number, y: number, rad: number, dmg: number, kind: number) {
    this.pushFx(x, y, rad, 0.35, kind === 1 ? 3 : kind === 3 ? 3 : 1, "", false);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < rad + e.r) {
        const nx = (e.x - x) / (d || 1);
        const ny = (e.y - y) / (d || 1);
        this.hurtEnemy(e, dmg, nx * 90, ny * 90);
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

  cleave(rad: number, arc: number, dmg: number) {
    const face = this.facing;
    this.pushFx(this.x, this.y, rad, 0.28, 8, "", false, face);
    for (let i = -2; i <= 2; i++) {
      this.pushFx(
        this.x + Math.cos(face + i * 0.18) * (rad * 0.55),
        this.y + Math.sin(face + i * 0.18) * (rad * 0.55),
        rad * 0.35,
        0.22,
        9,
        "",
        false,
        face + i * 0.18,
      );
    }
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > rad + e.r) continue;
      const ang = Math.atan2(dy, dx);
      let diff = ang - face;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) <= arc) this.hurtEnemy(e, dmg, (dx / d) * 80, (dy / d) * 80);
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
        this.hurtEnemy(e, b.dmg, nx * 40, ny * 40);
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

  hurtEnemy(e: Enemy, raw: number, kx: number, ky: number, fromChain = false) {
    const fl = this.weps.flash;
    const crit = fromChain || Math.random() < this.crit;
    const dmg = raw * (crit ? this.critDmg : 1);
    e.hp -= dmg;
    e.hurt = 0.12;
    e.x += kx * 0.016;
    e.y += ky * 0.016;
    this.pushFx(e.x, e.y - 18, 0, 0.55, 2, `${Math.floor(dmg)}`, crit);
    if (crit && fl > 0) {
      this.pushFx(e.x, e.y, 28 + fl * 10, 0.28, 5, "黑闪", true);
      sfxCrit();
      if (!fromChain) {
        this.chains.push({
          x: e.x,
          y: e.y,
          hops: fl,
          wait: 0.07,
          dmg: raw * this.critDmg,
        });
      }
    }
    if (crit && fl > 0) this.hitstop = Math.max(this.hitstop, 0.045);
    if (e.hp <= 0) {
      e.alive = false;
      this.kills += 1;
      this.drop(e.x, e.y, e.xp);
      this.pushFx(e.x, e.y, e.r * 2.2, 0.28, 4, "", false);
      this.bloodSpray(e.x, e.y);
      if (e.kind === 3) this.shake = Math.max(this.shake, 10);
      if (this.kills % 8 === 0) sfxKill();
      else sfxHit();
    }
  }

  bloodSpray(x: number, y: number) {
    this.pushFx(x, y, 42, 0.42, 10, "", false);
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      this.pushFx(x + Math.cos(a) * 10, y + Math.sin(a) * 8, 8, 0.28, 11, "", false, a);
    }
  }

  stepChains(dt: number) {
    for (const c of this.chains) {
      c.wait -= dt;
      if (c.wait > 0) continue;
      let best: Enemy | null = null;
      let bd = 1e9;
      const reach = 120 + this.weps.flash * 28;
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
      this.pushFx((c.x + best.x) / 2, (c.y + best.y) / 2, bd * 0.5, 0.12, 9, "", true, Math.atan2(best.y - c.y, best.x - c.x));
      this.hurtEnemy(best, c.dmg / this.critDmg, 0, 0, true);
      c.x = best.x;
      c.y = best.y;
      c.hops -= 1;
      c.wait = 0.08;
    }
    this.chains = this.chains.filter((c) => c.hops > 0);
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
        if (d < e.r + 18 && e.hurt <= 0) this.hurtEnemy(e, 18 + this.weps.slash * 3, 0, 0);
      }
    }
    if (u >= 1) {
      this.dashT = 0;
      this.x = this.dx1;
      this.y = this.dy1;
      this.vx = 0;
      this.vy = 0;
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
    this.shot(2, this.x, this.y, vx, vy, 40 + P * 14, 0.78, 14, 0, size);
    if (P >= 4) {
      const o = 20;
      const px = -Math.sin(ang) * o;
      const py = Math.cos(ang) * o;
      this.shot(2, this.x + px, this.y + py, vx, vy, 36 + P * 12, 0.78, 14, 0, size * 0.88);
    }
    for (let i = 1; i <= 3; i++) {
      this.pushFx(
        this.x + Math.cos(ang) * (36 * i),
        this.y + Math.sin(ang) * (36 * i),
        16 + P * 3,
        0.16,
        12,
        "",
        false,
        ang,
      );
    }
    this.purpleCd = purpleCdFor(P);
    this.shake = Math.max(this.shake, 7);
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
          this.offer();
        }
      }
    }
  }

  offer() {
    const picks = rollPicks(this.charId, this.weps, this.time, this.lv, Math.random, this.lastPick);
    if (picks.length === 0) {
      this.hp = Math.min(this.maxHp, this.hp + 24);
      this.line = "已经满了。多活一会儿。";
      return;
    }
    this.picks = picks;
    this.paused = true;
    this.line = "选一条路。";
    sfxLevel();
  }

  contact() {
    if (this.invuln > 0) return;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d < e.r + this.r - 2) {
        this.hp -= e.dmg;
        this.invuln = 0.7;
        const nx = (this.x - e.x) / (d || 1);
        const ny = (this.y - e.y) / (d || 1);
        this.x += nx * 28;
        this.y += ny * 28;
        this.shake = Math.max(this.shake, 8);
        sfxHurt();
        this.line = CHAR_MAP[this.charId].hitLine;
        break;
      }
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
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r * 6.4, b.r * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(126,232,228,0.85)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = b.kind === 1 ? "#c44c4c" : "#efe8d8";
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

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
        ctx.strokeStyle = f.kind === 3 ? `rgba(196,76,76,${0.6 * a})` : `rgba(126,232,228,${0.6 * a})`;
        ctx.lineWidth = 2 + a * 4;
        ctx.beginPath();
        ctx.arc(fx, fy, f.r * (1.15 - a * 0.4), 0, Math.PI * 2);
        ctx.stroke();
      } else if (f.kind === 4) {
        ctx.fillStyle = `rgba(239,232,216,${0.25 * a})`;
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
        ctx.translate(fx, fy);
        ctx.rotate(f.ang);
        ctx.strokeStyle = `rgba(180,140,255,${0.75 * a})`;
        ctx.lineWidth = 5 + (1 - a) * 6;
        ctx.beginPath();
        ctx.moveTo(-f.r * 1.6, 0);
        ctx.lineTo(f.r * 1.8, 0);
        ctx.stroke();
        ctx.strokeStyle = `rgba(239,232,216,${0.85 * a})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-f.r, 0);
        ctx.lineTo(f.r * 2.2, 0);
        ctx.stroke();
        ctx.restore();
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
