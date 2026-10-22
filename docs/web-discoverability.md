# Web discoverability (Landing style)

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

## Checklist

A Landing page is ready to be found and quoted when:

| # | Check | How |
| --- | --- | --- |
| 1 | Every headline, demo step, stat and answer is **text in the server HTML**, not only in animation frames, canvas or `::before`. | Server-render or pre-render the page. The animated components already put their final text in the HTML (see [the audit](#component-audit)). |
| 2 | **One `h1`** (the hero title), then `h2` per section and `h3` per card or question, with no skipped levels. | `StarHero` renders the `h1`; `Section` titles are `h2`; `FeatureGrid` and `FAQ` items are `h3`. `Heading level` goes to 6; `size` is separate from level. |
| 3 | **Links are links.** Navigation and CTAs that go somewhere are `<a href>`. | `CtaButton href`, `GlassNav links`, `FeatureGrid` `href`. |
| 4 | **A real head**: unique title, description, absolute canonical without view-state parameters, Open Graph and Twitter tags; links to the Markdown twin, `llms.txt` and the feed where the site has them. | `pageMeta()` → `HeadTags` (server) or `useHead` (client) or `headTagsToHtml` (static). |
| 5 | **JSON-LD for what the page shows**: the organisation, the site, the product with the Pricing section's offer, the FAQ. Nothing invisible, no invented ratings. | `organization` (or `person` for a personal site), `webSite`, `softwareApplication` / `product` + `offer`, `faqPage`, `breadcrumbList`, `article`, `jsonLd`, `<JsonLd>`. |
| 6 | **Answers that stand alone**: each FAQ answer's first sentence answers the question and names the product instead of "it". | `<FAQ items>`; visible text and FAQPage JSON-LD come from the same array. |
| 7 | **robots.txt with a stance per AI crawler**, `sitemap.xml` with accurate `lastmod`, and (optionally) `llms.txt` and an RSS feed. | `buildCrawlFiles()`, or `scripts/build-crawl-files.ts`; `rssFeed()`. |
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

No Landing component renders a raster image, so there is no `<img>` to size; give your own images
`width` and `height` (or `aspect-ratio`) so they reserve their box.

## API

All helpers are pure and framework-agnostic (they return data or strings); the React pieces are
thin wrappers. Everything is exported from `uipack/web`.

### Head: `pageMeta`, `HeadTags`, `useHead`, `headTagsToHtml`

```tsx
import { pageMeta, fontPreloads, HeadTags, headTagsToHtml, useHead } from "uipack/web";

const head = pageMeta({
  title: "Tidy: forty emails in, three that need you", // specific first, brand last, under ~60 chars
  description: "Tidy reads, files and drafts while you watch, and leaves only the messages that need you.",
  url: "https://tidy.example/",            // absolute canonical; no ?theme=, ?utm_ …
  image: { url: "/og.png", alt: "The Tidy inbox", width: 1200, height: 630 }, // relative → resolved against url
  siteName: "Tidy",
  locale: "en_US",
  type: "website",
  twitterSite: "@tidy",
  // robots: "noindex",                     // for previews only
  llmsTxt: "/llms.txt",                     // <link rel="describedby" type="text/markdown">
  rss: "/feed.xml",                         // <link rel="alternate" type="application/rss+xml">, titled siteName
});

// An article page adds its Markdown twin and its dates:
pageMeta({
  title: "Who builds the AI stack", description: "…", url: "https://notes.example/who-builds",
  type: "article",
  markdown: "/raw/who-builds.md",           // <link rel="alternate" type="text/markdown">
  publishedTime: "2026-10-01",              // article:published_time
  modifiedTime: "2026-10-20",               // article:modified_time; defaults to publishedTime
});

// Server-rendered document (React 18 does not hoist head tags):
<head><HeadTags tags={[...head, ...fontPreloads({ base: "/fonts/" })]} /></head>
// Static generator or template:
const html = headTagsToHtml(head);
// Client-only app (crawlers that skip JavaScript will not see it):
useHead(head);
```

`pageMeta` returns `HeadTag[]` (`title`, `meta`, `link`, `script` as plain data) and throws on a
relative `url`. `useHead` updates an existing title, description, canonical or `og:*` tag in place,
adds the rest, and restores the previous head on unmount. `markdown`, `llmsTxt` and `rss` take
absolute URLs or paths resolved against `url`; each is emitted only when given. The Markdown
alternate and the `describedby` link let an agent fetch the page or the site map as clean text
instead of parsing HTML; serve those files yourself (`buildCrawlFiles` writes `llms.txt`). Google accepts a canonical set by
JavaScript only if it matches the one in the HTML, so prefer the server head ([JavaScript SEO
basics][g-js]).

### Fonts: `fontPreloads`

```ts
fontPreloads();                                         // display face only: /fonts/instrument-serif-latin-400-normal.woff2
fontPreloads({ faces: ["display", "display-italic"] }); // hero title with an <em>
fontPreloads({ href: (file) => fontUrls[file] });       // bundler-hashed URLs; must equal what web.css fetches
fontPreloads({ media: "(min-width: 720px)" });          // only where the swap moves the hero
```

Returns `<link rel="preload" as="font" type="font/woff2" crossorigin>` descriptors. `WEB_FONT_FILES`
maps each face (`display`, `display-italic`, `text`, `text-500`, `text-600`, `mono`, `mono-600`) to
its file in `uipack/fonts/*`. Preload the faces the hero shows and nothing else: a preload takes
bandwidth from everything else in the first view and ignores `unicode-range` ([web.dev, font best
practices][wd-fonts]). The measurements below show that trade.

### Structured data: builders, `jsonLd`, `<JsonLd>`

```tsx
import { JsonLd, jsonLd, organization, webSite, softwareApplication, offer } from "uipack/web";

const org = organization({ name: "Tidy", url: "https://tidy.example/", sameAs: ["https://github.com/tidy"] });
const plan = offer({ name: "Personal", price: "8.00", priceCurrency: "USD", billing: "MON", trialDays: 30 });

<JsonLd
  data={jsonLd(
    org,
    webSite({ name: "Tidy", url: "https://tidy.example/", publisher: org }),
    softwareApplication({
      name: "Tidy", type: "WebApplication", description: "…", url: "https://tidy.example/",
      applicationCategory: "BusinessApplication", operatingSystem: "Web", offers: plan, publisher: org,
    }),
  )}
/>

// A personal site's author, linked from each article:
const jun = person({ name: "Jun", url: "https://jun.example/", sameAs: ["https://github.com/jun"] });
<JsonLd data={jsonLd(jun, article({ headline: "…", url: "https://notes.example/p", datePublished: "2026-10-01", author: jun }))} />
// Elsewhere, reference the same Person without repeating it:
article({ …, author: { "@id": "https://jun.example/#person", name: "Jun" } });
```

| Builder | schema.org type | Notes |
| --- | --- | --- |
| `organization({ name, url, logo?, description?, sameAs?, id? })` | `Organization` | `@id` defaults to `url#organization`. |
| `person({ name, url, sameAs?, image?, jobTitle?, description?, id? })` | `Person` | `@id` defaults to `url#person`. `sameAs` lists the person's own profiles (GitHub, LinkedIn, their home site) so engines join them into one entity. Publish it once and reuse that `@id` on every site, e.g. a notes site passes the home site's id. |
| `webSite({ name, url, description?, publisher?, inLanguage? })` | `WebSite` | `publisher` takes a node or `@id`; `ref()` links nodes. |
| `offer({ price, priceCurrency, name?, url?, billing?, availability?, trialDays? })` | `Offer` | `billing: "MON" \| "ANN"` adds a `UnitPriceSpecification`; `trialDays` adds `eligibleDuration`. Use the Pricing section's numbers. |
| `softwareApplication({ name, description, url, type?, applicationCategory?, operatingSystem?, offers?, aggregateRating? })` | `SoftwareApplication` / `WebApplication` / `MobileApplication` | Google's app rich result needs a real rating or review ([software app][g-app]); omit `aggregateRating` rather than invent it. |
| `product({ name, description, url, image?, brand?, sku?, offers?, aggregateRating? })` | `Product` | For physical or generic products. |
| `faqPage(items, { url? })` | `FAQPage` | `FAQ` calls it for you. |
| `breadcrumbList([{ name, url? }])` | `BreadcrumbList` | The last item may omit `url`. |
| `article({ headline, url, datePublished, author, dateModified?, image?, publisher?, type?, id?, isPartOf? })` | `Article` / `BlogPosting` / … | `dateModified` defaults to `datePublished` and may not precede it; dates take a `Date` or an ISO 8601 string. `author` takes `{ name, url? }`, a `person()` node, or a Person's `{ "@id", name }` (or an array of them); with an `@id` it emits a compact `{ "@type": "Person", "@id", name, url? }` that links to the full Person node. A bare `{ "@id" }` throws. |
| `personRef(personOrIdAndName)` | `Person` (reference) | The compact `{ "@type": "Person", "@id", name, url? }` the builders use for `author`; use it in hand-written nodes too. Throws without a name. |
| `webPage({ url, name, description?, type?, isPartOf?, about?, mainEntity?, author?, image?, breadcrumb?, datePublished?, dateModified?, inLanguage? })` | `WebPage` / `AboutPage` / … | `@id` defaults to `url#webpage`. `isPartOf` the WebSite, `about` the site owner. |
| `profilePage({ url, person, name?, isPartOf?, dateCreated?, dateModified? })` | `ProfilePage` | `mainEntity` is the full Person from `person()` options or node, with its `sameAs`; keep the home site's `@id`. `@id` defaults to `url#profilepage`. |
| `softwareSourceCode({ name, codeRepository, description?, url?, programmingLanguage?, runtimePlatform?, license?, version?, author?, keywords?, datePublished?, dateModified? })` | `SoftwareSourceCode` | For a library or tool page; `@id` defaults to `(url ?? codeRepository)#code`. |
| `itemList(entries, { name?, order?, id? })` | `ItemList` | Entries are `{ url, name, description? }` or nodes (an `article()`), numbered in page order. |
| `collectionPage({ url, name, items, order?, … })` | `CollectionPage` | A blog or project index; `mainEntity` is `itemList(items)` with `@id` `url#items`. |
| `jsonLd(...nodes)` | | One node, or an `@graph`, with `@context`. |
| `serializeJsonLd(data)` / `jsonLdTag(doc)` | | Escapes `<`, `>`, `&`, U+2028 and U+2029 as JSON escapes, so `</script>` in a value cannot close the tag; parses back to the same data. |

Structured data must describe content visible on the page and must not mislead
([structured data guidelines][g-sd]). Google stopped showing FAQ rich results on 7 May 2026
([Search Central updates][g-updates]) and says structured data "isn't required" for its AI
features ([AI optimization guide][g-aio]). The FAQ markup stays because it costs nothing, is
generated from the visible text, and other consumers read schema.org; the visible questions and
answers are what gets quoted.

#### Use these on your site

A personal site and its notes subdomain, sharing one Person. This avoids two failures seen on real
sites: an author written as a bare `{ "@id": "…#person" }`, which names nobody to a reader of that
page alone (Google's article guidelines ask for the author's name), and a `dateModified` set to the
build date, which changes on every deploy and so says nothing about the content.

```ts
import { jsonLd, person, personRef, profilePage, article, webPage, collectionPage } from "uipack/web";

// One Person, published in full on the profile page, referenced everywhere else.
const me = { name: "Jun", url: "https://jun.example/", id: "https://jun.example/#person",
  sameAs: ["https://github.com/jun", "https://www.linkedin.com/in/jun", "https://notes.jun.example/about"] };

// /about on either site:
jsonLd(profilePage({ url: "https://notes.jun.example/about", person: me, dateModified: aboutUpdated }));

// A post: the author is { "@type": "Person", "@id", name }, never ref(me) alone.
jsonLd(article({
  type: "BlogPosting", headline: post.title, url: post.url, author: personRef(person(me)),
  datePublished: post.created,          // from the post's frontmatter
  dateModified: post.updated,           // the last real edit, not new Date() at build time
}));

// A hand-maintained page: date it from its source file's last commit, not the deploy.
//   git log -1 --format=%cs -- pages/ai-tooling.mdx   → "2026-10-20"
jsonLd(webPage({ url, name, isPartOf: "https://jun.example/#website", about: me.id, dateModified: lastCommit }));

// The notes index:
jsonLd(collectionPage({ url: "https://notes.jun.example/", name: "Notes", order: "descending",
  items: posts.map((p) => ({ url: p.url, name: p.title, description: p.description })) }));
```

When a page has no reliable change date, leave `dateModified` out rather than fill it with today.
The same rule holds for sitemap `<lastmod>` (below).

### `FAQ`

```tsx
import { FAQ, type FaqItem } from "uipack/web";

const items: FaqItem[] = [
  { question: "How much does Tidy cost?", answer: "Tidy costs $8 a month for one inbox, after a free 30-day trial that needs no card." },
  { question: "Does Tidy send email for me?", answer: "No, Tidy drafts replies but never sends them.\n\nDrafts wait for you to review." },
];

<FAQ id="faq" items={items} url="https://tidy.example/" intro="…" />
```

Props: `items`, `eyebrow` ("FAQ"), `title` ("Questions, answered"), `intro`, `id` ("faq"), `url`
(for the `@id`), `jsonLd` (true), `variant` (`"list"`, or `"accordion"` with native `<details>`;
collapsed answers stay in the HTML), `tone`, `lazyRender` (false). Each question is an `h3` in the
list variant; answers are plain text with blank lines between paragraphs, and the JSON-LD uses the
same strings. Write the first sentence so it answers the question on its own; the rest can add
detail. On wide containers the heading sits in 5 of 12 columns beside the questions.

### Crawl files: `buildCrawlFiles`

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
  sections of `- [name](url): notes`, and `## Optional` last for links an agent may skip. Pages with
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

### Feed: `rssFeed`

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

### `Section lazyRender`

`<Section lazyRender>` sets `content-visibility: auto` with `contain-intrinsic-size: auto 720px`:
the browser skips layout and paint until the section nears the viewport and then remembers its
real size ([web.dev, content-visibility][wd-cv]). The content stays in the DOM and the
accessibility tree, so crawlers, find-in-page and screen readers still get it. Use it only below
the last in-page link target: an anchor jump computes its position from the placeholder heights of
unrendered sections above it. In the `/web` demo the FAQ sits above the Pricing anchor, so it
stays off.

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

## Performance

Two methods, which disagree on mobile LCP by more than a factor of two. Use Lighthouse for the
absolute number and the trace for comparing changes.

**Lighthouse** 13.5 (CLI, headless Chrome, default mobile and `--preset=desktop`, simulated
throttling), median of 3 runs, built playground (`vite build`, `vite preview`), 2026-10-23, after
the playground's lazy-route change (below):

| Route | Profile | Performance | FCP | LCP | CLS | TBT | JS transferred |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/web` | Mobile | 99 | 1.44 s | **1.67 s** ¹ | 0 | 0 ms | 81 KB |
| `/web` | Desktop | 100 | 0.35 s | 0.45 s ¹ | 0 | 0 ms | 81 KB |
| `/` | Mobile | 99 | 1.59 s | 1.96 s | 0 | 6 ms | 128 KB |
| `/` | Desktop | 100 | 0.39 s | 0.45 s | 0 | 0 ms | 128 KB |

Before it, `/web` on mobile scored 92 with LCP **3.16 s** (FCP 1.81 s, CLS 0.019, 151 KB of JS),
over the 2.5 s "good" threshold. Lighthouse's simulation charges the whole dependency chain to the
throttled link, and every request that finished before the observed LCP: the HTML, then the
128 KB playground entry chunk (57 % of it unused on `/web`), then the `/web` route chunk, plus
the nine Landing font files the example's layout requested in the same frame as the intro
paragraph (the LCP element, below). The fix was in the playground shell, not in `uipack/web`:

- The entry holds React, the shell and the catalog only (56 KB compressed); every page is a lazy
  chunk with its own CSS, and the entry's render-blocking CSS is the shell's alone (3 KB, was 12 KB).
- `index.html` preloads the current page's chunk and CSS, so they load beside the entry, not after it.
- `/web` paints its intro and page index first and renders the example in the next task, so its
  font requests start after the LCP paint. Without that step mobile LCP was 2.59 s.
- `/web` no longer loads `presentations.css` (8 KB compressed), which styles only `/styles`.

The specimen's two comparison faces (IBM Plex Serif, Space Grotesk; playground only) now load
when their toggle nears the viewport, not with the page. Same method, 2026-10-23: `/web` mobile
fetches 7 font files (143 KB) instead of 9 (176 KB), and 240 KB in total instead of 273 KB.
Score, FCP and LCP are unchanged (99, 1.43 s, 1.67 s): those files were never on the LCP path.

`/` trades some mobile LCP (1.56 s before, when its sections were in the entry chunk) for an
entry chunk less than half the size; its score is unchanged.

**Playwright trace**, the table below: Chromium via Playwright with `PerformanceObserver` (LCP,
layout shift, long tasks), DevTools throttling applied to the real load, cache disabled, median of
7 runs per profile on the same machine. It reports what one throttled load observed, so its mobile
LCP (about 1.4 s) is far below Lighthouse's estimate; it isolates the effect of each change:

- **Mobile**: 390 × 844, 4× CPU throttling, 150 ms RTT, 1.6 Mbps down.
- **Desktop**: 1440 × 900, no CPU throttling, 40 ms RTT, 10 Mbps down.

CLS on load counts shifts in the first 4 s; CLS on scroll counts shifts while the page is scrolled
to the bottom in 80 % viewport steps. TBT sums long-task time over 50 ms after FCP.

| Profile | Metric | Before | Kit only (no preload) | After |
| --- | --- | --- | --- | --- |
| Mobile | FCP | 920 ms | 928 ms | 900 ms |
| Mobile | LCP | 1408 ms | 1440 ms | 1376 ms |
| Mobile | CLS on load | 0.019 | 0.019 | 0.019 |
| Mobile | CLS on scroll | 0.0001 | 0.0001 | 0.0001 |
| Mobile | TBT | 67 ms | 61 ms | 25 ms |
| Desktop | FCP | 208 ms | 204 ms | 236 ms |
| Desktop | LCP | 340 ms | 348 ms | 372 ms |
| Desktop | CLS on load | **0.054** | 0.047 | **0.011** |
| Desktop | CLS on scroll | 0 | 0 | 0 |
| Desktop | TBT | 0 ms | 0 ms | 0 ms |

"Kit only" is the final code with the font preload removed from the HTML, to separate the two
changes. Run-to-run spread on this shared machine was about ±50 ms for mobile LCP and ±40 ms for
TBT, so the mobile differences are noise; the desktop CLS drop is not. In this trace all three are
inside the "good" thresholds (LCP ≤ 2.5 s, CLS ≤ 0.1); Lighthouse's mobile LCP, above, is not.

¹ **Re-measured at the final review** (same method, 2026-10-23): `/web` mobile scores 98 with FCP
1.36 s and LCP **2.44 s** (desktop 100, FCP 0.35 s, LCP 0.54 s; CLS 0 and TBT 0 ms on both), 242 KB
in 16 requests, 143 KB of it the seven Landing font files. The LCP element is now the Landing
hero's headline (`h1#web-hero-title`, Instrument Serif with an italic `<em>`, 26,000 px² at
390 px), larger than the playground intro paragraph (15,200 px²) that was the LCP before.

The 2.44 s is a property of Lighthouse's simulation, not of what a phone sees. Lantern charges LCP
with every request that finished before the LCP in the unthrottled load it observes; served from
localhost, all seven fonts finish (about 113 ms) before the headline's first paint (about 136 ms),
so their 143 KB are simulated on the throttled link ahead of it. On a real first visit the faces
are `font-display: swap`, the headline paints in the metric-matched fallback, and Chrome does not
report a new LCP when the face swaps in: with every woff2 delayed by 1.5 s, the headline's LCP
entry stays at the fallback paint (92 ms in a local Chromium load), with no later entry.

Tried for the review, median of 3 each, mobile LCP against 2.44 s:

| Change | Mobile LCP | Why |
| --- | --- | --- |
| Preload the two display faces on phones too | 2.57 s (worse) | They start with the scripts and share the throttled link with them; the hero's five Plex faces still load after the render. |
| Preload all six faces the hero uses | 2.43 s (same) | The bytes before the paint are unchanged; FCP rose to 1.44 s. |
| `font-display: optional` on the display faces | 2.42 s (same) | The requests and their timing are unchanged, and a slow first visit would keep the fallback for the whole page view. |

So the playground keeps its preload at 720 px and wider only (below), and the faces keep
`swap`. Six of the seven font files are used inside the hero on a phone (Plex Sans 400 and 500,
Plex Mono 400 and 600, Instrument Serif and its italic; Plex Sans 600 sets text above it),
so deferring the others would not shrink the hero's path either. The lever left is bytes: fewer
or smaller faces on the first screen, which is a design decision, not a loading one.

Before the final review, LCP on this page was the playground's own intro paragraph
(`p.collection-intro`, system font), not the Landing hero, because the shell renders above the example. The trace table predates the
lazy-route change; the CLS it shows (0.011 on desktop, 0.019 on mobile) was the playground's
Suspense fallback being replaced by the whole page. The shell now stays and the page fills in
below it, and Lighthouse measures CLS 0 on both profiles.

**What changed it.** Before, the hero headline was laid out in the metric-matched fallback and then
re-wrapped when Instrument Serif (normal and italic) arrived: the first text run widened by 19 px at
1440 px and the headline gained a line, moving the subhead 62 px (CLS 0.042). The fallback
metrics match the average character width, not every string, so a centred display headline can
still re-wrap. Preloading the two display faces lets them arrive before the hero renders. The cost
is bandwidth at the start: about 30 ms of desktop FCP and LCP for 43 KB of fonts, against 0.042 of CLS removed. A first
version preloaded on every viewport and cost mobile about 200 ms of FCP and 280 ms of LCP on the
throttled link (1124 / 1636 ms), for no CLS gain there: at 390 px the swap moved nothing. So the
playground preloads at 720 px and wider only (`fontPreloads({ media: "(min-width: 720px)" })`;
its `index.html` turns the links on for `/web` in a build). `fetchpriority="low"` on the preload
did not recover the mobile cost (1136 / 1688 ms).

The other changes (single-copy server text, the transcript, the marquee copy after mount) do not
move these numbers; they change what crawlers read.

**Verified, unchanged:** `font-display: swap` on every face; motion does no work before it is in view
(`DemoPlayer`, `TextScramble`, `NumberTicker` start from IntersectionObserver; `Marquee`, `Aurora`
and `BeamLines` start paused and pause again off screen); `useScrollProgress` reads layout once per
animation frame and only while in view; no long tasks while scrolling on desktop.

## Limits

- The playground is a client-rendered SPA, so its raw HTML has none of this; the e2e tests read the
  rendered DOM. A real Landing page must be server-rendered or pre-rendered for checks 1, 4 and 5
  to reach crawlers that do not run JavaScript.
- The playground's `index.html` carries `<meta name="robots" content="noindex">`: it is an
  illustrative demo, so a deployed copy never gets indexed. A real page sets `robots` through
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
