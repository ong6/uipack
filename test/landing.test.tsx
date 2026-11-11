import { existsSync, readFileSync } from "node:fs";
import { pageDefs } from "../playground/catalog";
import { routes } from "../playground/routes";
import { siteRoutes } from "../playground/site";
import { installLine } from "../playground/release";
import { LANDING_MODULE, LANDING_PATH, LANDING_TITLE } from "../playground/landing-index";
import { JOBS, LAYERS } from "../playground/landing/content";
import { version } from "../package.json";

// The landing page (/) sits outside the docs manifest; these checks hold its wiring to the rest of
// the site: the module main.tsx loads, the route the build writes, the pages its cards open, and the
// install line it shows (the same one the docs print). Rendering is covered by e2e/landing.spec.ts.
describe("landing page", () => {
  it("is a loadable page module (main.tsx's *Showcase glob) at /, which no docs page claims", () => {
    expect(LANDING_MODULE).toMatch(/^[A-Z][A-Za-z]*Showcase$/);
    expect(existsSync(`playground/${LANDING_MODULE}.tsx`)).toBe(true);
    expect(pageDefs.some((p) => p.path === LANDING_PATH)).toBe(false);
    expect(routes.has(LANDING_PATH)).toBe(false);
  });

  it("is a site route with its own title and canonical, and the old home page keeps an address", () => {
    const route = siteRoutes().find((r) => r.path === LANDING_PATH);
    expect(route).toMatchObject({ title: LANDING_TITLE, canonical: LANDING_PATH, noindex: false });
    const start = pageDefs.find((p) => p.id === "start")!;
    expect(start.file).toBe("docs/README.md");
    expect(siteRoutes().some((r) => r.path === start.path && r.canonical === start.path)).toBe(true);
  });

  it("opens only pages the manifest has", () => {
    const ids = new Set(pageDefs.map((p) => p.id));
    for (const { page } of [...JOBS, ...LAYERS]) expect(ids, page).toContain(page);
  });

  it("shows the install line the docs print for the current release", () => {
    const generated = /<!-- generated:install -->\s*```sh\n(.+)\n```/.exec(readFileSync("README.md", "utf8"))?.[1];
    expect(installLine(version)).toBe(generated);
  });
});
