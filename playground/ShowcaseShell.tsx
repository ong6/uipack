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
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Wordmark } from "../src";

export function useShowcaseTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    const url = new URL(location.href);
    url.searchParams.set("theme", next);
    history.replaceState(null, "", url);
    setTheme(next);
  };
  return { theme, flip };
}

/** Keep the current item visible in a horizontally scrolling row without moving the page. */
function useCurrentInView(key: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const row = ref.current;
    const current = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !current) return;
    const left = current.offsetLeft - row.offsetLeft;
    const right = left + current.offsetWidth;
    if (right > row.clientWidth) row.scrollLeft = right - row.clientWidth + 16;
  }, [key]);
  return ref;
}

/** The page shown for an address that names no page; it lists every page instead. */
const notFoundPage: PageDef = {
  id: "not-found",
  group: "diagrams",
  label: "Page not found",
  path: "",
  intro: "There is no page at this address; it may have moved. Every page in the library is listed below.",
};

/** The second nav row: a page's sub-views (the decks) sit together under the page's name. */
function pageRuns(pages: readonly PageDef[]) {
  const runs: { title?: string; pages: PageDef[] }[] = [];
  for (const p of pages) {
    const last = runs[runs.length - 1];
    if (p.query && last?.title && last.pages[0].path === p.path) last.pages.push(p);
    else runs.push({ title: p.query ? (p.title ?? p.label) : undefined, pages: [p] });
  }
  return runs;
}

/**
 * The one header for every page. From 720px: brand and theme, a row of groups,
 * a row of the active group's pages. Below 720px: one compact row, with a
 * button showing where you are that opens a sheet listing every page.
 * Then, in <main>, the context line, the page's h1 and its intro. Titles and intros come
 * from `libraryPages` in catalog.ts. `active="not-found"` is the page for an unknown address.
 */
export function ShowcaseShell({
  active,
  theme,
  flip,
  children,
  styleName = "Technical",
  note,
}: {
  active: LibraryPage | "not-found";
  /** The visual style the page's content uses; the shell itself stays Technical. */
  styleName?: string;
  theme: "light" | "dark";
  flip: () => void;
  children: ReactNode;
  /** A page's own "not found, showing X" line for a bad query (a story, a variant), under the intro. */
  note?: ReactNode;
}) {
  // A page with sub-views (a deck, say) resolves to the entry its query names.
  const notFound = active === "not-found";
  const page = notFound ? notFoundPage : resolvePage(active, location.search);
  const group = notFound ? undefined : libraryGroups.find((g) => g.id === page.group)!;
  const siblings = group ? pageDefs.filter((p) => p.group === group.id) : [];
  const missing = notFound ? null : unknownSubView(page, location.search);
  const groupsRef = useCurrentInView(group?.id ?? "");
  const pagesRef = useCurrentInView(page.id);
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Every page names itself in the tab, /web too: the sample page it hosts publishes the rest of its
  // head (description, canonical, Open Graph, JSON-LD), but the tab says which playground page it is.
  const hostsPage = "hostsPage" in page && page.hostsPage;
  useEffect(() => {
    document.title = documentTitle(page);
  }, [page]);
  return (
    <div className="showcase-frame" data-theme={theme} data-style="technical">
      <a
        className="showcase-skip"
        href="#showcase-main"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="showcase-header">
        <div className="showcase-header__bar">
          <a
            className="showcase-brand"
            href={`/?theme=${theme}`}
            aria-label="UIPACK home"
          >
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
            <button
              className="theme"
              type="button"
              aria-label={`${theme === "dark" ? "light" : "dark"} mode`}
              onClick={flip}
            >
              <span className="theme__text" aria-hidden="true">
                {theme === "dark" ? "light" : "dark"} mode
              </span>
              <span className="theme__icon" aria-hidden="true">
                {theme === "dark" ? "☀" : "☾"}
              </span>
            </button>
          </div>
        </div>
        <nav className="showcase-groups" aria-label="Library groups" ref={groupsRef}>
          {libraryGroups.map((g) => {
            const target = pageDefs.find((p) => p.id === g.defaultPage)!;
            return (
              <a
                key={g.id}
                href={pageHref(target, theme)}
                aria-current={g.id === group?.id ? "page" : undefined}
              >
                {g.label}
              </a>
            );
          })}
        </nav>
        {group && (
          <nav className="showcase-pages" aria-label="Library pages" ref={pagesRef}>
            {pageRuns(siblings).map((run) => {
              const links = run.pages.map((p) => (
                <a key={p.id} href={pageHref(p, theme)} aria-current={page.id === p.id ? "page" : undefined}>
                  {p.label}
                </a>
              ));
              if (!run.title) return links;
              // Sub-views of one page (the decks) sit together after its name, like the menu sheet's sub-label.
              const labelId = `pages-${run.pages[0].id}`;
              return (
                <div key={labelId} className="showcase-pages__run" role="group" aria-labelledby={labelId}>
                  <span id={labelId} className="showcase-pages__label">
                    {run.title}
                  </span>
                  {links}
                </div>
              );
            })}
          </nav>
        )}
      </header>
      <dialog
        className="showcase-menu"
        ref={menuRef}
        aria-label="Library menu"
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
        {/* A navigation landmark on phones too, where the header's two navs are hidden. */}
        <nav aria-label="All library pages">
          {libraryGroups.map((g) => (
            <div key={g.id} role="group" aria-labelledby={`menu-${g.id}`} className="showcase-menu__group">
              <p id={`menu-${g.id}`}>{g.label}</p>
              {pageDefs
                .filter((p) => p.group === g.id)
                .map((p, i, all) => (
                  <Fragment key={p.id}>
                    {/* Sub-views of one page sit indented under a label naming it. */}
                    {p.query && all[i - 1]?.path !== p.path && (
                      <span className="showcase-menu__sub">{p.title ?? p.label}</span>
                    )}
                    <a
                      href={pageHref(p, theme)}
                      className={p.query ? "is-sub" : undefined}
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
      <main className="showcase-shell" id="showcase-main" tabIndex={-1} ref={mainRef}>
        {group && (
          <p className="showcase-context">
            <span>{group.label}</span>
            {active !== "styles" && (
              <>
                <span aria-hidden="true">·</span>
                <a href={`/styles?theme=${theme}`}>{styleName} style</a>
              </>
            )}
          </p>
        )}
        <div className="showcase-title">
          {hostsPage ? (
            <p className="showcase-title__name">{pageHeading(page)}</p>
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
        </div>
        {children}
      </main>
    </div>
  );
}
