// Imports every built JavaScript entry the way a consumer does, by package name, and checks each
// exposes names; then resolves every file export (stylesheets, fonts, assets). Run after
// `npm run build` (CI does).
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const id = (subpath) => (subpath === "." ? pkg.name : `${pkg.name}${subpath.slice(1)}`);
let failed = false;
for (const [subpath, target] of Object.entries(pkg.exports)) {
  try {
    if (typeof target === "object") {
      const names = Object.keys(await import(id(subpath))).filter((k) => k !== "default");
      if (!names.length) throw new Error("no exports");
      console.log(`ok ${id(subpath)} (${names.length} names)`);
    } else if (subpath.includes("*")) {
      continue; // a pattern (fonts, asset objects): build-css and the asset tests own its files
    } else {
      readFileSync(new URL(import.meta.resolve(id(subpath))));
      console.log(`ok ${id(subpath)} (file)`);
    }
  } catch (error) {
    failed = true;
    console.error(`FAIL ${id(subpath)}: ${error instanceof Error ? error.message : error}`);
  }
}
process.exit(failed ? 1 : 0);
