import { pipeline, type PipelineSpec } from "../src/presets";
import "../src/theme.css";
import "../src/canvas.css";

/** "How it works" as a working diagram: the Technical style leads with it. */
const tidyFlow: PipelineSpec = {
  figure: {
    number: "Figure 01",
    eyebrow: "How Tidy works",
    title: "Forty messages go in; only three reach you",
    caption: "Tidy reads every thread, files what it can and queues drafts for you to approve; nothing is sent without you.",
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

/** The /web sample's mechanism figure, in whatever style its WebSurface sets. */
export default function TidyFlow() {
  return pipeline(tidyFlow, "web-tidy-flow");
}
