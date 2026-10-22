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
    description:
      "Code streams into a laptop while tool calls return a completed result.",
  },
  {
    id: "contact",
    title: "Contact inbox",
    description: "Email, chat and web signals converge into one inbox.",
  },
  {
    id: "tennis",
    title: "Tennis practice",
    description:
      "Two players trade returns across the net in a continuous rally.",
  },
  {
    id: "trading",
    title: "Trading journal",
    description:
      "A continuously panning candlestick chart with consistent OHLC prices and volume. Simulation; no live data.",
  },
  {
    id: "server",
    title: "Inference study",
    description:
      "An exploded hardware study assembles inside a chassis outline.",
  },
  {
    id: "travel",
    title: "Local map",
    description:
      "A paper map opens and a route traces continuously to its destination.",
  },
  {
    id: "reading",
    title: "Open book",
    description:
      "Layered paper, a cloth spine and a thin page curling across an open book.",
  },
];
