import { readFileSync } from "node:fs";
import { Chip, Connector, Defs, Node, Packet, defineDiagramTheme } from "../src";
import { agentLoop } from "../src/presets";
import { renderStatic } from "../src/static";
import { DARK, LIGHT, inlineVars, resolvePalette } from "../src/static/palette";
import { wrapText } from "../src/static/wrap";

const drawing = (
  <>
    <Defs id="s" />
    <Node x={16} y={16} w={120} h={40} label="A" sub="mono" icon="db" />
    <Node x={200} y={16} w={120} h={40} label="B" accent />
    <Connector
      points={[
        [136, 36],
        [200, 36],
      ]}
      defs="s"
      kind="request"
    />
    <Packet
      points={[
        [136, 36],
        [200, 36],
      ]}
      kind="request"
      dur={2}
      id="pk"
    />
  </>
);
const fig = {
  children: drawing,
  viewBox: "0 0 336 72",
  title: "T",
  caption: "A caption that is long enough to wrap when the column is narrow, which it is here.",
  legend: [{ label: "Request", kind: "request" as const }],
  alt: "alt",
};

describe("renderStatic", () => {
  it("resolves every CSS variable and keeps no var() behind", () => {
    const svg = renderStatic(fig, { theme: "light" });
    expect(svg).not.toContain("var(--");
    expect(svg).toContain(LIGHT["token-request"]);
    expect(svg).toContain(LIGHT.accent);
    expect(svg).toContain('font-family="');
    expect(svg.startsWith("<svg xmlns=")).toBe(true);
  });
  it("keeps SMIL when motion is on and renders a static token when off", () => {
    const on = renderStatic(fig, { motion: true });
    expect(on).toContain("<animateMotion");
    expect(on).not.toContain('data-static="true"');
    const off = renderStatic(fig, { motion: false });
    expect(off).not.toContain("<animateMotion");
    expect(off).toContain('data-static="true"');
  });
  it("frame draws the header and border; frame false gives the bare drawing", () => {
    const framed = renderStatic(fig);
    expect(framed).toContain(">T<");
    expect(framed).toContain("Request");
    expect(framed).toMatch(/viewBox="0 0 336 \d+"/);
    const [, h] = framed.match(/viewBox="0 0 336 (\d+)"/)!;
    expect(Number(h)).toBeGreaterThan(72 + 60);
    const bare = renderStatic(fig, { frame: false });
    expect(bare).not.toContain(">T<");
    expect(bare).toContain('viewBox="0 0 336 72"');
    expect(bare).not.toContain('<rect x="0.5"');
  });
  it("dark and custom palettes reach the drawing", () => {
    const dark = renderStatic(fig, { theme: "dark" });
    expect(dark).toContain(DARK.fg);
    expect(dark).toContain(DARK["token-request"]);
    const custom = renderStatic(fig, { theme: { base: "dark", accent: "#123456" } });
    expect(custom).toContain("#123456");
    expect(resolvePalette({ accent: "#abcdef" }).bg).toBe(LIGHT.bg);
  });
  it("accepts a preset element and reads its parts", () => {
    const svg = renderStatic(agentLoop(), { frame: true, theme: "light" });
    expect(svg).toContain("AGENT LOOP");
    expect(svg).toContain("<animateMotion");
    expect(svg).not.toContain("var(--");
  });
  it("background false leaves the canvas transparent", () => {
    const svg = renderStatic(fig, { background: false, frame: false });
    expect(svg).not.toContain(`fill="${LIGHT.bg}"/>`);
  });
  it("helpers", () => {
    expect(inlineVars("var(--uipack-accent) var(--uipack-nope)", LIGHT)).toBe(`${LIGHT.accent} currentColor`);
    expect(wrapText("a b c d e f", 5)).toEqual(["a b c", "d e f"]);
  });
});

describe("renderStatic across bundles", () => {
  it("raises the prerender flag only while rendering", () => {
    const g = globalThis as { __UIPACK_PRERENDER__?: boolean };
    expect(g.__UIPACK_PRERENDER__).toBeUndefined();
    renderStatic(fig, { motion: true });
    expect(g.__UIPACK_PRERENDER__).toBeUndefined();
  });
  it("the built static entry keeps SMIL when Packet comes from the built main entry", async () => {
    // A computed path: typecheck runs before the build, so tsc must not look for dist's declarations.
    const dist = "../dist";
    const main = (await import(/* @vite-ignore */ `${dist}/index.js`)) as typeof import("../src");
    const stat = (await import(/* @vite-ignore */ `${dist}/static.js`)) as typeof import("../src/static");
    const { createElement } = await import("react");
    const pts: [number, number][] = [
      [0, 10],
      [100, 10],
    ];
    const svg = stat.renderStatic(
      { viewBox: "0 0 120 20", children: createElement(main.Packet, { points: pts, kind: "request", dur: 2 }) },
      { motion: true, frame: false },
    );
    expect(svg).toContain("<animateMotion");
  });
});

describe("renderStatic is well-formed XML", () => {
  it("survives a double-quoted font stack and parses in a strict XML parser", () => {
    const svg = renderStatic(fig, {
      theme: { base: "dark", mono: 'ui-monospace, "JetBrains Mono", Menlo, monospace', sans: '"Segoe UI", sans-serif' },
    });
    expect(svg).not.toContain('"JetBrains');
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.documentElement.getAttribute("font-family")).toContain("'Segoe UI'");
  });
  it("every preset exports as parseable XML in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const doc = new DOMParser().parseFromString(renderStatic(agentLoop(), { theme }), "image/svg+xml");
      expect(doc.querySelector("parsererror")).toBeNull();
    }
  });
});

describe("renderStatic chip washes match the live figure", () => {
  // A site's diagram theme sets no chip wash, as defineDiagramTheme has no such role. Live, a light
  // figure leaves --uipack-chip-tint unset (the chip's own 0.55 and soft 0.2 apply) and a dark one
  // takes theme.css's wash; the static file must print the same fill-opacity, not a solid fill.
  const theme = defineDiagramTheme({
    name: "plain-site",
    light: {
      ink: "#1d1b16",
      "ink-2": "#5c574c",
      surface: "#faf6ee",
      "surface-raised": "#fffdf8",
      "surface-2": "#f0e9dc",
      accent: "#2346c8",
      "flow-request": "#0f7480",
      "flow-response": "#3c7a3a",
      "flow-change": "#8e44ad",
      "flow-error": "#c0392b",
    },
    dark: {
      ink: "#f1ece2",
      "ink-2": "#b9b1a2",
      surface: "#1b1915",
      "surface-raised": "#24211c",
      "surface-2": "#2d2a23",
      accent: "#8ea8ff",
      "flow-request": "#63c7cf",
      "flow-response": "#8fd18a",
      "flow-change": "#d4a2ec",
      "flow-error": "#ff8f7d",
    },
  });
  const css = readFileSync("src/theme.css", "utf8");
  const dark = css.match(
    /\[data-theme="dark"\] \.uipack,[^{]*\{[^}]*--uipack-chip-tint: ([\d.]+);\s*--uipack-chip-soft: ([\d.]+);/,
  )!;
  const chips = {
    children: (
      <>
        <Chip x={8} y={8} w={80} label="busy" kind="request" />
        <Chip x={96} y={8} w={80} label="was" kind="request" soft />
      </>
    ),
    viewBox: "0 0 184 40",
  };
  const opacities = (svg: string) => [...svg.matchAll(/fill-opacity:([^;"]+)/g)].map((m) => m[1].trim());

  it.each([
    ["light", ["0.55", "0.2"]],
    ["dark", [dark[1], dark[2]]],
  ] as const)("%s: the live wash, not currentColor", (mode, expected) => {
    expect(dark).not.toBeNull();
    expect(opacities(renderStatic(chips, { theme, mode, frame: false }))).toEqual(expected);
  });
  it("the older named palettes follow the same washes", () => {
    expect(opacities(renderStatic(chips, { theme: "light", frame: false }))).toEqual(["0.55", "0.2"]);
    expect(opacities(renderStatic(chips, { theme: "dark", frame: false }))).toEqual([dark[1], dark[2]]);
  });
  it("an unknown variable takes its declared fallback; none, or one that reads the page, gives currentColor", () => {
    expect(inlineVars("var(--uipack-nope, 0.4)", LIGHT)).toBe("0.4");
    expect(inlineVars("var(--uipack-nope, var(--uipack-accent))", LIGHT)).toBe(LIGHT.accent);
    expect(inlineVars("var(--uipack-nope, var(--ui-page))", LIGHT)).toBe("currentColor");
  });
});
