import type { ObjectKind } from "./scenes";

/** Curated looks. Numeric IDs stay stable for screenshots and consumer previews. */
export type ObjectEdition = 0 | 1 | 2;
export type ObjectVariant = ObjectEdition | 3 | 4 | 5;
export const objectDirections = [
  {
    id: "studio",
    name: "Studio objects",
    description: "Product photography: one object on a seamless sweep, soft light, a low lens.",
  },
  {
    id: "paper-theatre",
    name: "Paper worlds",
    description: "Cut-card toy theatres: layered flats in a proscenium under one warm light.",
  },
  { id: "kinetic", name: "Kinetic sculptures", description: "Brass armatures and glazed ceramic turning on a slate base." },
  { id: "cartoon", name: "Cartoon worlds", description: "Floating toy islands with toon shading, by day and by night." },
  {
    id: "realistic",
    name: "Realistic close‑ups",
    description: "Low close-ups on real surfaces under grazing window light.",
  },
  { id: "abstract", name: "Abstract forms", description: "Refractive glass against bands of colour, with obsidian accents." },
] as const;
export const objectVariants: Record<ObjectKind, readonly string[]> = {
  ai: [
    "Studio · Agent laptop",
    "Paper · Thinking machine",
    "Kinetic · Neural orrery",
    "Cartoon · Night workshop",
    "Realistic · Key travel",
    "Abstract · Thought lattice",
  ],
  contact: [
    "Signature inbox",
    "Blue inbox",
    "Terracotta inbox",
    "Cartoon · Little post office",
    "Kinetic · Correspondence mobile",
  ],
  tennis: [
    "Studio · Club rally",
    "Paper · Centre court",
    "Kinetic · Racket study",
    "Cartoon · Courtside club",
    "Realistic · Match point",
    "Abstract · Elastic exchange",
  ],
  trading: [
    "Studio · Market abacus",
    "Paper · Market accordion",
    "Kinetic · Market balance",
    "Cartoon · Exchange avenue",
    "Realistic · Ticker study",
    "Abstract · Risk rhythm",
  ],
  server: [
    "Studio · Inference hardware",
    "Paper · Server city",
    "Kinetic · Hanging compute",
    "Cartoon · Cloud factory",
    "Realistic · Silicon detail",
    "Abstract · Signal stack",
  ],
  travel: [
    "Studio · Folded atlas",
    "Paper · Alpine passage",
    "Kinetic · Armillary globe",
    "Cartoon · Island express",
    "Realistic · Field compass",
    "Abstract · Passage",
  ],
  reading: [
    "Studio · Turning pages",
    "Paper · A world inside",
    "Kinetic · Suspended folio",
    "Cartoon · Reading nook",
    "Realistic · Quiet chapter",
    "Abstract · Unwritten",
  ],
};
export function chooseObjectVariant(random = Math.random, count: number = objectDirections.length): ObjectVariant {
  return Math.min(count - 1, Math.max(0, Math.floor(random() * count))) as ObjectVariant;
}

/** Original Studio editions, independent of art direction. */
export const objectEditions: Record<ObjectKind, readonly [string, string, string]> = {
  ai: ["Signature terminal", "Midnight terminal", "Warm graphite"],
  contact: ["Signature inbox", "Blue inbox", "Terracotta inbox"],
  tennis: ["Grass club", "Clay club", "Blue hardcourt"],
  trading: ["Breakout", "Pullback", "Range reversal"],
  server: ["Signature hardware", "Blue hardware", "Copper hardware"],
  travel: ["Woodland atlas", "Coastal atlas", "Desert atlas"],
  reading: ["Signature cloth", "Oxblood cloth", "Midnight cloth"],
};

export const directionSymbols = ["◒", "▱", "◎", "▧", "◉", "◇"] as const;
export function parseObjectVariant(value: string | null | undefined): ObjectVariant {
  const index = Number(value);
  return value != null && value !== "" && Number.isInteger(index) && index >= 0 && index < objectDirections.length
    ? (index as ObjectVariant)
    : 0;
}

/** Contact keeps legacy finish IDs 0–2; new authored directions use 3 and 4. */
export function objectDirectionIndex(kind: ObjectKind, variant: ObjectVariant): ObjectVariant {
  return kind === "contact" ? (variant === 3 ? 3 : variant === 4 ? 2 : 0) : variant;
}
export function normalizeObjectVariant(kind: ObjectKind, variant: ObjectVariant): ObjectVariant {
  return kind === "contact" && variant > 4 ? 0 : variant;
}

export function transferObjectVariant(from: ObjectKind, to: ObjectKind, variant: ObjectVariant): ObjectVariant {
  if (from === to) return normalizeObjectVariant(to, variant);
  const direction = objectDirectionIndex(from, variant);
  return to === "contact" ? (direction === 2 ? 4 : direction === 3 ? 3 : 0) : direction;
}
