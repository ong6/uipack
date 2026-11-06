import { Children, createElement, isValidElement, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
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
  /**
   * Fenced blocks the host renders itself, keyed by the fence's language. An unindented fence
   * opening with "```uipack-demo layer-swap wide" calls `blocks["uipack-demo"]` with its id
   * (`layer-swap`), its flags (`["wide"]`) and its body, and the node it returns replaces the code
   * block, outside the prose styles. `wide` lets it span the full content width under
   * `DocsLayout width="wide"`. Return `undefined` to keep the code block. Default: none.
   */
  blocks?: Readonly<Record<string, (block: DocsMarkdownBlock) => ReactNode>>;
  /**
   * Rewrites every link `href` and image `src` after the default sanitising, so a host can point
   * a relative `style.md#roles` at its own route for that file. Default: URLs render as written.
   */
  resolveUrl?: (url: string, kind: "link" | "image") => string;
}

/** A fenced block the host renders itself (`DocsMarkdownProps.blocks`). */
export interface DocsMarkdownBlock {
  /** The fence's language, the key it was registered under ("uipack-demo"). */
  lang: string;
  /** The first word after the language ("layer-swap"); empty when there is none. */
  id: string;
  /** The words after the id ("wide"). */
  flags: string[];
  /** The fence's body: for a demo, what it shows, so the raw file still says so. */
  value: string;
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

/** Inline code short enough to keep on one line: one token up to 32 characters, or a phrase up to 24. */
function isShortToken(text: string) {
  return /\s/.test(text) ? text.length <= 24 : text.length <= 32;
}

type HeadingComponent = NonNullable<Components["h1"]>;

/** `lineOffset`: where the rendered run starts in the whole source, so ids match `extractDocsHeadings`. */
function headingComponent(level: HeadingLevel, headingIds: Map<number, string>, lineOffset = 0): HeadingComponent {
  return function DocsHeading({ node, children, ...props }) {
    const title = textFromChildren(children);
    const line = node?.position?.start.line;
    const id = (line && headingIds.get(line + lineOffset)) || slugifyDocsHeading(title);

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

type Segment =
  { kind: "prose"; source: string; lineOffset: number } | { kind: "block"; block: DocsMarkdownBlock; node: ReactNode };

const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const DEFINITION = /^ {0,3}\[[^\]]+\]:\s*\S/;

/**
 * The source cut at each top-level fence the host renders (`blocks`), so the host's node sits
 * between prose runs instead of inside one and takes none of the prose styles. A fence the host
 * declines (`undefined`) stays a code block in its run; an indented fence (inside a list item or
 * a quote) is never cut. Link reference definitions are repeated in every run, so a reference
 * still resolves across a cut.
 */
function splitSource(source: string, blocks: DocsMarkdownProps["blocks"]): Segment[] {
  if (!blocks || Object.keys(blocks).length === 0) return [{ kind: "prose", source, lineOffset: 0 }];
  const lines = source.split("\n");
  const segments: Segment[] = [];
  const definitions: string[] = [];
  let runStart = 0;
  let open: { char: string; length: number; start: number; info: string; host: boolean } | null = null;

  lines.forEach((line, index) => {
    const fence = FENCE.exec(line);
    if (open) {
      const closes = fence && fence[1][0] === open.char && fence[1].length >= open.length && fence[2].trim() === "";
      if (!closes) return;
      const [lang = "", id = "", ...flags] = open.info.split(/\s+/);
      const render = open.host ? blocks[lang] : undefined;
      if (render) {
        const block: DocsMarkdownBlock = { lang, id, flags, value: lines.slice(open.start + 1, index).join("\n") };
        const node = render(block);
        if (node !== undefined) {
          segments.push({ kind: "prose", source: lines.slice(runStart, open.start).join("\n"), lineOffset: runStart });
          segments.push({ kind: "block", block, node });
          runStart = index + 1;
        }
      }
      open = null;
      return;
    }
    // A backtick fence's info string cannot hold a backtick (CommonMark); that line is inline code.
    if (fence && !(fence[1][0] === "`" && fence[2].includes("`"))) {
      const info = fence[2].trim();
      const lang = info.split(/\s+/)[0];
      open = {
        char: fence[1][0],
        length: fence[1].length,
        start: index,
        info,
        host: line.startsWith(fence[1]) && lang in blocks,
      };
      return;
    }
    if (DEFINITION.test(line)) definitions.push(line);
  });
  if (segments.length === 0) return [{ kind: "prose", source, lineOffset: 0 }];
  segments.push({ kind: "prose", source: lines.slice(runStart).join("\n"), lineOffset: runStart });

  const references = definitions.length ? `\n\n${definitions.join("\n")}\n` : "";
  return segments
    .filter((segment) => segment.kind === "block" || segment.source.trim() !== "")
    .map((segment) => (segment.kind === "prose" ? { ...segment, source: segment.source + references } : segment));
}

export function DocsMarkdown({ source, headingOffset = 0, blocks, resolveUrl }: DocsMarkdownProps) {
  const headingIds = new Map(extractDocsHeadings(source).map((heading) => [heading.line, heading.id]));
  const componentsFor = (lineOffset: number): Components => {
    const heading = (level: HeadingLevel) => headingComponent(shiftLevel(level, headingOffset), headingIds, lineOffset);
    return {
      h1: heading(1),
      h2: heading(2),
      h3: heading(3),
      h4: heading(4),
      h5: heading(5),
      h6: heading(6),
      // A code block scrolls sideways when a line is longer than the column: a Tab stop, so a
      // keyboard can scroll it (WCAG 2.1.1).
      pre: ({ node: _node, ...props }) => <pre {...props} tabIndex={0} />,
      // A short inline code token ("--uipack-token-error", "user sessions") never breaks mid-token
      // at a hyphen or space; a longer one still wraps, so it cannot push the column wide.
      code: ({ node: _node, className, children, ...props }) => {
        const text = textFromChildren(children);
        const token = !className && !text.includes("\n") && isShortToken(text);
        return (
          <code {...props} className={token ? "uipack-docs__token" : className}>
            {children}
          </code>
        );
      },
      table: ({ node, ...props }) => (
        <div className="uipack-docs__table" tabIndex={0} style={{ "--docs-table-columns": tableColumns(node) } as CSSProperties}>
          <table {...props} />
        </div>
      ),
    };
  };
  const urlTransform = resolveUrl
    ? (url: string, key: string) => {
        const safe = defaultUrlTransform(url);
        return safe ? resolveUrl(safe, key === "src" ? "image" : "link") : safe;
      }
    : undefined;
  const prose = (text: string, lineOffset: number, key?: number) => (
    <div className="uipack-docs__prose" key={key}>
      <ReactMarkdown components={componentsFor(lineOffset)} remarkPlugins={[remarkGfm]} urlTransform={urlTransform} skipHtml>
        {text}
      </ReactMarkdown>
    </div>
  );

  const segments = splitSource(source, blocks);
  if (segments.length === 1 && segments[0].kind === "prose") return prose(segments[0].source, 0);
  return (
    <div className="uipack-docs__flow">
      {segments.map((segment, index) =>
        segment.kind === "prose" ? (
          prose(segment.source, segment.lineOffset, index)
        ) : (
          <div
            key={index}
            className="uipack-docs__block"
            data-block={segment.block.lang}
            data-block-id={segment.block.id || undefined}
            data-width={segment.block.flags.includes("wide") ? "wide" : undefined}
          >
            {segment.node}
          </div>
        ),
      )}
    </div>
  );
}
