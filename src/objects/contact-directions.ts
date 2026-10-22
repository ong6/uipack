import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { playLoop, TAU, vec, type Tick } from "./procedural";

// Original procedural studies. Contact legacy variants 0–2 stay in scenes.ts.
const colors = { cream: 0xf6e9ca, coral: 0xe97c5d, blue: 0x6997ad, green: 0x8bb39b, dark: 0x293f49, gold: 0xbe965c };
/** Reduced motion shows the pose 3.2 s into the loop, once the letter is in flight. */
const REST_MS = 3200;

/* ---------------------------------------------------------------- Mesh helpers */

/** Satin paint, or polished brass when `metal`. */
function addMesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0, metal = false) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: metal ? 0.28 : 0.65, metalness: metal ? 0.65 : 0.02 }));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
/** A soft toy box: edges rounded up to 0.09, never more than a quarter of a side. */
function box(parent: THREE.Object3D, width: number, height: number, depth: number, color: number, x = 0, y = 0, z = 0) {
  return addMesh(parent, new RoundedBoxGeometry(width, height, depth, 2, Math.min(0.09, width / 4, height / 4, depth / 4)), color, x, y, z);
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
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

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
    const fly = p > 0.8 ? (1 - p) / 0.2 : clamp01((p - 0.1) / 0.62);
    const ease = fly * fly * (3 - 2 * fly);
    letter.position.set(-1.0 * (1 - ease), 1.02 + 0.86 * Math.sin(Math.PI * fly), 0.31 + 1.15 * (1 - ease));
    letter.rotation.set(0.12 * (1 - ease), -0.24 * (1 - ease), -0.22 * (1 - ease));
    // Grows in at 6–14% of the loop and shrinks into the slot at 70–79%.
    const scale = clamp01((p - 0.06) / 0.08) * clamp01((0.79 - p) / 0.09);
    letter.scale.setScalar(scale * 0.85);
    letter.visible = scale > 0;
    flag.rotation.z = -0.65 + 0.65 * Math.sin(Math.PI * clamp01((p - 0.55) / 0.35));
  });
}

/* ---------------------------------------------------------------- Kinetic (variant 4) */

/** A brass mobile of three hanging envelopes over a ceramic inbox tray, with a signal on an orbit. */
function kineticMobile(root: THREE.Group, ticks: Tick[]) {
  const ORBIT_RADIUS = 1.39;
  const HANGER_LENGTHS = [0.65, 1.05, 0.48];
  root.rotation.set(0.12, -0.2, 0);
  addMesh(root, new THREE.CylinderGeometry(0.98, 1.04, 0.16, 64), colors.dark, 0, -1.45);
  const rim = addMesh(root, new THREE.TorusGeometry(0.98, 0.022, 8, 80), colors.gold, 0, -1.36, 0, true);
  rim.rotation.x = Math.PI / 2;
  rod(root, vec(0, -1.37, -0.3), vec(0, 1.45, -0.3), colors.gold, 0.04);
  const mobile = new THREE.Group();
  root.add(mobile);
  mobile.position.set(0, 0.95, -0.3);
  rod(mobile, vec(-1.18, 0), vec(1.18, 0), colors.gold, 0.028);
  sphere(mobile, 0.09, colors.gold);
  for (let i = 0; i < 3; i++) {
    const hanger = new THREE.Group();
    mobile.add(hanger);
    hanger.position.x = (i - 1) * 0.98;
    const length = HANGER_LENGTHS[i];
    rod(hanger, vec(0, 0), vec(0, -length), colors.gold, 0.009);
    const letter = envelope(hanger, [colors.cream, colors.blue, colors.coral][i]);
    letter.position.y = -length - 0.21;
    ticks.push((angle) => {
      hanger.rotation.z = 0.085 * Math.sin(angle + i * 1.8);
      letter.rotation.y = 0.32 * Math.sin(angle + i);
    });
  }
  // Ceramic receiving tray and the brass orbit suggest many channels, one inbox.
  box(root, 1.25, 0.1, 0.78, colors.cream, 0, -1.23, 0.16);
  for (const x of [-0.59, 0.59]) box(root, 0.08, 0.18, 0.78, colors.cream, x, -1.11, 0.16);
  box(root, 1.25, 0.18, 0.08, colors.cream, 0, -1.11, -0.2);
  const orbit = new THREE.Group();
  root.add(orbit);
  orbit.rotation.set(0.85, 0.3, 0);
  orbit.position.y = -0.05;
  addMesh(orbit, new THREE.TorusGeometry(ORBIT_RADIUS, 0.012, 8, 80), colors.gold, 0, 0, 0, true);
  const signal = sphere(orbit, 0.075, colors.gold);
  ticks.push((angle) => {
    mobile.rotation.y = 0.3 + 0.38 * Math.sin(angle);
    mobile.rotation.z = 0.06 * Math.sin(angle);
    signal.position.set(ORBIT_RADIUS * Math.cos(angle), ORBIT_RADIUS * Math.sin(angle), 0);
  });
}

export function createContactDirection(variant: 3 | 4) {
  const root = new THREE.Group(),
    ticks: Tick[] = [];
  if (variant === 3) cartoonMailbox(root, ticks);
  else kineticMobile(root, ticks);
  // Cartoon spans about x ±1.6 and y -1.5…1.2 (the letter's arc included):
  // on a narrow, near-square stage, frame that instead of the shared extent.
  if (variant === 3) root.userData.narrowFrame = { halfWidth: 1.9, halfHeight: 1.5, y: -0.15 };
  root.userData.style = variant === 3 ? "cartoon" : "kinetic";
  playLoop(root, ticks, REST_MS, variant === 3 ? "letter-delivery" : "correspondence-mobile");
  return root;
}
