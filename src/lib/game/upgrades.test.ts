import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  craftId,
  emptyWeps,
  makeOffer,
  rollPicks,
  spotlightId,
  UPGRADES,
} from "./upgrades.ts";

const zero = () => 0;

describe("upgrade picks", () => {
  it("gives each technique distinct rank steps", () => {
    for (const u of UPGRADES) {
      const lines = Array.from({ length: u.max }, (_, i) => u.desc(i + 1));
      assert.equal(new Set(lines).size, u.max, u.id);
    }
  });

  it("spotlights purple then domain for Gojo", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.blue = 1;
    assert.equal(spotlightId("gojo", weps, 10, 4), null);
    assert.equal(spotlightId("gojo", weps, 60, 5), "purple");
    weps.purple = 1;
    assert.equal(spotlightId("gojo", weps, 100, 7), "domain");
  });

  it("spotlights cleave then flame for Sukuna", () => {
    const weps = emptyWeps();
    weps.slash = 1;
    weps.cleave = 1;
    assert.equal(spotlightId("sukuna", weps, 10, 3), null);
    assert.equal(spotlightId("sukuna", weps, 65, 5), "flame");
  });

  it("early 3-pick forks new verbs instead of tiny bumps", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    const picks = rollPicks("gojo", weps, 20, 2, zero);
    assert.equal(picks.length, 3);
    const fresh = picks.filter((p) => p.tag === "新术");
    assert.ok(fresh.length >= 2);
    assert.ok(fresh.some((p) => p.id === "blue"));
    assert.ok(fresh.some((p) => p.id === "red" || p.id === "clone"));
    assert.ok(!picks.some((p) => p.id === "domain"));
    const ids = new Set(picks.map((p) => p.id));
    assert.equal(ids.size, 3);
  });

  it("always includes the mid spotlight in a 3-pick", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.blue = 2;
    const picks = rollPicks("gojo", weps, 60, 5, zero);
    assert.equal(picks.length, 3);
    assert.ok(picks.some((p) => p.id === "purple"));
  });

  it("deepens an owned skill when last pick is set", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.blue = 1;
    const picks = rollPicks("gojo", weps, 40, 3, zero, "blue");
    assert.ok(picks.some((p) => p.id === "blue" && p.tag === "进化" && p.from === 1 && p.to === 2));
  });

  it("offers 合成 when 苍 and 赫 are both rank 2+", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.blue = 2;
    weps.red = 2;
    assert.equal(craftId("gojo", weps), "purple");
    const picks = rollPicks("gojo", weps, 70, 5, zero);
    const craft = picks.find((p) => p.tag === "合成");
    assert.ok(craft);
    assert.equal(craft!.id, "purple");
    assert.match(craft!.name, /合成/);
  });

  it("offers 开·合成 when 解 and 捌 are both rank 2+", () => {
    const weps = emptyWeps();
    weps.slash = 2;
    weps.cleave = 2;
    const picks = rollPicks("sukuna", weps, 70, 5, zero);
    assert.ok(picks.some((p) => p.id === "flame" && p.tag === "合成"));
  });

  it("makeOffer writes the next rank change", () => {
    const weps = emptyWeps();
    weps.blue = 1;
    const o = makeOffer("blue", weps);
    assert.equal(o.tag, "进化");
    assert.match(o.desc, /两颗/);
    assert.equal(o.to, 2);
  });

  it("puts 咒痕 and 扫射 in Gojo's verb pool", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    const picks = rollPicks("gojo", weps, 35, 3, () => 0.4);
    const ids = picks.map((p) => p.id);
    assert.ok(ids.some((id) => id === "ripple" || id === "ray" || id === "blue" || id === "red"));
    const weps2 = emptyWeps();
    weps2.limitless = 2;
    weps2.blue = 1;
    const later = rollPicks("gojo", weps2, 50, 4, () => 0);
    assert.ok(later.some((p) => p.id === "ripple" || p.id === "ray" || p.tag === "新术"));
  });

  it("keeps 魔虚罗 on Sukuna only", () => {
    const weps = emptyWeps();
    weps.slash = 1;
    weps.cleave = 1;
    const picks = rollPicks("sukuna", weps, 40, 3, () => 0.5);
    const gojo = rollPicks("gojo", emptyWeps(), 40, 3, () => 0.5);
    assert.ok(UPGRADES.some((u) => u.id === "adapt" && u.who.includes("sukuna")));
    assert.ok(!gojo.some((p) => p.id === "adapt"));
    assert.ok(picks.length <= 3);
  });

  it("returns an empty pool when everything is maxed", () => {
    const weps = emptyWeps();
    for (const id of Object.keys(weps) as (keyof typeof weps)[]) weps[id] = 99;
    assert.deepEqual(rollPicks("gojo", weps, 100, 20), []);
  });
});
