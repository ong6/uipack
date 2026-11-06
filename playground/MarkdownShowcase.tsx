import { useEffect, useMemo, useState } from "react";
import { DocsMarkdown, extractDocsHeadings, type DocsMarkdownBlock } from "../src/docs";
import "../src/docs/docs.css";
import { resolvePage, type PageDef } from "./catalog";
import { DemoBlock, demos, withDemos } from "./demos";
import { resolveDocsUrl } from "./docs-links";
import { routePath, routes } from "./routes";
import { useShowcaseTheme, useShowcaseToc } from "./ShowcaseShell";

// Every Markdown file a page can render, each its own small chunk, loaded when its page opens.
const sources = import.meta.glob<string>(["../docs/**/*.md", "../README.md"], { query: "?raw", import: "default" });

/**
 * A file's YAML frontmatter (a spec's `extends`, `uses`…) shown as a yaml block under its title, so
 * readers see what an agent reads; GitHub renders it as a table, DocsMarkdown would not.
 */
function showFrontmatter(text: string) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return text;
  const rest = text.slice(m[0].length);
  const title = /^(# .*\n)/.exec(rest.trimStart());
  const body = rest.trimStart();
  const block = "```yaml\n" + m[1] + "\n```\n";
  return title ? `${title[1]}\n${block}${body.slice(title[1].length)}` : block + body;
}

/**
 * A sub-view's h1 names the view too ("Deck player · Bento") when the file's `#` is the page's
 * title, so the deck examples that share docs/deck.md still say which one is open.
 */
export function withSubViewTitle(text: string, page: Pick<PageDef, "title" | "label" | "query"> | undefined) {
  if (!page?.query || !page.title) return text;
  return text.replace(/^# (.+)$/m, (line, h1: string) => (h1.trim() === page.title ? `# ${h1.trim()} · ${page.label}` : line));
}

/** The page for this address: the manifest entry whose route it is. */
function currentPage(): PageDef | undefined {
  const id = routes.get(routePath(location.pathname));
  return id ? resolvePage(id, location.search) : undefined;
}

/**
 * A docs page: the page's Markdown file (docs-manifest.ts `file`) rendered by DocsMarkdown, with its
 * `uipack-demo` blocks as live demos and its links pointed at the site's pages. The file's `#` is
 * the page's one h1; its h2 and h3 headings fill the shell's "On this page".
 */
export default function MarkdownShowcase() {
  const { theme } = useShowcaseTheme();
  const page = currentPage();
  const file = page?.file;
  const [source, setSource] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const load = file ? sources[`../${file}`] : undefined;

  useEffect(() => {
    if (!load) return;
    let live = true;
    load().then(
      (text) => live && setSource(withDemos(withSubViewTitle(showFrontmatter(text), page), page?.demos)),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [load, page?.demos]);

  const toc = useMemo(
    () =>
      source
        ? extractDocsHeadings(source)
            .filter((h) => h.level === 2 || h.level === 3)
            .map(({ id, level, title }) => ({ id, level: level as 2 | 3, title }))
        : [],
    [source],
  );
  useShowcaseToc(toc);

  const blocks = useMemo(
    () => ({
      "uipack-demo": ({ id }: DocsMarkdownBlock) => (demos[id] ? <DemoBlock id={id} /> : undefined),
    }),
    [],
  );

  if (failed || !load) return <p role="status">This page&rsquo;s Markdown file ({file}) could not be loaded.</p>;
  if (source === null)
    return (
      <p className="showcase-loading" role="status">
        Loading {page?.label}…
      </p>
    );
  return (
    <DocsMarkdown
      source={source}
      blocks={blocks}
      resolveUrl={(url, kind) => (file ? resolveDocsUrl(file, url, kind, theme) : url)}
    />
  );
}
