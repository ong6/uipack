# Layout: dashboard

The layout of a screen someone checks rather than reads: live numbers, a table of records, a
schedule, status. It covers the regions, how tiles and tables share a row, and the phone's narrow
form. It adds to the [rules for every layout](README.md#rules-for-every-layout). The build steps
are the [dashboard recipe](../../recipes/dashboard.md). No page in this repo is a dashboard yet;
the parts below are the ones UiPack ships for one.

## Grid and spacing

A dashboard uses the web grid from `uipack/web`:

<!-- generated:web-grid -->
- **Columns:** 12 at a container of 1024px and up, 8 from 640px, 4 below.
- **Spacing:** 8, 16, 24, 32, 48, 64, 96, 128 px; nothing between the steps.
- **Type:** a 16px base on a 1.25 ratio.
<!-- /generated -->

## Regions

Read top to bottom, start to end, in this order:

| Region | Holds | Parts |
| --- | --- | --- |
| Title row | What the screen is about, its scope and the time the data is from | `Heading`, `Eyebrow`, `Body` |
| Headline numbers | Three or four measured facts of equal weight, one highlighted | `Proof` with `stats` and no `lead`, or `KpiTiles` on a slide |
| The question it answers | One chart or figure for the trend or flow the numbers come from | `LineChart`, `BarChart`, `StackedBar`, `Figure`, `SpanChart` |
| Records | The rows someone acts on | `ProductWindow` around `DataTable`, `ItemList`, `RecordCard` or `FileTable` |
| Time | What happens when | `ScheduleGrid` |
| Source | Where every number comes from and when it was read | A `source` tag on the window, or a source line |

One question per screen. A second question is a second screen or a tab, not a fourth row of
tiles.

## Rules

- **The headline numbers come first** and stay on the first screen at 1440 and at 390.
- **Equal weight, equal boxes.** Tiles in a row share a height; windows that share a row share a
  height, and a stretched window gives the height to its body, so no window ends in an empty box.
- **Mark the column the screen is about** (`priority: "key"` on a `DataTable` column): it stays
  pinned or large at every width. Columns a phone can lose take `priority: "low"`.
- **Status is not colour alone.** A row's state carries a word or a shape as well
  (`ItemList` `status`, `RecordCard` `status`).
- **A data source per window,** in its `source` tag, not a lone footer.
- **No decoration behind numbers.** Backgrounds and ambient motion stay off a dashboard; motion
  only shows a value changing.

## Narrow

At a phone's width the grid drops to its narrow columns and every region stacks in the order
above. A `DataTable` drops its low-priority columns, then stacks each row as a small record, with
the key column large on the row's name line (`narrow`: `fit`, `stack`, `scroll` override it).
Charts keep a readable width and scroll inside their frame rather than shrinking their labels.
