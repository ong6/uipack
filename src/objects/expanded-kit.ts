// Shared helpers for the expanded directions (cartoon, realistic, abstract): mesh shorthands,
// seeded noise and small procedural textures. Each direction file keeps its own materials.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { vec } from "./procedural";
import type { ObjectKind } from "./scenes";

export type ArtKind = Exclude<ObjectKind, "contact">;

/* ---------------------------------------------------------------- Meshes */

export function mesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  x = 0,
  y = 0,
  z = 0,
) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}
/** A rounded box; the edge radius is clamped to a third of the smallest side. */
export function roundedBox(width: number, height: number, depth: number, radius = 0.05, segments = 3) {
  return new RoundedBoxGeometry(width, height, depth, segments, Math.min(radius, width / 3, height / 3, depth / 3));
}
export function block(
  parent: THREE.Object3D,
  size: [number, number, number],
  material: THREE.Material,
  at: [number, number, number] = [0, 0, 0],
  radius = 0.05,
) {
  return mesh(parent, roundedBox(size[0], size[1], size[2], radius), material, ...at);
}
export function group(parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const container = new THREE.Group();
  container.position.set(x, y, z);
  parent.add(container);
  return container;
}
/** A cylinder (or cone, with two radii) standing on Y. */
export function cylinder(
  parent: THREE.Object3D,
  radius: number,
  height: number,
  material: THREE.Material,
  at: [number, number, number] = [0, 0, 0],
  segments = 32,
  bottom = radius,
) {
  return mesh(parent, new THREE.CylinderGeometry(radius, bottom, height, segments), material, ...at);
}
export function sphere(
  parent: THREE.Object3D,
  radius: number,
  material: THREE.Material,
  at: [number, number, number] = [0, 0, 0],
  detail = 24,
) {
  return mesh(parent, new THREE.SphereGeometry(radius, detail, Math.round(detail * 0.67)), material, ...at);
}
/** A tube through `points`. */
export function tube(points: THREE.Vector3[], radius: number, closed = false, segments = 64, radial = 8) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), segments, radius, radial, closed);
}
/** A straight rod from `from` to `to`, as a geometry already placed in parent space. */
export function rodGeometry(from: THREE.Vector3, to: THREE.Vector3, radius: number, segments = 12) {
  const delta = to.clone().sub(from);
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), segments);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(vec(0, 1), delta.normalize()));
  geometry.translate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
  return geometry;
}
/** A geometry moved and turned, for merging static parts into one draw call. */
export function placed(
  geometry: THREE.BufferGeometry,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  s: number | [number, number, number] = 1,
) {
  const matrix = new THREE.Matrix4().compose(
    vec(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    Array.isArray(s) ? vec(...s) : vec(s, s, s),
  );
  return geometry.applyMatrix4(matrix);
}
/** Strip to position and normal (and uv when every part has one) so differently built parts merge. */
export function mergeable(geometry: THREE.BufferGeometry, keepUv = false) {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  for (const name of Object.keys(flat.attributes))
    if (name !== "position" && name !== "normal" && !(keepUv && name === "uv")) flat.deleteAttribute(name);
  if (!flat.attributes.normal) flat.computeVertexNormals();
  return flat;
}

/* ---------------------------------------------------------------- Noise */

/** A seeded random generator (LCG), so every render matches. */
export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Smooth value noise in 0..1, tiling every `period` cells. */
export function valueNoise(x: number, y: number, period = 256, seed = 1) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    xf = x - xi,
    yf = y - yi;
  const wrap = (n: number) => ((n % period) + period) % period;
  const u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf);
  const a = hash(wrap(xi), wrap(yi), seed),
    b = hash(wrap(xi + 1), wrap(yi), seed),
    c = hash(wrap(xi), wrap(yi + 1), seed),
    d = hash(wrap(xi + 1), wrap(yi + 1), seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** Fractal noise, tiling over `period` base cells. */
export function fbm(x: number, y: number, period: number, octaves = 4, seed = 1) {
  let sum = 0,
    amplitude = 0.5,
    frequency = 1,
    total = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amplitude * valueNoise(x * frequency, y * frequency, period * frequency, seed + o);
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return sum / total;
}

/* ---------------------------------------------------------------- Textures */

export type Painter = (u: number, v: number, x: number, y: number) => [number, number, number, number?];

/** A data texture painted per texel: `paint(u, v)` returns sRGB 0..255 (and alpha). */
export function paintTexture(
  width: number,
  height: number,
  paint: Painter,
  options: { srgb?: boolean; repeat?: [number, number] } = {},
) {
  const { srgb = true, repeat } = options;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a = 255] = paint((x + 0.5) / width, (y + 0.5) / height, x, y);
      data.set([r, g, b, a], (y * width + x) * 4);
    }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
  }
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** A tangent-space normal map from a tiling height field `height(u, v)` in 0..1. */
export function normalTexture(
  size: number,
  height: (u: number, v: number) => number,
  strength = 2,
  repeat: [number, number] = [1, 1],
) {
  const field = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) field[y * size + x] = height((x + 0.5) / size, (y + 0.5) / size);
  const at = (x: number, y: number) => field[((y + size) % size) * size + ((x + size) % size)];
  const normal = new THREE.Vector3();
  return paintTexture(
    size,
    size,
    (_u, _v, x, y) => {
      normal.set(-(at(x + 1, y) - at(x - 1, y)) * strength, -(at(x, y + 1) - at(x, y - 1)) * strength, 1).normalize();
      return [(normal.x * 0.5 + 0.5) * 255, (normal.y * 0.5 + 0.5) * 255, (normal.z * 0.5 + 0.5) * 255];
    },
    { srgb: false, repeat },
  );
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const smoothstep = (a: number, b: number, n: number) => {
  const t = clamp01((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Mix two 0xRRGGBB colours into an [r, g, b] triple. */
export function mixRgb(a: number, b: number, t: number): [number, number, number] {
  return [mix((a >> 16) & 255, (b >> 16) & 255, t), mix((a >> 8) & 255, (b >> 8) & 255, t), mix(a & 255, b & 255, t)];
}

/* ---------------------------------------------------------------- A 5×7 dot font, for printed tape and key legends */

const GLYPHS: Record<string, string> = {
  "0": "01110100011001110101110011000101110",
  "1": "00100011000010000100001000010001110",
  "2": "01110100010000100010001000100011111",
  "3": "11111000100010000010000011000101110",
  "4": "00010001100101010010111110001000010",
  "5": "11111100001111000001000011000101110",
  "6": "00110010001000011110100011000101110",
  "7": "11111000010001000100010000100001000",
  "8": "01110100011000101110100011000101110",
  "9": "01110100011000101111000010001001100",
  A: "01110100011000111111100011000110001",
  C: "01110100011000010000100001000101110",
  D: "11100100101000110001100011001011100",
  E: "11111100001000011110100001000011111",
  F: "11111100001000011110100001000010000",
  I: "01110001000010000100001000010001110",
  J: "00111000100001000010000101001001100",
  K: "10001100101010011000101001001010001",
  M: "10001110111010110101100011000110001",
  P: "11110100011000111110100001000010000",
  T: "11111001000010000100001000010000100",
  U: "10001100011000110001100011000101110",
  Y: "10001100010101000100001000010000100",
  B: "11110100011000111110100011000111110",
  G: "01110100011000010111100011000101111",
  H: "10001100011000111111100011000110001",
  N: "10001110011010110011100011000110001",
  S: "01111100001000001110000010000111110",
  W: "10001100011000110101101011101110001",
  ",": "00000000000000000000011000010001000",
  ".": "00000000000000000000000000110001100",
  "+": "00000001000010011111001000010000000",
  "-": "00000000000000011111000000000000000",
  "^": "00000001000111011111000000000000000",
  v: "00000000001111101110001000000000000",
  " ": "00000000000000000000000000000000000",
};
/** True where `text`, laid out in 6-column cells, has a dot at column `cx`, row `cy` (0..6). */
export function glyphDot(text: string, cx: number, cy: number) {
  if (cy < 0 || cy > 6 || cx < 0) return false;
  const char = text[Math.floor(cx / 6)];
  const col = cx % 6;
  if (char === undefined || col === 5) return false;
  return (GLYPHS[char] ?? GLYPHS[" "])[cy * 5 + col] === "1";
}

/* ---------------------------------------------------------------- Ribbons */

/**
 * A flat strip `width` wide along a smooth curve through `points`, its width kept horizontal (so it
 * lies on a table and curls about horizontal axes). UV u runs along the strip in world units, v across.
 */
export function ribbonGeometry(points: THREE.Vector3[], width: number, segments = 96, thickness = 0) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const up = vec(0, 1),
    side = new THREE.Vector3(),
    point = new THREE.Vector3(),
    tangent = new THREE.Vector3(),
    normal = new THREE.Vector3();
  let length = 0;
  const previous = new THREE.Vector3();
  const layers = thickness > 0 ? [thickness / 2, -thickness / 2] : [0];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, point);
    curve.getTangentAt(t, tangent);
    if (i > 0) length += point.distanceTo(previous);
    previous.copy(point);
    side.crossVectors(tangent, up);
    if (side.lengthSq() < 1e-6) side.set(0, 0, 1);
    side.normalize();
    normal.crossVectors(side, tangent).normalize();
    for (const offset of layers)
      for (const s of [-0.5, 0.5]) {
        positions.push(
          point.x + side.x * s * width + normal.x * offset,
          point.y + side.y * s * width + normal.y * offset,
          point.z + side.z * s * width + normal.z * offset,
        );
        uvs.push(length, s + 0.5);
      }
  }
  const stride = layers.length * 2;
  for (let i = 0; i < segments; i++) {
    const a = i * stride,
      b = (i + 1) * stride;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
    if (layers.length === 2) indices.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.length = length;
  return geometry;
}
