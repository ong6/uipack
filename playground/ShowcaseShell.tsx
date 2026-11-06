import {
  documentTitle,
  libraryGroups,
  pageDefs,
  pageHeading,
  pageHref,
  resolvePage,
  unknownSubView,
  type LibraryPage,
  type PageDef,
} from "./catalog";
import { createContext, Fragment, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Wordmark } from "../src";
import { DocsLayout, type DocsNavItem, type DocsSection, type DocsTocItem } from "../src/docs";
import "../src/docs/docs.css";
import { editUrl } from "./docs-manifest";

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

/** The sidebar: one section per manifest group; a page's sub-views (the decks) sit under the page's name. */
function sidebarSections(theme: string): DocsSection[] {
  return libraryGroups.map((g) => {
    const items: DocsNavItem[] = [];
    const byId = new Map<string, DocsNavItem>();
    for (const p of pageDefs.filter((p) => p.group === g.id)) {
      const last = items[items.length - 1];
      const href = pageHref(p, theme);
      const parent = p.parent ? byId.get(p.parent) : undefined;
      if (parent) (parent.items ??= []).push({ title: p.label, href });
      else if (p.query && last?.items && last.title === (p.title ?? p.label)) last.items.push({ title: p.label, href });
      else if (p.query)
        items.push({ title: p.title ?? p.label, href: `${p.path}?theme=${theme}`, items: [{ title: p.label, href }] });
      else {
        const item: DocsNavItem = { title: p.label, href };
        byId.set(p.id, item);
        items.push(item);
      }
    }
    return { title: g.label, items };
  });
}

/**
 * The one shell for every page, rendered once by main.tsx around the page (which loads after it):
 * DocsLayout with the Technical palette, the header (brand, theme toggle, and below 900px a button
 * that opens a sheet listing every page) as its banner, the sidebar generated from the docs
 * manifest, the page in <main>, and "On this page" for a Markdown page. Above the page: its group,
 * the style its content uses, "View as Markdown" (the page's file, served raw) and "Edit on
 * GitHub". A page still rendered by its showcase module gets the h1 and intro from the manifest;
 * a Markdown page's own `#` is its h1. `active="not-found"` is the page for an unknown address.
 */
export function ShowcaseShell({ active, children }: { active: LibraryPage | "not-found"; children: ReactNode }) {
  const { theme, flip, note, toc } = useShowcaseTheme();
  // A page with sub-views (a deck, say) resolves to the entry its query names.
  const notFound = active === "not-found";
  const page = notFound ? notFoundPage : resolvePage(active, location.search);
  const markdown = !notFound;
  // The visual style the page's content uses, named in the context line.
  const styleName = page.styleName ?? "Technical";
  const group = notFound ? undefined : libraryGroups.find((g) => g.id === page.group)!;
  const missing = notFound ? null : unknownSubView(page, location.search);
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Every page names itself in the tab, /web too: the sample page it hosts publishes the rest of its
  // head (description, canonical, Open Graph, JSON-LD), but the tab says which playground page it is.
  const hostsPage = "hostsPage" in page && page.hostsPage;
  useEffect(() => setDocumentTitle(documentTitle(page)), [page]);
  // Compact navigation (the header's menu instead of the sidebar) below 900px. A page hosting a
  // whole sample site (/web) keeps it below 1440px too, so the sample gets a desktop width
  // (its own layout switches at a 1024px container) on a laptop.
  const compact = useMediaQuery(hostsPage ? "(max-width: 1439px)" : "(max-width: 899px)");
  // The open menu covers the page on a phone: the page behind it holds still until it closes.
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const was = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = was;
    };
  }, [menuOpen]);
  // Previous and next follow the manifest's reading order, sub-views included.
  const index = pageDefs.findIndex((p) => p.id === page.id);
  const neighbour = (p: PageDef | undefined) => (p && !notFound ? { title: pageHeading(p), href: pageHref(p, theme) } : null);

  const header = (
    <>
      <header className="showcase-header">
        <div className="showcase-header__bar">
          <a className="showcase-brand" href={`/?theme=${theme}`} aria-label="UIPACK home">
            <Wordmark size={22} />
          </a>
          <div className="showcase-header__actions">
            <button
              ref={menuButtonRef}
              className="showcase-menu-button"
              type="button"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              // Starts with the visible words in order (label in name); the colon is read as a pause.
              aria-label={group ? `${group.label}: ${page.label}` : page.label}
              onClick={() => {
                setMenuOpen(true);
                menuRef.current?.showModal();
              }}
            >
              {/* The page name is the button's text and never truncates; the group sits small above it. */}
              <span className="showcase-menu-button__where">
                {group && <span className="showcase-menu-button__group">{group.label}</span>}{" "}
                <span className="showcase-menu-button__page">{page.label}</span>
              </span>
              <span aria-hidden="true">▾</span>
            </button>
            <button className="theme" type="button" aria-label={`${theme === "dark" ? "light" : "dark"} mode`} onClick={flip}>
              <span className="theme__text" aria-hidden="true">
                {theme === "dark" ? "light" : "dark"} mode
              </span>
              <span className="theme__icon" aria-hidden="true">
                {theme === "dark" ? "☀" : "☾"}
              </span>
            </button>
          </div>
        </div>
      </header>
      <dialog
        className="showcase-menu"
        ref={menuRef}
        aria-label="Library menu"
        // Not a Tab stop itself: Tab cycles the menu's links and Close (onKeyDown), never the dialog box.
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href], button") ?? []);
          const first = items[0];
          const last = items[items.length - 1];
          if (!first || !last) return;
          const at = document.activeElement;
          if (e.shiftKey ? at === first || at === menuRef.current : at === last) {
            e.preventDefault();
            (e.shiftKey ? last : first).focus();
          }
        }}
        onClose={() => {
          setMenuOpen(false);
          menuButtonRef.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === menuRef.current) menuRef.current?.close();
        }}
      >
        <div className="showcase-menu__bar">
          <span>Library</span>
          <button type="button" onClick={() => menuRef.current?.close()}>
            Close
          </button>
        </div>
        {/* The same list as the sidebar, which is hidden below 900px. */}
        <nav aria-label="All library pages">
          {libraryGroups.map((g) => (
            <div key={g.id} role="group" aria-labelledby={`menu-${g.id}`} className="showcase-menu__group">
              <p id={`menu-${g.id}`}>{g.label}</p>
              {pageDefs
                .filter((p) => p.group === g.id)
                .map((p, i, all) => (
                  <Fragment key={p.id}>
                    {/* Sub-views of one page sit indented under a label naming it. */}
                    {p.query && all[i - 1]?.path !== p.path && <span className="showcase-menu__sub">{p.title ?? p.label}</span>}
                    <a
                      href={pageHref(p, theme)}
                      className={p.query || p.parent ? "is-sub" : undefined}
                      aria-current={page.id === p.id ? "page" : undefined}
                    >
                      {p.label}
                    </a>
                  </Fragment>
                ))}
            </div>
          ))}
        </nav>
      </dialog>
    </>
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

  return (
    <div
      className="showcase-frame"
      data-theme={theme}
      data-style="technical"
      data-ui-style="technical"
      data-nav={compact ? "compact" : undefined}
    >
      <DocsLayout
        productTitle="UIPACK"
        productHref={`/?theme=${theme}`}
        header={header}
        sections={sidebarSections(theme)}
        activeHref={notFound ? "" : pageHref(page, theme)}
        onThisPage={markdown ? toc : []}
        previous={neighbour(pageDefs[index - 1])}
        next={neighbour(pageDefs[index + 1])}
        theme={theme}
        palette="technical"
        width="wide"
        mobileNavigation={false}
        navigationLabel="Library"
        markdownHref={notFound ? undefined : `/${page.file}`}
        editHref={notFound ? undefined : editUrl(page.file)}
        eyebrow={
          group && (
            <p className="showcase-context">
              <span>{group.label}</span>
              <span aria-hidden="true">·</span>
              {/* On /styles itself the line still names the style, marked as the current page. */}
              <a href={`/styles?theme=${theme}`} aria-current={active === "styles" ? "page" : undefined}>
                {styleName} style
              </a>
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
