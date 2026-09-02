import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "dist-static");
const zipName = "5t5-limitless-web.zip";
const zipPath = resolve(root, "artifacts", zipName);
const artifactDir = "/opt/cursor/artifacts";
const note = [
  `${resolve(artifactDir, zipName)}`,
  "Unzip so index.html sits at the demo root; upload that zip to deepdemos.top as demo_type=web.",
].join("\n");

execSync("npx vite build --config vite.static.config.ts", {
  cwd: root,
  stdio: "inherit",
});

for (const name of ["art", "sprites", "favicon.svg"]) {
  cpSync(resolve(root, "public", name), resolve(out, name), { recursive: true });
}
rmSync(resolve(out, "__grok"), { recursive: true, force: true });

mkdirSync(resolve(root, "artifacts"), { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);
execSync(`zip -r -X ${JSON.stringify(zipPath)} .`, { cwd: out, stdio: "inherit" });

mkdirSync(artifactDir, { recursive: true });
cpSync(zipPath, resolve(artifactDir, zipName));
writeFileSync(resolve(artifactDir, "5t5-limitless-web.txt"), `${note}\n`);
writeFileSync(resolve(root, "artifacts", "5t5-limitless-web.txt"), `${note}\n`);

console.log(`static zip: ${zipPath}`);
console.log(`artifact: ${resolve(artifactDir, zipName)}`);
console.log(note);
