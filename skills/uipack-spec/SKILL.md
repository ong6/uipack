---
name: uipack-spec
description: >-
  Write, update or check a website's UiPack site spec (its STYLE.md): palette, faces, radii,
  ornaments, voice, density and page types, from the template, checked by check-spec and listed
  in the registry. Use for "start a new site", "write the style spec", "make site B look like
  site A", "change our accent", "add a site to the registry". Not for building pages (uipack-page),
  the shared diagram look (fixed, docs/families/diagrams.md), or core rules every site shares.
---

# Write or update a site spec

Paths are relative to the uipack root: `node_modules/uipack/` in a site, or a uipack clone.

One spec per website; it holds only the brand. Read
[docs/specs/README.md](../../docs/specs/README.md) once: the layers (core rules → shared families →
site spec → components) and every step below in full.

## Steps

1. **Reuse first.** If the site should look like an existing one, its spec is a few lines with
   `extends: <that spec's id>` plus what differs. Never copy another spec's values.
2. **Start from the template.** Copy [docs/specs/TEMPLATE.md](../../docs/specs/TEMPLATE.md) to
   `STYLE.md` at the site repo's root (or `docs/specs/<id>.md` inside uipack). Keep every heading.
3. **Frontmatter.** `spec` (the id), `site`, `extends` (`core` or a spec id), `uses: [diagrams]`,
   `status: draft`, `uipack:` the commit the site pins, `values:` none until uipack renders it.
4. **Values: only what you were given.** Fill a role's light and dark value only from the brief
   or the live site. Everything else is a `TODO:` line saying what decides it, even when a
   plausible value is easy to derive (a dark palette, ink greys, radii, easing); offer such
   values as a suggestion in your reply, never as the spec's value.
5. **Stay in bounds.** Set only what [a spec may set](../../docs/system/spec-settings.md). Two
   traps:
   - **The flow colours** (`--ui-flow-*`, which figures read: see the "Reads today" column of
     [docs/families/diagrams.md](../../docs/families/diagrams.md)): figures look the same on every
     site, so never brand them. Copy Technical's flow values and say why; never write that figures
     take the site's palette.
   - **"Fixed by core rules"** applies only to what the right-hand column of spec-settings lists
     (timings, the grid, contrast, budgets). Settings it puts in a spec's hands (density, type
     ratio, measure, easing, radii, ornaments) are the site's choice: `TODO:` until chosen.
   A request that needs a fixed value changed is a core-rule change for every site: say so.
6. **Check.** `npx tsx node_modules/uipack/scripts/check-spec.ts STYLE.md` (in uipack:
   `npx tsx scripts/check-spec.ts docs/specs/<id>.md`). Fix until it passes.
7. **Register.** Add the site to `siteRegistry` in uipack's `playground/docs-manifest.ts` (site,
   repo, spec path as `<repo>:STYLE.md`, families, pinned commit) and run `npm run docs:sync`, which
   regenerates [the registry](../../docs/specs/registry.md). From a site repo without a uipack
   clone, report the row to add instead of claiming it was added.

A spec becomes a live style only when the owner or a brief asks for uipack to render it; that is
[Building a style from a spec](../../docs/specs/README.md#building-a-style-from-a-spec), a uipack change.
