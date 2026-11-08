# Site registry

Every site uipack designs for: where its spec lives, the component looks it picks, the uipack
version it pins, and how that pin stands against the latest release (`package.json`'s version;
how a release is cut and a site moves to it: [releases](../releases.md)). One spec per site; a site
that reuses another's look names that spec. The table is generated from `siteRegistry` in
`playground/docs-manifest.ts` by `npm run docs:sync`; edit the registry there.

<!-- generated:site-registry -->
| Site | Repo | Spec | Component looks | Pins uipack | Against `v0.3.0` | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| uipack (docs site and package defaults) | ong6/uipack | [docs/specs/technical.md](technical.md) | diagrams: blueprint (theme: blueprint), 3d: all six, mechanism: isometric | `current` | the release source | Technical, the implemented style (src/styles/technical.css) |
| junxiong.dev | ong6/junxiong-homepage | `junxiong-homepage:STYLE.md` (written) | diagrams: blueprint (themes: site default; compoze and trading pages may have their own) | `e6b6ed7` | commit pin: move to `v0.3.0` | STYLE.md drafted 2026-11-07 on branch site-ui-1 (passes check-spec; not on the site's main until the owner merges). Decided 2026-11-07: diagrams follow a theme, the site's default plus optional per-page themes (Compoze, Trading Engine). Move: replace the --uipack-* overrides in globals.css with one diagramThemeCss and the site-local userflow.js / sequence.js with uipack's parts (CHANGELOG 0.3.0); declare diagram-themes in STYLE.md |
| notes.junxiong.dev | ong6/junxiong-notes | `junxiong-notes:STYLE.md` (written) | diagrams: blueprint (theme: the blog's own, one for every post) | `3886f0d` | commit pin: move to `v0.3.0` | STYLE.md drafted 2026-11-07 on branch site-ui-1 (passes check-spec; not on the site's main until the owner merges). Decided 2026-11-07: diagrams follow the blog's one theme, so UI diagrams in posts match. Move: replace the THEMES palette in content/figures/_shared.tsx with one defineDiagramTheme passed to renderStatic with mode (CHANGELOG 0.3.0); declare diagram-themes in STYLE.md. Open owner decision: self-hosting its serif |
<!-- /generated -->

A spec that lives in a site's own repo is that repo's `STYLE.md`, written from the
[template](TEMPLATE.md) and checked with `scripts/check-spec.ts` ([how](README.md#writing-one)).
