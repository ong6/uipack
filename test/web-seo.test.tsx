import { render } from "@testing-library/react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import {
  AI_CRAWLERS,
  CtaButton,
  DemoPlayer,
  FAQ,
  FeatureGrid,
  GlassNav,
  HeadTags,
  Heading,
  JsonLd,
  Marquee,
  NumberTicker,
  RevealText,
  Section,
  StarHero,
  TextScramble,
  article,
  breadcrumbList,
  buildCrawlFiles,
  collectionPage,
  itemList,
  llmsFullTxt,
  personRef,
  profilePage,
  softwareSourceCode,
  webPage,
  faqPage,
  fontPreloads,
  formatLastmod,
  headTagsToHtml,
  jsonLd,
  offer,
  organization,
  pageMeta,
  person,
  product,
  ref,
  resolveAiCrawlers,
  serializeJsonLd,
  softwareApplication,
  useHead,
  webSite,
  type DemoStep,
  type FaqItem,
} from "../src/web";

/** Visible text a crawler extracts from server HTML: tags stripped, whitespace collapsed. */
const textOf = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;
const jsonLdBlocks = (html: string) => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

const steps: DemoStep[] = [
  { id: "ask", label: "Ask", title: "Say it once.", prompt: "Clear my inbox." },
  { id: "act", label: "Act", title: "Watch it work.", actions: [{ label: "Archived newsletters", detail: "22", metric: 18 }, "Filed receipts"] },
  { id: "done", label: "Review", title: "Three things need you.", metric: 3, screen: <p>Final screen</p> },
];

const faq: FaqItem[] = [
  { question: "What does Tidy do?", answer: "Tidy clears your inbox while you watch.\n\nYou keep the decisions." },
  { question: "Does it send email for me?", answer: 'No, it drafts replies and never sends them. Say "</script>" if you like.' },
];

describe("server HTML carries the final text of animated components", () => {
  it("TextScramble renders its text once, visible, with no scrambled layer", () => {
    const html = renderToString(<TextScramble text="Forty in. Three left." />);
    expect(count(textOf(html), "Forty in. Three left.")).toBe(1);
    expect(html).not.toContain("uipack-web-scramble__live");
    expect(html).not.toContain("data-armed");
  });

  it("TextScramble arms the live layer after mount, and assistive tech still reads the ghost", () => {
    const { container } = render(<TextScramble text="Three left" />);
    expect(container.querySelector(".uipack-web-scramble")).toHaveAttribute("data-armed", "true");
    expect(container.querySelector(".uipack-web-scramble__live")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".uipack-web-scramble__ghost")).not.toHaveAttribute("aria-hidden");
  });

  it("NumberTicker renders the final value once, formatted", () => {
    const html = renderToString(<NumberTicker value={9.4} format={{ minimumFractionDigits: 1 }} suffix=" s" />);
    expect(textOf(html)).toBe("9.4 s");
    expect(html).not.toContain("ticker-live");
  });

  it("RevealText keeps every word, and authored lines do not run together", () => {
    const words = renderToString(<RevealText text="It leaves me three things." />);
    expect(textOf(words)).toBe("It leaves me three things.");
    expect(words).toContain('data-state="static"');
    const lines = renderToStaticMarkup(<RevealText lines={["First line.", "Second line."]} />);
    expect(lines).toContain("First line.</span> <span");
  });

  it("DemoPlayer's server HTML includes every step, action and the final result, not just frame 0", () => {
    const html = renderToString(<DemoPlayer steps={steps} label="Demo" initialMetric={40} metricLabel="in your inbox" />);
    const text = textOf(html);
    for (const s of ["Say it once.", "Clear my inbox.", "Watch it work.", "Archived newsletters (22)", "Filed receipts", "Three things need you.", "Result: 3 in your inbox."]) {
      expect(text).toContain(s);
    }
    expect(html).toContain('aria-label="Demo transcript"');
    expect(html).toContain('data-step="0"');
  });

  it("Marquee lists each item once in server HTML; the loop copy arrives after mount", () => {
    const items = ["React", "SVG"].map((t) => <span key={t}>{t}</span>);
    const html = renderToString(<Marquee label="Tools" items={items} />);
    expect(count(html, "uipack-web-marquee__list")).toBe(1);
    expect(count(textOf(html), "React")).toBe(1);
    const { container } = render(<Marquee label="Tools" items={items} />);
    expect(container.querySelectorAll(".uipack-web-marquee__list")).toHaveLength(2);
  });

  it("a Landing page has one h1, real headings in order, and real links", () => {
    const html = renderToStaticMarkup(
      <>
        <GlassNav brand={<a href="/">Tidy</a>} links={[{ label: "Pricing", href: "#pricing" }]} cta={<CtaButton href="#pricing">Start free</CtaButton>} />
        <StarHero headingId="hero" title="Forty in. Three left." actions={<CtaButton href="#pricing">Start free</CtaButton>} />
        <Section id="how" title="How it works">
          <FeatureGrid features={[{ title: "Ask", body: "One sentence.", href: "#ask" }]} />
        </Section>
        <FAQ items={faq} />
      </>,
    );
    expect(count(html, "<h1")).toBe(1);
    expect(html).toMatch(/<h1[^>]*>Forty in\. Three left\.<\/h1>/);
    const levels = [...html.matchAll(/<h([1-6])/g)].map((m) => Number(m[1]));
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    expect(html).toContain('<a class="uipack-web-cta" href="#pricing"');
    expect(html).toContain('<a href="#pricing">Pricing</a>');
  });

  it("Heading renders h5 and h6 as real elements", () => {
    expect(renderToStaticMarkup(<Heading level={6}>Small print</Heading>)).toMatch(/^<h6[^>]*data-step="0"/);
  });

  it("Section lazyRender marks the section for content-visibility without hiding its text", () => {
    const html = renderToStaticMarkup(
      <Section id="later" title="Later" lazyRender>
        <p>Still here.</p>
      </Section>,
    );
    expect(html).toContain('data-lazy="true"');
    expect(textOf(html)).toContain("Still here.");
  });
});

describe("pageMeta", () => {
  const tags = pageMeta({
    title: "Tidy: forty emails in, three that need you",
    description: "An inbox agent that files & drafts while you watch.",
    url: "https://tidy.example/",
    image: { url: "/og.png", alt: "The Tidy inbox", width: 1200, height: 630 },
    siteName: "Tidy",
    locale: "en-GB",
  });
  const html = headTagsToHtml(tags);

  it("emits title, description, canonical, Open Graph and Twitter tags", () => {
    expect(html).toContain("<title>Tidy: forty emails in, three that need you</title>");
    expect(html).toContain('<meta name="description" content="An inbox agent that files &amp; drafts while you watch.">');
    expect(html).toContain('<link rel="canonical" href="https://tidy.example/">');
    expect(html).toContain('<meta property="og:url" content="https://tidy.example/">');
    expect(html).toContain('<meta property="og:image" content="https://tidy.example/og.png">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:locale" content="en_GB">');
    expect(html).toContain('<meta property="og:site_name" content="Tidy">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).not.toContain('name="robots"');
  });

  it("falls back to a summary card without an image, and rejects a relative canonical", () => {
    expect(headTagsToHtml(pageMeta({ title: "T", description: "D", url: "https://a.example/x" }))).toContain('content="summary"');
    expect(() => pageMeta({ title: "T", description: "D", url: "/x" })).toThrow(/absolute/);
  });

  it("links the Markdown alternate, llms.txt, the RSS feed and article dates when given", () => {
    const post = headTagsToHtml(
      pageMeta({
        title: "Who builds the AI stack",
        description: "D",
        url: "https://notes.example/who-builds",
        type: "article",
        siteName: "Notes",
        markdown: "/raw/who-builds.md",
        llmsTxt: "/llms.txt",
        rss: "/feed.xml",
        publishedTime: "2026-10-01",
      }),
    );
    expect(post).toContain('<link rel="alternate" type="text/markdown" href="https://notes.example/raw/who-builds.md">');
    expect(post).toContain('<link rel="describedby" type="text/markdown" href="https://notes.example/llms.txt">');
    expect(post).toContain('<link rel="alternate" type="application/rss+xml" href="https://notes.example/feed.xml" title="Notes">');
    expect(post).toContain('<meta property="og:type" content="article">');
    expect(post).toContain('<meta property="article:published_time" content="2026-10-01">');
    // An unedited post was last modified when it was published.
    expect(post).toContain('<meta property="article:modified_time" content="2026-10-01">');

    const edited = headTagsToHtml(
      pageMeta({ title: "T", description: "D", url: "https://a.example/p", rss: { url: "https://feeds.example/a.xml", title: "A feed" }, publishedTime: "2026-10-01", modifiedTime: "2026-10-20T08:00:00Z" }),
    );
    expect(edited).toContain('href="https://feeds.example/a.xml" title="A feed"');
    expect(edited).toContain('<meta property="article:modified_time" content="2026-10-20T08:00:00Z">');
    // None of them appear unless asked for.
    expect(html).not.toMatch(/text\/markdown|rss\+xml|describedby|article:/);
  });

  it("HeadTags renders the same tags as React elements for a server-rendered head", () => {
    const out = renderToStaticMarkup(<HeadTags tags={[...tags, ...fontPreloads()]} />);
    expect(out).toContain('<link rel="canonical" href="https://tidy.example/"/>');
    expect(out).toContain('<meta property="og:title" content="Tidy: forty emails in, three that need you"/>');
    expect(out).toContain('crossorigin="anonymous"');
  });

  it("useHead applies tags to document.head and restores them on unmount", () => {
    document.title = "Before";
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = "https://old.example/";
    document.head.appendChild(canonical);
    function Page() {
      useHead(tags);
      return null;
    }
    const { unmount } = render(<Page />);
    expect(document.title).toBe("Tidy: forty emails in, three that need you");
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(canonical.getAttribute("href")).toBe("https://tidy.example/");
    expect(document.head.querySelector('meta[property="og:image"]')!.getAttribute("content")).toBe("https://tidy.example/og.png");
    unmount();
    expect(document.title).toBe("Before");
    expect(canonical.getAttribute("href")).toBe("https://old.example/");
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
    canonical.remove();
  });
});

describe("fontPreloads", () => {
  it("preloads only the hero's display face by default, as crossorigin woff2", () => {
    const tags = fontPreloads({ base: "/fonts" });
    expect(tags).toHaveLength(1);
    expect(headTagsToHtml(tags)).toBe('<link rel="preload" href="/fonts/instrument-serif-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin="anonymous">');
  });
  it("can scope the preload to wide layouts with a media query", () => {
    expect(headTagsToHtml(fontPreloads({ media: "(min-width: 720px)" }))).toContain('media="(min-width: 720px)"');
  });
  it("takes extra faces and a resolver for bundler URLs", () => {
    const tags = fontPreloads({ faces: ["display", "display-italic"], href: (f) => `/assets/${f.replace(".woff2", "-abc.woff2")}` });
    expect(tags.map((t) => (t.tag === "link" ? t.attrs.href : ""))).toEqual([
      "/assets/instrument-serif-latin-400-normal-abc.woff2",
      "/assets/instrument-serif-latin-400-italic-abc.woff2",
    ]);
  });
});

describe("JSON-LD", () => {
  const org = organization({ name: "Tidy", url: "https://tidy.example/", sameAs: ["https://github.com/tidy"] });
  const plan = offer({ name: "Personal", price: "8.00", priceCurrency: "USD", billing: "MON", trialDays: 30, availability: "InStock" });
  const app = softwareApplication({
    name: "Tidy",
    description: "An inbox agent.",
    url: "https://tidy.example/",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: plan,
    publisher: org,
  });

  it("builds Organization, WebSite and SoftwareApplication with a monthly Offer, linked by @id", () => {
    expect(organization({ name: "A", url: "https://a.example/landing#top" })["@id"]).toBe("https://a.example/landing#organization");
    const doc = jsonLd(org, webSite({ name: "Tidy", url: "https://tidy.example/", publisher: org }), app);
    expect(doc["@context"]).toBe("https://schema.org");
    const graph = doc["@graph"] as Record<string, unknown>[];
    expect(graph.map((n) => n["@type"])).toEqual(["Organization", "WebSite", "SoftwareApplication"]);
    expect(graph[1].publisher).toEqual({ "@id": "https://tidy.example/#organization" });
    expect(app.offers).toMatchObject({
      "@type": "Offer",
      price: "8.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceSpecification: { "@type": "UnitPriceSpecification", referenceQuantity: { unitCode: "MON", value: 1 } },
      eligibleDuration: { value: 30, unitCode: "DAY" },
    });
    expect(app).not.toHaveProperty("aggregateRating");
  });

  it("builds Product, FAQPage, BreadcrumbList and Article", () => {
    expect(product({ name: "Desk", description: "Oak.", url: "https://s.example/desk", brand: "Oakly", offers: offer({ price: 400, priceCurrency: "EUR" }) })).toMatchObject({
      "@type": "Product",
      brand: { "@type": "Brand", name: "Oakly" },
      offers: { price: 400, priceCurrency: "EUR" },
    });
    expect(faqPage(faq, { url: "https://tidy.example/#top" })).toMatchObject({
      "@id": "https://tidy.example/#faq",
      mainEntity: [{ "@type": "Question", name: "What does Tidy do?", acceptedAnswer: { "@type": "Answer" } }, {}],
    });
    expect(breadcrumbList([{ name: "Home", url: "https://a.example/" }, { name: "Pricing" }]).itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://a.example/" },
      { "@type": "ListItem", position: 2, name: "Pricing" },
    ]);
    expect(article({ headline: "H", url: "https://a.example/p", datePublished: "2026-10-01", author: { name: "Jun" } })).toMatchObject({
      "@type": "Article",
      dateModified: "2026-10-01",
      author: { "@type": "Person", name: "Jun" },
    });
  });

  it("builds a Person with @id, url and sameAs, and articles reference it", () => {
    const jun = person({ name: "Jun", url: "https://jun.example/", sameAs: ["https://github.com/jun", "https://www.linkedin.com/in/jun"], jobTitle: "Engineer" });
    expect(jun).toEqual({
      "@type": "Person",
      "@id": "https://jun.example/#person",
      name: "Jun",
      url: "https://jun.example/",
      jobTitle: "Engineer",
      sameAs: ["https://github.com/jun", "https://www.linkedin.com/in/jun"],
    });
    expect(person({ name: "Jun", url: "https://notes.example/about", id: "https://jun.example/#person" })["@id"]).toBe("https://jun.example/#person");

    // A person() node becomes a compact reference: @id, name and url, not a second copy of the profile.
    const post = article({ headline: "H", url: "https://notes.example/p", datePublished: "2026-10-01", author: jun });
    expect(post.author).toEqual({ "@type": "Person", "@id": "https://jun.example/#person", name: "Jun", url: "https://jun.example/" });
    // An @id and name, e.g. a Person published on another site; plain names still work alongside.
    const pair = article({ headline: "H", url: "https://notes.example/p", datePublished: "2026-10-01", author: [{ "@id": "https://jun.example/#person", name: "Jun" }, { name: "Ana" }] });
    expect(pair.author).toEqual([
      { "@type": "Person", "@id": "https://jun.example/#person", name: "Jun" },
      { "@type": "Person", name: "Ana" },
    ]);
    const graph = jsonLd(jun, post)["@graph"] as Record<string, unknown>[];
    expect((graph[1].author as Record<string, unknown>)["@id"]).toBe(graph[0]["@id"]);
    expect(() => article({ headline: "H", url: "https://a.example/p", datePublished: "2026-10-01", author: { "@type": "Person", "@id": "x" } })).toThrow(/name/);
  });

  const homeId = "https://jun.example/#person";
  const junOptions = { name: "Jun", url: "https://jun.example/", id: homeId, sameAs: ["https://github.com/jun", "https://www.linkedin.com/in/jun"] };

  it("personRef keeps the name beside the @id, and a bare @id author is refused", () => {
    expect(personRef(person(junOptions))).toEqual({ "@type": "Person", "@id": homeId, name: "Jun", url: "https://jun.example/" });
    expect(personRef({ "@id": homeId, name: "Jun" })).toEqual({ "@type": "Person", "@id": homeId, name: "Jun" });
    expect(() => personRef({ "@type": "Person", "@id": homeId })).toThrow(/name/);
    // ref() is a bare link for isPartOf or publisher; as an author it names nobody, so article() refuses it.
    expect(() => article({ headline: "H", url: "https://n.example/p", datePublished: "2026-10-01", author: ref(homeId) as never })).toThrow(/name/);
  });

  it("dates: Date or ISO 8601, dateModified defaults to datePublished, never before it", () => {
    const a = article({ headline: "H", url: "https://n.example/p", datePublished: new Date("2026-10-01T08:00:00Z"), dateModified: "2026-10-21", author: { name: "Jun" } });
    expect(a).toMatchObject({ datePublished: "2026-10-01T08:00:00.000Z", dateModified: "2026-10-21" });
    expect(() => article({ headline: "H", url: "https://n.example/p", datePublished: "2026-10-21", dateModified: "2026-10-01", author: { name: "Jun" } })).toThrow(/before datePublished/);
    expect(() => article({ headline: "H", url: "https://n.example/p", datePublished: "21 Oct 2026", author: { name: "Jun" } })).toThrow(/ISO 8601/);
    expect(article({ headline: "H", url: "https://n.example/p", datePublished: "2026-10-01", author: { name: "Jun" }, id: "https://n.example/p#article", isPartOf: "https://n.example/#blog" })).toMatchObject({
      "@id": "https://n.example/p#article",
      isPartOf: { "@id": "https://n.example/#blog" },
    });
  });

  it("builds a WebPage linked to its site and subject, with an author reference", () => {
    const page = webPage({
      url: "https://jun.example/ai-tooling",
      name: "AI tooling",
      description: "Tools for agents.",
      isPartOf: "https://jun.example/#website",
      about: homeId,
      author: { "@id": homeId, name: "Jun" },
      dateModified: "2026-10-20",
    });
    expect(page).toEqual({
      "@type": "WebPage",
      "@id": "https://jun.example/ai-tooling#webpage",
      url: "https://jun.example/ai-tooling",
      name: "AI tooling",
      description: "Tools for agents.",
      isPartOf: { "@id": "https://jun.example/#website" },
      about: { "@id": homeId },
      author: { "@type": "Person", "@id": homeId, name: "Jun" },
      dateModified: "2026-10-20",
    });
    expect(webPage({ url: "https://a.example/about", name: "About", type: "AboutPage" })["@type"]).toBe("AboutPage");
  });

  it("builds a ProfilePage whose mainEntity is the full Person with sameAs and the home site's @id", () => {
    const profile = profilePage({ url: "https://notes.example/about", person: junOptions, isPartOf: "https://notes.example/#website", dateModified: "2026-10-22" });
    expect(profile).toMatchObject({
      "@type": "ProfilePage",
      "@id": "https://notes.example/about#profilepage",
      name: "Jun",
      isPartOf: { "@id": "https://notes.example/#website" },
      mainEntity: { "@type": "Person", "@id": homeId, name: "Jun", sameAs: junOptions.sameAs },
      dateModified: "2026-10-22",
    });
    // A prebuilt person() node is used as is.
    expect(profilePage({ url: "https://jun.example/about", person: person(junOptions), name: "About Jun" }).mainEntity).toEqual(person(junOptions));
    expect(() => profilePage({ url: "https://a.example/", person: { "@type": "Person" } })).toThrow(/name/);
  });

  it("builds SoftwareSourceCode with repository, language, licence and author", () => {
    expect(
      softwareSourceCode({
        name: "uipack",
        codeRepository: "https://github.com/jun/uipack",
        url: "https://jun.example/uipack",
        programmingLanguage: ["TypeScript", "CSS"],
        license: "https://opensource.org/licenses/MIT",
        keywords: ["react", "svg"],
        author: person(junOptions),
        dateModified: "2026-10-22",
      }),
    ).toEqual({
      "@type": "SoftwareSourceCode",
      "@id": "https://jun.example/uipack#code",
      name: "uipack",
      url: "https://jun.example/uipack",
      codeRepository: "https://github.com/jun/uipack",
      programmingLanguage: ["TypeScript", "CSS"],
      license: "https://opensource.org/licenses/MIT",
      keywords: "react, svg",
      author: { "@type": "Person", "@id": homeId, name: "Jun", url: "https://jun.example/" },
      dateModified: "2026-10-22",
    });
    expect(softwareSourceCode({ name: "x", codeRepository: "https://github.com/a/x" })["@id"]).toBe("https://github.com/a/x#code");
  });

  it("builds an ItemList and a CollectionPage whose mainEntity is that list, in page order", () => {
    const post = article({ headline: "B", url: "https://n.example/b", datePublished: "2026-10-02", author: { name: "Jun" } });
    expect(itemList([{ url: "https://n.example/a", name: "A" }, post], { order: "descending" })).toEqual({
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: 2,
      itemListElement: [
        { "@type": "ListItem", position: 1, url: "https://n.example/a", name: "A" },
        { "@type": "ListItem", position: 2, item: post },
      ],
    });
    const index = collectionPage({ url: "https://n.example/", name: "Notes", isPartOf: "https://n.example/#website", items: [{ url: "https://n.example/a", name: "A", description: "First." }] });
    expect(index).toMatchObject({
      "@type": "CollectionPage",
      "@id": "https://n.example/#collection",
      mainEntity: { "@type": "ItemList", "@id": "https://n.example/#items", numberOfItems: 1, itemListElement: [{ position: 1, name: "A", description: "First." }] },
    });
  });

  it("serialises safely: </script> and <!-- cannot close the tag, and the JSON round-trips", () => {
    const data = { name: "</script><script>alert(1)</script>", note: "<!-- & -->", ls: "a\u2028b" };
    const s = serializeJsonLd(data);
    expect(s).not.toMatch(/[<>&\u2028]/);
    expect(JSON.parse(s)).toEqual(data);
    const html = renderToStaticMarkup(<JsonLd data={data} />);
    expect(count(html, "</script>")).toBe(1);
    expect(jsonLdBlocks(html)[0]).toEqual(data);
  });
});

describe("FAQ", () => {
  it("shows each question as an h3 with its answer paragraphs, and emits FAQPage from the same items", () => {
    const html = renderToStaticMarkup(<FAQ items={faq} url="https://tidy.example/" />);
    expect(html).toContain('id="faq"');
    expect(count(html, "<h3")).toBe(2);
    expect(html).toMatch(/<h3[^>]*>What does Tidy do\?<\/h3>/);
    expect(textOf(html)).toContain("Tidy clears your inbox while you watch. You keep the decisions.");
    expect(count(html, '<p class="uipack-web-body"')).toBe(3);
    const [ld] = jsonLdBlocks(html);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity.map((q: { name: string }) => q.name)).toEqual(faq.map((f) => f.question));
    expect(ld.mainEntity[1].acceptedAnswer.text).toBe(faq[1].answer);
    expect(html).not.toContain("data-lazy");
    expect(renderToStaticMarkup(<FAQ items={faq} lazyRender />)).toContain('data-lazy="true"');
  });

  it("accordion keeps answers in the HTML inside native details, and jsonLd can be turned off", () => {
    const html = renderToStaticMarkup(<FAQ items={faq} variant="accordion" jsonLd={false} />);
    expect(count(html, "<details")).toBe(2);
    expect(html).toContain("<summary>");
    expect(textOf(html)).toContain("No, it drafts replies and never sends them.");
    expect(html).not.toContain("application/ld+json");
  });
});

describe("crawl files", () => {
  const files = buildCrawlFiles({
    site: "https://tidy.example",
    disallow: ["/app/"],
    pages: [
      { path: "/", title: "Tidy", description: "What Tidy does.", lastmod: new Date("2026-10-20T12:00:00Z") },
      { path: "/pricing", title: "Pricing", description: "Plans & trial.", lastmod: "2026-10-01", markdown: "/pricing.md" },
      { path: "/changelog", title: "Changelog", optional: true, section: "Docs" },
      { path: "/thanks", title: "Thanks", noindex: true },
      { path: "/docs/start", title: "Getting started", section: "Docs" },
      { path: "https://github.com/tidy/tidy/blob/main/README.md", title: "Source", section: "Docs" },
    ],
    llms: { title: "Tidy", summary: "Tidy is an inbox agent.\nIt files and drafts.", details: "Illustrative product." },
  });
  const robots = files["robots.txt"];

  /** The rules of the one group a crawler obeys: the group that names it. */
  const groupFor = (agent: string) => {
    const lines = robots.split("\n");
    const at = lines.indexOf(`User-agent: ${agent}`);
    const out: string[] = [];
    for (let i = at + 1; i < lines.length && lines[i] && !lines[i].startsWith("#"); i++) out.push(lines[i]);
    return out;
  };

  it("robots.txt names every AI crawler with a comment, allows all by default, and repeats private paths per group", () => {
    expect(AI_CRAWLERS.map((c) => c.agent)).toEqual(
      expect.arrayContaining(["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot"]),
    );
    expect(groupFor("*")).toEqual(["Allow: /", "Disallow: /app/"]);
    for (const c of AI_CRAWLERS) {
      expect(groupFor(c.agent)).toEqual(["Allow: /", "Disallow: /app/"]);
      expect(robots).toMatch(new RegExp(`# ${c.operator}: allowed\\. .+\\nUser-agent: ${c.agent}\\n`));
    }
    expect(robots).toContain("# AI crawler stance: allow-all.");
    expect(robots.trimEnd().endsWith("Sitemap: https://tidy.example/sitemap.xml")).toBe(true);
  });

  it("search-only blocks the training crawlers and keeps answer engines; overrides win", () => {
    const r = resolveAiCrawlers("search-only");
    expect(r.GPTBot).toBe("disallow");
    expect(r.CCBot).toBe("disallow");
    expect(r["Google-Extended"]).toBe("disallow");
    expect(r["OAI-SearchBot"]).toBe("allow");
    expect(r["Claude-User"]).toBe("allow");
    expect(r.PerplexityBot).toBe("allow");
    expect(resolveAiCrawlers({ preset: "search-only", GPTBot: "allow" }).GPTBot).toBe("allow");
    expect(Object.values(resolveAiCrawlers("block-all")).every((v) => v === "disallow")).toBe(true);
    const txt = buildCrawlFiles({ site: "https://a.example/", pages: [], aiCrawlers: "search-only", llms: { title: "A", summary: "B" } })["robots.txt"];
    expect(txt).toMatch(/# OpenAI: blocked\. .+\nUser-agent: GPTBot\nDisallow: \/\n/);
    expect(txt).toMatch(/User-agent: OAI-SearchBot\nAllow: \/\n/);
  });

  it("rejects robots paths without a leading slash and a relative site", () => {
    expect(() => buildCrawlFiles({ site: "https://a.example", pages: [], disallow: ["admin"], llms: { title: "A", summary: "B" } })).toThrow(/start with/);
    expect(() => buildCrawlFiles({ site: "a.example", pages: [], llms: { title: "A", summary: "B" } })).toThrow(/absolute/);
  });

  it("sitemap.xml lists indexable pages with absolute loc and W3C lastmod, and nothing Google ignores", () => {
    const xml = files["sitemap.xml"];
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')).toBe(true);
    expect(xml).toContain("<loc>https://tidy.example/</loc>\n    <lastmod>2026-10-20</lastmod>");
    expect(xml).toContain("<loc>https://tidy.example/pricing</loc>\n    <lastmod>2026-10-01</lastmod>");
    expect(count(xml, "<url>")).toBe(4);
    expect(xml).not.toContain("/thanks");
    expect(xml).not.toContain("github.com");
    expect(xml).not.toMatch(/priority|changefreq/);
    expect(new DOMParser().parseFromString(xml, "application/xml").querySelector("parsererror")).toBeNull();
    expect(formatLastmod("2026-10-22T08:00:00+08:00")).toBe("2026-10-22T08:00:00+08:00");
    expect(() => formatLastmod("22/10/2026")).toThrow(/W3C/);
  });

  it("llms-full.txt concatenates page Markdown under titles and URLs, and llms.txt links it", () => {
    const opts = {
      site: "https://n.example",
      llms: { title: "Notes", summary: "Working notes." },
      pages: [
        { path: "/", title: "Notes", description: "Index." },
        { path: "/old", title: "Old post", content: "Old text.", optional: true },
        { path: "/a", title: "Post A", lastmod: "2026-10-21", content: "---\ntitle: Post A\n---\n# Post A\n\nFirst *line*.\n\n## Part\n\nMore.\n" },
        { path: "/draft", title: "Draft", content: "Hidden.", noindex: true },
        { path: "/b", title: "Post B", content: "# Another title\n\nKept, because it is not the page title.", section: "Projects" },
      ],
    };
    expect(llmsFullTxt(opts)).toBe(
      [
        "# Notes",
        "",
        "> Working notes.",
        "",
        "Source: https://n.example/",
        "",
        "---",
        "",
        "# Post A",
        "",
        "URL: https://n.example/a",
        "Updated: 2026-10-21",
        "",
        "First *line*.\n\n## Part\n\nMore.",
        "",
        "---",
        "",
        "# Post B",
        "",
        "URL: https://n.example/b",
        "",
        "# Another title\n\nKept, because it is not the page title.",
        "",
        "---",
        "",
        "# Old post",
        "",
        "URL: https://n.example/old",
        "",
        "Old text.",
        "",
      ].join("\n"),
    );
    const built = buildCrawlFiles(opts);
    expect(built["llms-full.txt"]).toBe(llmsFullTxt(opts));
    expect(built["llms.txt"]).toContain("## Optional\n\n- [Old post](https://n.example/old)\n- [Full text](https://n.example/llms-full.txt): every page above as Markdown in one file\n");
    // Without page content there is no full-text file, and llms.txt does not point at one.
    expect(files).not.toHaveProperty("llms-full.txt");
    expect(files["llms.txt"]).not.toContain("llms-full");
  });

  it("llms.txt follows llmstxt.org: H1, blockquote, details, H2 file lists, Optional last", () => {
    expect(files["llms.txt"]).toBe(
      [
        "# Tidy",
        "",
        "> Tidy is an inbox agent. It files and drafts.",
        "",
        "Illustrative product.",
        "",
        "## Pages",
        "",
        "- [Tidy](https://tidy.example/): What Tidy does.",
        "- [Pricing](https://tidy.example/pricing.md): Plans & trial.",
        "",
        "## Docs",
        "",
        "- [Getting started](https://tidy.example/docs/start)",
        "- [Source](https://github.com/tidy/tidy/blob/main/README.md)",
        "",
        "## Optional",
        "",
        "- [Changelog](https://tidy.example/changelog)",
        "",
      ].join("\n"),
    );
  });
});
