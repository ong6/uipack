// Renders every asset to a standalone SVG under docs/assets/ (light palette)
// and docs/assets/dark/ (dark palette), and writes assets/manifest.json.
// Assets are icons, marks, backgrounds and motion tokens. Diagram presets and
// the part sampler are coded React/SVG figures; they live on the playground's
// Architecture diagrams page, not here.
// Run: npm run manifest. Variables are inlined, so each file renders the same
// inside <img> anywhere; the browser picks the file that matches its theme.
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { Connector, Defs, Token, icons, marks, route, type IconName, type TokenKind } from "../src";
import type { Asset } from "../src/browser";

const OUT = "docs/assets";
import { DARK, LIGHT, renderStatic, type Palette, type StaticTheme } from "../src/static";
const OUT_DARK = `${OUT}/dark`;

// Every preview goes through the same static renderer the `uipack/static`
// entry exports, so what the browser shows is what an <img> gets.
type Themed = (theme: StaticTheme) => string;
function svgFile(viewBox: string, body: ReactNode, opts: { grid?: boolean; w?: number; h?: number } = {}): Themed {
  const [, , w] = viewBox.split(" ").map(Number);
  return (theme) => {
    const svg = renderStatic({ children: body, viewBox }, { theme, frame: false, background: !!opts.grid, motion: true, width: opts.w ?? w });
    return opts.h ? svg.replace(/ height="\d+"/, ` height="${opts.h}"`) : svg;
  };
}

for (const dir of [OUT, OUT_DARK]) {
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (f.endsWith(".svg")) unlinkSync(join(dir, f));
}

const assets: Asset[] = [];
// Each file's width and height are the size the browser shows it at: icons and tokens at 48px,
// marks at 64px (drawn on a 32 grid, so 2x), wide strips at their own width, capped by the tile.
// An animated preview also gets a still (`still`), shown under prefers-reduced-motion.
const add = (a: Omit<Asset, "preview" | "previewDark" | "previewStatic" | "previewStaticDark"> & { svg: Themed; still?: Themed }) => {
  const file = `${a.id}.svg`;
  writeFileSync(join(OUT, file), a.svg("light"));
  writeFileSync(join(OUT_DARK, file), a.svg("dark"));
  const { svg: _svg, still, ...rest } = a;
  const entry: Asset = { ...rest, preview: `${OUT}/${file}`, previewDark: `${OUT_DARK}/${file}` };
  if (still) {
    const stillFile = `${a.id}-still.svg`;
    writeFileSync(join(OUT, stillFile), still("light"));
    writeFileSync(join(OUT_DARK, stillFile), still("dark"));
    Object.assign(entry, { previewStatic: `${OUT}/${stillFile}`, previewStaticDark: `${OUT_DARK}/${stillFile}` });
  }
  assets.push(entry);
};

// Icons.
for (const name of Object.keys(icons) as IconName[]) {
  const body = (<g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">{icons[name]}</g>);
  add({ id: `icon-${name}`, name, category: "Icons", kind: "icon", source: `<Node … icon="${name}" />  // or: icons.${name}`, tags: ["icon", name], svg: svgFile("0 0 16 16", body, { w: 48, h: 48 }) });
}

// Motion: one token per kind and shape, one animated packet, the reduced-motion static token.
for (const kind of ["request", "response", "change", "accent", "neutral"] as TokenKind[]) {
  add({ id: `motion-token-${kind}`, name: `Token · ${kind}`, category: "Motion", kind: "motion", source: `<Packet points={path} kind="${kind}" dur={2} />`, tags: ["packet", "token", kind], svg: svgFile("-12 -12 24 24", <Token kind={kind} r={7} />, { w: 48, h: 48 }) });
}
// The two strips share a 160 × 64 drawing shown at 1.5x (240 × 96, capped by the tile), so
// the tokens and arrowhead read at tile size rather than as a hairline.
const packetPath = route([12, 16], [148, 48], "h");
const OUT_LEG = "M14,16 L74,16 Q80,16 80,22 L80,42 Q80,48 86,48 L138,48";
const BACK_LEG = "M138,48 L86,48 Q80,48 80,42 L80,22 Q80,16 74,16 L14,16";
add({
  id: "motion-packet",
  name: "Packet in motion",
  category: "Motion",
  kind: "motion",
  source: '<Packet points={path} kind="request" dur={2} />\n<Packet points={path} kind="response" dur={2} delay={-1} reverse />',
  tags: ["packet", "animateMotion", "smil"],
  svg: svgFile("0 0 160 64", (<><Defs id="m" /><Connector points={packetPath} defs="m" kind="request" /><g><Token kind="request" /><animateMotion dur="2s" repeatCount="indefinite" path={OUT_LEG} /></g><g><Token kind="response" /><animateMotion dur="2s" begin="-1s" repeatCount="indefinite" path={BACK_LEG} /></g></>), { w: 240, h: 96 }),
  // Reduced motion: the same two packets held where a Packet rests (half way along each leg).
  still: svgFile("0 0 160 64", (<><Defs id="m" /><Connector points={packetPath} defs="m" kind="request" /><Token kind="request" cx={44} cy={16} /><Token kind="response" cx={112} cy={48} /></>), { w: 240, h: 96 }),
});
add({ id: "motion-reduced", name: "Reduced motion · static token", category: "Motion", kind: "motion", source: '// under prefers-reduced-motion a Packet renders once at `at` (default 0.5) and never moves', tags: ["reduced-motion", "static", "a11y"], svg: svgFile("0 0 160 64", (<><Defs id="r" /><Connector points={[[12, 32], [148, 32]]} defs="r" kind="request" /><Token kind="request" cx={80} cy={32} /></>), { w: 240, h: 96 }) });

// Backgrounds.
const bgTile = (kind: "dots" | "plain" | "ruled"): Themed => (theme) => {
  const p: Palette = theme === "dark" ? DARK : LIGHT;
  const w = 320, h = 160;
  const body = kind === "dots" ? `<defs><pattern id="d" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${p.grid}"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#d)"/>` : kind === "ruled" ? `<defs><pattern id="r" width="${w}" height="24" patternUnits="userSpaceOnUse"><rect width="${w}" height="1" fill="${p.grid}"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#r)"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${p.bg}"/>${body}</svg>\n`;
};
for (const kind of ["dots", "plain", "ruled"] as const) add({ id: `background-${kind}`, name: `Canvas · ${kind}`, category: "Backgrounds", kind: "background", source: `<Figure background="${kind}" …>`, tags: ["canvas", kind], svg: bgTile(kind) });

// Marks: the owner's own only.
for (const name of Object.keys(marks) as (keyof typeof marks)[]) {
  const body = (<g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{marks[name]}</g>);
  add({ id: `mark-${name}`, name: `${name} mark`, category: "Marks", kind: "mark", source: `import { marks } from "uipack";\n<svg viewBox="0 0 32 32">{marks.${name}}</svg>`, tags: ["mark", "family", name], svg: svgFile("0 0 32 32", body, { w: 64, h: 64 }) });
}
add({ id: "mark-uipack-wordmark", name: "uipack wordmark", category: "Marks", kind: "mark", source: 'import { Wordmark } from "uipack";\n<Wordmark size={24} />', tags: ["wordmark", "uipack"], svg: svgFile("0 0 140 32", (<><g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{marks.uipack}</g><text x="40" y="22" fontSize="18" fontWeight={700} fontFamily={LIGHT.mono} fill="currentColor">uipack</text></>), { w: 210, h: 48 }) });

const manifest = { version: 1, generated: new Date().toISOString().slice(0, 10), base: "", assets };
mkdirSync("assets", { recursive: true });
writeFileSync("assets/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
const counts = assets.reduce<Record<string, number>>((m, a) => ((m[a.category] = (m[a.category] ?? 0) + 1), m), {});
console.log(`manifest: ${assets.length} assets`, counts);
