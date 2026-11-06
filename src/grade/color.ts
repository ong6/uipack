/** WCAG colour math on plain [r, g, b, a] values (0–255, alpha 0–1). No DOM. */

export type RGBA = readonly [number, number, number, number];

/** `fg` painted over an opaque `bg` (source-over). */
export function over(fg: RGBA, bg: RGBA): RGBA {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
}

/** Lays translucent layers (top first) over an opaque base; the first opaque layer ends the stack. */
export function flatten(layers: readonly RGBA[], base: RGBA = [255, 255, 255, 1]): RGBA {
  let out = base;
  const opaque = layers.findIndex((l) => l[3] >= 1);
  const stack = opaque >= 0 ? layers.slice(0, opaque + 1) : layers;
  for (const layer of [...stack].reverse()) out = over(layer, out);
  return out;
}

/** WCAG 2 relative luminance of an opaque colour. */
export function luminance([r, g, b]: RGBA): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio of `fg` (composited over `bg`, which must be opaque) against `bg`. */
export function contrastRatio(fg: RGBA, bg: RGBA): number {
  const a = luminance(over(fg, bg));
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** WCAG large text: 18pt (24px), or 14pt (18.66px) bold. */
export function isLargeText(px: number, weight: number): boolean {
  return px >= 24 || (px >= 18.66 && weight >= 700);
}

/** Parses `rgb()` / `rgba()` (comma or space syntax) and `#rgb[a]` / `#rrggbb[aa]`; null otherwise. */
export function parseColor(input: string): RGBA | null {
  const s = input.trim().toLowerCase();
  if (s === "transparent") return [0, 0, 0, 0];
  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const fn = s.match(/^rgba?\(([^)]+)\)$/);
  if (!fn) return null;
  const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const ch = (p: string) => (p.endsWith("%") ? (parseFloat(p) * 255) / 100 : parseFloat(p));
  const alpha = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  const out: RGBA = [ch(parts[0]), ch(parts[1]), ch(parts[2]), alpha];
  return out.every((v) => Number.isFinite(v)) ? out : null;
}
