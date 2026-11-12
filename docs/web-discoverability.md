# Web discoverability

How a page built with `uipack/web` gets found, read and quoted: by search engines, by answer
engines (ChatGPT search, Perplexity, Claude, Google AI Overviews and AI Mode), and by people on a
slow phone. The components handle what they can; this page lists what is left to the page author,
the helpers for it, and the numbers measured on the `/web` demo.

What the sources agree on: answer engines retrieve from an index and quote pages they can fetch,
so the basics decide visibility. Google says AI Overviews and AI Mode have "no additional
technical requirements" beyond being indexed and eligible for a snippet, and that llms.txt files,
"chunking" and AI-only rewrites are not needed for Google Search ([AI features][g-ai],
[AI optimization guide][g-aio]). The kit therefore spends its effort on real text in the HTML, a
correct head, honest structured data, an explicit crawler policy and a fast first view.

The detail is split by topic:

| Topic | File |
| --- | --- |
| The head, fonts, structured data and the FAQ | [Head and structured data](web-discoverability/head-and-structured-data.md) |
| robots.txt, sitemap.xml, llms.txt, the feed and lazy sections | [Crawl files](web-discoverability/crawl-files.md) |
| Measured load and paint numbers, before and after | [Web performance](web-discoverability/performance.md) |

## Checklist

A `uipack/web` page is ready to be found and quoted when:

| # | Check | How |
| --- | --- | --- |
| 1 | Every headline, demo step, stat and answer is **text in the server HTML**, not only in animation frames, canvas or `::before`. | Server-render or pre-render the page. The animated components already put their final text in the HTML (see [the audit](#component-audit)). |
| 2 | **One `h1`** (the hero title), then `h2` per section and `h3` per card or question, with no skipped levels. | `StarHero` renders the `h1`; `Section` titles are `h2`; `FeatureGrid` and `FAQ` items are `h3`. `Heading level` goes to 6; `size` is separate from level. |
| 3 | **Links are links.** Navigation and CTAs that go somewhere are `<a href>`. | `CtaButton href`, `GlassNav links`, `FeatureGrid` `href`. |
| 4 | **A real head**: unique title, description, absolute canonical without view-state parameters, Open Graph and Twitter tags; links to the Markdown twin, `llms.txt` and the feed where the site has them. | `pageMeta()` → `HeadTags` (server) or `useHead` (client) or `headTagsToHtml` (static). |
| 5 | **JSON-LD for what the page shows**: the organisation, the site, the product with the Pricing section's offer, the FAQ. Nothing invisible, no invented ratings. | `organization` (or `person` for a personal site), `webSite`, `softwareApplication` / `product` + `offer`, `faqPage`, `breadcrumbList`, `article`, `jsonLd`, `<JsonLd>`. |
| 6 | **Answers that stand alone**: each FAQ answer's first sentence answers the question and names the product instead of "it". | `<FAQ items>`; visible text and FAQPage JSON-LD come from the same array. |
| 7 | **robots.txt with a stance per AI crawler**, `sitemap.xml` with accurate `lastmod`, and (optionally) `llms.txt` and an RSS feed. | `buildCrawlFiles()`, or `scripts/build-crawl-files.ts`; `rssFeed()` ([crawl files](web-discoverability/crawl-files.md)). |
| 8 | **Fast first view**: LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms at the 75th percentile ([web.dev][wd-cwv]). | Preload only the hero's display face (`fontPreloads`), keep motion idle until in view (it is), use `Section lazyRender` low on the page. |

## Component audit

Crawlers that do not run JavaScript read the HTML as served; Google renders JavaScript but still
recommends server-side or pre-rendering because "not all bots can run JavaScript"
([JavaScript SEO basics][g-js]). Each animated component was rendered with `renderToString` and
checked for its final text (`test/web-seo.test.tsx`).

| Component | Before | After |
| --- | --- | --- |
| `TextScramble` | Server HTML held the text twice: a transparent ghost plus the live layer. Text extraction read "Forty in. Three left. Forty in. Three left." | Server HTML and the first client render hold the text once, visible. The live (aria-hidden) layer is added after mount, over the ghost, which stays the accessible text. |
| `NumberTicker` | Same duplication ("37 37"). | Final value once, visible, until mounted; then counts as before. |
| `DemoPlayer` | Server HTML was frame 0 only: the first prompt and the starting metric (40). Later steps, the actions and the result (3) existed only after playback. | A transcript of every step, prompt and action and the final result is always in the HTML: visible under reduced motion ("Demo steps"), visually hidden otherwise ("Demo transcript"), so screen readers get the whole demo too. |
| `RevealText` (`lines`) | Line units had no whitespace between them, so extracted text ran lines together ("…coffee.It leaves…"). | A space between every unit; block lines collapse it visually. Words were already fine, and the text was already visible without JavaScript. |
| `Marquee` | Server HTML listed every item twice (the loop copy is aria-hidden and inert, but still text). | The loop copy is added after mount; server HTML lists each item once. |
| `Heading` | Levels 1–4 only. | Levels 1–6. |
| `StarHero`, `Section`, `FeatureGrid`, `GlassNav`, `CtaButton` | Already correct: one `h1`, `h2`/`h3`, real `<a href>`, decorative SVG `aria-hidden`. | Unchanged; covered by a test. |
| Backgrounds, `StarChart`, `RhymeIcon` | Decorative only (`aria-hidden`), sized by `viewBox` and CSS or explicit `width`/`height`; `::before`/`::after` hold only `content: ""` decoration. | Unchanged. |

No `uipack/web` component renders a raster image, so there is no `<img>` to size; give your own images
`width` and `height` (or `aspect-ratio`) so they reserve their box.

## AI crawler stance

`buildCrawlFiles` names each crawler explicitly, whatever the policy, so the file documents the
decision. The default is **allow-all**.

| Agent | Operator | Purpose | allow-all | search-only | What blocking it changes |
| --- | --- | --- | --- | --- | --- |
| OAI-SearchBot | OpenAI | Search index | allow | allow | Not shown in ChatGPT search answers, only as navigational links ([OpenAI][oai]). |
| ChatGPT-User | OpenAI | User-asked fetch | allow | allow | Little: user-initiated, so "robots.txt rules may not apply" ([OpenAI][oai]). |
| GPTBot | OpenAI | Training | allow | disallow | Content not used to train OpenAI's foundation models; independent of search ([OpenAI][oai]). |
| Claude-SearchBot | Anthropic | Search index | allow | allow | Less visible and accurate in Claude's search results ([Anthropic][ant]). |
| Claude-User | Anthropic | User-asked fetch | allow | allow | Claude cannot retrieve the page for a user's question ([Anthropic][ant]). |
| ClaudeBot | Anthropic | Training | allow | disallow | Future content excluded from Anthropic's training data ([Anthropic][ant]). |
| PerplexityBot | Perplexity | Search index | allow | allow | Not surfaced or linked in Perplexity answers; it is not used for training ([Perplexity][pplx]). |
| Perplexity-User | Perplexity | User-asked fetch | allow | allow | Little: it "generally ignores robots.txt rules" ([Perplexity][pplx]). |
| Google-Extended | Google | Training and Gemini grounding | allow | disallow | Content not used to train Gemini or to ground Gemini Apps and Vertex AI answers. No effect on Google Search, AI Overviews or ranking ([Google crawlers][g-crawlers]). |
| Applebot-Extended | Apple | Training | allow | disallow | Content not used to train Apple's foundation models; Applebot search is unaffected and it crawls nothing itself ([Apple][apple]). |
| CCBot | Common Crawl | Open archive | allow | disallow | Left out of Common Crawl's corpus, which many training sets use ([Common Crawl][cc]). |

**Why allow-all by default.** A landing page is marketing copy written to be repeated. Blocking a
training crawler does not remove the page from any answer engine, but it gives up two things: the
product's name and positioning in future models that answer without browsing, and, for
Google-Extended, grounding in Gemini Apps. Google Search and AI Overviews use Googlebot, which no
preset touches. Choose **search-only** for pages whose value is original writing you do not want
trained on (articles, documentation, research): answer engines can still find, fetch and cite them.
**block-all** refuses every listed AI agent. Two caveats: robots.txt is a request, not access
control, and user-triggered agents may not follow it.

## Limits

- The playground is a client-rendered SPA, so its raw HTML has none of this; the e2e tests read the
  rendered DOM. A real page must be server-rendered or pre-rendered for checks 1, 4 and 5
  to reach crawlers that do not run JavaScript.
- The playground's `index.html` carries `<meta name="robots" content="noindex">`. The deployed
  docs site (`npm run build:site`, `playground/site.ts`) writes one file per route: docs pages drop
  it and get a canonical, while the Tidy page (`/web`, an illustrative product) and 404.html keep
  it, so the demo never gets indexed. The site's root robots.txt, sitemap.xml and llms.txt describe
  the docs; this page shows Tidy's own under "View generated". A real page sets `robots` through
  `pageMeta` only for previews.
- The demo page has no `og:image`. Social previews fall back to a summary card.
- The FAQ JSON-LD no longer earns a Google rich result; it is kept for other consumers.
- `DemoPlayer`'s transcript holds step text, prompts, actions and the final metric, not the
  `screen` React nodes (the rich result rows), which still appear only after playback.

## Sources

- Google Search Central: [AI features and your website][g-ai]; [Optimizing for generative AI search][g-aio]; [JavaScript SEO basics][g-js]; [Structured data general guidelines][g-sd]; [Software app structured data][g-app]; [Documentation updates][g-updates] (FAQ rich result removed); [robots.txt][g-robots]; [Build a sitemap][g-sitemap]; [Google's common crawlers][g-crawlers] (Google-Extended).
- Crawler operators: [OpenAI][oai]; [Anthropic][ant]; [Perplexity][pplx]; [Apple][apple]; [Common Crawl][cc].
- [llmstxt.org][llms].
- web.dev: [Web Vitals][wd-cwv]; [Best practices for fonts][wd-fonts]; [content-visibility][wd-cv].

All read in October 2026.

[g-ai]: https://developers.google.com/search/docs/appearance/ai-features
[g-aio]: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
[g-js]: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
[g-sd]: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
[g-app]: https://developers.google.com/search/docs/appearance/structured-data/software-app
[g-updates]: https://developers.google.com/search/updates
[g-robots]: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
[g-sitemap]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
[g-crawlers]: https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
[oai]: https://platform.openai.com/docs/bots
[ant]: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
[pplx]: https://docs.perplexity.ai/guides/bots
[apple]: https://support.apple.com/en-us/119829
[cc]: https://commoncrawl.org/ccbot
[llms]: https://llmstxt.org/
[wd-cwv]: https://web.dev/articles/vitals
[wd-fonts]: https://web.dev/articles/font-best-practices
[wd-cv]: https://web.dev/articles/content-visibility
