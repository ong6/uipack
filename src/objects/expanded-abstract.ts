// Abstract forms (direction 5): optical glass sculptures standing in front of flat bands of colour.
// The colour lives behind the glass; refraction and dispersion carry the subject. One secondary
// material, polished obsidian. Grounded by a tinted shadow with a caustic of the band's colour.
import * as THREE from "three";
import { contactShadow, lookMaterial, type ObjectLook } from "./look";
import { TAU, vec, type Tick } from "./procedural";
import { group, mesh, paintTexture, roundedBox, type ArtKind } from "./expanded-kit";

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
      hemisphere: { sky: 0x8d92d6, ground: 0x0d0e1a, intensity: 0.5 },
      environment: { intensity: 0.55 },
      rim: { intensity: 3.2 },
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
const obsidian = () => lookMaterial("ceramic", 0x0c0d13, { roughness: 0.08, clearcoatRoughness: 0.03 });

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
/** A flat disc of pure colour. */
function disc(parent: THREE.Object3D, color: number, radius: number, x: number, y: number, z: number) {
  return mesh(parent, new THREE.CircleGeometry(radius, 64), new THREE.MeshBasicMaterial({ color }), x, y, z);
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

const models: Record<ArtKind, Model> = {
  /** Thought lattice: a hyperboloid of glass rods; its twist breathes, breaking a vermilion band into steps. */
  ai(root, ticks) {
    band(root, hues.vermilion, 3.2, 0.36, 0, 1.0, -1.1);
    band(root, hues.ultramarine, 0.22, 2.1, 0.55, 1.05, -1.3);
    const lattice = group(root, 0, 1.0, 0);
    const glass = opticalGlass({ thickness: 0.25 });
    const geometry = roundedBox(0.1, 1.9, 0.1, 0.04, 2);
    const rods: { rod: THREE.Mesh; phi: number }[] = [];
    const N = 14,
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

  /** Elastic exchange: two thick lenses trade a saffron sphere; each leans back as it returns it. */
  tennis(root, ticks) {
    disc(root, hues.ultramarine, 0.95, 0, 0.95, -1.2);
    band(root, hues.vermilion, 3.4, 0.06, 0, 0.55, -1.15);
    // A biconvex lens profile, turned.
    const profile: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const r = 0.62 * Math.sin((t * Math.PI) / 2);
      profile.push(new THREE.Vector2(r, 0.16 * Math.cos((t * Math.PI) / 2) + 0.02));
    }
    for (let i = 24; i >= 0; i--) {
      const t = i / 24;
      profile.push(new THREE.Vector2(0.62 * Math.sin((t * Math.PI) / 2), -0.16 * Math.cos((t * Math.PI) / 2) - 0.02));
    }
    const lensGeometry = new THREE.LatheGeometry(profile, 64);
    lensGeometry.rotateX(Math.PI / 2);
    const glass = opticalGlass({ thickness: 0.6 });
    const lenses = [-1, 1].map((side) => {
      const pivot = group(root, side * 0.85, 0, 0);
      const lens = mesh(pivot, lensGeometry, glass, 0, 0.64, 0);
      lens.rotation.y = side * 0.9;
      floor(root, 1.2, 0.8, hues.saffron, side * 0.85, 0);
      return pivot;
    });
    const ball = mesh(
      root,
      new THREE.SphereGeometry(0.16, 40, 24),
      lookMaterial("ceramic", hues.saffron, { roughness: 0.2 }),
      0,
      0.64,
      0.15,
    );
    const ballShadow = contactShadow(0.4, 0.3, { opacity: 0.35, color: 0x1b1840, y: 0.003 });
    root.add(ballShadow);
    ticks.push((angle) => {
      const s = Math.sin(angle * 2);
      ball.position.x = 0.5 * s;
      ball.position.y = 0.64 + 0.18 * (1 - s * s);
      ballShadow.position.x = ball.position.x;
      const squash = Math.max(0, Math.abs(s) - 0.9) * 10;
      ball.scale.set(1 - 0.18 * squash, 1 + 0.1 * squash, 1 + 0.1 * squash);
      lenses[0].rotation.z = 0.12 * Math.max(0, -s) ** 6;
      lenses[1].rotation.z = -0.12 * Math.max(0, s) ** 6;
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

  /** Signal stack: thick glass plates cantilevered from an obsidian spine, light running up their edges. */
  server(root, ticks) {
    band(root, hues.vermilion, 0.5, 2.0, 0.25, 1.05, -1.0);
    band(root, hues.ultramarine, 3.0, 0.12, 0, 0.3, -1.05);
    const spine = obsidian();
    mesh(root, roundedBox(0.24, 2.0, 0.9, 0.05), spine, -0.95, 1.0, 0);
    const glass = opticalGlass({ thickness: 0.35 });
    const plateGeometry = roundedBox(1.7, 0.14, 0.92, 0.05);
    const edgeGeometry = new THREE.BoxGeometry(1.62, 0.03, 0.02);
    const edges: THREE.MeshBasicMaterial[] = [];
    for (let i = 0; i < 6; i++) {
      const y = 0.2 + i * 0.32;
      const plate = mesh(root, plateGeometry, glass, 0.0, y, 0);
      plate.rotation.y = 0.04 * (i % 2 ? 1 : -1);
      const edge = new THREE.MeshBasicMaterial({ color: hues.saffron, toneMapped: false });
      edges.push(edge);
      mesh(root, edgeGeometry, edge, 0.0, y, 0.47).userData.frameIgnore = true;
    }
    floor(root, 2.4, 1.3, hues.saffron);
    const dim = new THREE.Color(0x6b4a26),
      lit = new THREE.Color(hues.saffron);
    ticks.push((angle) => {
      edges.forEach((edge, i) => {
        // A pulse travels up the stack twice a loop.
        const wave = Math.max(0, Math.cos(angle * 2 - i * 0.7)) ** 6;
        edge.color.copy(dim).lerp(lit, 0.25 + 0.75 * wave);
      });
    });
  },

  /** Passage: a single glass Möbius ribbon standing on edge, two crossing bands seen through its twist. */
  travel(root, ticks) {
    const route = group(root);
    band(route, hues.vermilion, 3.6, 0.22, 0, 1.0, -1.1, 0.42);
    band(route, hues.ultramarine, 3.6, 0.3, 0, 0.9, -1.2, -0.12);
    const U = 160,
      V = 6,
      R = 0.78,
      W = 0.3;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= U; i++) {
      const u = (i / U) * TAU;
      for (let j = 0; j <= V; j++) {
        const v = (j / V - 0.5) * 2 * W;
        const r = R + v * Math.cos(u / 2);
        positions.push(r * Math.cos(u), r * Math.sin(u), v * Math.sin(u / 2));
      }
    }
    for (let i = 0; i < U; i++)
      for (let j = 0; j < V; j++) {
        const a = i * (V + 1) + j,
          b = a + V + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const ribbon = group(root, 0, 1.08, 0);
    mesh(ribbon, geometry, opticalGlass({ side: THREE.DoubleSide, thickness: 0.5 }));
    floor(root, 1.8, 1.0, hues.vermilion);
    ticks.push((angle) => {
      ribbon.rotation.y = 0.45 * Math.sin(angle);
      ribbon.rotation.z = 0.08 * Math.sin(angle * 2);
      route.position.x = 0.15 * Math.sin(angle + 1);
    });
  },

  /** Unwritten: glass and obsidian leaves fanned from one spine, breathing like pages, before a saffron sun. */
  reading(root, ticks) {
    disc(root, hues.saffron, 0.85, 0.15, 1.15, -1.1);
    band(root, hues.ultramarine, 3.2, 0.08, 0, 0.42, -1.05);
    // One curved leaf: a sheet that rises from the spine and bows, 1.4 tall and 0.9 deep.
    const shape = new THREE.Shape();
    const curve = (t: number) => 0.18 * Math.sin(t * Math.PI);
    shape.moveTo(0, 0);
    for (let i = 1; i <= 24; i++) shape.lineTo(curve(i / 24), (i / 24) * 1.4);
    for (let i = 24; i >= 0; i--) shape.lineTo(curve(i / 24) + 0.06, (i / 24) * 1.4);
    shape.closePath();
    const leafGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.9,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 4,
    });
    leafGeometry.translate(0, 0, -0.45);
    const glass = opticalGlass({ thickness: 0.3 }),
      stone = obsidian();
    const leaves: { leaf: THREE.Mesh; base: number; i: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const base = -0.95 + (i / 6) * 1.9;
      const leaf = mesh(root, leafGeometry, i === 3 ? stone : glass, 0, 0.04, 0);
      leaf.rotation.z = -base;
      leaves.push({ leaf, base, i });
    }
    mesh(root, new THREE.CylinderGeometry(0.07, 0.07, 1.0, 24), stone, 0, 0.05, 0).rotation.x = Math.PI / 2;
    floor(root, 2.6, 1.3, hues.saffron);
    ticks.push((angle) => {
      for (const { leaf, base, i } of leaves) leaf.rotation.z = -base * (1 + 0.12 * Math.sin(angle - i * 0.35));
    });
  },
};

export function abstract(kind: ArtKind, ticks: Tick[]) {
  const root = new THREE.Group();
  models[kind](root, ticks);
  return root;
}
