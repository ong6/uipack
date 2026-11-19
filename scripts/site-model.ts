// The site model as data: the page types a site can use, the layout archetypes a spec can pick for
// each, the rows a spec's Writing style must set, and every component's named looks with their
// mode. scripts/check-spec.ts validates a spec against it; scripts/docs-sync.ts writes the tables
// in docs/system/layout/README.md and docs/components/README.md from it. Plain data, no imports, so
// it ships beside check-spec.ts and runs from node_modules/uipack in a site.
//
// test/specs.test.tsx keeps it true to the code: the one 3D look is the ink line art every object
// scene draws (src/objects/ink.ts), and every archetype's file exists.

/** A kind of page a site can have; a spec lists the ones it uses (`pages:`). */
export interface PageType {
  readonly id: string;
  /** The `### <name>` heading under a spec's `## Layout`. */
  readonly name: string;
  readonly use: string;
}

export const PAGE_TYPES = [
  { id: "landing", name: "Landing", use: "A product, launch or announcement page with one goal" },
  { id: "documentation", name: "Documentation", use: "Product docs or a reference page in a navigable shell" },
  { id: "article", name: "Article", use: "A long read or a blog post" },
  { id: "deck", name: "Deck", use: "Slides, presented or read alone: an HTML deck is a page of the site" },
  { id: "dashboard", name: "Dashboard", use: "A screen of live numbers, tables and status someone checks" },
] as const satisfies readonly PageType[];

export type PageTypeId = (typeof PAGE_TYPES)[number]["id"];

/** A named layout a spec can pick for one page type, or extend. */
export interface LayoutArchetype {
  readonly id: string;
  readonly pageType: PageTypeId;
  readonly name: string;
  /** The doc that describes it in full. */
  readonly file: string;
  readonly grid: string;
  readonly regions: string;
  readonly order: string;
  readonly hero: string;
  /** What renders it today. */
  readonly code: string;
}

export const LAYOUT_ARCHETYPES = [
  {
    id: "product-landing",
    pageType: "landing",
    name: "Product landing",
    file: "docs/system/layout/landing.md",
    grid: "12 / 8 / 4 columns (container 1024px and up, 640px, below); gutters 32px wide, 24px below 1024px; one 1120px max width for every section",
    regions: "Nav, hero, sections, closing band, footer",
    order: "The author's; a style's `prefers` order only on opt-in",
    hero: "Split: copy on 5 columns, the product's real output on 7, stacked below 1024px",
    code: "`WebPage`, `StarHero`, `Section` (`uipack/web`)",
  },
  {
    id: "docs-shell",
    pageType: "documentation",
    name: "Docs shell",
    file: "docs/system/layout/documentation.md",
    grid: "Sidebar, article column at the reading measure, On this page; one column below 900px",
    regions: "Header, sidebar, context row, article, On this page, pager",
    order: "h1, what the page is for, the values table, the detail, related pages",
    hero: "None: the page's h1 and its first line",
    code: "`DocsLayout`, `DocsMarkdown` (`uipack/docs`)",
  },
  {
    id: "layer-article",
    pageType: "article",
    name: "Layered long read",
    file: "docs/system/layout/article.md",
    grid: "One text column at the reading measure; figures and `wide` clusters break out to the figure slot",
    regions: "Title, lede, a run of sections, each from the article parts",
    order: "Each section: head strip, heading, prose, terms, change note, callout, links, notes",
    hero: "The title and a one-sentence lede; a figure only when it carries the claim",
    code: "`LayerSection` parts (`uipack/article`)",
  },
  {
    id: "slide-canvas",
    pageType: "deck",
    name: "Slide canvas",
    file: "docs/system/layout/deck-slide.md",
    grid: "A 1920×1080 canvas scaled to its frame, inside a fixed safe area",
    regions: "Eyebrow (optional), headline, lede (optional), body, footer",
    order: "The storyline's roles, one archetype per slide",
    hero: "A cover slide: the outcome as the title",
    code: "`DeckPlayer`, `Slide` and the archetype factories (`uipack/deck`)",
  },
  {
    id: "one-question-dashboard",
    pageType: "dashboard",
    name: "One-question dashboard",
    file: "docs/system/layout/dashboard.md",
    grid: "The landing grid: 12 / 8 / 4 columns, 32 / 24px gutters",
    regions: "Title row, headline numbers, the chart, records, time, source",
    order: "Top to bottom in the order of the regions",
    hero: "Three or four headline numbers of equal weight",
    code: "`Proof`, `ProductWindow`, `DataTable`, the charts (`uipack/web`, `uipack/charts`)",
  },
] as const satisfies readonly LayoutArchetype[];

/** What a spec writes for a page type it lays out itself (`layouts: { <page type>: custom }`). */
export const CUSTOM_LAYOUT_ROWS = ["Grid", "Regions", "Section order", "Hero"] as const;

/** The rows every spec's `## Writing style` table sets. */
export const WRITING_STYLE_ROWS = ["Tone and register", "Title form", "Copy density", "House words", "Budgets"] as const;

/**
 * How a component look relates to the site it is on:
 * - `fixed`: identical on every site (only light and dark follow the host), so a reader who met it
 *   on one site reads it on another; a spec that picks it may not set the values it fixes.
 * - `flex`: keeps its character but takes the site's roles (palette, faces) as listed.
 */
export type LookMode = "fixed" | "flex";

export interface ComponentLook {
  readonly id: string;
  readonly name: string;
  readonly mode: LookMode;
  /** What stays the same on every site. */
  readonly fixed: string;
  /** What it takes from the site's roles. */
  readonly takes: string;
}

export interface Component {
  readonly id: string;
  readonly name: string;
  /** The component doc: its looks in full, and for a fixed look the table of values it fixes. */
  readonly doc: string;
  readonly members: string;
  /** Whether a spec picks one look (`diagrams: blueprint`) or several (`looks: [a, b]`). */
  readonly pick: "one" | "several";
  readonly looks: readonly ComponentLook[];
}

/**
 * Diagram themes a spec declares (`diagram-themes: { default: <theme>, <page>: <theme> }`): where
 * each theme applies (`default` is the site; any other key is a page or page group, kebab-case) and
 * the theme's name. A theme uipack does not ship is described in the spec's `## Component looks`.
 */
export const DIAGRAM_THEMES_KEY = "diagram-themes";
/** Themes uipack exports (`blueprint` from `uipack`); a spec may name them without describing them. */
export const BUILTIN_DIAGRAM_THEMES = ["blueprint"] as const;

export const COMPONENTS = [
  {
    id: "diagrams",
    name: "Diagrams",
    doc: "docs/components/diagrams.md",
    members:
      "`Figure`, the parts (including the user-flow and sequence parts), the presets, `DrillFigure`, `SpanChart` and `LayerStack` (`uipack`, `uipack/presets`, `uipack/drill`, `uipack/charts`)",
    pick: "one",
    looks: [
      {
        id: "blueprint",
        name: "Blueprint",
        mode: "flex",
        fixed:
          "The grammar: geometry and the 8px grid, node shapes and 6px node radius, type sizes and the 11px floor, stroke widths, packet shapes, what each flow kind means, one accent path per figure",
        takes:
          "Colours, faces and canvas ground from a diagram theme: the site's default, optionally one per page (`diagram-themes:`); the built-in `blueprint` theme is Technical's",
      },
    ],
  },
  {
    id: "3d",
    name: "3D object scenes",
    doc: "docs/components/3d.md",
    members: "`ObjectScene` and its player (`uipack/objects`)",
    pick: "one",
    looks: [
      {
        id: "ink",
        name: "Ink line art",
        mode: "flex",
        fixed:
          "One physical object per subject floating on the page: unlit faces, a 2px ink silhouette and 1px crease lines at every size, one accent part; no lights, shadow maps or photographic textures",
        takes:
          "Paper (the faces), ink (the lines) and accent (the one accent part) from the page's roles, re-read on every theme change",
      },
    ],
  },
  {
    id: "mechanism",
    name: "Mechanism",
    doc: "docs/components/mechanism.md",
    members: "`VerificationGate`, `GateMachine`, `MechanismFrame` (`uipack/mechanism`)",
    pick: "one",
    looks: [
      {
        id: "isometric",
        name: "Isometric machine",
        mode: "flex",
        fixed: "Isometric solids shaded in four tones by facing, one lit part, motion by springs",
        takes: "Tones from the paper and ink, the lit part from the accent, card labels in the label face",
      },
    ],
  },
] as const satisfies readonly Component[];

/**
 * The widget registry (docs/components/widgets.md): for each widget a page needs, the one library to
 * take it from, so an agent never hand-builds a toast, menu, sheet or dialog. `uipack/widgets` skins
 * the ones it lists in `exports`; the rest are used straight from their library, styled on the site's
 * roles. A widget enters the registry when a site needs it; one library per need, and a replacement
 * takes the old row's place. Checked 2026-11-19 (React 18 and 19 peer ranges, last release).
 */
export interface Widget {
  readonly id: string;
  readonly need: string;
  /** The npm package and the range a site installs. */
  readonly library: string;
  readonly range: string;
  /** What `uipack/widgets` exports for it; empty when a site uses the library directly. */
  readonly exports: readonly string[];
  readonly use: string;
  readonly avoid: string;
  /** The library to swap to if this one is abandoned. */
  readonly fallback: string;
}

export const WIDGETS = [
  {
    id: "command-menu",
    need: "Command menu, ⌘K search",
    library: "cmdk",
    range: "^1.1.0",
    exports: [
      "CommandMenu",
      "CommandDialog",
      "CommandInput",
      "CommandList",
      "CommandGroup",
      "CommandItem",
      "CommandEmpty",
      "useCommandShortcut",
    ],
    use: "Jumping to a page or action from the keyboard; searching a long list of places",
    avoid: "Choosing one of a few values in a form (a select)",
    fallback: "Base UI Combobox",
  },
  {
    id: "toast",
    need: "Toasts",
    library: "sonner",
    range: "^2.0.0",
    exports: ["Toaster", "toast"],
    use: "Saying a background action finished (saved, sent), with Undo where it can be undone",
    avoid:
      "An error the reader must fix (say it beside the field); anything that needs a decision (a dialog); a result the control itself can show (a copy button's inline “Copied”)",
    fallback: "Base UI Toast",
  },
  {
    id: "dialog",
    need: "Dialog, alert dialog",
    library: "@base-ui/react",
    range: "^1.9.0",
    exports: [],
    use: "A decision or a short form that has to be answered before the page goes on",
    avoid: "Content a reader browses or comes back to (give it a page or a sheet)",
    fallback: "The browser's `<dialog>`, as `CommandDialog` uses it",
  },
  {
    id: "popover-menu",
    need: "Popover, menu, select, tabs, tooltip",
    library: "@base-ui/react",
    range: "^1.9.0",
    exports: [],
    use: "Any of these with keyboard, focus and screen-reader behaviour a reader expects",
    avoid: "A tooltip that holds the only copy of something a touch reader needs",
    fallback: "Radix Primitives",
  },
  {
    id: "sheet",
    need: "Bottom sheet, drawer",
    library: "@base-ui/react",
    range: "^1.9.0",
    exports: [],
    use: "Phone-first panels: filters, a menu, details for a row (Base UI Drawer). Not Vaul: its README says it is unmaintained (checked 2026-11-19)",
    avoid: "Desktop navigation that fits in the page",
    fallback: "Base UI Dialog styled as a sheet",
  },
  {
    id: "live-number",
    need: "A number that keeps changing",
    library: "@number-flow/react",
    range: "^0.6.0",
    exports: [],
    use: "Prices, counters and totals that update while the reader watches",
    avoid: "A proof stat that counts up once on scroll (that is `NumberTicker` in `uipack/web`)",
    fallback: "`NumberTicker`",
  },
] as const satisfies readonly Widget[];
