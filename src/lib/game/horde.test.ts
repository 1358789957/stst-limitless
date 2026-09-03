import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLEAR_TIME, CLEAVE_PCT, HordeSim, PUNCH_BASE, RED_BASE, WORLD } from "./horde.ts";
import { forgeDamageMul, levelHp } from "./upgrades.ts";

describe("HordeSim locked kit", () => {
  it("starts Gojo with Infinity + 拳脚, not 苍", () => {
    const gojo = new HordeSim("gojo");
    assert.equal(gojo.weps.limitless, 1);
    assert.equal(gojo.weps.fist, 1);
    assert.equal(gojo.weps.blue, 0);
    assert.equal(gojo.weps.red, 0);
    assert.equal(gojo.hud().activeName, "拳脚");

    const sukuna = new HordeSim("sukuna");
    assert.equal(sukuna.weps.slash, 1);
    assert.equal(sukuna.weps.cleave, 1);
    assert.equal(sukuna.hud().activeName, "解");
    assert.equal(sukuna.hud().nextSkill, "二连");
    assert.equal(gojo.hud().nextSkill, "六赫");
    assert.equal(gojo.hud().nextHex, 3);
    const w = sukuna.hud().skills.find((s) => s.key === "W");
    assert.equal(w?.name, "捌");
    assert.equal(w?.unlocked, true);
  });

  it("walks toward a move target and stops on arrival", () => {
    const sim = new HordeSim("gojo");
    const x0 = sim.x;
    sim.setMoveTarget(x0 + 240, sim.y);
    sim.tick(0.2);
    assert.ok(sim.x > x0);
    sim.x = sim.tx;
    sim.y = sim.ty;
    sim.tick(0.05);
    assert.equal(sim.hasMove, false);
    assert.equal(sim.getSpeed(), 0);
  });

  it("pauses time and ignores QWER while paused", () => {
    const sim = new HordeSim("gojo");
    const t = sim.time;
    sim.togglePause();
    sim.setKeys(["KeyQ", "KeyR"]);
    sim.tick(0.5);
    assert.equal(sim.time, t);
    assert.equal(sim.dashT, 0);
    sim.togglePause();
    sim.tick(0.1);
    assert.ok(sim.time > t);
  });

  it("does not treat W or A as movement or 平A", () => {
    const sim = new HordeSim("gojo");
    const x0 = sim.x;
    sim.setKeys(["KeyW", "KeyA", "KeyS", "KeyD"]);
    sim.tick(0.25);
    assert.equal(sim.x, x0);
    assert.equal(sim.punchHits, 0);
    assert.equal(sim.bullets.filter((b) => b.alive && b.kind === 0).length, 0);
  });

  it("maps QWER to dash, 六赫/捌, 虚式/开, domain", () => {
    const sim = new HordeSim("gojo");
    sim.setMoveTarget(sim.x + 400, sim.y);
    sim.setKeys(["KeyQ"]);
    sim.tick(0.016);
    assert.ok(sim.dashCd > 0);
    sim.keys.clear();

    sim.weps.red = 1;
    const before = sim.bullets.filter((b) => b.alive && b.kind === 1).length;
    sim.castW();
    assert.ok(sim.bullets.filter((b) => b.alive && b.kind === 1).length > before);

    sim.weps.purple = 1;
    sim.castE();
    assert.ok(sim.bullets.some((b) => b.alive && b.kind === 2));

    sim.weps.domain = 1;
    sim.setKeys(["KeyR"]);
    sim.tick(0.016);
    assert.equal(sim.usedDomain, true);
  });

  it("does not dash on Shift or domain on Space", () => {
    const sim = new HordeSim("gojo");
    sim.weps.domain = 1;
    sim.setKeys(["ShiftLeft", "Space", "KeyF"]);
    sim.tick(0.016);
    assert.equal(sim.dashT, 0);
    assert.equal(sim.usedDomain, false);
  });

  it("fires 拳脚 on LMB, not 苍", () => {
    const gojo = new HordeSim("gojo");
    gojo.birth(0, { near: true });
    const e = gojo.enemies.find((x) => x.alive)!;
    e.x = gojo.x + 20;
    e.y = gojo.y;
    gojo.setAimWorld(gojo.x + 200, gojo.y);
    gojo.wantFire = true;
    gojo.tick(0.02);
    assert.ok(gojo.punchHits >= 1);
    assert.equal(gojo.bullets.filter((b) => b.alive && b.kind === 0).length, 0);
    assert.ok(e.hp < e.max);
  });

  it("fires 解 on LMB / stick, not auto", () => {
    const sukuna = new HordeSim("sukuna");
    sukuna.tick(0.5);
    assert.equal(sukuna.bullets.filter((b) => b.alive && b.kind === 4).length, 0);
    sukuna.setFireStick(1, 0);
    sukuna.tick(0.02);
    assert.ok(sukuna.bullets.some((b) => b.alive && b.kind === 4));
  });

  it("does not grant six 赫 from a 20s timer", () => {
    const timed = new HordeSim("gojo");
    timed.time = 24;
    for (let i = 0; i < 8; i++) timed.tick(0.05);
    assert.equal(timed.weps.red, 0);
    assert.equal(timed.hud().nextSkill, "六赫");
  });

  it("auto-unlocks the ladder skill on level-up, then opens a forge", () => {
    const leveled = new HordeSim("gojo");
    leveled.xp = leveled.need;
    leveled.drainLevels();
    assert.equal(leveled.lv, 2);
    assert.equal(leveled.weps.red, 1);
    assert.equal(leveled.shopKind, "forge");
    assert.ok(leveled.picks);
    assert.ok(leveled.picks!.every((p) => p.tag === "锻造"));
    assert.ok(!leveled.picks!.some((p) => p.id === "red" || p.id === "split"));
    leveled.cd.red = 0;
    leveled.fire(0.016);
    assert.ok(leveled.bullets.filter((b) => b.alive && b.kind === 1).length >= 6);
  });

  it("level-up adds HP only; punch damage stays until 伤害砧", () => {
    const sim = new HordeSim("gojo");
    const d1 = sim.verbDmg(PUNCH_BASE);
    sim.lv = 5;
    sim.applyStats();
    assert.equal(sim.maxHp, levelHp(5));
    assert.equal(sim.verbDmg(PUNCH_BASE), d1);
    sim.weps.power = 2;
    assert.equal(sim.verbDmg(PUNCH_BASE), PUNCH_BASE * forgeDamageMul(2));
  });

  it("频率砧 shortens 平A cooldown, not 增多", () => {
    const a = new HordeSim("gojo");
    const b = new HordeSim("gojo");
    b.weps.rate = 3;
    b.weps.more = 4;
    a.applyStats();
    b.applyStats();
    assert.ok(b.hud().activeMax < a.hud().activeMax);
    const s1 = new HordeSim("sukuna");
    const s2 = new HordeSim("sukuna");
    s2.weps.rate = 2;
    assert.ok(s2.hud().activeMax < s1.hud().activeMax);
  });

  it("every level is one forge; hex only after forge at 3/6/9", () => {
    const sim = new HordeSim("gojo");
    sim.xp = sim.need;
    sim.drainLevels();
    assert.equal(sim.lv, 2);
    assert.equal(sim.shopKind, "forge");
    const a1 = sim.picks![0]!.id;
    sim.choose(a1);
    assert.equal(sim.picks, null);
    assert.ok(sim.weps[a1] >= 1);

    sim.xp = sim.need;
    sim.drainLevels();
    assert.equal(sim.lv, 3);
    assert.equal(sim.weps.blue, 1);
    assert.equal(sim.shopKind, "forge");
    assert.ok(sim.picks!.every((p) => p.tag === "锻造"));
    sim.choose(sim.picks![0]!.id);
    assert.equal(sim.shopKind, "hex");
    assert.ok(sim.picks!.every((p) => p.tag === "海克斯"));
    const hexId = sim.picks![0]!.id;
    sim.choose(hexId);
    assert.equal(sim.picks, null);
    assert.ok(sim.weps[hexId] >= 1);
  });

  it("level 6 grants domain without a pick, then forge and hex", () => {
    const sim = new HordeSim("gojo");
    while (sim.lv < 6) {
      sim.xp = sim.need;
      sim.drainLevels();
      let guard = 0;
      while (sim.picks && guard++ < 8) sim.choose(sim.picks[0]!.id);
    }
    assert.equal(sim.lv, 6);
    assert.equal(sim.weps.domain, 1);
    assert.equal(sim.weps.ripple, 1);
    assert.equal(sim.weps.purple, 1);
    assert.ok(!sim.picks || !sim.picks.some((p) => p.id === "domain"));
  });

  it("Sukuna level 2 grants a second 解 wave", () => {
    const sim = new HordeSim("sukuna");
    sim.xp = sim.need;
    sim.drainLevels();
    assert.equal(sim.weps.wave, 1);
    assert.equal(sim.shopKind, "forge");
    sim.choose(sim.picks![0]!.id);
    sim.crit = 0;
    sim.setAimWorld(sim.x + 200, sim.y);
    sim.facing = 0;
    sim.cd.slash = 0;
    sim.fireSlash(0);
    const first = sim.bullets.filter((b) => b.alive && b.kind === 4).length;
    assert.ok(first >= 1);
    for (let i = 0; i < 8; i++) sim.tick(0.02);
    const after = sim.bullets.filter((b) => b.alive && b.kind === 4).length;
    assert.ok(after > first);
  });

  it("cuts 捌 as percent HP from 伤害砧, not level", () => {
    const sim = new HordeSim("sukuna");
    sim.birth(0, { near: true });
    sim.birth(3, { near: true });
    const fly = sim.enemies.find((e) => e.alive && e.kind === 0)!;
    const boss = sim.enemies.find((e) => e.alive && e.kind === 3)!;
    fly.x = sim.x + 20;
    fly.y = sim.y;
    boss.x = sim.x + 24;
    boss.y = sim.y;
    const base = sim.cleaveCut(fly);
    assert.ok(base >= fly.max * CLEAVE_PCT);
    assert.ok(base >= PUNCH_BASE * 0.3);
    assert.ok(base * 4 >= fly.max);
    sim.lv = 8;
    sim.applyStats();
    assert.equal(sim.cleaveCut(fly), base);
    sim.weps.power = 2;
    assert.ok(sim.cleaveCut(fly) > base);
    assert.ok(sim.cleaveCut(boss) < boss.max * 0.02);
    assert.ok(sim.cleaveCut(boss) > 4);
    const hpF = fly.hp;
    sim.cd.cleave = 0;
    sim.volleyCleave();
    assert.ok(fly.hp < hpF);
  });

  it("blocks a surround of flyheads at start; 灾核 still hits", () => {
    const sim = new HordeSim("gojo");
    const hp0 = sim.hp;
    for (let i = 0; i < 16; i++) {
      sim.birth(0, { near: true });
      const e = sim.enemies.filter((x) => x.alive).at(-1)!;
      e.x = sim.x + 8 + (i % 4);
      e.y = sim.y + Math.floor(i / 4);
    }
    for (let i = 0; i < 40; i++) sim.stepShell(0.05);
    assert.equal(sim.shellLeak, false);
    sim.invuln = 0;
    sim.contact();
    assert.equal(sim.hp, hp0);

    sim.birth(3, { near: true });
    const boss = sim.enemies.find((e) => e.alive && e.kind === 3)!;
    boss.x = sim.x;
    boss.y = sim.y;
    sim.invuln = 0;
    sim.contact();
    assert.ok(sim.hp < hp0);
  });

  it("treats Black Flash as a timing state, not a bounce", () => {
    const sim = new HordeSim("gojo");
    sim.weps.flash = 2;
    sim.applyStats();
    sim.castDash();
    for (let i = 0; i < 12; i++) sim.stepDash(0.02);
    assert.ok(sim.bfWindow > 0);
    sim.birth(0, { near: true });
    const e = sim.enemies.find((x) => x.alive)!;
    e.x = sim.x + 30;
    e.y = sim.y;
    sim.hurtEnemy(e, 8, 0, 0, false, "none");
    assert.ok(sim.bfHits >= 1);
    assert.ok(sim.bfBuff > 0);
    assert.equal(sim.chains.filter((c) => c.kind === 0).length, 0);
  });

  it("turns Sukuna's wheel after repeated contact", () => {
    const sim = new HordeSim("sukuna");
    sim.weps.adapt = 1;
    sim.applyStats();
    for (let i = 0; i < 5; i++) {
      sim.invuln = 0;
      sim.hurtPlayer(3, "contact");
    }
    assert.equal(sim.adaptOn, "contact");
    const hp = sim.hp;
    sim.invuln = 0;
    sim.hurtPlayer(20, "contact");
    assert.ok(sim.hp > hp - 20);
    sim.adaptFill = 2;
    sim.adaptFocus = "contact";
    sim.feedAdapt("laser");
    assert.ok(sim.adaptFill < 2);
  });

  it("records death and time-clear", () => {
    const dead = new HordeSim("gojo");
    dead.hp = 0;
    dead.tick(0.016);
    assert.equal(dead.over, true);
    assert.equal(dead.won, false);

    const win = new HordeSim("sukuna");
    win.time = CLEAR_TIME - 0.01;
    win.tick(0.05);
    assert.equal(win.over, true);
    assert.equal(win.won, true);
  });

  it("does not process input after the run ends", () => {
    const sim = new HordeSim("gojo");
    sim.finish(false);
    const t = sim.time;
    sim.setMoveTarget(sim.x + 200, sim.y);
    sim.setKeys(["KeyQ"]);
    sim.tick(0.2);
    assert.equal(sim.time, t);
  });

  it("converts screen clicks through the camera", () => {
    const sim = new HordeSim("gojo");
    sim.camx = sim.x;
    sim.camy = sim.y;
    sim.setMoveFromScreen(640, 400, 1280, 800);
    assert.ok(Math.abs(sim.tx - sim.x) < 1);
    sim.setMoveFromScreen(1280, 400, 1280, 800);
    assert.ok(sim.tx > sim.x + 200);
  });

  it("does not pause over a forge pick", () => {
    const sim = new HordeSim("gojo");
    sim.offer();
    assert.ok(sim.picks);
    sim.togglePause();
    assert.equal(sim.userPaused, false);
    assert.ok(sim.picks);
  });

  it("spawns sweep lasers when those kit verbs are granted", () => {
    const gojo = new HordeSim("gojo");
    gojo.weps.ray = 1;
    gojo.fire(0.016);
    assert.ok(gojo.lasers.some((l) => l.alive && l.hue === 0));
    const sukuna = new HordeSim("sukuna");
    sukuna.weps.beam = 2;
    sukuna.fire(0.016);
    assert.ok(sukuna.lasers.some((l) => l.alive && l.hue === 1));
  });

  it("two punches kill a wave-1 flyhead; one leaves a sliver", () => {
    const sim = new HordeSim("gojo");
    sim.crit = 0;
    sim.birth(0, { near: true });
    const e = sim.enemies.find((x) => x.alive)!;
    e.x = sim.x + 18;
    e.y = sim.y;
    e.max = 10;
    e.hp = 10;
    sim.setAimWorld(e.x, e.y);
    sim.cd.punch = 0;
    sim.wantFire = true;
    sim.castActive();
    assert.equal(sim.punchHits, 1);
    assert.ok(e.alive);
    assert.ok(e.hp > 0 && e.hp <= 2.2);
    sim.cd.punch = 0;
    sim.castActive();
    assert.equal(sim.punchHits, 2);
    assert.ok(e.hp <= 0 || !e.alive);
  });

  it("解 matches punch TTK on a wave-1 flyhead", () => {
    const sim = new HordeSim("sukuna");
    sim.crit = 0;
    sim.birth(0, { near: true });
    const e = sim.enemies.find((x) => x.alive)!;
    e.x = sim.x + 24;
    e.y = sim.y;
    e.max = 10;
    e.hp = 10;
    sim.setAimWorld(e.x, e.y);
    sim.facing = 0;
    sim.cd.slash = 0;
    sim.fireSlash(0);
    sim.moveBullets(0.08);
    assert.ok(e.alive);
    assert.ok(e.hp > 0 && e.hp < e.max);
    sim.cd.slash = 0;
    sim.fireSlash(0);
    sim.moveBullets(0.08);
    assert.ok(e.hp <= 0 || !e.alive);
  });

  it("2–3 六赫 bolts kill a wave-1 flyhead", () => {
    const sim = new HordeSim("gojo");
    sim.crit = 0;
    sim.weps.red = 1;
    sim.weps.more = 0;
    sim.weps.split = 0;
    sim.birth(0, { near: true });
    const e = sim.enemies.find((x) => x.alive)!;
    e.x = sim.x + 80;
    e.y = sim.y;
    e.max = 10;
    e.hp = 10;
    const bolt = sim.verbDmg(RED_BASE);
    assert.ok(bolt < sim.verbDmg(PUNCH_BASE));
    assert.ok(bolt * 2 < 10 || bolt * 2 >= 9);
    assert.ok(bolt * 3 >= 10);
  });
});
