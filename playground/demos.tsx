import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { extractDocsHeadings } from "../src/docs";

/**
 * The live demos a docs page can embed. A Markdown file names one in a fenced block whose body
 * says what it shows, so an agent reading the raw file knows what is there:
 *
 *     ```uipack-demo layer-swap wide
 *     One unit as a slide and a web section; swap the writing or the layout and the rest holds still.
 *     ```
 *
 * MarkdownShowcase renders the block as the demo (DocsMarkdown `blocks`); `wide` lets it span the
 * full content width. Each demo is a lazy chunk, loaded when a page shows it.
 */
export interface DemoDef {
  /** What the demo shows, one sentence: the fence's body when the page inserts it. */
  summary: string;
  /** Spans the full content width (a deck, a web page, a grid of cards, a 3D scene). */
  wide?: boolean;
  Component: LazyExoticComponent<ComponentType>;
}

export const demos: Record<string, DemoDef> = {
  "layer-swap": {
    summary: "One unit drawn as a slide and as a web section: swap the writing or the layout, and the other layers hold still.",
    wide: true,
    Component: lazy(() => import("./FoundationsShowcase").then((m) => ({ default: m.LayerToggle }))),
  },
  "style-catalog": {
    summary: "Technical's card, then the illustration looks drawn within it, each with a live preview and where it is used.",
    wide: true,
    Component: lazy(() => import("./CatalogShowcase").then((m) => ({ default: m.StyleCatalog }))),
  },
};

/** The demo ids a Markdown source names in `uipack-demo` fences. */
export function demoIdsIn(source: string) {
  return [...source.matchAll(/^(?:`{3,}|~{3,})uipack-demo[ \t]+([\w-]+)/gm)].map((m) => m[1]);
}

/**
 * The source with each of the page's demos (docs-manifest `demos`) that it does not name yet
 * inserted as a `uipack-demo` block before the heading `at` (or after the lead, before the first
 * h2). Once the file names the demo itself, the insertion stops and the file decides where it sits.
 */
export function withDemos(source: string, pageDemos: readonly { id: string; at?: string }[] = []) {
  const named = new Set(demoIdsIn(source));
  const lines = source.split("\n");
  const headings = extractDocsHeadings(source);
  const inserts = pageDemos
    .filter((d) => !named.has(d.id) && demos[d.id])
    .map((d) => {
      const heading = d.at ? headings.find((h) => h.id === d.at) : headings.find((h) => h.level === 2);
      const fence = ["```uipack-demo " + d.id + (demos[d.id].wide ? " wide" : ""), demos[d.id].summary, "```", ""];
      return { line: heading ? heading.line - 1 : lines.length, fence };
    })
    .sort((a, b) => b.line - a.line);
  for (const { line, fence } of inserts) lines.splice(line, 0, ...fence);
  return lines.join("\n");
}

/** A demo by id, for the `uipack-demo` block; an unknown id keeps the code block, so the raw text still shows. */
export function DemoBlock({ id }: { id: string }) {
  const demo = demos[id];
  if (!demo) return null;
  return (
    <Suspense
      fallback={
        <p className="showcase-loading" role="status">
          Loading the demo…
        </p>
      }
    >
      <demo.Component />
    </Suspense>
  );
}
