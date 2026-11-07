// @vitest-environment node
// Tiers 2 and 3: blinded packets, the tally of judge verdicts, the fix ledger, and the frozen
// rubric and regression-set files (a changed frozen file must become a new version).
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { main } from "../src/grade/cli";
import { validateLedger } from "../src/grade/ledger";
import {
  assignOrders,
  briefMarkdown,
  buildPacket,
  findHints,
  rubricVersion,
  seeded,
  type RegressionBrief,
} from "../src/grade/packet";
import { formatTally, tallyJudges, type JudgeVerdict, type PacketKey } from "../src/grade/tally";

const key: PacketKey = {
  packets: { "judge-1": { A: "b", B: "a" }, "judge-2": { A: "a", B: "b" }, "judge-3": { A: "a", B: "b" } },
  sources: { a: "prev", b: "new" },
  rubric: { file: "landing-v1.md", version: "1", sha256: "x" },
  brief: { file: "brief.md", sha256: "y" },
  createdAt: "now",
};
const verdict = (packet: string, A: number, B: number, preference: "A" | "B" | "tie", R?: number): JudgeVerdict => ({
  packet,
  rubric: "landing",
  rubricVersion: "1",
  criteria: [{ id: "clarity", A, B }],
  overall: { A, B, ...(R === undefined ? {} : { R }) },
  preference,
});

describe("tally", () => {
  it("maps blinded labels back to sources: judge-1 saw b as A, judge-2 saw a as A", () => {
    // Both judges prefer "new" (b): judge-1 says A, judge-2 says B.
    const t = tallyJudges(key, [verdict("judge-1", 8, 7, "A", 9), verdict("judge-2", 7, 8, "B", 9)]);
    expect(t.winRateB).toBe(1);
    expect(t.overallDeltas).toEqual([1, 1]);
    expect(t.criterionDeltas).toEqual({ clarity: 1 });
    expect(t.mean).toEqual({ a: 7, b: 8, anchor: 9 });
    expect(t.relativeToAnchor).toEqual({ a: -2, b: -1 });
    expect(t.preferredFirstShown).toBe(1);
    expect(t.disagreement).toBe(false);
    expect(formatTally(t)).toMatch(/Win rate of B over A: 100%/);
  });
  it("flags position bias as disagreement and asks for a third judge", () => {
    // Each judge preferred whatever it saw first: opposite sources.
    const t = tallyJudges(key, [verdict("judge-1", 8, 7, "A"), verdict("judge-2", 8, 7, "A")]);
    expect(t.preferredFirstShown).toBe(2);
    expect(t.disagreement).toBe(true);
    expect(t.needsThirdJudge).toBe(true);
    expect(t.relativeToAnchor).toBeNull();
    expect(formatTally(t)).toMatch(/absolute numbers are not interpretable/);
  });
  it("flags a 2-point split in paired deltas, settled once a third judge is in", () => {
    const two = [verdict("judge-1", 6, 6, "tie"), verdict("judge-2", 6, 8, "B")];
    expect(tallyJudges(key, two).needsThirdJudge).toBe(true);
    const three = tallyJudges(key, [...two, verdict("judge-3", 6, 7, "B")]);
    expect(three.needsThirdJudge).toBe(false);
    expect(three.winRateB).toBe(0.83);
  });
  it("reports a verdict on the wrong rubric version or an unknown packet, and a lone judge", () => {
    const t = tallyJudges(key, [{ ...verdict("judge-1", 7, 7, "tie"), rubricVersion: "2" }, verdict("judge-9", 1, 1, "tie")]);
    expect(t.problems.join("\n")).toMatch(
      /rubric version 2.*carried 1[\s\S]*unknown packet "judge-9"[\s\S]*fewer than two judges/,
    );
    expect(t.unmatched).toEqual(["judge-9"]);
    expect(t.valid).toBe(false);
  });
  it("is not a result when every verdict is dropped, or any one is, and the CLI exits 1", async () => {
    const none = tallyJudges(key, [verdict("judge-8", 7, 8, "B"), verdict("judge-9", 7, 8, "B")]);
    expect(none).toMatchObject({ judges: 0, valid: false, unmatched: ["judge-8", "judge-9"] });
    expect(formatTally(none)).toMatch(/^NOT A RESULT: 2 of 2 verdict\(s\) matched no packet/);
    expect(none.problems).toContain("no verdict matched a packet in the key: nothing was tallied");
    const ok = tallyJudges(key, [verdict("judge-1", 8, 7, "A"), verdict("judge-2", 7, 8, "B")]);
    expect(ok.valid).toBe(true);
    expect(formatTally(ok)).not.toMatch(/NOT A RESULT/);
    // The command: a key and two verdict files that name no packet in it.
    const dir = mkdtempSync(join(tmpdir(), "tally-"));
    const file = (name: string, data: unknown) => (writeFileSync(join(dir, name), JSON.stringify(data)), join(dir, name));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const args = ["tally", "--key", file("key.json", key)];
    expect(await main([...args, file("a.json", verdict("x", 7, 8, "B")), file("b.json", verdict("y", 7, 8, "B"))])).toBe(1);
    expect(log.mock.calls.flat().join("\n")).toMatch(/NOT A RESULT/);
    expect(
      await main([...args, file("c.json", verdict("judge-1", 8, 7, "A")), file("d.json", verdict("judge-2", 7, 8, "B"))]),
    ).toBe(0);
    log.mockRestore();
  });
});

describe("judge packet", () => {
  it("rejects judge material that names a side or the system under test", () => {
    expect(findHints("Compare our version with the generic producer's page")).toEqual(
      expect.arrayContaining(["our version", "generic producer"]),
    );
    expect(findHints("Built with UiPack, the previous version")).toEqual(["UiPack", "previous version"]);
    // Ordinary words stay usable: a brief may ask for a baseline number or warn against generic icons.
    expect(findHints("State the baseline and window for each number; no generic icons.")).toEqual([]);
  });
  it("reads the rubric version from its frontmatter and refuses an unversioned rubric", () => {
    expect(rubricVersion("---\nrubric: landing\nversion: 1\n---\n# x")).toBe("1");
    expect(() => rubricVersion("# no frontmatter")).toThrow(/version/);
  });
  it("gives judge-2 the opposite order of judge-1", () => {
    for (const seed of [1, 2, 3, 4]) {
      const r = seeded(seed);
      const o = assignOrders(() => r() < 0.5);
      expect(o["judge-2"]).toEqual({ A: o["judge-1"].B, B: o["judge-1"].A });
    }
  });
  it("writes blinded packets from screenshot folders and keeps the key outside them", async () => {
    const dir = mkdtempSync(join(tmpdir(), "grade-packet-"));
    for (const side of ["first-build", "second-build", "anchor"]) {
      mkdirSync(join(dir, side));
      writeFileSync(join(dir, side, "1440-light.png"), `pixels of ${side.length}`);
    }
    writeFileSync(join(dir, "brief.md"), "# Brief\nA landing page for a rota tool.");
    writeFileSync(join(dir, "rubric.md"), "---\nrubric: landing\nversion: 1\n---\n# Landing");
    const base = {
      brief: join(dir, "brief.md"),
      rubric: join(dir, "rubric.md"),
      a: join(dir, "first-build"),
      b: join(dir, "second-build"),
    };
    await expect(buildPacket({ ...base, outDir: join(dir, "out"), keyFile: join(dir, "out", "key.json") })).rejects.toThrow(
      /outside the packet/,
    );
    const res = await buildPacket({
      ...base,
      anchor: join(dir, "anchor"),
      outDir: join(dir, "out"),
      keyFile: join(dir, "key", "key.json"),
      seed: 7,
    });
    expect(res.packets.map((p) => p.split("/").pop())).toEqual(["judge-1", "judge-2", "judge-3"]);
    const files = readdirSync(res.packets[0]).sort();
    expect(files).toEqual([
      "A-1440-light.png",
      "B-1440-light.png",
      "R-1440-light.png",
      "brief.md",
      "judge-prompt.md",
      "rubric.md",
    ]);
    // No source name, path or URL reaches a judge.
    for (const p of res.packets)
      for (const f of readdirSync(p))
        expect(readFileSync(join(p, f), "utf8")).not.toMatch(/first-build|second-build|grade-packet/);
    const k = JSON.parse(readFileSync(res.keyFile, "utf8")) as PacketKey;
    expect(k.rubric.version).toBe("1");
    const A1 = readFileSync(join(res.packets[0], "A-1440-light.png"), "utf8");
    const A2 = readFileSync(join(res.packets[1], "A-1440-light.png"), "utf8");
    expect(A1).not.toBe(A2);
    expect(A1).toBe(k.packets["judge-1"].A === "a" ? "pixels of 11" : "pixels of 12");
  });
});

describe("fix ledger", () => {
  const ok = {
    id: "fix-1",
    defect: "judge-2 r3: the hero shows an empty box",
    claimedFix: "DemoPlayer settles on its finished screen under reduced motion",
    livesAt: { repo: "ong6/uipack", path: "src/web/DemoPlayer.tsx", commit: "5b7509a" },
    improver: "agent-improver-1",
    proof: { producerRun: "r4 landing brief-2", evidence: "transcript line 212 imports DemoPlayer from uipack@5b7509a" },
    checkedBy: "agent-lead",
    status: "verified",
  };
  it("accepts a verified fix with proof checked by someone else", () => expect(validateLedger([ok])).toEqual([]));
  it("refuses self-checking, scratch copies and verified fixes without proof", () => {
    expect(validateLedger([{ ...ok, checkedBy: ok.improver }])).toEqual([
      "line 1 (fix-1): checkedBy must be someone other than the improver",
    ]);
    expect(validateLedger([{ ...ok, livesAt: { repo: "scratch", path: "x", commit: "" } }])[0]).toMatch(/commit hash/);
    expect(validateLedger([{ ...ok, proof: undefined }])[0]).toMatch(/needs proof/);
    expect(validateLedger([{ ...ok, status: "claimed", proof: undefined, checkedBy: undefined }])).toEqual([]);
    expect(validateLedger([ok, ok])).toEqual(["line 2 (fix-1): duplicate id"]);
  });
  it("the sample ledger in the docs is valid", () => {
    const lines = readFileSync("docs/grading/fix-ledger.example.jsonl", "utf8").split("\n").filter(Boolean);
    expect(validateLedger(lines.map((l) => JSON.parse(l) as unknown))).toEqual([]);
  });
});

// Rubrics and regression briefs are frozen per version: FROZEN.json holds each file's hash. A change
// to a frozen file fails here; write a new version file instead (docs/grading/README.md).
describe("frozen judge material", () => {
  const frozen = JSON.parse(readFileSync("docs/grading/FROZEN.json", "utf8")) as Record<string, string>;
  const hash = (f: string) => createHash("sha256").update(readFileSync(f, "utf8").replace(/\r\n/g, "\n")).digest("hex");
  it.each(Object.keys(frozen))("%s is unchanged since it was frozen", (file) => {
    expect(existsSync(file), file).toBe(true);
    expect(hash(file), `${file} changed: copy it to a new version and freeze that instead`).toBe(frozen[file]);
  });
  it("every rubric and regression brief is frozen", () => {
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
    const material = [...walk("docs/grading/rubrics"), ...walk("docs/grading/regression")].filter((f) => /\.(md|json)$/.test(f));
    // 5 rubrics, 3 briefs for each of the 5 page types.
    expect(material.length).toBeGreaterThanOrEqual(20);
    expect(material.filter((f) => !(f in frozen))).toEqual([]);
  });
  it("every rubric names its id and version, and no judge material names a side", () => {
    for (const f of Object.keys(frozen)) {
      const text = readFileSync(f, "utf8");
      if (f.includes("/rubrics/")) expect(rubricVersion(text), f).toMatch(/^\d+$/);
      else {
        // A brief names its rubric, which exists, and renders to the Markdown a judge reads.
        const b = JSON.parse(text) as RegressionBrief;
        expect(existsSync(`docs/grading/rubrics/${b.rubric}.md`), `${f}: rubric ${b.rubric}`).toBe(true);
        expect(b.facts.length, f).toBeGreaterThanOrEqual(3);
        expect(briefMarkdown(b)).toContain(b.facts[0]);
      }
      expect(findHints(text), f).toEqual([]);
    }
  });
});
