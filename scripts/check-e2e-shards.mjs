#!/usr/bin/env node
// One spec inventory for CI and test:affected. New specs join non-GL automatically.
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const GL = /\/(art-directions|contact-directions|objects)\.spec\.ts$/;

export function chromiumGroups() {
  const all = readdirSync(new URL("../e2e/", import.meta.url))
    .filter((name) => name.endsWith(".spec.ts") && name !== "screenshots.spec.ts")
    .sort()
    .map((name) => {
      // CI passes these as shell arguments. Fail rather than split an unexpected filename.
      if (!/^[a-z0-9-]+\.spec\.ts$/.test(name)) throw new Error(`Unsupported spec filename: ${name}`);
      return `e2e/${name}`;
    });
  const gl = all.filter((file) => GL.test(file));
  const rest = all.filter((file) => !GL.test(file));
  const covered = new Set([...gl, ...rest]);
  const missing = all.filter((file) => !covered.has(file));
  if (missing.length || covered.size !== gl.length + rest.length)
    throw new Error(`Chromium groups must cover each spec once; uncovered: ${missing.join(" ")}`);
  if (gl.length !== 3 || !rest.length) throw new Error("Expected three GL specs and a non-empty non-GL group");
  return { gl, rest };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { gl, rest } = chromiumGroups();
  const args = process.argv.slice(2);
  if (!args.length) console.log(`Chromium coverage: ${gl.length} GL + ${rest.length} non-GL; every spec covered once`);
  else if (args.length === 2 && args[0] === "--group" && ["gl", "non-gl"].includes(args[1]))
    console.log((args[1] === "gl" ? gl : rest).join(" "));
  else throw new Error("Usage: node scripts/check-e2e-shards.mjs [--group gl|non-gl]");
}
