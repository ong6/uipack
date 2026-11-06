---
rubric: agent-docs
version: 1
frozen: 2026-11-06
page-type: a documentation set whose reader is an agent
---

# Agent documentation rubric, version 1

Grades a documentation set that agents read in order to build with a library, here a design
system: Markdown files read by a model with a limited context, not pages read by a person. Frozen on
2026-11-06. A change to any line is version 2 in a new file; this file never changes.

Score by doing the work, not by reading the files in order. For each task brief, start from the
entry files the brief names. Open only what the links lead you to, and keep a log of every file you
opened, how much of it you read (opening only, one section, or the whole file), every wrong turn,
and every time you had to read source code because the docs did not say. Then answer the task.
Score each criterion 1 to 10 against the descriptions of 3, 6 and 9, citing log lines or quoted
words. A severe flaw caps a criterion at 4. The overall score is your judgement, not an average.

Do not score what only a human reader would notice: visual layout, live demos, screenshots, prose
style for its own sake, or how long a file is when it is headed and routed.

| Score | Means |
| --- | --- |
| 9 | A fresh agent completes every task reading only the files it was routed to, first time, without reading source code, and the result is correct |
| 6 | Every task gets done, but with detours, whole-file reads of long files, a source dive or a guess |
| 3 | An agent is misrouted, follows a stale or contradictory rule, or gives up |

## Criteria

### G1 Routing

Definition: from the entry files, the file that answers a task is a few links away, and the links
are labelled by job ("build a landing page"), not by topic ("Web").

- 3: The answer is unlinked or only findable by searching; entry files list topics with no route by job.
- 6: The route exists but takes a guess between similar links, or more than three hops.
- 9: Each task's answer is at most three labelled hops from an entry file, and every link went where its label said.

Check: for each task, list the hops from the entry file to the answer. Count the wrong turns.

### G2 Progressive disclosure

Definition: an agent can decide from a file's opening whether to read on, and can read one section
instead of the whole file. The detail is below, behind headings, so what an agent reads is
proportionate to the task.

- 3: Files open with history, code or tables and no statement of purpose; one task needs several long files read whole.
- 6: Openings state the purpose, but the values a task needs sit deep in long sections, or a short answer costs thousands of words.
- 9: Every opening says what the file is for and when to read it. The values come first, the headings name the questions they answer, and each task was answered from openings plus one or two sections.

Check: for each task, estimate the words read before you could act. Name the file that cost the most and why.

### G3 Index coverage and accuracy

Definition: an index (a file list with one-line summaries) covers every file, each summary matches
what the file holds, and every link resolves.

- 3: Files missing from the index, summaries that describe something else, dead links.
- 6: Full coverage, but some summaries are vague ("Reference") or out of date.
- 9: Every file is listed once with a summary that let you skip or pick it correctly; no dead links.

Check: pick five summaries at random and compare each with its file. Quote any that misled you.

### G4 Executable rules

Definition: rules are written so an agent can follow and check them: imperative, specific (a
number, a name, a prop), and backed by a test, a lint or a command where one exists. When two rules
apply, the docs say which one wins.

- 3: Advice ("consider", "try to", "where appropriate") with no values; rules that conflict, with no precedence.
- 6: Mostly specific, but some rules need interpretation, or their checks aren't named.
- 9: Every rule a task needed was specific and checkable, with its check named, and precedence was explicit wherever two rules met.

Check: quote the vaguest rule you met on a task, and say what you had to guess.

### G5 One source, and current

Definition: each fact is stated in one place and linked from elsewhere; no file describes a
removed feature, a renamed path or a superseded value; examples and prop names match the code.

- 3: A stale fact that would make an agent produce wrong output (a removed style, a dead entry, a wrong prop).
- 6: Facts repeated across files with small drift, or one stale path that a link check would catch.
- 9: No contradictions found; repeated facts are generated from code or linked to one source; every name you checked exists in the code.

Check: for two facts a task relied on, find every file that states them and say whether they agree.
Severe flaw: a stale or contradictory rule on a task's path caps G5 at 4.

### G6 Stop conditions and verification

Definition: the docs say when to stop and ask (a missing spec, a missing fact, a fixed value
someone wants changed), what not to do, and how to verify the result (the command, the check, the
renders).

- 3: No stop conditions; the agent would invent a missing value or ship without a check.
- 6: A verify step exists, but a stop condition a task hit was not stated, or was stated only in another file.
- 9: Every task's blocking gap had a stated stop-and-ask, and every task ended with a named check.

Check: for each task, name its blocking gap (if any) and the sentence that told you to stop, and its verification command.
