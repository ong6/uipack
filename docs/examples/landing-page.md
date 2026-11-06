An example landing page built with `uipack/web` in Technical: Tidy, an illustrative inbox agent,
with one goal, the product's real output in the hero, and the head and crawl files it publishes.
Read it beside the [landing recipe](../recipes/landing.md), which it follows step by step.

```uipack-demo web-sample wide
The Tidy sample page: nav, hero with the product's output, steps, mechanism figure, demo, proof, FAQ, pricing, closing band and footer, then its generated head and crawl files.
```

## How it is built

The sections in the order the page renders them, with the exports each uses (generated from
`playground/tidyFacts.ts`, which a test checks against the page):

<!-- generated:web-section-order -->
- Above the sections, the nav: `GlassNav`, `CtaButton`, `JsonLd`.

1. **Hero** (`hero`): `StarHero`, `CtaButton`, `ProductWindow`, `ItemList`
2. **Steps** (`how`): `Section`, `FeatureGrid`
3. **Mechanism** (`mechanism`): `Section`, `pipeline`
4. **Demo** (`demo`): `Section`, `DemoPlayer`
5. **Proof** (`proof`): `Section`, `Proof`, `RevealText`, `NumberTicker`
6. **FAQ** (`faq`): `FAQ`
7. **Pricing** (`pricing`): `Section`, `PricingPlans`
8. **Closing** (`closing`): `ClosingCta`

- Below them, the footer: `SiteFooter`, `Brand`.
<!-- /generated -->

Every number on the page is a fact in `tidyFacts`; a test fails on any other, so the sample can
never claim something its product facts don't support.

## What to notice

- **One goal.** "Start free" is the only filled button, in the nav, the hero and the closing band
  ([web copy, one goal](../system/writing/web.md#one-goal)).
- **The proof is the product.** The hero shows the inbox after one run instead of a decorative
  picture ([landing layout](../system/layout/landing.md#section-archetypes)).
- **Plain section heads,** each naming what the reader gets
  ([web copy, sections](../system/writing/web.md#sections)).
- **A head that answers engines:** title, description, canonical, Open Graph, JSON-LD for the
  product, its offer and the FAQ ([web discoverability](../web-discoverability.md)).

## The parts it is made of

Each part the page uses, shown alone, plus the motion pieces and backgrounds a page may add. The
numbered web rules behind them are in [Web principles](../web-principles.md).

```uipack-demo web-parts wide
The type specimen, the flashy pieces (demo player, star hero, spotlight card, reveal text), the low-key defaults, motion and backgrounds.
```
