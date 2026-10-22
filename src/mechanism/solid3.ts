/* Convex prisms on any axis, shaded the way the kit's `extrude` shades
   floor prisms: hidden faces dropped, visible side faces bucketed into four
   tones by facing, up-facing faces painted as the top, the silhouette as the
   outline and the edges between two visible faces as the crease. The kit only
   extrudes plans straight up; a sloped chute, a drum lying along y or a
   swinging flap needs this. */
import { SHADES, cameraOf, iso, pathOf, type Flat, type Point3, type Projection, type SolidPaths } from "./kit/iso-kit";

const sub = (a: Point3, b: Point3): Point3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Point3, b: Point3): Point3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const cross = (a: Point3, b: Point3): Point3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Point3, b: Point3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: Point3): Point3 => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};

/** The direction toward the viewer, in world space (the gradient of `depthOf`). */
export function viewOf(projection: Projection): Point3 {
  const { sinA, cosA, sinE, cosE } = cameraOf(projection);
  return [cosA * cosE, sinA * cosE, sinE];
}

function hull(points: Flat[]): Flat[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const turn = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Flat[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && turn(lower[lower.length - 2]!, lower[lower.length - 1]!, point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper: Flat[] = [];
  for (let index = sorted.length - 1; index >= 0; index--) {
    const point = sorted[index]!;
    while (upper.length >= 2 && turn(upper[upper.length - 2]!, upper[upper.length - 1]!, point) <= 0) upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/**
 * A convex face (planar, any orientation, listed in order) swept along a
 * vector. Returns the same `SolidPaths` the kit's `Solid` draws.
 */
export function prismOf(face: Point3[], along: Point3, projection: Projection): SolidPaths {
  const count = face.length;
  const far = face.map((point) => add(point, along));
  const vertices = [...face, ...far];
  const centre = vertices.reduce<Point3>((sum, point) => add(sum, [point[0] / vertices.length, point[1] / vertices.length, point[2] / vertices.length]), [0, 0, 0]);
  const faces: number[][] = [
    face.map((_, index) => index),
    face.map((_, index) => count + index),
    ...face.map((_, index) => {
      const next = (index + 1) % count;
      return [index, next, count + next, count + index];
    }),
  ];
  const view = viewOf(projection);
  const { sinA, cosA } = cameraOf(projection);
  const light: Point3 = [-sinA, cosA, 0];
  const normals = faces.map((ids) => {
    const [a, b, c] = [vertices[ids[0]!]!, vertices[ids[1]!]!, vertices[ids[2]!]!];
    let normal = unit(cross(sub(b, a), sub(c, a)));
    if (dot(normal, sub(a, centre)) < 0) normal = [-normal[0], -normal[1], -normal[2]];
    return normal;
  });
  const visible = normals.map((normal) => dot(normal, view) > 1e-6);
  const flat = vertices.map((point) => iso(point, projection));
  const polygon = (ids: number[]) => pathOf(ids.map((id) => flat[id]!), true);
  const buckets: string[][] = Array.from({ length: SHADES }, () => []);
  const tops: string[] = [];
  faces.forEach((ids, index) => {
    if (!visible[index]) return;
    const normal = normals[index]!;
    if (normal[2] > 0.72) {
      tops.push(polygon(ids));
      return;
    }
    const level = Math.hypot(normal[0], normal[1]) > 1e-6 ? (dot(unit([normal[0], normal[1], 0]), light) + 1) / 2 : 0;
    const darker = normal[2] < -0.2 ? 1 : 0;
    const shade = Math.min(SHADES - 1, Math.max(0, Math.floor(level * SHADES) - darker));
    buckets[shade]!.push(polygon(ids));
  });
  const edges = new Map<string, { a: number; b: number; faces: number[] }>();
  faces.forEach((ids, index) => {
    ids.forEach((id, at) => {
      const other = ids[(at + 1) % ids.length]!;
      const key = id < other ? `${id}-${other}` : `${other}-${id}`;
      const edge = edges.get(key) ?? { a: id, b: other, faces: [] };
      edge.faces.push(index);
      edges.set(key, edge);
    });
  });
  const outline: string[] = [];
  const crease: string[] = [];
  for (const edge of edges.values()) {
    const shown = edge.faces.map((index) => visible[index]);
    const segment = pathOf([flat[edge.a]!, flat[edge.b]!]);
    if (shown[0] !== shown[1]) outline.push(segment);
    else if (shown[0] && shown[1]) {
      const [n0, n1] = [normals[edge.faces[0]!]!, normals[edge.faces[1]!]!];
      if (dot(n0, n1) < 0.95) crease.push(segment);
    }
  }
  return {
    fill: pathOf(hull(flat), true),
    outline: outline.join(""),
    crease: crease.join(""),
    top: tops.join(""),
    shades: buckets.map((paths) => paths.join("")),
  };
}

/** A circle in a vertical plane: across x (axis "y", the plane y = centre) or across y (axis "x"). */
export function circleIn(centre: Point3, radius: number, axis: "x" | "y", steps = 28): Point3[] {
  return Array.from({ length: steps }, (_, step) => {
    const angle = (step / steps) * Math.PI * 2;
    const u = radius * Math.cos(angle);
    const v = radius * Math.sin(angle);
    return axis === "y" ? ([centre[0] + u, centre[1], centre[2] + v] as Point3) : ([centre[0], centre[1] + u, centre[2] + v] as Point3);
  });
}

/** A closed circle drawn on a vertical face (a bearing ring, a bore, a motor cap). */
export function faceCircle(centre: Point3, radius: number, axis: "x" | "y", projection: Projection, steps = 24) {
  return pathOf([...circleIn(centre, radius, axis, steps), circleIn(centre, radius, axis, steps)[0]!].map((point) => iso(point, projection)));
}
