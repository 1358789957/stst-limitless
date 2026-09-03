import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ANVIL_IDS,
  anvilPool,
  emptyWeps,
  forgeDamageMul,
  HEX_EVERY,
  hexPool,
  isAnvilId,
  isHexLevel,
  isMutationId,
  ladderSkillAt,
  levelHp,
  MUTATION_IDS,
  nextLadderSkill,
  rollForge,
  rollHex,
  SKILL_LADDER,
  UPGRADES,
  xpToReach,
} from "./upgrades.ts";

function seq(vals: number[]) {
  let i = 0;
  return () => vals[i++ % vals.length]!;
}

describe("growth rail", () => {
  it("gives each card distinct rank copy", () => {
    for (const u of UPGRADES) {
      const lines = Array.from({ length: u.max }, (_, n) => u.desc(n + 1));
      assert.equal(new Set(lines).size, u.max, u.id);
    }
  });

  it("level only thickens HP", () => {
    assert.equal(levelHp(1), 100);
    assert.equal(levelHp(2), 114);
    assert.equal(levelHp(5), 156);
  });

  it("damage mul is anvil stacks, not level", () => {
    assert.equal(forgeDamageMul(0), 1);
    assert.equal(forgeDamageMul(1), 1.15);
    assert.equal(forgeDamageMul(2), 1.3);
  });

  it("anvil pool is 伤害+频率 plus character knobs, never skills", () => {
    const g = emptyWeps();
    g.limitless = 1;
    const gojo = anvilPool("gojo", g);
    assert.ok(gojo.includes("power"));
    assert.ok(gojo.includes("rate"));
    assert.ok(gojo.includes("infCap"));
    assert.ok(gojo.includes("infRad"));
    assert.ok(!gojo.includes("blue"));
    assert.ok(!gojo.includes("cleaveN"));

    const s = emptyWeps();
    s.slash = 1;
    s.cleave = 1;
    const sukuna = anvilPool("sukuna", s);
    assert.deepEqual(sukuna.sort(), ["cleaveN", "power", "rate"]);
  });

  it("rollForge is three anvil shards tagged 锻造", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.fist = 1;
    const picks = rollForge("gojo", weps, seq([0.01, 0.2, 0.8]));
    assert.equal(picks.length, 3);
    assert.ok(picks.every((p) => p.tag === "锻造"));
    assert.ok(picks.every((p) => isAnvilId(p.id)));
    assert.ok(!picks.some((p) => p.id === "blue" || p.id === "domain" || p.id === "blades"));
  });

  it("rollHex is three mutations tagged 海克斯", () => {
    const weps = emptyWeps();
    const picks = rollHex(weps, seq([0.1, 0.4, 0.9]));
    assert.equal(picks.length, 3);
    assert.ok(picks.every((p) => p.tag === "海克斯"));
    assert.ok(picks.every((p) => isMutationId(p.id)));
    assert.deepEqual(hexPool(weps), MUTATION_IDS);
  });

  it("never offers a skill-rank +damage card", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.fist = 1;
    for (let i = 0; i < 20; i++) {
      const forge = rollForge("gojo", weps, () => (i * 17 + 3) % 100 / 100);
      const hex = rollHex(weps, () => (i * 13 + 5) % 100 / 100);
      for (const p of [...forge, ...hex]) {
        assert.ok(p.id !== "fist" && p.id !== "red" && p.id !== "domain");
        assert.ok(!/^苍\+/.test(p.name));
        assert.ok(!/^解\+/.test(p.name));
        assert.ok(!/^赫\+/.test(p.name));
      }
    }
  });

  it("hex levels are 3/6/9", () => {
    assert.equal(HEX_EVERY, 3);
    assert.equal(isHexLevel(2), false);
    assert.equal(isHexLevel(3), true);
    assert.equal(isHexLevel(6), true);
    assert.equal(isHexLevel(9), true);
    assert.equal(isHexLevel(4), false);
  });

  it("auto ladders land domain at 6", () => {
    assert.deepEqual(SKILL_LADDER.gojo, ["red", "blue", "purple", "ripple", "domain"]);
    assert.deepEqual(SKILL_LADDER.sukuna, ["wave", "flame", "blades", "adapt", "domain"]);
    assert.equal(ladderSkillAt("gojo", 2), "red");
    assert.equal(ladderSkillAt("gojo", 6), "domain");
    assert.equal(ladderSkillAt("sukuna", 2), "wave");
    assert.equal(ladderSkillAt("sukuna", 4), "blades");
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.fist = 1;
    assert.equal(nextLadderSkill("gojo", weps), "red");
  });

  it("needs about 182 XP to reach level 6", () => {
    assert.equal(xpToReach(6), 182);
    assert.ok(xpToReach(9) > 400);
  });

  it("six mutations exist", () => {
    assert.deepEqual(MUTATION_IDS, ["split", "focus", "chain", "more", "size", "linger"]);
  });

  it("anvil ids do not include kit verbs", () => {
    assert.ok(!ANVIL_IDS.includes("blue"));
    assert.ok(!ANVIL_IDS.includes("blades"));
    assert.ok(ANVIL_IDS.includes("cleaveN"));
  });
});
