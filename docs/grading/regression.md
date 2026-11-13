# Regression set

Tier 3 of [grading](README.md), the regression set and the fix ledger: rounds are comparable only when the briefs, the rubric version and the capture stay fixed. The
regression set is 3 briefs for each of 5 page types, with frozen facts, reused every round.

## The set

| Page type | Briefs |
| --- | --- |
| Landing | [1](regression/landing/brief-1.v1.json), [2](regression/landing/brief-2.v1.json), [3](regression/landing/brief-3.v1.json) |
| Documentation and article | [1](regression/docs/brief-1.v1.json), [2](regression/docs/brief-2.v1.json), [3](regression/docs/brief-3.v1.json) |
| Deck slide | [1](regression/deck/brief-1.v1.json), [2](regression/deck/brief-2.v1.json), [3](regression/deck/brief-3.v1.json) |
| Dashboard | [1](regression/dashboard/brief-1.v1.json), [2](regression/dashboard/brief-2.v1.json), [3](regression/dashboard/brief-3.v1.json) |
| Diagram | [1](regression/diagram/brief-1.v1.json), [2](regression/diagram/brief-2.v1.json), [3](regression/diagram/brief-3.v1.json) |
| UiPack's own docs, read by an agent ([how](agent-docs.md)) | [1](regression/agent-docs/brief-1.v2.json) (v2 since 2026-11-13: Blueprint is `flex`, coloured by a diagram theme), [2](regression/agent-docs/brief-2.v1.json), [3](regression/agent-docs/brief-3.v1.json), [4](regression/agent-docs/brief-4.v2.json) (v2 since 2026-11-10: dist/ is no longer committed) |

Each brief names its product, audience, task, rubric, the facts to use (and no others), what it
must include and what is out of scope. The packet builder renders it to `brief.md`. A brief is
frozen like a rubric (`FROZEN.json`); a fact that turns out wrong makes a `.v2.json`, and rounds
on v1 and v2 are not compared.

## A round

1. Build every brief in the type under test with the current library, from a clean checkout at a
   recorded commit.
2. Tier 1 on every build; a failing build is fixed or reported as failing, never judged as is.
3. Tier 2 per brief: new against the previous round's build of the same brief, with the anchor.
4. Report per type: win rate over 3 briefs times 2 judges, mean paired delta, and the anchor-relative scores.

## Fix ledger

One JSON object per line, in the run's evaluation folder (`fix-ledger.jsonl`). A fix counts only
when it lives at a commit a producer reads, the next build is shown to have used it, and someone
other than the improver checked that. `npm run grade -- ledger fix-ledger.jsonl` validates it.

| Field | Meaning |
| --- | --- |
| `id` | Unique id |
| `defect` | The judge packet and the defect it answers, in the judge's words |
| `claimedFix` | What changed, one sentence |
| `livesAt` | `{repo, path, commit}`: where a producer reads it (a commit hash; a scratch copy does not count) |
| `improver` | Who made it |
| `proof` | `{producerRun, evidence}`: the next build, and the line that shows it used the fix (an import, a version, a transcript line) |
| `checkedBy` | Who verified the proof; never the improver |
| `status` | `claimed`, `verified` or `failed` |
| `measuredOn` | Regression brief ids the next round judged |

Example: [fix-ledger.example.jsonl](fix-ledger.example.jsonl).
