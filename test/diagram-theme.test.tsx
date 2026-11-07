import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "@testing-library/react";
import {
  Action,
  Actor,
  Decision,
  DiagramThemeScope,
  Figure,
  LaneRule,
  Lifeline,
  Lost,
  Message,
  Node,
  Note,
  Outcome,
  Screen,
  SelfLoop,
  Activation,
  blueprint,
  defineDiagramTheme,
  diagramColors,
  diagramThemeCss,
  diagramThemeVars,
  isDiagramTheme,
  DIAGRAM_CARRIERS,
} from "../src";
import { DARK, LIGHT, renderStatic, resolvePalette, themePalette } from "../src/static";
import { technicalValues } from "../src/styles/technical-values";

const paper = defineDiagramTheme({
  name: "paper",
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
    "accent-ink": "#b3c4ff",
    "flow-request": "#63c7cf",
    "flow-response": "#8fd18a",
    "flow-change": "#d4a2ec",
    "flow-error": "#ff8f7d",
  },
  fonts: { text: "Georgia, serif" },
  canvas: "dots",
});

describe("defineDiagramTheme", () => {
  it("fills the canvas and freezes", () => {
    expect(paper.canvas).toBe("dots");
    expect(Object.isFrozen(paper)).toBe(true);
    expect(isDiagramTheme(paper)).toBe(true);
    expect(isDiagramTheme({ base: "dark", fg: "#000" })).toBe(false);
  });
  it("rejects a bad name and a missing role", () => {
    expect(() => defineDiagramTheme({ ...paper, name: "Paper Theme" })).toThrow(/kebab-case/);
    const { accent: _a, ...noAccent } = paper.dark;
    expect(() => defineDiagramTheme({ ...paper, dark: noAccent as typeof paper.dark })).toThrow(/dark has no "accent"/);
  });
  it("derives line weights and accent ink", () => {
    const c = diagramColors(paper, "light");
    expect(c.line).toBe("rgba(29, 27, 22, 0.26)");
    expect(c["line-soft"]).toBe("rgba(29, 27, 22, 0.13)");
    expect(c["accent-ink"]).toBe("#2346c8");
    expect(diagramColors(paper, "dark")["accent-ink"]).toBe("#b3c4ff");
  });
});

describe("blueprint is today's default", () => {
  it("holds Technical's values", () => {
    for (const mode of ["light", "dark"] as const) {
      const c = diagramColors(blueprint, mode);
      const t = technicalValues[mode];
      expect(c.ink).toBe(t.ink);
      expect(c.surface).toBe(t.surface);
      expect(c.accent).toBe(t.accent);
      expect(c["flow-error"]).toBe(t["flow-error"]);
      expect(c.line).toBe(t.line);
      expect(c["line-soft"]).toBe(t["line-soft"]);
    }
  });
  it("gives the static export the same palette as the default", () => {
    expect(resolvePalette(blueprint, "light")).toEqual(resolvePalette(undefined));
    expect(resolvePalette(blueprint, "dark")).toEqual(resolvePalette("dark"));
  });
  it("leaves faces to the page and draws the drafting grid live", () => {
    const vars = diagramThemeVars(blueprint);
    expect(vars["--uipack-diagram-font-text"]).toBeUndefined();
    expect(vars["--uipack-diagram-canvas"]).toContain("60px 60px");
    expect(vars["--uipack-diagram-ink"]).toBe("light-dark(#0b2748, #edf3fb)");
  });
});

describe("diagramThemeCss", () => {
  it("writes every carrier as a light-dark pair on the theme's scope", () => {
    const css = diagramThemeCss(paper);
    expect(css).toContain('[data-diagram-theme="paper"] {');
    expect(css).toContain("--uipack-diagram-ink: light-dark(#1d1b16, #f1ece2);");
    expect(css).toContain("--uipack-diagram-accent-ink: light-dark(#2346c8, #b3c4ff);");
    expect(css).toContain("--uipack-diagram-line: light-dark(color-mix(in srgb, #1d1b16 26%, transparent)");
    expect(css).toContain("--uipack-diagram-font-text: Georgia, serif;");
    expect(css).toContain("--uipack-diagram-canvas: radial-gradient(");
    expect(css).not.toContain("--uipack-diagram-font-label");
    expect(css).not.toContain("color-scheme");
  });
  it("takes a site scope and the host's mode selectors", () => {
    const css = diagramThemeCss(paper, { scope: ":root", darkSelector: ".dark", lightSelector: ".light" });
    expect(css).toMatch(/^\/\* uipack diagram theme: paper \*\/\n:root \{/);
    expect(css).toContain(":is(.dark) .uipack.uipack.uipack");
    expect(css).toContain(":is(.dark) .uipack-canvas-dialog.uipack-canvas-dialog.uipack-canvas-dialog");
    expect(css).toMatch(/color-scheme: dark; --uipack-chip-tint: 0.28/);
    expect(css).toContain(":is(.light) .uipack-span.uipack-span.uipack-span");
  });
  it("names only carriers the canvas dialog copies", () => {
    for (const name of Object.keys(diagramThemeVars(paper))) expect(DIAGRAM_CARRIERS).toContain(name);
  });
});

describe("theme.css reads a carrier before each role", () => {
  const css = readFileSync("src/theme.css", "utf8");
  it("falls back to the page's role, so a figure outside every scope is unchanged", () => {
    expect(css).toContain("--uipack-fg: var(--uipack-diagram-ink, var(--ui-ink));");
    expect(css).toContain("--uipack-accent: var(--uipack-diagram-accent, var(--ui-accent-stroke, var(--ui-accent)));");
    expect(css).toContain("--uipack-diagram-canvas,");
    expect(css).toContain("font-family: var(--uipack-diagram-font-heading, var(--ui-font-heading, inherit));");
  });
  it("lets a scope hold a mode below the figure's own theme prop", () => {
    expect(css).toContain('[data-diagram-mode="dark"] .uipack:not([data-theme])');
  });
});

describe("DiagramThemeScope", () => {
  it("renders the carriers inline on the server, laid out as its children", () => {
    const html = renderToStaticMarkup(
      <DiagramThemeScope theme={paper} mode="dark">
        <span>x</span>
      </DiagramThemeScope>,
    );
    expect(html).toContain('data-diagram-theme="paper"');
    expect(html).toContain('data-diagram-mode="dark"');
    expect(html).toContain("display:contents");
    expect(html).toContain("--uipack-diagram-ink:light-dark(#1d1b16, #f1ece2)");
  });
  it("nests: the inner scope's carriers sit closer to the figure", () => {
    const { container } = render(
      <DiagramThemeScope theme={blueprint}>
        <DiagramThemeScope theme={paper}>
          <Figure viewBox="0 0 100 50" alt="a">
            <Node x={0} y={0} w={80} h={40} label="A" />
          </Figure>
        </DiagramThemeScope>
      </DiagramThemeScope>,
    );
    const fig = container.querySelector(".uipack")!;
    const nearest = fig.closest("[data-diagram-theme]") as HTMLElement;
    expect(nearest.dataset.diagramTheme).toBe("paper");
    expect(nearest.style.getPropertyValue("--uipack-diagram-ink")).toBe("light-dark(#1d1b16, #f1ece2)");
  });
});

describe("static export with a diagram theme", () => {
  const fig = {
    children: <Node x={8} y={8} w={120} h={40} label="A" accent />,
    viewBox: "0 0 136 56",
    title: "T",
  };
  it("draws the theme's half for the mode", () => {
    const light = renderStatic(fig, { theme: paper });
    const dark = renderStatic(fig, { theme: paper, mode: "dark" });
    expect(light).toContain("#2346c8");
    expect(light).toContain('fill="#faf6ee"');
    expect(dark).toContain("#8ea8ff");
    expect(dark).toContain("#b3c4ff");
    expect(dark).not.toContain("var(--");
    expect(light).toContain("Georgia, serif");
  });
  it("draws the theme's canvas ground", () => {
    expect(renderStatic(fig, { theme: paper })).toContain('<circle cx="1" cy="1"');
    expect(renderStatic(fig, { theme: blueprint })).toContain('width="60" height="60"');
    const plain = renderStatic(fig, { theme: { ...paper, canvas: "plain" } });
    expect(plain).not.toContain("<pattern");
  });
  it("falls back to Technical's faces when a face is a CSS variable", () => {
    const p = themePalette({ ...paper, fonts: { text: "var(--font-sans)" } });
    expect(p.sans).toBe(LIGHT.sans);
  });
  it("keeps the older palette forms working", () => {
    expect(resolvePalette("dark")).toEqual(resolvePalette("dark", "light"));
    const legacy = resolvePalette({ base: "dark", accent: "#199e70", "token-request": "#3987e5" });
    expect(legacy.bg).toBe(DARK.bg);
    expect(legacy.accent).toBe("#199e70");
    expect(legacy["accent-ink"]).toBe("#199e70");
    expect(legacy["token-request"]).toBe("#3987e5");
    expect(LIGHT["token-error"]).toBe(technicalValues.light["flow-error"]);
  });
  it("renders the default exactly as before: dots, Technical's values", () => {
    const svg = renderStatic(fig);
    expect(svg).toContain('<circle cx="1" cy="1" r="1"');
    expect(svg).toContain(LIGHT.accent);
  });
});

describe("user-flow and sequence parts", () => {
  const drawing = (
    <>
      <Actor cx={40} cy={40} role="Admin" sub="per team" />
      <Screen x={80} y={0} w={120} title="Library" lines={["a", "b"]} accent />
      <Action x={220} y={10} w={100} label="Ask" sub="sso" />
      <Decision cx={360} cy={40} label="Ok?" />
      <Outcome x={400} y={12} w={120} label="Done" sub="logged" />
      <LaneRule x1={0} x2={520} y={100} />
      <Lifeline x={40} y1={120} y2={300} />
      <Activation x={200} y1={140} y2={200} accent />
      <Message id="m" from={40} to={200} y={160} n={1} label="submit" kind="request" packet />
      <Lost id="m" from={200} to={40} y={220} n={2} label="lost" />
      <SelfLoop id="m" x={200} y={240} n={3} kind="change" packet />
      <Note x={260} y={140} w={160} h={60} title="Budget" lines={["30 s"]} />
    </>
  );
  it("render to a static file with every variable resolved", () => {
    const svg = renderStatic({ children: drawing, viewBox: "0 0 520 320" }, { theme: paper, motion: false });
    expect(svg).not.toContain("var(--");
    for (const part of [
      "actor",
      "screen",
      "action",
      "decision",
      "outcome",
      "lane-rule",
      "lifeline",
      "activation",
      "message",
      "lost",
      "self-loop",
      "note",
      "cross",
    ])
      expect(svg).toContain(`data-uipack="${part}"`);
    expect(svg).toContain("ADMIN");
    expect(svg).toContain("BUDGET");
  });
  it("draw the actor with the shared person glyph and accent words in the accent ink", () => {
    const svg = renderStatic({ children: drawing, viewBox: "0 0 520 320" }, { theme: paper, mode: "dark", motion: false });
    expect(svg).toContain("M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5");
    expect(svg).toContain('fill="#b3c4ff"');
  });
  it("trace a flow on hover", () => {
    const html = renderToStaticMarkup(<Screen x={0} y={0} w={100} title="S" flow="ask" />);
    expect(html).toContain('data-flow="ask"');
  });
});

describe("Node strip", () => {
  it("is off by default", () => {
    expect(renderToStaticMarkup(<Node x={0} y={0} w={120} h={48} label="A" />)).not.toContain("node-strip");
  });
  it("draws a hairline and a mark, and centres the words in the body below", () => {
    const plain = renderToStaticMarkup(<Node x={0} y={0} w={120} h={48} label="A" size={14} />);
    const html = renderToStaticMarkup(<Node x={0} y={0} w={120} h={48} label="A" size={14} strip="window" />);
    expect(html).toContain('data-strip="window"');
    expect(html).toContain('y1="16"');
    expect(plain).toContain('y="28.9"');
    expect(html).toContain('y="36.9"');
  });
  it("draws a store as a bowed lip, with no mark", () => {
    const html = renderToStaticMarkup(<Node x={0} y={0} w={120} h={48} label="DB" strip="store" />);
    expect(html).toContain("Q 60 20 120 12");
    expect(html).not.toContain("<circle");
  });
});
