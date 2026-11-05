import type { ObjectLook } from "./look";
import { playLoop, type Tick } from "./procedural";
import type { ArtKind } from "./expanded-kit";
import { hasObjectLook } from "./variants";
import { abstract, abstractLook } from "./expanded-abstract";
import { cartoon, cartoonLook } from "./expanded-cartoon";
import { realistic, realisticLook } from "./expanded-realistic";

// Original authored studies: directions 3 (cartoon), 4 (realistic) and 5 (abstract), one file each.
// Y is up, Z faces the camera. Every tick is periodic in 2π.

/** Reduced motion shows the pose 1.8 s into the loop. */
const REST_MS = 1800;

/** Each direction's light rig, framing and shadows (src/objects/LOOK.md). A builder may refine its own per subject. */
const LOOKS: ObjectLook[] = [cartoonLook, realisticLook, abstractLook];
const STYLES = ["cartoon", "realistic", "abstract"] as const;

/** The subject in one direction; each direction builds only the subjects that list it (`objectLooks`). */
function build(kind: ArtKind, variant: 3 | 4 | 5, ticks: Tick[]) {
  if (variant === 3 && hasObjectLook(kind, 3)) return cartoon(kind, ticks);
  if (variant === 4 && hasObjectLook(kind, 4)) return realistic(kind, ticks);
  if (variant === 5 && hasObjectLook(kind, 5)) return abstract(kind, ticks);
  throw new Error(`${kind} has no ${STYLES[variant - 3]} look`);
}

export function createExpandedDirection(kind: ArtKind, variant: 3 | 4 | 5) {
  const ticks: Tick[] = [];
  const object = build(kind, variant, ticks);
  const style = STYLES[variant - 3];
  object.userData.style = style;
  object.userData.look ??= LOOKS[variant - 3];
  playLoop(object, ticks, REST_MS, `${style}-study`);
  return object;
}
