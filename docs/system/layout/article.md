# Layout archetype: layered long read

The `layer-article` archetype: a long read or a blog post as one text column and a run of sections,
each built from the `uipack/article` parts. A site's spec picks it for its `article` page type
(`layouts: { article: layer-article }`) or extends it; every site keeps the
[layout floors](README.md#floors-what-holds-on-every-site). The words follow the site's writing
style and [read-alone documents](../writing/documents.md#articles-and-blog-posts).

<!-- generated:layout-archetype -->
- **Archetype:** `layer-article` (Layered long read), for the `article` page type.
- **Grid:** One text column at the reading measure; figures and `wide` clusters break out to the figure slot.
- **Regions:** Title, lede, a run of sections, each from the article parts.
- **Section order:** Each section: head strip, heading, prose, terms, change note, callout, links, notes.
- **Hero:** The title and a one-sentence lede; a figure only when it carries the claim.
- **Rendered by:** `LayerSection` parts (`uipack/article`).
<!-- /generated -->

**Extending it.** A spec may drop parts it never uses (a blog without `ChangeNote` or `NoteCluster`),
change the measure, and choose whether a figure may lead the page, and says so under its
`### Article`. Parts it keeps stay in this order.

## A section's parts

A long read is a run of sections, each built from `uipack/article` parts in the order
`LayerSection` renders them (`examples/articleParts.tsx`):

<!-- generated:article-section-order -->
1. `LayerHead`: the strip above the heading: the layer's index, its zone and one metric
2. `<h2> or <h3>`: the section's heading, a plain name
3. `<p>`: the prose: the argument, a few short paragraphs
4. `TermList`: the terms the section uses, each with a one-line gloss
5. `ChangeNote`: what changed recently, dated
6. `Callout`: a self-test question for the reader
7. `LinkList`: where to go deeper
8. `NoteCluster`: the writer's own notes on the layer
<!-- /generated -->

Clusters stay in the text column; a `wide` cluster breaks out to the figure slot. Figures follow
the [figure layout](README.md#figures): decide the render width first, then size the drawing.

## Narrow

The column is the page at every width; `wide` clusters and figures fall back into it below their
breakout width, and figures switch to their authored narrow drawing or scroll inside their frame.
