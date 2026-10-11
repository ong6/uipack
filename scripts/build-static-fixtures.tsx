// Writes the files the static e2e specs load: SVG exports through <img>, and
// charts rendered with renderToStaticMarkup into plain HTML pages, the way a
// static site ships them (no hydration; tests also run with JavaScript off).
// Run by Playwright's globalSetup; output is gitignored.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { agentLoop } from "../src/presets";
import { renderStatic } from "../src/static";
import { LayerStack, SpanChart } from "../src/charts";
import { aiStack, aiStackDiagram, aiStackLayers, aiStackTiers, aiStackZones, syntheticStack } from "../examples/aiStack";

const OUT = "playground/e2e-static";
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/motion.svg`, renderStatic(agentLoop(), { theme: "light", motion: true }));
writeFileSync(`${OUT}/still.svg`, renderStatic(agentLoop(), { theme: "dark", motion: false }));
writeFileSync(`${OUT}/bare.svg`, renderStatic(agentLoop(), { frame: false, background: false, motion: true }));

const css = readFileSync("src/charts/charts.css", "utf8");
const page = (title: string, body: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>body{margin:0;padding:24px 16px;background:#f6f5f1;font-family:system-ui,sans-serif}main{max-width:1248px;margin:0 auto;display:grid;gap:32px}</style>
<style>${css}</style>
</head>
<body><main>${body}</main></body>
</html>
`;
writeFileSync(`${OUT}/span-chart.html`, page("SpanChart static", renderToStaticMarkup(<SpanChart {...aiStack} />)));
writeFileSync(
  `${OUT}/span-chart-160.html`,
  page(
    "SpanChart, 160 rows",
    renderToStaticMarkup(
      <SpanChart id="stress" title="160 synthetic rows" layers={aiStackLayers} zones={aiStackZones} tiers={aiStackTiers} items={syntheticStack(160)} />,
    ),
  ),
);
writeFileSync(`${OUT}/layer-stack.html`, page("LayerStack static", renderToStaticMarkup(<LayerStack {...aiStackDiagram} />)));
console.log("static fixtures written to", OUT);
