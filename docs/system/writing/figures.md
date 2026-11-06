# Writing: figure labels and captions

How to write the words of a diagram, chart, motion beat or 3D stop: the caption, node and arrow
labels, statistics and the source line. It adds to the [general rules](general.md). How figures
are laid out is in [Layout, figures](../layout/README.md#figures); their look is the
[diagram family](../../families/diagrams.md).

## Lengths

<!-- generated:word-guides -->
| Text | Length | The check |
| --- | --- | --- |
| Presented slide title | aim for 2–5 words | `title-length` stops at 6 |
| Read-alone title, figure title | 3–14 words, one sentence | `title-length` stops at 14 |
| Web section head | 2–5 words | not linted |
| Label in a drawing | 2–3 words | `slot-budget` stops at 3 |
| Slide points | 2–4 a slide, each at most 8 words | `slot-budget` |
| Speaker cues (`say`, presented) | at most 60 words | `notes-cues` |
<!-- /generated -->

## The caption

The caption states the claim. A stranger should be able to say it from the picture alone, and the
caption confirms it. The source line is the figure's one place for sources: every number in it
shares the caption's population and window, and a number with a different source names its own
there.

## Nodes and labels

- Draw the system or the flow: at most six nodes. Past that, use two figures with two claims, or a
  drill-down.
- Labels are two or three words in the input's words, never coined ones. Name the parts, not the
  system: not one box labelled "RAG pipeline" but Chunk → Embed → pgvector.
- A `hint` (selection note) is one short sentence on what the part does.
- Step numbers (`01 / 02 / 03`) only when order matters, and the caption refers to them.

## Arrows and statistics

- Arrows follow the flow and say what moves or the rule that gates it (`decoded image`,
  `~1000 chars`, `1536-dim`), never a statistic or a noun that names no change (`user sessions`).
- A statistic lives once, in the sub-label of the node it measures, with its baseline:
  `p95 198ms · was 410ms`. On an arrow it reads as if it covered only that path.
- Results live in a sub-label or the caption, never as their own node; a time window
  (`30 days after`) is not a node either.

## Paths

- Draw only the paths the input describes. Each branch reaches a node or rejoins the flow; a
  branch the input doesn't follow ends at its last known node, with its number in that node's
  sub-label (`Misrouted · 6%, was 4%`). Never draw an unknown as a node.
- A figure of a change draws both states, with the old path faded beside the new; before and after
  panels show the same measures.
- A part outside the figure's scope (a planned step) says so in its sub-label (`planned · not live`).

## Motion beats

Write a beat script before animating: one line per beat, saying what changes and why it matters.

```text
01  The request leaves the browser and reaches the edge cache.
02  Cache miss: it continues to the origin.
03  The response rides back; the cache keeps a copy.
```

One change per beat (a beat with "and" in it is two). Each line becomes the step narration, the
speaker `say` or the voice-over, and the resting frame makes the point without the motion.

## 3D stops

One subject, one story: the stops as a beat script, one sentence of narration each, and only the
labels that stop's sentence needs. Inspect details are one sentence on what the part does. The 2D
fallback lists the same parts and connections in words a reader can follow.
