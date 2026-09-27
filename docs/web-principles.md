# Web principles (Landing style)

The rules behind `uipack/web`. Each has the rule, the number to hold it to, and where it came from.
The components enforce what they can; the rest is on the page author.

| Code | Source |
| --- | --- |
| **SMWD-6** | Self-Made Web Designer, [“6 EASY Tips to 10x Any Site's Design”](https://www.youtube.com/watch?v=pbhLsV-Dyho) |
| **SMWD-5** | Self-Made Web Designer, [“The Only 5 Web Design Skills That Actually Matter (2026)”](https://www.youtube.com/watch?v=vbFn0C-pvis) |
| **RN** | RoboNuggets, [“25 Tricks to Level Up Claude Design in 13 Mins”](https://www.youtube.com/watch?v=_SVU3oC4JX8) |
| **CA** | Chase AI, [“GPT 6 Astra + Blender = INSANE 3D Websites”](https://www.youtube.com/watch?v=RhGiG-yZP-c) |

## Purpose

1. **One goal per page.** One primary CTA, placed in the hero, in the nav, and again at the end: three
   placements, one action, one accent colour. Add social proof between them. `CtaButton`
   `variant="primary"` is the only thing that uses the accent fill. (SMWD-5)
2. **Show the product working.** A demo-first hero beats decoration. Flashy effects impress other
   developers; customers need proof of value. He is “not trying to impress other designers or win
   awards” (SMWD-6, 4:44), and “most designers design for looks, pro designers design for action”:
   his prettier redesign made sales drop (SMWD-5, ~12:05). `DemoPlayer` exists for this: prompt,
   visible actions, result, in under 15 seconds.

## Visual

3. **One star of the show,** derived from the product story, not stock decoration. Mask it so it never
   competes with the headline. `StarHero` fades its visual in below the copy; `StarChart` takes
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
   2.441, 3.052, 3.815rem. Large headings tighten: line-height 1.05 and −0.03em tracking at steps 5–6.
   Body line-height is 1.5. (SMWD-5)
8. **12 / 8 / 4 column grid, 8-pt spacing.** Twelve columns at ≥1024px, eight at ≥640px, four below.
   Every gap and padding is a multiple of 8. `Grid` and `GridItem span={[w, m, n]}` respond to their
   container, not the viewport. (SMWD-5)
9. **60 / 30 / 10 colour, 2–3 colours in total.** Neutral 60% (`--web-bg`), secondary 30%
   (`--web-secondary`), one accent 10% (`--web-accent`) reserved for CTAs and the star. (SMWD-5)
10. **Contrast of at least 4.5:1 for small text and 3:1 for large text,** in both themes. The unit tests compute this
    from `web.css` for 66% and 87% text on every surface. (SMWD-5)

## Process

11. **Choose the headline font first, then pair it.** Browse Fontshare, uncut.wtf and Fonts In Use; pick the
    display face that carries the brand, then a quiet text face. The library ships system stacks
    and never requests fonts; set `--web-font-display` on `.uipack-web`. (SMWD-6, RN)
12. **Make a radically different version before refining.** Two or three divergent directions first,
    then polish the winner. (SMWD-6)
13. **Start from an 80% snippet, then tune it.** 21st.dev, React Bits and Canvas UI give a working
    start; set the design system first, then adjust it with prompts. Prefer SVG over raster. Audit the result (RN's
    Impeccable pass) before shipping. (SMWD-5, RN)
14. **Motion explains change.** Each flashy piece earns its motion: typing shows input, ticks show
    work, the metric falls as it happens, the star draws once. Under `prefers-reduced-motion`, every
    piece renders its final, complete state (`DemoPlayer` lists all steps). Pointer effects stay off
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

## Components against the rules

| Component | Rules |
| --- | --- |
| `DemoPlayer` | 2, 14; Pause/Replay/step tabs at 44px, autoplay only in view |
| `StarHero`, `StarChart`, `NoiseLayer` | 3, 5, 6 |
| `SpotlightCard` | 14; off for `hover: none` and reduced motion; keyboard focus shows it |
| `RevealText` | 14; text stays in the DOM, visible without JavaScript |
| `Eyebrow`, `Heading`, `Subhead`, `Body` | 6, 7 |
| `CtaButton`, `GlassNav` | 1, 5, 9 |
| `Section`, `FeatureGrid`, `Grid`, `RhymeIcon` | 4, 8 |
| `Reveal`, `TextScramble`, `NumberTicker` | 14; final text reserves the space; screen readers get the final value |
| `Marquee` | 14, 15; Pause button, pauses on hover, focus and off screen; inert duplicate; static row under reduced motion |
| `TiltCard`, `MagneticButton` | 18 |
| `ScrollTransform`, `useScrollProgress`, `useInView` | 17; midpoint under reduced motion |
| `withViewTransition` | 14; falls back to an instant update without the API or under reduced motion |
| `withPaintTransition` | 14; same fallback; its keyframe `<style>` is removed when the transition finishes |
| `GrainOverlay`, `DotGrid`, `LineGrid`, `Aurora`, `MaskedStar`, `BeamLines`, `BackgroundFrame` | 5, 15, 16, 17 |
| `DriftingGutters` | 15, 16; fixed and page-level, hidden below `minViewport` (1280), still under reduced motion, absent in print |
