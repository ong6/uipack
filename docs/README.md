# UIPACK documentation

- **[Design system](system/README.md): start here.** The philosophy and the three independent layers, [style](system/style.md), [writing](system/writing.md) and [layout](system/layout.md), each with sections for diagrams, slides, web, motion and 3D.
- [Design direction](design-direction.md): visual style, catalog taxonomy, mobile interaction, and presentation composition.
- The diagrams page (`/` in the playground) is the figure design system: one section per diagram pattern, simplest first, each with when to use it and the parts it is built from. Its sections are `figureEntries` in `playground/catalog.ts`; add a pattern there and in `playground/figures/` the first time a published figure uses it.
- [3D animation API](slides.md): scenes, camera stops, animation settings, and integration. The `slides` filename and API remain compatible.
- [Presentation starters](presentations.md): typed layouts, speaker guides, and editable SVG output.
- [Deck player](deck.md): one transition grammar (advance, morph, zoom), builds, overview, speaker and read views.
- [Deck storytelling](deck-storytelling.md): storyline templates, slide roles and the checks `lintDeck` runs.
- [Consulting slides](deck-consulting.md): dense deck slides (tracker, action title, panels, so what, footnotes) and their charts: bars, waterfall, stacked bars, lines, KPI tiles, Harvey tables and a 2×2.
- [Canvas and selection](interaction.md): mobile reading, item selection, expanded inspection, and limits.
- [Drill-down figures](drill.md): `DrillFigure` and `DrillNode`, a stack of figures where a node zooms open into its own figure, with the glow affordance, breadcrumb, keyboard, reduced motion and static export.

Agent instructions live in [AGENTS.md](../AGENTS.md). Setup and verification live in the [root README](../README.md).
- [Contributing](contributing.md): step-by-step recipes with the exact files to touch for a new visual style (from a [site spec](specs/README.md)), playground page, example deck, slide part or chart, figure pattern, Mechanism machine and package entry, plus the shared helpers and prop names to reuse.
- [Component-first workflow](component-first.md): build, register, verify, then consume significant UI.
- [Web principles](web-principles.md): the numbered rules for `uipack/web` pages (in Technical, the implemented style), each with its number and source video, including motion and backgrounds.
- [Site specs](specs/README.md): one spec per website, the [template](specs/TEMPLATE.md), the [Technical spec](specs/technical.md) and the [registry](specs/registry.md); the shared [diagram family](families/diagrams.md); [what a spec may set](system/spec-settings.md).
- [Web discoverability](web-discoverability.md): how a `uipack/web` page gets found and quoted by search and answer engines: the checklist, `pageMeta`, JSON-LD builders, `FAQ`, `buildCrawlFiles` (robots.txt with an AI-crawler stance, sitemap.xml, llms.txt), `fontPreloads`, and measured before/after numbers.
- [Charts](charts.md): `SpanChart` (companies on the layers of a stack, with CSS-only layer, size and deals filters) and `LayerStack` (a bottom-up layer diagram with zone notes and cross-cutting rails), both static HTML with no JavaScript.
- [Article parts](article.md): `uipack/article` (NoteCard, NoteCluster, LayerHead, TermList, Callout, ChangeNote, LinkList), the labelled blocks of a long article section, with the HTML and class contract for hosts that emit the markup without React.
- [Product documentation layout](docs-layout.md): the `uipack/docs` shell, Markdown renderer, navigation, anchors, and responsive behavior.
- [Portfolio ideas](portfolio-ideas.md): prioritized places where `uipack/web` pieces would improve junxiong.dev, and what to avoid.
- [Mechanism style](mechanism.md): `uipack/mechanism`, crafted isometric machines after Anatomy (MIT); the verification gate, its pose API for slides, and how to build a new machine.
- [Object scenes](objects.md): seven reusable, lazy 3D illustrations and their player.

## Site map

Every page of the docs site, by sidebar group, linked to the file it renders. Generated from
`playground/docs-manifest.ts` by `npm run docs:sync`; edit the manifest, not this list.

<!-- generated:site-map -->
- **Start here:** [What UiPack is](README.md), [Install and use](../README.md)
- **Rules:** [Overview](system/README.md), [Style contract](system/style.md), [Writing](system/writing.md), [Layout](system/layout.md), [What a spec may set](system/spec-settings.md), [Mix and match](system/README.md), [Recipes](system/layout.md), [Do and don't](system/writing.md)
- **Components:** [Architecture diagrams](../README.md), [Drill-down figures](drill.md), [Charts](charts.md), [Article parts](article.md), [Deck player: Tech talk](deck.md), [Deck player: Bento](deck.md), [Deck player: Consulting](deck-consulting.md), [Deck storytelling](deck-storytelling.md), [Slide starters](presentations.md), [3D animations](slides.md), [3D object scenes](objects.md), [Mechanism](mechanism.md), [Docs layout](docs-layout.md)
- **Families:** [Diagrams](families/diagrams.md)
- **Specs:** [How to write a spec](specs/README.md), [Spec template](specs/TEMPLATE.md), [Technical](specs/technical.md), [Registry](specs/registry.md)
- **Examples:** [Web UI](web-principles.md)
- **Reference:** [Icons & marks](../README.md), [Contributing](contributing.md), [Component-first](component-first.md), [Design direction](design-direction.md), [Canvas and selection](interaction.md), [Web principles](web-principles.md), [Web discoverability](web-discoverability.md), [Portfolio ideas](portfolio-ideas.md)
- **Grading:** [How to grade](grading/README.md), [Mechanical checks](grading/tier-1.md), [Pairwise judging](grading/protocol.md), [Calibration anchors](grading/calibration.md), [Regression set](grading/regression.md), [Landing rubric](grading/rubrics/landing-v1.md), [Docs rubric](grading/rubrics/docs-v1.md), [Deck rubric](grading/rubrics/deck-slide-v1.md), [Dashboard rubric](grading/rubrics/dashboard-v1.md), [Diagram rubric](grading/rubrics/diagram-v1.md)
<!-- /generated -->
