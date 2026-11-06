// Studio objects: product photography of one beautiful object on a seamless sweep, shot close and
// low, doing its job. State shows through physical cues (an LED, a fold opening,
// a bead sliding on its rod), never readable screen text. One lens, one height, one light for all.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { contactShadow, lookMaterial, themed, shade, type MaterialThemeChange, type ObjectLook } from "./look";
import type { ObjectEdition } from "./variants";
import type { ObjectPalette } from "./scenes";
import { marketBar, MARKET_BAR_MS, MARKET_LOOP_MS } from "./market";
import { clamp, lerp, progress, smootherstep } from "../math";

const DURATION = 5400;
/** Every Studio subject stands on the same tabletop. */
const FLOOR = -1;

/**
 * Studio's look: product photography. A hard-working key from the top left with a real soft shadow
 * on the sweep, a weak fill so the shadow side keeps its shape, a rim from behind that draws a bright
 * edge along every silhouette, and a room environment for reflections. Low ambient, so the light has
 * a direction. The same lens, close and low (14° above the tabletop), for every subject. Dark mode is
 * a lower-key room: the key stays, a store-green kicker and rim come round from behind, and the
 * sweep glows behind the subject so the silhouette cuts off it.
 */
export const studioLook: ObjectLook = {
  rig: {
    both: {
      toneMapping: "aces",
      exposure: 1,
      environment: { kind: "room", intensity: 0.4, rotation: 0.5 },
      reflections: 0.9,
      hemisphere: { sky: 0xfbf6ec, ground: 0x4d524d, intensity: 0.4 },
      key: { color: 0xfff1dc, intensity: 3.3, position: [-6, 6.5, 3.5], shadow: true, shadowMapSize: 1024, shadowRadius: 6 },
      fill: { color: 0xe6eeff, intensity: 0.32, position: [6, 1.5, 5] },
      rim: { color: 0xf0f4ff, intensity: 2.4, position: [3.5, 4.5, -6] },
    },
    dark: {
      exposure: 1.02,
      environment: { intensity: 0.26 },
      reflections: 0.5,
      hemisphere: { sky: 0xa9c8ba, ground: 0x111a17, intensity: 0.26 },
      key: { intensity: 2.7 },
      fill: { color: 0x9fdcc0, intensity: 1.6, position: [-6, 1.2, -4.5] },
      rim: { color: 0xb4ecd2, intensity: 4, position: [6, 1.4, -5] },
    },
  },
  camera: { projection: "perspective", fov: 32, pitch: 14 },
  framing: { fill: 0.78, maxWidth: 0.9, lift: 0.0 },
  contactShadow: { spread: 1.0, opacity: 0.32 },
};

/* ---------------------------------------------------------------- Materials and helpers */

/** The Studio palette: graphite, anodised aluminium, one store-green accent, an amber signal. */
const GRAPHITE = 0x2b2f2e,
  ALUMINIUM = 0xc9ccc6,
  AMBER = 0xe8a33d;

/**
 * The night palette's accent is a light mint meant for flat CSS; on a lit part it reads as a glowing
 * pastel. Studio keeps its one green part anodised (a deep store green) in both themes.
 */
function studioPalette(palette: ObjectPalette): ObjectPalette {
  const { l } = new THREE.Color(palette.accent).getHSL({ h: 0, s: 0, l: 0 }, THREE.SRGBColorSpace);
  return l > 0.4 ? { ...palette, accent: shade(palette.accent, -0.42) } : palette;
}

function studioMaterials(palette: ObjectPalette) {
  return {
    aluminium: themed(lookMaterial("brushedMetal", 0xb2b6b0, { roughness: 0.38, anisotropy: 0.35 }), {
      dark: { color: 0x8d938e, roughness: 0.5 },
    }),
    satin: themed(lookMaterial("brushedMetal", 0xb8bcb6, { roughness: 0.22, anisotropy: 0.3 }), {
      dark: { color: 0x949994, roughness: 0.36 },
    }),
    steel: lookMaterial("metal", 0xd9dbd6, { roughness: 0.2 }),
    graphite: themed(lookMaterial("ceramic", GRAPHITE, { roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 }), {
      dark: { color: 0x353b3a },
    }),
    keycap: themed(lookMaterial("plastic", 0x2f3433, { roughness: 0.62 }), { dark: { color: 0x3c4241, roughness: 0.5 } }),
    rubber: lookMaterial("rubber", 0x1d2121),
    accent: lookMaterial("ceramic", palette.accent, { roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
    glass: lookMaterial("ceramic", 0x07090a, { roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 }),
    paper: themed(lookMaterial("paper", palette.paper, { grain: 3 }), { dark: { color: shade(palette.paper, -0.26) } }),
  };
}

/**
 * Brushed-metal grain: fine horizontal streaks as a roughness map and a matching normal map, so the
 * anisotropic highlight breaks into a grain instead of sliding over a smooth plate. Seeded, so every
 * render is the same.
 */
function brushedGrain() {
  const W = 256,
    H = 256;
  let seed = 0x5eed;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const field = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const row = random();
    for (let x = 0; x < W; x++) field[y * W + x] = row * 0.7 + random() * 0.3;
  }
  // Smear along x so streaks run long.
  for (let pass = 0; pass < 3; pass++)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        field[y * W + x] = (field[y * W + x] * 2 + field[y * W + ((x + 1) % W)] + field[y * W + ((x + W - 1) % W)]) / 4;
  const rough = new Uint8Array(W * H * 4),
    normal = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4,
        v = field[y * W + x];
      const r = Math.round(255 * (0.62 + 0.38 * v));
      rough.set([r, r, r, 255], i);
      const dy = field[((y + 1) % H) * W + x] - field[((y + H - 1) % H) * W + x];
      const n = new THREE.Vector3(0, -dy * 1.6, 1).normalize();
      normal.set([128, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255, 255], i);
    }
  const texture = (data: Uint8Array) => {
    const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 2);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  };
  return { roughnessMap: texture(rough), normalMap: texture(normal), normalScale: new THREE.Vector2(0.35, 0.35) };
}

/** Printed paper (its colour comes from the map); a little dimmer at night so it does not outshine the scene. */
const printed = (options: Parameters<typeof lookMaterial>[2]) =>
  themed(lookMaterial("paper", 0xe8e5de, options), { dark: { color: 0xbcbcb8 } });

/** A small emissive part: an LED, a status light. Bright in both themes. */
const glow = (color: number, intensity = 1.6) =>
  lookMaterial("plastic", color, { emissive: color, emissiveIntensity: intensity, roughness: 0.3 });

function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0, radius = 0.03) {
  const r = Math.min(radius, w / 2.01, h / 2.01, d / 2.01);
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), material);
  m.position.set(x, y, z);
  return m;
}
function cylinder(r: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0, segments = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
  m.position.set(x, y, z);
  return m;
}
/** Stand a cylinder's axis along z (towards the lens). */
function turned(mesh: THREE.Mesh) {
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}
function phase(group: THREE.Group, t: number, name: string, pose: number) {
  group.userData.phase = t >= DURATION ? "rest" : name;
  group.userData.pose = pose;
}
/** A canvas colour from a numeric colour (WebGL scenes keep colours as numbers). */
const css = (color: number) => new THREE.Color(color).getStyle();

/**
 * The tabletop: a shadow catcher under the subject that shows only the key's soft shadow, fading
 * out towards its rim so it never shows an edge. Excluded from framing.
 */
function shadowFloor(radius = 2.5) {
  const material = themed(new THREE.ShadowMaterial({ opacity: 0.26, depthWrite: false }), { dark: { opacity: 0.5 } });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "varying vec2 vFloor;\nvoid main() {\n  vFloor = uv - 0.5;")
      .replace("#include <common>", "#include <common>");
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "varying vec2 vFloor;\nvoid main() {")
      .replace(
        "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );",
        "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) * ( 1.0 - smoothstep( 0.28, 0.5, length( vFloor ) ) ) );",
      );
  };
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), material);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR + 0.002;
  floor.receiveShadow = true;
  floor.name = "studio-floor";
  floor.userData.frameIgnore = true;
  return floor;
}

/** The rim's direction (from the subject towards the light): behind, above and to the right. */
const RIM_DIRECTION = new THREE.Vector3(0.78, 0.3, -0.55).normalize();
/** Rim colour per theme: a neutral white edge by day, the store-green room's light at night. */
const RIM = { light: { color: 0xffffff, strength: 0.3 }, dark: { color: 0x8be0bb, strength: 1.7 } };

/**
 * A rim light the way a strip softbox behind the set draws one: a bright edge where a surface turns
 * away from the lens and towards the rim's side. Carried in the material's emissive colour, which
 * the shader scales by that grazing term, so `themed` can switch it per theme like any colour.
 */
function addRim(material: THREE.MeshStandardMaterial) {
  if (material.userData.studioRim || material.emissiveMap || material.emissive.getHex() !== 0) return;
  material.userData.studioRim = true;
  const themes = (material.userData.themes ?? {}) as Record<string, MaterialThemeChange>;
  material.userData.themes = {
    ...themes,
    light: { ...themes.light, emissive: RIM.light.color, emissiveIntensity: RIM.light.strength },
    dark: { ...themes.dark, emissive: RIM.dark.color, emissiveIntensity: RIM.dark.strength },
  };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.studioRimDirection = { value: RIM_DIRECTION };
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform vec3 studioRimDirection;\nvoid main() {")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          vec3 rimView = normalize( ( viewMatrix * vec4( studioRimDirection, 0.0 ) ).xyz );
          float grazing = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 3.0 );
          float facing = smoothstep( 0.2, 0.8, dot( normal, rimView ) );
          totalEmissiveRadiance *= grazing * facing;
        }`,
      );
  };
  material.customProgramCacheKey = () => "studio-rim";
}

/**
 * The seamless sweep: a floor that curves up into a back wall, never drawn as a surface (the card is
 * the paper), only as light on it. One layer darkens the paper away from the subject, the key's
 * falloff; the other is the pool of light on the sweep behind the subject, which the rim-lit
 * silhouette cuts against. Both fade by distance in 3D, so the curve has no seam.
 */
function sweep() {
  const WALL = -3.6,
    BEND = 1.6;
  const profile: THREE.Vector2[] = [];
  // The profile in (z, y): floor from the front to the bend, a quarter circle, then the wall.
  profile.push(new THREE.Vector2(14, FLOOR - 0.006), new THREE.Vector2(WALL + BEND, FLOOR - 0.006));
  for (let i = 1; i < 12; i++) {
    const a = (i / 12) * (Math.PI / 2);
    profile.push(new THREE.Vector2(WALL + BEND - Math.sin(a) * BEND, FLOOR - 0.006 + (1 - Math.cos(a)) * BEND));
  }
  profile.push(new THREE.Vector2(WALL, FLOOR + BEND), new THREE.Vector2(WALL, FLOOR + 14));
  const positions: number[] = [],
    index: number[] = [];
  // Stored at 1/SCALE and grown back in the vertex shader, so the sweep never counts towards the
  // subject's bounds (Box3, framing) while it still fills the frame. It is never culled.
  const SCALE = 16;
  profile.forEach((p, i) => {
    positions.push(-16 / SCALE, p.y / SCALE, p.x / SCALE, 16 / SCALE, p.y / SCALE, p.x / SCALE);
    if (i > 0) index.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  /** A see-through layer whose alpha follows `profile` of the distance from the subject's pool. */
  const layer = (profile: string, changes: Parameters<typeof themed>[1]) => {
    const material = themed(
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
      changes,
    );
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace("void main() {", `varying vec3 vSweep;\nvoid main() {\n  vSweep = position * ${SCALE.toFixed(1)};`)
        .replace("#include <begin_vertex>", `vec3 transformed = position * ${SCALE.toFixed(1)};`);
      shader.fragmentShader = shader.fragmentShader.replace("void main() {", "varying vec3 vSweep;\nvoid main() {").replace(
        "#include <opaque_fragment>",
        `{ float r = length( ( vSweep - vec3( 0.0, ${(FLOOR + 1.1).toFixed(2)}, ${(WALL + 0.4).toFixed(2)} ) ) * vec3( 0.8, 1.0, 1.0 ) );
             diffuseColor.a *= ${profile}; }
           #include <opaque_fragment>`,
      );
    };
    material.customProgramCacheKey = () => `studio-sweep-${profile}`;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.frameIgnore = true;
    mesh.frustumCulled = false;
    mesh.renderOrder = -2;
    return mesh;
  };
  const group = new THREE.Group();
  group.name = "studio-sweep";
  group.userData.frameIgnore = true;
  group.add(
    layer("smoothstep( 3.5, 10.0, r )", { light: { color: 0x6f6658, opacity: 0.1 }, dark: { color: 0x020504, opacity: 0.55 } }),
    layer("pow( 1.0 - smoothstep( 0.0, 4.6, r ), 1.6 )", {
      light: { color: 0xffffff, opacity: 0 },
      dark: { color: 0x3f705b, opacity: 0.6 },
    }),
  );
  return group;
}

/** Every subject mesh casts and receives the key's shadow, except glowing parts; every lit surface takes the rim. */
function finish(root: THREE.Group, look: ObjectLook = studioLook) {
  root.traverse((item) => {
    const mesh = item as THREE.Mesh;
    if (!mesh.isMesh || item.userData.frameIgnore) return;
    const glowing = item.userData.glow === true;
    mesh.castShadow = !glowing && item.userData.cast !== false;
    // Thin rods and posts at grazing angles to the key show shadow acne; they only cast.
    mesh.receiveShadow = !glowing && item.userData.receive !== false;
    if (glowing) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
      // Paper is matte and flat-on: a rim on it only greys the print.
      if (
        (material as THREE.MeshStandardMaterial).isMeshStandardMaterial &&
        material.userData.lookPreset &&
        material.userData.lookPreset !== "paper"
      )
        addRim(material as THREE.MeshStandardMaterial);
  });
  root.add(sweep(), shadowFloor());
  root.userData.style = "studio";
  root.userData.look = look;
  return root;
}

/** An instanced mesh from a list of matrices. */
function instanced(geometry: THREE.BufferGeometry, material: THREE.Material, matrices: THREE.Matrix4[]) {
  const m = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((matrix, i) => m.setMatrixAt(i, matrix));
  m.instanceMatrix.needsUpdate = true;
  m.computeBoundingBox();
  m.computeBoundingSphere();
  return m;
}
const at = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  );

/* ---------------------------------------------------------------- Tennis: racket, can and a bouncing ball */

const BALL_R = 0.13;
/** The racket, long axis along +x from the butt, string bed in its local xz plane. */
function racket(mat: ReturnType<typeof studioMaterials>) {
  const group = new THREE.Group();
  const frameMaterial = lookMaterial("ceramic", GRAPHITE, { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
  const cx = 1.86,
    a = 0.62,
    b = 0.47;
  const headCurve = new THREE.EllipseCurve(cx, 0, a, b, 0, Math.PI * 2, false, 0);
  const headPoints = headCurve.getPoints(120).map((p) => new THREE.Vector3(p.x, 0, p.y));
  const frame = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(headPoints, true), 140, 0.036, 10, true),
    frameMaterial,
  );
  frame.scale.y = 1.45;
  group.add(frame);
  // Throat: two beams from the shaft to the head, and an accent bridge across them.
  for (const side of [-1, 1]) {
    const beam = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.78, 0, 0),
      new THREE.Vector3(1.02, 0, side * 0.1),
      new THREE.Vector3(1.2, 0, side * 0.27),
      new THREE.Vector3(cx - a * 0.86, 0, side * b * 0.52),
    ]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(beam, 32, 0.034, 10, false), frameMaterial);
    m.scale.y = 1.4;
    group.add(m);
  }
  const bridge = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(1.26, 0, -0.29),
        new THREE.Vector3(1.36, 0, 0),
        new THREE.Vector3(1.26, 0, 0.29),
      ),
      24,
      0.03,
      8,
      false,
    ),
    mat.accent,
  );
  bridge.scale.y = 1.3;
  group.add(bridge);
  // Strings: mains along the racket, crosses across it, inside the frame.
  const stringMaterial = lookMaterial("plastic", 0xece6d2, { roughness: 0.45 });
  const strings: THREE.Matrix4[] = [];
  const innerA = a - 0.03,
    innerB = b - 0.03;
  for (let i = 0; i < 16; i++) {
    const z = -innerB * 0.92 + (i * (innerB * 1.84)) / 15;
    const half = innerA * Math.sqrt(Math.max(0, 1 - (z / innerB) ** 2));
    const x0 = Math.min(cx - half, i >= 6 && i <= 9 ? 1.3 : cx - half);
    strings.push(at((x0 + cx + half) / 2, 0.004, z, 0, 0, Math.PI / 2, 1, cx + half - x0, 1));
  }
  for (let i = 0; i < 19; i++) {
    const x = cx - innerA * 0.93 + (i * innerA * 1.86) / 18;
    const half = innerB * Math.sqrt(Math.max(0, 1 - ((x - cx) / innerA) ** 2));
    strings.push(at(x, -0.004, 0, Math.PI / 2, 0, 0, 1, 2 * half, 1));
  }
  group.add(instanced(new THREE.CylinderGeometry(0.0075, 0.0075, 1, 5), stringMaterial, strings));
  // Shaft, handle with an overlapping white grip wrap, and the butt cap.
  const shaft = cylinder(0.042, 0.3, frameMaterial, 0.68, 0, 0, 12);
  shaft.rotation.z = Math.PI / 2;
  shaft.scale.z = 1.35;
  group.add(shaft);
  const gripMaterial = lookMaterial("rubber", 0xeeebe2, { roughness: 0.8 });
  const grip = cylinder(0.066, 0.58, gripMaterial, 0.27, 0, 0, 8);
  grip.rotation.z = Math.PI / 2;
  grip.rotation.x = Math.PI / 8;
  group.add(grip);
  const wrap: THREE.Vector3[] = [];
  for (let i = 0; i <= 200; i++) {
    const u = i / 200,
      angle = u * Math.PI * 2 * 9;
    wrap.push(new THREE.Vector3(0.02 + u * 0.52, Math.cos(angle) * 0.067, Math.sin(angle) * 0.067));
  }
  group.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wrap), 400, 0.006, 4, false),
      lookMaterial("rubber", 0xd2cec2),
    ),
  );
  const cap = cylinder(0.075, 0.05, frameMaterial, -0.015, 0, 0, 8);
  cap.rotation.z = Math.PI / 2;
  cap.rotation.x = Math.PI / 8;
  group.add(cap);
  const collar = cylinder(0.07, 0.04, mat.accent, 0.57, 0, 0, 16);
  collar.rotation.z = Math.PI / 2;
  group.add(collar);
  return { group, head: new THREE.Vector3(cx, 0, 0) };
}

export async function tennis(sourcePalette: ObjectPalette, edition: ObjectEdition = 0, modelUrl: string) {
  const palette = studioPalette(sourcePalette);
  // The ball (felt sphere and seam) is the packaged Blender model's; the rest is procedural. The
  // model is meshopt-compressed (docs/objects.md); three's decoder carries its WebAssembly inline.
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("three/addons/libs/meshopt_decoder.module.js"),
  ]);
  const model = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl);
  const root = new THREE.Group();
  const set = new THREE.Group();
  set.rotation.y = -0.38;
  set.position.set(-0.1, 0, 0);
  root.add(set);
  const mat = studioMaterials(palette);
  const feltColor = [0xd6df4a, 0xdfe35a, 0xcfd948][edition];
  const felt = lookMaterial("felt", feltColor, { sheenColor: new THREE.Color(0xf4f7c4), grain: 2 });
  const seamMaterial = lookMaterial("rubber", 0xf3f1e6, { roughness: 0.7 });

  /** A ball from the model, scaled to BALL_R and centred on its own origin. */
  const source = model.scene.getObjectByName("Tennis_ball") ?? model.scene.getObjectByName("Tennis ball");
  const makeBall = () => {
    const pivot = new THREE.Group();
    if (!source) {
      pivot.add(new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 32, 20), felt));
      return pivot;
    }
    const copy = source.clone(true);
    copy.position.set(0, 0, 0);
    copy.rotation.set(0, 0, 0);
    copy.scale.setScalar(1);
    copy.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(copy);
    const size = bounds.getSize(new THREE.Vector3());
    const scale = (2 * BALL_R) / Math.max(size.x, size.y, size.z, 1e-6);
    copy.scale.setScalar(scale);
    copy.position.copy(bounds.getCenter(new THREE.Vector3()).multiplyScalar(-scale));
    copy.traverse((item) => {
      const m = item as THREE.Mesh;
      if (!m.isMesh) return;
      const name = (Array.isArray(m.material) ? m.material[0] : m.material).name;
      m.material = name === "Ball" ? felt : seamMaterial;
    });
    pivot.add(copy);
    return pivot;
  };

  // The ball can, lying on its side with its open end towards the lens and a ball in its mouth.
  const can = new THREE.Group();
  const canR = 0.155,
    canL = 0.92;
  can.position.set(1.1, FLOOR + canR, -0.15);
  can.rotation.y = 1.15;
  set.add(can);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(canR, canR, canL, 40, 1, true), mat.aluminium);
  body.rotation.x = Math.PI / 2;
  can.add(body);
  const inside = new THREE.Mesh(
    new THREE.CylinderGeometry(canR - 0.008, canR - 0.008, canL, 40, 1, true),
    themed(lookMaterial("plastic", 0x1f2423, { side: THREE.BackSide, roughness: 0.7 }), {}),
  );
  inside.rotation.x = Math.PI / 2;
  can.add(inside);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(canR + 0.004, canR + 0.004, 0.42, 40, 1, true), mat.accent);
  label.rotation.x = Math.PI / 2;
  label.position.z = -0.05;
  can.add(label);
  const lid = cylinder(canR + 0.012, 0.05, mat.graphite, 0, 0, -canL / 2 - 0.02, 40);
  lid.rotation.x = Math.PI / 2;
  can.add(lid);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(canR, 0.012, 8, 40), mat.steel);
  rim.position.z = canL / 2;
  can.add(rim);
  const inMouth = makeBall();
  inMouth.position.set(0, -canR + BALL_R + 0.012, canL / 2 - 0.06);
  inMouth.rotation.set(0.4, 1.1, 0.2);
  can.add(inMouth);
  const spare = makeBall();
  spare.position.set(1.0, FLOOR + BALL_R, 0.62);
  spare.rotation.set(1.2, 0.3, 0.6);
  set.add(spare);

  // The racket rests its throat on the floor and its head across the can.
  const { group: frame, head } = racket(mat);
  const pivot = new THREE.Group();
  pivot.position.set(-1.45, FLOOR + 0.06, 0.25);
  pivot.rotation.y = 0.18;
  set.add(pivot);
  pivot.add(frame);
  const tilt = Math.asin((2 * canR - 0.04) / 2.25);
  frame.rotation.z = tilt;
  // The bouncing ball, its contact point on the string bed under the head's centre.
  const ball = makeBall();
  set.add(ball);
  const racketContact = head.clone().add(new THREE.Vector3(0, BALL_R, 0));
  frame.updateMatrix();
  pivot.updateMatrix();
  const contact = racketContact.clone().applyMatrix4(frame.matrix).applyMatrix4(pivot.matrix);
  // A still life of separate pieces: each gets its own occlusion where it meets the table, instead
  // of one ellipse under the whole set.
  const blob = (width: number, depth: number, x: number, z: number, angle = 0, opacity = 0.5) => {
    const shadow = contactShadow(width, depth, { x, y: FLOOR + 0.003, z, opacity });
    shadow.rotation.z = angle;
    set.add(shadow);
  };
  blob(canR * 3.2, canL * 1.25, can.position.x, can.position.z, can.rotation.y, 0.55);
  blob(BALL_R * 3.4, BALL_R * 3.4, spare.position.x, spare.position.z);
  const butt = new THREE.Vector3(0.2, 0, 0).applyMatrix4(frame.matrix).applyMatrix4(pivot.matrix);
  blob(0.75, 0.32, butt.x, butt.z, pivot.rotation.y + Math.PI / 2, 0.4);
  // Drop the unused parts of the model.
  model.scene.traverse((item) => {
    const m = item as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry.dispose();
    for (const material of Array.isArray(m.material) ? m.material : [m.material]) material.dispose();
  });

  const LOOP = 6000,
    BOUNCE = 3000,
    FIRST = 1900,
    APEX = 1.05;
  root.userData.source = "blender";
  root.userData.contactTime = FIRST;
  root.userData.contactTimes = [FIRST, FIRST + BOUNCE];
  root.userData.rackets = [frame, frame];
  root.userData.racketContact = racketContact;
  root.userData.loopDuration = LOOP;
  root.userData.restTime = FIRST + 760;
  root.userData.ball = ball;
  root.userData.racket = frame;
  root.userData.animate = (time: number) => {
    const t = ((time % LOOP) + LOOP) % LOOP;
    const s = (((t - FIRST) % BOUNCE) + BOUNCE) % BOUNCE;
    const u = s / BOUNCE;
    ball.position.set(contact.x, contact.y + APEX * 4 * u * (1 - u), contact.z);
    // Squash for 70ms either side of contact; the string bed gives under it.
    const near = Math.min(s, BOUNCE - s);
    const squash = Math.max(0, 1 - near / 70) ** 2;
    ball.scale.set(1 + 0.12 * squash, 1 - 0.2 * squash, 1 + 0.12 * squash);
    ball.rotation.set((t / LOOP) * Math.PI * 4, 0.5, (t / LOOP) * Math.PI * 2);
    // The racket answers each strike with a small damped recoil on its throat.
    const since = s;
    frame.rotation.z = tilt - 0.01 * Math.sin(since / 22) * Math.exp(-since / 110);
    root.userData.phase = u < 0.5 ? "rise" : "fall";
    root.userData.pose = t / LOOP;
  };
  return finish(root, { ...studioLook, contactShadow: false });
}

/* ---------------------------------------------------------------- Trading: a market abacus */

export function trading(sourcePalette: ObjectPalette, edition: ObjectEdition = 0) {
  const palette = studioPalette(sourcePalette);
  const root = new THREE.Group();
  const desk = new THREE.Group();
  desk.rotation.y = 0.42;
  root.add(desk);
  const mat = studioMaterials(palette);
  const COLS = 12,
    PITCH = 0.27,
    baseTop = FLOOR + 0.34,
    railY = 1.08;
  const span = (COLS - 1) * PITCH;
  desk.add(box(span + 0.62, 0.3, 0.86, mat.graphite, 0, FLOOR + 0.15, 0, 0.07));
  desk.add(box(span + 0.5, 0.04, 0.74, mat.aluminium, 0, FLOOR + 0.32, 0, 0.02));
  // The frame: end posts and the top rail, rods for every bar.
  const frameParts = [-1, 1].map((side) =>
    box(0.08, railY - baseTop + 0.05, 0.12, mat.aluminium, side * (span / 2 + 0.2), (railY + baseTop) / 2, 0, 0.025),
  );
  frameParts.push(box(span + 0.48, 0.08, 0.12, mat.aluminium, 0, railY, 0, 0.025));
  for (const part of frameParts) {
    part.userData.receive = false;
    desk.add(part);
  }
  const rods = Array.from({ length: COLS }, (_, i) =>
    at(-span / 2 + i * PITCH, (railY + baseTop) / 2, 0, 0, 0, 0, 1, railY - baseTop, 1),
  );
  const rodMesh = instanced(new THREE.CylinderGeometry(0.014, 0.014, 1, 8), mat.steel, rods);
  rodMesh.userData.receive = false;
  desk.add(rodMesh);
  // Wicks (a sleeve from low to high) and bodies (a bead from open to close) slide on the rods.
  const wickMaterial = lookMaterial("plastic", 0x5b625f, { roughness: 0.4 });
  const wicks = instanced(new THREE.CylinderGeometry(0.034, 0.034, 1, 12), wickMaterial, rods);
  const bodyMaterial = lookMaterial("ceramic", 0xffffff, { roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  const bodies = instanced(new THREE.CylinderGeometry(0.108, 0.108, 1, 28), bodyMaterial, rods);
  const up = new THREE.Color(palette.accent),
    down = new THREE.Color(GRAPHITE);
  for (let i = 0; i < COLS; i++) bodies.setColorAt(i, up);
  desk.add(wicks, bodies);
  // Three LEDs on the front: a tick, the session, the last bar's direction.
  const leds = [glow(AMBER, 0), glow(palette.accent, 1.4), glow(palette.accent, 0)];
  leds.forEach((material, i) => {
    const led = cylinder(0.028, 0.02, material, span / 2 - 0.36 + i * 0.13, FLOOR + 0.2, 0.431, 16);
    led.rotation.x = Math.PI / 2;
    led.userData.glow = true;
    desk.add(led);
  });
  desk.add(box(span - 0.3, 0.012, 0.01, mat.aluminium, -0.42, FLOOR + 0.2, 0.432, 0.004));
  const low = 97.2,
    high = 102.8;
  const y = (price: number) => lerp(baseTop + 0.1, railY - 0.1, (price - low) / (high - low));
  const scratch = new THREE.Matrix4();
  const colour = new THREE.Color();
  root.userData.loopDuration = MARKET_LOOP_MS;
  root.userData.restTime = 3600;
  root.userData.marketBar = (index: number) => marketBar(index, edition);
  root.userData.animate = (time: number) => {
    const t = ((time % MARKET_LOOP_MS) + MARKET_LOOP_MS) % MARKET_LOOP_MS;
    const offset = t / MARKET_BAR_MS,
      first = Math.floor(offset),
      fraction = offset - first;
    // Each bar holds, then every column takes its right-hand neighbour's values in one quick tick.
    const tick = smootherstep(clamp((fraction - 0.66) / 0.3));
    for (let i = 0; i < COLS; i++) {
      const from = marketBar(first - (COLS - 1) + i, edition),
        to = marketBar(first - (COLS - 2) + i, edition);
      const o = lerp(from.open, to.open, tick),
        c = lerp(from.close, to.close, tick),
        h = lerp(from.high, to.high, tick),
        l = lerp(from.low, to.low, tick);
      const x = -span / 2 + i * PITCH;
      wicks.setMatrixAt(
        i,
        scratch.compose(
          new THREE.Vector3(x, (y(h) + y(l)) / 2, 0),
          new THREE.Quaternion(),
          new THREE.Vector3(1, Math.max(0.02, y(h) - y(l)), 1),
        ),
      );
      bodies.setMatrixAt(
        i,
        scratch.compose(
          new THREE.Vector3(x, (y(o) + y(c)) / 2, 0),
          new THREE.Quaternion(),
          new THREE.Vector3(1, Math.max(0.035, Math.abs(y(o) - y(c))), 1),
        ),
      );
      const rising = (tick < 0.5 ? from : to).close >= (tick < 0.5 ? from : to).open;
      bodies.setColorAt(i, colour.copy(rising ? up : down));
    }
    wicks.instanceMatrix.needsUpdate = true;
    bodies.instanceMatrix.needsUpdate = true;
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    const latest = marketBar(first + (tick > 0.5 ? 1 : 0), edition);
    leds[0].emissiveIntensity = 2.4 * Math.sin(Math.PI * clamp((fraction - 0.66) / 0.3));
    leds[2].emissiveIntensity = latest.close >= latest.open ? 1.8 : 0.15;
    root.userData.phase = "market-pan";
    root.userData.pose = t / MARKET_LOOP_MS;
    root.userData.scroll = offset;
  };
  return finish(root);
}

/* ---------------------------------------------------------------- Server: inference hardware */

export function server(sourcePalette: ObjectPalette) {
  const palette = studioPalette(sourcePalette);
  const root = new THREE.Group();
  const rack = new THREE.Group();
  rack.rotation.y = -0.55;
  root.add(rack);
  const mat = studioMaterials(palette);
  const W = 2.9,
    D = 1.45,
    H = 2.42;
  const bottom = FLOOR;
  rack.add(box(W + 0.12, 0.1, D + 0.1, mat.graphite, 0, bottom + 0.05, 0, 0.04));
  rack.add(box(W + 0.12, 0.07, D + 0.1, mat.graphite, 0, bottom + H - 0.035, 0, 0.03));
  for (const x of [-W / 2, W / 2])
    for (const z of [-D / 2, D / 2]) {
      const post = box(0.09, H - 0.17, 0.09, mat.aluminium, x, bottom + H / 2, z, 0.02);
      post.userData.receive = false;
      rack.add(post);
    }
  // Rubber feet.
  for (const x of [-W / 2 + 0.15, W / 2 - 0.15])
    for (const z of [-D / 2 + 0.1, D / 2 - 0.1]) rack.add(cylinder(0.06, 0.03, mat.rubber, x, bottom - 0.005, z, 16));
  const units: THREE.Group[] = [],
    fans: THREE.Mesh[] = [];
  const ledMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const ledMatrices: THREE.Matrix4[] = [];
  const ledColours: number[] = [];
  const ledUnit: number[] = [];
  const unitH = 0.64,
    front = D / 2 - 0.02;
  const portMaterial = lookMaterial("plastic", 0x121515, { roughness: 0.6 });
  // Face plates in brushed aluminium with a real grain; the compute unit's is anodised green.
  const brushed = themed(lookMaterial("brushedMetal", ALUMINIUM, { roughness: 0.4, anisotropy: 0.85, ...brushedGrain() }), {
    dark: { color: 0xa3a9a4, roughness: 0.46 },
  });
  const anodised = lookMaterial("brushedMetal", palette.accent, { roughness: 0.42, anisotropy: 0.8, ...brushedGrain() });
  for (let i = 0; i < 3; i++) {
    const unit = new THREE.Group();
    const cy = bottom + 0.18 + unitH / 2 + (2 - i) * (unitH + 0.1);
    unit.userData.y = cy;
    unit.position.y = cy;
    rack.add(unit);
    units.push(unit);
    unit.add(box(W - 0.14, unitH, D - 0.1, mat.graphite, 0, 0, -0.03, 0.03));
    // Rack ears with two screws each.
    for (const side of [-1, 1]) {
      unit.add(box(0.12, unitH - 0.04, 0.03, mat.satin, side * (W / 2 - 0.02), 0, front + 0.01, 0.012));
      for (const sy of [-0.19, 0.19]) {
        const screw = cylinder(0.024, 0.02, mat.steel, side * (W / 2 - 0.02), sy, front + 0.03, 12);
        screw.rotation.x = Math.PI / 2;
        unit.add(screw);
      }
    }
    const bezel = i === 1 ? anodised : brushed;
    unit.add(box(W - 0.2, unitH - 0.06, 0.04, bezel, 0, 0, front, 0.02));
    if (i === 0) {
      // Storage: six drive sleds, each with a pull bar and an activity light.
      const sledGeometry = new RoundedBoxGeometry(0.36, 0.44, 0.04, 2, 0.015);
      const sleds: THREE.Matrix4[] = [],
        bars: THREE.Matrix4[] = [];
      for (let n = 0; n < 6; n++) {
        const x = -1.0 + n * 0.4;
        sleds.push(at(x, 0, front + 0.035));
        bars.push(at(x, -0.13, front + 0.065));
        ledMatrices.push(at(x + 0.12, 0.15, front + 0.058));
        ledColours.push(n === 3 ? AMBER : palette.accent);
        ledUnit.push(i);
      }
      unit.add(instanced(sledGeometry, mat.graphite, sleds));
      unit.add(instanced(new RoundedBoxGeometry(0.24, 0.035, 0.03, 2, 0.012), mat.steel, bars));
    } else if (i === 1) {
      // Compute: three fans behind round guards; perforated vents either side.
      for (const x of [-0.72, 0, 0.72]) {
        unit.add(turned(cylinder(0.24, 0.02, lookMaterial("plastic", 0x111414, { roughness: 0.7 }), x, 0, front + 0.012, 40)));
        const blades: THREE.BufferGeometry[] = [];
        for (let n = 0; n < 7; n++) {
          const blade = new THREE.BoxGeometry(0.075, 0.17, 0.012);
          blade.translate(0, 0.12, 0);
          blade.rotateY(0.45);
          blade.rotateZ((n * Math.PI * 2) / 7);
          blades.push(blade);
        }
        const hub = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20);
        hub.rotateX(Math.PI / 2);
        blades.push(hub);
        const fan = new THREE.Mesh(mergeGeometries(blades), mat.graphite);
        fan.position.set(x, 0, front + 0.03);
        unit.add(fan);
        fans.push(fan);
        const guard: THREE.BufferGeometry[] = [0.235, 0.16, 0.085].map((r) => new THREE.TorusGeometry(r, 0.012, 6, 40));
        for (const angle of [0, Math.PI / 2]) {
          const spoke = new THREE.CylinderGeometry(0.011, 0.011, 0.47, 6);
          spoke.rotateZ(angle);
          guard.push(spoke);
        }
        const guardMesh = new THREE.Mesh(mergeGeometries(guard), mat.steel);
        guardMesh.position.set(x, 0, front + 0.07);
        unit.add(guardMesh);
      }
      const holes: THREE.Matrix4[] = [];
      for (const side of [-1, 1])
        for (let r = 0; r < 5; r++)
          for (let c = 0; c < 2; c++) holes.push(at(side * (1.18 + c * 0.08), -0.2 + r * 0.1, front + 0.021, Math.PI / 2));
      unit.add(instanced(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 10), portMaterial, holes));
      for (const x of [-1.18, 1.18]) {
        ledMatrices.push(at(x + 0.04, 0.23, front + 0.026));
        ledColours.push(palette.accent);
        ledUnit.push(i);
      }
    } else {
      // Network: two rows of ports, link lights, and two patch cables in soft-touch sleeves.
      const ports: THREE.Matrix4[] = [];
      for (let r = 0; r < 2; r++)
        for (let n = 0; n < 8; n++) {
          const x = -0.98 + n * 0.25,
            y = -0.1 + r * 0.2;
          ports.push(at(x, y, front + 0.02));
          ledMatrices.push(at(x + 0.112, y + 0.05, front + 0.026));
          ledColours.push((n + r) % 3 === 0 ? AMBER : palette.accent);
          ledUnit.push(i);
        }
      // Each port is a real socket: a steel shroud standing proud of the plate, open at the front,
      // with a dark well and a row of gold contacts set back inside, so it shadows itself.
      const shroud = lookMaterial("metal", 0x7d827f, { roughness: 0.38 });
      const DEPTH = 0.065,
        OW = 0.17,
        OH = 0.14,
        WALL = 0.018;
      const along = (dx: number, dy: number) => ports.map((m) => m.clone().multiply(at(dx, dy, DEPTH / 2)));
      unit.add(
        instanced(new THREE.BoxGeometry(OW, WALL, DEPTH), shroud, [...along(0, (OH - WALL) / 2), ...along(0, -(OH - WALL) / 2)]),
        instanced(new THREE.BoxGeometry(WALL, OH - 2 * WALL, DEPTH), shroud, [
          ...along((OW - WALL) / 2, 0),
          ...along(-(OW - WALL) / 2, 0),
        ]),
        instanced(
          new THREE.BoxGeometry(OW - 2 * WALL, OH - 2 * WALL, 0.006),
          portMaterial,
          along(0, 0).map((m) => m.multiply(at(0, 0, -DEPTH / 2 + 0.004))),
        ),
        instanced(
          new THREE.BoxGeometry(0.09, 0.014, 0.012),
          lookMaterial("metal", 0xd2a54a, { roughness: 0.3 }),
          along(0, 0).map((m) => m.multiply(at(0, (OH - 2 * WALL) / 2 - 0.012, -DEPTH / 2 + 0.014))),
        ),
      );
      const cables = [
        {
          from: [-0.98, -0.1],
          to: [-0.48, -0.1],
          material: themed(lookMaterial("rubber", palette.accent, { roughness: 0.75 }), {}),
        },
        { from: [0.02, 0.1], to: [0.77, -0.1], material: lookMaterial("rubber", AMBER, { roughness: 0.75 }) },
      ];
      for (const { from, to, material } of cables) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(from[0], from[1], front + 0.12),
          new THREE.Vector3(from[0], from[1] - 0.12, front + 0.28),
          new THREE.Vector3((from[0] + to[0]) / 2, -0.4, front + 0.4),
          new THREE.Vector3(to[0], to[1] - 0.12, front + 0.28),
          new THREE.Vector3(to[0], to[1], front + 0.12),
        ]);
        unit.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.032, 10, false), material));
        for (const end of [from, to]) unit.add(box(0.122, 0.096, 0.12, material, end[0], end[1], front + 0.09, 0.022));
      }
    }
  }
  // All front-panel lights in one draw call, coloured per unit as power comes up.
  const ledMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 10, 8), ledMaterial, ledMatrices.length);
  ledMesh.userData.glow = true;
  const unitOf = (n: number) => units[ledUnit[n]];
  const ledColour = new THREE.Color();
  const off = new THREE.Color(0x1a1f1e);
  root.add(ledMesh);
  ledMesh.frustumCulled = false;
  const ledScratch = new THREE.Matrix4();
  root.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION);
    units.forEach((unit, i) => {
      const q = smootherstep(progress(t, 180 + i * 650, 1500 + i * 650));
      unit.position.z = lerp(1.1, 0, q);
      unit.position.y = unit.userData.y + 0.05 * Math.sin(q * Math.PI);
    });
    const power = smootherstep(progress(t, 2800, 4200));
    fans.forEach((fan, i) => (fan.rotation.z = -power * (Math.PI * 4 + i * 0.6)));
    rack.updateMatrixWorld(true);
    ledMatrices.forEach((matrix, n) => {
      ledMesh.setMatrixAt(n, ledScratch.multiplyMatrices(rack.matrix, unitOf(n).matrix).multiply(matrix));
      const lit = smootherstep(progress(t, 2800 + n * 45, 3100 + n * 45));
      ledMesh.setColorAt(n, ledColour.copy(off).lerp(new THREE.Color(ledColours[n]).multiplyScalar(1.25), lit));
    });
    ledMesh.instanceMatrix.needsUpdate = true;
    if (ledMesh.instanceColor) ledMesh.instanceColor.needsUpdate = true;
    ledMesh.computeBoundingBox();
    phase(
      root,
      t,
      t < 1500 ? "place-chassis" : t < 2450 ? "place-compute" : t < 3550 ? "place-memory" : "bandwidth-check",
      progress(t, 180, 4200),
    );
  };
  return finish(root);
}

/* ---------------------------------------------------------------- Travel: a folded atlas on the sweep */

/** A crisp topographic print across the whole sheet (three panels side by side), drawn at 2x. */
function atlasPrint(edition: ObjectEdition) {
  const W = 3072,
    H = 2048;
  const atlas = document.createElement("canvas");
  atlas.width = W;
  atlas.height = H;
  const ctx = atlas.getContext("2d")!;
  const looks = [
    {
      land: 0xf1ead6,
      contour: 0xa8865c,
      water: 0x7db6c8,
      shore: 0x4a87a0,
      wood: 0xb5cf92,
      woodEdge: 0x7d9d62,
      road: 0xfffcf3,
      casing: 0x8a6f55,
      main: 0xe8a33d,
    },
    {
      land: 0xf0ecdf,
      contour: 0xa9a58e,
      water: 0x86b9d2,
      shore: 0x4f88a8,
      wood: 0xcbdac0,
      woodEdge: 0x8fa98a,
      road: 0xfffdf6,
      casing: 0x7d7364,
      main: 0xd9744a,
    },
    {
      land: 0xf1e6d1,
      contour: 0xbf9a6f,
      water: 0xa3c6c2,
      shore: 0x6a9a96,
      wood: 0xdccfa6,
      woodEdge: 0xb09a68,
      road: 0xfffaf0,
      casing: 0x8c6a4c,
      main: 0xc2553f,
    },
  ];
  const look = looks[edition];
  /** A smooth closed blob from a few radii, for woods and the lake. */
  const blob = (cx: number, cy: number, r: number, seed: number) => {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const k = r * (1 + 0.22 * Math.sin(a * 3 + seed) + 0.12 * Math.sin(a * 5 + seed * 1.7));
      const x = cx + Math.cos(a) * k * 1.25,
        y = cy + Math.sin(a) * k;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  };
  const line = (points: [number, number][]) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
  };
  const wave = (from: number, to: number, step: number, f: (t: number) => [number, number]) => {
    const points: [number, number][] = [];
    for (let t = from; t <= to; t += step) points.push(f(t));
    return points;
  };
  ctx.fillStyle = css(look.land);
  ctx.fillRect(0, 0, W, H);
  // Woods: a few large patches with a darker edge, not a scatter of dots.
  const woods: [number, number, number][] = [
    [420, 420, 210],
    [1500, 1560, 260],
    [2560, 520, 200],
    [2350, 1700, 170],
    [900, 1500, 130],
  ];
  woods.forEach(([x, y, r], n) => {
    blob(x, y, r, n * 1.9 + edition);
    ctx.fillStyle = css(look.wood);
    ctx.fill?.();
    ctx.lineWidth = 5;
    ctx.strokeStyle = css(look.woodEdge);
    ctx.stroke();
  });
  // Contours round two summits, every fifth one heavier (an index contour).
  ctx.strokeStyle = css(look.contour);
  for (const [cx, cy, rings] of [
    [1100, 700, 9],
    [2250, 1150, 7],
  ] as const)
    for (let n = 1; n <= rings; n++) {
      ctx.lineWidth = n % 5 === 0 ? 6 : 3;
      ctx.globalAlpha = n % 5 === 0 ? 0.95 : 0.75;
      blob(cx, cy, n * 62, cx * 0.01 + n * 0.08);
      ctx.stroke();
    }
  ctx.globalAlpha = 1;
  // River with its shore line, then the lake.
  const river = wave(-40, H + 40, 16, (y) => [1980 + 160 * Math.sin(y / 300 + edition) + y * 0.12, y]);
  ctx.strokeStyle = css(look.shore);
  ctx.lineWidth = 50;
  line(river);
  ctx.strokeStyle = css(look.water);
  ctx.lineWidth = 40;
  line(river);
  blob(640, 1540, 190, 2 + edition);
  ctx.fillStyle = css(look.water);
  ctx.fill?.();
  ctx.lineWidth = 6;
  ctx.strokeStyle = css(look.shore);
  ctx.stroke();
  // Roads: a cased white minor road and one amber main road.
  const roads = [0, 1, 2].map((r) =>
    wave(-40, W + 40, 16, (x) => [x, 380 + r * 640 + 90 * Math.sin(x / 420 + r * 1.3)] as [number, number]),
  );
  roads.forEach((road, r) => {
    ctx.strokeStyle = css(look.casing);
    ctx.lineWidth = r === 1 ? 30 : 22;
    line(road);
    ctx.strokeStyle = css(r === 1 ? look.main : look.road);
    ctx.lineWidth = r === 1 ? 20 : 13;
    line(road);
  });
  // A thin grid, the neat line and a white margin, as printed maps have.
  ctx.strokeStyle = css(0x6f8ea0);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2.5;
  for (let x = 256; x < W; x += 256)
    line([
      [x, 0],
      [x, H],
    ]);
  for (let y = 256; y < H; y += 256)
    line([
      [0, y],
      [W, y],
    ]);
  ctx.globalAlpha = 1;
  ctx.fillStyle = css(0xfbf8f0);
  ctx.fillRect(0, 0, W, 56);
  ctx.fillRect(0, H - 56, W, 56);
  ctx.fillRect(0, 0, 56, H);
  ctx.fillRect(W - 56, 0, 56, H);
  ctx.strokeStyle = css(0x4a4a42);
  ctx.lineWidth = 4;
  ctx.strokeRect?.(56, 56, W - 112, H - 112);
  // Wear along the two folds: a worn shade either side of each crease and a bright ridge on it.
  for (const x of [W / 3, (2 * W) / 3]) {
    const crease = ctx.createLinearGradient?.(x - 70, 0, x + 70, 0);
    if (crease) {
      crease.addColorStop(0, "rgba(80,72,58,0)");
      crease.addColorStop(0.42, "rgba(80,72,58,0.22)");
      crease.addColorStop(0.5, "rgba(80,72,58,0.06)");
      crease.addColorStop(0.58, "rgba(80,72,58,0.22)");
      crease.addColorStop(1, "rgba(80,72,58,0)");
      ctx.fillStyle = crease;
      ctx.fillRect(x - 70, 0, 140, H);
    }
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = css(0xfffcf2);
    ctx.fillRect(x - 2, 0, 4, H);
    ctx.globalAlpha = 1;
  }
  const texture = new THREE.CanvasTexture(atlas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function travel(sourcePalette: ObjectPalette, edition: ObjectEdition = 0) {
  const palette = studioPalette(sourcePalette);
  const root = new THREE.Group();
  // The stage: the tabletop, turned a little for a three-quarter view. The sheet lies on it with
  // its folds running left to right: the near panel flat on the table, the middle panel standing
  // up towards the lens and the far panel propping it from behind, a tent the paper holds itself.
  const stage = new THREE.Group();
  stage.rotation.y = -0.38;
  stage.position.set(0.05, FLOOR, 0.15);
  root.add(stage);
  const map = new THREE.Group();
  stage.add(map);
  const mat = studioMaterials(palette);
  const PW = 1.23,
    PH = 2.45,
    T = 0.014;
  /** Where the near panel meets the middle one, on the table. */
  const HINGE = new THREE.Vector3(0, T / 2, 0.55);
  /** The middle panel's final angle from the near one (so 55° up from the table, leaning back). */
  const STAND = Math.PI - 0.96;
  const texture = atlasPrint(edition);

  /** Route in flat map coordinates (x across all three panels, y along the folds): it starts on the near panel and climbs the standing one. */
  const routes = [
    [
      [-1.6, -0.8],
      [-1.0, -0.35],
      [-0.4, 0.3],
      [0.25, 0.42],
      [0.85, 0.1],
      [1.55, 0.7],
    ],
    [
      [-1.55, -0.9],
      [-0.95, -0.1],
      [-0.3, -0.3],
      [0.3, 0.35],
      [0.8, 0.75],
      [1.5, 0.6],
    ],
    [
      [-1.6, -0.6],
      [-1.05, 0.15],
      [-0.45, 0.65],
      [0.1, 0.25],
      [0.75, 0.5],
      [1.5, 0.85],
    ],
  ][edition];
  const flat = new THREE.CatmullRomCurve3(
    routes.map(([x, y]) => new THREE.Vector3(-1.5 + ((x + 1.6) / 3.15) * 1.9, y * 0.72, 0)),
  );
  const flatPoints = flat.getSpacedPoints(240);
  const panelOf = (x: number) => (x < -PW / 2 ? 0 : x > PW / 2 ? 2 : 1);
  const toLocal = (p: THREE.Vector3, panel: number) => new THREE.Vector3(p.x - (panel - 1) * (PW / 2), p.y, T / 2 + 0.006);

  const routeMaterial = lookMaterial("plastic", palette.accent, { roughness: 0.5 });
  const folds: THREE.Group[] = [];
  const pieces: { mesh: THREE.Mesh; from: number; to: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const fold = new THREE.Group();
    fold.position.x = i === 0 ? -PW / 2 : i === 2 ? PW / 2 : 0;
    const center = i === 0 ? -PW / 2 : i === 2 ? PW / 2 : 0;
    const sheet = new THREE.BoxGeometry(PW, PH, T, 1, 1, 1);
    const uv = sheet.attributes.uv;
    for (let n = 16; n < 20; n++) uv.setX(n, (uv.getX(n) + i) / 3);
    const print = printed({ map: texture, roughness: 0.86 });
    const panel = new THREE.Mesh(sheet, [mat.paper, mat.paper, mat.paper, mat.paper, print, mat.paper]);
    panel.position.x = center;
    fold.add(panel);
    // The route's run across this panel, raised ink on the paper.
    const indices = flatPoints.map((p, n) => (panelOf(p.x) === i ? n : -1)).filter((n) => n >= 0);
    if (indices.length > 1) {
      const from = Math.max(0, indices[0] - 1),
        to = Math.min(flatPoints.length - 1, indices[indices.length - 1] + 1);
      const local = flatPoints.slice(from, to + 1).map((p) => toLocal(p, i));
      // Clip the ends to the hinge so the ink meets across the crease.
      const clipX = (p: THREE.Vector3) => (p.x = clamp(p.x, i === 0 ? -PW : -PW / 2, i === 2 ? PW : i === 0 ? 0 : PW / 2));
      local.forEach(clipX);
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(local), local.length * 2, 0.019, 6, false),
        routeMaterial,
      );
      mesh.userData.cast = false;
      fold.add(mesh);
      pieces.push({ mesh, from: from / (flatPoints.length - 1), to: to / (flatPoints.length - 1) });
    }
    folds.push(fold);
    map.add(fold);
  }
  // Occlusion where paper meets the table: along the valley crease, and where the far panel's edge
  // props the tent (only once it is standing).
  const valley = contactShadow(PH * 1.04, 0.3, { x: 0, y: 0.002, z: HINGE.z - 0.05, opacity: 0.55 });
  stage.add(valley);
  const propLine = contactShadow(PH * 1.04, 0.26, { x: 0, y: 0.002, z: HINGE.z + 2 * PW * Math.cos(STAND), opacity: 0 });
  stage.add(propLine);
  const propMaterial = propLine.material as THREE.MeshBasicMaterial;

  // Pins: a graphite one at the start, and the accent one that travels the route. Each is pushed
  // into the paper: a short needle, the head close to the sheet, and a soft seat where it enters.
  const pin = (head: THREE.Material) => {
    const group = new THREE.Group();
    group.add(turned(cylinder(0.011, 0.11, mat.steel, 0, 0, 0.05, 8)));
    const collar = cylinder(0.045, 0.04, head, 0, 0, 0.1, 20);
    collar.rotation.x = Math.PI / 2;
    group.add(collar);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), head);
    cap.position.z = 0.16;
    group.add(cap);
    const seat = contactShadow(0.2, 0.2, { x: 0.025, y: -0.025, z: T / 2 + 0.002, opacity: 0.55 });
    seat.rotation.x = 0;
    group.add(seat);
    group.userData.seat = seat;
    map.add(group);
    return group;
  };
  const start = pin(mat.graphite);
  const traveller = pin(mat.accent);
  const place = (object: THREE.Object3D, u: number, lift: number) => {
    const p = flat.getPointAt(clamp(u));
    const panel = panelOf(p.x);
    const fold = folds[panel];
    fold.updateMatrix();
    object.position.copy(toLocal(p, panel).setZ(lift).applyMatrix4(fold.matrix));
    object.quaternion.copy(fold.quaternion);
    // The seat stays on the paper while the pin hovers, fainter until it is pushed home.
    const seat = object.userData.seat as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    seat.position.z = T / 2 + 0.002 - lift;
    seat.material.opacity = 0.55 * (1 - lift / 0.12);
  };
  /**
   * Pose the sheet from the middle panel's angle `phi` to the table (0: lying face down on the near
   * panel, the map closed; STAND: standing). The near panel always lies flat; the far one rides
   * folded on the middle panel's back until it passes upright, then opens so its edge stays on the
   * table and props the tent.
   */
  const basis = new THREE.Matrix4();
  const xAxis = new THREE.Vector3(),
    yAxis = new THREE.Vector3(-1, 0, 0),
    zAxis = new THREE.Vector3();
  const pose = (phi: number) => {
    xAxis.set(0, Math.sin(phi), Math.cos(phi));
    zAxis.set(0, -Math.cos(phi), Math.sin(phi));
    map.quaternion.setFromRotationMatrix(basis.makeBasis(xAxis, yAxis, zAxis));
    map.position.copy(HINGE).addScaledVector(xAxis, PW / 2);
    folds[0].rotation.y = Math.PI - phi;
    folds[2].rotation.y = Math.min(Math.PI - 0.03, 2 * (Math.PI - phi));
  };
  root.userData.mapFolds = folds;
  root.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION);
    const lift = smootherstep(progress(t, 150, 1650));
    pose(lerp(0.04, STAND, lift));
    propMaterial.opacity = 0.5 * smootherstep(progress(t, 1350, 1650));
    const draw = smootherstep(progress(t, 1700, 4650));
    for (const { mesh, from, to } of pieces) {
      const share = clamp((draw - from) / (to - from));
      const count = mesh.geometry.index!.count;
      mesh.geometry.setDrawRange(0, Math.floor((share * count) / 6) * 6);
      mesh.visible = share > 0;
    }
    const visible = t >= 1650;
    start.visible = traveller.visible = visible;
    place(start, 0, 0);
    const push = smootherstep(progress(t, 4650, 5100));
    place(traveller, draw, lerp(0.09, 0, push));
    phase(root, t, t < 1650 ? "unfold-map" : t < 4650 ? "draw-route" : "arrive", draw);
  };
  return finish(root);
}
