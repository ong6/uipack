# What UiPack is

UiPack is a design system that draws explanations: diagrams, slides, web pages, motion and 3D,
as React and SVG components with the rules for writing and laying them out. This page says who it
is for, how it is built, where to start and how to install it, then lists every page of these docs.

## Who it is for

- **People** building a page, a deck or a figure: read these pages on the docs site, where each
  one shows its live demos.
- **Agents** doing the same job: read the same files as Markdown, from a clone, from GitHub or
  from `node_modules/uipack/docs/`. Each file says what it is for in its first line, keeps its
  values near the top and stays short enough to read whole; [`llms.txt`](../llms.txt) at the
  package root lists them all, and the agent instructions are in [AGENTS.md](../AGENTS.md) and [For agents](agents/README.md).

The site and the files are one source: every page renders the Markdown file named under its
title ("View as Markdown").

## How it is built

Rules first, then the shared looks, then one spec per site, then the parts:

| Layer | What it holds | Start with |
| --- | --- | --- |
| Core rules | Style, writing and layout as three independent layers, with no site's values | [Design system overview](system/README.md) |
| Recipes | One per page type: the section order, the parts, the rules it relies on | [Recipes](recipes/README.md) |
| Shared families | A look that is the same on every site, diagrams first | [Diagram family](families/diagrams.md) |
| Site specs | One per website, built from a template and checked | [How to write a spec](specs/README.md), [Technical](specs/technical.md) |
| Components | The parts, each with its live demo | [Diagram catalogue](diagrams.md), [Deck player](deck.md), [Web principles](web-principles.md) |

## Where to start

| You want to | Read |
| --- | --- |
| Work as an agent or split a site across subagents | [For agents](agents/README.md): read order, the [multi-agent build](agents/multi-agent-build.md) and the [subagent brief](agents/subagent-brief.md); job skills in [`skills/`](../skills/README.md) |
| Build a landing page | [Landing recipe](recipes/landing.md), then the [example](examples/landing-page.md) |
| Write documentation or an article | [Documentation recipe](recipes/documentation.md), then the [example](examples/text-page.md) |
| Make a deck | [Deck recipe](recipes/deck-slide.md), then the [Deck player](deck.md) |
| Draw a diagram | [Figure labels and captions](system/writing/figures.md), then the [catalogue](diagrams.md) |
| Give a site its own look | [How to write a spec](specs/README.md) and [what a spec may set](system/spec-settings.md) |
| Add a part to the library | [Contributing](contributing.md) and [component-first](component-first.md) |

## Install

UiPack installs from GitHub; `dist/` is committed, so there is no build step on your side.

```sh
npm install github:ong6/uipack
```

Each entry loads only what it draws: `uipack` for figure parts, `uipack/presets` for ready figures,
`uipack/deck` for decks, `uipack/web` for web pages, `uipack/docs` for documentation, and more.
The first figure, every entry and the setup are in [Install and use](../README.md).

## Site map

Every page of the docs site, by sidebar group, linked to the file it renders. Generated from
`playground/docs-manifest.ts` by `npm run docs:sync`; edit the manifest, not this list.

<!-- generated:site-map -->
- **Start here:** [What UiPack is](README.md), [Install and use](../README.md)
- **For agents:** [How agents use UiPack](agents/README.md), [Multi-agent build](agents/multi-agent-build.md), [Subagent brief](agents/subagent-brief.md), [Starting a new website](agents/new-website.md)
- **Rules:** [Overview](system/README.md), [Style contract](system/style.md), [Writing](system/writing/README.md), [Writing: General rules](system/writing/general.md), [Writing: Talks and slides](system/writing/talks.md), [Writing: Read-alone documents](system/writing/documents.md), [Writing: Web and landing copy](system/writing/web.md), [Writing: Figure labels and captions](system/writing/figures.md), [Layout](system/layout/README.md), [Layout: Landing](system/layout/landing.md), [Layout: Documentation and article](system/layout/documentation.md), [Layout: Deck slide](system/layout/deck-slide.md), [Layout: Dashboard](system/layout/dashboard.md), [What a spec may set](system/spec-settings.md), [Do and don't](system/do-and-dont.md)
- **Recipes:** [Recipes overview](recipes/README.md), [Build a landing page](recipes/landing.md), [Build a docs page](recipes/documentation.md), [Build a deck](recipes/deck-slide.md), [Build a dashboard](recipes/dashboard.md)
- **Components:** [Architecture diagrams](diagrams.md), [Drill-down figures](drill.md), [Charts](charts.md), [Article parts](article.md), [Article parts: Verification](article-verification.md), [Deck player: Tech talk](deck.md), [Deck player: Bento](deck.md), [Deck player: Consulting](deck-consulting.md), [Deck storytelling](deck-storytelling.md), [Slide starters](presentations.md), [3D animations](slides.md), [3D object scenes](objects.md), [Mechanism](mechanism.md), [Docs layout](docs-layout.md)
- **Families:** [Diagrams](families/diagrams.md)
- **Specs:** [How to write a spec](specs/README.md), [Spec template](specs/TEMPLATE.md), [Technical](specs/technical.md), [Registry](specs/registry.md)
- **Examples:** [Example landing page](examples/landing-page.md), [Example text page](examples/text-page.md)
- **Reference:** [Icons & marks](icons-and-marks.md), [Contributing](contributing.md), [Component-first](component-first.md), [Design direction](design-direction.md), [Canvas and selection](interaction.md), [Web principles](web-principles.md), [Web principles: Smooth scrolling](web-smooth-scroll.md), [Web discoverability](web-discoverability.md), [Web discoverability: Head and structured data](web-discoverability/head-and-structured-data.md), [Web discoverability: Crawl files](web-discoverability/crawl-files.md), [Web discoverability: Performance](web-discoverability/performance.md), [Portfolio ideas](portfolio-ideas.md)
- **Grading:** [How to grade](grading/README.md), [Mechanical checks](grading/tier-1.md), [Pairwise judging](grading/protocol.md), [Calibration anchors](grading/calibration.md), [Regression set](grading/regression.md), [Landing rubric](grading/rubrics/landing-v1.md), [Docs rubric](grading/rubrics/docs-v1.md), [Deck rubric](grading/rubrics/deck-slide-v1.md), [Dashboard rubric](grading/rubrics/dashboard-v1.md), [Diagram rubric](grading/rubrics/diagram-v1.md)
<!-- /generated -->
