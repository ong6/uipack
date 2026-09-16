import * as react from 'react';

type AssetKind = "figure" | "part" | "icon" | "motion" | "background" | "mark";
interface Asset {
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
interface AssetManifest {
    version: number;
    generated: string;
    /** Base URL the preview paths resolve against. */
    base?: string;
    assets: Asset[];
}
interface AssetBrowserProps {
    manifest: AssetManifest;
    initialCategory?: string;
    /** Called on the card button. Default copies `source` to the clipboard. */
    onAction?: (asset: Asset) => void | Promise<void>;
    actionLabel?: string;
    /** Prefix for preview URLs; overrides `manifest.base`. */
    base?: string;
    className?: string;
}
declare const ALL = "All";
/** Category names in manifest order, "All" first, with counts. */
declare function categories(assets: Asset[]): {
    name: string;
    count: number;
}[];
declare function filterAssets(assets: Asset[], category: string, query: string): Asset[];
/**
 * An asset browser in the Rubric Elements shape: categories down the left,
 * a search box, and a grid of cards with a light preview tile, the name and
 * one action. At narrow widths the sidebar becomes a row of chips.
 */
declare function AssetBrowser({ manifest, initialCategory, onAction, actionLabel, base, className }: AssetBrowserProps): react.JSX.Element;

export { ALL, type Asset, AssetBrowser, type AssetBrowserProps, type AssetKind, type AssetManifest, categories, filterAssets };
