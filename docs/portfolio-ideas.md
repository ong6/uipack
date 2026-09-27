# Portfolio ideas: `uipack/web` on junxiong.dev

Where the new Web UI pieces would improve the homepage repo (`junxiong-homepage`), in priority order.
Nothing here has been applied; the homepage is untouched. Based on a read-only survey of that repo on
2026-09-27. File references are relative to that repo.

## What the site has today

- Next.js 16 (Pages Router), React 18, Chakra UI. IBM Plex Sans and Mono through `next/font`.
- Warm paper page `#F3EFE7` / `#151311`, with cobalt `#234EA2` / `#9AB6FF` as the accent.
  Terracotta is kept for evidence.
- Homepage: a hero (mono `//` eyebrow, name, intro, a framed portrait tilted 1.5°, and links), then
  Selected work (Groundplane and Compoze lead cards, where Groundplane has a static "Check 01"
  preview on a hand-rolled dotted canvas), Also building, and Around the site.
- Motion: a local CSS `fade-up`, a 2px hover lift on cards, and 3D objects on `/hobbies` and
  `/contact` via `uipack/objects`. The homepage turns off the page fade.
- Rules that bind the ideas below:
  - `ui-inventory.json` plus `check-ui-ownership` require significant UI to come from UIPACK.
  - The design brief says "counts and stack strips stay off the homepage" and allows dotted
    canvases only inside technical previews.
  - In the Technical style, glow is a selection signal only.
  - The site already honours reduced motion globally.

## Prerequisite (do first)

Bump the pinned `uipack` commit to one that exports `./web`. Import `uipack/web.css` once in
`_app.js`, and add a `uipack/web` entry to `ui-inventory.json`. Map the Landing tokens to the site
rather than shipping Landing's indigo. On the element that wraps the pieces, set:

- `--web-accent` to cobalt
- `--web-bg` and `--web-surface` to the paper tokens
- `--web-ink-rgb` to the ink colour
- `--web-font-display` and `--web-font-sans` to `var(--font-sans)`
- `--web-font-mono` to `var(--font-mono)`

The components are token-driven, so this is configuration, not a fork.

## Ideas, prioritized

| # | Where | Component | Why | Avoid |
| --- | --- | --- | --- | --- |
| 1 | Homepage, Groundplane lead card preview (`components/SelectedWork.js`) | `DemoPlayer` | The card shows a static "Check 01". A 3-step demo (the agent asserts a fact → Groundplane finds no tool output behind it → the build fails, with the metric going from "1 unsupported claim" to "blocked") shows the product working, which is the thesis of principle 2. | Looping, and autoplay out of view. Keep it to one run, with a static list under reduced motion. Don't add the "Try it yourself" CTA if there is no live demo. |
| 2 | Case-study heroes: `/groundplane`, `/jobforge`, `/skillsmith` | `DemoPlayer` (full width, under the title) | Each case study explains a tool with prose and a diagram. A 10-second scripted run above the diagram is proof before explanation. Content comes from the case study and playback from UIPACK, which fits the ownership rule. | Replacing the architecture diagram. Both stay, and the demo comes first. |
| 3 | Same Groundplane card | `DotGrid` (no spotlight) inside `BackgroundFrame` | Replaces the hand-rolled `radial-gradient` canvas (`SelectedWork.js:66-80`) with the owned primitive. Same look, one owner, radial fade for free. The brief allows dotted canvases inside technical previews. | `spotlight`: a pointer glow on a card reads as selection in the Technical style. |
| 4 | `Section` / `Articles` fade-up (`styles/globals.css:46-57`) | `Reveal variant="up"` | Retires the local keyframe and staggers the four "Also building" cards on first view. It only runs below the fold, so the hero stays instant (the homepage already skips the page fade). | The `blur` variant: a blur-in on Plex body text looks soft, not crisp. Never apply it to the hero. |
| 5 | Theme toggle (`components/ThemeToggleButton.js`) | `withViewTransition` | Wrap `toggleColorMode` in `withViewTransition(() => flushSync(toggle))`. Light and dark cross-fade instead of snapping. It falls back to an instant swap in Firefox and under reduced motion. Low effort, site-wide. | Custom `::view-transition` animations. The default cross-fade is enough. |
| 6 | Home hero | `GrainOverlay` at 4–5% | Quiet depth on the paper colour, so the page reads as printed stock. It's the one ambient effect for the hero viewport. | Stacking it with any other background. Anything over 6% on dark, where grain turns into dirt. |
| 7 | Case-study fact tables: `/groundplane` (12%), `/trading-engine` (mean −0.29%, 5 bp) | `NumberTicker`, for one headline figure per page | A count-up draws the eye to the single outcome that matters. Tabular figures reserve the width, and screen readers read the final value. | The homepage (the brief says no counters there). Ticking statistics such as a t-value, where counting implies progress that doesn't exist. More than one ticker per page. |
| 8 | Hero eyebrow `// JUNXIONG.DEV / SINGAPORE` | `TextScramble` (scramble, ~800ms, once) | The mono eyebrow already reads as terminal output, so resolving it once on load is a small, fitting flourish. | Scrambling the name `h1` or the intro. Replaying on every visit. |
| 9 | Long case studies (`/trading-engine/v1`–`v5`) | `ScrollTransform` on the hero diagram's key node, reused at section breaks | Chase AI's "reuse the hero asset" applied to a technical page: the same node, slightly rotated or scaled as the reader moves, marks progress through the versions. | Scroll-jacking or pinning, and any motion that changes the diagram's meaning. Show it still on mobile. |

## Deliberately not recommended

- **`Marquee` for skills or stack.** The brief keeps stack strips off the homepage, and `/resume`
  reads better as a static, scannable list.
- **`Aurora`, `BeamLines`, `SpotlightCard` or `MaskedStar` on existing pages.** They are ambient
  glow in the Landing style. In the Technical style, glow is a selection signal only. Use them only
  if a product landing page (e.g. a future Groundplane page) adopts the Landing style end to end.
- **`TiltCard` / `MagneticButton` on the project cards.** The cards already lift 2px, and the
  portrait is already tilted 1.5°, so a second tilt competes with it. Magnetic buttons suit a
  single primary CTA, and the homepage deliberately has none.
- **Anything on `/hobbies` and `/contact`.** Their 3D objects are already the star of each viewport.
