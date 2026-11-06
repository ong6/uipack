// Cartoon worlds (direction 3): a floating toy island per subject, soil strata underneath, chunky
// toon-shaded props and one or two bean characters with faces. Day in light mode; night (moonlight,
// lit windows and lamps) in dark mode. Each scene has its own ambient extra; none repeats.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { themed, type ObjectLook } from "./look";
import { TAU, vec, type Tick } from "./procedural";
import {
  block,
  cylinder,
  valueNoise,
  group,
  mergeable,
  mesh,
  paintTexture,
  placed,
  sphere,
  themeProbe,
  tube,
} from "./expanded-kit";
import type { KindWithLook } from "./variants";

type Kind = Exclude<KindWithLook<3>, "contact">;

export const cartoonLook: ObjectLook = {
  rig: {
    both: {
      toneMapping: "neutral",
      exposure: 1,
      environment: { kind: "none", intensity: 0 },
      hemisphere: { sky: 0xd6efff, ground: 0x88b072, intensity: 1.5 },
      key: { color: 0xfff1d6, intensity: 2.4, position: [-3.5, 7, 4.5], shadow: true, shadowRadius: 3 },
      rim: { color: 0xffffff, intensity: 1.1, position: [4, 3, -4] },
    },
    dark: {
      // Moonlight is a clean blue-teal, not periwinkle: periwinkle light on the warm soil, wood and
      // white steam turned them all mauve.
      hemisphere: { sky: 0x5f82a4, ground: 0x1a2a30, intensity: 1.15 },
      key: { color: 0xbcd3ee, intensity: 1.25, position: [3.5, 6, 3] },
      rim: { color: 0xa8caff, intensity: 2.2 },
      // A warm porch-light fill from the camera side, so faces keep their features at night.
      fill: { color: 0xffd8a8, intensity: 0.85, position: [1.5, 2.5, 7] },
    },
  },
  camera: { projection: "perspective", fov: 30, pitch: 28 },
  // Fits the shared frame box (frameProxy), not each scene's props.
  framing: { fill: 0.9, maxWidth: 0.9, lift: 0.0, sample: "loop" },
  castShadows: true,
};

/* ---------------------------------------------------------------- Toon materials */

const palette = {
  grass: 0x84c077,
  grassDark: 0x5aa25b,
  soil: 0xa0704a,
  soilDark: 0x7a5236,
  rock: 0x8d8ea0,
  sky: 0x6ec1f0,
  coral: 0xff7a59,
  sun: 0xffc93c,
  plum: 0x6b4e9b,
  ink: 0x2d2a3a,
  cream: 0xfff4e0,
  white: 0xffffff,
  wood: 0xc98b55,
  blush: 0xff9db0,
  glow: 0xffd27a,
};

/**
 * The night version of a day colour. Hue is kept and value dropped, with only a little cool-teal
 * shift (the moonlight and its rim do the tinting): pulling warm browns toward blue turned the soil
 * and the plum props into a purple mud. Characters keep their full saturation, a touch lifted, so
 * they stay the brightest, cleanest colour in the scene.
 */
function night(color: number, character = false) {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(color).getHSL(hsl);
  if (character) return new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.05), Math.min(0.62, hsl.l * 0.92 + 0.06)).getHex();
  // Warm earth (soil, wood) loses more saturation than the rest, or it goes maroon under the moon.
  const earthy = hsl.h > 0.03 && hsl.h < 0.12 && hsl.l < 0.55;
  // Purples (the plum props) keep more of their value, or they sink into the navy as mud.
  const purple = hsl.h > 0.68 && hsl.h < 0.86;
  // Saturation is held and the shift is toward a clean deep blue, not a grey teal: the old
  // desaturate-and-grey swap turned every card into the same muddy palette.
  return (
    new THREE.Color()
      .setHSL(hsl.h, hsl.s * (earthy ? 0.5 : 0.95), hsl.l * (earthy ? 0.58 : purple ? 0.85 : 0.68))
      // Earth leans to slate, not blue: blue over warm brown made the strata mauve.
      .lerp(new THREE.Color(earthy ? 0x22303a : 0x1c3478), earthy ? 0.1 : 0.12)
      .getHex()
  );
}

/** Moonlight seen from behind the island, in view space: up, a little left and back. */
const MOON = new THREE.Vector3(-0.45, 0.8, -0.4).normalize();

/**
 * Toy finishes on top of the toon ramp, so the set reads as objects you could pick up:
 * - vinyl (the characters): a hard-edged gloss highlight from each directional light and a faint
 *   lighter rim, like a vinyl figure;
 * - satin (props): soft-touch plastic, a broad, dim highlight;
 * - flock (grass, rugs, felt): no highlight, a velvety lift at grazing angles and a fibre speckle;
 * - matte: the plain ramp (soil, rock, ink).
 */
type Finish = "vinyl" | "satin" | "flock" | "matte";
const FINISH: Record<Finish, { shine: number; edge: number; spec: number; fresnel: number }> = {
  vinyl: { shine: 70, edge: 0.45, spec: 0.5, fresnel: 0.14 },
  satin: { shine: 14, edge: 0.55, spec: 0.13, fresnel: 0.07 },
  flock: { shine: 1, edge: 2, spec: 0, fresnel: 0.32 },
  matte: { shine: 1, edge: 2, spec: 0, fresnel: 0 },
};
let flockMap: THREE.Texture | undefined;
/** A fine fibre speckle for flocked surfaces, in their own UVs (world-sized on the island). */
function flockTexture() {
  flockMap ??= paintTexture(
    128,
    128,
    (u, v) => {
      const n = 0.6 * valueNoise(u * 64, v * 64, 64, 4) + 0.4 * valueNoise(u * 128, v * 128, 128, 9);
      const c = 214 + 41 * n;
      return [c, c, c];
    },
    { repeat: [3, 3] },
  );
  return flockMap;
}

/**
 * The cartoon shader additions: the toy finish, and a toon moon-rim (a hard-edged cool band on the
 * silhouette edges that face the moon, the classic cel-shaded night kicker). `strength` is shared by
 * every material in a scene and set per theme by a tick (0 by day).
 */
function withMoonRim<M extends THREE.MeshToonMaterial>(material: M, strength: { value: number }, finish: Finish = "satin") {
  const f = FINISH[finish];
  if (finish === "flock" && !material.map) material.map = flockTexture();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.moonRim = strength;
    shader.uniforms.moonDir = { value: MOON };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float moonRim;\nuniform vec3 moonDir;")
      .replace(
        "#include <opaque_fragment>",
        `{
          vec3 n = normalize(normal);
          vec3 eye = normalize(vViewPosition);
          float facingEye = clamp(dot(n, eye), 0.0, 1.0);
          float edge = 1.0 - facingEye;
          float facing = smoothstep(-0.05, 0.25, dot(n, moonDir));
          float band = smoothstep(0.52, 0.58, edge) * facing;
          outgoingLight += vec3(0.62, 0.74, 1.0) * band * moonRim * (0.35 + 0.65 * max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b));
          #if NUM_DIR_LIGHTS > 0
          float gloss = 0.0;
          for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
            vec3 h = normalize(directionalLights[i].direction + eye);
            float s = pow(max(dot(n, h), 0.0), ${f.shine.toFixed(1)});
            gloss += smoothstep(${(f.edge - 0.05).toFixed(3)}, ${(f.edge + 0.05).toFixed(3)}, s) * dot(directionalLights[i].color, vec3(0.3333));
          }
          outgoingLight += vec3(gloss * ${f.spec.toFixed(3)});
          #endif
          outgoingLight += diffuseColor.rgb * pow(edge, 2.5) * ${f.fresnel.toFixed(3)};
        }
        #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => `cartoon-toy-${finish}`;
  return material;
}

interface Toons {
  (
    color: number,
    options?: { glow?: number; dayGlow?: number; transparent?: number; character?: boolean; finish?: Finish },
  ): THREE.MeshToonMaterial;
  /** The scene's shared moon-rim strength, for toon materials built outside the factory. */
  rim: { value: number };
}

/** A material factory sharing one three-step gradient and caching by colour and finish. */
function toonFactory(rim: { value: number }): Toons {
  const gradient = paintTexture(
    4,
    1,
    (u) => {
      const v = u < 0.25 ? 110 : u < 0.5 ? 170 : u < 0.75 ? 225 : 255;
      return [v, v, v];
    },
    { srgb: false },
  );
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  const cache = new Map<string, THREE.MeshToonMaterial>();
  const make = (color: number, options: Parameters<Toons>[1] = {}) => {
    const finish = options.finish ?? (options.character ? "vinyl" : options.glow !== undefined ? "matte" : "satin");
    const key = `${color}:${options.glow ?? ""}:${options.dayGlow ?? ""}:${options.transparent ?? ""}:${options.character ?? ""}:${finish}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const material = withMoonRim(new THREE.MeshToonMaterial({ color, gradientMap: gradient }), rim, finish);
    if (options.transparent !== undefined) {
      material.transparent = true;
      material.opacity = options.transparent;
      material.depthWrite = false;
    }
    if (options.glow !== undefined) {
      material.emissive.set(options.glow);
      material.emissiveIntensity = options.dayGlow ?? 0;
      themed(material, { dark: { color: night(color), emissiveIntensity: 1.6 } });
    } else themed(material, { dark: { color: night(color, options.character) } });
    cache.set(key, material);
    return material;
  };
  return Object.assign(make, { rim });
}

/* ---------------------------------------------------------------- The island */

/** A blob outline: a superellipse (`square` 2 is an ellipse, 4 a soft square) with a seeded wobble. */
function blob(rx: number, rz: number, seed: number, scale = 1, square = 2) {
  const shape = new THREE.Shape();
  const N = 48;
  const e = 2 / square;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    const r = scale * (1 + 0.07 * Math.sin(3 * a + seed) + 0.045 * Math.sin(5 * a + seed * 2.3));
    const c = Math.cos(a),
      s = Math.sin(a);
    const x = rx * r * Math.sign(c) * Math.abs(c) ** e,
      y = rz * r * Math.sign(s) * Math.abs(s) ** e;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}
/** A slab of `shape`, `depth` tall, its top at y `top`. */
function slab(shape: THREE.Shape, depth: number, top: number, bevel: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 4,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, top, 0);
  return geometry;
}

/**
 * Each subject's own island, inside one shared frame envelope (so every card puts an island of the
 * same weight in the same place): its outline, its cap and strata colours, and what hangs beneath.
 */
type Underside = "crystals" | "terraces" | "stalactites" | "pipes" | "falls" | "roots";
interface IslandForm {
  seed: number;
  under: Underside;
  rx?: number;
  rz?: number;
  /** 2 for a round outline, up to 4 for a squared-off plateau. */
  square?: number;
  cap?: number;
  /** The cap's finish: flocked grass by default, matte stone, satin paving. */
  capFinish?: Finish;
  soil?: number;
  soilDark?: number;
  rock?: number;
}
const ISLAND_RX = 1.6,
  ISLAND_RZ = 1.15;
/** A floating island: a flocked cap, soil strata and an underside of its own. Top of the cap at y 0. */
function island(root: THREE.Object3D, toon: Toons, form: IslandForm, ticks: Tick[]) {
  const { seed, under, rx = ISLAND_RX, rz = ISLAND_RZ, square = 2 } = form;
  const cap = form.cap ?? palette.grass,
    soil = form.soil ?? palette.soil,
    soilDark = form.soilDark ?? palette.soilDark,
    rock = form.rock ?? palette.rock;
  mesh(root, slab(blob(rx, rz, seed, 1, square), 0.08, -0.06, 0.06), toon(cap, { finish: form.capFinish ?? "flock" }));
  if (under === "terraces") {
    // Stepped strata, like a clay quarry: each step a little smaller and darker.
    [soil, shadeOf(soil), soilDark].forEach((color, i) =>
      mesh(
        root,
        slab(blob(rx, rz, seed + i, 0.97 - i * 0.12, square), 0.24, -0.16 - i * 0.26, 0.05),
        toon(color, { finish: "matte" }),
      ),
    );
  } else {
    mesh(root, slab(blob(rx, rz, seed, 0.97, square), 0.3, -0.16, 0.05), toon(soil, { finish: "matte" }));
    mesh(root, slab(blob(rx, rz, seed + 1, 0.74, square), 0.26, -0.5, 0.06), toon(soilDark, { finish: "matte" }));
  }
  const random = mulberry(seed * 1000);
  const cone = (radius: number, height: number, x: number, z: number, top: number, color = rock) => {
    const point = mesh(root, new THREE.ConeGeometry(radius, height, 7), toon(color, { finish: "matte" }), x, top - height / 2, z);
    point.rotation.x = Math.PI;
    point.rotation.y = random() * TAU;
    return point;
  };
  const tipRadius = Math.min(rx, rz) * 0.55;
  if (under === "stalactites") {
    cone(tipRadius * 0.8, 0.5, -0.2, 0, -0.66);
    cone(tipRadius * 0.45, 0.42, 0.55, 0.15, -0.6);
    cone(tipRadius * 0.38, 0.34, -0.75, -0.1, -0.58);
  } else
    cone(
      under === "roots" ? tipRadius * 0.75 : tipRadius,
      under === "terraces" ? 0.4 : 0.55,
      0,
      0,
      under === "terraces" ? -0.84 : -0.7,
    );
  if (under === "crystals") {
    // Glowing crystals hang from the rock: the workshop's night light, from below.
    const crystal = toon(0x8ff3ff, { glow: 0x5ce8ff, dayGlow: 0.35, finish: "vinyl" });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4;
      const length = 0.22 + random() * 0.2;
      const gem = mesh(
        root,
        new THREE.ConeGeometry(0.07, length, 6),
        crystal,
        Math.cos(a) * 0.5,
        -0.66 - length / 2,
        Math.sin(a) * 0.35,
      );
      gem.rotation.set(Math.PI + Math.sin(a) * 0.35, 0, Math.cos(a) * 0.35);
    }
  }
  if (under === "roots") {
    // Roots of the old oak run out through the soil and dangle beneath.
    const roots: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + random() * 0.4;
      const r0 = 0.75 + random() * 0.2;
      const x0 = Math.cos(a) * rx * r0 * 0.8,
        z0 = Math.sin(a) * rz * r0 * 0.8;
      roots.push(
        mergeable(
          tube(
            [
              vec(x0, -0.5, z0),
              vec(x0 * 0.9, -0.72, z0 * 0.9),
              vec(x0 * 0.7 + 0.05, -0.92 - random() * 0.12, z0 * 0.7),
              vec(x0 * 0.55, -1.02 - random() * 0.12, z0 * 0.55),
            ],
            0.03,
            false,
            12,
            6,
          ),
        ),
      );
    }
    mesh(root, mergeGeometries(roots), toon(shadeOf(palette.wood), { finish: "matte" }));
  }
  if (under === "pipes") {
    // Outflow pipes poke straight out of the strata under the factory, each with a flanged mouth.
    const steel = toon(0x9aa3b8, { finish: "vinyl" });
    const flange = toon(palette.ink, { finish: "matte" });
    for (const [a, y, length] of [
      [0.5, -0.3, 0.2],
      [1.35, -0.42, 0.16],
      [2.4, -0.3, 0.18],
    ]) {
      const pipe = group(root, Math.cos(a) * rx * 0.9, y, Math.sin(a) * rz * 0.9);
      pipe.rotation.y = -a;
      cylinder(pipe, 0.055, length, steel, [length / 2, 0, 0], 12).rotation.z = Math.PI / 2;
      cylinder(pipe, 0.075, 0.04, flange, [length, 0, 0], 12).rotation.z = Math.PI / 2;
    }
  }
  if (under === "falls") {
    // A spring at the rim spills off the island's front edge in a ribbon of water.
    const water = paintTexture(16, 64, (_u, v) => {
      const streak = Math.floor(v * 8) % 2 ? 255 : 205;
      return [streak * 0.62, streak * 0.88, streak];
    });
    water.wrapS = water.wrapT = THREE.RepeatWrapping;
    water.magFilter = THREE.NearestFilter;
    const flow = withMoonRim(
      new THREE.MeshToonMaterial({ map: water, transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
      toon.rim,
      "vinyl",
    );
    themed(flow, { dark: { color: 0x9fc4ff } });
    const a = 0.95;
    const ex = Math.cos(a) * rx * 0.99,
      ez = Math.sin(a) * rz * 0.99;
    const out = vec(Math.cos(a), 0, Math.sin(a));
    const fall = ribbon(
      [
        vec(ex - out.x * 0.25, 0.012, ez - out.z * 0.25),
        vec(ex + out.x * 0.04, 0.0, ez + out.z * 0.04),
        vec(ex + out.x * 0.16, -0.3, ez + out.z * 0.16),
        vec(ex + out.x * 0.2, -0.95, ez + out.z * 0.2),
      ],
      0.2,
    );
    mesh(root, fall, flow);
    const pool = mesh(
      root,
      new THREE.CircleGeometry(0.2, 20),
      toon(0x7cc9f2, { finish: "vinyl" }),
      ex - out.x * 0.28,
      0.025,
      ez - out.z * 0.28,
    );
    pool.rotation.x = -Math.PI / 2;
    pool.scale.set(1.2, 0.8, 1);
    ticks.push((angle) => (water.offset.y = (angle / TAU) * 4));
  }
  // Pebbles and flowers on the rim.
  const flowers: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const a = random() * TAU,
      r = 0.86 + random() * 0.08;
    flowers.push(mergeable(placed(new THREE.SphereGeometry(0.045, 8, 6), rx * r * Math.cos(a), 0.04, rz * r * Math.sin(a))));
  }
  mesh(root, mergeGeometries(flowers), toon([palette.cream, palette.sun, palette.blush][seed % 3], { finish: "vinyl" }));
}
/** A vertical-ish strip `width` wide along `points`, facing the lens (for falling water). */
function ribbon(points: THREE.Vector3[], width: number) {
  const curve = new THREE.CatmullRomCurve3(points);
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const SEG = 24;
  const side = vec(0, 0, 0);
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    side.crossVectors(tangent, vec(0, 1, 0));
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize().multiplyScalar(width / 2);
    positions.push(p.x - side.x, p.y, p.z - side.z, p.x + side.x, p.y, p.z + side.z);
    uvs.push(0, t, 1, t);
    if (i < SEG) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------- Props and characters */

interface Bean {
  root: THREE.Group;
  body: THREE.Group;
  left: THREE.Group;
  right: THREE.Group;
}
/** A bean character with a face, blush and stubby arms; about 0.62 tall. */
function bean(parent: THREE.Object3D, toon: Toons, color: number, x: number, z: number, facing = 0): Bean {
  const root = group(parent, x, 0, z);
  root.rotation.y = facing;
  const body = group(root);
  mesh(body, new THREE.CapsuleGeometry(0.19, 0.22, 6, 18), toon(color, { character: true }), 0, 0.3, 0);
  const ink = toon(palette.ink);
  for (const side of [-1, 1]) {
    const eye = sphere(body, 0.034, ink, [side * 0.075, 0.42, 0.172], 12);
    eye.scale.set(1, 1.3, 0.6);
    const cheek = sphere(body, 0.035, toon(palette.blush, { character: true }), [side * 0.125, 0.36, 0.16], 10);
    cheek.scale.set(1, 0.7, 0.4);
    const foot = sphere(root, 0.07, toon(shadeOf(color), { character: true }), [side * 0.08, 0.04, 0.03], 10);
    foot.scale.set(1, 0.6, 1.3);
  }
  const smile = mesh(body, new THREE.TorusGeometry(0.035, 0.011, 6, 12, Math.PI), ink, 0, 0.375, 0.178);
  smile.rotation.z = Math.PI;
  const arm = (side: number) => {
    const pivot = group(body, side * 0.19, 0.33, 0);
    const limb = mesh(
      pivot,
      new THREE.CapsuleGeometry(0.045, 0.12, 4, 8),
      toon(color, { character: true }),
      side * 0.04,
      -0.08,
      0,
    );
    limb.rotation.z = side * 0.4;
    return pivot;
  };
  return { root, body, left: arm(-1), right: arm(1) };
}
const shadeOf = (color: number) => new THREE.Color(color).multiplyScalar(0.72).getHex();

/** A round tree: trunk and two chunky crowns. */
function tree(parent: THREE.Object3D, toon: Toons, x: number, z: number, scale = 1, crown = palette.grassDark) {
  const container = group(parent, x, 0, z);
  container.scale.setScalar(scale);
  cylinder(container, 0.06, 0.4, toon(palette.wood), [0, 0.2, 0], 8, 0.08);
  sphere(container, 0.26, toon(crown), [0, 0.55, 0], 14);
  sphere(container, 0.18, toon(crown), [0.16, 0.45, 0.08], 12);
  return container;
}
/** A cone pine. */
function pine(parent: THREE.Object3D, toon: Toons, x: number, z: number, scale = 1) {
  const container = group(parent, x, 0, z);
  container.scale.setScalar(scale);
  cylinder(container, 0.05, 0.16, toon(palette.wood), [0, 0.08, 0], 8);
  mesh(container, new THREE.ConeGeometry(0.22, 0.36, 8), toon(0x3f9a63), 0, 0.3, 0);
  mesh(container, new THREE.ConeGeometry(0.17, 0.3, 8), toon(0x3f9a63), 0, 0.5, 0);
  return container;
}

/* ---------------------------------------------------------------- Scenes */

type Scene = (world: THREE.Group, ticks: Tick[], toon: Toons) => void;

const scenes: Record<Kind, Scene> = {
  /** Night workshop: a little robot taps at a workbench under a desk lamp; an idea pops above it. */
  ai(world, ticks, toon) {
    // A slate outcrop, not a meadow: the workshop sits on stone with crystals growing beneath.
    island(
      world,
      toon,
      { seed: 2, under: "crystals", cap: 0x9ea6bd, capFinish: "matte", soil: 0x8a7f86, soilDark: 0x6a6070, rock: 0x7f7f9e },
      ticks,
    );
    const bench = group(world, 0.05, 0, -0.1);
    block(bench, [1.7, 0.1, 0.7], toon(palette.wood), [0, 0.56, 0], 0.04);
    for (const x of [-0.75, 0.75])
      for (const z of [-0.26, 0.26]) block(bench, [0.08, 0.52, 0.08], toon(shadeOf(palette.wood)), [x, 0.26, z], 0.03);
    // A chunky keyboard and a screen on the bench.
    block(bench, [0.56, 0.05, 0.2], toon(palette.cream), [-0.05, 0.635, 0.16], 0.025);
    const screen = group(bench, -0.05, 0.62, -0.18);
    block(screen, [0.62, 0.42, 0.06], toon(palette.ink), [0, 0.28, 0], 0.05);
    block(screen, [0.52, 0.32, 0.02], toon(0x2bd0b0, { glow: 0x2bd0b0, dayGlow: 0.55 }), [0, 0.29, 0.035], 0.03);
    cylinder(screen, 0.03, 0.08, toon(palette.ink), [0, 0.04, 0], 8);
    // The desk lamp: weighted base, two arms and a glowing shade.
    const lamp = group(bench, 0.62, 0.61, -0.05);
    cylinder(lamp, 0.11, 0.05, toon(palette.coral), [0, 0.025, 0], 16);
    const armGeometry = mergeGeometries([
      mergeable(placed(new THREE.CylinderGeometry(0.022, 0.022, 0.42, 8), -0.07, 0.22, 0, 0, 0, 0.35)),
      mergeable(placed(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 8), -0.06, 0.52, 0, 0, 0, -0.9)),
    ]);
    mesh(lamp, armGeometry, toon(palette.ink));
    const shade = mesh(lamp, new THREE.ConeGeometry(0.13, 0.17, 18, 1, true), toon(palette.coral), 0.07, 0.6, 0);
    shade.rotation.z = 0.85;
    (shade.material as THREE.Material).side = THREE.DoubleSide;
    sphere(lamp, 0.055, toon(palette.glow, { glow: palette.glow, dayGlow: 1 }), [0.035, 0.57, 0], 10);
    // The robot, on a stool.
    cylinder(world, 0.16, 0.36, toon(palette.plum), [-1.05, 0.18, 0.2], 14);
    const bot = group(world, -1.05, 0.36, 0.2);
    bot.scale.setScalar(1.25);
    bot.rotation.y = -Math.PI / 2 - 0.75; // working at the bench, face turned toward us
    block(bot, [0.42, 0.34, 0.3], toon(palette.sky), [0, 0.2, 0], 0.1);
    const head = group(bot, 0, 0.5, 0);
    block(head, [0.5, 0.36, 0.36], toon(palette.sky), [0, 0, 0], 0.13);
    block(head, [0.4, 0.24, 0.04], toon(palette.ink), [0, 0, -0.18], 0.06);
    const eyes = toon(0x7ff2ff, { glow: 0x7ff2ff, dayGlow: 1.2 });
    for (const side of [-1, 1]) block(head, [0.07, 0.09, 0.02], eyes, [side * 0.09, 0.01, -0.2], 0.03);
    // Back of the head faces us: a panel, an antenna and a blinking bulb.
    block(head, [0.24, 0.14, 0.02], toon(palette.cream), [0, 0, 0.185], 0.04);
    cylinder(head, 0.015, 0.16, toon(palette.ink), [0, 0.25, 0], 6);
    const bulbMaterial = toon(palette.coral, { glow: palette.coral, dayGlow: 0.4 });
    sphere(head, 0.05, bulbMaterial, [0, 0.35, 0], 10);
    const arms: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const pivot = group(bot, side * 0.23, 0.28, 0);
      const limb = mesh(pivot, new THREE.CapsuleGeometry(0.045, 0.16, 4, 8), toon(palette.sky), 0, -0.04, -0.1);
      limb.rotation.x = Math.PI / 2.4;
      arms.push(pivot);
    }
    // The idea: a bulb that pops out above the head, holds, and pops back.
    const idea = group(world, -0.82, 1.6, 0.2);
    sphere(idea, 0.12, toon(palette.sun, { glow: palette.sun, dayGlow: 0.6 }), [0, 0, 0], 14);
    cylinder(idea, 0.055, 0.08, toon(palette.cream), [0, -0.13, 0], 10);
    tree(world, toon, -1.05, -0.35, 0.9);
    pine(world, toon, 1.1, 0.45, 0.7);
    ticks.push((angle) => {
      arms[0].rotation.x = 0.25 * Math.max(0, Math.sin(angle * 12));
      arms[1].rotation.x = 0.25 * Math.max(0, Math.sin(angle * 12 + Math.PI));
      head.rotation.z = 0.08 * Math.sin(angle * 2);
      head.position.y = 0.5 + 0.02 * Math.abs(Math.sin(angle * 6));
      const pop = Math.max(0, Math.sin(angle * 2 - 0.6));
      const scale = pop < 0.02 ? 0 : Math.min(1, pop * 3) * (1 + 0.15 * Math.sin(pop * 18));
      idea.scale.set(scale, scale * (1 + 0.1 * Math.cos(angle * 8)), scale);
      idea.position.y = 1.52 + 0.1 * pop;
      bulbMaterial.emissiveIntensity = Math.sin(angle * 8) > 0 ? 1.6 : 0.1;
    });
  },

  /** Courtside club: two bean players rally on a clay court; the ball squashes on every hit. */
  tennis(world, ticks, toon) {
    island(world, toon, { seed: 5, under: "terraces", square: 3.4, soil: 0xd98a5a, soilDark: 0xa65a3a }, ticks);
    const court = group(world, 0, 0.02, 0);
    court.rotation.y = -0.18;
    block(court, [2.3, 0.05, 1.3], toon(0xe0784a), [0, 0, 0], 0.04);
    const line = toon(palette.white);
    const lines: THREE.BufferGeometry[] = [];
    // Chunky lines (about 8 px on a 380 px card): a toy court, not a drafting diagram.
    for (const z of [-0.56, 0.56]) lines.push(mergeable(placed(new THREE.BoxGeometry(2.14, 0.016, 0.085), 0, 0.03, z)));
    for (const x of [-1.03, 1.03, -0.55, 0.55])
      lines.push(mergeable(placed(new THREE.BoxGeometry(0.085, 0.016, 1.2), x, 0.03, 0)));
    lines.push(mergeable(placed(new THREE.BoxGeometry(1.1, 0.016, 0.075), 0, 0.03, 0)));
    mesh(court, mergeGeometries(lines), line);
    // The net: posts, a mesh panel and its white tape.
    for (const z of [-0.7, 0.7]) cylinder(court, 0.03, 0.34, toon(palette.ink), [0, 0.17, z], 8);
    const netTexture = paintTexture(64, 16, (_u, _v, x, y) =>
      x % 4 === 0 || y % 4 === 0 ? [45, 42, 58, 255] : [45, 42, 58, 40],
    );
    netTexture.magFilter = THREE.NearestFilter;
    const netMaterial = withMoonRim(
      new THREE.MeshToonMaterial({
        map: netTexture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      toon.rim,
    );
    const net = mesh(court, new THREE.PlaneGeometry(1.4, 0.24), netMaterial, 0, 0.16, 0);
    net.rotation.y = Math.PI / 2;
    block(court, [0.05, 0.045, 1.42], line, [0, 0.29, 0], 0.02);
    // The players, rackets in hand.
    const players = [
      bean(court, toon, palette.coral, -0.8, 0.12, Math.PI / 2 - 0.3),
      bean(court, toon, palette.plum, 0.8, -0.12, -Math.PI / 2 - 0.3),
    ];
    // Rackets: a wrapped grip, an open throat and a strung oval head.
    // Four mains and five crosses, each an eighth of the head wide: a few fat toy strings read at
    // card size where a fine grid turned to a grey haze.
    const stringTexture = paintTexture(16, 20, (_u, _v, x, y) =>
      x % 4 === 1 || x % 4 === 2 || y % 4 === 1 || y % 4 === 2 ? [255, 250, 236, 255] : [0, 0, 0, 0],
    );
    stringTexture.magFilter = THREE.NearestFilter;
    const stringMaterial = withMoonRim(
      new THREE.MeshToonMaterial({
        map: stringTexture,
        gradientMap: toon(palette.white).gradientMap as THREE.Texture,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      }),
      toon.rim,
    );
    themed(stringMaterial, { dark: { color: night(0xffffff) } });
    const frameGeometry = new THREE.TorusGeometry(0.075, 0.021, 8, 28);
    frameGeometry.scale(1, 1.28, 1);
    const throatGeometry = mergeGeometries([
      mergeable(placed(new THREE.CylinderGeometry(0.011, 0.011, 0.1, 6), -0.024, 0.11, 0, 0, 0, 0.42)),
      mergeable(placed(new THREE.CylinderGeometry(0.011, 0.011, 0.1, 6), 0.024, 0.11, 0, 0, 0, -0.42)),
    ]);
    const stringGeometry = new THREE.PlaneGeometry(0.15, 0.19);
    const rackets = players.map((player, p) => {
      const racket = group(player.right, 0.08, -0.16, 0.04);
      // Half again the old size, so the strung head reads at the 1x card.
      racket.scale.setScalar(1.8);
      cylinder(racket, 0.019, 0.13, toon(p ? palette.sun : palette.cream), [0, 0.0, 0], 8);
      cylinder(racket, 0.024, 0.025, toon(palette.ink), [0, -0.07, 0], 8);
      mesh(racket, throatGeometry, toon(palette.sky));
      mesh(racket, frameGeometry, toon(palette.sky), 0, 0.245, 0);
      mesh(racket, stringGeometry, stringMaterial, 0, 0.245, 0);
      racket.rotation.set(0, 0, -0.5);
      return racket;
    });
    for (const player of players) player.root.scale.setScalar(1.25);
    const ball = sphere(court, 0.095, toon(0xe8f04a), [0, 0, 0], 14);
    // The umpire's chair and a towel bench, courtside.
    const chair = group(world, 0.25, 0, -0.95);
    for (const x of [-0.12, 0.12]) block(chair, [0.05, 0.75, 0.05], toon(palette.white), [x, 0.375, 0], 0.02);
    block(chair, [0.34, 0.06, 0.3], toon(palette.sky), [0, 0.75, 0], 0.03);
    block(chair, [0.34, 0.26, 0.05], toon(palette.sky), [0, 0.9, -0.13], 0.03);
    block(world, [0.6, 0.1, 0.18], toon(palette.wood), [-0.9, 0.18, 0.85], 0.04);
    block(world, [0.2, 0.06, 0.16], toon(palette.sun), [-1.0, 0.26, 0.85], 0.03);
    tree(world, toon, 1.3, -0.5, 0.85);
    tree(world, toon, -1.35, -0.4, 0.7);
    // A floodlight on a pole at the court's corner: the club's night light.
    const flood = group(world, -1.15, 0, 0.55);
    cylinder(flood, 0.03, 1.25, toon(palette.ink), [0, 0.625, 0], 8);
    block(flood, [0.26, 0.14, 0.1], toon(palette.ink), [0.06, 1.28, 0], 0.03);
    block(flood, [0.22, 0.1, 0.02], toon(palette.cream, { glow: palette.glow, dayGlow: 0.2 }), [0.06, 1.28, 0.055], 0.02);
    const from = vec(-0.62, 0.42, 0.18),
      to = vec(0.62, 0.42, -0.18);
    ticks.push((angle) => {
      const s = 0.5 - 0.5 * Math.cos(angle * 3);
      ball.position.lerpVectors(from, to, s);
      ball.position.y = 0.42 + 0.55 * Math.sin(Math.PI * s);
      const squash = Math.max(0, 1 - Math.min(s, 1 - s) * 14);
      ball.scale.set(1 + 0.35 * squash, 1 - 0.3 * squash, 1 + 0.35 * squash);
      // Each player winds up as the ball comes and follows through after it leaves.
      rackets[0].rotation.z = -0.5 - 1.1 * Math.max(0, 1 - s * 2) ** 2;
      rackets[1].rotation.z = -0.5 - 1.1 * Math.max(0, s * 2 - 1) ** 2;
      players[0].root.position.z = 0.12 + 0.1 * Math.sin(angle * 3);
      players[1].root.position.z = -0.12 + 0.1 * Math.sin(angle * 3 + 1);
      players[0].body.position.y = 0.04 * Math.abs(Math.sin(angle * 6));
      players[1].body.position.y = 0.04 * Math.abs(Math.sin(angle * 6 + 1));
    });
  },

  /** Reading nook: a reader in an armchair under a big tree, a lamp, a sleeping cat and a butterfly. */
  reading(world, ticks, toon) {
    island(world, toon, { seed: 17, under: "roots", cap: 0x78bd68 }, ticks);
    // The big tree behind.
    const oak = group(world, 0.55, 0, -0.45);
    oak.scale.setScalar(0.9);
    cylinder(oak, 0.13, 1.1, toon(palette.wood), [0, 0.55, 0], 10, 0.18);
    for (const [x, y, z, r] of [
      [0, 1.35, 0, 0.5],
      [-0.4, 1.15, 0.1, 0.36],
      [0.38, 1.2, 0.05, 0.38],
      [0.05, 1.05, 0.3, 0.3],
    ])
      sphere(oak, r, toon(palette.grassDark), [x, y, z], 16);
    // A rug, the armchair and the reader.
    const rug = cylinder(world, 0.55, 0.02, toon(palette.coral), [-0.15, 0.01, 0.2], 28);
    rug.scale.z = 0.7;
    const chair = group(world, -0.2, 0, 0.1);
    chair.rotation.y = 0.35;
    block(chair, [0.7, 0.24, 0.55], toon(palette.sky), [0, 0.18, 0], 0.1);
    block(chair, [0.7, 0.58, 0.18], toon(palette.sky), [0, 0.45, -0.22], 0.09);
    for (const side of [-1, 1]) block(chair, [0.16, 0.38, 0.6], toon(palette.sky), [side * 0.33, 0.3, 0], 0.08);
    const reader = bean(chair, toon, palette.sun, 0, 0.0, 0);
    reader.root.position.y = 0.26;
    reader.root.scale.setScalar(1.05);
    // The open book in the reader's hands: two covers and a flapping page.
    const book = group(reader.body, 0, 0.28, 0.24);
    book.rotation.x = -0.5;
    for (const side of [-1, 1]) {
      const cover = group(book);
      cover.rotation.y = side * 0.35;
      block(cover, [0.17, 0.22, 0.02], toon(palette.plum), [side * 0.085, 0, 0], 0.01);
      block(cover, [0.15, 0.2, 0.02], toon(palette.cream), [side * 0.08, 0, 0.015], 0.008);
    }
    const page = group(book, 0, 0, 0.03);
    block(page, [0.15, 0.2, 0.006], toon(palette.white), [0.075, 0, 0], 0.003);
    reader.left.rotation.x = reader.right.rotation.x = -1.1;
    // The floor lamp.
    const lamp = group(world, -0.85, 0, -0.25);
    cylinder(lamp, 0.12, 0.04, toon(palette.ink), [0, 0.02, 0], 14);
    cylinder(lamp, 0.02, 0.95, toon(palette.ink), [0, 0.5, 0], 8);
    const lampShade = toon(palette.cream, { glow: palette.glow, dayGlow: 0.35 });
    lampShade.side = THREE.DoubleSide;
    mesh(lamp, new THREE.CylinderGeometry(0.12, 0.2, 0.22, 18, 1, true), lampShade, 0, 1.0, 0);
    // A pile of books beside the chair and the cat asleep on it.
    const pile = group(world, 0.35, 0, 0.45);
    [palette.coral, palette.sky, palette.grass].forEach((c, i) => {
      const b = block(pile, [0.36, 0.08, 0.26], toon(c), [0, 0.04 + i * 0.085, 0], 0.02);
      b.rotation.y = i * 0.25 - 0.2;
    });
    const cat = group(pile, 0, 0.26, 0);
    const catBody = sphere(cat, 0.14, toon(0x8a8f9e), [0, 0.06, 0], 14);
    catBody.scale.set(1.3, 0.75, 1);
    const catHead = group(cat, 0.15, 0.1, 0.04);
    sphere(catHead, 0.08, toon(0x8a8f9e), [0, 0, 0], 12);
    for (const side of [-1, 1]) mesh(catHead, new THREE.ConeGeometry(0.03, 0.06, 6), toon(0x8a8f9e), 0.0, 0.07, side * 0.04);
    mesh(cat, tube([vec(-0.16, 0.03, 0), vec(-0.2, 0.02, 0.1), vec(-0.08, 0.0, 0.16)], 0.025, false, 12, 6), toon(0x8a8f9e));
    // The butterfly.
    const fly = group(world, 0, 0.9, 0.3);
    const wings: THREE.Mesh[] = [];
    for (const side of [-1, 1]) {
      const wing = mesh(fly, new THREE.CircleGeometry(0.11, 12), toon(palette.coral), 0, 0, 0);
      wing.geometry.translate(side * 0.1, 0, 0);
      (wing.material as THREE.Material).side = THREE.DoubleSide;
      wings.push(wing);
    }
    ticks.push((angle) => {
      page.rotation.y = -Math.PI * 0.5 * (0.5 - 0.5 * Math.cos(angle * 3)) * 0.8;
      catBody.scale.y = 0.75 + 0.04 * Math.sin(angle * 4);
      fly.position.set(0.9 * Math.sin(angle), 0.95 + 0.15 * Math.sin(angle * 3), 0.35 + 0.35 * Math.cos(angle));
      fly.rotation.y = -angle + Math.PI / 2;
      const flap = 0.8 * Math.sin(angle * 18);
      wings[0].rotation.y = flap;
      wings[1].rotation.y = -flap;
      reader.body.rotation.z = 0.04 * Math.sin(angle * 2);
    });
  },
};

/**
 * The framed volume, the same for every subject: rings round the island's rim and soil, its rocky
 * tip, and a narrower crown of headroom for the tall props (the idea bulb, the ticker arrow, the
 * steam clouds, the oak). Every prop stays inside this envelope, so it alone sets the fit and every
 * card puts the same-sized island in the same place. A line set with colour writes off: never seen,
 * no shadow.
 */
const FRAME_RINGS: [y: number, rx: number, rz: number][] = [
  [0.06, 1.82, 1.32],
  [-0.5, 1.58, 1.12],
  [1.0, 1.7, 1.15],
  [1.85, 1.5, 0.75],
];
const FRAME_TIP = -1.26;
function frameProxy() {
  const points: number[] = [0, FRAME_TIP, 0, 0, FRAME_TIP, 0];
  for (const [y, rx, rz] of FRAME_RINGS)
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * TAU,
        b = ((i + 1) / 32) * TAU;
      points.push(rx * Math.cos(a), y, rz * Math.sin(a), rx * Math.cos(b), y, rz * Math.sin(b));
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const proxy = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ colorWrite: false, depthWrite: false }));
  proxy.rotation.y = -0.35;
  return proxy;
}

/** Where each scene's night lamp hangs, in the island's own space. */
const lampAt: Record<Kind, [number, number, number]> = {
  ai: [0.7, 1.15, 0.0],
  tennis: [-1.05, 1.2, 0.7],
  reading: [-0.8, 0.95, -0.12],
};

export function cartoon(kind: Kind, ticks: Tick[]) {
  const root = new THREE.Group();
  root.userData.look = cartoonLook;
  const world = group(root);
  world.rotation.y = -0.35;
  const rim = { value: 0 };
  scenes[kind](world, ticks, toonFactory(rim));
  // Only the envelope sets the fit, so every card frames the same island at the same size.
  world.traverse((item) => {
    if (item !== world) item.userData.frameIgnore = true;
  });
  root.add(frameProxy());
  // The night practical: a warm point light at the scene's lamp, giving a banded toon pool of light.
  const practical = new THREE.PointLight(0xffb866, 0, 3.4, 1.4);
  practical.position.set(...lampAt[kind]);
  world.add(practical);
  const dark = themeProbe(root);
  ticks.push((angle) => {
    rim.value = dark() ? 1 : 0;
    practical.intensity = dark() ? 5.5 : 0;
    // The island bobs gently on the breeze.
    world.position.y = 0.03 * Math.sin(angle);
  });
  return root;
}
