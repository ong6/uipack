import type { DeckSlide, LintOptions } from "../src/deck";
import { deckExample } from "./deckExample";

/** Example decks on /deck, picked with ?deck=<id>. Each shows one way of presenting. */
export const deckExamples: { id: string; label: string; slides: DeckSlide[]; lint?: LintOptions }[] = [
  { id: "moves", label: "Three moves", slides: deckExample, lint: { template: "deep-dive" } },
];
