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
}

/**
 * Every page, in display order within its group. `label` is the nav text and the page's h1;
 * `intro` is the one-sentence line under it. Other branches add an entry here and a route in main.tsx.
 */
export const libraryPages = [
  { id: "figures", group: "diagrams", label: "Architecture diagrams", path: "/", intro: "Request flows, agent loops and service maps drawn as SVG figures, from ready-made presets down to the bare canvas." },
  { id: "charts", group: "diagrams", label: "Charts", path: "/charts", intro: "Layered and comparative charts for articles, previewed at a host's real figure width." },
  { id: "article", group: "diagrams", label: "Article parts", path: "/article", intro: "Prose-friendly parts for long reads, shown inside a host article's text column." },
  { id: "deck", group: "presentations", label: "Tech talk", title: "Deck player", path: "/deck", query: { deck: "moves" }, isDefault: true, intro: "A full-window player that steps a deck of slides with keyboard and touch." },
  { id: "deck-bento", group: "presentations", label: "Bento", title: "Deck player", path: "/deck", query: { deck: "bento" }, intro: "A full-window player that steps a deck of slides with keyboard and touch." },
  { id: "deck-consulting", group: "presentations", label: "Consulting", title: "Deck player", path: "/deck", query: { deck: "consulting" }, intro: "A full-window player that steps a deck of slides with keyboard and touch." },
  { id: "presentations", group: "presentations", label: "Slide starters", path: "/presentations", intro: "Slide layouts with their speech notes, then a complete five-chapter narrative built from them." },
  { id: "animations", group: "motion", label: "3D animations", path: "/animations", intro: "Live 3D scenes with camera moves, animated flows and presentation controls." },
  { id: "mechanism", group: "motion", label: "Mechanism", path: "/mechanism", intro: "Mechanical drawings that explain how a system moves, one part at a time." },
  { id: "web", group: "web-group", label: "Web UI", path: "/web", intro: "Landing-page building blocks: a demo-first hero, spotlight features, motion and backgrounds." },
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
