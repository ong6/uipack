import { libraryGroups, pageDefs, pageHref, resolvePage, type LibraryPage } from "./catalog";
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

/**
 * The one header for every page. From 720px: brand and theme, a row of groups,
 * a row of the active group's pages. Below 720px: one compact row, with a
 * button showing where you are that opens a sheet listing every page.
 * Then the context line, the page's h1 and its intro. Titles and intros come
 * from `libraryPages` in catalog.ts.
 */
export function ShowcaseShell({
  active,
  theme,
  flip,
  children,
  styleName = "Technical",
}: {
  active: LibraryPage;
  /** The visual style the page's content uses; the shell itself stays Technical. */
  styleName?: string;
  theme: "light" | "dark";
  flip: () => void;
  children: ReactNode;
}) {
  // A page with sub-views (a deck, say) resolves to the entry its query names.
  const page = resolvePage(active, location.search);
  const group = libraryGroups.find((g) => g.id === page.group)!;
  const siblings = pageDefs.filter((p) => p.group === group.id);
  const groupsRef = useCurrentInView(group.id);
  const pagesRef = useCurrentInView(page.id);
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="showcase-shell" data-theme={theme} data-style="technical">
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
              onClick={() => {
                setMenuOpen(true);
                menuRef.current?.showModal();
              }}
            >
              <span>
                {group.label} · {page.label}
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
                aria-current={g.id === group.id ? "page" : undefined}
              >
                {g.label}
              </a>
            );
          })}
        </nav>
        <nav className="showcase-pages" aria-label="Library pages" ref={pagesRef}>
          {siblings.map((p) => (
            <a
              key={p.id}
              href={pageHref(p, theme)}
              aria-current={page.id === p.id ? "page" : undefined}
            >
              {p.label}
            </a>
          ))}
        </nav>
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
      </dialog>
      <p className="showcase-context">
        <span>{group.label}</span>
        {active !== "styles" && (
          <>
            <span aria-hidden="true">·</span>
            <a href={`/styles?theme=${theme}`}>{styleName} style</a>
          </>
        )}
      </p>
      <div className="showcase-title">
        <h1>{page.title ?? page.label}</h1>
        <p>{page.intro}</p>
      </div>
      {children}
    </main>
  );
}
