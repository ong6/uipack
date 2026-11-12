import { Fragment, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { groupDocsResults, searchDocs, type DocsSearchEntry } from "./search";

/** `DocsLayout`'s `search`: where the index comes from and how a result's address is written. */
export interface DocsSearchOptions {
  /** Loads the entries, once, the first time the dialog opens (fetch the site's index file). */
  load: () => Promise<DocsSearchEntry[]>;
  /** Rewrites a result's address before it is linked (to add the site's theme query, say). */
  resolveHref?: (href: string) => string;
  /** The box's text. Default "Search docs". */
  placeholder?: string;
}

/** A section as the results name it: its title, icon and hue (`DocsLayout`'s sections, as they are). */
export interface DocsSearchSection {
  /** Matches an entry's `section`. Default: the title. */
  id?: string;
  title: string;
  icon?: ReactNode;
  hue?: string;
}

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function SearchIcon() {
  return (
    <svg className="uipack-docs-search__icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

/** The box at the top of the sidebar: a button that looks like a search field and opens the dialog. */
export function DocsSearchButton({ placeholder = "Search docs", onOpen }: { placeholder?: string; onOpen: () => void }) {
  const [mac] = useState(isMac);
  return (
    <button type="button" className="uipack-docs-search__button" onClick={onOpen} aria-haspopup="dialog">
      <SearchIcon />
      <span className="uipack-docs-search__placeholder">{placeholder}</span>
      <kbd aria-hidden="true">{mac ? "⌘K" : "Ctrl K"}</kbd>
    </button>
  );
}

/** ⌘K / Ctrl-K opens search from anywhere on the page while `enabled`; `setOpen` is the dialog's state setter. */
export function useDocsSearchShortcut(enabled: boolean, setOpen: (open: boolean) => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [enabled, setOpen]);
}

const cache = new WeakMap<DocsSearchOptions["load"], Promise<DocsSearchEntry[]>>();

/**
 * The search dialog: a combobox over the results, grouped by section in each section's hue. Arrow
 * keys move through them, Enter opens one, Escape closes. The index loads the first time it opens.
 */
export function DocsSearchDialog({
  open,
  onClose,
  options,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  options: DocsSearchOptions;
  sections: DocsSearchSection[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const [entries, setEntries] = useState<DocsSearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      input.current?.focus();
      input.current?.select();
    } else if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open || entries) return;
    let promise = cache.get(options.load);
    if (!promise) {
      promise = options.load();
      cache.set(options.load, promise);
    }
    let live = true;
    promise.then(
      (loaded) => live && setEntries(loaded),
      () => {
        cache.delete(options.load);
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, [open, entries, options]);

  const results = useMemo(() => (entries ? searchDocs(entries, query, 40) : []), [entries, query]);
  const groups = useMemo(() => groupDocsResults(results), [results]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  // Each group's first option's index in the flat list the arrow keys walk.
  const starts = useMemo(() => groups.map((_, i) => groups.slice(0, i).reduce((n, g) => n + g.items.length, 0)), [groups]);

  const hrefOf = (e: DocsSearchEntry) => {
    const raw = `${e.href}${e.anchor ? `#${e.anchor}` : ""}`;
    return options.resolveHref ? options.resolveHref(raw) : raw;
  };
  const optionId = (i: number) => `${id}-option-${i}`;

  // Keep the active option in view as the arrow keys move through a long list.
  useEffect(() => {
    list.current?.querySelector(`[id="${id}-option-${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [id, active]);

  const follow = (href: string) => {
    const url = new URL(href, location.href);
    onClose();
    if (url.pathname === location.pathname && url.search === location.search && url.hash) location.hash = url.hash;
    else location.assign(url.href);
  };

  const status = failed
    ? "The search index could not be loaded."
    : !entries
      ? "Loading the search index…"
      : !query.trim()
        ? "Type to search every page: titles, headings and text."
        : flat.length
          ? `${flat.length} result${flat.length === 1 ? "" : "s"}`
          : `No results for “${query.trim()}”.`;

  return (
    <dialog
      ref={dialog}
      className="uipack-docs-search"
      aria-label="Search the docs"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="uipack-docs-search__panel">
        <div className="uipack-docs-search__bar">
          <SearchIcon />
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-label="Search the docs"
            aria-expanded={flat.length > 0}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={flat.length ? optionId(active) : undefined}
            placeholder={options.placeholder ?? "Search docs"}
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                if (!flat.length) return;
                const d = e.key === "ArrowDown" ? 1 : -1;
                setActive((a) => (a + d + flat.length) % flat.length);
              } else if (e.key === "Escape") {
                // A search field's own Escape only clears it; here it closes the dialog.
                e.preventDefault();
                onClose();
              } else if (e.key === "Enter" && flat[active]) {
                e.preventDefault();
                follow(hrefOf(flat[active].entry));
              }
            }}
          />
          <button type="button" className="uipack-docs-search__close" onClick={onClose}>
            <span aria-hidden="true">Esc</span>
            <span className="uipack-docs-search__vh">Close search</span>
          </button>
        </div>
        <p className="uipack-docs-search__status" role="status">
          {status}
        </p>
        <div className="uipack-docs-search__results" id={`${id}-list`} role="listbox" aria-label="Results" ref={list}>
          {groups.map((group, g) => {
            const section = sections.find((s) => (s.id ?? s.title) === group.section);
            const labelId = `${id}-group-${group.section || "other"}`;
            return (
              <div
                key={group.section}
                role="group"
                aria-labelledby={labelId}
                className="uipack-docs-search__group"
                style={section?.hue ? ({ "--docs-hue": section.hue } as CSSProperties) : undefined}
              >
                <p className="uipack-docs-search__group-label" id={labelId}>
                  {section?.icon && <span className="uipack-docs__nav-icon">{section.icon}</span>}
                  {section?.title ?? "Pages"}
                </p>
                {group.items.map((r, k) => {
                  const i = starts[g] + k;
                  return (
                    <a
                      key={`${r.entry.href}#${r.entry.anchor}`}
                      id={optionId(i)}
                      role="option"
                      aria-selected={i === active}
                      className="uipack-docs-search__option"
                      href={hrefOf(r.entry)}
                      tabIndex={-1}
                      onMouseMove={() => i !== active && setActive(i)}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                        e.preventDefault();
                        follow(hrefOf(r.entry));
                      }}
                    >
                      <span className="uipack-docs-search__where">
                        {r.entry.page}
                        {r.entry.heading && (
                          <Fragment>
                            <span aria-hidden="true"> › </span>
                            <span className="uipack-docs-search__heading">{r.entry.heading}</span>
                          </Fragment>
                        )}
                      </span>
                      {r.snippet && <span className="uipack-docs-search__snippet">{r.snippet}</span>}
                    </a>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="uipack-docs-search__keys" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </p>
      </div>
    </dialog>
  );
}
