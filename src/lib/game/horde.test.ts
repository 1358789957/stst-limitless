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
  });

  it("moves with WASD and pauses time", () => {
    const sim = new HordeSim("gojo");
    const x0 = sim.x;
    sim.setKeys(["KeyD"]);
    sim.tick(0.2);
    assert.ok(sim.x > x0);
    assert.ok(sim.getSpeed() > 0);

    const t = sim.time;
    sim.togglePause();
    assert.equal(sim.userPaused, true);
    sim.tick(0.5);
    assert.equal(sim.time, t);
    sim.togglePause();
    sim.tick(0.1);
    assert.ok(sim.time > t);
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

  it("dashes, fires purple after unlock, and expands domain", () => {
    const sim = new HordeSim("gojo");
    const x0 = sim.x;
    sim.ax = 1;
    sim.ay = 0;
    sim.castDash();
    assert.ok(sim.dashT > 0);
    sim.tick(0.2);
    assert.ok(sim.x > x0);
    assert.ok(sim.dashCd > 0);

    sim.castPurple();
    assert.equal(sim.bullets.some((b) => b.alive && b.kind === 2), false);

    sim.weps.purple = 1;
    sim.castPurple();
    assert.ok(sim.bullets.some((b) => b.alive && b.kind === 2));
    assert.ok(sim.purpleCd > 0);

    sim.weps.domain = 1;
    sim.castDomain();
    assert.equal(sim.usedDomain, true);
    assert.ok(sim.freeze > 0);
    assert.ok(sim.domainCd > 0);
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
    assert.ok(win.hud().won);
  });

  it("does not process input after the run ends", () => {
    const sim = new HordeSim("gojo");
    sim.finish(false);
    const t = sim.time;
    sim.setKeys(["KeyW"]);
    sim.tick(0.2);
    assert.equal(sim.time, t);
    assert.equal(sim.over, true);
  });
});
