import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { ObjectLook } from "./look";
import { playLoop, TAU, vec, type Tick } from "./procedural";
import { clamp, smoothstep } from "../math";

// Contact's original procedural study (variant 3). Its Studio editions 0–2 stay in scenes.ts.
const colors = { cream: 0xf6e9ca, coral: 0xe97c5d, blue: 0x6997ad, green: 0x8bb39b, dark: 0x293f49, gold: 0xbe965c };
/** Reduced motion shows the pose 3.2 s into the loop, once the letter is in flight. */
const REST_MS = 3200;

/* ---------------------------------------------------------------- Mesh helpers */

/** Satin paint, or polished brass when `metal`. */
function addMesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0, metal = false) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: metal ? 0.28 : 0.65, metalness: metal ? 0.65 : 0.02 }),
  );
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
/** A soft toy box: edges rounded up to 0.09, never more than a quarter of a side. */
function box(parent: THREE.Object3D, width: number, height: number, depth: number, color: number, x = 0, y = 0, z = 0) {
  return addMesh(
    parent,
    new RoundedBoxGeometry(width, height, depth, 2, Math.min(0.09, width / 4, height / 4, depth / 4)),
    color,
    x,
    y,
    z,
  );
}
/** A brass rod from `from` to `to`. */
function rod(parent: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, color = colors.gold, radius = 0.018) {
  const delta = to.clone().sub(from),
    mesh = addMesh(parent, new THREE.CylinderGeometry(radius, radius, delta.length(), 12), color, 0, 0, 0, true);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(vec(0, 1), delta.normalize());
  return mesh;
}
function sphere(parent: THREE.Object3D, radius: number, color: number, x = 0, y = 0, z = 0) {
  return addMesh(parent, new THREE.SphereGeometry(radius, 24, 16), color, x, y, z);
}
/** A closed envelope with its flap drawn as a brass V on both faces. */
function envelope(parent: THREE.Object3D, color = colors.cream) {
  const letter = new THREE.Group();
  parent.add(letter);
  box(letter, 0.64, 0.43, 0.07, color);
  for (const z of [-0.041, 0.041]) {
    rod(letter, vec(-0.28, 0.17, z), vec(0, -0.025, z), colors.gold, 0.009);
    rod(letter, vec(0, -0.025, z), vec(0.28, 0.17, z), colors.gold, 0.009);
  }
  return letter;
}

/* ---------------------------------------------------------------- Cartoon (variant 3) */

/** A garden diorama: a smiling mailbox whose flag rises as a letter flies in and drops into its slot. */
function cartoonMailbox(root: THREE.Group, ticks: Tick[]) {
  const world = new THREE.Group();
  root.add(world);
  world.rotation.set(0.35, -0.38, 0);
  world.position.y = -0.57;
  box(world, 2.7, 0.28, 2.05, colors.cream, 0, -0.35);
  box(world, 2.6, 0.07, 1.95, 0xbaceac, 0, -0.17);
  for (let i = 0; i < 4; i++) box(world, 0.48, 0.045, 0.24, 0xe9d5b2, 0.22, -0.1, 0.48 + i * 0.25);
  box(world, 0.17, 0.62, 0.17, colors.cream, 0, 0.15, -0.18);
  box(world, 0.55, 0.08, 0.43, colors.coral, 0, -0.12, -0.18);
  const mailbox = new THREE.Group();
  world.add(mailbox);
  mailbox.position.set(0, 0.85, -0.18);
  box(mailbox, 1.16, 0.88, 0.87, colors.coral);
  box(mailbox, 0.99, 0.72, 0.045, colors.cream, 0, 0, 0.455);
  box(mailbox, 0.72, 0.11, 0.02, colors.dark, 0, 0.17, 0.486);
  for (const x of [-0.24, 0.24]) sphere(mailbox, 0.043, colors.dark, x, -0.1, 0.49);
  const smile = addMesh(mailbox, new THREE.TorusGeometry(0.12, 0.015, 8, 24, Math.PI), colors.coral, 0, -0.14, 0.49);
  smile.rotation.z = Math.PI;
  const flag = new THREE.Group();
  mailbox.add(flag);
  flag.position.set(0.62, -0.12, 0);
  rod(flag, vec(0, 0), vec(0, 0.78), colors.gold, 0.025);
  box(flag, 0.28, 0.2, 0.055, colors.blue, 0.12, 0.68);
  sphere(flag, 0.06, colors.gold);
  for (const [x, z, scale] of [
    [-0.98, -0.55, 0.8],
    [0.97, -0.6, 0.55],
  ]) {
    rod(world, vec(x, -0.13, z), vec(x, 0.6 * scale, z), 0xa18360, 0.045);
    sphere(world, 0.32 * scale, colors.green, x, 0.72 * scale, z).scale.y = 1.4;
    sphere(world, 0.24 * scale, 0x63937b, x + 0.13, 0.55 * scale, z);
  }
  const letter = envelope(world);
  letter.name = "arriving-letter";
  // Approach the front slot, shrink inside it, and reset only while invisible.
  ticks.push((angle) => {
    const p = angle / TAU;
    // 0 → 1 as the letter flies in (10–72% of the loop), back to 0 over the last 20% while hidden.
    const fly = p > 0.8 ? (1 - p) / 0.2 : clamp((p - 0.1) / 0.62);
    const ease = smoothstep(0, 1, fly);
    letter.position.set(-1.0 * (1 - ease), 1.02 + 0.86 * Math.sin(Math.PI * fly), 0.31 + 1.15 * (1 - ease));
    letter.rotation.set(0.12 * (1 - ease), -0.24 * (1 - ease), -0.22 * (1 - ease));
    // Grows in at 6–14% of the loop and shrinks into the slot at 70–79%.
    const scale = clamp((p - 0.06) / 0.08) * clamp((0.79 - p) / 0.09);
    letter.scale.setScalar(scale * 0.85);
    letter.visible = scale > 0;
    flag.rotation.z = -0.65 + 0.65 * Math.sin(Math.PI * clamp((p - 0.55) / 0.35));
  });
}

/** Contact variant 3, Cartoon: the little post office. */
export function createContactDirection() {
  const root = new THREE.Group(),
    ticks: Tick[] = [];
  cartoonMailbox(root, ticks);
  root.userData.look = { castShadows: true } satisfies ObjectLook;
  root.userData.style = "cartoon";
  playLoop(root, ticks, REST_MS, "letter-delivery");
  return root;
}
