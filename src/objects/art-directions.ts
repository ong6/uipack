import { createExpandedDirection } from "./expanded-directions";
import { kineticLook, kineticWorld, sculptureTokens } from "./kinetic-sculptures";
import { cardStock, paperLook, paperWorld } from "./paper-worlds";
import { playLoop, type Tick } from "./procedural";
import type { ObjectKind } from "./scenes";

/** The authored palettes of directions 1 and 2: paper card stock, and brass, glaze and stone. */
export const directionTokens = { paper: cardStock, kinetic: sculptureTokens };

/** The kinds an art direction draws; contact has its own (contact-directions.ts). */
export type ArtKind = Exclude<ObjectKind, "contact">;

/** Reduced motion shows the pose 1.8 s into the loop. */
const REST_MS = 1800;

/**
 * Directions 1 (paper worlds: toy-theatre stages of cut card, paper-worlds.ts) and 2 (kinetic
 * sculptures: brass and ceramic mechanisms on a turned base, kinetic-sculptures.ts) are drawn here;
 * 3–5 in expanded-directions.ts.
 */
export function createArtDirection(kind: ArtKind, variant: 1 | 2 | 3 | 4 | 5) {
  if (variant >= 3) return createExpandedDirection(kind, variant as 3 | 4 | 5);
  const ticks: Tick[] = [];
  const root = variant === 1 ? paperWorld(kind, ticks) : kineticWorld(kind, ticks);
  root.userData.style = variant === 1 ? "paper-theatre" : "kinetic";
  root.userData.look = variant === 1 ? paperLook(kind) : kineticLook(0.8);
  playLoop(root, ticks, REST_MS, variant === 1 ? "paper-parallax" : "kinetic-orbit");
  return root;
}
