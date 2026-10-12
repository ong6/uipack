// Writes the static pages e2e/article.spec.ts loads: uipack/article rendered
// with renderToStaticMarkup into plain HTML, the way a static site ships it
// (no hydration; the tests also run with JavaScript off). Run by Playwright's
// globalSetup; output is gitignored.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Callout, LinkList, NoteCard, NoteCluster } from "../src/article";
import { LayerSection, harness, inference, notes, plannedNote } from "../examples/articleParts";

const OUT = "playground/e2e-static";
mkdirSync(OUT, { recursive: true });
const css = readFileSync("src/article/article.css", "utf8");

// A copy of the notes site's article page (junxiong-notes app/globals.css):
// palette in both themes, a 44rem .wrap, serif .prose with overflow-wrap:
// anywhere, and its link, list and focus rules. It loads AFTER article.css,
// so it wins every tie. The --uipack-* map is the site's .fig-html block,
// applied to .prose.
const notesSite = `
:root{color-scheme:light;--bg:#fffdf9;--surface:#f6f2ea;--text:#14110d;--muted:#6b6459;--faint:#d9d2c5;--accent:#9a3412;--fig-accent:#0f7a55;--max:44rem;
--serif:"Iowan Old Style","Palatino Linotype",Palatino,Charter,Georgia,serif;--sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Inter,Helvetica,Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#12110f;--surface:#1b1917;--text:#ece7de;--muted:#aaa195;--faint:#423d35;--accent:#f0854f;--fig-accent:#199e70}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#12110f;--surface:#1b1917;--text:#ece7de;--muted:#aaa195;--faint:#423d35;--accent:#f0854f;--fig-accent:#199e70}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--serif);font-size:19px;line-height:1.7}
.wrap{max-width:var(--max);margin:0 auto;padding:0 1.25rem}
a{color:var(--accent);text-decoration-thickness:1px;text-underline-offset:2px}
a:hover{text-decoration-thickness:2px}
.prose h2{font-size:1.45rem;margin:2.4rem 0 .8rem}
.prose h3{font-size:1.15rem;margin:1.9rem 0 .6rem;line-height:1.4}
.prose p{margin:1.15rem 0}
.prose ul,.prose ol{padding-left:1.4rem}
.prose li{margin:.45rem 0}
.prose,.dek{overflow-wrap:anywhere}
:where(a,button,summary,select,pre,[tabindex]):focus-visible{outline:2px solid var(--accent);outline-offset:4px}
@media (max-width:600px){body{font-size:18px}}
.prose{--uipack-fg:var(--text);--uipack-muted:var(--muted);--uipack-bg:var(--bg);--uipack-surface:var(--bg);--uipack-surface-raised:var(--surface);
--uipack-border:var(--faint);--uipack-accent:var(--fig-accent);--uipack-sans:var(--sans);--uipack-mono:var(--mono);--uipack-label-font:var(--sans)}`;

const body = renderToStaticMarkup(
  <main className="wrap">
    <article className="prose">
      <h1>The AI stack, one constraint per layer</h1>
      <p id="ai-stack-layers">Prose before the sections. The map would sit here.</p>
      <h2>Serving</h2>
      <LayerSection section={inference} id="inference" mapHref="#ai-stack-layers" />
      <LayerSection section={harness} id="harness" mapHref="#ai-stack-layers" wide />
      <h2>Parts</h2>
      <NoteCluster
        id="mixed"
        label="My notes on agents and harnesses"
        note="Each one works through a number from the harness section."
        notes={[notes.contextEngineering, notes.agentIntegrations, notes.opusOrchestrating, plannedNote]}
      />
      <NoteCard {...notes.prefillVsDecode} id="single" />
      <Callout kind="note">A generic aside.</Callout>
      <LinkList label="Go deeper (inline fallback)">
        METR's <a href="https://arxiv.org/abs/2503.14499">long-tasks paper</a>.
      </LinkList>
      <p>Prose after the parts.</p>
    </article>
  </main>,
);

const page = (title: string, head: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${head}
</head>
<body>${body}</body>
</html>
`;

// The notes site: theme follows the OS, as on the site with no saved choice.
writeFileSync(`${OUT}/article-notes.html`, page("Article parts in the notes site", `<style>${css}</style><style>${notesSite}</style>`));
// No host tokens at all: the parts' own Technical fallbacks, light and dark.
writeFileSync(
  `${OUT}/article-defaults.html`,
  page("Article parts, Technical defaults", `<style>${css}</style><style>body{margin:0;font:19px/1.7 Georgia,serif;background:#f6f5f1;color:#1a1c1a}@media (prefers-color-scheme:dark){body{background:#0a100d;color:#e8ece9}}.wrap{max-width:44rem;margin:0 auto;padding:0 1.25rem}</style>`),
);
console.log("article fixtures written to", OUT);
