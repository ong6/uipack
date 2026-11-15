// PROTOTYPE (studio-style exploration, not library code): restyles a built Studio object for one of
// five non-photographic treatments. It swaps every lit PBR material for one small unlit shader,
// adds ink silhouettes (an inverted hull widened in screen space) and crease lines (fat
// LineSegments2), removes the sweep and the shadow-map floor, and recolours the baked contact
// shadows. Static parts are merged per rigid group (the nearest animated ancestor), so the draw
// count stays near the photographic Studio's. Hex literals here are prototype-only: a real
// implementation reads the page's role variables.
import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type Theme = "light" | "dark";
type Role = "light" | "dark" | "accent" | "accentThin" | "print" | "led";

/** junxiong.dev's colours (STYLE.md). Prototype literals. */
export const SITE = {
  light: { page: 0xf3efe7, ink: 0x29231f, cobalt: 0x234ea2 },
  dark: { page: 0x151311, ink: 0xf2ece3, cobalt: 0x9ab6ff },
} as const;

/** The palette the Studio builders get in every treatment, so roles can be read back from colours. */
export const BUILD_PALETTE = { paper: 0xf3efe7, ink: 0x29231f, muted: 0x85776e, accent: 0x234ea2 };

const mix = (a: number, b: number, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();

/* ------------------------------------------------------------------ specs */

interface FillSpec {
  /** 0 flat, 1 toon (three steps), 2 dot screen whose dot area follows the light. */
  mode: 0 | 1 | 2;
  tones: [number, number, number];
  dot?: number;
  /** Dot coverage added everywhere (dark materials print denser). */
  density?: number;
  gain?: number;
  /** Light term below which dots start (1 = facing the key). */
  threshold?: number;
  /** Largest dot coverage. */
  max?: number;
}
interface LineSpec {
  color: number;
  width: number;
}
interface RoleSpec {
  fill: FillSpec;
  hull?: LineSpec;
  crease?: LineSpec;
}
export interface Treatment {
  id: number;
  name: string;
  roles: Record<Role, RoleSpec>;
  /** Contact shadow: soft falloff, hard-edged ellipse, or printed as dots. */
  shadow: { mode: 0 | 1 | 2; color: number; opacity: number };
  /** Dashed hidden lines behind the faces. */
  hidden?: { color: number; opacity: number };
  /** Dot cell in CSS px (aligned to the page's 12px grid). */
  cell: number;
  /** The print on the atlas: ink line coverage colour. */
  printInk: number;
  overlay?: "blueprint";
  grid?: boolean;
}

/** Light direction: the Studio key (high, left, front), in world space. */
const KEY = new THREE.Vector3(-5.5, 7, 3.5).normalize();

export function treatment(id: number, theme: Theme): Treatment {
  const spec = baseTreatment(id, theme);
  spec.roles.accentThin ??= spec.roles.accent;
  return spec as Treatment;
}

function baseTreatment(id: number, theme: Theme): Omit<Treatment, "roles"> & { roles: Record<Exclude<Role, "accentThin">, RoleSpec> & { accentThin?: RoleSpec } } {
  const { page, ink, cobalt } = SITE[theme];
  const dark = theme === "dark";
  const flat = (c: number): FillSpec => ({ mode: 0, tones: [c, c, c] });
  switch (id) {
    case 1: {
      // Ink line art: unlit page-toned faces, ink silhouettes and creases, one cobalt part.
      const hull = { color: ink, width: 2 };
      const crease = { color: ink, width: 1.1 };
      return {
        id,
        name: "Ink line art",
        roles: {
          light: { fill: flat(dark ? mix(page, ink, 0.1) : page), hull, crease },
          dark: { fill: flat(dark ? page : mix(page, ink, 0.13)), hull, crease },
          accent: { fill: flat(cobalt), hull, crease: { color: page, width: 1 } },
          print: { fill: flat(dark ? mix(page, ink, 0.1) : page), hull, crease },
          led: { fill: flat(ink) },
        },
        shadow: { mode: 1, color: ink, opacity: dark ? 0.14 : 0.1 },
        cell: 6,
        printInk: ink,
      };
    }
    case 2: {
      // Blueprint blend: a line model on the dotted canvas, hidden lines dashed, mono callouts.
      const hull = { color: ink, width: 1.5 };
      const crease = { color: ink, width: 1 };
      return {
        id,
        name: "Blueprint blend",
        roles: {
          light: { fill: flat(page), hull, crease },
          dark: { fill: flat(page), hull, crease },
          accent: { fill: flat(page), hull: { color: cobalt, width: 2 }, crease: { color: cobalt, width: 1.5 } },
          accentThin: { fill: flat(cobalt), hull: { color: cobalt, width: 1 } },
          print: { fill: flat(page), hull, crease },
          led: { fill: flat(ink) },
        },
        shadow: { mode: 0, color: ink, opacity: 0 },
        hidden: { color: ink, opacity: dark ? 0.22 : 0.16 },
        cell: 12,
        printInk: ink,
        overlay: "blueprint",
        grid: true,
      };
    }
    case 3: {
      // Halftone: page-toned faces, shadow printed as the site's dot screen, ink outlines.
      const hull = { color: ink, width: 1.75 };
      const crease = { color: ink, width: 1 };
      const surface = dark ? mix(page, ink, 0.17) : page;
      const shade = dark ? page : ink;
      const screen = (base: number, density: number): FillSpec => ({
        mode: 2,
        tones: [base, base, base],
        dot: shade,
        density,
        gain: 0.8,
        threshold: 0.42,
        max: 0.62,
      });
      return {
        id,
        name: "Halftone shading",
        roles: {
          light: { fill: screen(surface, 0), hull, crease },
          dark: { fill: screen(surface, 0.2), hull, crease },
          accent: { fill: { ...screen(cobalt, 0), dot: dark ? page : ink }, hull, crease: { color: page, width: 1 } },
          print: { fill: screen(surface, 0), hull, crease },
          led: { fill: flat(ink) },
        },
        shadow: { mode: 2, color: dark ? 0x000000 : ink, opacity: 0.9 },
        cell: 6,
        printInk: ink,
      };
    }
    case 4: {
      // Paper and ink: three flat tones per material, no specular, an ink contact shadow.
      const hull = { color: ink, width: 1.25 };
      const steps = (t0: number, t1: number, t2: number): FillSpec => ({ mode: 1, tones: [t0, t1, t2] });
      const paperTones = dark
        ? steps(mix(page, ink, 0.34), mix(page, ink, 0.2), mix(page, ink, 0.09))
        : steps(mix(page, 0xffffff, 0.6), page, mix(page, ink, 0.17));
      const inkTones = dark
        ? steps(mix(page, ink, 0.12), mix(page, ink, 0.06), mix(page, 0x000000, 0.35))
        : steps(mix(page, ink, 0.5), mix(page, ink, 0.68), mix(page, ink, 0.86));
      const cobaltTones = dark
        ? steps(cobalt, mix(cobalt, page, 0.3), mix(cobalt, page, 0.58))
        : steps(mix(cobalt, 0xffffff, 0.22), cobalt, mix(cobalt, ink, 0.5));
      return {
        id,
        name: "Paper and ink",
        roles: {
          light: { fill: paperTones, hull },
          dark: { fill: inkTones, hull },
          accent: { fill: cobaltTones, hull },
          print: { fill: paperTones, hull },
          led: { fill: flat(dark ? ink : page) },
        },
        shadow: { mode: 1, color: dark ? 0x000000 : ink, opacity: dark ? 0.55 : 0.85 },
        cell: 6,
        printInk: ink,
      };
    }
    default: {
      // Grid relief: the object printed with the page's own 12px dot grid, the dots growing with shade.
      const hull = { color: ink, width: 1.25 };
      const crease = { color: mix(ink, page, 0.45), width: 1 };
      const surface = dark ? mix(page, ink, 0.12) : page;
      const shade = dark ? page : ink;
      const grid = (base: number, dot: number, density: number): FillSpec => ({
        mode: 2,
        tones: [base, base, base],
        dot,
        density,
        gain: 0.36,
        threshold: 0.4,
        max: 0.26,
      });
      return {
        id: 5,
        name: "Grid relief",
        roles: {
          light: { fill: grid(surface, shade, 0.02), hull, crease },
          dark: { fill: grid(surface, shade, 0.07), hull, crease },
          accent: { fill: grid(surface, cobalt, 0.2), hull: { color: cobalt, width: 1.5 }, crease: { color: cobalt, width: 1 } },
          accentThin: { fill: flat(cobalt), hull: { color: cobalt, width: 1 } },
          print: { fill: grid(surface, shade, 0.02), hull, crease },
          led: { fill: flat(ink) },
        },
        shadow: { mode: 2, color: dark ? 0x000000 : ink, opacity: 0.45 },
        cell: 12,
        printInk: mix(ink, page, 0.35),
        grid: true,
      };
    }
  }
}

/* ------------------------------------------------------------------ shaders */

/** Shared per-frame uniforms: canvas size in CSS px and the pixel ratio. */
export const screen = {
  resolution: { value: new THREE.Vector2(1, 1) },
  pixelRatio: { value: 1 },
};

const fillVertex = /* glsl */ `
  varying vec3 vNormalW;
  varying vec2 vUv;
  void main() {
    vec4 p = vec4( position, 1.0 );
    vec3 n = normal;
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
      n = mat3( instanceMatrix ) * n;
    #endif
    vNormalW = normalize( mat3( modelMatrix ) * n );
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * p;
  }`;

const fillFragment = /* glsl */ `
  uniform vec3 tone0;
  uniform vec3 tone1;
  uniform vec3 tone2;
  uniform vec3 dotColor;
  uniform vec3 keyDir;
  uniform int mode;
  uniform float density;
  uniform float gain;
  uniform float threshold;
  uniform float maxCoverage;
  uniform float cell;
  uniform vec2 resolution;
  uniform float pixelRatio;
  uniform sampler2D printMap;
  uniform float usePrint;
  uniform vec3 printInk;
  varying vec3 vNormalW;
  varying vec2 vUv;
  void main() {
    vec3 n = normalize( vNormalW );
    if ( !gl_FrontFacing ) n = -n;
    float l = dot( n, keyDir );
    vec3 col = tone0;
    if ( mode == 1 ) {
      col = l > 0.62 ? tone0 : ( l > 0.12 ? tone1 : tone2 );
    } else if ( mode == 2 ) {
      // Dot area follows shade: none on faces turned to the key, full on faces turned away.
      float coverage = clamp( gain * max( threshold - l, 0.0 ) + density, 0.0, maxCoverage );
      vec2 css = vec2( gl_FragCoord.x, resolution.y * pixelRatio - gl_FragCoord.y ) / pixelRatio;
      vec2 f = fract( css / cell + 0.5 ) - 0.5;
      float d = length( f ) * cell;
      float r = sqrt( coverage / 3.14159 ) * cell * 1.08;
      float aa = max( fwidth( d ), 0.35 );
      float printed = ( 1.0 - smoothstep( r - aa, r + aa, d ) ) * step( 0.015, coverage );
      col = mix( tone0, dotColor, printed );
    }
    if ( usePrint > 0.5 ) col = mix( col, printInk, texture2D( printMap, vUv ).a );
    gl_FragColor = vec4( col, 1.0 );
    #include <colorspace_fragment>
  }`;

function fillMaterial(spec: FillSpec, cell: number, print?: { map: THREE.Texture; ink: number }) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tone0: { value: new THREE.Color(spec.tones[0]) },
      tone1: { value: new THREE.Color(spec.tones[1]) },
      tone2: { value: new THREE.Color(spec.tones[2]) },
      dotColor: { value: new THREE.Color(spec.dot ?? 0) },
      keyDir: { value: KEY },
      mode: { value: spec.mode },
      density: { value: spec.density ?? 0 },
      gain: { value: spec.gain ?? 0.6 },
      threshold: { value: spec.threshold ?? 0.78 },
      maxCoverage: { value: spec.max ?? 0.92 },
      cell: { value: cell },
      resolution: screen.resolution,
      pixelRatio: screen.pixelRatio,
      printMap: { value: print?.map ?? null },
      usePrint: { value: print ? 1 : 0 },
      printInk: { value: new THREE.Color(print?.ink ?? 0) },
    },
    vertexShader: fillVertex,
    fragmentShader: fillFragment,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 2,
  });
  material.name = "fill";
  return material;
}

const hullVertex = /* glsl */ `
  attribute vec3 smoothNormal;
  uniform vec2 resolution;
  uniform float width;
  void main() {
    vec4 p = vec4( position, 1.0 );
    vec3 n = smoothNormal;
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
      n = mat3( instanceMatrix ) * n;
    #endif
    vec4 world = modelMatrix * p;
    vec4 clip = projectionMatrix * viewMatrix * world;
    vec3 nView = normalize( mat3( viewMatrix ) * normalize( mat3( modelMatrix ) * n ) );
    vec2 dir = ( projectionMatrix * vec4( nView, 0.0 ) ).xy * resolution;
    float len = length( dir );
    dir = len > 1e-6 ? dir / len : vec2( 0.0 );
    clip.xy += dir * width * 2.0 / resolution * clip.w;
    gl_Position = clip;
  }`;
const hullFragment = /* glsl */ `
  uniform vec3 color;
  void main() {
    gl_FragColor = vec4( color, 1.0 );
    #include <colorspace_fragment>
  }`;

function hullMaterial(spec: LineSpec) {
  const material = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(spec.color) }, width: { value: spec.width }, resolution: screen.resolution },
    vertexShader: hullVertex,
    fragmentShader: hullFragment,
    side: THREE.BackSide,
  });
  material.name = "hull";
  return material;
}

const lineMaterials: LineMaterial[] = [];
function creaseMaterial(spec: LineSpec, hidden?: { color: number; opacity: number }) {
  const material = new LineMaterial({
    color: hidden ? hidden.color : spec.color,
    linewidth: hidden ? Math.max(1, spec.width * 0.8) : spec.width,
    worldUnits: false,
    dashed: Boolean(hidden),
    dashSize: 0.045,
    gapSize: 0.035,
    transparent: Boolean(hidden),
    opacity: hidden ? hidden.opacity : 1,
    depthWrite: !hidden,
  });
  if (hidden) material.depthFunc = THREE.GreaterDepth;
  lineMaterials.push(material);
  return material;
}

const shadowFragment = /* glsl */ `
  uniform vec3 color;
  uniform float opacity;
  uniform int mode;
  uniform float cell;
  uniform vec2 resolution;
  uniform float pixelRatio;
  varying vec2 vUv;
  void main() {
    float r = length( vUv - 0.5 ) * 2.0;
    float falloff = smoothstep( 1.0, 0.0, r );
    float a = falloff * falloff * opacity;
    if ( mode == 1 ) a = ( 1.0 - smoothstep( 0.52, 0.56, r ) ) * opacity;
    if ( mode == 2 ) {
      float coverage = falloff * opacity * 0.85;
      vec2 css = vec2( gl_FragCoord.x, resolution.y * pixelRatio - gl_FragCoord.y ) / pixelRatio;
      float d = length( fract( css / cell + 0.5 ) - 0.5 ) * cell;
      float rad = sqrt( coverage / 3.14159 ) * cell * 1.08;
      float aa = max( fwidth( d ), 0.35 );
      a = ( 1.0 - smoothstep( rad - aa, rad + aa, d ) ) * step( 0.03, coverage );
    }
    gl_FragColor = vec4( color, a );
    #include <colorspace_fragment>
  }`;
function shadowMaterial(spec: Treatment["shadow"], cell: number, weight: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(spec.color) },
      opacity: { value: spec.opacity * weight },
      mode: { value: spec.mode },
      cell: { value: cell },
      resolution: screen.resolution,
      pixelRatio: screen.pixelRatio,
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
    fragmentShader: shadowFragment,
    transparent: true,
    depthWrite: false,
  });
}

/* ------------------------------------------------------------------ the atlas print, redrawn in ink */

/** The folded atlas's print as ink line work only (alpha is coverage), same 3:2 layout as studio.ts. */
function inkAtlas() {
  const W = 1536,
    H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const blob = (cx: number, cy: number, r: number, seed: number) => {
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const k = r * (1 + 0.22 * Math.sin(a * 3 + seed) + 0.12 * Math.sin(a * 5 + seed * 1.7));
      const x = cx + Math.cos(a) * k * 1.25,
        y = cy + Math.sin(a) * k;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  };
  // Contours round two summits, every fifth heavier.
  for (const [cx, cy, rings] of [
    [550, 350, 9],
    [1125, 575, 7],
  ] as const)
    for (let n = 1; n <= rings; n++) {
      ctx.globalAlpha = n % 5 === 0 ? 0.9 : 0.55;
      ctx.lineWidth = n % 5 === 0 ? 4 : 2.2;
      blob(cx, cy, n * 31, cx * 0.01 + n * 0.08);
      ctx.stroke();
    }
  ctx.globalAlpha = 1;
  // River: two banks.
  for (const offset of [-11, 11]) {
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let y = -20; y <= H + 20; y += 8) {
      const x = 990 + 80 * Math.sin(y / 150) + y * 0.12 + offset;
      if (y === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Lake outline with a few water lines inside.
  blob(320, 770, 95, 2);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.save();
  blob(320, 770, 95, 2);
  ctx.clip();
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.6;
  for (let y = 660; y < 880; y += 14) {
    ctx.beginPath();
    ctx.moveTo(180, y);
    ctx.lineTo(460, y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  // Roads: one solid, two dashed.
  [0, 1, 2].forEach((r) => {
    ctx.setLineDash(r === 1 ? [] : [14, 10]);
    ctx.lineWidth = r === 1 ? 4.5 : 2.6;
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 8) {
      const y = 190 + r * 320 + 45 * Math.sin(x / 210 + r * 1.3);
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
  ctx.setLineDash([]);
  // Grid and neat line.
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 1.5;
  for (let x = 128; x < W; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 128; y < H; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, 28);
  ctx.clearRect(0, H - 28, W, 28);
  ctx.clearRect(0, 0, 28, H);
  ctx.clearRect(W - 28, 0, 28, H);
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

/* ------------------------------------------------------------------ restyling */

function roleOf(material: THREE.Material, mesh: THREE.Mesh): Role {
  const m = material as THREE.MeshStandardMaterial;
  if (m.map && (m.map as THREE.CanvasTexture).isCanvasTexture) return "print";
  if (mesh.userData.glow) return "led";
  if (!m.color) return "light";
  if (m.color.getHex() === BUILD_PALETTE.accent) {
    // One cobalt part per object: rubber in the accent (a patch cable) prints as ink.
    if (m.userData.lookPreset === "rubber") return "dark";
    const type = mesh.geometry.type;
    return type === "TubeGeometry" || type === "SphereGeometry" ? "accentThin" : "accent";
  }
  const { r, g, b } = m.color; // linear
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.08 ? "dark" : "light";
}

/** Bevelled-box edges along the arcs' midlines, where a hidden-line drawing puts them. */
function roundedBoxEdges(geometry: THREE.BufferGeometry) {
  const { width, height, depth, radius } = (geometry as unknown as { parameters: Record<string, number> }).parameters;
  const inset = 2 * radius * (1 - Math.SQRT1_2);
  const box = new THREE.BoxGeometry(width - inset, height - inset, depth - inset);
  const edges = new THREE.EdgesGeometry(box);
  box.dispose();
  return edges;
}

const edgeCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry | null>();
/** Crease edges of a geometry, or null for parts too small to take creases (screws, LEDs, holes). */
function creaseEdges(geometry: THREE.BufferGeometry) {
  if (edgeCache.has(geometry)) return edgeCache.get(geometry)!;
  geometry.computeBoundingSphere();
  let edges: THREE.BufferGeometry | null = null;
  if (geometry.boundingSphere!.radius >= 0.05)
    edges = geometry.type === "RoundedBoxGeometry" ? roundedBoxEdges(geometry) : new THREE.EdgesGeometry(geometry, 65);
  edgeCache.set(geometry, edges);
  return edges;
}

/** Append `edges` transformed by `matrix` to a flat segment list. */
function pushEdges(out: number[], edges: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  const position = edges.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).applyMatrix4(matrix);
    out.push(v.x, v.y, v.z);
  }
}

/** Average the normals of coincident vertices: the hull then widens without cracks at hard corners. */
function addSmoothNormals(geometry: THREE.BufferGeometry) {
  if (geometry.getAttribute("smoothNormal")) return;
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const sums = new Map<string, THREE.Vector3>();
  const key = (i: number) =>
    `${Math.round(position.getX(i) * 1e4)},${Math.round(position.getY(i) * 1e4)},${Math.round(position.getZ(i) * 1e4)}`;
  const n = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    const k = key(i);
    const sum = sums.get(k) ?? new THREE.Vector3();
    sums.set(k, sum.add(n.fromBufferAttribute(normal, i)));
  }
  const out = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const s = sums.get(key(i))!.clone().normalize();
    out.set([s.x, s.y, s.z], i * 3);
  }
  geometry.setAttribute("smoothNormal", new THREE.BufferAttribute(out, 3));
}

/** Position and normal only, non-indexed, transformed: the common shape for merging. */
function bakedGeometry(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", source.getAttribute("position").clone());
  if (!source.getAttribute("normal")) source.computeVertexNormals();
  out.setAttribute("normal", source.getAttribute("normal").clone());
  out.applyMatrix4(matrix);
  source.dispose();
  return out;
}

interface Snapshot {
  matrix: number[];
  visible: boolean;
  drawCount: number;
  instances?: Float32Array;
}
function snapshot(object: THREE.Object3D) {
  const shots = new Map<THREE.Object3D, Snapshot>();
  object.traverse((item) => {
    item.updateMatrix();
    const mesh = item as THREE.InstancedMesh;
    shots.set(item, {
      matrix: item.matrix.elements.slice(),
      visible: item.visible,
      drawCount: mesh.geometry?.drawRange.count ?? 0,
      instances: mesh.isInstancedMesh ? (mesh.instanceMatrix.array as Float32Array).slice() : undefined,
    });
  });
  return shots;
}
const same = (a: ArrayLike<number>, b: ArrayLike<number>) => {
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 1e-6) return false;
  return true;
};

export interface RestyleResult {
  /** Called on resize, so lines and hulls keep their pixel widths. */
  setSize: (width: number, height: number, pixelRatio: number) => void;
}

/**
 * Restyle a Studio object in place. Call after `animate(restTime)`; the object keeps animating
 * (moving groups stay unmerged).
 */
export function restyle(root: THREE.Group, spec: Treatment, restTime: number): RestyleResult {
  // Drop the photographic room: the sweep and the shadow-map floor.
  for (const name of ["studio-sweep", "studio-floor"]) {
    const item = root.getObjectByName(name);
    item?.parent?.remove(item);
  }
  // Which nodes move: compare local matrices over the loop.
  const loop = (root.userData.loopDuration as number | undefined) ?? 6000;
  const animate = root.userData.animate as ((t: number) => void) | undefined;
  const moving = new Set<THREE.Object3D>();
  if (animate) {
    animate(restTime);
    const base = snapshot(root);
    for (const t of [0, loop * 0.2, loop * 0.4, loop * 0.6, loop * 0.8]) {
      animate(t);
      for (const [item, shot] of snapshot(root)) {
        const was = base.get(item);
        if (!was) continue;
        if (
          !same(was.matrix, shot.matrix) ||
          was.visible !== shot.visible ||
          was.drawCount !== shot.drawCount ||
          (was.instances && shot.instances && !same(was.instances, shot.instances))
        )
          moving.add(item);
      }
    }
    animate(restTime);
  }
  root.updateMatrixWorld(true);

  const print = { map: inkAtlas(), ink: spec.printInk };
  const fills = new Map<Role, THREE.ShaderMaterial>();
  const fillFor = (role: Role) => {
    if (!fills.has(role)) fills.set(role, fillMaterial(spec.roles[role].fill, spec.cell, role === "print" ? print : undefined));
    return fills.get(role)!;
  };

  // Collect meshes first, then rebuild.
  const meshes: THREE.Mesh[] = [];
  const shadows: THREE.Mesh[] = [];
  root.traverse((item) => {
    const mesh = item as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.name === "contact-shadow") shadows.push(mesh);
    else if (!item.userData.frameIgnore) meshes.push(mesh);
  });

  // Contact shadows: recoloured, keeping each one's own weight (its rest opacity).
  for (const shadow of shadows) {
    const old = shadow.material as THREE.MeshBasicMaterial;
    const material = shadowMaterial(spec.shadow, spec.cell, old.opacity / 0.5);
    const weight = spec.shadow.opacity / 0.5;
    shadow.onBeforeRender = () => {
      // Travel animates its seats' opacity through `material.opacity`; follow it.
      material.uniforms.opacity.value = (shadow.material as THREE.Material).opacity * weight;
    };
    material.opacity = old.opacity;
    shadow.material = material;
    old.dispose();
  }

  /** The nearest moving ancestor (or the root): the rigid group a static mesh merges into. */
  const rigidOf = (mesh: THREE.Object3D) => {
    let p = mesh.parent!;
    while (p !== root && !moving.has(p)) p = p.parent!;
    return p;
  };
  const buckets = new Map<THREE.Object3D, Map<Role, { geometries: THREE.BufferGeometry[]; edges: number[] }>>();
  const bucket = (group: THREE.Object3D, role: Role) => {
    if (!buckets.has(group)) buckets.set(group, new Map());
    const roles = buckets.get(group)!;
    if (!roles.has(role)) roles.set(role, { geometries: [], edges: [] });
    return roles.get(role)!;
  };
  const toGroup = new THREE.Matrix4();
  const instance = new THREE.Matrix4();

  const addLines = (parent: THREE.Object3D, positions: number[], role: Role) => {
    const crease = spec.roles[role].crease;
    if (!crease || positions.length < 6) return;
    const geometry = new LineSegmentsGeometry().setPositions(positions);
    const lines = new LineSegments2(geometry, creaseMaterial(crease));
    lines.userData.frameIgnore = true;
    parent.add(lines);
    if (spec.hidden) {
      const hidden = new LineSegments2(geometry, creaseMaterial(crease, spec.hidden));
      hidden.computeLineDistances();
      hidden.userData.frameIgnore = true;
      hidden.renderOrder = 2;
      parent.add(hidden);
    }
  };
  const addHull = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, role: Role, source?: THREE.InstancedMesh) => {
    const hull = spec.roles[role].hull;
    if (!hull) return;
    addSmoothNormals(geometry);
    const mesh = source ? new THREE.InstancedMesh(geometry, hullMaterial(hull), source.count) : new THREE.Mesh(geometry, hullMaterial(hull));
    if (source) {
      (mesh as THREE.InstancedMesh).instanceMatrix = source.instanceMatrix;
      mesh.frustumCulled = false;
    }
    mesh.userData.frameIgnore = true;
    parent.add(mesh);
  };

  for (const mesh of meshes) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const roles = materials.map((m) => roleOf(m, mesh));
    const instancedMesh = mesh as THREE.InstancedMesh;
    const dynamic = moving.has(mesh) || Array.isArray(mesh.material);
    // A part whose parent chain hides it (the travel pins' groups) or that moves: restyle in place.
    if (dynamic || (instancedMesh.isInstancedMesh && moving.has(mesh))) {
      mesh.material = Array.isArray(mesh.material) ? roles.map((r) => fillFor(r)) : fillFor(roles[0]);
      const role = roles.find((r) => r !== "print") ?? roles[0];
      addHull(mesh, mesh.geometry, role === "led" ? "led" : role, instancedMesh.isInstancedMesh ? instancedMesh : undefined);
      if (!instancedMesh.isInstancedMesh) {
        const edges = creaseEdges(mesh.geometry);
        if (edges) {
          const positions: number[] = [];
          pushEdges(positions, edges, new THREE.Matrix4());
          addLines(mesh, positions, role);
        }
      }
      continue;
    }
    // Static: bake into its rigid group's bucket for its role.
    const group = rigidOf(mesh);
    toGroup.copy(group.matrixWorld).invert().multiply(mesh.matrixWorld);
    const role = roles[0];
    const target = bucket(group, role);
    const edges = creaseEdges(mesh.geometry);
    const count = instancedMesh.isInstancedMesh ? instancedMesh.count : 1;
    for (let i = 0; i < count; i++) {
      const matrix = toGroup.clone();
      if (instancedMesh.isInstancedMesh) matrix.multiply(instancedMesh.getMatrixAt(i, instance));
      target.geometries.push(bakedGeometry(mesh.geometry, matrix));
      if (edges) pushEdges(target.edges, edges, matrix);
    }
    mesh.parent!.remove(mesh);
    for (const m of materials) m.dispose();
  }

  for (const [group, roles] of buckets)
    for (const [role, { geometries, edges }] of roles) {
      const merged = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      const fill = new THREE.Mesh(merged, fillFor(role));
      group.add(fill);
      addHull(group, merged, role);
      addLines(group, edges, role);
    }

  return {
    setSize: (width, height, pixelRatio) => {
      screen.resolution.value.set(width, height);
      screen.pixelRatio.value = pixelRatio;
      for (const material of lineMaterials) material.resolution.set(width, height);
    },
  };
}

/* ------------------------------------------------------------------ blueprint anchors */

/** World-space anchor points for the blueprint callouts, per subject. */
export function anchors(root: THREE.Object3D, kind: string): { label: string; point: THREE.Vector3 }[] {
  root.updateMatrixWorld(true);
  if (kind === "server") {
    const units: THREE.Object3D[] = [];
    root.traverse((item) => {
      if ((item as THREE.Group).isGroup && typeof item.userData.y === "number") units.push(item);
    });
    const labels = ["drive sleds", "compute sled", "network"];
    return units.map((unit, i) => ({
      label: labels[i] ?? `unit ${i + 1}`,
      point: new THREE.Vector3(i === 1 ? 0.72 : 0.85, i === 0 ? 0.08 : i === 2 ? 0.1 : 0.18, 0.75).applyMatrix4(unit.matrixWorld),
    }));
  }
  if (kind === "travel") {
    const pins: THREE.Object3D[] = [];
    root.traverse((item) => {
      if (Array.isArray(item.userData.materials)) pins.push(item);
    });
    const folds = root.userData.mapFolds as THREE.Object3D[] | undefined;
    const out: { label: string; point: THREE.Vector3 }[] = [];
    if (pins[0]) out.push({ label: "start", point: new THREE.Vector3(0, 0, 0.16).applyMatrix4(pins[0].matrixWorld) });
    if (pins[1]) out.push({ label: "destination", point: new THREE.Vector3(0, 0, 0.16).applyMatrix4(pins[1].matrixWorld) });
    if (folds?.[1]) {
      // The ridge: the standing panel's highest vertices, averaged.
      const points: THREE.Vector3[] = [];
      folds[1].traverse((item) => {
        const mesh = item as THREE.Mesh;
        if (!mesh.isMesh || item.userData.frameIgnore) return;
        const position = mesh.geometry.getAttribute("position");
        for (let i = 0; i < position.count; i++) points.push(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld));
      });
      const top = Math.max(...points.map((p) => p.y));
      const ridge = points.filter((p) => p.y > top - 0.02);
      const p = ridge.reduce((sum, q) => sum.add(q), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, ridge.length));
      out.push({ label: "fold", point: p });
    }
    return out;
  }
  return [];
}
