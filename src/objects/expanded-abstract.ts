// Abstract forms (direction 5): optical glass sculptures standing in front of lacquered bars of colour.
// The colour lives behind the glass; refraction and dispersion carry the subject. Grounded by a
// tinted shadow with a caustic of the band's colour.
import * as THREE from "three";
import { contactShadow, lookMaterial, themed, type ObjectLook } from "./look";
import type { Tick } from "./procedural";
import { group, mesh, paintTexture, roundedBox, smoothstep, themeProbe } from "./expanded-kit";
import type { KindWithLook } from "./variants";

type Kind = Exclude<KindWithLook<5>, "contact">;

export const abstractLook: ObjectLook = {
  rig: {
    both: {
      toneMapping: "neutral",
      exposure: 1.05,
      environment: { kind: "softbox", intensity: 0.7, rotation: 0.45 },
      hemisphere: { sky: 0xf3f2ff, ground: 0x3a3560, intensity: 0.9 },
      key: { color: 0xffffff, intensity: 2.2, position: [-3, 5, 6] },
      rim: { color: 0xdce4ff, intensity: 2.2, position: [4, 3, -4] },
    },
    dark: {
      hemisphere: { sky: 0x8d92d6, ground: 0x0d0e1a, intensity: 0.6 },
      environment: { intensity: 0.8 },
      rim: { intensity: 3.4 },
      reflections: 1,
    },
  },
  camera: { projection: "perspective", fov: 24, pitch: 5 },
  framing: { fill: 0.68, maxWidth: 0.8, lift: 0.02, sample: "loop" },
  transmissionBackdrop: { light: 0xe9e7f6, dark: 0x181d36 },
};

const hues = { vermilion: 0xff5a36, ultramarine: 0x3d5afe, saffron: 0xffc23d };

/* ---------------------------------------------------------------- Materials and staging */

/**
 * Clear optical glass. What read as frosted resin was the glass mirroring the bright softbox over
 * whole faces and refracting a pale, soft-striped studio: low contrast in, milk out. So: a polished
 * surface (roughness 0), reflections kept to the strip highlights, real thickness so the colour
 * behind visibly shifts and magnifies, dispersion for the fringes at its edges, and only a trace of
 * absorption.
 */
function opticalGlass(options: THREE.MeshPhysicalMaterialParameters = {}) {
  return lookMaterial("glass", 0xffffff, {
    roughness: 0,
    thickness: 1.1,
    ior: 1.5,
    dispersion: 0.9,
    attenuationColor: new THREE.Color(0xf2f7ff),
    attenuationDistance: 8,
    envMapIntensity: 0.75,
    specularIntensity: 1,
    ...options,
  });
}

/**
 * The colour's material: a deep lacquer, lit, not self-lit. A satin base coat under a glossy clear
 * coat, so each bar shades from its lit top to its turned-away underside, carries the softbox as a
 * crisp streak along its rounded edge and falls off in the pool light, instead of reading as a flat
 * emissive strip.
 */
const lacquers = new Map<number, THREE.MeshPhysicalMaterial>();
function lacquer(color: number) {
  let material = lacquers.get(color);
  if (!material) {
    material = lookMaterial("ceramic", color, {
      roughness: 0.42,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 0.8,
    }) as THREE.MeshPhysicalMaterial;
    lacquers.set(color, material);
  }
  return material;
}
/** A bar of colour with rounded edges, standing behind the glass. */
function band(
  parent: THREE.Object3D,
  color: number,
  width: number,
  height: number,
  x: number,
  y: number,
  z: number,
  rotation = 0,
) {
  // A bar with a fully rounded profile across its short side, so light rolls over it.
  const depth = Math.min(0.2, Math.max(0.1, Math.min(width, height) * 0.9));
  const card = mesh(parent, roundedBox(width, height, depth, Math.min(width, height, depth) * 0.48, 5), lacquer(color), x, y, z);
  card.rotation.z = rotation;
  return card;
}
/** A bar from `from` to `to` (x, y), for beams and strokes at an angle. */
function beam(parent: THREE.Object3D, color: number, from: [number, number], to: [number, number], thickness: number, z: number) {
  const dx = to[0] - from[0],
    dy = to[1] - from[1];
  return band(parent, color, Math.hypot(dx, dy), thickness, (from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z, Math.atan2(dy, dx));
}
/** A thick stroke through `points` (x, y): a graph line, its band `width` tall, extruded and bevelled. */
function stroke(parent: THREE.Object3D, color: number, points: [number, number][], width: number, z: number) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y + width / 2) : shape.moveTo(x, y + width / 2)));
  for (let i = points.length - 1; i >= 0; i--) shape.lineTo(points[i][0], points[i][1] - width / 2);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelSize: width * 0.3,
    bevelThickness: 0.05,
    bevelSegments: 5,
  });
  return mesh(parent, geometry, lacquer(color), 0, 0, z - 0.03);
}
let discShade: THREE.Texture | undefined;
/** A disc of colour, lit like a sphere seen far off: lighter toward the key (upper left), deeper at the lower rim. */
function disc(parent: THREE.Object3D, color: number, radius: number, x: number, y: number, z: number) {
  discShade ??= paintTexture(128, 128, (u, v) => {
    const r = Math.hypot(u - 0.5, v - 0.5) * 2;
    const toKey = Math.hypot(u - 0.3, v - 0.72) * 1.4;
    const t = 1.12 - 0.3 * Math.min(1, toKey) ** 1.5 - (0.1 * Math.max(0, r - 0.8)) / 0.2;
    const c = Math.min(255, 255 * t * 0.89);
    return [c, c, c];
  });
  // A thick lacquered coin, shaded toward the key, with the same satin finish as the bands.
  const material = lacquer(color).clone();
  material.map = discShade;
  const coin = mesh(parent, new THREE.CylinderGeometry(radius, radius, 0.06, 96), material, x, y, z);
  coin.rotation.x = Math.PI / 2;
  return coin;
}

/**
 * A cyclorama (a floor sweeping up into a wall) behind the glass that only draws into three's
 * transmission pass, so the glass refracts a lit studio instead of the flat card, down to its feet,
 * while the canvas itself stays clear. One per theme, each fully transparent (so skipped by the
 * pass) in the other: dark-field strips of light on navy at night, bright-field dark strips on the
 * pale card by day (the classic way to outline clear glass on white).
 */
function backGlow(parent: THREE.Object3D, theme: "light" | "dark", width = 5.2) {
  const profile: [number, number][] = [];
  const FLOOR = -0.05,
    WALL = -1.45,
    TOP = 2.15,
    BEND = 0.45;
  for (let i = 0; i <= 8; i++) profile.push([FLOOR, 0.9 - (i / 8) * (0.9 - (WALL + BEND))]);
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    profile.push([FLOOR + BEND - BEND * Math.cos(a), WALL + BEND - BEND * Math.sin(a)]);
  }
  for (let i = 1; i <= 8; i++) profile.push([FLOOR + BEND + (i / 8) * (TOP - FLOOR - BEND), WALL]);
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  profile.forEach(([y, z], j) => {
    for (const side of [0, 1]) {
      positions.push((side - 0.5) * width, y, z);
      uvs.push(side, j / (profile.length - 1));
    }
    if (j > 0) indices.push((j - 1) * 2, (j - 1) * 2 + 1, j * 2, j * 2, (j - 1) * 2 + 1, j * 2 + 1);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  // Dark-field lighting, as for glass on black: the wall stays the card's navy and two tall soft
  // strips stand either side of the subject (with a faint line where the floor bends up). Seen
  // through the glass they light its edges and leave its body clear, rather than filling it with
  // an even lavender glow that read as opaque plastic.
  const map = paintTexture(256, 96, (u, v) => {
    const strip = (centre: number, width: number) => Math.exp(-(((u - centre) / width) ** 2));
    const wall = smoothstep(0.5, 0.7, v) * smoothstep(1, 0.92, v);
    // A soft top light high on the wall catches the glass's upper edges; the floor bend glows faintly.
    const top = Math.exp(-(((v - 0.9) / 0.05) ** 2)) * smoothstep(0.1, 0.35, u) * smoothstep(0.9, 0.65, u);
    const bend = 0.3 * Math.exp(-(((v - 0.52) / 0.05) ** 2)) * smoothstep(0, 0.3, u) * smoothstep(1, 0.7, u);
    if (theme === "dark") {
      // Dark field: tall soft strips either side light the glass's edges; behind the subject a
      // lavender pool (the night light on the wall), so the glass body refracts light, never black.
      const strips = strip(0.36, 0.05) + strip(0.64, 0.05) + 0.55 * (strip(0.18, 0.04) + strip(0.82, 0.04));
      const pool = Math.exp(-(((u - 0.5) / 0.2) ** 2) - ((v - 0.68) / 0.22) ** 2);
      const t = Math.min(1, strips * wall * 1.15 + 0.8 * top + bend);
      return [44 + 120 * pool + 186 * t, 52 + 112 * pool + 190 * t, 96 + 120 * pool + 150 * t];
    }
    // Bright field: the pale card with a few crisp dark lines (a window's mullions, the floor's far
    // edge). Bent and split by the glass, they draw its edges and show it refracting, where broad
    // soft greys only clouded it.
    const lines =
      strip(0.3, 0.008) + strip(0.7, 0.008) + 0.7 * (strip(0.42, 0.005) + strip(0.58, 0.005)) + 0.6 * strip(0.12, 0.012);
    const horizon = Math.exp(-(((v - 0.6) / 0.012) ** 2));
    const d = Math.min(1, 0.85 * lines * smoothstep(0.52, 0.62, v) + 0.6 * horizon + 0.25 * smoothstep(0.5, 0.3, v));
    return [236 - 190 * d, 234 - 186 * d, 248 - 170 * d];
  });
  const material = themed(new THREE.MeshBasicMaterial({ map, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }), {
    [theme === "dark" ? "light" : "dark"]: { opacity: 0 },
  });
  const glow = mesh(parent, geometry, material);
  glow.renderOrder = -5;
  glow.userData.frameIgnore = true;
  glow.onBeforeRender = (renderer) => {
    material.colorWrite = renderer.getRenderTarget() !== null;
  };
  return glow;
}

let causticMap: THREE.Texture | undefined;
/**
 * A spectral caustic: light focused through the glass into a bright core with a ring whose red,
 * green and blue edges land at slightly different radii (dispersion), painted in colour and added
 * to the floor.
 */
function spectralCaustic() {
  causticMap ??= paintTexture(128, 128, (u, v) => {
    const r = Math.hypot(u - 0.5, v - 0.5) * 2;
    const ring = (radius: number) => Math.exp(-(((r - radius) / 0.07) ** 2));
    const core = Math.exp(-((r / 0.16) ** 2));
    const fade = Math.max(0, 1 - r);
    const channel = (radius: number) => Math.min(1, (0.9 * ring(radius) + 0.35 * ring(radius * 0.6) + core) * fade) * 255;
    return [channel(0.62), channel(0.56), channel(0.5)];
  });
  return causticMap;
}
/**
 * The floor under a glass piece: a cool shadow and, offset away from the key (light through glass
 * lands beyond its shadow), a bright caustic tinted with `hue`. Returns the caustic so a subject
 * can move and pulse it with the glass.
 */
function floor(parent: THREE.Object3D, width: number, depth: number, hue: number, x = 0, z = 0) {
  parent.add(contactShadow(width, depth, { opacity: 0.3, color: 0x1b1840, x, z, y: 0.002 }));
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(hue).lerp(new THREE.Color(0xffffff), 0.15),
    map: spectralCaustic(),
    // Its brightness is its coverage too. Normal blending, not additive: added light vanishes on the
    // pale day card, while a saturated patch reads as focused coloured light on both cards.
    alphaMap: spectralCaustic(),
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    toneMapped: false,
  });
  const caustic = mesh(
    parent,
    new THREE.PlaneGeometry(width * 0.55, depth * 0.5),
    material,
    x + width * 0.14,
    0.004,
    z - depth * 0.06,
  );
  caustic.rotation.x = -Math.PI / 2;
  caustic.renderOrder = -1;
  caustic.userData.frameIgnore = true;
  return caustic;
}

/** The pool light: a warm point light above-left of the subject by day, a stronger cool one at night. */
function poolLight(root: THREE.Object3D, ticks: Tick[]) {
  const light = new THREE.PointLight(0xfff2e2, 0, 10, 2);
  light.position.set(-1.5, 2.6, 2.0);
  root.add(light);
  // A low rim from behind right that runs up the glass's far edges at night.
  const rim = new THREE.PointLight(0x9fb4ff, 0, 8, 2);
  rim.position.set(1.9, 0.6, -1.6);
  root.add(rim);
  const dark = themeProbe(root);
  ticks.push(() => {
    const night = dark();
    light.intensity = night ? 18 : 9;
    light.color.setHex(night ? 0xe4e2ff : 0xfff2e2);
    rim.intensity = night ? 10 : 0;
  });
}

/* ---------------------------------------------------------------- Subjects */

type Model = (root: THREE.Group, ticks: Tick[]) => void;

const models: Record<Kind, Model> = {
  /**
   * Thought lattice: one glass prism, standing on an edge, takes a single white beam and fans it
   * into the three hues (input in, ideas out). The beams run behind the glass, so the prism visibly
   * bends and splits them; it turns a little as the fan breathes.
   */
  ai(root, ticks) {
    const Z = -0.95,
      PIVOT: [number, number] = [0.1, 0.66];
    beam(root, 0xf4f3fb, [-2.0, 0.28], PIVOT, 0.11, Z);
    const fan = group(root, PIVOT[0], PIVOT[1], 0);
    const rays = [
      { color: hues.vermilion, angle: 0.36 },
      { color: hues.saffron, angle: 0.15 },
      { color: hues.ultramarine, angle: -0.06 },
    ].map(({ color, angle }) => {
      const ray = group(fan);
      ray.rotation.z = angle;
      band(ray, color, 1.95, 0.11, 0.975, 0, Z - 0.01);
      return { ray, angle };
    });
    // An equilateral prism with softened edges, its axis toward the camera.
    const SIDE = 1.5,
      tall = (SIDE * Math.sqrt(3)) / 2;
    const triangle = new THREE.Shape();
    triangle.moveTo(-SIDE / 2, 0);
    triangle.lineTo(SIDE / 2, 0);
    triangle.lineTo(0, tall);
    triangle.closePath();
    const prismGeometry = new THREE.ExtrudeGeometry(triangle, {
      depth: 0.62,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.05,
      bevelSegments: 4,
    });
    prismGeometry.translate(0, 0.05, -0.31);
    const prism = mesh(root, prismGeometry, opticalGlass({ thickness: 0.9, dispersion: 1.2 }), 0, 0, 0);
    const caustic = floor(root, 2.0, 1.1, hues.saffron);
    const causticX = caustic.position.x;
    ticks.push((angle) => {
      prism.rotation.y = 0.32 + 0.14 * Math.sin(angle);
      // The focused light swings and brightens as the prism turns toward the key.
      caustic.position.x = causticX + 0.18 * Math.sin(angle);
      (caustic.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.25 * Math.sin(angle);
      const spread = 1 + 0.12 * Math.sin(angle * 2);
      for (const { ray, angle: base } of rays) ray.rotation.z = 0.15 + (base - 0.15) * spread;
    });
  },

  /** Risk rhythm: a row of glass prisms of rising heights refracts an ultramarine band into a price line. */
  trading(root, ticks) {
    // The price line climbs in steps behind the prisms, a rising zigzag instead of a level band.
    stroke(
      root,
      hues.ultramarine,
      [
        [-1.7, 0.3],
        [-1.2, 0.48],
        [-0.82, 0.38],
        [-0.4, 0.72],
        [0.0, 0.6],
        [0.4, 0.98],
        [0.8, 0.86],
        [1.2, 1.3],
        [1.7, 1.42],
      ],
      0.13,
      -1.0,
    );
    disc(root, hues.saffron, 0.32, 1.05, 1.62, -1.25);
    const glass = opticalGlass({ thickness: 0.4 });
    const prismGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 3, 1);
    prismGeometry.translate(0, 0.5, 0);
    const heights = [0.55, 0.8, 0.68, 1.05, 0.95, 1.35, 1.55];
    const prisms = heights.map((height, i) => {
      const prism = mesh(root, prismGeometry, glass, -1.2 + i * 0.4, 0, 0);
      prism.rotation.y = i % 2 ? Math.PI : 0;
      prism.scale.y = height;
      return prism;
    });
    floor(root, 3.2, 1.0, hues.ultramarine);
    ticks.push((angle) => {
      prisms.forEach((prism, i) => (prism.scale.y = heights[i] * (1 + 0.1 * Math.sin(angle * 2 - i * 0.7))));
    });
  },
};

export function abstract(kind: Kind, ticks: Tick[]) {
  const root = new THREE.Group();
  models[kind](root, ticks);
  poolLight(root, ticks);
  backGlow(root, "dark");
  backGlow(root, "light");
  return root;
}
