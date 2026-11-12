# How to write a site spec

UiPack is the design manager for every site that uses it. Each website has its own layout,
writing style, theme, fonts and design direction, all in its spec; the core rules keep only what
must hold everywhere. The docs are layered so an agent reads any site the same way:

| Layer | Holds | Where |
| --- | --- | --- |
| **Core rules** | What every site keeps: the role contract a spec fills, contrast and motion timings, the [layout floors](../system/layout/README.md#floors-what-holds-on-every-site), the [core writing rules](../system/writing/README.md#core-and-site) and slot ceilings, component behaviour | [`docs/system/`](../system/README.md) |
| **Libraries a spec picks from** | Layout [archetypes](../system/layout/README.md#archetype-library) per page type, and each component's named [looks](../components/README.md), `fixed` (the same on every site) or `flex` (taking the site's roles) | `docs/system/layout/`, [`docs/components/`](../components/README.md) |
| **Site specs** | One per website: palette, faces, radii and ornaments through the roles; density; the page types it has and a layout for each; its writing style; the component looks it picks | This folder, or the site's own repo |
| **Components** | Read roles, never values, so one component serves every spec | `src/`, documented under Components |

A deck is a page of a site and reads the site's spec; a talk series with its own look has its own
spec ([presentations](../system/README.md#presentations-are-websites)).

**One spec per website.** A new site gets its own spec. A site that should look like an existing
one reuses that spec (`extends: <spec id>` in its frontmatter) instead of copying it. Every site
and its spec are listed in the [registry](registry.md).

## Writing one

1. Copy [TEMPLATE.md](TEMPLATE.md). In uipack it goes here as `docs/specs/<id>.md`; in a site's own
   repo it is `STYLE.md` at the repo root, which is where an agent working on that site looks.
2. Fill the frontmatter: `extends: core` (or another spec's id); `pages:` the page types the site
   has; `layouts:` an archetype id or `custom` for each; `components:` the looks it picks
   (`{ diagrams: blueprint }` at least, if it draws figures); and `uipack:` the commit the site pins.
3. Give every role in the [role contract](../system/style.md#the-role-contract) a light and a dark
   value. A value you can't determine yet is a `TODO:` line, never a guess.
4. Choose only what a spec [may set](../system/spec-settings.md): the look through the roles, a
   layout per page type (`## Layout`, one `###` each), the writing style (`## Writing style`, the
   five rows) and why each component look fits (`## Component looks`). Everything else is a core
   rule and holds unchanged. A fixed look's values (a figure's flow colours, strokes, label face) are
   not the spec's to change.
5. Check it: `npx tsx scripts/check-spec.ts <file>` from a uipack checkout (or
   `node_modules/uipack/scripts/check-spec.ts` in a site that installs uipack). It fails on a
   missing frontmatter key or section, a contract role with neither a value nor a `TODO:`, a page
   type with no layout (or a custom one missing its Grid, Regions, Section order or Hero row), a
   Writing style table missing a row, a component or look that doesn't exist or isn't offered, and a
   spec that sets a value a fixed look owns. An older spec's `uses: [diagrams]` still reads as
   `components: { diagrams: blueprint }`. `test/specs.test.tsx` runs it on every spec in this folder.

[Technical](technical.md) is the reference: the package's default look, written to the template,
with its role values generated from `src/styles/technical.css` so the two cannot drift. Its layout
picks and writing style are its own choices; a new site makes its own. The uipack docs site's
spec, [docs-site](docs-site.md), shows a spec that extends another and sets only its differences.

## Building a style from a spec

A spec becomes a live style in uipack when a site needs uipack to render it (its own pages, decks
or figures in its look):

1. **Fill the role contract.** Create `src/styles/<id>.css` with one `[data-ui-style="<id>"]` block
   inside `@layer uipack.tokens` that sets every role the spec's table lists.
   [`src/styles/roles.css`](../../src/styles/roles.css) declares the layers and resets the
   `--tune-*` hooks; [the role contract](../system/style.md#the-role-contract) says what each role
   means. Colours are `light-dark(light, dark)` pairs. Never edit Technical's values to get a look.
2. **Fill the treatment slots.** The ornament slots (`--ui-backdrop`, `--ui-marker-*`,
   `--ui-section-rule`, `--ui-frame-*`, `--ui-cta-shadow`…) and the treatment roles (`--ui-perf`,
   `--ui-card-*`, `--ui-num-*`, `--ui-stat-divider`, `--ui-quote-*`, `--ui-plan-featured-*`,
   `--ui-cell-*`, `--ui-window-*`, `--ui-stamp-*`, `--ui-band-*`, `--ui-density`) are values too.
   They never take space, so the style changes how parts are drawn and never where they sit. Add a
   component only if the style adds a part.
3. **Add its faces.** Self-host each new face as a latin-subset woff2 in `src/web/fonts/` with its
   SIL OFL licence file (`OFL-<face>.txt`), an `@font-face` with `font-display: swap` and a
   metric-matched `"<Face> Fallback"` (`size-adjust`, `ascent-override`, `descent-override`,
   `line-gap-override`) in `src/web/fonts.css`. A face is fetched only when the active style uses
   it. Update the font tests in `test/web.test.tsx`, which list the shipped files and licences.
4. **Register it.** Add the file to `styleFiles` in `scripts/css-bundles.ts`, the id to `UiStyleId`
   and an entry to `uiStyles` in `src/style.ts` (name, summary, `fonts`, the display face to
   `preload`, and the opt-in `prefers` order and `layout` defaults from the spec's `## Layout`), and the file to
   `STYLE_FILES` in `test/style-values.ts`.
5. **Test it.**
   - Role completeness: `test/style-roles.test.tsx` fails on a missing core role.
   - Contrast: 4.5:1 for text (ink, ink-2, ink-3 on every ground, accent text, button and band
     labels) and 3:1 for flow and data marks, in both themes (`test/style-roles.test.tsx`).
   - No hex in components: `test/no-hex.test.tsx`; colours live only in `src/styles`.
   - Label fit with the new faces: `e2e/geometry.spec.ts` (text inside node boxes at 1440 and 390,
     the 11px floor) and `e2e/charts.spec.ts`, run with the style applied.
   - Layout equivalence: the same `DeckSlide[]` and the same web page in Technical and the new
     style keep the same regions, columns and reading order.
   - Screenshots of a web page, a deck and a figure at 1440 and 390, light and dark, inspected by
     eye. Compare them with the spec before calling it done.
6. **Document it.** Set the spec's `status: implemented` and `values:` to the style file, so its
   role table is generated from code, and update the [registry](registry.md). Then `npm run build`
   and run the tests on it.
