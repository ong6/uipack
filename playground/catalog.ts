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
export const libraryPages = [
  { id: "figures", label: "Figures", path: "/" },
  { id: "assets", label: "Assets", path: "/assets" },
  { id: "animations", label: "3D animations", path: "/animations" },
  { id: "presentations", label: "Presentations", path: "/presentations" },
  { id: "deck", label: "Deck player", path: "/deck" },
  { id: "web", label: "Web UI", path: "/web" },
  { id: "docs", label: "Docs layout", path: "/docs" },
  { id: "article", label: "Article parts", path: "/article" },
  { id: "styles", label: "Styles", path: "/styles" },
] as const;
export type LibraryPage = (typeof libraryPages)[number]["id"];
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

/** Figures beyond the SVG parts and presets, rendered on / (uipack/charts). */
export const figureEntries: CatalogEntry[] = [
  {
    id: "layer-stack",
    title: "Layer stack",
    type: "figures",
    styleId: "technical",
    tags: ["Diagram", "Layers", "Disclosure", "Hero"],
  },
  {
    id: "span-chart",
    title: "Span chart",
    type: "figures",
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
