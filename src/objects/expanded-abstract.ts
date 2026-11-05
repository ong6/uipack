// Abstract forms (direction 5): optical glass sculptures standing in front of flat bands of colour.
// The colour lives behind the glass; refraction and dispersion carry the subject. One secondary
// material, polished obsidian. Grounded by a tinted shadow with a caustic of the band's colour.
import * as THREE from "three";
import { contactShadow, lookMaterial, themed, type ObjectLook } from "./look";
import { TAU, vec, type Tick } from "./procedural";
import { group, mesh, paintTexture, roundedBox, smoothstep, type ArtKind } from "./expanded-kit";

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
let discShade: THREE.Texture | undefined;
/** A disc of colour, lit like a sphere seen far off: lighter toward the key (upper left), deeper at the lower rim. */
function disc(parent: THREE.Object3D, color: number, radius: number, x: number, y: number, z: number) {
  discShade ??= paintTexture(128, 128, (u, v) => {
    const r = Math.hypot(u - 0.5, v - 0.5) * 2;
    const toKey = Math.hypot(u - 0.3, v - 0.72) * 1.4;
    const t = 1.12 - 0.3 * Math.min(1, toKey) ** 1.5 - 0.1 * Math.max(0, r - 0.8) / 0.2;
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

const models: Record<ArtKind, Model> = {
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

  /** Elastic exchange: two thick lenses trade a saffron sphere; each leans back as it returns it. */
  tennis(root, ticks) {
    disc(root, hues.ultramarine, 0.95, 0, 0.95, -1.2);
    band(root, hues.vermilion, 3.4, 0.06, 0, 0.55, -1.15);
    // The disc is the ball: its seam (two interlocking lobes, front half only) painted pale on the
    // blue, with a glass rod laid along it that lifts and bends the line as the light moves.
    const turn = new THREE.Euler(0.1, 0.15, 0.3);
    const seam = Array.from({ length: 241 }, (_, i) => {
      const t = (i / 240) * TAU;
      const a = 0.66,
        b = 0.34,
        c = 2 * Math.sqrt(a * b);
      return vec(a * Math.cos(t) + b * Math.cos(3 * t), a * Math.sin(t) - b * Math.sin(3 * t), c * Math.sin(2 * t))
        .multiplyScalar(0.9)
        .applyEuler(turn);
    });
    const runs: THREE.Vector3[][] = [];
    let run: THREE.Vector3[] = [];
    for (const point of seam) {
      if (point.z > -0.05) run.push(point);
      else if (run.length) (runs.push(run), (run = []));
    }
    if (run.length) runs.push(run);
    const stroke = new THREE.MeshBasicMaterial({ color: 0xeef0ff });
    const seamGlass = opticalGlass({ thickness: 0.4, dispersion: 0.25 });
    for (const points of runs.filter((r) => r.length > 4)) {
      const flat = points.map((p) => vec(p.x, p.y + 0.95, 0));
      const line = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(flat), points.length * 2, 0.03, 6, false).scale(1, 1, 0.05);
      mesh(root, line, stroke, 0, 0, -1.185);
      const lifted = points.map((p) => vec(p.x, p.y + 0.95, -1.05 + 0.12 * Math.max(0, p.z)));
      mesh(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lifted), points.length * 2, 0.06, 12, false), seamGlass).userData.frameIgnore = true;
    }
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

  /** Signal stack: thick glass plates cantilevered from a glass spine, light running up their edges. */
  server(root, ticks) {
    band(root, hues.vermilion, 0.5, 2.0, 0.25, 1.05, -1.0);
    band(root, hues.ultramarine, 3.0, 0.12, 0, 0.3, -1.05);
    // The spine is glass too, tinted ultramarine, so the stack reads light rather than as a black slab.
    const spine = opticalGlass({ thickness: 0.9, attenuationColor: new THREE.Color(0x8796ff), attenuationDistance: 1.2 });
    mesh(root, roundedBox(0.24, 2.0, 0.9, 0.06), spine, -0.95, 1.0, 0);
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

  /** Passage: a glass Möbius ribbon standing on a low ultramarine horizon, a vermilion route arrowing through its twist. */
  travel(root, ticks) {
    band(root, hues.ultramarine, 3.8, 0.16, 0, 0.62, -1.25);
    const route = group(root, 0, 0, -1.1);
    // The route: a ribbon that climbs from the lower left, through the ring, and ends in an arrowhead.
    const path = new THREE.Shape();
    const w = 0.11;
    path.moveTo(-1.8, 0.3 - w);
    path.bezierCurveTo(-0.7, 0.3 - w, -0.3, 1.25 - w, 0.95, 1.25 - w);
    path.lineTo(0.95, 1.25 - w * 2.4);
    path.lineTo(1.45, 1.25);
    path.lineTo(0.95, 1.25 + w * 2.4);
    path.lineTo(0.95, 1.25 + w);
    path.bezierCurveTo(-0.3 - 0.06, 1.25 + w, -0.7 - 0.06, 0.3 + w, -1.8, 0.3 + w);
    path.closePath();
    mesh(route, new THREE.ShapeGeometry(path, 32), new THREE.MeshBasicMaterial({ color: hues.vermilion }));
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
  backGlow(root);
  return root;
}
