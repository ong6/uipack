/**
 * Tier-1 rules: measurements in, pass/fail findings out, against a site spec. Pure functions, no
 * DOM, so every threshold is unit-tested (test/grade-rules.test.tsx) without a browser.
 */
import { contrastRatio, flatten, isLargeText, type RGBA } from "./color";
import type { Box, FocusSample, Measurements, MotionSample, TextSample } from "./measure";
import { CHECK_IDS, type CheckId, type SiteSpec } from "./spec";

export type Status = "pass" | "fail" | "warn" | "skip";

export interface Finding {
  selector: string;
  text: string;
  detail: string;
  severity: "fail" | "warn";
  box?: Box;
  /** Path of the screenshot crop, relative to the report. */
  crop?: string;
}

export interface CheckResult {
  id: CheckId;
  status: Status;
  /** How many things the check read (texts, targets, rows…): a pass over nothing says so. */
  checked: number;
  /** Exact number of failures (findings may be capped by spec.maxFindings). */
  failures: number;
  findings: Finding[];
  note?: string;
}

/** A platform font Chromium used to draw an element's text (CDP CSS.getPlatformFontsForNode). */
export interface PlatformFontUse {
  selector: string;
  /** The element's whole text (whitespace collapsed): symbols are counted over all of it. */
  text: string;
  box: Box;
  fonts: { familyName: string; postScriptName?: string; glyphCount: number }[];
}

/** What the browser-driven passes add to the page measurements. */
export interface Extras {
  /** Platform fonts per sampled element; null when the browser cannot report them (not Chromium). */
  platformFonts: PlatformFontUse[] | null;
  focus: FocusSample[];
  /** Number of Tab presses that reached nothing (focus left the page or stayed on body). */
  focusMisses: number;
  motion: MotionSample[];
  /** Where two frames 1s apart under reduced motion differ, or null when they match. */
  frameDiff: { box: Box; changedPixels: number } | null;
  touch: boolean;
  /** Overlap pairs a reader sees (both texts change the pixels where they meet); all count when absent. */
  visibleOverlaps?: [number, number][];
}

const result = (id: CheckId, checked: number, findings: Finding[], spec: SiteSpec, note?: string): CheckResult => {
  const failures = findings.filter((f) => f.severity === "fail").length;
  const warns = findings.length - failures;
  return {
    id,
    status: failures ? "fail" : warns ? "warn" : "pass",
    checked,
    failures,
    findings: [...findings.filter((f) => f.severity === "fail"), ...findings.filter((f) => f.severity === "warn")].slice(
      0,
      spec.maxFindings,
    ),
    note,
  };
};

export function checkOverflow(m: Measurements, spec: SiteSpec): CheckResult {
  const over = m.scrollWidth - m.viewport.width;
  if (over <= 0) return result("overflow-x", 1, [], spec);
  const culprits = m.overflowers.length
    ? m.overflowers.map((o) => ({
        ...o,
        detail: `right edge at ${o.box.x + o.box.w}px, viewport ${m.viewport.width}px`,
        severity: "fail" as const,
      }))
    : [{ selector: "html", text: "", detail: "", severity: "fail" as const }];
  culprits[0] = {
    ...culprits[0],
    detail: `page is ${m.scrollWidth}px wide at a ${m.viewport.width}px viewport (+${over}px); ${culprits[0].detail}`,
  };
  // One page-wide failure, however many elements start it.
  return { ...result("overflow-x", 1, culprits, spec), failures: 1 };
}

export function checkTextClip(m: Measurements, spec: SiteSpec): CheckResult {
  return result(
    "text-clip",
    m.texts.length,
    m.clipped.map((c) => ({ ...c, detail: `${c.overflowPx}px of text cut off by ${c.clipBy}`, severity: "fail" })),
    spec,
  );
}

const area = (b: Box) => b.w * b.h;
const intersect = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/**
 * Pairs of line boxes from different elements that cover each other: the shared area is at least
 * `share` of the smaller box. Tight leading makes lines of one paragraph touch (about a fifth of a
 * line), so the default share of 0.4 leaves that alone. Each pair comes with the shared box.
 */
export function findOverlaps(lines: { owner: number; rects: Box[] }[], share = 0.4): [number, number, Box][] {
  const flat = lines.flatMap((l) => l.rects.map((r) => ({ owner: l.owner, r }))).sort((a, b) => a.r.y - b.r.y);
  const out: [number, number, Box][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < flat.length; i++) {
    const a = flat[i];
    for (let j = i + 1; j < flat.length && flat[j].r.y < a.r.y + a.r.h; j++) {
      const b = flat[j];
      if (a.owner === b.owner) continue;
      const key = a.owner < b.owner ? `${a.owner}:${b.owner}` : `${b.owner}:${a.owner}`;
      if (seen.has(key)) continue;
      if (intersect(a.r, b.r) >= share * Math.min(area(a.r), area(b.r))) {
        seen.add(key);
        const x = Math.max(a.r.x, b.r.x);
        const y = Math.max(a.r.y, b.r.y);
        out.push([
          a.owner,
          b.owner,
          { x, y, w: Math.min(a.r.x + a.r.w, b.r.x + b.r.w) - x, h: Math.min(a.r.y + a.r.h, b.r.y + b.r.h) - y },
        ]);
      }
    }
  }
  return out;
}

export function checkTextOverlap(m: Measurements, spec: SiteSpec, visible?: [number, number][]): CheckResult {
  const seen = visible && new Set(visible.map(([a, b]) => `${a}:${b}`));
  return result(
    "text-overlap",
    m.lines.length,
    findOverlaps(m.lines)
      .filter(([a, b]) => !seen || seen.has(`${a}:${b}`))
      .map(([a, b, box]) => ({
        selector: m.texts[a].selector,
        text: m.texts[a].text,
        box,
        detail: `drawn over "${m.texts[b].text.slice(0, 30)}" (${m.texts[b].selector})`,
        severity: "fail",
      })),
    spec,
  );
}

export function checkRows(m: Measurements, spec: SiteSpec): CheckResult {
  const findings: Finding[] = [];
  for (const row of m.rows) {
    const spread = Math.max(...row.heights) - Math.min(...row.heights);
    const tol = row.kind === "paired" ? spec.rowTolerancePx.paired : spec.rowTolerancePx.cards;
    const union = (boxes: Box[]): Box => {
      const x = Math.min(...boxes.map((b) => b.x));
      const y = Math.min(...boxes.map((b) => b.y));
      return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y };
    };
    if (spread > tol)
      findings.push({
        selector: row.where,
        text: "",
        box: union(row.boxes),
        detail: `${row.kind === "paired" ? "paired boxes" : row.kind} differ in height by ${spread}px: ${row.heights.join(" / ")}`,
        severity: "fail",
      });
    else if (row.kind === "cards" && row.actions?.every((a) => a !== null) && new Set(row.actions).size > 1)
      findings.push({
        selector: row.where,
        text: "",
        box: union(row.boxes),
        detail: `card actions sit on different lines: tops ${row.actions.join(" / ")}`,
        severity: "fail",
      });
  }
  return result("row-heights", m.rows.length, findings, spec);
}

export function checkTargets(m: Measurements, spec: SiteSpec, touch: boolean): CheckResult {
  const min = touch ? spec.tapTargetPx.coarse : spec.tapTargetPx.fine;
  const findings: Finding[] = m.targets
    .filter((t) => !t.inline && (t.box.w < min - 0.5 || t.box.h < min - 0.5))
    .map((t) => ({
      ...t,
      detail: `${t.box.w}×${t.box.h}px, below ${min}×${min}px (${touch ? "touch" : "pointer"})`,
      severity: "fail",
    }));
  const inline = m.targets.filter((t) => t.inline).length;
  return result(
    "tap-targets",
    m.targets.length,
    findings,
    spec,
    inline ? `${inline} inline text link(s) exempt (WCAG 2.5.8)` : undefined,
  );
}

/** The ratio a text sample reaches, or null when its background is an image or gradient. */
export function sampleContrast(t: TextSample): number | null {
  if (!t.color) return null;
  if (t.layers) return contrastRatio(t.color, flatten(t.layers as RGBA[], t.base));
  if (t.sampled?.length) return Math.min(...t.sampled.map((bg) => contrastRatio(t.color!, bg)));
  return null;
}

export function checkContrast(m: Measurements, spec: SiteSpec): CheckResult {
  const findings: Finding[] = [];
  let unknown = 0;
  let checked = 0;
  for (const t of m.texts) {
    if (!t.contrastable || t.disabled) continue;
    const ratio = sampleContrast(t);
    if (ratio === null) {
      unknown++;
      continue;
    }
    checked++;
    const large = isLargeText(t.px, t.weight);
    const min = large ? spec.contrast.large : spec.contrast.normal;
    if (ratio < min - 0.005)
      findings.push({
        selector: t.selector,
        text: t.text,
        box: t.box,
        detail: `${ratio.toFixed(2)}:1, needs ${min}:1 (${t.px}px/${t.weight}${large ? ", large" : ""}${t.layers ? "" : ", background from pixels"})`,
        severity: "fail",
      });
  }
  const svg = m.texts.filter((t) => t.inSvg).length;
  const sampled = m.texts.filter((t) => t.contrastable && !t.layers && t.sampled?.length).length;
  const note = [
    sampled && `${sampled} over an image or gradient measured from pixels`,
    unknown && `${unknown} over an image or gradient not measured`,
    svg && `${svg} SVG text(s) left to the figure checks`,
  ]
    .filter(Boolean)
    .join("; ");
  return result("contrast", checked, findings, spec, note || undefined);
}

/** The first family of a CSS font-family stack, unquoted. */
export const firstFamily = (stack: string) =>
  stack
    .split(",")[0]
    .trim()
    .replace(/^["']|["']$/g, "");

/** Whether a platform font is one of the allowed faces (by family name or PostScript name). */
export function faceAllowed(font: { familyName: string; postScriptName?: string }, faces: string[]): boolean {
  const fam = font.familyName.toLowerCase();
  const ps = (font.postScriptName ?? "").toLowerCase();
  return faces.some((f) => {
    const face = f.toLowerCase();
    return fam === face || fam.startsWith(`${face} `) || ps.startsWith(face.replace(/\s+/g, ""));
  });
}

/** Characters a text face is not expected to carry: arrows, symbols, emoji (anything outside Latin letters, digits and common punctuation). */
export const symbolCount = (text: string) =>
  [...text].filter((c) => !/[\p{L}\p{N}\s.,;:!?'"()[\]{}\-–—/&%$#@*+=<>|_~`^’‘“”…·•]/u.test(c)).length;

export function checkFaces(m: Measurements, spec: SiteSpec, platform: PlatformFontUse[] | null, varFaces: string[]): CheckResult {
  if (!spec.faces) return { ...result("font-faces", 0, [], spec, "faces: null in the spec; not checked"), status: "skip" };
  const faces = [...spec.faces, ...varFaces];
  const findings: Finding[] = [];
  for (const t of m.texts) {
    const first = firstFamily(t.family);
    if (!faces.some((f) => f.toLowerCase() === first.toLowerCase()))
      findings.push({
        selector: t.selector,
        text: t.text,
        box: t.box,
        detail: `asks for "${first}" first (${t.family.slice(0, 60)})`,
        severity: "fail",
      });
  }
  let note = platform
    ? `${platform.length} element(s) checked for the font actually drawn`
    : "rendered fonts not checked (needs Chromium)";
  for (const use of platform ?? []) {
    for (const f of use.fonts) {
      if (f.glyphCount === 0 || faceAllowed(f, faces)) continue;
      const symbols =
        spec.symbolFaces.some((s) => f.familyName.toLowerCase().startsWith(s.toLowerCase())) ||
        f.glyphCount <= symbolCount(use.text);
      findings.push({
        selector: use.selector,
        text: use.text.slice(0, 60),
        box: use.box,
        detail: `${f.glyphCount} glyph(s) drawn in "${f.familyName}"${symbols ? " (symbols the site faces lack)" : ", a fallback: the site face did not load or lacks these letters"}`,
        severity: symbols ? "warn" : "fail",
      });
    }
  }
  if (varFaces.length) note += `; allowed: ${[...new Set(faces)].join(", ")}`;
  return result("font-faces", m.texts.length, findings, spec, note);
}

export function checkTextSize(m: Measurements, spec: SiteSpec): CheckResult {
  const findings: Finding[] = [];
  for (const t of m.texts) {
    const floor = t.floor >= 0 && spec.textFloors[t.floor] ? spec.textFloors[t.floor].px : spec.minTextPx;
    if (t.px < floor - 0.05)
      findings.push({ selector: t.selector, text: t.text, box: t.box, detail: `${t.px}px, floor ${floor}px`, severity: "fail" });
  }
  return result("text-size", m.texts.length, findings, spec);
}

export function checkImages(m: Measurements, spec: SiteSpec): CheckResult {
  return result(
    "img-alt",
    m.images.length,
    m.images.map((i) => ({ ...i, detail: i.issue, severity: "fail" })),
    spec,
  );
}

export function checkHeadingOrder(
  headings: { level: number; selector: string; text: string; box?: Box }[],
  spec: SiteSpec,
): CheckResult {
  const findings: Finding[] = [];
  // Headings before the h1 (a navigation column's group titles) sit under the page's title, so an
  // h2 there is not a skip; without an h1 the first heading must be one.
  let previous = headings.some((h) => h.level === 1) ? 1 : 0;
  for (const h of headings) {
    if (h.level > previous + 1)
      findings.push({
        ...h,
        detail: previous ? `h${h.level} follows an h${previous}` : `the first heading is an h${h.level}`,
        severity: "fail",
      });
    previous = h.level;
  }
  return result("heading-order", headings.length, findings, spec);
}

export function checkOneH1(
  headings: { level: number; selector: string; text: string; box?: Box }[],
  spec: SiteSpec,
): CheckResult {
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 1) return result("one-h1", 1, [], spec);
  const findings: Finding[] = h1s.length
    ? h1s.map((h) => ({ ...h, detail: `${h1s.length} visible h1s`, severity: "fail" as const }))
    : [{ selector: "body", text: "", detail: "no visible h1", severity: "fail" }];
  return { ...result("one-h1", 1, findings, spec), failures: 1 };
}

export function checkFocus(samples: FocusSample[], misses: number, spec: SiteSpec): CheckResult {
  const real = samples.filter((s) => s.how !== "ignored");
  const findings: Finding[] = [];
  for (const s of real) {
    if (!s.indicator) findings.push({ ...s, detail: "no visible change when focused by keyboard", severity: "fail" });
    else if (s.clippedBy) findings.push({ ...s, detail: `focus ring clipped by ${s.clippedBy}`, severity: "fail" });
  }
  if (!real.length)
    return {
      ...result("focus-visible", 0, [], spec, `Tab reached no control (${misses} presses)`),
      status: misses ? "warn" : "pass",
    };
  return result("focus-visible", real.length, findings, spec, `${real.length} control(s) reached by Tab`);
}

export function checkMotion(motion: MotionSample[], frameDiff: Extras["frameDiff"], spec: SiteSpec): CheckResult {
  const findings: Finding[] = motion.map((a) => ({
    ...a,
    detail: `still running under reduced motion: ${a.what}`,
    severity: "fail",
  }));
  if (frameDiff)
    findings.push({
      selector: "viewport",
      text: "",
      box: frameDiff.box,
      detail: `${frameDiff.changedPixels} pixel(s) changed between two frames 1s apart under reduced motion`,
      severity: "fail",
    });
  return result("reduced-motion", 1, findings, spec);
}

/** Every check for one view, in report order; a check the spec skips is listed with its reason. */
export function evaluateView(m: Measurements, x: Extras, spec: SiteSpec, varFaces: string[]): CheckResult[] {
  const run: Record<CheckId, () => CheckResult> = {
    "overflow-x": () => checkOverflow(m, spec),
    "text-clip": () => checkTextClip(m, spec),
    "text-overlap": () => checkTextOverlap(m, spec, x.visibleOverlaps),
    "row-heights": () => checkRows(m, spec),
    "tap-targets": () => checkTargets(m, spec, x.touch),
    contrast: () => checkContrast(m, spec),
    "font-faces": () => checkFaces(m, spec, x.platformFonts, varFaces),
    "text-size": () => checkTextSize(m, spec),
    "img-alt": () => checkImages(m, spec),
    "heading-order": () => checkHeadingOrder(m.headings, spec),
    "one-h1": () => checkOneH1(m.headings, spec),
    "focus-visible": () => checkFocus(x.focus, x.focusMisses, spec),
    "reduced-motion": () => checkMotion(x.motion, x.frameDiff, spec),
  };
  return CHECK_IDS.map((id) =>
    spec.skip[id] ? { id, status: "skip" as const, checked: 0, failures: 0, findings: [], note: spec.skip[id] } : run[id](),
  );
}
