import { technicalValues } from './chunk-UNBHBOF5.js';
import { jsx } from 'react/jsx-runtime';

var NAME = /^[a-z][a-z0-9-]*$/;
var REQUIRED = [
  "ink",
  "ink-2",
  "surface",
  "surface-raised",
  "surface-2",
  "accent",
  "flow-request",
  "flow-response",
  "flow-change",
  "flow-error"
];
var DIAGRAM_COLOR_ROLES = [
  "ink",
  "ink-2",
  "surface",
  "surface-raised",
  "surface-2",
  "line",
  "line-soft",
  "accent",
  "accent-ink",
  "flow-request",
  "flow-response",
  "flow-change",
  "flow-error"
];
var diagramCarrier = (role) => `--uipack-diagram-${role}`;
var DIAGRAM_CARRIERS = [
  ...DIAGRAM_COLOR_ROLES.map((r) => diagramCarrier(r)),
  diagramCarrier("font-text"),
  diagramCarrier("font-label"),
  diagramCarrier("font-heading"),
  diagramCarrier("canvas")
];
function defineDiagramTheme(input) {
  if (!NAME.test(input.name)) throw new Error(`diagram theme "${input.name}": the name must be kebab-case`);
  for (const mode of ["light", "dark"]) {
    const colors = input[mode];
    if (!colors) throw new Error(`diagram theme "${input.name}": no ${mode} colours`);
    for (const role of REQUIRED)
      if (typeof colors[role] !== "string" || !colors[role].trim())
        throw new Error(`diagram theme "${input.name}": ${mode} has no "${role}"`);
  }
  return Object.freeze({ ...input, canvas: input.canvas ?? "grid", __diagramTheme: true });
}
function isDiagramTheme(value) {
  return !!value && typeof value === "object" && typeof value.name === "string" && typeof value.light === "object" && typeof value.dark === "object";
}
var technical = (m) => {
  const v = technicalValues[m];
  return {
    ink: v.ink,
    "ink-2": v["ink-2"],
    surface: v.surface,
    "surface-raised": v["surface-raised"],
    "surface-2": v["surface-2"],
    accent: v.accent,
    "flow-request": v["flow-request"],
    "flow-response": v["flow-response"],
    "flow-change": v["flow-change"],
    "flow-error": v["flow-error"]
  };
};
var blueprint = defineDiagramTheme({
  name: "blueprint",
  light: technical("light"),
  dark: technical("dark"),
  canvas: "grid"
});
var HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
function hexAt(color, alpha) {
  const m = HEX.exec(color.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  const n = parseInt(h, 16);
  return `rgba(${n >> 16}, ${n >> 8 & 255}, ${n & 255}, ${alpha})`;
}
var mix = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
function diagramColors(theme, mode) {
  const c = theme[mode];
  return {
    ...c,
    line: c.line ?? hexAt(c.ink, 0.26) ?? mix(c.ink, 26),
    "line-soft": c["line-soft"] ?? hexAt(c.ink, 0.13) ?? mix(c.ink, 13),
    "accent-ink": c["accent-ink"] ?? c.accent
  };
}
var pair = (light, dark) => light === dark ? light : `light-dark(${light}, ${dark})`;
function canvasPattern(canvas, ink, lineSoft) {
  if (canvas === "plain") return "none";
  if (canvas === "dots") return `radial-gradient(${lineSoft} 1px, transparent 1.2px) 0 0 / 12px 12px`;
  const major = mix(ink, 12);
  const minor = mix(ink, 5);
  return [
    `linear-gradient(90deg, ${major} 1px, transparent 1px) -1px -1px / 60px 60px`,
    `linear-gradient(${major} 1px, transparent 1px) -1px -1px / 60px 60px`,
    `linear-gradient(90deg, ${minor} 1px, transparent 1px) -1px -1px / 12px 12px`,
    `linear-gradient(${minor} 1px, transparent 1px) -1px -1px / 12px 12px`
  ].join(", ");
}
function diagramThemeVars(theme) {
  const vars = {};
  const light = theme.light;
  const dark = theme.dark;
  const ink = pair(light.ink, dark.ink);
  for (const role of DIAGRAM_COLOR_ROLES) {
    const l = light[role];
    const d = dark[role];
    if (role === "line" || role === "line-soft") {
      const pct = role === "line" ? 26 : 13;
      vars[diagramCarrier(role)] = pair(l ?? mix(light.ink, pct), d ?? mix(dark.ink, pct));
    } else if (role === "accent-ink") {
      vars[diagramCarrier(role)] = pair(l ?? light.accent, d ?? dark.accent);
    } else vars[diagramCarrier(role)] = pair(l, d);
  }
  for (const face of ["text", "label", "heading"]) {
    const value = theme.fonts?.[face];
    if (value) vars[diagramCarrier(`font-${face}`)] = value;
  }
  vars[diagramCarrier("canvas")] = canvasPattern(theme.canvas ?? "grid", ink, vars[diagramCarrier("line-soft")]);
  return vars;
}
var ROOTS = [".uipack", ".uipack-span", ".uipack-stack", ".uipack-canvas-dialog"];
function modeRule(selector, mode) {
  const sel = ROOTS.map((r) => `:is(${selector}) ${r}${r}${r}`).join(",\n");
  const chips = mode === "dark" ? " --uipack-chip-tint: 0.28; --uipack-chip-soft: 0.12;" : " --uipack-chip-tint: initial; --uipack-chip-soft: initial;";
  return `${sel} {
  color-scheme: ${mode};${chips}
}`;
}
function diagramThemeCss(theme, opts = {}) {
  const scope = opts.scope ?? `[data-diagram-theme="${theme.name}"]`;
  const vars = Object.entries(diagramThemeVars(theme)).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  const out = [`/* uipack diagram theme: ${theme.name} */
${scope} {
${vars}
}`];
  if (opts.darkSelector) out.push(modeRule(opts.darkSelector, "dark"));
  if (opts.lightSelector) out.push(modeRule(opts.lightSelector, "light"));
  return out.join("\n") + "\n";
}
function DiagramThemeScope({ theme, mode, children, className, style }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className,
      "data-diagram-theme": theme.name,
      "data-diagram-mode": mode,
      style: { display: "contents", ...diagramThemeVars(theme), ...style },
      children
    }
  );
}

export { DIAGRAM_CARRIERS, DIAGRAM_COLOR_ROLES, DiagramThemeScope, blueprint, defineDiagramTheme, diagramColors, diagramThemeCss, diagramThemeVars, isDiagramTheme };
