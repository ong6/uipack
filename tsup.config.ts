import { defineConfig } from "tsup";
import { entries } from "./scripts/entries";

// ES modules only (0.4.0): every consumer (the registry's Next.js sites and their Node build scripts)
// imports, so there is no CommonJS build to keep in step.
export default defineConfig({
  entry: entries,
  format: ["esm"],
  splitting: true,
  treeshake: true,
  dts: true,
  sourcemap: false,
  clean: true,
  // No `external`: tsup leaves every dependency and peer dependency (and its subpaths) out of dist/.
  target: "es2020",
});
