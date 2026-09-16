// Renders every asset to a standalone SVG under docs/assets/ and writes
// assets/manifest.json. Run: npm run manifest. Previews use the light palette
// with variables inlined, so they render the same inside <img> anywhere.
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Badge, Bus, Chip, Connector, Defs, Group, Label, Lane, Legend, Node, Packet, Token, icons, marks, route, type IconName, type TokenKind } from "../src";
import { PRESETS, agentLoopParts, beforeAfterParts, pipelineParts, ragPipelineParts, serviceMapParts, skillLifecycleParts, syncLoopParts, type PresetName } from "../src/presets";

const presetParts: Record<PresetName, () => { wide: ReactNode; viewBox: string }> = {
  serviceMap: () => serviceMapParts(),
  agentLoop: () => agentLoopParts(),
  ragPipeline: () => ragPipelineParts(),
  skillLifecycle: () => skillLifecycleParts(),
  syncLoop: () => syncLoopParts(),
  beforeAfter: () => beforeAfterParts(),
  pipeline: () => pipelineParts(),
};
import type { Asset } from "../src/browser";

const OUT = "docs/assets";
const LIGHT: Record<string, string> = {
  fg: "#1a1c1a",
  muted: "#5c625e",
  bg: "#f6f5f1",
  surface: "#ffffff",
  "surface-raised": "#f4f6f4",
  grid: "rgba(26, 28, 26, 0.16)",
  border: "rgba(26, 28, 26, 0.22)",
  accent: "#205f49",
  "token-request": "#4f6fe6",
  "token-response": "#3fb27f",
  "token-change": "#9a63e0",
  mono: "ui-monospace, Menlo, Consolas, monospace",
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

function inline(markup: string): string {
  return markup.replace(/var\(--uipack-([a-z-]+)(?:,\s*[^)]*)?\)/g, (_, k: string) => LIGHT[k] ?? "currentColor");
}

function svgFile(viewBox: string, body: ReactNode, opts: { grid?: boolean; w?: number; h?: number } = {}): string {
  const [, , w, h] = viewBox.split(" ").map(Number);
  const inner = inline(renderToStaticMarkup(<>{body}</>));
  const grid = opts.grid
    ? `<defs><pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${LIGHT.grid}"/></pattern></defs><rect width="${w}" height="${h}" fill="${LIGHT.bg}"/><rect width="${w}" height="${h}" fill="url(#dots)"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${opts.w ?? w}" height="${opts.h ?? h}" color="${LIGHT.fg}" font-family="${LIGHT.sans}"><style>text{user-select:none}</style>${grid}${inner}</svg>\n`;
}

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith(".svg")) unlinkSync(join(OUT, f));

const assets: Asset[] = [];
const add = (a: Omit<Asset, "preview"> & { svg: string }) => {
  const file = `${a.id}.svg`;
  writeFileSync(join(OUT, file), a.svg);
  const { svg, ...rest } = a;
  assets.push({ ...rest, preview: `${OUT}/${file}` });
};

// Figures: every preset's wide drawing with its default spec.
for (const name of Object.keys(PRESETS) as PresetName[]) {
  const preset = PRESETS[name];
  const p = presetParts[name]();
  add({
    id: `figure-${name.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}`,
    name: preset.name,
    category: "Figures",
    kind: "figure",
    source: `import { ${name}, default${name[0].toUpperCase()}${name.slice(1)} } from "uipack";\n\n${name}({ ...default${name[0].toUpperCase()}${name.slice(1)}, figure: { ...default${name[0].toUpperCase()}${name.slice(1)}.figure, title: "…" } })`,
    tags: ["preset", "figure", name.toLowerCase()],
    svg: svgFile(p.viewBox, p.wide, { grid: true }),
  });
}

// Parts: one scene each.
const partScenes: { id: string; name: string; body: ReactNode; viewBox: string; source: string; tags: string[] }[] = [
  { id: "part-node", name: "Node", viewBox: "0 0 320 120", source: '<Node x={16} y={16} w={200} h={48} label="Service" sub="mono line" icon="service" />', tags: ["box", "label", "icon"], body: (<><Node x={40} y={16} w={240} h={48} label="Service" sub="mono second line" icon="service" /><Node x={40} y={72} w={240} h={32} label="Accent" accent size={12} /></>) },
  { id: "part-group", name: "Group", viewBox: "0 0 320 140", source: '<Group x={16} y={16} w={288} h={104} title="Platform">…</Group>', tags: ["box", "region", "boundary"], body: (<><Group x={16} y={8} w={288} h={64} title="Solid"><Node x={32} y={36} w={120} h={24} label="cell" size={11} /></Group><Group x={16} y={84} w={288} h={48} title="dashed boundary" variant="dashed" accent /></>) },
  { id: "part-lane", name: "Lane", viewBox: "0 0 320 80", source: '<Lane x={0} w={320} y={24} title="Clients" />', tags: ["header", "column"], body: (<><Lane x={0} w={160} y={24} title="Clients" /><Lane x={160} w={160} y={24} title="Platform" /><Node x={24} y={40} w={112} h={28} label="a" size={11} /><Node x={184} y={40} w={112} h={28} label="b" size={11} /></>) },
  { id: "part-chip", name: "Chip", viewBox: "0 0 320 60", source: '<Chip x={16} y={16} w={72} label="A1" kind="request" />', tags: ["pill", "slot", "status"], body: (<><Chip x={16} y={18} w={64} label="A1" /><Chip x={88} y={18} w={64} label="B2" kind="request" /><Chip x={160} y={18} w={64} label="busy" kind="accent" /><Chip x={232} y={18} w={64} dashed /></>) },
  { id: "part-connector", name: "Connector", viewBox: "0 0 320 120", source: '<Connector points={route(a, b, "h")} defs="id" kind="request" />', tags: ["arrow", "line", "orthogonal"], body: (<><Defs id="c" /><Connector points={route([16, 24], [304, 96], "h")} defs="c" kind="request" /><Connector points={[[16, 96], [140, 96]]} defs="c" dashed /><Connector points={[[16, 60], [140, 60]]} defs="c" kind="change" /></>) },
  { id: "part-bus", name: "Bus", viewBox: "0 0 320 160", source: '<Bus axis="v" at={x} from={y1} to={y2} stubs={[{ at, to, arrow: true }]} defs="id" />', tags: ["trunk", "stubs", "junction"], body: (<><Defs id="b" /><Node x={16} y={16} w={104} h={32} label="a" size={11} /><Node x={16} y={64} w={104} h={32} label="b" size={11} /><Node x={16} y={112} w={104} h={32} label="c" size={11} /><Node x={200} y={64} w={104} h={32} label="svc" size={11} /><Bus axis="v" at={152} from={32} to={128} stubs={[{ at: 32, to: 120 }, { at: 80, to: 120 }, { at: 128, to: 120 }, { at: 80, to: 200, arrow: true }]} defs="b" /></>) },
  { id: "part-badge", name: "Badge", viewBox: "0 0 320 60", source: '<Badge cx={16} cy={16} text="1" />', tags: ["step", "number"], body: (<><Badge cx={40} cy={30} text="1" /><Badge cx={80} cy={30} text="2" /><Badge cx={120} cy={30} text="A" accent /></>) },
  { id: "part-label", name: "Label", viewBox: "0 0 320 60", source: '<Label x={16} y={28} text="async · queue" />', tags: ["text", "underlay"], body: (<><Defs id="l" /><Connector points={[[16, 30], [304, 30]]} defs="l" /><Label x={160} y={34} text="on the line" anchor="middle" /></>) },
  { id: "part-legend", name: "Legend", viewBox: "0 0 320 60", source: 'legend={[{ label: "Request", kind: "request" }, { label: "Response", kind: "response" }]}', tags: ["key", "tokens"], body: (<>{(["request", "response", "change"] as TokenKind[]).map((k, i) => (<g key={k}><Token kind={k} cx={40 + i * 96} cy={30} r={6} /><text x={52 + i * 96} y={34} fontSize={12} fill="currentColor">{k}</text></g>))}</>) },
];
for (const s of partScenes) add({ id: s.id, name: s.name, category: "Parts", kind: "part", source: s.source, tags: s.tags, svg: svgFile(s.viewBox, s.body) });

// Icons.
for (const name of Object.keys(icons) as IconName[]) {
  const body = (<g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">{icons[name]}</g>);
  add({ id: `icon-${name}`, name, category: "Icons", kind: "icon", source: `<Node … icon="${name}" />  // or: icons.${name}`, tags: ["icon", name], svg: svgFile("0 0 16 16", body, { w: 64, h: 64 }) });
}

// Motion: one token per kind and shape, one animated packet, the reduced-motion static token.
for (const kind of ["request", "response", "change", "accent", "neutral"] as TokenKind[]) {
  add({ id: `motion-token-${kind}`, name: `Token · ${kind}`, category: "Motion", kind: "motion", source: `<Packet points={path} kind="${kind}" dur={2} />`, tags: ["packet", "token", kind], svg: svgFile("-12 -12 24 24", <Token kind={kind} r={7} />, { w: 64, h: 64 }) });
}
add({ id: "motion-packet", name: "Packet in motion", category: "Motion", kind: "motion", source: '<Packet points={path} kind="request" dur={2} />\n<Packet points={path} kind="response" dur={2} delay={-1} reverse />', tags: ["packet", "animateMotion", "smil"], svg: svgFile("0 0 320 80", (<><Defs id="m" /><Connector points={route([16, 20], [304, 60], "h")} defs="m" kind="request" /><g><Token kind="request" /><animateMotion dur="2s" repeatCount="indefinite" path="M18,20 L154,20 Q160,20 160,26 L160,54 Q160,60 166,60 L290,60" /></g><g><Token kind="response" /><animateMotion dur="2s" begin="-1s" repeatCount="indefinite" path="M290,60 L166,60 Q160,60 160,54 L160,26 Q160,20 154,20 L18,20" /></g></>)) });
add({ id: "motion-reduced", name: "Reduced motion · static token", category: "Motion", kind: "motion", source: '// under prefers-reduced-motion a Packet renders once at `at` (default 0.5) and never moves', tags: ["reduced-motion", "static", "a11y"], svg: svgFile("0 0 320 80", (<><Defs id="r" /><Connector points={[[16, 40], [304, 40]]} defs="r" kind="request" /><Token kind="request" cx={160} cy={40} /></>)) });

// Backgrounds.
const bgTile = (kind: "dots" | "plain" | "ruled") => {
  const w = 320, h = 160;
  const body = kind === "dots" ? `<defs><pattern id="d" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${LIGHT.grid}"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#d)"/>` : kind === "ruled" ? `<defs><pattern id="r" width="${w}" height="24" patternUnits="userSpaceOnUse"><rect width="${w}" height="1" fill="${LIGHT.grid}"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#r)"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${LIGHT.bg}"/>${body}</svg>\n`;
};
for (const kind of ["dots", "plain", "ruled"] as const) add({ id: `background-${kind}`, name: `Canvas · ${kind}`, category: "Backgrounds", kind: "background", source: `<Figure background="${kind}" …>`, tags: ["canvas", kind], svg: bgTile(kind) });

// Marks: the owner's own only.
for (const name of Object.keys(marks) as (keyof typeof marks)[]) {
  const body = (<g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{marks[name]}</g>);
  add({ id: `mark-${name}`, name: `${name} mark`, category: "Marks", kind: "mark", source: `import { marks } from "uipack";\n<svg viewBox="0 0 32 32">{marks.${name}}</svg>`, tags: ["mark", "family", name], svg: svgFile("0 0 32 32", body, { w: 96, h: 96 }) });
}
add({ id: "mark-uipack-wordmark", name: "uipack wordmark", category: "Marks", kind: "mark", source: 'import { Wordmark } from "uipack";\n<Wordmark size={24} />', tags: ["wordmark", "uipack"], svg: svgFile("0 0 140 32", (<><g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{marks.uipack}</g><text x="40" y="22" fontSize="18" fontWeight={700} fontFamily={LIGHT.mono} fill="currentColor">uipack</text></>), { w: 280, h: 64 }) });

const manifest = { version: 1, generated: new Date().toISOString().slice(0, 10), base: "", assets };
mkdirSync("assets", { recursive: true });
writeFileSync("assets/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
const counts = assets.reduce<Record<string, number>>((m, a) => ((m[a.category] = (m[a.category] ?? 0) + 1), m), {});
console.log(`manifest: ${assets.length} assets`, counts);
