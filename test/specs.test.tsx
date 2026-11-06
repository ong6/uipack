// Every site spec in docs/specs conforms to the template, and the Technical spec says what the code
// does. scripts/check-spec.ts is the checker; a site's own repo runs the same one on its STYLE.md.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { checkSpec, frontmatter, pickedLooks, roleRows } from "../scripts/check-spec";
import { COMPONENTS, LAYOUT_ARCHETYPES, PAGE_TYPES } from "../scripts/site-model";
import { objectDirections } from "../src/objects/variants";
import { CORE_ROLES, lightDark, parseValueSet } from "../scripts/style-contract";
import { siteRegistry } from "../playground/docs-manifest";

const root = resolve(__dirname, "..");
const read = (f: string) => readFileSync(resolve(root, f), "utf8");
/** The spec files: every docs/specs page but the how-to and the registry. */
const specs = readdirSync(resolve(root, "docs/specs"))
  .filter((f) => f.endsWith(".md") && f !== "README.md" && f !== "registry.md")
  .map((f) => `docs/specs/${f}`);

describe("site specs", () => {
  it("every spec, the template included, passes the checker", () => {
    expect(specs).toContain("docs/specs/technical.md");
    expect(specs).toContain("docs/specs/TEMPLATE.md");
    const problems = specs.flatMap((f) => checkSpec(read(f), { root }).map((p) => `${f}: ${p}`));
    expect(problems).toEqual([]);
  });

  it("the Technical spec's role values are src/styles/technical.css's, role by role, light and dark", () => {
    const rows = roleRows(read("docs/specs/technical.md"));
    const css = parseValueSet(read("src/styles/technical.css"));
    const unquote = (cell: string) => cell.replace(/^`|`$/g, "").replace(/\\\|/g, "|");
    const drift: string[] = [];
    for (const [name, value] of css) {
      const row = rows.get(`--ui-${name}`);
      const [light, dark] = lightDark(value);
      if (!row) drift.push(`--ui-${name}: missing`);
      else if (unquote(row[0]) !== light || unquote(row[1]) !== dark) drift.push(`--ui-${name}: ${row.join(" / ")}`);
    }
    for (const name of rows.keys()) if (!css.has(name.replace(/^--ui-/, ""))) drift.push(`${name}: not in technical.css`);
    expect(drift).toEqual([]);
    // And it fills the whole contract.
    for (const role of CORE_ROLES) expect(css.has(role), role).toBe(true);
  });

  it("the checker fails a spec missing a section or a role, or naming an unknown base", () => {
    const technical = read("docs/specs/technical.md");
    expect(checkSpec(technical.replace("## Reuse", "## Reused"), { root })).toContain('missing section "## Reuse"');
    expect(checkSpec(technical.replace("## Writing style", "## Voice"), { root })).toContain(
      'missing section "## Writing style"',
    );
    expect(checkSpec(technical.replace(/^\| `--ui-paper` .*$/m, ""), { root })).toContain(
      "role --ui-paper: no row in Role values (give a value or TODO:)",
    );
    expect(checkSpec(technical.replace("extends: core", "extends: nowhere"), { root })[0]).toMatch(/extends: "nowhere"/);
    expect(checkSpec("# No frontmatter", { root })).toEqual(["no frontmatter: start with the template's --- block"]);
  });

  it("the checker fails a page type with no layout, a wrong archetype or an incomplete custom one", () => {
    const technical = read("docs/specs/technical.md");
    expect(checkSpec(technical.replace("dashboard: one-question-dashboard", "dashboard: bento-grid"), { root })).toContain(
      'layouts: no archetype "bento-grid" (docs/system/layout/README.md lists them)',
    );
    expect(checkSpec(technical.replace("deck: slide-canvas", "deck: docs-shell"), { root })).toContain(
      'layouts: "docs-shell" is a documentation archetype, not a deck one',
    );
    expect(checkSpec(technical.replace(", dashboard: one-question-dashboard", ""), { root })).toContain(
      'layouts: page type "dashboard" has no layout (an archetype id, or custom)',
    );
    expect(checkSpec(technical.replace("article, deck", "article, slides, deck"), { root })[0]).toMatch(
      /pages: no page type "slides"/,
    );
    expect(checkSpec(technical.replace("### Dashboard", "### Screens"), { root })).toContain(
      'Layout: no "### Dashboard" for page type "dashboard"',
    );
    // A custom layout needs its four rows; with them it passes.
    const custom = technical.replace("deck: slide-canvas", "deck: custom");
    expect(checkSpec(custom, { root })).toEqual(
      expect.arrayContaining([
        'Layout, Deck: a custom layout needs a "Grid" row',
        'Layout, Deck: a custom layout needs a "Hero" row',
      ]),
    );
    const rows =
      "| Setting | Deck |\n| --- | --- |\n| Grid | 16:9 |\n| Regions | Title, body |\n| Section order | Roles |\n| Hero | Cover |\n";
    expect(checkSpec(custom.replace("### Deck\n", `### Deck\n\n${rows}`), { root })).toEqual([]);
  });

  it("the checker fails a Writing style table missing a row", () => {
    const technical = read("docs/specs/technical.md");
    expect(checkSpec(technical.replace("| House words |", "| Words |"), { root })).toContain(
      'Writing style: no "House words" row',
    );
  });

  it("the checker fails an unknown component or look, two looks for a one-look component, and an overridden fixed look", () => {
    const technical = read("docs/specs/technical.md");
    expect(checkSpec(technical.replace("mechanism: isometric", "mechanism: isometric, maps: atlas"), { root })).toContain(
      'components: no component "maps" (diagrams, 3d, mechanism)',
    );
    expect(checkSpec(technical.replace("diagrams: blueprint", "diagrams: neon"), { root })).toContain(
      'components: diagrams offers no look "neon" (blueprint)',
    );
    expect(checkSpec(technical.replace("realistic, abstract]", "realistic, abstract, claymation]"), { root })).toContain(
      'components: 3d offers no look "claymation" (studio, paper-theatre, kinetic, cartoon, realistic, abstract)',
    );
    expect(checkSpec(technical.replace("mechanism: isometric", "mechanism: [isometric, isometric]"), { root })).toContain(
      "components: mechanism takes one look, got 2",
    );
    const override = technical.replace(
      "| `--ui-paper` |",
      "| `--uipack-token-request` | `#ff0000` | `#ff0000` |\n| `--ui-paper` |",
    );
    expect(checkSpec(override, { root })).toContain(
      "--uipack-token-request is fixed by the Blueprint look (diagrams): a spec that picks it may not set it",
    );
  });

  it("an older spec's uses: [diagrams] still reads as components: { diagrams: blueprint }", () => {
    const technical = read("docs/specs/technical.md");
    const legacy = technical.replace(/^components: .*$/m, "uses: [diagrams]");
    expect(pickedLooks(frontmatter(legacy)!)).toEqual({ diagrams: ["blueprint"] });
    expect(checkSpec(legacy, { root })).toEqual([]);
    expect(checkSpec(legacy.replace("uses: [diagrams]", "uses: [diagrams, maps]"), { root })).toContain(
      'components: no component "maps" (diagrams, 3d, mechanism)',
    );
    expect(checkSpec(technical.replace("status: implemented", "uses: [diagrams]\nstatus: implemented"), { root })).toContain(
      "frontmatter: components: replaces uses:; keep only components",
    );
  });

  it("the site model matches the code and the docs", () => {
    // 3D looks are the object directions, in order.
    const looks3d = COMPONENTS.find((c) => c.id === "3d")!.looks.map((l) => l.id);
    expect(looks3d).toEqual(objectDirections.map((d) => d.id));
    // Every archetype's doc and every component doc exists; every page type has an archetype.
    for (const a of LAYOUT_ARCHETYPES) expect(existsSync(resolve(root, a.file)), a.file).toBe(true);
    for (const c of COMPONENTS) expect(existsSync(resolve(root, c.doc)), c.doc).toBe(true);
    for (const t of PAGE_TYPES)
      expect(
        LAYOUT_ARCHETYPES.some((a) => a.pageType === t.id),
        t.id,
      ).toBe(true);
    // Technical picks every look the code offers and a layout for every page type.
    const fm = frontmatter(read("docs/specs/technical.md"))!;
    expect(fm.pages).toEqual(PAGE_TYPES.map((t) => t.id));
    expect(pickedLooks(fm)).toEqual(Object.fromEntries(COMPONENTS.map((c) => [c.id, c.looks.map((l) => l.id)])));
  });

  it("the registry lists every spec in uipack, and each written one exists", () => {
    const ids = specs.map((f) => frontmatter(read(f))?.spec).filter((id) => typeof id === "string" && !id.startsWith("TODO"));
    for (const id of ids)
      expect(
        siteRegistry.some((s) => s.spec === `docs/specs/${id}.md`),
        String(id),
      ).toBe(true);
    for (const site of siteRegistry.filter((s) => s.specStatus === "written" && !s.spec.includes(":")))
      expect(specs, site.site).toContain(site.spec);
  });
});
