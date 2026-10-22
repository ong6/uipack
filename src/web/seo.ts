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

export interface ArticleOptions {
  headline: string;
  description?: string;
  url: string;
  image?: string | string[];
  /** ISO 8601 dates. */
  datePublished: string;
  dateModified?: string;
  author: { name: string; url?: string } | { name: string; url?: string }[];
  publisher?: { "@id"?: string } | string;
  type?: "Article" | "BlogPosting" | "NewsArticle" | "TechArticle";
}

export function article(o: ArticleOptions): JsonLdNode {
  const authors = (Array.isArray(o.author) ? o.author : [o.author]).map((a) => clean({ "@type": "Person", name: a.name, url: a.url }));
  return clean({
    "@type": o.type ?? "Article",
    headline: o.headline,
    description: o.description,
    url: o.url,
    mainEntityOfPage: o.url,
    image: o.image,
    datePublished: o.datePublished,
    dateModified: o.dateModified ?? o.datePublished,
    author: authors.length === 1 ? authors[0] : authors,
    publisher: o.publisher ? ref(o.publisher) : undefined,
  });
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
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
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
