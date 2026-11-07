# Site registry

Every site uipack designs for: where its spec lives, the component looks it picks, the uipack
version it pins, and how that pin stands against the latest release (`package.json`'s version;
how a release is cut and a site moves to it: [releases](../releases.md)). One spec per site; a site
that reuses another's look names that spec. The table is generated from `siteRegistry` in
`playground/docs-manifest.ts` by `npm run docs:sync`; edit the registry there.

<!-- generated:site-registry -->
| Site | Repo | Spec | Component looks | Pins uipack | Against `v0.2.0` | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| uipack (docs site and package defaults) | ong6/uipack | [docs/specs/technical.md](technical.md) | diagrams: blueprint, 3d: all six, mechanism: isometric | `current` | the release source | Technical, the implemented style (src/styles/technical.css) |
| junxiong.dev | ong6/junxiong-homepage | `junxiong-homepage:STYLE.md` (written) | diagrams: blueprint | `e6b6ed7` | commit pin: move to `v0.2.0` | STYLE.md drafted 2026-11-07 on branch site-ui-1 (passes check-spec; not on the site's main until the owner merges). A Chakra theme maps the --uipack-* variables. Open owner decision: diagrams identical on every site or in the site's palette (globals.css overrides figure colours today) |
| notes.junxiong.dev | ong6/junxiong-notes | `junxiong-notes:STYLE.md` (written) | diagrams: blueprint | `3886f0d` | commit pin: move to `v0.2.0` | STYLE.md drafted 2026-11-07 on branch site-ui-1 (passes check-spec; not on the site's main until the owner merges). Open owner decisions: diagrams identical on every site or in the site's palette (app/globals.css overrides figure colours today); self-hosting its serif |
<!-- /generated -->

A spec that lives in a site's own repo is that repo's `STYLE.md`, written from the
[template](TEMPLATE.md) and checked with `scripts/check-spec.ts` ([how](README.md#writing-one)).
