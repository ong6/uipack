import { objectDirections, objectScenes } from "../src/objects";
/** Content type and visual style are independent axes. Register styles here, never fork the shell. */
export const visualStyles = [
  {
    id: "technical",
    name: "Technical",
    description:
      "Precise system diagrams, restrained colour, directional motion, and clear labels.",
    tokens: "src/theme.css",
    guidance: "docs/design-direction.md",
  },
  {
    id: "landing",
    name: "Landing",
    description:
      "Marketing-site building blocks: a demo-first hero, one star visual, opacity hierarchy, quiet depth and a single accent for calls to action.",
    tokens: "src/web/web.css",
    guidance: "docs/web-principles.md",
  },
  {
    id: "mechanism",
    name: "Mechanism",
    description:
      "Crafted isometric machines whose working is the explanation: many small precise parts, calm sprung motion, one lit part and a live readout wired to a small model. After Anatomy (MIT).",
    tokens: "src/mechanism/mechanism.css",
    guidance: "docs/mechanism.md",
  },
  ...objectDirections.map((direction, variant) => ({
    id: direction.id, name: direction.name, description: direction.description,
    tokens: variant === 0 ? 'src/objects/objects.css' : variant < 3 ? 'src/objects/art-directions.ts' : 'src/objects/expanded-directions.ts',
    guidance: 'docs/objects.md', variant,
  })),
] as const;
/** Navigation groups, in display order. A group opens on its default page. Add a group here; add pages below. */
export const libraryGroups = [
  { id: "diagrams", label: "Diagrams", defaultPage: "figures" },
  { id: "presentations", label: "Presentations", defaultPage: "deck" },
  { id: "motion", label: "Motion & 3D", defaultPage: "animations" },
  { id: "web-group", label: "Web", defaultPage: "web" },
  { id: "foundations", label: "Foundations", defaultPage: "styles" },
] as const;
export type LibraryGroup = (typeof libraryGroups)[number]["id"];

/**
 * One entry of the second nav row. Several entries may share a `path` and differ by `query`
 * (a sub-view, such as a deck): the entry is current when every listed query param matches
 * the URL, and `isDefault` marks the one that is current otherwise. `title` overrides the h1
 * when the label names only the sub-view.
 */
export interface PageDef {
  id: string;
  group: LibraryGroup;
  label: string;
  title?: string;
  path: string;
  query?: Readonly<Record<string, string>>;
  isDefault?: boolean;
  intro: string;
  /** The page hosts a complete sample page with its own h1 (the Landing demo), so the shell's title is not a heading. */
  hostsPage?: boolean;
}

/**
 * Every page, in display order within its group. `label` is the nav text and the page's h1;
 * `intro` is the one-sentence line under it. A new page adds an entry here and its component in
 * `pageComponents` (main.tsx); docs/contributing.md has the recipe.
 */
export const libraryPages = [
  { id: "figures", group: "diagrams", label: "Architecture diagrams", path: "/", intro: "The figure design system: each diagram pattern once, from the bare canvas to a figure you drill into, with the parts it is built from." },
  { id: "charts", group: "diagrams", label: "Charts", path: "/charts", intro: "Layered and comparative charts for articles, previewed at a host's real figure width." },
  { id: "article", group: "diagrams", label: "Article parts", path: "/article", intro: "Prose-friendly parts for long reads, shown inside a host article's text column." },
  { id: "deck", group: "presentations", label: "Tech talk", title: "Deck player", path: "/deck", query: { deck: "moves" }, isDefault: true, intro: "A tech talk that explains its own moves: advance, morph and zoom, builds, and a machine slide. Click the deck, then use the arrow keys." },
  { id: "deck-bento", group: "presentations", label: "Bento", title: "Deck player", path: "/deck", query: { deck: "bento" }, intro: "A quarterly review on one bento slide: Next moves a camera between the containers, and each one shows denser detail when it is in focus." },
  { id: "deck-consulting", group: "presentations", label: "Consulting", title: "Deck player", path: "/deck", query: { deck: "consulting" }, intro: "A decision deck in consulting style: dense slides with charts, callouts, a so-what panel and sources, read headline by headline." },
  { id: "presentations", group: "presentations", label: "Slide starters", path: "/presentations", intro: "Slide layouts with their speech notes, then a complete five-chapter narrative built from them." },
  { id: "animations", group: "motion", label: "3D animations", path: "/animations", intro: "Live 3D scenes with camera moves, animated flows and presentation controls." },
  { id: "mechanism", group: "motion", label: "Mechanism", path: "/mechanism", intro: "Mechanical drawings that explain how a system moves, one part at a time." },
  { id: "web", group: "web-group", label: "Web UI", path: "/web", hostsPage: true, intro: "Landing-page building blocks: a demo-first hero, spotlight features, motion and backgrounds." },
  { id: "docs", group: "web-group", label: "Docs layout", path: "/docs", intro: "A three-column product documentation shell with responsive navigation and Markdown prose." },
  { id: "styles", group: "foundations", label: "Styles", path: "/styles", intro: "The visual languages in the library and where each one is used." },
  { id: "assets", group: "foundations", label: "Icons & marks", path: "/assets", intro: "Searchable icons, marks, canvas backgrounds and motion tokens, each with a preview and a copy button." },
] as const;
export type LibraryPage = (typeof libraryPages)[number]["id"];

/** The same list, typed for code that reads the optional fields. */
export const pageDefs: readonly PageDef[] = libraryPages;

/** Link target for a page, with its query and the theme. */
export function pageHref(page: PageDef, theme: string) {
  const params = new URLSearchParams(page.query);
  params.set("theme", theme);
  return `${page.path}?${params}`;
}

/** The entry for `id`, or its sibling on the same path whose query matches `search`. */
export function resolvePage(id: string, search: string): PageDef {
  const base = pageDefs.find((p) => p.id === id)!;
  const params = new URLSearchParams(search);
  const same = pageDefs.filter((p) => p.path === base.path);
  const exact = same.find((p) => p.query && Object.entries(p.query).every(([k, v]) => params.get(k) === v));
  return exact ?? same.find((p) => p.isDefault) ?? base;
}

/** The h1: the page, then the sub-view it shows ("Deck player · Bento"). */
export function pageHeading(page: PageDef) {
  return page.query && page.title ? `${page.title} · ${page.label}` : (page.title ?? page.label);
}

/** The browser tab title: the sub-view first, so tabs tell apart ("Bento · Deck player · uipack"). */
export function documentTitle(page: PageDef) {
  return [page.query && page.title ? page.label : null, page.title ?? page.label, "uipack"].filter(Boolean).join(" · ");
}
export interface CatalogEntry {
  id: string;
  title: string;
  type: LibraryPage;
  styleId: string;
  tags: string[];
}
export const animationEntries: CatalogEntry[] = [
  ...objectScenes.map((scene) => ({
    id: scene.id,
    title: scene.title,
    type: "animations" as const,
    styleId: "technical",
    tags: ["Objects", "Transform"],
  })),
  {
    id: "harness-dive",
    title: "Harness dive",
    type: "animations",
    styleId: "technical",
    tags: ["Camera", "Agents"],
  },
  {
    id: "retrieval-layers",
    title: "Retrieval layers",
    type: "animations",
    styleId: "technical",
    tags: ["Layers", "Data"],
  },
  {
    id: "parallel-agents",
    title: "Parallel agents",
    type: "animations",
    styleId: "technical",
    tags: ["Transform", "Agents"],
  },
  {
    id: "quarter-turn",
    title: "Quarter turn",
    type: "animations",
    styleId: "technical",
    tags: ["Camera", "Architecture"],
  },
  {
    id: "staged-assembly",
    title: "Staged assembly",
    type: "animations",
    styleId: "technical",
    tags: ["Layers", "Architecture"],
  },
  {
    id: "architecture-shift",
    title: "Before / after",
    type: "animations",
    styleId: "technical",
    tags: ["Transform", "Architecture"],
  },
];

/** Each style has six real rendered examples, reachable through the gallery's selector. */
export const objectStyleEntries = objectDirections.flatMap((direction, variant) =>
  objectScenes.filter(scene => scene.id !== 'contact').map(scene => ({
    id: `${scene.id}-${direction.id}`, title: `${scene.title} / ${direction.name}`,
    type: 'animations' as const, styleId: direction.id,
    tags: ['Objects', direction.id], href: `/animations?story=${scene.id}&variant=${variant}`,
  })));

objectStyleEntries.push(...([{variant:3, styleId:'cartoon', title:'Little post office'}, {variant:4, styleId:'kinetic', title:'Correspondence mobile'}] as const).map(item=>({
  id:`contact-${item.styleId}`,title:`Contact inbox / ${item.title}`,type:'animations' as const,styleId:item.styleId,
  tags:['Objects',item.styleId],href:`/animations?story=contact&variant=${item.variant}`,
})));

/** Landing-style web building blocks, shown on /web. Flashy pieces earn their motion; low-key pieces are the defaults. */
export const webEntries: CatalogEntry[] = [
  { id: "demo-player", title: "Demo player", type: "web", styleId: "landing", tags: ["Flashy", "Hero", "Motion"] },
  { id: "star-hero", title: "Star hero", type: "web", styleId: "landing", tags: ["Flashy", "Hero"] },
  { id: "spotlight-card", title: "Spotlight card", type: "web", styleId: "landing", tags: ["Flashy", "Card"] },
  { id: "reveal-text", title: "Reveal text", type: "web", styleId: "landing", tags: ["Flashy", "Type", "Motion"] },
  { id: "type-scale", title: "Type scale", type: "web", styleId: "landing", tags: ["Low-key", "Type"] },
  { id: "text-hierarchy", title: "Text hierarchy", type: "web", styleId: "landing", tags: ["Low-key", "Type"] },
  { id: "cta-button", title: "CTA button", type: "web", styleId: "landing", tags: ["Low-key", "Action"] },
  { id: "glass-nav", title: "Glass nav", type: "web", styleId: "landing", tags: ["Low-key", "Navigation"] },
  { id: "feature-grid", title: "Section and feature grid", type: "web", styleId: "landing", tags: ["Low-key", "Layout"] },
  ...(
    [
      ["reveal", "Reveal on scroll"],
      ["text-scramble", "Text scramble and typewriter"],
      ["number-ticker", "Number ticker"],
      ["marquee", "Marquee"],
      ["tilt-magnetic", "Tilt card and magnetic button"],
      ["scroll-transform", "Scroll transform"],
      ["view-transition", "View transition helper"],
      ["paint-transition", "Paint transition"],
    ] as const
  ).map(([id, title]) => ({ id, title, type: "web" as const, styleId: "landing", tags: ["Motion"] })),
  ...(
    [
      ["grain-overlay", "Grain overlay"],
      ["dot-grid", "Dot grid"],
      ["line-grid", "Line grid"],
      ["aurora", "Aurora"],
      ["masked-star", "Masked star"],
      ["beam-lines", "Beam lines"],
      ["drifting-gutters", "Drifting gutters"],
    ] as const
  ).map(([id, title]) => ({ id, title, type: "web" as const, styleId: "landing", tags: ["Backgrounds"] })),
];

/**
 * Architecture-diagram patterns, rendered on / in this order, one section each (h2 = title).
 * The page is the design-system reference for figures: each distinct pattern once, simplest
 * first. Add an entry here and its section in playground/figures/index.tsx together.
 */
export const figureEntries: CatalogEntry[] = (
  [
    ["bare-figure", "Bare figure: just the canvas", ["Frame", "Canvas"]],
    ["parts", "Parts: every primitive once", ["Node", "Group", "Chip", "Connector", "Packet", "Bus", "Wall", "Cross", "Icon", "Mark"]],
    ["pipeline", "Pipeline: stages in a line", ["Preset", "Pipeline", "Queue"]],
    ["loops", "Loops: repeat a step, return to the start", ["Loop", "Feedback", "Return path"]],
    ["decision-tree", "Decision tree: one question per level", ["Decision", "Branch", "Tree"]],
    ["before-after", "Before and after: the same flow, changed", ["Preset", "Comparison"]],
    ["fan-out-fan-in", "Fan-out and fan-in: parallel work, one merge", ["Bus", "Parallel", "Merge"]],
    ["two-way-sync", "Two-way sync: one source, many copies", ["Preset", "Sync", "Bidirectional"]],
    ["agent-loop", "Agent loop: calls out, results back, a check before output", ["Preset", "Agents", "Tools", "Gate"]],
    ["failure-rail", "Failure rail: every stage fails to one place", ["Vertical", "Errors", "Dead letter"]],
    ["queue-callouts", "Queue and callouts: where work piles up", ["Queue", "Callout", "Bottleneck"]],
    ["sequence", "Sequence: messages between actors, in order", ["Sequence", "Lifeline", "Protocol"]],
    ["nested-groups", "Nested groups: what runs inside what", ["Group", "Containment", "Replicas"]],
    ["numbered-steps", "Numbered steps: one path across column lanes", ["Badge", "Walkthrough", "Lanes"]],
    ["service-map", "Service map: clients, one platform, its stores", ["Reference", "Bus", "Hub", "Lanes"]],
    ["layered-checks", "Layered checks: each layer stops some, one slips through", ["Filter", "Defence in depth"]],
    ["flow-volumes", "Flow volumes: where every item ends up", ["Sankey", "Volumes"]],
    ["drill-figure", "Drill-down: a figure inside a node", ["Drill-down", "Zoom", "Levels"]],
  ] as const
).map(([id, title, tags]) => ({ id, title, type: "figures" as const, styleId: "technical", tags: [...tags] }));

/** Charts (uipack/charts), rendered on /charts. */
export const chartEntries: CatalogEntry[] = [
  {
    id: "layer-stack",
    title: "Layer stack",
    type: "charts",
    styleId: "technical",
    tags: ["Diagram", "Layers", "Disclosure", "Hero"],
  },
  {
    id: "span-chart",
    title: "Span chart",
    type: "charts",
    styleId: "technical",
    tags: ["Chart", "Comparison", "Filter", "Layers"],
  },
];

/** Documentation layouts, rendered on /docs with real navigation and Markdown. */
export const docsEntries: CatalogEntry[] = [
  {
    id: "product-docs-layout",
    title: "Product documentation layout",
    type: "docs",
    styleId: "technical",
    tags: ["Layout", "Navigation", "Markdown"],
  },
];

/** Article parts (uipack/article), rendered on /article in a host article's prose column. */
export const articleEntries: CatalogEntry[] = [
  { id: "layer-section", title: "Layer section", type: "article", styleId: "technical", tags: ["Article", "Composition"] },
  { id: "note-card", title: "Note card", type: "article", styleId: "technical", tags: ["Article", "Link", "Card"] },
  { id: "note-cluster", title: "Note cluster", type: "article", styleId: "technical", tags: ["Article", "Link", "Group", "Grid"] },
  { id: "layer-head", title: "Layer head", type: "article", styleId: "technical", tags: ["Article", "Heading", "Metric"] },
  { id: "term-list", title: "Term list", type: "article", styleId: "technical", tags: ["Article", "Tags"] },
  { id: "callout", title: "Callout", type: "article", styleId: "technical", tags: ["Article", "Self-test"] },
  { id: "change-note", title: "Change note", type: "article", styleId: "technical", tags: ["Article", "Aside"] },
  { id: "link-list", title: "Link list", type: "article", styleId: "technical", tags: ["Article", "Link"] },
];

/** The deck player (uipack/deck), rendered on /deck with an example deck that explains its own transitions. */
export const deckEntries: CatalogEntry[] = [
  { id: "deck-player", title: "Deck player", type: "deck", styleId: "technical", tags: ["Presentation", "Keyboard", "Speaker view", "Overview"] },
  { id: "deck-advance", title: "Advance transition", type: "deck", styleId: "technical", tags: ["Transition", "Motion", "Default"] },
  { id: "deck-morph", title: "Morph transition", type: "deck", styleId: "technical", tags: ["Transition", "Motion", "Shared element"] },
  { id: "deck-zoom", title: "Zoom transition", type: "deck", styleId: "technical", tags: ["Transition", "Motion", "Camera"] },
  { id: "deck-read", title: "Read view", type: "deck", styleId: "technical", tags: ["Presentation", "Mobile", "Async"] },
];

/** Mechanism-style machines (uipack/mechanism), rendered on /mechanism. */
export const mechanismEntries: CatalogEntry[] = [
  { id: "verification-gate", title: "Verification gate", type: "mechanism", styleId: "mechanism", tags: ["Mechanism", "Agents", "Isometric", "Pose"] },
];
