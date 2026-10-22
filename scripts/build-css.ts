// Writes dist/*.css and dist/fonts after tsup (npm run build). The list is scripts/css-bundles.ts.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cssBundles, fontFiles } from "./css-bundles";

for (const { out, from } of cssBundles) {
  writeFileSync(join("dist", out), Buffer.concat(from.map((file) => readFileSync(file))));
}
mkdirSync(join("dist", fontFiles.out), { recursive: true });
for (const file of readdirSync(fontFiles.dir).filter((f) => fontFiles.match.test(f))) {
  copyFileSync(join(fontFiles.dir, file), join("dist", fontFiles.out, file));
}
