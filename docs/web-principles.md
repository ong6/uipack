# Web principles

The rules behind `uipack/web`. Each has the rule, the number to hold it to, and where it came from.
The components enforce what they can; the rest is on the page author.

## Web styles

`uipack/web` renders in three styles, one value set each in `src/styles` (see
[docs/system/style.md](system/style.md)). Pick one with `<WebSurface uiStyle="…">` or a whole page with `<WebPage uiStyle="…" sections={…}>` (or
`data-ui-style` on any ancestor, set before paint by `styleBootScript()`). A swap changes tokens and
ornament slots only: the same sections in the page's own order, the same hero, boxes and reading
order (`e2e/style-swap.spec.ts`). A style's own order (`uiStyles[].prefers`) is an explicit opt-in.

| Style | Use it for | Palette | Faces | Ornaments | Own order (opt-in only) |
| --- | --- | --- | --- | --- | --- |
| **Technical** (default) | Product and project pages that should read like junxiong.dev's figures | Cyanotype: cool white `#f3f6f9`, Prussian ink `#0b2748`, one amber `#9c5700` (dark: deep Prussian `#0a2342`, `#edf3fb`, gold `#f0c45a`) | Archivo Expanded 600 headlines (the same face on slides and figure titles), Archivo text, Martian Mono labels | An engineering drawing, compact (density 0.9). Drafting-film grid behind the hero only (and on figure canvases), masked; a 7px amber dot and a mono section index before eyebrows (`01 / HOW IT WORKS`); a dimension line (hairline, end ticks at both ends) over each section's column; steps in 36px ringed detail bubbles; ink crop marks at all four corners of cards and plans; stats between 1px rules; the quote as a hairline annotation; the featured plan with a 4px amber top rule; square table cells with Prussian peaks; windows without traffic lights; figures with the full flow code (cyan main flow); square corners, 1px hairlines, no shadow, glow or grain; the headline's key phrase in ink over an amber underline (gold in dark); a Prussian primary button (gold in dark); a plain Prussian closing band with a gold button | Hero with the figure → steps as numbered rows → demo → proof → FAQ → pricing |
| **Landing** (product marketing) | When the brief is a product-marketing page that should read as considered print | Off-white stock `#efeeea`, pink screen `#f6dfe8`, plum ink `#2a1736`, fluorescent-pink spot `#ff4f9a` (text accent `#b0115b`) | Instrument Serif display from step 4, upright, with a pink off-register ghost; Plex Sans; Plex Mono in tracked caps | A two-ink riso print (density 1.12): a solid masthead nav; plum keylines over pink screens printed 6px off register; dotted internal rules; halftone screens (the hero's sun, the secondary band, the band's edge); steps as pink riso dots; the key phrase on a pink highlighter; tables with a pink head screen and the marked row solid pink; a pink sticker stamp; a solid pink closing band with a plum button; product imagery as a plum-to-pink duotone | Hero (centred, demo) → steps → mechanism → proof → FAQ → pricing |
| **Graphical** | Launches, events, campaigns: a page that should look like a poster | Bone `#f1eee6`, black ink, one signal orange `#f24a00` (text uses `#b23700`) | Anton display in caps at 1.3× the scale, Plex Sans, Plex Mono | The accent disc and a ruled band in the hero backdrop (below 720px the tick band only, so no clipped disc under the nav); giant Anton step numerals; stats between 2px ink rules; the quote as an orange poster block in caps; the featured plan with an orange offset shadow; ink-ruled table cells; the disc again as every eyebrow marker; 2px ink frames with hard 6px offset shadows; 0 radius; 2px section rules; figure flows in ink, grey and orange; an orange closing band; no glow or grain | Hero → proof (big numbers) → steps → mechanism → pricing → FAQ |

**One layout in every style (default).** `WebPage` renders `sections` in the order the page lists
them and sets `data-ui-layout="shared"`: every style gets the same order, the same hero proof and
start-edge alignment, so a swap changes the look and nothing else. Section render functions
receive `{ uiStyle, layout, defaults }`; by default `defaults` is the same for all three (`hero:
"demo"`, `align: "start"`, `steps: "cards"`). `layout="style"` opts into a style's own order and
defaults (`uiStyles[].prefers` and `.layout`, `data-ui-layout="style"`): Technical then puts the
figure in the hero and draws steps as numbered rows. Ids a style doesn't name are kept, after the
ones it does.

**Figures on a web page.** `WebSurface` (and so `WebPage`) gives figures quiet chrome: no Open
canvas and no legend with fewer than two entries, which belong to articles and docs. `Figure
chrome="full"` (or `WebSurface figureChrome="full"`) brings them back. A figure takes the page's
text and label faces, its frame (Graphical's 2px ink and hard shadow, Landing's 1px ink edge) and its
radius, and each style keeps the flow colours in its own palette.

**Closing parts.** `Proof`, `PricingPlans`, `ClosingCta`, `SiteFooter`, `Brand` and `FeatureGrid
numbered` are one layout in every style, painted through roles. Use them rather than page CSS, so
the swap keeps them in place.

**The nav at phone width.** Below 720px `GlassNav` folds its links into a menu, with the brand on
the start edge and Menu on the end edge. The page's goal stays in the bar as a compact button beside
Menu (44px touch target, 0.875rem type); only below 340px does it move into the open menu. Keep the CTA label to
about 20 characters ("Start a free trial") so brand, button and Menu share a 390px bar.

**Show the product's real output.** The largest object above the fold is the product doing its
job with real-looking rows: never an empty demo panel, a chat box for a product that is not a chat,
or an icon-in-a-box flow. The parts for it, one layout in every style and painted by the
treatment roles:

| Part | Shows |
| --- | --- |
| `ProductWindow` | A framed product view: window bar, title and status, the output, a footer fact |
| `DataTable` | Rows with mono heads, rules across every cell, inline bars (`barMax`), one marked row and a worked note |
| `ScheduleGrid` | People by days (a rota, a calendar): day-off cells, marked cells with a legend; all seven days fit at 390px |
| `FileTable` | A file's rows as the product reads them (a CSV or export) |
| `ItemList`, `RecordCard` | Records with a state (needs you, waiting, done); one record's fields |
| `WorkedExample` | The mechanism as one calculation: input, each rule with its arithmetic, each result (84 covers ÷ 14 = 6 servers) |
| `BeforeAfter` (or `Proof compare`) | A measured change as two bars to scale |
| `DemoPlayer` steps mode | No prompt on any step: no composer, the steps as a checklist, a wide result pane holding each step's `screen` (put the parts above in it). The pane is never empty; the last screen is what a still capture shows, so make it the fullest |

On a marketing page, show the mechanism with `WorkedExample` and real numbers rather than a
`pipeline` figure; when you do use a preset, boxes widen to fit their labels, `legend` takes your
own entries or `false`, and icons include `person`, `calendar`, `file`, `table`, `receipt`,
`phone` and `clock`. A working page with every block wired is in
[`examples/web-starter`](../examples/web-starter/App.tsx) (it ships in the package): copy it,
then replace the words and rows.

Shared finish rules hold in every style: one accent, glow only for selection (no style has an
ambient glow; `GrainOverlay` and `Aurora` are opt-in components), contrast of 4.5:1 for
small text in both themes (`test/style-roles.test.tsx`), the finished state under reduced motion.
Graphical avoids the generic-AI tropes on purpose: no purple, no gradient blobs, no glass, no
emoji icons, no rounded-everything; so does Landing since 2026-11-05 (label stock replaced its
cobalt, glass and soft shadows, which read as stock SaaS beside Technical; on 2026-11-05 the riso
print replaced label stock, whose cream, forest green and italic serif read as the stock
warm-editorial template).

**Performance per style** (Lighthouse 13.5 mobile, built playground, median of 3, 2026-11-04;
`/web?style=…`): Technical LCP 2.27 s, 101 KB of fonts in 5 files (before Cyanotype; now 77 KB
in 6, not yet re-measured); Landing 2.57 s, 143 KB in 7;
Graphical 2.42 s, 119 KB in 6. CLS 0 in all three. The same method on the commit before the
styles measured Landing at 2.42 s; the 0.15 s is the role layer and the two extra stylesheets on
the first view. Each style preloads only its own display face, at 720px and wider (Landing:
Instrument Serif; Graphical: Anton; Technical: Archivo Expanded).

Evidence: the first screen of `/web` in each style at 1440 and 390, both themes, is in
[`docs/styles/`](styles/) (`web-<style>-<width>-<theme>.png`), with the same deck slides in each
style (`deck-moves-<style>-<theme>.png`, `deck-consulting-<style>-<theme>.png`).

Rules 5 (grain and glass, now opt-in components), 9 (the 60/30/10, now off-white stock, the pink screen and the fluorescent spot)
and 19–21 (the three Landing faces) describe Landing. Technical and Graphical replace them with the table above; every other rule applies to all
three.

| Code | Source |
| --- | --- |
| **SMWD-6** | Self-Made Web Designer, [“6 EASY Tips to 10x Any Site's Design”](https://www.youtube.com/watch?v=pbhLsV-Dyho) |
| **SMWD-5** | Self-Made Web Designer, [“The Only 5 Web Design Skills That Actually Matter (2026)”](https://www.youtube.com/watch?v=vbFn0C-pvis) |
| **RN** | RoboNuggets, [“25 Tricks to Level Up Claude Design in 13 Mins”](https://www.youtube.com/watch?v=_SVU3oC4JX8) |
| **CA** | Chase AI, [“GPT 6 Astra + Blender = INSANE 3D Websites”](https://www.youtube.com/watch?v=RhGiG-yZP-c) |
| **GS** | Google Search Central: [AI features](https://developers.google.com/search/docs/appearance/ai-features), [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [documentation updates](https://developers.google.com/search/updates) |
| **AIC** | AI crawler operators: [OpenAI](https://platform.openai.com/docs/bots), [Anthropic](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), [Perplexity](https://docs.perplexity.ai/guides/bots), [Google-Extended](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers), [Apple](https://support.apple.com/en-us/119829), [Common Crawl](https://commoncrawl.org/ccbot) |
| **LLMS** | [llmstxt.org](https://llmstxt.org/) |
| **WD** | web.dev: [Web Vitals](https://web.dev/articles/vitals), [fonts](https://web.dev/articles/font-best-practices), [content-visibility](https://web.dev/articles/content-visibility) |

## Purpose

1. **One goal per page.** One primary CTA, placed in the hero, in the nav, and again at the end: three
   placements, one action, one accent colour. Add social proof between them. `CtaButton`
   `variant="primary"` is the only thing that uses the accent fill. The goal is the reader's next
   step; an internal approval behind the launch stays in the deck, off the page. (SMWD-5)
2. **Show the product working.** A demo-first hero beats decoration. Flashy effects impress other
   developers; customers need proof of value. He is “not trying to impress other designers or win
   awards” (SMWD-6, 4:44), and “most designers design for looks, pro designers design for action”:
   his prettier redesign made sales drop (SMWD-5, ~12:05). `DemoPlayer` exists for this: prompt,
   visible actions, result, in under 15 seconds.

## Visual

3. **One star of the show,** derived from the product story, not stock decoration. Mask it so it never
   competes with the headline. `StarHero` fades its visual in below the copy and out towards its low start, where the proof's steps and controls sit (those also sit on an opaque surface); `StarChart` takes
   `values` from your story (the example plots messages handled, 0 → 37). (SMWD-6) For a heavyweight
   star, use a `uipack/objects` 3D scene: design image concepts first, reuse the hero asset down the
   page, pause rendering off-screen, and ship a still image on mobile. (CA)
4. **Visual rhyming.** Repeat one shape motif from the star down the page. `RhymeIcon` draws feature
   icons from the hero's own curve. (SMWD-6)
5. **Quiet depth.** Noise at 6–8% opacity and glass (backdrop blur 14px, 1px hairline at 12% ink).
   Noise is inline SVG `feTurbulence`: no image file, no request. (SMWD-6)
6. **Hierarchy by opacity, not more colours.** Text at 100% / 87% / 66% of one ink colour
   (Material's high, medium, and low emphasis). (SMWD-6)

## System

7. **Type scale: 16px × 1.25 (Major Third), in rem.** Steps −1 to 6: 0.8, 1, 1.25, 1.563, 1.953,
   2.441, 3.052, 3.815rem. Large headings tighten their leading (1.02 at step 6); tracking follows
   the face (rule 20). Body line-height is 1.5. (SMWD-5)
8. **12 / 8 / 4 column grid, 8-pt spacing.** Twelve columns at ≥1024px, eight at ≥640px, four below.
   Every gap and padding is a multiple of 8. `Grid` and `GridItem span={[w, m, n]}` respond to their
   container, not the viewport. (SMWD-5)
9. **60 / 30 / 10 colour, 2–3 colours in total.** Neutral 60% (`--web-bg`), secondary 30%
   (`--web-secondary`), one accent 10% (`--web-accent`) reserved for CTAs and the star. (SMWD-5)
10. **Contrast of at least 4.5:1 for small text and 3:1 for large text,** in both themes. The unit tests compute this
    from `web.css` for 66% and 87% text on every surface. (SMWD-5)

## Process

11. **Choose the headline font first, then pair it.** Browse Fontshare, uncut.wtf and Fonts In Use; pick the
    display face that carries the brand, then a quiet text face. Landing ships one tested pairing in three
    roles (see [Type roles](#type-roles)); to use your own, set `--web-font-display` (and
    `--web-display-weight` / `--web-display-tracking`) on `.uipack-web`. (SMWD-6, RN)
12. **Make a radically different version before refining.** Two or three divergent directions first,
    then polish the winner. (SMWD-6)
13. **Start from an 80% snippet, then tune it.** 21st.dev, React Bits and Canvas UI give a working
    start; set the design system first, then adjust it with prompts. Prefer SVG over raster. Audit the result (RN's
    Impeccable pass) before shipping. (SMWD-5, RN)
14. **Motion explains change.** Each flashy piece earns its motion: typing shows input, ticks show
    work, the metric falls as it happens, the star draws once. Under `prefers-reduced-motion`, every
    piece renders its final, complete state (`DemoPlayer` lists all steps and keeps its step tabs, each showing its step's finished frame with nothing moving). The resting state is the
    finished one in every case: `DemoPlayer` paints its result first and rewinds to play only as it
    comes into view, and a figure is drawn before its entrance plays, so a capture or a reader who
    jumps past never sees an empty frame (`static` on either holds the rest). Pointer effects stay off
    on touch. Scroll reveals use IntersectionObserver and CSS; no GSAP needed. Animate only
    transform, opacity and filter, and reserve final sizes (`TextScramble` and `NumberTicker` lay the
    final text under the live one), so nothing shifts. Moving content that runs longer than 5 s
    gets a Pause control (`Marquee`). (RN, CA)

## Ambient motion and backgrounds

15. **One ambient effect per viewport.** Pick one of grain, grid, aurora, masked star or beams per
    screen and let it support the star; two moving backgrounds compete with each other and with the
    demo. Everything ambient pauses off screen (IntersectionObserver) and holds still under reduced
    motion. (SMWD-6, CA)
16. **Backgrounds sit at low contrast.** Grain 4–8% opacity, grid lines 8% ink, dots 20% ink, and the
    aurora layer capped at 28% (light) or 34% (dark) through one `--web-aurora-opacity`, so blobs
    never add up. Text above keeps 4.5:1: the unit tests blend the accent at that cap over the page
    and check 66% text on it. (SMWD-5, SMWD-6)
17. **Reuse the hero asset down the page.** Carry the star into later sections and let scroll drive a
    small transform (`ScrollTransform`, `useScrollProgress`), rather than adding new decoration. Beams
    ride grid lines the way UIPACK packets ride connectors: the same idea, rhymed. Keep listeners
    off while the element is off screen; on mobile a still image is fine. (CA, SMWD-6)
18. **Hover effects are an enhancement, never the message.** Tilt at most 5°, a magnetic pull of at most 6px,
    mouse and pen only. Touch and keyboard get an equivalent still state (focus lift, static
    highlight). In the Technical style, glow stays a selection signal. (RN)

## Type roles

19. **Three faces, one job each.** The faces are self-hosted: latin-subset woff2 files in the package's
    `fonts/` folder (`dist/fonts`, exported as `uipack/fonts/*`), each with its SIL OFL licence,
    `font-display: swap`, and no third-party request. A browser fetches a file only when a Landing
    element uses it; the whole set is 141 KB. (This rule and the next two describe Landing's faces;
    Technical's are Archivo Expanded, Archivo and Martian Mono, 77 KB, in
    [Style](system/style.md#type-roles).)

    | Role | Token | Face | Weights | Jobs |
    | --- | --- | --- | --- | --- |
    | Display | `--web-font-display` | Instrument Serif | 400 + italic (21 + 22 KB) | Headings at steps 4–6, the hero, big numbers (`NumberTicker`, the DemoPlayer metric, prices), pull quotes |
    | Text | `--web-font-text` (alias `--web-font-sans`) | IBM Plex Sans | 400 / 500 / 600 (22 + 24 + 24 KB) | Body, subheads, buttons, nav, headings at steps 0–3 |
    | Mono | `--web-font-mono` | IBM Plex Mono | 400 / 600 (15 + 16 KB) | Eyebrows, labels, step numbers, addresses, data, code, metadata |

    Why this pairing: a high-contrast editorial serif gives headlines a voice the grotesk body cannot,
    and Plex Sans and Plex Mono are already the owner's site faces. Instrument Serif's x-height
    (0.510 em) matches Plex Sans (0.516 em), so a serif headline and sans copy share a size rhythm;
    its letters are about a quarter narrower (average width 0.36 em against 0.48 em).

20. **The face is decided by size.** `Heading` steps 4–6 (39, 49, 61px; 31px and up in narrow
    containers) use the display face at its one weight (`--web-display-weight: 400`, faux bold off)
    with `--web-display-tracking: -0.01em` and leading 1.1 / 1.05 / 1.02. Steps 0–3 stay in the text
    face: a hairline serif loses its contrast below about 32px and reads as body. Text headings are
    600, except step 3 at 500 so a 31px sans heading does not outweigh a 39px serif one; their tracking
    runs −0.015em (step 3) to 0. Because the display face is narrower, steps 6 and 5 drop one step in
    narrow containers instead of two, and the hero scales between 39 and 49px with its container
    (`11.5cqi`). `typeRole(step)` and `typeMetrics(step)` return the same rule in code. Use `<em>`
    in a display headline for the one phrase that matters: the italic is a real face.

21. **Swap without a jump.** Each face has a local fallback (`Instrument Serif Fallback` on Times New
    Roman, `IBM Plex Sans Fallback` on Arial, `IBM Plex Mono Fallback` on Courier New; for Technical
    `Archivo Expanded Fallback` on Arial Bold, `Archivo Fallback` on Arial, `Martian Mono Fallback`
    on Courier New; with Liberation equivalents) scaled with `size-adjust` to the web font's average character width,
    with its ascent and descent overridden, so lines wrap in the same places before and after the
    swap. `NumberTicker` lays its count over the final value, because Instrument Serif has
    proportional figures only. Pass `face="inherit"` for a number inside a sentence. The match is
    by average width, not per string: on `/web` at 1440px the centred hero headline still re-wrapped
    on the swap (CLS 0.042), so wide layouts also preload the display face (rule 30).

The `/web` playground's type specimen compares two alternates, IBM Plex Serif 400 and Space
Grotesk 500 (−0.03em), across every Landing surface on the page. They load from `@fontsource` in the
playground only and are not in the package, and only when the toggle comes within 600px of the
viewport or takes focus, so `/web`'s first view requests the package's seven files and no others.

## Smooth scrolling

22. **Ease the wheel, keep the real scroll.** `SmoothScroll` is opt-in: render `<SmoothScroll />` once
    on a landing page, or call `useSmoothScroll(options)` or `createSmoothScroll(options)`. It
    intercepts the wheel and moves the window's real scroll position toward a target each frame
    with a time-based exponential follow: `y += (target − y) · (1 − e^(−rate·dt))`, where
    `rate = −ln(1 − lerp) · 60`. The default `lerp` is 0.1 (10% of the gap per 1/60 s at any frame
    rate; a 500px wheel settles in about a second). Because the page really scrolls, `position:
    sticky`, scroll events, IntersectionObserver, `Reveal` and `ScrollTransform` keep working. It
    has no dependencies.
    - **When it is on:** only for a fine, hovering pointer without `prefers-reduced-motion`, and it
      follows changes to either. Touch, coarse pointers and reduced motion scroll natively.
    - **When it stays native:** Ctrl/⌘ + wheel (zoom and pinch), Shift + wheel and mostly-horizontal
      deltas. It also stays native over anything that can scroll on its own, such as `overflow:
      auto` or `scroll` regions, an open `<dialog>`, a page locked by a modal, or
      `[data-smooth-scroll-prevent]`. It takes over only when the wheel's scroll chain is the page.
      DemoPlayer has no scroll region, so the page eases over it.
    - **Delta units:** `deltaMode` lines count as 40px and pages as 87.5% of the viewport, as on
      Page Down. Pixel deltas (Chrome, Safari, trackpads) pass through unchanged.
    - **Keyboard:** Space, Page Up/Down, arrows and Home/End stay native. Browsers already animate
      them and own their focus rules (inputs, buttons, scroll containers). A scroll SmoothScroll did
      not make stops the easing when it follows a scroll key or lasts three frames running (a dragged
      scrollbar, find in page). A one-off shift is carried along instead: that is the browser
      keeping content still while something above it resized (scroll anchoring, a late font).
      Grabbing a classic scrollbar or hiding the tab also stops it.
    - **Anchors:** while SmoothScroll is mounted, every same-page link is handled, whether or not
      wheel easing is on. It scrolls to the target (eased with a fine pointer, the browser's own
      smooth scroll on touch, an instant jump under reduced motion). It then updates the hash with
      `pushState`, so there is no second jump, and moves focus to the target with `tabindex="-1"`
      and `preventScroll`, so keyboard and screen-reader users continue from there. The landing
      offset is the target's `scroll-margin-top` plus the page's `scroll-padding-top`. `web.css`
      gives every `[id]` inside `.uipack-web` a `scroll-margin-top` of `var(--web-scroll-offset)`
      (5rem), which clears a sticky `GlassNav`. A `Section` with an id lands with its first line
      24px past that offset (about 40px under the nav), because its top padding tucks under the
      glass instead of leaving a 96px gap. Without JavaScript, a page with a sticky GlassNav gets
      `scroll-behavior: smooth` on `<html>` (only under `prefers-reduced-motion: no-preference`).
      SmoothScroll marks `<html data-uipack-smooth-scroll>` and sets `scroll-behavior: auto` inline
      while it eases, so the two never stack. Every nav link should point at a real section: in
      `/web`, How it works, Demo, Proof and Pricing go to `#web-how`, `#web-demo`, `#web-proof` and `#web-pricing`.
    - **API:** `scrollTo(target, { offset, duration, immediate })`, where the target is a y
      position, an element or a selector. Without `duration` it uses the follow; with it, an
      exponential-out tween of that many milliseconds. `smoothScrollTo()` uses the mounted
      instance, or the browser's own smooth scroll when none is mounted or easing is off.
      `stop()`, `enabled` and `destroy()` complete the controller. Unmounting removes every
      listener and restores the inline style.

## Discoverability

How the page is found, read and quoted by search and answer engines. The helpers and the measured
numbers are in [web discoverability](web-discoverability.md).

23. **The words are in the HTML.** Every headline, demo step, stat and answer is text in the
    server-rendered HTML, once; animation decorates it after mount. Google renders JavaScript but
    recommends server-side or pre-rendering because not all bots run it. `TextScramble` and
    `NumberTicker` render their final text once until mounted, `DemoPlayer` always carries a
    transcript of every step and its result, `Marquee` adds its loop copy after mount, and nothing
    that matters lives in canvas or `::before`. (GS)
24. **One h1, real headings, real links.** The hero title is the page's only `h1`; sections are
    `h2`, cards and questions `h3`, with no skipped level (`Heading level` 1–6, `size` separate).
    Anything that navigates is an `<a href>`. (GS)
25. **A real head.** A unique title (specific first, brand last, under about 60 characters), a
    one- or two-sentence description, an absolute canonical without view-state parameters, and
    Open Graph and Twitter tags: `pageMeta`. Put it in the server HTML; a canonical set by
    JavaScript must match the HTML one. (GS)
26. **Markup says only what the page shows.** JSON-LD describes visible content: the offer carries
    the Pricing section's price, the FAQ markup is built from the visible questions, and ratings
    appear only if real ones are on the page. Structured data is not required for AI features, and
    Google stopped showing FAQ rich results on 7 May 2026; keep the markup honest and cheap rather
    than chase rich results. (GS)
27. **Answers stand alone.** Each FAQ answer's first sentence answers the question and names the
    product instead of "it", so it reads correctly when quoted on its own. Write for people: Google
    says chunking or rewriting pages for AI is unnecessary. (GS)
28. **State a stance for every AI crawler.** robots.txt names each search, user-triggered and
    training crawler in its own group with a comment; default allow-all for marketing pages,
    search-only for original writing. A crawler obeys only the most specific group that names it,
    so private paths repeat in every group. Google-Extended does not affect Google Search or AI
    Overviews; user-triggered agents may not follow robots.txt at all. (AIC, GS)
29. **A sitemap with honest dates; llms.txt as a courtesy.** `sitemap.xml` lists the site's own
    indexable URLs with `lastmod` from real changes (Google ignores priority and changefreq).
    `llms.txt` follows llmstxt.org; Google Search does not read it, other tools may. (GS, LLMS)
30. **Fast by default: LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms.** Preload only the hero's display
    face, and only where the swap moves something (`fontPreloads({ media })`): every preload
    competes with the page's own first requests. Motion waits until it is in view. Mark sections
    below the last in-page anchor `lazyRender` (content-visibility: auto); the content stays in the
    DOM. (WD)

## Components against the rules

| Component | Rules |
| --- | --- |
| `DemoPlayer` | 2, 14, 23; Pause/Replay/step tabs at 44px; rests on the result, autoplays from the start only in view and settles back on the result if scrolled away mid-play; under reduced motion the step tabs stay (each shows its finished frame) and Pause/Replay go; `static` holds the result with no controls; transcript of every step in the HTML |
| `StarHero`, `StarChart`, `NoiseLayer` | 3, 5, 6 |
| `SpotlightCard` | 14; off for `hover: none` and reduced motion; keyboard focus shows it |
| `RevealText` | 14, 23; text stays in the DOM, visible without JavaScript; units keep their spaces |
| `Eyebrow`, `Heading`, `Subhead`, `Body` | 6, 7, 19, 20, 24; `Heading` levels 1–6 |
| `CtaButton`, `GlassNav` | 1, 5, 9; GlassNav keeps a compact CTA beside Menu on a phone (into the menu only below 340px) |
| `Proof` | 6, 23, 24; the lead number with its denominator and meter, ruled stats, a named quote with drawn marks |
| `PricingPlans` | 1, 8, 26; two or three plans fill the column, a single plan keeps a card's 36rem measure; features and an optional button per card (leave it off when the closing band holds the page's one action), the featured plan gets the accent |
| `ClosingCta` | 1, 9, 24; the third CTA on the style's band roles |
| `SiteFooter`, `Brand` | 24; the page ends on a footer; the wordmark is set in the display face |
| `Section`, `FeatureGrid`, `Grid`, `RhymeIcon` | 4, 8, 24, 30 (`Section lazyRender`); `FeatureGrid numbered` for steps |
| `Reveal`, `TextScramble`, `NumberTicker` | 14, 21, 23; final text reserves the space; screen readers get the final value; server HTML has it once |
| `SmoothScroll`, `useSmoothScroll`, `createSmoothScroll`, `smoothScrollTo` | 14, 22; off on touch and under reduced motion |
| `Marquee` | 14, 15, 23; Pause button, pauses on hover, focus and off screen; inert duplicate added after mount; static row under reduced motion |
| `TiltCard`, `MagneticButton` | 18 |
| `ScrollTransform`, `useScrollProgress`, `useInView` | 17; midpoint under reduced motion |
| `withViewTransition` | 14; falls back to an instant update without the API or under reduced motion |
| `withPaintTransition` | 14; same fallback; its keyframe `<style>` and the `theme-switching` class on `<html>` are removed when the transition finishes |
| `GrainOverlay`, `DotGrid`, `LineGrid`, `Aurora`, `MaskedStar`, `BeamLines`, `BackgroundFrame` | 5, 15, 16, 17 |
| `DriftingGutters` | 15, 16; fixed and page-level, hidden below `minViewport` (1280), still under reduced motion, absent in print |
| `FAQ` | 24, 26, 27; `h3` questions, FAQPage JSON-LD from the same items |
| `pageMeta`, `HeadTags`, `useHead`, `headTagsToHtml` | 25 |
| `JsonLd`, `jsonLd`, `organization`, `webSite`, `offer`, `softwareApplication`, `product`, `faqPage`, `breadcrumbList`, `article` | 26; safe serialisation |
| `buildCrawlFiles`, `robotsTxt`, `sitemapXml`, `llmsTxt`, `AI_CRAWLERS`, `rssFeed` | 28, 29 |
| `fontPreloads` | 21, 30 |
