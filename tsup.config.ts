import { defineConfig } from "tsup";
import { entries } from "./scripts/entries";

export default defineConfig({
  entry: entries,
  format: ["esm", "cjs"],
  splitting: true,
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
});
