/**
 * Reads the values tier 1 grades against from a site's style spec (docs/specs/<id>.md in uipack,
 * or STYLE.md in a site's own repo), through the parser scripts/check-spec.ts uses, so a site
 * states its faces once. Minimums (text size, tap targets, contrast) are core rules every spec
 * extends (docs/system/style.md, spec-settings.md) and stay the defaults in spec.ts.
 */
import { frontmatter, roleRows } from "../../scripts/check-spec";
import type { SiteSpec } from "./spec";

/** The first family of a font stack, unquoted; null for a var(), a TODO or an empty cell. */
const first = (stack: string) => {
  const f = stack
    .replace(/`/g, "")
    .split(",")[0]
    .trim()
    .replace(/^["']|["']$/g, "");
  return !f || /^var\(|^TODO/i.test(f) ? null : f;
};

/** Faces named in a style spec: the first family of each `--ui-font-*` role, else the Type table's faces. */
export function facesFromStyleSpec(text: string): string[] {
  const rows = roleRows(text);
  const fromRoles = [...rows.entries()]
    .filter(([name]) => /^--ui-font-/.test(name))
    .flatMap(([, [light, dark]]) => [first(light), first(dark)])
    .filter((f): f is string => !!f);
  if (fromRoles.length) return [...new Set(fromRoles)];
  // Type table: "| Medium | Display | Text | Label |", each face cell starting with a family name before its weights.
  const type = text.split(/\n## /).find((s) => s.startsWith("Type\n")) ?? "";
  const faces = type
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*(Medium|-)/.test(l))
    .flatMap((l) => l.split("|").slice(2, -1))
    .map((cell) => /^\s*([A-Z][\w-]*(?: [A-Z][\w-]*)*)/.exec(cell)?.[1])
    .filter((f): f is string => !!f && !/^TODO/.test(f));
  return [...new Set(faces)];
}

/** The site-spec fields a style spec supplies: its id as the name, and its faces. */
export function specFromStyleDoc(text: string): Partial<SiteSpec> {
  const fm = frontmatter(text);
  if (!fm) throw new Error("not a style spec: no frontmatter (docs/specs/TEMPLATE.md)");
  const faces = facesFromStyleSpec(text);
  const name = typeof fm.spec === "string" && !/^TODO/.test(fm.spec) ? fm.spec : "site";
  return { name, faces: faces.length ? faces : null };
}
