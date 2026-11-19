import { Fragment, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMenu,
  useCommandShortcut,
} from "../widgets/CommandMenu";
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
  useCommandShortcut(enabled, setOpen);
}

const cache = new WeakMap<DocsSearchOptions["load"], Promise<DocsSearchEntry[]>>();

/**
 * The search dialog: the command menu (`uipack/widgets`, on cmdk) over the results, grouped by section
 * in each section's hue. Arrow keys move through them, Enter opens one, Escape closes. The index
 * loads the first time it opens; the results come from `searchDocs`, so cmdk's own filter is off.
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
  const id = useId();
  const [entries, setEntries] = useState<DocsSearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  // A modified click (new tab, new window) is the browser's; cmdk's select that follows it is skipped.
  const passThrough = useRef(false);

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

  const hrefOf = (e: DocsSearchEntry) => {
    const raw = `${e.href}${e.anchor ? `#${e.anchor}` : ""}`;
    return options.resolveHref ? options.resolveHref(raw) : raw;
  };
  const valueOf = (e: DocsSearchEntry) => `${e.href}#${e.anchor ?? ""}`;
  // The first result is selected whenever the results change (a new query, the index arriving).
  // The selection is the reader's choice while it is still a result, else the first result. cmdk
  // re-selects on its own when the query changes, sometimes before the index has loaded (an empty
  // list), so a stale or empty value from it falls back here rather than leaving nothing selected.
  const values = useMemo(() => flat.map((r) => valueOf(r.entry)), [flat]);
  const current = values.includes(selected) ? selected : (values[0] ?? "");

  const follow = (href: string) => {
    onClose();
    // A result on this page only changes the fragment, so the browser scrolls to it without a reload.
    location.assign(new URL(href, location.href).href);
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
    <CommandDialog open={open} onClose={onClose} label="Search the docs" className="uipack-docs-search" skin={false}>
      <CommandMenu
        label="Search the docs"
        className="uipack-docs-search__panel"
        skin={false}
        shouldFilter={false}
        value={current}
        onValueChange={setSelected}
      >
        <div className="uipack-docs-search__bar">
          <SearchIcon />
          <CommandInput
            aria-label="Search the docs"
            placeholder={options.placeholder ?? "Search docs"}
            autoComplete="off"
            spellCheck={false}
            value={query}
            onValueChange={setQuery}
          />
          <button type="button" className="uipack-docs-search__close" onClick={onClose}>
            <span aria-hidden="true">Esc</span>
            <span className="uipack-docs-search__vh">Close search</span>
          </button>
        </div>
        <p className="uipack-docs-search__status" role="status">
          {status}
        </p>
        <CommandList className="uipack-docs-search__results" label="Results">
          {groups.map((group) => {
            const section = sections.find((s) => (s.id ?? s.title) === group.section);
            return (
              <CommandGroup
                key={group.section}
                value={`${id}-${group.section || "other"}`}
                className="uipack-docs-search__group"
                style={section?.hue ? ({ "--docs-hue": section.hue } as CSSProperties) : undefined}
                heading={
                  <span className="uipack-docs-search__group-label">
                    {section?.icon && <span className="uipack-docs__nav-icon">{section.icon}</span>}
                    {section?.title ?? "Pages"}
                  </span>
                }
              >
                {group.items.map((r) => {
                  const href = hrefOf(r.entry);
                  return (
                    <CommandItem
                      key={valueOf(r.entry)}
                      value={valueOf(r.entry)}
                      asChild
                      onSelect={() => {
                        if (passThrough.current) passThrough.current = false;
                        else follow(href);
                      }}
                    >
                      <a
                        className="uipack-docs-search__option"
                        href={href}
                        tabIndex={-1}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) passThrough.current = true;
                          else e.preventDefault();
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
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
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
      </CommandMenu>
    </CommandDialog>
  );
}
