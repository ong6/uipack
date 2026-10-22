import { defineConfig } from "tsup";
import { entries } from "./scripts/entries";

export default defineConfig({
  entry: entries,
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
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
