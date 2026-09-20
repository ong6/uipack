import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    presets: "src/presets/index.ts",
    browser: "src/browser/index.tsx",
    static: "src/static/index.tsx",
    slides: "src/slides/index.ts",
    presentations: "src/presentations/index.ts",
    objects: "src/objects/index.tsx",
  },
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
