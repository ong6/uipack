import { blobUrl, docsFiles, pageForFile } from "./docs-manifest";

/** `target` (a relative link in `from`) as a repo path: "../web-principles.md" from "docs/system/README.md". */
export function repoPath(from: string, target: string) {
  const parts = from.split("/").slice(0, -1);
  for (const part of target.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== "." && part !== "") parts.push(part);
  }
  return parts.join("/");
}

/**
 * Where a link or image in a docs file goes on the site. A relative link to a file the site
 * renders opens its page (with the anchor and the theme); an image, or a raw file the site serves,
 * stays a same-origin path; anything else in the repo opens on GitHub. Absolute URLs and
 * same-page anchors are left alone.
 */
export function resolveDocsUrl(from: string, url: string, kind: "link" | "image", theme: string) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//") || url.startsWith("#") || url.startsWith("/")) return url;
  const [pathPart, hash = ""] = url.split("#");
  const path = repoPath(from, pathPart.split("?")[0]);
  if (kind === "image") return `/${path}`;
  const page = docsFiles.includes(path) ? pageForFile(path) : undefined;
  if (page) {
    const params = new URLSearchParams(page.query);
    params.set("theme", theme);
    return `${page.path}?${params}${hash ? `#${hash}` : ""}`;
  }
  return `${blobUrl(path)}${hash ? `#${hash}` : ""}`;
}

/**
 * The raw files the site serves at their repo path ("View as Markdown"): every manifest file and
 * the images they show. `read` returns a file's text, so Node (vite.config.ts) and tests share it.
 */
export function servedFiles(read: (file: string) => string) {
  const files = new Set<string>(docsFiles);
  for (const file of docsFiles) {
    for (const m of read(file).matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
      const target = m[1];
      if (/^[a-z][a-z0-9+.-]*:|^\/|^#/i.test(target)) continue;
      files.add(repoPath(file, target.split("#")[0]));
    }
  }
  return [...files];
}

/** Where a preview path from `assets/manifest.json` ("docs/assets/icon-db.svg") loads, in dev and in a build. */
export const ASSET_PREVIEW_BASE = "/";

/**
 * Every raw file the site serves at its repo path: `servedFiles`, the previews in the asset
 * manifest (the Assets gallery and the Icons & marks page load them from ASSET_PREVIEW_BASE), and
 * every repo file llms.txt links, so each of its links resolves on the site.
 */
export function siteFiles(read: (file: string) => string) {
  const files = new Set(servedFiles(read));
  const manifest = JSON.parse(read("assets/manifest.json")) as { assets: Record<string, unknown>[] };
  for (const asset of manifest.assets)
    for (const key of ["preview", "previewDark", "previewStatic", "previewStaticDark"])
      if (typeof asset[key] === "string") files.add(asset[key]);
  for (const m of read("llms.txt").matchAll(/\]\(([^)\s#]+)/g)) if (!/^[a-z][a-z0-9+.-]*:/i.test(m[1])) files.add(m[1]);
  return [...files];
}
