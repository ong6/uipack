/**
 * The `uipack-grade` command. In this repo: `npm run grade -- <command>`; in a consumer: `npx uipack-grade <command>`.
 *
 *   check <url> [--spec uipack|default|STYLE.md|config.json] [--out dir] [--views 1440,390] [--themes light,dark] [--no-shots]
 *   spec [file.json]                         print the resolved spec (validates the file)
 *   packet --brief b.md --rubric r.md --a <url|dir> --b <url|dir> --out dir --key key.json [--anchor <url|dir>]
 *   tally --key key.json judge-1.json judge-2.json [judge-3.json]
 *   ledger file.jsonl                        validate a fix ledger
 *
 * Exit codes: 0 pass, 1 a check or validation failed, 2 usage error.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildPacket } from "./packet";
import { gradeUrl } from "./run";
import { mergeSpec, resolveSpec, type SiteSpec } from "./spec";
import { specFromStyleDoc } from "./style-spec";
import { formatTally, tallyJudges, type JudgeVerdict, type PacketKey } from "./tally";
import { validateLedger } from "./ledger";

const USAGE = `usage: uipack-grade check <url> [--spec uipack|default|STYLE.md|config.json] [--out dir] [--views 1440,390] [--themes light,dark] [--no-shots]
       uipack-grade spec [file.json]
       uipack-grade packet --brief brief.md --rubric rubric.md --a <url|dir> --b <url|dir> --out dir --key key.json [--anchor <url|dir>] [--seed n]
       uipack-grade tally --key key.json judge-1.json judge-2.json [judge-3.json]
       uipack-grade ledger ledger.jsonl`;

function parse(argv: string[]) {
  const flags: Record<string, string | true> = {};
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) flags[a.slice(2)] = true;
      else flags[a.slice(2)] = argv[++i];
    } else rest.push(a);
  }
  return { flags, rest };
}

/** Technical's style spec, in this checkout or an installed uipack. */
const TECHNICAL = ["docs/specs/technical.md", "node_modules/uipack/docs/specs/technical.md"];

/**
 * A spec from `default`, `uipack`, a style spec (`docs/specs/<id>.md`, a site's `STYLE.md`) or a
 * grade config (JSON; its `styleSpec` path, relative to the config, supplies the faces).
 */
export function loadSpec(arg: string | true | undefined): SiteSpec {
  if (arg === undefined || arg === true || arg === "default") return resolveSpec({});
  if (arg === "uipack") {
    const doc = TECHNICAL.find((p) => existsSync(p));
    const style = doc ? specFromStyleDoc(readFileSync(doc, "utf8")) : {};
    return mergeSpec(resolveSpec({ extends: "uipack" }), style.faces ? { faces: style.faces } : {});
  }
  if (/\.md$/i.test(arg)) return mergeSpec(resolveSpec({}), specFromStyleDoc(readFileSync(arg, "utf8")));
  const config = JSON.parse(readFileSync(arg, "utf8")) as Record<string, unknown>;
  const resolved = resolveSpec(config);
  if (typeof config.styleSpec !== "string") return resolved;
  const style = specFromStyleDoc(readFileSync(join(dirname(arg), config.styleSpec), "utf8"));
  // The config's own fields win over the style spec's.
  return mergeSpec(resolved, Object.fromEntries(Object.entries(style).filter(([k]) => !(k in config))));
}

const str = (v: string | true | undefined) => (typeof v === "string" ? v : undefined);
const readJson = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;

export async function main(argv: string[]): Promise<number> {
  const [command, ...args] = argv;
  const { flags, rest } = parse(args);
  try {
    if (command === "check") {
      const url = rest[0];
      if (!url) return (console.error(USAGE), 2);
      const spec = loadSpec(flags.spec);
      const host = new URL(url);
      const out =
        str(flags.out) ?? `grade-report/${`${host.hostname}${host.pathname}`.replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "")}`;
      const report = await gradeUrl(url, spec, {
        outDir: out,
        views: str(flags.views)?.split(","),
        themes: str(flags.themes)?.split(",") as ("light" | "dark")[] | undefined,
        screenshots: !flags["no-shots"],
        log: (l) => console.error(l),
      });
      const failing = Object.entries(report.summary).filter(([, s]) => s.status === "fail");
      console.log(`${report.passed ? "PASS" : "FAIL"} ${url} (${spec.name})`);
      for (const [id, s] of failing) console.log(`  ${id}: ${s.failures} failure(s) in ${s.failedViews.join(", ")}`);
      for (const v of report.views) for (const e of v.errors) console.log(`  ${v.view}: ${e}`);
      console.log(`report: ${out}/report.json, ${out}/summary.md`);
      return report.passed ? 0 : 1;
    }
    if (command === "spec") {
      console.log(JSON.stringify(loadSpec(rest[0]), null, 2));
      return 0;
    }
    if (command === "packet") {
      const need = ["brief", "rubric", "a", "b", "out", "key"].filter((k) => !str(flags[k]));
      if (need.length) return (console.error(`missing --${need.join(", --")}\n${USAGE}`), 2);
      const res = await buildPacket({
        brief: str(flags.brief)!,
        rubric: str(flags.rubric)!,
        a: str(flags.a)!,
        b: str(flags.b)!,
        anchor: str(flags.anchor),
        outDir: str(flags.out)!,
        keyFile: str(flags.key)!,
        seed: str(flags.seed) ? Number(flags.seed) : undefined,
      });
      console.log(`packets: ${res.packets.join(", ")}\nkey (never show judges): ${res.keyFile}`);
      return 0;
    }
    if (command === "tally") {
      const key = str(flags.key);
      if (!key || rest.length < 2) return (console.error(USAGE), 2);
      const t = tallyJudges(
        readJson<PacketKey>(key),
        rest.map((p) => readJson<JudgeVerdict>(p)),
      );
      console.log(formatTally(t));
      return t.needsThirdJudge ? 1 : 0;
    }
    if (command === "ledger") {
      if (!rest[0]) return (console.error(USAGE), 2);
      const lines = readFileSync(rest[0], "utf8")
        .split("\n")
        .filter((l) => l.trim());
      const problems = validateLedger(lines.map((l) => JSON.parse(l) as unknown));
      for (const p of problems) console.log(p);
      console.log(
        problems.length ? `${problems.length} problem(s)` : `${lines.length} entr${lines.length === 1 ? "y" : "ies"} OK`,
      );
      return problems.length ? 1 : 0;
    }
    console.error(USAGE);
    return 2;
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
}
