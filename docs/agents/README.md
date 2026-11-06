# How an agent uses UiPack

UiPack is the design manager for every site that installs it. This page is the read order for an
agent: where the rules live, where each site's spec lives, and what is fixed versus set per site.
The same files ship in the package, so read them from `node_modules/uipack/` in a site, or from a
uipack clone.

## Read in this order

1. **The job's skill.** [`skills/`](../../skills/README.md) has one short skill per job (build a
   page, draw a diagram, write copy, write a site spec, review and grade). It gives the order of
   work and links to the docs below.
2. **The site's spec.** The site repo's `STYLE.md`, or its row in the
   [registry](../specs/registry.md). No spec yet: write one first ([starting a new website](new-website.md)).
3. **The core rules for your medium.** [docs/system/README.md](../system/README.md), then only your
   medium's section in [style](../system/style.md), [writing](../system/writing/README.md) and
   [layout](../system/layout/README.md). Jump by heading.
4. **The component docs** for the parts you use (the site map in [docs/README.md](../README.md)),
   and the entry's `dist/*.d.ts` before you use a prop.

## Four layers

| Layer | Holds | Where | Who changes it |
| --- | --- | --- | --- |
| Core rules | Spacing and type scale, motion timings, accessibility, writing, layout, component behaviour, the role contract | [docs/system/](../system/README.md) | uipack, for every site at once |
| Shared families | A look that is the same on every site; first: diagrams | [docs/families/](../families/diagrams.md) | uipack |
| Site spec | One site's brand: palette, faces, radii, ornaments, voice, density, page types | The site's `STYLE.md`, or [docs/specs/](../specs/README.md) | The site, through the [template](../specs/TEMPLATE.md) and `scripts/check-spec.ts` |
| Components | Parts that read roles, never values | `src/`, documented per entry | uipack |

## Fixed vs per site

A spec may set only what [this table](../system/spec-settings.md) lists: palette, faces, shape,
ornaments, treatments, density, motion feel, voice, page types, a section-order deviation and
the families it uses. Everything else holds on every site: the 8pt grid, motion timings, contrast,
keyboard and touch support, slot budgets, the writing rules, and a family's fixed values (a
figure never takes the site's accent). A request for a fixed value is a core-rule change, not a
site setting: say so instead of overriding it locally.

## Rules that catch agents most often

- Colours, faces and radii come from `var(--ui-*)` roles and the `uiStyle` prop; never a hex or
  `font-family` literal in site code.
- Only real exports and props; a missing part is a uipack change
  ([contributing](../contributing.md)), never an invented prop.
- Only the facts you were given; a gap is left out, never filled.
- A style never moves a section; the author's order holds.
- Render at 1440 and 390, light and dark, in a browser you launched, before saying it looks right;
  then grade it (the `uipack-review` skill).

## More in this folder

- [Multi-agent website build](multi-agent-build.md): the lead, the subagents, the hand-off and the
  integration pass.
- [Subagent brief template](subagent-brief.md): the copy-paste brief for one page or section.
- [Starting a new website](new-website.md): spec first, register it, then build.
