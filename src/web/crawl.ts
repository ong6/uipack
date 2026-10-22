/**
 * Crawl files for a Landing site: robots.txt with an explicit stance per AI crawler,
 * sitemap.xml with lastmod, and llms.txt in the llmstxt.org format. Pure string builders;
 * write the result wherever your host serves the site root.
 */

export type CrawlRule = "allow" | "disallow";

/** What a crawler's visits are for, as its operator documents it. */
export type CrawlerPurpose = "search" | "user" | "training";

export interface AiCrawler {
  /** The robots.txt user-agent token. */
  agent: string;
  operator: string;
  purpose: CrawlerPurpose;
  /** One line for the robots.txt comment: what allowing or blocking it changes. */
  note: string;
  docs: string;
}

/**
 * The AI crawlers Landing sites should state a stance on, from each operator's own documentation
 * (checked October 2026). Search and user agents decide whether answer engines can find, fetch and
 * cite the page; training agents decide whether the page may be used to train models.
 */
export const AI_CRAWLERS = [
  { agent: "OAI-SearchBot", operator: "OpenAI", purpose: "search", note: "Shows the site in ChatGPT search answers. Blocked sites appear only as navigational links.", docs: "https://platform.openai.com/docs/bots" },
  { agent: "ChatGPT-User", operator: "OpenAI", purpose: "user", note: "Fetches a page when a ChatGPT user asks. User-initiated, so OpenAI says robots.txt rules may not apply.", docs: "https://platform.openai.com/docs/bots" },
  { agent: "GPTBot", operator: "OpenAI", purpose: "training", note: "Collects pages that may train OpenAI's foundation models. Independent of search.", docs: "https://platform.openai.com/docs/bots" },
  { agent: "Claude-SearchBot", operator: "Anthropic", purpose: "search", note: "Indexes pages for Claude's search results. Blocking it reduces visibility in Claude answers.", docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" },
  { agent: "Claude-User", operator: "Anthropic", purpose: "user", note: "Fetches a page when a Claude user asks. Blocking it stops Claude retrieving the page for users.", docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" },
  { agent: "ClaudeBot", operator: "Anthropic", purpose: "training", note: "Collects pages that may train Anthropic's models.", docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" },
  { agent: "PerplexityBot", operator: "Perplexity", purpose: "search", note: "Indexes and links the site in Perplexity answers. Not used for training foundation models.", docs: "https://docs.perplexity.ai/guides/bots" },
  { agent: "Perplexity-User", operator: "Perplexity", purpose: "user", note: "Fetches a page when a Perplexity user asks. Perplexity says it generally ignores robots.txt.", docs: "https://docs.perplexity.ai/guides/bots" },
  { agent: "Google-Extended", operator: "Google", purpose: "training", note: "Gemini model training and grounding in Gemini Apps and Vertex AI. Does not affect Google Search or AI Overviews (Googlebot).", docs: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers" },
  { agent: "Applebot-Extended", operator: "Apple", purpose: "training", note: "Apple foundation-model training. It crawls nothing itself; Applebot search (Siri, Spotlight, Safari) is unaffected.", docs: "https://support.apple.com/en-us/119829" },
  { agent: "CCBot", operator: "Common Crawl", purpose: "training", note: "Common Crawl's open web archive, which many model training sets are built from.", docs: "https://commoncrawl.org/ccbot" },
] as const satisfies readonly AiCrawler[];

export type AiCrawlerAgent = (typeof AI_CRAWLERS)[number]["agent"];

/**
 * - "allow-all" (default): search, user and training crawlers may all read the public pages.
 *   A landing page is marketing copy meant to be repeated, and Google-Extended also gates
 *   grounding in Gemini Apps.
 * - "search-only": answer engines may find, fetch and cite the site; training crawlers are refused.
 * - "block-all": every listed AI crawler is refused. Google Search and AI Overviews still use Googlebot.
 */
export type AiCrawlerPreset = "allow-all" | "search-only" | "block-all";

export type AiCrawlerPolicy = AiCrawlerPreset | ({ preset?: AiCrawlerPreset } & Partial<Record<AiCrawlerAgent, CrawlRule>>);

/** The rule each listed AI crawler gets under a policy. */
export function resolveAiCrawlers(policy: AiCrawlerPolicy = "allow-all"): Record<AiCrawlerAgent, CrawlRule> {
  const preset = typeof policy === "string" ? policy : policy.preset ?? "allow-all";
  const overrides = typeof policy === "string" ? {} : policy;
  const out = {} as Record<AiCrawlerAgent, CrawlRule>;
  for (const c of AI_CRAWLERS) {
    const base: CrawlRule = preset === "block-all" ? "disallow" : preset === "search-only" && c.purpose === "training" ? "disallow" : "allow";
    out[c.agent] = (overrides as Partial<Record<AiCrawlerAgent, CrawlRule>>)[c.agent] ?? base;
  }
  return out;
}

export interface CrawlPage {
  /** Path from the site root ("/", "/pricing") or an absolute URL on the site. */
  path: string;
  title: string;
  /** One sentence for llms.txt: what a reader or model will find on the page. */
  description?: string;
  /** Last real content change: a Date or "YYYY-MM-DD" / ISO 8601. Omit rather than guess. */
  lastmod?: Date | string;
  /** llms.txt section heading. Default "Pages". */
  section?: string;
  /** List under llms.txt's "## Optional" section, which agents may skip for a short context. */
  optional?: boolean;
  /** A clean Markdown copy of the page (llmstxt.org suggests `page.md`); llms.txt links it instead. */
  markdown?: string;
  /**
   * The page's text as Markdown, for llms-full.txt. YAML frontmatter and a leading `# Title` are
   * dropped (the file writes its own heading). Pages without it are left out of llms-full.txt.
   */
  content?: string;
  /** Leave out of sitemap.xml and llms.txt (e.g. a thank-you page). */
  noindex?: boolean;
}

export interface BuildCrawlFilesOptions {
  /** The site's origin and base, e.g. "https://tidy.example". */
  site: string;
  pages: CrawlPage[];
  /** Stance per AI crawler. Default "allow-all". */
  aiCrawlers?: AiCrawlerPolicy;
  /** Paths no crawler should fetch, e.g. ["/admin/", "/api/"]. Repeated in every group. */
  disallow?: string[];
  /** Where sitemap.xml will be served. Default "/sitemap.xml". */
  sitemapPath?: string;
  /** llms.txt header: H1 name, blockquote summary, optional details paragraph. */
  llms: { title: string; summary: string; details?: string };
}

export interface CrawlFiles {
  "robots.txt": string;
  "sitemap.xml": string;
  "llms.txt": string;
  /** Present when at least one page has `content`. */
  "llms-full.txt"?: string;
}

/** Where buildCrawlFiles serves the full-text file, linked from llms.txt's Optional section. */
export const LLMS_FULL_PATH = "/llms-full.txt";

const siteRoot = (site: string) => {
  if (!/^https?:\/\//i.test(site)) throw new Error(`buildCrawlFiles: site must be an absolute URL (got "${site}")`);
  return site.endsWith("/") ? site : `${site}/`;
};
const pageUrl = (site: string, path: string) => new URL(path.replace(/^\//, ""), siteRoot(site)).toString();

function checkPath(p: string): string {
  if (!p.startsWith("/")) throw new Error(`robots.txt paths start with "/" (got "${p}")`);
  return p;
}

/**
 * robots.txt. Each listed AI crawler gets its own group with a comment saying what it does,
 * because a crawler obeys only the most specific group that names it and ignores `*`: site-wide
 * `disallow` paths are therefore repeated in every allowed group.
 */
export function robotsTxt({ site, aiCrawlers, disallow = [], sitemapPath = "/sitemap.xml" }: Pick<BuildCrawlFilesOptions, "site" | "aiCrawlers" | "disallow" | "sitemapPath">): string {
  const root = siteRoot(site);
  const paths = disallow.map(checkPath);
  const rules = resolveAiCrawlers(aiCrawlers);
  const preset = typeof aiCrawlers === "string" ? aiCrawlers : aiCrawlers?.preset ?? "allow-all";
  const allowLines = ["Allow: /", ...paths.map((p) => `Disallow: ${p}`)];
  const lines: string[] = [
    `# robots.txt for ${root}`,
    `# AI crawler stance: ${preset}${typeof aiCrawlers === "object" && Object.keys(aiCrawlers).some((k) => k !== "preset") ? " (with overrides)" : ""}.`,
    "# Search and user-triggered agents decide whether answer engines can find, fetch and cite",
    "# these pages; training agents decide whether the pages may train models.",
    "",
    "User-agent: *",
    ...allowLines,
  ];
  for (const purpose of ["search", "user", "training"] as const) {
    lines.push("", `# ---- ${purpose === "search" ? "AI search indexes" : purpose === "user" ? "AI fetches a user asked for" : "AI model training"}`);
    for (const c of AI_CRAWLERS.filter((x) => x.purpose === purpose)) {
      const rule = rules[c.agent];
      lines.push("", `# ${c.operator}: ${rule === "allow" ? "allowed" : "blocked"}. ${c.note}`, `User-agent: ${c.agent}`);
      lines.push(...(rule === "allow" ? allowLines : ["Disallow: /"]));
    }
  }
  lines.push("", `Sitemap: ${pageUrl(site, sitemapPath)}`, "");
  return lines.join("\n");
}

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** W3C datetime for <lastmod>: a Date becomes YYYY-MM-DD (UTC); a string must already be one. */
export function formatLastmod(d: Date | string): string {
  if (d instanceof Date) {
    if (Number.isNaN(d.getTime())) throw new Error("sitemap lastmod: invalid Date");
    return d.toISOString().slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/.test(d)) throw new Error(`sitemap lastmod must be W3C datetime, e.g. 2026-10-22 (got "${d}")`);
  return d;
}

/**
 * sitemap.xml with <loc> and <lastmod> only. Google ignores <priority> and <changefreq>, and uses
 * <lastmod> only while it stays accurate, so set it from real content changes.
 */
export function sitemapXml({ site, pages }: Pick<BuildCrawlFilesOptions, "site" | "pages">): string {
  const origin = new URL(siteRoot(site)).origin;
  const urls = pages
    // A sitemap lists this site's own URLs only; off-site links (docs on GitHub) belong in llms.txt.
    .filter((p) => !p.noindex && new URL(pageUrl(site, p.path)).origin === origin)
    .map((p) => {
      const lastmod = p.lastmod ? `\n    <lastmod>${formatLastmod(p.lastmod)}</lastmod>` : "";
      return `  <url>\n    <loc>${escapeXml(pageUrl(site, p.path))}</loc>${lastmod}\n  </url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * llms.txt per llmstxt.org: an H1 name, a blockquote summary, optional details, then H2 sections
 * of `- [name](url): notes` links, with "Optional" last for links an agent can skip.
 */
export function llmsTxt({ site, pages, llms }: Pick<BuildCrawlFilesOptions, "site" | "pages" | "llms">): string {
  const out: string[] = [`# ${oneLine(llms.title)}`, "", `> ${oneLine(llms.summary)}`];
  if (llms.details) out.push("", llms.details.trim());
  const sections = new Map<string, CrawlPage[]>();
  const optional: CrawlPage[] = [];
  for (const p of pages.filter((x) => !x.noindex)) {
    if (p.optional) optional.push(p);
    else sections.set(p.section ?? "Pages", [...(sections.get(p.section ?? "Pages") ?? []), p]);
  }
  const item = (p: CrawlPage) => `- [${oneLine(p.title).replace(/[[\]]/g, "")}](${pageUrl(site, p.markdown ?? p.path)})${p.description ? `: ${oneLine(p.description)}` : ""}`;
  for (const [name, list] of sections) out.push("", `## ${name}`, "", ...list.map(item));
  const full = pages.some((p) => !p.noindex && p.content?.trim())
    ? [`- [Full text](${pageUrl(site, LLMS_FULL_PATH)}): every page above as Markdown in one file`]
    : [];
  if (optional.length || full.length) out.push("", "## Optional", "", ...optional.map(item), ...full);
  return `${out.join("\n")}\n`;
}

/** Page Markdown without YAML frontmatter or a leading H1 that repeats the title. */
function pageBody(content: string, title: string): string {
  let body = content.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  body = body.replace(/^---\n[\s\S]*?\n---\n/, "");
  const h1 = /^\s*#\s+(.+?)\s*#*\s*\n/.exec(body);
  if (h1 && oneLine(h1[1]) === oneLine(title)) body = body.slice(h1[0].length);
  return body.trim();
}

/**
 * llms-full.txt: the llms.txt header, then each page's Markdown in one file, so an agent can read the
 * whole site in one request. Each page opens with its title as an H1, its URL and, when known, the
 * date it last changed, and pages are separated by `---`. The same order as llms.txt: sections, then
 * Optional. Only pages with `content` are included; noindex pages never are.
 */
export function llmsFullTxt({ site, pages, llms }: Pick<BuildCrawlFilesOptions, "site" | "pages" | "llms">): string {
  const out: string[] = [`# ${oneLine(llms.title)}`, "", `> ${oneLine(llms.summary)}`];
  if (llms.details) out.push("", llms.details.trim());
  out.push("", `Source: ${siteRoot(site)}`);
  const withText = pages.filter((p) => !p.noindex && p.content?.trim());
  const sections = new Map<string, CrawlPage[]>();
  for (const p of withText.filter((x) => !x.optional)) sections.set(p.section ?? "Pages", [...(sections.get(p.section ?? "Pages") ?? []), p]);
  for (const p of [...[...sections.values()].flat(), ...withText.filter((x) => x.optional)]) {
    out.push("", "---", "", `# ${oneLine(p.title)}`, "", `URL: ${pageUrl(site, p.path)}`);
    if (p.lastmod) out.push(`Updated: ${formatLastmod(p.lastmod)}`);
    out.push("", pageBody(p.content ?? "", p.title));
  }
  return `${out.join("\n")}\n`;
}

/** robots.txt, sitemap.xml, llms.txt and (when pages carry `content`) llms-full.txt, keyed by file name. */
export function buildCrawlFiles(o: BuildCrawlFilesOptions): CrawlFiles {
  const files: CrawlFiles = {
    "robots.txt": robotsTxt(o),
    "sitemap.xml": sitemapXml(o),
    "llms.txt": llmsTxt(o),
  };
  if (o.pages.some((p) => !p.noindex && p.content?.trim())) files["llms-full.txt"] = llmsFullTxt(o);
  return files;
}
