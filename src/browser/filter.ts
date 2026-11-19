// The asset browser's category list and filter, kept out of the uipack/browser entry.
import type { Asset } from "./index";

export const ALL = "All";

/** Category names in manifest order, "All" first, with counts. */
export function categories(assets: Asset[]): { name: string; count: number }[] {
  const seen = new Map<string, number>();
  for (const a of assets) seen.set(a.category, (seen.get(a.category) ?? 0) + 1);
  return [{ name: ALL, count: assets.length }, ...[...seen].map(([name, count]) => ({ name, count }))];
}

export function filterAssets(assets: Asset[], category: string, query: string): Asset[] {
  const q = query.trim().toLowerCase();
  return assets.filter(
    (a) =>
      (category === ALL || a.category === category) &&
      (!q || a.name.toLowerCase().includes(q) || a.id.includes(q) || (a.tags ?? []).some((t) => t.includes(q))),
  );
}
