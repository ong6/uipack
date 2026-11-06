# Layout: documentation and article

The layout of a page someone reads: product documentation, a reference page or a long article.
It covers the docs shell's regions, the prose column, where demos and tables sit, and the parts of
a long article's section. It adds to the [rules for every layout](README.md#rules-for-every-layout).
The words are [read-alone documents](../writing/documents.md); the build steps are the
[documentation recipe](../../recipes/documentation.md).

## Regions

A documentation page is `DocsLayout` from `uipack/docs`:

| Region | Holds | Below 900px |
| --- | --- | --- |
| Header | The site's banner (`header`): logo, theme toggle, phone menu | Stays |
| Sidebar | Every page, grouped; the current one marked | A disclosure, or the header's menu (`mobileNavigation={false}`) |
| Context row | The group, "View as Markdown", "Edit on GitHub" (`eyebrow`, `markdownHref`, `editHref`) | Wraps |
| Article | The page's one `h1`, then the prose column | Full width |
| On this page | The page's h2 and h3, the one being read marked | Hidden |
| Pager | Previous and next, in the sidebar's reading order | Stays |

Pass `width="wide"` when a page embeds wide demos: the article takes the space between the
sidebar and the contents, prose keeps its measure, and a `wide` block takes the whole column. The
measure, column widths and breakpoints are in [Docs layout](../../docs-layout.md).

## Reading order inside a page

1. The `h1`: the page's plain name.
2. The first line says what the page is for.
3. The values or options table, near the top.
4. The detail, one h2 per topic a reader might jump to.
5. Related pages, last.

One topic per file, short enough to read whole. A table that is too wide scrolls inside its own
box; the page never widens. A live demo is a `uipack-demo` block between prose runs
([how](../../docs-layout.md#live-blocks-inside-the-markdown)), so the raw file still says what it
shows.

## A long article's section

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

Below 900px the sidebar and contents leave the page; the article is the column. Tables keep a
readable width per column and scroll inside their wrapper; figures switch to their authored narrow
drawing or scroll inside their frame. Nothing widens the page at 390px.
