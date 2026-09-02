import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultMeta, isCharUnlocked, loadMeta, recordRun, writeMeta } from "./meta.ts";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

describe("meta", () => {
  it("unlocks Sukuna, notes, and extra start from a run", () => {
    const store = memoryStorage();
    (globalThis as { window?: unknown }).window = { localStorage: store };
    try {
      writeMeta(defaultMeta());
      const first = recordRun({
        kills: 12,
        time: 40,
        level: 4,
        won: false,
        charId: "gojo",
        usedDomain: false,
        sawBoss: false,
      });
      assert.equal(first.meta.runs, 1);
      assert.equal(first.meta.sukunaUnlocked, true);
      assert.ok(first.unlocked.includes("解锁 宿傩"));
      assert.equal(isCharUnlocked("sukuna", first.meta), true);
      assert.equal(first.meta.extraStart, false);

      const late = recordRun({
        kills: 80,
        time: 95,
        level: 8,
        won: false,
        charId: "gojo",
        usedDomain: true,
        sawBoss: true,
      });
      assert.equal(late.meta.extraStart, true);
      assert.ok(late.meta.notes.includes("n-boss"));
      assert.ok(late.meta.notes.includes("n-domain"));

      const clear = recordRun({
        kills: 120,
        time: 180,
        level: 10,
        won: true,
        charId: "sukuna",
        usedDomain: true,
        sawBoss: true,
      });
      assert.equal(clear.meta.cleared, true);
      assert.ok(clear.meta.notes.includes("n-clear"));
      assert.equal(loadMeta().bestKills, 120);
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });

  it("treats existing runs as Sukuna already unlocked", () => {
    const store = memoryStorage();
    store.setItem(
      "stst-horde-v1",
      JSON.stringify({ bestKills: 3, bestTime: 20, runs: 2, muted: true }),
    );
    (globalThis as { window?: unknown }).window = { localStorage: store };
    try {
      const m = loadMeta();
      assert.equal(m.sukunaUnlocked, true);
      assert.equal(m.muted, true);
      assert.equal(isCharUnlocked("gojo", m), true);
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });
});
