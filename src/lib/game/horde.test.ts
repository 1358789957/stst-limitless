import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLEAR_TIME, EXTRA_START, HordeSim, WORLD } from "./horde.ts";

describe("HordeSim", () => {
  it("starts with the character kit and extra start weapon", () => {
    const gojo = new HordeSim("gojo");
    assert.equal(gojo.charId, "gojo");
    assert.equal(gojo.weps.limitless, 1);
    assert.equal(gojo.weps.blue, 1);
    assert.equal(gojo.hud().activeName, "苍");

    const plus = new HordeSim("sukuna", { extraStart: true });
    assert.equal(plus.weps.slash, 1);
    assert.equal(plus.weps.cleave, 1);
    assert.equal(plus.weps[EXTRA_START.sukuna], 1);
    const w = plus.hud().skills.find((s) => s.key === "W");
    assert.equal(w?.unlocked, true);
    assert.equal(w?.name, "捌");
    assert.equal(plus.hud().activeName, "解");
  });

  it("walks toward a move target and stops on arrival", () => {
    const sim = new HordeSim("gojo");
    const x0 = sim.x;
    sim.setMoveTarget(x0 + 240, sim.y);
    sim.tick(0.2);
    assert.ok(sim.x > x0);
    assert.ok(sim.getSpeed() > 0);

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
    assert.equal(sim.userPaused, true);
    sim.setKeys(["KeyQ", "KeyR"]);
    sim.tick(0.5);
    assert.equal(sim.time, t);
    assert.equal(sim.dashT, 0);
    sim.togglePause();
    sim.tick(0.1);
    assert.ok(sim.time > t);
  });

  it("does not treat W as movement", () => {
    const sim = new HordeSim("gojo");
    const x0 = sim.x;
    const y0 = sim.y;
    sim.setKeys(["KeyW"]);
    sim.tick(0.25);
    assert.equal(sim.x, x0);
    assert.equal(sim.y, y0);
  });

  it("maps QWER to dash, secondary, burst, domain", () => {
    const sim = new HordeSim("gojo");
    sim.setMoveTarget(sim.x + 400, sim.y);
    sim.setKeys(["KeyQ"]);
    sim.tick(0.016);
    assert.ok(sim.dashCd > 0);
    sim.keys.clear();

    sim.weps.red = 1;
    const beforeRed = sim.bullets.filter((b) => b.alive && b.kind === 1).length;
    sim.castW();
    assert.ok(sim.bullets.filter((b) => b.alive && b.kind === 1).length > beforeRed);

    sim.castE();
    assert.equal(sim.bullets.some((b) => b.alive && b.kind === 2), false);
    sim.weps.purple = 1;
    sim.castE();
    assert.ok(sim.bullets.some((b) => b.alive && b.kind === 2));

    sim.weps.domain = 1;
    sim.setKeys(["KeyR"]);
    sim.tick(0.016);
    assert.equal(sim.usedDomain, true);
    assert.ok(sim.domainCd > 0);
  });

  it("maps Sukuna QWER to 瞬斩, 捌, 开, 术域", () => {
    const sim = new HordeSim("sukuna");
    const slots = sim.hud().skills;
    assert.deepEqual(
      slots.map((s) => s.name),
      ["瞬斩", "捌", "开", "伏魔"],
    );
    assert.equal(slots.find((s) => s.key === "Q")?.unlocked, true);
    assert.equal(slots.find((s) => s.key === "W")?.unlocked, true);

    sim.castW();
    assert.ok((sim.cd.cleave ?? 0) > 0);

    sim.weps.flame = 1;
    sim.castE();
    assert.ok(sim.bullets.some((b) => b.alive && b.kind === 5));

    sim.weps.domain = 1;
    sim.castDomain();
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

  it("converts screen clicks through the camera", () => {
    const sim = new HordeSim("gojo");
    sim.camx = sim.x;
    sim.camy = sim.y;
    sim.setMoveFromScreen(640, 400, 1280, 800);
    assert.ok(Math.abs(sim.tx - sim.x) < 1);
    assert.ok(Math.abs(sim.ty - sim.y) < 1);
    sim.setMoveFromScreen(1280, 400, 1280, 800);
    assert.ok(sim.tx > sim.x + 200);
  });

  it("does not pause over a level-up pick", () => {
    const sim = new HordeSim("gojo");
    sim.xp = sim.need;
    sim.drop(sim.x, sim.y, 1);
    for (let i = 0; i < 8; i++) sim.gemsStep(0.05);
    assert.ok(sim.picks);
    assert.equal(sim.paused, true);
    sim.togglePause();
    assert.equal(sim.userPaused, false);
    assert.ok(sim.picks);
  });

  it("applies a chosen upgrade and unpauses", () => {
    const sim = new HordeSim("gojo");
    sim.offer();
    assert.ok(sim.picks);
    const id = sim.picks[0]!.id;
    const before = sim.weps[id];
    sim.choose(id);
    assert.equal(sim.picks, null);
    assert.equal(sim.paused, false);
    assert.equal(sim.weps[id], before + 1);
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
    assert.ok(win.time >= CLEAR_TIME);
    assert.ok(win.hud().won);
  });

  it("shows QWER ranks after a skill unlocks", () => {
    const sim = new HordeSim("gojo");
    const q = sim.hud().skills.find((s) => s.key === "Q");
    assert.equal(q?.rank, 0);
    sim.weps.red = 2;
    sim.weps.purple = 1;
    const hud = sim.hud();
    assert.equal(hud.skills.find((s) => s.key === "W")?.rank, 2);
    assert.equal(hud.skills.find((s) => s.key === "E")?.rank, 1);
    assert.equal(hud.weps.some((w) => w.id === "limitless" && w.lv === 1), true);
    assert.equal(hud.weps.some((w) => w.id === "blue" && w.lv === 1), true);
  });

  it("evolves 无极 into a double pulse at rank 3", () => {
    const sim = new HordeSim("gojo");
    sim.weps.limitless = 3;
    sim.cd.limitless = 0;
    const before = sim.fx.filter((f) => f.alive).length;
    sim.fire(0.016);
    const rings = sim.fx.filter((f) => f.alive).length;
    assert.ok(rings >= before + 2);
  });

  it("fires a second 虚式 beam at rank 4", () => {
    const sim = new HordeSim("gojo");
    sim.weps.purple = 4;
    sim.castE();
    assert.equal(sim.bullets.filter((b) => b.alive && b.kind === 2).length, 2);
  });

  it("hops 咒痕 from a 苍 hit onto a neighbor", () => {
    const sim = new HordeSim("gojo");
    sim.weps.ripple = 2;
    sim.birth(0, { near: true });
    sim.birth(0, { near: true });
    const live = sim.enemies.filter((e) => e.alive);
    assert.ok(live.length >= 2);
    live[0]!.x = sim.x + 30;
    live[0]!.y = sim.y;
    live[1]!.x = sim.x + 80;
    live[1]!.y = sim.y;
    const hp1 = live[1]!.hp;
    sim.shot(0, sim.x, sim.y, 400, 0, 40, 0.4, 0, 0, 10);
    sim.moveBullets(0.05);
    sim.stepChains(0.2);
    assert.ok(live[1]!.hp < hp1 || sim.chains.length > 0 || sim.fields.some((f) => f.alive));
  });

  it("spawns a sweeping 扫射 laser when unlocked", () => {
    const sim = new HordeSim("gojo");
    sim.weps.ray = 1;
    sim.fire(0.016);
    assert.ok(sim.lasers.some((l) => l.alive && l.hue === 0));
  });

  it("spawns a 光刃 laser for Sukuna", () => {
    const sim = new HordeSim("sukuna");
    sim.weps.beam = 2;
    sim.fire(0.016);
    assert.ok(sim.lasers.some((l) => l.alive && l.hue === 1));
  });

  it("does not process input after the run ends", () => {
    const sim = new HordeSim("gojo");
    sim.finish(false);
    const t = sim.time;
    sim.setMoveTarget(sim.x + 200, sim.y);
    sim.setKeys(["KeyQ"]);
    sim.tick(0.2);
    assert.equal(sim.time, t);
    assert.equal(sim.over, true);
  });

  it("does not auto-fire 苍 or 解 without LMB / stick", () => {
    const gojo = new HordeSim("gojo");
    gojo.tick(0.6);
    assert.equal(gojo.bullets.filter((b) => b.alive && b.kind === 0).length, 0);
    gojo.setAimWorld(gojo.x + 200, gojo.y);
    gojo.wantFire = true;
    gojo.tick(0.02);
    assert.ok(gojo.bullets.some((b) => b.alive && b.kind === 0));

    const sukuna = new HordeSim("sukuna");
    sukuna.tick(0.5);
    assert.equal(sukuna.bullets.filter((b) => b.alive && b.kind === 4).length, 0);
    sukuna.setFireStick(1, 0);
    sukuna.tick(0.02);
    assert.ok(sukuna.bullets.some((b) => b.alive && b.kind === 4));
  });

  it("does not treat letter keys as basic attack", () => {
    const sim = new HordeSim("gojo");
    sim.setKeys(["KeyA", "KeyS", "KeyD"]);
    sim.tick(0.5);
    assert.equal(sim.bullets.filter((b) => b.alive && b.kind === 0).length, 0);
    assert.equal(sim.x, WORLD / 2);
  });

  it("cuts 捌 as a percent of target max HP", () => {
    const sim = new HordeSim("sukuna");
    sim.birth(0, { near: true });
    sim.birth(3, { near: true });
    const fly = sim.enemies.find((e) => e.alive && e.kind === 0)!;
    const boss = sim.enemies.find((e) => e.alive && e.kind === 3)!;
    fly.x = sim.x + 20;
    fly.y = sim.y;
    boss.x = sim.x + 24;
    boss.y = sim.y;
    const flyCut = sim.cleaveCut(fly);
    const bossCut = sim.cleaveCut(boss);
    assert.ok(flyCut > fly.max * 0.3);
    assert.ok(flyCut < fly.max * 0.7);
    assert.ok(bossCut < boss.max * 0.12);
    assert.ok(bossCut > 8);
    const hpF = fly.hp;
    const hpB = boss.hp;
    sim.cd.cleave = 0;
    sim.volleyCleave();
    assert.ok(fly.hp < hpF);
    assert.ok(boss.hp < hpB);
    assert.ok(boss.hp > boss.max * 0.7);
  });

  it("holds a few flyheads and leaks when smothered; 灾核 still hits", () => {
    const sim = new HordeSim("gojo");
    sim.weps.limitless = 1;
    sim.applyStats();
    for (let i = 0; i < 5; i++) {
      sim.birth(0, { near: true });
      const e = sim.enemies.filter((x) => x.alive).at(-1)!;
      e.x = sim.x + 20 + i;
      e.y = sim.y;
    }
    const hp0 = sim.hp;
    for (let i = 0; i < 40; i++) sim.stepShell(0.05);
    assert.equal(sim.shellLeak, false);
    assert.equal(sim.hp, hp0);
    sim.invuln = 0;
    sim.contact();
    assert.equal(sim.hp, hp0);

    for (let i = 0; i < 8; i++) {
      sim.birth(0, { near: true });
      const e = sim.enemies.filter((x) => x.alive).at(-1)!;
      e.x = sim.x + 18;
      e.y = sim.y + i;
    }
    for (let i = 0; i < 50; i++) sim.stepShell(0.05);
    assert.equal(sim.shellLeak, true);

    const mid = new HordeSim("gojo");
    mid.weps.limitless = 2;
    mid.applyStats();
    mid.birth(0, { near: true });
    const fly = mid.enemies.find((e) => e.alive)!;
    fly.x = mid.x + 6;
    fly.y = mid.y;
    mid.invuln = 0;
    mid.contact();
    assert.equal(mid.hp, 100);

    mid.birth(3, { near: true });
    const boss = mid.enemies.find((e) => e.alive && e.kind === 3)!;
    boss.x = mid.x;
    boss.y = mid.y;
    mid.invuln = 0;
    mid.contact();
    assert.ok(mid.hp < 100);
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
    assert.ok(sim.adaptTurns >= 1);
    const hp = sim.hp;
    sim.invuln = 0;
    sim.hurtPlayer(20, "contact");
    assert.ok(sim.hp > hp - 20);
    sim.adaptFill = 2;
    sim.adaptFocus = "contact";
    sim.feedAdapt("laser");
    assert.ok(sim.adaptFill < 2);
  });
});
