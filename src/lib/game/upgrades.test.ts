import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  anvilChainChance,
  anvilPool,
  emptyWeps,
  forgeDamageMul,
  isAnvilId,
  isMutationId,
  levelHp,
  MAX_ANVIL_CHAIN,
  MUTATION_IDS,
  rollPicks,
  shopClosesOn,
  shouldChainAnvil,
  UPGRADES,
} from "./upgrades.ts";

function seq(vals: number[]) {
  let i = 0;
  return () => vals[i++ % vals.length]!;
}

describe("forge bags", () => {
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

  it("anvil pool is 伤害+频率; Gojo also gets Infinity knobs", () => {
    const g = emptyWeps();
    g.limitless = 1;
    const gojo = anvilPool("gojo", g, 10, 2);
    assert.ok(gojo.includes("power"));
    assert.ok(gojo.includes("rate"));
    assert.ok(gojo.includes("infCap"));
    assert.ok(gojo.includes("infRad"));
    assert.ok(!gojo.includes("blue"));
    const late = anvilPool("gojo", g, 60, 5);
    assert.ok(late.includes("blue"));

    const s = emptyWeps();
    s.slash = 1;
    s.cleave = 1;
    const sukuna = anvilPool("sukuna", s, 10, 2);
    assert.deepEqual(sukuna.sort(), ["power", "rate"]);
  });

  it("mixes 专属 and 质变 without forcing one of each", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.fist = 1;
    const a = rollPicks("gojo", weps, 8, 2, seq([0.01, 0, 0.01, 0, 0.01, 0]));
    const b = rollPicks("gojo", weps, 8, 2, seq([0.7, 0, 0.7, 0.2, 0.7, 0.4]));
    assert.equal(a.length, 3);
    assert.equal(b.length, 3);
    assert.ok(a.every((p) => p.tag === "专属" || p.tag === "质变" || p.tag === "支援" || p.tag === "术域" || p.tag === "合成"));
    assert.ok(!a.some((p) => /苍\+1|解\+1|赫\+1/.test(`${p.name}${p.desc}`)));
  });

  it("never offers a skill-rank +damage card", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.fist = 1;
    weps.slash = 1;
    weps.cleave = 1;
    for (let i = 0; i < 20; i++) {
      const picks = rollPicks("gojo", weps, 20, 3, () => (i * 17 + 3) % 100 / 100);
      for (const p of picks) {
        assert.ok(p.id !== "fist");
        assert.ok(!/^苍\+/.test(p.name));
        assert.ok(!/^解\+/.test(p.name));
        assert.ok(!/^赫\+/.test(p.name));
      }
    }
  });

  it("质变 closes the shop; 专属 can chain", () => {
    assert.equal(shopClosesOn("split"), true);
    assert.equal(shopClosesOn("more"), true);
    assert.equal(shopClosesOn("power"), false);
    assert.equal(shopClosesOn("rate"), false);
    assert.equal(shopClosesOn("infCap"), false);
    assert.equal(isAnvilId("power"), true);
    assert.equal(isMutationId("linger"), true);
  });

  it("chain chance drops and caps at 3 extras", () => {
    assert.ok(anvilChainChance(0) > anvilChainChance(1));
    assert.ok(anvilChainChance(1) > anvilChainChance(2));
    assert.equal(anvilChainChance(3), 0);
    assert.equal(MAX_ANVIL_CHAIN, 3);
    assert.equal(shouldChainAnvil(0, () => 0), true);
    assert.equal(shouldChainAnvil(0, () => 0.99), false);
    assert.equal(shouldChainAnvil(3, () => 0), false);
  });

  it("six mutations exist", () => {
    assert.deepEqual(MUTATION_IDS, ["split", "focus", "chain", "more", "size", "linger"]);
  });
});
