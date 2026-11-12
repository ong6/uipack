# Grading these docs for agents

How to grade UiPack's own documentation, whose reader is an agent with a limited context, not a
person on the docs site. Use it after any change to `docs/`, `skills/`, `AGENTS.md`, `README.md`
or `llms.txt`. The [docs rubric](rubrics/docs-v1.md) is a different job: it grades a documentation
*page built with UiPack* for a human reader.

| Tier | What | Run | Gate |
| --- | --- | --- | --- |
| 1 Mechanical | Reach (at most 3 link hops from `README.md` or `AGENTS.md`), an opening paragraph in prose that says what the file is for (`OPENING_LIMIT`), no long stretch of prose without a heading (`SECTION_LIMIT`); the limits are constants in the script; plus the docs-site checks (every file indexed, links resolve, `llms.txt` and generated blocks current) | `npx tsx scripts/check-agent-docs.ts` and `npx vitest run test/agent-docs.test.tsx test/docs-manifest.test.tsx` | Exit code 0 |
| 2 Task-based | A fresh agent does the four frozen tasks from the entry files, logging what it opened and read, then scores the [agent-docs rubric](rubrics/agent-docs-v1.md) | One fresh subagent per round (below) | Every task correct; scores reported with the log |
| 3 Regression | The same four [task briefs](regression/agent-docs/) every round, at a recorded commit | The lead | Compare rounds on the same briefs only |

## Run tier 2

1. Check out the commit under test in a clean worktree. Give a fresh subagent (never the agent
   that edited the docs) the path, the rubric file and the four briefs in
   `docs/grading/regression/agent-docs/`. Tell it nothing about what changed or what score is hoped for.
2. The agent does each task from `README.md` and `AGENTS.md` only, following links, and logs every
   file it opens, how much of it it read (opening, a section, or the whole file), each wrong turn
   and each time it read source code because the docs did not say.
3. It checks its answer to each task against the brief's `mustInclude`, then scores G1 to G6, each
   with log lines or quoted words as evidence, and lists its top defects with file and line.
4. Report per task: correct or not, hops to the answer, approximate words read, wrong turns and
   source dives. Report the six scores and the overall score with the log. Never report a raw
   score alone.
5. Fix the defects at their source. A fix counts only when another fresh agent re-runs the tasks
   and the defect is gone ([fix ledger](regression.md#fix-ledger)).

## What the agent-docs rubric leaves out

Visual layout, live demos, screenshots and reading comfort are for a human reader, so the tier-2
judge does not score them; the [docs rubric](rubrics/docs-v1.md) covers those for pages that people read.
A long file is fine when its opening routes the agent and its headings let it jump; what counts
is how much an agent has to read for a task, not how many words the file has.
