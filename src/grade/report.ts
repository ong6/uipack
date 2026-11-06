/** The tier-1 report: one JSON shape for CI and agents, and a short Markdown summary for people. */
import type { CheckResult, Status } from "./rules";
import { CHECK_IDS, CHECK_TITLES, type CheckId } from "./spec";

export const REPORT_VERSION = 1;

export interface ViewReport {
  /** "1440-light", "390-dark". */
  view: string;
  viewport: { width: number; height: number; touch: boolean };
  theme: "light" | "dark";
  /** False when the dark view rendered with the light view's page colour: the theme switch did nothing. */
  themeApplied: boolean;
  bodyBackground: string;
  /** Full-page screenshot, relative to the report. */
  screenshot?: string;
  checks: CheckResult[];
  errors: string[];
}

export interface GradeReport {
  tool: "uipack-grade";
  reportVersion: number;
  url: string;
  title: string;
  spec: string;
  startedAt: string;
  durationMs: number;
  /** True when no check failed in any view: the gate. */
  passed: boolean;
  /** Per check, across views: the worst status and the views that failed. */
  summary: Record<CheckId, { status: Status; failures: number; failedViews: string[] }>;
  views: ViewReport[];
}

const RANK: Record<Status, number> = { skip: 0, pass: 1, warn: 2, fail: 3 };

export function summarise(views: ViewReport[]): Pick<GradeReport, "passed" | "summary"> {
  const summary = {} as GradeReport["summary"];
  for (const id of CHECK_IDS) {
    const results = views.map((v) => ({ view: v.view, r: v.checks.find((c) => c.id === id) })).filter((x) => x.r);
    const worst = results.reduce<Status>((w, x) => (RANK[x.r!.status] > RANK[w] ? x.r!.status : w), "skip");
    summary[id] = {
      status: worst,
      failures: results.reduce((n, x) => n + x.r!.failures, 0),
      failedViews: results.filter((x) => x.r!.status === "fail").map((x) => x.view),
    };
  }
  const errored = views.some((v) => v.errors.length && !v.checks.length);
  return { passed: !errored && Object.values(summary).every((s) => s.status !== "fail"), summary };
}

const cell = (r: CheckResult | undefined) =>
  !r ? "–" : r.status === "fail" ? `**FAIL ${r.failures}**` : r.status === "warn" ? `warn ${r.findings.length}` : r.status;

/** The Markdown summary: the verdict, a check-by-view table, then the top findings of each failing check. */
export function toMarkdown(report: GradeReport, topPerCheck = 5): string {
  const views = report.views.map((v) => v.view);
  const out: string[] = [
    `# Tier-1 grade: ${report.title || report.url}`,
    "",
    `**${report.passed ? "PASS" : "FAIL"}** · ${report.url} · spec \`${report.spec}\` · ${report.startedAt} · ${(report.durationMs / 1000).toFixed(0)}s`,
    "",
    `| Check | ${views.join(" | ")} |`,
    `|---|${views.map(() => "---").join("|")}|`,
    ...CHECK_IDS.map(
      (id) =>
        `| ${CHECK_TITLES[id]} (\`${id}\`) | ${report.views.map((v) => cell(v.checks.find((c) => c.id === id))).join(" | ")} |`,
    ),
  ];
  const notes = report.views.flatMap((v) => [
    ...(v.themeApplied || v.theme === "light"
      ? []
      : [`- ${v.view}: the dark theme did not change the page colour; it was graded as rendered.`]),
    ...v.errors.map((e) => `- ${v.view}: ${e}`),
  ]);
  if (notes.length) out.push("", "## Notes", "", ...notes);
  for (const id of CHECK_IDS) {
    if (report.summary[id].status !== "fail" && report.summary[id].status !== "warn") continue;
    out.push("", `## ${CHECK_TITLES[id]} (\`${id}\`)`, "");
    for (const v of report.views) {
      const r = v.checks.find((c) => c.id === id);
      if (!r || !r.findings.length) continue;
      out.push(`- **${v.view}**: ${r.failures} failing${r.note ? ` (${r.note})` : ""}`);
      for (const f of r.findings.slice(0, topPerCheck))
        out.push(
          `  - ${f.severity === "warn" ? "warn: " : ""}\`${f.selector}\`${f.text ? ` "${f.text.slice(0, 40)}"` : ""}: ${f.detail}${f.crop ? ` ([crop](${f.crop}))` : ""}`,
        );
      if (r.findings.length > topPerCheck) out.push(`  - … ${r.findings.length - topPerCheck} more in report.json`);
    }
  }
  return `${out.join("\n")}\n`;
}
