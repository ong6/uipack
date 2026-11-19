import type { PresentationTheme, SlideStarterData } from "./types";
import { technicalFonts, technicalValues } from "../styles/technical-values";

export interface RenderSlideSvgOptions {
  theme?: PresentationTheme;
  width?: number;
  /**
   * "resolved" (default) writes Technical's literal colours and faces, for a standalone file. "css"
   * paints with the style roles (var(--ui-ink)…) in style attributes, so the SVG inlined in a page
   * follows the page's style and theme (SlideStarter does this).
   */
  paint?: "resolved" | "css";
}

type Colors = { paper: string; surface: string; ink: string; muted: string; accent: string; rule: string };

const palettes: Record<PresentationTheme, Colors> = {
  light: {
    paper: technicalValues.light.paper,
    surface: technicalValues.light["surface-raised"],
    ink: technicalValues.light.ink,
    muted: technicalValues.light["ink-2"],
    accent: technicalValues.light.accent,
    rule: technicalValues.light["slide-line"],
  },
  dark: {
    paper: technicalValues.dark.paper,
    surface: technicalValues.dark["surface-raised"],
    ink: technicalValues.dark.ink,
    muted: technicalValues.dark["ink-2"],
    accent: technicalValues.dark.accent,
    rule: technicalValues.dark["slide-line"],
  },
};

/** The same slots as roles; the host's color-scheme picks the light or dark half. */
const cssColors: Colors = {
  paper: "var(--ui-paper)",
  surface: "var(--ui-surface-raised)",
  ink: "var(--ui-ink)",
  muted: "var(--ui-ink-2)",
  accent: "var(--ui-accent)",
  rule: "var(--tune-slide-line, var(--ui-line))",
};

const resolvedFaces = { sans: technicalFonts.sans, mono: technicalFonts.mono };
const cssFaces = {
  sans: "var(--ui-slide-font-text, var(--ui-font-text))",
  mono: "var(--ui-slide-font-label, var(--ui-font-label))",
};

export function escapeSvgText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function accessibleTitle(slide: SlideStarterData): string {
  return slide.layout === "opening" ? slide.content.headline.join(" ") : slide.content.headline;
}

/**
 * Role classes on the drawing's small text: "label" (mono eyebrow, footer, box title), "boxed" (text
 * inside a fixed box) and "fine" (small copy). Headlines carry none; presentations.css styles them.
 */
type FineRole = "label" | "boxed" | "fine";

/** IBM Plex Mono's advance, in em: exact, so mono text in a box wraps by character count. */
const MONO_EM = 0.6;
/** Plex Sans is proportional: an upper bound per character (the starters measure 0.42–0.46em). */
const SANS_EM = 0.5;
const SANS_BOLD_EM = 0.52;

/** Greedy word wrap to at most `chars` characters a line (a longer word keeps its own line). */
function wrap(value: string, chars: number): string[] {
  const lines: string[] = [];
  for (const word of value.split(/\s+/).filter(Boolean)) {
    const last = lines.length - 1;
    if (last >= 0 && lines[last].length + 1 + word.length <= chars) lines[last] += ` ${word}`;
    else lines.push(word);
  }
  return lines.length ? lines : [value];
}

export function renderSlideSvg(slide: SlideStarterData, options: RenderSlideSvgOptions = {}): string {
  return renderSlideSvgWithFloor(slide, options, 0);
}

/**
 * renderSlideSvg with a text floor in slide units (internal; SlideStarter passes the floor for the
 * width it is shown at). Every text is drawn at least `floor` units tall. Where the larger text no
 * longer fits the 1200-unit layout, the layout makes room: System's steps widen, their detail wraps
 * and the boxes grow; Explanation's box narrows so the right column fits, and its detail wraps.
 * At floor 0 (and at any floor below every default size) the drawing is renderSlideSvg's.
 */
export function renderSlideSvgWithFloor(slide: SlideStarterData, options: RenderSlideSvgOptions, floor: number): string {
  const theme = options.theme ?? "light";
  const css = options.paint === "css";
  const colors = css ? cssColors : palettes[theme];
  const faces = css ? cssFaces : resolvedFaces;
  // Presentation attributes cannot hold var(); in "css" mode paint goes in a style attribute.
  const paint = (p: { fill?: string; stroke?: string; font?: string }) =>
    css
      ? ` style="${[p.fill && `fill:${p.fill}`, p.stroke && `stroke:${p.stroke}`, p.font && `font-family:${p.font}`].filter(Boolean).join(";")}"`
      : `${p.font ? ` font-family="${p.font}"` : ""}${p.fill ? ` fill="${p.fill}"` : ""}${p.stroke ? ` stroke="${p.stroke}"` : ""}`;
  const width = options.width ?? 1200;
  const height = Math.round((width * 9) / 16);
  /** A designed size, raised to the floor. */
  const sz = (size: number) => Math.max(size, floor);
  const text = (
    x: number,
    y: number,
    value: string,
    size = 26,
    color: string = colors.ink,
    weight = 400,
    mono = false,
    anchor: "start" | "end" = "start",
    role?: FineRole,
    tracking?: number,
  ) =>
    `<text x="${x}" y="${y}"${anchor === "end" ? ' text-anchor="end"' : ""}${role ? ` class="uipack-slide-starter__${role}"` : ""} ${css ? "" : paint({ font: mono ? faces.mono : faces.sans })} font-size="${sz(size)}"${paint(css ? { fill: color, font: mono ? faces.mono : faces.sans } : { fill: color })} font-weight="${weight}"${tracking ? ` letter-spacing="${tracking}em"` : ""}>${escapeSvgText(tracking ? value.toUpperCase() : value)}</text>`;
  /** Wrapped text: `draw` each line, `step` units below the one before. */
  const lines = (values: string[], step: number, draw: (value: string, dy: number) => string) =>
    values.map((value, i) => draw(value, i * step)).join("");
  // The deck's optional eyebrow and footer (deck.css .uipack-deck-eyebrow, .uipack-deck-footer), scaled from
  // its 1920 canvas to this 1200 one: tracked mono caps, the eyebrow in the accent.
  const eyebrow = (value?: string) => (value ? text(64, 105, value, 15, colors.accent, 600, true, "start", "label", 0.14) : "");
  const foot = (x: number, value: string, anchor: "start" | "end") =>
    text(x, 635, value, 13, colors.muted, 500, true, anchor, "label", 0.06);
  const rule = (x1: number, y: number, x2: number) =>
    `<path d="M${x1} ${y}H${x2}"${paint({ stroke: colors.rule })} stroke-width="2"/>`;
  const footer = slide.footer
    ? rule(64, 592, 1136) +
      foot(64, slide.footer.label, "start") +
      (slide.footer.page ? foot(1136, slide.footer.page, "end") : "")
    : "";

  let body = "";
  if (slide.layout === "opening") {
    body =
      eyebrow(slide.content.eyebrow) +
      text(64, 277, slide.content.headline[0], 78, colors.ink, 600) +
      text(64, 371, slide.content.headline[1], 78, colors.ink, 600) +
      text(64, 457, slide.content.context, 28, colors.muted, 400, false, "start", "fine");
  } else if (slide.layout === "explanation") {
    const { foundation, applications } = slide.content;
    const [first, second] = applications;
    const [appTitle, appDetail, detail] = [sz(30), sz(24), sz(30)];
    // The right column starts at 568 while it fits before the 1136 margin; else the box narrows to 400.
    const columnWidth = Math.max(
      ...applications.flatMap((a) => [a.title.length * SANS_BOLD_EM * appTitle, a.detail.length * SANS_EM * appDetail]),
    );
    const boxWidth = 568 + columnWidth > 1136 ? 400 : 440;
    const column = boxWidth === 440 ? 568 : 64 + boxWidth + 48;
    // The box's detail wraps inside its 32-unit left and 24-unit right padding.
    const detailLines = wrap(foundation.detail, Math.floor((boxWidth - 56) / (SANS_BOLD_EM * detail)));
    const detailStep = Math.round(1.2 * detail);
    const boxHeight = Math.max(256, 399 + (detailLines.length - 1) * detailStep + 40 - 264);
    const gap = Math.max(48, Math.round(1.2 * appDetail));
    const second0 = 310 + gap + Math.max(84, Math.round(1.8 * appTitle));
    body =
      eyebrow(slide.content.eyebrow) +
      text(64, 196, slide.content.headline, 52, colors.ink, 600) +
      `<rect x="64" y="264" width="${boxWidth}" height="${boxHeight}"${paint({ fill: colors.surface, stroke: colors.rule })}/>` +
      text(96, 328, foundation.title, 22, colors.accent, 700, true, "start", "label") +
      lines(detailLines, detailStep, (line, dy) => text(96, 399 + dy, line, 30, colors.ink, 600, false, "start", "boxed")) +
      text(column, 310, first.title, 30, colors.ink, 600, false, "start", "boxed") +
      text(column, 310 + gap, first.detail, 24, colors.muted, 400, false, "start", "fine") +
      text(column, second0, second.title, 30, colors.ink, 600, false, "start", "boxed") +
      text(column, second0 + gap, second.detail, 24, colors.muted, 400, false, "start", "fine");
  } else {
    const { steps } = slide.content;
    const detail = sz(20);
    // Three 288-unit boxes 104 apart while every detail fits one line inside 24 + 12 units of
    // padding; else 316-unit boxes 62 apart (still 1072 across) and the detail wraps.
    const chars = (box: number) => Math.floor((box - 36) / (MONO_EM * detail));
    const wide = steps.every((step) => step.detail.length <= chars(288));
    const [boxWidth, gap] = wide ? [288, 104] : [316, 62];
    const stepLines = steps.map((step) => wrap(step.detail, chars(boxWidth)));
    const detailY = 351 + Math.max(43, Math.round(1.15 * detail));
    const detailStep = Math.round(1.2 * detail);
    const boxBottom = detailY + (Math.max(...stepLines.map((l) => l.length)) - 1) * detailStep + 39;
    const boxHeight = boxBottom - 295;
    const arrowY = 295 + boxHeight / 2;
    body = eyebrow(slide.content.eyebrow) + text(64, 196, slide.content.headline, 52, colors.ink, 600);
    steps.forEach((step, index) => {
      const x = 64 + index * (boxWidth + gap);
      body +=
        `<rect x="${x}" y="295" width="${boxWidth}" height="${boxHeight}"${paint({ fill: colors.surface, stroke: colors.rule })} stroke-width="2"/>` +
        text(x + 24, 351, step.title, 30, colors.ink, 600, false, "start", "boxed") +
        lines(stepLines[index], detailStep, (line, dy) =>
          text(x + 24, detailY + dy, line, 20, colors.muted, 400, true, "start", "boxed"),
        );
      if (index < steps.length - 1) {
        const [start, length] = wide ? [x + 302, 70] : [x + boxWidth + 10, gap - 22];
        body += `<path d="M${start} ${arrowY}h${length}m-10-8 10 8-10 8" fill="none"${paint({ stroke: colors.accent })} stroke-width="3"/>`;
      }
    });
    const caption = Math.max(521, boxBottom + Math.round(0.72 * sz(27)) + 40);
    body += text(64, caption, slide.content.caption, 27, colors.muted, 400, false, "start", "fine");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 675" role="img"><title>${escapeSvgText(`${slide.title}: ${accessibleTitle(slide)}`)}</title><desc>${escapeSvgText(slide.description)}</desc><rect width="1200" height="675"${paint({ fill: colors.paper })}/>${body}${footer}</svg>`;
}
