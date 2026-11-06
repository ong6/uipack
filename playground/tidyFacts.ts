/**
 * The facts of Tidy, the illustrative product on /web. Every number the sample page or its
 * gallery says comes from here; e2e/showcase-content.spec.ts fails on any other. Adding a claim is
 * an explicit edit to this file, so it gets reviewed as a fact, not slipped in as decoration.
 */
export const tidyFacts = {
  product: "Tidy",
  category: "Inbox agent",
  /** The page's one goal, in the nav, the hero and the closing band. */
  cta: "Start free",
  address: "tidy.example/inbox",
  inbox: { before: 40, needsYou: 3, handled: 37 },
  actions: { archived: 22, filed: 9, snoozed: 2, drafted: 4 },
  price: { amount: "$8", period: "a month", trialDays: 30 },
  /** Money, durations, percentages and decimals the page may state, written without spaces. */
  claims: ["$8"] as string[],
  /** Bare counts above 12 the page may state (12 and under are also section and step indices). */
  counts: [40, 37, 22, 30] as number[],
} as const;

/**
 * The sample page's sections in the order /web renders them (`WebPage sections`), with the
 * uipack exports each is built from. docs/recipes/landing.md states this list through
 * `npm run docs:sync`; test/docs-manifest.test.tsx checks it against the page and the package.
 */
export const tidySections: readonly { id: string; name: string; parts: readonly string[] }[] = [
  { id: "hero", name: "Hero", parts: ["StarHero", "CtaButton", "ProductWindow", "ItemList"] },
  { id: "how", name: "Steps", parts: ["Section", "FeatureGrid"] },
  { id: "mechanism", name: "Mechanism", parts: ["Section", "pipeline"] },
  { id: "demo", name: "Demo", parts: ["Section", "DemoPlayer"] },
  { id: "proof", name: "Proof", parts: ["Section", "Proof", "RevealText", "NumberTicker"] },
  { id: "faq", name: "FAQ", parts: ["FAQ"] },
  { id: "pricing", name: "Pricing", parts: ["Section", "PricingPlans"] },
  { id: "closing", name: "Closing", parts: ["ClosingCta"] },
];

/** What frames the sections: the nav above them and the footer below, as /web renders them. */
export const tidyChrome = { nav: ["GlassNav", "CtaButton", "JsonLd"], footer: ["SiteFooter", "Brand"] } as const;
