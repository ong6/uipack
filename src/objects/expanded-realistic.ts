// Realistic close-ups (direction 4): macro still lifes on a real surface that runs out of the frame,
// shot low and near with a long lens under grazing window light. One material story per subject.
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { contactShadow, lookMaterial, themed, type ObjectLook } from "./look";
import { TAU, vec, type Tick } from "./procedural";
import {
  block,
  clamp01,
  cylinder,
  fbm,
  glyphDot,
  group,
  mergeable,
  mesh,
  mix,
  mixRgb,
  normalTexture,
  paintTexture,
  placed,
  ribbonGeometry,
  roundedBox,
  seeded,
  smoothstep,
  sphere,
  tube,
  valueNoise,
  valueNoise2,
  themeProbe,
  type ArtKind,
} from "./expanded-kit";

export const realisticLook: ObjectLook = {
  rig: {
    both: {
      toneMapping: "neutral",
      exposure: 1,
      environment: { kind: "room", intensity: 0.4, rotation: 0.5 },
      hemisphere: { sky: 0xf4ede2, ground: 0x3b3129, intensity: 0.7 },
      // A low window to the left: long shadows and grazing light across every texture.
      key: { color: 0xffe6c2, intensity: 4.4, position: [-6, 2.3, 2.6], shadow: true, shadowRadius: 5 },
      fill: { color: 0xdde6f0, intensity: 0.5, position: [5, 1.6, 5] },
      rim: { color: 0xffffff, intensity: 1.3, position: [3, 2.6, -5] },
    },
    light: { reflections: 1 },
    // Night: the window is gone. A warm desk lamp up to the right is the key (with a pool of light
    // from the practical in realistic()), and a cool moonlit rim from behind left cuts the silhouettes.
    dark: {
      exposure: 1,
      hemisphere: { sky: 0x8090b0, ground: 0x0e0c0a, intensity: 0.16 },
      environment: { intensity: 0.16 },
      key: { color: 0xffc58c, intensity: 0.9, position: [4.5, 3.6, 2.8] },
      fill: { color: 0x9aaad0, intensity: 0.12, position: [-5, 1.5, 5] },
      rim: { color: 0xa8bfff, intensity: 2.8, position: [-3.5, 0.9, -5] },
      // Presets take their image light from `reflections`, not the environment intensity: keep it
      // low, or the room's even light washes the lamp's falloff out.
      reflections: 0.32,
    },
  },
  camera: { projection: "perspective", fov: 20, pitch: 15 },
  framing: { fill: 0.8, maxWidth: 0.98, lift: -0.03, sample: "loop" },
  castShadows: true,
};

/* ---------------------------------------------------------------- Surfaces */

const GROUND_WIDTH = 4.2,
  GROUND_DEPTH = 8.5,
  GROUND_NEAR = 2.4;

/** Opaque round the subject, fading out to the sides and far back, like a lens running out of focus. */
function groundFade() {
  return paintTexture(
    64,
    128,
    (u, v) => {
      const across = Math.abs(u - 0.5) * 2;
      const a = (1 - smoothstep(0.68, 0.99, across)) * (1 - smoothstep(0.34, 0.86, v));
      return [a * 255, a * 255, a * 255];
    },
    { srgb: false },
  );
}

/** A table-top plane under the subject (y 0), excluded from framing; it still takes the key's shadow. */
function surface(root: THREE.Object3D, map: THREE.Texture, normalMap: THREE.Texture | null, roughness: number, dark = 0.72) {
  const material = themed(
    new THREE.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness,
      metalness: 0,
      alphaMap: groundFade(),
      transparent: true,
      depthWrite: false,
    }),
    { dark: { color: new THREE.Color(dark, dark, dark).getHex() } },
  );
  const plane = mesh(root, new THREE.PlaneGeometry(GROUND_WIDTH, GROUND_DEPTH), material, 0, 0, GROUND_NEAR - GROUND_DEPTH / 2);
  plane.rotation.x = -Math.PI / 2;
  plane.renderOrder = -2;
  plane.receiveShadow = true;
  plane.userData.frameIgnore = true;
  return plane;
}

/**
 * Oiled walnut, quarter-sawn: one plank per tile, laid across the frame (so the grain never
 * converges on the vanishing point). Straight, near-parallel growth lines that drift a little along
 * the board, each latewood band its own weight and width, long open pores running with the grain,
 * broad colour streaks and a dark seam between planks; no rings, so nothing smears at grazing
 * angles. A tile is WOOD_TILE units (about 15 cm at the keycaps' scale), lines about 2 mm apart.
 */
const WOOD_TILE = 3;
const WOOD_SIZE = 512;
const WOOD_LINES = 78;
let woodField: { field: Float32Array; tones: Float32Array } | undefined;
/** The wood's height channels (latewood, pores, seam) and albedo tone, computed once per page. */
function woodData() {
  if (woodField) return woodField;
  const SIZE = WOOD_SIZE;
  const field = new Float32Array(SIZE * SIZE * 3),
    tones = new Float32Array(SIZE * SIZE);
  const lineHash = (n: number, salt: number) => valueNoise2(n * 13.7 + salt, salt * 3.3, 4096, 4096, 41);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const u = (x + 0.5) / SIZE,
        v = (y + 0.5) / SIZE;
      // The grain coordinate across the plank, wandering slowly along it.
      const drift = 0.5 * (valueNoise2(u * 2, v * 3, 2, 3, 11) - 0.5) + 0.18 * (valueNoise2(u * 7, v * 9, 7, 9, 3) - 0.5);
      // Uneven seasons: the line spacing bunches and opens across the plank.
      const g =
        (v + drift * 0.03) * WOOD_LINES +
        5 * (valueNoise2(0, v * 9, 1, 9, 51) - 0.5) +
        2 * (valueNoise2(0, v * 23, 1, 23, 52) - 0.5);
      const line = Math.floor(g),
        ring = g - line;
      const weight = 0.35 + 0.65 * lineHash(line, 1),
        width = 0.16 + 0.22 * lineHash(line, 2);
      // Earlywood darkens gradually into the latewood band, which ends sharply.
      const late = weight * smoothstep(1 - width - 0.18, 1 - width, ring) * (1 - smoothstep(0.93, 1, ring));
      // Open pores: dark dashes a few millimetres long, running with the grain.
      const pores = smoothstep(0.7, 0.95, valueNoise2(u * 56, v * 420, 56, 420, 23));
      const streak = valueNoise2(u * 2, v * 16, 2, 16, 31) * 0.7 + valueNoise2(u * 1, v * 5, 1, 5, 37) * 0.3;
      const seam = smoothstep(0.006, 0, Math.min(v, 1 - v));
      const i = (y * SIZE + x) * 3;
      field[i] = late;
      field[i + 1] = pores;
      field[i + 2] = seam;
      const tone = clamp01(0.46 + 0.44 * streak - 0.17 * late - 0.12 * pores);
      tones[i / 3] = tone * (1 - 0.75 * seam);
    }
  return (woodField = { field, tones });
}
function walnut(root: THREE.Object3D) {
  const SIZE = WOOD_SIZE;
  const { field, tones } = woodData();
  const repeat: [number, number] = [GROUND_WIDTH / WOOD_TILE, GROUND_DEPTH / WOOD_TILE];
  const map = paintTexture(SIZE, SIZE, (_u, _v, x, y) => mixRgb(0x2a1a10, 0x94683f, tones[y * SIZE + x]), { repeat });
  map.anisotropy = 8;
  // Half resolution is plenty for the relief, and halves the build cost.
  const normalMap = normalTexture(
    SIZE / 2,
    (u, v) => {
      const i = (Math.min(SIZE - 1, Math.floor(v * SIZE)) * SIZE + Math.min(SIZE - 1, Math.floor(u * SIZE))) * 3;
      return 0.6 - 0.08 * field[i] - 0.14 * field[i + 1] - 0.8 * field[i + 2];
    },
    2,
    repeat,
  );
  normalMap.anisotropy = 8;
  // The oil sits glossier on the dense latewood and dull in the pores and the seam.
  const roughnessMap = paintTexture(
    SIZE / 2,
    SIZE / 2,
    (_u, _v, x, y) => {
      const i = (y * 2 * SIZE + x * 2) * 3;
      const r = clamp01(0.72 - 0.16 * field[i] + 0.25 * field[i + 1] + 0.3 * field[i + 2]) * 255;
      return [r, r, r];
    },
    { srgb: false, repeat },
  );
  const plane = surface(root, map, normalMap, 0.62);
  (plane.material as THREE.MeshStandardMaterial).roughnessMap = roughnessMap;
  return plane;
}

/* ---------------------------------------------------------------- Wear */

const wearMaps = new Map<string, THREE.Texture>();
/**
 * A roughness map (green channel) that breaks up a perfect CG finish: soft smudges, a fine mottle
 * and, for metal, hairline scratches running every which way that catch the light. Mean about 0.78.
 */
function wearMap(scratches: number, repeat = 1, seed = 1) {
  const key = `${scratches}:${repeat}:${seed}`;
  const cached = wearMaps.get(key);
  if (cached) return cached;
  const SIZE = 256;
  const lines = new Float32Array(SIZE * SIZE);
  const random = seeded(seed * 97 + 13);
  for (let n = 0; n < scratches; n++) {
    const x0 = random() * SIZE,
      y0 = random() * SIZE,
      angle = random() * Math.PI,
      length = 12 + random() * 110,
      strength = 0.35 + 0.65 * random();
    for (let t = 0; t < length; t++) {
      const px = Math.floor(x0 + Math.cos(angle) * t),
        py = Math.floor(y0 + Math.sin(angle) * t);
      const i = (((py % SIZE) + SIZE) % SIZE) * SIZE + (((px % SIZE) + SIZE) % SIZE);
      lines[i] = Math.max(lines[i], strength * Math.sin((t / length) * Math.PI));
    }
  }
  const texture = paintTexture(
    SIZE,
    SIZE,
    (u, v, x, y) => {
      const smudge = fbm(u * 4, v * 4, 4, 4, seed + 2),
        mottle = valueNoise(u * 64, v * 64, 64, seed + 5);
      const r = clamp01(0.64 + 0.18 * smudge + 0.06 * mottle - 0.03 + 0.22 * lines[y * SIZE + x]) * 255;
      return [r, r, r];
    },
    { srgb: false, repeat: [repeat, repeat] },
  );
  wearMaps.set(key, texture);
  return texture;
}
/** Give a material a wear map, keeping its average roughness where it was. Its geometry needs UVs. */
function worn<M extends THREE.MeshStandardMaterial>(material: M, scratches = 0, repeat = 1, seed = 1) {
  material.roughnessMap = wearMap(scratches, repeat, seed);
  material.roughness = Math.min(1, material.roughness / 0.78);
  return material;
}
/** Box-projected UVs for a geometry built without them (merged, sculpted parts). */
function projectUv(geometry: THREE.BufferGeometry, scale = 2) {
  const position = geometry.attributes.position;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getX(i) + position.getZ(i) * 0.7) * scale;
    uv[i * 2 + 1] = (position.getY(i) + position.getZ(i) * 0.4) * scale;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geometry;
}

/** Pebbled vegetable-tanned leather. */
function leather(root: THREE.Object3D) {
  const map = paintTexture(256, 512, (u, v) => {
    const tone = fbm(u * 6, v * 12, 6, 4, 21);
    return mixRgb(0x4a2715, 0x8a5332, tone);
  });
  const normalMap = normalTexture(128, (u, v) => fbm(u * 16, v * 16, 16, 3, 5), 3, [10, 20]);
  return surface(root, map, normalMap, 0.62);
}

/** A sanded acrylic hard court, blue, with its baseline. */
function court(root: THREE.Object3D) {
  const map = paintTexture(
    128,
    128,
    (u, v) => {
      const speck = valueNoise(u * 128, v * 128, 128, 2);
      return mixRgb(0x2c5677, 0x46789b, speck * 0.7 + 0.15 * fbm(u * 4, v * 4, 4, 2, 8));
    },
    { repeat: [6, 12] },
  );
  const normalMap = normalTexture(128, (u, v) => valueNoise(u * 128, v * 128, 128, 3), 2.5, [12, 24]);
  return surface(root, map, normalMap, 0.82);
}

/** The powder-coated steel lid of the server below: dark, orange-peel textured, faintly mottled. */
function steelLid(root: THREE.Object3D) {
  const map = paintTexture(
    128,
    128,
    (u, v) => mixRgb(0x2c2f34, 0x3b3f45, 0.55 * fbm(u * 3, v * 3, 3, 3, 14) + 0.25 * valueNoise(u * 128, v * 128, 128, 6)),
    { repeat: [5, 10] },
  );
  const normalMap = normalTexture(128, (u, v) => fbm(u * 24, v * 24, 24, 2, 9), 1.6, [16, 32]);
  const plane = surface(root, map, normalMap, 0.5 / 0.78, 0.6);
  (plane.material as THREE.MeshStandardMaterial).roughnessMap = wearMap(40, 3, 4);
  return plane;
}

/**
 * A bare SSD board: green solder mask over copper. The mask pools thinner (and lighter) over each
 * trace, so traces stand proud with a soft bevel; the gold edge fingers, test pads and vias are bare
 * ENIG metal (metalness in blue, roughness in green); white silkscreen outlines the parts.
 */
function ssdBoardMaterial() {
  const W = 128,
    H = 256;
  const copper = new Float32Array(W * H),
    gold = new Float32Array(W * H),
    silk = new Float32Array(W * H);
  const random = seeded(77);
  const dot = (target: Float32Array, x: number, y: number, r: number) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const px = Math.round(x + dx),
          py = Math.round(y + dy);
        if (px >= 0 && py >= 0 && px < W && py < H && dx * dx + dy * dy <= r * r + 0.5) target[py * W + px] = 1;
      }
  };
  const stroke = (target: Float32Array, x0: number, y0: number, x1: number, y1: number, r: number) => {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let n = 0; n <= steps; n++)
      dot(target, x0 + ((x1 - x0) * n) / Math.max(1, steps), y0 + ((y1 - y0) * n) / Math.max(1, steps), r);
  };
  // Buses of parallel traces with 45° doglegs, the way a router lays them, ending in vias.
  for (let bus = 0; bus < 9; bus++) {
    const x = 8 + random() * (W - 16),
      y = 20 + random() * (H - 40),
      count = 3 + Math.floor(random() * 4),
      run = 18 + random() * 50,
      turn = random() < 0.5 ? -1 : 1;
    for (let k = 0; k < count; k++) {
      const ox = x + k * 3,
        oy = y + k * 3;
      stroke(copper, ox, oy, ox, oy + run, 0.6);
      stroke(copper, ox, oy + run, ox + turn * 14, oy + run + 14, 0.6);
      dot(gold, ox + turn * 14, oy + run + 14, 1.4);
    }
  }
  // Gold edge fingers along the bottom edge, and silkscreen frames round the chip sites.
  for (let k = 0; k < 22; k++)
    for (let y = H - 10; y < H - 1; y++) for (let x = 6 + k * 5; x < 9 + k * 5; x++) gold[y * W + x] = 1;
  for (const [x0, y0, x1, y1] of [
    [12, 18, 58, 70],
    [70, 18, 116, 70],
    [12, 92, 58, 144],
    [70, 92, 116, 144],
    [34, 166, 94, 214],
  ]) {
    stroke(silk, x0, y0, x1, y0, 0.4);
    stroke(silk, x0, y1, x1, y1, 0.4);
    stroke(silk, x0, y0, x0, y1, 0.4);
    stroke(silk, x1, y0, x1, y1, 0.4);
  }
  // Soften the copper into a height field so the mask over it has a rounded shoulder.
  const height = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          sum += copper[Math.min(H - 1, Math.max(0, y + dy)) * W + Math.min(W - 1, Math.max(0, x + dx))];
      height[y * W + x] = sum / 9 + 0.6 * gold[y * W + x];
    }
  const at = (x: number, y: number) => height[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  const map = paintTexture(W, H, (u, v, x, y) => {
    const i = y * W + x;
    if (gold[i]) return [214, 172, 92];
    if (silk[i]) return [226, 230, 222];
    const n = valueNoise(u * 40, v * 80, 40, 3);
    return mixRgb(0x123d2a, 0x2f7350, clamp01(0.75 * height[i] + 0.12 * n));
  });
  const normalMap = paintTexture(
    W,
    H,
    (_u, _v, x, y) => {
      const n = vec(-(at(x + 1, y) - at(x - 1, y)) * 1.4, -(at(x, y + 1) - at(x, y - 1)) * 1.4, 1).normalize();
      return [(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255];
    },
    { srgb: false },
  );
  const surfaceMap = paintTexture(
    W,
    H,
    (u, v, x, y) => {
      const i = y * W + x;
      const rough = gold[i] ? 0.3 : silk[i] ? 0.8 : 0.34 + 0.12 * valueNoise(u * 16, v * 32, 16, 8);
      return [0, rough * 255, gold[i] ? 255 : 0];
    },
    { srgb: false },
  );
  const material = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    roughnessMap: surfaceMap,
    metalnessMap: surfaceMap,
    metalness: 1,
    roughness: 1,
  });
  // Let mount.ts give it the room reflections, or the gold reads black.
  material.userData.lookReflections = 1;
  return material;
}

/** A soft baked shadow pooled right under a part (ambient occlusion where it meets the surface). */
function pool(parent: THREE.Object3D, width: number, depth: number, x = 0, z = 0, opacity = 0.6, y = 0.004) {
  const shadow = contactShadow(width, depth, { opacity, x, y, z, color: 0x120b06 });
  parent.add(shadow);
  return shadow;
}

/** Parts that set the scene but should run out of frame: no framing, but they still shadow. */
function setDressing(object: THREE.Object3D) {
  object.traverse((item) => {
    item.userData.frameIgnore = true;
    const part = item as THREE.Mesh;
    if (part.isMesh) {
      part.castShadow = true;
      part.receiveShadow = true;
    }
  });
  return object;
}

/** A mesh that is detail on a larger part: framed with its parent, no shadow of its own. */
const decal = (object: THREE.Mesh) => {
  object.userData.frameIgnore = true;
  return object;
};

/** The glass of a watch or a pair of glasses: clear, thin and mostly reflection (no transmission pass). */
const clearGlass = () =>
  lookMaterial("ceramic", 0xf4f8ff, {
    transparent: true,
    opacity: 0.16,
    roughness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    depthWrite: false,
    envMapIntensity: 2.2,
  });

/* ---------------------------------------------------------------- Subjects */

type Model = (root: THREE.Group, ticks: Tick[]) => void;

/** A sculpted keycap: tapered walls, a cylindrical dish and rounded edges. */
function keycapGeometry(width: number, height: number, depth: number, dish = 0.012) {
  const geometry = mergeable(roundedBox(width, height, depth, 0.03, 3));
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    let x = position.getX(i),
      y = position.getY(i),
      z = position.getZ(i);
    const t = (y + height / 2) / height;
    const taper = 1 - 0.2 * t;
    x *= taper;
    z *= taper;
    z -= 0.02 * t; // the top leans back, like a cylindrical profile
    const top = smoothstep(height / 2 - 0.03, height / 2, y);
    y -= dish * top * (1 - (x / ((width * taper) / 2)) ** 2);
    position.setXYZ(i, x, y, z);
  }
  geometry.deleteAttribute("normal");
  const merged = mergeVertices(geometry, 1e-4);
  merged.computeVertexNormals();
  // Edge wear: rounded edges and corners, where fingers and light scatter in the PBT, read a shade lighter.
  const normal = merged.attributes.normal;
  const colors = new Float32Array(normal.count * 3);
  for (let i = 0; i < normal.count; i++) {
    const edge = 1 - Math.max(Math.abs(normal.getX(i)), Math.abs(normal.getY(i)), Math.abs(normal.getZ(i)));
    const shade = 0.95 + 0.22 * smoothstep(0.05, 0.35, edge);
    colors.set([shade, shade, shade * 0.98], i * 3);
  }
  merged.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return projectUv(merged, 3);
}

/** A legend printed into the key's dish (it follows the curve). */
function legendGeometry(text: string, width: number, keyTop: number, keyHalfWidth: number, dish: number, x: number, z: number) {
  const columns = text.length * 6 - 1;
  const geometry = new THREE.PlaneGeometry((width * (columns + 1)) / 6, width * 1.4, 6 * text.length, 1);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const px = position.getX(i) + x;
    position.setXYZ(i, px, keyTop - dish * (1 - (px / keyHalfWidth) ** 2) + 0.0018, position.getZ(i) + z);
  }
  geometry.computeVertexNormals();
  geometry.userData.text = text;
  return geometry;
}

/**
 * A legend's mask, drawn as strokes rather than square pixels: the 5×7 dots joined into rounded
 * lines (diagonals only where no square path exists), so it reads as a printed typeface.
 */
function legendMask(text: string, width: number, height: number) {
  const columns = text.length * 6 - 1;
  const cell = height / 9; // seven rows plus a cell of margin top and bottom
  const on = (cx: number, cy: number) => glyphDot(text, cx, cy);
  const segment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax,
      dy = by - ay;
    const t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1));
    return Math.hypot(px - ax - dx * t, py - ay - dy * t);
  };
  const mask = new Float32Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const gx = (x + 0.5) / cell - (width / cell - columns) / 2,
        gy = 6 - ((y + 0.5) / cell - 1);
      let nearest = 9;
      for (let cy = Math.floor(gy) - 1; cy <= Math.floor(gy) + 1; cy++)
        for (let cx = Math.floor(gx) - 1; cx <= Math.floor(gx) + 1; cx++) {
          if (!on(cx, cy)) continue;
          const ax = cx + 0.5,
            ay = cy + 0.5;
          nearest = Math.min(nearest, Math.hypot(gx - ax, gy - ay));
          for (const [ox, oy] of [
            [1, 0],
            [0, 1],
            [1, 1],
            [-1, 1],
          ]) {
            if (!on(cx + ox, cy + oy) || Math.floor((cx + ox) / 6) !== Math.floor(cx / 6)) continue;
            if (ox && oy && (on(cx + ox, cy) || on(cx, cy + oy))) continue;
            nearest = Math.min(nearest, segment(gx, gy, ax, ay, ax + ox, ay + oy));
          }
        }
      mask[y * width + x] = smoothstep(0.5, 0.36, nearest);
    }
  return mask;
}
/** A legend's alpha and a normal map that sinks it a hair into the cap, so grazing light finds its edges. */
function legendTextures(text: string) {
  const height = 64,
    width = Math.round(((text.length * 6) / 6) * 46);
  const mask = legendMask(text, width, height);
  const at = (x: number, y: number) => mask[Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))];
  const alphaMap = paintTexture(
    width,
    height,
    (_u, _v, x, y) => {
      const a = at(x, y) * 255;
      return [a, a, a];
    },
    { srgb: false },
  );
  const normalMap = paintTexture(
    width,
    height,
    (_u, _v, x, y) => {
      const n = vec((at(x + 1, y) - at(x - 1, y)) * 1.2, (at(x, y + 1) - at(x, y - 1)) * 1.2, 1).normalize();
      return [(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255];
    },
    { srgb: false },
  );
  return { alphaMap, normalMap };
}

const models: Record<ArtKind, Model> = {
  /**
   * Key travel: a cluster of PBT keycaps in macro on an aluminium case. The hero is the AI key (the
   * dedicated assistant key new keyboards carry), its legend backlit and a warm glow spilling from
   * under it onto the plate; it types in rhythm with its neighbours.
   */
  ai(root, ticks) {
    walnut(root);
    const caseGroup = group(root);
    // Space-grey anodised, with a generous radius, so its far edge is a soft roll of light, not a hairline.
    const aluminium = worn(lookMaterial("brushedMetal", 0x74787d, { roughness: 0.4, anisotropy: 0.8 }), 120, 2, 2);
    block(caseGroup, [3.4, 0.22, 1.9], aluminium, [0.1, 0.11, -0.1], 0.075);
    const plate = worn(lookMaterial("plastic", 0x1c1e21, { roughness: 0.55 }), 20, 2, 3);
    block(caseGroup, [3.2, 0.03, 1.72], plate, [0.1, 0.225, -0.1], 0.01);
    setDressing(caseGroup);
    pool(root, 3.6, 2.2, 0.1, -0.1, 0.5);

    const KEY = 0.38,
      WIDTH = 0.35,
      HEIGHT = 0.2,
      DISH = 0.012;
    // PBT: dry and slightly translucent, so a soft sheen rolls round the edges; worn a little glossier where fingers land.
    const pbt = worn(
      lookMaterial("ceramic", 0xe8e3d6, {
        roughness: 0.66,
        clearcoat: 0,
        sheen: 0.5,
        sheenRoughness: 0.45,
        sheenColor: new THREE.Color(0xfff6e6),
        vertexColors: true,
      }),
      0,
      1,
      11,
    );
    const accent = worn(
      lookMaterial("ceramic", 0xd45a26, {
        roughness: 0.56,
        clearcoat: 0,
        sheen: 0.6,
        sheenRoughness: 0.4,
        sheenColor: new THREE.Color(0xffb28a),
        vertexColors: true,
      }),
      0,
      1,
      12,
    );
    const capGeometry = keycapGeometry(WIDTH, HEIGHT, WIDTH, DISH);
    // A real QWERTY patch with ANSI row stagger: the top row sits a quarter key left of home, the bottom row half a key right.
    const rows = [
      { keys: ["T", "Y", "U", "I", "O"], z: -0.62, offset: -0.25 * KEY },
      { keys: ["G", "H", "AI", "K", "L"], z: -0.24, offset: 0 },
      { keys: ["B", "N", "M", ",", "."], z: 0.14, offset: 0.5 * KEY },
    ];
    // Which keys type, and when: the AI key is mid-press at the rest frame.
    const typing: Record<string, number> = { AI: 1.88, K: 3.4, H: 5.1, U: 0.4 };
    const legends = new Map<string, THREE.Material>();
    // The backlight: the hero's legend shines through, and light leaks out round its skirt.
    const shine = themed(
      new THREE.MeshStandardMaterial({
        color: 0xfff1dc,
        emissive: 0xffc98a,
        emissiveIntensity: 1.3,
        roughness: 0.5,
        transparent: true,
        depthWrite: false,
      }),
      { dark: { emissiveIntensity: 2.4 } },
    );
    const spill = new THREE.MeshBasicMaterial({
      color: 0xff9a4a,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      alphaMap: paintTexture(
        64,
        64,
        (u, v) => {
          // A rounded square ring of light just outside the cap's footprint, fading outward.
          const d = Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 2;
          const a = smoothstep(0.42, 0.55, d) * (1 - smoothstep(0.55, 1, d)) * 255;
          return [a, a, a];
        },
        { srgb: false },
      ),
    });
    const dark = themeProbe(root);
    let pressGlow: ((press: number) => void) | undefined;
    for (const row of rows)
      row.keys.forEach((text, col) => {
        const x = -0.86 + col * KEY + row.offset;
        if (Math.abs(x) > 1.3) return;
        const key = group(root, x, 0.24 + HEIGHT / 2 + 0.02, row.z);
        const hero = text === "AI";
        const material = hero ? accent : pbt;
        mesh(key, capGeometry, material);
        let legend = legends.get(text);
        if (!legend) {
          const { alphaMap, normalMap } = legendTextures(text);
          legend = hero
            ? shine.clone()
            : new THREE.MeshStandardMaterial({
                color: 0x2a2b2e,
                alphaMap,
                normalMap,
                normalScale: new THREE.Vector2(0.6, 0.6),
                transparent: true,
                roughness: 0.5,
                polygonOffset: true,
                polygonOffsetFactor: -2,
                depthWrite: false,
              });
          if (hero) Object.assign(legend, { alphaMap, polygonOffset: true, polygonOffsetFactor: -2 });
          legends.set(text, legend);
        }
        const topHalf = (WIDTH * 0.8) / 2;
        decal(mesh(key, legendGeometry(text, hero ? 0.088 : 0.07, HEIGHT / 2, topHalf, 0, hero ? 0 : -0.05, -0.06), legend));
        if (hero) {
          const glow = mesh(root, new THREE.PlaneGeometry(0.62, 0.62), spill, x, 0.243, row.z - 0.01);
          glow.rotation.x = -Math.PI / 2;
          glow.renderOrder = 2;
          glow.userData.frameIgnore = true;
          pressGlow = (press) => (spill.opacity = (dark() ? 1.6 : 0.9) * (0.75 + 0.5 * press));
        }
        const phase = typing[text];
        if (phase !== undefined) {
          const rest = key.position.y;
          // A quick press and a springy return, twice a loop.
          ticks.push((angle) => {
            const press = Math.max(0, Math.cos(angle * 2 - phase * 2)) ** 24;
            key.position.y = rest - 0.07 * press;
            if (hero) pressGlow?.(press);
          });
        }
      });
  },

  /** Match point: a felt ball resting on the baseline, a racket out of focus behind it. */
  tennis(root, ticks) {
    court(root);
    // The baseline: matte paint with its ends feathered into the fade.
    const lineFade = paintTexture(
      64,
      4,
      (u) => {
        const a = 1 - smoothstep(0.55, 0.98, Math.abs(u - 0.5) * 2);
        return [a * 255, a * 255, a * 255];
      },
      { srgb: false },
    );
    const paint = themed(
      new THREE.MeshStandardMaterial({
        color: 0xf2f1ea,
        roughness: 0.7,
        alphaMap: lineFade,
        transparent: true,
        depthWrite: false,
      }),
      { dark: { color: 0xa9aaa6 } },
    );
    const line = mesh(root, new THREE.PlaneGeometry(GROUND_WIDTH, 0.5), paint, 0, 0.002, 0.05);
    line.rotation.x = -Math.PI / 2;
    line.renderOrder = -1;
    line.receiveShadow = true;
    line.userData.frameIgnore = true;

    // The racket behind, already out of focus: a soft painted card leaning on nothing we can see.
    const blurred = paintTexture(192, 240, (u, v) => {
      const x = (u - 0.5) * 2,
        y = (v - 0.57) * 2.65;
      const r = Math.hypot(x / 0.86, y / 1.02);
      const frame = smoothstep(0.24, 0.04, Math.abs(r - 0.93));
      const inside = smoothstep(0.84, 0.66, r);
      const strings =
        inside *
        0.5 *
        (smoothstep(0.32, 0.05, Math.abs(((((x * 7) % 1) + 1) % 1) - 0.5) * 2 - 0.7) +
          smoothstep(0.32, 0.05, Math.abs(((((y * 7) % 1) + 1) % 1) - 0.5) * 2 - 0.7));
      const throat = v < 0.3 ? smoothstep(0.12, 0.03, Math.abs(x)) * smoothstep(0, 0.08, v) : 0;
      const a = clamp01(Math.max(frame, strings * 0.85, throat));
      const [r1, g1, b1] = frame > strings ? [28, 31, 36] : [214, 214, 200];
      return [r1, g1, b1, a * 150];
    });
    const card = new THREE.MeshBasicMaterial({ map: blurred, transparent: true, depthWrite: false, toneMapped: true });
    // Its whole head sits inside the card, up and to the right of the ball, its throat running out low.
    const racket = mesh(root, new THREE.PlaneGeometry(1.15, 1.42), themed(card, { dark: { color: 0x7a7f88 } }), 0.62, 0.12, -2.1);
    racket.rotation.set(-0.25, -0.3, -0.5);
    racket.userData.frameIgnore = true;

    const RADIUS = 0.42;
    const roller = group(root, 0, 0, 0.05);
    const ball = group(roller, 0, RADIUS, 0);
    // The felt's colour wanders a little (dye and wear), darker in the matted patches.
    const feltTone = paintTexture(256, 128, (u, v) => {
      const n = fbm(u * 6, v * 3, 6, 4, 17);
      return mixRgb(0xb9c22e, 0xd8e246, clamp01(0.25 + 0.9 * n));
    });
    const felt = lookMaterial("felt", 0xffffff, { map: feltTone, grain: 3, sheenRoughness: 0.6, roughness: 1 });
    sphere(ball, RADIUS, felt, [0, 0, 0], 48);
    // Fuzz: shells of nap, each a little larger and sparser (alpha-tested strands, so they never sort
    // wrong), lighter toward the tips. They break the silhouette into a soft halo like real felt.
    const strands = paintTexture(
      512,
      256,
      (u, v, x, y) => {
        const strand =
          valueNoise2(x * 0.9, y * 1.8, 512 * 0.9, 256 * 1.8, 31) * 0.65 + valueNoise(u * 512, v * 256, 512, 32) * 0.35;
        const a = strand * 255;
        return [a, a, a];
      },
      { srgb: false },
    );
    const SHELLS = 5;
    for (let k = 1; k <= SHELLS; k++) {
      const t = k / SHELLS;
      const nap = lookMaterial("felt", new THREE.Color(0xc7d03a).lerp(new THREE.Color(0xf0f5a8), 0.15 + 0.55 * t), {
        alphaMap: strands,
        alphaTest: 0.52 + 0.22 * t,
        sheenRoughness: 0.5,
      });
      themed(nap, {
        dark: {
          color: new THREE.Color(0xc7d03a)
            .lerp(new THREE.Color(0xf0f5a8), 0.1 + 0.4 * t)
            .multiplyScalar(0.9)
            .getHex(),
        },
      });
      decal(sphere(ball, RADIUS * (1 + 0.007 * k), nap, [0, 0, 0], 48));
    }
    // The seam: a white rubber channel sunk into the felt.
    const seam = Array.from({ length: 129 }, (_, i) => {
      const a = (i / 128) * TAU;
      const r = RADIUS * 0.997;
      return vec(
        r * Math.cos(a),
        r * Math.sin(a) * Math.cos(0.55 * Math.cos(a * 2)),
        r * Math.sin(a) * Math.sin(0.55 * Math.cos(a * 2)),
      );
    });
    decal(mesh(ball, tube(seam, 0.018, true, 160, 6), lookMaterial("rubber", 0xf3f1e6, { roughness: 0.55 })));
    ball.rotation.set(0.5, 0.3, 0);
    pool(roller, 0.9, 0.6, 0, 0, 0.7);
    ticks.push((angle) => {
      const x = 0.16 * Math.sin(angle);
      roller.position.x = x;
      ball.rotation.z = -x / RADIUS;
    });
  },

  /** Ticker study: quotes printed on paper tape, curling out of a brass ticker onto walnut. */
  trading(root, ticks) {
    walnut(root);
    const machine = group(root, -1.12, 0, -0.95);
    machine.rotation.y = 0.35;
    const enamel = worn(lookMaterial("ceramic", 0x15171a, { roughness: 0.28 }), 50, 2, 21);
    // Aged brass: a browner, less saturated base and a satin finish rubbed bright only where hands go.
    const brass = worn(lookMaterial("metal", 0x8c7752, { roughness: 0.46 }), 40, 3, 22);
    block(machine, [1.1, 0.42, 0.9], enamel, [0, 0.21, 0], 0.05);
    block(machine, [1.18, 0.05, 0.98], brass, [0, 0.445, 0], 0.02);
    const wheel = group(machine, 0.18, 0.66, 0.05);
    wheel.rotation.x = Math.PI / 2;
    const knurl = new THREE.CylinderGeometry(0.17, 0.17, 0.56, 48, 1);
    const kp = knurl.attributes.position;
    for (let i = 0; i < kp.count; i++) {
      const a = Math.atan2(kp.getZ(i), kp.getX(i));
      const r = Math.hypot(kp.getX(i), kp.getZ(i));
      if (r > 0.1) {
        const k = 1 + 0.025 * Math.cos(a * 24);
        kp.setX(i, kp.getX(i) * k);
        kp.setZ(i, kp.getZ(i) * k);
      }
    }
    knurl.computeVertexNormals();
    mesh(wheel, knurl, brass);
    cylinder(wheel, 0.06, 0.64, worn(lookMaterial("brushedMetal", 0xb4b7ba), 60, 1, 23), [0, 0, 0], 16);
    const roller = group(machine, -0.2, 0.62, 0.05);
    roller.rotation.x = Math.PI / 2;
    cylinder(roller, 0.11, 0.5, lookMaterial("rubber", 0x22201e), [0, 0, 0], 24);
    for (const z of [-0.3, 0.3]) block(machine, [0.7, 0.36, 0.05], brass, [0, 0.6, z], 0.02);
    setDressing(machine);
    pool(root, 1.7, 1.5, -1.12, -0.95, 0.55);

    // The tape: printed in two colours, scrolling out as the wheel turns.
    const TEXT = "UIPK 42.18^ +1.24   ACME 7.05v -0.31   TIDY 118.6^ +3.90   ";
    const columns = TEXT.length * 6;
    const SCALE = 4;
    const colour = (cx: number) => {
      const index = Math.floor(cx / 6);
      let start = index;
      while (start > 0 && TEXT[start - 1] !== " ") start--;
      let end = index;
      while (end < TEXT.length && TEXT[end] !== " ") end++;
      const token = TEXT.slice(start, end);
      return token.includes("^") || token.startsWith("+")
        ? 0x1f7a4d
        : token.includes("v") || token.startsWith("-")
          ? 0xb3362b
          : 0x1d2433;
    };
    const tapeMap = paintTexture(columns * SCALE, 16 * SCALE, (u, v, x, y) => {
      const cx = Math.floor(x / SCALE),
        cy = Math.floor(y / SCALE) - 4;
      const fibre = 0.96 + 0.04 * valueNoise(u * 400, v * 20, 400, 6);
      const paper = mixRgb(0xf3ecdb, 0xe9dfc8, valueNoise(u * 40, v * 4, 40, 2));
      if (glyphDot(TEXT, cx, cy)) {
        // Round dots, like a print head.
        const dx = (x % SCALE) - SCALE / 2 + 0.5,
          dy = (y % SCALE) - SCALE / 2 + 0.5;
        if (dx * dx + dy * dy <= (SCALE / 2) ** 2) {
          const ink = colour(cx);
          return mixRgb(ink, ink, 0).map((c) => c * fibre) as [number, number, number];
        }
      }
      return paper.map((c) => c * fibre) as [number, number, number];
    });
    tapeMap.wrapS = THREE.RepeatWrapping;
    const TAPE = 0.34;
    const repeatLength = TAPE * ((columns * SCALE) / (16 * SCALE));
    tapeMap.repeat.set(1 / repeatLength, 1);
    const tapeGeometry = ribbonGeometry(
      [
        vec(-1.05, 0.62, -0.8),
        vec(-0.75, 0.45, -0.55),
        vec(-0.55, 0.06, -0.3),
        vec(-0.25, 0.008, -0.05),
        vec(0.3, 0.008, 0.18),
        vec(0.85, 0.01, 0.25),
        vec(1.2, 0.04, 0.22),
        vec(1.45, 0.15, 0.17),
      ],
      TAPE,
      160,
    );
    const tapeMaterial = lookMaterial("paper", 0xffffff, { map: tapeMap, side: THREE.DoubleSide, roughness: 0.9 });
    tapeMaterial.normalScale.set(0.08, 0.08);
    mesh(root, tapeGeometry, tapeMaterial);
    pool(root, 1.8, 0.6, 0.35, 0.15, 0.35);
    ticks.push((angle) => {
      tapeMap.offset.x = -angle / TAU;
      // Whole turns per loop, so the loop is seamless.
      wheel.rotation.y = -angle * 12;
      roller.rotation.y = angle * 18;
    });
  },

  /**
   * Hot swap: the front of a rack server in macro. A zinc rack ear with its pull handle and a
   * captive thumbscrew, a row of hot-swap sled bezels, and one sled pulled out on its rails, latch
   * open, showing the bare SSD board it carries. Activity LEDs blink.
   */
  server(root, ticks) {
    steelLid(root);
    const rack = group(root, -0.95, 0, 0.15);
    rack.rotation.y = 0.42;
    const HEIGHT = 0.66;
    const powder = worn(lookMaterial("plastic", 0x24272c, { roughness: 0.5 }), 30, 2, 3);
    const zinc = worn(lookMaterial("metal", 0xa7acb2, { roughness: 0.36 }), 90, 1, 5);
    const chrome = worn(lookMaterial("metal", 0xd8dce0, { roughness: 0.16 }), 60, 2, 6);
    const bezelPlastic = worn(lookMaterial("plastic", 0x17181b, { roughness: 0.42 }), 0, 2, 7);
    const recess = lookMaterial("plastic", 0x07080a, { roughness: 0.7 });

    // The chassis, running back and out of frame to the right.
    const chassis = group(rack);
    // Shallow enough that its back edge (and the room beyond) shows above it, so the frame has air.
    block(chassis, [3.05, HEIGHT, 1.0], powder, [1.5, HEIGHT / 2, -0.52], 0.02);
    block(chassis, [2.95, HEIGHT - 0.08, 0.02], recess, [1.5, HEIGHT / 2, 0.0], 0.005);
    setDressing(chassis);
    pool(root, 3.4, 1.2, 0.35, -0.2, 0.55);

    // The rack ear: a plate with a slot and a hole, folded back along the chassis side.
    const ear = new THREE.Shape();
    const EW = 0.44;
    ear.moveTo(-EW, 0.0);
    ear.lineTo(0, 0);
    ear.lineTo(0, HEIGHT);
    ear.lineTo(-EW + 0.05, HEIGHT);
    ear.quadraticCurveTo(-EW, HEIGHT, -EW, HEIGHT - 0.05);
    ear.lineTo(-EW, 0.05);
    ear.quadraticCurveTo(-EW, 0, -EW + 0.05, 0);
    const slot = new THREE.Path();
    slot.absellipse(-0.12, 0.17, 0.045, 0.032, 0, TAU, true);
    ear.holes.push(slot);
    const screwHole = new THREE.Path();
    screwHole.absarc(-0.12, HEIGHT - 0.17, 0.042, 0, TAU, true);
    ear.holes.push(screwHole);
    mesh(
      rack,
      new THREE.ExtrudeGeometry(ear, {
        depth: 0.035,
        bevelEnabled: true,
        bevelSize: 0.006,
        bevelThickness: 0.006,
        bevelSegments: 2,
        curveSegments: 24,
      }),
      zinc,
      -0.02,
      0,
      0,
    );
    block(rack, [0.035, HEIGHT, 0.42], zinc, [-0.035, HEIGHT / 2, -0.2], 0.008);
    // The pull handle: a chrome loop bolted to the ear.
    mesh(
      rack,
      tube(
        [vec(-0.33, 0.1, 0.04), vec(-0.33, 0.12, 0.17), vec(-0.33, 0.3, 0.2), vec(-0.33, 0.5, 0.17), vec(-0.33, 0.56, 0.04)],
        0.024,
        false,
        48,
        12,
      ),
      chrome,
    );
    for (const y of [0.1, 0.56]) cylinder(rack, 0.04, 0.03, chrome, [-0.33, y, 0.045], 16).rotation.x = Math.PI / 2;
    // The captive thumbscrew: a knurled head and a washer in the upper hole.
    const knurl = new THREE.CylinderGeometry(0.075, 0.075, 0.07, 48, 1);
    const kp = knurl.attributes.position;
    for (let i = 0; i < kp.count; i++) {
      const a = Math.atan2(kp.getZ(i), kp.getX(i));
      if (Math.hypot(kp.getX(i), kp.getZ(i)) > 0.05) {
        const k = 1 + 0.04 * Math.max(0, Math.cos(a * 18)) ** 0.5;
        kp.setX(i, kp.getX(i) * k);
        kp.setZ(i, kp.getZ(i) * k);
      }
    }
    knurl.computeVertexNormals();
    const screw = group(rack, -0.14, HEIGHT - 0.17, 0.035);
    screw.rotation.x = Math.PI / 2;
    cylinder(screw, 0.06, 0.012, chrome, [0, -0.008, 0], 32);
    mesh(screw, knurl, chrome, 0, -0.05, 0);

    // The sled bezels: a honeycomb vent, a latch lever with its orange touch point, two light pipes.
    const vent = paintTexture(128, 96, (u, v) => {
      // Hexagonal holes on a 12-across grid: distance to the nearest centre of a staggered lattice.
      const gx = u * 12,
        gy = v * 9 * 1.1547;
      const row = Math.floor(gy),
        shift = row % 2 ? 0.5 : 0;
      const dx = ((gx + shift) % 1) - 0.5,
        dy = (gy % 1) - 0.5;
      const hex = Math.max(Math.abs(dx), Math.abs(dx) * 0.5 + Math.abs(dy) * 0.866);
      const hole = smoothstep(0.36, 0.3, hex);
      const c = 30 - 26 * hole;
      return [c, c, c + 2];
    });
    const ventNormal = paintTexture(
      128,
      96,
      (u, v) => {
        const gx = u * 12,
          gy = v * 9 * 1.1547;
        const row = Math.floor(gy),
          shift = row % 2 ? 0.5 : 0;
        const dx = ((gx + shift) % 1) - 0.5,
          dy = (gy % 1) - 0.5;
        const hex = Math.max(Math.abs(dx), Math.abs(dx) * 0.5 + Math.abs(dy) * 0.866);
        const rim = smoothstep(0.3, 0.36, hex) * smoothstep(0.44, 0.36, hex);
        const len = Math.hypot(dx, dy) || 1;
        const n = vec((dx / len) * rim * 0.7, (dy / len) * rim * 0.7, 1).normalize();
        return [(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255];
      },
      { srgb: false },
    );
    const ventMaterial = lookMaterial("plastic", 0xffffff, { map: vent, normalMap: ventNormal, roughness: 0.5 });
    const lever = worn(lookMaterial("metal", 0x8e9399, { roughness: 0.3 }), 40, 1, 8);
    const touch = lookMaterial("plastic", 0xd8622a, { roughness: 0.45 });
    const leds: THREE.MeshStandardMaterial[] = [];
    const SLED = 0.62,
      PITCH = 0.68,
      BH = HEIGHT - 0.12;
    const sled = (x: number, out: boolean, index: number) => {
      const front = group(rack, x, HEIGHT / 2, 0);
      block(front, [SLED, BH, 0.07], bezelPlastic, [0, 0, 0.035], 0.012);
      decal(mesh(front, new THREE.PlaneGeometry(SLED - 0.12, BH * 0.5), ventMaterial, -0.02, 0.07, 0.0715));
      // The latch: a lever hinged at the left end, swung open on the pulled sled.
      const hinge = group(front, -SLED / 2 + 0.05, -BH / 2 + 0.07, 0.085);
      hinge.rotation.y = out ? -0.75 : 0;
      block(hinge, [SLED - 0.12, 0.07, 0.03], lever, [(SLED - 0.12) / 2, 0, 0], 0.012);
      block(hinge, [0.08, 0.072, 0.036], touch, [SLED - 0.17, 0, 0.004], 0.012);
      cylinder(hinge, 0.018, 0.08, chrome, [0, 0, 0], 12);
      for (const [k, color] of [
        [0, 0x46ff8c],
        [1, index === 1 ? 0xffa53a : 0x4aa8ff],
      ] as const) {
        const led = new THREE.MeshStandardMaterial({ color: 0x101410, emissive: color, emissiveIntensity: 1.6, roughness: 0.2 });
        leds.push(led);
        decal(block(front, [0.03, 0.03, 0.02], led, [SLED / 2 - 0.05, BH / 2 - 0.06 - k * 0.06, 0.075], 0.006));
      }
      return front;
    };
    const fronts: THREE.Group[] = [];
    for (let i = 0; i < 4; i++) fronts.push(sled(0.38 + i * PITCH, i === 1, i));
    // Only the ear, the pulled sled and its neighbours are framed; the rest runs out of the frame.
    for (const front of fronts.slice(3)) setDressing(front);

    // The pulled sled's tray: two rails and the bare board between them, half out of its bay.
    const pulled = fronts[1];
    const tray = group(pulled, 0, -BH / 2 + 0.02, -0.02);
    for (const side of [-1, 1]) block(tray, [0.03, 0.07, 1.25], zinc, [side * (SLED / 2 - 0.03), 0.03, -0.6], 0.008);
    block(tray, [SLED - 0.08, 0.012, 1.2], ssdBoardMaterial(), [0, 0.03, -0.62], 0.004);
    const chip = worn(lookMaterial("plastic", 0x141518, { roughness: 0.38 }), 0, 3, 9);
    const chips: THREE.BufferGeometry[] = [];
    for (const [cx, cz, w, d] of [
      [-0.12, -0.25, 0.2, 0.22],
      [0.12, -0.25, 0.2, 0.22],
      [-0.12, -0.6, 0.2, 0.22],
      [0.12, -0.6, 0.2, 0.22],
      [0, -0.95, 0.24, 0.2],
    ])
      chips.push(mergeable(placed(roundedBox(w, 0.025, d, 0.006, 1), cx, 0.05, cz), true));
    mesh(tray, mergeGeometries(chips), chip);
    pulled.position.z = 0.85;
    pool(root, 0.9, 1.2, -0.1, 0.75, 0.4);

    ticks.push((angle) => {
      leds.forEach(
        (led, i) => (led.emissiveIntensity = i % 2 ? 1.4 : 0.3 + 2.2 * Math.max(0, Math.sin(angle * 9 + i * 1.3)) ** 6),
      );
      // The pulled sled eases a touch further out and back.
      pulled.position.z = 0.85 + 0.05 * Math.sin(angle);
    });
  },

  /** Field compass: a steel compass tilted on a rolled map case, its needle hunting north. */
  travel(root, ticks) {
    leather(root);
    // A topographic map sheet under it, with a soft crease.
    const mapTexture = paintTexture(256, 256, (u, v) => {
      const h = fbm(u * 3, v * 3, 3, 4, 12);
      const contour = smoothstep(0.08, 0.0, Math.abs(((h * 14) % 1) - 0.5) - 0.42);
      const river = smoothstep(0.012, 0.003, Math.abs(v - 0.55 - 0.08 * Math.sin(u * 9)));
      const grid = Math.min(Math.abs(((u * 6) % 1) - 0.5), Math.abs(((v * 6) % 1) - 0.5)) > 0.492 ? 1 : 0;
      const route = smoothstep(0.01, 0.004, Math.abs(u - 0.3 - 0.4 * v * v)) * (Math.floor(v * 40) % 2);
      const base = mixRgb(0xece3cc, 0xd9cfae, h);
      let c: [number, number, number] = base;
      if (grid) c = mixRgb(0xece3cc, 0x9aa7a9, 0.6);
      c = c.map((x, i) => mix(x, [148, 120, 76][i], contour * 0.75)) as [number, number, number];
      c = c.map((x, i) => mix(x, [72, 130, 178][i], river)) as [number, number, number];
      c = c.map((x, i) => mix(x, [196, 52, 40][i], route)) as [number, number, number];
      return c;
    });
    const sheet = new THREE.PlaneGeometry(2.6, 1.9, 12, 1);
    const sp = sheet.attributes.position;
    for (let i = 0; i < sp.count; i++) sp.setZ(i, 0.05 * Math.abs(sp.getX(i) - 0.2));
    sheet.computeVertexNormals();
    const map = mesh(root, sheet, lookMaterial("paper", 0xffffff, { map: mapTexture, roughness: 0.92 }), 0.3, 0.012, -0.15);
    map.rotation.set(-Math.PI / 2, 0, 0.12);
    setDressing(map);

    // The rolled leather case it leans on.
    const roll = cylinder(
      root,
      0.27,
      3.4,
      worn(lookMaterial("plastic", 0x3a2216, { roughness: 0.7 }), 0, 3, 25),
      [0, 0.27, -1.08],
      40,
    );
    roll.rotation.z = Math.PI / 2;
    setDressing(roll);

    const compass = group(root, 0, 0.36, -0.08);
    compass.rotation.x = 0.3; // tipped toward the lens, its back edge on the roll
    compass.rotation.y = -0.15;
    const steel = worn(lookMaterial("brushedMetal", 0xc2c6ca, { roughness: 0.26, anisotropy: 0.5 }), 140, 2, 24);
    const profile = [
      [0, -0.09],
      [0.8, -0.09],
      [0.86, -0.075],
      [0.9, -0.03],
      [0.91, 0.05],
      [0.89, 0.09],
      [0.85, 0.1],
      [0.81, 0.08],
      [0.8, 0.02],
      [0, 0.02],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    mesh(compass, new THREE.LatheGeometry(profile, 96), steel);
    // Knurled bezel.
    const bezel = new THREE.TorusGeometry(0.865, 0.035, 8, 180);
    const bp = bezel.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const a = Math.atan2(bp.getY(i), bp.getX(i));
      const k = 1 + 0.0025 * Math.cos(a * 90);
      bp.setXY(i, bp.getX(i) * k, bp.getY(i) * k);
    }
    bezel.rotateX(Math.PI / 2);
    bezel.computeVertexNormals();
    mesh(compass, bezel, steel, 0, 0.085, 0);
    const dialMap = paintTexture(512, 512, (u, v) => {
      const x = (u - 0.5) * 2,
        y = (v - 0.5) * 2;
      const r = Math.hypot(x, y);
      const deg = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
      const arc = (d: number, step: number) => (Math.abs(((d + step / 2) % step) - step / 2) * Math.PI * r) / 180;
      let ink = 0;
      if (r > 0.8 && r < 0.93) ink = Math.max(ink, smoothstep(0.009, 0.004, arc(deg, 5)));
      if (r > 0.72 && r < 0.94) ink = Math.max(ink, smoothstep(0.014, 0.008, arc(deg, 30)));
      if (r > 0.95 && r < 0.965) ink = 1;
      // Cardinal letters, upright.
      let red = 0;
      for (const [letter, a] of [
        ["N", 0],
        ["E", 90],
        ["S", 180],
        ["W", 270],
      ] as const) {
        const cx = 0.53 * Math.sin((a * Math.PI) / 180),
          cy = 0.53 * Math.cos((a * Math.PI) / 180);
        const s = 0.028;
        const col = Math.floor((x - cx) / s + 2.5),
          row = Math.floor(-(y - cy) / s + 3.5);
        if (glyphDot(letter, col, row)) {
          if (letter === "N") red = 1;
          else ink = 1;
        }
      }
      // A red north triangle at the rim, clear of the N so the two never merge into an "A".
      if (y > 0.71 && y < 0.82 && Math.abs(x) < (0.82 - y) * 0.45) red = 1;
      if (r > 0.985) return [40, 40, 42];
      const base = mixRgb(0x17191c, 0x23262a, valueNoise(u * 60, v * 60, 60, 3));
      if (red) return [210, 58, 42];
      return base.map((c, i) => mix(c, [236, 228, 204][i], ink)) as [number, number, number];
    });
    const dial = mesh(
      compass,
      new THREE.CircleGeometry(0.8, 96),
      new THREE.MeshStandardMaterial({ map: dialMap, roughness: 0.55 }),
      0,
      0.021,
      0,
    );
    dial.rotation.x = -Math.PI / 2;
    decal(dial);
    const needle = group(compass, 0, 0.06, 0);
    const half = (sign: number) => {
      const shape = new THREE.Shape();
      shape.moveTo(-0.07, 0);
      shape.lineTo(0, 0.6 * sign);
      shape.lineTo(0.07, 0);
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.018,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.008,
        bevelSegments: 1,
      });
      geometry.rotateX(-Math.PI / 2);
      return geometry;
    };
    mesh(needle, half(-1), lookMaterial("ceramic", 0xd0402e, { roughness: 0.3 }));
    mesh(needle, half(1), lookMaterial("ceramic", 0xece6d6, { roughness: 0.3 }));
    cylinder(needle, 0.045, 0.05, lookMaterial("metal", 0xc9a35a), [0, 0.02, 0], 20);
    // The crystal: a faint dome you only see by its reflections.
    const crystal = new THREE.SphereGeometry(2.4, 64, 4, 0, TAU, 0, Math.asin(0.84 / 2.4));
    crystal.translate(0, -2.4 * Math.cos(Math.asin(0.84 / 2.4)) + 0.09, 0);
    decal(mesh(compass, crystal, clearGlass()));
    // The bale.
    const bale = mesh(compass, new THREE.TorusGeometry(0.16, 0.03, 12, 48), steel, 0, 0.0, -1.02);
    bale.rotation.x = Math.PI / 2;
    block(compass, [0.18, 0.08, 0.12], steel, [0, 0, -0.9], 0.03);
    pool(root, 2.0, 1.2, 0, 0.0, 0.6);
    ticks.push((angle) => (needle.rotation.y = 0.3 + 0.22 * Math.sin(angle) * (0.75 + 0.25 * Math.cos(angle * 2))));
  },

  /** Quiet chapter: tortoiseshell glasses folded on an open book, a page lifting in the draught. */
  reading(root, ticks) {
    walnut(root);
    const W = 1.25,
      H = 1.7,
      THICK = 0.18;
    const pageCurve = (t: number) =>
      THICK + 0.11 * Math.max(0, Math.sin(Math.min(1, Math.max(0, t) * 1.6) * (Math.PI / 2))) ** 0.7 - 0.04 * t;
    const textMap = paintTexture(256, 352, (u, v) => {
      const paper = mixRgb(0xf3ecdc, 0xebe2cd, valueNoise(u * 30, v * 30, 30, 4));
      const margin = u < 0.14 || u > 0.88 || v < 0.1 || v > 0.9;
      if (margin) return paper;
      const line = Math.floor((v - 0.1) * 46);
      const inLine = ((v - 0.1) * 46) % 1;
      const word = valueNoise(u * 34, line * 3.1, 34, line + 3);
      const ink = smoothstep(0.32, 0.2, Math.abs(inLine - 0.45)) * smoothstep(0.3, 0.36, word) * (line % 17 === 16 ? 0 : 1);
      return paper.map((c, i) => mix(c, [70, 64, 58][i], ink * 0.7)) as [number, number, number];
    });
    const pageMaterial = new THREE.MeshStandardMaterial({ map: textMap, roughness: 0.92 });
    const edgeMaterial = lookMaterial("paper", 0xe6dcc4, { roughness: 0.95, grain: 2 });
    const pageBlock = (sign: number) => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(sign * W, 0);
      for (let i = 24; i >= 0; i--) shape.lineTo(sign * W * (i / 24), pageCurve(i / 24));
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false, curveSegments: 4 });
      geometry.translate(0, 0, -H / 2);
      const uv = geometry.attributes.uv,
        position = geometry.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, Math.abs(position.getX(i)) / W, 0.5 + position.getZ(i) / H);
      if (sign < 0) for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
      return geometry;
    };
    const book = group(root, 0.05, 0.03, 0.05);
    book.rotation.y = 0.12;
    for (const sign of [-1, 1]) mesh(book, pageBlock(sign), [edgeMaterial, pageMaterial]);
    const cloth = lookMaterial("felt", 0x2d4a3e, { grain: 6, roughness: 0.95 });
    for (const sign of [-1, 1]) {
      const board = block(book, [W + 0.06, 0.03, H + 0.08], cloth, [sign * (W / 2 + 0.02), -0.015, 0], 0.012);
      board.rotation.z = sign * 0.015;
    }
    // The ribbon marker, out over the bottom edge.
    const ribbon = ribbonGeometry(
      [
        vec(0.02, THICK + 0.02, -0.4),
        vec(0.12, THICK + 0.03, 0.3),
        vec(0.18, 0.12, H / 2 + 0.03),
        vec(0.22, 0.004, H / 2 + 0.25),
      ],
      0.05,
      40,
    );
    mesh(book, ribbon, lookMaterial("plastic", 0x9b2b25, { side: THREE.DoubleSide, roughness: 0.42 }));
    // A loose leaf on the right lifts and settles.
    const leaf = new THREE.PlaneGeometry(W * 0.98, H * 0.97, 16, 1);
    leaf.rotateX(-Math.PI / 2);
    leaf.translate((W * 0.98) / 2, 0, 0);
    const lp = leaf.attributes.position;
    for (let i = 0; i < lp.count; i++) lp.setY(i, pageCurve(lp.getX(i) / W) - THICK + 0.004 + 0.06 * (lp.getX(i) / W) ** 2);
    leaf.computeVertexNormals();
    const sheetPivot = group(book, 0, THICK, 0);
    mesh(sheetPivot, leaf, new THREE.MeshStandardMaterial({ map: textMap, roughness: 0.92, side: THREE.DoubleSide }));
    setDressing(book);
    ticks.push((angle) => (sheetPivot.rotation.z = 0.02 + 0.07 * (0.5 + 0.5 * Math.sin(angle))));

    // The glasses: tortoiseshell acetate, folded, standing on the right page.
    const tortoise = paintTexture(
      128,
      128,
      (u, v) => {
        const n = fbm(u * 5, v * 5, 5, 4, 41);
        const spot = smoothstep(0.45, 0.62, n);
        return mixRgb(0x1c0d06, 0x8a4f1e, spot * 0.85 + 0.1 * valueNoise(u * 40, v * 40, 40, 2));
      },
      { repeat: [2, 2] },
    );
    const acetate = worn(
      lookMaterial("ceramic", 0xffffff, { map: tortoise, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }),
      30,
      2,
      27,
    );
    const glasses = group(root, 0.5, 0.64, 0.3);
    glasses.rotation.set(-0.06, -0.22, 0);
    const RX = 0.25,
      RY = 0.2,
      BAND = 0.032,
      DEPTH = 0.03;
    // A soft-cornered "P3" lens: an ellipse squared off a little, so the rim reads as cut acetate, not a wire ring.
    const lensPoint = (cx: number, t: number, grow: number) => {
      const c = Math.cos(t),
        s = Math.sin(t);
      const k = 0.86;
      const x = Math.sign(c) * Math.abs(c) ** k,
        y = Math.sign(s) * Math.abs(s) ** k;
      return new THREE.Vector2(cx + x * (RX + grow), y * (RY + grow) - 0.012 * (1 - s));
    };
    const outline = (cx: number, grow: number, reverse: boolean) => {
      const points = Array.from({ length: 129 }, (_, i) => lensPoint(cx, ((reverse ? 128 - i : i) / 128) * TAU, grow));
      return points;
    };
    const rim = (cx: number) => {
      const shape = new THREE.Shape(outline(cx, BAND, false));
      shape.holes.push(new THREE.Path(outline(cx, 0, true)));
      return shape;
    };
    const front = new THREE.ExtrudeGeometry([rim(-0.3), rim(0.3)], {
      depth: DEPTH,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 5,
      curveSegments: 128,
    });
    front.translate(0, 0, -DEPTH / 2);
    const uv = front.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.8, uv.getY(i) * 0.8);
    // Smooth the shading across the many short outline segments (the bevel stays crisp).
    const smoothFront = mergeVertices(front.deleteAttribute("normal"), 1e-4);
    smoothFront.computeVertexNormals();
    mesh(glasses, smoothFront, acetate);
    // The keyhole bridge.
    mesh(glasses, tube([vec(-0.07, 0.07, 0), vec(0, 0.1, 0), vec(0.07, 0.07, 0)], 0.026, false, 16, 12), acetate);
    // End pieces and barrel hinges at the outer corners; the temples stand open, running back over
    // the page and bending down at the ear so the glasses rest on their rims and temple tips.
    const pin = worn(lookMaterial("metal", 0xc8c2b4, { roughness: 0.3 }), 60, 1, 26);
    for (const side of [-1, 1]) {
      const edge = side * (0.3 + RX + BAND);
      mesh(glasses, roundedBox(0.05, 0.075, 0.07, 0.02), acetate, edge - side * 0.012, 0.09, -0.04);
      cylinder(glasses, 0.009, 0.085, pin, [edge - side * 0.004, 0.09, -0.075], 10);
      const temple = mesh(
        glasses,
        tube(
          [
            vec(edge - side * 0.006, 0.09, -0.07),
            vec(edge + side * 0.004, 0.088, -0.16),
            vec(edge + side * 0.01, 0.07, -0.55),
            vec(edge + side * 0.006, 0.04, -0.85),
            vec(edge - side * 0.004, -0.06, -0.97),
            vec(edge - side * 0.01, -0.26, -1.0),
          ],
          0.013,
          false,
          64,
          10,
        ),
        acetate,
      );
      temple.castShadow = true;
      const lensShape = new THREE.Shape(outline(side * 0.3, 0.004, false));
      const lens = mesh(glasses, new THREE.ShapeGeometry(lensShape, 64), clearGlass(), 0, 0, 0.004);
      decal(lens);
    }
    pool(root, 1.3, 0.5, 0.55, 0.05, 0.4, 0.32);
  },
};

/** One lens for the whole direction; the angle and crop move with the subject's height. */
const subjectCamera: Record<ArtKind, { pitch: number; yaw?: number; fill?: number; maxWidth?: number }> = {
  ai: { pitch: 26, fill: 0.86, maxWidth: 1.04 },
  tennis: { pitch: 13, fill: 0.62 },
  trading: { pitch: 24, fill: 0.84, maxWidth: 1 },
  server: { pitch: 20, fill: 0.8 },
  travel: { pitch: 22, fill: 0.84 },
  reading: { pitch: 20, fill: 0.5, maxWidth: 0.7 },
};

/** Where the night lamp hangs over each subject (it pools light on the subject and falls off into the dark). */
const lampAt: Record<ArtKind, [number, number, number]> = {
  ai: [2.1, 1.0, 0.3],
  tennis: [0.9, 1.4, 0.9],
  trading: [1.3, 1.0, 0.5],
  server: [0.9, 1.6, 0.9],
  travel: [0.8, 1.5, 0.9],
  reading: [1.7, 1.1, 0.6],
};

export function realistic(kind: ArtKind, ticks: Tick[]) {
  const root = new THREE.Group();
  models[kind](root, ticks);
  // The practical: a warm point light, on only in the dark theme.
  const lamp = new THREE.PointLight(0xffb36e, 0, 0, 2);
  lamp.position.set(...lampAt[kind]);
  root.add(lamp);
  const dark = themeProbe(root);
  ticks.push(() => (lamp.intensity = dark() ? 9 : 0));
  const { pitch, yaw = 0, fill, maxWidth } = subjectCamera[kind];
  root.userData.look = {
    ...realisticLook,
    camera: { ...realisticLook.camera, pitch, yaw },
    framing: { ...(realisticLook.framing || {}), ...(fill ? { fill } : {}), ...(maxWidth ? { maxWidth } : {}) },
  } satisfies ObjectLook;
  return root;
}
