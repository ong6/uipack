// The committed build, loaded the way a bundler-using consumer loads it: the ESM entries and their
// CSS from dist/, nothing from src/. e2e/dist-smoke.spec.ts checks the page renders and stays quiet.
import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { agentLoop } from "../../dist/presets.js";
import { DeckPlayer, Slide } from "../../dist/deck.js";
import "../../dist/theme.css";
import "../../dist/deck.css";

createRoot(document.getElementById("figure")!).render(agentLoop());
createRoot(document.getElementById("deck")!).render(
  h(DeckPlayer, {
    id: "smoke",
    title: "Smoke deck",
    slides: [
      { id: "one", title: "First", render: () => h(Slide, null, "First slide") },
      { id: "two", title: "Second", render: () => h(Slide, null, "Second slide") },
    ],
  }),
);
