# Layout archetype: docs shell

The `docs-shell` archetype: a page someone reads in a navigable set, such as product documentation
or a reference page. It covers the shell's regions, the prose column, where demos and tables sit,
and the narrow form. A site's spec picks it for its `documentation` page type
(`layouts: { documentation: docs-shell }`) or extends it; every site keeps the
[layout floors](README.md#floors-what-holds-on-every-site). A long read is the
[layered article](article.md). The words follow the site's writing style and
[read-alone documents](../writing/documents.md); the build steps are the
[documentation recipe](../../recipes/documentation.md).

<!-- generated:layout-archetype -->
- **Archetype:** `docs-shell` (Docs shell), for the `documentation` page type.
- **Grid:** Sidebar, article column at the reading measure, On this page; one column below 900px.
- **Regions:** Header, sidebar, context row, article, On this page, pager.
- **Section order:** h1, what the page is for, the values table, the detail, related pages.
- **Hero:** None: the page's h1 and its first line.
- **Rendered by:** `DocsLayout`, `DocsMarkdown` (`uipack/docs`).
<!-- /generated -->

**Extending it.** A spec may change the measure, which regions it shows (no "On this page", no
pager) and the context row's links, and says so under its `### Documentation`.

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

## Narrow

Below 900px the sidebar and contents leave the page; the article is the column. Tables keep a
readable width per column and scroll inside their wrapper; figures switch to their authored narrow
drawing or scroll inside their frame. Nothing widens the page at 390px. (The 900px switch is literal
in `src/docs/docs.css`.)
