// Framing and grounding for the 3D object scenes: where the camera sits and how much of the frame
// the subject fills, measured over its whole motion, and the contact shadow under it. A builder
// declares what it wants in `object.userData.look` (an ObjectLook); mount.ts applies it. How the
// scene is drawn is the ink renderer's job (src/objects/ink.ts); the contract is src/objects/LOOK.md.
import * as THREE from "three";

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
  /** Default perspective. */
  projection?: "orthographic" | "perspective";
  /** Vertical field of view in degrees, for perspective. Default 30. */
  fov?: number;
  /** Degrees the camera looks down on the subject. Default 0 (straight on). */
  pitch?: number;
  /** Degrees the camera orbits to the subject's right. Default 0. */
  yaw?: number;
}

export interface ContactShadowOptions {
  /** Weight at rest, 0..1 (the renderer draws it as a faint ink ellipse; 0.5 is full strength). Default 0.42. */
  opacity?: number;
  /** Footprint relative to the subject's base. Default 1.3. */
  spread?: number;
  /** Local Y of the floor; default the subject's lowest point at rest. */
  y?: number;
}

export interface ObjectLook {
  /** Fit the camera to the subject (default), or false to keep a fixed frame. */
  framing?: FramingOptions | false;
  camera?: CameraOptions;
  /** One faint ellipse under the whole subject, in the root's own floor plane. */
  contactShadow?: boolean | ContactShadowOptions;
}

export interface ResolvedLook {
  framing: Required<FramingOptions> | false;
  camera: Required<CameraOptions>;
  contactShadow: (Required<Omit<ContactShadowOptions, "y">> & { y?: number }) | false;
}

/** The look mount.ts applies: the defaults, then the subject's own. */
export function resolveLook(look: ObjectLook | undefined): ResolvedLook {
  const shadow = look?.contactShadow;
  return {
    framing: look?.framing === false ? false : { fill: 0.62, maxWidth: 0.78, lift: 0.02, sample: "loop", ...look?.framing },
    camera: { projection: "perspective", fov: 30, pitch: 0, yaw: 0, ...look?.camera },
    contactShadow: shadow ? { opacity: 0.42, spread: 1.3, ...(shadow === true ? {} : shadow) } : false,
  };
}

/* ---------------------------------------------------------------- Contact shadow */

/**
 * A flat ellipse on a horizontal plane, centred at `(x, y, z)` in the parent's space: two triangles,
 * no shadow map, excluded from framing. The ink renderer redraws it as a faint hard-edged ellipse
 * and reads its `material.opacity` at draw time, so a builder can animate it.
 */
export function contactShadow(width: number, depth: number, options: ContactShadowOptions & { x?: number; z?: number } = {}) {
  const { opacity = 0.42, x = 0, y = 0, z = 0 } = options;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity, depthWrite: false }),
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
    { opacity: options.opacity, x: centre.x, y: (options.y ?? box.min.y) + 0.003, z: centre.z },
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
