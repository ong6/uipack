// Paper worlds (art direction 1): a toy theatre per subject. An open-front proscenium with nested
// arches, a box with side walls, a backdrop and four to six cut-card flats stepped back in depth,
// lit by one warm key whose shadow falls between the layers. Every flat is extruded card with a
// lighter cut edge (its white core) and the shared fibre texture; static card is merged into one
// mesh per scene, so a whole stage costs a handful of draw calls.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { contactShadow, lookMaterial, themed, type ObjectLook } from "./look";
import { TAU, type Tick } from "./procedural";

type Pt = [number, number];
type Kind = "ai" | "tennis" | "trading" | "server" | "travel" | "reading";

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

/** A cog outline: `teeth` trapezoid teeth on module 0.052, with a round hub hole. */
function cog(teeth: number, hub = 0.06) {
  const r = (teeth * 0.052) / 2;
  const points: Pt[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU,
      s = TAU / teeth;
    for (const [da, rr] of [
      [0, r - 0.05],
      [s * 0.18, r + 0.045],
      [s * 0.42, r + 0.045],
      [s * 0.6, r - 0.05],
    ] as const)
      points.push([Math.cos(a + da) * rr, Math.sin(a + da) * rr]);
  }
  const outline = shape(points);
  outline.holes.push(circle(0, 0, hub, true));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    if (r > 0.3) outline.holes.push(circle(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.2, true));
  }
  return { outline, r };
}

/** Arch tops for the proscenium opening, as y offsets above SPRING for x in -1..1. */
const arches = {
  round: (x: number) => 0.62 * Math.sqrt(Math.max(0, 1 - x * x)),
  pointed: (x: number) => (0.82 * Math.sqrt(Math.max(0, 2.56 - (Math.abs(x) + 0.6) ** 2))) / 1.483,
  scallop: (x: number) => 0.7 - 0.13 * Math.abs(Math.sin(Math.PI * 3.5 * (x + 1))),
  gable: (x: number) => 0.7 * (1 - Math.abs(x)) + 0.05,
  stepped: (x: number) => 0.12 + 0.19 * Math.min(3, Math.floor(4 * (1 - Math.abs(x)))),
  flat: (x: number) => 0.55 * Math.sqrt(Math.max(0, 1 - Math.max(0, (Math.abs(x) - 0.78) / 0.22) ** 2)),
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

/** The set uses two frame colours, alternating card to card, so the six stages read as one set. */
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

  /**
   * Centre court seen from behind the baseline: a long raked court with doubles alleys and service
   * boxes, a low net across it, stands behind, and two paper players rallying a ball on a wire.
   */
  tennis(ticks) {
    const t = new Theatre({
      frame: FRAMES.persimmon,
      trims: [C.cream, C.viridian],
      arch: "flat",
      backdrop: 0xf4dcc0,
      floor: C.sand,
    });
    // Two flats of crowd: scalloped tops read as rows of heads.
    const crowd = (top: number, bump: number, phase: number): Pt[] => [
      [-1.85, FLOOR],
      ...sample(90, (s) => [-1.85 + 3.7 * s, top + bump * Math.abs(Math.sin(Math.PI * (s * 18 + phase)))] as Pt),
      [1.85, FLOOR],
    ];
    t.add(card(shape(crowd(0.52, 0.08, 0)), 0xb4c8d1, -0.76));
    const stand = t.hinge(-0.68);
    t.part(stand, [card(shape(crowd(0.2, 0.085, 0.5).map(([x, y]) => [x, y - FLOOR] as Pt)), C.slate, 0)]);
    // The court, a raked pop-up riser seated on the stage floor: it rises gently from a fold tab at its
    // near baseline to a back wall, with card cheeks down to the floor and a soft shadow under it.
    // Court units: x across (doubles ±0.5), y along its length (baselines at 0.06 and 1.56, net at
    // 0.81), scaled by SC so the riser stands clear of the crowd flats.
    const RAKE = 0.44;
    const SC = 0.88;
    const NEAR_Z = 0.84;
    const onCourt = (x: number, y: number) =>
      new THREE.Vector3(x * SC, FLOOR + 0.004 + y * SC * Math.sin(RAKE), NEAR_Z - y * SC * Math.cos(RAKE));
    const court = new THREE.Group();
    court.position.set(0, FLOOR + 0.004, NEAR_Z);
    court.rotation.x = -Math.PI / 2 + RAKE;
    court.scale.setScalar(SC);
    t.root.add(court);
    {
      const far = onCourt(0, 1.68),
        hw = 0.68 * SC,
        depth = NEAR_Z - far.z,
        top = far.y - FLOOR;
      // Cheeks: right triangles under the court's sides, cut card standing on the floor.
      for (const side of [-1, 1])
        t.add(
          card(
            shape([
              [0, FLOOR],
              [depth, FLOOR],
              [depth, FLOOR + top],
            ]),
            C.deepViridian,
            0,
          )
            .rotateY(Math.PI / 2)
            .translate(side * hw - (side > 0 ? CARD : 0), 0, NEAR_Z),
        );
      t.add(card(shape(rect(-hw, FLOOR, hw, FLOOR + top)), C.deepViridian, far.z - CARD));
      // The fold tab the riser is glued down by, a little proud of the near baseline.
      t.add(block(2 * hw + 0.06, 0.008, 0.1, C.deepViridian, 0, FLOOR + 0.004, NEAR_Z + 0.06));
      t.root.add(
        contactShadow(2 * hw + 0.5, depth + 0.4, { y: FLOOR + 0.006, z: (NEAR_Z + far.z) / 2, opacity: 0.4, color: 0x2a1c12 }),
      );
    }
    const NET = 0.81,
      HALF = 0.75,
      W = 0.5,
      S = 0.37,
      SERVICE = 0.4;
    const L = 0.022; // line width
    const courtParts = [card(shape(rect(-0.68, -0.04, 0.68, 1.68)), C.viridian, 0, 0.02)];
    const line = (x0: number, y0: number, x1: number, y1: number) =>
      courtParts.push(card(shape(rect(x0, y0, x1, y1)), C.cream, 0.022, 0.008));
    for (const y of [NET - HALF, NET + HALF]) line(-W, y - L / 2, W, y + L / 2); // baselines
    for (const x of [-W, W, -S, S]) line(x - L / 2, NET - HALF, x + L / 2, NET + HALF); // sidelines
    for (const y of [NET - SERVICE, NET + SERVICE]) line(-S, y - L / 2, S, y + L / 2); // service lines
    line(-L / 2, NET - SERVICE, L / 2, NET + SERVICE); // centre service line
    t.part(court, courtParts);
    // The net: low across the court's width, its mesh cut out of the card, a white tape on top.
    const net = onCourt(0, NET);
    const NET_H = 0.12;
    const netCard = shape(rect(-0.57, 0, 0.57, NET_H));
    for (let i = 0; i < 18; i++)
      for (let j = 0; j < 2; j++)
        netCard.holes.push(poly(rect(-0.54 + i * 0.0605, 0.012 + j * 0.036, -0.502 + i * 0.0605, 0.04 + j * 0.036), true));
    const netGroup = new THREE.Group();
    netGroup.position.copy(net);
    netGroup.scale.set(SC, 1, 1);
    t.root.add(netGroup);
    t.part(netGroup, [
      card(netCard, C.ink, 0, 0.016),
      card(shape(rect(-0.57, NET_H - 0.03, 0.57, NET_H)), C.cream, 0.018, 0.008),
      card(shape(rect(-0.6, -0.02, -0.56, NET_H + 0.025)), C.ink, 0),
      card(shape(rect(0.56, -0.02, 0.6, NET_H + 0.025)), C.ink, 0),
    ]);
    // A player: ink silhouette, coloured shirt, and a racket arm on a shoulder pin. The racket is part
    // of the arm's own mesh (hand, grip, open throat, oval strung head), so it can never come loose.
    const SWING = [-0.9, 0.15]; // arm angle: wound back … level at the hit (a forehand)
    const player = (x: number, base: THREE.Vector3, scale: number, facing: 1 | -1, shirt: number) => {
      const body = new THREE.Group();
      body.position.set(x, base.y, base.z);
      body.scale.set(scale * facing, scale, scale);
      t.root.add(body);
      t.part(body, [
        card(circle(0, 0.92, 0.1) as THREE.Shape, C.ink, 0),
        card(
          shape([
            [-0.14, 0.42],
            [-0.17, 0.79],
            [0.17, 0.79],
            [0.14, 0.42],
          ]),
          shirt,
          0.01,
        ),
        card(
          shape([
            [-0.14, 0.44],
            [-0.22, 0],
            [-0.11, 0],
            [0, 0.28],
            [0.11, 0],
            [0.22, 0],
            [0.14, 0.44],
          ]),
          C.ink,
          0,
        ),
        // The free arm, out for balance.
        card(
          shape([
            [-0.15, 0.76],
            [-0.36, 0.56],
            [-0.31, 0.5],
            [-0.11, 0.66],
          ]),
          C.apricot,
          0.005,
        ),
      ]);
      const arm = new THREE.Group();
      arm.position.set(0.12, 0.74, 0.035);
      body.add(arm);
      const head = shape(sample(40, (s) => [0.68 + 0.15 * Math.cos(s * TAU), 0.11 * Math.sin(s * TAU)]));
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 3; j++) {
          const cx = 0.6 + i * 0.052,
            cy = -0.05 + j * 0.05;
          if (((cx - 0.68) / 0.12) ** 2 + (cy / 0.085) ** 2 < 0.9)
            head.holes.push(poly(rect(cx - 0.018, cy - 0.017, cx + 0.018, cy + 0.017), true));
        }
      const throat = shape([
        [0.4, -0.022],
        [0.55, -0.08],
        [0.55, 0.08],
        [0.4, 0.022],
      ]);
      throat.holes.push(
        poly(
          [
            [0.45, 0],
            [0.535, -0.05],
            [0.535, 0.05],
          ],
          true,
        ),
      );
      t.part(arm, [
        card(
          shape([
            [0, -0.045],
            [0.27, -0.035],
            [0.27, 0.035],
            [0, 0.045],
          ]),
          C.apricot,
          0,
        ),
        card(shape(rect(0.24, -0.026, 0.42, 0.026)), C.ink, 0.004),
        card(throat, C.ink, 0.004),
        card(head, C.ink, 0.004),
        // The strings: cream card behind the head, showing through its cut mesh.
        card(shape(sample(30, (s) => [0.68 + 0.13 * Math.cos(s * TAU), 0.095 * Math.sin(s * TAU)])), C.cream, -0.01, 0.012),
      ]);
      arm.rotation.z = SWING[1];
      body.updateMatrixWorld(true);
      const strike = arm.localToWorld(new THREE.Vector3(0.68, 0, 0.03));
      return { arm, strike };
    };
    const far = player(-0.26, onCourt(-0.3, NET + HALF + 0.02), 0.74, 1, C.cream);
    const near = player(0.56, onCourt(0.6, 0.1), 0.94, -1, C.persimmon);
    // The ball rides a visible wire from racket to racket, high over the net.
    const a = far.strike,
      b = near.strike;
    const path = new THREE.CatmullRomCurve3([
      a,
      a
        .clone()
        .lerp(b, 0.4)
        .setY(net.y + 0.5),
      a
        .clone()
        .lerp(b, 0.72)
        .setY(net.y + 0.42),
      b,
    ]);
    t.add(tint(new THREE.TubeGeometry(path, 48, 0.011, 5, false), C.ink, new THREE.Color(C.ink)));
    const tennisBall = new THREE.Group();
    t.root.add(tennisBall);
    const ballCard = shape(sample(24, (s) => [0.075 * Math.cos(s * TAU), 0.075 * Math.sin(s * TAU)]));
    t.part(tennisBall, [
      card(ballCard, C.lemon, -0.02, 0.04),
      card(
        shape(
          sample(12, (s) => [-0.055 + 0.11 * s, 0.026 * Math.sin(s * TAU)]).concat(
            sample(12, (s) => [0.055 - 0.11 * s, 0.026 * Math.sin((1 - s) * TAU) + 0.014]),
          ),
        ),
        C.cream,
        0.022,
        0.008,
      ),
    ]);
    ticks.push((angle) => {
      const s = (1 - Math.cos(angle * 2)) / 2; // two rallies a loop
      tennisBall.position.copy(path.getPointAt(s));
      tennisBall.rotation.z = angle * 4;
      near.arm.rotation.z = SWING[0] + (SWING[1] - SWING[0]) * s ** 5;
      far.arm.rotation.z = SWING[0] + (SWING[1] - SWING[0]) * (1 - s) ** 5;
      stand.rotation.x = 0.03 * Math.sin(angle * 2);
    });
    return t.finish();
  },

  /** A paper head in profile with cogs turning inside a window in its skull, and an idea bulb. */
  ai(ticks) {
    const t = new Theatre({
      frame: FRAMES.viridian,
      trims: [C.apricot, C.persimmon],
      arch: "pointed",
      backdrop: C.cream,
      floor: C.sand,
      walls: 0xe9dcc6,
    });
    // A sunburst of rays on the backdrop.
    const rays = t.hinge(BACK + 0.04, 0.2);
    const rayParts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU,
        b = a + TAU / 32;
      rayParts.push(
        card(
          shape([
            [0, 0],
            [Math.cos(a) * 1.25, Math.sin(a) * 1.25],
            [Math.cos(b) * 1.25, Math.sin(b) * 1.25],
          ]),
          C.apricot,
          0,
          0.012,
        ),
      );
    }
    t.part(rays, rayParts);
    rays.position.x = 0.35;
    // Four cogs at three depths: one big drive behind, a meshing pair in the skull window, one below.
    const gears: [THREE.Object3D, number][] = [];
    const gear = (teeth: number, x: number, y: number, z: number, color: number, turns: number) => {
      const { outline } = cog(teeth);
      const g = new THREE.Group();
      g.position.set(x, y, z);
      t.root.add(g);
      t.part(g, [card(outline, color, 0, 0.04), card(circle(0, 0, 0.05) as THREE.Shape, C.ink, 0.045, 0.02)]);
      gears.push([g, turns]);
    };
    gear(24, 0.72, 0.28, -0.42, C.persimmon, 1);
    gear(12, 0.88 + 0.0, -0.66, -0.2, C.viridian, -2);
    gear(12, -0.62, 0.42, 0.06, C.persimmon, -2);
    gear(8, -0.12, 0.44, 0.1, C.viridian, 3);
    // The head: a profile facing right, with a round window cut in the skull.
    const profile: Pt[] = [
      [-0.85, FLOOR],
      [-0.82, -0.55],
      [-1.12, -0.25],
      [-1.24, 0.15],
      [-1.17, 0.58],
      [-0.95, 0.88],
      [-0.62, 1.05],
      [-0.22, 1.07],
      [0.06, 0.94],
      [0.22, 0.72],
      [0.27, 0.46],
      [0.37, 0.33],
      [0.34, 0.2],
      [0.47, -0.01],
      [0.34, -0.07],
      [0.37, -0.2],
      [0.31, -0.27],
      [0.35, -0.38],
      [0.22, -0.53],
      [0.0, -0.56],
      [-0.2, -0.64],
      [-0.24, FLOOR],
    ];
    const headGroup = t.hinge(0.38);
    const local = (p: Pt[]) => p.map(([x, y]) => [x, y - FLOOR] as Pt);
    const headLocal = shape(local(profile));
    headLocal.holes.push(circle(-0.5, 0.36 - FLOOR, 0.43, true));
    t.part(headGroup, [
      card(headLocal, C.dusty, 0, 0.04),
      card(
        withHoles(shape(sample(40, (s) => [-0.5 + 0.5 * Math.cos(s * TAU), 0.36 - FLOOR + 0.5 * Math.sin(s * TAU)])), [
          circle(-0.5, 0.36 - FLOOR, 0.43, true),
        ]),
        C.ink,
        0.045,
        0.02,
      ),
      card(circle(0.15, 0.36 - FLOOR, 0.05) as THREE.Shape, C.ink, 0.045, 0.015),
      card(
        shape(
          local([
            [-0.85, -0.85],
            [-0.24, -0.85],
            [-0.24, -0.78],
            [-0.85, -0.74],
          ]),
        ),
        C.slate,
        0.045,
        0.012,
      ),
    ]);
    // An idea bulb on a string, lamplit at night.
    const bulb = new THREE.Group();
    bulb.position.set(1.12, 1.3, 0.6);
    t.root.add(bulb);
    const glass = shape(
      sample(40, (s) => {
        const a = -Math.PI / 2 + 0.55 + s * (TAU - 1.1);
        return [0.2 * Math.cos(a), -0.72 + 0.2 * Math.sin(a)];
      }),
    );
    t.part(bulb, [
      card(shape(rect(-0.006, -0.5, 0.006, 0)), C.ink, 0, 0.012),
      card(shape(rect(-0.09, -0.62, 0.09, -0.5)), C.slate, 0.01, 0.03),
    ]);
    t.part(bulb, [card(glass, C.lemon, 0, 0.04)], t.lamp);
    ticks.push((angle) => {
      for (const [g, turns] of gears) g.rotation.z = -turns * angle;
      headGroup.rotation.x = 0.03 * Math.sin(angle);
      bulb.rotation.z = 0.12 * Math.sin(angle + 0.7);
      rays.rotation.z = 0.08 * Math.sin(angle);
    });
    return t.finish();
  },

  /** A night city of rack towers in receding flats, windows cut out over lamplit card. */
  server(ticks) {
    const t = new Theatre({
      frame: FRAMES.persimmon,
      trims: [C.cream, C.ink],
      arch: "stepped",
      backdrop: 0x9fbccb,
      floor: C.sand,
      walls: 0x86a6b6,
    });
    t.add(card(circle(1.1, 1.1, 0.22) as THREE.Shape, C.cream, BACK + CARD + 0.02));
    // Middle: rack towers with rows of unit slots.
    const midTowers: [number, number, number][] = [
      [-1.55, -0.85, 1.55],
      [-0.6, 0.05, 1.25],
      [0.3, 1.0, 1.7],
      [1.2, 1.85, 1.1],
    ];
    const midOutline: Pt[] = [
      [-1.85, FLOOR],
      [-1.85, FLOOR + 0.35],
    ];
    const midHoles: THREE.Path[] = [];
    for (const [x0, x1, h] of midTowers) {
      midOutline.push([x0, FLOOR + 0.35], [x0, FLOOR + h], [x1, FLOOR + h], [x1, FLOOR + 0.35]);
      for (let y = FLOOR + h - 0.2; y > FLOOR + 0.45; y -= 0.3) midHoles.push(poly(rect(x0 + 0.1, y, x1 - 0.22, y + 0.09), true));
    }
    midOutline.push([1.85, FLOOR + 0.35], [1.85, FLOOR]);
    t.part(t.root, [card(shape(midOutline.map(([x, y]) => [x * 0.995, y - 0.01] as Pt)), C.apricot, -0.37, 0.01)], t.lamp);
    t.add(card(withHoles(shape(midOutline), midHoles), C.viridian, -0.32));
    // Front: three tall ink racks with lit slots and status lights.
    const front = t.hinge(0.05);
    const racks: [number, number, number][] = [
      [-1.25, -0.5, 1.5],
      [-0.25, 0.55, 2.05],
      [0.85, 1.5, 1.3],
    ];
    const rackOutline: Pt[] = [
      [-1.85, 0],
      [-1.85, 0.18],
    ];
    const rackHoles: THREE.Path[] = [];
    const leds: THREE.BufferGeometry[] = [];
    for (const [x0, x1, h] of racks) {
      rackOutline.push([x0, 0.18], [x0, h], [x0 + 0.1, h + 0.06], [x1 - 0.1, h + 0.06], [x1, h], [x1, 0.18]);
      for (let y = h - 0.26, i = 0; y > 0.32; y -= 0.34, i++) {
        rackHoles.push(poly(rect(x0 + 0.1, y, x1 - 0.24, y + 0.11), true));
        leds.push(
          card(circle(x1 - 0.13, y + 0.055, 0.036) as THREE.Shape, i % 2 === 1 ? C.persimmon : C.sage, CARD + 0.004, 0.012),
        );
      }
    }
    rackOutline.push([1.85, 0.18], [1.85, 0]);
    t.part(front, [card(shape(rackOutline.map(([x, y]) => [x * 0.995, y - 0.01] as Pt)), C.apricot, -0.05, 0.01)], t.lamp);
    t.part(front, [card(withHoles(shape(rackOutline), rackHoles), C.ink, 0), ...leds]);
    // An antenna with a beacon on the tallest rack.
    t.part(front, [card(shape(rect(0.13, 2.1, 0.17, 2.4)), C.ink, 0, 0.02)]);
    const beacon = new THREE.Group();
    beacon.position.set(0.15, 2.42, 0.01);
    front.add(beacon);
    t.part(beacon, [card(circle(0, 0, 0.055) as THREE.Shape, C.persimmon, 0, 0.03)], t.lamp);
    // Packets ride a wire between the racks.
    const wire = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.55, FLOOR + 1.35, 0.2),
      new THREE.Vector3(-0.25, FLOOR + 1.15, 0.22),
      new THREE.Vector3(0.0, FLOOR + 1.0, 0.24),
      new THREE.Vector3(0.82, FLOOR + 0.98, 0.24),
    ]);
    t.add(tint(new THREE.TubeGeometry(wire, 32, 0.011, 5, false), C.ink, new THREE.Color(C.ink)));
    const packets = [0, 1].map(() => {
      const p = new THREE.Group();
      t.root.add(p);
      t.part(p, [
        card(shape(rect(-0.07, -0.16, 0.07, -0.04)), C.cream, 0, 0.025),
        card(shape(rect(-0.004, -0.04, 0.004, 0)), C.ink, 0, 0.01),
      ]);
      return p;
    });
    // The cloud drifts over the city.
    const drift = t.hinge(-0.15, 0);
    t.part(drift, [card(cloud(-0.95, 0.72, 0.8), C.cream, 0)]);
    t.part(drift, [card(shape(rect(-0.96, 0.8, -0.94, 1.3)), C.ink, -0.02, 0.01)]);
    ticks.push((angle) => {
      packets.forEach((p, i) => {
        const s = (1 - Math.cos(angle + i * Math.PI)) / 2;
        p.position.copy(wire.getPointAt(s));
      });
      beacon.scale.setScalar(0.8 + 0.35 * Math.max(0, Math.sin(angle * 6)));
      drift.position.x = 0.3 * Math.sin(angle);
      front.rotation.x = 0.02 * Math.sin(angle);
    });
    return t.finish();
  },

  /** A real accordion fold whose peaks trace the price line, breathing as it folds. */
  trading(ticks) {
    const t = new Theatre({
      frame: FRAMES.viridian,
      trims: [C.apricot, C.ink],
      arch: "gable",
      backdrop: 0xc9dbe2,
      floor: C.sand,
      walls: 0xb8ccd5,
    });
    // Chart paper: ruled lines on the backdrop.
    for (let i = 0; i < 4; i++)
      t.add(
        card(shape(rect(-1.85, FLOOR + 0.36 + i * 0.47, 1.85, FLOOR + 0.38 + i * 0.47)), 0xf3ebdd, BACK + CARD + 0.004, 0.006),
      );
    // A ticker board hangs across the stage on two cords: an ink band with price marks (an up or down
    // arrow and two dashes of figures) scrolling along it, wrapping round out of sight behind the frame.
    const BAND_Y = 0.8,
      BAND_Z = -0.3,
      BAND_H = 0.12;
    t.add(card(shape(rect(-1.85, BAND_Y - BAND_H, 1.85, BAND_Y + BAND_H)), C.ink, BAND_Z, 0.02));
    for (const x of [-1.15, 1.15]) t.add(card(shape(rect(x - 0.01, BAND_Y + BAND_H, x + 0.01, 1.26)), C.ink, BAND_Z, 0.012));
    const SPAN = 3.2,
      ENTRIES = 6;
    const ticker = Array.from({ length: ENTRIES }, (_, i) => {
      const entry = new THREE.Group();
      entry.position.set(0, BAND_Y, BAND_Z + 0.024);
      entry.scale.setScalar(1.25);
      t.root.add(entry);
      const up = i % 3 !== 1;
      t.part(entry, [
        card(
          shape(
            up
              ? [
                  [-0.07, -0.05],
                  [0.07, -0.05],
                  [0, 0.07],
                ]
              : [
                  [-0.07, 0.05],
                  [0.07, 0.05],
                  [0, -0.07],
                ],
          ),
          up ? C.sage : C.persimmon,
          0,
          0.008,
        ),
        card(shape(rect(0.11, -0.022, 0.27, 0.022)), C.cream, 0, 0.008),
        card(shape(rect(0.3, -0.022, 0.38, 0.022)), up ? C.sage : C.persimmon, 0, 0.008),
      ]);
      return entry;
    });
    const FOLDS = [0.38, 0.62, 0.5, 0.82, 0.7, 1.04, 0.92, 1.24, 1.44];
    const W = 0.41;
    const panels: THREE.Group[] = [];
    for (let i = 0; i < 8; i++) {
      const panel = new THREE.Group();
      panel.position.y = FLOOR;
      t.root.add(panel);
      panels.push(panel);
      const a = FOLDS[i],
        b = FOLDS[i + 1];
      const up = b > a;
      t.part(panel, [
        card(
          shape([
            [0, 0],
            [W, 0],
            [W, b],
            [0, a],
          ]),
          i % 2 ? C.apricot : C.cream,
          0,
          0.012,
        ),
        card(
          shape([
            [0, a - 0.1],
            [W, b - 0.1],
            [W, b],
            [0, a],
          ]),
          up ? C.viridian : C.persimmon,
          0.016,
          0.01,
        ),
        // A volume bar on every other panel only, so the fold stays legible on a small card.
        ...(i % 2
          ? []
          : [
              card(
                shape([
                  [0.14, 0.08],
                  [0.29, 0.08],
                  [0.29, Math.min(a, b) * 0.55],
                  [0.14, Math.min(a, b) * 0.55],
                ]),
                up ? C.sage : 0xf0a689,
                0.016,
                0.01,
              ),
            ]),
      ]);
    }
    // A price-arrow pennant on the last peak: a swallowtail flag with a cream up-arrow on it, flying
    // inwards so the gable never hides it.
    const pennant = new THREE.Group();
    t.root.add(pennant);
    t.part(pennant, [
      card(shape(rect(-0.016, 0, 0.016, 0.36)), C.ink, 0, 0.02),
      card(
        shape([
          [-0.016, 0.36],
          [-0.4, 0.36],
          [-0.33, 0.255],
          [-0.4, 0.15],
          [-0.016, 0.15],
        ]),
        C.persimmon,
        0,
        0.02,
      ),
      card(
        shape([
          [-0.23, 0.175],
          [-0.23, 0.24],
          [-0.28, 0.24],
          [-0.19, 0.33],
          [-0.1, 0.24],
          [-0.15, 0.24],
          [-0.15, 0.175],
        ]),
        C.cream,
        0.022,
        0.008,
      ),
    ]);
    ticks.push((angle) => {
      const theta = 0.62 + 0.16 * Math.sin(angle);
      const dx = W * Math.cos(theta),
        dz = W * Math.sin(theta);
      const x0 = -4.25 * dx;
      panels.forEach((panel, i) => {
        panel.position.x = x0 + i * dx;
        panel.position.z = 0.05 + (i % 2 ? dz : 0);
        panel.rotation.y = i % 2 ? theta : -theta;
      });
      pennant.position.set(x0 + 8 * dx, FLOOR + FOLDS[8], 0.05);
      pennant.rotation.y = 0.3 * Math.sin(angle * 2);
      // The ticker runs one full span a loop, each mark wrapping behind the frame.
      ticker.forEach((entry, i) => {
        // Offset half a slot, so no mark wraps at the loop's seam.
        const u = ((((i + 0.5) / ENTRIES - angle / TAU) % 1) + 1) % 1;
        entry.position.x = -1.83 + SPAN * u;
      });
    });
    return t.finish();
  },
};

/** Camera per subject: near-frontal, a little above, a little to the right so the layers stack. */
const pitches: Record<Kind, number> = { travel: 6, reading: 12, tennis: 22, ai: 6, server: 6, trading: 8 };

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
