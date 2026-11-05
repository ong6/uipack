// Kinetic sculptures (art direction 2): Calder meets an orrery. A turned stone base with a brass
// bead, a polished brass armature with ball joints at every junction, and glazed ceramic bodies
// that swing, counterbalance and turn. The base never moves; the motion is the mechanism's.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { contactShadow, lookMaterial, shade, themed, type ObjectLook } from "./look";
import { TAU, vec, type Tick } from "./procedural";

type Kind = "ai" | "tennis" | "trading" | "server" | "travel" | "reading";

export const sculptureTokens = {
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
export const PLINTH_TOP = -1.36;

/** The materials one sculpture shares (one instance each, so a scene compiles few programs). */
export function sculptureMaterials() {
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
    // Dark slate stone; at night it lifts a little so the turned profile still reads on a dark card.
    slate: themed(lookMaterial("plastic", K.slate, { roughness: 0.55, envMapIntensity: 0.8 }), {
      dark: { color: shade(K.slate, 0.05) },
    }),
    stone: themed(lookMaterial("plastic", K.stone, { roughness: 0.62, envMapIntensity: 0.6 }), {
      dark: { color: shade(K.stone, -0.42) },
    }),
  };
}
export type SculptureMaterials = ReturnType<typeof sculptureMaterials>;

/* ---------------------------------------------------------------- Geometry helpers */

const UP = new THREE.Vector3(0, 1, 0);
export function rodGeometry(from: THREE.Vector3, to: THREE.Vector3, radius: number) {
  const delta = to.clone().sub(from);
  const g = new THREE.CylinderGeometry(radius, radius, delta.length(), 14, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, delta.clone().normalize()));
  g.translate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
  return g;
}
export function ballGeometry(at: THREE.Vector3, radius: number, segments = 20) {
  return new THREE.SphereGeometry(radius, segments, Math.round(segments * 0.7)).translate(at.x, at.y, at.z);
}

/** Collects static parts per material under one parent, then merges each set into one mesh. */
export class Batch {
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

/** A small strung racket in its own group, butt cap at the origin, head hanging down -y. */
function brassRacket(parent: THREE.Object3D, m: SculptureMaterials) {
  const group = new THREE.Group();
  parent.add(group);
  const b = new Batch(group);
  const HOOP_Y = -0.95,
    RX = 0.27,
    RY = 0.34;
  const hoop = new THREE.TorusGeometry(1, 0.035, 10, 56).scale(RX, RY, 1).translate(0, HOOP_Y, 0);
  b.add(m.brass, hoop);
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.065,
      half = RY * Math.sqrt(1 - (x / RX) ** 2) * 0.96;
    b.add(m.steel, rodGeometry(vec(x, HOOP_Y - half, 0), vec(x, HOOP_Y + half, 0), 0.007));
    const y = i * 0.085,
      halfW = RX * Math.sqrt(1 - (y / RY) ** 2) * 0.96;
    b.add(m.steel, rodGeometry(vec(-halfW, HOOP_Y + y, 0.006), vec(halfW, HOOP_Y + y, 0.006), 0.007));
  }
  b.strut(m.brass, vec(-0.12, HOOP_Y + RY * 0.82, 0), vec(0, -0.42, 0), 0.022, [false, true]);
  b.strut(m.brass, vec(0.12, HOOP_Y + RY * 0.82, 0), vec(0, -0.42, 0), 0.022, [false, false]);
  b.add(m.inkGlaze, new THREE.CylinderGeometry(0.05, 0.05, 0.36, 16).translate(0, -0.22, 0));
  b.add(m.brass, ballGeometry(vec(0, 0, 0), 0.05, 14), new THREE.CylinderGeometry(0.056, 0.056, 0.03, 16).translate(0, -0.04, 0));
  b.done();
  return group;
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

/* ---------------------------------------------------------------- Subjects */

const sculptures: Record<Kind, (root: THREE.Group, m: SculptureMaterials, ticks: Tick[]) => void> = {
  /** A neural orrery: three ceramic bodies on counterweighted arms turning at different rates. */
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
      { y: -0.55, reach: 1.2, back: 0.55, r: 0.27, body: m.bone, turns: 1, phase: -1.29, drop: 0.32 },
      { y: 0.1, reach: 0.92, back: 0.42, r: 0.2, body: m.inkGlaze, turns: -1, phase: 4.38, drop: 0.24 },
      { y: 0.72, reach: 0.64, back: 0.32, r: 0.15, body: m.oxblood, turns: 2, phase: -2.78, drop: 0.18 },
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
      b.add(arm.body, ballGeometry(vec(arm.reach, -arm.drop - arm.r, 0), arm.r, 32));
      b.done();
      // The largest body carries a small brass moon on its own arm.
      let moon: THREE.Group | null = null;
      if (arm.turns === 1) {
        moon = new THREE.Group();
        moon.position.set(arm.reach, -arm.drop - arm.r, 0);
        group.add(moon);
        new Batch(moon)
          .strut(m.brass, vec(0, 0, 0), vec(0.44, 0.05, 0), 0.012, [false, false])
          .add(m.brass, ballGeometry(vec(0.44, 0.05, 0), 0.06))
          .done();
      }
      ticks.push((angle) => {
        group.rotation.y = arm.phase + arm.turns * angle;
        if (moon) moon.rotation.y = 3 * angle;
      });
    }
  },

  /** A ceramic ball on a pendulum arm, counterbalanced by a brass racket that counter-swings. */
  tennis(root, m, ticks) {
    const PIVOT = 0.62;
    new Batch(root)
      .strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, PIVOT - 0.05, 0), 0.04, [false, false])
      .add(m.brass, new THREE.CylinderGeometry(0.1, 0.12, 0.06, 24).translate(0, PLINTH_TOP + 0.03, 0))
      // The yoke that carries the beam's pin.
      .strut(m.brass, vec(0, PIVOT - 0.08, 0), vec(0, PIVOT - 0.08, 0.1), 0.03, [false, false])
      .strut(m.brass, vec(0, PIVOT - 0.08, -0.1), vec(0, PIVOT - 0.08, 0), 0.03, [false, false])
      .strut(m.brass, vec(0, PIVOT - 0.08, 0.1), vec(0, PIVOT, 0.1), 0.026, [false, true])
      .strut(m.brass, vec(0, PIVOT - 0.08, -0.1), vec(0, PIVOT, -0.1), 0.026, [false, true])
      .done();
    const beam = new THREE.Group();
    beam.position.y = PIVOT;
    root.add(beam);
    new Batch(beam)
      .strut(m.brass, vec(-0.78, 0, 0), vec(1.18, 0, 0), 0.03)
      .add(m.agedBrass, new THREE.CylinderGeometry(0.035, 0.035, 0.24, 16).rotateX(Math.PI / 2))
      .done();
    const racketPin = new THREE.Group();
    racketPin.position.x = -0.78;
    beam.add(racketPin);
    const racketModel = brassRacket(racketPin, m);
    racketModel.position.y = -0.06;
    const ballArm = new THREE.Group();
    ballArm.position.x = 1.18;
    beam.add(ballArm);
    const ballBatch = new Batch(ballArm).strut(m.brass, vec(0, 0, 0), vec(0, -0.62, 0), 0.016, [false, false]);
    ballBatch.add(m.optic, ballGeometry(vec(0, -0.62 - 0.21, 0), 0.21, 36));
    // The felt seam, as a bone glaze band.
    ballBatch.add(
      m.bone,
      new THREE.TorusGeometry(0.208, 0.012, 8, 48)
        .rotateY(Math.PI / 2)
        .rotateZ(0.5)
        .translate(0, -0.83, 0),
    );
    ballBatch.done();
    ticks.push((angle) => {
      // A pendulum with a small second harmonic, so it hangs at the ends of its swing.
      const swing = 0.3 * Math.sin(angle) + 0.04 * Math.sin(2 * angle);
      beam.rotation.z = swing;
      racketPin.rotation.z = -swing + 0.22 * Math.sin(angle - 0.9);
      ballArm.rotation.z = -swing - 0.16 * Math.sin(angle - 0.7);
    });
  },

  /** A market balance: ceramic candle weights on two pans, the beam tipping as the market moves. */
  trading(root, m, ticks) {
    const BEAM_Y = 0.9;
    const s = new Batch(root)
      .strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, BEAM_Y, 0), 0.042, [false, false])
      .add(m.brass, new THREE.CylinderGeometry(0.1, 0.13, 0.07, 24).translate(0, PLINTH_TOP + 0.035, 0));
    // A bone ceramic dial behind the pivot with brass ticks.
    s.add(
      m.inkGlaze,
      new THREE.CylinderGeometry(0.42, 0.42, 0.03, 48, 1, false, -Math.PI / 2, Math.PI)
        .rotateX(Math.PI / 2)
        .translate(0, BEAM_Y, -0.08),
    );
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
      const tip = 0.15 * Math.sin(angle) + 0.03 * Math.sin(3 * angle);
      beam.rotation.z = tip;
      for (const [i, pan] of pans.entries()) pan.rotation.z = -tip + 0.05 * Math.sin(angle - 0.8 + i);
    });
  },

  /** Ceramic compute tiles hanging from a brass gantry on linked rods, a slow wave down the stack. */
  server(root, m, ticks) {
    const TOP = 1.3;
    new Batch(root)
      .strut(m.brass, vec(-0.92, PLINTH_TOP, 0), vec(-0.92, TOP, 0), 0.034, [false, true])
      .strut(m.brass, vec(0.92, PLINTH_TOP, 0), vec(0.92, TOP, 0), 0.034, [false, true])
      .strut(m.brass, vec(-0.92, TOP, 0), vec(0.92, TOP, 0), 0.03, [false, false])
      .add(
        m.brass,
        new THREE.CylinderGeometry(0.08, 0.1, 0.05, 20).translate(-0.92, PLINTH_TOP + 0.025, 0),
        new THREE.CylinderGeometry(0.08, 0.1, 0.05, 20).translate(0.92, PLINTH_TOP + 0.025, 0),
      )
      .done();
    const leds = themed(lookMaterial("ceramic", K.celadon, { roughness: 0.2 }), {
      dark: { emissive: 0x7fe0b4, emissiveIntensity: 1.1 },
    });
    const tiles: THREE.Group[] = [];
    const Y = [0.78, 0.3, -0.18, -0.66];
    const HANG = 0.5;
    Y.forEach((y, i) => {
      const tile = new THREE.Group();
      tile.position.y = y;
      root.add(tile);
      tiles.push(tile);
      const b = new Batch(tile);
      const geo = new THREE.BoxGeometry(1.25, 0.14, 0.72, 1, 1, 1);
      b.add(i % 2 ? m.inkGlaze : m.bone, geo);
      for (const x of [-HANG, HANG]) b.add(m.brass, ballGeometry(vec(x, 0.07, 0), 0.03, 12));
      for (let j = 0; j < 6; j++) b.add(j === 4 ? m.oxblood : leds, ballGeometry(vec(-0.42 + j * 0.1, 0, 0.365), 0.032, 12));
      b.add(m.brass, new THREE.BoxGeometry(0.3, 0.02, 0.012).translate(0.38, 0, 0.362));
      b.done();
    });
    // Links: each tile hangs from the one above (the first from the gantry) by two rods, re-aimed every frame.
    const link = new THREE.CylinderGeometry(0.011, 0.011, 1, 8);
    const links: { mesh: THREE.Mesh; top: () => THREE.Vector3; bottom: () => THREE.Vector3 }[] = [];
    const pointOn = (tile: THREE.Group | null, x: number, y: number) => () => {
      if (!tile) return vec(x, TOP, 0);
      tile.updateMatrix();
      return vec(x, y, 0).applyMatrix4(tile.matrix);
    };
    tiles.forEach((tile, i) => {
      for (const x of [-HANG, HANG]) {
        const mesh = new THREE.Mesh(link, m.brass);
        root.add(mesh);
        links.push({ mesh, top: pointOn(i ? tiles[i - 1] : null, x, -0.07), bottom: pointOn(tile, x, 0.07) });
      }
    });
    ticks.push((angle) => {
      tiles.forEach((tile, i) => {
        tile.rotation.y = 0.2 * Math.sin(angle - i * 0.75);
        tile.rotation.z = 0.025 * Math.sin(angle - i * 0.75 + 1.2);
      });
      for (const { mesh, top, bottom } of links) {
        const a = top(),
          b = bottom();
        // Aim from the lower end up: an axis near -Y makes setFromUnitVectors pick an unstable roll.
        const d = a.clone().sub(b);
        mesh.position.copy(a).add(b).multiplyScalar(0.5);
        mesh.scale.set(1, d.length(), 1);
        mesh.quaternion.setFromUnitVectors(UP, d.normalize());
      }
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

  /** A ceramic folio turning on a brass spindle, one leaf rocking between its covers, a bob swinging below. */
  reading(root, m, ticks) {
    const BASE = -0.38;
    new Batch(root)
      .strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, BASE, 0), 0.04, [false, true])
      .add(m.brass, new THREE.CylinderGeometry(0.1, 0.13, 0.07, 24).translate(0, PLINTH_TOP + 0.035, 0))
      .add(m.brass, new THREE.CylinderGeometry(0.14, 0.06, 0.08, 24).translate(0, BASE + 0.07, 0))
      .done();
    const folio = new THREE.Group();
    folio.name = "kinetic-folio";
    folio.position.y = BASE + 0.12;
    root.add(folio);
    const H = 1.25,
      W = 0.8;
    new Batch(folio).strut(m.brass, vec(0, 0, 0), vec(0, H + 0.08, 0), 0.03, [false, true]).done();
    const leaf = (open: number, material: THREE.Material, thick: number) => {
      const hinge = new THREE.Group();
      hinge.rotation.y = open;
      hinge.position.y = H / 2 + 0.04;
      folio.add(hinge);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(W, H, thick).translate(W / 2 + 0.035, 0, 0), material);
      hinge.add(mesh);
      return hinge;
    };
    // The book opens towards +z (local angle -π/2), covers wide, leaves fanned between them.
    const MID = -Math.PI / 2;
    leaf(MID - 1.25, m.inkGlaze, 0.05);
    leaf(MID + 1.25, m.inkGlaze, 0.05);
    const fixedLeaves = new Batch(folio);
    for (const a of [MID - 1.12, MID - 0.98, MID + 0.98, MID + 1.12])
      fixedLeaves.add(
        m.bone,
        new THREE.BoxGeometry(W * 0.96, H * 0.94, 0.016)
          .translate(W * 0.48 + 0.04, 0, 0)
          .rotateY(a)
          .translate(0, H / 2 + 0.04, 0),
      );
    fixedLeaves.done();
    const turning = leaf(0, m.bone, 0.016);
    // A brass bob on a rod swings from the spindle's foot, like a bookmark ribbon made rigid.
    const bob = new THREE.Group();
    bob.position.set(0, 0.02, 0);
    folio.add(bob);
    new Batch(bob)
      .strut(m.brass, vec(0, 0, 0), vec(0, -0.5, 0.32), 0.011, [false, false])
      .add(m.oxblood, ballGeometry(vec(0, -0.5, 0.32), 0.075, 24))
      .done();
    ticks.push((angle) => {
      folio.rotation.y = -0.6 + angle;
      // The leaf rocks from cover to cover twice a turn.
      turning.rotation.y = MID + 0.85 * Math.sin(angle * 2);
      bob.rotation.x = 0.25 * Math.sin(angle * 2 + 0.6);
    });
  },
};

export function kineticLook(): ObjectLook {
  return {
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
        rim: { intensity: 3.4 },
        key: { intensity: 2.4 },
      },
    },
    camera: { projection: "perspective", fov: 28, pitch: 8 },
    framing: { fill: 0.7, maxWidth: 0.8 },
    castShadows: true,
  };
}

export function kineticWorld(kind: Kind, ticks: Tick[]) {
  const root = new THREE.Group();
  const m = sculptureMaterials();
  plinth(root, m);
  sculptures[kind](root, m, ticks);
  return root;
}

export { plinth as sculpturePlinth };
