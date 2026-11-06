# Site registry

Every site uipack designs for: where its spec lives, the shared families it draws with, and the
uipack commit it pins. One spec per site; a site that reuses another's look names that spec. The
table is generated from `siteRegistry` in `playground/docs-manifest.ts` by `npm run docs:sync`;
edit the registry there.

<!-- generated:site-registry -->
| Site | Repo | Spec | Families | Pins uipack | Notes |
| --- | --- | --- | --- | --- | --- |
| uipack (docs site and package defaults) | ong6/uipack | [docs/specs/technical.md](technical.md) | diagrams | `current` | Technical, the implemented style (src/styles/technical.css) |
| junxiong.dev | ong6/junxiong-homepage | `junxiong-homepage:STYLE.md` (TODO) | diagrams | `e6b6ed7` | TODO: spec not written (on hold); a Chakra theme maps the --uipack-* variables |
| notes.junxiong.dev | ong6/junxiong-notes | `junxiong-notes:STYLE.md` (TODO) | diagrams | `3886f0d` | TODO: spec not written (on hold); warm paper #fffdf9, rust accent #9a3412, serif and sans |
<!-- /generated -->

A spec that lives in a site's own repo is that repo's `STYLE.md`, written from the
[template](TEMPLATE.md) and checked with `scripts/check-spec.ts` ([how](README.md#writing-one)).
