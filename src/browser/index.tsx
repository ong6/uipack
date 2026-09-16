import { useEffect, useMemo, useRef, useState } from "react";

export type AssetKind = "figure" | "part" | "icon" | "motion" | "background" | "mark";

export interface Asset {
  id: string;
  name: string;
  /** Sidebar category: "Figures", "Parts", "Icons", "Motion", "Backgrounds", "Marks". */
  category: string;
  kind: AssetKind;
  /** Path to a rendered SVG or PNG, relative to the manifest. */
  preview: string;
  /** What the action copies: an import line, a JSX snippet, or raw SVG. */
  source: string;
  tags?: string[];
}

export interface AssetManifest {
  version: number;
  generated: string;
  /** Base URL the preview paths resolve against. */
  base?: string;
  assets: Asset[];
}

export interface AssetBrowserProps {
  manifest: AssetManifest;
  initialCategory?: string;
  /** Called on the card button. Default copies `source` to the clipboard. */
  onAction?: (asset: Asset) => void | Promise<void>;
  actionLabel?: string;
  /** Prefix for preview URLs; overrides `manifest.base`. */
  base?: string;
  className?: string;
}

export const ALL = "All";

async function copy(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
}

/** Category names in manifest order, "All" first, with counts. */
export function categories(assets: Asset[]): { name: string; count: number }[] {
  const seen = new Map<string, number>();
  for (const a of assets) seen.set(a.category, (seen.get(a.category) ?? 0) + 1);
  return [{ name: ALL, count: assets.length }, ...[...seen].map(([name, count]) => ({ name, count }))];
}

export function filterAssets(assets: Asset[], category: string, query: string): Asset[] {
  const q = query.trim().toLowerCase();
  return assets.filter((a) => (category === ALL || a.category === category) && (!q || a.name.toLowerCase().includes(q) || a.id.includes(q) || (a.tags ?? []).some((t) => t.includes(q))));
}

/**
 * An asset browser in the Rubric Elements shape: categories down the left,
 * a search box, and a grid of cards with a light preview tile, the name and
 * one action. At narrow widths the sidebar becomes a row of chips.
 */
export function AssetBrowser({ manifest, initialCategory = ALL, onAction, actionLabel = "Copy", base, className }: AssetBrowserProps) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const cats = useMemo(() => categories(manifest.assets), [manifest.assets]);
  const shown = useMemo(() => filterAssets(manifest.assets, category, query), [manifest.assets, category, query]);
  const prefix = base ?? manifest.base ?? "";

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const act = async (a: Asset) => {
    if (onAction) await onAction(a);
    else await copy(a.source);
    setFlash(a.id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), 1400);
  };

  return (
    <div className={["uipack-browser", className ?? ""].join(" ").trim()} data-category={category}>
      <nav className="uipack-browser__side" aria-label="Asset categories">
        <ul role="list">
          {cats.map((c) => (
            <li key={c.name}>
              <button type="button" className="uipack-browser__cat" aria-pressed={category === c.name} onClick={() => setCategory(c.name)}>
                <span>{c.name}</span>
                <span className="uipack-browser__count" aria-label={`${c.count} assets`}>
                  {c.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="uipack-browser__main">
        <div className="uipack-browser__bar">
          <label className="uipack-browser__search">
            <span className="uipack-browser__sr">Search assets</span>
            <input type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <p className="uipack-browser__status" role="status">
            {shown.length} {shown.length === 1 ? "asset" : "assets"}
            {category !== ALL ? ` in ${category}` : ""}
          </p>
        </div>
        <ul className="uipack-browser__grid" role="list">
          {shown.map((a) => (
            <li key={a.id} className="uipack-browser__card" data-kind={a.kind} data-id={a.id}>
              <div className="uipack-browser__tile">
                <img src={`${prefix}${a.preview}`} alt="" loading="lazy" />
              </div>
              <div className="uipack-browser__row">
                <span className="uipack-browser__name">{a.name}</span>
                <button type="button" className="uipack-browser__action" onClick={() => act(a)} aria-label={`${actionLabel} ${a.name}`} data-flash={flash === a.id ? "true" : undefined}>
                  {flash === a.id ? "Copied" : actionLabel}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {shown.length === 0 ? <p className="uipack-browser__empty">Nothing matches.</p> : null}
      </div>
    </div>
  );
}
