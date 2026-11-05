import { createExpandedDirection } from "./expanded-directions";
import { kineticLook, kineticWorld } from "./kinetic-sculptures";
import { paperLook, paperWorld } from "./paper-worlds";
import { playLoop, type Tick } from "./procedural";
import type { ObjectKind } from "./scenes";
import { hasObjectLook } from "./variants";

/** The kinds an art direction draws; contact has its own (contact-directions.ts). */
export type ArtKind = Exclude<ObjectKind, "contact">;

/** Reduced motion shows the pose 1.8 s into the loop. */
const REST_MS = 1800;

/**
 * Directions 1 (paper worlds: toy-theatre stages of cut card, paper-worlds.ts) and 2 (kinetic
 * sculptures: brass and ceramic mechanisms on a turned base, kinetic-sculptures.ts) are drawn here;
 * 3–5 in expanded-directions.ts. Each builds only the subjects that list it (`objectLooks`).
 */
export function createArtDirection(kind: ArtKind, variant: 1 | 2 | 3 | 4 | 5) {
  if (variant >= 3) return createExpandedDirection(kind, variant as 3 | 4 | 5);
  const ticks: Tick[] = [];
  let root;
  if (variant === 1 && hasObjectLook(kind, 1)) {
    root = paperWorld(kind, ticks);
    root.userData.look = paperLook(kind);
  } else if (variant === 2 && hasObjectLook(kind, 2)) {
    root = kineticWorld(kind, ticks);
    root.userData.look = kineticLook;
  } else throw new Error(`${kind} has no ${variant === 1 ? "paper" : "kinetic"} look`);
  root.userData.style = variant === 1 ? "paper-theatre" : "kinetic";
  playLoop(root, ticks, REST_MS, variant === 1 ? "paper-parallax" : "kinetic-orbit");
  return root;
}
