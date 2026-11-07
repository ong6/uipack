---
name: uipack-review
description: >-
  Review or grade a UiPack page, deck, figure or section before it ships or is handed off: the
  tier-1 mechanical grader, then a read against the site spec and the core rules, with findings
  by layer. Use for "review this page", "grade it", "is this on brand", "check before I ship",
  "self-check before hand-off". Not for a usability audit alone (a UX checklist), code review of
  logic, or writing the page (uipack-page).
---

# Review and grade

Paths are relative to the uipack root: `node_modules/uipack/` in a site, or a uipack clone.

The grading method lives in `docs/grading/README.md` (tier 1 mechanical, tier 2 judged pairwise,
tier 3 regression briefs and the fix ledger). Read it; it is the source for anything below.

## Tier 1: the grader (mechanical, always first)

Serve the page, then run the grader on every page you changed with the site's spec:

```text
npx uipack-grade check <url> --spec STYLE.md --out <run dir>     # in a site (needs playwright)
npm run grade -- check <url> --spec uipack --out <run dir>        # in a uipack checkout
```

A page with a figure also runs the figure check, `node node_modules/uipack/bin/uipack-figure-check.mjs <url>`
(lines through labels, labels over nodes, unlabelled connectors; the
[diagram skill](../uipack-diagram/SKILL.md), step 6), which the grader does not cover.

Exit code 0 is a pass. On a failure open `summary.md` and each finding's crop, fix the page (or
the check, with a test), and rerun. Tier 1 is a floor, not a quality score: it must pass before a
hand-off or a tier-2 review, and passing it says nothing about taste. If the grader cannot run (no
browser, no playwright), say so and do not claim a pass.

Tier 2 (judged) is never self-scored: a lead runs `grade packet` and `grade tally` with two fresh
judges ([protocol](../../docs/grading/protocol.md)). Say "tier 2 not run" when no judge has seen it.

## Reviewer read: against the spec and the rules

Without changing the files under review (unless asked), read it as a reviewer and cite the rule
for each finding; the per-page-type rubrics are in `docs/grading/rubrics/`:

| Layer | Against | Typical findings |
| --- | --- | --- |
| Style | The site's `STYLE.md` roles; [what a spec may set](../../docs/system/spec-settings.md); the [component looks](../../docs/components/README.md) it picked | Hex or `font-family` literals, a recoloured fixed look (a figure), a look the spec didn't pick, a second accent |
| Writing | The spec's `## Writing style`; the [core writing rules](../../docs/system/writing/README.md#core-and-site) and general rule 9's checklist | Off the spec's tone or title form, causal "lifted/cut", invented facts, slots over the ceiling or the spec's tighter budget, AI tells |
| Layout | The spec's `### <Page type>` and its [archetype](../../docs/system/layout/README.md#archetype-library); the [floors](../../docs/system/layout/README.md#floors-what-holds-on-every-site) | Not the spec's layout or order, no narrow form, page overflow, small tap targets, empty hero proof |
| Parts | The entry's doc and `dist/*.d.ts` | Invented props, bespoke markup where a part exists |

Report findings by severity with file and line, each with the rule it breaks and the fix. Say
which checks ran and which could not (no browser, grader missing); never report a render you did
not see.
