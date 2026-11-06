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
