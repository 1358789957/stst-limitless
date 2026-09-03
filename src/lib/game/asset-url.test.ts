import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicUrl } from "./asset-url.ts";

describe("publicUrl", () => {
  it("keeps public files under the Vite base", () => {
    const url = publicUrl("/art/bg.jpg");
    assert.match(url, /art\/bg\.jpg$/);
    assert.equal(url.includes("//art"), false);
  });
});
