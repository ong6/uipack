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
  group,
  mergeable,
  mesh,
  mix,
  mixRgb,
  normalTexture,
  paintTexture,
  placed,
  ribbonGeometry,
  rodGeometry,
  roundedBox,
  seeded,
  smoothstep,
  sphere,
  tube,
  valueNoise,
  valueNoise2,
  themeProbe,
} from "./expanded-kit";
import type { KindWithLook } from "./variants";

type Kind = Exclude<KindWithLook<4>, "contact">;

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
  phoneMultisample: false,
};

/* ---------------------------------------------------------------- Surfaces */

/**
 * The surface runs from just in front of the lens back to a wall: real depth (a table meeting a wall,
 * a court meeting its windscreen), not a fade into the card. Both go soft with distance from the
 * subject through `defocus`, the way a long lens at close focus renders them.
 */
const GROUND_NEAR = 2.4,
  WALL_Z = -4.6,
  GROUND_WIDTH = 16,
  GROUND_DEPTH = GROUND_NEAR - WALL_Z;
/** Texture repeats were tuned on a 4.2 × 8.5 plane; this keeps their texel size on the larger one. */
const tile = (x: number, z: number): [number, number] => [(x * GROUND_WIDTH) / 4.2, (z * GROUND_DEPTH) / 8.5];

/**
 * Depth of field for the set: a material's maps are sampled with a mip bias that grows with the
 * distance from the focal plane (the subject, at the root's origin), so the grain is crisp under the
 * subject and melts toward the wall and the near edge, instead of fading out through a fog band.
 */
/**
 * The floor and wall are far bigger than the subject. Like studio's sweep, their geometry is stored
 * at 1/EXPAND scale and blown back up in the vertex shader, so they never count toward the object's
 * bounds (framing, envelope checks); they are never frustum-culled for the same reason.
 */
const EXPAND = 64;
function expanded(geometry: THREE.BufferGeometry) {
  return geometry.scale(1 / EXPAND, 1 / EXPAND, 1 / EXPAND);
}
/**
 * A phone-width stage (the query mount.ts caps at 30 frames a second). Its canvas is a third as
 * wide, where a long lens's falloff and the lid's wear read as nothing, so the set skips them: the
 * floor and wall fill most of the frame, and their per-pixel cost is most of the frame's.
 */
const phoneStage = () => typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches;

function defocus<M extends THREE.MeshStandardMaterial>(material: M, object: THREE.Mesh, strength = 6) {
  object.frustumCulled = false;
  const focus = { value: 8 };
  const origin = new THREE.Vector3(),
    lens = new THREE.Vector3();
  object.onBeforeRender = (_renderer, _scene, camera) => {
    (object.parent ?? object).getWorldPosition(origin);
    camera.getWorldPosition(lens);
    focus.value = lens.distanceTo(origin);
  };
  const phone = phoneStage();
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>\ntransformed *= ${EXPAND.toFixed(1)};`,
    );
    if (phone) return;
    shader.uniforms.focusDepth = focus;
    const bias = "dofBias";
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float focusDepth;")
      .replace(
        "#include <map_fragment>",
        `float ${bias} = clamp(pow(abs(vViewPosition.z - focusDepth) / focusDepth, 1.3) * ${strength.toFixed(2)}, 0.0, 5.0);\n` +
          THREE.ShaderChunk.map_fragment.replace("texture2D( map, vMapUv )", `texture2D( map, vMapUv, ${bias} )`),
      )
      .replace(
        "#include <roughnessmap_fragment>",
        THREE.ShaderChunk.roughnessmap_fragment.replace(
          "texture2D( roughnessMap, vRoughnessMapUv )",
          `texture2D( roughnessMap, vRoughnessMapUv, ${bias} )`,
        ),
      )
      .replace(
        "#include <normal_fragment_maps>",
        THREE.ShaderChunk.normal_fragment_maps
          .split("texture2D( normalMap, vNormalMapUv )")
          .join(`texture2D( normalMap, vNormalMapUv, ${bias} )`),
      );
  };
  material.customProgramCacheKey = () => `realistic-defocus-${phone ? "phone" : strength}`;
  return material;
}

/** A table-top plane under the subject (y 0), excluded from framing; it still takes the key's shadow. */
function surface(root: THREE.Object3D, map: THREE.Texture, normalMap: THREE.Texture | null, roughness: number, dark = 0.72) {
  const material = themed(
    new THREE.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness,
      metalness: 0,
    }),
    { dark: { color: new THREE.Color(dark, dark, dark).getHex() } },
  );
  for (const texture of [map, normalMap]) if (texture) texture.anisotropy = 16;
  const ground = new THREE.PlaneGeometry(GROUND_WIDTH, GROUND_DEPTH)
    .rotateX(-Math.PI / 2)
    .translate(0, 0, GROUND_NEAR - GROUND_DEPTH / 2);
  const plane = mesh(root, expanded(ground), material);
  plane.renderOrder = -2;
  plane.receiveShadow = true;
  plane.userData.frameIgnore = true;
  defocus(material, plane);
  return plane;
}

type Backdrop = "room" | "court" | "rack";
/**
 * What stands behind the set, well out of focus: a plaster wall with a window's light on it, a
 * court's green windscreen under the sky, or a dark aisle of racks with their LEDs as bokeh. Painted
 * soft (it is far behind the focal plane) and lit by the rig, so the night lamp relights it too.
 */
function backdrop(root: THREE.Object3D, kind: Backdrop) {
  const disc = (u: number, v: number, cu: number, cv: number, r: number, aspect = 2) =>
    smoothstep(r, r * 0.55, Math.hypot((u - cu) * aspect, v - cv));
  const painter: Record<Backdrop, (u: number, v: number) => [number, number, number]> = {
    room(u, v) {
      // Warm plaster; a tall window's light falls on it from the left, its mullions soft shadows.
      const window = smoothstep(0.02, 0.12, u) * smoothstep(0.5, 0.36, u) * smoothstep(0.22, 0.34, v) * smoothstep(0.98, 0.84, v);
      const mullion = 1 - 0.35 * smoothstep(0.035, 0.0, Math.abs(u - 0.26)) - 0.35 * smoothstep(0.03, 0.0, Math.abs(v - 0.62));
      const fall = 0.62 + 0.38 * smoothstep(1, 0.1, u);
      const corner = smoothstep(0.0, 0.16, v); // the wall darkens where it meets the table
      const plant = 0.55 * disc(u, v, 0.78, 0.36, 0.13) + 0.35 * disc(u, v, 0.86, 0.5, 0.09);
      const light = clamp01(fall * (0.55 + 0.45 * corner) + 0.5 * window * mullion);
      const base = mixRgb(0x8f8170, 0xf2e6d0, light);
      return base.map((c, i) => mix(c, [74, 86, 60][i], plant * 0.7)) as [number, number, number];
    },
    court(u, v) {
      // Sky over a dark green windscreen on the back fence, its posts soft verticals.
      const screen = smoothstep(0.66, 0.6, v);
      const post = smoothstep(0.03, 0.0, Math.abs(((u * 4 + 0.3) % 1) - 0.5) - 0.47);
      const sky = mixRgb(0xbcd4e6, 0xe9eef0, smoothstep(1, 0.6, v));
      const cloth = mixRgb(0x1f3f33, 0x2f5a47, 0.5 + 0.5 * valueNoise(u * 6, v * 3, 6, 4));
      const shade = cloth.map((c) => c * (1 - 0.25 * post)) as [number, number, number];
      return sky.map((c, i) => mix(c, shade[i], screen)) as [number, number, number];
    },
    rack(u, v) {
      // A dark aisle: cabinet doors as soft verticals, their LEDs as defocused discs.
      const door = 0.5 + 0.5 * smoothstep(0.08, 0.0, Math.abs(((u * 5) % 1) - 0.5) - 0.42);
      let c: [number, number, number] = mixRgb(0x15181d, 0x2b3038, 0.4 * door + 0.3 * smoothstep(0, 0.7, v));
      const random = seeded(91);
      for (let k = 0; k < 26; k++) {
        const cu = random(),
          cv = 0.2 + random() * 0.7,
          hue = random();
        const glow = disc(u, v, cu, cv, 0.035 + 0.02 * random());
        const tint = hue < 0.55 ? [70, 150, 255] : hue < 0.85 ? [80, 255, 150] : [255, 170, 70];
        c = c.map((x, i) => mix(x, tint[i], glow * 0.75)) as [number, number, number];
      }
      return c;
    },
  };
  const texture = paintTexture(160, 80, (u, v) => painter[kind](u, v));
  const material = themed(new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 }), {
    dark: { color: kind === "rack" ? 0xb0b0b0 : 0x6a6a6a },
  });
  if (kind === "rack") Object.assign(material, { emissiveMap: texture, emissive: new THREE.Color(0x777777) });
  const wall = mesh(root, expanded(new THREE.PlaneGeometry(GROUND_WIDTH, 8).translate(0, 3.6, WALL_Z)), material);
  wall.renderOrder = -3;
  wall.userData.frameIgnore = true;
  defocus(material, wall, 2);
  return wall;
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
  // Full resolution: under grazing light the relief of each latewood line and pore is what reads as wood.
  const normalMap = normalTexture(
    SIZE,
    (u, v) => {
      const i = (Math.min(SIZE - 1, Math.floor(v * SIZE)) * SIZE + Math.min(SIZE - 1, Math.floor(u * SIZE))) * 3;
      return 0.6 - 0.2 * field[i] - 0.2 * field[i + 1] - 0.8 * field[i + 2];
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
      // Wide swings: polished rubs and dull smudges a viewer can see at card size, not a uniform satin.
      const r = clamp01(0.4 + 0.5 * smudge + 0.1 * mottle + 0.26 * lines[y * SIZE + x]) * 255;
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

/** A sanded acrylic hard court, blue, with its baseline. */
function court(root: THREE.Object3D) {
  const map = paintTexture(
    128,
    128,
    (u, v) => {
      const speck = valueNoise(u * 128, v * 128, 128, 2);
      return mixRgb(0x2c5677, 0x46789b, speck * 0.7 + 0.15 * fbm(u * 4, v * 4, 4, 2, 8));
    },
    { repeat: tile(6, 12) },
  );
  const normalMap = normalTexture(128, (u, v) => valueNoise(u * 128, v * 128, 128, 3), 2.5, tile(12, 24));
  return surface(root, map, normalMap, 0.82);
}

/** The powder-coated steel lid of the server below: dark, orange-peel textured, faintly mottled. */
function steelLid(root: THREE.Object3D) {
  const map = paintTexture(
    128,
    128,
    (u, v) => mixRgb(0x2c2f34, 0x3b3f45, 0.55 * fbm(u * 3, v * 3, 3, 3, 14) + 0.25 * valueNoise(u * 128, v * 128, 128, 6)),
    { repeat: tile(5, 10) },
  );
  const normalMap = normalTexture(128, (u, v) => fbm(u * 24, v * 24, 24, 2, 9), 1.6, tile(16, 32));
  const plane = surface(root, map, normalMap, 0.5 / 0.78, 0.6);
  if (!phoneStage()) (plane.material as THREE.MeshStandardMaterial).roughnessMap = wearMap(40, 11, 4);
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

/**
 * A tennis racket lying flat on the court, at the ball's scale (a 67 mm ball is 0.84 units, so the
 * 27 cm head is about 3.3 by 2.6): a bevelled graphite hoop in clearcoat paint, an open throat, an
 * octagonal handle wrapped in white overgrip, and a 16 × 19 string bed.
 */
function racket(root: THREE.Object3D) {
  const A = 1.62, // the head's half length (along the racket)
    B = 1.27, // half width
    BEAM = 0.13,
    DEPTH = 0.2;
  // Head behind and left of the ball, the throat and handle running away from the lens toward the
  // windscreen, so the racket stays inside the direction's envelope across the frame.
  const set = group(root, -0.36, 0, -1.55);
  set.rotation.y = 1.25;
  const ellipse = (a: number, b: number, reverse = false) =>
    Array.from({ length: 97 }, (_, i) => {
      const t = ((reverse ? 96 - i : i) / 96) * TAU;
      return new THREE.Vector2(a * Math.cos(t), b * Math.sin(t));
    });
  const hoop = new THREE.Shape(ellipse(A, B));
  hoop.holes.push(new THREE.Path(ellipse(A - BEAM, B - BEAM, true)));
  const hoopGeometry = new THREE.ExtrudeGeometry(hoop, {
    depth: DEPTH - 0.04,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 3,
    curveSegments: 96,
  });
  hoopGeometry.rotateX(-Math.PI / 2);
  hoopGeometry.translate(0, 0.02, 0);
  // Gloss black paint over graphite, scuffed where it meets the court.
  const paint = worn(lookMaterial("ceramic", 0x16181c, { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }), 70, 2, 31);
  const accent = worn(lookMaterial("ceramic", 0xe2571e, { roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.15 }), 30, 2, 32);
  const hoopMesh = mesh(set, projectUv(hoopGeometry, 1.5), paint);
  hoopMesh.castShadow = true;
  // The throat: two arms from the hoop's shoulders closing on the handle, bridged by the yoke.
  const throat = mergeGeometries([
    mergeable(rodGeometry(vec(A - 0.25, DEPTH / 2, 0.66), vec(A + 1.05, DEPTH / 2, 0.14), 0.07, 16)),
    mergeable(rodGeometry(vec(A - 0.25, DEPTH / 2, -0.66), vec(A + 1.05, DEPTH / 2, -0.14), 0.07, 16)),
  ]);
  throat.scale(1, 1.25, 1);
  mesh(set, projectUv(throat, 1.5), accent).castShadow = true;
  // The handle: an octagon with an overgrip wound on a bias, a ridge at each overlap.
  const gripLength = 2.4;
  const wrap = paintTexture(64, 256, (u, v) => {
    const t = (u + v * 9) % 1;
    const ridge = smoothstep(0.06, 0, Math.min(t, 1 - t));
    const dirt = 0.9 + 0.1 * valueNoise(u * 8, v * 40, 8, 6);
    const c = (232 - 40 * ridge) * dirt;
    return [c, c * 0.985, c * 0.95];
  });
  const wrapNormal = normalTexture(
    64,
    (u, v) => {
      const t = (u + v * 4) % 1;
      return smoothstep(0.08, 0, Math.min(t, 1 - t)) * 0.6 + 0.08 * valueNoise(u * 32, v * 32, 32, 2);
    },
    3,
    [1, 2],
  );
  const grip = mesh(
    set,
    new THREE.CylinderGeometry(0.15, 0.15, gripLength, 8, 1).rotateY(Math.PI / 8),
    lookMaterial("rubber", 0xffffff, { map: wrap, normalMap: wrapNormal, roughness: 0.85 }),
    A + 1.05 + gripLength / 2,
    0.15,
    0,
  );
  grip.rotation.z = Math.PI / 2;
  grip.castShadow = true;
  setDressing(grip);
  const collar = cylinder(set, 0.13, 0.22, accent, [A + 1.1, 0.15, 0], 8);
  collar.rotation.z = Math.PI / 2;
  setDressing(collar);
  // The string bed: 16 mains along the racket, 19 crosses, each clipped to the hoop. Mains ride a
  // hair above the crosses, so the weave catches the light.
  const string = worn(lookMaterial("plastic", 0xf3efe0, { roughness: 0.38 }), 0, 4, 33);
  const IA = A - BEAM - 0.01,
    IB = B - BEAM - 0.01;
  const strand = new THREE.CylinderGeometry(0.017, 0.017, 1, 6, 1);
  strand.rotateZ(Math.PI / 2);
  const MAINS = 16,
    CROSSES = 19;
  const strings = new THREE.InstancedMesh(strand, string, MAINS + CROSSES);
  const matrix = new THREE.Matrix4(),
    turn = new THREE.Quaternion().setFromAxisAngle(vec(0, 1, 0), Math.PI / 2);
  let n = 0;
  for (let i = 0; i < MAINS; i++) {
    const z = -IB + ((i + 0.5) / MAINS) * 2 * IB;
    const half = IA * Math.sqrt(Math.max(0, 1 - (z / IB) ** 2));
    matrix.compose(vec(0, DEPTH / 2 + 0.012, z), new THREE.Quaternion(), vec(half * 2, 1, 1));
    strings.setMatrixAt(n++, matrix);
  }
  for (let i = 0; i < CROSSES; i++) {
    const x = -IA + ((i + 0.5) / CROSSES) * 2 * IA;
    const half = IB * Math.sqrt(Math.max(0, 1 - (x / IA) ** 2));
    matrix.compose(vec(x, DEPTH / 2 - 0.012, 0), turn, vec(half * 2, 1, 1));
    strings.setMatrixAt(n++, matrix);
  }
  strings.castShadow = true;
  set.add(strings);
  // Set dressing: the ball alone sets the frame, and the racket is staged inside it.
  set.traverse((item) => (item.userData.frameIgnore = true));
  pool(set, 3.4, 2.6, 0, 0, 0.25);
  return set;
}

/** Public-domain prose for the open book (Austen, Pride and Prejudice, chapter 1). */
const BOOK_TEXT = [
  "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
  "However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.",
  "“My dear Mr. Bennet,” said his lady to him one day, “have you heard that Netherfield Park is let at last?”",
  "Mr. Bennet replied that he had not.",
  "“But it is,” returned she; “for Mrs. Long has just been here, and she told me all about it.”",
  "Mr. Bennet made no answer.",
  "“Do you not want to know who has taken it?” cried his wife impatiently.",
  "“You want to tell me, and I have no objection to hearing it.” This was invitation enough.",
  "“Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it that he agreed with Mr. Morris immediately; that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week.”",
  "“What is his name?” “Bingley.” “Is he married or single?”",
  "“Oh! single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!”",
  "“How so? how can it affect them?”",
  "“My dear Mr. Bennet,” replied his wife, “how can you be so tiresome! You must know that I am thinking of his marrying one of them.”",
  "“Is that his design in settling here?”",
  "“Design! nonsense, how can you talk so! But it is very likely that he may fall in love with one of them, and therefore you must visit him as soon as he comes.”",
];

/**
 * Two facing pages of set type, drawn once with the browser's serif: a chapter opening on the left,
 * running heads, folios and justified lines, so the page reads as print, not as dashes. Left page in
 * the canvas's left half, right page in its right half; top of the canvas is the head of the page.
 * Returns null where there is no 2D canvas (tests).
 */
function bookSpread(): THREE.CanvasTexture | null {
  const canvas = typeof document === "undefined" ? null : document.createElement("canvas");
  const context = canvas?.getContext("2d");
  if (!canvas || !context || typeof context.createLinearGradient !== "function" || typeof context.measureText !== "function")
    return null;
  const PAGE_W = 1024,
    PAGE_H = 1392;
  canvas.width = PAGE_W * 2;
  canvas.height = PAGE_H;
  const g = context;
  // Laid paper, a touch warmer toward the gutter.
  for (let page = 0; page < 2; page++) {
    const gradient = g.createLinearGradient(page * PAGE_W, 0, (page + 1) * PAGE_W, 0);
    const [inner, outer] = ["rgb(230, 220, 198)", "rgb(244, 237, 221)"];
    gradient.addColorStop(0, page ? inner : outer);
    gradient.addColorStop(0.12, page ? "rgb(239, 231, 212)" : outer);
    gradient.addColorStop(0.88, page ? outer : "rgb(239, 231, 212)");
    gradient.addColorStop(1, page ? outer : inner);
    g.fillStyle = gradient;
    g.fillRect(page * PAGE_W, 0, PAGE_W, PAGE_H);
  }
  const random = seeded(7);
  for (let k = 0; k < 9000; k++) {
    g.fillStyle = `rgba(120, 100, 70, ${0.03 + 0.05 * random()})`;
    g.fillRect(random() * PAGE_W * 2, random() * PAGE_H, 1 + random() * 2, 1);
  }
  const SIZE = 34,
    LEAD = 46,
    INK = "rgb(43, 38, 34)";
  const serif = (size: number, style = "") => `${style} ${size}px Georgia, "Times New Roman", Times, serif`;
  const words = BOOK_TEXT.map((paragraph) => paragraph.split(" "));
  let paragraph = 0,
    word = 0;
  /** Set justified lines into a column until it is full; returns false when the text runs out. */
  const setColumn = (left: number, top: number, width: number, bottom: number) => {
    g.font = serif(SIZE);
    g.fillStyle = INK;
    g.textBaseline = "alphabetic";
    let y = top;
    while (y < bottom && paragraph < words.length) {
      const indent = word === 0 ? SIZE * 1.4 : 0;
      const line: string[] = [];
      let used = 0;
      const space = g.measureText(" ").width;
      while (word < words[paragraph].length) {
        const w = g.measureText(words[paragraph][word]).width;
        if (line.length && used + space + w > width - indent) break;
        used += (line.length ? space : 0) + w;
        line.push(words[paragraph][word++]);
      }
      const last = word >= words[paragraph].length;
      const gap = last || line.length < 2 ? space : space + (width - indent - used) / (line.length - 1);
      let x = left + indent;
      for (const w of line) {
        g.fillText(w, x, y);
        x += g.measureText(w).width + gap;
      }
      if (last) {
        paragraph++;
        word = 0;
      }
      y += LEAD;
    }
  };
  const MARGIN_OUT = 120,
    MARGIN_IN = 150,
    TOP = 170,
    BOTTOM = PAGE_H - 150;
  // Left page: the chapter opening, sunk a third of the way down; right page: the running head.
  g.font = serif(24, "italic");
  g.fillStyle = "rgb(90, 81, 72)";
  g.textAlign = "center";
  g.fillText("PRIDE AND PREJUDICE", PAGE_W * 1.5, 100);
  g.fillText("1", PAGE_W / 2, PAGE_H - 80);
  g.fillText("2", PAGE_W * 1.5, PAGE_H - 80);
  g.font = serif(46);
  g.fillStyle = INK;
  g.fillText("CHAPTER I.", PAGE_W / 2, 300);
  g.fillRect(PAGE_W / 2 - 60, 330, 120, 3);
  g.textAlign = "left";
  setColumn(MARGIN_OUT, 420, PAGE_W - MARGIN_IN - MARGIN_OUT, BOTTOM);
  setColumn(PAGE_W + MARGIN_IN, TOP, PAGE_W - MARGIN_IN - MARGIN_OUT, BOTTOM);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.flipY = false;
  return texture;
}

const models: Record<Kind, Model> = {
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
    // Stored small and blown up in the shader like the court itself, so it never counts toward bounds.
    const line = mesh(root, expanded(new THREE.PlaneGeometry(GROUND_WIDTH, 0.5)), paint, 0, 0.002, 0.05);
    defocus(paint, line);
    line.rotation.x = -Math.PI / 2;
    line.renderOrder = -1;
    line.receiveShadow = true;
    line.userData.frameIgnore = true;

    // The racket, laid flat on the court behind the ball: a painted graphite frame with an open
    // throat, a white overgrip running out of frame, and a real string bed whose grid the low sun
    // throws across the court.
    racket(root);

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
    const shadow = pool(roller, 0.9, 0.6, 0, 0, 0.7);
    // Bounced at the baseline before a serve: eight bounces a loop, a parabolic arc (|sin|), a
    // squash on contact, the contact shadow tightening and darkening as the ball comes down.
    const HOP = 0.56;
    ticks.push((angle) => {
      // Phased so the rest frame catches the ball just off the court.
      const arc = Math.abs(Math.sin(angle * 4 - 0.53));
      const squash = smoothstep(0.12, 0, arc);
      ball.position.y = RADIUS * (1 - 0.14 * squash) + HOP * arc;
      ball.scale.set(1 + 0.1 * squash, 1 - 0.14 * squash, 1 + 0.1 * squash);
      ball.rotation.x = 0.5 + angle * 2;
      const spread = 1 + 0.8 * arc;
      shadow.scale.set(0.9 * spread, 0.6 * spread, 1);
      (shadow.material as THREE.MeshBasicMaterial).opacity = 0.7 / (spread * spread);
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

  /** Quiet chapter: tortoiseshell glasses folded on an open book, a page lifting in the draught. */
  reading(root, ticks) {
    walnut(root);
    const W = 1.25,
      H = 1.7,
      THICK = 0.18;
    const pageCurve = (t: number) =>
      THICK + 0.11 * Math.max(0, Math.sin(Math.min(1, Math.max(0, t) * 1.6) * (Math.PI / 2))) ** 0.7 - 0.04 * t;
    const textMap =
      bookSpread() ??
      paintTexture(512, 352, (spreadU, v) => {
        const u = (spreadU * 2) % 1;
        const paper = mixRgb(0xf3ecdc, 0xebe2cd, valueNoise(u * 30, v * 30, 30, 4));
        const margin = u < 0.14 || u > 0.88 || v < 0.1 || v > 0.9;
        if (margin) return paper;
        const line = Math.floor((v - 0.1) * 46);
        const inLine = ((v - 0.1) * 46) % 1;
        const word = valueNoise(u * 34, line * 3.1, 34, line + 3);
        const ink = smoothstep(0.32, 0.2, Math.abs(inLine - 0.45)) * smoothstep(0.3, 0.36, word) * (line % 17 === 16 ? 0 : 1);
        return paper.map((c, i) => mix(c, [70, 64, 58][i], ink * 0.7)) as [number, number, number];
      });
    const pageMaterial = lookMaterial("paper", 0xffffff, { map: textMap, roughness: 0.92, grain: 3 });
    pageMaterial.normalScale.set(0.25, 0.25);
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
      // The spread: the left page in the texture's left half (its outer edge at u 0), the right in its right half.
      for (let i = 0; i < uv.count; i++) {
        const across = Math.abs(position.getX(i)) / W;
        uv.setXY(i, sign < 0 ? 0.5 * (1 - across) : 0.5 + 0.5 * across, 0.5 + position.getZ(i) / H);
      }
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
    // The leaf shows the right page's half of the spread, head away from the lens.
    const leafUv = leaf.attributes.uv;
    for (let i = 0; i < leafUv.count; i++) leafUv.setXY(i, 0.5 + 0.5 * leafUv.getX(i), 1 - leafUv.getY(i));
    const sheetPivot = group(book, 0, THICK, 0);
    mesh(sheetPivot, leaf, lookMaterial("paper", 0xffffff, { map: textMap, roughness: 0.92, grain: 3, side: THREE.DoubleSide }));
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
const subjectCamera: Record<Kind, { pitch: number; yaw?: number; fill?: number; maxWidth?: number }> = {
  tennis: { pitch: 22, fill: 0.5 },
  server: { pitch: 20, fill: 0.8 },
  reading: { pitch: 20, fill: 0.5, maxWidth: 0.7 },
};

/** Where the night lamp hangs over each subject (it pools light on the subject and falls off into the dark). */
const lampAt: Record<Kind, [number, number, number]> = {
  tennis: [0.9, 1.4, 0.9],
  server: [0.9, 1.6, 0.9],
  reading: [1.7, 1.1, 0.6],
};

export function realistic(kind: Kind, ticks: Tick[]) {
  const root = new THREE.Group();
  models[kind](root, ticks);
  backdrop(root, kind === "tennis" ? "court" : kind === "server" ? "rack" : "room");
  // The practical: a warm point light, on only in the dark theme.
  const lamp = new THREE.PointLight(0xffb36e, 0, 0, 2);
  lamp.position.set(...lampAt[kind]);
  root.add(lamp);
  const dark = themeProbe(root);
  ticks.push(() => {
    // Off by day: hidden rather than at zero, so the day shader carries one light fewer per pixel.
    lamp.visible = dark();
    lamp.intensity = lamp.visible ? 9 : 0;
  });
  const { pitch, yaw = 0, fill, maxWidth } = subjectCamera[kind];
  root.userData.look = {
    ...realisticLook,
    camera: { ...realisticLook.camera, pitch, yaw },
    framing: { ...(realisticLook.framing || {}), ...(fill ? { fill } : {}), ...(maxWidth ? { maxWidth } : {}) },
  } satisfies ObjectLook;
  return root;
}
