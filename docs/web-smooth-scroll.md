# Smooth scrolling

How `SmoothScroll` from `uipack/web` eases wheel scrolling on a landing page: when it is on, when
it stays native, how it handles keys and anchors, and its API. It is rule 22 of the
[web principles](web-principles.md).

## The rule

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

