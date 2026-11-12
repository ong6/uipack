// The landing page's words and links, as data. Every claim comes from the docs it links: the read
// order from docs/agents/README.md, the jobs from docs/README.md ("Where to start"), the layers from
// docs/README.md ("How it is built"). Links name docs pages by their manifest id, so a page that
// moves keeps its card (test: e2e/landing.spec.ts follows every one).
import type { IconName } from "../../src";
import type { DocsSectionId } from "../docs-manifest";

/** The agent read order (docs/agents/README.md, "Read in this order"): the hero figure and the For agents band. */
export const READ_ORDER: readonly { title: string; path: string; icon: IconName; long: string; note: string }[] = [
  { title: "The job's skill", path: "skills/", icon: "tool", long: "The job's skill", note: "skills/" },
  { title: "The site's spec", path: "STYLE.md", icon: "doc", long: "The site's spec", note: "STYLE.md, or its registry row" },
  { title: "The core rules", path: "docs/system/", icon: "check", long: "The core rules for your medium", note: "docs/system/" },
  {
    title: "The component docs",
    path: "dist/*.d.ts",
    icon: "browser",
    long: "The component docs",
    note: "and the entry's dist/*.d.ts",
  },
];

/**
 * The page the hero figure builds: the /web sample page's hero (playground/WebShowcase.tsx, Tidy),
 * quoted, the headline cut where it wraps and its accented words last. Its numbers and action are
 * tidyFacts'.
 */
export const HERO_PAGE = { headline: ["Forty emails in.", "Three that", "need you."] } as const;

/** The docs section a job card is tinted by and named after (the manifest's sections; their hues are the site's). */
export type JobSection = Extract<DocsSectionId, "rules" | "build" | "check">;

export interface Job {
  title: string;
  text: string;
  /** The page it opens, by docs-manifest id, and the words on its link. */
  page: string;
  go: string;
  section: JobSection;
  art: "landing" | "docs" | "deck" | "diagram" | "spec" | "grade";
}

/** "Start from your job": docs/README.md's "Where to start" rows a reader builds from, plus grading (docs/agents/README.md). */
export const JOBS: readonly Job[] = [
  {
    title: "Build a landing page",
    text: "The landing recipe, then the example landing page.",
    page: "recipe-landing",
    go: "Landing recipe",
    section: "build",
    art: "landing",
  },
  {
    title: "Write docs or an article",
    text: "The documentation recipe, then the example text page.",
    page: "recipe-documentation",
    go: "Documentation recipe",
    section: "build",
    art: "docs",
  },
  {
    title: "Make a deck",
    text: "The deck recipe, then the Deck player.",
    page: "recipe-deck-slide",
    go: "Deck recipe",
    section: "build",
    art: "deck",
  },
  {
    title: "Draw a diagram",
    text: "The Blueprint look, figure labels and captions, then the catalogue.",
    page: "component-diagrams",
    go: "The Blueprint look",
    section: "build",
    art: "diagram",
  },
  {
    title: "Give a site its own spec",
    text: "Its own look, layout and voice: how to write a spec, and what a spec may set.",
    page: "styles",
    go: "How to write a spec",
    section: "rules",
    art: "spec",
  },
  {
    title: "Grade and verify work",
    text: "Render at 1440 and 390, light and dark, then grade it: how to grade, and the rubric for your page type.",
    page: "grading",
    go: "How to grade",
    section: "check",
    art: "grade",
  },
];

/** "How it's built": docs/README.md's layer table, bottom to top, as LayerStack data. */
export const LAYERS: readonly { id: string; label: string; summary: string; page: string; zone: string }[] = [
  {
    id: "core",
    label: "Core rules",
    summary: "What every site keeps: the role contract, the layout floors, the core writing rules and slot ceilings",
    page: "foundations",
    zone: "kept",
  },
  {
    id: "layouts",
    label: "Layout archetypes",
    summary: "Named layouts per page type (grid, regions, section order, hero) a spec picks, extends or replaces",
    page: "foundations-layout",
    zone: "kept",
  },
  {
    id: "looks",
    label: "Component looks",
    summary: "Each component's named looks, fixed (the same on every site) or flex (taking the site's roles)",
    page: "component-looks",
    zone: "kept",
  },
  {
    id: "specs",
    label: "Site specs",
    summary: "Its roles, a layout per page type, its writing style and the looks it picks; built from a template and checked",
    page: "styles",
    zone: "site",
  },
  {
    id: "recipes",
    label: "Recipes",
    summary: "One per page type: the parts and the rules it relies on",
    page: "recipes",
    zone: "parts",
  },
  { id: "components", label: "Components", summary: "The parts, each with its live demo", page: "figures", zone: "parts" },
];

/** "How it's built": where to read next, beside the stack: the overview, then the three layers a newcomer opens first (labels as the stack names them). */
export const BUILT_NEXT: readonly { label: string; page: string }[] = [
  { label: "What UiPack is", page: "start" },
  ...["core", "specs", "recipes"].map((id) => {
    const layer = LAYERS.find((l) => l.id === id)!;
    return { label: layer.label, page: layer.page };
  }),
];

export const LAYER_ZONES = [
  { id: "kept", label: "Core and libraries", note: "kept in uipack" },
  { id: "site", label: "Site spec", note: "one per website" },
  { id: "parts", label: "Recipes and parts", note: "kept in uipack" },
] as const;
