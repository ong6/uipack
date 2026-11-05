import type { PresentationTheme, SlideStarterData } from "./types";
import { technicalValues } from "../styles/technical-values";

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

const resolvedFaces = { sans: "IBM Plex Sans, system-ui, sans-serif", mono: "IBM Plex Mono, ui-monospace, monospace" };
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
 * Fine print on the 1200-unit slide. At 390px the slide is drawn at about 0.3x, so an 18-unit footer
 * would be 5px; presentations.css raises each role to a readable size in a narrow preview.
 * "label": mono labels (eyebrow, footer); "boxed": mono text inside a fixed box; "fine": small copy.
 */
type FineRole = "label" | "boxed" | "fine";

export function renderSlideSvg(slide: SlideStarterData, options: RenderSlideSvgOptions = {}): string {
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
    `<text x="${x}" y="${y}"${anchor === "end" ? ' text-anchor="end"' : ""}${role ? ` class="uipack-slide-starter__${role}"` : ""} ${css ? "" : paint({ font: mono ? faces.mono : faces.sans })} font-size="${size}"${paint(css ? { fill: color, font: mono ? faces.mono : faces.sans } : { fill: color })} font-weight="${weight}"${tracking ? ` letter-spacing="${tracking}em"` : ""}>${escapeSvgText(tracking ? value.toUpperCase() : value)}</text>`;
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
    const [first, second] = slide.content.applications;
    body =
      eyebrow(slide.content.eyebrow) +
      text(64, 196, slide.content.headline, 52, colors.ink, 600) +
      `<rect x="64" y="264" width="440" height="256"${paint({ fill: colors.surface, stroke: colors.rule })}/>` +
      text(96, 328, slide.content.foundation.title, 22, colors.accent, 700, true, "start", "label") +
      text(96, 399, slide.content.foundation.detail, 30, colors.ink, 600, false, "start", "boxed") +
      text(568, 310, first.title, 30, colors.ink, 600, false, "start", "boxed") +
      text(568, 358, first.detail, 24, colors.muted, 400, false, "start", "fine") +
      text(568, 442, second.title, 30, colors.ink, 600, false, "start", "boxed") +
      text(568, 490, second.detail, 24, colors.muted, 400, false, "start", "fine");
  } else {
    body = eyebrow(slide.content.eyebrow) + text(64, 196, slide.content.headline, 52, colors.ink, 600);
    slide.content.steps.forEach((step, index) => {
      const x = 64 + index * 392;
      body +=
        `<rect x="${x}" y="295" width="288" height="138"${paint({ fill: colors.surface, stroke: colors.rule })} stroke-width="2"/>` +
        text(x + 24, 351, step.title, 30, colors.ink, 600, false, "start", "boxed") +
        text(x + 24, 394, step.detail, 20, colors.muted, 400, true, "start", "boxed");
      if (index < slide.content.steps.length - 1) {
        const arrow = x + 302;
        body += `<path d="M${arrow} 364h70m-10-8 10 8-10 8" fill="none"${paint({ stroke: colors.accent })} stroke-width="3"/>`;
      }
    });
    body += text(64, 521, slide.content.caption, 27, colors.muted, 400, false, "start", "fine");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 675" role="img"><title>${escapeSvgText(`${slide.title}: ${accessibleTitle(slide)}`)}</title><desc>${escapeSvgText(slide.description)}</desc><rect width="1200" height="675"${paint({ fill: colors.paper })}/>${body}${footer}</svg>`;
}
