import { existsSync } from "node:fs";
import { libraryGroups, libraryPages, pageDefs, visualStyles } from "../playground/catalog";
import { deckExamples } from "../playground/deckExamples";
import { pageModules } from "../playground/routes";

// catalog.ts is the playground's one registry. These checks name the second file a new page,
// deck or style must touch (docs/contributing.md has the recipes).
describe("playground catalog", () => {
  it("page ids are unique, each page's group exists, and each group opens on one of its own pages", () => {
    const ids = libraryPages.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of libraryPages) expect(libraryGroups.map((g) => g.id), p.id).toContain(p.group);
    for (const g of libraryGroups) expect(libraryPages.find((p) => p.id === g.defaultPage)?.group, g.id).toBe(g.id);
  });

  it("pages that share a path differ by query, and exactly one of them is the default", () => {
    for (const path of new Set(pageDefs.map((p) => p.path))) {
      const pages = pageDefs.filter((p) => p.path === path);
      if (pages.length === 1) continue;
      expect(pages.every((p) => p.query), path).toBe(true);
      expect(pages.filter((p) => p.isDefault), path).toHaveLength(1);
      const keys = pages.map((p) => JSON.stringify(p.query));
      expect(new Set(keys).size, path).toBe(keys.length);
    }
  });

  it("every example deck has its nav entry (query deck=<id>) and every deck entry has a deck", () => {
    const deckPages = pageDefs.filter((p) => p.path === "/deck").map((p) => p.query?.deck);
    expect(deckPages.sort()).toEqual(deckExamples.map((d) => d.id).sort());
  });

  it("every page module exists and is named so main.tsx can lazy-load it (App, CatalogPages or *Showcase)", () => {
    // The patterns of import.meta.glob in playground/main.tsx, which takes literals only.
    const loadable = /^(App|CatalogPages|[A-Z][A-Za-z]*Showcase)$/;
    for (const [id, name] of Object.entries(pageModules)) {
      expect(name, id).toMatch(loadable);
      expect(existsSync(`playground/${name}.tsx`), name).toBe(true);
    }
  });

  it("a page's style names a registered visual style", () => {
    const names: string[] = visualStyles.map((s) => s.name);
    for (const p of pageDefs) if (p.styleName) expect(names, p.id).toContain(p.styleName);
  });

  it("every visual style points at token and guidance files that exist", () => {
    const ids = visualStyles.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of visualStyles) {
      expect(existsSync(s.tokens), `${s.id} tokens ${s.tokens}`).toBe(true);
      expect(existsSync(s.guidance), `${s.id} guidance ${s.guidance}`).toBe(true);
    }
  });
});
