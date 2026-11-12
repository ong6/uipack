// The docs site renders the repo's Markdown, so people and agents read one source. These checks
// keep that true: every page has its file, every docs file has a page, every number a generated
// block states matches the code (npm run docs:sync), llms.txt is current, demos resolve, and a
// relative link in a docs file lands on a real file.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { extractDocsHeadings } from "../src/docs";
import { docsFiles, docsManifest, docsPages, docsSections, pageForFile } from "../playground/docs-manifest";
import { demoIdsIn, demos, withDemos } from "../playground/demos";
import { repoPath, resolveDocsUrl, servedFiles } from "../playground/docs-links";
import {
  blockNames,
  docsMarkdownFiles,
  generators,
  llmsTxt,
  pinStatus,
  registryTable,
  syncSource,
  syncTargets,
} from "../scripts/docs-sync";

const root = resolve(__dirname, "..");
const read = (f: string) => readFileSync(resolve(root, f), "utf8");

describe("docs manifest", () => {
  it("page ids and routes are unique, and every group has pages", () => {
    const ids = docsPages.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const routes = docsPages.map((p) => `${p.path}?${new URLSearchParams(p.query)}`);
    expect(new Set(routes).size).toBe(routes.length);
    for (const g of docsManifest) expect(g.pages.length, g.id).toBeGreaterThan(0);
  });

  it("every page's Markdown file exists", () => {
    const missing = docsPages.filter((p) => !existsSync(resolve(root, p.file))).map((p) => `${p.id}: ${p.file}`);
    expect(missing).toEqual([]);
  });

  it("every Markdown file under docs/ is a page (or a page's file)", () => {
    const orphans = docsMarkdownFiles().filter((f) => !docsFiles.includes(f));
    expect(orphans, "add a page for each to playground/docs-manifest.ts").toEqual([]);
  });

  it("a link to a file goes to the page that renders it", () => {
    expect(pageForFile("docs/system/README.md")?.id).toBe("foundations");
    expect(pageForFile("docs/system/style.md")?.id).toBe("foundations-style");
    expect(pageForFile("docs/system/writing/talks.md")?.id).toBe("writing-talks");
    expect(pageForFile("docs/deck.md")?.id).toBe("deck");
    expect(pageForFile("docs/specs/technical.md")?.id).toBe("spec-technical");
  });
});

describe("generated blocks and llms.txt (npm run docs:sync)", () => {
  it("every generated block in the docs names a generator, and none is stale", () => {
    const stale = syncTargets()
      .filter((t) => t.current !== t.next)
      .map((t) => t.file);
    expect(stale, "run npm run docs:sync").toEqual([]);
  });

  it("the numbers and sequences the Rules and recipes state are generated", () => {
    expect(blockNames(read("docs/system/writing/general.md"))).toContain("slot-budgets");
    expect(blockNames(read("docs/README.md"))).toContain("site-map");
    expect(blockNames(read("docs/recipes/landing.md"))).toContain("web-section-order");
    expect(blockNames(read("docs/recipes/deck-slide.md"))).toContain("storylines");
    expect(blockNames(read("docs/deck-lint-rules.md"))).toContain("lint-rules");
    expect(blockNames(read("docs/system/layout/deck-slide.md"))).toContain("slide-canvas");
  });

  it("every page renders Markdown: no page is still a playground module", () => {
    for (const p of docsPages) expect(Object.keys(p), p.id).not.toContain("showcase");
  });

  it("a stale block is rewritten and an unknown one fails", () => {
    const stale = "Before\n<!-- generated:slot-budgets -->\n| old |\n<!-- /generated -->\nAfter";
    const synced = syncSource("docs/system/writing/general.md", stale);
    expect(synced).toContain(generators["slot-budgets"]("docs/system/writing/general.md"));
    expect(synced.startsWith("Before\n") && synced.endsWith("\nAfter")).toBe(true);
    expect(() => syncSource("x.md", "<!-- generated:nope -->\n<!-- /generated -->")).toThrow(/no generator "nope"/);
  });

  it("the site registry shows each pin against the latest release (package.json's version)", () => {
    expect(pinStatus("current", "0.2.0")).toBe("the release source");
    expect(pinStatus("e6b6ed7", "0.2.0")).toBe("commit pin: move to `v0.2.0`");
    expect(pinStatus("v0.2.0", "0.2.0")).toBe("up to date");
    expect(pinStatus("v0.1.3", "0.2.0")).toBe("behind: move to `v0.2.0`");
    expect(pinStatus("v0.10.0", "0.2.0")).toMatch(/^ahead/);
    const version = JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8")).version;
    expect(registryTable("docs/specs/registry.md").split("\n")[0]).toContain(`Against \`v${version}\``);
  });

  it("llms.txt lists each docs file once, by group, with links that resolve", () => {
    const text = llmsTxt();
    const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    expect(new Set(links).size).toBe(links.length);
    for (const link of links) expect(existsSync(resolve(root, link)), link).toBe(true);
    // Each group under its section: "## Build · Components", or "## Start" for a section's untitled group.
    for (const g of docsManifest) {
      const section = docsSections.find((s) => s.id === g.section)!.label;
      expect(text).toContain("caption" in g && g.caption === false ? `## ${section}\n` : `## ${section} · ${g.label}\n`);
    }
  });
});

describe("demos and links in the docs", () => {
  it("every demo a page or a file names is registered, and each placement heading exists", () => {
    const problems: string[] = [];
    for (const p of docsPages) {
      const source = read(p.file);
      for (const d of p.demos ?? []) {
        if (!demos[d.id]) problems.push(`${p.id}: demo ${d.id} is not in playground/demos.tsx`);
        if (d.at && !extractDocsHeadings(source).some((h) => h.id === d.at)) problems.push(`${p.id}: no heading #${d.at}`);
      }
    }
    for (const f of docsFiles) for (const id of demoIdsIn(read(f))) if (!demos[id]) problems.push(`${f}: uipack-demo ${id}`);
    expect(problems).toEqual([]);
  });

  it("a page's demo is inserted before its heading until the file names it", () => {
    const source = "# T\n\nLead.\n\n## One\n\nText.\n\n## Two\n";
    const out = withDemos(source, [{ id: "layer-swap", at: "two" }]);
    expect(out.indexOf("```uipack-demo layer-swap wide")).toBeGreaterThan(out.indexOf("## One"));
    expect(out.indexOf("```uipack-demo layer-swap wide")).toBeLessThan(out.indexOf("## Two"));
    const named = "# T\n\n```uipack-demo layer-swap\nShown here.\n```\n";
    expect(withDemos(named, [{ id: "layer-swap", at: "two" }])).toBe(named);
  });

  it("resolves a docs file's relative links to pages, raw files or GitHub", () => {
    expect(repoPath("docs/system/README.md", "../web-principles.md")).toBe("docs/web-principles.md");
    expect(resolveDocsUrl("docs/system/README.md", "style.md#diagrams", "link", "dark")).toBe(
      "/foundations/style?theme=dark#diagrams",
    );
    expect(resolveDocsUrl("docs/specs/README.md", "../../src/style.ts", "link", "light")).toBe(
      "https://github.com/ong6/uipack/blob/main/src/style.ts",
    );
    expect(resolveDocsUrl("README.md", "docs/presets/agentLoop-light.png", "image", "light")).toBe(
      "/docs/presets/agentLoop-light.png",
    );
    expect(resolveDocsUrl("docs/README.md", "https://example.com", "link", "light")).toBe("https://example.com");
    expect(resolveDocsUrl("docs/README.md", "#site-map", "link", "light")).toBe("#site-map");
  });

  it("every relative link and image in a docs page lands on a file in the repo", () => {
    const broken: string[] = [];
    for (const f of docsFiles) {
      // Code (fenced or inline) shows Markdown syntax; it links nowhere.
      const text = read(f)
        .replace(/^(`{3,}|~{3,})[\s\S]*?^\1/gm, "")
        .replace(/`[^`\n]*`/g, "");
      for (const m of text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) {
        const url = m[1];
        if (/^[a-z][a-z0-9+.-]*:|^\/|^#/i.test(url)) continue;
        const path = repoPath(f, url.split("#")[0]);
        if (!existsSync(resolve(root, path))) broken.push(`${f}: ${url}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("the site serves every page's file and the images they show", () => {
    const served = servedFiles(read);
    for (const f of docsFiles) expect(served).toContain(f);
    expect(served).toContain("docs/presets/agentLoop-light.png");
  });

  // `npm run screenshots` writes more shots than the docs show, and .gitignore keeps the extra ones
  // out of git; a doc that links one of those would pass on this machine and 404 on a fresh checkout.
  it("every image the site serves is tracked in git", () => {
    const images = servedFiles(read).filter((f) => !f.endsWith(".md"));
    const tracked = new Set(
      execFileSync("git", ["ls-files", "-z", "--", ...images], { cwd: root, encoding: "utf8" }).split("\0"),
    );
    expect(images.filter((f) => !tracked.has(f))).toEqual([]);
  });
});
