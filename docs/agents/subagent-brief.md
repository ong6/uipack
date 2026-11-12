# Subagent brief

The brief a lead gives one subagent building one page or section of a UiPack site
([multi-agent build](multi-agent-build.md)). Copy the block, fill every `<…>`, delete
nothing. A brief with an unfilled field is not ready to send.

```text
You are building one section of a website that uses UiPack. Work only in the files listed below.

INPUTS
- Site spec: <path to STYLE.md, or docs/specs/<id>.md>. Read it first. Every colour, face, radius
  and density value comes from it through var(--ui-*) roles; never write a hex or font-family.
- UiPack: node_modules/uipack (version <commit or tag>). Read node_modules/uipack/skills/uipack-page/SKILL.md
  (or uipack-diagram for a figure), then the docs it points to for this recipe.
- Page type and layout: <landing | documentation | article | deck | dashboard>, the spec's layout
  <archetype id, or custom> and its "### <Page type>" notes; section archetype <e.g. Proof, Steps, FAQ>.
- Writing style: the spec's "## Writing style" (tone, title form for this page type, density, house
  words, budgets). Core writing rules hold under it.
- Section: id <section-id>, position <n of N> on page <route>. Before it: <section-id>. After it: <section-id>.
- Facts and copy source: <path or pasted facts>. Use only these. Facts assigned to other sections: <list>; don't repeat them.
- Allowed parts: <e.g. Section, Proof, DataTable from uipack/web>. Check each prop in node_modules/uipack/dist/*.d.ts.
- Shell: the lead owns header, nav, footer, theme and page width. Render your section inside <shell file or route>.
- Breakpoints: 1440 and 390 (and <others, if the spec lists them>). Themes: light and dark. Reduced motion shows the finished state.

YOU MAY NOT
- Change tokens, faces, the spec, the shell, the section order or other sections' files.
- Add a shared component or a font. If no allowed part fits, build from roles, mark it in your report.
- Add a fact, number or name that is not in the facts source.

OUTPUTS
- Files: <exact paths you may create or change>.
- Screenshots: <section-id>-1440-light.png, -1440-dark.png, -390-light.png, -390-dark.png in <dir>,
  from a headless browser you launch yourself.
- Self-check, pasted in your final message:
  - Tier-1 grading passed: npx uipack-grade check <url> --spec <STYLE.md path> --out <dir>
    (see node_modules/uipack/docs/grading/README.md); paste the one-line result and the report path.
  - Copy against node_modules/uipack/docs/system/writing/general.md general rule 9's checklist and
    the spec's writing style.
  - No hex or font-family literal in your files; every uipack import exists.
  - At 390: no page overflow, labels readable, nothing cropped.
  - Values you needed that the spec lacks, and anything you could not do.

You must pass tier-1 grading before you hand off. If you cannot render or the grader is missing,
say so; never report a look you did not see.
```

## Filling it

- **Section id and position** come from the lead's section manifest; so do the neighbours, which
  let the subagent match spacing and avoid repeating the section before it.
- **Allowed parts** keep the page consistent: name the section archetype's component from the layout
  archetype the spec picked (e.g. [product landing](../system/layout/landing.md)) and the
  product-surface parts the facts need.
- **Facts** are a file, not a summary: the subagent copies numbers and qualifiers exactly.
- **Breakpoints and themes** default to 1440 and 390, light and dark; a spec may add more.
