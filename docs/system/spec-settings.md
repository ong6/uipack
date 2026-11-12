# What a site spec may set

Each website has its own look, layout, writing style and component looks, all in its spec
([how to write one](../specs/README.md)); the core rules keep only what must hold on every site.
This page is the boundary. When a brief asks for something in the right-hand column, the answer is a
change to the core rules for every site, not a spec setting.

| A spec sets | Through | Fixed for every site |
| --- | --- | --- |
| **Palette**: paper, surfaces, the ink ramp, the one accent, data and invert sets, light and dark | The colour roles in the [role contract](style.md#the-role-contract) | One accent per unit; contrast of 4.5:1 for small text and 3:1 for large and for marks, in both themes; hierarchy by weight and opacity, not more hues (navigation hues, below, mark place only); red is a data colour only |
| **Faces**: display, text and label (and slide faces for its decks), their weights, tracking and case | `--ui-font-*`, `--ui-slide-font-*`, `--ui-display-*`, `--ui-label-tracking` | Three faces at most, self-hosted with metric-matched fallbacks; mono labels at 12px and up; the [type floor](style.md#diagrams) in drawings |
| **Shape**: container, inner, mark and control radii; stroke and rule weights | `--ui-radius*`, `--ui-stroke`, `--ui-rule-width` | One container radius per site |
| **Navigation**: a hue for each section of the site's navigation, its icon, and the shape of the marker that shows the reader's place (the uipack docs site: [its spec](../specs/docs-site.md#navigation)) | `## Navigation` in the spec, its values as site roles beside the palette | A hue marks place only: the section's icon, the current-place marker and the breadcrumb chip, always beside the section's label, never text or a status; 3:1 as a mark on every ground in both themes; the current place is also shown by position and weight, not by colour alone |
| **Ornaments**: backdrop, canvas pattern, eyebrow marker, section index, card corners, frames, nav fill, the primary button, the closing band, the stamp | The ornament slots | Ornaments never take space or move a box; one ambient effect per viewport; glow means selection, never ambience |
| **Treatments**: how cards, step numbers, stats, the quote, the featured plan and table cells are drawn | The treatment roles (`--ui-perf`, `--ui-card-*`, `--ui-num-*`…) | Treatments never reorder content or move a region |
| **Density**: vertical rhythm, type ratio, line length | `--ui-density`, `--ui-type-ratio`, `--ui-measure` | Spacing in multiples of the 8px base unit ([layout floors](layout/README.md#floors-what-holds-on-every-site)) |
| **Motion feel**: the settle and travel curves | `--ui-ease-*` | The timings (hover 120–160ms, quick 160, base 320, slow 560), reduced motion showing the finished state, one movement per beat ([motion](style.md#motion)) |
| **Page types**: which of landing, documentation, article, deck and dashboard the site has | `pages:` in the frontmatter | A deck is a page of the site and reads the same spec ([presentations](README.md#presentations-are-websites)) |
| **Layout**, per page type: grid (columns, gutters, max width), named regions, section order, hero pattern | `layouts:` in the frontmatter (an [archetype](layout/README.md#archetype-library) id, or `custom`) and `### <Page type>` under `## Layout` | The [layout floors](layout/README.md#floors-what-holds-on-every-site): reading order is DOM and keyboard order, a real narrow layout, no page-wide overflow, tap targets of 44px on touch and 24px fine, visible focus, the 8px base unit; a style never moves a region |
| **Writing style**: tone and register, title form per page type, copy density, house words, tighter budgets | `## Writing style` | The [core writing rules](writing/README.md#core-and-site): no invented facts, answer first, one claim per unit, numbers with sources, no AI tells, accessible language; the [slot ceilings](writing/general.md#slot-budgets) a budget may tighten but never loosen |
| **Component looks**: which look of each component the site uses | `components:` in the frontmatter, `## Component looks` | A `fixed` look's values ([Blueprint](../components/diagrams.md): card surface, shapes, flow colours, label face, strokes): only light and dark follow the site, and in dark the ground a look sits on (its card, canvas, surfaces and solid lines) may be the site's own, set in its spec ([the docs site's](../specs/docs-site.md#demos-and-fixed-looks)); never its hues, shapes or faces. A `flex` look keeps its drawing and takes the roles its doc lists ([every look](../components/README.md)) |

Not settable anywhere: keyboard and touch support for every interaction, persistent and reversible
selection that does not rely on colour alone, links that stay links, and the component behaviour
each part documents.

`scripts/check-spec.ts` holds a spec to this table where it can: every page type in `pages:` has a
layout, every picked look exists and is offered, the Writing style table has its rows, and a spec
never sets a value a fixed look it picks owns.
