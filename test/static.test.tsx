import { Connector, Defs, Node, Packet } from "../src";
import { agentLoop } from "../src/presets";
import { DARK, LIGHT, inlineVars, renderStatic, resolvePalette, wrapText } from "../src/static";

const drawing = (
  <>
    <Defs id="s" />
    <Node x={16} y={16} w={120} h={40} label="A" sub="mono" icon="db" />
    <Node x={200} y={16} w={120} h={40} label="B" accent />
    <Connector points={[[136, 36], [200, 36]]} defs="s" kind="request" />
    <Packet points={[[136, 36], [200, 36]]} kind="request" dur={2} id="pk" />
  </>
);
const fig = { children: drawing, viewBox: "0 0 336 72", title: "T", caption: "A caption that is long enough to wrap when the column is narrow, which it is here.", legend: [{ label: "Request", kind: "request" as const }], alt: "alt" };

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
    expect(bare).not.toContain("<rect x=\"0.5\"");
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
