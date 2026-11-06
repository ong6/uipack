/**
 * Tier-2 judge packet builder. Captures (or copies) both candidates with one identical capture,
 * randomises which is A, writes one packet per judge (judge-2 sees the opposite order, judge-3 a
 * fresh random one for a tie-break) and stores the key outside every packet. The packet holds
 * only neutral file names, the brief, the frozen rubric and the judge prompt: no URL, no source
 * path, no hint of which system made what. Node only.
 */
import { createHash, randomInt } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { loadPlaywright, withQuery } from "./run";
import type { PacketKey } from "./tally";

/** The capture every candidate gets: full page, reduced motion, settled, 2x on the phone views. */
export const PACKET_VIEWS = [
  { name: "1440-light", width: 1440, height: 900, scale: 1, theme: "light" },
  { name: "1440-dark", width: 1440, height: 900, scale: 1, theme: "dark" },
  { name: "390-light", width: 390, height: 844, scale: 2, theme: "light" },
  { name: "390-dark", width: 390, height: 844, scale: 2, theme: "dark" },
] as const;

/**
 * Words that tell a judge which side is which, or that a side is the system under test. A brief or
 * a rubric containing one is rejected: the coordinator rewrites it.
 */
export const HINT_PATTERNS: RegExp[] = [
  /\bui ?pack\b/i,
  /\bours\b/i,
  /\bour (version|system|library|output)\b/i,
  /\bgeneric (version|producer|output|side|agent|build)\b/i,
  /\bbaseline (version|producer|output|side|agent|build|page)\b/i,
  /\bimprover\b/i,
  /\bproducer\b/i,
  /\bcoordinator\b/i,
  /\bsystem under test\b/i,
  /\b(new|old|previous|current) version\b/i,
  /\btarget score\b/i,
];

/** Hint words found in a text, as the matched phrases. */
export function findHints(text: string): string[] {
  return HINT_PATTERNS.flatMap((re) => text.match(re)?.[0] ?? []);
}

/** A regression-set brief (docs/grading/regression/<type>/brief-<n>.v<N>.json). */
export interface RegressionBrief {
  id: string;
  version: number;
  frozen: string;
  pageType: string;
  rubric: string;
  product: string;
  audience: string;
  task: string;
  facts: string[];
  mustInclude?: string[];
  outOfScope?: string[];
}

/** The brief as a judge and a builder read it: the task, the audience and the frozen facts. */
export function briefMarkdown(b: RegressionBrief): string {
  const list = (xs: string[] = []) => xs.map((x) => `- ${x}`).join("\n");
  return [
    `# Brief ${b.id} (version ${b.version}, frozen ${b.frozen})`,
    "",
    `**Product:** ${b.product}`,
    "",
    `**Audience:** ${b.audience}`,
    "",
    `**Task:** ${b.task}`,
    "",
    "## Facts",
    "",
    "Use only these facts; add none.",
    "",
    list(b.facts),
    ...(b.mustInclude?.length ? ["", "## Must include", "", list(b.mustInclude)] : []),
    ...(b.outOfScope?.length ? ["", "## Out of scope", "", list(b.outOfScope)] : []),
    "",
  ].join("\n");
}

/** The rubric's version from its frontmatter (`version: 1`); throws when missing. */
export function rubricVersion(text: string): string {
  const m = text.match(/^---[\s\S]*?^version:\s*["']?([\w.-]+)["']?\s*$[\s\S]*?^---/m);
  if (!m) throw new Error("the rubric has no `version:` in its frontmatter: judge only against a frozen, versioned rubric");
  return m[1];
}

/** A small seeded RNG (mulberry32) for reproducible orders in tests; crypto randomness otherwise. */
export function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** The A/B assignment for each judge: judge-2 is judge-1 reversed, judge-3 is drawn fresh. */
export function assignOrders(coin: () => boolean): PacketKey["packets"] {
  const first: { A: "a" | "b"; B: "a" | "b" } = coin() ? { A: "a", B: "b" } : { A: "b", B: "a" };
  return {
    "judge-1": first,
    "judge-2": { A: first.B, B: first.A },
    "judge-3": coin() ? { A: "a", B: "b" } : { A: "b", B: "a" },
  };
}

const sha = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");

async function capture(url: string, dir: string) {
  mkdirSync(dir, { recursive: true });
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ headless: true });
  try {
    for (const v of PACKET_VIEWS) {
      const context = await browser.newContext({
        viewport: { width: v.width, height: v.height },
        deviceScaleFactor: v.scale,
        colorScheme: v.theme,
        reducedMotion: "reduce",
        isMobile: v.width < 600,
        hasTouch: v.width < 600,
      });
      try {
        const page = await context.newPage();
        await page.goto(withQuery(url, { theme: v.theme }), { waitUntil: "load", timeout: 60_000 });
        let h = await page.evaluate<number>("document.documentElement.scrollHeight");
        for (let y = 0; y < h && y < 60000; y += 600) {
          await page.evaluate(`window.scrollTo(0, ${y})`);
          await page.waitForTimeout(150);
          h = await page.evaluate<number>("document.documentElement.scrollHeight");
        }
        await page.evaluate("window.scrollTo(0, 0)");
        await page.evaluate("document.fonts && document.fonts.ready.then(() => true)");
        await page.waitForTimeout(800);
        writeFileSync(join(dir, `${v.name}.png`), await page.screenshot({ fullPage: true, animations: "allow" }));
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

/** A candidate as `view name → PNG path`: a directory of `<view>.png` files, or a URL captured now. */
async function screens(source: string, scratch: string): Promise<Map<string, string>> {
  let dir = source;
  if (/^https?:\/\//.test(source)) {
    dir = scratch;
    await capture(source, dir);
  } else if (!existsSync(source) || !statSync(source).isDirectory())
    throw new Error(`${source}: not a URL or a directory of <view>.png screenshots`);
  const files = new Map<string, string>();
  for (const f of readdirSync(dir)) if (f.endsWith(".png")) files.set(f.replace(/\.png$/, ""), join(dir, f));
  if (!files.size) throw new Error(`${source}: no .png screenshots`);
  return files;
}

export const JUDGE_PROMPT = (version: string, hasAnchor: boolean) => `# Judge instructions

You are an independent design judge. Do not edit files or launch agents. You see two pages, A and B,
built to the same brief (brief.md)${hasAnchor ? ", and a reference page R, a known human-made page scored on the same rubric" : ""}.
Nothing here tells you who made which; do not guess, it does not matter.

1. Read brief.md, then rubric.md (version ${version}). Use the rubric unchanged.
2. Look at every screenshot: A-*.png, B-*.png${hasAnchor ? ", R-*.png" : ""} at each width and theme.
3. For each criterion, score A and B${hasAnchor ? " and R" : ""} 1-10 against the rubric's 3 / 6 / 9 descriptions, and cite the
   evidence (screenshot name and region, or quoted words). A severe flaw caps a score.
4. Decide which page better meets the brief overall: A, B or tie, and by how much (slight, clear, decisive).
   This preference is the result; the scores explain it.
5. List each page's top defects, most important first, each with where it is.

Return only JSON:
{"packet": "<this folder's name>", "rubric": "<rubric id>", "rubricVersion": "${version}",
 "criteria": [{"id": "<criterion id>", "A": n, "B": n${hasAnchor ? ', "R": n' : ""}, "evidence": {"A": "...", "B": "..."}}],
 "overall": {"A": n, "B": n${hasAnchor ? ', "R": n' : ""}},
 "preference": "A|B|tie", "margin": "slight|clear|decisive",
 "defects": {"A": ["..."], "B": ["..."]},
 "confidence": "high|medium|low, and why"}
`;

export interface PacketOptions {
  brief: string;
  rubric: string;
  a: string;
  b: string;
  anchor?: string;
  outDir: string;
  keyFile: string;
  seed?: number;
}

export async function buildPacket(o: PacketOptions): Promise<{ packets: string[]; keyFile: string }> {
  const out = resolve(o.outDir);
  const keyFile = resolve(o.keyFile);
  if (!relative(out, keyFile).startsWith(".."))
    throw new Error("the key must live outside the packet folder, where no judge reads");
  const briefSource = readFileSync(o.brief, "utf8");
  const brief = o.brief.endsWith(".json") ? briefMarkdown(JSON.parse(briefSource) as RegressionBrief) : briefSource;
  const rubric = readFileSync(o.rubric, "utf8");
  const version = rubricVersion(rubric);
  const hints = [...findHints(brief).map((h) => `brief: "${h}"`), ...findHints(rubric).map((h) => `rubric: "${h}"`)];
  if (hints.length)
    throw new Error(`the judge material names a side or the system under test; rewrite it:\n  ${hints.join("\n  ")}`);
  const scratch = join(dirname(keyFile), `.captures-${Date.now()}`);
  const src = { a: await screens(o.a, join(scratch, "a")), b: await screens(o.b, join(scratch, "b")) };
  const anchor = o.anchor ? await screens(o.anchor, join(scratch, "anchor")) : null;
  const views = [...src.a.keys()].filter((v) => src.b.has(v)).sort();
  if (!views.length) throw new Error("the two candidates share no screenshot view names");
  const rand =
    o.seed === undefined
      ? () => randomInt(2) === 1
      : (() => {
          const r = seeded(o.seed!);
          return () => r() < 0.5;
        })();
  const orders = assignOrders(rand);
  const packets: string[] = [];
  for (const [name, order] of Object.entries(orders)) {
    const dir = join(out, name);
    mkdirSync(dir, { recursive: true });
    for (const v of views) {
      copyFileSync(src[order.A].get(v)!, join(dir, `A-${v}.png`));
      copyFileSync(src[order.B].get(v)!, join(dir, `B-${v}.png`));
      if (anchor?.has(v)) copyFileSync(anchor.get(v)!, join(dir, `R-${v}.png`));
    }
    writeFileSync(join(dir, "brief.md"), brief);
    writeFileSync(join(dir, "rubric.md"), rubric);
    writeFileSync(join(dir, "judge-prompt.md"), JUDGE_PROMPT(version, !!anchor));
    packets.push(dir);
  }
  const key: PacketKey = {
    packets: orders,
    sources: { a: o.a, b: o.b, ...(o.anchor ? { anchor: o.anchor } : {}) },
    rubric: { file: basename(o.rubric), version, sha256: sha(rubric) },
    brief: { file: basename(o.brief), sha256: sha(briefSource) },
    createdAt: new Date().toISOString(),
  };
  mkdirSync(dirname(keyFile), { recursive: true });
  writeFileSync(keyFile, `${JSON.stringify(key, null, 2)}\n`);
  return { packets, keyFile };
}
