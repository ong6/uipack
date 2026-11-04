import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { technicalValues } from "../src/styles/technical-values";

// The JS mirror (static SVG export, renderSlideSvg) must say what src/styles/technical.css says.
const css = readFileSync("src/styles/technical.css", "utf8");

/** `--ui-<role>: light-dark(<light>, <dark>)` from technical.css, as [light, dark]. */
function pair(role: string): [string, string] {
  const m = css.match(new RegExp(`--(?:ui|tune)-${role}:\\s*light-dark\\(\\s*(#[0-9a-f]{6}),\\s*(#[0-9a-f]{6})\\s*\\)`, "i"));
  if (!m) throw new Error(`technical.css has no light-dark pair for --ui-${role}`);
  return [m[1].toLowerCase(), m[2].toLowerCase()];
}

/** Ink at a percentage, as technical.css derives --ui-line and --ui-line-soft from --ui-ink. */
function inkAt(role: string): number {
  const m = css.match(new RegExp(`--ui-${role}:\\s*color-mix\\(in srgb, var\\(--ui-ink\\) (\\d+)%, transparent\\)`));
  if (!m) throw new Error(`technical.css: --ui-${role} is not ink at a percentage`);
  return Number(m[1]) / 100;
}

const rgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

describe("technicalValues mirrors src/styles/technical.css", () => {
  const solid = [
    "paper",
    "surface",
    "surface-raised",
    "surface-2",
    "ink",
    "ink-2",
    "accent",
    "flow-request",
    "flow-response",
    "flow-change",
    "slide-line",
  ] as const;
  for (const role of solid) {
    it(role, () => {
      const [light, dark] = pair(role);
      expect(technicalValues.light[role]).toBe(light);
      expect(technicalValues.dark[role]).toBe(dark);
    });
  }
  for (const role of ["line", "line-soft"] as const) {
    it(`${role} (ink at ${role === "line" ? 22 : 16}%)`, () => {
      const [lightInk, darkInk] = pair("ink");
      expect(technicalValues.light[role]).toBe(rgba(lightInk, inkAt(role)));
      expect(technicalValues.dark[role]).toBe(rgba(darkInk, inkAt(role)));
    });
  }
});
