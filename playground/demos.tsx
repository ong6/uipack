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

/** A demo from a playground module's named export, loaded as its own chunk. */
function demo<M>(load: () => Promise<M>, name: keyof M, summary: string, wide = true): DemoDef {
  return { summary, wide, Component: lazy(() => load().then((m) => ({ default: m[name] as ComponentType }))) };
}

const rules = () => import("./rulesDemos");
const figures = () => import("./FiguresShowcase");
const catalog = () => import("./CatalogShowcase");
const web = () => import("./WebShowcase");

export const demos: Record<string, DemoDef> = {
  // Rules (docs/system/): playground/rulesDemos.tsx
  "layer-swap": demo(
    rules,
    "LayerToggle",
    "One unit drawn as a slide and as a web section: swap the writing or the layout, and the other layers hold still.",
  ),
  "role-swatches": demo(rules, "RoleSwatches", "The colour roles as swatches, light and dark, with the fonts the style loads."),
  "ornament-slots": demo(rules, "OrnamentSlots", "The same markup with its ornament slots painted by this site's style."),
  "budget-checker": demo(rules, "BudgetChecker", "Pick a slot and type: the live verdict from slotProblems.", false),
  "title-widths": demo(rules, "TitleWidths", "One title at a wide, a medium and a narrow column."),
  "narrow-form": demo(rules, "NarrowForm", "A pipeline preset that swaps to its authored narrow drawing."),
  "slide-archetypes": demo(rules, "SlideArchetypes", "The slide archetypes on one region map."),
  "pair-presented": demo(rules, "PairPresented", "A presented slide title, don't and do."),
  "pair-read-alone": demo(rules, "PairReadAlone", "A read-alone title, don't and do."),
  "pair-over-budget": demo(rules, "PairOverBudget", "A headline over budget, and the fix."),
  "pair-labels": demo(rules, "PairLabels", "A label that wraps, and a label with a sub-label."),
  "pair-accent": demo(rules, "PairAccent", "Two filled buttons, and one filled with one secondary."),
  "pair-glow": demo(rules, "PairGlow", "An ambient glow, and one selected card."),
  // Specs
  "style-catalog": demo(
    catalog,
    "StyleCatalog",
    "Technical's card, then the illustration looks drawn within it, each with a live preview and where it is used.",
  ),
  // Components
  "diagram-catalogue": demo(figures, "DiagramCatalogue", "Every diagram pattern as a live figure, one section each."),
  "diagram-themes": demo(
    () => import("./DiagramThemesDemo"),
    "DiagramThemes",
    "One figure in three diagram themes (blueprint, warm paper with cobalt, terracotta), light and dark.",
  ),
  "flow-parts": demo(
    () => import("./DiagramThemesDemo"),
    "FlowParts",
    "The user-flow parts and the sequence parts, once each, in the page's theme.",
  ),
  "span-chart": demo(figures, "SpanChartFramed", "The span chart at a host's figure width, with its filters."),
  "layer-stack-chart": demo(figures, "LayerStackFramed", "The layer stack at a host's figure width."),
  "asset-browser": demo(figures, "AssetsDemo", "Search, preview and copy every icon, mark, background and token."),
  "article-parts": demo(() => import("./ArticleShowcase"), "ArticleParts", "Every article part inside a host's prose column."),
  "deck-player": demo(() => import("./DeckShowcase"), "DeckDemo", "The example deck the address names, playable."),
  "slide-starters": demo(catalog, "SlideStarters", "The slide starters with their talk tracks, then a composed narrative."),
  "animation-library": demo(() => import("./SlideShowcase"), "AnimationLibrary", "The 3D scene library and its live preview."),
  "mechanism-gate": demo(
    () => import("./MechanismShowcase"),
    "MechanismDemo",
    "The verification gate, its poses and thumbnails.",
  ),
  "docs-layout": demo(() => import("./DocsShowcase"), "DocsLayoutDemo", "An example product's docs page in DocsLayout."),
  // Examples
  "web-sample": demo(web, "WebSample", "The Tidy sample landing page, with its generated head and crawl files."),
  "web-parts": demo(web, "WebParts", "Every part the sample is made of, plus motion and backgrounds."),
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
      {/* A demo shows the part as the package draws it: in Technical, not the docs site's own
          palette (site-palette.css stops at this box; docs/specs/docs-site.md). */}
      <div className="showcase-demo" data-ui-style="technical">
        <demo.Component />
      </div>
    </Suspense>
  );
}
