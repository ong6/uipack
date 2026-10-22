import * as react from 'react';
import { ReactNode } from 'react';

interface DocsNavItem {
    title: string;
    href: string;
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
    children: ReactNode;
}
declare function DocsLayout({ productTitle, productHref, docsTitle, sections, activeHref, onThisPage, previous, next, theme, palette, children, }: DocsLayoutProps): react.JSX.Element;

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
}
interface ExtractDocsHeadingsOptions {
    /** The same offset passed to `DocsMarkdown`, so `level` is the rendered level. Default 0. */
    headingOffset?: number;
}
declare function slugifyDocsHeading(value: string): string;
declare function extractDocsHeadings(source: string, { headingOffset }?: ExtractDocsHeadingsOptions): ExtractedDocsHeading[];
declare function DocsMarkdown({ source, headingOffset }: DocsMarkdownProps): react.JSX.Element;

export { DocsLayout, type DocsLayoutProps, DocsMarkdown, type DocsMarkdownProps, type DocsNavItem, type DocsSection, type DocsTocItem, type ExtractDocsHeadingsOptions, type ExtractedDocsHeading, extractDocsHeadings, slugifyDocsHeading };
