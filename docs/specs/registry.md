# Site registry

Every site uipack designs for: where its spec lives, the component looks it picks, and the uipack
commit it pins. One spec per site; a site that reuses another's look names that spec. The
table is generated from `siteRegistry` in `playground/docs-manifest.ts` by `npm run docs:sync`;
edit the registry there.

<!-- generated:site-registry -->
| Site | Repo | Spec | Component looks | Pins uipack | Notes |
| --- | --- | --- | --- | --- | --- |
| uipack (docs site and package defaults) | ong6/uipack | [docs/specs/technical.md](technical.md) | diagrams: blueprint, 3d: all six, mechanism: isometric | `current` | Technical, the implemented style (src/styles/technical.css) |
| junxiong.dev | ong6/junxiong-homepage | `junxiong-homepage:STYLE.md` (TODO) | diagrams: blueprint | `e6b6ed7` | TODO: spec not written (on hold); a Chakra theme maps the --uipack-* variables |
| notes.junxiong.dev | ong6/junxiong-notes | `junxiong-notes:STYLE.md` (TODO) | diagrams: blueprint | `3886f0d` | TODO: spec not written (on hold). Its live look (warm paper, rust accent, serif and sans) is a description, not values to build with; hold until the spec exists |
<!-- /generated -->

A spec that lives in a site's own repo is that repo's `STYLE.md`, written from the
[template](TEMPLATE.md) and checked with `scripts/check-spec.ts` ([how](README.md#writing-one)).
