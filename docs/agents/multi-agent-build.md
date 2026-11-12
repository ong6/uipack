# Multi-agent build

How a lead agent splits a website across subagents so the result reads as one site. The lead
owns everything shared; each subagent builds one page or one section inside it. The brief each
subagent gets is the [subagent brief](subagent-brief.md).

## Roles

| The lead owns | Each subagent owns |
| --- | --- |
| The site spec (`STYLE.md`): its look, layout per page type, writing style, component looks, and any change to it | One page or one section, in the files the brief names |
| The shared shell: header, nav, footer, theme and style boot (`styleBootScript`), page width | The words and parts inside its section, from the allowed list |
| The section manifest: every page's section ids, their order and which subagent builds each | Its own screenshots and self-check |
| Integration, the review pass and the final grade | Reporting what it could not do |

One subagent per page, or per section when a page is long. Two subagents never write the same
file; the shell and the manifest are written only by the lead.

## What a subagent never decides

- **Tokens and values**: colours, faces, radii, density, spacing. They come from the spec through
  roles; a subagent that needs a missing value reports it.
- **Faces**: no new font, weight or self-hosted file.
- **New parts**: no new shared component and no bespoke copy of an existing one. If no part fits,
  it builds the section from roles, marks it, and the lead decides whether it becomes a uipack
  part ([contributing](../contributing.md)).
- **Section order** and which sections exist: that is the manifest, from the spec's layout.
- **Layout and writing style**: grid, regions, hero pattern, tone, title form and house words come
  from the spec; a subagent that finds them missing reports it.
- **The shell**: header, nav, footer, theme toggle, page width.
- **Facts**: no number, claim or name beyond the facts source in the brief.

## The lead's steps

1. **Spec.** Confirm the site has a checked spec (`scripts/check-spec.ts`) and a registry row. A
   new site starts with [starting a new website](new-website.md).
2. **Shell first.** Build and render the shared shell (nav with the one CTA, footer, theme, style
   boot) before any subagent starts, so every section lands inside the real frame.
3. **Section manifest.** List each page's sections in the order the spec's `### <Page type>` gives:
   id, position, section archetype (from the layout archetype the spec picked, e.g.
   [product landing](../system/layout/landing.md), and the page-type recipe), the facts each section
   carries, the parts allowed, the owning subagent and its files. Assign each fact to one section
   so no number repeats across the page.
4. **Brief and launch.** Fill one [brief](subagent-brief.md) per subagent from the manifest.
   Launch independent sections in parallel, within the host's concurrency limit.
5. **Integrate.** Merge each hand-off into the page in manifest order. Check: one CTA in hero,
   nav and closing band; shared heights across a row; consistent section heads and eyebrows; no
   fact twice; the hero's proof is the product's real output.
6. **Review pass.** Render the whole page at 1440 and 390, light and dark, reduced motion; run
   tier 1 yourself on the delivered page (`npx uipack-grade check <url> --spec STYLE.md`; never
   trust a pasted summary, see `docs/grading/README.md`); have two fresh judges grade it on tier 2
   if the round needs a score; then read it against the spec and core rules. Send a section back to its subagent with the
   finding and the rule, or fix shared issues yourself.

## Hand-off contract

A subagent's hand-off is complete only with all of these:

- The files it created or changed, and nothing outside its brief's file list.
- Screenshots of its section at 1440 and 390, light and dark (four images), from a browser it
  launched itself.
- Its self-check: tier-1 grading passed (the one-line result and report path), the brief's checklist ticked, and any
  value it needed but the spec lacked.
- What it could not do, stated plainly (could not render, a part missing, a fact missing).

The lead rejects a hand-off missing any of these, or one that fails tier 1.
