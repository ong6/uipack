// Loads every built entry the way a consumer does, by package name: import() for ESM and require()
// for CJS, and checks both expose the same names. Run after `npm run build` (CI does).
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const require = createRequire(import.meta.url);
let failed = false;
for (const [subpath, target] of Object.entries(pkg.exports)) {
  if (typeof target !== "object") continue;
  const id = subpath === "." ? pkg.name : `${pkg.name}${subpath.slice(1)}`;
  try {
    const esm = Object.keys(await import(id)).filter((k) => k !== "default").sort();
    const cjs = Object.keys(require(id)).filter((k) => k !== "default" && k !== "__esModule").sort();
    if (esm.join() !== cjs.join()) throw new Error(`ESM and CJS differ: ${esm.length} vs ${cjs.length} names`);
    console.log(`ok ${id} (${esm.length} names)`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${id}: ${error instanceof Error ? error.message : error}`);
  }
}
process.exit(failed ? 1 : 0);
