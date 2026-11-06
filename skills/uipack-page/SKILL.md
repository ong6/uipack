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
   [docs/specs/registry.md](../../docs/specs/registry.md)). It sets the palette, faces, density,
   voice and the page types the site uses. No spec, or a site not in the registry: stop and run
   `uipack-spec` first. A spec whose values are `TODO:` keeps those values out of your code; say
   which ones blocked you.
2. **Fixed vs per site.** Core rules ([docs/system/](../../docs/system/README.md)) hold on every
   site; the [diagram family](../../docs/families/diagrams.md) looks the same everywhere; only
   what [a spec may set](../../docs/system/spec-settings.md) changes per site.
3. **The claim.** One sentence the page or deck must make its reader conclude. If you can't write
   it, ask.

## Pick the recipe

Each page type has a recipe: section order, the parts to use, and the writing and layout rules it
relies on. Recipes live in `docs/recipes/` once written; until then use the sources below.

| Page type | Section order and parts | Start from |
| --- | --- | --- |
| Landing / product | [Layout, web](../../docs/system/layout.md#web) archetype table; [web principles](../../docs/web-principles.md) | `examples/web-starter/` (every block wired with sample rows): copy it, replace words and rows |
| Documentation / article | [Docs layout](../../docs/docs-layout.md) (`uipack/docs`), [article parts](../../docs/article.md) (`uipack/article`) | The docs shell and `DocsMarkdown` |
| Deck / talk | [Deck storytelling](../../docs/deck-storytelling.md) (storyline, roles), [deck player](../../docs/deck.md); dense readouts: [consulting slides](../../docs/deck-consulting.md) | `starterDeck(template)` from `uipack/deck`, then `lintDeck` |
| Dashboard | TODO: no recipe yet; use [layout rules](../../docs/system/layout.md#rules-for-every-medium), [charts](../../docs/charts.md) and the consulting KPI tiles | Ask before inventing a new section type |
| 3D hero / motion | [3D animations](../../docs/slides.md), [object scenes](../../docs/objects.md), [Mechanism](../../docs/mechanism.md); motion rules in [style, motion](../../docs/system/style.md#motion) | Keep the 3D entry lazy |

## Build

1. **Words first, as data.** Write the page's content object (or `DeckSlide[]`) with
   `uipack-copy` before layout. Only facts you were given.
2. **Real exports only.** Check the entry's `.d.ts` in `dist/` or its doc before using a prop. A
   missing part is a uipack change ([docs/contributing.md](../../docs/contributing.md)), never an
   invented prop.
3. **Style through roles.** Colours, faces and radii come from `var(--ui-*)` roles and the
   `uiStyle` prop; never a hex or `font-family` literal in site code. A literal you need means the
   spec or the style is missing a role: say so.
4. **Keep the author's section order** in every style ([layout, web](../../docs/system/layout.md#web));
   a style changes how parts are drawn, never where they sit.
5. **Shared shell.** On a site with a header, nav, footer and theme already built, reuse them. On a
   multi-page build split across agents, follow [docs/agents/multi-agent-build.md](../../docs/agents/multi-agent-build.md).

## Check

Render at 1440 and 390, light and dark, reduced motion, with a headless browser you launch
yourself (never a tab the user has open), then run `uipack-review`. If you can't render, say so;
never report a look you didn't see.
