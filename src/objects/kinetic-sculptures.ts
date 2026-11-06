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

/* ---------------------------------------------------------------- Surface finishes */

/** Value noise in GLSL, shared by the glaze, brass and slate finishes (object space, so no UVs needed). */
const NOISE_GLSL = /* glsl */ `
varying vec3 vFinish;
float fHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float fNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fHash(i), fHash(i + vec3(1, 0, 0)), f.x), mix(fHash(i + vec3(0, 1, 0)), fHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(fHash(i + vec3(0, 0, 1)), fHash(i + vec3(1, 0, 1)), f.x), mix(fHash(i + vec3(0, 1, 1)), fHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
vec3 fGrad(vec3 p) {
  return vec3(fNoise(p + vec3(0.5, 0, 0)) - fNoise(p - vec3(0.5, 0, 0)), fNoise(p + vec3(0, 0.5, 0)) - fNoise(p - vec3(0, 0.5, 0)),
    fNoise(p + vec3(0, 0, 0.5)) - fNoise(p - vec3(0, 0, 0.5)));
}
`;

/**
 * Give a material a procedural surface in object space: `color`, `rough` and `normal` are GLSL
 * run after three's colour, roughness and normal chunks (`p` is the object-space position).
 */
export function surfaceFinish<M extends THREE.MeshStandardMaterial>(
  material: M,
  key: string,
  parts: { color?: string; rough?: string; normal?: string; coat?: string },
) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vFinish;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFinish = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${NOISE_GLSL}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\nvec3 p = vFinish;\n${parts.color ?? ""}`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\n${parts.rough ?? ""}`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n${parts.normal ?? ""}`)
      .replace("#include <clearcoat_normal_fragment_maps>", `#include <clearcoat_normal_fragment_maps>\n${parts.coat ?? ""}`);
  };
  material.customProgramCacheKey = () => `finish-${key}`;
  return material;
}

/**
 * Glazed stoneware: a soft body under a hard clear glaze (two lobes, not plastic's one), mottled
 * colour where the glaze ran thick and thin, iron speckle through it, and an orange-peel ripple in
 * the glaze's own reflection.
 */
function glazeFinish(material: THREE.MeshPhysicalMaterial) {
  material.setValues({ roughness: 0.46, clearcoat: 1, clearcoatRoughness: 0.035, ior: 1.52 });
  return surfaceFinish(material, "glaze", {
    color: `float mottle = fNoise(p * 4.0) * 0.6 + fNoise(p * 11.0) * 0.4;
      diffuseColor.rgb *= 0.88 + 0.22 * mottle;
      float fleck = smoothstep(0.8, 0.86, fNoise(p * 34.0 + 7.0)) * smoothstep(0.35, 0.6, fNoise(p * 3.0 + 2.0));
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.3 + vec3(0.05, 0.03, 0.02), fleck * 0.85);`,
    rough: "roughnessFactor = clamp(roughnessFactor + 0.2 * (mottle - 0.5), 0.05, 1.0);",
    normal: "vec3 peel = fGrad(p * 16.0); normal = normalize(normal + 0.22 * peel);",
    coat: "clearcoatNormal = normalize(clearcoatNormal + 0.12 * peel);",
  });
}

/** Polished brass with turning marks: fine rings of roughness across each part, so highlights glint and break. */
function brassFinish(material: THREE.MeshStandardMaterial) {
  return surfaceFinish(material, "brass", {
    rough:
      "float rings = fNoise(vec3(p.y * 150.0, p.x * 4.0, p.z * 4.0)); roughnessFactor = clamp(roughnessFactor * (0.85 + 0.3 * rings), 0.04, 1.0);",
    normal: "normal = normalize(normal + 0.012 * fGrad(p * 60.0));",
  });
}

/** Honed slate: a cleft grain of darker and paler laminations and a faint sheen variation. */
function slateFinish(material: THREE.MeshStandardMaterial) {
  return surfaceFinish(material, "slate", {
    color: `float bed = fNoise(vec3(p.x * 2.0, p.y * 38.0, p.z * 2.0)) * 0.7 + fNoise(p * 9.0) * 0.3;
      diffuseColor.rgb *= 0.82 + 0.32 * bed;`,
    rough: "roughnessFactor = clamp(roughnessFactor + 0.18 * (bed - 0.5), 0.2, 1.0);",
    normal: "normal = normalize(normal + 0.08 * fGrad(p * 22.0));",
  });
}

/**
 * The materials one sculpture shares (one instance each, so a scene compiles few programs). `night`
 * keeps the slate dark in the dark theme (the scene lights it with a pool instead); without it the
 * slate turns a warm grey, for scenes that bring no light of their own.
 */
export function sculptureMaterials(night = false) {
  const ceramic = (color: number) => glazeFinish(lookMaterial("ceramic", color) as THREE.MeshPhysicalMaterial);
  return {
    brass: brassFinish(lookMaterial("metal", K.brass, { roughness: 0.17 })),
    agedBrass: brassFinish(lookMaterial("metal", K.agedBrass, { roughness: 0.3 })),
    steel: lookMaterial("metal", 0xd4d6d2, { roughness: 0.3 }),
    bone: ceramic(K.bone),
    celadon: ceramic(K.celadon),
    inkGlaze: ceramic(K.inkGlaze),
    oxblood: ceramic(K.oxblood),
    optic: ceramic(K.optic),
    /** One glaze for every turned ceramic body: colour per vertex (see `glazed`), so pooling and breaks cost no extra program. */
    glaze: glazeFinish(lookMaterial("ceramic", 0xffffff, { vertexColors: true }) as THREE.MeshPhysicalMaterial),
    slate: themed(slateFinish(lookMaterial("plastic", K.slate, { roughness: 0.5, envMapIntensity: 0.8 })), {
      dark: { color: night ? shade(K.slate, -0.05) : shade(K.slate, 0.13) },
    }),
    stone: themed(slateFinish(lookMaterial("plastic", K.stone, { roughness: 0.58, envMapIntensity: 0.6 })), {
      dark: { color: shade(K.stone, night ? -0.38 : -0.22) },
    }),
  };
}

/**
 * Run `apply(dark)` every frame with the theme mount.ts applied: an invisible probe material is
 * themed, and its roughness tells the scene which theme it is in. Lets a scene own lights that only
 * one theme uses (a pool of lamplight at night).
 */
export function themeSwitch(root: THREE.Object3D, ticks: Tick[], apply: (dark: boolean) => void) {
  const probe = new THREE.Mesh(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(9), 3)),
    themed(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), {
      light: { opacity: 1 },
      dark: { opacity: 0.5 },
    }),
  );
  probe.visible = false;
  probe.userData.frameIgnore = true;
  root.add(probe);
  ticks.push(() => apply(probe.material.opacity < 0.75));
}
export type SculptureMaterials = ReturnType<typeof sculptureMaterials>;

/* ---------------------------------------------------------------- Geometry helpers */

const WHITE = new THREE.Color(0xffffff);
/**
 * Paint a ceramic body's glaze per vertex: the colour pools darker towards the bottom, breaks paler
 * over the top, and below `foot` (a share of the height) the raw bisque shows, as on thrown pottery.
 */
function glazed(geometry: THREE.BufferGeometry, color: number, foot = 0) {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const span = Math.max(1e-6, max.y - min.y);
  const base = new THREE.Color(color),
    pool = base.clone().multiplyScalar(0.72),
    bisque = new THREE.Color(K.stone).multiplyScalar(0.92);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const t = (position.getY(i) - min.y) / span;
    if (t < foot) c.copy(bisque);
    else if (t < 0.4) c.copy(base).lerp(pool, ((0.4 - t) / 0.4) ** 1.4);
    else c.copy(base).lerp(WHITE, Math.max(0, (t - 0.72) / 0.28) * 0.16);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

/**
 * A thrown ceramic bead, unit size: a full belly, a turned shoulder and neck at the top, and a short
 * foot ring at the bottom where the glaze stops and the raw clay shows (as on a real pot).
 */
function beadProfile() {
  const points: THREE.Vector2[] = [new THREE.Vector2(0, -0.98), new THREE.Vector2(0.3, -0.98), new THREE.Vector2(0.33, -0.9)];
  for (let i = 0; i <= 14; i++) {
    const a = -1.2 + (i / 14) * 2.45; // from just above the foot over the belly to the shoulder
    points.push(new THREE.Vector2(Math.cos(a) * (1 - 0.06 * Math.max(0, a)), Math.sin(a) * 0.92));
  }
  points.push(new THREE.Vector2(0.24, 0.96), new THREE.Vector2(0.2, 1.04), new THREE.Vector2(0, 1.05));
  return points;
}
const BEAD = beadProfile();

/** A glazed ceramic bob: a thrown bead with a foot ring, and a brass cap where its hanger meets it. */
function bob(b: Batch, m: SculptureMaterials, at: THREE.Vector3, r: number, color: number) {
  b.add(m.glaze, glazed(new THREE.LatheGeometry(BEAD, 40).scale(r, r, r).translate(at.x, at.y, at.z), color, 0.04));
  b.add(m.brass, new THREE.CylinderGeometry(r * 0.24, r * 0.3, r * 0.16, 18).translate(at.x, at.y + r * 1.07, at.z));
}

/** A turned porcelain foot (like an insulator: three ribs) where a column meets the stone top. */
function foot(b: Batch, m: SculptureMaterials, x: number, color = K.celadon, z = 0) {
  const profile = [
    [0, 0],
    [0.17, 0],
    [0.18, 0.025],
    [0.13, 0.06],
    [0.15, 0.085],
    [0.1, 0.12],
    [0.12, 0.145],
    [0.075, 0.18],
    [0.07, 0.22],
    [0, 0.22],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  b.add(m.glaze, glazed(new THREE.LatheGeometry(profile, 40).translate(x, PLINTH_TOP, z), color));
}

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

/**
 * The base each sculpture stands on, all with their top at PLINTH_TOP and cut from the same slate
 * with a brass bead and a honed stone top: `turned` (a lathe profile), `bench` (a long slab for
 * balances) or `drum` (a low wide disc).
 */
type BaseForm = "turned" | "bench" | "drum";
function base(root: THREE.Group, m: SculptureMaterials, form: BaseForm) {
  if (form === "turned") return plinth(root, m);
  const batch = new Batch(root);
  const top = PLINTH_TOP;
  if (form === "drum") {
    const profile = [
      [0, -1.6],
      [1.18, -1.6],
      [1.22, -1.575],
      [1.22, -1.43],
      [1.17, -1.4],
      [1.12, -1.385],
      [1.12, top],
      [0, top],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    batch.add(m.slate, new THREE.LatheGeometry(profile, 80));
    batch.add(m.brass, new THREE.TorusGeometry(1.215, 0.024, 10, 80).rotateX(Math.PI / 2).translate(0, -1.5, 0));
    batch.add(m.stone, new THREE.CylinderGeometry(1.06, 1.06, 0.014, 80).translate(0, top + 0.007, 0));
    batch.done();
    root.add(contactShadow(3.1, 3.1, { y: -1.6, opacity: 0.42, color: 0x1a140c }));
    return;
  }
  // The bench: a rounded slate slab, a brass bead along the front and back, a stone top inset.
  const [w, h, d, y] = [2.95, 0.28, 1.0, top - 0.14];
  batch.add(m.slate, new RoundedBoxGeometry(w, h, d, 3, 0.035).translate(0, y, 0));
  for (const z of [-d / 2 - 0.004, d / 2 + 0.004])
    batch.add(m.brass, new THREE.CylinderGeometry(0.018, 0.018, w - 0.1, 10).rotateZ(Math.PI / 2).translate(0, y - h * 0.12, z));
  batch.add(m.stone, new RoundedBoxGeometry(w - 0.14, 0.02, d - 0.14, 2, 0.008).translate(0, top + 0.002, 0));
  batch.done();
  root.add(contactShadow(w + 0.7, d + 0.7, { y: y - h / 2, opacity: 0.42, color: 0x1a140c }));
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
      // The top edge's middle pin gives way to the hanger's clamp.
      if (!(side > 0 && i === 2))
        b.add(m.brass, new THREE.BoxGeometry(0.035, 0.1, 0.03).translate(at.x + u, at.y + side * (r + 0.04), at.z));
    }
  }
  // The hanger's clamp: a brass yoke gripping the package's top edge on both faces, with a bead on top
  // for the hanging rod to seat in.
  b.add(m.brass, new THREE.BoxGeometry(0.2, 0.15, T + 0.05).translate(at.x, at.y + r + 0.03, at.z));
  b.add(m.brass, ballGeometry(vec(at.x, at.y + r + 0.12, at.z), 0.05, 16));
  const z = at.z + T / 2;
  b.add(m.bone, new RoundedBoxGeometry(1.15 * r, 1.15 * r, 0.03, 2, 0.012).translate(at.x, at.y, z));
  const nodes = [vec(-0.26, -0.2, 0), vec(0.26, -0.2, 0), vec(0, 0.26, 0)].map((p) =>
    p.multiplyScalar(r * 1.0).add(vec(at.x, at.y, z + 0.022)),
  );
  nodes.forEach((p, i) => b.add(m.brass, rodGeometry(p, nodes[(i + 1) % 3], 0.018), ballGeometry(p, 0.048, 14)));
  b.add(m.oxblood, ballGeometry(vec(at.x, at.y - r * 0.04, z + 0.022), 0.035, 14));
}

/* ---------------------------------------------------------------- Subjects */

const sculptures: Record<Kind, (root: THREE.Group, m: SculptureMaterials, ticks: Tick[]) => void> = {
  /** A neural orrery: a glazed silicon chip and two ceramic nodes on counterweighted arms turning at different rates. */
  ai(root, m, ticks) {
    const TOP = 1.08;
    const stand = new Batch(root)
      .strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, TOP, 0), 0.06, [false, false])
      .add(m.brass, ballGeometry(vec(0, TOP + 0.07, 0), 0.1));
    foot(stand, m, 0, K.inkGlaze);
    stand.done();
    const arms: {
      y: number;
      reach: number;
      back: number;
      r: number;
      body: number;
      weight: number;
      turns: number;
      phase: number;
      drop: number;
    }[] = [
      // Heights keep every hanging body clear of the arm below it (and the chip clear of the stone top).
      { y: -0.38, reach: 1.08, back: 0.52, r: 0.28, body: K.inkGlaze, weight: K.celadon, turns: 1, phase: -1.29, drop: 0.1 },
      { y: 0.3, reach: 0.9, back: 0.42, r: 0.24, body: K.bone, weight: K.inkGlaze, turns: -1, phase: 4.38, drop: 0.1 },
      { y: 0.87, reach: 0.64, back: 0.34, r: 0.18, body: K.oxblood, weight: K.celadon, turns: 2, phase: -2.78, drop: 0.1 },
    ];
    for (const arm of arms) {
      const group = new THREE.Group();
      group.position.y = arm.y;
      root.add(group);
      const b = new Batch(group);
      b.strut(m.brass, vec(-arm.back, 0, 0), vec(arm.reach, 0, 0), 0.046, [false, true]);
      b.add(m.brass, new THREE.CylinderGeometry(0.09, 0.09, 0.13, 24));
      b.strut(m.brass, vec(arm.reach, 0, 0), vec(arm.reach, -arm.drop, 0), 0.036, [false, false]);
      // A glazed counterweight at the short end, hung tight under the arm.
      bob(b, m, vec(-arm.back, -arm.r * 0.58, 0), arm.r * 0.5, arm.weight);
      // The chip hangs from a clamp on its top edge: the rod runs into the clamp's bead.
      if (arm.turns === 1) chip(b, m, vec(arm.reach, -arm.drop - arm.r - 0.12, 0), arm.r);
      else bob(b, m, vec(arm.reach, -arm.drop - arm.r * 1.1, 0), arm.r, arm.body);
      b.done();
      ticks.push((angle) => {
        group.rotation.y = arm.phase + arm.turns * angle;
      });
    }
  },

  /** A market balance: ceramic candle weights on two pans, the beam tipping as the market moves. */
  trading(root, m, ticks) {
    const BEAM_Y = 0.9;
    const s = new Batch(root).strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, BEAM_Y, 0), 0.054, [false, false]);
    foot(s, m, 0, K.inkGlaze);
    // A porcelain dial behind the pivot: a domed bone face in a brass bezel, a celadon (rising) and an
    // oxblood (falling) glaze arc, and ink-glaze ticks for the beam's pointer.
    const DIAL = 0.46,
      DZ = -0.12;
    const dome = Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      return new THREE.Vector2(DIAL * Math.sin((t * Math.PI) / 2), 0.07 * Math.cos((t * Math.PI) / 2));
    });
    dome.push(new THREE.Vector2(DIAL, 0));
    const face = new THREE.LatheGeometry(dome.reverse(), 64).rotateX(Math.PI / 2).translate(0, BEAM_Y, DZ);
    // Shade the porcelain by its own normal-ish height: paler at the crown, cooler to the rim.
    face.computeBoundingBox();
    const fp = face.attributes.position,
      fc = new Float32Array(fp.count * 3),
      bone = new THREE.Color(K.bone),
      rim = bone.clone().multiplyScalar(0.82),
      tmp = new THREE.Color();
    for (let i = 0; i < fp.count; i++) {
      const r = Math.hypot(fp.getX(i), fp.getY(i) - BEAM_Y) / DIAL;
      tmp
        .copy(bone)
        .lerp(WHITE, 0.25 * (1 - r))
        .lerp(rim, r ** 3);
      fc.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    face.setAttribute("color", new THREE.BufferAttribute(fc, 3));
    s.add(m.glaze, face);
    s.add(m.brass, new THREE.TorusGeometry(DIAL, 0.032, 12, 72).translate(0, BEAM_Y, DZ + 0.01));
    const arc = (from: number, to: number, color: number) =>
      s.add(
        m.glaze,
        glazed(
          new THREE.RingGeometry(DIAL * 0.46, DIAL * 0.72, 32, 1, Math.PI / 2 - to, to - from).translate(0, BEAM_Y, DZ + 0.066),
          color,
        ),
      );
    arc(-1.15, -0.06, K.oxblood);
    arc(0.06, 1.15, K.celadon);
    for (let i = -4; i <= 4; i++) {
      const a = (i / 4) * 1.15,
        outer = DIAL * (i % 2 ? 0.86 : 0.9);
      s.add(
        m.inkGlaze,
        rodGeometry(
          vec(Math.sin(a) * DIAL * 0.77, BEAM_Y + Math.cos(a) * DIAL * 0.77, DZ + 0.05),
          vec(Math.sin(a) * outer, BEAM_Y + Math.cos(a) * outer, DZ + 0.05),
          i === 0 ? 0.022 : 0.016,
        ),
      );
    }
    s.done();
    const beam = new THREE.Group();
    beam.position.y = BEAM_Y;
    root.add(beam);
    new Batch(beam)
      .strut(m.brass, vec(-1.12, 0, 0), vec(1.12, 0, 0), 0.05)
      .add(m.brass, ballGeometry(vec(0, 0, 0), 0.1))
      .strut(m.brass, vec(0, 0, 0.03), vec(0, DIAL * 0.84, 0.03), 0.024, [false, true])
      .done();
    // The two pans carry the same weight of glaze (mirrored candles); what tips the beam is the rider.
    const HEIGHTS = [
      [0.26, 0.5, 0.36],
      [0.36, 0.5, 0.26],
    ];
    const pans: THREE.Group[] = [];
    for (const [side, glaze] of [
      [-1, K.celadon],
      [1, K.oxblood],
    ] as const) {
      const pan = new THREE.Group();
      pan.position.x = side * 1.12;
      beam.add(pan);
      pans.push(pan);
      const b = new Batch(pan);
      for (const a of [0, TAU / 3, (2 * TAU) / 3])
        b.add(m.brass, rodGeometry(vec(0, 0, 0), vec(Math.cos(a + 0.5) * 0.4, -0.92, Math.sin(a + 0.5) * 0.4), 0.026));
      b.add(m.brass, ballGeometry(vec(0, 0, 0), 0.065));
      // A glazed porcelain dish with a raw foot ring.
      const dish = [
        [0, -1.02],
        [0.38, -1.015],
        [0.48, -0.96],
        [0.51, -0.91],
        [0.475, -0.92],
        [0.37, -0.975],
        [0, -0.98],
      ].map(([r, y]) => new THREE.Vector2(r, y));
      b.add(m.glaze, glazed(new THREE.LatheGeometry(dish, 48), K.bone, 0.12));
      HEIGHTS[side < 0 ? 0 : 1].forEach((h, i) => {
        const x = (i - 1) * 0.25,
          z = (i % 2) * 0.09 - 0.045;
        b.add(m.glaze, glazed(new THREE.CylinderGeometry(0.095, 0.1, h, 28).translate(x, -0.98 + h / 2, z), glaze));
        b.add(m.brass, rodGeometry(vec(x, -0.98 + h, z), vec(x, -0.98 + h + 0.12, z), 0.024));
      });
      b.done();
    }
    // The rider: a glazed ceramic poise that slides along the beam. The beam tips towards whichever
    // side it rides on (a little behind it, as a real balance settles), so the low pan is always the
    // heavier one.
    // It runs on a rail in front of the beam, clear of the pivot and the pointer.
    const RAIL = 0.28;
    new Batch(beam)
      .strut(m.brass, vec(-0.95, 0, RAIL), vec(0.95, 0, RAIL), 0.03)
      .strut(m.brass, vec(-0.95, 0, 0), vec(-0.95, 0, RAIL), 0.03, [false, false])
      .strut(m.brass, vec(0.95, 0, 0), vec(0.95, 0, RAIL), 0.03, [false, false])
      .done();
    const rider = new THREE.Group();
    rider.position.z = RAIL;
    beam.add(rider);
    const r = new Batch(rider);
    r.add(m.glaze, glazed(new THREE.LatheGeometry(BEAD, 36).scale(0.15, 0.15, 0.15).rotateZ(Math.PI / 2), K.oxblood, 0.04));
    r.add(m.brass, new THREE.TorusGeometry(0.06, 0.018, 8, 20).rotateY(Math.PI / 2).translate(-0.16, 0, 0));
    r.add(m.brass, new THREE.TorusGeometry(0.06, 0.018, 8, 20).rotateY(Math.PI / 2).translate(0.16, 0, 0));
    r.done();
    const RIDE = 0.7;
    ticks.push((angle) => {
      rider.position.x = RIDE * Math.sin(angle);
      const tip = -0.22 * Math.sin(angle - 0.35) - 0.03 * Math.sin(3 * angle - 1.05);
      beam.rotation.z = tip;
      for (const [i, pan] of pans.entries()) pan.rotation.z = -tip + 0.08 * Math.sin(angle - 0.8 + i);
    });
  },

  /** A celadon globe in a tilted brass meridian on a cradle; a brass plane circles on an arm. */
  travel(root, m, ticks) {
    const C = 0.18; // globe centre
    const R = 0.74;
    const fork = new Batch(root);
    fork.strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, C - 1.02, 0), 0.054, [false, true]);
    foot(fork, m, 0, K.inkGlaze);
    // The cradle: the lower half ring that carries the meridian's pins.
    fork.add(m.brass, new THREE.TorusGeometry(1.0, 0.044, 12, 64, Math.PI).rotateZ(Math.PI).translate(0, C, 0));
    for (const side of [-1, 1]) fork.add(m.brass, ballGeometry(vec(side * 1.0, C, 0), 0.07));
    fork.done();
    const meridian = new THREE.Group();
    meridian.position.y = C;
    meridian.rotation.x = -0.36;
    root.add(meridian);
    new Batch(meridian)
      .add(m.agedBrass, new THREE.TorusGeometry(0.88, 0.036, 12, 72))
      .strut(m.brass, vec(-0.98, 0, 0), vec(-0.88, 0, 0), 0.036, [false, false])
      .strut(m.brass, vec(0.88, 0, 0), vec(0.98, 0, 0), 0.036, [false, false])
      .strut(m.brass, vec(0, -0.9, 0), vec(0, -R, 0), 0.04, [false, false])
      .strut(m.brass, vec(0, R, 0), vec(0, 0.9, 0), 0.04, [false, false])
      .add(m.brass, ballGeometry(vec(0, 0.92, 0), 0.055))
      .done();
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(R, 48, 32),
      glazeFinish(lookMaterial("ceramic", 0xffffff, { map: globeTexture() }) as THREE.MeshPhysicalMaterial),
    );
    globe.material.map!.colorSpace = THREE.SRGBColorSpace;
    meridian.add(globe);
    // The plane's arm turns about the globe's axis from the north pin.
    const arm = new THREE.Group();
    arm.position.y = 0.92;
    meridian.add(arm);
    const b = new Batch(arm);
    b.strut(m.brass, vec(0, 0, 0), vec(0.62, 0.12, 0), 0.042, [false, true]);
    b.strut(m.brass, vec(0.62, 0.12, 0), vec(1.02, -0.52, 0), 0.038, [false, true]);
    // A tiny brass plane at the arm's tip, nose along its path (-z).
    const plane = new THREE.Group();
    plane.position.set(1.02, -0.52, 0);
    plane.scale.setScalar(2.5);
    arm.add(plane);
    const p = new Batch(plane);
    p.add(m.glaze, glazed(new THREE.CapsuleGeometry(0.04, 0.26, 6, 16).rotateX(Math.PI / 2), K.bone));
    p.add(m.brass, new THREE.BoxGeometry(0.42, 0.016, 0.09).translate(0, 0, -0.02));
    p.add(m.brass, new THREE.BoxGeometry(0.16, 0.014, 0.05).translate(0, 0, 0.13));
    p.add(m.oxblood, new THREE.BoxGeometry(0.014, 0.08, 0.06).translate(0, 0.04, 0.14));
    p.done();
    b.done();
    ticks.push((angle) => {
      globe.rotation.y = angle;
      arm.rotation.y = -angle + 0.9;
      plane.rotation.z = 0.25 * Math.sin(angle * 2);
    });
  },
};

/**
 * Each subject is staged on its own terms, within one family (lens, light, materials): its own base
 * and its own camera, so the cards are not one plinth photographed again and again.
 */
const staging: Record<Kind, { base: BaseForm; pitch: number; yaw: number }> = {
  ai: { base: "turned", pitch: 11, yaw: -16 },
  trading: { base: "bench", pitch: 4, yaw: -8 },
  travel: { base: "drum", pitch: 16, yaw: 10 },
};

/**
 * The kinetic rig for one subject. The sculpture fills 0.84 of the frame's height, so the mechanism,
 * not the empty card, carries a small card; each subject keeps its own camera (`staging`). The dark
 * rig is a gallery at night: little ambient, the key dimmed, and the scene's own spotlight (see
 * `kineticWorld`) pooling on the sculpture, rims on the brass.
 */
export function kineticLook(kind: Kind): ObjectLook {
  const stage = staging[kind];
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
        reflections: 1.3,
        hemisphere: { sky: 0xf4efe6, ground: 0x6b6258, intensity: 0.75 },
        rim: { intensity: 1.6 },
      },
      dark: {
        exposure: 1.1,
        reflections: 1.25,
        hemisphere: { sky: 0x8fa3c4, ground: 0x0c0f13, intensity: 0.1 },
        rim: { intensity: 4.2, color: 0xa9c8ff },
        key: { intensity: 0.7, color: 0xc9d6ff },
        // A warm kicker from back left: a second rim along the brass and the base's edge.
        fill: { color: 0xffc98a, intensity: 2.2, position: [-5, 2.5, -3.5] },
        environment: { intensity: 0.9 },
      },
    },
    camera: { projection: "perspective", fov: 28, pitch: stage.pitch, yaw: stage.yaw },
    framing: { fill: 0.84, maxWidth: 0.86, lift: -0.005 },
    castShadows: true,
  };
}

export function kineticWorld(kind: Kind, ticks: Tick[]) {
  const root = new THREE.Group();
  const m = sculptureMaterials(true);
  base(root, m, staging[kind].base);
  sculptures[kind](root, m, ticks);
  // A warm gallery spot from above front: a soft accent by day, the main light at night, pooling on
  // the stone top and falling off over the base so the slate stays slate.
  const spot = new THREE.SpotLight(0xffd9a8, 0, 0, 0.36, 0.85, 2);
  spot.position.set(0.6, 5.2, 3.0);
  spot.target.position.set(0, -0.6, 0);
  root.add(spot, spot.target);
  themeSwitch(root, ticks, (dark) => {
    spot.intensity = dark ? 150 : 30;
  });
  return root;
}
