// Studio subject "Reading", drawn for Ink line art: an open hardback lying on the table, one page
// lifting from the right, curling over the gutter and settling on the left. Covers, spine and the
// two page blocks are separate parts, so each draws its own silhouette; the page edges show as ink
// lines on the tail and fore-edge, the text as ink strokes that follow the curve of the pages. The
// one cobalt part is the ribbon bookmark, out of the gutter and over the tail onto the table.
//
// The turning page is a flipbook of rigid poses, never a deforming mesh: each pose is its own
// static geometry (so a renderer that bakes crease lines and silhouette normals once per mesh draws
// it correctly), and between poses the nearest one turns rigidly about the gutter, so the motion
// stays continuous. The page lands exactly over the left page with the left page's own text on
// its back, so the reset (the page back on the right, over identical text) cannot be seen.
//
// Role contract (shared with the Ink renderer): every mesh carries `userData.inkRole`, one of
// "paper", "shade", "dark" (ink-filled) or "accent". The materials here are plain placeholders.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ObjectLook } from "./look";
import type { InkRole } from "./ink";

/** Every Studio subject stands on the same tabletop. */
const FLOOR = -1;
/** The take, in ms: a hold, the turn, the settle, then a hold again. */
const LOOP = 7200;
const TURN_START = 1500,
  TURN_END = 3900,
  SWAP = 4300;
/** Rigid poses the turning page is drawn from. */
const POSES = 30;

/* ---------------------------------------------------------------- Small helpers (kept local) */

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const progress = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const wrap = (time: number, loop: number) => ((time % loop) + loop) % loop;

/** One plain material per ink role; the renderer swaps them for its own and reads the tag. */
function roleMaterials(): Record<InkRole, THREE.MeshBasicMaterial> {
  const make = (role: InkRole) => {
    const material = new THREE.MeshBasicMaterial();
    material.userData.inkRole = role;
    return material;
  };
  return { paper: make("paper"), shade: make("shade"), dark: make("dark"), accent: make("accent") };
}

function part(geometry: THREE.BufferGeometry, role: InkRole, materials: Record<InkRole, THREE.Material>) {
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, materials[role]);
  mesh.userData.inkRole = role;
  // An ink-filled stroke is its own line: a crease in the paper tone would hollow it out.
  if (role === "dark") mesh.userData.inkCreases = false;
  return mesh;
}

/** Position and normal only, non-indexed: the common shape for merging. */
function baked(geometry: THREE.BufferGeometry) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", source.getAttribute("position").clone());
  if (!source.getAttribute("normal")) source.computeVertexNormals();
  out.setAttribute("normal", source.getAttribute("normal").clone());
  if (source !== geometry) source.dispose();
  geometry.dispose();
  return out;
}

/** Merge geometries of one role into one mesh. */
function merged(geometries: THREE.BufferGeometry[], role: InkRole, materials: Record<InkRole, THREE.Material>) {
  const parts = geometries.map(baked);
  const geometry = mergeGeometries(parts, false)!;
  parts.forEach((g) => g.dispose());
  return part(geometry, role, materials);
}

/** Triangles from quads, each wound to face `facing`; flat normals. */
class Quads {
  private positions: number[] = [];
  private ab = new THREE.Vector3();
  private ac = new THREE.Vector3();
  add(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, facing: THREE.Vector3) {
    const n = this.ab.subVectors(b, a).cross(this.ac.subVectors(c, a));
    const order = n.dot(facing) >= 0 ? [a, b, c, a, c, d] : [a, c, b, a, d, c];
    for (const p of order) this.positions.push(p.x, p.y, p.z);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    g.computeVertexNormals();
    return g;
  }
}

/** A closed prism: a 2D profile in the xy plane extruded along z, centred on z = 0. */
function prism(profile: THREE.Vector2[], depth: number) {
  return new THREE.ExtrudeGeometry(new THREE.Shape(profile), { depth, bevelEnabled: false, steps: 1 }).translate(
    0,
    0,
    -depth / 2,
  );
}

const v2 = (x: number, y: number) => new THREE.Vector2(x, y);
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const Z = v3(0, 0, 1);

/* ---------------------------------------------------------------- The book */

/**
 * An open book with a page turning, for Ink line art. Returns a Studio subject: a group with
 * `userData.animate(time)`, `loopDuration`, `restTime`, `pose`, `phase`, `style` and `look`.
 */
export function reading() {
  const materials = roleMaterials();
  const root = new THREE.Group();
  const book = new THREE.Group();
  const BASE_YAW = -0.38;
  book.rotation.y = BASE_YAW;
  book.position.set(0, FLOOR, -0.1);
  root.add(book);

  // The book's frame: x across the spread (gutter at x = 0), y up from the table, z along the
  // spine with the tail towards the lens. Each half is drawn in an untilted frame (x' from the
  // gutter outwards, y' up from the cover's underside), then tilted up towards the spine, the way
  // an open hardback bows, and shifted so the gutter sits on x = 0.
  const PW = 1.4, // page width
    PH = 1.95, // page height (along z)
    CT = 0.045, // cover board
    BH = 0.15, // page block
    OVER = 0.05, // cover overhang
    GAP = 0.03, // half the gap between the boards at the spine
    ALPHA = 0.06; // tilt of each half
  const XO = PW + OVER;
  const rawTilt = (x: number, y: number) => {
    const dx = x - XO;
    return v2(XO + dx * Math.cos(ALPHA) + y * Math.sin(ALPHA), -dx * Math.sin(ALPHA) + y * Math.cos(ALPHA));
  };
  const shift = rawTilt(0, CT).x;
  /** Untilted half coordinates to the book's frame; side -1 mirrors to the left half. */
  const tilt = (x: number, y: number, side = 1) => {
    const p = rawTilt(x, y);
    return v2(side * (p.x - shift), p.y);
  };
  /** The page block's top at distance `u` from the gutter: thin at the gutter, full by mid-page. */
  const top = (u: number) => CT + BH * (1 - Math.exp(-u / 0.16)) * (1 - (0.06 * u) / PW);
  /** A point on the top page of one half, and its outward (upward) normal. */
  const surface = (u: number, side: number) => {
    const p = tilt(u, top(u), side);
    const q = tilt(u + 1e-4, top(u + 1e-4), side);
    const t = q.sub(p).normalize();
    // The tangent runs away from the gutter; its upward normal is a quarter turn towards +y.
    const n = side > 0 ? v2(-t.y, t.x) : v2(t.y, -t.x);
    return { p, n };
  };
  const hinge = tilt(0, CT);

  /* Covers, spine and page blocks: static, merged per role. */
  const shade: THREE.BufferGeometry[] = [],
    paper: THREE.BufferGeometry[] = [],
    ink: THREE.BufferGeometry[] = [];
  const blockU = Array.from({ length: 29 }, (_, i) => PW * (i / 28) ** 1.6);
  for (const side of [1, -1]) {
    const cover = [tilt(GAP, 0, side), tilt(XO, 0, side), tilt(XO, CT, side), tilt(GAP, CT, side)];
    shade.push(prism(cover, PH + 2 * OVER));
    const block = [tilt(0, CT, side), ...blockU.slice(1).map((u) => tilt(u, top(u), side)), tilt(PW, CT, side)];
    paper.push(prism(block, PH));
  }
  // Spine: fills the gap between the boards and rounds under it to the table.
  const sTop = tilt(GAP, CT),
    sLow = tilt(GAP, 0);
  const spine = [sTop, sLow];
  for (let i = 1; i < 12; i++) {
    const a = (i / 12) * Math.PI;
    spine.push(v2(sLow.x * Math.cos(a), sLow.y * (1 - Math.sin(a)) + 0.002 * Math.sin(a)));
  }
  spine.push(v2(-sLow.x, sLow.y), v2(-sTop.x, sTop.y));
  shade.push(prism(spine, PH + 2 * OVER));

  /* Page edges: ink lines on the tail (following the block's curve) and along the fore-edge. */
  const LINE = 0.011;
  const tailLines = new Quads();
  for (const side of [1, -1])
    for (const f of [0.36, 0.7]) {
      const pts = Array.from({ length: 21 }, (_, i) => {
        const u = 0.03 + (PW - 0.03) * (i / 20) ** 1.4;
        return tilt(u, CT + (top(u) - CT) * f, side);
      });
      const z = PH / 2 + 0.002;
      for (let i = 0; i < pts.length - 1; i++) {
        const d = pts[i + 1].clone().sub(pts[i]).normalize();
        const n = v2(-d.y, d.x).multiplyScalar(LINE / 2);
        tailLines.add(
          v3(pts[i].x - n.x, pts[i].y - n.y, z),
          v3(pts[i + 1].x - n.x, pts[i + 1].y - n.y, z),
          v3(pts[i + 1].x + n.x, pts[i + 1].y + n.y, z),
          v3(pts[i].x + n.x, pts[i].y + n.y, z),
          Z,
        );
      }
      // Along the fore-edge face.
      const h = CT + (top(PW) - CT) * f;
      const a = tilt(PW + 0.002, h - LINE / 2, side),
        b = tilt(PW + 0.002, h + LINE / 2, side);
      const out = tilt(PW + 1, h, side).sub(tilt(PW, h, side));
      const zEnd = PH / 2 - 0.004;
      tailLines.add(v3(a.x, a.y, -zEnd), v3(a.x, a.y, zEnd), v3(b.x, b.y, zEnd), v3(b.x, b.y, -zEnd), v3(out.x, out.y, 0));
    }
  ink.push(tailLines.geometry());

  /* Text: strokes across each page, following its curve. Rows run head to tail. */
  const S = 0.03;
  const ROW_PITCH = 0.185,
    ROW0 = -0.66;
  const U0 = 0.2,
    U1 = PW - 0.15;
  /** Distance from the gutter of a share of the text width: lines start at the page's left edge (the gutter on a right page, the outer edge on a left one). */
  const textU = (share: number, side: number) => (side > 0 ? lerp(U0, U1, share) : lerp(U1, U0, share));
  /** Per row: [start, end] as shares of the text width, or null for a blank row. */
  const layouts: Record<"left" | "right", ([number, number] | null)[]> = {
    left: [[0, 0.5], null, [0, 1], [0, 1], [0, 1], [0, 0.62], [0.08, 1], [0, 1]],
    right: [
      [0, 1],
      [0, 1],
      [0, 0.7],
      [0.08, 1],
      [0, 1],
      [0, 1],
      [0, 0.45],
      [0.08, 1],
    ],
  };
  /** Where strokes bend: dense near the gutter, where the page curves most, so no chord dips under the page. */
  const GRID_U = Array.from({ length: 13 }, (_, k) => U0 + (U1 - U0) * (k / 12) ** 1.6);
  /**
   * Add one stroke from `from` to `to` along a curve (`at(x)` → point and outward normal), bending
   * at the `grid` positions between them, lifted `lift` off the curve.
   */
  const strokeAlong = (
    quads: Quads,
    at: (x: number) => { p: THREE.Vector2; n: THREE.Vector2 },
    from: number,
    to: number,
    grid: number[],
    z: number,
    lift: number,
    width: number,
  ) => {
    const lo = Math.min(from, to),
      hi = Math.max(from, to);
    const xs = [lo, ...grid.filter((x) => x > lo + 1e-4 && x < hi - 1e-4), hi];
    let prev = at(xs[0]);
    for (let i = 1; i < xs.length; i++) {
      const next = at(xs[i]);
      const p0 = prev.p.clone().addScaledVector(prev.n, lift),
        p1 = next.p.clone().addScaledVector(next.n, lift);
      const facing = v3(prev.n.x + next.n.x, prev.n.y + next.n.y, 0);
      quads.add(
        v3(p0.x, p0.y, z - width / 2),
        v3(p1.x, p1.y, z - width / 2),
        v3(p1.x, p1.y, z + width / 2),
        v3(p0.x, p0.y, z + width / 2),
        facing,
      );
      prev = next;
    }
  };
  const pageText = new Quads();
  for (const side of [1, -1]) {
    const layout = layouts[side > 0 ? "right" : "left"];
    layout.forEach((span, row) => {
      if (!span) return;
      const z = ROW0 + row * ROW_PITCH;
      const width = side < 0 && row === 0 ? S * 1.35 : S;
      const [a, b] = span.map((k) => textU(k, side));
      strokeAlong(pageText, (u) => surface(u, side), a, b, GRID_U, z, 0.004, width);
    });
  }
  ink.push(pageText.geometry());

  /* The ribbon: out of the gutter, over the tail and onto the table. The one accent part. */
  const ribbon = ribbonGeometry(
    [
      v3(0, hinge.y - 0.004, PH / 2 - 0.35),
      v3(0, hinge.y - 0.004, PH / 2 + 0.01),
      v3(0.012, hinge.y - 0.025, PH / 2 + OVER + 0.05),
      v3(0.045, 0.045, PH / 2 + OVER + 0.16),
      v3(0.11, 0.006, PH / 2 + OVER + 0.32),
      v3(0.3, 0.006, PH / 2 + OVER + 0.47),
      v3(0.56, 0.006, PH / 2 + OVER + 0.52),
    ],
    0.085,
    0.01,
  );

  book.add(merged(shade, "shade", materials), merged(paper, "paper", materials), merged(ink, "dark", materials));
  book.add(part(ribbon, "accent", materials));

  /* The turning page. */
  // The right page's top surface by arc length, from the gutter: the page lies exactly on it.
  const dense = Array.from({ length: 401 }, (_, i) => PW * (i / 400) ** 1.6);
  const arc: number[] = [0];
  for (let i = 1; i < dense.length; i++) arc.push(arc[i - 1] + surface(dense[i], 1).p.distanceTo(surface(dense[i - 1], 1).p));
  const L = arc[arc.length - 1];
  /** Arc length at distance `u` from the gutter, and the tangent angle at arc length `s`. */
  const arcAt = (u: number) => {
    let i = 1;
    while (i < dense.length - 1 && dense[i] < u) i++;
    return lerp(arc[i - 1], arc[i], (u - dense[i - 1]) / (dense[i] - dense[i - 1]));
  };
  const angleAt = (s: number) => {
    let i = 1;
    while (i < arc.length - 1 && arc[i] < s) i++;
    const u = lerp(dense[i - 1], dense[i], (s - arc[i - 1]) / Math.max(1e-9, arc[i] - arc[i - 1]));
    const { n } = surface(u, 1);
    return Math.atan2(-n.x, n.y); // the tangent: a quarter turn clockwise from the normal
  };
  /** How far the free edge leads (early) or trails (late) the hinge, in radians, at turn share q. */
  const lead = (q: number) => 1.45 * Math.sin(Math.PI * q) * (1 - 1.6 * q);
  // Thin and close to the page below, so the page over the left or right page draws its strokes
  // within a pixel of the strokes it covers (the reset moves them by under a pixel at 573px).
  const LIFT = 0.008,
    TH = 0.004;
  const SAMPLES = 30;
  const s = Array.from({ length: SAMPLES + 1 }, (_, j) => L * (j / SAMPLES) ** 1.35);
  const phis = s.map(angleAt);
  /** The page's centre line and normals at turn share q, relative to the hinge. */
  const poseAt = (q: number) => {
    const a = s.map((x, j) => lerp(phis[j], Math.PI - phis[j], q) + lead(q) * (x / L) ** 1.2);
    const p = [v2(0, 0)];
    for (let j = 1; j <= SAMPLES; j++) {
      const mid = (a[j - 1] + a[j]) / 2,
        ds = s[j] - s[j - 1];
      p.push(p[j - 1].clone().add(v2(Math.cos(mid) * ds, Math.sin(mid) * ds)));
    }
    const n = a.map((angle) => v2(-Math.sin(angle), Math.cos(angle)));
    /** Point and front normal at arc length `x`. */
    const at = (x: number) => {
      let j = 1;
      while (j < SAMPLES && s[j] < x) j++;
      const k = (x - s[j - 1]) / (s[j] - s[j - 1]);
      return { p: p[j - 1].clone().lerp(p[j], k), n: n[j - 1].clone().lerp(n[j], k).normalize() };
    };
    return { p, n, at, chord: Math.atan2(p[SAMPLES].y, p[SAMPLES].x) };
  };
  const pivot = v2(hinge.x, hinge.y + LIFT);
  const GRID_S = GRID_U.map(arcAt);
  const poses: THREE.Group[] = [],
    chords: number[] = [];
  for (let k = 0; k < POSES; k++) {
    const q = k / (POSES - 1);
    const { p, n, at, chord } = poseAt(q);
    chords.push(chord);
    const sheet = sheetGeometry(p, n, TH, PH - 0.008);
    const text = new Quads();
    for (const [face, layout] of [
      [1, layouts.right],
      [-1, layouts.left],
    ] as const)
      layout.forEach((span, row) => {
        if (!span) return;
        const z = ROW0 + row * ROW_PITCH;
        const width = face < 0 && row === 0 ? S * 1.35 : S;
        const [a, b] = span.map((share) => arcAt(textU(share, face)));
        const front = (x: number) => {
          const point = at(x);
          return { p: point.p, n: point.n.multiplyScalar(face) };
        };
        strokeAlong(text, front, a, b, GRID_S, z, TH / 2 + 0.004, width);
      });
    const group = new THREE.Group();
    group.position.set(pivot.x, pivot.y, 0);
    group.add(part(sheet, "paper", materials), part(text.geometry(), "dark", materials));
    group.visible = k === 0;
    book.add(group);
    poses.push(group);
  }

  root.userData.style = "ink";
  root.userData.loopDuration = LOOP;
  // At rest the page is past upright and falling, curled over the gutter, its text towards the lens.
  root.userData.restTime = 3100;
  root.userData.animate = (time: number) => {
    const t = wrap(time, LOOP);
    book.rotation.y = BASE_YAW + 0.06 * Math.sin((t / LOOP) * Math.PI * 2);
    const q = t >= TURN_START && t < SWAP ? smootherstep(progress(t, TURN_START, TURN_END)) : 0;
    // The pose just behind the page's travel, turned about the gutter until its free edge meets
    // the true page's: the edge moves continuously and the page never dips into a block.
    const index = q < 0.5 ? Math.floor(q * (POSES - 1)) : Math.ceil(q * (POSES - 1));
    const chord = poseAt(q).chord;
    poses.forEach((pose, k) => {
      pose.visible = k === index;
      // Every pose turns with the page, shown or not, so each one reads as a moving part.
      pose.rotation.z = chord - chords[k];
    });
    root.userData.phase = t < TURN_START ? "read" : t < TURN_END ? "turn-page" : t < SWAP ? "settle-page" : "read";
    root.userData.pose = t / LOOP;
  };
  // A higher lens than the laptop's, so the pages read as surfaces and the text as lines.
  const look: ObjectLook = {
    camera: { projection: "perspective", fov: 30, pitch: 34 },
    framing: { fill: 0.78, maxWidth: 0.9, lift: 0 },
    contactShadow: { spread: 1.0, opacity: 0.32 },
  };
  root.userData.look = look;
  return root;
}

/**
 * A thin closed sheet along a 2D centre line `p` (normals `n`), `thickness` thick and `depth` long
 * in z, built from quads only: smooth across its faces (no crease inside them), hard at its rim.
 */
function sheetGeometry(p: THREE.Vector2[], n: THREE.Vector2[], thickness: number, depth: number) {
  const quads = new Quads();
  const z0 = -depth / 2,
    z1 = depth / 2;
  const f = p.map((pt, j) => pt.clone().addScaledVector(n[j], thickness / 2));
  const b = p.map((pt, j) => pt.clone().addScaledVector(n[j], -thickness / 2));
  const P = (q: THREE.Vector2, z: number) => v3(q.x, q.y, z);
  for (let j = 0; j < p.length - 1; j++) {
    const out = v3(n[j].x + n[j + 1].x, n[j].y + n[j + 1].y, 0);
    quads.add(P(f[j], z0), P(f[j + 1], z0), P(f[j + 1], z1), P(f[j], z1), out);
    quads.add(P(b[j], z0), P(b[j + 1], z0), P(b[j + 1], z1), P(b[j], z1), out.clone().negate());
    quads.add(P(f[j], z0), P(f[j + 1], z0), P(b[j + 1], z0), P(b[j], z0), v3(0, 0, -1));
    quads.add(P(f[j], z1), P(f[j + 1], z1), P(b[j + 1], z1), P(b[j], z1), Z);
  }
  const last = p.length - 1;
  const ahead = p[last].clone().sub(p[last - 1]),
    behind = p[0].clone().sub(p[1]);
  quads.add(P(f[last], z0), P(b[last], z0), P(b[last], z1), P(f[last], z1), v3(ahead.x, ahead.y, 0));
  quads.add(P(f[0], z0), P(b[0], z0), P(b[0], z1), P(f[0], z1), v3(behind.x, behind.y, 0));
  return quads.geometry();
}

/**
 * A flat ribbon along `points`: three vertices across (so its end can take a swallowtail notch),
 * `width` wide and `thickness` thick, its face kept level across.
 */
function ribbonGeometry(points: THREE.Vector3[], width: number, thickness: number) {
  const curve = new THREE.CatmullRomCurve3(points);
  const N = 44;
  const up = v3(0, 1, 0);
  // The last ring sits one long step (the tail) past the others; its centre falls back to the
  // middle of that step, cutting a swallowtail notch with no folded faces.
  const tail = 0.12 / curve.getLength();
  const ringAt = (u: number) => {
    const c = curve.getPointAt(u);
    c.y = Math.max(c.y, thickness / 2 + 0.001);
    const t = curve.getTangentAt(u);
    const side = t.clone().cross(up).normalize();
    const normal = side.clone().cross(t).normalize();
    return [-1, 0, 1].flatMap((k) =>
      [1, -1].map((f) =>
        c
          .clone()
          .addScaledVector(side, (k * width) / 2)
          .addScaledVector(normal, (f * thickness) / 2),
      ),
    );
  };
  const rings: THREE.Vector3[][] = [];
  for (let i = 0; i < N; i++) rings.push(ringAt(((1 - tail) * i) / (N - 1)));
  const end = ringAt(1),
    notch = ringAt(1 - tail / 2);
  rings.push([end[0], end[1], notch[2], notch[3], end[4], end[5]]);
  // ring layout: [left top, left bottom, centre top, centre bottom, right top, right bottom]
  const quads = new Quads();
  const centre = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const a = rings[i],
      b = rings[i + 1];
    const normal = a[2].clone().sub(a[3]);
    const side = a[4].clone().sub(a[0]);
    quads.add(a[0], b[0], b[2], a[2], normal);
    quads.add(a[2], b[2], b[4], a[4], normal);
    quads.add(a[1], b[1], b[3], a[3], normal.clone().negate());
    quads.add(a[3], b[3], b[5], a[5], normal.clone().negate());
    quads.add(a[0], b[0], b[1], a[1], side.clone().negate());
    quads.add(a[4], b[4], b[5], a[5], side);
  }
  const first = rings[0],
    last = rings[N];
  const back = curve.getTangentAt(0).negate();
  quads.add(first[0], first[2], first[3], first[1], back);
  quads.add(first[2], first[4], first[5], first[3], back);
  const ahead = curve.getTangentAt(1);
  quads.add(last[0], last[2], last[3], last[1], ahead.clone().add(centre.subVectors(last[0], last[2]).normalize()));
  quads.add(last[2], last[4], last[5], last[3], ahead.clone().add(centre.subVectors(last[4], last[2]).normalize()));
  return quads.geometry();
}
