// Kinetic sculptures (art direction 2): Calder meets an orrery. A turned stone base with a brass
// bead, a polished brass armature with ball joints at every junction, and glazed ceramic bodies
// that swing, counterbalance and turn. The base never moves; the motion is the mechanism's.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { contactShadow, lookMaterial, shade, themed, type ObjectLook } from "./look";
import { TAU, vec, type Tick } from "./procedural";
import type { KindWithLook } from "./variants";

type Kind = Exclude<KindWithLook<2>, "contact">;

const sculptureTokens = {
  brass: 0xd9b36a,
  agedBrass: 0xa9813f,
  bone: 0xede7dc,
  celadon: 0x9fc2b0,
  inkGlaze: 0x2c4a5a,
  oxblood: 0xb8473a,
  optic: 0xd8dc57,
  slate: 0x2b3238,
  stone: 0xd8cfbf,
};
const K = sculptureTokens;

/** Plinth top, where every armature starts. */
const PLINTH_TOP = -1.36;

/** The materials one sculpture shares (one instance each, so a scene compiles few programs). */
function sculptureMaterials() {
  const ceramic = (color: number) => lookMaterial("ceramic", color, { roughness: 0.2, clearcoatRoughness: 0.05 });
  return {
    brass: lookMaterial("metal", K.brass, { roughness: 0.2 }),
    agedBrass: lookMaterial("metal", K.agedBrass, { roughness: 0.34 }),
    steel: lookMaterial("metal", 0xd4d6d2, { roughness: 0.3 }),
    bone: ceramic(K.bone),
    celadon: ceramic(K.celadon),
    inkGlaze: ceramic(K.inkGlaze),
    oxblood: ceramic(K.oxblood),
    optic: ceramic(K.optic),
    // Dark slate stone; at night it turns a warm grey so the turned profile holds on a navy card.
    slate: themed(lookMaterial("plastic", K.slate, { roughness: 0.55, envMapIntensity: 0.8 }), {
      dark: { color: shade(K.slate, 0.13) },
    }),
    stone: themed(lookMaterial("plastic", K.stone, { roughness: 0.62, envMapIntensity: 0.6 }), {
      dark: { color: shade(K.stone, -0.22) },
    }),
  };
}
type SculptureMaterials = ReturnType<typeof sculptureMaterials>;

/* ---------------------------------------------------------------- Geometry helpers */

const UP = new THREE.Vector3(0, 1, 0);
function rodGeometry(from: THREE.Vector3, to: THREE.Vector3, radius: number) {
  const delta = to.clone().sub(from);
  const g = new THREE.CylinderGeometry(radius, radius, delta.length(), 14, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, delta.clone().normalize()));
  g.translate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
  return g;
}
function ballGeometry(at: THREE.Vector3, radius: number, segments = 20) {
  return new THREE.SphereGeometry(radius, segments, Math.round(segments * 0.7)).translate(at.x, at.y, at.z);
}

/** Collects static parts per material under one parent, then merges each set into one mesh. */
class Batch {
  private sets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  constructor(readonly parent: THREE.Object3D) {}
  add(material: THREE.Material, ...geometries: THREE.BufferGeometry[]) {
    const list = this.sets.get(material) ?? [];
    list.push(...geometries);
    this.sets.set(material, list);
    return this;
  }
  /** A rod with a ball joint (twice its radius) at each end. */
  strut(
    material: THREE.Material,
    from: THREE.Vector3,
    to: THREE.Vector3,
    radius: number,
    joints: [boolean, boolean] = [true, true],
  ) {
    this.add(material, rodGeometry(from, to, radius));
    if (joints[0]) this.add(material, ballGeometry(from, radius * 2, 14));
    if (joints[1]) this.add(material, ballGeometry(to, radius * 2, 14));
    return this;
  }
  done() {
    for (const [material, list] of this.sets) {
      const merged = mergeGeometries(list);
      list.forEach((g) => g.dispose());
      this.parent.add(new THREE.Mesh(merged, material));
    }
    this.sets.clear();
  }
}

/** The turned base: a lathe profile (foot, cove, lip) in slate, a brass bead and a stone top. */
function plinth(root: THREE.Group, m: SculptureMaterials, radius = 1) {
  const profile = [
    [0, -1.68],
    [1.02, -1.68],
    [1.065, -1.655],
    [1.075, -1.6],
    [1.05, -1.565],
    [0.95, -1.545],
    [0.905, -1.51],
    [0.89, -1.45],
    [0.91, -1.415],
    [0.955, -1.395],
    [0.965, -1.375],
    [0.95, -1.36],
    [0, -1.36],
  ].map(([r, y]) => new THREE.Vector2(r * radius, y));
  const batch = new Batch(root);
  batch.add(m.slate, new THREE.LatheGeometry(profile, 72));
  batch.add(m.brass, new THREE.TorusGeometry(0.902 * radius, 0.022, 10, 72).rotateX(Math.PI / 2).translate(0, -1.478, 0));
  batch.add(m.stone, new THREE.CylinderGeometry(0.86 * radius, 0.86 * radius, 0.014, 72).translate(0, PLINTH_TOP + 0.007, 0));
  batch.done();
  root.add(contactShadow(2.7 * radius, 2.7 * radius, { y: -1.68, opacity: 0.42, color: 0x1a140c }));
}

/** Procedural equirectangular land map for the globe: bone continents on celadon glaze. */
function globeTexture() {
  const w = 256,
    h = 128;
  let seed = 0x51ce;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0), seed / 4294967296);
  const blobs = Array.from({ length: 26 }, () => ({ x: random() * w, y: 20 + random() * (h - 40), r: 6 + random() * 12 }));
  const data = new Uint8Array(w * h * 4);
  const ocean = new THREE.Color(K.celadon),
    land = new THREE.Color(K.bone);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (const b of blobs) {
        const dx = Math.min(Math.abs(x - b.x), w - Math.abs(x - b.x)),
          dy = y - b.y;
        v += Math.exp(-(dx * dx + dy * dy) / (b.r * b.r));
      }
      v += 0.25 * Math.sin(x * 0.22 + y * 0.15) * Math.sin(y * 0.35);
      // A soft shoreline: blend over a narrow band instead of a hard pixel step.
      const c = ocean.clone().lerp(land, Math.min(1, Math.max(0, (v - 0.66) / 0.08)));
      data.set([c.r * 255, c.g * 255, c.b * 255, 255].map(Math.round), (y * w + x) * 4);
    }
  const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * The AI weight: a square ink-glaze chip package with brass pins on all four edges and a bone die
 * printed with a small brass neural glyph (three nodes, three links). Faces +z; `r` is its half size.
 */
function chip(b: Batch, m: SculptureMaterials, at: THREE.Vector3, r: number) {
  const T = 0.09;
  b.add(m.inkGlaze, new RoundedBoxGeometry(2 * r, 2 * r, T, 3, 0.03).translate(at.x, at.y, at.z));
  for (let i = 0; i < 5; i++) {
    const u = -r * 0.66 + (i * r * 1.32) / 4;
    for (const side of [-1, 1]) {
      b.add(m.brass, new THREE.BoxGeometry(0.1, 0.035, 0.03).translate(at.x + side * (r + 0.04), at.y + u, at.z));
      b.add(m.brass, new THREE.BoxGeometry(0.035, 0.1, 0.03).translate(at.x + u, at.y + side * (r + 0.04), at.z));
    }
  }
  const z = at.z + T / 2;
  b.add(m.bone, new RoundedBoxGeometry(1.15 * r, 1.15 * r, 0.03, 2, 0.012).translate(at.x, at.y, z));
  const nodes = [vec(-0.26, -0.2, 0), vec(0.26, -0.2, 0), vec(0, 0.26, 0)].map((p) =>
    p.multiplyScalar(r * 1.0).add(vec(at.x, at.y, z + 0.022)),
  );
  nodes.forEach((p, i) => b.add(m.brass, rodGeometry(p, nodes[(i + 1) % 3], 0.012), ballGeometry(p, 0.04, 14)));
  b.add(m.oxblood, ballGeometry(vec(at.x, at.y - r * 0.04, z + 0.022), 0.035, 14));
}

/* ---------------------------------------------------------------- Subjects */

const sculptures: Record<Kind, (root: THREE.Group, m: SculptureMaterials, ticks: Tick[]) => void> = {
  /** A neural orrery: a glazed silicon chip and two ceramic nodes on counterweighted arms turning at different rates. */
  ai(root, m, ticks) {
    const TOP = 1.08;
    new Batch(root)
      .strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, TOP, 0), 0.034, [false, false])
      .add(
        m.brass,
        ballGeometry(vec(0, TOP + 0.06, 0), 0.085),
        new THREE.CylinderGeometry(0.09, 0.11, 0.06, 24).translate(0, PLINTH_TOP + 0.03, 0),
      )
      .done();
    const arms: {
      y: number;
      reach: number;
      back: number;
      r: number;
      body: THREE.Material;
      turns: number;
      phase: number;
      drop: number;
    }[] = [
      { y: -0.34, reach: 1.1, back: 0.55, r: 0.3, body: m.inkGlaze, turns: 1, phase: -1.29, drop: 0.16 },
      { y: 0.24, reach: 0.92, back: 0.42, r: 0.21, body: m.bone, turns: -1, phase: 4.38, drop: 0.24 },
      { y: 0.8, reach: 0.64, back: 0.32, r: 0.16, body: m.oxblood, turns: 2, phase: -2.78, drop: 0.18 },
    ];
    for (const arm of arms) {
      const group = new THREE.Group();
      group.position.y = arm.y;
      root.add(group);
      const b = new Batch(group);
      b.strut(m.brass, vec(-arm.back, 0, 0), vec(arm.reach, 0, 0), 0.024, [false, true]);
      b.add(m.brass, new THREE.CylinderGeometry(0.06, 0.06, 0.1, 20));
      b.strut(m.brass, vec(arm.reach, 0, 0), vec(arm.reach, -arm.drop, 0), 0.016, [false, false]);
      b.add(m.agedBrass, ballGeometry(vec(-arm.back, 0, 0), arm.r * 0.55));
      if (arm.turns === 1) chip(b, m, vec(arm.reach, -arm.drop - arm.r, 0), arm.r);
      else b.add(arm.body, ballGeometry(vec(arm.reach, -arm.drop - arm.r, 0), arm.r, 32));
      b.done();
      ticks.push((angle) => {
        group.rotation.y = arm.phase + arm.turns * angle;
      });
    }
  },

  /** A market balance: ceramic candle weights on two pans, the beam tipping as the market moves. */
  trading(root, m, ticks) {
    const BEAM_Y = 0.9;
    const s = new Batch(root)
      .strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, BEAM_Y, 0), 0.042, [false, false])
      .add(m.brass, new THREE.CylinderGeometry(0.1, 0.13, 0.07, 24).translate(0, PLINTH_TOP + 0.035, 0));
    // A bone ceramic gauge above the pivot, rimmed in brass, with brass ticks for the pointer.
    s.add(
      m.bone,
      new THREE.CylinderGeometry(0.42, 0.42, 0.03, 48, 1, false, -Math.PI / 2, Math.PI)
        .rotateX(Math.PI / 2)
        .translate(0, BEAM_Y, -0.08),
    );
    s.add(m.brass, new THREE.TorusGeometry(0.42, 0.016, 8, 48, Math.PI).translate(0, BEAM_Y, -0.08));
    for (let i = -4; i <= 4; i++) {
      const a = (i / 4) * 0.7;
      s.add(
        m.brass,
        rodGeometry(
          vec(Math.sin(a) * 0.3, BEAM_Y + Math.cos(a) * 0.3, -0.06),
          vec(Math.sin(a) * 0.38, BEAM_Y + Math.cos(a) * 0.38, -0.06),
          i === 0 ? 0.012 : 0.008,
        ),
      );
    }
    s.done();
    const beam = new THREE.Group();
    beam.position.y = BEAM_Y;
    root.add(beam);
    new Batch(beam)
      .strut(m.brass, vec(-1.12, 0, 0), vec(1.12, 0, 0), 0.032)
      .add(m.brass, ballGeometry(vec(0, 0, 0), 0.085))
      .strut(m.brass, vec(0, 0, 0.02), vec(0, 0.36, 0.02), 0.012, [false, true])
      .done();
    const HEIGHTS = [
      [0.26, 0.42, 0.34],
      [0.36, 0.5, 0.3],
    ];
    const pans: THREE.Group[] = [];
    for (const [side, glaze] of [
      [-1, m.celadon],
      [1, m.oxblood],
    ] as const) {
      const pan = new THREE.Group();
      pan.position.x = side * 1.12;
      beam.add(pan);
      pans.push(pan);
      const b = new Batch(pan);
      for (const a of [0, TAU / 3, (2 * TAU) / 3])
        b.add(m.brass, rodGeometry(vec(0, 0, 0), vec(Math.cos(a + 0.5) * 0.36, -0.92, Math.sin(a + 0.5) * 0.36), 0.008));
      b.add(m.brass, ballGeometry(vec(0, 0, 0), 0.05));
      const dish = [
        [0, -1.0],
        [0.36, -0.995],
        [0.44, -0.95],
        [0.46, -0.92],
        [0.43, -0.93],
        [0.34, -0.975],
        [0, -0.98],
      ].map(([r, y]) => new THREE.Vector2(r, y));
      b.add(m.bone, new THREE.LatheGeometry(dish, 40));
      HEIGHTS[side < 0 ? 0 : 1].forEach((h, i) => {
        const x = (i - 1) * 0.22;
        b.add(glaze, new THREE.CylinderGeometry(0.075, 0.075, h, 24).translate(x, -0.98 + h / 2, (i % 2) * 0.08 - 0.04));
        b.add(
          m.brass,
          rodGeometry(vec(x, -0.98 + h, (i % 2) * 0.08 - 0.04), vec(x, -0.98 + h + 0.12, (i % 2) * 0.08 - 0.04), 0.008),
        );
      });
      b.done();
    }
    ticks.push((angle) => {
      const tip = 0.24 * Math.sin(angle) + 0.04 * Math.sin(3 * angle);
      beam.rotation.z = tip;
      for (const [i, pan] of pans.entries()) pan.rotation.z = -tip + 0.08 * Math.sin(angle - 0.8 + i);
    });
  },

  /** A celadon globe in a tilted brass meridian on a cradle; a brass plane circles on an arm. */
  travel(root, m, ticks) {
    const C = 0.18; // globe centre
    const R = 0.74;
    const fork = new Batch(root);
    fork.strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, C - 1.02, 0), 0.042, [false, true]);
    fork.add(m.brass, new THREE.CylinderGeometry(0.1, 0.13, 0.07, 24).translate(0, PLINTH_TOP + 0.035, 0));
    // The cradle: the lower half ring that carries the meridian's pins.
    fork.add(m.brass, new THREE.TorusGeometry(1.0, 0.036, 12, 64, Math.PI).rotateZ(Math.PI).translate(0, C, 0));
    for (const side of [-1, 1]) fork.add(m.brass, ballGeometry(vec(side * 1.0, C, 0), 0.06));
    fork.done();
    const meridian = new THREE.Group();
    meridian.position.y = C;
    meridian.rotation.x = -0.36;
    root.add(meridian);
    new Batch(meridian)
      .add(m.agedBrass, new THREE.TorusGeometry(0.88, 0.03, 12, 72))
      .strut(m.brass, vec(-0.98, 0, 0), vec(-0.88, 0, 0), 0.03, [false, false])
      .strut(m.brass, vec(0.88, 0, 0), vec(0.98, 0, 0), 0.03, [false, false])
      .strut(m.brass, vec(0, -0.9, 0), vec(0, -R, 0), 0.02, [false, false])
      .strut(m.brass, vec(0, R, 0), vec(0, 0.9, 0), 0.02, [false, false])
      .add(m.brass, ballGeometry(vec(0, 0.92, 0), 0.045))
      .done();
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(R, 48, 32),
      lookMaterial("ceramic", 0xffffff, { roughness: 0.22, clearcoatRoughness: 0.05, map: globeTexture() }),
    );
    globe.material.map!.colorSpace = THREE.SRGBColorSpace;
    meridian.add(globe);
    // The plane's arm turns about the globe's axis from the north pin.
    const arm = new THREE.Group();
    arm.position.y = 0.92;
    meridian.add(arm);
    const b = new Batch(arm);
    b.strut(m.brass, vec(0, 0, 0), vec(0.62, 0.12, 0), 0.022, [false, true]);
    b.strut(m.brass, vec(0.62, 0.12, 0), vec(1.02, -0.52, 0), 0.02, [false, true]);
    // A tiny brass plane at the arm's tip, nose along its path (-z).
    const plane = new THREE.Group();
    plane.position.set(1.02, -0.52, 0);
    plane.scale.setScalar(1.7);
    arm.add(plane);
    const p = new Batch(plane);
    p.add(m.brass, new THREE.CapsuleGeometry(0.035, 0.26, 6, 14).rotateX(Math.PI / 2));
    p.add(m.brass, new THREE.BoxGeometry(0.42, 0.014, 0.09).translate(0, 0, -0.02));
    p.add(m.brass, new THREE.BoxGeometry(0.16, 0.012, 0.05).translate(0, 0, 0.13));
    p.add(m.oxblood, new THREE.BoxGeometry(0.012, 0.08, 0.06).translate(0, 0.04, 0.14));
    p.done();
    b.done();
    ticks.push((angle) => {
      globe.rotation.y = angle;
      arm.rotation.y = -angle + 0.9;
      plane.rotation.z = 0.25 * Math.sin(angle * 2);
    });
  },
};

/** The kinetic rig. The sculpture fills 0.8 of the frame's height, so the mechanism, not the empty card, carries a small card. */
export const kineticLook: ObjectLook = {
  rig: {
    both: {
      toneMapping: "aces",
      environment: { kind: "softbox", intensity: 0.7, rotation: 0.5 },
      key: { color: 0xffe9c9, intensity: 2.3, position: [-3, 5, 5], shadowRadius: 6, shadowMapSize: 1024 },
      rim: { color: 0x9cc3ff, position: [4, 3, -4] },
    },
    light: {
      exposure: 1.05,
      reflections: 1.05,
      hemisphere: { sky: 0xf4efe6, ground: 0x6b6258, intensity: 0.75 },
      rim: { intensity: 1.6 },
    },
    dark: {
      exposure: 1.05,
      reflections: 1.0,
      hemisphere: { sky: 0x9fb2d0, ground: 0x101418, intensity: 0.2 },
      rim: { intensity: 3.6, color: 0xa9c8ff },
      key: { intensity: 2.5 },
      // A warm kicker from back left: a second rim along the brass and the plinth's edge.
      fill: { color: 0xffd29a, intensity: 1.6, position: [-5, 2.5, -3.5] },
      environment: { intensity: 0.9 },
    },
  },
  camera: { projection: "perspective", fov: 28, pitch: 8 },
  framing: { fill: 0.8, maxWidth: 0.82 },
  castShadows: true,
};

export function kineticWorld(kind: Kind, ticks: Tick[]) {
  const root = new THREE.Group();
  const m = sculptureMaterials();
  plinth(root, m);
  sculptures[kind](root, m, ticks);
  return root;
}
