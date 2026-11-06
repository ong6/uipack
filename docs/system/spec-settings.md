# What a site spec may set

A site spec chooses the brand; the core rules hold for every site. This page is the boundary:
what a spec ([how to write one](../specs/README.md)) may set, and what no spec changes. When a
brief asks for something in the right-hand column, the answer is a change to the core rules for
every site, not a spec setting.

| A spec may set | Through | Fixed for every site |
| --- | --- | --- |
| **Palette**: paper, surfaces, the ink ramp, the one accent, data and invert sets, light and dark | The colour roles in the [role contract](style.md#the-role-contract) | One accent per unit; contrast of 4.5:1 for small text and 3:1 for large and for marks, in both themes; hierarchy by weight and opacity, not more hues; red is a data colour only |
| **Faces**: display, text and label, their weights, tracking and case | `--ui-font-*`, `--ui-display-*`, `--ui-label-tracking` | Three faces at most, self-hosted with metric-matched fallbacks; mono labels at 12px and up; the [type floor](style.md#diagrams) in drawings |
| **Shape**: container, inner, mark and control radii; stroke and rule weights | `--ui-radius*`, `--ui-stroke`, `--ui-rule-width` | One container radius per site |
| **Ornaments**: backdrop, canvas pattern, eyebrow marker, section index, card corners, frames, nav fill, the primary button, the closing band, the stamp | The ornament slots | Ornaments never take space or move a box; one ambient effect per viewport; glow means selection, never ambience |
| **Treatments**: how cards, step numbers, stats, the quote, the featured plan and table cells are drawn | The treatment roles (`--ui-perf`, `--ui-card-*`, `--ui-num-*`…) | The same parts in the same regions and columns; treatments never reorder content |
| **Density**: vertical rhythm, type ratio, line length | `--ui-density`, `--ui-type-ratio`, `--ui-measure` | The 8pt spacing scale and the 12 / 8 / 4 column grid ([layout](layout/landing.md#grid-and-spacing)) |
| **Motion feel**: the settle and travel curves | `--ui-ease-*` | The timings (hover 120–160ms, quick 160, base 320, slow 560), reduced motion showing the finished state, one movement per beat ([motion](style.md#motion)) |
| **Voice and register**: how formal, how warm, house words to prefer or avoid | The spec's Settings chosen | The [writing rules](writing/README.md): one claim per unit, answer first, slot budgets, numbers with sources, no AI tells |
| **Page types**: which of landing, documentation or article, deck slide and dashboard the site uses | The spec's Page types | Each page type's regions and reading order |
| **Section order**: a deviation from a page type's order, when the site's content needs it | `uiStyles[].prefers` (opt-in, `WebPage layout="style"`) | The author's order is the default; a deviation never drops the hero's real product output |
| **Families**: which shared families the site draws with | `uses:` in the frontmatter | A family's fixed values (the [diagram family](../families/diagrams.md): card surface, shapes, flow colours, label face, strokes); only light and dark follow the site |

Not settable anywhere: keyboard and touch support for every interaction, visible focus, persistent
and reversible selection that does not rely on colour alone, links that stay links, readable
narrow layouts with no page-wide overflow, and the component behaviour each part documents.
