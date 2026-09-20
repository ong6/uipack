import type { PresentationTheme, SlideStarterData } from "./types";

export interface RenderSlideSvgOptions {
  theme?: PresentationTheme;
  width?: number;
}

const palettes = {
  light: {
    paper: "#f6f5f1",
    surface: "#ffffff",
    ink: "#1a1c1a",
    muted: "#5c625e",
    accent: "#205f49",
    rule: "#bac3bc",
  },
  dark: {
    paper: "#0a100d",
    surface: "#14201b",
    ink: "#e8ece9",
    muted: "#9aa39e",
    accent: "#71dcb2",
    rule: "#43544b",
  },
} as const;

export function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function accessibleTitle(slide: SlideStarterData): string {
  return slide.layout === "opening"
    ? slide.content.headline.join(" ")
    : slide.content.headline;
}

export function renderSlideSvg(
  slide: SlideStarterData,
  options: RenderSlideSvgOptions = {},
): string {
  const theme = options.theme ?? "light";
  const colors = palettes[theme];
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
  ) =>
    `<text x="${x}" y="${y}" font-family="${mono ? "IBM Plex Mono, ui-monospace, monospace" : "IBM Plex Sans, system-ui, sans-serif"}" font-size="${size}" fill="${color}" font-weight="${weight}">${escapeSvgText(value)}</text>`;
  const rule = (x1: number, y: number, x2: number) =>
    `<path d="M${x1} ${y}H${x2}" stroke="${colors.rule}" stroke-width="2"/>`;
  const footer = slide.footer
    ? rule(64, 592, 1136) +
      text(64, 635, slide.footer.label, 18, colors.muted, 400, true) +
      (slide.footer.page
        ? text(1010, 635, slide.footer.page, 18, colors.muted, 400, true)
        : "")
    : "";

  let body = "";
  if (slide.layout === "opening") {
    body =
      text(64, 105, slide.content.eyebrow, 22, colors.accent, 700, true) +
      text(64, 277, slide.content.headline[0], 78, colors.ink, 600) +
      text(64, 371, slide.content.headline[1], 78, colors.ink, 600) +
      text(64, 457, slide.content.context, 28, colors.muted);
  } else if (slide.layout === "explanation") {
    const [first, second] = slide.content.applications;
    body =
      text(64, 105, slide.content.eyebrow, 22, colors.accent, 700, true) +
      text(64, 196, slide.content.headline, 52, colors.ink, 600) +
      `<rect x="64" y="264" width="440" height="256" fill="${colors.surface}" stroke="${colors.rule}"/>` +
      text(96, 328, slide.content.foundation.title, 22, colors.accent, 700, true) +
      text(96, 399, slide.content.foundation.detail, 30, colors.ink, 600) +
      text(568, 310, first.title, 30, colors.ink, 600) +
      text(568, 358, first.detail, 24, colors.muted) +
      text(568, 442, second.title, 30, colors.ink, 600) +
      text(568, 490, second.detail, 24, colors.muted);
  } else {
    body =
      text(64, 105, slide.content.eyebrow, 22, colors.accent, 700, true) +
      text(64, 196, slide.content.headline, 52, colors.ink, 600);
    slide.content.steps.forEach((step, index) => {
      const x = 64 + index * 392;
      body +=
        `<rect x="${x}" y="295" width="288" height="138" fill="${colors.surface}" stroke="${colors.rule}" stroke-width="2"/>` +
        text(x + 24, 351, step.title, 30, colors.ink, 600) +
        text(x + 24, 394, step.detail, 20, colors.muted, 400, true);
      if (index < slide.content.steps.length - 1) {
        const arrow = x + 302;
        body += `<path d="M${arrow} 364h70m-10-8 10 8-10 8" fill="none" stroke="${colors.accent}" stroke-width="3"/>`;
      }
    });
    body += text(64, 521, slide.content.caption, 27, colors.muted);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 675" role="img"><title>${escapeSvgText(`${slide.title}: ${accessibleTitle(slide)}`)}</title><desc>${escapeSvgText(slide.description)}</desc><rect width="1200" height="675" fill="${colors.paper}"/>${body}${footer}</svg>`;
}
