/**
 * The docs site's one manifest: the five sidebar sections, the groups in each (a caption in the
 * sidebar), their pages in reading order, each page's route and the Markdown file it renders.
 * Everything else reads it: the sidebar, the phone drawer and the pager (ShowcaseShell via
 * catalog.ts), the route table (routes.ts), "View as Markdown" and "Edit on GitHub", the raw files
 * the dev server and the build serve (vite.config.ts), the search index (playground/search-index.ts),
 * `llms.txt` and the site map in docs/README.md (`npm run docs:sync`), and the test that fails
 * when a page has no file or a docs file has no page (test/docs-manifest.test.ts).
 *
 * Every page renders its `file` through DocsMarkdown (MarkdownShowcase.tsx). The live demos it shows
 * are named in the file, each in a fenced block ("```uipack-demo <id>", registered in
 * playground/demos.tsx); `demos` places one the file does not name, before the heading `at`.
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
  /** One sentence: what the page is for; llms.txt's description. */
  readonly intro: string;
  /** What `file` is for, when `intro` describes the page's demo instead (llms.txt reads this first). */
  readonly summary?: string;
  /** The repo-relative Markdown file the page renders. */
  readonly file: string;
  /** The page this one is a sub-page of: the sidebar lists it indented under that page. */
  readonly parent?: string;
  readonly demos?: readonly { readonly id: string; readonly at?: string }[];
  /** The page's demos need the whole content width (a gallery of figures, charts, a 3D scene): no "On this page" column. */
  readonly fullWidth?: boolean;
  /**
   * The file is a sample to copy whose own `#` is a placeholder (the spec template): the page's h1
   * is `label`, and the file's `#` follows as an h2. The file itself is unchanged.
   */
  readonly sampleFile?: boolean;
  /** The page hosts a complete sample page with its own h1 (the /web sample). */
  readonly hostsPage?: boolean;
  /**
   * A demo on the page takes the whole window (the deck's present view scrolls its stage to the top
   * edge): the site's banner scrolls away with the page instead of sticking over it.
   */
  readonly fullWindow?: boolean;
  /** The `visualStyles` name the page's content uses; default "Technical". */
  readonly styleName?: string;
}

/**
 * A sidebar section: one of the five places a reader looks (Start, Rules, Build, Check, Reference).
 * Each has its icon and navigation hue (the site's spec, docs/specs/docs-site.md: the hue marks only
 * the section's heading icon, the current-page marker and the page's breadcrumb chip).
 */
export interface DocsSectionEntry {
  readonly id: string;
  readonly label: string;
  /** One line: what a reader finds there (the section's tooltip and the search result group). */
  readonly summary: string;
}

export const docsSections = [
  { id: "start", label: "Start", summary: "What UiPack is, how to install it, and the read order for agents" },
  { id: "rules", label: "Rules", summary: "The core rules every site keeps, and the site specs that set the rest" },
  { id: "build", label: "Build", summary: "Recipes, components, component looks and worked examples" },
  { id: "check", label: "Check", summary: "Grading, rubrics, testing and the checks that run on your work" },
  { id: "reference", label: "Reference", summary: "The site registry, icons, releases, contributing and web reference" },
] as const satisfies readonly DocsSectionEntry[];

export type DocsSectionId = (typeof docsSections)[number]["id"];

/**
 * A group of pages inside a section, in reading order. Its label is a caption above its pages in
 * the sidebar (`caption: false` for a section's untitled first group).
 */
export interface DocsGroupEntry {
  readonly id: string;
  readonly label: string;
  readonly section: DocsSectionId;
  readonly caption?: false;
  readonly pages: readonly DocsPageEntry[];
}

export const REPO_URL = "https://github.com/ong6/uipack";

export const docsManifest = [
  {
    id: "start",
    label: "Start here",
    section: "start",
    caption: false,
    pages: [
      {
        id: "start",
        label: "What UiPack is",
        path: "/what-uipack-is",
        file: "docs/README.md",
        intro:
          "What UiPack is, who it is for (people and agents), how its layers fit, where to start and how to install it, then every page of the docs.",
      },
      {
        id: "install",
        label: "Install and use UiPack",
        path: "/start/install",
        file: "README.md",
        intro: "Install the package, draw a first figure, and the entries for charts, articles, 3D, web pages, decks and docs.",
      },
      {
        id: "agents",
        label: "How agents use UiPack",
        path: "/agents",
        file: "docs/agents/README.md",
        intro:
          "The read order for an agent: the job's skill, the site's spec, the core rules, then the parts; what is fixed and what each site sets.",
      },
      {
        id: "agents-multi",
        label: "Multi-agent build",
        path: "/agents/multi-agent-build",
        file: "docs/agents/multi-agent-build.md",
        intro:
          "How a lead splits a website across subagents: what the lead owns, what a subagent never decides, the hand-off and the review pass.",
        parent: "agents",
      },
      {
        id: "agents-brief",
        label: "Subagent brief",
        path: "/agents/subagent-brief",
        file: "docs/agents/subagent-brief.md",
        intro: "The copy-paste brief for one subagent building one page or section: inputs, limits, outputs and the self-check.",
        parent: "agents",
      },
      {
        id: "agents-new-site",
        label: "Starting a new website",
        path: "/agents/new-website",
        file: "docs/agents/new-website.md",
        intro: "A new site gets its spec first: write it from the template, check it, register it, then build.",
        parent: "agents",
      },
    ],
  },
  {
    id: "foundations",
    label: "Core rules",
    section: "rules",
    caption: false,
    pages: [
      {
        id: "foundations",
        label: "Core rules",
        path: "/foundations",
        file: "docs/system/README.md",
        intro:
          "The core rules: the philosophy, the three independent layers (style, writing, layout), what each owns and where one leaks into another.",
      },
      {
        id: "foundations-style",
        label: "Style contract",
        path: "/foundations/style",
        file: "docs/system/style.md",
        intro: "The roles every site spec fills and the ornament slots it paints, with this site's values (Technical) live.",
      },
      {
        id: "foundations-writing",
        label: "Writing",
        path: "/foundations/writing",
        file: "docs/system/writing/README.md",
        intro: "The writing rules, by kind of text, and every length they state, generated from the code.",
      },
      {
        id: "writing-general",
        parent: "foundations-writing",
        label: "General writing rules",
        path: "/foundations/writing/general",
        file: "docs/system/writing/general.md",
        intro: "The rules every kind of text follows, where each word lives, and every slot's text budget.",
      },
      {
        id: "writing-talks",
        parent: "foundations-writing",
        label: "Talks and slides",
        path: "/foundations/writing/talks",
        file: "docs/system/writing/talks.md",
        intro: "How to write a deck you present: titles, points, speaker cues, order and the ask.",
      },
      {
        id: "writing-documents",
        parent: "foundations-writing",
        label: "Read-alone documents",
        path: "/foundations/writing/documents",
        file: "docs/system/writing/documents.md",
        intro: "How to write what is read without its author: pre-reads, read-alone decks, documentation, articles.",
      },
      {
        id: "writing-web",
        parent: "foundations-writing",
        label: "Web and landing copy",
        path: "/foundations/writing/web",
        file: "docs/system/writing/web.md",
        intro: "How to write a product or launch page: the goal, the hero, section heads, proof and the FAQ.",
      },
      {
        id: "writing-figures",
        parent: "foundations-writing",
        label: "Figure labels and captions",
        path: "/foundations/writing/figures",
        file: "docs/system/writing/figures.md",
        intro: "How to write a figure's words: caption, labels, arrows, statistics, motion beats and 3D stops.",
      },
      {
        id: "foundations-layout",
        label: "Layout",
        path: "/foundations/layout",
        file: "docs/system/layout/README.md",
        intro:
          "The layout floors every site keeps, the library of layout archetypes a spec picks from, and the layout of figures, motion and 3D.",
      },
      {
        id: "layout-landing",
        parent: "foundations-layout",
        label: "Landing layout",
        path: "/foundations/layout/landing",
        file: "docs/system/layout/landing.md",
        intro: "The product landing archetype: its grid, section archetypes, order, and product surfaces at a phone's width.",
      },
      {
        id: "layout-documentation",
        parent: "foundations-layout",
        label: "Documentation layout",
        path: "/foundations/layout/documentation",
        file: "docs/system/layout/documentation.md",
        intro: "The docs shell archetype: a reading page's regions and the order inside it.",
      },
      {
        id: "layout-article",
        parent: "foundations-layout",
        label: "Article layout",
        path: "/foundations/layout/article",
        file: "docs/system/layout/article.md",
        intro: "The layered long read archetype: one text column and the parts of each section.",
      },
      {
        id: "layout-deck-slide",
        parent: "foundations-layout",
        label: "Deck slide layout",
        path: "/foundations/layout/deck-slide",
        file: "docs/system/layout/deck-slide.md",
        intro:
          "The slide canvas archetype: the canvas, the regions every slide shares, the slide archetypes and the transitions.",
      },
      {
        id: "layout-dashboard",
        parent: "foundations-layout",
        label: "Dashboard layout",
        path: "/foundations/layout/dashboard",
        file: "docs/system/layout/dashboard.md",
        intro: "The one-question dashboard archetype: its regions, equal boxes, and the narrow form.",
      },
      {
        id: "spec-settings",
        label: "What a spec may set",
        path: "/foundations/spec-settings",
        file: "docs/system/spec-settings.md",
        intro:
          "The boundary between a site spec and the core rules: a site's look, layout, writing style and component looks, and what holds on every site.",
      },
      {
        id: "foundations-dont",
        label: "Do and don't",
        path: "/foundations/do-and-dont",
        file: "docs/system/do-and-dont.md",
        intro: "Paired examples of the rules, drawn live, and the checklist of generic AI-landing tropes to keep out.",
      },
      {
        id: "design-direction",
        label: "Design direction",
        path: "/reference/design-direction",
        file: "docs/design-direction.md",
        intro: "The playground's visual direction, catalog taxonomy, interaction polish and presentation composition.",
      },
      {
        id: "web-principles",
        label: "Web principles",
        path: "/reference/web-principles",
        file: "docs/web-principles.md",
        intro: "The numbered rules for uipack/web pages, each with its number and source, motion and backgrounds included.",
      },
      {
        id: "smooth-scroll",
        parent: "web-principles",
        label: "Smooth scrolling",
        path: "/reference/web-principles/smooth-scroll",
        file: "docs/web-smooth-scroll.md",
        intro: "How SmoothScroll eases the wheel on a landing page, what stays native, anchors and its API.",
      },
    ],
  },
  {
    id: "specs",
    label: "Site specs",
    section: "rules",
    pages: [
      {
        id: "styles",
        label: "How to write a spec",
        path: "/styles",
        file: "docs/specs/README.md",
        intro:
          "One spec per website: its look, layout, writing style and component looks on top of the core rules; how to write and check one, and how it becomes a live style.",
      },
      {
        id: "spec-template",
        label: "Spec template",
        path: "/specs/template",
        file: "docs/specs/TEMPLATE.md",
        sampleFile: true,
        intro:
          "The file a new site spec starts from: the frontmatter (pages, layouts, component looks) and the sections the checker requires.",
      },
      {
        id: "spec-technical",
        label: "Technical spec",
        path: "/specs/technical",
        file: "docs/specs/technical.md",
        demos: [
          {
            id: "style-catalog",
            at: "type",
          },
        ],
        intro:
          "The package's default look, which the docs site extends: Cyanotype, Prussian ink and one amber mark, IBM Plex, with its role values generated from the style file.",
      },
      {
        id: "spec-docs-site",
        label: "Docs site spec",
        path: "/specs/docs-site",
        file: "docs/specs/docs-site.md",
        intro:
          "The spec of ui.junxiong.dev: Technical's look with its own darker dark palette, the four navigation hues and the travelling location marker.",
      },
    ],
  },
  {
    id: "recipes",
    label: "Recipes",
    section: "build",
    pages: [
      {
        id: "recipes",
        label: "Recipes",
        path: "/recipes",
        file: "docs/recipes/README.md",
        intro: "One recipe per page type: the section order, the parts to use, and the rules each relies on.",
      },
      {
        id: "recipe-landing",
        label: "Build a landing page",
        path: "/recipes/landing",
        file: "docs/recipes/landing.md",
        intro: "Build a landing page: the section order the example renders, the parts per section, the steps.",
      },
      {
        id: "recipe-documentation",
        label: "Build a docs page",
        path: "/recipes/documentation",
        file: "docs/recipes/documentation.md",
        intro: "Build a reading page: the order inside it, the docs and article parts, the steps.",
      },
      {
        id: "recipe-deck-slide",
        label: "Build a deck",
        path: "/recipes/deck-slide",
        file: "docs/recipes/deck-slide.md",
        intro: "Build a deck: the storylines, the slide roles, the parts and every check lintDeck runs.",
      },
      {
        id: "recipe-dashboard",
        label: "Build a dashboard",
        path: "/recipes/dashboard",
        file: "docs/recipes/dashboard.md",
        intro: "Build a dashboard: the order, the parts, the steps.",
      },
    ],
  },
  {
    id: "components",
    label: "Components",
    section: "build",
    pages: [
      {
        id: "figures",
        fullWidth: true,
        label: "Architecture diagrams",
        path: "/components/diagrams",
        file: "docs/diagrams.md",
        intro:
          "The diagram catalogue: each figure pattern once, from the bare canvas to a figure you drill into, with the parts it is built from.",
      },
      {
        id: "drill",
        label: "Drill-down figures",
        path: "/components/drill",
        file: "docs/drill.md",
        intro: "A stack of figures where a node zooms open into its own figure: the parts, keyboard, reduced motion and export.",
      },
      {
        id: "figure-api",
        label: "Figure parts API",
        path: "/components/figure-api",
        file: "docs/figure-api.md",
        intro:
          "Every figure part and its props, the connector rule, hover, motion, theming, the seven presets and static SVG export.",
      },
      {
        id: "charts",
        fullWidth: true,
        label: "Charts",
        path: "/charts",
        file: "docs/charts.md",
        intro: "SpanChart and LayerStack: layered and comparative charts for articles, static HTML with no JavaScript.",
      },
      {
        id: "article",
        label: "Article parts",
        path: "/article",
        file: "docs/article.md",
        intro: "The labelled blocks of a long article section, with their HTML and class contract.",
      },
      {
        id: "deck",
        summary:
          "The deck player: one transition grammar (advance, morph, zoom), builds, the overview, the speaker and read views, keyboard and touch.",
        label: "Tech talk",
        title: "Deck player",
        path: "/deck",
        fullWindow: true,
        query: {
          deck: "moves",
        },
        isDefault: true,
        file: "docs/deck.md",
        intro:
          "The deck player's guide, with the Tech talk example: reviews should open with their answer, every slide advancing except one morph and one zoom.",
      },
      {
        id: "deck-bento",
        label: "Bento",
        title: "Deck player",
        path: "/deck",
        fullWindow: true,
        query: {
          deck: "bento",
        },
        file: "docs/deck.md",
        intro: "The deck player's guide, with the Bento example: a quarterly review on one bento slide the camera tours.",
      },
      {
        id: "deck-consulting",
        summary:
          "Dense consulting slides and their charts: tracker, action title, panels, so-what, footnotes, bars, waterfall, stacked bars, lines, KPI tiles, Harvey tables and a 2×2.",
        label: "Consulting",
        title: "Deck player",
        path: "/deck",
        fullWindow: true,
        query: {
          deck: "consulting",
        },
        file: "docs/deck-consulting.md",
        intro:
          "Consulting slides, with the example decision request: dense charts, a so-what panel and sources, written read-alone.",
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
        fullWidth: true,
        label: "Slide starters",
        path: "/presentations",
        file: "docs/presentations.md",
        intro: "Slide layouts with their speech notes, then a complete five-chapter narrative built from them.",
      },
      {
        id: "animations",
        fullWidth: true,
        label: "3D animations",
        path: "/animations",
        file: "docs/slides.md",
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
        fullWidth: true,
        label: "Mechanism",
        path: "/mechanism",
        file: "docs/mechanism.md",
        intro: "Mechanical drawings that explain how a system moves, one part at a time.",
      },
      {
        id: "docs",
        label: "Docs layout",
        path: "/docs",
        file: "docs/docs-layout.md",
        intro: "A three-column product documentation shell with responsive navigation and Markdown prose.",
      },
      {
        id: "web-api",
        label: "Web parts API",
        path: "/reference/web-api",
        file: "docs/web-api.md",
        intro: "The uipack/web parts with their props: page parts, motion, backgrounds, type and scoping.",
      },
    ],
  },
  {
    id: "looks",
    label: "Component looks",
    section: "build",
    pages: [
      {
        id: "component-looks",
        label: "Component looks",
        path: "/looks",
        file: "docs/components/README.md",
        intro:
          "Each component's named looks, fixed (the same on every site) or flex (taking the site's palette and faces), and how a spec picks them.",
      },
      {
        id: "component-diagrams",
        label: "Diagram look and themes",
        path: "/looks/diagrams",
        file: "docs/components/diagrams.md",
        intro:
          "The Blueprint look and diagram themes: one grammar on every site, colours, faces and ground from a theme; the theme API, the user-flow and sequence parts, the node strip.",
      },
      {
        id: "component-3d",
        label: "3D looks",
        path: "/looks/3d",
        file: "docs/components/3d.md",
        intro: "The six 3D looks, which subjects offer each, and which one takes the site's palette.",
      },
      {
        id: "component-mechanism",
        label: "Mechanism look",
        path: "/looks/mechanism",
        file: "docs/components/mechanism.md",
        intro: "The isometric machine look: its fixed drawing and the roles it takes from the site.",
      },
    ],
  },
  {
    id: "examples",
    label: "Examples",
    section: "build",
    pages: [
      {
        id: "web",
        label: "Example landing page",
        path: "/web",
        file: "docs/examples/landing-page.md",
        hostsPage: true,
        intro: "A landing page built with uipack/web in Technical, how it is built, and every part it is made of.",
      },
      {
        id: "example-text",
        label: "Example text page",
        path: "/examples/text-page",
        file: "docs/examples/text-page.md",
        intro: "A documentation page written to the read-alone rules: how to check a deck before you present it.",
      },
    ],
  },
  {
    id: "grading",
    label: "Grading",
    section: "check",
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
        id: "grading-agent-docs",
        label: "Grading docs for agents",
        path: "/grading/agent-docs",
        file: "docs/grading/agent-docs.md",
        intro:
          "How to grade uipack's own docs for their agent readers: the mechanical check, task-based judging and the frozen tasks.",
      },
    ],
  },
  {
    id: "rubrics",
    label: "Rubrics",
    section: "check",
    pages: [
      {
        id: "rubric-landing",
        label: "Landing page rubric",
        path: "/grading/rubrics/landing-v1",
        file: "docs/grading/rubrics/landing-v1.md",
        intro: "Version 1 of the frozen judge rubric for landing pages.",
      },
      {
        id: "rubric-docs",
        label: "Docs and article rubric",
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
      {
        id: "rubric-agent-docs",
        label: "Agent docs rubric",
        path: "/grading/rubrics/agent-docs-v1",
        file: "docs/grading/rubrics/agent-docs-v1.md",
        intro:
          "Version 1 of the frozen rubric for a documentation set read by agents: routing, progressive disclosure, index, executable rules, currency, stop conditions.",
      },
    ],
  },
  {
    id: "testing",
    label: "Testing",
    section: "check",
    pages: [
      {
        id: "testing",
        label: "Testing",
        path: "/reference/testing",
        file: "docs/testing.md",
        intro: "What the unit and browser suites check, how CI runs them and the known engine quirks.",
      },
      {
        id: "article-verification",
        label: "Article verification",
        path: "/components/article/verification",
        file: "docs/article-verification.md",
        intro: "How the article parts are tested, the measured section rhythm and screenshots.",
      },
      {
        id: "deck-lint-rules",
        label: "lintDeck rules",
        path: "/components/deck-lint-rules",
        file: "docs/deck-lint-rules.md",
        intro: "Every check lintDeck runs on a deck's words, with its severity, generated from LINT_RULES.",
      },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    section: "reference",
    caption: false,
    pages: [
      {
        id: "spec-registry",
        label: "Site registry",
        path: "/specs/registry",
        file: "docs/specs/registry.md",
        intro:
          "Every site uipack designs for: where its spec lives, the component looks it picks and the uipack release it pins.",
      },
      {
        id: "assets",
        label: "Icons and marks",
        path: "/assets",
        file: "docs/icons-and-marks.md",
        intro: "Searchable icons, marks, canvas backgrounds and motion tokens, each with a preview and a copy button.",
      },
      {
        id: "releases",
        label: "Releases",
        path: "/reference/releases",
        file: "docs/releases.md",
        intro: "How a version is cut: semver for this repo, the changelog, the tag on main, and how each site moves its pin.",
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
        id: "interaction",
        label: "Canvas and selection",
        path: "/reference/interaction",
        file: "docs/interaction.md",
        intro: "Mobile reading, item selection, expanded inspection and their limits.",
      },
      {
        id: "discoverability",
        label: "Web discoverability",
        path: "/reference/discoverability",
        file: "docs/web-discoverability.md",
        intro: "How a uipack/web page gets found and quoted by search and answer engines: the checklist and the crawler stance.",
      },
      {
        id: "discoverability-head",
        parent: "discoverability",
        label: "Head and structured data",
        path: "/reference/discoverability/head",
        file: "docs/web-discoverability/head-and-structured-data.md",
        intro: "pageMeta, the head helpers, font preloads, the JSON-LD builders and the FAQ.",
      },
      {
        id: "discoverability-crawl",
        parent: "discoverability",
        label: "Crawl files",
        path: "/reference/discoverability/crawl-files",
        file: "docs/web-discoverability/crawl-files.md",
        intro: "buildCrawlFiles for robots.txt, sitemap.xml and llms.txt, rssFeed, and Section lazyRender.",
      },
      {
        id: "discoverability-performance",
        parent: "discoverability",
        label: "Web performance",
        path: "/reference/discoverability/performance",
        file: "docs/web-discoverability/performance.md",
        intro: "Load and paint numbers measured on the /web demo, the method, and what changed each.",
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
] as const satisfies readonly DocsGroupEntry[];

/**
 * Old routes that still open a page (routes.ts adds them to the route table): the Families group
 * became Component looks on 2026-11-06.
 */
export const docsRedirects: Readonly<Record<string, string>> = {
  "/families": "component-looks",
  "/families/diagrams": "component-diagrams",
};

/** Every page in reading order, with its group's id. */
export const docsPages = docsManifest.flatMap((group) =>
  group.pages.map((page): DocsPageEntry & { group: string } => ({ ...page, group: group.id })),
);

/** The first page that renders `file`: where a link to the file goes. */
export function pageForFile(file: string) {
  return docsPages.find((page) => page.file === file);
}

/** Every Markdown file the site renders or names, once. */
export const docsFiles = [...new Set(docsPages.map((page) => page.file))];

/** "Edit on GitHub" for a repo file. */
export const editUrl = (file: string) => `${REPO_URL}/edit/main/${file}`;
/** A repo file on GitHub, for links the site has no page for. */
export const blobUrl = (file: string) => `${REPO_URL}/blob/main/${file}`;

/**
 * Every site uipack designs for (docs/specs/registry.md is generated from this): where its spec
 * lives, the component looks it picks and the uipack release it pins. One spec per site; a site
 * reusing another's look names that spec in its own spec's `extends`.
 */
export interface SiteEntry {
  readonly site: string;
  readonly repo: string;
  /** The spec's path: repo-relative in uipack, or `<repo>:STYLE.md` in the site's own repo. */
  readonly spec: string;
  /** "written" when the spec exists; otherwise what is still to do. */
  readonly specStatus: "written" | "todo";
  /** The component looks it picks, as `component: look` (its spec's `components:`). */
  readonly components: readonly string[];
  /** What the site installs: a release tag (`v0.2.0`) or, before it moves to one, a commit; "current" for uipack itself. */
  readonly pins: string;
  readonly notes: string;
}

export const siteRegistry: readonly SiteEntry[] = [
  {
    site: "uipack package defaults",
    repo: "ong6/uipack",
    spec: "docs/specs/technical.md",
    specStatus: "written",
    components: ["diagrams: blueprint (theme: blueprint)", "3d: all six", "mechanism: isometric"],
    pins: "current",
    notes: "Technical, the implemented style (src/styles/technical.css): what every part renders in when a site sets nothing",
  },
  {
    site: "ui.junxiong.dev (the uipack docs site)",
    repo: "ong6/uipack",
    spec: "docs/specs/docs-site.md",
    specStatus: "written",
    components: ["diagrams: blueprint (theme: docs-night)", "3d: all six", "mechanism: isometric"],
    pins: "current",
    notes:
      "Extends Technical with its own dark palette, navigation hues and location marker (playground/site-palette.css, playground/site-settings.tsx); light is Technical's",
  },
  {
    site: "junxiong.dev",
    repo: "ong6/junxiong-homepage",
    spec: "junxiong-homepage:STYLE.md",
    specStatus: "written",
    components: ["diagrams: blueprint (themes: site default; compoze and trading pages may have their own)"],
    pins: "v0.5.0",
    notes:
      "STYLE.md on the site's main (passes check-spec). Decided 2026-11-07: diagrams follow a theme, the site's default plus optional per-page themes (Compoze, Trading Engine). Still to do: replace the --uipack-* overrides in globals.css with one diagramThemeCss and the site-local userflow.js / sequence.js with uipack's parts (CHANGELOG 0.3.0); declare diagram-themes in STYLE.md",
  },
  {
    site: "notes.junxiong.dev",
    repo: "ong6/junxiong-notes",
    spec: "junxiong-notes:STYLE.md",
    specStatus: "written",
    components: ["diagrams: blueprint (theme: the blog's own, one for every post)"],
    pins: "v0.5.0",
    notes:
      "STYLE.md on the site's main (passes check-spec). Decided 2026-11-07: diagrams follow the blog's one theme, so UI diagrams in posts match. Still to do (the site-ui-2 attempt was deleted unmerged): replace the THEMES palette in content/figures/_shared.tsx with one defineDiagramTheme passed to renderStatic with mode (CHANGELOG 0.3.0); declare diagram-themes in STYLE.md. Open owner decision: self-hosting its serif",
  },
];
