// Shared by the procedural directions (art-, contact- and expanded-directions.ts): the loop
// clock and the vector shorthand. Each direction keeps its own mesh helpers, because their
// materials, bevels and segment counts differ on purpose.
import * as THREE from "three";

/** One part's motion at a loop angle (0..2π). Every tick is periodic in 2π, so the loop is seamless. */
export type Tick = (angle: number) => void;
export const TAU = Math.PI * 2;
/** Every procedural direction loops over the same 12 seconds. */
export const LOOP_MS = 12000;

/** A point in a model's space: Y is up, Z faces the camera. Z defaults to the model's plane. */
export const vec = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

/**
 * Wires a procedural object to the object player: `animate(time)` runs every tick at the loop
 * angle for `time` and records `phase` and the pose (0..1 through the loop). `restTime` is the
 * still frame the player shows under reduced motion.
 */
export function playLoop(object: THREE.Object3D, ticks: Tick[], restTime: number, phase: string) {
  object.userData.source = "procedural";
  object.userData.loopDuration = LOOP_MS;
  object.userData.restTime = restTime;
  object.userData.animate = (time: number) => {
    const progress = (((time % LOOP_MS) + LOOP_MS) % LOOP_MS) / LOOP_MS;
    for (const tick of ticks) tick(progress * TAU);
    object.userData.phase = phase;
    object.userData.pose = progress;
  };
}
