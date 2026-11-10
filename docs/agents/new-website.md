# Starting a new website

A new site gets its spec before its first page. The order is fixed: write the spec from the
template, check it, register it, then build.

1. **Decide: reuse or new.** If the site should look like an existing one, its spec is short:
   `extends: <that spec's id>` plus only what differs. Otherwise `extends: core`. A talk series
   with its own look is a site too: `pages: [deck]`, the same steps.
2. **Write the spec.** Copy [the template](../specs/TEMPLATE.md) to `STYLE.md` at the site repo's
   root. Fill the frontmatter (`spec`, `site`, `extends`, `pages`, `layouts`, `components`,
   `status: draft`, `uipack:` the commit or tag you install), every role, light and dark, a layout
   for each page type and the writing style: they are this site's own, not Technical's. Unknown values are
   `TODO:` lines naming what would decide them, never guesses. Stay inside
   [what a spec may set](../system/spec-settings.md). The full steps:
   [how to write a site spec](../specs/README.md#writing-one); the `uipack-spec` skill walks them.
3. **Check it.** `npx tsx node_modules/uipack/scripts/check-spec.ts STYLE.md` until it passes.
4. **Register it.** Add the site to `siteRegistry` in uipack's `playground/docs-manifest.ts` and run
   `npm run docs:sync` in uipack; the [registry](../specs/registry.md) regenerates. If you are not
   working in uipack, hand that row to whoever is.
5. **Build.** Install uipack's release tarball ([install](../../README.md#install)), build the shared shell, then the pages, each from
   its recipe (the `uipack-page` skill). A multi-page build follows
   [multi-agent website build](multi-agent-build.md).

Until uipack renders the spec as a style ([building a style from a spec](../specs/README.md#building-a-style-from-a-spec)),
a site can set the same `--ui-*` roles in its own CSS: the library's CSS sits in cascade layers, so
the site's unlayered rules win and components read them. Building the style is a uipack change,
made only when the owner or a brief asks.
