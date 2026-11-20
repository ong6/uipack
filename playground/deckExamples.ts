import type { ReactNode } from "react";
import type { DeckSlide, DeckTransition, LintOptions } from "../src/deck";
import type { UiStyleId } from "../src/style";
import { motionBackdrop, motionDeck } from "./motionDeck";
import { consultingDeck, consultingDeckLint } from "./consultingDeck";
import { deckExample } from "./deckExample";
import { bentoDeck } from "./bentoDeck";

/**
 * Example decks on /deck, picked with ?deck=<id>. Each shows one way of presenting. Each id has a
 * `libraryPages` entry in catalog.ts with `query: { deck: id }` (its nav label and intro);
 * test/catalog.test.ts checks the two lists match.
 */
export const deckExamples: {
  id: string;
  name: string;
  slides: DeckSlide[];
  lint?: LintOptions;
  /** The style the deck is painted in; default Technical. */
  uiStyle?: UiStyleId;
  /** The deck's ambient backdrop (DeckPlayer `backdrop`). */
  backdrop?: ReactNode;
  transition?: DeckTransition;
}[] = [
  { id: "moves", name: "Tech talk", slides: deckExample, lint: { template: "launch-demo", minutes: 8 } },
  { id: "bento", name: "Bento review", slides: bentoDeck, lint: { template: "project-update" } },
  { id: "consulting", name: "Consulting", slides: consultingDeck, lint: consultingDeckLint },
  { id: "motion", name: "Motion", slides: motionDeck, uiStyle: "motion", backdrop: motionBackdrop, transition: "push" },
];
