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
const page = (title: string, body: string, head = `<style>${css}</style>`) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>body{margin:0;padding:24px 16px;background:#f6f5f1;font-family:system-ui,sans-serif}main{max-width:896px;margin:0 auto;display:grid;gap:32px}</style>
${head}
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

// A host article: prose rules like a blog's, loaded AFTER charts.css, so they
// win every tie. The charts sit in a 56rem figure slot with no title or
// caption of their own (the host captions the figure) and no headings.
const hostCss = `
.prose{font-family:Georgia,serif;font-size:19px;line-height:1.7;overflow-wrap:anywhere;color:#14110d}
.prose h2{font-size:1.45rem;margin:2.4rem 0 .8rem}
.prose h3,.prose h4{font-size:1.15rem;margin:1.9rem 0 .6rem}
.prose p{margin:1.15rem 0}
.prose ul,.prose ol{padding-left:1.4rem}
.prose li{margin:.45rem 0}
.prose img{max-width:100%;height:auto}
.prose a{color:#9a3412}
.prose button{font:inherit;padding:.5rem 1rem}
.fig{margin:2rem 0}`;
writeFileSync(
  `${OUT}/host.html`,
  page(
    "Charts in a host article",
    `<article class="prose"><p>Prose before the figures.</p><figure class="fig">${renderToStaticMarkup(
      <LayerStack {...aiStackDiagram} title={undefined} caption={undefined} headingLevel="none" />,
    )}<figcaption>Ten layers.</figcaption></figure><figure class="fig">${renderToStaticMarkup(
      <SpanChart {...aiStack} title={undefined} caption={undefined} headingLevel="none" />,
    )}<figcaption>Companies by layer.</figcaption></figure><p>Prose after the figures.</p></article>`,
    `<style>${css}</style><style>${hostCss}</style>`,
  ),
);
console.log("static fixtures written to", OUT);
