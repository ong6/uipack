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
  { id: "abstract", name: "Abstract forms", description: "Refractive glass against bands of colour, lit from behind at night." },
] as const;

/**
 * The looks each subject offers, best first: the single source of truth for what the player, the
 * gallery and the catalog show. A subject keeps the two or three directions that suit it (from
 * blind per-direction reviews; docs/objects.md, "Directions per subject"). Its first look is its
 * default, shown whenever a requested variant is one the subject does not have. Contact keeps its
 * original numeric IDs: 0–2 are Studio inbox editions and 3 is Cartoon.
 */
const lookTable = {
  ai: [
    [2, "Kinetic · Neural orrery"],
    [5, "Abstract · Thought lattice"],
    [3, "Cartoon · Night workshop"],
  ],
  contact: [
    [0, "Signature inbox"],
    [1, "Blue inbox"],
    [2, "Terracotta inbox"],
    [3, "Cartoon · Little post office"],
  ],
  tennis: [
    [4, "Realistic · Match point"],
    [3, "Cartoon · Courtside club"],
    [0, "Studio · Club rally"],
  ],
  trading: [
    [2, "Kinetic · Market balance"],
    [5, "Abstract · Risk rhythm"],
    [0, "Studio · Market abacus"],
  ],
  server: [
    [4, "Realistic · Hot swap"],
    [0, "Studio · Inference hardware"],
  ],
  travel: [
    [0, "Studio · Folded atlas"],
    [1, "Paper · Alpine passage"],
    [2, "Kinetic · Armillary globe"],
  ],
  reading: [
    [4, "Realistic · Quiet chapter"],
    [3, "Cartoon · Reading nook"],
    [1, "Paper · A world inside"],
  ],
} as const satisfies Record<ObjectKind, readonly (readonly [ObjectVariant, string])[]>;
type LookTable = typeof lookTable;

/** The kinds that offer variant `V`. Each direction keys its builders by it, so none is missing or extra. */
export type KindWithLook<V extends ObjectVariant> = {
  [K in ObjectKind]: V extends LookTable[K][number][0] ? K : never;
}[ObjectKind];

/** Each kind's available variants, its default first. */
export const objectLooks = Object.fromEntries(
  Object.entries(lookTable).map(([kind, looks]) => [kind, looks.map(([variant]) => variant)]),
) as unknown as Record<ObjectKind, readonly ObjectVariant[]>;

/** Each kind's look names by variant ID; only the looks it offers have one. */
export const objectVariants = Object.fromEntries(
  Object.entries(lookTable).map(([kind, looks]) => [kind, Object.fromEntries(looks)]),
) as unknown as Record<ObjectKind, Partial<Record<ObjectVariant, string>>>;

/**
 * One of the kind's looks for a random value in [0, 1), then `step` looks further on in its list
 * (Another look). Deterministic for a given `random`.
 */
export function chooseObjectVariant(kind: ObjectKind, random: () => number = Math.random, step = 0): ObjectVariant {
  const looks = objectLooks[kind];
  const first = Math.min(looks.length - 1, Math.max(0, Math.floor(random() * looks.length)));
  return looks[(first + step) % looks.length];
}

/** Original Studio editions, independent of art direction, for the kinds that offer Studio. */
export const objectEditions: Record<KindWithLook<0>, readonly [string, string, string]> = {
  contact: ["Signature inbox", "Blue inbox", "Terracotta inbox"],
  tennis: ["Grass club", "Clay club", "Blue hardcourt"],
  trading: ["Breakout", "Pullback", "Range reversal"],
  server: ["Signature hardware", "Blue hardware", "Copper hardware"],
  travel: ["Woodland atlas", "Coastal atlas", "Desert atlas"],
};

export const directionSymbols = ["◒", "▱", "◎", "▧", "◉", "◇"] as const;
/** A variant ID from a URL or attribute; anything else is 0. Pass it through `normalizeObjectVariant` for a kind. */
export function parseObjectVariant(value: string | null | undefined): ObjectVariant {
  const index = Number(value);
  return value != null && value !== "" && Number.isInteger(index) && index >= 0 && index < objectDirections.length
    ? (index as ObjectVariant)
    : 0;
}

/** Whether `kind` offers `variant`; narrows the kind for a direction's builders. */
export function hasObjectLook<V extends ObjectVariant>(kind: ObjectKind, variant: V): kind is KindWithLook<V> {
  return objectLooks[kind].includes(variant);
}

/** The shared art direction (an index into `objectDirections`) a variant draws: contact's 0–2 are Studio editions. */
export function objectDirectionIndex(kind: ObjectKind, variant: ObjectVariant): ObjectVariant {
  return kind === "contact" ? (variant === 3 ? 3 : 0) : variant;
}

/** The variant itself when the kind offers it, otherwise the kind's default (its first look). */
export function normalizeObjectVariant(kind: ObjectKind, variant: ObjectVariant): ObjectVariant {
  return hasObjectLook(kind, variant) ? variant : objectLooks[kind][0];
}

/** Carries a look to another kind: the same direction when that kind has it, otherwise its default. */
export function transferObjectVariant(from: ObjectKind, to: ObjectKind, variant: ObjectVariant): ObjectVariant {
  if (from === to) return normalizeObjectVariant(to, variant);
  const direction = objectDirectionIndex(from, normalizeObjectVariant(from, variant));
  // Contact's 1 and 2 are Studio inbox editions, not Paper and Kinetic.
  if (to === "contact") return direction === 3 ? 3 : 0;
  return normalizeObjectVariant(to, direction);
}
