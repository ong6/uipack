---
rubric: dashboard
version: 1
frozen: 2026-11-06
page-type: dashboard
---

# Dashboard rubric, version 1

Frozen on 2026-11-06. A change to any line is version 2 in a new file; this file never changes.
Score each page 1 to 10 per criterion against the descriptions of 3, 6 and 9, citing a screenshot
and a region (or quoted words) for every score. A severe flaw caps a criterion at 4. The overall
score is your judgement, not an average. Use the same rubric for the reference page.

| Score | Means |
| --- | --- |
| 9 | An analytics or operations team would use it daily without changes |
| 6 | The numbers are there, but reading them takes effort or invites a wrong reading |
| 3 | A reader would draw the wrong conclusion or could not find the number they need |

## Criteria

### B1 The question answered first

Definition: the most important number or status for the brief's reader is the first thing seen,
with its comparison.

- 3: Equal-weight tiles; the key number is missing or buried.
- 6: The key number is prominent, but without a comparison (target, previous period).
- 9: The headline number, its change and its target are seen first; the rest explains it.

Check: from the first screen, write the answer to the brief's main question. Cannot, scores 4 or less.

### B2 Honest charts

Definition: chart forms suit the data; axes, baselines, units and periods are true and labelled.

- 3: Truncated axes that exaggerate, pie charts of many slices, unlabelled units.
- 6: Correct forms; a missing unit, legend lookups, or inconsistent periods across tiles.
- 9: Every chart labelled on the data, with units, periods and a zero baseline where magnitude matters.

Check: for each chart, name its unit, period and baseline. Note any you cannot.

### B3 Density and scanning

Definition: much information, little effort: aligned numbers, consistent tiles, clear grouping.

- 3: Clutter or emptiness; numbers not aligned; groups unclear.
- 6: Organised, but tiles differ in height in a row, or tables use proportional digits.
- 9: A tight grid; tabular digits aligned right; groups labelled; tiles in a row share a height.

Check: compare tile heights per row and the alignment of numbers in tables.

### B4 States and trust

Definition: freshness, empty, loading and error states are shown; the reader knows how current the data is.

- 3: No timestamps; zeros indistinguishable from missing data.
- 6: A last-updated time; empty and error states not distinguished.
- 9: Freshness on every tile that can go stale; empty, partial and error states each read differently.

Check: find the data's timestamp and any tile that could be empty; describe how empty would look.

### B5 Colour with meaning

Definition: colour encodes status or series consistently and never alone; it survives dark mode.

- 3: Decorative colour; red and green as the only signal; dark mode loses series.
- 6: Consistent colours, but status by colour alone or a muddy dark palette.
- 9: Colour carries one meaning each, with a label or shape beside it; equally clear in dark.

Check: list what each colour means; mark any meaning carried by colour alone.
