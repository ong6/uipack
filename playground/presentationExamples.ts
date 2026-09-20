import type { SlideStarterData } from "../src/presentations";

export const presentationStarters: SlideStarterData[] = [
  {
    id: "opening",
    layout: "opening",
    title: "Opening",
    description: "A clear thesis, one sentence of context, and room to begin.",
    content: {
      eyebrow: "Presentation systems",
      headline: ["Design the slide.", "Plan what you will say."],
      context: "A small system for the screen and the speaker.",
    },
    speech: {
      say: "A finished slide is only half the work. This starter keeps the spoken explanation beside the visual, so the presentation has a point before it has polish.",
      delivery: "Pause after the first sentence. Let the headline land.",
      next: "The next slide separates the visual job from the speaking job.",
    },
    footer: { label: "UIPACK / Presentations", page: "01 / 03" },
  },
  {
    id: "explanation",
    layout: "explanation",
    title: "Explanation",
    description: "One claim, its foundation, and two concrete applications.",
    content: {
      eyebrow: "The design rule",
      headline: "Separate what they see from what you say.",
      foundation: { title: "The point", detail: "One claim per slide" },
      applications: [
        { title: "On screen", detail: "The structure people need to see." },
        { title: "Out loud", detail: "The reasoning that makes it useful." },
      ],
    },
    speech: {
      say: "The screen should carry the structure, not the whole script. I keep one claim visible, then use the talk track for the reasoning and the example. That leaves the audience free to listen instead of reading ahead.",
      delivery: "Point to the left block first, then compare the two outputs.",
      next: "That division becomes a simple repeatable system.",
    },
    footer: { label: "UIPACK / Presentations", page: "02 / 03" },
  },
  {
    id: "system",
    layout: "system",
    title: "System",
    description: "A three-step flow and the decision it supports.",
    content: {
      eyebrow: "How it fits together",
      headline: "One idea, designed for two channels.",
      steps: [
        { title: "Claim", detail: "what matters" },
        { title: "Slide", detail: "what they see" },
        { title: "Speech", detail: "what you add" },
      ],
      caption: "Write the point first. Design the slide and speech around it.",
    },
    speech: {
      say: "The workflow starts with one claim. The slide makes that claim visible, while the talk track supplies context and judgment. Keeping both under the same model makes the handoff clear without turning the slide into a document.",
      delivery: "Walk left to right, then return to the claim for the final sentence.",
    },
    footer: { label: "UIPACK / Presentations", page: "03 / 03" },
  },
];
