# Crawl files

How `buildCrawlFiles` writes robots.txt (with a stance per AI crawler), sitemap.xml and llms.txt,
how `rssFeed` writes a feed, and when to use `Section lazyRender`. The crawler table and why the
default allows all are in [Web discoverability](../web-discoverability.md#ai-crawler-stance).

## Crawl files: `buildCrawlFiles`

```ts
import { buildCrawlFiles } from "uipack/web";

const files = buildCrawlFiles({
  site: "https://tidy.example",
  aiCrawlers: "allow-all",                  // or "search-only", "block-all", or { preset, GPTBot: "disallow", … }
  disallow: ["/app/", "/api/"],             // repeated in every group (see below)
  pages: [
    { path: "/", title: "Tidy", description: "What Tidy does and costs.", lastmod: "2026-10-22" },
    { path: "/pricing", title: "Pricing", lastmod: new Date(), markdown: "/pricing.md" },
    { path: "/changelog", title: "Changelog", optional: true },
    { path: "/thanks", title: "Thanks", noindex: true },
    { path: "https://github.com/tidy/tidy", title: "Source", section: "Docs" }, // llms.txt only
  ],
  llms: { title: "Tidy", summary: "Tidy is an inbox agent that …", details: "Optional paragraph." },
});
// files["robots.txt"], files["sitemap.xml"], files["llms.txt"]
// Give pages `content: "<their Markdown>"` and files["llms-full.txt"] appears too.
```

- **robots.txt**: a `*` group, then one group per AI crawler with a comment saying what it does and
  whether it is allowed, and a `Sitemap:` line. A crawler obeys only the most specific group that
  names it, and user-agent groups are not combined with `*` ([robots.txt][g-robots]), so the
  `disallow` paths are written into every allowed group. `robotsTxt`, `resolveAiCrawlers` and
  `AI_CRAWLERS` (agent, operator, purpose, note, docs URL) are exported for custom files.
- **sitemap.xml**: `<loc>` and `<lastmod>` only, for this site's own indexable URLs. Google ignores
  `<priority>` and `<changefreq>` and uses `<lastmod>` only while it is "consistently and verifiably"
  accurate ([build a sitemap][g-sitemap]), so set it from real content changes or leave it out.
  `formatLastmod` accepts a `Date` or a W3C date and rejects anything else.
- **llms.txt** per [llmstxt.org][llms]: an H1 name, a blockquote summary, optional details, H2
  sections of list lines (a Markdown link to the page, then a colon and notes), and `## Optional` last for links an agent may skip. Pages with
  `markdown` link their Markdown copy. Google Search does not use llms.txt and it neither helps nor
  hurts there ([AI optimization guide][g-aio]); it is a cheap courtesy to tools that read it.
- **llms-full.txt**, when any page has `content` (its Markdown): the llms.txt header and a
  `Source:` line, then each page as `# Title`, `URL:`, `Updated:` (from `lastmod`) and its text,
  separated by `---`, in llms.txt order. Frontmatter and a leading H1 that repeats the title are
  dropped. llms.txt then lists it under `## Optional` as "Full text". `llmsFullTxt()` builds it alone.

`scripts/build-crawl-files.ts` writes the files:

```sh
npx tsx scripts/build-crawl-files.ts --out public                    # the /web demo's files
npx tsx scripts/build-crawl-files.ts --config ./crawl.config.ts --out public
```

A config module's default export is `BuildCrawlFilesOptions`, or a function of `--site` returning one.

## Feed: `rssFeed`

The feed `pageMeta`'s `rss` option links to. Serve the result at that path.

```ts
import { rssFeed } from "uipack/web";

const xml = rssFeed({
  title: "Tidy notes",
  link: "https://tidy.example",            // absolute; item paths resolve against it
  description: "What changed in Tidy and why.",
  self: "/feed.xml",                        // optional: atom:link rel="self", which validators ask for
  language: "en-gb",                        // optional
  items: [
    { title: "Filters run before drafts", link: "/notes/filters", pubDate: "2026-10-20", description: "<p>HTML is fine.</p>" },
    { title: "Hello", link: "/notes/hello", guid: "tidy-note-1", pubDate: new Date("2026-09-01") },
  ],
});
```

RSS 2.0, newest entry first. Text is XML-escaped, so an HTML `description` reaches the reader as the HTML it was; characters XML cannot carry are dropped. `pubDate` takes a `Date` or ISO 8601 and is written as RFC 822 in GMT. An item's `guid` defaults to its absolute link (`isPermaLink="true"`); give one when the URL may change. `lastBuildDate` is the newest entry's date, not the build time, for the reason `lastmod` is: a date that moves on every deploy says nothing. Like `buildCrawlFiles`, it throws on a relative `link` or an unreadable date.

## `Section lazyRender`

`<Section lazyRender>` sets `content-visibility: auto` with `contain-intrinsic-size: auto 720px`:
the browser skips layout and paint until the section nears the viewport and then remembers its
real size ([web.dev, content-visibility][wd-cv]). The content stays in the DOM and the
accessibility tree, so crawlers, find-in-page and screen readers still get it. Use it only below
the last in-page link target: an anchor jump computes its position from the placeholder heights of
unrendered sections above it. In the `/web` demo the FAQ sits above the Pricing anchor, so it
stays off.

[g-aio]: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
[g-robots]: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
[g-sitemap]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
[llms]: https://llmstxt.org/
[wd-cv]: https://web.dev/articles/content-visibility
