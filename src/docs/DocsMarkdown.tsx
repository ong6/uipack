import { Children, createElement, isValidElement, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export interface ExtractedDocsHeading {
  id: string;
  level: number;
  line: number;
  title: string;
}

export interface DocsMarkdownProps {
  source: string;
  /**
   * Levels to add to every Markdown heading, so `#` renders as `h2` with 1. Use it when the host
   * page already has its own `h1`. Clamped to `h6`; anchor ids do not change. Default 0.
   */
  headingOffset?: number;
}

export interface ExtractDocsHeadingsOptions {
  /** The same offset passed to `DocsMarkdown`, so `level` is the rendered level. Default 0. */
  headingOffset?: number;
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The rendered level of a Markdown heading after `offset`, between 1 and 6. */
function shiftLevel(level: number, offset = 0): HeadingLevel {
  const shift = Number.isFinite(offset) ? Math.trunc(offset) : 0;
  return Math.min(6, Math.max(1, level + shift)) as HeadingLevel;
}

function textFromChildren(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      if (isValidElement<{ children?: ReactNode }>(child)) {
        return textFromChildren(child.props.children);
      }
      return "";
    })
    .join("");
}

function plainHeadingText(markdown: string) {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function slugifyDocsHeading(value: string) {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en-US")
    .replace(/[’']/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function extractDocsHeadings(
  source: string,
  { headingOffset = 0 }: ExtractDocsHeadingsOptions = {},
): ExtractedDocsHeading[] {
  const headings: ExtractedDocsHeading[] = [];
  const occurrences = new Map<string, number>();
  let fence: string | null = null;

  source.split("\n").forEach((line, index) => {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fence === fenceMatch[1][0]) fence = null;
      return;
    }
    if (fence) return;

    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) return;

    const title = plainHeadingText(match[2]);
    const baseId = slugifyDocsHeading(title) || `heading-${index + 1}`;
    const count = occurrences.get(baseId) || 0;
    occurrences.set(baseId, count + 1);
    headings.push({
      id: count === 0 ? baseId : `${baseId}-${count}`,
      level: shiftLevel(match[1].length, headingOffset),
      line: index + 1,
      title,
    });
  });

  return headings;
}

interface TableNode {
  type?: string;
  tagName?: string;
  children?: TableNode[];
}

/** Cells in the first row, so a wide table scrolls instead of squeezing. */
function tableColumns(node: TableNode | undefined): number {
  const row = (node?.children ?? [])
    .flatMap((part) => (part.tagName === "tr" ? [part] : (part.children ?? [])))
    .find((part) => part.tagName === "tr");
  const cells = (row?.children ?? []).filter((cell) => cell.tagName === "th" || cell.tagName === "td").length;
  return Math.max(1, cells || 2);
}

type HeadingComponent = NonNullable<Components["h1"]>;

function headingComponent(level: HeadingLevel, headingIds: Map<number, string>): HeadingComponent {
  return function DocsHeading({ node, children, ...props }) {
    const title = textFromChildren(children);
    const id = headingIds.get(node?.position?.start.line || 0) || slugifyDocsHeading(title);

    return createElement(
      `h${level}`,
      { ...props, id, "aria-label": title },
      children,
      " ",
      <a className="uipack-docs__heading-anchor" href={`#${id}`} aria-label={`Link to ${title}`}>
        <span aria-hidden="true">#</span>
      </a>,
    );
  };
}

export function DocsMarkdown({ source, headingOffset = 0 }: DocsMarkdownProps) {
  const headingIds = new Map(extractDocsHeadings(source).map((heading) => [heading.line, heading.id]));
  const heading = (level: HeadingLevel) => headingComponent(shiftLevel(level, headingOffset), headingIds);
  const components: Components = {
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    h4: heading(4),
    h5: heading(5),
    h6: heading(6),
    table: ({ node, ...props }) => (
      <div className="uipack-docs__table" tabIndex={0} style={{ "--docs-table-columns": tableColumns(node) } as CSSProperties}>
        <table {...props} />
      </div>
    ),
  };

  return (
    <div className="uipack-docs__prose">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]} skipHtml>
        {source}
      </ReactMarkdown>
    </div>
  );
}
