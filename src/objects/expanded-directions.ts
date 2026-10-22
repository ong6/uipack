import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { playLoop, TAU, vec, type Tick } from "./procedural";
import type { ObjectKind } from "./scenes";

// Original authored studies: directions 3 (cartoon), 4 (realistic) and 5 (abstract).
// Y is up, Z faces the camera. Every tick is periodic in 2π.
const colors = {
  cream: 0xf3e3bb,
  coral: 0xec795b,
  blue: 0x609abe,
  mint: 0x80b9a0,
  ink: 0x26374b,
  gold: 0xc49b58,
  white: 0xfaf5e9,
};
/** Reduced motion shows the pose 1.8 s into the loop. */
const REST_MS = 1800;

type ArtKind = Exclude<ObjectKind, "contact">;
type Surface = THREE.Material | number;

/* ---------------------------------------------------------------- Mesh helpers */

const standard = (color: number, roughness = 0.68, metalness = 0.04) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
/** A mesh with `surface`: a material, or a colour for the default satin finish. */
function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, surface: Surface, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, typeof surface === "number" ? standard(surface) : surface);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}
/** A rounded box: edge `radius`, never more than a third of a side. */
function block(
  parent: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  surface: Surface,
  x = 0,
  y = 0,
  z = 0,
  radius = 0.055,
) {
  return mesh(
    parent,
    new RoundedBoxGeometry(width, height, depth, 2, Math.min(radius, width / 3, height / 3, depth / 3)),
    surface,
    x,
    y,
    z,
  );
}
function sphere(parent: THREE.Object3D, radius: number, surface: Surface, x = 0, y = 0, z = 0) {
  return mesh(parent, new THREE.SphereGeometry(radius, 24, 16), surface, x, y, z);
}
function ring(parent: THREE.Object3D, radius: number, tube: number, surface: Surface, x = 0, y = 0, z = 0) {
  return mesh(parent, new THREE.TorusGeometry(radius, tube, 8, 64), surface, x, y, z);
}
function cylinder(parent: THREE.Object3D, radius: number, height: number, surface: Surface, x = 0, y = 0, z = 0) {
  return mesh(parent, new THREE.CylinderGeometry(radius, radius, height, 40), surface, x, y, z);
}
/** A tube through `points`, closed into a loop when `closed`. */
function path(parent: THREE.Object3D, points: THREE.Vector3[], surface: Surface, radius = 0.018, closed = false) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), 80, radius, 6, closed), surface);
}
/** A straight rod from `from` to `to`. */
function rod(parent: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, color: number, radius = 0.02) {
  const delta = to.clone().sub(from),
    object = cylinder(parent, radius, delta.length(), color);
  object.position.copy(from).add(to).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(vec(0, 1), delta.normalize());
  return object;
}
/** An empty group at (x, y, z) inside `parent`. */
function group(parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const container = new THREE.Group();
  container.position.set(x, y, z);
  parent.add(container);
  return container;
}

/* ---------------------------------------------------------------- Cartoon props */

/** A lollipop tree: trunk and two round crowns. */
function tree(parent: THREE.Object3D, x: number, z: number, scale = 1) {
  const container = group(parent, x, 0, z);
  container.scale.setScalar(scale);
  cylinder(container, 0.065, 0.55, 0x94715c, 0, 0.26);
  sphere(container, 0.27, colors.mint, 0, 0.7).scale.y = 1.35;
  sphere(container, 0.21, 0x5e9577, 0.19, 0.58);
  return container;
}
/** Three flattened white puffs. */
function cloud(parent: THREE.Object3D, x: number, y: number, z: number) {
  const container = group(parent, x, y, z);
  for (const [dx, dy, radius] of [
    [-0.23, 0, 0.22],
    [0, 0.08, 0.3],
    [0.25, 0, 0.21],
  ])
    sphere(container, radius, colors.white, dx, dy).scale.z = 0.6;
  return container;
}
/** A gable roof: a w × h triangle extruded `depth`, centred on z. */
function roof(parent: THREE.Object3D, width: number, height: number, depth: number, x = 0, y = 0, z = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(0, height);
  shape.lineTo(width / 2, 0);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.025,
    bevelSegments: 2,
    steps: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  return mesh(parent, geometry, colors.coral, x, y, z);
}
function toyHouse(parent: THREE.Object3D, x: number, z: number) {
  const house = group(parent, x, 0, z);
  block(house, 0.72, 0.68, 0.66, colors.cream, 0, 0.34);
  roof(house, 0.88, 0.36, 0.83, 0, 0.67);
  block(house, 0.2, 0.31, 0.03, colors.blue, 0, 0.17, 0.35);
  for (const side of [-1, 1]) block(house, 0.13, 0.14, 0.035, colors.white, side * 0.23, 0.46, 0.35);
  return house;
}

/* ---------------------------------------------------------------- Cartoon (direction 3) */

/** Builds one kind's scene on the cartoon diorama's grass (`world`, top at y 0). */
type CartoonModel = (world: THREE.Group, ticks: Tick[]) => void;

const cartoonModels: Record<ArtKind, CartoonModel> = {
  /** A toy train runs along a river past a house, trees and a hill. */
  travel(world, ticks) {
    block(world, 2.45, 0.06, 0.7, colors.blue, 0, 0.055, 0.55, 0.2);
    toyHouse(world, -0.7, -0.45);
    tree(world, 0.87, -0.56, 0.85);
    tree(world, 1.04, 0.03, 0.55);
    const hill = sphere(world, 0.61, colors.mint, 0.52, 0.08, -0.62);
    hill.scale.set(1, 1.18, 0.8);
    const train = group(world, 0, 0.22, 0.54);
    block(train, 0.72, 0.3, 0.31, colors.coral);
    block(train, 0.43, 0.19, 0.29, colors.cream, -0.08, 0.23);
    for (const x of [-0.23, 0.23])
      for (const z of [-0.17, 0.17]) cylinder(train, 0.095, 0.04, colors.ink, x, -0.14, z).rotation.x = Math.PI / 2;
    for (const x of [-0.2, 0]) block(train, 0.13, 0.11, 0.015, colors.blue, x, 0.25, 0.16);
    ticks.push((angle) => {
      train.position.x = 0.68 * Math.sin(angle);
      train.rotation.y = 0.08 * Math.sin(angle);
    });
  },
  /** An armchair reader on a giant book, under a standing lamp. */
  reading(world, ticks) {
    block(world, 1.5, 0.18, 1.48, colors.coral, 0, 0.14, 0);
    block(world, 1.38, 0.2, 1.37, colors.white, 0, 0.32, 0);
    for (let i = 0; i < 4; i++) block(world, 1.4, 0.012, 1.38, 0xd8c9a5, 0, 0.25 + i * 0.043);
    const seat = group(world, 0.1, 0.43, 0);
    block(seat, 0.66, 0.13, 0.59, colors.blue, 0, 0.15);
    block(seat, 0.67, 0.7, 0.16, colors.blue, 0, 0.49, -0.27, 0.1);
    for (const x of [-0.32, 0.32]) block(seat, 0.12, 0.24, 0.61, colors.blue, x, 0.32);
    const book = group(seat, 0, 0.47, 0.13);
    block(book, 0.43, 0.05, 0.34, colors.cream);
    book.rotation.x = -0.2;
    const lamp = group(world, -0.86, 0.06, -0.36);
    rod(lamp, vec(0, 0), vec(0, 1.32), colors.gold, 0.045);
    mesh(lamp, new THREE.ConeGeometry(0.28, 0.34, 32), colors.coral, 0, 1.35);
    sphere(lamp, 0.1, 0xffd983, 0, 1.2);
    tree(world, 0.93, 0.5, 0.68);
    ticks.push((angle) => {
      book.rotation.z = 0.06 * Math.sin(angle);
      seat.rotation.y = 0.06 * Math.sin(angle);
    });
  },
  /** A court with a net; the ball arcs between two bats. */
  tennis(world, ticks) {
    block(world, 1.78, 0.05, 1.8, 0x65a78a, 0, 0.075);
    for (const x of [-0.74, 0.74]) block(world, 0.024, 0.012, 1.55, colors.white, x, 0.11);
    for (const z of [-0.78, 0, 0.78]) block(world, 1.5, 0.012, 0.024, colors.white, 0, 0.11, z);
    for (const x of [-0.88, 0.88]) cylinder(world, 0.035, 0.43, colors.white, x, 0.28);
    block(world, 1.78, 0.28, 0.025, colors.ink, 0, 0.33);
    for (let i = -8; i <= 8; i++) block(world, 0.012, 0.26, 0.03, colors.cream, i * 0.1, 0.33);
    const ball = sphere(world, 0.12, 0xe5dd70),
      nearBat = group(world, -0.33, 0.16, 0.67),
      farBat = group(world, 0.33, 0.16, -0.67);
    for (const [bat, color] of [
      [nearBat, colors.coral],
      [farBat, colors.blue],
    ] as const) {
      cylinder(bat, 0.17, 0.09, color);
      sphere(bat, 0.17, color, 0, 0.18).scale.y = 0.45;
      ring(bat, 0.19, 0.032, colors.cream, 0, 0.25).rotation.x = -Math.PI / 2;
    }
    ticks.push((angle) => {
      const swing = Math.sin(angle);
      ball.position.set(0.33 * swing, 0.53 + 0.51 * (1 - swing * swing), -0.67 * swing);
      nearBat.rotation.y = 0.22 * Math.cos(angle);
      farBat.rotation.y = -0.22 * Math.cos(angle);
    });
    tree(world, 1.02, -0.75, 0.75);
  },
  /** A bobbing robot at a desk, with a keyboard and a mug. */
  ai(world, ticks) {
    block(world, 1.6, 0.14, 0.85, 0xc79976, 0, 0.63);
    for (const x of [-0.63, 0.63]) block(world, 0.1, 0.59, 0.1, colors.cream, x, 0.29);
    const bot = group(world, -0.26, 0.98, -0.1);
    block(bot, 0.81, 0.62, 0.34, colors.blue, 0, 0, 0, 0.14);
    block(bot, 0.62, 0.35, 0.045, colors.ink, 0, 0.035, 0.19, 0.09);
    for (const x of [-0.16, 0.16]) sphere(bot, 0.055, 0xf5dc87, x, 0.06, 0.23);
    rod(bot, vec(0, 0.3), vec(0, 0.49), colors.coral);
    sphere(bot, 0.075, colors.coral, 0, 0.54);
    block(world, 0.66, 0.045, 0.28, colors.cream, -0.22, 0.73, 0.28);
    const mug = cylinder(world, 0.13, 0.23, colors.coral, 0.58, 0.81, 0.15);
    ring(mug, 0.1, 0.025, colors.coral, 0.14, 0).rotation.y = 0.2;
    tree(world, 1, -0.7, 0.78);
    ticks.push((angle) => {
      bot.rotation.z = 0.06 * Math.sin(angle);
      bot.position.y = 0.98 + 0.035 * (1 - Math.cos(angle * 2));
    });
  },
  /** Three server buildings with rooftop fans, under their own cloud. */
  server(world, ticks) {
    for (let i = 0; i < 3; i++) {
      const building = group(world, -0.72 + i * 0.69, 0, -0.15 + (i % 2) * 0.28),
        height = 0.87 + (i % 2) * 0.38;
      block(building, 0.58, height, 0.66, [colors.blue, colors.coral, colors.mint][i], 0, height / 2);
      for (let j = 0; j < 3; j++) {
        block(building, 0.4, 0.11, 0.04, colors.cream, 0, 0.18 + j * 0.22, 0.35);
        sphere(building, 0.024, 0x5ea49f, -0.12, 0.18 + j * 0.22, 0.38);
      }
      const fan = ring(building, 0.17, 0.04, colors.ink, 0, height - 0.15, 0.35);
      for (let n = 0; n < 4; n++) {
        const blade = block(fan, 0.045, 0.2, 0.025, colors.white);
        blade.rotation.z = (n * Math.PI) / 2;
      }
      ticks.push((angle) => (fan.rotation.z = angle * 2));
    }
    const puff = cloud(world, 0.1, 1.65, -0.16);
    puff.scale.setScalar(0.75);
    ticks.push((angle) => (puff.position.y = 1.65 + 0.055 * Math.sin(angle)));
  },
  /** A street of towers with lit windows, and a tram passing in front. */
  trading(world, ticks) {
    const TOWER_HEIGHTS = [0.48, 0.83, 1.2, 0.73, 0.99];
    for (let i = 0; i < 5; i++) {
      const height = TOWER_HEIGHTS[i],
        x = -0.91 + i * 0.46;
      block(world, 0.35, height, 0.62, i === 3 ? colors.coral : colors.blue, x, height / 2, -0.23);
      for (let j = 0; j < Math.floor(height / 0.22); j++)
        for (const dx of [-0.09, 0.09]) block(world, 0.075, 0.1, 0.018, colors.cream, x + dx, 0.17 + j * 0.21, 0.09);
    }
    const tram = group(world, 0, 0.2, 0.59);
    block(tram, 0.6, 0.23, 0.29, colors.coral);
    block(tram, 0.35, 0.12, 0.25, colors.cream, 0, 0.17);
    ticks.push((angle) => (tram.position.x = 0.85 * Math.sin(angle)));
  },
};

function cartoon(kind: ArtKind, ticks: Tick[]) {
  const root = new THREE.Group(),
    world = group(root, 0, -0.48, 0);
  world.rotation.set(0.48, -0.55, 0);
  // The diorama: a cream plinth and its grass top.
  block(world, 2.65, 0.32, 2.16, colors.cream, 0, -0.2, 0, 0.16);
  block(world, 2.56, 0.08, 2.07, 0xb9cfad, 0, 0, 0, 0.13);
  cartoonModels[kind](world, ticks);
  // The server scene brings its own cloud.
  if (kind !== "server") {
    const puff = cloud(root, 0.75, 1.24, -0.65);
    puff.scale.setScalar(0.68);
    ticks.push((angle) => {
      puff.position.x = 0.75 + 0.12 * Math.sin(angle);
    });
  }
  ticks.push((angle) => (world.rotation.y = -0.55 + 0.065 * Math.sin(angle)));
  root.scale.setScalar(0.98);
  return root;
}

/* ---------------------------------------------------------------- Realistic (direction 4) */

/** A 64px tileable grey noise (seeded, so every build matches) used as a roughness map. */
function grain() {
  const size = 64,
    data = new Uint8Array(size * size * 4);
  let seed = 17;
  for (let i = 0; i < size * size; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0; // a 32-bit linear congruential step
    const value = 160 + (seed % 80);
    data.set([value, value, value, 255], i * 4);
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.needsUpdate = true;
  return texture;
}

/** The realistic direction's shared finishes, all grained by one roughness texture. */
interface Finishes {
  texture: THREE.Texture;
  steel: THREE.MeshStandardMaterial;
  graphite: THREE.MeshStandardMaterial;
  paper: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
}
/** Builds one kind's still life on the realistic stage (top at y -0.79). */
type RealisticModel = (stage: THREE.Group, ticks: Tick[], finishes: Finishes) => void;

const realisticModels: Record<ArtKind, RealisticModel> = {
  /** A keyboard whose keys press in a wave, a cable and a floating key cap. */
  ai(stage, ticks, { graphite, paper, leather }) {
    const keyboard = group(stage, 0, -0.48, 0.16);
    block(keyboard, 2.5, 0.25, 1.2, graphite);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 8; col++) {
        const key = block(
          keyboard,
          0.25,
          0.16,
          0.27,
          col === 7 ? leather : paper,
          -1.04 + col * 0.296,
          0.17,
          -0.4 + row * 0.34,
          0.035,
        );
        block(key, 0.07, 0.006, 0.025, col === 7 ? paper : graphite, -0.055, 0.083, -0.04, 0.002);
        const phase = ((row * 8 + col) / 24) * TAU;
        // A short, sharp press as the wave passes this key.
        ticks.push((angle) => (key.position.y = 0.17 - 0.055 * Math.max(0, Math.cos(angle - phase)) ** 18));
      }
    const cable = path(
      stage,
      [vec(1, -0.42, -0.49), vec(1.3, -0.27, -0.9), vec(0.5, -0.13, -1), vec(-0.5, -0.1, -0.78)],
      graphite,
      0.037,
    );
    cable.rotation.y = 0.02;
    const cap = group(stage, 0.36, 0.67, 0.05);
    block(cap, 0.64, 0.32, 0.64, paper, 0, 0.09, 0.0, 0.09);
    block(cap, 0.3, 0.16, 0.3, leather, 0, -0.17);
    ticks.push((angle) => {
      cap.position.y = 0.67 + 0.09 * Math.sin(angle);
      cap.rotation.y = 0.25 + 0.12 * Math.sin(angle);
    });
  },
  /** A felt ball with its seam beside a strung racket. */
  tennis(stage, ticks, { texture, steel, graphite, paper, leather }) {
    const BALL_RADIUS = 0.57;
    const HOOP_ASPECT = 1.24; // the hoop is a circle stretched this much in y
    const STRING_RADIUS = 0.52;
    const STRING_COLOR = 0xc0bda9;
    const felt = standard(0xc2c843, 0.99);
    felt.roughnessMap = texture;
    const ball = sphere(stage, BALL_RADIUS, felt, -0.5, -0.2, 0.15);
    // The seam: a closed curve just inside the felt that swings ±0.5 rad about the equator twice a turn.
    const seamPoints = Array.from({ length: 97 }, (_, i) => {
      const a = (i / 96) * TAU;
      return vec(
        0.567 * Math.cos(a),
        0.567 * Math.sin(a) * Math.cos(0.5 * Math.cos(a * 2)),
        0.567 * Math.sin(a) * Math.sin(0.5 * Math.cos(a * 2)),
      );
    });
    path(ball, seamPoints, paper, 0.015, true);
    const racket = group(stage, 0.57, 0.22, -0.1);
    racket.rotation.set(0.3, -0.2, -0.43);
    const hoop = ring(racket, 0.57, 0.043, graphite, 0, 0.22);
    hoop.scale.y = HOOP_ASPECT;
    ring(racket, 0.533, 0.012, steel, 0, 0.22).scale.y = HOOP_ASPECT;
    for (let i = -5; i <= 5; i++) {
      const x = i * 0.085,
        halfHeight = Math.sqrt(STRING_RADIUS ** 2 - x * x) * HOOP_ASPECT;
      rod(racket, vec(x, 0.22 - halfHeight, 0.015), vec(x, 0.22 + halfHeight, 0.015), STRING_COLOR, 0.004);
      const y = i * 0.108,
        halfWidth = Math.sqrt(STRING_RADIUS ** 2 - (y / HOOP_ASPECT) ** 2);
      rod(racket, vec(-halfWidth, 0.22 + y, 0.017), vec(halfWidth, 0.22 + y, 0.017), STRING_COLOR, 0.004);
    }
    rod(racket, vec(-0.23, -0.37), vec(0, -0.7), 0x353f44, 0.026);
    rod(racket, vec(0.23, -0.37), vec(0, -0.7), 0x353f44, 0.026);
    block(racket, 0.14, 0.48, 0.13, leather, 0, -0.91);
    for (let i = 0; i < 8; i++) ring(racket, 0.081, 0.006, graphite, 0, -0.71 - i * 0.05).rotation.x = Math.PI / 2;
    block(stage, 2.6, 0.009, 0.025, paper, 0, -0.775, 0.59, 0.002);
    ticks.push((angle) => ball.rotation.set(0.08 * Math.sin(angle), angle, 0));
  },
  /** A steel compass lying on a contour map; its needle hunts and settles. */
  travel(stage, ticks, { steel, graphite, paper, leather }) {
    const compass = group(stage, -0.18, -0.69, 0.1);
    compass.rotation.x = -Math.PI / 2;
    cylinder(compass, 0.85, 0.14, steel).rotation.x = Math.PI / 2;
    cylinder(compass, 0.77, 0.02, paper, 0, 0, 0.09).rotation.x = Math.PI / 2;
    ring(compass, 0.78, 0.033, graphite, 0, 0, 0.105);
    // 48 ticks round the dial, every fourth a long one.
    for (let i = 0; i < 48; i++) {
      const a = (i * TAU) / 48;
      const mark = block(
        compass,
        0.014,
        i % 4 === 0 ? 0.12 : 0.05,
        0.012,
        graphite,
        0.67 * Math.sin(a),
        0.67 * Math.cos(a),
        0.12,
        0.002,
      );
      mark.rotation.z = -a;
    }
    const needle = group(compass, 0, 0, 0.15);
    const shape = new THREE.Shape();
    shape.moveTo(-0.1, 0);
    shape.lineTo(0, 0.57);
    shape.lineTo(0.1, 0);
    shape.lineTo(0, -0.45);
    shape.closePath();
    mesh(needle, new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false }), leather);
    sphere(compass, 0.055, steel, 0, 0, 0.21);
    ring(compass, 0.17, 0.033, steel, 0, 1.01, 0.03);
    // Contour lines on the map under it.
    for (let i = 0; i < 8; i++)
      path(
        stage,
        Array.from({ length: 20 }, (_, j) => {
          const x = -1.32 + j * 0.14;
          return vec(x, -0.775, -0.8 + i * 0.21 + 0.065 * Math.sin(x * 4 + i));
        }),
        0x9baf93,
        0.005,
      );
    ticks.push((angle) => (needle.rotation.z = 0.32 + 0.24 * Math.sin(angle) * (0.75 + 0.25 * Math.cos(angle))));
  },
  /** Two stacked books, reading glasses and a leather bookmark. */
  reading(stage, ticks, { steel, graphite, paper, leather }) {
    for (let i = 0; i < 2; i++) {
      const book = group(stage, -0.18 + i * 0.15, -0.58 + i * 0.31, 0);
      book.rotation.y = i ? -0.13 : 0.08;
      const cover = i ? graphite : leather;
      block(book, 1.85, 0.055, 1.22, cover, 0, -0.12);
      block(book, 1.77, 0.2, 1.15, paper);
      block(book, 1.85, 0.055, 1.22, cover, 0, 0.12);
      for (let n = 0; n < 7; n++) block(book, 1.77, 0.006, 1.15, 0xc7bda8, 0, -0.077 + n * 0.023, 0.005, 0.001);
    }
    const glasses = group(stage, 0, 0.08, 0.05);
    glasses.rotation.x = -Math.PI / 2;
    for (const x of [-0.39, 0.39]) {
      ring(glasses, 0.3, 0.019, steel, x, 0);
      rod(glasses, vec(x + Math.sign(x) * 0.28, 0), vec(x + Math.sign(x) * 0.27, 0.62, -0.04), 0x747778, 0.016);
    }
    path(glasses, [vec(-0.09, 0), vec(0, 0.055), vec(0.09, 0)], steel, 0.018);
    const bookmark = block(stage, 0.17, 0.018, 0.9, leather, 0.65, -0.05, 0.44);
    bookmark.rotation.y = 0.09;
    ticks.push((angle) => (stage.rotation.z = -0.06 + 0.025 * Math.sin(angle)));
  },
  /** A circuit board with two spinning fans, a heat sink, contacts and a floating chip. */
  server(stage, ticks, { steel, graphite }) {
    const board = group(stage, 0, -0.57, 0);
    block(board, 2.35, 0.08, 1.45, standard(0x345d4c, 0.7));
    for (let i = 0; i < 12; i++) block(board, 0.014, 0.005, 1.15, steel, -1.05 + i * 0.19, 0.047);
    for (const x of [-0.65, 0.55]) {
      const fan = group(board, x, 0.23, 0);
      cylinder(fan, 0.44, 0.13, graphite);
      ring(fan, 0.405, 0.018, steel).rotation.x = Math.PI / 2;
      const rotor = group(fan, 0, 0.08, 0);
      for (let j = 0; j < 7; j++) {
        const bladeAngle = (j * TAU) / 7;
        const blade = block(rotor, 0.16, 0.025, 0.26, graphite, Math.sin(bladeAngle) * 0.21, 0, Math.cos(bladeAngle) * 0.21);
        blade.rotation.y = bladeAngle + 0.5;
      }
      cylinder(rotor, 0.12, 0.04, steel);
      ticks.push((angle) => (rotor.rotation.y = angle * 3));
    }
    for (let i = 0; i < 9; i++) block(board, 0.035, 0.21, 0.6, steel, -0.3 + i * 0.065, 0.16, -0.42);
    for (let i = 0; i < 10; i++) block(board, 0.06, 0.014, 0.12, standard(colors.gold, 0.3, 0.8), -0.8 + i * 0.17, 0.05, 0.72);
    const chip = block(stage, 0.64, 0.1, 0.64, steel, 0, 0.77, -0.08);
    block(chip, 0.43, 0.012, 0.43, graphite, 0, 0.06);
    ticks.push((angle) => {
      chip.position.y = 0.77 + 0.08 * Math.sin(angle);
      chip.rotation.y = 0.15 * Math.sin(angle);
    });
  },
  /** A ticker-tape roll unwinding a strip of printed candles. */
  trading(stage, ticks, { steel, graphite, paper, leather }) {
    const roll = group(stage, -0.87, 0.03, -0.1);
    roll.rotation.z = Math.PI / 2;
    cylinder(roll, 0.44, 0.7, paper);
    cylinder(roll, 0.13, 0.71, graphite);
    const tape = group(stage, 0.27, -0.3, 0.17);
    tape.rotation.set(-Math.PI / 2, 0, -0.08);
    block(tape, 1.78, 0.7, 0.018, paper);
    for (let i = 0; i < 12; i++) {
      const height = 0.09 + (0.12 * ((i * 7) % 5)) / 5;
      block(tape, 0.035, height, 0.012, i % 3 ? graphite : leather, -0.72 + i * 0.13, 0.03, 0.023, 0.002);
      block(tape, 0.006, height + 0.1, 0.012, graphite, -0.72 + i * 0.13, 0.03, 0.018, 0.001);
    }
    for (let i = 0; i < 16; i++) block(tape, 0.028, 0.035, 0.012, graphite, -0.75 + i * 0.1, -0.23, 0.023, 0.001);
    const wheel = ring(stage, 0.56, 0.032, steel, -0.87, 0.03, -0.1);
    wheel.rotation.y = Math.PI / 2;
    ticks.push((angle) => {
      roll.rotation.x = angle;
      wheel.rotation.x = angle;
    });
  },
};

function realistic(kind: ArtKind, ticks: Tick[]) {
  const root = new THREE.Group(),
    texture = grain();
  const finishes: Finishes = {
    texture,
    steel: standard(0x9ba5aa, 0.28, 0.82),
    graphite: standard(0x242d32, 0.52, 0.3),
    paper: standard(0xf0e4cd, 0.95),
    leather: standard(0x834934, 0.84),
  };
  for (const finish of [finishes.steel, finishes.graphite, finishes.paper, finishes.leather]) finish.roughnessMap = texture;
  // Shared ownership: one texture is explicitly released with the model.
  root.userData.dispose = () => texture.dispose();
  const stage = group(root);
  stage.rotation.set(0.48, -0.3, -0.06);
  block(stage, 2.95, 0.1, 2.05, standard(0xc9c1b3, 0.95), 0, -0.84, 0, 0.035);
  realisticModels[kind](stage, ticks, finishes);
  ticks.push((angle) => (stage.rotation.y = -0.3 + 0.07 * Math.sin(angle)));
  return root;
}

/* ---------------------------------------------------------------- Abstract (direction 5) */

/** The abstract direction's materials: clear glass, amber glass, chrome and cobalt. */
interface Glazes {
  glass: THREE.Material;
  amber: THREE.Material;
  chrome: THREE.Material;
  cobalt: THREE.Material;
}
type AbstractModel = (root: THREE.Group, ticks: Tick[], glazes: Glazes) => void;

const abstractModels: Record<ArtKind, AbstractModel> = {
  /** Counter-rotating hoops round an amber octahedron, with six cobalt beads on a figure-eight orbit. */
  ai(root, ticks, { glass, amber, chrome, cobalt }) {
    const lattice = group(root);
    lattice.rotation.set(0.35, 0.5, 0.25);
    for (let i = 0; i < 3; i++) {
      const hoop = ring(lattice, 0.84 + i * 0.18, 0.09, i === 1 ? glass : chrome);
      hoop.rotation.set(i * 0.8, i * 0.6, 0.2);
      ticks.push((angle) => (hoop.rotation.z = angle * (i % 2 ? 1 : -1)));
    }
    mesh(lattice, new THREE.OctahedronGeometry(0.49), amber);
    for (let i = 0; i < 6; i++) {
      const dot = sphere(root, 0.105, cobalt);
      ticks.push((angle) => {
        const orbitAngle = angle + (i * TAU) / 6;
        dot.position.set(1.4 * Math.cos(orbitAngle), 0.85 * Math.sin(orbitAngle), 0.4 * Math.sin(orbitAngle * 2));
      });
    }
  },
  /** Two hoops squash as a cobalt ball passes through them on a looping track. */
  tennis(root, ticks, { glass, amber, chrome, cobalt }) {
    const pair = [group(root, -1, 0), group(root, 1, 0)];
    for (let i = 0; i < 2; i++) {
      const hoop = ring(pair[i], 0.64, 0.14, i ? glass : amber);
      hoop.scale.y = 1.42;
      pair[i].rotation.y = (i ? 1 : -1) * 0.35;
    }
    const ball = sphere(root, 0.27, cobalt);
    // The track: x = 1.16 sin t, y = 0.65 cos t, z = 0.5 sin 2t.
    const arc = path(
      root,
      Array.from({ length: 49 }, (_, i) => {
        const t = (i / 48) * TAU;
        return vec(1.16 * Math.sin(t), 0.65 * Math.cos(t), 0.5 * Math.sin(t * 2));
      }),
      chrome,
      0.015,
      true,
    );
    ticks.push((angle) => {
      ball.position.set(1.16 * Math.sin(angle), 0.65 * Math.cos(angle), 0.5 * Math.sin(angle * 2));
      pair[0].scale.x = 1 - 0.1 * Math.max(0, -Math.sin(angle)) ** 8;
      pair[1].scale.x = 1 - 0.1 * Math.max(0, Math.sin(angle)) ** 8;
      arc.rotation.y = 0.04 * Math.sin(angle);
    });
  },
  /** Seven bars rising and falling on rails, inside a tilted brace. */
  trading(root, ticks, { glass, amber, chrome, cobalt }) {
    for (let i = 0; i < 7; i++) {
      const height = 0.7 + ((i * 3) % 5) * 0.22;
      const x = -1.17 + i * 0.39;
      const bar = block(root, 0.27, height, 0.42, i % 3 === 0 ? amber : i % 2 === 0 ? glass : cobalt, x, 0, 0, 0.12);
      rod(root, vec(x, -1.3), vec(x, 1.3), 0xa8b8c9, 0.009);
      ticks.push((angle) => (bar.position.y = 0.36 * Math.sin(angle + i * 0.62)));
    }
    const brace = ring(root, 1.53, 0.016, chrome);
    brace.scale.y = 0.82;
    brace.rotation.x = 0.4;
  },
  /** Five twisting slabs, each with a counter-twisting core, between two cobalt cables. */
  server(root, ticks, { glass, amber, chrome, cobalt }) {
    for (let i = 0; i < 5; i++) {
      const slab = block(root, 1.65, 0.14, 1.03, i % 2 ? glass : chrome, 0, -1.03 + i * 0.51, 0, 0.06);
      const core = block(slab, 0.5, 0.11, 0.4, i % 2 ? cobalt : amber, 0, 0.13, 0, 0.045);
      ticks.push((angle) => {
        slab.rotation.y = 0.35 * Math.sin(angle + i * 0.55);
        core.rotation.y = -0.35 * Math.sin(angle + i * 0.55);
      });
    }
    for (const x of [-0.98, 0.98])
      path(root, [vec(x, -1.2), vec(x * 1.22, -0.5, 0.2), vec(x * 1.22, 0.5, -0.2), vec(x, 1.2)], cobalt, 0.03);
  },
  /** A cobalt traveller loops through four receding portals. */
  travel(root, ticks, { glass, amber, chrome, cobalt }) {
    for (let i = 0; i < 4; i++) {
      const portal = ring(root, 1.06 - i * 0.1, 0.12, i % 2 ? glass : amber, -0.48 + i * 0.32, 0, -0.7 + i * 0.43);
      portal.scale.y = 1.18;
      portal.rotation.y = -0.4;
      ticks.push((angle) => (portal.rotation.z = 0.2 * Math.sin(angle + i * 0.4)));
    }
    const journey = sphere(root, 0.16, cobalt);
    ticks.push((angle) => journey.position.set(1.37 * Math.cos(angle), 0.75 * Math.sin(angle), 0.7 * Math.sin(angle)));
    path(
      root,
      Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * TAU;
        return vec(1.37 * Math.cos(a), 0.75 * Math.sin(a), 0.7 * Math.sin(a));
      }),
      chrome,
      0.014,
      true,
    );
  },
  /** Individual curved leaves form an open, breathing ribbon sculpture. */
  reading(root, ticks, { glass, amber, chrome }) {
    for (let i = 0; i < 7; i++) {
      // An arch 2.2 wide and 0.8 high, 0.05 thick, extruded 0.55 deep about z = 0.
      const points = Array.from({ length: 33 }, (_, j) => {
        const t = j / 32;
        return vec((t - 0.5) * 2.2, Math.sin(t * Math.PI) * 0.8, 0);
      });
      const ribbon = new THREE.Shape();
      ribbon.moveTo(-1.1, 0);
      for (let j = 1; j < 33; j++) ribbon.lineTo(points[j].x, points[j].y);
      for (let j = 32; j >= 0; j--) ribbon.lineTo(points[j].x, points[j].y - 0.05);
      ribbon.closePath();
      const geometry = new THREE.ExtrudeGeometry(ribbon, {
        depth: 0.55,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.012,
        bevelSegments: 2,
        steps: 1,
      });
      geometry.translate(0, 0, -0.275);
      const leaf = mesh(root, geometry, i % 3 === 0 ? glass : i % 2 ? chrome : amber, 0, -1.12 + i * 0.27, (i - 3) * 0.11);
      leaf.rotation.y = 0.4;
      ticks.push((angle) => {
        leaf.rotation.z = 0.08 * Math.sin(angle + i * 0.38);
        leaf.position.y = -1.12 + i * 0.27 + 0.045 * Math.sin(angle + i * 0.38);
      });
    }
  },
};

function abstract(kind: ArtKind, ticks: Tick[]) {
  const root = new THREE.Group();
  root.rotation.set(0.12, -0.25, 0);
  const glazes: Glazes = {
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xa5d8e1,
      roughness: 0.12,
      metalness: 0.05,
      transmission: 0.72,
      thickness: 0.6,
      ior: 1.45,
      clearcoat: 1,
      envMapIntensity: 1.2,
    }),
    amber: new THREE.MeshPhysicalMaterial({
      color: 0xeaa466,
      roughness: 0.16,
      metalness: 0.05,
      transmission: 0.55,
      thickness: 0.5,
      ior: 1.4,
      clearcoat: 1,
    }),
    chrome: standard(0xa8b8c9, 0.18, 0.86),
    cobalt: standard(0x435aca, 0.32, 0.25),
  };
  abstractModels[kind](root, ticks, glazes);
  ticks.push((angle) => (root.rotation.y = -0.25 + 0.12 * Math.sin(angle)));
  return root;
}

/* ---------------------------------------------------------------- Entry */

const STYLES = ["cartoon", "realistic", "abstract"] as const;
const BUILDERS = [cartoon, realistic, abstract];

export function createExpandedDirection(kind: ArtKind, variant: 3 | 4 | 5) {
  const ticks: Tick[] = [];
  const object = BUILDERS[variant - 3](kind, ticks);
  const style = STYLES[variant - 3];
  object.userData.style = style;
  playLoop(object, ticks, REST_MS, `${style}-study`);
  return object;
}
