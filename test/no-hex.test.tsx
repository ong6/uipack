import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Colours live in style value files (src/styles), read through roles (docs/system/style.md). A hex
// literal anywhere else in src is a colour a style swap cannot reach. The exceptions are data
// colours a renderer cannot read from CSS, or authored art that is itself a separate style; each
// is listed with its reason and its exact count, so a new literal fails here.
const ALLOWED: Record<string, { count: number; why: string }> = {
  "src/mechanism/kit/iso-kit.ts": {
    count: 61,
    why: "Vendored isometric kit (MIT, src/mechanism/kit/LICENSE), kept byte-for-byte; mechanism.css maps its output to roles.",
  },
  "src/objects/objects.css": {
    count: 24,
    why: "Stage gradients of the five non-Studio 3D art directions, each its own style (docs/objects.md); Studio reads roles.",
  },
  "src/objects/ObjectScene.tsx": {
    count: 2,
    why: "The 2D fallback drawing's up and down candle strokes, data colours of the market-study subject.",
  },
};

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return path === "src/styles" || name === "fonts" ? [] : files(path);
    return /\.(css|tsx?)$/.test(name) ? [path] : [];
  });
}

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/.*$/gm, "$1");
const hexes = (s: string) => stripComments(s).match(/#[0-9a-fA-F]{3,8}\b(?![-\w])/g) ?? [];

describe("no colour literals outside the style value files", () => {
  const all = files("src");
  it("scans the source tree", () => expect(all.length).toBeGreaterThan(100));
  it.each(all)("%s", (file) => {
    const found = hexes(readFileSync(file, "utf8"));
    const allowed = ALLOWED[file.split("\\").join("/")];
    if (allowed) expect(found.length, allowed.why).toBe(allowed.count);
    else expect(found, `${file}: read a role (var(--ui-…)) instead`).toEqual([]);
  });
  it("lists only exceptions that still exist", () => {
    for (const f of Object.keys(ALLOWED)) expect(all).toContain(f);
  });
});
