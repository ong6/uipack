import { createContactDirection } from "./contact-directions";
import * as THREE from "three";
import { createArtDirection } from "./art-directions";
import { materialTextures, type ObjectLook } from "./look";
import * as studio from "./studio";
import {
  hasObjectLook,
  normalizeObjectVariant,
  objectLooks,
  type KindWithLook,
  type ObjectVariant,
  type ObjectEdition,
} from "./variants";
import { tennisModelUrl } from "../package-assets";
import { lerp, progress, smootherstep } from "../math";
export type ObjectKind = "ai" | "contact" | "tennis" | "trading" | "server" | "travel" | "reading";
export interface ObjectPalette {
  paper: number;
  ink: number;
  muted: number;
  accent: number;
}
export const DURATION = 5400;
/** The matte, slightly rough finish every procedural part shares. */
const matteMaterial = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04 });
/** A matte mesh of `geometry`, placed at (x, y, z). */
const mesh = (geometry: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0) => {
  const placed = new THREE.Mesh(geometry, matteMaterial(color));
  placed.position.set(x, y, z);
  return placed;
};
/** A rounded slab `width` × `height` (corner `radius`), `depth` thick and bevelled, centred on (x, y, z). */
function slab(width: number, height: number, depth: number, color: number, x = 0, y = 0, z = 0, radius = 0.06) {
  const r = Math.min(radius, width / 2, height / 2);
  const outline = new THREE.Shape();
  const left = -width / 2,
    bottom = -height / 2;
  const right = left + width,
    top = bottom + height;
  outline.moveTo(left + r, bottom);
  outline.lineTo(right - r, bottom);
  outline.quadraticCurveTo(right, bottom, right, bottom + r);
  outline.lineTo(right, top - r);
  outline.quadraticCurveTo(right, top, right - r, top);
  outline.lineTo(left + r, top);
  outline.quadraticCurveTo(left, top, left, top - r);
  outline.lineTo(left, bottom + r);
  outline.quadraticCurveTo(left, bottom, left + r, bottom);
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -depth / 2);
  return mesh(geometry, color, x, y, z);
}
function line(points: number[][], color: number, opacity = 1) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map((v) => new THREE.Vector3(v[0], v[1], v[2] ?? 0))),
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
}
function tube(points: THREE.Vector3[], radius: number, color: number) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, radius, 8, false), color);
}
function label(text: string, color: number, x: number, y: number, z: number, size = 0.16) {
  // CanvasTexture is created only in the lazy, browser-only renderer.
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#" + new THREE.Color(color).getHexString();
  ctx.font = "500 32px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 8, size),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  m.position.set(x, y, z);
  return m;
}
function phase(group: THREE.Group, t: number, name: string, pose: number) {
  group.userData.phase = t >= DURATION ? "rest" : name;
  group.userData.pose = pose;
}
function contact(palette: ObjectPalette) {
  const group = new THREE.Group();
  group.rotation.set(0.1, -0.2, -0.025);

  // Symbols and route geometry keep the three-to-one relationship legible
  // without relying on colour.
  const sourceY = [0.9, 0, -0.9];
  const sources = sourceY.map((y, index) => {
    const source = new THREE.Group();
    source.position.set(-1.62, y, 0.05);
    source.add(slab(0.75, 0.58, 0.11, palette.paper));
    if (index === 0) {
      source.add(
        line(
          [
            [-0.24, 0.14, 0.13],
            [0, -0.03, 0.13],
            [0.24, 0.14, 0.13],
          ],
          palette.accent,
        ),
        line(
          [
            [-0.24, 0.14, 0.13],
            [-0.24, -0.15, 0.13],
            [0.24, -0.15, 0.13],
            [0.24, 0.14, 0.13],
          ],
          palette.accent,
        ),
      );
    } else if (index === 1) {
      source.add(
        slab(0.48, 0.3, 0.018, palette.accent, 0, 0.03, 0.13, 0.07),
        mesh(new THREE.ConeGeometry(0.075, 0.15, 3), palette.accent, -0.14, -0.18, 0.13),
      );
    } else {
      source.add(
        mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 36), palette.accent, 0, 0, 0.13),
        line(
          [
            [-0.2, 0, 0.135],
            [0.2, 0, 0.135],
          ],
          palette.accent,
        ),
        line(
          [
            [0, -0.2, 0.135],
            [0, 0.2, 0.135],
          ],
          palette.accent,
        ),
      );
    }
    group.add(source);
    return source;
  });

  const inboxPoint = new THREE.Vector3(0.72, 0, 0.2);
  const routes = sourceY.map(
    (y) =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.22, y, 0.08),
        new THREE.Vector3(-0.52, y * 0.82, 0.25),
        new THREE.Vector3(0.08, y * 0.35, 0.3),
        inboxPoint.clone(),
      ]),
  );
  routes.forEach((route) => group.add(tube(route.getPoints(32), 0.014, palette.muted)));

  const packets = routes.map((route, index) => {
    const packet = mesh(
      index === 1
        ? new THREE.OctahedronGeometry(0.09)
        : index === 2
          ? new THREE.BoxGeometry(0.14, 0.14, 0.14)
          : new THREE.SphereGeometry(0.085, 16, 12),
      palette.accent,
    );
    packet.position.copy(route.getPoint(0));
    group.add(packet);
    return packet;
  });

  const inbox = new THREE.Group();
  inbox.position.set(1.12, 0, 0);
  inbox.add(
    slab(1.42, 1.55, 0.16, palette.ink),
    slab(1.22, 1.35, 0.025, palette.paper, 0, 0, 0.1),
    label("INBOX", palette.ink, 0, 0.53, 0.14, 0.15),
  );
  const tray = slab(1.05, 0.53, 0.16, palette.accent, 0, -0.37, 0.19, 0.055);
  tray.rotation.x = -0.18;
  inbox.add(tray);
  const receipts = sourceY.map((_, index) => {
    const receipt = slab(0.72, 0.18, 0.025, palette.paper, 0, -0.25 + index * 0.14, 0.34, 0.025);
    inbox.add(receipt);
    return receipt;
  });
  const status = mesh(new THREE.TorusGeometry(0.12, 0.027, 10, 40), palette.accent, 0.43, 0.53, 0.14);
  inbox.add(status);
  group.add(inbox);

  group.userData.contact = { inboxPoint, routes, packets, receipts };
  group.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION);
    sources.forEach((source, index) => {
      const enter = smootherstep(progress(t, 120 + index * 140, 780 + index * 140));
      source.position.x = lerp(-1.9, -1.62, enter);
      source.rotation.z = (index - 1) * 0.055 * (1 - enter);
    });
    packets.forEach((packet, index) => {
      const travel = smootherstep(progress(t, 700 + index * 430, 2750 + index * 430));
      packet.position.copy(routes[index].getPoint(travel));
      packet.rotation.z = travel * Math.PI * 2;
      packet.scale.setScalar(Math.max(0.001, Math.sin(travel * Math.PI)));
      const received = smootherstep(progress(t, 2600 + index * 430, 3300 + index * 430));
      receipts[index].scale.x = Math.max(0.001, received);
      receipts[index].position.x = lerp(-0.18, 0, received);
    });
    const acknowledge = smootherstep(progress(t, 3900, 4750));
    status.scale.setScalar(Math.max(0.001, acknowledge));
    status.rotation.z = lerp(-Math.PI, 0, acknowledge);
    inbox.position.y = 0.035 * Math.sin(progress(t, 3900, 4750) * Math.PI);
    phase(
      group,
      t,
      t < 900 ? "open-channels" : t < 3650 ? "route-signals" : t < 4750 ? "collect-messages" : "contact-ready",
      progress(t, 700, 4750),
    );
  };
  return group;
}
/** Studio's procedural builders (Studio tennis loads its model in `createObject`). */
const studioBuilders: Record<
  Exclude<KindWithLook<0>, "tennis">,
  (palette: ObjectPalette, finish: ObjectEdition) => THREE.Group
> = {
  contact,
  trading: studio.trading,
  server: studio.server,
  travel: studio.travel,
};
export async function createObject(
  kind: ObjectKind,
  palette: ObjectPalette,
  /** A variant the kind does not offer builds its default look (`objectLooks`). Default: that default. */
  requested?: ObjectVariant,
  edition: ObjectEdition = 0,
  /** Overrides the packaged model file for scenes that load one (Studio tennis). */
  modelUrl?: string,
) {
  const variant = normalizeObjectVariant(kind, requested ?? objectLooks[kind][0]);
  const finish: ObjectEdition = kind === "contact" ? ((variant % 3) as ObjectEdition) : edition;
  const accent = [palette.accent, 0x467b98, 0xa0694e][finish];
  const object =
    kind === "contact"
      ? variant === 3
        ? createContactDirection()
        : contact({ ...palette, accent })
      : variant !== 0
        ? createArtDirection(kind, variant)
        : kind === "tennis"
          ? await studio.tennis({ ...palette, accent }, finish, modelUrl ?? tennisModelUrl())
          : hasObjectLook(kind, 0)
            ? await studioBuilders[kind]({ ...palette, accent }, finish)
            : null;
  if (!object) throw new Error(`${kind} has no Studio look`);
  object.userData.style ??= "studio";
  // Studio's look (src/objects/LOOK.md): the defaults, with the key's shadow map for the tennis
  // model and the contact editions' meshes casting, as before the look system.
  object.userData.look ??= {
    castShadows: kind === "contact" && variant > 0,
    rig: kind === "tennis" ? { both: { key: { shadow: true } } } : undefined,
  } satisfies ObjectLook;
  object.userData.variant = variant;
  object.userData.animate(0);
  return object;
}
export function disposeObject(scene: THREE.Object3D) {
  scene.traverse((item) => item.userData.dispose?.());
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>();
  scene.traverse((item) => {
    const drawable = item as THREE.Mesh;
    if (drawable.geometry) geometries.add(drawable.geometry);
    if (drawable.material)
      for (const material of Array.isArray(drawable.material) ? drawable.material : [drawable.material]) {
        materials.add(material);
        for (const texture of materialTextures(material)) textures.add(texture);
      }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}
