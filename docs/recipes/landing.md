# Build a landing page

How to build a product, launch or announcement page with `uipack/web`: the section order the
example page renders, the parts each section uses, and the rules it relies on. Compare your draft
with the [example landing page](../examples/landing-page.md).

## Relies on

- Words: [web and landing copy](../system/writing/web.md), on top of the
  [general writing rules](../system/writing/general.md).
- Layout: [landing layout](../system/layout/landing.md): the grid, the section archetypes, the order.
- Look: the site's spec ([Technical spec](../specs/technical.md) here); the numbered
  [web principles](../web-principles.md); [discoverability](../web-discoverability.md) for the head,
  structured data and crawl files.

## Section order

The order the example renders (`WebPage sections`, generated from `playground/tidyFacts.ts`), with
the `uipack/web` exports each section is built from (`pipeline` is from `uipack/presets`):

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

Keep the order unless the content needs another; a deviation never drops the hero's real product
output. A style's own order is opt-in ([landing layout, Order](../system/layout/landing.md#order)).

## Steps

1. **Write the goal.** One primary action, the reader's own next step. Its label goes on every
   primary `CtaButton`: the hero, the nav and `ClosingCta`.
2. **Write the hero.** What changed for the reader, with scope; the subhead says how. Put the
   product's real output in the hero (`ProductWindow` with an `ItemList` or `DataTable`, or a
   `ProductShot` for a physical product).
3. **Write each section head** in plain words naming what the reader gets; the supporting line
   carries the number, once.
4. **Show the mechanism** with a working figure (a preset such as `pipeline`), and the product's
   screens with `DemoPlayer` steps.
5. **Prove it** with `Proof`: measured facts with their baselines, a `caveat` line, a named quote.
6. **Answer objections** with `FAQ`; its text and structured data share one source.
7. **Price it** with `PricingPlans`: one plan `featured`, each button saying what its click does.
8. **Publish a head**: `pageMeta`, the JSON-LD builders and `buildCrawlFiles`.

## Before you ship

- The primary action is the only filled button in every view.
- Every number on the page is a fact you were given.
- At 390, no section overflows and paired cards share a height.
- The page reads in the author's order in every style.
