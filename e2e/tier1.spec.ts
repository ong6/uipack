import { loadSpec } from "../src/grade/cli";
import { gradeUrl } from "../src/grade/run";
import { expect, test } from "./fixtures";

// Tier 1 (docs/grading/tier-1.md) on a few docs-site pages that between them hold every shared
// part a regression would hit: the shell (header, sidebar, page bar), prose and index lists, the
// figures at both widths, the /web sample and the docs layout demo. Each runs the four views
// (1440 and 390, light and dark) with the same spec as `npm run grade -- check <url> --spec uipack`,
// no screenshots. A failure names the check, view, selector and measured number.
const PAGES = ["/", "/components/diagrams", "/web", "/docs"];

for (const path of PAGES)
  test(`tier 1 passes on ${path}`, async ({ baseURL, browserName }) => {
    test.skip(browserName !== "chromium", "the grader drives its own Chromium");
    test.setTimeout(150_000);
    const report = await gradeUrl(new URL(path, baseURL).toString(), loadSpec("uipack"));
    const failing = report.views.flatMap((v) =>
      v.checks
        .filter((c) => c.status === "fail")
        .flatMap((c) =>
          c.findings.filter((f) => f.severity === "fail").map((f) => `${v.view} ${c.id}: ${f.selector} "${f.text}" ${f.detail}`),
        ),
    );
    const broken = report.views.flatMap((v) => v.errors.map((e) => `${v.view}: ${e}`));
    expect([...broken, ...failing]).toEqual([]);
    expect(report.passed).toBe(true);
  });
