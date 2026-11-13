---
name: uipack-spec
description: >-
  Write, update or check a website's UiPack site spec (its STYLE.md): palette, faces, radii,
  ornaments, density, a layout per page type, writing style and component looks, from the
  template, checked by check-spec and listed in the registry. Use for "start a new site", "write
  the style spec", "make site B look like site A", "change our accent", "our own layout", "our
  voice", "a spec for this talk series", "add a site to the registry". Not for building pages
  (uipack-page), changing a component look itself (docs/components/), or core rules every site shares.
---

# Write or update a site spec

Paths are relative to the uipack root: `node_modules/uipack/` in a site, or a uipack clone.

One spec per website (or per talk series with its own look); it holds the site's look, its layout
per page type, its writing style and the component looks it picks. Read
[docs/specs/README.md](../../docs/specs/README.md) once: the layers (core rules → the libraries of
layout archetypes and component looks → site spec → components) and every step below in full.

## Steps

1. **Reuse first.** If the site should look like an existing one, its spec is a few lines with
   `extends: <that spec's id>` plus what differs. Never copy another spec's values.
2. **Start from the template.** Copy [docs/specs/TEMPLATE.md](../../docs/specs/TEMPLATE.md) to
   `STYLE.md` at the site repo's root (or `docs/specs/<id>.md` inside uipack). Keep every heading.
3. **Frontmatter.** `spec` (the id), `site`, `extends` (`core` or a spec id), `pages:` the page
   types the site has (a deck counts), `layouts:` an
   [archetype](../../docs/system/layout/README.md#archetype-library) id or `custom` for each,
   `components:` the [looks](../../docs/components/README.md) it picks (`{ diagrams: blueprint }`
   if it draws figures), `status: draft`, `uipack:` the commit the site pins, `values:` none until
   uipack renders it.
4. **Layout and writing style.** One `###` per page type under `## Layout` (what the site changes
   in the archetype, or the four rows of a custom one), and the five rows of `## Writing style`,
   each from the brief or the live site, else `TODO:`. Never copy Technical's choices as a default:
   they are that site's.
5. **Values: only what you were given.** Fill a role's light and dark value only from the brief
   or the live site. Everything else is a `TODO:` line saying what decides it, even when a
   plausible value is easy to derive (a dark palette, ink greys, radii, easing); offer such
   values as a suggestion in your reply, never as the spec's value.
6. **Stay in bounds.** Set only what [a spec may set](../../docs/system/spec-settings.md). Two
   traps:
   - **Figure colours go in a diagram theme, not in the roles.** The Blueprint look is `flex`
     ([docs/components/diagrams.md](../../docs/components/diagrams.md#diagram-themes)): its
     grammar is the same on every site and its colours, faces and canvas ground come from a theme
     the spec names (`diagram-themes: { default: … }`, one row per theme under `## Component
     looks`). A site with no theme of its own uses the built-in `blueprint`. Never restyle figures
     through `--ui-flow-*` or `--uipack-*` overrides in site CSS.
   - **"Fixed by core rules"** applies only to what the right-hand column of spec-settings lists
     (timings, the layout floors, contrast, the core writing rules and slot ceilings). Settings it puts in a spec's hands (density, type
     ratio, measure, easing, radii, ornaments) are the site's choice: `TODO:` until chosen.
   A request that needs a fixed value changed is a core-rule change for every site: say so.
7. **Check.** `npx tsx node_modules/uipack/scripts/check-spec.ts STYLE.md` (in uipack:
   `npx tsx scripts/check-spec.ts docs/specs/<id>.md`). Fix until it passes.
8. **Register.** Add the site to `siteRegistry` in uipack's `playground/docs-manifest.ts` (site,
   repo, spec path as `<repo>:STYLE.md`, component looks, pinned commit) and run `npm run docs:sync`, which
   regenerates [the registry](../../docs/specs/registry.md). From a site repo without a uipack
   clone, report the row to add instead of claiming it was added.

A spec becomes a live style only when the owner or a brief asks for uipack to render it; that is
[Building a style from a spec](../../docs/specs/README.md#building-a-style-from-a-spec), a uipack change.
