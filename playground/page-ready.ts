import type { ComponentType } from "react";
import type { DocsTocItem } from "../src/docs";

/** A page module as main.tsx renders it: the page, and what it can have ready before the first render. */
export interface PageModule {
  default: ComponentType;
  /**
   * Makes the page's content ready without waiting, from what the document carries (a docs page's
   * Markdown is in its HTML), and returns its "On this page" headings; undefined when it cannot.
   */
  prepareNow?: () => DocsTocItem[] | undefined;
}

const pages: Record<string, PageModule> = {};

/**
 * Each page module (`<Name>Showcase.tsx`) says it has run. The document loads the current page's
 * module with its own render-blocking script before the entry (vite.config.ts, `withPageScripts`),
 * so main.tsx finds it here and renders the page in the first frame, with no wait and no
 * "Loading…" line; a module that is not here yet is loaded as before.
 */
export const pageReady = (name: string, module: PageModule) => void (pages[name] = module);
export const readyPage = (name: string): PageModule | undefined => pages[name];

/** The id of the JSON block a docs page's HTML carries its Markdown file in, and the attribute that names the file. */
export const PAGE_TEXT_ID = "uipack-page-text";
export const PAGE_TEXT_FILE = "data-file";
