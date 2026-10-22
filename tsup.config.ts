import { defineConfig } from "tsup";
import { entries } from "./scripts/entries";

export default defineConfig({
  entry: entries,
  format: ["esm", "cjs"],
  splitting: true,
  treeshake: true,
  dts: true,
  sourcemap: false,
  clean: true,
  external: [
    "react",
    "react-dom",
    "react-dom/server",
    "react/jsx-runtime",
    "three",
    "gsap",
  ],
  target: "es2020",
  // CommonJS has no import.meta; left in, it is a syntax error that stops the chunk loading at all.
  // The one use (src/package-assets.ts) checks for it and asks for a URL instead.
  esbuildOptions(options, { format }) {
    if (format === "cjs") options.define = { ...options.define, "import.meta.url": "undefined" };
  },
});
