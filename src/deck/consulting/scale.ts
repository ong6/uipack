/* Pure chart maths for the consulting parts: scales, ticks, layout, text fitting and formatting.
   Everything here is canvas pixels and plain numbers, so it is unit-tested without a DOM. */

/** Canvas-pixel type sizes. Nothing on a consulting slide is smaller than `min` (≈14px at 1366 wide). */
export const CX_TYPE = {
  min: 20,
  tick: 20,
  label: 22,
  value: 22,
  callout: 22,
  quadrant: 20,
} as const;

/** The smallest text allowed on a slide, in canvas pixels. */
export const MIN_TEXT_PX = CX_TYPE.min;

export interface LinearScale {
  (value: number): number;
  domain: [number, number];
  range: [number, number];
  invert: (px: number) => number;
}

/** Maps `domain` onto `range` linearly. A zero-width domain maps everything to the range start. */
export function linearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const f = ((v: number) => (span === 0 ? r0 : r0 + ((v - d0) / span) * (r1 - r0))) as LinearScale;
  f.domain = [d0, d1];
  f.range = [r0, r1];
  f.invert = (px: number) => (r1 === r0 ? d0 : d0 + ((px - r0) / (r1 - r0)) * span);
  return f;
}

/** A "nice" step (1, 2, 2.5 or 5 × 10^n) that splits `span` into about `count` parts. */
export function niceStep(span: number, count = 5): number {
  if (!(span > 0) || !Number.isFinite(span)) return 1;
  const raw = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return nice * mag;
}

/** Round numbers that cover `[min, max]`: the extended domain and its ticks. */
export function niceTicks(min: number, max: number, count = 5): { domain: [number, number]; ticks: number[] } {
  if (min === max) {
    const pad = Math.abs(min) || 1;
    min -= pad;
    max += pad;
  }
  if (min > max) [min, max] = [max, min];
  const step = niceStep(max - min, count);
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(Number(v.toFixed(10)));
  return { domain: [lo, hi], ticks };
}

/** Domain that always includes zero (bars grow from a zero baseline). */
export function zeroBasedDomain(values: number[]): [number, number] {
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  return lo === hi ? [0, 1] : [lo, hi];
}

export interface Band {
  index: number;
  /** Start of the band slot. */
  start: number;
  /** Width of the whole slot. */
  size: number;
  /** Start of the mark centred in the slot. */
  markStart: number;
  /** Mark thickness: a share of the slot, capped. */
  mark: number;
  centre: number;
}

/**
 * Splits `length` into `count` equal slots and centres a mark of `fill` × slot in each, capped at
 * `maxMark` so bars never fill their slot (the leftover is air).
 */
export function bandLayout(count: number, start: number, length: number, fill = 0.6, maxMark = 48): Band[] {
  if (count <= 0) return [];
  const size = length / count;
  const mark = Math.max(1, Math.min(size * fill, maxMark));
  return Array.from({ length: count }, (_, index) => {
    const s = start + index * size;
    return { index, start: s, size, markStart: s + (size - mark) / 2, mark, centre: s + size / 2 };
  });
}

export interface WaterfallInput {
  label: string;
  /** A delta, or for a total the level itself. Omit on a total to close at the running level. */
  value?: number;
  total?: boolean;
}

export interface WaterfallBar {
  label: string;
  kind: "total" | "up" | "down";
  /** The value shown: the level for totals, the signed delta otherwise. */
  value: number;
  /** Level before and after this bar. For totals, `from` is 0. */
  from: number;
  to: number;
}

/** Turns start → deltas → end into floating bars. Totals reset the running level. */
export function waterfallBars(steps: WaterfallInput[]): WaterfallBar[] {
  let level = 0;
  return steps.map((s) => {
    if (s.total) {
      const v = s.value ?? level;
      level = v;
      return { label: s.label, kind: "total" as const, value: v, from: 0, to: v };
    }
    const d = s.value ?? 0;
    const from = level;
    level += d;
    return { label: s.label, kind: d >= 0 ? ("up" as const) : ("down" as const), value: d, from, to: level };
  });
}

export interface StackSegment {
  series: number;
  value: number;
  /** Cumulative start and end along the value axis (shares in percent mode). */
  from: number;
  to: number;
  /** Share of the category total, 0–1. */
  share: number;
}

/** Stacks one category's values. `percent` rescales the stack to 0–100. Negative values count as 0. */
export function stackSegments(values: number[], percent = false): StackSegment[] {
  const clean = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = clean.reduce((a, b) => a + b, 0);
  let acc = 0;
  return clean.map((v, series) => {
    const share = total > 0 ? v / total : 0;
    const len = percent ? share * 100 : v;
    const seg = { series, value: values[series], from: acc, to: acc + len, share };
    acc += len;
    return seg;
  });
}

/**
 * The filled wedge of a Harvey ball: `level` quarters of a circle of radius `r` centred on (cx, cy),
 * clockwise from 12 o'clock. Returns "" for 0 and a full circle path for 4.
 */
export function harveyWedge(level: number, cx: number, cy: number, r: number): string {
  const q = Math.max(0, Math.min(4, Math.round(level)));
  if (q === 0) return "";
  if (q === 4) return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const angle = (q / 4) * Math.PI * 2;
  const x = cx + r * Math.sin(angle);
  const y = cy - r * Math.cos(angle);
  const large = q > 2 ? 1 : 0;
  return `M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 ${large} 1 ${round(x)} ${round(y)}Z`;
}

/** Bubble radius with area proportional to `size`. */
export function bubbleRadius(size: number, maxSize: number, maxRadius: number, minRadius = 8): number {
  if (!(maxSize > 0) || !(size > 0)) return minRadius;
  return Math.max(minRadius, Math.sqrt(size / maxSize) * maxRadius);
}

/**
 * A bar with a 4px-style rounded data end and a square baseline end. Horizontal bars run from x0
 * to x1 (either direction); vertical bars from y0 (baseline) to y1.
 */
export function barPath(
  orientation: "horizontal" | "vertical",
  base: number,
  end: number,
  crossStart: number,
  thickness: number,
  radius = 4,
): string {
  const len = Math.abs(end - base);
  const r = Math.max(0, Math.min(radius, len, thickness / 2));
  const dir = end >= base ? 1 : -1;
  if (orientation === "horizontal") {
    const y0 = crossStart;
    const y1 = crossStart + thickness;
    return [
      `M${round(base)} ${round(y0)}`,
      `H${round(end - dir * r)}`,
      `Q${round(end)} ${round(y0)} ${round(end)} ${round(y0 + r)}`,
      `V${round(y1 - r)}`,
      `Q${round(end)} ${round(y1)} ${round(end - dir * r)} ${round(y1)}`,
      `H${round(base)}Z`,
    ].join("");
  }
  const x0 = crossStart;
  const x1 = crossStart + thickness;
  return [
    `M${round(x0)} ${round(base)}`,
    `V${round(end - dir * r)}`,
    `Q${round(x0)} ${round(end)} ${round(x0 + r)} ${round(end)}`,
    `H${round(x1 - r)}`,
    `Q${round(x1)} ${round(end)} ${round(x1)} ${round(end - dir * r)}`,
    `V${round(base)}Z`,
  ].join("");
}

const round = (v: number) => Math.round(v * 100) / 100;

/* ------------------------------------------------------------------------------------------- */
/* Text                                                                                         */
/* ------------------------------------------------------------------------------------------- */

/**
 * Estimated rendered width of `text` at `size` in a UI sans. Errs wide, so labels placed with it
 * do not collide. Used only for layout; nothing is clipped to it.
 */
export function textWidth(text: string, size: number, weight: 400 | 600 = 400): number {
  let em = 0;
  for (const ch of text) {
    if (/[0-9]/.test(ch)) em += 0.58;
    else if (/[A-Z]/.test(ch)) em += /[MW]/.test(ch) ? 0.86 : 0.66;
    else if (/[a-z]/.test(ch)) em += /[mw]/.test(ch) ? 0.8 : /[iljtf]/.test(ch) ? 0.3 : 0.54;
    else if (ch === " ") em += 0.27;
    else if (/[.,:;'’|!]/.test(ch)) em += 0.28;
    else if (/[$%€£+−\-–—/()]/.test(ch)) em += 0.6;
    else em += 0.62;
  }
  return em * size * (weight === 600 ? 1.05 : 1);
}

/** Greedy word wrap to `maxWidth`, at most `maxLines` lines (the last line keeps the overflow). */
export function wrapText(text: string, size: number, maxWidth: number, maxLines = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && textWidth(next, size) > maxWidth && lines.length < maxLines - 1) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Spreads labels that want to sit at `ys` (in order of any kind) so neighbours are at least `gap`
 * apart, staying inside [min, max]. Returns the placed positions in the input order.
 */
export function spreadLabels(ys: number[], gap: number, min = -Infinity, max = Infinity): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const placed = order.map((o) => Math.min(Math.max(o.y, min), max));
  for (let k = 1; k < placed.length; k++) placed[k] = Math.max(placed[k], placed[k - 1] + gap);
  const overflow = placed.length ? placed[placed.length - 1] - max : 0;
  if (overflow > 0) {
    placed[placed.length - 1] -= overflow;
    for (let k = placed.length - 2; k >= 0; k--) placed[k] = Math.min(placed[k], placed[k + 1] - gap);
  }
  const out = new Array<number>(ys.length);
  order.forEach((o, k) => (out[o.i] = placed[k]));
  return out;
}

/* ------------------------------------------------------------------------------------------- */
/* Numbers                                                                                      */
/* ------------------------------------------------------------------------------------------- */

export interface FormatOptions {
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Always show a sign: "+1.2", "−0.4". Uses the true minus sign. */
  sign?: boolean;
  /** Compact thousands and millions: 1.2K, 3.4M. */
  compact?: boolean;
}

/** Formats a number for a slide: fixed decimals, thousands separators, a real minus sign. */
export function formatValue(value: number, options: FormatOptions = {}): string {
  const { decimals = 0, prefix = "", suffix = "", sign = false, compact = false } = options;
  let v = Math.abs(value);
  let unit = "";
  if (compact) {
    if (v >= 1e9) [v, unit] = [v / 1e9, "B"];
    else if (v >= 1e6) [v, unit] = [v / 1e6, "M"];
    else if (v >= 1e3) [v, unit] = [v / 1e3, "K"];
  }
  const body = v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const isZero = Number(body.replace(/,/g, "")) === 0;
  const s = value < 0 && !isZero ? "−" : sign && !isZero ? "+" : "";
  return `${s}${prefix}${body}${unit}${suffix}`;
}

/** A formatter bound to options, for chart props. */
export const formatter = (options: FormatOptions = {}) => (v: number) => formatValue(v, options);
