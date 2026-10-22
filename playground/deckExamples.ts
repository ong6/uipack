import type { DeckSlide, LintOptions } from "../src/deck";
import { consultingDeck, consultingDeckLint } from "./consultingDeck";
import { deckExample } from "./deckExample";
import { bentoDeck } from "./bentoDeck";

/**
 * Example decks on /deck, picked with ?deck=<id>. Each shows one way of presenting. Each id has a
 * `libraryPages` entry in catalog.ts with `query: { deck: id }` (its nav label and intro);
 * test/catalog.test.ts checks the two lists match.
 */
export const deckExamples: { id: string; name: string; slides: DeckSlide[]; lint?: LintOptions }[] = [
  { id: "moves", name: "Tech talk", slides: deckExample, lint: { template: "deep-dive", minutes: 8 } },
  { id: "bento", name: "Bento review", slides: bentoDeck, lint: { template: "project-update" } },
  { id: "consulting", name: "Consulting", slides: consultingDeck, lint: consultingDeckLint },
];
