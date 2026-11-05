import type { SlideStarterData } from "../src/presentations";

export const presentationStarters: SlideStarterData[] = [
  {
    id: "opening",
    layout: "opening",
    title: "Opening",
    description: "A short title, one line of context, and room to begin.",
    content: {
      headline: ["Slide and talk,", "planned together"],
      context: "Points on screen, cues in your notes",
    },
    speech: {
      say: "The slide is half the work.\nKeep what you'll say beside it, as cues.",
      delivery: "Pause after the title.",
      next: "What goes where",
    },
    footer: { label: "UIPACK / Presentations", page: "01 / 03" },
  },
  {
    id: "explanation",
    layout: "explanation",
    title: "Explanation",
    description: "One idea, its rule, and where each part of it goes.",
    content: {
      headline: "What goes where",
      foundation: { title: "The rule", detail: "One idea per slide" },
      applications: [
        { title: "On screen", detail: "a short title, 2–4 points" },
        { title: "Out loud", detail: "the reasoning, in your words" },
      ],
    },
    speech: {
      say: "The screen carries the structure and the numbers.\nYou say the reasoning and the example.\nThe room listens instead of reading ahead.",
      delivery: "Point to the left block first, then the two outputs.",
      next: "Three steps",
    },
    footer: { label: "UIPACK / Presentations", page: "02 / 03" },
  },
  {
    id: "system",
    layout: "system",
    title: "System",
    description: "A three-step flow and what each step produces.",
    content: {
      headline: "Three steps",
      steps: [
        { title: "Claim", detail: "what matters" },
        { title: "Slide", detail: "title and points" },
        { title: "Cues", detail: "what you add" },
      ],
      caption: "Write the point first, then the slide, then the cues",
    },
    speech: {
      say: "Start from one claim.\nThe slide shows it. Your cues carry the context and judgment.\nThe slide never becomes a document.",
      delivery: "Walk left to right, then back to the claim.",
    },
    footer: { label: "UIPACK / Presentations", page: "03 / 03" },
  },
];
