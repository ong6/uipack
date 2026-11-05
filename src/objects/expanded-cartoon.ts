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
  group,
  mergeable,
  mesh,
  paintTexture,
  placed,
  roundedBox,
  sphere,
  themeProbe,
  tube,
  type ArtKind,
} from "./expanded-kit";

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
  sand: 0xf5d99a,
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
  return new THREE.Color()
    .setHSL(
      earthy ? hsl.h + 0.045 : hsl.h,
      hsl.s * (earthy ? 0.45 : purple ? 0.9 : 0.8),
      hsl.l * (earthy ? 0.74 : purple ? 0.9 : 0.66),
    )
    .lerp(new THREE.Color(0x1f3b4a), 0.14)
    .getHex();
}

/** Moonlight seen from behind the island, in view space: up, a little left and back. */
const MOON = new THREE.Vector3(-0.45, 0.8, -0.4).normalize();
/**
 * A toon moon-rim: a hard-edged cool band on the silhouette edges that face the moon, the classic
 * cel-shaded night kicker. `strength` is shared by every material in a scene and set per theme by a
 * tick (0 by day), so the lit shapes separate from the night card.
 */
function withMoonRim<M extends THREE.MeshToonMaterial>(material: M, strength: { value: number }) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.moonRim = strength;
    shader.uniforms.moonDir = { value: MOON };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float moonRim;\nuniform vec3 moonDir;")
      .replace(
        "#include <opaque_fragment>",
        `{
          vec3 n = normalize(normal);
          float edge = 1.0 - clamp(dot(n, normalize(vViewPosition)), 0.0, 1.0);
          float facing = smoothstep(-0.05, 0.25, dot(n, moonDir));
          float band = smoothstep(0.52, 0.58, edge) * facing;
          outgoingLight += vec3(0.62, 0.74, 1.0) * band * moonRim * (0.35 + 0.65 * max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b));
        }
        #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => "cartoon-moon-rim";
  return material;
}

interface Toons {
  (
    color: number,
    options?: { glow?: number; dayGlow?: number; transparent?: number; character?: boolean },
  ): THREE.MeshToonMaterial;
  /** The scene's shared moon-rim strength, for toon materials built outside the factory. */
  rim: { value: number };
}

/** A material factory sharing one three-step gradient and caching by colour. */
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
    const key = `${color}:${options.glow ?? ""}:${options.dayGlow ?? ""}:${options.transparent ?? ""}:${options.character ?? ""}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const material = withMoonRim(new THREE.MeshToonMaterial({ color, gradientMap: gradient }), rim);
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

/** A blob outline: an ellipse with a seeded wobble, so no two islands match. */
function blob(rx: number, rz: number, seed: number, scale = 1) {
  const shape = new THREE.Shape();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    const r = scale * (1 + 0.07 * Math.sin(3 * a + seed) + 0.045 * Math.sin(5 * a + seed * 2.3));
    const x = rx * r * Math.cos(a),
      y = rz * r * Math.sin(a);
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

/** Every island is the same size, so the six cards line up as one set (only the outline's wobble differs). */
const ISLAND_RX = 1.6,
  ISLAND_RZ = 1.15;
/** A floating island: grass cap, two soil strata and a rocky point. Top of the grass at y 0. */
function island(root: THREE.Object3D, toon: Toons, seed: number) {
  const rx = ISLAND_RX,
    rz = ISLAND_RZ;
  mesh(root, slab(blob(rx, rz, seed), 0.08, -0.06, 0.06), toon(palette.grass));
  mesh(root, slab(blob(rx, rz, seed, 0.97), 0.3, -0.16, 0.05), toon(palette.soil));
  mesh(root, slab(blob(rx, rz, seed + 1, 0.74), 0.26, -0.5, 0.06), toon(palette.soilDark));
  const point = mesh(root, new THREE.ConeGeometry(Math.min(rx, rz) * 0.55, 0.55, 7), toon(palette.rock), 0, -0.98, 0);
  point.rotation.x = Math.PI;
  point.rotation.y = seed;
  // A few pebbles and flowers on the rim.
  const random = mulberry(seed * 1000);
  const flowers: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const a = random() * TAU,
      r = 0.86 + random() * 0.08;
    flowers.push(mergeable(placed(new THREE.SphereGeometry(0.045, 8, 6), rx * r * Math.cos(a), 0.04, rz * r * Math.sin(a))));
  }
  mesh(root, mergeGeometries(flowers), toon([palette.cream, palette.sun, palette.blush][seed % 3]));
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
/** A gable roof prism, `width` across, `height` tall, `depth` deep. */
function roofGeometry(width: number, height: number, depth: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(0, height);
  shape.lineTo(width / 2, 0);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}
/** Vertical candy stripes for awnings. */
function stripes(a: number, b: number, count: number) {
  const toRgb = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255] as [number, number, number];
  const texture = paintTexture(count * 8, 2, (u) => (Math.floor(u * count) % 2 ? toRgb(b) : toRgb(a)));
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

/* ---------------------------------------------------------------- Scenes */

type Scene = (world: THREE.Group, ticks: Tick[], toon: Toons) => void;

const scenes: Record<ArtKind, Scene> = {
  /** Night workshop: a little robot taps at a workbench under a desk lamp; an idea pops above it. */
  ai(world, ticks, toon) {
    island(world, toon, 2);
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
    island(world, toon, 5);
    const court = group(world, 0, 0.02, 0);
    court.rotation.y = -0.18;
    block(court, [2.3, 0.05, 1.3], toon(0xe0784a), [0, 0, 0], 0.04);
    const line = toon(palette.white);
    const lines: THREE.BufferGeometry[] = [];
    for (const z of [-0.58, 0.58]) lines.push(mergeable(placed(new THREE.BoxGeometry(2.1, 0.012, 0.045), 0, 0.03, z)));
    for (const x of [-1.03, 1.03, -0.55, 0.55])
      lines.push(mergeable(placed(new THREE.BoxGeometry(0.045, 0.012, 1.2), x, 0.03, 0)));
    lines.push(mergeable(placed(new THREE.BoxGeometry(1.1, 0.012, 0.04), 0, 0.03, 0)));
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
    const stringTexture = paintTexture(32, 40, (_u, _v, x, y) =>
      x % 4 === 1 || y % 4 === 1 ? [255, 250, 236, 255] : [0, 0, 0, 0],
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
    const frameGeometry = new THREE.TorusGeometry(0.075, 0.014, 8, 28);
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

  /** Exchange avenue: market stalls under striped awnings and a ticker board whose arrow bounces up. */
  trading(world, ticks, toon) {
    island(world, toon, 8);
    block(world, [2.6, 0.03, 0.42], toon(palette.sand), [0, 0.0, 0.42], 0.015);
    const stall = (x: number, z: number, a: number, b: number, goods: number) => {
      const s = group(world, x, 0, z);
      block(s, [0.62, 0.36, 0.36], toon(palette.cream), [0, 0.18, 0], 0.05);
      block(s, [0.66, 0.06, 0.4], toon(palette.wood), [0, 0.39, 0], 0.03);
      for (const px of [-0.29, 0.29]) block(s, [0.04, 0.5, 0.04], toon(palette.wood), [px, 0.62, -0.15], 0.015);
      const awning = withMoonRim(
        new THREE.MeshToonMaterial({
          map: stripes(a, b, 5),
          gradientMap: toon(palette.white).gradientMap as THREE.Texture,
        }),
        toon.rim,
      );
      themed(awning, { dark: { color: night(0xffffff) } });
      const roof = block(s, [0.74, 0.05, 0.5], awning, [0, 0.86, 0.04], 0.025);
      roof.rotation.x = 0.32;
      for (let i = 0; i < 3; i++) sphere(s, 0.07, toon(goods), [-0.18 + i * 0.18, 0.47, 0.06], 10);
      return s;
    };
    stall(-0.95, -0.15, palette.coral, palette.cream, 0xff5a5a);
    stall(-0.25, -0.4, palette.sky, palette.cream, palette.sun);
    // The ticker board on two posts, its arrow bouncing.
    const board = group(world, 0.75, 0, -0.35);
    for (const x of [-0.4, 0.4]) block(board, [0.06, 0.9, 0.06], toon(palette.ink), [x, 0.45, 0], 0.02);
    block(board, [1.0, 0.7, 0.1], toon(palette.ink), [0, 1.05, 0], 0.07);
    const screen = toon(0x1c3a3a, { glow: 0x1c3a3a, dayGlow: 0.3 });
    block(board, [0.88, 0.58, 0.02], screen, [0, 1.05, 0.055], 0.04);
    const barMaterial = toon(0x4fe08a, { glow: 0x4fe08a, dayGlow: 0.9 });
    const bars: THREE.Mesh[] = [];
    [0.14, 0.22, 0.18, 0.3, 0.38].forEach((h, i) => {
      const bar = block(board, [0.08, h, 0.03], barMaterial, [-0.33 + i * 0.12, 0.83 + h / 2, 0.07], 0.015);
      bars.push(bar);
    });
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(-0.06, 0);
    arrowShape.lineTo(0.06, 0);
    arrowShape.lineTo(0.06, 0.14);
    arrowShape.lineTo(0.13, 0.14);
    arrowShape.lineTo(0, 0.3);
    arrowShape.lineTo(-0.13, 0.14);
    arrowShape.lineTo(-0.06, 0.14);
    arrowShape.closePath();
    const arrow = mesh(
      board,
      new THREE.ExtrudeGeometry(arrowShape, {
        depth: 0.06,
        bevelEnabled: true,
        bevelSize: 0.015,
        bevelThickness: 0.015,
        bevelSegments: 2,
      }),
      toon(0x4fe08a, { glow: 0x4fe08a, dayGlow: 0.6 }),
      0.62,
      1.3,
      0.02,
    );
    arrow.rotation.z = -0.35;
    // The shopkeeper, waving.
    const keeper = bean(world, toon, palette.sun, -0.55, 0.42, 0.2);
    keeper.root.scale.setScalar(1.15);
    // A street lamp.
    cylinder(world, 0.03, 0.9, toon(palette.ink), [0.2, 0.45, 0.62], 8);
    sphere(world, 0.08, toon(palette.glow, { glow: palette.glow, dayGlow: 0.3 }), [0.2, 0.95, 0.62], 12);
    tree(world, toon, 1.25, 0.45, 0.7);
    ticks.push((angle) => {
      const hop = Math.abs(Math.sin(angle * 3));
      arrow.position.y = 1.3 + 0.12 * hop;
      arrow.scale.set(1 + 0.12 * (1 - hop), 1 - 0.1 * (1 - hop), 1);
      bars.forEach((bar, i) => (bar.scale.y = 0.75 + 0.25 * (0.5 + 0.5 * Math.sin(angle * 3 + i * 0.9))));
      keeper.right.rotation.z = 2.2 + 0.4 * Math.sin(angle * 8);
      keeper.body.rotation.z = 0.06 * Math.sin(angle * 4);
    });
  },

  /** Cloud factory: server-rack chimneys puff cloud-shaped steam; a conveyor feeds the door. */
  server(world, ticks, toon) {
    island(world, toon, 11);
    const factory = group(world, -0.45, 0, -0.15);
    block(factory, [1.6, 0.62, 0.8], toon(palette.cream), [0, 0.31, 0], 0.08);
    const roofs: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 3; i++) roofs.push(mergeable(placed(roofGeometry(0.5, 0.26, 0.82), -0.53 + i * 0.53, 0.62, 0)));
    mesh(factory, mergeGeometries(roofs), toon(palette.coral));
    block(factory, [0.3, 0.38, 0.04], toon(palette.plum), [0.45, 0.19, 0.41], 0.05);
    const windows = toon(0xbfe7ff, { glow: palette.glow, dayGlow: 0 });
    const panes: THREE.BufferGeometry[] = [];
    for (const x of [-0.55, -0.2, 0.1]) panes.push(mergeable(placed(roundedBox(0.22, 0.2, 0.03, 0.05), x, 0.36, 0.41)));
    mesh(factory, mergeGeometries(panes), windows);
    // Two server racks as chimneys, LEDs blinking up their faces.
    const leds: THREE.MeshToonMaterial[] = [];
    const puffs: { cloud: THREE.Group; x: number; z: number; base: number; offset: number }[] = [];
    [0.72, 1.18].forEach((x, c) => {
      const rack = group(world, x, 0, -0.55 + c * 0.05);
      block(rack, [0.38, 1.0 + c * 0.15, 0.38], toon(0x3a3f5c), [0, (1.0 + c * 0.15) / 2, 0], 0.07);
      const h = 1.0 + c * 0.15;
      for (let i = 0; i < 4; i++) {
        block(rack, [0.3, 0.08, 0.02], toon(0x252a40), [0, 0.25 + i * 0.22, 0.195], 0.02);
        const led = toon(i % 2 ? 0x5dffb0 : 0x7fd6ff, { glow: i % 2 ? 0x5dffb0 : 0x7fd6ff, dayGlow: 0.8 }).clone();
        leds.push(led);
        sphere(rack, 0.025, led, [0.1, 0.25 + i * 0.22, 0.21], 8);
      }
      for (let k = 0; k < 3; k++) {
        const cloud = group(world, x, h, rack.position.z);
        for (const [dx, dy, r] of [
          [-0.1, 0, 0.12],
          [0.04, 0.05, 0.15],
          [0.15, -0.01, 0.1],
        ])
          // Lit from within a touch at night, so the steam stays pale instead of going periwinkle.
          sphere(cloud, r, toon(0xeef3ff, { glow: 0x4a5668, dayGlow: 0 }), [dx, dy, 0], 12);
        puffs.push({ cloud, x, z: rack.position.z, base: h, offset: (k + 0.5) / 3 + c * 0.17 });
      }
    });
    // The conveyor: a belt and little parcels riding into the door.
    block(world, [1.3, 0.08, 0.26], toon(palette.ink), [0.75, 0.12, 0.5], 0.04);
    for (const x of [0.2, 1.3]) block(world, [0.06, 0.12, 0.06], toon(palette.ink), [x, 0.04, 0.5], 0.02);
    const parcels: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) parcels.push(block(world, [0.16, 0.14, 0.16], toon(palette.sun), [0, 0.24, 0.5], 0.03));
    const worker = bean(world, toon, palette.sky, 1.05, 0.05, -0.4);
    worker.root.scale.setScalar(1.15);
    const hat = mesh(worker.body, new THREE.SphereGeometry(0.15, 14, 8, 0, TAU, 0, Math.PI / 2), toon(palette.sun), 0, 0.52, 0);
    hat.scale.set(1.15, 0.8, 1.15);
    pine(world, toon, -1.25, 0.45, 0.85);
    ticks.push((angle) => {
      leds.forEach((led, i) => (led.emissiveIntensity = Math.sin(angle * 10 + i * 1.7) > 0.2 ? 1.8 : 0.15));
      for (const { cloud, x, z, base, offset } of puffs) {
        const p = (angle / TAU + offset) % 1;
        const swell = Math.sin(Math.PI * p);
        cloud.position.set(x + 0.25 * p, base + 0.1 + 0.42 * p, z);
        cloud.scale.setScalar(0.25 + 0.9 * swell);
      }
      parcels.forEach((parcel, i) => {
        const p = ((angle / TAU) * 2 + i / 3 + 0.1) % 1;
        parcel.position.x = 1.3 - 1.05 * p;
        parcel.scale.setScalar(Math.min(1, Math.min(p, 1 - p) * 8));
      });
      worker.right.rotation.z = 2.4 + 0.5 * Math.sin(angle * 6);
    });
  },

  /** Island express: a steam-less toy train loops the island past a station and a windmill. */
  travel(world, ticks, toon) {
    const RX = 1.25,
      RZ = 0.88;
    island(world, toon, 14);
    // The track: two rails and sleepers.
    const railPoints = (r: number) =>
      Array.from({ length: 64 }, (_, i) => vec(Math.cos((i / 64) * TAU) * (RX + r), 0.05, Math.sin((i / 64) * TAU) * (RZ + r)));
    const rails = mergeGeometries([
      mergeable(tube(railPoints(-0.07), 0.016, true, 128, 6)),
      mergeable(tube(railPoints(0.07), 0.016, true, 128, 6)),
    ]);
    mesh(world, rails, toon(0x9aa0b5));
    const sleepers = new THREE.InstancedMesh(roundedBox(0.06, 0.03, 0.22, 0.01, 1), toon(palette.wood), 40);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU;
      const p = vec(Math.cos(a) * RX, 0.02, Math.sin(a) * RZ);
      const heading = Math.atan2(Math.cos(a) * RZ, -Math.sin(a) * RX);
      m.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -heading + Math.PI / 2, 0)), vec(1, 1, 1));
      sleepers.setMatrixAt(i, m);
    }
    world.add(sleepers);
    // The hill and its windmill.
    const hill = sphere(world, 0.44, toon(palette.grassDark), [-0.5, -0.1, -0.3], 20);
    hill.scale.set(1.15, 0.85, 0.9);
    const mill = group(world, -0.5, 0.24, -0.35);
    mesh(mill, new THREE.CylinderGeometry(0.1, 0.16, 0.5, 10), toon(palette.cream), 0, 0.25, 0);
    mesh(mill, new THREE.ConeGeometry(0.14, 0.18, 10), toon(palette.coral), 0, 0.59, 0);
    const sails = group(mill, 0, 0.45, 0.16);
    for (let i = 0; i < 4; i++) {
      const sail = block(sails, [0.07, 0.34, 0.015], toon(palette.white), [0, 0.19, 0], 0.01);
      const holder = group(sails);
      holder.rotation.z = (i * TAU) / 4;
      holder.add(sail);
    }
    // The station: a platform, a little roof and a sign.
    const station = group(world, 0.5, 0, 0.05);
    block(station, [0.6, 0.08, 0.26], toon(palette.sand), [0, 0.04, 0], 0.03);
    for (const x of [-0.22, 0.22]) block(station, [0.04, 0.34, 0.04], toon(palette.ink), [x, 0.25, -0.05], 0.015);
    block(station, [0.66, 0.05, 0.34], toon(palette.sky), [0, 0.44, -0.02], 0.025);
    const passenger = bean(station, toon, palette.coral, 0.05, 0.02, 0.4);
    passenger.root.position.y = 0.08;
    passenger.root.scale.setScalar(0.85);
    pine(world, toon, 1.0, -0.45, 0.8);
    pine(world, toon, -0.95, 0.35, 0.65);
    // The train: an engine and two carriages following the same loop.
    const car = (color: number, engine: boolean) => {
      const c = group(world);
      const body = group(c, 0, 0.08, 0);
      if (engine) {
        const boiler = mesh(body, new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16), toon(palette.coral), 0.05, 0.13, 0);
        boiler.rotation.z = Math.PI / 2;
        block(body, [0.18, 0.28, 0.22], toon(palette.plum), [-0.15, 0.17, 0], 0.04);
        block(body, [0.22, 0.04, 0.26], toon(palette.ink), [-0.15, 0.33, 0], 0.02);
        cylinder(body, 0.035, 0.12, toon(palette.ink), [0.14, 0.27, 0], 8, 0.05);
        block(body, [0.42, 0.06, 0.22], toon(palette.ink), [0, 0.02, 0], 0.02);
        sphere(body, 0.035, toon(palette.glow, { glow: palette.glow, dayGlow: 0.6 }), [0.2, 0.15, 0], 8);
      } else {
        block(body, [0.36, 0.22, 0.22], toon(color), [0, 0.14, 0], 0.05);
        block(body, [0.4, 0.04, 0.26], toon(palette.cream), [0, 0.27, 0], 0.02);
        const win = toon(0xbfe7ff, { glow: palette.glow, dayGlow: 0 });
        for (const side of [-1, 1]) block(body, [0.24, 0.08, 0.01], win, [0, 0.17, side * 0.112], 0.02);
      }
      for (const x of [-0.12, 0.12])
        for (const z of [-0.1, 0.1]) cylinder(body, 0.045, 0.03, toon(palette.ink), [x, 0, z], 10).rotation.x = Math.PI / 2;
      return { c, body };
    };
    const train = [car(palette.coral, true), car(palette.sky, false), car(palette.sun, false)];
    ticks.push((angle) => {
      train.forEach(({ c, body }, i) => {
        const a = -angle + i * 0.36 + 2.6;
        c.position.set(Math.cos(a) * RX, 0.0, Math.sin(a) * RZ);
        // Local +x (the engine's nose) points along the direction of travel (decreasing a).
        c.rotation.y = Math.atan2(Math.cos(a) * RZ, Math.sin(a) * RX);
        body.position.y = 0.08 + 0.012 * Math.abs(Math.sin(angle * 24 + i));
      });
      sails.rotation.z = angle * 2;
      passenger.right.rotation.z = 2.3 + 0.5 * Math.sin(angle * 6);
    });
  },

  /** Reading nook: a reader in an armchair under a big tree, a lamp, a sleeping cat and a butterfly. */
  reading(world, ticks, toon) {
    island(world, toon, 17);
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

export function cartoon(kind: ArtKind, ticks: Tick[]) {
  const root = new THREE.Group();
  root.userData.look = cartoonLook;
  const world = group(root);
  world.rotation.y = -0.35;
  const rim = { value: 0 };
  scenes[kind](world, ticks, toonFactory(rim));
  root.add(frameProxy());
  const dark = themeProbe(root);
  ticks.push((angle) => {
    rim.value = dark() ? 1 : 0;
    // The island bobs gently on the breeze.
    world.position.y = 0.03 * Math.sin(angle);
  });
  return root;
}
