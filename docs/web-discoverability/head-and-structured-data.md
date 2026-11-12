# Head and structured data

The `uipack/web` helpers for a page's head, its font preloads, its JSON-LD and its FAQ: what each
takes and returns, with examples. The checklist they serve is in
[Web discoverability](../web-discoverability.md).

All helpers are pure and framework-agnostic (they return data or strings); the React pieces are
thin wrappers. Everything is exported from `uipack/web`.

## Head: `pageMeta`, `HeadTags`, `useHead`, `headTagsToHtml`

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

## Fonts: `fontPreloads`

```ts
fontPreloads();                                         // display face only: /fonts/ibm-plex-sans-latin-600-normal.woff2
fontPreloads({ faces: ["display", "mono"] });           // a hero that also sets a mono eyebrow
fontPreloads({ href: (file) => fontUrls[file] });       // bundler-hashed URLs; must equal what web.css fetches
fontPreloads({ media: "(min-width: 720px)" });          // only where the swap moves the hero
```

Returns `<link rel="preload" as="font" type="font/woff2" crossorigin>` descriptors. `WEB_FONT_FILES`
maps each of Technical's faces (`display`, `text`, `text-500`, `text-600`, `mono`, `mono-600`) to
its file in `uipack/fonts/*`; `display` is IBM Plex Sans 600, the same file as `text-600`. Preload the faces the hero shows and nothing else: a preload takes
bandwidth from everything else in the first view and ignores `unicode-range` ([web.dev, font best
practices][wd-fonts]). The measurements below show that trade.

## Structured data: builders, `jsonLd`, `<JsonLd>`

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

### Use these on your site

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

## `FAQ`

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

[g-aio]: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
[g-js]: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
[g-sd]: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
[g-app]: https://developers.google.com/search/docs/appearance/structured-data/software-app
[g-updates]: https://developers.google.com/search/updates
[wd-fonts]: https://web.dev/articles/font-best-practices
