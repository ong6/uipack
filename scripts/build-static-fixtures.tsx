// Writes the SVG files the static-export e2e spec loads through <img>.
// Run by Playwright's globalSetup; output is gitignored.
import { mkdirSync, writeFileSync } from "node:fs";
import { agentLoop } from "../src/presets";
import { renderStatic } from "../src/static";

const OUT = "playground/e2e-static";
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/motion.svg`, renderStatic(agentLoop(), { theme: "light", motion: true }));
writeFileSync(`${OUT}/still.svg`, renderStatic(agentLoop(), { theme: "dark", motion: false }));
writeFileSync(`${OUT}/bare.svg`, renderStatic(agentLoop(), { frame: false, background: false, motion: true }));
console.log("static fixtures written to", OUT);
