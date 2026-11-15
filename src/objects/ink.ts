// Ink line art: the one way every 3D object is drawn. `inkify` takes a built subject (meshes with
// any material) and redraws it as a line drawing: unlit faces in the page's paper tone, a constant
// pixel-width ink silhouette round every part (an inverted hull widened in screen space), crease
// lines on hard edges (fat lines), and the subject's one accent part. Colours are three roles read
// from the page (paper, ink, accent; `readInkColors`), so `setColors` restyles a running scene
// without recompiling anything. No lights, environment, shadow maps or post-processing.
// Contract and how to add a subject: src/objects/LOOK.md.
import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * The tone a part's faces take. `paper`: the page's own tone (lifted a little in dark). `shade`: a
 * toned face for secondary bodies (housings, a can's lid). `dark`: a solid ink fill for small dense
 * parts (holes, LEDs, a pin head). `accent`: the subject's one accent part.
 */
export type InkRole = "paper" | "shade" | "dark" | "accent";
export const inkRoles: readonly InkRole[] = ["paper", "shade", "dark", "accent"];

/** The three page roles a scene is drawn in, as sRGB numbers. */
export interface InkColors {
  paper: number;
  ink: number;
  accent: number;
}

/**
 * What builders paint parts in when they do not tag them: the renderer reads a role back from
 * these (exact `accent` → accent; a near-black → shade; anything else → paper). Tags win.
 */
export const INK_BUILD_PALETTE = { paper: 0xf3efe7, ink: 0x29231f, muted: 0x85776e, accent: 0x234ea2 } as const;

/** Line widths in CSS pixels, the same at every size and pixel ratio. */
export const INK_WIDTHS = { silhouette: 2, crease: 1.1, accentCrease: 1 } as const;

/* ---------------------------------------------------------------- Tones */

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace);
const luminance = (c: THREE.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

/** The live colours every ink material points at; `apply` rewrites them in place. */
class InkTones {
  readonly fill: Record<InkRole, THREE.Color> = {
    paper: new THREE.Color(),
    shade: new THREE.Color(),
    dark: new THREE.Color(),
    accent: new THREE.Color(),
  };
  /** Lines on paper and shade faces, and every silhouette. */
  readonly line = new THREE.Color();
  /** Creases drawn on a filled part (accent, dark): the paper tone, so they show. */
  readonly lineOnFill = new THREE.Color();
  readonly shadow = new THREE.Color();
  shadowOpacity = 0.1;
  dark = false;
  apply(colors: InkColors) {
    const paper = srgb(colors.paper),
      ink = srgb(colors.ink),
      accent = srgb(colors.accent);
    // Dark when the paper is darker than the ink, whatever the theme prop says: the page decides.
    this.dark = luminance(paper) < luminance(ink);
    this.fill.paper.copy(this.dark ? paper.clone().lerp(ink, 0.1) : paper);
    this.fill.shade.copy(this.dark ? paper : paper.clone().lerp(ink, 0.13));
    this.fill.dark.copy(ink);
    this.fill.accent.copy(accent);
    this.line.copy(ink);
    this.lineOnFill.copy(paper);
    this.shadow.copy(ink);
    this.shadowOpacity = this.dark ? 0.14 : 0.1;
  }
}

/* ---------------------------------------------------------------- Shaders */

const fillVertex = /* glsl */ `
  #ifdef USE_PRINT
    varying vec2 vUv;
  #endif
  void main() {
    vec4 p = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
    #endif
    #ifdef USE_PRINT
      vUv = uv;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * p;
  }`;

const fillFragment = /* glsl */ `
  uniform vec3 color;
  #ifdef USE_PRINT
    uniform sampler2D printMap;
    uniform vec3 printInk;
    varying vec2 vUv;
  #endif
  void main() {
    vec3 tone = color;
    #ifdef USE_PRINT
      tone = mix( tone, printInk, texture2D( printMap, vUv ).a );
    #endif
    gl_FragColor = vec4( tone, 1.0 );
    #include <colorspace_fragment>
  }`;

// The silhouette: the part's back faces pushed out along its averaged normals by a fixed number of
// CSS pixels on screen. A fully collapsed part (zero scale: a hidden instance) draws nothing.
const hullVertex = /* glsl */ `
  attribute vec3 smoothNormal;
  uniform vec2 resolution;
  uniform float width;
  void main() {
    mat4 model = modelMatrix;
    #ifdef USE_INSTANCING
      model = modelMatrix * instanceMatrix;
    #endif
    mat3 basis = mat3( model );
    if ( abs( determinant( basis ) ) < 1e-12 ) {
      gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
      return;
    }
    vec4 clip = projectionMatrix * viewMatrix * model * vec4( position, 1.0 );
    vec3 normalView = normalize( mat3( viewMatrix ) * normalize( basis * smoothNormal ) );
    vec2 dir = ( projectionMatrix * vec4( normalView, 0.0 ) ).xy * resolution;
    float len = length( dir );
    dir = len > 1e-6 ? dir / len : vec2( 0.0 );
    clip.xy += dir * width * 2.0 / resolution * clip.w;
    gl_Position = clip;
  }`;

const solidFragment = /* glsl */ `
  uniform vec3 color;
  void main() {
    gl_FragColor = vec4( color, 1.0 );
    #include <colorspace_fragment>
  }`;

const shadowFragment = /* glsl */ `
  uniform vec3 color;
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    float r = length( vUv - 0.5 ) * 2.0;
    gl_FragColor = vec4( color, ( 1.0 - smoothstep( 0.52, 0.56, r ) ) * opacity );
    #include <colorspace_fragment>
  }`;

/* ---------------------------------------------------------------- Geometry helpers */

const smoothCache = new WeakMap<THREE.BufferGeometry, THREE.BufferAttribute>();
/**
 * Normals averaged over vertices that share a position, so the hull widens without cracks at hard
 * corners. Computed once per source geometry (instances and merges reuse it).
 */
function smoothNormals(geometry: THREE.BufferGeometry) {
  const cached = smoothCache.get(geometry);
  if (cached) return cached;
  const position = geometry.getAttribute("position");
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  const normal = geometry.getAttribute("normal");
  const sums = new Map<string, THREE.Vector3>();
  const keys: string[] = new Array(position.count);
  const n = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    const k = `${Math.round(position.getX(i) * 1e4)},${Math.round(position.getY(i) * 1e4)},${Math.round(position.getZ(i) * 1e4)}`;
    keys[i] = k;
    const sum = sums.get(k);
    n.fromBufferAttribute(normal, i);
    if (sum) sum.add(n);
    else sums.set(k, n.clone());
  }
  const out = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const s = sums.get(keys[i])!;
    const length = s.length() || 1;
    out[i * 3] = s.x / length;
    out[i * 3 + 1] = s.y / length;
    out[i * 3 + 2] = s.z / length;
  }
  const attribute = new THREE.BufferAttribute(out, 3);
  smoothCache.set(geometry, attribute);
  return attribute;
}

/** Give a geometry drawn in place its smooth normals (the hull reads them). */
function withSmoothNormals(geometry: THREE.BufferGeometry) {
  if (!geometry.getAttribute("smoothNormal")) geometry.setAttribute("smoothNormal", smoothNormals(geometry));
  return geometry;
}

/** RoundedBoxGeometry's crease lines along its arcs' midlines, where a line drawing puts them. */
function roundedBoxEdges(geometry: THREE.BufferGeometry) {
  const { width, height, depth, radius } = (geometry as unknown as { parameters: Record<string, number> }).parameters;
  const inset = 2 * radius * (1 - Math.SQRT1_2);
  const box = new THREE.BoxGeometry(width - inset, height - inset, depth - inset);
  const edges = new THREE.EdgesGeometry(box);
  box.dispose();
  return edges;
}

const edgeCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry | null>();
/** A geometry's crease edges (faces meeting at 65° or more), cached per geometry. */
function creaseEdges(geometry: THREE.BufferGeometry) {
  if (edgeCache.has(geometry)) return edgeCache.get(geometry)!;
  const edges =
    geometry.type === "RoundedBoxGeometry"
      ? roundedBoxEdges(geometry)
      : geometry.type === "SphereGeometry" || geometry.type === "TubeGeometry" || geometry.type === "TorusGeometry"
        ? null
        : new THREE.EdgesGeometry(geometry, 65);
  edgeCache.set(geometry, edges && edges.getAttribute("position").count > 0 ? edges : null);
  return edgeCache.get(geometry)!;
}

/** Parts smaller than this (world units, after scale) take no creases: screws, LEDs, holes. */
const CREASE_MIN_RADIUS = 0.05;
function takesCreases(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  if (!geometry.boundingSphere) geometry.computeBoundingSphere();
  return geometry.boundingSphere!.radius * matrix.getMaxScaleOnAxis() >= CREASE_MIN_RADIUS;
}

const scratch = new THREE.Vector3();
function pushEdges(out: number[], edges: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  const position = edges.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    scratch.fromBufferAttribute(position, i).applyMatrix4(matrix);
    out.push(scratch.x, scratch.y, scratch.z);
  }
}

/** Position and smooth normal only, indexed, transformed by `matrix`: the common shape for merging. */
function baked(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  const out = new THREE.BufferGeometry();
  const position = geometry.getAttribute("position").clone();
  const smooth = smoothNormals(geometry).clone();
  out.setAttribute("position", position);
  out.setAttribute("smoothNormal", smooth);
  if (geometry.index) out.setIndex(geometry.index.clone());
  else out.setIndex(Array.from({ length: position.count }, (_, i) => i));
  position.applyMatrix4(matrix);
  smooth.applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(matrix));
  return out;
}

/** Line segment pairs from a THREE.Line, LineLoop or LineSegments, in its own space. */
function segmentsOf(line: THREE.Line) {
  const position = line.geometry.getAttribute("position");
  const points: number[] = [];
  const at = (i: number) => [position.getX(i), position.getY(i), position.getZ(i)];
  if ((line as THREE.LineSegments).isLineSegments) {
    for (let i = 0; i + 1 < position.count; i += 2) points.push(...at(i), ...at(i + 1));
  } else {
    for (let i = 0; i + 1 < position.count; i++) points.push(...at(i), ...at(i + 1));
    if ((line as THREE.LineLoop).isLineLoop && position.count > 2) points.push(...at(position.count - 1), ...at(0));
  }
  return points;
}

/* ---------------------------------------------------------------- Roles */

/**
 * A part's role: the mesh's `userData.inkRole`, else its material's, else read from the material's
 * colour (INK_BUILD_PALETTE). A `glow` part (an LED) is a solid ink dot.
 */
export function inkRoleOf(mesh: THREE.Object3D, material?: THREE.Material): InkRole {
  const tagged = (mesh.userData.inkRole ?? material?.userData.inkRole) as InkRole | undefined;
  if (tagged && inkRoles.includes(tagged)) return tagged;
  if (mesh.userData.glow) return "dark";
  const color = (material as THREE.MeshBasicMaterial | undefined)?.color;
  if (!color) return "paper";
  if (color.getHex() === INK_BUILD_PALETTE.accent) return "accent";
  return luminance(color) < 0.08 ? "shade" : "paper";
}

/* ---------------------------------------------------------------- The renderer */

export interface InkScene {
  /** The canvas's CSS size, so silhouettes and lines keep their pixel widths. */
  setSize: (width: number, height: number) => void;
  /** Restyle the scene in new page colours (a theme change); no shader recompiles. */
  setColors: (colors: InkColors) => void;
}

/** Snapshot of everything that can move a node, to find the parts that animate. */
function snapshot(root: THREE.Object3D) {
  const shots = new Map<THREE.Object3D, number[]>();
  root.traverse((item) => {
    item.updateMatrix();
    const mesh = item as THREE.InstancedMesh;
    const values = [...item.matrix.elements, item.visible ? 1 : 0, mesh.geometry?.drawRange.count ?? 0];
    if (mesh.isInstancedMesh) values.push(...(mesh.instanceMatrix.array as Float32Array));
    shots.set(item, values);
  });
  return shots;
}
const differs = (a: number[], b: number[]) => a.length !== b.length || a.some((v, i) => Math.abs(v - b[i]) > 1e-6);

/** The nodes whose matrix, visibility, draw range or instances change over the scene's motion. */
function movingNodes(root: THREE.Object3D) {
  const animate = root.userData.animate as ((time: number) => void) | undefined;
  const moving = new Set<THREE.Object3D>();
  if (!animate) return moving;
  const restTime = (root.userData.restTime as number | undefined) ?? 0;
  const span = (root.userData.loopDuration as number | undefined) ?? (root.userData.playDuration as number | undefined) ?? 6000;
  animate(restTime);
  const base = snapshot(root);
  // Sampled densely, offset from round numbers, so a part that moves only briefly is still caught.
  for (let i = 0; i < 24; i++) {
    animate(((i + 0.37) / 24) * span);
    for (const [item, values] of snapshot(root)) {
      const was = base.get(item);
      if (was && differs(was, values)) moving.add(item);
    }
  }
  animate(restTime);
  return moving;
}

/**
 * Redraw a built subject in ink line art, in place. Call after the subject is built (and its
 * contact shadows added); it keeps animating, since parts that move are restyled where they are and
 * only parts that never move relative to their nearest moving ancestor are merged.
 */
export function inkify(root: THREE.Object3D, colors: InkColors = INK_BUILD_PALETTE): InkScene {
  const tones = new InkTones();
  tones.apply(colors);
  const resolution = { value: new THREE.Vector2(1, 1) };
  const moving = movingNodes(root);
  root.updateMatrixWorld(true);

  const fills = new Map<string, THREE.ShaderMaterial>();
  const fillFor = (role: InkRole, print?: THREE.Texture) => {
    const key = `${role}:${print?.uuid ?? ""}`;
    let material = fills.get(key);
    if (!material) {
      material = new THREE.ShaderMaterial({
        name: `ink-fill-${role}`,
        uniforms: {
          color: { value: tones.fill[role] },
          ...(print ? { printMap: { value: print }, printInk: { value: tones.line } } : {}),
        },
        defines: print ? { USE_PRINT: "" } : {},
        vertexShader: fillVertex,
        fragmentShader: fillFragment,
        // Faces sit a hair behind their own crease lines, so lines never z-fight them.
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      fills.set(key, material);
    }
    return material;
  };
  const hull = new THREE.ShaderMaterial({
    name: "ink-silhouette",
    uniforms: { color: { value: tones.line }, width: { value: INK_WIDTHS.silhouette }, resolution },
    vertexShader: hullVertex,
    fragmentShader: solidFragment,
    side: THREE.BackSide,
  });
  const lineMaterials: LineMaterial[] = [];
  const lineFor = (color: THREE.Color, width: number) => {
    let material = lineMaterials.find((m) => m.uniforms.diffuse.value === color && m.linewidth === width);
    if (!material) {
      material = new LineMaterial({ linewidth: width, worldUnits: false });
      material.name = "ink-line";
      material.uniforms.diffuse.value = color;
      material.uniforms.resolution = resolution;
      lineMaterials.push(material);
    }
    return material;
  };
  const creaseFor = (role: InkRole) =>
    role === "accent" || role === "dark"
      ? lineFor(tones.lineOnFill, INK_WIDTHS.accentCrease)
      : lineFor(tones.line, INK_WIDTHS.crease);
  const lineColorFor = (role: InkRole | undefined) =>
    role === "accent"
      ? tones.fill.accent
      : role === "paper"
        ? tones.fill.paper
        : role === "shade"
          ? tones.fill.shade
          : tones.line;

  const addHull = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, instances?: THREE.InstancedMesh) => {
    const mesh = instances ? new THREE.InstancedMesh(geometry, hull, instances.count) : new THREE.Mesh(geometry, hull);
    if (instances) {
      (mesh as THREE.InstancedMesh).instanceMatrix = instances.instanceMatrix;
      mesh.frustumCulled = false;
    }
    mesh.name = "ink-silhouette";
    mesh.userData.frameIgnore = true;
    parent.add(mesh);
  };
  const addLines = (parent: THREE.Object3D, positions: number[], material: LineMaterial) => {
    if (positions.length < 6) return;
    const lines = new LineSegments2(new LineSegmentsGeometry().setPositions(positions), material);
    lines.name = "ink-crease";
    lines.userData.frameIgnore = true;
    parent.add(lines);
  };

  const meshes: THREE.Mesh[] = [],
    shadows: THREE.Mesh[] = [],
    lines: THREE.Line[] = [];
  root.traverse((item) => {
    if ((item as THREE.Line).isLine) lines.push(item as THREE.Line);
    else if ((item as THREE.Mesh).isMesh) {
      if (item.name === "contact-shadow") shadows.push(item as THREE.Mesh);
      else if (!item.userData.frameIgnore) meshes.push(item as THREE.Mesh);
    }
  });
  const retired = { materials: new Set<THREE.Material>(), geometries: new Set<THREE.BufferGeometry>() };
  const retire = (object: THREE.Mesh | THREE.Line) => {
    for (const m of Array.isArray(object.material) ? object.material : [object.material]) retired.materials.add(m);
    retired.geometries.add(object.geometry);
  };

  // Contact shadows: a hard-edged ink ellipse at low strength, keeping each one's own weight. A
  // builder may animate it through `material.opacity` (read at draw time).
  for (const shadow of shadows) {
    const source = shadow.material as THREE.MeshBasicMaterial;
    const material = new THREE.ShaderMaterial({
      name: "ink-shadow",
      uniforms: { color: { value: tones.shadow }, opacity: { value: 0 } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
      fragmentShader: shadowFragment,
      transparent: true,
      depthWrite: false,
    });
    material.opacity = source.opacity;
    shadow.onBeforeRender = () => {
      material.uniforms.opacity.value = tones.shadowOpacity * (material.opacity / 0.5);
    };
    retire(shadow);
    retired.geometries.delete(shadow.geometry);
    shadow.material = material;
  }

  // Lines a builder drew (strings, seams, icons): fat ink lines at their own width.
  for (const line of lines) {
    const material = line.material as THREE.LineBasicMaterial;
    const role =
      (line.userData.inkRole as InkRole | undefined) ??
      (material.color?.getHex() === INK_BUILD_PALETTE.accent ? "accent" : undefined);
    const fat = new LineSegments2(
      new LineSegmentsGeometry().setPositions(segmentsOf(line)),
      lineFor(lineColorFor(role), (line.userData.inkWidth as number | undefined) ?? INK_WIDTHS.crease),
    );
    fat.name = line.name || "ink-line";
    fat.position.copy(line.position);
    fat.quaternion.copy(line.quaternion);
    fat.scale.copy(line.scale);
    fat.visible = line.visible;
    // Lines never set the framing: their geometry is a template quad, not the drawing.
    fat.userData = { ...line.userData, frameIgnore: true };
    const parent = line.parent!;
    parent.add(fat);
    parent.remove(line);
    retire(line);
  }

  /** The nearest moving ancestor (or the root): the rigid group a static mesh merges into. */
  const rigidOf = (mesh: THREE.Object3D) => {
    let p = mesh.parent!;
    while (p !== root && !moving.has(p)) p = p.parent!;
    return p;
  };
  const buckets = new Map<THREE.Object3D, Map<InkRole, { geometries: THREE.BufferGeometry[]; edges: number[] }>>();
  const bucket = (group: THREE.Object3D, role: InkRole) => {
    let roles = buckets.get(group);
    if (!roles) buckets.set(group, (roles = new Map()));
    let entry = roles.get(role);
    if (!entry) roles.set(role, (entry = { geometries: [], edges: [] }));
    return entry;
  };
  const toGroup = new THREE.Matrix4(),
    instance = new THREE.Matrix4(),
    identity = new THREE.Matrix4();

  // Where each static part merges, read before anything is moved.
  const rigid = new Map(meshes.map((mesh) => [mesh, rigidOf(mesh)]));
  for (const mesh of meshes) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const roles = materials.map((m) => inkRoleOf(mesh, m));
    const prints = materials.map((m) => m.userData.inkPrint as THREE.Texture | undefined);
    const instanced = (mesh as THREE.InstancedMesh).isInstancedMesh ? (mesh as THREE.InstancedMesh) : undefined;
    const role = roles.find((_, i) => !prints[i]) ?? roles[0];
    if (!mesh.visible && !moving.has(mesh)) {
      mesh.parent?.remove(mesh);
      retire(mesh);
      continue;
    }
    if (moving.has(mesh) || materials.length > 1 || prints[0] || mesh.children.length > 0) {
      // Moves (or carries several materials, a print or parts of its own): restyled where it is.
      retire(mesh);
      retired.geometries.delete(mesh.geometry);
      mesh.material = materials.length > 1 ? roles.map((r, i) => fillFor(r, prints[i])) : fillFor(roles[0], prints[0]);
      addHull(mesh, withSmoothNormals(mesh.geometry), instanced);
      const edges =
        !instanced && mesh.userData.inkCreases !== false && takesCreases(mesh.geometry, mesh.matrixWorld)
          ? creaseEdges(mesh.geometry)
          : null;
      if (edges) {
        const positions: number[] = [];
        pushEdges(positions, edges, identity);
        addLines(mesh, positions, creaseFor(role));
      }
      continue;
    }
    // Static: baked into its rigid group's bucket for its role.
    const group = rigid.get(mesh)!;
    toGroup.copy(group.matrixWorld).invert().multiply(mesh.matrixWorld);
    const target = bucket(group, role);
    const edges = mesh.userData.inkCreases === false ? null : creaseEdges(mesh.geometry);
    for (let i = 0; i < (instanced ? instanced.count : 1); i++) {
      const matrix = toGroup.clone();
      if (instanced) matrix.multiply(instanced.getMatrixAt(i, instance));
      target.geometries.push(baked(mesh.geometry, matrix));
      if (edges && takesCreases(mesh.geometry, matrix)) pushEdges(target.edges, edges, matrix);
    }
    mesh.parent!.remove(mesh);
    retire(mesh);
  }

  for (const [group, roles] of buckets)
    for (const [role, { geometries, edges }] of roles) {
      const merged = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      const fill = new THREE.Mesh(merged, fillFor(role));
      fill.name = `ink-${role}`;
      fill.userData.inkRole = role;
      group.add(fill);
      addHull(fill, merged);
      addLines(fill, edges, creaseFor(role));
    }

  // Free what the redraw replaced, unless a part still drawn shares it.
  const inUse = new Set<unknown>();
  root.traverse((item) => {
    const drawable = item as THREE.Mesh;
    if (drawable.geometry) inUse.add(drawable.geometry);
    for (const m of Array.isArray(drawable.material) ? drawable.material : drawable.material ? [drawable.material] : [])
      inUse.add(m);
  });
  retired.geometries.forEach((g) => !inUse.has(g) && g.dispose());
  retired.materials.forEach((m) => !inUse.has(m) && m.dispose());
  root.userData.ink = true;

  return {
    setSize: (width, height) => resolution.value.set(Math.max(1, width), Math.max(1, height)),
    setColors: (next) => tones.apply(next),
  };
}

/* ---------------------------------------------------------------- Reading the page's roles */

let probeContext: CanvasRenderingContext2D | null | undefined;
/** Any CSS colour as an sRGB number (light-dark(), color-mix() and named colours included). */
function cssColor(value: string, fallback: number) {
  if (!value) return fallback;
  probeContext ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (probeContext) {
    probeContext.clearRect(0, 0, 1, 1);
    probeContext.fillStyle = "black";
    probeContext.fillStyle = value;
    probeContext.fillRect(0, 0, 1, 1);
    const [r, g, b] = probeContext.getImageData(0, 0, 1, 1).data;
    return (r << 16) | (g << 8) | b;
  }
  const rgb = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(value);
  return rgb ? (Math.round(+rgb[1]) << 16) | (Math.round(+rgb[2]) << 8) | Math.round(+rgb[3]) : fallback;
}

/**
 * The scene's paper, ink and accent, resolved on `element` (the stage) the way its CSS resolves
 * them: `--object-paper`, `--object-ink` and `--object-accent` (src/objects/objects.css maps them
 * to the page's roles). Read at mount and again whenever the theme changes.
 */
export function readInkColors(element: HTMLElement): InkColors {
  const probe = document.createElement("span");
  probe.hidden = true;
  element.append(probe);
  const read = (name: string, fallback: number) => {
    probe.style.color = `var(${name})`;
    return cssColor(getComputedStyle(probe).color, fallback);
  };
  const colors = {
    paper: read("--object-paper", INK_BUILD_PALETTE.paper),
    ink: read("--object-ink", INK_BUILD_PALETTE.ink),
    accent: read("--object-accent", INK_BUILD_PALETTE.accent),
  };
  probe.remove();
  return colors;
}
