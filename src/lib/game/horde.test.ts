import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLEAR_TIME, EXTRA_START, HordeSim } from "./horde.ts";

describe("HordeSim", () => {
  it("starts with the character kit and extra start weapon", () => {
    const gojo = new HordeSim("gojo");
    assert.equal(gojo.charId, "gojo");
    assert.equal(gojo.weps.limitless, 1);
    assert.equal(gojo.weps.blue, 0);

    const plus = new HordeSim("sukuna", { extraStart: true });
    assert.equal(plus.weps.slash, 1);
    assert.equal(plus.weps[EXTRA_START.sukuna], 1);
    const w = plus.hud().skills.find((s) => s.key === "W");
    assert.equal(w?.unlocked, true);
    assert.equal(w?.name, "捌");
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
    assert.equal(slots.find((s) => s.key === "W")?.unlocked, false);

    sim.weps.cleave = 1;
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
});
