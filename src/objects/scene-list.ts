import type { ObjectKind } from "./scenes";

/** The object scenes, in gallery order: plain data, so a catalog can list them without loading the 3D code. */
export const objectScenes: {
  id: ObjectKind;
  title: string;
  description: string;
}[] = [
  {
    id: "ai",
    title: "Agent session",
    description: "Code streams into a laptop while tool calls return a completed result.",
  },
  {
    id: "contact",
    title: "Contact inbox",
    description: "Email, chat and web signals converge into one inbox.",
  },
  {
    id: "tennis",
    title: "Tennis practice",
    description: "A ball bounces on a racket's strings beside its can, in a continuous loop.",
  },
  {
    id: "trading",
    title: "Trading journal",
    description: "A market abacus: each bar's wick and bead glide on its rod as the market scrolls. Simulation; no live data.",
  },
  {
    id: "server",
    title: "Inference study",
    description: "An inference rack hot-swaps its compute sled while its drives and links blink.",
  },
  {
    id: "travel",
    title: "Local map",
    description: "A folded atlas opens into a tent, a route draws across it and a pin marks the destination.",
  },
  {
    id: "reading",
    title: "Open book",
    description: "Layered paper, a cloth spine and a thin page curling across an open book.",
  },
];
