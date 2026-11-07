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
| junxiong.dev | ong6/junxiong-homepage | `junxiong-homepage:STYLE.md` (TODO) | diagrams: blueprint | `e6b6ed7` | commit pin: move to `v0.2.0` | TODO: spec not written (on hold). Figures may go ahead (diagrams use the fixed Blueprint look); page layout, copy and colours wait for the spec. A Chakra theme maps the --uipack-* variables |
| notes.junxiong.dev | ong6/junxiong-notes | `junxiong-notes:STYLE.md` (TODO) | diagrams: blueprint | `3886f0d` | commit pin: move to `v0.2.0` | TODO: spec not written (on hold). Figures may go ahead (diagrams use the fixed Blueprint look); page layout, copy and colours wait for the spec. Its live look (warm paper, rust accent, serif and sans) is a description, not values to build with |
<!-- /generated -->

A spec that lives in a site's own repo is that repo's `STYLE.md`, written from the
[template](TEMPLATE.md) and checked with `scripts/check-spec.ts` ([how](README.md#writing-one)).
