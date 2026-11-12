---
name: uipack-page
description: >-
  Build or restyle a page or deck with UiPack from its recipe: a landing or product page, a
  documentation or article page, a slide deck or talk, a dashboard, or a 3D hero or motion
  explainer on one of them. Use for "landing page", "make slides", "docs page", "dashboard", "in
  our style", "on brand", "swap the style", or any page in a repo that installs uipack. Not for a
  figure alone (uipack-diagram), words alone (uipack-copy), a new site's look (uipack-spec), or
  grading a finished page (uipack-review).
---

# Build a page from a recipe

Paths are relative to the uipack root: `node_modules/uipack/` in a site, or a uipack clone.

## Before you write code

1. **The site's spec.** Read the repo's `STYLE.md` (or the site's row in
   [docs/specs/registry.md](../../docs/specs/registry.md)). It sets the palette, faces and density,
   the page types the site has with a layout for each (`layouts:` and `## Layout`), its writing
   style and the component looks it picks. A deck is a page of the site and reads the same spec.
   With no spec of its own, decide which case you are in and say which you took:
   - **A new site** (its own repo or domain, pages to come, a look of its own): stop and run
     `uipack-spec` first.
   - **A page inside an existing site that uses uipack** (a one-off page, a deck, a docs page added
     to it): that site's spec, from its repo's `STYLE.md` or its registry row. Never write a second
     spec for one page.
   - **A one-off with no site behind it** (a demo, a prototype, a brief that says "house style",
     the uipack playground itself): Technical, [docs/specs/technical.md](../../docs/specs/technical.md),
     and no new spec. Grade it with `--spec node_modules/uipack/docs/specs/technical.md` (inside
     uipack: `--spec uipack`).

   A spec whose values are `TODO:` keeps those values out of your code; say which ones blocked you.
2. **Fixed vs per site.** Core rules ([docs/system/](../../docs/system/README.md): the role
   contract, the [layout floors](../../docs/system/layout/README.md#floors-what-holds-on-every-site),
   the core writing rules) hold on every site; a `fixed` [component look](../../docs/components/README.md)
   (the diagrams' Blueprint) looks the same everywhere; everything
   [a spec may set](../../docs/system/spec-settings.md) is the site's.
3. **The claim.** One sentence the page or deck must make its reader conclude. If you can't write
   it, ask.

## Pick the recipe

The layout comes from the spec: its `layouts:` entry for the page type names an archetype (read its
doc and the spec's `### <Page type>` for what the site changes) or `custom` (the spec's Grid,
Regions, Section order and Hero rows). The recipe gives the parts and the rules
([`docs/recipes/`](../../docs/recipes/README.md)); the sources below are the defaults an archetype
starts from.

| Page type | Section order and parts | Start from |
| --- | --- | --- |
| Landing / product | [Build a landing page](../../docs/recipes/landing.md); the [product landing](../../docs/system/layout/landing.md) archetype; [web principles](../../docs/web-principles.md) | `examples/web-starter/` (every block wired with sample rows): copy it, replace words and rows |
| Documentation / article | [Build a docs page](../../docs/recipes/documentation.md); [docs layout](../../docs/docs-layout.md) (`uipack/docs`), [article parts](../../docs/article.md) (`uipack/article`) | The docs shell and `DocsMarkdown` |
| Deck / talk | [Build a deck](../../docs/recipes/deck-slide.md); [deck storytelling](../../docs/deck-storytelling.md) (storyline, roles), [deck player](../../docs/deck.md); dense readouts: [consulting slides](../../docs/deck-consulting.md) | `starterDeck(template)` from `uipack/deck`, then `lintDeck` |
| Dashboard | [Build a dashboard](../../docs/recipes/dashboard.md), [layout](../../docs/system/layout/dashboard.md), [charts](../../docs/charts.md) | Ask before inventing a new section type |
| 3D hero / motion | The looks the spec picked ([3D](../../docs/components/3d.md), [Mechanism](../../docs/components/mechanism.md)); [3D animations](../../docs/slides.md), [3D object scenes](../../docs/objects.md); motion rules in [style, motion](../../docs/system/style.md#motion) | Keep the 3D entry lazy; pin a scene to a look the spec picked |

## Build

1. **Words first, as data.** Write the page's content object (or `DeckSlide[]`) with
   `uipack-copy` before layout, in the spec's writing style. Only facts you were given.
2. **Real exports only.** Check the entry's `.d.ts` in `dist/` or its doc before using a prop. A
   missing part is a uipack change ([docs/contributing.md](../../docs/contributing.md)), never an
   invented prop.
3. **Style through roles.** Colours, faces and radii come from `var(--ui-*)` roles and the
   `uiStyle` prop; never a hex or `font-family` literal in site code. A literal you need means the
   spec or the style is missing a role: say so.
4. **The spec's layout, in every style.** Sections in the order the spec's `### <Page type>` gives
   (or the author's, if it gives none); the style changes how parts are drawn, never where they
   sit. A layout number the parts hard-code (the 1120px column…) is listed in
   [Where code still fixes a layout](../../docs/system/layout/README.md#where-code-still-fixes-a-layout).
5. **Shared shell.** On a site with a header, nav, footer and theme already built, reuse them. On a
   multi-page build split across agents, follow [docs/agents/multi-agent-build.md](../../docs/agents/multi-agent-build.md).

## Check

Render at 1440 and 390, light and dark, reduced motion, with a headless browser you launch
yourself (never a tab the user has open), then grade tier 1 with `npx uipack-grade check <url> --spec STYLE.md` (the spec you used in step 1; inside uipack: `npm run grade -- check <url> --spec uipack`) and finish with `uipack-review`. If you can't render, say so;
never report a look you didn't see.

Per page type, before the grader:

- **Deck.** The [deck recipe](../../docs/recipes/deck-slide.md#steps), steps 5–8, on the finished
  slides: what each slide adds (a slide that repeats an earlier point merges), `lintDeck` rerun
  after the last edit with every `error` and `warn` fixed or explained, every rendered slide's body
  filled by its archetype, and one tone through the deck.
- **Documentation.** Every task section has a copyable example; missing names are marked
  placeholders ([recipe](../../docs/recipes/documentation.md#before-you-ship)).
- **A figure on the page.** The [diagram skill](../uipack-diagram/SKILL.md)'s check (step 6).
