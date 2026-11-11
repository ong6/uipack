// The parts bento's deck tile: the Tech talk example deck in the Deck player (uipack/deck), scaled
// into the tile as an inert picture; the deck's own page plays it.
import { DeckPlayer } from "../../src/deck";
import { deckExample } from "../deckExample";
import "../../src/theme.css";
import "../../src/deck/deck.css";

export default function DeckPreview({ theme }: { theme: "light" | "dark" }) {
  return <DeckPlayer id="landing-deck-preview" title="Tech talk" slides={deckExample} theme={theme} motion="none" />;
}
