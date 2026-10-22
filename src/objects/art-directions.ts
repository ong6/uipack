import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createExpandedDirection } from "./expanded-directions";
import { playLoop, TAU, vec, type Tick } from "./procedural";
import type { ObjectKind } from "./scenes";

/** Original procedural models. Coordinates are authored for the existing orthographic player. */
export const directionTokens = {
  paper: { cream: 0xffe8bd, peach: 0xe9a278, coral: 0xbe563f, blue: 0x587d91, teal: 0x366e68, ink: 0x343e51 },
  kinetic: { ivory: 0xf3e7cc, gold: 0xbc9152, dark: 0x263849, blue: 0x658b99, orange: 0xc16c46 },
};
const paper = directionTokens.paper;
const kinetic = directionTokens.kinetic;

/** The kinds an art direction draws; contact has its own (contact-directions.ts). */
export type ArtKind = Exclude<ObjectKind, "contact">;
/** Builds one kind's model into the direction's root group, pushing its motion onto `ticks`. */
type Model = (root: THREE.Group, ticks: Tick[]) => void;

/** Reduced motion shows the pose 1.8 s into the loop. */
const REST_MS = 1800;

/* ---------------------------------------------------------------- Mesh helpers */

/** Matte card, or brushed brass when `metal`. */
const material = (color: number, metal = false) =>
  new THREE.MeshStandardMaterial({ color, roughness: metal ? 0.3 : 0.87, metalness: metal ? 0.55 : 0.02 });
function addMesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0, metal = false) {
  const mesh = new THREE.Mesh(geometry, material(color, metal));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
/** A box with slightly rounded edges (at most 0.018, and never more than a quarter of a side). */
function box(parent: THREE.Object3D, width: number, height: number, depth: number, color: number, x = 0, y = 0, z = 0) {
  return addMesh(parent, new RoundedBoxGeometry(width, height, depth, 1, Math.min(0.018, width / 4, height / 4, depth / 4)), color, x, y, z);
}
function ball(parent: THREE.Object3D, radius: number, color: number, x = 0, y = 0, z = 0, metal = false) {
  return addMesh(parent, new THREE.SphereGeometry(radius, 24, 16), color, x, y, z, metal);
}
/** A flat cylinder facing the camera. */
function disc(parent: THREE.Object3D, radius: number, depth: number, color: number, x = 0, y = 0, z = 0) {
  const mesh = addMesh(parent, new THREE.CylinderGeometry(radius, radius, depth, 64), color, x, y, z);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}
function ring(parent: THREE.Object3D, radius: number, tube: number, color: number, x = 0, y = 0, z = 0, metal = false) {
  return addMesh(parent, new THREE.TorusGeometry(radius, tube, 10, 80), color, x, y, z, metal);
}
/** A cut-paper silhouette: the outline `points` (x, y) extruded `depth` towards the camera from `z`. */
function cutout(parent: THREE.Object3D, points: number[][], color: number, z = 0, depth = 0.065) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 1, steps: 1 });
  return addMesh(parent, geometry, color, 0, 0, z);
}
/** A tube through `points`. */
function curve(parent: THREE.Object3D, points: THREE.Vector3[], color: number, radius = 0.018) {
  return addMesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, radius, 6, false), color);
}
/** A straight rod from `from` to `to`. */
function rod(parent: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, color: number, radius = 0.015) {
  const delta = to.clone().sub(from);
  const mesh = addMesh(parent, new THREE.CylinderGeometry(radius, radius, delta.length(), 8), color);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  return mesh;
}

/* ---------------------------------------------------------------- Shared props */

/** A cut-paper fir: a trunk and two stacked triangles. */
function paperTree(parent: THREE.Group, x: number, y: number, z: number, scale = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, y, z);
  tree.scale.setScalar(scale);
  parent.add(tree);
  box(tree, 0.045, 0.6, 0.08, 0x7c5945, 0, 0.18);
  cutout(tree, [[-0.28, 0.24], [0, 0.91], [0.28, 0.24]], paper.teal, 0.02);
  cutout(tree, [[-0.22, 0.5], [0, 1.08], [0.22, 0.5]], 0x659585, 0.07);
  return tree;
}
/** A paper plane seen from above, nose up. */
function plane(parent: THREE.Group, color: number) {
  const craft = new THREE.Group();
  cutout(craft, [[0, 0.32], [-0.28, -0.18], [0, -0.06], [0.28, -0.18]], color, 0, 0.04);
  cutout(craft, [[0, 0.32], [-0.045, -0.23], [0.045, -0.23]], 0xfff7e5, 0.045, 0.03);
  parent.add(craft);
  return craft;
}
/** A strung racket, head up: an oval hoop (centre y 0.2), a 7 × 7 string bed, a throat and a wrapped grip. */
function racket(parent: THREE.Group, color: number, metal = false) {
  const HOOP_Y = 0.2;
  const HOOP_ASPECT = 1.25; // the hoop is a circle stretched this much in y
  const STRING_RADIUS = 0.44; // the string bed, inside the 0.47 hoop
  const STRING_COLOR = 0xb5b9ab;
  const model = new THREE.Group();
  parent.add(model);
  const hoop = ring(model, 0.47, 0.038, color, 0, HOOP_Y, 0, metal);
  hoop.scale.y = HOOP_ASPECT;
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.105,
      y = i * 0.135;
    // Half-length of the vertical string at x, and of the horizontal one at y, inside the oval.
    const halfHeight = Math.sqrt(STRING_RADIUS ** 2 - x * x) * HOOP_ASPECT;
    rod(model, vec(x, HOOP_Y - halfHeight, 0.01), vec(x, HOOP_Y + halfHeight, 0.01), STRING_COLOR, 0.006);
    const halfWidth = Math.sqrt(Math.max(0, STRING_RADIUS ** 2 - (y / HOOP_ASPECT) ** 2));
    rod(model, vec(-halfWidth, HOOP_Y + y, 0.012), vec(halfWidth, HOOP_Y + y, 0.012), STRING_COLOR, 0.006);
  }
  rod(model, vec(-0.2, -0.32), vec(0, -0.66), color, 0.023);
  rod(model, vec(0.2, -0.32), vec(0, -0.66), color, 0.023);
  box(model, 0.12, 0.47, 0.12, 0x394a4b, 0, -0.86);
  for (let i = 0; i < 6; i++) box(model, 0.127, 0.013, 0.126, 0x7b8985, 0, -0.68 - i * 0.062);
  return model;
}

/* ---------------------------------------------------------------- Paper theatre (direction 1) */

/** The stage every paper model stands on: a peach backing disc, a cream disc and a coral halo, layered in depth. */
function paperStage(root: THREE.Group) {
  disc(root, 1.74, 0.14, paper.peach, 0, 0, -0.45);
  disc(root, 1.6, 0.08, paper.cream, 0, 0, -0.34);
  const halo = ring(root, 1.68, 0.035, paper.coral, 0, 0, -0.28);
  halo.scale.y = 1.02;
}

const paperModels: Record<ArtKind, Model> = {
  /** Layered hills, a road and trees, with a paper plane looping overhead. */
  travel(root, ticks) {
    disc(root, 0.34, 0.045, paper.coral, 0.78, 0.88, -0.2);
    cutout(root, [[-1.53, -0.54], [-0.93, 0.9], [-0.27, -0.05], [0.28, 0.77], [1.51, -0.55], [1.25, -1.05], [-1.25, -1.05]], paper.blue, -0.11);
    cutout(root, [[-1.45, -0.65], [-0.62, 0.38], [0.13, -0.21], [0.9, 0.48], [1.46, -0.62], [1.16, -1.15], [-1.16, -1.15]], paper.teal, 0.17);
    cutout(root, [[-1.25, -1.02], [-0.91, -0.48], [-0.18, -0.77], [0.57, -0.44], [1.24, -0.97], [0.74, -1.42], [-0.64, -1.42]], 0x91ad8d, 0.43);
    curve(root, [vec(-0.83, -1.04, 0.52), vec(-0.17, -0.75, 0.53), vec(0.12, -0.46, 0.28), vec(0.54, -0.35, 0.25)], paper.cream, 0.055);
    paperTree(root, -0.89, -0.82, 0.5, 0.55);
    paperTree(root, 0.9, -0.87, 0.49, 0.4);
    const flyer = plane(root, paper.cream);
    flyer.scale.setScalar(0.65);
    ticks.push((angle) => {
      flyer.position.set(Math.cos(angle) * 1.25, 0.92 + Math.sin(angle) * 0.21, 0.6 + Math.sin(angle) * 0.12);
      // Nose along the direction of travel.
      flyer.rotation.z = Math.atan2(0.21 * Math.cos(angle), -1.25 * Math.sin(angle)) - Math.PI / 2;
    });
  },
  /** An open book with a pop-up portal, steps and drifting paper slips. */
  reading(root, ticks) {
    const book = new THREE.Group();
    root.add(book);
    book.position.set(0, -0.85, 0.63);
    book.rotation.x = 0.65;
    for (const side of [-1, 1]) {
      const leaf = new THREE.Group();
      book.add(leaf);
      leaf.rotation.y = side * 0.14;
      box(leaf, 1.25, 0.14, 1.48, paper.coral, side * 0.64, 0, 0);
      for (let i = 0; i < 5; i++) box(leaf, 1.2, 0.024, 1.4, paper.cream, side * 0.62, 0.1 + i * 0.032, 0);
    }
    // Pop-up architecture springs from the book's gutter; no faux page deformation.
    const portal = new THREE.Group();
    portal.position.set(0, -0.49, 0.5);
    root.add(portal);
    box(portal, 0.3, 1.25, 0.14, paper.blue, -0.58, 0.53);
    box(portal, 0.3, 1.25, 0.14, paper.blue, 0.58, 0.53);
    cutout(portal, [[-0.84, 1.05], [0, 1.69], [0.84, 1.05]], paper.coral, 0.02);
    for (let i = 0; i < 5; i++) box(root, 0.78, 0.1, 0.22, paper.peach, 0, -0.91 + i * 0.1, 1.13 - i * 0.14);
    paperTree(root, -1.04, -0.64, 0.71, 0.53);
    paperTree(root, 1.06, -0.64, 0.64, 0.4);
    for (let i = 0; i < 5; i++) {
      const slip = box(root, 0.26, 0.36, 0.025, i % 2 ? paper.blue : paper.cream, -1 + i * 0.5, 1.03, 0.32);
      ticks.push((angle) => {
        slip.position.y = 1.1 + 0.15 * Math.sin(angle + i);
        slip.rotation.z = 0.2 * Math.sin(angle + i);
        slip.rotation.y = 0.25 * Math.cos(angle + i);
      });
    }
    ticks.push((angle) => (portal.rotation.y = 0.1 * Math.sin(angle)));
  },
  /** Top-down graphic court, floating above the paper disc, with a physically raised net. */
  tennis(root, ticks) {
    const court = new THREE.Group();
    root.add(court);
    court.rotation.z = -0.25;
    box(court, 1.83, 2.62, 0.08, paper.teal, 0, 0, 0.12);
    for (const x of [-0.79, -0.57, 0.57, 0.79]) box(court, 0.014, 2.35, 0.012, paper.cream, x, 0, 0.175);
    for (const y of [-1.17, -0.57, 0.57, 1.17]) box(court, 1.58, 0.015, 0.012, paper.cream, 0, y, 0.175);
    box(court, 0.014, 1.14, 0.012, paper.cream, 0, 0, 0.175);
    box(court, 1.96, 0.035, 0.33, paper.ink, 0, 0, 0.29);
    for (let i = -12; i <= 12; i++) box(court, 0.012, 0.018, 0.31, paper.cream, i * 0.073, -0.025, 0.3);
    const nearRacket = racket(court, paper.coral),
      farRacket = racket(court, paper.peach);
    nearRacket.scale.setScalar(0.43);
    farRacket.scale.setScalar(0.43);
    farRacket.rotation.z = Math.PI;
    nearRacket.position.set(-0.34, -1.1, 0.36);
    farRacket.position.set(0.34, 1.1, 0.36);
    const tennisBall = ball(court, 0.075, 0xf9d260);
    ticks.push((angle) => {
      tennisBall.position.set(0.34 * Math.sin(angle), 1.02 * Math.sin(angle), 0.4 + 0.46 * Math.cos(angle) ** 2);
      nearRacket.rotation.z = 0.25 * Math.cos(angle);
      farRacket.rotation.z = Math.PI + 0.25 * Math.cos(angle);
    });
  },
  /** A cut-paper automaton feeding a cascade of physical instruction cards. */
  ai(root, ticks) {
    const head = new THREE.Group();
    root.add(head);
    head.position.set(-0.54, 0.14, 0.47);
    box(head, 1.14, 0.94, 0.3, paper.blue);
    box(head, 0.91, 0.55, 0.06, paper.cream, 0, 0.03, 0.18);
    for (const x of [-0.24, 0.24]) disc(head, 0.09, 0.03, paper.ink, x, 0.08, 0.23);
    box(head, 0.31, 0.025, 0.035, paper.coral, 0, -0.14, 0.23);
    rod(head, vec(0, 0.47), vec(0, 0.73), paper.coral, 0.028);
    ball(head, 0.085, paper.coral, 0, 0.78);
    for (let i = 0; i < 3; i++) {
      const card = new THREE.Group();
      root.add(card);
      card.position.set(0.64 + i * 0.15, 0.23 - i * 0.4, 0.05 + i * 0.28);
      card.rotation.z = -0.12;
      box(card, 0.85, 0.52, 0.07, [paper.peach, paper.cream, paper.teal][i]);
      for (let j = 0; j < 3; j++) box(card, 0.55 - j * 0.08, 0.025, 0.01, i === 2 ? paper.cream : paper.ink, -j * 0.04, 0.13 - j * 0.11, 0.045);
      ticks.push((angle) => {
        card.position.x = 0.64 + i * 0.15 + 0.06 * Math.sin(angle + i * 0.9);
        card.rotation.y = 0.14 * Math.sin(angle + i * 0.9);
      });
    }
    cutout(root, [[-1.07, -0.58], [-0.1, -0.58], [-0.1, -0.87], [0.1, -0.7], [-0.1, -0.48], [-0.1, -0.65], [-1.07, -0.65]], paper.coral, 0.58);
    ticks.push((angle) => {
      head.rotation.z = 0.06 * Math.sin(angle);
      head.position.y = 0.14 + 0.06 * Math.cos(angle);
    });
  },
  /** A tower of four sliding server drawers, with status dots climbing beside it. */
  server(root, ticks) {
    const tower = new THREE.Group();
    root.add(tower);
    tower.rotation.y = -0.35;
    for (let i = 0; i < 4; i++) {
      const layer = new THREE.Group();
      tower.add(layer);
      layer.position.y = -0.94 + i * 0.61;
      box(layer, 1.6, 0.42, 0.55, [paper.blue, paper.teal, paper.coral, paper.blue][i]);
      box(layer, 1.38, 0.25, 0.025, paper.cream, 0, 0, 0.29);
      for (let j = 0; j < 6; j++) box(layer, 0.075, 0.12, 0.024, paper.ink, -0.5 + j * 0.145, 0, 0.32);
      disc(layer, 0.042, 0.03, paper.coral, 0.54, 0, 0.33);
      const tab = cutout(layer, [[0.8, -0.12], [1.02, -0.12], [1.02, 0.12], [0.8, 0.12]], paper.peach, -0.05);
      ticks.push((angle) => {
        layer.position.x = 0.12 * Math.sin(angle + i * 0.7);
        tab.rotation.y = 0.15 * Math.sin(angle);
      });
    }
    for (let i = 0; i < 4; i++) {
      const dot = disc(root, 0.055, 0.04, paper.coral, -1.18, -0.9 + i * 0.55, 0.1);
      ticks.push((angle) => (dot.position.y = -0.9 + i * 0.55 + 0.06 * Math.sin(angle + i)));
    }
  },
  /** Price history as a dimensional paper accordion, intentionally labelled a study by the host. */
  trading(root, ticks) {
    const BAR_HEIGHTS = [0.37, 0.64, 0.47, 0.88, 0.69, 1.02, 0.87];
    for (let i = 0; i < 7; i++) {
      const panel = new THREE.Group();
      root.add(panel);
      panel.position.set(-1.2 + i * 0.39, 0, 0.12 + i * 0.055);
      panel.rotation.y = (i % 2 ? 1 : -1) * 0.2;
      box(panel, 0.39, 1.8, 0.045, i % 2 ? paper.cream : 0xf6d7a3);
      const height = BAR_HEIGHTS[i];
      box(panel, 0.15, height, 0.055, i === 2 || i === 4 ? paper.coral : paper.teal, 0, -0.55 + height / 2, 0.065);
      box(panel, 0.018, height + 0.26, 0.045, paper.ink, 0, -0.55 + height / 2, 0.05);
      box(panel, 0.19, 0.12 + (i % 3) * 0.045, 0.025, paper.blue, 0, -0.74, 0.08);
      ticks.push((angle) => (panel.rotation.y = (i % 2 ? 1 : -1) * (0.18 + 0.11 * Math.sin(angle))));
    }
    curve(root, [vec(-1.3, -1.14, 0.66), vec(-0.6, -1.02, 0.66), vec(0.3, -1.1, 0.66), vec(1.27, -0.9, 0.66)], paper.coral, 0.025);
  },
};

function paperWorld(kind: ArtKind, ticks: Tick[]) {
  const root = new THREE.Group();
  // A real layered stage: each silhouette has thickness and a separate depth plane.
  paperStage(root);
  paperModels[kind](root, ticks);
  ticks.push((angle) => {
    root.rotation.set(-0.18 + 0.035 * Math.cos(angle), -0.34 + 0.1 * Math.sin(angle), -0.035);
  });
  return root;
}

/* ---------------------------------------------------------------- Kinetic sculpture (direction 2) */

/** The plinth every kinetic sculpture stands on: a dark drum (top at y -1.41) ringed in brass. */
function kineticPlinth(root: THREE.Group) {
  const base = addMesh(root, new THREE.CylinderGeometry(0.93, 1.05, 0.16, 64), kinetic.dark, 0, -1.49, 0);
  base.rotation.x = 0;
  ring(root, 0.96, 0.012, kinetic.gold, 0, -1.48, 0, true).rotation.x = Math.PI / 2;
  addMesh(root, new THREE.CylinderGeometry(0.85, 0.91, 0.06, 64), kinetic.dark, 0, -1.59, 0);
  ring(root, 0.94, 0.018, kinetic.gold, 0, -1.4, 0, true).rotation.x = Math.PI / 2;
}

const kineticModels: Record<ArtKind, Model> = {
  /** A brass icosahedron core with three chips on tilted orbits. */
  ai(root, ticks) {
    const core = addMesh(root, new THREE.IcosahedronGeometry(0.52, 0), kinetic.gold, 0, 0.1, 0, true);
    for (let i = 0; i < 3; i++) {
      const orbit = new THREE.Group();
      root.add(orbit);
      orbit.position.y = 0.1;
      orbit.rotation.set(0.7 + i * 0.6, i * 0.8, 0.3 + i * 0.7);
      const radius = 1.2 + i * 0.12;
      ring(orbit, radius, 0.018, kinetic.gold, 0, 0, 0, true);
      const chip = box(orbit, 0.3, 0.3, 0.12, [kinetic.dark, kinetic.blue, kinetic.orange][i]);
      for (let j = -1; j <= 1; j++) {
        box(chip, 0.035, 0.06, 0.05, kinetic.gold, j * 0.075, 0.18);
        box(chip, 0.035, 0.06, 0.05, kinetic.gold, j * 0.075, -0.18);
      }
      ticks.push((angle) => {
        const orbitAngle = angle + (i * TAU) / 3;
        chip.position.set(Math.cos(orbitAngle) * radius, Math.sin(orbitAngle) * radius, 0);
        chip.rotation.z = orbitAngle;
      });
    }
    ticks.push((angle) => {
      core.rotation.set(angle, 0.5 * Math.sin(angle), angle);
    });
  },
  /** A turning globe in a brass meridian, with a plane on an orbit ring. */
  travel(root, ticks) {
    const GLOBE_RADIUS = 0.85;
    const globe = new THREE.Group();
    root.add(globe);
    globe.position.y = 0.08;
    globe.rotation.z = -0.28;
    ball(globe, 0.83, kinetic.blue);
    for (let i = 0; i < 6; i++) {
      const longitude = ring(globe, GLOBE_RADIUS, 0.009, kinetic.ivory);
      longitude.rotation.y = (i * Math.PI) / 6;
    }
    for (const latitude of [-0.5, 0, 0.5]) {
      const parallel = ring(globe, Math.sqrt(GLOBE_RADIUS ** 2 - latitude ** 2), 0.009, kinetic.ivory, 0, latitude);
      parallel.rotation.x = Math.PI / 2;
    }
    const meridian = ring(root, 1.08, 0.045, kinetic.gold, 0, 0.08, 0, true);
    meridian.rotation.y = 0.3;
    meridian.rotation.z = -0.28;
    rod(root, vec(0, -1.41), vec(0, -1), kinetic.gold, 0.055);
    const orbit = new THREE.Group();
    root.add(orbit);
    orbit.position.y = 0.08;
    orbit.rotation.set(0.6, -0.3, -0.35);
    ring(orbit, 1.34, 0.014, kinetic.gold, 0, 0, 0, true);
    const flyer = plane(orbit, kinetic.ivory);
    flyer.scale.setScalar(0.53);
    ticks.push((angle) => {
      globe.rotation.y = angle;
      flyer.position.set(1.34 * Math.cos(angle), 1.34 * Math.sin(angle), 0);
      flyer.rotation.z = angle;
    });
  },
  /** A brass racket on a stand, with a ball circling it on a ring. */
  tennis(root, ticks) {
    const brassRacket = racket(root, kinetic.gold, true);
    brassRacket.scale.setScalar(1.17);
    brassRacket.position.set(-0.34, 0.12, 0.12);
    brassRacket.rotation.set(0.15, -0.4, -0.4);
    const path = new THREE.Group();
    root.add(path);
    path.rotation.set(0.65, -0.4, -0.35);
    path.position.set(0.22, 0.35, 0.1);
    ring(path, 1.18, 0.012, kinetic.gold, 0, 0, 0, true);
    const tennisBall = ball(path, 0.19, 0xd5d976);
    ring(tennisBall, 0.189, 0.008, kinetic.ivory).rotation.y = Math.PI / 2;
    ticks.push((angle) => {
      tennisBall.position.set(1.18 * Math.cos(angle), 1.18 * Math.sin(angle), 0);
      tennisBall.rotation.z = angle * 2;
      brassRacket.rotation.y = -0.4 + 0.18 * Math.sin(angle);
    });
    rod(root, vec(-0.3, -1.4), vec(-0.3, -0.8), kinetic.gold, 0.035);
  },
  /** Four bobbing server trays, each with a spinning fan, between two brass posts. */
  server(root, ticks) {
    const tower = new THREE.Group();
    root.add(tower);
    tower.rotation.set(0.4, -0.48, 0);
    for (let i = 0; i < 4; i++) {
      const layer = new THREE.Group();
      tower.add(layer);
      box(layer, 1.4, 0.1, 0.95, i % 2 ? kinetic.ivory : kinetic.dark);
      const fan = ring(layer, 0.28, 0.024, kinetic.gold, 0, 0.09, 0, true);
      fan.rotation.x = -Math.PI / 2;
      for (let blade = 0; blade < 6; blade++) {
        const bladeAngle = (blade * TAU) / 6;
        const vane = box(fan, 0.12, 0.23, 0.025, kinetic.blue, Math.cos(bladeAngle) * 0.14, Math.sin(bladeAngle) * 0.14);
        vane.rotation.z = bladeAngle - 0.4;
      }
      for (const x of [-0.58, 0.58]) for (const z of [-0.36, 0.36]) ball(layer, 0.037, kinetic.gold, x, 0.08, z, true);
      ticks.push((angle) => {
        layer.position.y = -0.91 + i * 0.61 + 0.075 * Math.sin(angle + i * 0.65);
        fan.rotation.z = angle * 2;
      });
    }
    for (const x of [-0.61, 0.61]) rod(tower, vec(x, -1.3, -0.4), vec(x, 1.21, -0.4), kinetic.gold, 0.018);
    ticks.push((angle) => (tower.rotation.y = -0.48 + 0.12 * Math.sin(angle)));
  },
  /** A suspended fan of individual rigid leaves, each with its own hinge, and a ribbon bookmark. */
  reading(root, ticks) {
    const LEAVES = 13;
    const book = new THREE.Group();
    root.add(book);
    book.name = "kinetic-folio";
    book.rotation.set(0.32, -0.4, -0.15);
    book.position.y = 0.12;
    for (let i = 0; i < LEAVES; i++) {
      const hinge = new THREE.Group();
      book.add(hinge);
      hinge.rotation.y = -1.3 + i * 0.21;
      const cover = i === 0 || i === LEAVES - 1;
      box(hinge, 1.16, 1.59, 0.025, cover ? kinetic.dark : kinetic.ivory, 0.59, 0, 0);
      // Every third inner leaf carries lines of text.
      if (i % 3 === 0 && i > 0 && i < LEAVES - 1) for (let j = 0; j < 7; j++) box(hinge, 0.72, 0.012, 0.007, kinetic.gold, 0.62, 0.49 - j * 0.15, 0.017);
      ticks.push((angle) => (hinge.rotation.y = -1.3 + i * 0.21 + 0.045 * Math.sin(angle + i * 0.22)));
    }
    rod(book, vec(0, -0.91), vec(0, 0.91), kinetic.gold, 0.06);
    const ribbon = curve(root, [vec(-0.85, -1.03, 0.3), vec(-1.2, -0.4, 0.5), vec(-1.05, 0.5, 0.2), vec(-0.48, 1.3, -0.2), vec(0.58, 1.15, -0.4)], kinetic.gold, 0.022);
    ticks.push((angle) => {
      book.rotation.y = -0.4 + angle;
      book.rotation.z = -0.15 + 0.075 * Math.sin(angle);
      ribbon.rotation.y = 0.15 * Math.sin(angle);
    });
  },
  /** Market balance: candles are hanging weights, not a fabricated live feed. */
  trading(root, ticks) {
    const BEAM_Y = 0.94;
    const CANDLE_HEIGHTS = [0.32, 0.57, 0.43];
    rod(root, vec(0, -1.4), vec(0, BEAM_Y), kinetic.gold, 0.045);
    ball(root, 0.09, kinetic.gold, 0, BEAM_Y, 0, true);
    const beam = new THREE.Group();
    root.add(beam);
    beam.position.y = BEAM_Y;
    rod(beam, vec(-1.2, 0), vec(1.2, 0), kinetic.gold, 0.037);
    for (const side of [-1, 1]) {
      const tray = new THREE.Group();
      beam.add(tray);
      tray.position.x = side * 0.91;
      for (const x of [-0.37, 0.37]) rod(tray, vec(0, 0), vec(x, -0.95), kinetic.gold, 0.012);
      const platter = addMesh(tray, new THREE.CylinderGeometry(0.48, 0.4, 0.08, 40), kinetic.ivory, 0, -1, 0);
      for (let i = 0; i < 3; i++) {
        const height = CANDLE_HEIGHTS[i];
        const x = -0.22 + i * 0.22;
        box(tray, 0.12, height, 0.12, side < 0 ? kinetic.blue : kinetic.orange, x, -0.92 + height / 2, 0);
        rod(tray, vec(x, -0.91), vec(x, -0.85 + height), kinetic.gold, 0.009);
      }
      ticks.push((angle) => {
        tray.rotation.z = -0.14 * Math.sin(angle);
        platter.rotation.y = angle;
      });
    }
    ticks.push((angle) => (beam.rotation.z = 0.14 * Math.sin(angle)));
  },
};

function kineticWorld(kind: ArtKind, ticks: Tick[]) {
  const root = new THREE.Group();
  kineticPlinth(root);
  kineticModels[kind](root, ticks);
  ticks.push((angle) => (root.rotation.y = 0.18 + 0.12 * Math.sin(angle)));
  return root;
}

/* ---------------------------------------------------------------- Entry */

/** Directions 1 (paper theatre) and 2 (kinetic sculpture) are drawn here; 3–5 in expanded-directions.ts. */
export function createArtDirection(kind: ArtKind, variant: 1 | 2 | 3 | 4 | 5) {
  if (variant >= 3) return createExpandedDirection(kind, variant as 3 | 4 | 5);
  const ticks: Tick[] = [];
  const root = variant === 1 ? paperWorld(kind, ticks) : kineticWorld(kind, ticks);
  root.userData.style = variant === 1 ? "paper-theatre" : "kinetic";
  playLoop(root, ticks, REST_MS, variant === 1 ? "paper-parallax" : "kinetic-orbit");
  return root;
}
