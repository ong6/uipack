// Wireframe polyhedra for the deck's drifting backdrop (Polyhedra in kinetic.tsx): the solids as
// vertices and edges, a rotation, and an orthographic projection that sorts each edge into the near
// (solid) or far (dashed) half. Pure functions, so the drawing is testable without a browser.

export type Vec3 = readonly [number, number, number];

export type SolidName = "tetrahedron" | "cube" | "octahedron" | "icosahedron" | "dodecahedron" | "prism";

export interface Solid {
  vertices: readonly Vec3[];
  edges: readonly (readonly [number, number])[];
}

const PHI = (1 + Math.sqrt(5)) / 2;

/** Every pair of vertices at the shortest distance: the edges of a regular solid. */
function edgesByLength(vertices: readonly Vec3[]): [number, number][] {
  let min = Infinity;
  const d = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (let i = 0; i < vertices.length; i++)
    for (let j = i + 1; j < vertices.length; j++) min = Math.min(min, d(vertices[i], vertices[j]));
  const out: [number, number][] = [];
  for (let i = 0; i < vertices.length; i++)
    for (let j = i + 1; j < vertices.length; j++) if (d(vertices[i], vertices[j]) < min * 1.01) out.push([i, j]);
  return out;
}

/** Scale vertices so the farthest sits on the unit sphere. */
function unit(vertices: Vec3[]): Vec3[] {
  const r = Math.max(...vertices.map((v) => Math.hypot(...v)));
  return vertices.map((v) => [v[0] / r, v[1] / r, v[2] / r] as const);
}

function build(vertices: Vec3[]): Solid {
  const v = unit(vertices);
  return { vertices: v, edges: edgesByLength(v) };
}

const signs = [-1, 1];

export const SOLIDS: Record<SolidName, Solid> = {
  tetrahedron: /*#__PURE__*/ build([
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ]),
  cube: /*#__PURE__*/ build(signs.flatMap((x) => signs.flatMap((y) => signs.map((z) => [x, y, z] as Vec3)))),
  octahedron: /*#__PURE__*/ build([
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]),
  icosahedron: /*#__PURE__*/ build(
    signs.flatMap((a) => signs.flatMap((b) => [[0, a, b * PHI] as Vec3, [a, b * PHI, 0] as Vec3, [b * PHI, 0, a] as Vec3])),
  ),
  dodecahedron: /*#__PURE__*/ build([
    ...signs.flatMap((x) => signs.flatMap((y) => signs.map((z) => [x, y, z] as Vec3))),
    ...signs.flatMap((a) =>
      signs.flatMap((b) => [[0, a / PHI, b * PHI] as Vec3, [a / PHI, b * PHI, 0] as Vec3, [b * PHI, 0, a / PHI] as Vec3]),
    ),
  ]),
  // A triangular prism: two triangles and the three edges joining them (not regular, so its edges
  // are listed rather than found by length).
  prism: /*#__PURE__*/ (() => {
    const tri = [0, 1, 2].map((i) => [Math.cos((i * 2 * Math.PI) / 3), Math.sin((i * 2 * Math.PI) / 3)] as const);
    const vertices = unit([...tri.map(([x, y]) => [x, y, -0.8] as Vec3), ...tri.map(([x, y]) => [x, y, 0.8] as Vec3)]);
    const edges: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 0],
      [3, 4],
      [4, 5],
      [5, 3],
      [0, 3],
      [1, 4],
      [2, 5],
    ];
    return { vertices, edges };
  })(),
};

export const SOLID_NAMES = /*#__PURE__*/ Object.keys(SOLIDS) as SolidName[];

/** Rotate about x, then y, then z (radians). */
export function rotate(v: Vec3, rx: number, ry: number, rz: number): Vec3 {
  let [x, y, z] = v;
  let c = Math.cos(rx);
  let s = Math.sin(rx);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ry);
  s = Math.sin(ry);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(rz);
  s = Math.sin(rz);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
}

export interface Projected {
  /** SVG path data for the edges facing the viewer. */
  near: string;
  /** SVG path data for the edges behind the solid's centre (drawn dashed). */
  far: string;
  /** Screen positions of the vertices, nearest last. */
  points: { x: number; y: number; z: number }[];
}

/**
 * Project a solid, rotated, centred at (cx, cy) with circumradius `r`. An edge whose midpoint is
 * behind the centre plane goes in `far`.
 */
export function project(solid: Solid, cx: number, cy: number, r: number, rx: number, ry: number, rz: number): Projected {
  const pts = solid.vertices.map((v) => {
    const [x, y, z] = rotate(v, rx, ry, rz);
    return { x: cx + x * r, y: cy + y * r, z };
  });
  let near = "";
  let far = "";
  for (const [a, b] of solid.edges) {
    const p = pts[a];
    const q = pts[b];
    const seg = `M${p.x.toFixed(1)} ${p.y.toFixed(1)}L${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    if ((p.z + q.z) / 2 < -0.05) far += seg;
    else near += seg;
  }
  return { near, far, points: [...pts].sort((m, n) => m.z - n.z) };
}

/** A small seeded random generator (mulberry32), so a backdrop is the same on every render. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PolyhedronSpec {
  solid: SolidName;
  /** Centre, canvas pixels on 1920×1080. */
  x: number;
  y: number;
  /** Circumradius, canvas pixels. */
  size: number;
  /** `faint` (most), `ink` (a bolder one), `accent` (an accent wireframe). */
  tone: "faint" | "ink" | "accent";
  /** Mark the near vertices with accent dots. */
  dots?: boolean;
}

/**
 * A scattered field of solids round the canvas edges, off the centre where a slide's words sit:
 * one bolder icosahedron with accent vertices (top right), one accent wireframe (low left), two
 * large faint ones half off an edge, and the rest small and faint.
 */
export function scatter(count: number, seed = 1, width = 1920, height = 1080): PolyhedronSpec[] {
  const rand = seeded(seed);
  const pick = () => SOLID_NAMES[Math.floor(rand() * SOLID_NAMES.length)];
  const out: PolyhedronSpec[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      // The bolder one, its near vertices in the accent: top right, clear of the headline.
      out.push({
        solid: "icosahedron",
        x: width * (0.8 + rand() * 0.08),
        y: height * (0.16 + rand() * 0.1),
        size: 84 + rand() * 20,
        tone: "ink",
        dots: true,
      });
    } else if (i === 1) {
      // The accent wireframe: low on the left.
      out.push({
        solid: pick(),
        x: width * (0.04 + rand() * 0.08),
        y: height * (0.76 + rand() * 0.1),
        size: 64 + rand() * 22,
        tone: "accent",
      });
    } else if (i < 4) {
      // Two large faint solids, half off an edge.
      const right = i === 2;
      out.push({
        solid: pick(),
        x: right ? width * (0.97 + rand() * 0.04) : width * (0.18 + rand() * 0.5),
        y: right ? height * (0.4 + rand() * 0.3) : height * (0.98 + rand() * 0.04),
        size: 170 + rand() * 70,
        tone: "faint",
      });
    } else {
      // The rest small and faint, in a band round the edges.
      const band = i % 4;
      const along = rand();
      const into = 0.03 + rand() * 0.14;
      const x = band === 0 ? into * width : band === 1 ? width - into * width : along * width;
      const y = band === 2 ? into * height : band === 3 ? height - into * height : along * height;
      out.push({ solid: pick(), x, y, size: 28 + rand() * 38, tone: "faint" });
    }
  }
  return out;
}

/**
 * Where a solid is at time `t` (seconds): its rotation and a slow drift about its home, both
 * derived from its index so every copy of the backdrop (each slide's layer) agrees at any moment.
 */
export function poseAt(spec: PolyhedronSpec, index: number, t: number) {
  const k = index + 1;
  const speed = 0.12 + ((k * 37) % 11) / 60;
  const dir = k % 2 ? 1 : -1;
  return {
    rx: 0.6 + k * 0.7 + t * speed * 0.8 * dir,
    ry: 0.3 + k * 1.1 + t * speed * dir,
    rz: k * 0.4 + t * speed * 0.35,
    x: spec.x + Math.sin(t * 0.07 + k) * 26,
    y: spec.y + Math.cos(t * 0.05 + k * 1.7) * 18,
  };
}
