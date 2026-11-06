/**
 * The docs site's one manifest: every sidebar group, its pages in reading order, each page's
 * route and the Markdown file it renders. Everything else reads it: the sidebar, the phone menu
 * and the pager (ShowcaseShell via catalog.ts), the route table (routes.ts), "View as Markdown"
 * and "Edit on GitHub", the raw files the dev server and the build serve (vite.config.ts),
 * `llms.txt` and the site map in docs/README.md (`npm run docs:sync`), and the test that fails
 * when a page has no file or a docs file has no page (test/docs-manifest.test.ts).
 *
 * A page with `showcase` still renders that playground module (its Markdown is not written yet);
 * its `file` is the doc it will render, and what "View as Markdown" opens meanwhile. A page
 * without `showcase` renders `file` through DocsMarkdown (MarkdownShowcase.tsx). `demos` are live
 * demos the page embeds (playground/demos.tsx): the file names each one in a fenced block,
 * "```uipack-demo <id>"; `at` places one the file does not name yet, before that heading's id.
 *
 * Data only, no imports: Node scripts and the Vite config read it too.
 */

/** A page of the docs site. `label` is the sidebar text and the page's h1 until its Markdown has one. */
export interface DocsPageEntry {
  readonly id: string;
  readonly label: string;
  /** The route; pages that share one differ by `query` (the deck sub-views). */
  readonly path: string;
  readonly query?: Readonly<Record<string, string>>;
  readonly isDefault?: boolean;
  /** The h1 when `label` names only a sub-view ("Deck player"). */
  readonly title?: string;
  /** One sentence: what the page is for. The shell's intro on showcase pages; llms.txt's description. */
  readonly intro: string;
  /** What `file` is for, when `intro` describes the page's demo instead (llms.txt reads this first). */
  readonly summary?: string;
  /** The repo-relative Markdown file the page renders (or will render, with `showcase`). */
  readonly file: string;
  /** The playground module rendered until the page's Markdown is written. */
  readonly showcase?: string;
  readonly demos?: readonly { readonly id: string; readonly at?: string }[];
  /** The page hosts a complete sample page with its own h1 (the /web sample). */
  readonly hostsPage?: boolean;
  /** The `visualStyles` name the page's content uses; default "Technical". */
  readonly styleName?: string;
}

export interface DocsGroupEntry {
  readonly id: string;
  readonly label: string;
  readonly pages: readonly DocsPageEntry[];
}

export const REPO_URL = "https://github.com/ong6/uipack";

export const docsManifest = [
  {
    id: "start",
    label: "Start here",
    pages: [
      {
        id: "start",
        label: "What UiPack is",
        path: "/start",
        file: "docs/README.md",
        intro:
          "UiPack is a design system that draws explanations: diagrams, slides, web pages, motion and 3D. This is the index of its documentation.",
      },
      {
        id: "install",
        label: "Install and use",
        path: "/start/install",
        file: "README.md",
        intro: "Install the package, draw a first figure, and the entries for charts, articles, 3D, web pages, decks and docs.",
      },
    ],
  },
  {
    id: "foundations",
    label: "Rules",
    pages: [
      {
        id: "foundations",
        summary:
          "The canonical design-system spec: the philosophy, the three independent layers (style, writing, layout) and the contract between them, with what each medium needs.",
        label: "Overview",
        path: "/foundations",
        file: "docs/system/README.md",
        demos: [{ id: "layer-swap", at: "philosophy" }],
        intro:
          "UiPack draws explanations: diagrams, slides, web pages, motion and 3D. Start here: style, writing and layout are three separate layers. Swap the writing and the layout live below; the style layer is the role contract Technical fills.",
      },
      {
        id: "foundations-style",
        label: "Style contract",
        path: "/foundations/style",
        file: "docs/system/style.md",
        showcase: "FoundationsShowcase",
        intro:
          "The roles every site spec fills and the ornament slots it paints, shown live with this site's values (Technical) in light and dark.",
      },
      {
        id: "foundations-writing",
        label: "Writing",
        path: "/foundations/writing",
        file: "docs/system/writing.md",
        showcase: "FoundationsShowcase",
        intro: "Words are typed data: a claim per unit, a text budget per slot, and one place for each kind of sentence.",
      },
      {
        id: "foundations-layout",
        label: "Layout",
        path: "/foundations/layout",
        file: "docs/system/layout.md",
        showcase: "FoundationsShowcase",
        intro: "Regions, archetypes and narrow forms: where each slot sits and in what order it is read.",
      },
      {
        id: "spec-settings",
        label: "What a spec may set",
        path: "/foundations/spec-settings",
        file: "docs/system/spec-settings.md",
        intro: "The boundary between a site spec and the core rules: what a spec chooses, and what holds on every site.",
      },
      {
        id: "foundations-mix",
        label: "Mix and match",
        path: "/foundations/mix",
        file: "docs/system/README.md",
        showcase: "FoundationsShowcase",
        intro: "What each layer owns, and the four places one layer still leaks into another.",
      },
      {
        id: "foundations-recipes",
        label: "Recipes",
        path: "/foundations/recipes",
        file: "docs/system/layout.md",
        showcase: "FoundationsShowcase",
        intro: "Five common jobs, each as a style, an archetype sequence and a content template, with the live page.",
      },
      {
        id: "foundations-dont",
        label: "Do and don't",
        path: "/foundations/do-and-dont",
        file: "docs/system/writing.md",
        showcase: "FoundationsShowcase",
        intro: "Paired examples of the rules, and the checklist of generic AI-landing tropes to keep out.",
      },
    ],
  },
  {
    id: "components",
    label: "Components",
    pages: [
      {
        id: "figures",
        label: "Architecture diagrams",
        path: "/",
        file: "README.md",
        showcase: "FiguresShowcase",
        intro:
          "The figure design system: each diagram pattern once, from the bare canvas to a figure you drill into, with the parts it is built from.",
      },
      {
        id: "drill",
        label: "Drill-down figures",
        path: "/components/drill",
        file: "docs/drill.md",
        intro: "A stack of figures where a node zooms open into its own figure: the parts, keyboard, reduced motion and export.",
      },
      {
        id: "charts",
        label: "Charts",
        path: "/charts",
        file: "docs/charts.md",
        showcase: "FiguresShowcase",
        intro: "Layered and comparative charts for articles, previewed at a host's real figure width.",
      },
      {
        id: "article",
        label: "Article parts",
        path: "/article",
        file: "docs/article.md",
        showcase: "ArticleShowcase",
        intro: "Prose-friendly parts for long reads, shown inside a host article's text column.",
      },
      {
        id: "deck",
        summary:
          "The deck player: one transition grammar (advance, morph, zoom), builds, the overview, the speaker and read views, keyboard and touch.",
        label: "Tech talk",
        title: "Deck player",
        path: "/deck",
        query: { deck: "moves" },
        isDefault: true,
        file: "docs/deck.md",
        showcase: "DeckShowcase",
        intro:
          "Tech talk deck: a team lead argues that reviews should open with their answer, with evidence, a pilot and a dated ask. Written to present: short titles, the numbers in points, cue notes in the speaker view (S). Every slide advances except one morph (the same number becoming a table row) and one zoom (into the slide the ghost deck flags). Swipe on a touch screen, or click the deck and use the arrow keys.",
      },
      {
        id: "deck-bento",
        label: "Bento",
        title: "Deck player",
        path: "/deck",
        query: { deck: "bento" },
        file: "docs/deck.md",
        showcase: "DeckShowcase",
        intro:
          "Bento review deck: a quarterly review on one bento slide. Next moves a camera between the containers, and each one shows denser detail when it is in focus.",
      },
      {
        id: "deck-consulting",
        summary:
          "Dense consulting slides and their charts: tracker, action title, panels, so-what, footnotes, bars, waterfall, stacked bars, lines, KPI tiles, Harvey tables and a 2×2.",
        label: "Consulting",
        title: "Deck player",
        path: "/deck",
        query: { deck: "consulting" },
        file: "docs/deck-consulting.md",
        showcase: "DeckShowcase",
        intro:
          "Consulting deck: a decision request in consulting style, with dense charts, callouts, a so-what panel and sources. Written to be read without the presenter, so every title is a full-sentence conclusion.",
      },
      {
        id: "deck-storytelling",
        label: "Deck storytelling",
        path: "/components/deck-storytelling",
        file: "docs/deck-storytelling.md",
        intro: "Storyline templates, slide roles and the checks lintDeck runs on a deck's argument.",
      },
      {
        id: "presentations",
        label: "Slide starters",
        path: "/presentations",
        file: "docs/presentations.md",
        showcase: "CatalogShowcase",
        intro: "Slide layouts with their speech notes, then a complete five-chapter narrative built from them.",
      },
      {
        id: "animations",
        label: "3D animations",
        path: "/animations",
        file: "docs/slides.md",
        showcase: "SlideShowcase",
        intro: "Live 3D scenes with camera moves, animated flows and presentation controls.",
      },
      {
        id: "objects",
        label: "3D object scenes",
        path: "/components/objects",
        file: "docs/objects.md",
        intro: "Reusable, lazy 3D illustrations, their art directions and the player that shows them.",
      },
      {
        id: "mechanism",
        label: "Mechanism",
        path: "/mechanism",
        file: "docs/mechanism.md",
        showcase: "MechanismShowcase",
        intro: "Mechanical drawings that explain how a system moves, one part at a time.",
      },
      {
        id: "docs",
        label: "Docs layout",
        path: "/docs",
        file: "docs/docs-layout.md",
        showcase: "DocsShowcase",
        intro: "A three-column product documentation shell with responsive navigation and Markdown prose.",
      },
    ],
  },
  {
    id: "families",
    label: "Families",
    pages: [
      {
        id: "family-diagrams",
        label: "Diagrams",
        path: "/families/diagrams",
        file: "docs/families/diagrams.md",
        intro:
          "The diagram family: figures, charts and drill-down look the same on every site; its fixed values, generated from code.",
      },
    ],
  },
  {
    id: "specs",
    label: "Specs",
    pages: [
      {
        id: "styles",
        label: "How to write a spec",
        path: "/styles",
        file: "docs/specs/README.md",
        intro:
          "One spec per website, built from the core rules: the layers, how to write and check a spec, and how a spec becomes a live style.",
      },
      {
        id: "spec-template",
        label: "Spec template",
        path: "/specs/template",
        file: "docs/specs/TEMPLATE.md",
        intro: "The file a new site spec starts from: the frontmatter and the sections the checker requires.",
      },
      {
        id: "spec-technical",
        label: "Technical",
        path: "/specs/technical",
        file: "docs/specs/technical.md",
        demos: [{ id: "style-catalog", at: "type" }],
        intro:
          "The uipack site's spec: Cyanotype, Prussian ink and one amber mark, IBM Plex, with its role values generated from the style file.",
      },
      {
        id: "spec-registry",
        label: "Registry",
        path: "/specs/registry",
        file: "docs/specs/registry.md",
        intro: "Every site uipack designs for: where its spec lives, the families it uses and the uipack commit it pins.",
      },
    ],
  },
  {
    id: "examples",
    label: "Examples",
    pages: [
      {
        id: "web",
        summary: "The numbered rules for uipack/web pages in Technical, each with its source, motion and backgrounds included.",
        label: "Web UI",
        path: "/web",
        file: "docs/web-principles.md",
        showcase: "WebShowcase",
        hostsPage: true,
        intro: "A product page in Technical, the one implemented style, then every part it is made of.",
      },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    pages: [
      {
        id: "assets",
        label: "Icons & marks",
        path: "/assets",
        file: "README.md",
        showcase: "FiguresShowcase",
        intro: "Searchable icons, marks, canvas backgrounds and motion tokens, each with a preview and a copy button.",
      },
      {
        id: "contributing",
        label: "Contributing",
        path: "/reference/contributing",
        file: "docs/contributing.md",
        intro: "Step-by-step recipes, with the exact files to touch, for a new style, page, deck, slide part, chart or figure.",
      },
      {
        id: "component-first",
        label: "Component-first",
        path: "/reference/component-first",
        file: "docs/component-first.md",
        intro: "Build, register and verify a significant visual in the library before a consumer uses it.",
      },
      {
        id: "design-direction",
        label: "Design direction",
        path: "/reference/design-direction",
        file: "docs/design-direction.md",
        intro: "The playground's visual direction, catalog taxonomy, interaction polish and presentation composition.",
      },
      {
        id: "interaction",
        label: "Canvas and selection",
        path: "/reference/interaction",
        file: "docs/interaction.md",
        intro: "Mobile reading, item selection, expanded inspection and their limits.",
      },
      {
        id: "web-principles",
        label: "Web principles",
        path: "/reference/web-principles",
        file: "docs/web-principles.md",
        intro: "The numbered rules for uipack/web pages, each with its number and source, motion and backgrounds included.",
      },
      {
        id: "discoverability",
        label: "Web discoverability",
        path: "/reference/discoverability",
        file: "docs/web-discoverability.md",
        intro: "How a uipack/web page gets found and quoted by search and answer engines: the checklist and the builders.",
      },
      {
        id: "portfolio-ideas",
        label: "Portfolio ideas",
        path: "/reference/portfolio-ideas",
        file: "docs/portfolio-ideas.md",
        intro: "Prioritised places where uipack/web pieces would improve junxiong.dev, and what to avoid.",
      },
    ],
  },
  {
    id: "grading",
    label: "Grading",
    pages: [
      {
        id: "grading",
        label: "How to grade",
        path: "/grading",
        file: "docs/grading/README.md",
        intro:
          "How an agent grades its own UI work before handoff, and how a lead grades a subagent's: three tiers, values first.",
      },
      {
        id: "grading-tier-1",
        label: "Mechanical checks",
        path: "/grading/tier-1",
        file: "docs/grading/tier-1.md",
        intro: "The 13 deterministic checks, their thresholds and sources, the CLI, the report and the site config.",
      },
      {
        id: "grading-protocol",
        label: "Pairwise judging",
        path: "/grading/protocol",
        file: "docs/grading/protocol.md",
        intro: "Two fresh judges in opposite order compare A and B on one brief and a frozen rubric; the packet and the tally.",
      },
      {
        id: "grading-calibration",
        label: "Calibration anchors",
        path: "/grading/calibration",
        file: "docs/grading/calibration.md",
        intro: "Known human pages scored on the same rubric, so a target score reads relative to them.",
      },
      {
        id: "grading-regression",
        label: "Regression set",
        path: "/grading/regression",
        file: "docs/grading/regression.md",
        intro: "Fifteen frozen briefs reused every round, and the fix ledger that proves a fix reached the next build.",
      },
      {
        id: "rubric-landing",
        label: "Landing rubric",
        path: "/grading/rubrics/landing-v1",
        file: "docs/grading/rubrics/landing-v1.md",
        intro: "Version 1 of the frozen judge rubric for landing pages.",
      },
      {
        id: "rubric-docs",
        label: "Docs rubric",
        path: "/grading/rubrics/docs-v1",
        file: "docs/grading/rubrics/docs-v1.md",
        intro: "Version 1 of the frozen judge rubric for documentation and articles.",
      },
      {
        id: "rubric-deck",
        label: "Deck rubric",
        path: "/grading/rubrics/deck-slide-v1",
        file: "docs/grading/rubrics/deck-slide-v1.md",
        intro: "Version 1 of the frozen judge rubric for decks.",
      },
      {
        id: "rubric-dashboard",
        label: "Dashboard rubric",
        path: "/grading/rubrics/dashboard-v1",
        file: "docs/grading/rubrics/dashboard-v1.md",
        intro: "Version 1 of the frozen judge rubric for dashboards.",
      },
      {
        id: "rubric-diagram",
        label: "Diagram rubric",
        path: "/grading/rubrics/diagram-v1",
        file: "docs/grading/rubrics/diagram-v1.md",
        intro: "Version 1 of the frozen judge rubric for figures.",
      },
    ],
  },
] as const satisfies readonly DocsGroupEntry[];

/** Every page in reading order, with its group's id. */
export const docsPages = docsManifest.flatMap((group) =>
  group.pages.map((page): DocsPageEntry & { group: string } => ({ ...page, group: group.id })),
);

/** The page that renders `file` as Markdown, else the first that names it: where a link to the file goes. */
export function pageForFile(file: string) {
  const pages = docsPages.filter((page) => page.file === file);
  return pages.find((page) => !page.showcase) ?? pages[0];
}

/** Every Markdown file the site renders or names, once. */
export const docsFiles = [...new Set(docsPages.map((page) => page.file))];

/** "Edit on GitHub" for a repo file. */
export const editUrl = (file: string) => `${REPO_URL}/edit/main/${file}`;
/** A repo file on GitHub, for links the site has no page for. */
export const blobUrl = (file: string) => `${REPO_URL}/blob/main/${file}`;

/**
 * Every site uipack designs for (docs/specs/registry.md is generated from this): where its spec
 * lives, the shared families it uses and the uipack commit it pins. One spec per site; a site
 * reusing another's look names that spec in its own spec's `extends`.
 */
export interface SiteEntry {
  readonly site: string;
  readonly repo: string;
  /** The spec's path: repo-relative in uipack, or `<repo>:STYLE.md` in the site's own repo. */
  readonly spec: string;
  /** "written" when the spec exists; otherwise what is still to do. */
  readonly specStatus: "written" | "todo";
  readonly families: readonly string[];
  /** The uipack commit the site installs; "current" for uipack itself. */
  readonly pins: string;
  readonly notes: string;
}

export const siteRegistry: readonly SiteEntry[] = [
  {
    site: "uipack (docs site and package defaults)",
    repo: "ong6/uipack",
    spec: "docs/specs/technical.md",
    specStatus: "written",
    families: ["diagrams"],
    pins: "current",
    notes: "Technical, the implemented style (src/styles/technical.css)",
  },
  {
    site: "junxiong.dev",
    repo: "ong6/junxiong-homepage",
    spec: "junxiong-homepage:STYLE.md",
    specStatus: "todo",
    families: ["diagrams"],
    pins: "e6b6ed7",
    notes: "TODO: spec not written (on hold); a Chakra theme maps the --uipack-* variables",
  },
  {
    site: "notes.junxiong.dev",
    repo: "ong6/junxiong-notes",
    spec: "junxiong-notes:STYLE.md",
    specStatus: "todo",
    families: ["diagrams"],
    pins: "3886f0d",
    notes: "TODO: spec not written (on hold); warm paper #fffdf9, rust accent #9a3412, serif and sans",
  },
];
