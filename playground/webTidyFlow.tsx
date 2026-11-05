import { pipeline, type PipelineSpec } from "../src/presets";
import "../src/theme.css";
import "../src/canvas.css";

/** "How it works" as a working diagram, in the Mechanism section. */
const tidyFlow: PipelineSpec = {
  figure: {
    number: "Figure 01",
    eyebrow: "How Tidy works",
    title: "Tidy files what it can and queues drafts for you",
    caption: "Read, Sort and Act run on every thread. Drafts wait in the review queue until you approve them.",
    alt: "Left to right: Read, Sort and Act stages, then a review queue with two drafts waiting, then You, who gets three messages.",
    headingLevel: 3,
  },
  laneTitle: "Your inbox, left to right",
  stages: [
    { label: "Read", sub: "40 threads", icon: "doc", hint: "Opens every unread thread once." },
    { label: "Sort", sub: "by who · when", icon: "agent", hint: "Groups threads by sender and deadline." },
    { label: "Act", sub: "file · snooze", icon: "tool", hint: "Archives, files and snoozes what needs no reply." },
    { label: "You", sub: "3 left", icon: "user", hint: "Only what needs a person reaches you." },
  ],
  queue: { label: "Drafts", sub: "for review", icon: "queue", after: 2, depth: 3 },
};

/** The /web sample's mechanism figure, in its own section, with the page's quiet chrome. */
export default function TidyFlow() {
  return pipeline(tidyFlow, "web-tidy-flow-3");
}
