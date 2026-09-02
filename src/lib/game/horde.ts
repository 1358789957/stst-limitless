import type { Atlas } from "./atlas";
import { sfxCrit, sfxDomain, sfxHit, sfxHurt, sfxKill, sfxLevel, sfxSkill } from "./audio";
import { CHAR_MAP, type CharId } from "./characters";
import { emptyWeps, poolFor, UPGRADE_MAP, type UpgradeDef, type UpgradeId } from "./upgrades";

export const WORLD = 2200;

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
  return Math.floor(8 * Math.pow(1.27, level));
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
  kills: number;
  wave: number;
  paused: boolean;
  over: boolean;
  picks: UpgradeDef[] | null;
  weps: { id: UpgradeId; lv: number }[];
  domainCd: number;
  domainReady: boolean;
  dashCd: number;
  dashReady: boolean;
  purpleCd: number;
  purpleReady: boolean;
  line: string;
  charId: CharId;
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
  wantPurple = false;
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
  over = false;
  recorded = false;
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
  picks: UpgradeDef[] | null = null;
  camx = WORLD / 2;
  camy = WORLD / 2;
  spawnAcc = 0;
  nextBoss = 55;
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

  constructor(charId: CharId = "gojo") {
    this.reset(charId);
  }

  reset(charId?: CharId) {
    if (charId) this.charId = charId;
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
    this.over = false;
    this.recorded = false;
    this.line = ch.line;
    this.weps = emptyWeps();
    this.weps[ch.start as UpgradeId] = 1;
    this.cd = {};
    this.domainCd = 0;
    this.dashCd = 0;
    this.purpleCd = 0;
    this.dashT = 0;
    this.picks = null;
    this.camx = this.x;
    this.camy = this.y;
    this.spawnAcc = 0;
    this.nextBoss = 55;
    this.hitstop = 0;
    this.healAcc = 0;
    this.trail = [];
    this.chains = [];
    this.wantDomain = false;
    this.wantDash = false;
    this.wantPurple = false;
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
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      xp: this.xp,
      need: this.need,
      level: this.lv,
      time: this.time,
      kills: this.kills,
      wave: 1 + Math.floor(this.time / 20),
      paused: this.paused,
      over: this.over,
      picks: this.picks,
      weps,
      domainCd: this.domainCd,
      domainReady: this.weps.domain > 0 && this.domainCd <= 0,
      dashCd: this.dashCd,
      dashReady: this.dashCd <= 0 && this.dashT <= 0,
      purpleCd: this.purpleCd,
      purpleReady: this.weps.purple > 0 && this.purpleCd <= 0,
      line: this.line,
      charId: this.charId,
    };
  }

  choose(id: UpgradeId) {
    if (!this.picks) return;
    const def = UPGRADE_MAP[id];
    if (!def) return;
    const lv = (this.weps[id] ?? 0) + 1;
    this.weps[id] = Math.min(def.max, lv);
    this.applyStats();
    this.picks = null;
    this.paused = false;
    this.line = `${def.name}。`;
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

  tick(dt: number) {
    if (this.over) return;
    if (this.paused) {
      this.wantDash = false;
      this.wantPurple = false;
      this.wantDomain = false;
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
    if (this.wantPurple) this.castPurple();
    this.wantPurple = false;
    if (this.weps.domain > 0 && this.domainCd <= 0 && this.wantDomain) {
      this.castDomain();
    }
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

    if (this.hp <= 0 && !this.over) {
      this.hp = 0;
      this.over = true;
      this.line = "……就这？不，再来。";
    }
  }

  readMove() {
    const src = this.injected ?? this.keys;
    let ax = this.injected ? 0 : this.stickX;
    let ay = this.injected ? 0 : this.stickY;
    if (src.has("KeyA") || src.has("ArrowLeft")) ax -= 1;
    if (src.has("KeyD") || src.has("ArrowRight")) ax += 1;
    if (src.has("KeyW") || src.has("ArrowUp")) ay -= 1;
    if (src.has("KeyS") || src.has("ArrowDown")) ay += 1;
    if (src.has("Space")) this.wantDomain = true;
    if (src.has("ShiftLeft") || src.has("ShiftRight") || src.has("KeyF")) this.wantDash = true;
    if (src.has("KeyE") || src.has("KeyQ")) this.wantPurple = true;
    const m = Math.hypot(ax, ay);
    if (m > 1) {
      ax /= m;
      ay /= m;
    }
    this.ax = ax;
    this.ay = ay;
  }

  spawn(dt: number) {
    const t = this.time;
    const rate = 4.4 + t * 0.16;
    this.spawnAcc += dt * rate;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      let kind: Kind = 0;
      const roll = Math.random();
      if (t > 70 && roll < 0.12) kind = 2;
      else if (t > 28 && roll < 0.38) kind = 1;
      else if (t > 50 && roll < 0.22) kind = 2;
      this.birth(kind);
    }
    if (t >= this.nextBoss) {
      this.birth(3);
      this.nextBoss += 48;
      this.line = "灾核。别眨眼。";
    }
  }

  birth(kind: Kind) {
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
    const side = Math.floor(Math.random() * 4);
    const margin = 30;
    let x = 0;
    let y = 0;
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
    const scale = 1 + this.time / 90;
    e.alive = true;
    e.kind = kind;
    e.x = x;
    e.y = y;
    e.r = k.r;
    e.max = k.hp * scale;
    e.hp = e.max;
    e.dmg = k.dmg;
    e.xp = k.xp;
    e.spd = k.spd;
    e.hurt = 0;
    e.seed = Math.random();
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

    const tickCd = (id: string, base: number) => {
      const cur = (this.cd[id] ?? 0) - dt;
      if (cur > 0) {
        this.cd[id] = cur;
        return false;
      }
      this.cd[id] = base;
      return true;
    };

    const L = this.weps.limitless;
    if (L > 0 && tickCd("limitless", Math.max(0.36, 0.7 - L * 0.04))) {
      this.ring(70 + L * 16, 14 + L * 4.2, 0);
    }

    const B = this.weps.blue;
    if (B > 0 && tickCd("blue", Math.max(0.5, 1.05 - B * 0.05))) {
      const n = 1 + Math.floor(B / 2);
      const size = 8 + B * 3.6;
      for (let i = 0; i < n; i++) {
        const t = aim ?? this.nearest(this.x, this.y);
        const ang = t
          ? Math.atan2(t.y - this.y, t.x - this.x) + (i - (n - 1) / 2) * 0.18
          : this.facing;
        this.shot(0, this.x, this.y, Math.cos(ang) * 280, Math.sin(ang) * 280, 10 + B * 4, 2.4, 0, 1, size);
      }
      sfxSkill("blue");
    }

    const R = this.weps.red;
    if (R > 0 && tickCd("red", Math.max(0.65, 1.3 - R * 0.06))) {
      const n = 4 + R;
      const size = 4 + R * 1.15;
      for (let i = 0; i < n; i++) {
        const spread = (i - (n - 1) / 2) * (0.16 - Math.min(0.06, R * 0.008));
        const ang = this.facing + spread;
        this.shot(1, this.x, this.y, Math.cos(ang) * 430, Math.sin(ang) * 430, 8 + R * 2.6, 0.55, 0, 0, size);
      }
      sfxSkill("red");
    }

    const C = this.weps.clone;
    if (C > 0) {
      const n = 2 + C;
      const dist = 48 + C * 6;
      for (let i = 0; i < n; i++) {
        const a = this.anim * 2.2 + (i / n) * Math.PI * 2;
        this.orbitHit(this.x + Math.cos(a) * dist, this.y + Math.sin(a) * dist, 10 + C * 2.4, 11 + C * 2);
      }
    }

    const S = this.weps.slash;
    if (S > 0 && tickCd("slash", Math.max(0.32, 0.62 - S * 0.03))) {
      const n = 1 + Math.floor(S / 2);
      const size = 12 + S * 3.2;
      for (let i = 0; i < n; i++) {
        const t = aim ?? this.nearest(this.x, this.y);
        const ang = t
          ? Math.atan2(t.y - this.y, t.x - this.x) + (i - (n - 1) / 2) * 0.22
          : this.facing;
        this.shot(4, this.x, this.y, Math.cos(ang) * 520, Math.sin(ang) * 520, 11 + S * 3.4, 0.42 + S * 0.02, 1 + Math.floor(S / 3), 0, size);
      }
    }

    const Cl = this.weps.cleave;
    if (Cl > 0 && tickCd("cleave", Math.max(0.7, 1.25 - Cl * 0.06))) {
      this.cleave(68 + Cl * 16, 0.85 + Cl * 0.1, 16 + Cl * 4);
    }

    const F = this.weps.flame;
    if (F > 0 && tickCd("flame", Math.max(1.4, 2.6 - F * 0.14))) {
      const t = aim ?? this.nearest(this.x, this.y);
      const ang = t ? Math.atan2(t.y - this.y, t.x - this.x) : this.facing;
      this.shot(5, this.x, this.y, Math.cos(ang) * 400, Math.sin(ang) * 400, 22 + F * 8, 0.9, 0, 0, 9 + F * 3.2);
      sfxSkill("red");
    }

    const Bl = this.weps.blades;
    if (Bl > 0) {
      const n = 2 + Bl;
      const dist = 50 + Bl * 7;
      for (let i = 0; i < n; i++) {
        const a = this.anim * 2.6 + (i / n) * Math.PI * 2;
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
          const boom = 36 + this.weps.flame * 14;
          this.ringAt(b.x, b.y, boom, 10 + this.weps.flame * 4, 3);
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
    if (e.hp <= 0) {
      e.alive = false;
      this.kills += 1;
      this.drop(e.x, e.y, e.xp);
      this.pushFx(e.x, e.y, e.r * 2.2, 0.28, 4, "", false);
      if (crit && fl > 0) this.bloodSpray(e.x, e.y);
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
    this.dashCd = 2.15;
    this.invuln = Math.max(this.invuln, 0.4);
    this.line = this.charId === "gojo" ? "无下限。踏。" : "解。踏过去。";
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
    const size = 10 + P * 3.6;
    this.shot(2, this.x, this.y, Math.cos(ang) * 660, Math.sin(ang) * 660, 36 + P * 12, 0.7, 12, 0, size);
    this.purpleCd = Math.max(2.0, 4.0 - P * 0.28);
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
    const pool = poolFor(this.charId).filter((u) => this.weps[u.id] < u.max);
    if (pool.length === 0) {
      this.hp = Math.min(this.maxHp, this.hp + 24);
      this.line = "已经满了。多活一会儿。";
      return;
    }
    const picks: UpgradeDef[] = [];
    const bag = [...pool];
    while (picks.length < 3 && bag.length) {
      const i = Math.floor(Math.random() * bag.length);
      picks.push(bag.splice(i, 1)[0]!);
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
        this.invuln = 0.62;
        const nx = (this.x - e.x) / (d || 1);
        const ny = (this.y - e.y) / (d || 1);
        this.x += nx * 28;
        this.y += ny * 28;
        sfxHurt();
        this.line = CHAR_MAP[this.charId].hitLine;
        break;
      }
    }
  }

  castDomain() {
    if (this.weps.domain < 1 || this.domainCd > 0) return;
    const lv = this.weps.domain;
    this.domainCd = Math.max(10, 17 - lv);
    this.freeze = 1.15 + lv * 0.15;
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
    const camx = this.camx - w / 2;
    const camy = this.camy - h / 2;

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
      } else {
        ctx.fillStyle = b.kind === 1 ? "#c44c4c" : "#efe8d8";
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fill();
        if (b.kind === 2) {
          ctx.strokeStyle = "rgba(126,232,228,0.75)";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }

    const C = this.weps.clone;
    if (C > 0 && atlas) {
      const n = 2 + C;
      const dist = 48 + C * 6;
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
      const n = 2 + Bl;
      const dist = 50 + Bl * 7;
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
          if (atlas) {
            const sheet = atlas[k.sprite];
            const fr = sheet[Math.floor(this.anim * 8 + e.seed * 4) % 4]!;
            const hgt = k.h;
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
          if (e.kind === 3 || e.hp < e.max) {
            ctx.fillStyle = "rgba(8,8,12,0.7)";
            ctx.fillRect(ex - 16, ey + 10, 32, 3);
            ctx.fillStyle = e.kind === 3 ? "#c44c4c" : "#7ee8e4";
            ctx.fillRect(ex - 16, ey + 10, 32 * clamp(e.hp / e.max, 0, 1), 3);
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
