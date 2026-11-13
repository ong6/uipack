// @vitest-environment node
// Tier-1 rules on hand-built measurements: each threshold from the spec, each pass and each fail,
// without a browser. e2e/grade.spec.ts runs the same rules on a real page with planted defects.
import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { contrastRatio, flatten, isLargeText, parseColor } from "../src/grade/color";
import type { Box, Measurements, TextSample } from "../src/grade/measure";
import { decodePng, diffBitmaps, sampleBackground } from "../src/grade/png";
import { summarise, toMarkdown, type ViewReport } from "../src/grade/report";
import {
  checkContrast,
  checkFaces,
  checkFocus,
  checkHeadingOrder,
  checkMotion,
  checkOneH1,
  checkOverflow,
  checkRows,
  checkTargets,
  checkTextOverlap,
  checkTextSize,
  evaluateView,
  faceAllowed,
  findOverlaps,
  firstFamily,
  symbolCount,
} from "../src/grade/rules";
import { CHECK_IDS, DEFAULT_SPEC, UIPACK_SPEC, mergeSpec, resolveSpec, validateSpec } from "../src/grade/spec";
import { facesFromStyleSpec, specFromStyleDoc } from "../src/grade/style-spec";

const spec = resolveSpec({});
const uipack = resolveSpec({ extends: "uipack" });
const box = (x = 0, y = 0, w = 100, h = 20): Box => ({ x, y, w, h });
const text = (over: Partial<TextSample> = {}): TextSample => ({
  selector: "p",
  text: "words",
  box: box(),
  px: 16,
  weight: 400,
  family: '"IBM Plex Sans", sans-serif',
  color: [0, 0, 0, 1],
  layers: [[255, 255, 255, 1]],
  base: [255, 255, 255, 1],
  floor: -1,
  inSvg: false,
  disabled: false,
  contrastable: true,
  ...over,
});
const page = (over: Partial<Measurements> = {}): Measurements => ({
  url: "http://x/",
  title: "t",
  viewport: { width: 390, height: 844 },
  scrollWidth: 390,
  docHeight: 2000,
  overflowers: [],
  clipped: [],
  texts: [],
  lines: [],
  rows: [],
  targets: [],
  images: [],
  headings: [],
  fontSamples: 0,
  bodyBackground: "rgb(255, 255, 255)",
  ...over,
});

describe("colour", () => {
  it("computes WCAG ratios: black on white is 21, a colour on itself is 1", () => {
    expect(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21, 5);
    expect(contrastRatio([118, 118, 118, 1], [255, 255, 255, 1])).toBeCloseTo(4.54, 2);
    expect(contrastRatio([10, 20, 30, 1], [10, 20, 30, 1])).toBe(1);
  });
  it("composites translucent text and stacked backgrounds", () => {
    // Black at 50% over white is mid grey: about 3.9:1, under the 4.5 floor.
    expect(contrastRatio([0, 0, 0, 0.5], [255, 255, 255, 1])).toBeLessThan(4.5);
    expect(flatten([[0, 0, 0, 0.5]], [255, 255, 255, 1])).toEqual([127.5, 127.5, 127.5, 1]);
    // The first opaque layer ends the stack.
    expect(
      flatten([
        [0, 0, 255, 1],
        [255, 0, 0, 1],
      ]),
    ).toEqual([0, 0, 255, 1]);
  });
  it("reads large text as 24px, or 18.66px bold", () => {
    expect(isLargeText(24, 400)).toBe(true);
    expect(isLargeText(19, 700)).toBe(true);
    expect(isLargeText(19, 600)).toBe(false);
  });
  it("parses rgb(), rgba(), the space syntax and hex", () => {
    expect(parseColor("rgb(1, 2, 3)")).toEqual([1, 2, 3, 1]);
    expect(parseColor("rgba(1, 2, 3, 0.5)")).toEqual([1, 2, 3, 0.5]);
    expect(parseColor("rgb(1 2 3 / 50%)")).toEqual([1, 2, 3, 0.5]);
    expect(parseColor("#fff")).toEqual([255, 255, 255, 1]);
    expect(parseColor("#00000080")?.[3]).toBeCloseTo(0.5, 2);
    expect(parseColor("oklch(0.5 0.1 200)")).toBeNull();
  });
});

describe("spec", () => {
  it("defaults to the documented UiPack floors", () => {
    expect(spec.tapTargetPx).toEqual({ coarse: 44, fine: 24 });
    expect(spec.contrast).toEqual({ normal: 4.5, large: 3 });
    expect(spec.minTextPx).toBe(12);
    // The figure and chart floors are core, so a site graded from its STYLE.md gets them too.
    expect(spec.textFloors.map((f) => [f.selector, f.px])).toEqual([
      [".uipack svg", 11],
      [".uipack-span, .uipack-stack", 11],
    ]);
    expect(spec.rowTolerancePx).toEqual({ cards: 1, paired: 2 });
    expect(spec.viewports.map((v) => v.name)).toEqual(["1440", "390"]);
  });
  it("extends uipack for Technical's faces and the 11px figure floor", () => {
    expect(uipack.faces).toEqual(["IBM Plex Sans", "IBM Plex Mono"]);
    expect(uipack.textFloors[0]).toMatchObject({ selector: "svg", px: 11 });
    expect(uipack.themes.dark.query).toEqual({ theme: "dark" });
    expect(uipack.tapTargetPx).toEqual(DEFAULT_SPEC.tapTargetPx);
  });
  it("merges objects key by key and replaces arrays", () => {
    const s = mergeSpec(DEFAULT_SPEC, { tapTargetPx: { fine: 32 }, viewports: [{ name: "1280", width: 1280, height: 800 }] });
    expect(s.tapTargetPx).toEqual({ coarse: 44, fine: 32 });
    expect(s.viewports).toHaveLength(1);
    expect(UIPACK_SPEC.name).toBe("uipack-playground");
  });
  it("rejects unknown fields, bad numbers and unknown check ids, with every problem listed", () => {
    expect(validateSpec({ minTxt: 12 })).toEqual(['unknown field "minTxt"']);
    expect(validateSpec({ tapTargetPx: { coarse: "44" } })).toEqual(["tapTargetPx.coarse must be a number ≥ 0"]);
    expect(validateSpec({ skip: { contrastt: "x" } })[0]).toMatch(/no check has that id/);
    expect(validateSpec({ viewports: [] })).toEqual(["viewports must be a non-empty list"]);
    expect(validateSpec({ extends: "landing" })).toEqual(['extends must be "default" or "uipack"']);
    expect(() => resolveSpec({ faces: 3 })).toThrow(/faces must be a list/);
    expect(validateSpec({ styleSpec: "STYLE.md", faces: null, notes: "x" })).toEqual([]);
  });
});

describe("style spec as the source of faces", () => {
  const technical = readFileSync("docs/specs/technical.md", "utf8");
  it("reads Technical's faces from its --ui-font-* role rows through check-spec's parser", () => {
    expect(facesFromStyleSpec(technical)).toEqual(["IBM Plex Sans", "IBM Plex Mono"]);
    expect(specFromStyleDoc(technical)).toEqual({ name: "technical", faces: ["IBM Plex Sans", "IBM Plex Mono"] });
  });
  it("falls back to the Type table, and to no face check when the template is still TODO", () => {
    const doc = `---\nspec: blog\nsite: x\nextends: core\nuses: []\nstatus: draft\nuipack: abc\n---\n\n## Type\n\n| Medium | Display | Text | Label |\n| --- | --- | --- | --- |\n| Page | Fraunces 600 | Inter 400 | JetBrains Mono 400 |\n`;
    expect(specFromStyleDoc(doc)).toEqual({ name: "blog", faces: ["Fraunces", "Inter", "JetBrains Mono"] });
    expect(specFromStyleDoc(readFileSync("docs/specs/TEMPLATE.md", "utf8")).faces).toBeNull();
    expect(() => specFromStyleDoc("# no frontmatter")).toThrow(/frontmatter/);
  });
});

describe("tier-1 rules", () => {
  it("overflow-x: one failure naming the element that starts it", () => {
    expect(checkOverflow(page(), spec).status).toBe("pass");
    const r = checkOverflow(page({ scrollWidth: 412, overflowers: [{ selector: "pre", text: "", box: box(0, 0, 412) }] }), spec);
    expect(r).toMatchObject({ status: "fail", failures: 1 });
    expect(r.findings[0].detail).toMatch(/412px wide at a 390px viewport \(\+22px\)/);
  });

  it("text-overlap: line boxes of two elements that cover each other; tight leading does not count", () => {
    const lines = [
      { owner: 0, rects: [box(0, 0, 100, 20)] },
      { owner: 1, rects: [box(10, 2, 100, 20)] },
      { owner: 2, rects: [box(0, 16, 100, 20)] }, // the next line, 4px into the one above
    ];
    expect(findOverlaps(lines).map(([a, b]) => [a, b])).toEqual([[0, 1]]);
    const texts = [text({ text: "a" }), text({ text: "b" }), text({ text: "c" })];
    expect(checkTextOverlap(page({ texts, lines }), spec).failures).toBe(1);
    // Pixels say the pair is occluded (one window over another): it does not count.
    expect(checkTextOverlap(page({ texts, lines }), spec, []).status).toBe("pass");
  });

  it("row-heights: cards within 1px, paired boxes within 2px, card actions on one line", () => {
    const row = (kind: "cards" | "paired", heights: number[], actions: (number | null)[] | null = null) => ({
      kind,
      where: "div.grid > div.card",
      heights,
      actions,
      boxes: heights.map((h, i) => box(i * 200, 0, 180, h)),
    });
    expect(checkRows(page({ rows: [row("cards", [200, 201])] }), spec).status).toBe("pass");
    expect(checkRows(page({ rows: [row("cards", [200, 203])] }), spec).findings[0].detail).toMatch(/differ in height by 3px/);
    expect(checkRows(page({ rows: [row("paired", [120, 122])] }), spec).status).toBe("pass");
    expect(checkRows(page({ rows: [row("paired", [120, 160])] }), spec).findings[0].detail).toMatch(
      /paired boxes differ.*40px: 120 \/ 160/,
    );
    expect(checkRows(page({ rows: [row("cards", [200, 200], [180, 170])] }), spec).findings[0].detail).toMatch(/actions/);
    // The union of the row is the crop.
    expect(checkRows(page({ rows: [row("paired", [120, 160])] }), spec).findings[0].box).toEqual(box(0, 0, 380, 160));
  });

  it("tap-targets: 44px on touch, 24px with a pointer; inline text links exempt", () => {
    const targets = [
      { selector: "a.cta", text: "Start", box: box(0, 0, 120, 40), inline: false },
      { selector: "p > a", text: "docs", box: box(0, 0, 30, 18), inline: true },
    ];
    expect(checkTargets(page({ targets }), spec, true)).toMatchObject({ status: "fail", failures: 1 });
    expect(checkTargets(page({ targets }), spec, false).status).toBe("pass");
    expect(checkTargets(page({ targets }), spec, true).note).toMatch(/1 inline/);
  });

  it("contrast: 4.5 for small text, 3 for large, pixels when a gradient is behind, skipped when unknown", () => {
    const grey = (v: number, px = 16, weight = 400) => text({ color: [v, v, v, 1], px, weight });
    expect(checkContrast(page({ texts: [grey(118)] }), spec).status).toBe("pass"); // 4.54
    expect(checkContrast(page({ texts: [grey(130)] }), spec).status).toBe("fail"); // 3.9
    expect(checkContrast(page({ texts: [grey(130, 24)] }), spec).status).toBe("pass"); // large
    const overImage = text({ color: [130, 130, 130, 1], layers: null });
    expect(checkContrast(page({ texts: [overImage] }), spec)).toMatchObject({ status: "pass", checked: 0 });
    const sampled = text({
      color: [255, 255, 255, 1],
      layers: null,
      sampled: [
        [20, 20, 20, 1],
        [230, 230, 230, 1],
      ],
    });
    expect(checkContrast(page({ texts: [sampled] }), spec).findings[0].detail).toMatch(/background from pixels/);
    expect(checkContrast(page({ texts: [text({ color: [200, 200, 200, 1], disabled: true })] }), spec).status).toBe("pass");
  });

  it("text-size: the spec floor, or the first matching region floor", () => {
    expect(checkTextSize(page({ texts: [text({ px: 11 })] }), uipack).status).toBe("fail");
    expect(checkTextSize(page({ texts: [text({ px: 11, floor: 0 })] }), uipack).status).toBe("pass");
    expect(checkTextSize(page({ texts: [text({ px: 10.5, floor: 0 })] }), uipack).findings[0].detail).toBe("10.5px, floor 11px");
  });

  it("font-faces: the requested family and the platform font actually drawn", () => {
    expect(firstFamily('"IBM Plex Sans", Arial')).toBe("IBM Plex Sans");
    expect(faceAllowed({ familyName: "IBM Plex Sans SemiBold" }, ["IBM Plex Sans"])).toBe(true);
    expect(faceAllowed({ familyName: "x", postScriptName: "IBMPlexMono-Regular" }, ["IBM Plex Mono"])).toBe(true);
    expect(faceAllowed({ familyName: "Arial" }, ["IBM Plex Sans"])).toBe(false);
    expect(symbolCount("Getting started →")).toBe(1);
    const texts = [text({ family: "system-ui, sans-serif" })];
    expect(checkFaces(page({ texts }), uipack, [], []).findings[0].detail).toMatch(/asks for "system-ui"/);
    expect(checkFaces(page({ texts }), spec, [], []).status).toBe("skip");
    const drawn = (familyName: string, glyphCount: number, t = "Plain words") => [
      {
        selector: "p",
        text: t,
        box: box(),
        fonts: [
          { familyName: "IBM Plex Sans", glyphCount: 10 },
          { familyName, glyphCount },
        ],
      },
    ];
    // A fallback drawing letters fails; one drawing only the symbols the face lacks warns.
    expect(checkFaces(page({ texts: [text()] }), uipack, drawn("Arial", 9), []).status).toBe("fail");
    expect(checkFaces(page({ texts: [text()] }), uipack, drawn("Arial", 1, "Next →"), []).status).toBe("warn");
    expect(checkFaces(page({ texts: [text()] }), uipack, drawn("Apple Symbols", 3), []).status).toBe("warn");
    // Symbols past the 60 characters a finding shows still count: a code line whose arrows come late
    // (the docs' headingOffset example) warns, and its finding shows the short text.
    const late = "<DocsMarkdown source={readme} headingOffset={1} /> // # → h2, ## → h3, … clamped at h6";
    const lateFaces = checkFaces(page({ texts: [text()] }), uipack, drawn("Courier New", 2, late), []);
    expect(lateFaces.status).toBe("warn");
    expect(lateFaces.findings[0].text).toBe(late.slice(0, 60));
  });

  it("heading-order and one-h1", () => {
    const h = (level: number) => ({ level, selector: `h${level}`, text: "", box: box() });
    expect(checkHeadingOrder([h(1), h(2), h(3), h(2)], spec).status).toBe("pass");
    expect(checkHeadingOrder([h(1), h(3)], spec).findings[0].detail).toBe("h3 follows an h1");
    expect(checkHeadingOrder([h(2)], spec).findings[0].detail).toBe("the first heading is an h2");
    // Navigation headings before the page's h1 count as under it.
    expect(checkHeadingOrder([h(2), h(3), h(1), h(2)], spec).status).toBe("pass");
    expect(checkHeadingOrder([h(3), h(1)], spec).findings[0].detail).toBe("h3 follows an h1");
    expect(checkOneH1([h(1), h(2)], spec).status).toBe("pass");
    expect(checkOneH1([h(1), h(1)], spec)).toMatchObject({ status: "fail", failures: 1 });
    expect(checkOneH1([h(2)], spec).findings[0].detail).toBe("no visible h1");
  });

  it("focus-visible: no change on focus fails, a clipped ring fails", () => {
    const f = (indicator: boolean, clippedBy: string | null = null) => ({
      selector: "a",
      text: "x",
      box: box(),
      indicator,
      how: indicator ? "outline 2px" : "",
      clippedBy,
    });
    expect(checkFocus([f(true)], 0, spec).status).toBe("pass");
    expect(checkFocus([f(false)], 0, spec).findings[0].detail).toMatch(/no visible change/);
    expect(checkFocus([f(true, "ul.row (needs 4px, has 1.0px)")], 0, spec).findings[0].detail).toMatch(/clipped/);
    expect(checkFocus([], 3, spec).status).toBe("warn");
  });

  it("reduced-motion: a looping animation or a changing frame fails", () => {
    expect(checkMotion([], null, spec).status).toBe("pass");
    expect(checkMotion([{ selector: "i", text: "", box: box(), what: "pulse (opacity; loops)" }], null, spec).status).toBe(
      "fail",
    );
    expect(checkMotion([], { box: box(0, 0, 50, 50), changedPixels: 900 }, spec).findings[0].detail).toMatch(/900 pixel/);
  });

  it("evaluates every check in report order and lists skipped ones with the reason", () => {
    const s = mergeSpec(spec, { skip: { "focus-visible": "a kiosk page, no keyboard" } });
    const x = { platformFonts: [], focus: [], focusMisses: 0, motion: [], frameDiff: null, touch: true };
    const results = evaluateView(page(), x, s, []);
    expect(results.map((r) => r.id)).toEqual([...CHECK_IDS]);
    expect(results.find((r) => r.id === "focus-visible")).toMatchObject({ status: "skip", note: "a kiosk page, no keyboard" });
  });
});

describe("report", () => {
  const view = (name: string, status: "pass" | "fail"): ViewReport => ({
    view: name,
    viewport: { width: 390, height: 844, touch: true },
    theme: "light",
    themeApplied: true,
    bodyBackground: "",
    errors: [],
    checks: CHECK_IDS.map((id) => ({
      id,
      status: id === "contrast" ? status : "pass",
      checked: 1,
      failures: id === "contrast" && status === "fail" ? 2 : 0,
      findings:
        id === "contrast" && status === "fail"
          ? [{ selector: "p.muted", text: "x", detail: "3.1:1", severity: "fail" as const }]
          : [],
    })),
  });
  it("fails the gate when any view fails a check, and names the views", () => {
    const s = summarise([view("1440-light", "pass"), view("390-light", "fail")]);
    expect(s.passed).toBe(false);
    expect(s.summary.contrast).toEqual({ status: "fail", failures: 2, failedViews: ["390-light"] });
    expect(summarise([view("1440-light", "pass")]).passed).toBe(true);
  });
  it("fails a view that could not be graded at all", () => {
    expect(summarise([{ ...view("1440-light", "pass"), checks: [], errors: ["timeout"] }]).passed).toBe(false);
  });
  it("writes a check-by-view table and the failing findings", () => {
    const views = [view("1440-light", "pass"), view("390-light", "fail")];
    const md = toMarkdown({
      tool: "uipack-grade",
      reportVersion: 1,
      url: "u",
      title: "T",
      spec: "s",
      startedAt: "now",
      durationMs: 1000,
      ...summarise(views),
      views,
    });
    expect(md).toContain("**FAIL**");
    expect(md).toContain("| Rendered text meets WCAG contrast (`contrast`) | pass | **FAIL 2** |");
    expect(md).toContain("`p.muted`");
  });
});

// A minimal PNG encoder for the decoder's tests: RGBA rows, filter 0 or 1.
function png(width: number, height: number, pixel: (x: number, y: number) => number[], filter = 0) {
  const raw: number[] = [];
  for (let y = 0; y < height; y++) {
    raw.push(filter);
    const row = Array.from({ length: width }, (_, x) => pixel(x, y)).flat();
    raw.push(...(filter === 1 ? row.map((v, i) => (v - (i >= 4 ? row[i - 4] : 0)) & 0xff) : row));
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    return Buffer.concat([len, Buffer.from(type), data, Buffer.alloc(4)]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.from(raw))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

describe("png", () => {
  it("decodes filtered rows and finds where two frames differ", () => {
    const a = decodePng(png(8, 4, (x) => [x * 30, 0, 0, 255], 1));
    expect(a.width).toBe(8);
    expect([...a.data.slice(4 * 3, 4 * 3 + 4)]).toEqual([90, 0, 0, 255]);
    const b = decodePng(png(8, 4, (x, y) => (x === 5 && y === 2 ? [255, 255, 255, 255] : [x * 30, 0, 0, 255])));
    expect(diffBitmaps(a, a)).toBeNull();
    expect(diffBitmaps(a, b)).toEqual({ box: { x: 5, y: 2, w: 1, h: 1 }, changedPixels: 1 });
  });
  it("samples the darkest and lightest background in a box", () => {
    const bmp = decodePng(png(10, 10, (x) => (x < 5 ? [0, 0, 0, 255] : [255, 255, 255, 255])));
    expect(sampleBackground(bmp, box(0, 0, 10, 10))).toEqual([
      [0, 0, 0, 1],
      [255, 255, 255, 1],
    ]);
    expect(sampleBackground(bmp, box(20, 20, 5, 5))).toBeNull();
  });
});
