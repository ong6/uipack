// Paper worlds (art direction 1): a toy theatre per subject. An open-front proscenium with nested
// arches, a box with side walls, a backdrop and four to six cut-card flats stepped back in depth,
// lit by one warm key whose shadow falls between the layers. Every flat is extruded card with a
// lighter cut edge (its white core) and the shared fibre texture; static card is merged into one
// mesh per scene, so a whole stage costs a handful of draw calls.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { contactShadow, lookMaterial, themed, type ObjectLook } from "./look";
import { TAU, type Tick } from "./procedural";
import type { KindWithLook } from "./variants";

type Pt = [number, number];
type Kind = Exclude<KindWithLook<1>, "contact">;

/** Coloured card stock: a limited palette, like a box of paper. */
export const cardStock = {
  cream: 0xf3ebdd,
  persimmon: 0xe9714b,
  viridian: 0x2f7f73,
  deepViridian: 0x1f5c55,
  sage: 0x9dbb9a,
  dusty: 0x8fb3c4,
  slate: 0x5f8496,
  apricot: 0xf2c6a0,
  sand: 0xe8d3b4,
  ink: 0x283044,
  lemon: 0xe9dd72,
};
const C = cardStock;

/* ---------------------------------------------------------------- Stage geometry */

const FLOOR = -1.12; // top of the stage floor
const BACK = -0.8; // the backdrop's plane
const FRONT = 0.95; // the proscenium's plane
const OPEN = 1.62; // half-width of the proscenium opening
const SPRING = 0.5; // where the arch springs from its sides
const CARD = 0.032; // card thickness

/** The paper's white core shows on every cut edge. */
const edgeOf = (color: number) => new THREE.Color(color).lerp(new THREE.Color(0xfff8ec), color === C.cream ? 0.6 : 0.5);

/** Give a geometry one colour on its faces and a lighter one on its cut sides (ExtrudeGeometry group 1). */
function tint(geometry: THREE.BufferGeometry, color: number, edge = edgeOf(color)) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const face = new THREE.Color(color);
  const sides = g.groups.find((group) => group.materialIndex === 1);
  const count = g.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const c = sides && i >= sides.start && i < sides.start + sides.count ? edge : face;
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.clearGroups();
  return g;
}

function poly(points: Pt[], hole = false) {
  const path = hole ? new THREE.Path() : new THREE.Shape();
  points.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
  path.closePath();
  return path;
}
const shape = (points: Pt[]) => poly(points) as THREE.Shape;
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
function circle(cx: number, cy: number, r: number, hole = false) {
  const path = hole ? new THREE.Path() : new THREE.Shape();
  path.absarc(cx, cy, r, 0, TAU, false);
  return path;
}
/** Sample `f(t)` for t in 0..1 into `n + 1` points. */
const sample = (n: number, f: (t: number) => Pt) => Array.from({ length: n + 1 }, (_, i) => f(i / n));

/** A cut card: `outline` extruded CARD towards the camera from `z`, with optional holes. */
function card(outline: THREE.Shape, color: number, z: number, depth = CARD) {
  const g = new THREE.ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 1,
    curveSegments: 24,
  });
  g.translate(0, 0, z);
  return tint(g, color);
}
function withHoles(outline: THREE.Shape, holes: THREE.Path[]) {
  outline.holes.push(...holes);
  return outline;
}
/** A solid block of card (floor, walls). */
function block(w: number, h: number, d: number, color: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return tint(g, color, new THREE.Color(color));
}

/** Arch tops for the proscenium opening, as y offsets above SPRING for x in -1..1. */
const arches = {
  round: (x: number) => 0.62 * Math.sqrt(Math.max(0, 1 - x * x)),
  scallop: (x: number) => 0.7 - 0.13 * Math.abs(Math.sin(Math.PI * 3.5 * (x + 1))),
};
type Arch = keyof typeof arches;

/** The opening as a hole path, inset `inset` from the proscenium's own opening. */
function opening(arch: Arch, inset: number) {
  const hw = OPEN - inset;
  const top = sample(48, (t) => {
    const x = -1 + 2 * t;
    return [x * hw, SPRING + arches[arch](x) * (hw / OPEN) - inset * 0.6];
  });
  return poly([[-hw, FLOOR - 0.02], ...top, [hw, FLOOR - 0.02]], true);
}

/** The set uses two frame colours, alternating stage to stage, so the stages read as one set. */
const FRAMES = { viridian: C.viridian, persimmon: C.persimmon } as const;

interface TheatreOptions {
  frame: (typeof FRAMES)[keyof typeof FRAMES];
  trims: [number, number];
  arch: Arch;
  backdrop: number;
  floor: number;
  walls?: number;
}

/**
 * One paper stage. `statics` collects every card that never moves; `finish()` merges them into a
 * single mesh. Moving flats are their own meshes, hinged where real theatre flats would be.
 */
class Theatre {
  readonly root = new THREE.Group();
  readonly paper: THREE.MeshStandardMaterial;
  /** Card behind cut windows: plain card by day, lamplight at night. */
  readonly lamp: THREE.MeshStandardMaterial;
  private statics: THREE.BufferGeometry[] = [];

  constructor(readonly options: TheatreOptions) {
    this.paper = lookMaterial("paper", 0xffffff, { vertexColors: true, grain: 1.15, normalScale: new THREE.Vector2(0.4, 0.4) });
    themed(this.paper, { dark: { color: 0xcfc6bb } });
    this.lamp = themed(lookMaterial("paper", 0xffffff, { vertexColors: true, grain: 1.15 }), {
      dark: { emissive: 0xffa04a, emissiveIntensity: 1.6 },
    });
    this.build();
  }

  add(...geometries: THREE.BufferGeometry[]) {
    this.statics.push(...geometries);
  }

  /** A moving part: geometries merged into one mesh under `parent`. */
  part(parent: THREE.Object3D, geometries: THREE.BufferGeometry[], material: THREE.Material = this.paper) {
    const mesh = new THREE.Mesh(mergeGeometries(geometries), material);
    geometries.forEach((g) => g.dispose());
    parent.add(mesh);
    return mesh;
  }

  /** A group hinged on the stage floor at depth `z`, so a flat can sway like scenery on a pin. */
  hinge(z: number, y = FLOOR) {
    const group = new THREE.Group();
    group.position.set(0, y, z);
    this.root.add(group);
    return group;
  }

  private build() {
    const { frame, trims, arch, backdrop, floor, walls = backdrop } = this.options;
    // Proscenium: the front panel and two nested arches stepping back.
    const outer = rect(-1.98, -1.42, 1.98, 1.44);
    // A cream mat just proud of the frame's outline: a light rim that keeps the proscenium's edge
    // readable on a dark card.
    this.add(card(withHoles(shape(rect(-2.05, -1.49, 2.05, 1.51)), [opening(arch, 0.02)]), C.cream, FRONT - 0.012, 0.012));
    this.add(card(withHoles(shape(outer), [opening(arch, 0)]), frame, FRONT));
    this.add(card(withHoles(shape(rect(-1.92, FLOOR - 0.05, 1.92, 1.38)), [opening(arch, 0.085)]), trims[0], FRONT - 0.07));
    this.add(card(withHoles(shape(rect(-1.88, FLOOR - 0.05, 1.88, 1.34)), [opening(arch, 0.15)]), trims[1], FRONT - 0.14));
    // The box: stage floor, side walls, ceiling and backdrop.
    this.add(block(3.7, 0.3, FRONT - BACK, floor, 0, FLOOR - 0.15, (FRONT + BACK) / 2));
    for (const side of [-1, 1]) this.add(block(0.04, 2.38, FRONT - BACK, walls, side * 1.83, 0.07, (FRONT + BACK) / 2));
    this.add(block(3.7, 0.04, FRONT - BACK, walls, 0, 1.26, (FRONT + BACK) / 2));
    this.add(card(shape(rect(-1.85, FLOOR, 1.85, 1.3)), backdrop, BACK));
  }

  finish() {
    this.part(this.root, this.statics);
    this.statics = [];
    // The box stands on the card: a soft shadow under its base.
    this.root.add(contactShadow(4.8, 2.5, { y: -1.42, z: 0.1, opacity: 0.38, color: 0x2a1c12 }));
    return this.root;
  }
}

/** Snow, stars and other small cut pieces. */
const star = (cx: number, cy: number, r: number): Pt[] =>
  sample(8, (t) => {
    const a = t * TAU + Math.PI / 2,
      rr = Math.round(t * 8) % 2 ? r * 0.38 : r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  }).slice(0, 8);
const cloud = (cx: number, cy: number, s: number) => {
  const outline = new THREE.Shape();
  outline.moveTo(cx - 0.42 * s, cy);
  outline.absarc(cx - 0.24 * s, cy + 0.08 * s, 0.17 * s, Math.PI, Math.PI / 2, true);
  outline.absarc(cx + 0.02 * s, cy + 0.14 * s, 0.22 * s, Math.PI * 0.85, Math.PI * 0.15, true);
  outline.absarc(cx + 0.28 * s, cy + 0.06 * s, 0.15 * s, Math.PI / 2, 0, true);
  outline.lineTo(cx + 0.43 * s, cy);
  outline.closePath();
  return outline;
};
const fir = (cx: number, base: number, h: number): Pt[] => [
  [cx - 0.03 * h, base],
  [cx - 0.03 * h, base + 0.12 * h],
  [cx - 0.3 * h, base + 0.12 * h],
  [cx - 0.12 * h, base + 0.45 * h],
  [cx - 0.24 * h, base + 0.45 * h],
  [cx, base + h],
  [cx + 0.24 * h, base + 0.45 * h],
  [cx + 0.12 * h, base + 0.45 * h],
  [cx + 0.3 * h, base + 0.12 * h],
  [cx + 0.03 * h, base + 0.12 * h],
  [cx + 0.03 * h, base],
];
/** A ridge line across the stage: peaks as [x, y], closed down to the floor. */
const ridge = (peaks: Pt[]): Pt[] => [[-1.85, FLOOR], ...peaks, [1.85, FLOOR]];

/* ---------------------------------------------------------------- Subjects */

const scenes: Record<Kind, (ticks: Tick[]) => THREE.Group> = {
  /** Five mountain flats, a road winding back between them, a train on a slot and a sun on a rod. */
  travel(ticks) {
    const t = new Theatre({
      frame: FRAMES.viridian,
      trims: [C.cream, C.persimmon],
      arch: "round",
      backdrop: 0xf6d6b4,
      floor: C.sand,
    });
    // The sun rises and sets on its rod behind the far range.
    const sunRod = t.hinge(BACK + 0.08, FLOOR);
    t.part(sunRod, [
      card(circle(0.75, 1.55, 0.34) as THREE.Shape, C.persimmon, 0),
      card(shape(rect(0.73, 0, 0.77, 1.3)), C.ink, -0.03, 0.02),
    ]);
    const far = ridge([
      [-1.85, 0.1],
      [-1.2, 0.72],
      [-0.55, 0.15],
      [0.05, 0.62],
      [0.55, 0.3],
      [1.1, 0.85],
      [1.85, 0.2],
    ]);
    t.add(card(shape(far), 0xb9ccd3, -0.62));
    for (const [x, y] of [
      [-1.2, 0.72],
      [1.1, 0.85],
    ] as Pt[])
      t.add(
        card(
          shape([
            [x - 0.2, y - 0.25],
            [x, y],
            [x + 0.2, y - 0.25],
            [x + 0.07, y - 0.18],
            [x - 0.06, y - 0.24],
          ]),
          C.cream,
          -0.62 + CARD + 0.004,
          0.012,
        ),
      );
    t.add(
      card(
        shape(
          ridge([
            [-1.85, -0.05],
            [-0.85, 0.45],
            [-0.25, -0.05],
            [0.35, 0.32],
            [1.0, -0.1],
            [1.85, 0.3],
          ]),
        ),
        C.dusty,
        -0.38,
      ),
    );
    t.add(
      card(
        shape([
          [-1.0, 0.25],
          [-0.85, 0.45],
          [-0.7, 0.25],
          [-0.8, 0.3],
        ]),
        C.cream,
        -0.38 + CARD + 0.004,
        0.012,
      ),
    );
    t.add(
      card(
        shape(
          ridge([
            [-1.85, -0.35],
            [-1.3, 0.05],
            [-0.6, -0.42],
            [0.45, 0.02],
            [1.2, -0.38],
            [1.85, -0.15],
          ]),
        ),
        0x5f9e8f,
        -0.12,
      ),
    );
    // Road strips drawn on each range: wide in front, narrowing as it climbs away.
    t.add(
      card(
        shape([
          [0.18, -0.42],
          [0.3, -0.42],
          [0.42, -0.2],
          [0.36, -0.2],
        ]),
        C.cream,
        -0.12 + CARD + 0.004,
        0.01,
      ),
    );
    const mid = t.hinge(0.12);
    t.part(mid, [
      card(
        shape(
          ridge([
            [-1.85, -0.55],
            [-1.0, -0.2],
            [-0.2, -0.62],
            [0.9, -0.28],
            [1.85, -0.5],
          ]).map(([x, y]) => [x, y - FLOOR] as Pt),
        ),
        C.viridian,
        0,
      ),
      card(
        shape([
          [-0.15, -0.0],
          [0.25, 0.0],
          [0.4, 0.42],
          [0.28, 0.42],
        ]),
        C.cream,
        CARD + 0.004,
        0.01,
      ),
      card(shape(rect(-1.85, 0.47, 1.85, 0.51)), C.ink, CARD + 0.004, 0.01),
    ]);
    // The train runs on a slot in front of the middle range and slips behind the proscenium.
    const train = new THREE.Group();
    train.position.set(0, FLOOR + 0.51 + 0.02, 0.2);
    t.root.add(train);
    const trainParts = [
      card(
        shape([
          [-0.2, 0],
          [0.13, 0],
          [0.2, 0.06],
          [0.2, 0.13],
          [-0.05, 0.13],
          [-0.05, 0.22],
          [-0.2, 0.22],
        ]),
        C.persimmon,
        0,
        0.03,
      ),
      card(shape(rect(0.06, 0.13, 0.12, 0.22)), C.ink, 0, 0.03),
      card(shape(rect(-0.17, 0.14, -0.08, 0.19)), C.cream, 0.035, 0.01),
    ];
    for (const x of [-0.42]) {
      trainParts.push(card(shape(rect(x - 0.12, 0.02, x + 0.12, 0.17)), C.cream, 0, 0.03));
      trainParts.push(card(shape(rect(x - 0.08, 0.09, x + 0.08, 0.13)), C.ink, 0.035, 0.01));
    }
    for (const x of [-0.5, -0.34, -0.12, 0.1]) trainParts.push(card(circle(x, 0.02, 0.035) as THREE.Shape, C.ink, 0.035, 0.012));
    const trainMesh = t.part(train, trainParts);
    trainMesh.userData.frameIgnore = true;
    // Front hills with firs, and the road's nearest bend.
    const front = t.hinge(0.48);
    const frontParts = [
      card(
        shape(
          ridge([
            [-1.85, -0.72],
            [-1.2, -0.62],
            [-0.5, -0.85],
            [0.6, -0.68],
            [1.4, -0.82],
            [1.85, -0.7],
          ]).map(([x, y]) => [x, y - FLOOR] as Pt),
        ),
        C.sage,
        0,
      ),
      card(
        shape([
          [-0.45, 0],
          [0.25, 0],
          [0.12, 0.16],
          [0.02, 0.27],
          [-0.12, 0.27],
        ]),
        C.cream,
        CARD + 0.004,
        0.01,
      ),
    ];
    for (const [x, h] of [
      [-1.42, 0.62],
      [-1.12, 0.48],
      [0.95, 0.56],
      [1.25, 0.72],
    ] as Pt[])
      frontParts.push(card(shape(fir(x, 0.2, h)), C.deepViridian, 0.05, 0.03));
    t.part(front, frontParts);
    const drift = t.hinge(BACK + 0.3, 0);
    t.part(drift, [card(cloud(-0.9, 0.95, 1), C.cream, 0), card(cloud(0.2, 1.12, 0.62), C.cream, 0.05)]);
    ticks.push((angle) => {
      sunRod.position.y = -0.82 + 0.2 * Math.sin(angle - 0.6);
      // Two crossings a loop; the jump back happens while the train is hidden behind the frame.
      const u = ((((2 * angle) / TAU + 0.25) % 1) + 1) % 1;
      train.position.x = -2.0 + 4.35 * u;
      mid.rotation.x = 0.025 * Math.sin(angle + 1);
      front.rotation.x = 0.035 * Math.sin(angle);
      drift.position.x = 0.12 * Math.sin(angle);
    });
    return t.finish();
  },

  /** An open book on a raked floor; a castle pops up from its gutter as the pages breathe. */
  reading(ticks) {
    const t = new Theatre({
      frame: FRAMES.persimmon,
      trims: [C.cream, C.ink],
      arch: "scallop",
      backdrop: 0x6f8fa3,
      floor: C.sand,
      walls: 0x5f7f93,
    });
    // Night sky: a crescent and stars on the backdrop.
    const moon = shape(sample(40, (s) => [-1.12 + 0.24 * Math.cos(s * TAU), 0.66 + 0.24 * Math.sin(s * TAU)]));
    moon.holes.push(circle(-1.03, 0.72, 0.2, true));
    t.add(card(moon, C.cream, BACK + CARD + 0.02));
    for (const [x, y, r] of [
      [1.15, 0.78, 0.09],
      [0.75, 0.95, 0.06],
      [-0.55, 0.9, 0.06],
      [1.42, 0.45, 0.06],
      [-1.5, 0.3, 0.05],
    ])
      t.add(card(shape(star(x, y, r)), C.lemon, BACK + CARD + 0.02, 0.015));
    const book = new THREE.Group();
    book.position.set(0, FLOOR + 0.08, 0.25);
    book.rotation.x = 0.42; // raked towards the audience
    t.root.add(book);
    const pages: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const leaf = new THREE.Group();
      book.add(leaf);
      pages.push(leaf);
      const parts = [block(1.42, 0.04, 1.36, C.deepViridian, side * 0.72, -0.03, 0)];
      for (let i = 0; i < 3; i++)
        parts.push(block(1.34, 0.025, 1.28, i === 2 ? C.cream : 0xe7dccb, side * 0.69, 0.01 + i * 0.026, 0));
      // A cream path to the gate, and firs printed flat on the pages.
      t.part(leaf, parts);
    }
    // The pop-up: a castle front and a keep behind it, each hinged on the gutter.
    const castle = new THREE.Group();
    castle.position.set(0, 0.1, 0.12);
    book.add(castle);
    const keep = new THREE.Group();
    keep.position.set(0, 0.1, -0.32);
    book.add(keep);
    const towers = (x: number, w: number, h: number): Pt[] => [
      [x - w, 0],
      [x + w, 0],
      [x + w, h],
      [x + w * 0.5, h],
      [x + w * 0.5, h - 0.06],
      [x - w * 0.5 + 0.0, h - 0.06],
      [x - w * 0.5, h],
      [x - w, h],
    ];
    const wall: Pt[] = [
      [-0.62, 0],
      [0.62, 0],
      [0.62, 0.48],
    ];
    for (let i = 0; i < 7; i++) {
      const x = 0.62 - (i * 1.24) / 7;
      wall.push([x, 0.48], [x, 0.56], [x - 0.09, 0.56], [x - 0.09, 0.48]);
    }
    wall.push([-0.62, 0.48]);
    const gate = new THREE.Path();
    gate.moveTo(-0.12, 0);
    gate.lineTo(-0.12, 0.2);
    gate.absarc(0, 0.2, 0.12, Math.PI, 0, true);
    gate.lineTo(0.12, 0);
    gate.closePath();
    const front = shape(wall);
    front.holes.push(gate);
    const keepOutline = shape(towers(0, 0.32, 1.05));
    keepOutline.holes.push(
      circle(0, 0.78, 0.07, true),
      poly(rect(-0.18, 0.45, -0.1, 0.58), true),
      poly(rect(0.1, 0.45, 0.18, 0.58), true),
    );
    t.part(keep, [
      card(keepOutline, C.dusty, 0),
      card(
        shape([
          [-0.38, 1.05],
          [0, 1.45],
          [0.38, 1.05],
        ]),
        C.persimmon,
        0.01,
      ),
      card(
        shape([
          [0, 1.45],
          [0, 1.62],
          [0.17, 1.56],
          [0.02, 1.5],
        ]),
        C.persimmon,
        0.005,
        0.015,
      ),
    ]);
    t.part(keep, [card(shape(rect(-0.3, 0.2, 0.3, 1.0)), C.apricot, -0.03, 0.01)], t.lamp);
    const towerParts = [card(front, C.apricot, 0)];
    for (const side of [-1, 1]) {
      const x = side * 0.6;
      const tower = shape(towers(x, 0.17, 0.82));
      tower.holes.push(poly(rect(x - 0.04, 0.45, x + 0.04, 0.6), true));
      towerParts.push(
        card(tower, C.apricot, 0.04),
        card(
          shape([
            [x - 0.22, 0.82],
            [x, 1.18],
            [x + 0.22, 0.82],
          ]),
          C.persimmon,
          0.05,
        ),
      );
    }
    t.part(castle, towerParts);
    t.part(castle, [card(shape(rect(-0.15, 0.0, 0.15, 0.36)), C.apricot, -0.03, 0.01)], t.lamp);
    // Firs pop up on each page.
    const firs = new THREE.Group();
    firs.position.set(0, 0.1, 0.45);
    book.add(firs);
    t.part(firs, [
      card(shape(fir(-1.0, 0, 0.62)), C.viridian, 0),
      card(shape(fir(-0.75, 0, 0.42)), C.deepViridian, 0.03),
      card(shape(fir(1.0, 0, 0.55)), C.viridian, 0),
    ]);
    ticks.push((angle) => {
      const open = 0.5 + 0.5 * Math.sin(angle); // 0 half-shut … 1 flat open
      const lift = 0.2 * (1 - open);
      pages[0].rotation.z = -lift;
      pages[1].rotation.z = lift;
      castle.rotation.x = -0.55 * (1 - open);
      keep.rotation.x = -0.75 * (1 - open);
      firs.rotation.x = -0.9 * (1 - open);
    });
    return t.finish();
  },
};

/** Camera per subject: near-frontal, a little above, a little to the right so the layers stack. */
const pitches: Record<Kind, number> = { travel: 6, reading: 12 };

export function paperLook(kind: Kind): ObjectLook {
  return {
    rig: {
      both: {
        toneMapping: "aces",
        environment: { kind: "room", intensity: 0.25 },
        key: { color: 0xffe6c7, intensity: 3.1, position: [-4, 6, 8], shadowRadius: 5, shadowMapSize: 1024 },
        rim: { intensity: 0.5 },
      },
      light: { exposure: 1.0, hemisphere: { sky: 0xfff4e4, ground: 0x8a7462, intensity: 1.15 } },
      // A lamp-lit theatre: little ambient, the warm key pooling on the stage.
      dark: {
        exposure: 1.0,
        hemisphere: { sky: 0x8796b8, ground: 0x15161c, intensity: 0.16 },
        // Footlights: the key comes from low in front, so flats throw their shadows up the stage.
        key: { intensity: 3.6, color: 0xffcf96, position: [-2.5, -0.6, 8] },
        rim: { intensity: 0.9, color: 0x9fb8ff },
      },
    },
    camera: { projection: "perspective", fov: 30, pitch: pitches[kind], yaw: 9 },
    framing: { fill: 0.72, maxWidth: 0.8, sample: "rest" },
    castShadows: true,
  };
}

export function paperWorld(kind: Kind, ticks: Tick[]) {
  return scenes[kind](ticks);
}
