# UiPack skills

Agent skills for working with UiPack, one per job. They ship in the npm package, so the skill an
agent reads matches the code the site installed: `node_modules/uipack/skills/<skill>/SKILL.md`.
Each one is short and points into [`docs/`](../docs/README.md) for the substance; the docs are the
single source, the skills add the order of work.

Read [docs/agents/README.md](../docs/agents/README.md) first: the read order, where specs live, and
what is fixed for every site versus set per site.

| Skill | Job | Use for |
| --- | --- | --- |
| [`uipack-page`](uipack-page/SKILL.md) | Build a page from a recipe | A landing or product page, a docs or article page, a deck or talk, a dashboard, a 3D hero |
| [`uipack-diagram`](uipack-diagram/SKILL.md) | Draw a diagram | A system figure, flow, before/after or drill-down in the shared diagram family |
| [`uipack-copy`](uipack-copy/SKILL.md) | Write copy | Slide titles and notes, read-alone documents, web copy, labels and captions |
| [`uipack-spec`](uipack-spec/SKILL.md) | Write or update a site spec | A new site's `STYLE.md`, reusing another site's look, registering a site |
| [`uipack-review`](uipack-review/SKILL.md) | Review and grade | Tier-1 grading and a read against the spec and core rules before shipping or hand-off |

Building a whole site with several agents: [docs/agents/multi-agent-build.md](../docs/agents/multi-agent-build.md).

## Using them from another skill set

A host skill (for example a `uipack-design` router) should identify the site and its spec, pick
the job, then read the matching `SKILL.md` here from the installed package, a local clone, or
GitHub (`https://github.com/ong6/uipack/tree/main/skills`), in that order. Don't copy these files
into another repo; point at them.

## Adding or changing a skill

Keep the set small: one skill per job, merged when two would trigger on the same requests. Each
has frontmatter `name` (the folder name) and a `description` with its triggers and a "Not for"
clause, and a body that links to the docs instead of restating them. Add it to the table above.
