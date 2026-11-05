// Abstract forms (direction 5): optical glass sculptures standing in front of flat bands of colour.
// The colour lives behind the glass; refraction and dispersion carry the subject. Grounded by a
// tinted shadow with a caustic of the band's colour.
import * as THREE from "three";
import { contactShadow, lookMaterial, themed, type ObjectLook } from "./look";
import { TAU, vec, type Tick } from "./procedural";
import { group, mesh, paintTexture, roundedBox, smoothstep } from "./expanded-kit";
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

function opticalGlass(options: THREE.MeshPhysicalMaterialParameters = {}) {
  return lookMaterial("glass", 0xffffff, {
    roughness: 0.02,
    thickness: 0.7,
    ior: 1.52,
    dispersion: 0.4,
    attenuationColor: new THREE.Color(0xdfeaff),
    attenuationDistance: 3,
    envMapIntensity: 1.2,
    ...options,
  });
}

/** A flat band of pure colour: a thin card standing behind the glass. */
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
  const card = mesh(parent, new THREE.BoxGeometry(width, height, 0.02), new THREE.MeshBasicMaterial({ color }), x, y, z);
  card.rotation.z = rotation;
  return card;
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
  return mesh(parent, new THREE.CircleGeometry(radius, 64), new THREE.MeshBasicMaterial({ color, map: discShade }), x, y, z);
}

/**
 * A soft back-light for the dark theme: a glowing cyclorama (a floor sweeping up into a wall) behind
 * the glass that only draws into three's transmission pass, so the glass refracts light instead of
 * the navy card, down to its feet, while the canvas itself stays clear. Off (fully transparent, so
 * skipped by the pass) in the light theme.
 */
function backGlow(parent: THREE.Object3D, width = 5.2) {
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
  // Bright across the middle, fading to the card colour at the sides and the ends.
  const map = paintTexture(64, 64, (u, v) => {
    const across = smoothstep(0, 0.3, u) * smoothstep(1, 0.7, u);
    const along = smoothstep(0, 0.25, v) * smoothstep(1, 0.8, v);
    const t = across * along;
    return [24 + 150 * t, 29 + 155 * t, 54 + 190 * t];
  });
  const material = themed(new THREE.MeshBasicMaterial({ map, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }), {
    light: { opacity: 0 },
  });
  const glow = mesh(parent, geometry, material);
  glow.renderOrder = -5;
  glow.userData.frameIgnore = true;
  glow.onBeforeRender = (renderer) => {
    material.colorWrite = renderer.getRenderTarget() !== null;
  };
  return glow;
}

let causticMap: (() => THREE.Texture) | undefined;
/** The floor under a glass piece: a cool shadow with a bright caustic of `hue` inside it. */
function floor(parent: THREE.Object3D, width: number, depth: number, hue: number, x = 0, z = 0) {
  parent.add(contactShadow(width, depth, { opacity: 0.32, color: 0x1b1840, x, z, y: 0.002 }));
  causticMap ??= () =>
    paintTexture(
      64,
      64,
      (u, v) => {
        const r = Math.hypot(u - 0.5, v - 0.5) * 2;
        const ring = Math.exp(-(((r - 0.55) / 0.16) ** 2)) * 0.8 + Math.exp(-((r / 0.25) ** 2)) * 0.6;
        const a = Math.min(1, ring) * Math.max(0, 1 - r) * 255;
        return [a, a, a];
      },
      { srgb: false },
    );
  const caustic = mesh(
    parent,
    new THREE.PlaneGeometry(width * 0.62, depth * 0.62),
    new THREE.MeshBasicMaterial({
      color: hue,
      alphaMap: causticMap(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    x,
    0.004,
    z,
  );
  caustic.rotation.x = -Math.PI / 2;
  caustic.renderOrder = -1;
  caustic.userData.frameIgnore = true;
}

/* ---------------------------------------------------------------- Subjects */

type Model = (root: THREE.Group, ticks: Tick[]) => void;

const models: Record<Kind, Model> = {
  /** Thought lattice: a hyperboloid of glass rods; its twist breathes, breaking a vermilion band into steps. */
  ai(root, ticks) {
    band(root, hues.vermilion, 3.2, 0.36, 0, 1.0, -1.1);
    band(root, hues.ultramarine, 0.22, 2.1, 0.55, 1.05, -1.3);
    const lattice = group(root, 0, 1.0, 0);
    const glass = opticalGlass({ thickness: 0.25 });
    const geometry = roundedBox(0.12, 1.9, 0.12, 0.05, 2);
    const rods: { rod: THREE.Mesh; phi: number }[] = [];
    const N = 10,
      R = 0.6;
    for (let i = 0; i < N; i++) {
      const phi = (i / N) * TAU;
      const rod = mesh(lattice, geometry, glass, R * Math.cos(phi), 0, R * Math.sin(phi));
      rods.push({ rod, phi });
    }
    floor(root, 2.2, 1.6, hues.vermilion);
    const up = vec(0, 1),
      dir = new THREE.Vector3();
    ticks.push((angle) => {
      const twist = 0.5 + 0.16 * Math.sin(angle);
      for (const { rod, phi } of rods) {
        dir.set(-Math.sin(phi) * Math.sin(twist), Math.cos(twist), Math.cos(phi) * Math.sin(twist));
        rod.quaternion.setFromUnitVectors(up, dir);
      }
      lattice.rotation.y = 0.3 * Math.sin(angle);
      // Keep the rod ends on the floor as the twist changes the height.
      lattice.position.y = 0.95 * Math.cos(twist) + 0.02;
    });
  },

  /** Risk rhythm: a row of glass prisms of rising heights refracts an ultramarine band into a price line. */
  trading(root, ticks) {
    band(root, hues.ultramarine, 3.4, 0.26, 0, 0.42, -1.0);
    disc(root, hues.saffron, 0.32, 1.05, 1.55, -1.25);
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
  backGlow(root);
  return root;
}
