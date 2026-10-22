# UIPACK documentation

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
- [Component-first workflow](component-first.md): build, register, verify, then consume significant UI.
- [Web principles](web-principles.md): the Landing style's numbered rules (`uipack/web`), each with its number and source video, including motion and backgrounds.
- [Charts](charts.md): `SpanChart` (companies on the layers of a stack, with CSS-only layer, size and deals filters) and `LayerStack` (a bottom-up layer diagram with zone notes and cross-cutting rails), both static HTML with no JavaScript.
- [Article parts](article.md): `uipack/article` (NoteCard, NoteCluster, LayerHead, TermList, Callout, ChangeNote, LinkList), the labelled blocks of a long article section, with the HTML and class contract for hosts that emit the markup without React.
- [Product documentation layout](docs-layout.md): the `uipack/docs` shell, Markdown renderer, navigation, anchors, and responsive behavior.
- [Portfolio ideas](portfolio-ideas.md): prioritized places where `uipack/web` pieces would improve junxiong.dev, and what to avoid.
- [Mechanism style](mechanism.md): `uipack/mechanism`, crafted isometric machines after Anatomy (MIT); the verification gate, its pose API for slides, and how to build a new machine.
- [Object scenes](objects.md): seven reusable, lazy 3D illustrations and their player.
