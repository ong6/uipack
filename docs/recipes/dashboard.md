# Recipe: dashboard

How to build a screen someone checks: headline numbers, one chart, the records to act on, and
their sources. The order, the parts, and the rules it relies on. No dashboard ships in this repo
yet, so there is no example page to compare against; check the draft against the
[dashboard layout](../system/layout/dashboard.md) instead.

## Relies on

- Words: [figure labels and captions](../system/writing/figures.md) for charts and tiles, and the
  [general rules](../system/writing/general.md) (each number keeps its own words and source).
- Layout: [dashboard](../system/layout/dashboard.md): regions, equal boxes, the narrow form.
- Parts: [Web principles](../web-principles.md) for the product-surface parts,
  [Consulting slides](../deck-consulting.md) for the charts, [Charts](../charts.md).

## Section order

1. Title row: what the screen is about, its scope, when the data is from.
2. Headline numbers: three or four facts of equal weight.
3. One chart or figure: the trend or flow behind the numbers.
4. Records: the rows someone acts on.
5. Time: a schedule, when the screen needs one.
6. Sources.

## Parts

| Region | Parts | From |
| --- | --- | --- |
| Frame and grid | `WebSurface`, `Grid`, `GridItem` | `uipack/web` |
| Title row | `Eyebrow`, `Heading`, `Body` | `uipack/web` |
| Headline numbers | `Proof` (`stats`, no `lead`) | `uipack/web` |
| Chart | `LineChart`, `BarChart`, `StackedBar`, `Sparkline` | `uipack/deck` |
| Records | `ProductWindow`, `DataTable`, `ItemList`, `RecordCard`, `FileTable` | `uipack/web` |
| Time | `ScheduleGrid` | `uipack/web` |

## Steps

1. Write the one question the screen answers; it becomes the title row.
2. Pick the three or four numbers that answer it, each with its baseline and source.
3. Choose the one chart that shows where the numbers come from.
4. Mark the table's key column `priority: "key"` and the columns a phone can lose `"low"`.
5. Check at 390: the numbers stay first, rows stack, nothing overflows.
