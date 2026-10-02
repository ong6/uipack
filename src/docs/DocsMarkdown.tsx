import {
  Children,
  createElement,
  isValidElement,
  type ReactNode,
} from "react";
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

export function extractDocsHeadings(source: string): ExtractedDocsHeading[] {
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
      level: match[1].length,
      line: index + 1,
      title,
    });
  });

  return headings;
}

type HeadingComponent = NonNullable<Components["h1"]>;

function headingComponent(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  headingIds: Map<number, string>,
): HeadingComponent {
  return function DocsHeading({ node, children, ...props }) {
    const title = textFromChildren(children);
    const id =
      headingIds.get(node?.position?.start.line || 0) ||
      slugifyDocsHeading(title);

    return createElement(
      `h${level}`,
      { ...props, id, "aria-label": title },
      children,
      " ",
      <a
        className="uipack-docs__heading-anchor"
        href={`#${id}`}
        aria-label={`Link to ${title}`}
      >
        <span aria-hidden="true">#</span>
      </a>,
    );
  };
}

export function DocsMarkdown({ source }: DocsMarkdownProps) {
  const headingIds = new Map(
    extractDocsHeadings(source).map((heading) => [heading.line, heading.id]),
  );
  const components: Components = {
    h1: headingComponent(1, headingIds),
    h2: headingComponent(2, headingIds),
    h3: headingComponent(3, headingIds),
    h4: headingComponent(4, headingIds),
    h5: headingComponent(5, headingIds),
    h6: headingComponent(6, headingIds),
    table: ({ node: _node, ...props }) => (
      <div className="uipack-docs__table" tabIndex={0}>
        <table {...props} />
      </div>
    ),
  };

  return (
    <div className="uipack-docs__prose">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
