// The shared look of the 3D object scenes: light rigs per theme, image-based lighting, physically
// based material presets, contact shadows and framing. A direction opts in by setting
// `object.userData.look` (an ObjectLook) on the root it returns and by building its meshes with
// `lookMaterial`; mount.ts reads the look and does the rest. How to use it: src/objects/LOOK.md.
import * as THREE from "three";

export type LookTheme = "light" | "dark";
type Vec3 = [number, number, number];

/* ---------------------------------------------------------------- Light rigs */

export interface LightRig {
  /** Tone mapping operator. ACES keeps saturated colours punchy; AgX and Neutral roll highlights off more gently. */
  toneMapping: "aces" | "agx" | "neutral";
  exposure: number;
  environment: {
    /** `room`: three's RoomEnvironment (soft, even). `softbox`: a dark studio with a big key box and two strips (crisp highlights for metal and glass). */
    kind: "room" | "softbox" | "none";
    /** Image-based light on every standard material that is not a preset (presets carry their own strength). */
    intensity: number;
    /** Turns the environment about Y, in radians, to move reflections and highlights. */
    rotation: number;
  };
  /** Multiplies the reflection strength of every `lookMaterial` preset. */
  reflections: number;
  hemisphere: { sky: number; ground: number; intensity: number };
  key: {
    color: number;
    intensity: number;
    position: Vec3;
    /** A real shadow map from the key. Costs one extra depth pass per frame; prefer `contactShadow` when it is enough. */
    shadow: boolean;
    shadowMapSize: number;
    /** Penumbra blur in shadow-map texels (PCF). */
    shadowRadius: number;
  };
  /** An optional fill opposite the key; off (intensity 0) in the defaults. */
  fill: { color: number; intensity: number; position: Vec3 };
  rim: { color: number; intensity: number; position: Vec3 };
}

/**
 * The default rig per theme. Light is the rig every scene had before the look system, so a direction
 * that sets nothing keeps its light-theme appearance. Dark is a lower-key night rig: less ambient and
 * environment, a cooler sky, and a rim at about twice the light rig so silhouettes separate from a
 * dark card.
 */
export const lightRigs: Record<LookTheme, LightRig> = {
  light: {
    toneMapping: "aces",
    exposure: 1.05,
    environment: { kind: "room", intensity: 0.35, rotation: 0 },
    reflections: 1,
    hemisphere: { sky: 0xf5f4eb, ground: 0x596778, intensity: 2 },
    key: { color: 0xfff2dc, intensity: 2.5, position: [-3, 5, 7], shadow: false, shadowMapSize: 1024, shadowRadius: 4 },
    fill: { color: 0xffffff, intensity: 0, position: [5, 1, 6] },
    rim: { color: 0xc6ddff, intensity: 1.4, position: [4, 2, -3] },
  },
  dark: {
    toneMapping: "aces",
    exposure: 1,
    environment: { kind: "room", intensity: 0.2, rotation: 0 },
    reflections: 0.75,
    hemisphere: { sky: 0xb4c4e0, ground: 0x1c2430, intensity: 1.15 },
    key: { color: 0xffe8c8, intensity: 2.4, position: [-3, 5, 7], shadow: false, shadowMapSize: 1024, shadowRadius: 4 },
    fill: { color: 0xffffff, intensity: 0, position: [5, 1, 6] },
    rim: { color: 0xa8c6ff, intensity: 3, position: [4, 3, -4] },
  },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends Vec3 ? Vec3 : T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type LightRigOverride = DeepPartial<LightRig>;

/* ---------------------------------------------------------------- The look a direction declares */

export interface FramingOptions {
  /** Share of the frame's height the subject's projected bounds fill. Default 0.62. */
  fill?: number;
  /** Cap on the share of the frame's width, so wide subjects do not run to the edges. Default 0.78. */
  maxWidth?: number;
  /** Lift the subject's centre above the frame's centre, as a share of the frame's height. Default 0.02. */
  lift?: number;
  /** Which poses the bounds cover: the rest pose, or the whole loop (default for looping scenes). */
  sample?: "rest" | "loop";
}

export interface CameraOptions {
  /** Default orthographic, which every scene was authored for. */
  projection?: "orthographic" | "perspective";
  /** Vertical field of view in degrees, for perspective. Default 30. */
  fov?: number;
  /** Degrees the camera looks down on the subject. Default 0 (straight on, as authored). */
  pitch?: number;
  /** Degrees the camera orbits to the subject's right. Default 0. */
  yaw?: number;
}

export interface ContactShadowOptions {
  /** Darkness at the centre, 0..1. Default 0.42 (0.5 in dark). */
  opacity?: number;
  /** Footprint relative to the subject's base. Default 1.3. */
  spread?: number;
  /** Local Y of the floor; default the subject's lowest point at rest. */
  y?: number;
  /** Colour of the shadow. Default black; a tint (a deep blue, a warm brown) reads softer. */
  color?: number;
}

export interface ObjectLook {
  /** Rig changes for both themes, then for each theme on top. */
  rig?: { both?: LightRigOverride; light?: LightRigOverride; dark?: LightRigOverride };
  /** Fit the camera to the subject (default), or false to keep the legacy fixed frame. */
  framing?: FramingOptions | false;
  camera?: CameraOptions;
  /** A baked soft shadow under the subject, in the root's own floor plane. */
  contactShadow?: boolean | ContactShadowOptions;
  /** Every mesh casts and receives the key's shadow map (and the key casts one). */
  castShadows?: boolean;
  /**
   * What glass (`transmission`) sees through itself where the scene has nothing behind it: close
   * to the card's colour per theme. Without it three refracts a half-transparent white and glass
   * turns into a white blob on a transparent canvas.
   */
  transmissionBackdrop?: Partial<Record<LookTheme, number>>;
}

export interface ResolvedLook {
  rig: LightRig;
  framing: Required<FramingOptions> | false;
  camera: Required<CameraOptions>;
  contactShadow: (Required<Omit<ContactShadowOptions, "y">> & { y?: number }) | false;
  castShadows: boolean;
  transmissionBackdrop: number;
}

function merge<T>(base: T, patch: DeepPartial<T> | undefined): T {
  if (!patch) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const current = out[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) && current && typeof current === "object"
        ? merge(current, value as DeepPartial<typeof current>)
        : value;
  }
  return out as T;
}

/** The look mount.ts applies for a theme: the defaults, then the direction's look. */
export function resolveLook(look: ObjectLook | undefined, theme: LookTheme): ResolvedLook {
  let rig = merge(merge(lightRigs[theme], look?.rig?.both), look?.rig?.[theme]);
  if (look?.castShadows) rig = merge(rig, { key: { shadow: true } });
  const shadow = look?.contactShadow;
  return {
    rig,
    framing: look?.framing === false ? false : { fill: 0.62, maxWidth: 0.78, lift: 0.02, sample: "loop", ...look?.framing },
    camera: { projection: "orthographic", fov: 30, pitch: 0, yaw: 0, ...look?.camera },
    contactShadow: shadow
      ? { opacity: theme === "dark" ? 0.5 : 0.42, spread: 1.3, color: 0x000000, ...(shadow === true ? {} : shadow) }
      : false,
    castShadows: Boolean(look?.castShadows),
    transmissionBackdrop: look?.transmissionBackdrop?.[theme] ?? (theme === "dark" ? 0x1c2433 : 0xeceee9),
  };
}

export function toneMappingFor(rig: LightRig) {
  return { aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, neutral: THREE.NeutralToneMapping }[rig.toneMapping];
}

/**
 * Add the rig's hemisphere, key (with its shadow map settings), optional fill and rim to a scene.
 * `phone` (a stage under 768px wide) halves the shadow map and its blur radius in texels: the same
 * penumbra in world units, a quarter of the depth pass, on a canvas a third as wide.
 */
export function addRigLights(scene: THREE.Scene, rig: LightRig, phone = false) {
  scene.add(new THREE.HemisphereLight(rig.hemisphere.sky, rig.hemisphere.ground, rig.hemisphere.intensity));
  const key = new THREE.DirectionalLight(rig.key.color, rig.key.intensity);
  key.position.set(...rig.key.position);
  key.castShadow = rig.key.shadow;
  const texels = phone ? 0.5 : 1;
  key.shadow.mapSize.set(rig.key.shadowMapSize * texels, rig.key.shadowMapSize * texels);
  key.shadow.radius = rig.key.shadowRadius * texels;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0003;
  scene.add(key);
  if (rig.fill.intensity > 0) {
    const fill = new THREE.DirectionalLight(rig.fill.color, rig.fill.intensity);
    fill.position.set(...rig.fill.position);
    scene.add(fill);
  }
  const rim = new THREE.DirectionalLight(rig.rim.color, rig.rim.intensity);
  rim.position.set(...rig.rim.position);
  scene.add(rim);
}

/* ---------------------------------------------------------------- Environments */

/** A small dark studio: one large soft key box above-left, a strip each side and a floor bounce. */
export class SoftboxEnvironment extends THREE.Scene {
  constructor() {
    super();
    const room = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 12),
      new THREE.MeshBasicMaterial({ color: 0x1b1d22, side: THREE.BackSide }),
    );
    room.position.y = 2;
    this.add(room);
    const panel = (w: number, h: number, intensity: number, position: Vec3, color = 0xffffff) => {
      const light = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
      );
      light.position.set(...position);
      light.lookAt(0, 0, 0);
      this.add(light);
    };
    panel(5, 3.5, 6, [-3, 5, 3], 0xfff4e6); // key box
    panel(0.6, 6, 8, [5.5, 1.5, -1]); // right strip (rim)
    panel(0.6, 6, 3, [-5.5, 1.5, -2], 0xe6f0ff); // left strip
    panel(4, 1.2, 2, [0, 1.5, 5.8]); // front fill
    panel(10, 10, 0.25, [0, -1.9, 0], 0xf0ebe2); // floor bounce
  }
  dispose() {
    this.traverse((item) => {
      const mesh = item as THREE.Mesh;
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material | undefined)?.dispose();
    });
  }
}

/** PMREM-filter the rig's environment once per renderer. Returns null for `none`. */
export async function buildEnvironment(renderer: THREE.WebGLRenderer, rig: LightRig) {
  if (rig.environment.kind === "none") return null;
  const source =
    rig.environment.kind === "softbox"
      ? new SoftboxEnvironment()
      : new (await import("three/addons/environments/RoomEnvironment.js")).RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(source, 0.04);
  source.dispose();
  pmrem.dispose();
  return target;
}

/* ---------------------------------------------------------------- Material presets */

export type MaterialPreset = "metal" | "brushedMetal" | "glass" | "ceramic" | "paper" | "plastic" | "rubber" | "felt";

type PresetParameters = THREE.MeshPhysicalMaterialParameters & {
  /** Paper and felt: tiles of the procedural fibre texture across the mesh's UVs. Default 4. */
  grain?: number;
};

/** Reflection strength per preset, before the rig's `reflections`. */
const presetReflections: Record<MaterialPreset, number> = {
  metal: 1.15,
  brushedMetal: 1,
  glass: 1.1,
  ceramic: 0.9,
  paper: 0.3,
  plastic: 0.6,
  rubber: 0.25,
  felt: 0.3,
};

/**
 * A physically based material for one look. Standard where it is enough (metal, paper, plastic,
 * rubber); Physical only for what needs it (anisotropy, transmission, clearcoat, sheen). Every
 * option of MeshPhysicalMaterial can be overridden; colours are sRGB hex like the rest of the scenes.
 */
export function lookMaterial(preset: MaterialPreset, color: THREE.ColorRepresentation, options: PresetParameters = {}) {
  const { grain = 4, ...overrides } = options;
  let material: THREE.MeshStandardMaterial;
  switch (preset) {
    case "metal":
      material = new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: 0.24 });
      break;
    case "brushedMetal":
      material = new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.36, anisotropy: 0.65 });
      break;
    case "glass":
      material = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0,
        roughness: 0.04,
        transmission: 1,
        thickness: 0.6,
        ior: 1.5,
        attenuationColor: new THREE.Color(0xd4e8ff),
        attenuationDistance: 2,
        specularIntensity: 1,
      });
      break;
    case "ceramic":
      material = new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.06 });
      break;
    case "paper": {
      const { map, normalMap } = fibreTextures(grain);
      material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0,
        roughness: 0.94,
        map,
        normalMap,
        normalScale: new THREE.Vector2(0.18, 0.18),
      });
      break;
    }
    case "plastic":
      material = new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.48 });
      break;
    case "rubber":
      material = new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.9 });
      break;
    case "felt": {
      const { normalMap } = fibreTextures(grain);
      const tint = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.45);
      material = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0,
        roughness: 1,
        sheen: 1,
        sheenRoughness: 0.8,
        sheenColor: tint,
        normalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
      });
      break;
    }
  }
  material.setValues(overrides);
  material.userData.lookPreset = preset;
  material.userData.lookReflections = presetReflections[preset] * (overrides.envMapIntensity ?? 1);
  return material;
}

/** Per-theme material changes, applied by mount.ts after the scene is built. */
export interface MaterialThemeChange {
  color?: THREE.ColorRepresentation;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  roughness?: number;
  opacity?: number;
}

/**
 * Tag a material with changes for one theme, e.g. a plinth 30% darker at night or windows that glow:
 * `themed(lookMaterial("plastic", 0x2b2f2e), { dark: { color: 0x1d201f } })`.
 */
export function themed<M extends THREE.Material>(material: M, changes: Partial<Record<LookTheme, MaterialThemeChange>>) {
  material.userData.themes = changes;
  return material;
}

/** Darken (amount < 0) or lighten (> 0) an sRGB hex colour, for the dark variant of a surface. */
export function shade(color: number, amount: number) {
  const value = new THREE.Color(color);
  return amount < 0 ? value.multiplyScalar(1 + amount).getHex() : value.lerp(new THREE.Color(0xffffff), amount).getHex();
}

/** Seeded value noise, so the fibre texture is the same on every render (stable screenshots). */
function fibreField(size: number) {
  let seed = 0x2f6b4f;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const field = new Float32Array(size * size);
  // Long horizontal-ish fibres over fine tooth.
  for (let i = 0; i < field.length; i++) field[i] = random() * 0.35;
  for (let f = 0; f < size * 3; f++) {
    let x = random() * size,
      y = random() * size;
    const angle = (random() - 0.5) * 1.2,
      length = 6 + random() * 18,
      weight = 0.25 + random() * 0.4;
    for (let s = 0; s < length; s++) {
      field[(Math.floor(y + size) % size) * size + (Math.floor(x + size) % size)] += weight;
      x += Math.cos(angle);
      y += Math.sin(angle);
    }
  }
  let max = 0;
  for (const v of field) max = Math.max(max, v);
  for (let i = 0; i < field.length; i++) field[i] /= max;
  return field;
}

const FIBRE_SIZE = 128;
let fibreCache: Float32Array | undefined;
/** A fresh pair of small textures per material (disposed with it): albedo tooth and a fibre normal map. */
function fibreTextures(repeat: number) {
  const size = FIBRE_SIZE;
  const field = (fibreCache ??= fibreField(size));
  const albedo = new Uint8Array(size * size * 4),
    normal = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => field[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const tone = Math.round(255 * (0.93 + 0.07 * (1 - field[y * size + x])));
      albedo.set([tone, tone, tone, 255], i);
      const dx = at(x + 1, y) - at(x - 1, y),
        dy = at(x, y + 1) - at(x, y - 1);
      const n = new THREE.Vector3(-dx * 2, -dy * 2, 1).normalize();
      normal.set([(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255, 255], i);
    }
  const texture = (data: Uint8Array, srgb: boolean) => {
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };
  return { map: texture(albedo, true), normalMap: texture(normal, false) };
}

/* ---------------------------------------------------------------- Applying a look to a built scene */

/** Every texture a material holds, except the shared scene environment. */
export function materialTextures(material: THREE.Material) {
  return Object.entries(material)
    .filter(([key, value]) => key !== "envMap" && (value as THREE.Texture | null)?.isTexture)
    .map(([, value]) => value as THREE.Texture);
}

/**
 * Give preset materials the environment at their own strength (three otherwise applies the scene's
 * one `environmentIntensity` to every material), and apply per-theme material changes.
 */
export function applyMaterials(object: THREE.Object3D, environment: THREE.Texture | null, rig: LightRig, theme: LookTheme) {
  const seen = new Set<THREE.Material>();
  object.traverse((item) => {
    const mesh = item as THREE.Mesh;
    if (!mesh.material) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (seen.has(material)) continue;
      seen.add(material);
      const standard = material as THREE.MeshStandardMaterial;
      if (environment && material.userData.lookReflections !== undefined && standard.isMeshStandardMaterial) {
        standard.envMap = environment;
        standard.envMapIntensity = material.userData.lookReflections * rig.reflections;
        standard.envMapRotation.y = rig.environment.rotation;
      }
      const change = (material.userData.themes as Partial<Record<LookTheme, MaterialThemeChange>> | undefined)?.[theme];
      if (change) {
        const target = material as THREE.MeshStandardMaterial;
        if (change.color !== undefined) target.color?.set(change.color);
        if (change.emissive !== undefined) target.emissive?.set(change.emissive);
        if (change.emissiveIntensity !== undefined) target.emissiveIntensity = change.emissiveIntensity;
        if (change.roughness !== undefined) target.roughness = change.roughness;
        if (change.opacity !== undefined) {
          target.opacity = change.opacity;
          target.transparent = change.opacity < 1;
        }
      }
      material.needsUpdate = true;
    }
  });
}

/** True when any material under `object` refracts (transmission), which costs an extra pass per frame. */
export function usesTransmission(object: THREE.Object3D) {
  let found = false;
  object.traverse((item) => {
    const mesh = item as THREE.Mesh;
    for (const material of Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [])
      if (((material as THREE.MeshPhysicalMaterial).transmission ?? 0) > 0) found = true;
  });
  return found;
}

/**
 * A plane behind everything, parented to the camera, that only writes colour inside render targets
 * (three's transmission pass), so glass refracts the card's colour while the canvas itself stays
 * transparent. Call `fit()` after the camera's far plane changes.
 */
export function addTransmissionBackdrop(camera: THREE.Camera & { far: number }, color: number) {
  const material = new THREE.MeshBasicMaterial({ color, depthWrite: false, toneMapped: false });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  backdrop.userData.frameIgnore = true;
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -10;
  backdrop.onBeforeRender = (renderer) => {
    material.colorWrite = renderer.getRenderTarget() !== null;
  };
  camera.add(backdrop);
  const fit = () => {
    const depth = camera.far * 0.9;
    backdrop.position.set(0, 0, -depth);
    backdrop.scale.setScalar(Math.max(depth * 4, 200));
  };
  fit();
  return { backdrop, fit };
}

/* ---------------------------------------------------------------- Contact shadow */

/** A radial falloff, baked once per shadow (64², a few kB). */
function shadowTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const r = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const a = Math.max(0, 1 - r);
      data.set([255, 255, 255, Math.round(255 * a * a * (3 - 2 * a))], (y * size + x) * 4);
    }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * A soft elliptical shadow on a horizontal plane, centred at `(x, y, z)` in the parent's space. One
 * draw call and two triangles; no shadow map. Excluded from framing.
 */
export function contactShadow(width: number, depth: number, options: ContactShadowOptions & { x?: number; z?: number } = {}) {
  const { opacity = 0.42, color = 0x000000, x = 0, y = 0, z = 0 } = options;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: shadowTexture(),
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(width, depth, 1);
  mesh.position.set(x, y, z);
  mesh.renderOrder = -1;
  mesh.name = "contact-shadow";
  mesh.userData.frameIgnore = true;
  return mesh;
}

/** Place a contact shadow under the subject at its rest pose, in the root's own floor plane. */
export function addContactShadow(object: THREE.Object3D, options: Required<Omit<ContactShadowOptions, "y">> & { y?: number }) {
  object.updateMatrixWorld(true);
  const toLocal = object.matrixWorld.clone().invert();
  const box = new THREE.Box3();
  eachSubjectPoint(object, (point) => box.expandByPoint(point.applyMatrix4(toLocal)));
  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3()),
    centre = box.getCenter(new THREE.Vector3());
  const footprint = Math.max(size.x, size.z, 0.2);
  const shadow = contactShadow(
    Math.max(size.x, footprint * 0.5) * options.spread,
    Math.max(size.z, footprint * 0.5) * options.spread,
    {
      ...options,
      x: centre.x,
      y: (options.y ?? box.min.y) + 0.003,
      z: centre.z,
    },
  );
  object.add(shadow);
  return shadow;
}

/* ---------------------------------------------------------------- Framing */

/** Vertices sampled per pose across the whole subject; every mesh keeps at least MIN_POINTS_PER_MESH. */
const POINTS_PER_POSE = 3000;
const MIN_POINTS_PER_MESH = 48;
const point = new THREE.Vector3();

/** The visible meshes and lines that count toward the subject's bounds. */
function framedParts(object: THREE.Object3D) {
  const parts: { mesh: THREE.Mesh; position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute }[] = [];
  object.traverseVisible((item) => {
    if (item.userData.frameIgnore) return;
    const mesh = item as THREE.Mesh;
    const position = mesh.geometry?.getAttribute("position");
    if (!position || !(mesh.isMesh || (item as THREE.Line).isLine)) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (materials.every((m) => !m || !m.visible || m.opacity === 0)) return;
    parts.push({ mesh, position });
  });
  return parts;
}

/**
 * Visit sampled world-space vertices of every framed part under `object`: about POINTS_PER_POSE in
 * all, shared by vertex count, so a heavy skinned model costs no more than a few boxes.
 */
function eachSubjectPoint(object: THREE.Object3D, visit: (point: THREE.Vector3) => void) {
  const parts = framedParts(object);
  const total = parts.reduce((sum, part) => sum + part.position.count, 0);
  for (const { mesh, position } of parts) {
    const allowed = Math.max(Math.min(position.count, MIN_POINTS_PER_MESH), (POINTS_PER_POSE * position.count) / total);
    const stride = Math.max(1, Math.ceil(position.count / allowed));
    for (let i = 0; i < position.count; i += stride) {
      if (mesh.isMesh) mesh.getVertexPosition(i, point);
      else point.fromBufferAttribute(position, i);
      visit(point.applyMatrix4(mesh.matrixWorld));
    }
  }
}

/** The camera's orientation for a look: yaw about Y, then pitch down. */
export function cameraRotation(camera: Required<CameraOptions>) {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(THREE.MathUtils.degToRad(-camera.pitch), THREE.MathUtils.degToRad(camera.yaw), 0, "YXZ"),
  );
}

/**
 * The subject's points in the camera's view space (x right, y up, z toward the camera), over the
 * poses the framing samples. Measured once per mount; `fitCamera` re-fits from them on every resize.
 */
export function measureSubject(object: THREE.Object3D, rotation: THREE.Quaternion, times: number[]): Float32Array {
  const inverse = rotation.clone().invert();
  const points: number[] = [];
  for (const time of times) {
    object.userData.animate?.(time);
    object.updateMatrixWorld(true);
    eachSubjectPoint(object, (p) => {
      p.applyQuaternion(inverse);
      points.push(p.x, p.y, p.z);
    });
  }
  return Float32Array.from(points);
}

/** The times a framing samples: the rest pose, and eight poses round the loop when it loops. */
export function framingTimes(object: THREE.Object3D, framing: Required<FramingOptions>, restTime: number) {
  const loop = object.userData.loopDuration as number | undefined;
  if (!loop || framing.sample === "rest") return [restTime];
  return [restTime, ...Array.from({ length: 8 }, (_, i) => (loop * i) / 8)];
}

export interface FitResult {
  /** The frame's half height in world units at the subject. */
  halfHeight: number;
  /** Share of the frame's height and width the subject spans. */
  fillHeight: number;
  fillWidth: number;
}

/**
 * Fit the camera so the subject's bounds fill `framing.fill` of the frame's height (never more than
 * `maxWidth` of its width), centred and lifted by `lift`. Orthographic or perspective.
 */
export function fitCamera(
  camera: THREE.OrthographicCamera | THREE.PerspectiveCamera,
  points: Float32Array,
  aspect: number,
  framing: Required<FramingOptions>,
  rotation: THREE.Quaternion,
): FitResult | null {
  if (points.length < 3) return null;
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  for (let i = 0; i < points.length; i += 3) {
    minX = Math.min(minX, points[i]);
    maxX = Math.max(maxX, points[i]);
    minY = Math.min(minY, points[i + 1]);
    maxY = Math.max(maxY, points[i + 1]);
    minZ = Math.min(minZ, points[i + 2]);
    maxZ = Math.max(maxZ, points[i + 2]);
  }
  const cx = (minX + maxX) / 2,
    cy = (minY + maxY) / 2;
  const spanX = Math.max(maxX - minX, 1e-3),
    spanY = Math.max(maxY - minY, 1e-3);
  let halfHeight: number;
  let distance: number;
  if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.aspect = aspect;
    const tanV = Math.tan(THREE.MathUtils.degToRad(perspective.fov / 2)),
      tanH = tanV * aspect;
    distance = 0;
    for (let i = 0; i < points.length; i += 3) {
      const need =
        points[i + 2] +
        Math.max(Math.abs(points[i] - cx) / (tanH * framing.maxWidth), Math.abs(points[i + 1] - cy) / (tanV * framing.fill));
      distance = Math.max(distance, need);
    }
    halfHeight = (distance - (minZ + maxZ) / 2) * tanV;
    perspective.near = Math.max(0.05, (distance - maxZ) * 0.5);
    perspective.far = distance - minZ + 20;
  } else {
    const ortho = camera as THREE.OrthographicCamera;
    halfHeight = Math.max(spanY / (2 * framing.fill), spanX / (2 * framing.maxWidth * aspect));
    ortho.left = -halfHeight * aspect;
    ortho.right = halfHeight * aspect;
    ortho.top = halfHeight;
    ortho.bottom = -halfHeight;
    distance = maxZ + 10;
    ortho.near = 0.1;
    ortho.far = maxZ - minZ + 20;
  }
  // The subject's centre sits `lift` of the frame's height above the frame's centre.
  const lens = new THREE.Vector3(cx, cy - framing.lift * 2 * halfHeight, distance).applyQuaternion(rotation);
  camera.position.copy(lens);
  camera.quaternion.copy(rotation);
  camera.updateProjectionMatrix();
  return { halfHeight, fillHeight: spanY / (2 * halfHeight), fillWidth: spanX / (2 * halfHeight * aspect) };
}

/**
 * World radius for a tube that draws `px` wide on a 360px card, for a subject `subjectHeight` world
 * units tall at the default fill. Use it for every wire, net and orbit: `Line` is 1px and aliases.
 */
export function lineRadius(subjectHeight: number, px = 1.5, cardHeight = 225, fill = 0.62) {
  return (px / 2) * (subjectHeight / (fill * cardHeight));
}
