/**
 * Framework-agnostic SEO and answer-engine helpers for Landing pages. Everything here is pure:
 * it returns data (head tags, JSON-LD objects, strings) that any server, static generator or
 * client can render. React wrappers live in Head.tsx; crawl files live in crawl.ts.
 */

/* ---------------------------------------------------------------- Head tags */

/** One element for the document head, as plain data. */
export type HeadTag =
  | { tag: "title"; text: string }
  | { tag: "meta"; attrs: Record<string, string> }
  | { tag: "link"; attrs: Record<string, string> }
  | { tag: "script"; attrs: Record<string, string>; text: string };

export interface PageMetaOptions {
  /** The page title, as it should appear in a result: specific first, brand last. Aim for under 60 characters. */
  title: string;
  /** One or two sentences that answer "what is this page"; about 150 characters is shown in results. */
  description: string;
  /** The canonical, absolute URL of this page (no tracking or theme parameters). */
  url: string;
  /** Social preview image: absolute, or relative to `url`. 1200 × 630 is the common size. */
  image?: string | { url: string; alt?: string; width?: number; height?: number };
  /** The site or product name, e.g. "Tidy". */
  siteName?: string;
  /** BCP 47 or Open Graph locale, e.g. "en_US" or "en-US". Default "en_US". */
  locale?: string;
  /** Open Graph type. Default "website"; use "article" for posts. */
  type?: "website" | "article" | "product" | "profile";
  /** Twitter/X handle of the site, e.g. "@tidyhq". */
  twitterSite?: string;
  /** Robots directives, e.g. "noindex" for a preview. Omitted by default (indexable). */
  robots?: string;
  /**
   * This page as Markdown, absolute or relative to `url`: `<link rel="alternate" type="text/markdown">`,
   * so an agent can fetch clean text instead of parsing the HTML.
   */
  markdown?: string;
  /**
   * The site's llms.txt, absolute or relative to `url` (usually "/llms.txt"):
   * `<link rel="describedby" type="text/markdown">`, the site map written for language models.
   */
  llmsTxt?: string;
  /** The site's RSS feed: `<link rel="alternate" type="application/rss+xml">`, titled with `siteName` unless given. */
  rss?: string | { url: string; title?: string };
  /** ISO 8601 first-publication date: `article:published_time`. For `type: "article"`. */
  publishedTime?: string;
  /** ISO 8601 last substantive change: `article:modified_time`. For `type: "article"`. */
  modifiedTime?: string;
}

const isAbsolute = (u: string) => /^https?:\/\//i.test(u);
/** A node id on the page: the URL without its fragment, plus "#name". */
const nodeId = (url: string, name: string) => `${url.split("#")[0]}#${name}`;

function absoluteUrl(u: string, base: string): string {
  return new URL(u, base).toString();
}

/**
 * The head tags a Landing page needs to be found and previewed: title, description, canonical,
 * Open Graph and Twitter cards. Returns plain data; render it with `<HeadTags>`, `useHead` or
 * `headTagsToHtml`.
 */
export function pageMeta(o: PageMetaOptions): HeadTag[] {
  if (!isAbsolute(o.url)) throw new Error(`pageMeta: url must be absolute (got "${o.url}")`);
  const image = typeof o.image === "string" ? { url: o.image } : o.image;
  const imageUrl = image ? absoluteUrl(image.url, o.url) : undefined;
  const locale = (o.locale ?? "en_US").replace("-", "_");
  const tags: HeadTag[] = [
    { tag: "title", text: o.title },
    { tag: "meta", attrs: { name: "description", content: o.description } },
    { tag: "link", attrs: { rel: "canonical", href: o.url } },
  ];
  if (o.robots) tags.push({ tag: "meta", attrs: { name: "robots", content: o.robots } });
  if (o.markdown) tags.push({ tag: "link", attrs: { rel: "alternate", type: "text/markdown", href: absoluteUrl(o.markdown, o.url) } });
  if (o.llmsTxt) tags.push({ tag: "link", attrs: { rel: "describedby", type: "text/markdown", href: absoluteUrl(o.llmsTxt, o.url) } });
  const rss = typeof o.rss === "string" ? { url: o.rss } : o.rss;
  if (rss) {
    const title = rss.title ?? o.siteName;
    const attrs: Record<string, string> = { rel: "alternate", type: "application/rss+xml", href: absoluteUrl(rss.url, o.url) };
    if (title) attrs.title = title;
    tags.push({ tag: "link", attrs });
  }
  const og = (property: string, content: string | number | undefined) =>
    content !== undefined && content !== "" && tags.push({ tag: "meta", attrs: { property, content: String(content) } });
  og("og:type", o.type ?? "website");
  og("og:title", o.title);
  og("og:description", o.description);
  og("og:url", o.url);
  og("og:site_name", o.siteName);
  og("og:locale", locale);
  if (image && imageUrl) {
    og("og:image", imageUrl);
    og("og:image:alt", image.alt);
    og("og:image:width", image.width);
    og("og:image:height", image.height);
  }
  og("article:published_time", o.publishedTime);
  og("article:modified_time", o.modifiedTime ?? o.publishedTime);
  const tw = (name: string, content: string | undefined) => content && tags.push({ tag: "meta", attrs: { name, content } });
  tw("twitter:card", imageUrl ? "summary_large_image" : "summary");
  tw("twitter:title", o.title);
  tw("twitter:description", o.description);
  tw("twitter:image", imageUrl);
  tw("twitter:image:alt", image?.alt);
  tw("twitter:site", o.twitterSite);
  return tags;
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Serialise head tags to an HTML string, for a static generator or a server template. */
export function headTagsToHtml(tags: HeadTag[]): string {
  return tags
    .map((t) => {
      if (t.tag === "title") return `<title>${escapeHtml(t.text)}</title>`;
      const attrs = Object.entries(t.attrs)
        .map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${escapeHtml(v)}"`))
        .join("");
      // Script text is already safe: serializeJsonLd escapes "<", so it cannot close the tag.
      if (t.tag === "script") return `<script${attrs}>${t.text}</script>`;
      return `<${t.tag}${attrs}>`;
    })
    .join("\n");
}

/** The identity of a head tag: a later tag with the same key replaces an earlier one. */
export function headTagKey(t: HeadTag): string {
  if (t.tag === "title") return "title";
  const a = t.attrs;
  if (t.tag === "meta") return a.name ? `meta:name:${a.name}` : a.property ? `meta:property:${a.property}` : `meta:${JSON.stringify(a)}`;
  if (t.tag === "link") return a.rel === "canonical" ? "link:canonical" : `link:${a.rel}:${a.href}`;
  return `script:${a.id ?? a.type}:${t.text.length}`;
}

/* ---------------------------------------------------------------- Fonts */

/** The self-hosted Landing faces, by role. Files ship in `uipack/fonts/*` (dist/fonts). */
export const WEB_FONT_FILES = {
  display: "instrument-serif-latin-400-normal.woff2",
  "display-italic": "instrument-serif-latin-400-italic.woff2",
  text: "ibm-plex-sans-latin-400-normal.woff2",
  "text-500": "ibm-plex-sans-latin-500-normal.woff2",
  "text-600": "ibm-plex-sans-latin-600-normal.woff2",
  mono: "ibm-plex-mono-latin-400-normal.woff2",
  "mono-600": "ibm-plex-mono-latin-600-normal.woff2",
} as const;

export type WebFontFace = keyof typeof WEB_FONT_FILES;

export interface FontPreloadOptions {
  /**
   * The faces above the fold. Default `["display"]`: the hero headline, usually the LCP text.
   * Add "display-italic" when the hero title has an `<em>`. Preload two at most; every
   * preload competes with the hero's other requests.
   */
  faces?: WebFontFace[];
  /** Where the woff2 files are served, e.g. "/fonts/". Default "/fonts/". */
  base?: string;
  /** Or resolve each file yourself, e.g. to a bundler's hashed URL. Must match the URL web.css uses. */
  href?: (file: string, face: WebFontFace) => string;
  /**
   * Preload only where it pays, e.g. "(min-width: 720px)" when the swap moves the hero only in
   * wide layouts. On a slow phone a preload competes with the page's own scripts.
   */
  media?: string;
}

/**
 * `<link rel="preload" as="font">` descriptors for the faces the hero shows first, so they arrive
 * with the HTML instead of after the stylesheet and layout. The URL must be the same one the
 * @font-face rule fetches, or the browser downloads the file twice.
 */
export function fontPreloads({ faces = ["display"], base = "/fonts/", href, media }: FontPreloadOptions = {}): HeadTag[] {
  const dir = base.endsWith("/") ? base : `${base}/`;
  return faces.map((face) => {
    const file = WEB_FONT_FILES[face];
    const attrs: Record<string, string> = { rel: "preload", href: href ? href(file, face) : `${dir}${file}`, as: "font", type: "font/woff2", crossorigin: "anonymous" };
    if (media) attrs.media = media;
    return { tag: "link", attrs };
  });
}

/* ---------------------------------------------------------------- JSON-LD */

/** A schema.org node. Builders return these without "@context"; `jsonLd()` adds it. */
export type JsonLdNode = { "@type": string | string[]; "@id"?: string } & Record<string, unknown>;
export type JsonLdDocument = Record<string, unknown> & { "@context": "https://schema.org" };

/** A reference to a node by its "@id", for linking nodes in one graph. */
export const ref = (node: { "@id"?: string } | string) => ({ "@id": typeof node === "string" ? node : node["@id"] });

/** Drop undefined values and empty arrays so the output stays minimal and valid. */
function clean<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as T;
}

export interface OrganizationOptions {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  /** Profiles that identify the organisation elsewhere (GitHub, LinkedIn, X…). */
  sameAs?: string[];
  id?: string;
}

export function organization(o: OrganizationOptions): JsonLdNode {
  return clean({ "@type": "Organization", "@id": o.id ?? nodeId(o.url, "organization"), name: o.name, url: o.url, logo: o.logo, description: o.description, sameAs: o.sameAs });
}

export interface PersonOptions {
  name: string;
  /** The person's canonical page, e.g. their home page or /about. */
  url: string;
  /**
   * Profiles that are this person elsewhere (GitHub, LinkedIn, X, another site), so answer
   * engines join them into one entity. Only pages the person controls or that are about them.
   */
  sameAs?: string[];
  image?: string;
  jobTitle?: string;
  description?: string;
  /**
   * Default `${url}#person`. Every site that mentions the person should use the same id, so
   * their articles and profiles resolve to one node; pass the home site's id from elsewhere.
   */
  id?: string;
}

/** A Person, e.g. a site's author. Publish it once, then reference it by `@id` from articles. */
export function person(o: PersonOptions): JsonLdNode {
  return clean({
    "@type": "Person",
    "@id": o.id ?? nodeId(o.url, "person"),
    name: o.name,
    url: o.url,
    image: o.image,
    jobTitle: o.jobTitle,
    description: o.description,
    sameAs: o.sameAs,
  });
}

export interface WebSiteOptions {
  name: string;
  url: string;
  description?: string;
  /** The Organization node (or its "@id") that publishes the site. */
  publisher?: { "@id"?: string } | string;
  inLanguage?: string;
  id?: string;
}

export function webSite(o: WebSiteOptions): JsonLdNode {
  return clean({
    "@type": "WebSite",
    "@id": o.id ?? nodeId(o.url, "website"),
    name: o.name,
    url: o.url,
    description: o.description,
    inLanguage: o.inLanguage,
    publisher: o.publisher ? ref(o.publisher) : undefined,
  });
}

export interface OfferOptions {
  /** A number or a decimal string ("8.00"). 0 for free. */
  price: number | string;
  /** ISO 4217, e.g. "USD". */
  priceCurrency: string;
  /** Plan name as shown on the page, e.g. "Personal". */
  name?: string;
  url?: string;
  /** Recurring billing: the price is per month ("MON") or per year ("ANN"). */
  billing?: "MON" | "ANN";
  availability?: "InStock" | "PreOrder" | "OutOfStock" | "Discontinued";
  /** Free trial length in days, if the page states one. */
  trialDays?: number;
  description?: string;
}

/** An Offer, e.g. the plan on the Pricing section. Same words and numbers as the page shows. */
export function offer(o: OfferOptions): JsonLdNode {
  return clean({
    "@type": "Offer",
    name: o.name,
    description: o.description,
    url: o.url,
    price: o.price,
    priceCurrency: o.priceCurrency,
    availability: o.availability ? `https://schema.org/${o.availability}` : undefined,
    priceSpecification: o.billing
      ? {
          "@type": "UnitPriceSpecification",
          price: o.price,
          priceCurrency: o.priceCurrency,
          referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: o.billing },
        }
      : undefined,
    eligibleDuration: o.trialDays ? { "@type": "QuantitativeValue", value: o.trialDays, unitCode: "DAY" } : undefined,
  });
}

export interface RatingOptions {
  ratingValue: number;
  ratingCount: number;
  bestRating?: number;
}

export interface SoftwareApplicationOptions {
  name: string;
  description: string;
  url: string;
  /** One of Google's supported app types, e.g. "BusinessApplication", "CommunicationApplication". */
  applicationCategory?: string;
  /** Default "SoftwareApplication"; "WebApplication" for a browser-only SaaS. */
  type?: "SoftwareApplication" | "WebApplication" | "MobileApplication";
  /** e.g. "Web", "macOS, Windows", "iOS". */
  operatingSystem?: string;
  offers?: JsonLdNode | JsonLdNode[];
  image?: string;
  publisher?: { "@id"?: string } | string;
  /** Only real, visible ratings. Google's app rich result needs one; never invent it. */
  aggregateRating?: RatingOptions;
  id?: string;
}

/** A SaaS or app landing page's product, with its offer(s). */
export function softwareApplication(o: SoftwareApplicationOptions): JsonLdNode {
  return clean({
    "@type": o.type ?? "SoftwareApplication",
    "@id": o.id ?? nodeId(o.url, "app"),
    name: o.name,
    description: o.description,
    url: o.url,
    image: o.image,
    applicationCategory: o.applicationCategory,
    operatingSystem: o.operatingSystem,
    offers: o.offers,
    publisher: o.publisher ? ref(o.publisher) : undefined,
    aggregateRating: o.aggregateRating ? { "@type": "AggregateRating", ...o.aggregateRating } : undefined,
  });
}

export interface ProductOptions {
  name: string;
  description: string;
  url: string;
  image?: string | string[];
  brand?: string;
  sku?: string;
  offers?: JsonLdNode | JsonLdNode[];
  aggregateRating?: RatingOptions;
  id?: string;
}

/** A physical or generic product with its offer(s). */
export function product(o: ProductOptions): JsonLdNode {
  return clean({
    "@type": "Product",
    "@id": o.id ?? nodeId(o.url, "product"),
    name: o.name,
    description: o.description,
    url: o.url,
    image: o.image,
    sku: o.sku,
    brand: o.brand ? { "@type": "Brand", name: o.brand } : undefined,
    offers: o.offers,
    aggregateRating: o.aggregateRating ? { "@type": "AggregateRating", ...o.aggregateRating } : undefined,
  });
}

export interface FaqItem {
  /** The question as a reader would ask it, ending in "?". */
  question: string;
  /** Plain text. The first sentence answers the question on its own; blank lines separate paragraphs. */
  answer: string;
  /** Anchor id for the item; defaults to a slug of the question. */
  id?: string;
}

/** FAQPage from the same items the FAQ component shows, so markup and visible text cannot drift. */
export function faqPage(items: FaqItem[], { url, id }: { url?: string; id?: string } = {}): JsonLdNode {
  return clean({
    "@type": "FAQPage",
    "@id": id ?? (url ? `${url.split("#")[0]}#faq` : undefined),
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  });
}

export interface BreadcrumbItem {
  name: string;
  /** Absolute URL. The last item (the current page) may omit it. */
  url?: string;
}

export function breadcrumbList(items: BreadcrumbItem[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((b, i) => clean({ "@type": "ListItem", position: i + 1, name: b.name, item: b.url })),
  };
}

/**
 * A schema.org date: a `Date` (serialised as ISO 8601 in UTC) or an ISO 8601 string as given.
 * Use the date the content last changed, from its source (frontmatter, `git log -1 --format=%cI -- file`),
 * never the build time: a dateModified that moves on every deploy tells engines nothing.
 */
export type SchemaDate = Date | string;

function schemaDate(d: SchemaDate | undefined, field: string): string | undefined {
  if (d === undefined || d === "") return undefined;
  if (d instanceof Date) {
    if (Number.isNaN(d.getTime())) throw new Error(`${field}: invalid Date`);
    return d.toISOString();
  }
  if (!/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(d)) throw new Error(`${field} must be ISO 8601, e.g. 2026-10-22 (got "${d}")`);
  return d;
}

/** datePublished and dateModified as strings; dateModified defaults to datePublished and may not precede it. */
function pageDates(published: SchemaDate | undefined, modified: SchemaDate | undefined, builder: string) {
  const datePublished = schemaDate(published, `${builder}: datePublished`);
  const dateModified = schemaDate(modified, `${builder}: dateModified`) ?? datePublished;
  if (datePublished && dateModified && Date.parse(dateModified) < Date.parse(datePublished))
    throw new Error(`${builder}: dateModified (${dateModified}) is before datePublished (${datePublished})`);
  return { datePublished, dateModified };
}

/** An author or creator: plain name and url, a Person's `@id` and name, or a `person()` node. */
export type ArticleAuthor = { name: string; url?: string; "@id"?: string } | JsonLdNode;

/**
 * A compact Person reference, `{ "@type": "Person", "@id", name, url? }`, for an author, creator or
 * `about`. Keeps the name beside the `@id`: a bare `{ "@id" }` names nobody to a reader of this page
 * alone, and Google's article guidelines ask for the author's name. Takes a `person()` node or
 * `{ "@id"?, name, url? }`; throws without a name.
 */
export function personRef(a: ArticleAuthor): JsonLdNode {
  const name = typeof a.name === "string" ? a.name : undefined;
  if (!name) throw new Error("personRef: every author needs a name, not only an @id");
  const url = typeof a.url === "string" ? a.url : undefined;
  return clean({ "@type": "Person", "@id": typeof a["@id"] === "string" ? a["@id"] : undefined, name, url });
}

const people = (a: ArticleAuthor | ArticleAuthor[] | undefined) => {
  if (a === undefined) return undefined;
  const list = (Array.isArray(a) ? a : [a]).map(personRef);
  return list.length === 1 ? list[0] : list;
};
const optRef = (n: { "@id"?: string } | string | undefined) => (n ? ref(n) : undefined);

export interface ArticleOptions {
  headline: string;
  description?: string;
  url: string;
  image?: string | string[];
  /** ISO 8601 string or Date: first publication. */
  datePublished: SchemaDate;
  /** Last substantive change to the text, not the build date. Defaults to `datePublished`. */
  dateModified?: SchemaDate;
  /**
   * A name (and url), a `person()` node, or a Person's `{ "@id", name }`. With an `@id` the author
   * links to that Person node, wherever it is published; the name stays for readers of this page alone.
   */
  author: ArticleAuthor | ArticleAuthor[];
  publisher?: { "@id"?: string } | string;
  type?: "Article" | "BlogPosting" | "NewsArticle" | "TechArticle";
  /** Default none, as before; e.g. `${url}#article` to link the article from a WebPage or ItemList. */
  id?: string;
  /** The WebPage or Blog (node or "@id") the article belongs to. */
  isPartOf?: { "@id"?: string } | string;
}

export function article(o: ArticleOptions): JsonLdNode {
  const authors = (Array.isArray(o.author) ? o.author : [o.author]).map((a) => {
    try {
      return personRef(a);
    } catch {
      throw new Error("article: every author needs a name");
    }
  });
  return clean({
    "@type": o.type ?? "Article",
    "@id": o.id,
    headline: o.headline,
    description: o.description,
    url: o.url,
    mainEntityOfPage: o.url,
    image: o.image,
    ...pageDates(o.datePublished, o.dateModified, "article"),
    author: authors.length === 1 ? authors[0] : authors,
    publisher: optRef(o.publisher),
    isPartOf: optRef(o.isPartOf),
  });
}

export interface WebPageOptions {
  url: string;
  /** The page's own title, as in its `<h1>` (not the `<title>` with the brand suffix). */
  name: string;
  description?: string;
  /** Default "WebPage". */
  type?: "WebPage" | "AboutPage" | "ContactPage" | "ItemPage" | "CollectionPage" | "ProfilePage";
  /** The WebSite (node or "@id") this page belongs to. */
  isPartOf?: { "@id"?: string } | string;
  /** What the page is about, e.g. the site owner's Person (node or "@id"). */
  about?: { "@id"?: string } | string;
  /** The page's main subject, as a full node or a reference. */
  mainEntity?: JsonLdNode | { "@id": string };
  author?: ArticleAuthor | ArticleAuthor[];
  /** Absolute URL of the page's main image. */
  image?: string;
  breadcrumb?: JsonLdNode;
  datePublished?: SchemaDate;
  /** When the page's content last changed (not the deploy). Defaults to `datePublished`. */
  dateModified?: SchemaDate;
  inLanguage?: string;
  /** Default `${url}#webpage`. */
  id?: string;
}

/** A WebPage (or a subtype), linked to its WebSite and to what it is about. */
export function webPage(o: WebPageOptions): JsonLdNode {
  return clean({
    "@type": o.type ?? "WebPage",
    "@id": o.id ?? nodeId(o.url, "webpage"),
    url: o.url,
    name: o.name,
    description: o.description,
    inLanguage: o.inLanguage,
    isPartOf: optRef(o.isPartOf),
    about: optRef(o.about),
    mainEntity: o.mainEntity,
    author: people(o.author),
    primaryImageOfPage: o.image,
    breadcrumb: o.breadcrumb,
    ...pageDates(o.datePublished, o.dateModified, "webPage"),
  });
}

export interface ProfilePageOptions extends Omit<WebPageOptions, "type" | "mainEntity" | "about" | "author" | "name"> {
  /** The page title; defaults to the person's name. */
  name?: string;
  /**
   * The person the page is about: `person()` options or node. Its `sameAs` (GitHub, LinkedIn, the
   * home site) is what lets engines join this profile to the same person elsewhere; keep the `@id`
   * the home site uses.
   */
  person: PersonOptions | JsonLdNode;
  /** When the profile was first published. */
  dateCreated?: SchemaDate;
}

/** A ProfilePage (an about page, an author page) whose mainEntity is the full Person, with sameAs. */
export function profilePage(o: ProfilePageOptions): JsonLdNode {
  const entity = "@type" in o.person ? (o.person as JsonLdNode) : person(o.person as PersonOptions);
  const name = typeof entity.name === "string" ? entity.name : undefined;
  if (!name) throw new Error("profilePage: the person needs a name");
  const page = webPage({ ...o, type: "ProfilePage", name: o.name ?? name, mainEntity: entity, id: o.id ?? nodeId(o.url, "profilepage") });
  return clean({ ...page, dateCreated: schemaDate(o.dateCreated, "profilePage: dateCreated") });
}

export interface SoftwareSourceCodeOptions {
  name: string;
  /** The repository, e.g. "https://github.com/acme/tidy". */
  codeRepository: string;
  description?: string;
  /** The project's own page, if it has one. Default the repository. */
  url?: string;
  /** e.g. "TypeScript", or ["TypeScript", "CSS"]. */
  programmingLanguage?: string | string[];
  /** e.g. "Node.js 20", "React 18". */
  runtimePlatform?: string;
  /** A licence URL or SPDX name, e.g. "https://opensource.org/licenses/MIT". */
  license?: string;
  version?: string;
  author?: ArticleAuthor | ArticleAuthor[];
  datePublished?: SchemaDate;
  dateModified?: SchemaDate;
  keywords?: string | string[];
  /** Default `${url ?? codeRepository}#code`. */
  id?: string;
}

/** SoftwareSourceCode: an open-source library or tool, linked to its repository and author. */
export function softwareSourceCode(o: SoftwareSourceCodeOptions): JsonLdNode {
  const url = o.url ?? o.codeRepository;
  return clean({
    "@type": "SoftwareSourceCode",
    "@id": o.id ?? nodeId(url, "code"),
    name: o.name,
    description: o.description,
    url,
    codeRepository: o.codeRepository,
    programmingLanguage: o.programmingLanguage,
    runtimePlatform: o.runtimePlatform,
    license: o.license,
    version: o.version,
    keywords: Array.isArray(o.keywords) ? o.keywords.join(", ") : o.keywords,
    author: people(o.author),
    ...pageDates(o.datePublished, o.dateModified, "softwareSourceCode"),
  });
}

/** One entry of an ItemList: a link with its name, or a node (an article, a project) shown in the list. */
export type ItemListEntry = { url: string; name: string; description?: string } | JsonLdNode;

export interface ItemListOptions {
  name?: string;
  /** "ItemListOrderAscending", "ItemListOrderDescending" (newest first) or "ItemListUnordered". */
  order?: "ascending" | "descending" | "unordered";
  id?: string;
}

/** An ItemList of ListItems with 1-based positions, in the order the page shows them. */
export function itemList(items: ItemListEntry[], o: ItemListOptions = {}): JsonLdNode {
  const order = { ascending: "ItemListOrderAscending", descending: "ItemListOrderDescending", unordered: "ItemListUnordered" } as const;
  return clean({
    "@type": "ItemList",
    "@id": o.id,
    name: o.name,
    itemListOrder: o.order ? `https://schema.org/${order[o.order]}` : undefined,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) =>
      "@type" in it
        ? { "@type": "ListItem", position: i + 1, item: it }
        : clean({ "@type": "ListItem", position: i + 1, url: it.url, name: it.name, description: it.description }),
    ),
  });
}

export interface CollectionPageOptions extends Omit<WebPageOptions, "type" | "mainEntity"> {
  /** The entries the page lists (posts, projects), in the order shown. */
  items: ItemListEntry[];
  order?: ItemListOptions["order"];
}

/** A CollectionPage (an index of posts or projects) whose mainEntity is the ItemList it shows. */
export function collectionPage(o: CollectionPageOptions): JsonLdNode {
  const { items, order, ...page } = o;
  return webPage({ ...page, type: "CollectionPage", id: o.id ?? nodeId(o.url, "collection"), mainEntity: itemList(items, { order, id: nodeId(o.url, "items") }) });
}

/** Wrap one node, or several as an "@graph", in a JSON-LD document with its "@context". */
export function jsonLd(...nodes: JsonLdNode[]): JsonLdDocument {
  if (nodes.length === 1) return { "@context": "https://schema.org", ...nodes[0] };
  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * JSON for a `<script type="application/ld+json">` body. Escapes "<", ">" and "&" as JSON unicode
 * escapes, so a value containing "</script>" or "<!--" cannot end the script early, and escapes
 * the line and paragraph separators (U+2028, U+2029). The result parses back to the same data.
 */
const LS = /*#__PURE__*/ String.fromCharCode(0x2028);
const PS = /*#__PURE__*/ String.fromCharCode(0x2029);
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(LS)
    .join("\\u2028")
    .split(PS)
    .join("\\u2029");
}

/** A JSON-LD document as a head tag, for `headTagsToHtml` or `useHead`. */
export function jsonLdTag(data: JsonLdDocument, id?: string): HeadTag {
  return { tag: "script", attrs: id ? { type: "application/ld+json", id } : { type: "application/ld+json" }, text: serializeJsonLd(data) };
}

/** URL-safe anchor id from a question or heading. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
