# Recipe: documentation and article page

How to build a page someone reads: product documentation in `uipack/docs`, or a long article with
`uipack/article` parts. The order inside a page, the parts, and the rules it relies on. Compare
your draft with the [example text page](../examples/text-page.md).

## Relies on

- Words: [read-alone documents](../system/writing/documents.md), on top of the
  [general rules](../system/writing/general.md); figure words from
  [figure labels and captions](../system/writing/figures.md).
- Layout: [documentation and article](../system/layout/documentation.md).
- Parts: [Docs layout](../docs-layout.md) and [Article parts](../article.md).

## Section order

A documentation page, top to bottom:

1. `#` title: the page's plain name.
2. One line that says what the page is for.
3. The values or options table.
4. One `##` per topic a reader might jump to, with code that runs as written.
5. Related pages.

A long article's section, in the order `LayerSection` renders it (generated from
`examples/articleSectionParts.ts`):

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

## Parts

| Need | Part | From |
| --- | --- | --- |
| The shell: sidebar, article, on this page, pager | `DocsLayout` | `uipack/docs` |
| Markdown with anchors, tables, code and live blocks | `DocsMarkdown`, `extractDocsHeadings` | `uipack/docs` |
| A figure in the prose | `Figure` or a preset (`pipeline`, `agentLoop`…) | `uipack`, `uipack/presets` |
| A layer strip, terms, a self-test, what changed, links, notes | `LayerHead`, `TermList`, `Callout`, `ChangeNote`, `LinkList`, `NoteCluster` | `uipack/article` |
| A layered chart | `SpanChart`, `LayerStack` | `uipack/charts` |

## Steps

1. Write the page's first line: what it is for.
2. Put the values table near the top; the reader who only needs a value stops there.
3. Give each topic its own `##`, with a plain name.
4. Embed demos as `uipack-demo` blocks, each naming what it shows.
5. Keep the file under about 300 lines; split a second topic into its own file.

## Before you ship

- One topic per file; the first line says what it is for.
- Every link resolves, and every example runs as written.
- At 390, tables scroll inside their box and figures use their narrow drawing.
