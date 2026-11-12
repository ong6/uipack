# Site registry

Every site UiPack designs for: where its spec lives, the component looks it picks, the uipack
version it pins, and how that pin stands against the latest release (`package.json`'s version;
how a release is cut and a site moves to it: [releases](../releases.md)). One spec per site; a site
that reuses another's look names that spec. The table is generated from `siteRegistry` in
`playground/docs-manifest.ts` by `npm run docs:sync`; edit the registry there.

<!-- generated:site-registry -->
| Site | Repo | Spec | Component looks | Pins uipack | Against `v0.6.0` | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| uipack package defaults | ong6/uipack | [docs/specs/technical.md](technical.md) | diagrams: blueprint (theme: blueprint), 3d: all six, mechanism: isometric | `current` | the release source | Technical, the implemented style (src/styles/technical.css): what every part renders in when a site sets nothing |
| ui.junxiong.dev (the uipack docs site) | ong6/uipack | [docs/specs/docs-site.md](docs-site.md) | diagrams: blueprint (theme: docs-night), 3d: all six, mechanism: isometric | `current` | the release source | Extends Technical with its own dark palette, navigation hues and location marker (playground/site-palette.css, playground/site-settings.tsx); light is Technical's |
| junxiong.dev | ong6/junxiong-homepage | `junxiong-homepage:STYLE.md` (written) | diagrams: blueprint (themes: site default; compoze and trading pages may have their own) | `v0.5.0` | behind: move to `v0.6.0` | STYLE.md on the site's main (passes check-spec). Decided 2026-11-07: diagrams follow a theme, the site's default plus optional per-page themes (Compoze, Trading Engine). Still to do: replace the --uipack-* overrides in globals.css with one diagramThemeCss and the site-local userflow.js / sequence.js with uipack's parts (CHANGELOG 0.3.0); declare diagram-themes in STYLE.md |
| notes.junxiong.dev | ong6/junxiong-notes | `junxiong-notes:STYLE.md` (written) | diagrams: blueprint (theme: the blog's own, one for every post) | `v0.5.0` | behind: move to `v0.6.0` | STYLE.md on the site's main (passes check-spec). Decided 2026-11-07: diagrams follow the blog's one theme, so UI diagrams in posts match. Still to do (the site-ui-2 attempt was deleted unmerged): replace the THEMES palette in content/figures/_shared.tsx with one defineDiagramTheme passed to renderStatic with mode (CHANGELOG 0.3.0); declare diagram-themes in STYLE.md. Open owner decision: self-hosting its serif |
<!-- /generated -->

A spec that lives in a site's own repo is that repo's `STYLE.md`, written from the
[template](TEMPLATE.md) and checked with `scripts/check-spec.ts` ([how](README.md#writing-one)).
