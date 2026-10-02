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
    children: ReactNode;
}
declare function DocsLayout({ productTitle, productHref, docsTitle, sections, activeHref, onThisPage, previous, next, theme, children, }: DocsLayoutProps): react.JSX.Element;

interface ExtractedDocsHeading {
    id: string;
    level: number;
    line: number;
    title: string;
}
interface DocsMarkdownProps {
    source: string;
}
declare function slugifyDocsHeading(value: string): string;
declare function extractDocsHeadings(source: string): ExtractedDocsHeading[];
declare function DocsMarkdown({ source }: DocsMarkdownProps): react.JSX.Element;

export { DocsLayout, type DocsLayoutProps, DocsMarkdown, type DocsMarkdownProps, type DocsNavItem, type DocsSection, type DocsTocItem, type ExtractedDocsHeading, extractDocsHeadings, slugifyDocsHeading };
