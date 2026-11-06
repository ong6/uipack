import * as react from 'react';
import { ReactNode } from 'react';

interface DocsNavItem {
    title: string;
    href: string;
    /** Sub-pages listed under this one (a page with several views). One level deep. */
    items?: DocsNavItem[];
}
interface DocsSection {
    title: string;
    items: DocsNavItem[];
}
interface DocsTocItem {
    id: string;
    title: string;
    level: 2 | 3;
}
interface DocsLayoutProps {
    productTitle: string;
    productHref: string;
    docsTitle?: string;
    sections: DocsSection[];
    activeHref: string;
    onThisPage?: DocsTocItem[];
    previous?: DocsNavItem | null;
    next?: DocsNavItem | null;
    theme?: "light" | "dark";
    /**
     * The colour tokens. "warm" (the default) is the paper-and-blue look hosts already use;
     * "technical" takes UI Pack's Technical palette (forest/mint accent, green-black dark).
     */
    palette?: "warm" | "technical";
    /**
     * "prose" (the default) keeps the article at the 680px measure. "wide" lets the article column
     * grow to the space between the sidebar and the table of contents: prose still stops at 680px,
     * while a `DocsMarkdown` block flagged `wide` (a deck, a web page, a 3D scene) and any child
     * wrapped in `.uipack-docs__block[data-width="wide"]` take the full column.
     */
    width?: "prose" | "wide";
    /** The host's own banner (its logo and theme toggle) in place of the product / docs identity row. */
    header?: ReactNode;
    /** The below-900px navigation disclosure. Turn it off when the host's header has its own menu. Default true. */
    mobileNavigation?: boolean;
    /** The sidebar's accessible name. Default "Documentation". */
    navigationLabel?: string;
    /** The page's Markdown source as plain text ("View as Markdown"), shown above the page. */
    markdownHref?: string;
    /** Where to edit the page's source ("Edit on GitHub"), shown above the page. */
    editHref?: string;
    /** A short line before those links (the page's group, say). */
    eyebrow?: ReactNode;
    /** The article's element: "section" (default) inside a host page that has its own main, or "main". */
    landmark?: "section" | "main";
    /** The article's id, the skip link's target. Default "docs-content". */
    contentId?: string;
    /** The article's accessible name. Default "Documentation content". */
    contentLabel?: string;
    /** Classes added to the article, for a host that styles its page there. */
    contentClassName?: string;
    children: ReactNode;
}
declare function DocsLayout({ productTitle, productHref, docsTitle, sections, activeHref, onThisPage, previous, next, theme, palette, width, header, mobileNavigation, navigationLabel, markdownHref, editHref, eyebrow, landmark, contentId, contentLabel, contentClassName, children, }: DocsLayoutProps): react.JSX.Element;

interface ExtractedDocsHeading {
    id: string;
    level: number;
    line: number;
    title: string;
}
interface DocsMarkdownProps {
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
interface DocsMarkdownBlock {
    /** The fence's language, the key it was registered under ("uipack-demo"). */
    lang: string;
    /** The first word after the language ("layer-swap"); empty when there is none. */
    id: string;
    /** The words after the id ("wide"). */
    flags: string[];
    /** The fence's body: for a demo, what it shows, so the raw file still says so. */
    value: string;
}
interface ExtractDocsHeadingsOptions {
    /** The same offset passed to `DocsMarkdown`, so `level` is the rendered level. Default 0. */
    headingOffset?: number;
}
declare function slugifyDocsHeading(value: string): string;
declare function extractDocsHeadings(source: string, { headingOffset }?: ExtractDocsHeadingsOptions): ExtractedDocsHeading[];
declare function DocsMarkdown({ source, headingOffset, blocks, resolveUrl }: DocsMarkdownProps): react.JSX.Element;

export { DocsLayout, type DocsLayoutProps, DocsMarkdown, type DocsMarkdownBlock, type DocsMarkdownProps, type DocsNavItem, type DocsSection, type DocsTocItem, type ExtractDocsHeadingsOptions, type ExtractedDocsHeading, extractDocsHeadings, slugifyDocsHeading };
