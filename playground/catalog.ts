// Data-only modules, not the uipack/objects barrel: this file is in the playground's entry chunk.
import { objectDirections } from "../src/objects/variants";
import { objectScenes } from "../src/objects/scene-list";
import { docsManifest, docsSections, type DocsPageEntry, type DocsSectionId } from "./docs-manifest";
import { figureRows } from "./figure-rows";
/**
 * Content type and visual style are independent axes. Technical is the one style (pages, documents,
 * slides, figures); Mechanism and the 3D art directions are illustration looks drawn within it.
 * Register them here, never fork the shell.
 */
export const visualStyles = [
  {
    id: "technical",
    name: "Technical",
    description:
      "The one implemented style, for pages, documents, slides and figures. A blueprint: precise system diagrams in Prussian-blue ink, one amber mark, square hairlines and a drafting grid on the hero and figures. On the web, a page leads with the product's real output.",
    tokens: "src/styles/technical.css",
    guidance: "docs/system/style.md",
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
    id: direction.id,
    name: direction.name,
    description: direction.description,
    tokens:
      variant === 0
        ? "src/objects/objects.css"
        : variant < 3
          ? "src/objects/art-directions.ts"
          : "src/objects/expanded-directions.ts",
    guidance: "docs/objects.md",
    variant,
  })),
] as const;

/**
 * Navigation groups and pages come from the docs manifest (docs-manifest.ts): the sidebar groups in
 * order, each opening on its first page. Add a page there; this file only types it for the shell.
 */
type ManifestPage = (typeof docsManifest)[number]["pages"][number];
export type LibraryGroup = (typeof docsManifest)[number]["id"];
export const libraryGroups = docsManifest.map((g) => ({
  id: g.id as LibraryGroup,
  label: g.label,
  section: g.section as DocsSectionId,
  /** The caption above the group's pages in the sidebar; none for a section's untitled first group. */
  caption: "caption" in g && g.caption === false ? undefined : g.label,
  defaultPage: g.pages[0].id,
}));

/** The five sidebar sections in order, each with its groups. */
export const librarySections = docsSections.map((s) => ({
  ...s,
  groups: libraryGroups.filter((g) => g.section === s.id),
}));

/** The section a page sits in. */
export const sectionOfPage = (page: { group: string }) => librarySections.find((s) => s.groups.some((g) => g.id === page.group));

/**
 * One page. Several entries may share a `path` and differ by `query` (a sub-view, such as a deck):
 * the entry is current when every listed query param matches the URL, and `isDefault` marks the
 * one that is current otherwise. `title` overrides the h1 when the label names only the sub-view.
 */
export interface PageDef extends DocsPageEntry {
  group: LibraryGroup;
}

/** Every page, in reading order, with its group: the manifest flattened. */
export const libraryPages = docsManifest.flatMap((g) =>
  g.pages.map((p) => ({ ...p, group: g.id as LibraryGroup })),
) as readonly (ManifestPage & { group: LibraryGroup })[];
export type LibraryPage = ManifestPage["id"];

/** The same list, typed for code that reads the optional fields. */
export const pageDefs: readonly PageDef[] = libraryPages;

/** A page's path with its sub-view query, without the theme ("/deck?deck=bento"). */
export function pagePath(page: PageDef) {
  const query = new URLSearchParams(page.query).toString();
  return query ? `${page.path}?${query}` : page.path;
}

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

/** The browser tab title: the h1's words in the h1's order, then the site ("Deck player · Bento · UiPack"). */
export function documentTitle(page: PageDef) {
  return `${pageHeading(page)} · UiPack`;
}

/**
 * A sub-view query that names nothing (`/deck?deck=bogus`): the param, its value and the entry
 * shown instead, or null when the query is absent or matches a page.
 */
export function unknownSubView(page: PageDef, search: string) {
  const params = new URLSearchParams(search);
  const same = pageDefs.filter((p) => p.path === page.path && p.query);
  for (const key of new Set(same.flatMap((p) => Object.keys(p.query!)))) {
    const value = params.get(key);
    if (value !== null && !same.some((p) => p.query![key] === value)) return { key, value, shown: page };
  }
  return null;
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

/** Web building blocks, shown on /web. Flashy pieces earn their motion; low-key pieces are the defaults. */
export const webEntries: CatalogEntry[] = [
  { id: "demo-player", title: "Demo player", type: "web", styleId: "technical", tags: ["Flashy", "Hero", "Motion"] },
  { id: "star-hero", title: "Star hero", type: "web", styleId: "technical", tags: ["Flashy", "Hero"] },
  { id: "spotlight-card", title: "Spotlight card", type: "web", styleId: "technical", tags: ["Flashy", "Card"] },
  { id: "reveal-text", title: "Reveal text", type: "web", styleId: "technical", tags: ["Flashy", "Type", "Motion"] },
  { id: "type-scale", title: "Type scale", type: "web", styleId: "technical", tags: ["Low-key", "Type"] },
  { id: "text-hierarchy", title: "Text hierarchy", type: "web", styleId: "technical", tags: ["Low-key", "Type"] },
  { id: "cta-button", title: "CTA button", type: "web", styleId: "technical", tags: ["Low-key", "Action"] },
  { id: "glass-nav", title: "Glass nav", type: "web", styleId: "technical", tags: ["Low-key", "Navigation"] },
  { id: "feature-grid", title: "Section and feature grid", type: "web", styleId: "technical", tags: ["Low-key", "Layout"] },
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
  ).map(([id, title]) => ({ id, title, type: "web" as const, styleId: "technical", tags: ["Motion"] })),
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
  ).map(([id, title]) => ({ id, title, type: "web" as const, styleId: "technical", tags: ["Backgrounds"] })),
];

/** A diagram pattern's id. `figureDetails` in playground/figures/index.tsx needs one entry per id. */
export type FigureId = (typeof figureRows)[number][0];
export const figureEntries: (CatalogEntry & { id: FigureId })[] = figureRows.map(([id, title, tags]) => ({
  id,
  title,
  type: "figures" as const,
  styleId: "technical",
  tags: [...tags],
}));

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
  {
    id: "note-cluster",
    title: "Note cluster",
    type: "article",
    styleId: "technical",
    tags: ["Article", "Link", "Group", "Grid"],
  },
  { id: "layer-head", title: "Layer head", type: "article", styleId: "technical", tags: ["Article", "Heading", "Metric"] },
  { id: "term-list", title: "Term list", type: "article", styleId: "technical", tags: ["Article", "Tags"] },
  { id: "callout", title: "Callout", type: "article", styleId: "technical", tags: ["Article", "Self-test"] },
  { id: "change-note", title: "Change note", type: "article", styleId: "technical", tags: ["Article", "Aside"] },
  { id: "link-list", title: "Link list", type: "article", styleId: "technical", tags: ["Article", "Link"] },
];

/** The deck player (uipack/deck), rendered on /deck with an example tech talk that uses each move where its story needs it. */
export const deckEntries: CatalogEntry[] = [
  {
    id: "deck-player",
    title: "Deck player",
    type: "deck",
    styleId: "technical",
    tags: ["Presentation", "Keyboard", "Speaker view", "Overview"],
  },
  {
    id: "deck-advance",
    title: "Advance transition",
    type: "deck",
    styleId: "technical",
    tags: ["Transition", "Motion", "Default"],
  },
  {
    id: "deck-morph",
    title: "Morph transition",
    type: "deck",
    styleId: "technical",
    tags: ["Transition", "Motion", "Shared element"],
  },
  { id: "deck-zoom", title: "Zoom transition", type: "deck", styleId: "technical", tags: ["Transition", "Motion", "Camera"] },
  { id: "deck-read", title: "Read view", type: "deck", styleId: "technical", tags: ["Presentation", "Mobile", "Async"] },
];

/** Mechanism machines (uipack/mechanism, an illustration look within Technical), rendered on /mechanism. */
export const mechanismEntries: CatalogEntry[] = [
  {
    id: "verification-gate",
    title: "Verification gate",
    type: "mechanism",
    styleId: "mechanism",
    tags: ["Mechanism", "Agents", "Isometric", "Pose"],
  },
];
