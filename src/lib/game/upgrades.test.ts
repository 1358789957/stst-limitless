import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyWeps, rollPicks, spotlightId } from "./upgrades.ts";

describe("upgrade picks", () => {
  it("spotlights purple then domain for Gojo", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.blue = 1;
    assert.equal(spotlightId("gojo", weps, 10, 4), "purple");
    weps.purple = 1;
    assert.equal(spotlightId("gojo", weps, 80, 6), "domain");
  });

  it("spotlights cleave then flame for Sukuna", () => {
    const weps = emptyWeps();
    weps.slash = 1;
    assert.equal(spotlightId("sukuna", weps, 5, 2), "cleave");
    weps.cleave = 1;
    assert.equal(spotlightId("sukuna", weps, 50, 4), "flame");
  });

  it("always includes the spotlight in a 3-pick", () => {
    const weps = emptyWeps();
    weps.limitless = 1;
    weps.blue = 1;
    const picks = rollPicks("gojo", weps, 50, 4, () => 0);
    assert.equal(picks.length, 3);
    assert.ok(picks.some((p) => p.id === "purple"));
    const ids = new Set(picks.map((p) => p.id));
    assert.equal(ids.size, 3);
  });

  it("returns an empty pool when everything is maxed", () => {
    const weps = emptyWeps();
    for (const id of Object.keys(weps) as (keyof typeof weps)[]) weps[id] = 99;
    assert.deepEqual(rollPicks("gojo", weps, 100, 20), []);
  });
});
