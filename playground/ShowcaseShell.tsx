import {
  documentTitle,
  librarySections,
  pageDefs,
  pageHeading,
  pageHref,
  resolvePage,
  sectionOfPage,
  unknownSubView,
  type LibraryPage,
  type PageDef,
} from "./catalog";
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Wordmark } from "../src";
import {
  DocsLayout,
  unpackDocsSearchIndex,
  type DocsNavItem,
  type DocsSearchIndexFile,
  type DocsSearchOptions,
  type DocsSection,
  type DocsTocItem,
} from "../src/docs";
import { DocsSearchButton, DocsSearchDialog, useDocsSearchShortcut } from "../src/docs/DocsSearch";
import "../src/docs/docs.css";
import { editUrl } from "./docs-manifest";
import { galleryCategoryForPage, galleryHref } from "./gallery-index";
import { SEARCH_INDEX_PATH } from "./search-index-path";
import { markerSetting, NAV_MEMORY_KEY, SectionIcon, sectionHue, sectionHueStyle } from "./site-settings";
import { LANDING_TITLE } from "./landing-index";

type ShowcaseTheme = {
  theme: "light" | "dark";
  flip: () => void;
  /** A page's own "not found, showing X" line for a bad query (a story, a variant); the shell shows it under the intro. */
  note: string | null;
  setNote: (note: string | null) => void;
  /** A Markdown page's h2 and h3 headings, for the shell's "On this page". */
  toc: DocsTocItem[];
  setToc: (toc: DocsTocItem[]) => void;
};
const ShowcaseThemeContext = createContext<ShowcaseTheme | null>(null);

/** The tab title is page state outside React; written from an effect, through here. */
function setDocumentTitle(title: string) {
  document.title = title;
}

/** The page's theme, held once by main.tsx above the shell and the page: `?theme=` and `data-theme` follow it. */
export function ShowcaseThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.uiTheme = next;
    const url = new URL(location.href);
    url.searchParams.set("theme", next);
    history.replaceState(null, "", url);
    setTheme(next);
  };
  const [note, setNote] = useState<string | null>(null);
  const [toc, setToc] = useState<DocsTocItem[]>([]);
  return (
    <ShowcaseThemeContext.Provider value={{ theme, flip, note, setNote, toc, setToc }}>{children}</ShowcaseThemeContext.Provider>
  );
}

/** The current theme and the toggle, for the shell and for pages that theme their content. */
export function useShowcaseTheme(): ShowcaseTheme {
  const value = useContext(ShowcaseThemeContext);
  if (!value) throw new Error("useShowcaseTheme needs a ShowcaseThemeProvider (main.tsx renders it)");
  return value;
}

/** A page names what a bad query fell back to; the shell shows it under the intro until it changes or the page goes. */
export function useShowcaseNote(note: string | null) {
  const { setNote } = useShowcaseTheme();
  useEffect(() => {
    setNote(note);
    return () => setNote(null);
  }, [note, setNote]);
}

/** A Markdown page hands its headings to the shell's "On this page" while it is shown. */
export function useShowcaseToc(toc: DocsTocItem[]) {
  const { setToc } = useShowcaseTheme();
  useEffect(() => {
    setToc(toc);
    return () => setToc([]);
  }, [toc, setToc]);
}

/** The page shown for an address that names no page; it lists every page instead. */
const notFoundPage: PageDef = {
  id: "not-found",
  group: "start",
  label: "Page not found",
  path: "",
  file: "docs/README.md",
  intro: "There is no page at this address; it may have moved. Every page in the library is listed below.",
};

/** Whether a media query matches, following changes. */
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (change) => {
      const list = matchMedia(query);
      list.addEventListener("change", change);
      return () => list.removeEventListener("change", change);
    },
    () => matchMedia(query).matches,
  );
}

/**
 * The sidebar: the manifest's five sections, each with its icon and hue; inside one, each group's
 * pages under the group's caption; a page's sub-pages and sub-views (the decks) under its name.
 */
function sidebarSections(theme: string): DocsSection[] {
  return librarySections.map((section) => {
    const items: DocsNavItem[] = [];
    for (const g of section.groups) {
      const byId = new Map<string, DocsNavItem>();
      const start = items.length;
      for (const p of pageDefs.filter((p) => p.group === g.id)) {
        const last = items.length > start ? items[items.length - 1] : undefined;
        const href = pageHref(p, theme);
        const parent = p.parent ? byId.get(p.parent) : undefined;
        if (parent) (parent.items ??= []).push({ title: p.label, href });
        else if (p.query && last?.items && last.title === (p.title ?? p.label)) last.items.push({ title: p.label, href });
        else if (p.query)
          items.push({
            title: p.title ?? p.label,
            href: `${p.path}?theme=${theme}`,
            group: g.caption,
            items: [{ title: p.label, href }],
          });
        else {
          const item: DocsNavItem = { title: p.label, href, group: g.caption };
          byId.set(p.id, item);
          items.push(item);
        }
      }
    }
    return { id: section.id, title: section.label, items, icon: <SectionIcon id={section.id} />, hue: sectionHue(section.id) };
  });
}

/** Search over the site's index (playground/search-index.ts), fetched once on first open; results keep the theme. */
function useSiteSearch(theme: string): DocsSearchOptions {
  return useMemo(
    () => ({
      load: () =>
        fetch(SEARCH_INDEX_PATH)
          .then((r) => {
            if (!r.ok) throw new Error(`${SEARCH_INDEX_PATH}: ${r.status}`);
            return r.json() as Promise<DocsSearchIndexFile>;
          })
          .then(unpackDocsSearchIndex),
      resolveHref: (href: string) => {
        const url = new URL(href, location.origin);
        url.searchParams.set("theme", theme);
        return `${url.pathname}${url.search}${url.hash}`;
      },
    }),
    [theme],
  );
}

/**
 * The one shell for every page, rendered once by main.tsx around the page (which loads after it):
 * DocsLayout with the Technical palette and the site's own values (site-palette.css), the header
 * (below 900px a menu button that opens the sidebar as a drawer, the brand, the Docs and Assets
 * tabs, the theme toggle) as its banner, the sidebar generated from the docs manifest (five
 * collapsible sections, search at the top, the travelling marker), the page in <main>, and "On this
 * page" for a Markdown page. Above the page: its section's chip, the style its content uses, "View
 * as Markdown" (the page's file, served raw) and "Edit on GitHub". A page still rendered by its showcase module gets the h1 and intro from the manifest;
 * a Markdown page's own `#` is its h1. `active="not-found"` is the page for an unknown address.
 */
export function ShowcaseShell({
  active,
  children,
}: {
  active: LibraryPage | "not-found" | "gallery" | "landing";
  children: ReactNode;
}) {
  const { theme, flip, note, toc } = useShowcaseTheme();
  // The Assets tab (/gallery) and the landing page (/) are modes of this shell: the same header, no docs sidebar.
  const gallery = active === "gallery";
  const landing = active === "landing";
  // The Docs tab opens the manifest's first page.
  const docsHref = pageHref(pageDefs[0], theme);
  // A page with sub-views (a deck, say) resolves to the entry its query names.
  const notFound = active === "not-found" || gallery || landing;
  const page = notFound ? notFoundPage : resolvePage(active, location.search);
  const markdown = !notFound;
  // The visual style the page's content uses, named in the context line.
  const styleName = page.styleName ?? "Technical";
  const missing = notFound ? null : unknownSubView(page, location.search);
  const [menuOpen, setMenuOpen] = useState(false);
  const search = useSiteSearch(theme);
  // The landing page's own search dialog (a docs page's is DocsLayout's): open from its header or ⌘K.
  const [searching, setSearching] = useState(false);
  useDocsSearchShortcut(landing, setSearching);
  // The marker's shape for this load: the site's, or ?marker= (kept for the visit).
  const [marker] = useState(() => markerSetting());
  // Every page names itself in the tab, /web too: the sample page it hosts publishes the rest of its
  // head (description, canonical, Open Graph, JSON-LD), but the tab says which playground page it is.
  const hostsPage = "hostsPage" in page && page.hostsPage;
  useEffect(
    () => setDocumentTitle(gallery ? "Assets · uipack" : landing ? LANDING_TITLE : documentTitle(page)),
    [page, gallery, landing],
  );
  // Compact navigation (the header's menu button opens the sidebar as a drawer) below 900px. A page
  // hosting a whole sample site (/web) keeps it below 1440px too, so the sample gets a desktop width
  // (its own layout switches at a 1024px container) on a laptop.
  const compact = useMediaQuery(hostsPage ? "(max-width: 1439px)" : "(max-width: 899px)");
  const section = notFound ? undefined : sectionOfPage(page);
  // Previous and next follow the manifest's reading order, sub-views included.
  const index = pageDefs.findIndex((p) => p.id === page.id);
  const neighbour = (p: PageDef | undefined) => (p && !notFound ? { title: pageHeading(p), href: pageHref(p, theme) } : null);

  const header = (
    <header className="showcase-header">
      <div className="showcase-header__bar">
        {!gallery && !landing && (
          <button
            className="showcase-menu-button"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-label="Open navigation"
            onClick={() => setMenuOpen(true)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </button>
        )}
        <a className="showcase-brand" href={`/?theme=${theme}`} aria-label="UIPACK home">
          <Wordmark size={22} />
        </a>
        {/* The two top-level views: the docs (text first, with samples in the pages) and the Assets gallery. */}
        <nav className="showcase-tabs" aria-label="Views">
          <a href={docsHref} aria-current={gallery || landing ? undefined : "true"}>
            Docs
          </a>
          <a href={galleryHref(theme)} aria-current={gallery ? "true" : undefined}>
            Assets
          </a>
        </nav>
        <div className="showcase-header__actions">
          {/* Off the docs pages (no sidebar), search sits in the header; ⌘K opens it on every page. */}
          {landing && <DocsSearchButton placeholder="Search docs" onOpen={() => setSearching(true)} />}
          <button className="theme" type="button" aria-label={`${theme === "dark" ? "light" : "dark"} mode`} onClick={flip}>
            <svg className="theme__icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
              {theme === "dark" ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
                </>
              ) : (
                <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
              )}
            </svg>
            <span className="theme__text" aria-hidden="true">
              {theme === "dark" ? "light" : "dark"} mode
            </span>
          </button>
        </div>
      </div>
    </header>
  );

  const notes = (
    <>
      {missing && (
        <p className="showcase-title__note" role="status">
          {missing.key[0].toUpperCase() + missing.key.slice(1)} “{missing.value}” not found, showing {missing.shown.label}.
        </p>
      )}
      {note && (
        <p className="showcase-title__note" role="status">
          {note}
        </p>
      )}
    </>
  );

  // The landing page brings its own <main> and footer (LandingShowcase.tsx), full-bleed, and keeps
  // the docs' search: the header's box and ⌘K open the same dialog over the same index.
  if (landing)
    return (
      <div className="showcase-frame" data-theme={theme} data-style="technical" data-ui-style="technical" data-mode="landing">
        <a className="showcase-skip" href="#showcase-main">
          Skip to content
        </a>
        {header}
        {children}
        <DocsSearchDialog
          open={searching}
          onClose={() => setSearching(false)}
          options={search}
          sections={sidebarSections(theme)}
        />
      </div>
    );

  if (gallery)
    return (
      <div className="showcase-frame" data-theme={theme} data-style="technical" data-ui-style="technical" data-mode="gallery">
        <a className="showcase-skip" href="#showcase-main">
          Skip to content
        </a>
        {header}
        <main id="showcase-main" className="showcase-gallery-main" tabIndex={-1} aria-label="Assets">
          {children}
        </main>
      </div>
    );

  return (
    <div
      className="showcase-frame"
      data-theme={theme}
      data-style="technical"
      data-ui-style="technical"
      data-nav={compact ? "compact" : undefined}
      // Whether the page has "On this page": known from the manifest before its Markdown loads, so
      // the column does not shift sideways when the headings arrive.
      data-rail={markdown && !hostsPage && !page.fullWidth ? undefined : "none"}
      // A page hosting a whole sample site (/web) keeps the sample's own sticky nav, and a page whose
      // demo takes the window (the deck) keeps it whole: on both the banner scrolls away.
      data-banner={hostsPage || page.fullWindow ? "static" : undefined}
    >
      <DocsLayout
        productTitle="UIPACK"
        productHref={`/?theme=${theme}`}
        header={header}
        sections={sidebarSections(theme)}
        collapsible
        marker={marker}
        markerMemory={NAV_MEMORY_KEY}
        search={search}
        activeHref={notFound ? "" : pageHref(page, theme)}
        onThisPage={markdown && !hostsPage && !page.fullWidth ? toc : []}
        previous={neighbour(pageDefs[index - 1])}
        next={neighbour(pageDefs[index + 1])}
        theme={theme}
        palette="technical"
        width="wide"
        mobileNavigation="drawer"
        navigationOpen={menuOpen && compact}
        onNavigationOpenChange={setMenuOpen}
        docsTitle="Docs"
        navigationLabel="Library"
        markdownHref={notFound ? undefined : `/${page.file}`}
        editHref={notFound ? undefined : editUrl(page.file)}
        eyebrow={
          section && (
            <p className="showcase-context">
              {/* The section chip: the one place on the page its hue shows. */}
              <a
                className="showcase-crumb"
                href={pageHref(
                  pageDefs.find((p) => p.id === section.groups[0].defaultPage)!,
                  theme,
                )}
                style={sectionHueStyle(section.id)}
              >
                <span className="showcase-crumb__chip">
                  <SectionIcon id={section.id} size={14} />
                  {section.label}
                </span>
              </a>
              <span aria-hidden="true">·</span>
              {/* On /styles itself the line still names the style, marked as the current page. */}
              <a href={`/styles?theme=${theme}`} aria-current={active === "styles" ? "page" : undefined}>
                {styleName} style
              </a>
              {galleryCategoryForPage(page.id) && (
                <>
                  <span aria-hidden="true">·</span>
                  <a href={galleryHref(theme, galleryCategoryForPage(page.id))}>See it in Assets</a>
                </>
              )}
            </p>
          )
        }
        landmark="main"
        contentId="showcase-main"
        // A page hosting a whole sample page (/web) keeps the sample's hero as its one h1; main is
        // named by the page either way, so landmark navigation says "Web UI, main".
        contentLabel={pageHeading(page)}
        // A showcase page brings its own styles: a docs block, outside the docs prose and link rules.
        contentClassName={markdown ? "showcase-shell showcase-shell--docs" : "showcase-shell uipack-docs__block"}
      >
        {markdown ? (
          notes
        ) : (
          <div className="showcase-title">
            {hostsPage ? (
              <p className="showcase-title__name" id="showcase-page-name">
                {pageHeading(page)}
              </p>
            ) : (
              <h1>
                {page.query && page.title ? (
                  <>
                    {page.title}
                    <span className="showcase-title__view"> · {page.label}</span>
                  </>
                ) : (
                  pageHeading(page)
                )}
              </h1>
            )}
            <p>{page.intro}</p>
            {notes}
          </div>
        )}
        {children}
      </DocsLayout>
    </div>
  );
}
