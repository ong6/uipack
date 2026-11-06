// Every site spec in docs/specs conforms to the template, and the Technical spec says what the code
// does. scripts/check-spec.ts is the checker; a site's own repo runs the same one on its STYLE.md.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { checkSpec, frontmatter, roleRows } from "../scripts/check-spec";
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

  it("the checker fails a spec missing a section or a role, naming an unknown family or base, or overriding a family", () => {
    const technical = read("docs/specs/technical.md");
    expect(checkSpec(technical.replace("## Reuse", "## Reused"), { root })).toContain('missing section "## Reuse"');
    expect(checkSpec(technical.replace(/^\| `--ui-paper` .*$/m, ""), { root })).toContain(
      "role --ui-paper: no row in Role values (give a value or TODO:)",
    );
    expect(checkSpec(technical.replace("uses: [diagrams]", "uses: [diagrams, maps]"), { root })).toContain(
      'uses: no family "maps" (docs/families/maps.md)',
    );
    expect(checkSpec(technical.replace("extends: core", "extends: nowhere"), { root })[0]).toMatch(/extends: "nowhere"/);
    const override = technical.replace(
      "| `--ui-paper` |",
      "| `--uipack-token-request` | `#ff0000` | `#ff0000` |\n| `--ui-paper` |",
    );
    expect(checkSpec(override, { root })).toContain(
      "--uipack-token-request belongs to the diagrams family: a spec that uses it may not set it",
    );
    expect(checkSpec("# No frontmatter", { root })).toEqual(["no frontmatter: start with the template's --- block"]);
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
