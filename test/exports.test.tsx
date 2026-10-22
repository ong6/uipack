// @vitest-environment node
// What each package entry exports, read by the TypeScript checker (values and types, through every
// re-export), so a name a barrel forgot, or one two entries both claim, fails here and not in a consumer.
import ts from "typescript";
import { entries } from "../scripts/entries";

const program = ts.createProgram([...Object.values(entries), "src/deck/consulting/index.ts"], {
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2020,
  resolveJsonModule: true,
  skipLibCheck: true,
  noEmit: true,
});
const checker = program.getTypeChecker();
const exportsOf = (file: string) => {
  const source = program.getSourceFile(file);
  if (!source) throw new Error(`not in the program: ${file}`);
  return checker.getExportsOfModule(checker.getSymbolAtLocation(source)!).map((s) => s.name);
};

describe("package exports", () => {
  it("re-exports every consulting name from uipack/deck", () => {
    const deck = new Set(exportsOf(entries.deck));
    const consulting = exportsOf("src/deck/consulting/index.ts");
    expect(consulting.length).toBeGreaterThan(40);
    expect(consulting.filter((name) => !deck.has(name))).toEqual([]);
  });

  it("no two entries export the same name", () => {
    const owners = new Map<string, string[]>();
    for (const [entry, file] of Object.entries(entries))
      for (const name of exportsOf(file)) owners.set(name, [...(owners.get(name) ?? []), entry]);
    expect(owners.get("DeckPlayer")).toEqual(["deck"]);
    expect(owners.get("Figure")).toEqual(["index"]);
    const shared = [...owners].filter(([, by]) => by.length > 1).map(([name, by]) => `${name}: ${by.join(", ")}`);
    expect(shared).toEqual([]);
  });
});
