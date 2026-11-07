# What UiPack is

UiPack is Jun Xiong's own design system: diagrams, slides, web pages, motion and 3D for his sites
(the [registry](specs/registry.md)) and work presentations, as React and SVG components with the
rules for writing and laying them out. This page says who reads it, how it is built and where to
start, then lists every page of these docs.

## Who it is for

- **Agents first.** An agent building a page, deck, figure or copy for one of the owner's sites
  reads these files as Markdown, from `node_modules/uipack/docs/` in a site or a clone. Start at
  [For agents](agents/README.md); [`llms.txt`](../llms.txt) lists every file with one line on what
  it is for. Each file opens with what it is for and who should read it, so you can stop after the
  first paragraph, and it is headed so you can jump to your part (`scripts/check-agent-docs.ts`
  checks both).
- **The owner** reviews the same pages on the docs site, where each one shows its live demos.
- **Not a public product.** The only consumers are the sites in the registry, so there is no
  compatibility promise beyond them.

The site and the files are one source: every page renders the Markdown file named under its
title ("View as Markdown").

## How it is built

Each website has its own layout, writing style, theme, fonts and design direction, all in its spec;
the core rules keep only what must hold everywhere, and the libraries give a spec named layouts and
component looks to pick from. A deck is a page of a site, so it reads the same spec.

| Layer | What it holds | Start with |
| --- | --- | --- |
| Core rules | What every site keeps: the role contract, the layout floors, the core writing rules and slot ceilings | [Design system overview](system/README.md) |
| Layout archetypes | Named layouts per page type (grid, regions, section order, hero) a spec picks, extends or replaces | [Layout](system/layout/README.md) |
| Component looks | Each component's named looks, `fixed` (the same on every site, like the diagrams) or `flex` (taking the site's roles) | [Component looks](components/README.md) |
| Site specs | One per website: its roles, a layout per page type, its writing style and the looks it picks; built from a template and checked | [How to write a spec](specs/README.md), [what a spec may set](system/spec-settings.md), [Technical](specs/technical.md) |
| Recipes | One per page type: the parts and the rules it relies on | [Recipes](recipes/README.md) |
| Components | The parts, each with its live demo | [Diagram catalogue](diagrams.md), [Deck player](deck.md), [Web principles](web-principles.md) |

## Where to start

| You want to | Read |
| --- | --- |
| Work as an agent or split a site across subagents | [For agents](agents/README.md): read order, the [multi-agent build](agents/multi-agent-build.md) and the [subagent brief](agents/subagent-brief.md); job skills in [`skills/`](../skills/README.md) |
| Build a landing page | [Landing recipe](recipes/landing.md), then the [example](examples/landing-page.md) |
| Write documentation or an article | [Documentation recipe](recipes/documentation.md), then the [example](examples/text-page.md) |
| Make a deck | [Deck recipe](recipes/deck-slide.md), then the [Deck player](deck.md) |
| Draw a diagram | [The Blueprint look](components/diagrams.md), [figure labels and captions](system/writing/figures.md), then the [catalogue](diagrams.md) |
| Give a site its own look, layout and voice | [How to write a spec](specs/README.md) and [what a spec may set](system/spec-settings.md) |
| Add a part to the library | [Contributing](contributing.md) and [component-first](component-first.md) |

## Install

UiPack installs from GitHub; `dist/` is committed, so there is no build step on your side.

```sh
npm install github:ong6/uipack
```

Each entry loads only what it draws: `uipack` for figure parts, `uipack/presets` for ready figures,
`uipack/deck` for decks, `uipack/web` for web pages, `uipack/docs` for documentation, and more.
The first figure, every entry with its reference doc, and the setup are in [Install and use](../README.md).

## Site map

Every page of the docs site, by sidebar group, linked to the file it renders. Generated from
`playground/docs-manifest.ts` by `npm run docs:sync`; edit the manifest, not this list.

<!-- generated:site-map -->
- **Start here:** [What UiPack is](README.md), [Install and use](../README.md)
- **For agents:** [How agents use UiPack](agents/README.md), [Multi-agent build](agents/multi-agent-build.md), [Subagent brief](agents/subagent-brief.md), [Starting a new website](agents/new-website.md)
- **Rules:** [Overview](system/README.md), [Style contract](system/style.md), [Writing](system/writing/README.md), [Writing: General rules](system/writing/general.md), [Writing: Talks and slides](system/writing/talks.md), [Writing: Read-alone documents](system/writing/documents.md), [Writing: Web and landing copy](system/writing/web.md), [Writing: Figure labels and captions](system/writing/figures.md), [Layout](system/layout/README.md), [Layout: Landing](system/layout/landing.md), [Layout: Documentation](system/layout/documentation.md), [Layout: Article](system/layout/article.md), [Layout: Deck slide](system/layout/deck-slide.md), [Layout: Dashboard](system/layout/dashboard.md), [What a spec may set](system/spec-settings.md), [Do and don't](system/do-and-dont.md)
- **Recipes:** [Recipes overview](recipes/README.md), [Build a landing page](recipes/landing.md), [Build a docs page](recipes/documentation.md), [Build a deck](recipes/deck-slide.md), [Build a dashboard](recipes/dashboard.md)
- **Components:** [Architecture diagrams](diagrams.md), [Drill-down figures](drill.md), [Figure parts API](figure-api.md), [Charts](charts.md), [Article parts](article.md), [Article parts: Verification](article-verification.md), [Deck player: Tech talk](deck.md), [Deck player: Bento](deck.md), [Deck player: Consulting](deck-consulting.md), [Deck storytelling](deck-storytelling.md), [lintDeck rules](deck-lint-rules.md), [Slide starters](presentations.md), [3D animations](slides.md), [3D object scenes](objects.md), [Mechanism](mechanism.md), [Docs layout](docs-layout.md)
- **Component looks:** [Component looks](components/README.md), [Diagram look](components/diagrams.md), [3D looks](components/3d.md), [Mechanism look](components/mechanism.md)
- **Specs:** [How to write a spec](specs/README.md), [Spec template](specs/TEMPLATE.md), [Technical](specs/technical.md), [Registry](specs/registry.md)
- **Examples:** [Example landing page](examples/landing-page.md), [Example text page](examples/text-page.md)
- **Reference:** [Icons & marks](icons-and-marks.md), [Contributing](contributing.md), [Testing](testing.md), [Releases](releases.md), [Component-first](component-first.md), [Design direction](design-direction.md), [Canvas and selection](interaction.md), [Web principles](web-principles.md), [Web parts API](web-api.md), [Web principles: Smooth scrolling](web-smooth-scroll.md), [Web discoverability](web-discoverability.md), [Web discoverability: Head and structured data](web-discoverability/head-and-structured-data.md), [Web discoverability: Crawl files](web-discoverability/crawl-files.md), [Web discoverability: Performance](web-discoverability/performance.md), [Portfolio ideas](portfolio-ideas.md)
- **Grading:** [How to grade](grading/README.md), [Mechanical checks](grading/tier-1.md), [Pairwise judging](grading/protocol.md), [Calibration anchors](grading/calibration.md), [Regression set](grading/regression.md), [Grading docs for agents](grading/agent-docs.md), [Landing rubric](grading/rubrics/landing-v1.md), [Docs rubric](grading/rubrics/docs-v1.md), [Deck rubric](grading/rubrics/deck-slide-v1.md), [Dashboard rubric](grading/rubrics/dashboard-v1.md), [Diagram rubric](grading/rubrics/diagram-v1.md), [Agent docs rubric](grading/rubrics/agent-docs-v1.md)
<!-- /generated -->
