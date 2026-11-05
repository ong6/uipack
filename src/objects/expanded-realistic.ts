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
  rodGeometry,
  seeded,
  smoothstep,
  sphere,
  tube,
  valueNoise,
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
    dark: {
      exposure: 0.92,
      hemisphere: { sky: 0xb8c4d8, ground: 0x15130f, intensity: 0.28 },
      environment: { intensity: 0.28 },
      key: { intensity: 4 },
      rim: { color: 0xbcd0ff, intensity: 2.4 },
      reflections: 0.85,
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
function surface(root: THREE.Object3D, map: THREE.Texture, normalMap: THREE.Texture | null, roughness: number, dark = 0.62) {
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

/** Oiled walnut planks, grain running away from the lens. */
function walnut(root: THREE.Object3D) {
  const grain = (u: number, v: number) => {
    const plank = Math.floor(u * 5);
    const warp = fbm(u * 8, v * 2.5, 64, 4, 3 + plank) * 7;
    const rings = 0.5 + 0.5 * Math.sin((u * 5 * 9 + warp + plank * 1.7) * Math.PI);
    return { rings, plank };
  };
  const map = paintTexture(256, 512, (u, v) => {
    const { rings, plank } = grain(u, v);
    const fine = valueNoise(u * 256, v * 24, 256, 9);
    const edge = Math.min((u * 5) % 1, 1 - ((u * 5) % 1));
    const seam = smoothstep(0.02, 0, edge);
    const figure = fbm(u * 4, v * 6, 4, 3, 17 + plank);
    const tone = 0.3 + 0.22 * rings ** 2 + 0.08 * fine + 0.3 * figure + (plank % 2) * 0.05;
    const [r, g, b] = mixRgb(0x24170f, 0x6a4830, clamp01(tone));
    return [r * (1 - seam * 0.6), g * (1 - seam * 0.6), b * (1 - seam * 0.6)];
  });
  const normalMap = normalTexture(
    128,
    (u, v) => 0.6 * valueNoise(u * 128, v * 10, 128, 4) + 0.4 * grain(u, v).rings,
    0.8,
    [1, 1],
  );
  return surface(root, map, normalMap, 0.5);
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

/** Green solder mask over copper traces, with vias. */
function circuitBoard(root: THREE.Object3D) {
  const W = 256,
    H = 512;
  const copper = new Float32Array(W * H);
  const random = seeded(77);
  const stroke = (x0: number, y0: number, x1: number, y1: number, width: number) => {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let s = 0; s <= steps; s++) {
      const x = x0 + ((x1 - x0) * s) / Math.max(steps, 1),
        y = y0 + ((y1 - y0) * s) / Math.max(steps, 1);
      for (let dy = -width; dy <= width; dy++)
        for (let dx = -width; dx <= width; dx++) {
          const px = Math.round(x + dx),
            py = Math.round(y + dy);
          if (px >= 0 && py >= 0 && px < W && py < H) copper[py * W + px] = 1;
        }
    }
  };
  for (let i = 0; i < 70; i++) {
    let x = random() * W,
      y = random() * H;
    const width = random() < 0.2 ? 2 : 1;
    for (let leg = 0; leg < 3; leg++) {
      const length = 20 + random() * 90;
      const dir = Math.floor(random() * 4);
      const diagonal = random() < 0.4;
      const nx = x + (dir === 0 ? length : dir === 1 ? -length : diagonal ? length * 0.5 : 0);
      const ny = y + (dir === 2 ? length : dir === 3 ? -length : diagonal ? length * 0.5 : 0);
      stroke(x, y, nx, ny, width);
      x = nx;
      y = ny;
    }
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9) stroke(x + dx, y + dy, x + dx, y + dy, 0);
  }
  const at = (x: number, y: number) => copper[((y + H) % H) * W + ((x + W) % W)];
  const map = paintTexture(W, H, (_u, _v, x, y) => (at(x, y) ? [46, 104, 72] : [22, 64, 44]));
  const normalMap = paintTexture(
    W,
    H,
    (_u, _v, x, y) => {
      const n = vec(-(at(x + 1, y) - at(x - 1, y)) * 0.8, -(at(x, y + 1) - at(x, y - 1)) * 0.8, 1).normalize();
      return [(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255];
    },
    { srgb: false },
  );
  return surface(root, map, normalMap, 0.32, 0.55);
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
  return merged;
}

/** A legend printed into the key's dish (it follows the curve). */
function legendGeometry(text: string, width: number, keyTop: number, keyHalfWidth: number, dish: number, x: number, z: number) {
  const geometry = new THREE.PlaneGeometry(width, width * 1.4, 6, 1);
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

/** One texture per legend: a single 5×7 glyph, white on transparent. */
function legendTexture(text: string) {
  return paintTexture(
    24,
    32,
    (_u, _v, x, y) => {
      const on = glyphDot(text, Math.floor((x - 2) / 4), 6 - Math.floor((y - 2) / 4)) ? 255 : 0;
      return [on, on, on];
    },
    { srgb: false },
  );
}

const models: Record<ArtKind, Model> = {
  /** Key travel: a cluster of PBT keycaps in macro on an aluminium case; one key types in rhythm. */
  ai(root, ticks) {
    walnut(root);
    const caseGroup = group(root);
    const aluminium = lookMaterial("brushedMetal", 0xb8bcc0, { roughness: 0.34, anisotropy: 0.8 });
    block(caseGroup, [3.4, 0.22, 1.9], aluminium, [0.1, 0.11, -0.1], 0.06);
    const plate = lookMaterial("plastic", 0x1c1e21, { roughness: 0.55 });
    block(caseGroup, [3.2, 0.03, 1.72], plate, [0.1, 0.225, -0.1], 0.01);
    setDressing(caseGroup);
    pool(root, 3.6, 2.2, 0.1, -0.1, 0.5);

    const KEY = 0.38,
      WIDTH = 0.35,
      HEIGHT = 0.2,
      DISH = 0.012;
    const pbt = lookMaterial("plastic", 0xe8e3d6, { roughness: 0.74 });
    const grey = lookMaterial("plastic", 0x8e9298, { roughness: 0.72 });
    const accent = lookMaterial("plastic", 0xd45a26, { roughness: 0.6 });
    const capGeometry = keycapGeometry(WIDTH, HEIGHT, WIDTH, DISH);
    const rows = [
      { keys: ["T", "Y", "U", "I", "P"], z: -0.62, offset: -0.1 },
      { keys: ["G", "H", "J", "K", "M"], z: -0.24, offset: 0 },
      { keys: ["B", "N", "M", ",", "."], z: 0.14, offset: 0.19 },
    ];
    // Which keys type, and when: J (the hero, homing bar) is mid-press at the rest frame.
    const typing: Record<string, number> = { J: 1.88, K: 3.4, H: 5.1, U: 0.4 };
    const legends = new Map<string, THREE.Material>();
    for (const row of rows)
      row.keys.forEach((text, col) => {
        if (row.z === 0.14 && col === 2) text = "M";
        const x = -0.86 + col * KEY + row.offset;
        if (Math.abs(x) > 1.3) return;
        const key = group(root, x, 0.24 + HEIGHT / 2 + 0.02, row.z);
        const hero = text === "J";
        const material = hero ? accent : col === 4 ? grey : pbt;
        mesh(key, capGeometry, material);
        const legend =
          legends.get(text) ??
          new THREE.MeshStandardMaterial({
            color: hero ? 0xfff4e8 : 0x24262a,
            alphaMap: legendTexture(text),
            transparent: true,
            roughness: 0.6,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            depthWrite: false,
          });
        legends.set(text, legend);
        const topHalf = (WIDTH * 0.8) / 2;
        decal(mesh(key, legendGeometry(text, 0.07, HEIGHT / 2, topHalf, 0, -0.05, -0.06), legend));
        if (hero) {
          const bar = mesh(key, roundedBox(0.08, 0.012, 0.018, 0.006), material, 0, HEIGHT / 2 - DISH + 0.004, 0.06);
          bar.userData.frameIgnore = true;
        }
        const phase = typing[text];
        if (phase !== undefined) {
          const rest = key.position.y;
          // A quick press and a springy return, twice a loop.
          ticks.push((angle) => {
            const press = Math.max(0, Math.cos(angle * 2 - phase * 2)) ** 24;
            key.position.y = rest - 0.07 * press;
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
        y = (v - 0.62) * 2.4;
      const r = Math.hypot(x / 0.86, y / 1.02);
      const frame = smoothstep(0.24, 0.04, Math.abs(r - 0.93));
      const inside = r < 0.92 ? 1 : 0;
      const strings =
        inside *
        0.5 *
        (smoothstep(0.32, 0.05, Math.abs(((((x * 7) % 1) + 1) % 1) - 0.5) * 2 - 0.7) +
          smoothstep(0.32, 0.05, Math.abs(((((y * 7) % 1) + 1) % 1) - 0.5) * 2 - 0.7));
      const throat = v < 0.3 ? smoothstep(0.12, 0.03, Math.abs(x)) * smoothstep(0, 0.08, v) : 0;
      const a = clamp01(Math.max(frame, strings * 0.55, throat));
      const [r1, g1, b1] = frame > strings ? [28, 31, 36] : [214, 214, 200];
      return [r1, g1, b1, a * 150];
    });
    const card = new THREE.MeshBasicMaterial({ map: blurred, transparent: true, depthWrite: false, toneMapped: true });
    const racket = mesh(root, new THREE.PlaneGeometry(1.3, 1.6), themed(card, { dark: { color: 0x7a7f88 } }), -0.95, 0.5, -2.8);
    racket.rotation.set(-0.12, 0.3, 0.5);
    racket.userData.frameIgnore = true;

    const RADIUS = 0.42;
    const roller = group(root, 0, 0, 0.05);
    const ball = group(roller, 0, RADIUS, 0);
    const felt = lookMaterial("felt", 0xcfd93b, { grain: 3, sheenRoughness: 0.6, roughness: 1 });
    sphere(ball, RADIUS, felt, [0, 0, 0], 48);
    // A fuzz shell: a slightly larger, noisy, half-clear sphere breaks the silhouette like real nap.
    const fuzzMap = paintTexture(
      128,
      64,
      (u, v) => {
        const n = valueNoise(u * 128, v * 64, 128, 31);
        const a = smoothstep(0.45, 0.95, n) * 160;
        return [a, a, a];
      },
      { srgb: false },
    );
    const fuzz = new THREE.MeshStandardMaterial({
      color: 0xe4ec7a,
      roughness: 1,
      alphaMap: fuzzMap,
      transparent: true,
      depthWrite: false,
    });
    decal(sphere(ball, RADIUS * 1.025, fuzz, [0, 0, 0], 40));
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
    const enamel = lookMaterial("ceramic", 0x15171a, { roughness: 0.28 });
    const brass = lookMaterial("metal", 0xc9a35a, { roughness: 0.26 });
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
    cylinder(wheel, 0.06, 0.64, lookMaterial("brushedMetal", 0xb4b7ba), [0, 0, 0], 16);
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

  /** Silicon detail: a finned heatsink with copper heat pipes and a fan, low across a board. */
  server(root, ticks) {
    circuitBoard(root);
    const sink = group(root, -0.15, 0, -0.1);
    sink.rotation.y = -0.55;
    const aluminium = lookMaterial("brushedMetal", 0xaeb3b8, { roughness: 0.42, anisotropy: 0.45 });
    const copper = lookMaterial("metal", 0xc27a4c, { roughness: 0.22 });
    block(sink, [1.24, 0.12, 1.12], aluminium, [0, 0.06, 0], 0.02);
    const fins: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 16; i++) fins.push(mergeable(placed(roundedBox(0.026, 0.86, 1.1, 0.01, 1), -0.6 + i * 0.08, 0.57, 0)));
    mesh(sink, mergeGeometries(fins), lookMaterial("metal", 0xb4b9be, { roughness: 0.48 }));
    const pipes: THREE.BufferGeometry[] = [];
    for (const z of [-0.3, 0, 0.3])
      pipes.push(
        mergeable(
          tube(
            [
              vec(-0.75, 0.95, z),
              vec(-0.75, 0.25, z),
              vec(-0.62, 0.11, z),
              vec(0.62, 0.11, z),
              vec(0.75, 0.25, z),
              vec(0.75, 0.95, z),
            ],
            0.045,
            false,
            64,
            12,
          ),
        ),
      );
    mesh(sink, mergeGeometries(pipes), copper);
    // Pipe ends capped with a crimp.
    for (const x of [-0.75, 0.75]) for (const z of [-0.3, 0, 0.3]) cylinder(sink, 0.05, 0.04, copper, [x, 0.97, z], 12);

    // The fan, on the heatsink's right side, so the lens sees it at a steep angle.
    const fan = group(sink, 0.72, 0.53, 0);
    fan.rotation.y = Math.PI / 2;
    const frameShape = new THREE.Shape();
    const S = 0.5,
      R = 0.08;
    frameShape.moveTo(-S + R, -S);
    frameShape.lineTo(S - R, -S);
    frameShape.quadraticCurveTo(S, -S, S, -S + R);
    frameShape.lineTo(S, S - R);
    frameShape.quadraticCurveTo(S, S, S - R, S);
    frameShape.lineTo(-S + R, S);
    frameShape.quadraticCurveTo(-S, S, -S, S - R);
    frameShape.lineTo(-S, -S + R);
    frameShape.quadraticCurveTo(-S, -S, -S + R, -S);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.46, 0, TAU, true);
    frameShape.holes.push(hole);
    const frameGeometry = new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 40,
    });
    const plastic = lookMaterial("plastic", 0x1d1f22, { roughness: 0.5 });
    mesh(fan, frameGeometry, plastic);
    const rotor = group(fan, 0, 0, 0.07);
    const blades: THREE.BufferGeometry[] = [
      mergeable(placed(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 32), 0, 0, 0, Math.PI / 2)),
    ];
    for (let i = 0; i < 7; i++) {
      const blade = new THREE.Shape();
      blade.moveTo(0.13, -0.05);
      blade.quadraticCurveTo(0.32, -0.12, 0.43, 0.02);
      blade.quadraticCurveTo(0.33, 0.12, 0.13, 0.08);
      blade.closePath();
      const geometry = new THREE.ExtrudeGeometry(blade, { depth: 0.012, bevelEnabled: false, curveSegments: 10 });
      geometry.translate(0, 0, -0.006);
      geometry.rotateX(0.45);
      geometry.rotateZ((i * TAU) / 7);
      blades.push(mergeable(geometry));
    }
    mesh(rotor, mergeGeometries(blades), lookMaterial("plastic", 0x2a2d31, { roughness: 0.42 }));
    const badge = mesh(
      rotor,
      new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32),
      lookMaterial("brushedMetal", 0xa9adb1),
      0,
      0,
      0.045,
    );
    badge.rotation.x = Math.PI / 2;
    ticks.push((angle) => (rotor.rotation.z = -angle * 6));
    pool(root, 1.9, 1.7, -0.15, -0.1, 0.65);

    // Board furniture: polymer capacitors, a DIMM in its slot, and a status LED that blinks.
    const dressing = group(root);
    const can = lookMaterial("brushedMetal", 0xb9bdc2, { roughness: 0.4 });
    const sleeve = lookMaterial("plastic", 0x262a30, { roughness: 0.45 });
    for (let i = 0; i < 5; i++) {
      const x = -1.05 + i * 0.2,
        z = 0.78;
      cylinder(dressing, 0.075, 0.16, can, [x, 0.08, z], 24);
      cylinder(dressing, 0.077, 0.06, sleeve, [x, 0.03, z], 24);
    }
    const chips: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++)
      chips.push(mergeable(placed(roundedBox(0.09, 0.03, 0.05, 0.008, 1), 0.55 + i * 0.13, 0.015, 0.75)));
    mesh(dressing, mergeGeometries(chips), lookMaterial("plastic", 0x141416, { roughness: 0.35 }));
    const slot = group(dressing, 0.6, 0, -1.3);
    slot.rotation.y = -0.55;
    block(slot, [2.2, 0.12, 0.12], lookMaterial("plastic", 0x1a1a1c, { roughness: 0.5 }), [0, 0.06, 0], 0.02);
    block(slot, [2.0, 0.55, 0.03], lookMaterial("plastic", 0x1d5b3e, { roughness: 0.4 }), [0, 0.38, 0], 0.01);
    for (let i = 0; i < 8; i++)
      block(slot, [0.2, 0.18, 0.02], lookMaterial("plastic", 0x111214, { roughness: 0.4 }), [-0.84 + i * 0.24, 0.4, 0.025], 0.01);
    setDressing(dressing);
    const ledMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a26,
      emissive: 0x3dff8a,
      emissiveIntensity: 2,
      roughness: 0.3,
    });
    const led = block(root, [0.07, 0.03, 0.04], ledMaterial, [0.42, 0.015, 0.62], 0.01);
    led.userData.frameIgnore = true;
    ticks.push((angle) => (ledMaterial.emissiveIntensity = 0.4 + 2.6 * Math.max(0, Math.sin(angle * 6)) ** 4));
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
    const roll = cylinder(root, 0.27, 3.4, lookMaterial("plastic", 0x3a2216, { roughness: 0.7 }), [0, 0.27, -1.08], 40);
    roll.rotation.z = Math.PI / 2;
    setDressing(roll);

    const compass = group(root, 0, 0.36, -0.08);
    compass.rotation.x = 0.3; // tipped toward the lens, its back edge on the roll
    compass.rotation.y = -0.15;
    const steel = lookMaterial("brushedMetal", 0xc2c6ca, { roughness: 0.26, anisotropy: 0.5 });
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
        const cx = 0.6 * Math.sin((a * Math.PI) / 180),
          cy = 0.6 * Math.cos((a * Math.PI) / 180);
        const s = 0.026;
        const col = Math.floor((x - cx) / s + 2.5),
          row = Math.floor(-(y - cy) / s + 3.5);
        if (glyphDot(letter, col, row)) {
          if (letter === "N") red = 1;
          else ink = 1;
        }
      }
      // A red north triangle at the rim.
      if (y > 0.66 && y < 0.79 && Math.abs(x) < (0.79 - y) * 0.5) red = 1;
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
    const acetate = lookMaterial("ceramic", 0xffffff, { map: tortoise, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
    const glasses = group(root, 0.55, 0.575, 0.18);
    glasses.rotation.set(-0.12, -0.32, 0);
    const rim = (cx: number) => {
      const shape = new THREE.Shape();
      const rx = 0.25,
        ry = 0.2;
      shape.absellipse(cx, 0, rx + 0.03, ry + 0.03, 0, TAU, false, 0);
      const hole = new THREE.Path();
      hole.absellipse(cx, 0, rx, ry, 0, TAU, true, 0);
      shape.holes.push(hole);
      return shape;
    };
    const frontShapes = [rim(-0.3), rim(0.3)];
    const front = new THREE.ExtrudeGeometry(frontShapes, {
      depth: 0.035,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 40,
    });
    front.computeBoundingBox();
    const uv = front.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.8, uv.getY(i) * 0.8);
    mesh(glasses, front, acetate);
    mesh(glasses, tube([vec(-0.06, 0.05, 0.02), vec(0, 0.085, 0.02), vec(0.06, 0.05, 0.02)], 0.028, false, 12, 8), acetate);
    for (const side of [-1, 1]) {
      // Temples folded behind the front, nearly crossing.
      const temple = mesh(
        glasses,
        mergeable(rodGeometry(vec(side * 0.58, 0.1, -0.02), vec(-side * 0.18, -0.21, -0.3), 0.013, 8)),
        acetate,
      );
      temple.castShadow = true;
      const lens = mesh(glasses, new THREE.CircleGeometry(1, 48), clearGlass(), side * 0.3, 0, 0.018);
      lens.scale.set(0.25, 0.2, 1);
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
  server: { pitch: 16, fill: 0.8 },
  travel: { pitch: 22, fill: 0.84 },
  reading: { pitch: 20, fill: 0.5, maxWidth: 0.7 },
};

export function realistic(kind: ArtKind, ticks: Tick[]) {
  const root = new THREE.Group();
  models[kind](root, ticks);
  const { pitch, yaw = 0, fill, maxWidth } = subjectCamera[kind];
  root.userData.look = {
    ...realisticLook,
    camera: { ...realisticLook.camera, pitch, yaw },
    framing: { ...(realisticLook.framing || {}), ...(fill ? { fill } : {}), ...(maxWidth ? { maxWidth } : {}) },
  } satisfies ObjectLook;
  return root;
}
