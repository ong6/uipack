# How agents use UiPack

UiPack is the design system for every site that installs it. This page is the read order for an
agent: where the rules live, where each site's spec lives, and what is fixed versus set per site.
The same files ship in the package, so read them from `node_modules/uipack/` in a site, or from a
uipack clone.

## Read in this order

1. **The job's skill.** [`skills/`](../../skills/README.md) has one short skill per job (build a
   page, draw a diagram, write copy, write a site spec, review and grade). It gives the order of
   work and links to the docs below.
2. **The site's spec.** The site repo's `STYLE.md`, or its row in the
   [site registry](../specs/registry.md): its look, the layout for your page type (`layouts:` and
   `## Layout`), its writing style and the component looks it picks. A deck reads its site's spec.
   No spec yet: a new site writes one first ([starting a new website](new-website.md)); a page
   inside an existing UiPack site uses that site's spec; a one-off with no site behind it (and the
   uipack playground) uses the [Technical spec](../specs/technical.md) (the
   [page skill](../../skills/uipack-page/SKILL.md), step 1).
3. **The core rules for your medium.** [docs/system/README.md](../system/README.md), then only your
   medium's section in [style](../system/style.md), [writing](../system/writing/README.md) and
   [layout](../system/layout/README.md) (the floors, and the archetype the spec picked). Jump by heading.
4. **The component docs** for the parts you use (the site map in [docs/README.md](../README.md)),
   and the entry's `dist/*.d.ts` before you use a prop.

## Six layers

| Layer | Holds | Where | Who changes it |
| --- | --- | --- | --- |
| Core rules | The role contract, motion timings, accessibility, the layout floors, the core writing rules and slot ceilings, component behaviour | [docs/system/](../system/README.md) | uipack, for every site at once |
| Layout archetypes | Named layouts per page type (grid, regions, section order, hero) a spec picks, extends or replaces | [Layout](../system/layout/README.md#archetype-library) | uipack |
| Component looks | Each component's named looks, `fixed` or `flex` | [docs/components/](../components/README.md) | uipack |
| Site spec | One site's look (palette, faces, radii, ornaments, density), its layout per page type, its writing style, the looks it picks | The site's `STYLE.md`, or [docs/specs/](../specs/README.md) | The site, through the [template](../specs/TEMPLATE.md) and `scripts/check-spec.ts` |
| Recipes | One per page type: the parts and the rules it relies on | [docs/recipes/](../recipes/README.md) | uipack |
| Components | Parts that read roles, never values | `src/`, documented per entry | uipack |

## Fixed vs per site

A spec may set only what [this table](../system/spec-settings.md) lists; everything else holds on
every site.

| A spec may set (per site) | Holds on every site (fixed) |
| --- | --- |
| Palette, faces, shape, ornaments, treatments, density, motion feel | The layout floors: reading order, a real narrow layout, no overflow, tap targets, focus, the 8px unit |
| The page types, and a layout for each: grid, regions, section order, hero | Motion timings |
| Its writing style: tone, title forms, density, house words, tighter budgets | Contrast, keyboard and touch support |
| The component looks it picks | The core writing rules and slot ceilings |
| In dark, the ground a fixed look sits on | A fixed look's other values (a Kinetic scene keeps its brass on every site) |
| Its diagram themes: a figure's colours, faces and canvas ground | The diagram grammar: geometry, type sizes and the 11px floor, strokes, what each flow kind means |

A request for a fixed value is a core-rule change, not a site setting: say so instead of
overriding it locally.

## Rules that catch agents most often

- Colours, faces and radii come from `var(--ui-*)` roles and the `uiStyle` prop; never a hex or
  `font-family` literal in site code.
- Only real exports and props; a missing part is a uipack change
  ([contributing](../contributing.md)), never an invented prop.
- Only the facts you were given; a gap is left out, never filled. A code example still ships:
  a name it needs that the input lacks is a marked placeholder (`<cursor>`, `YOUR_API_KEY`), never
  a real-looking invention ([documentation pages](../system/writing/documents.md#documentation-pages)).
- Layout and writing style are the site's: read them from its spec, never from Technical's; a
  style never moves a section.
- Render at 1440 and 390, light and dark, in a browser you launched, before saying it looks right;
  then grade it (the `uipack-review` skill).

## More in this folder

- [Multi-agent build](multi-agent-build.md): the lead, the subagents, the hand-off and the
  integration pass.
- [Subagent brief](subagent-brief.md): the copy-paste brief for one page or section.
- [Starting a new website](new-website.md): spec first, register it, then build.
