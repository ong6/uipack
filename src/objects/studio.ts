// The subjects: one clean physical object per subject, floating on the page, doing its job. State
// shows through physical cues (a bead sliding on its rod, a sled pulled out, a fold opening), never
// readable screen text. Every part is tagged with its ink role (`userData.inkRole`, src/objects/
// LOOK.md); the ink renderer (ink.ts) draws them, so the materials here only carry the role. One lens
// family for all; each subject gets its own camera height and distance.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { contactShadow, type ObjectLook } from "./look";
import type { InkRole } from "./ink";
import { marketBar, MARKET_BAR_MS, MARKET_LOOP_MS } from "./market";
import { clamp, lerp, progress, smootherstep } from "../math";

/** Every subject stands on the same tabletop. */
const FLOOR = -1;
/** A play-once subject (Contact) reaches its rest pose here, then offers Replay. */
export const DURATION = 5400;

/* ---------------------------------------------------------------- The lens */

/** One subject's shot: how high the lens sits (pitch, degrees), how wide, and how close (fill). */
interface Shot {
  pitch: number;
  fov?: number;
  fill?: number;
  maxWidth?: number;
  lift?: number;
}

/** The camera and framing for a subject: one lens family, re-framed per subject. */
export function studioLook(shot: Shot = { pitch: 14 }): ObjectLook {
  return {
    camera: { projection: "perspective", fov: shot.fov ?? 32, pitch: shot.pitch },
    framing: { fill: shot.fill ?? 0.78, maxWidth: shot.maxWidth ?? 0.9, lift: shot.lift ?? 0 },
    contactShadow: { spread: 1.0, opacity: 0.32 },
  };
}

/* ---------------------------------------------------------------- Parts */

/** One material per ink role, shared by a subject's parts; the renderer swaps them for its own. */
function inkMaterials() {
  const make = (role: InkRole) => {
    const material = new THREE.MeshBasicMaterial();
    material.userData.inkRole = role;
    return material;
  };
  return { paper: make("paper"), shade: make("shade"), dark: make("dark"), accent: make("accent") };
}
type Inks = ReturnType<typeof inkMaterials>;

/** A rounded box: one bevel step, which the line drawing reads as a soft corner. */
function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0, radius = 0.03) {
  const r = Math.min(radius, w / 2.01, h / 2.01, d / 2.01);
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 1, r), material);
  m.position.set(x, y, z);
  return m;
}
function cylinder(r: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0, segments = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
  m.position.set(x, y, z);
  return m;
}
/** Stand a cylinder's axis along z (towards the lens). */
function turned(mesh: THREE.Mesh) {
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}
/** Ink line segments from point pairs: strings, rods, seams, icons. `width` in CSS px. */
function segments(points: THREE.Vector3[], width = 1, role?: InkRole) {
  const line = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial());
  line.userData.inkWidth = width;
  if (role) line.userData.inkRole = role;
  return line;
}
/** An ink polyline through `points` (closed with `loop`). */
function polyline(points: THREE.Vector3[], width = 1, loop = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = loop
    ? new THREE.LineLoop(geometry, new THREE.LineBasicMaterial())
    : new THREE.Line(geometry, new THREE.LineBasicMaterial());
  line.userData.inkWidth = width;
  return line;
}
const v3 = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
/** Time within a loop, always in [0, loop). */
const wrap = (time: number, loop: number) => ((time % loop) + loop) % loop;
/** 0 → 1 over [a, b], held, then 1 → 0 over [c, d]. */
const envelope = (t: number, a: number, b: number, c: number, d: number) =>
  smootherstep(progress(t, a, b)) * (1 - smootherstep(progress(t, c, d)));
/**
 * The product-film move: the subject turns a few degrees on a hidden turntable and back over one
 * loop, while the lens holds.
 */
const turntable = (group: THREE.Object3D, base: number, t: number, loop: number, amplitude = 0.12) =>
  (group.rotation.y = base + amplitude * Math.sin((t / loop) * Math.PI * 2));
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
/** A hidden instance: zero scale, which the renderer draws as nothing (no stray silhouette dot). */
const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);

/** The subject's root, with its look. */
function finish(root: THREE.Group, shot: Shot, change: Partial<ObjectLook> = {}) {
  root.userData.style = "ink";
  root.userData.look = { ...studioLook(shot), ...change };
  return root;
}

/* ---------------------------------------------------------------- Contact: three signals, one inbox */

/** A rounded slab `width` × `height` (corner `radius`), `depth` thick and bevelled, centred on (x, y, z). */
function slab(width: number, height: number, depth: number, material: THREE.Material, x = 0, y = 0, z = 0, radius = 0.06) {
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
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  return m;
}

export function contact() {
  const ink = inkMaterials();
  const root = new THREE.Group();
  const group = new THREE.Group();
  group.rotation.set(0.1, -0.2, -0.025);
  root.add(group);

  // Three sources, each named by its symbol (an envelope, a chat bubble, a globe), not by colour.
  const sourceY = [0.9, 0, -0.9];
  const sources = sourceY.map((y, index) => {
    const source = new THREE.Group();
    source.position.set(-1.62, y, 0.05);
    source.add(slab(0.75, 0.58, 0.11, ink.paper));
    const z = 0.075;
    if (index === 0) {
      source.add(
        polyline([v3(-0.22, 0.14, z), v3(0, -0.03, z), v3(0.22, 0.14, z)], 1.25),
        polyline([v3(-0.22, 0.14, z), v3(-0.22, -0.15, z), v3(0.22, -0.15, z), v3(0.22, 0.14, z)], 1.25, true),
      );
    } else if (index === 1) {
      // A speech bubble: a rounded outline with its tail.
      const bubble = new THREE.Shape();
      bubble.moveTo(-0.22, -0.08);
      bubble.lineTo(-0.22, 0.12);
      bubble.quadraticCurveTo(-0.22, 0.17, -0.17, 0.17);
      bubble.lineTo(0.17, 0.17);
      bubble.quadraticCurveTo(0.22, 0.17, 0.22, 0.12);
      bubble.lineTo(0.22, -0.08);
      bubble.quadraticCurveTo(0.22, -0.13, 0.17, -0.13);
      bubble.lineTo(-0.06, -0.13);
      bubble.lineTo(-0.15, -0.2);
      bubble.lineTo(-0.14, -0.13);
      bubble.lineTo(-0.17, -0.13);
      bubble.quadraticCurveTo(-0.22, -0.13, -0.22, -0.08);
      source.add(
        polyline(
          bubble.getPoints(6).map((p) => v3(p.x, p.y, z)),
          1.25,
          true,
        ),
      );
    } else {
      // A globe: its outline, a meridian and the equator.
      const ring = (rx: number, ry: number) =>
        Array.from({ length: 40 }, (_, i) => {
          const a = (i / 40) * Math.PI * 2;
          return v3(Math.sin(a) * rx, Math.cos(a) * ry, z);
        });
      source.add(
        polyline(ring(0.19, 0.19), 1.25, true),
        polyline(ring(0.08, 0.19), 1.1, true),
        segments([v3(-0.19, 0, z), v3(0.19, 0, z), v3(0, -0.19, z), v3(0, 0.19, z)], 1.1),
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
  routes.forEach((route) => group.add(polyline(route.getPoints(32), 1.25)));

  // The signals in flight are the subject's one accent.
  const packets = routes.map((route, index) => {
    const packet = new THREE.Mesh(
      index === 1
        ? new THREE.OctahedronGeometry(0.09)
        : index === 2
          ? new THREE.BoxGeometry(0.14, 0.14, 0.14)
          : new THREE.SphereGeometry(0.085, 16, 12),
      ink.accent,
    );
    packet.position.copy(route.getPoint(0));
    group.add(packet);
    return packet;
  });

  const inbox = new THREE.Group();
  inbox.position.set(1.12, 0, 0);
  // Parts stand clear of each other (never sunk into one another), so every silhouette shows.
  inbox.add(slab(1.42, 1.55, 0.16, ink.shade), slab(1.22, 1.35, 0.025, ink.paper, 0, 0, 0.13));
  const tray = slab(1.05, 0.53, 0.16, ink.paper, 0, -0.37, 0.19, 0.055);
  tray.rotation.x = -0.18;
  inbox.add(tray);
  const receipts = sourceY.map((_, index) => {
    // Stacked: each one a little behind the one below, so its top edge reads as a line.
    const receipt = slab(0.72, 0.18, 0.025, ink.paper, 0, -0.25 + index * 0.14, 0.44 - index * 0.06, 0.025);
    inbox.add(receipt);
    return receipt;
  });
  const status = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.027, 8, 32), ink.accent);
  status.position.set(0.43, 0.5, 0.2);
  inbox.add(status);
  group.add(inbox);

  root.userData.contact = { inboxPoint, routes, packets, receipts };
  root.userData.playDuration = DURATION;
  root.userData.restTime = DURATION;
  root.userData.animate = (time: number) => {
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
      const size = Math.max(0.001, Math.sin(travel * Math.PI));
      packet.scale.setScalar(size);
      packet.visible = size > 0.02;
      const received = smootherstep(progress(t, 2600 + index * 430, 3300 + index * 430));
      receipts[index].scale.x = Math.max(0.001, received);
      receipts[index].position.x = lerp(-0.18, 0, received);
      receipts[index].visible = received > 0.02;
    });
    const acknowledge = smootherstep(progress(t, 3900, 4750));
    status.scale.setScalar(Math.max(0.001, acknowledge));
    status.rotation.z = lerp(-Math.PI, 0, acknowledge);
    status.visible = acknowledge > 0.02;
    inbox.position.y = 0.035 * Math.sin(progress(t, 3900, 4750) * Math.PI);
    root.userData.phase =
      t >= DURATION
        ? "rest"
        : t < 900
          ? "open-channels"
          : t < 3650
            ? "route-signals"
            : t < 4750
              ? "collect-messages"
              : "contact-ready";
    root.userData.pose = progress(t, 700, 4750);
  };
  return finish(root, { pitch: 4, fov: 30, fill: 0.72, maxWidth: 0.88 }, { contactShadow: false });
}

/* ---------------------------------------------------------------- Tennis: racket, can and a bouncing ball */

const BALL_R = 0.13;

/** A ball: the felt as a paper sphere (an explicit role) and its seam as one ink curve on it. */
function ball(ink: Inks) {
  const pivot = new THREE.Group();
  const felt = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 28, 18), ink.paper);
  felt.userData.inkRole = "paper";
  pivot.add(felt);
  // The classic seam: a curve that stays on the sphere (a + b = 1).
  const a = 0.7,
    b = 0.3,
    k = 2 * Math.sqrt(a * b);
  const seam = Array.from({ length: 96 }, (_, i) => {
    const t = (i / 96) * Math.PI * 2;
    return v3(a * Math.cos(t) + b * Math.cos(3 * t), a * Math.sin(t) - b * Math.sin(3 * t), k * Math.sin(2 * t)).multiplyScalar(
      BALL_R * 1.006,
    );
  });
  pivot.add(polyline(seam, 1, true));
  return pivot;
}

/** The racket, long axis along +x from the butt, string bed in its local xz plane. */
function racket(ink: Inks) {
  const group = new THREE.Group();
  const cx = 1.86,
    a = 0.62,
    b = 0.47;
  const headCurve = new THREE.EllipseCurve(cx, 0, a, b, 0, Math.PI * 2, false, 0);
  const headPoints = headCurve.getPoints(96).map((p) => new THREE.Vector3(p.x, 0, p.y));
  const frame = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(headPoints, true), 112, 0.036, 8, true),
    ink.shade,
  );
  frame.scale.y = 1.45;
  group.add(frame);
  // Throat: two beams from the shaft to the head, and a bridge across them.
  for (const side of [-1, 1]) {
    const beam = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.78, 0, 0),
      new THREE.Vector3(1.02, 0, side * 0.1),
      new THREE.Vector3(1.2, 0, side * 0.27),
      new THREE.Vector3(cx - a * 0.86, 0, side * b * 0.52),
    ]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(beam, 24, 0.034, 8, false), ink.shade);
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
      16,
      0.03,
      8,
      false,
    ),
    ink.shade,
  );
  bridge.scale.y = 1.3;
  group.add(bridge);
  // Strings: mains along the racket, crosses across it, as fine ink lines inside the frame.
  const strings: THREE.Vector3[] = [];
  const innerA = a - 0.035,
    innerB = b - 0.035;
  for (let i = 0; i < 12; i++) {
    const z = -innerB * 0.9 + (i * innerB * 1.8) / 11;
    const half = innerA * Math.sqrt(Math.max(0, 1 - (z / innerB) ** 2));
    strings.push(v3(cx - half, 0, z), v3(cx + half, 0, z));
  }
  for (let i = 0; i < 14; i++) {
    const x = cx - innerA * 0.92 + (i * innerA * 1.84) / 13;
    const half = innerB * Math.sqrt(Math.max(0, 1 - ((x - cx) / innerA) ** 2));
    strings.push(v3(x, 0, -half), v3(x, 0, half));
  }
  group.add(segments(strings, 0.75));
  // Shaft, handle with its grip wrap drawn as a helix, and the butt cap.
  const shaft = cylinder(0.042, 0.3, ink.shade, 0.68, 0, 0, 12);
  shaft.rotation.z = Math.PI / 2;
  shaft.scale.z = 1.35;
  group.add(shaft);
  const grip = cylinder(0.066, 0.58, ink.paper, 0.27, 0, 0, 8);
  grip.rotation.z = Math.PI / 2;
  grip.rotation.x = Math.PI / 8;
  group.add(grip);
  const helix = Array.from({ length: 145 }, (_, i) => {
    const u = i / 144,
      angle = u * Math.PI * 2 * 7;
    return v3(0.03 + u * 0.5, Math.cos(angle) * 0.069, Math.sin(angle) * 0.069);
  });
  group.add(polyline(helix, 0.75));
  const cap = cylinder(0.075, 0.05, ink.shade, -0.015, 0, 0, 8);
  cap.rotation.z = Math.PI / 2;
  cap.rotation.x = Math.PI / 8;
  group.add(cap);
  const collar = cylinder(0.07, 0.04, ink.dark, 0.57, 0, 0, 16);
  collar.rotation.z = Math.PI / 2;
  group.add(collar);
  return { group, head: new THREE.Vector3(cx, 0, 0) };
}

export function tennis() {
  const ink = inkMaterials();
  const root = new THREE.Group();
  const set = new THREE.Group();
  set.rotation.y = -0.38;
  set.position.set(-0.1, 0, 0);
  root.add(set);

  // The ball can, lying on its side with its open end towards the lens. It rests on its lid and
  // its rolled rim, which stand a little proud of the body; its sleeve is the subject's accent.
  const can = new THREE.Group();
  const canR = 0.155,
    canL = 0.92,
    LIP = 0.012;
  can.position.set(1.1, FLOOR + canR + LIP, -0.15);
  can.rotation.y = 1.15;
  set.add(can);
  can.add(turned(cylinder(canR, canL, ink.paper, 0, 0, 0, 32)));
  can.add(turned(cylinder(canR + 0.006, 0.42, ink.accent, 0, 0, -0.05, 32)));
  can.add(turned(cylinder(canR + LIP, 0.05, ink.shade, 0, 0, -canL / 2 - 0.02, 32)));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(canR, LIP, 6, 32), ink.paper);
  rim.position.z = canL / 2;
  can.add(rim);
  // The open mouth: a dark well just inside the rim.
  can.add(turned(cylinder(canR - 0.014, 0.004, ink.dark, 0, 0, canL / 2 + 0.002, 32)));
  // The second ball has rolled out of the open mouth and come to rest on the table beside it.
  const spare = ball(ink);
  const rolled = new THREE.Vector3(0.12, 0, canL / 2 + BALL_R + 0.08).applyEuler(can.rotation).add(can.position);
  spare.position.set(rolled.x, FLOOR + BALL_R, rolled.z);
  spare.rotation.set(1.2, 0.3, 0.6);
  set.add(spare);

  // The racket rests with real contact: its butt cap on the table and its frame on the can's body
  // (never the strings). Found by tilting the racket up from level until no part of it is inside
  // the can, with the lowest point always on the table.
  const { group: frame, head } = racket(ink);
  frame.updateMatrixWorld(true);
  const points: THREE.Vector3[] = [];
  frame.traverse((item) => {
    const m = item as THREE.Mesh;
    if (!m.isMesh) return;
    const position = m.geometry.attributes.position;
    const step = Math.max(1, Math.floor(position.count / 1200));
    for (let i = 0; i < position.count; i += step)
      points.push(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(m.matrixWorld));
  });
  const pivot = new THREE.Group();
  pivot.position.set(-1.45, 0, 0.25);
  pivot.rotation.y = 0.18;
  set.add(pivot);
  pivot.add(frame);
  can.updateMatrix();
  const intoCan = can.matrix.clone().invert();
  const tiltMatrix = new THREE.Matrix4(),
    placed = new THREE.Matrix4(),
    probe = new THREE.Vector3();
  const reach = canR + LIP + 0.004;
  let tilt = -0.08,
    lowest = new THREE.Vector3();
  for (; tilt < 0.6; tilt += 0.0015) {
    tiltMatrix.makeRotationZ(tilt);
    let low = Infinity;
    for (const q of points) {
      probe.copy(q).applyMatrix4(tiltMatrix);
      if (probe.y < low) {
        low = probe.y;
        lowest = q;
      }
    }
    pivot.position.y = FLOOR - low;
    pivot.updateMatrix();
    placed.multiplyMatrices(pivot.matrix, tiltMatrix);
    // The racket must rest on its butt (the head may also touch the table, when the can is clear).
    if (lowest.x > 0.4) continue;
    const inside = points.some((q) => {
      probe.copy(q).applyMatrix4(placed).applyMatrix4(intoCan);
      return Math.abs(probe.z) < canL / 2 + 0.03 && probe.x * probe.x + probe.y * probe.y < reach * reach;
    });
    if (!inside) break;
  }
  frame.rotation.z = tilt;
  // The bouncing ball, its contact point on the string bed under the head's centre.
  const bouncing = ball(ink);
  set.add(bouncing);
  const racketContact = head.clone().add(new THREE.Vector3(0, BALL_R, 0));
  frame.updateMatrix();
  pivot.updateMatrix();
  const strike = racketContact.clone().applyMatrix4(frame.matrix).applyMatrix4(pivot.matrix);
  // A still life of separate pieces: each gets its own faint ellipse where it meets the table.
  const blob = (width: number, depth: number, x: number, z: number, angle = 0, opacity = 0.5) => {
    const shadow = contactShadow(width, depth, { x, y: FLOOR + 0.003, z, opacity });
    shadow.rotation.z = angle;
    set.add(shadow);
  };
  blob(canR * 3, canL * 1.2, can.position.x, can.position.z, can.rotation.y, 0.55);
  blob(BALL_R * 3.2, BALL_R * 3.2, spare.position.x, spare.position.z, 0, 0.6);
  const butt = new THREE.Vector3(0.1, 0, 0).applyMatrix4(frame.matrix).applyMatrix4(pivot.matrix);
  blob(0.6, 0.3, butt.x, butt.z, pivot.rotation.y + Math.PI / 2, 0.45);

  const LOOP = 6000,
    BOUNCE = 3000,
    FIRST = 1900,
    APEX = 1.05;
  root.userData.contactTimes = [FIRST, FIRST + BOUNCE];
  root.userData.racketContact = racketContact;
  root.userData.loopDuration = LOOP;
  root.userData.restTime = FIRST + 760;
  root.userData.ball = bouncing;
  root.userData.racket = frame;
  root.userData.animate = (time: number) => {
    const t = wrap(time, LOOP);
    turntable(set, -0.38, t, LOOP, 0.1);
    const s = wrap(t - FIRST, BOUNCE);
    const u = s / BOUNCE;
    bouncing.position.set(strike.x, strike.y + APEX * 4 * u * (1 - u), strike.z);
    // Squash for 70ms either side of contact.
    const near = Math.min(s, BOUNCE - s);
    const squash = Math.max(0, 1 - near / 70) ** 2;
    bouncing.scale.set(1 + 0.12 * squash, 1 - 0.2 * squash, 1 + 0.12 * squash);
    bouncing.rotation.set((t / LOOP) * Math.PI * 4, 0.5, (t / LOOP) * Math.PI * 2);
    // The racket answers each strike with a small damped shiver that only lifts it off the can.
    frame.rotation.z = tilt + 0.012 * Math.sin(s / 22) ** 2 * Math.exp(-s / 110);
    root.userData.phase = u < 0.5 ? "rise" : "fall";
    root.userData.pose = t / LOOP;
  };
  // Low and close along the table, so the can and the racket's head read as a still life.
  return finish(root, { pitch: 16, fov: 30, fill: 0.8 }, { contactShadow: false });
}

/* ---------------------------------------------------------------- Trading: a market abacus */

export function trading() {
  const ink = inkMaterials();
  const root = new THREE.Group();
  const desk = new THREE.Group();
  desk.rotation.y = 0.42;
  root.add(desk);
  const COLS = 12,
    PITCH = 0.27,
    baseTop = FLOOR + 0.34,
    railY = 1.08;
  const span = (COLS - 1) * PITCH;
  desk.add(box(span + 0.62, 0.3, 0.86, ink.shade, 0, FLOOR + 0.15, 0, 0.07));
  desk.add(box(span + 0.5, 0.04, 0.74, ink.paper, 0, FLOOR + 0.32, 0, 0.02));
  // The frame: end posts and the top rail; a fine rod for every bar.
  for (const side of [-1, 1])
    desk.add(box(0.08, railY - baseTop + 0.05, 0.12, ink.paper, side * (span / 2 + 0.2), (railY + baseTop) / 2, 0, 0.025));
  desk.add(box(span + 0.48, 0.08, 0.12, ink.paper, 0, railY, 0, 0.025));
  const rods: THREE.Vector3[] = [];
  for (let i = 0; i < COLS; i++) rods.push(v3(-span / 2 + i * PITCH, baseTop, 0), v3(-span / 2 + i * PITCH, railY - 0.04, 0));
  desk.add(segments(rods, 1));
  // Wicks (a sleeve from low to high) and bodies (a bead from open to close) slide on the rods. A
  // rising bar's bead is hollow (paper), a falling one's toned (shade), the way a monochrome
  // candlestick chart prints them; the newest bar, ticking in on the right, is the accent.
  const placement = Array.from({ length: COLS }, () => HIDDEN);
  const wicks = instanced(new THREE.CylinderGeometry(0.034, 0.034, 1, 12), ink.dark, placement);
  const beadGeometry = new THREE.CylinderGeometry(0.108, 0.108, 1, 24);
  const rising = instanced(beadGeometry, ink.paper, placement);
  const falling = instanced(beadGeometry, ink.shade, placement);
  const newest = instanced(beadGeometry, ink.accent, [HIDDEN]);
  desk.add(wicks, rising, falling, newest);
  // Three lights on the front: a tick, the session, the last bar's direction.
  const leds = [0, 1, 2].map((i) => {
    const led = turned(cylinder(0.028, 0.02, ink.dark, span / 2 - 0.36 + i * 0.13, FLOOR + 0.2, 0.431, 12));
    led.userData.glow = true;
    desk.add(led);
    return led;
  });
  desk.add(box(span - 0.3, 0.012, 0.01, ink.paper, -0.42, FLOOR + 0.2, 0.432, 0.004));
  const low = 97.2,
    high = 102.8;
  const y = (price: number) => lerp(baseTop + 0.1, railY - 0.1, (price - low) / (high - low));
  const scratch = new THREE.Matrix4();
  const where = new THREE.Vector3(),
    size = new THREE.Vector3(),
    upright = new THREE.Quaternion();
  root.userData.loopDuration = MARKET_LOOP_MS;
  root.userData.restTime = 3600;
  root.userData.marketBar = marketBar;
  root.userData.animate = (time: number) => {
    const t = wrap(time, MARKET_LOOP_MS);
    turntable(desk, 0.42, t, MARKET_LOOP_MS, 0.12);
    const offset = t / MARKET_BAR_MS,
      first = Math.floor(offset),
      fraction = offset - first;
    // Each bar holds, then every column takes its right-hand neighbour's values in one quick tick.
    const tick = smootherstep(clamp((fraction - 0.66) / 0.3));
    for (let i = 0; i < COLS; i++) {
      const from = marketBar(first - (COLS - 1) + i),
        to = marketBar(first - (COLS - 2) + i);
      const o = lerp(from.open, to.open, tick),
        c = lerp(from.close, to.close, tick),
        h = lerp(from.high, to.high, tick),
        l = lerp(from.low, to.low, tick);
      const x = -span / 2 + i * PITCH;
      wicks.setMatrixAt(
        i,
        scratch.compose(where.set(x, (y(h) + y(l)) / 2, 0), upright, size.set(1, Math.max(0.02, y(h) - y(l)), 1)),
      );
      const body = scratch.compose(
        where.set(x, (y(o) + y(c)) / 2, 0),
        upright,
        size.set(1, Math.max(0.035, Math.abs(y(o) - y(c))), 1),
      );
      const bar = tick < 0.5 ? from : to;
      const last = i === COLS - 1;
      const up = bar.close >= bar.open;
      if (last) newest.setMatrixAt(0, body);
      rising.setMatrixAt(i, !last && up ? body : HIDDEN);
      falling.setMatrixAt(i, !last && !up ? body : HIDDEN);
    }
    for (const mesh of [wicks, rising, falling, newest]) mesh.instanceMatrix.needsUpdate = true;
    const latest = marketBar(first + (tick > 0.5 ? 1 : 0));
    leds[0].visible = Math.sin(Math.PI * clamp((fraction - 0.66) / 0.3)) > 0.3;
    leds[2].visible = latest.close >= latest.open;
    root.userData.phase = "market-pan";
    root.userData.pose = t / MARKET_LOOP_MS;
    root.userData.scroll = offset;
  };
  // Higher and three-quarter, so the rods read as a row receding and the beads stack in depth.
  return finish(root, { pitch: 19, fov: 30, fill: 0.74, maxWidth: 0.92 });
}

/* ---------------------------------------------------------------- Server: inference hardware */

export function server() {
  const ink = inkMaterials();
  const root = new THREE.Group();
  const rack = new THREE.Group();
  rack.rotation.y = -0.55;
  root.add(rack);
  const W = 2.9,
    D = 1.45,
    H = 2.42;
  const bottom = FLOOR;
  rack.add(box(W + 0.12, 0.1, D + 0.1, ink.shade, 0, bottom + 0.05, 0, 0.04));
  rack.add(box(W + 0.12, 0.07, D + 0.1, ink.shade, 0, bottom + H - 0.035, 0, 0.03));
  for (const x of [-W / 2, W / 2])
    for (const z of [-D / 2, D / 2]) rack.add(box(0.09, H - 0.17, 0.09, ink.paper, x, bottom + H / 2, z, 0.02));
  // Rubber feet.
  for (const x of [-W / 2 + 0.15, W / 2 - 0.15])
    for (const z of [-D / 2 + 0.1, D / 2 - 0.1]) rack.add(cylinder(0.06, 0.03, ink.dark, x, bottom - 0.005, z, 12));
  const units: THREE.Group[] = [],
    fans: THREE.Mesh[] = [];
  const ledMatrices: THREE.Matrix4[] = [];
  const ledUnit: number[] = [];
  const unitH = 0.64,
    front = D / 2 - 0.02;
  for (let i = 0; i < 3; i++) {
    const unit = new THREE.Group();
    const cy = bottom + 0.18 + unitH / 2 + (2 - i) * (unitH + 0.1);
    unit.userData.y = cy;
    unit.position.y = cy;
    rack.add(unit);
    units.push(unit);
    unit.add(box(W - 0.14, unitH, D - 0.1, ink.shade, 0, 0, -0.03, 0.03));
    // Rack ears with two screws each.
    for (const side of [-1, 1]) {
      unit.add(box(0.12, unitH - 0.04, 0.03, ink.paper, side * (W / 2 - 0.02), 0, front + 0.01, 0.012));
      for (const sy of [-0.19, 0.19])
        unit.add(turned(cylinder(0.024, 0.02, ink.paper, side * (W / 2 - 0.02), sy, front + 0.03, 10)));
    }
    // The face plates; the compute sled's is the subject's accent.
    unit.add(box(W - 0.2, unitH - 0.06, 0.04, i === 1 ? ink.accent : ink.paper, 0, 0, front, 0.02));
    if (i === 0) {
      // Storage: six drive sleds, each with a pull bar and an activity light.
      const sleds: THREE.Matrix4[] = [],
        bars: THREE.Matrix4[] = [];
      for (let n = 0; n < 6; n++) {
        const x = -1.0 + n * 0.4;
        sleds.push(at(x, 0, front + 0.035));
        bars.push(at(x, -0.13, front + 0.065));
        ledMatrices.push(at(x + 0.12, 0.15, front + 0.058));
        ledUnit.push(i);
      }
      unit.add(instanced(new RoundedBoxGeometry(0.36, 0.44, 0.04, 1, 0.015), ink.paper, sleds));
      unit.add(instanced(new RoundedBoxGeometry(0.24, 0.035, 0.03, 1, 0.012), ink.shade, bars));
    } else if (i === 1) {
      // Compute: three fans behind round guards; perforated vents either side.
      for (const x of [-0.72, 0, 0.72]) {
        unit.add(turned(cylinder(0.24, 0.02, ink.shade, x, 0, front + 0.012, 32)));
        const blades: THREE.BufferGeometry[] = [];
        for (let n = 0; n < 7; n++) {
          const blade = new THREE.BoxGeometry(0.075, 0.17, 0.012);
          blade.translate(0, 0.12, 0);
          blade.rotateY(0.45);
          blade.rotateZ((n * Math.PI * 2) / 7);
          blades.push(blade);
        }
        const hub = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
        hub.rotateX(Math.PI / 2);
        blades.push(hub);
        const fan = new THREE.Mesh(mergeGeometries(blades), ink.shade);
        blades.forEach((g) => g.dispose());
        fan.position.set(x, 0, front + 0.03);
        // Many small faces: the silhouette alone draws them; creases would only add noise.
        fan.userData.inkCreases = false;
        unit.add(fan);
        fans.push(fan);
        const guard: THREE.BufferGeometry[] = [0.235, 0.16, 0.085].map((r) => new THREE.TorusGeometry(r, 0.012, 5, 32));
        for (const angle of [0, Math.PI / 2]) {
          const spoke = new THREE.CylinderGeometry(0.011, 0.011, 0.47, 6);
          spoke.rotateZ(angle);
          guard.push(spoke.toNonIndexed());
          spoke.dispose();
        }
        const guardMesh = new THREE.Mesh(mergeGeometries(guard.map((g) => (g.index ? g.toNonIndexed() : g))), ink.paper);
        guard.forEach((g) => g.dispose());
        guardMesh.position.set(x, 0, front + 0.07);
        guardMesh.userData.inkCreases = false;
        unit.add(guardMesh);
      }
      const holes: THREE.Matrix4[] = [];
      for (const side of [-1, 1])
        for (let r = 0; r < 5; r++)
          for (let c = 0; c < 2; c++) holes.push(at(side * (1.18 + c * 0.08), -0.2 + r * 0.1, front + 0.021, Math.PI / 2));
      unit.add(instanced(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 8), ink.dark, holes));
      for (const x of [-1.18, 1.18]) {
        ledMatrices.push(at(x + 0.04, 0.23, front + 0.026));
        ledUnit.push(i);
      }
    } else {
      // Network: two rows of ports, link lights, and two patch cables.
      const ports: THREE.Matrix4[] = [];
      for (let r = 0; r < 2; r++)
        for (let n = 0; n < 8; n++) {
          const x = -0.98 + n * 0.25,
            y = -0.1 + r * 0.2;
          ports.push(at(x, y, front + 0.02));
          ledMatrices.push(at(x + 0.112, y + 0.05, front + 0.026));
          ledUnit.push(i);
        }
      // Each port is a socket: a shroud standing proud of the plate around a dark well.
      const DEPTH = 0.065,
        OW = 0.17,
        OH = 0.14,
        WALL = 0.018;
      const along = (dx: number, dy: number) => ports.map((m) => m.clone().multiply(at(dx, dy, DEPTH / 2)));
      unit.add(
        instanced(new THREE.BoxGeometry(OW, WALL, DEPTH), ink.paper, [
          ...along(0, (OH - WALL) / 2),
          ...along(0, -(OH - WALL) / 2),
        ]),
        instanced(new THREE.BoxGeometry(WALL, OH - 2 * WALL, DEPTH), ink.paper, [
          ...along((OW - WALL) / 2, 0),
          ...along(-(OW - WALL) / 2, 0),
        ]),
        instanced(
          new THREE.BoxGeometry(OW - 2 * WALL, OH - 2 * WALL, 0.006),
          ink.dark,
          along(0, 0).map((m) => m.multiply(at(0, 0, -DEPTH / 2 + 0.004))),
        ),
      );
      const cables = [
        { from: [-0.98, -0.1], to: [-0.48, -0.1], material: ink.shade },
        { from: [0.02, 0.1], to: [0.77, -0.1], material: ink.paper },
      ];
      for (const { from, to, material } of cables) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(from[0], from[1], front + 0.12),
          new THREE.Vector3(from[0], from[1] - 0.12, front + 0.28),
          new THREE.Vector3((from[0] + to[0]) / 2, -0.4, front + 0.4),
          new THREE.Vector3(to[0], to[1] - 0.12, front + 0.28),
          new THREE.Vector3(to[0], to[1], front + 0.12),
        ]);
        unit.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.032, 8, false), material));
        for (const end of [from, to]) unit.add(box(0.122, 0.096, 0.12, material, end[0], end[1], front + 0.09, 0.022));
      }
    }
  }
  // All front-panel lights in one draw call: solid ink dots, a lit one shown and an unlit one hidden.
  const ledMesh = instanced(new THREE.SphereGeometry(0.022, 8, 6), ink.dark, ledMatrices);
  ledMesh.userData.glow = true;
  ledMesh.frustumCulled = false;
  root.add(ledMesh);
  const unitOf = (n: number) => units[ledUnit[n]];
  const ledScratch = new THREE.Matrix4();
  // A hot swap, looped: the running rack powers down its compute sled, slides it out on its rails,
  // holds it for the lens, seats it again and powers it back up while the drives and links blink.
  const LOOP = 8000;
  const power = (t: number) => 1 - envelope(t, 1000, 1400, 5000, 5600);
  const pull = (t: number) => envelope(t, 1400, 2600, 3800, 5000);
  // The fans' angle is the integral of their speed (they spin down and up with power), scaled so a
  // loop turns them a whole number of times and the wrap is seamless.
  const STEP = 10,
    spin: number[] = [0];
  for (let t = STEP; t <= LOOP; t += STEP) spin.push(spin[spin.length - 1] + power(t - STEP / 2) * STEP);
  const turns = Math.PI * 2 * Math.round((spin[spin.length - 1] / LOOP) * 8);
  const fanAngle = (t: number) => {
    const i = Math.min(spin.length - 2, Math.floor(t / STEP));
    return (lerp(spin[i], spin[i + 1], t / STEP - i) / spin[spin.length - 1]) * turns;
  };
  root.userData.loopDuration = LOOP;
  root.userData.restTime = 600;
  root.userData.animate = (time: number) => {
    const t = wrap(time, LOOP);
    turntable(rack, -0.55, t, LOOP, 0.12);
    const on = power(t),
      out = pull(t);
    units.forEach((unit, i) => {
      unit.position.z = i === 1 ? 0.62 * out : 0;
      unit.position.y = unit.userData.y + (i === 1 ? 0.012 * Math.sin(out * Math.PI) : 0);
    });
    const angle = fanAngle(t);
    fans.forEach((fan, i) => (fan.rotation.z = -(angle + i * 0.6)));
    rack.updateMatrix();
    ledMatrices.forEach((matrix, n) => {
      unitOf(n).updateMatrix();
      const unit = ledUnit[n];
      const phaseN = (t / LOOP) * Math.PI * 2;
      const lit =
        unit === 1
          ? on
          : unit === 0
            ? 0.55 + 0.45 * Math.sin(phaseN * (6 + n) + n * 1.7)
            : 0.65 + 0.35 * Math.sin(phaseN * (11 + (n % 4)) + n);
      ledMesh.setMatrixAt(n, lit > 0.5 ? ledScratch.multiplyMatrices(rack.matrix, unitOf(n).matrix).multiply(matrix) : HIDDEN);
    });
    ledMesh.instanceMatrix.needsUpdate = true;
    root.userData.phase =
      t < 1400 ? "running" : t < 2600 ? "pull-compute" : t < 3800 ? "hot-swap" : t < 5000 ? "seat-compute" : "power-up";
    root.userData.pose = t / LOOP;
  };
  // The lowest lens of the set, nearly level with the rack: a heroic hardware shot.
  return finish(root, { pitch: 5, fov: 32, fill: 0.8 });
}

/* ---------------------------------------------------------------- Travel: a folded atlas */

/**
 * The atlas print as ink line work only (alpha is coverage, drawn in the ink colour): contours round
 * two summits, a river's banks, a lake with water lines, three roads, a grid and the neat line.
 * The same 3:2 layout across the three panels.
 */
function atlasPrint() {
  const W = 1536,
    H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;
  ctx.strokeStyle = "white";
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
  const trace = (from: number, to: number, step: number, f: (t: number) => [number, number]) => {
    ctx.beginPath();
    for (let t = from; t <= to; t += step) {
      const [x, y] = f(t);
      if (t === from) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
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
  ctx.lineWidth = 2.6;
  for (const offset of [-11, 11]) trace(-20, H + 20, 8, (y) => [990 + 80 * Math.sin(y / 150) + y * 0.12 + offset, y]);
  // Lake outline with a few water lines inside.
  blob(320, 770, 95, 2);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.save();
  blob(320, 770, 95, 2);
  ctx.clip();
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.6;
  for (let y = 660; y < 880; y += 14) trace(180, 460, 280, (x) => [x, y]);
  ctx.restore();
  ctx.globalAlpha = 1;
  // Roads: one solid, two dashed.
  [0, 1, 2].forEach((r) => {
    ctx.setLineDash(r === 1 ? [] : [14, 10]);
    ctx.lineWidth = r === 1 ? 4.5 : 2.6;
    trace(-20, W + 20, 8, (x) => [x, 190 + r * 320 + 45 * Math.sin(x / 210 + r * 1.3)]);
  });
  ctx.setLineDash([]);
  // Grid and neat line.
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 1.5;
  for (let x = 128; x < W; x += 128) trace(0, H, H, (y) => [x, y]);
  for (let y = 128; y < H; y += 128) trace(0, W, W, (x) => [x, y]);
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, 28);
  ctx.clearRect(0, H - 28, W, 28);
  ctx.clearRect(0, 0, 28, H);
  ctx.clearRect(W - 28, 0, 28, H);
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  return texture;
}

export function travel() {
  const ink = inkMaterials();
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
  const PW = 1.23,
    PH = 2.45,
    T = 0.014;
  /** Where the near panel meets the middle one, on the table. */
  const HINGE = new THREE.Vector3(0, T / 2, 0.55);
  /** The middle panel's final angle from the near one (so 55° up from the table, leaning back). */
  const STAND = Math.PI - 0.96;
  const texture = atlasPrint();
  root.userData.dispose = () => texture.dispose();
  // The printed face: paper with the print drawn in ink over it (`inkPrint`, src/objects/LOOK.md).
  const print = new THREE.MeshBasicMaterial();
  print.userData.inkRole = "paper";
  print.userData.inkPrint = texture;

  /** Route in flat map coordinates (x across all three panels, y along the folds): it starts on the near panel and climbs the standing one. */
  const route = [
    [-1.6, -0.8],
    [-1.0, -0.35],
    [-0.4, 0.3],
    [0.25, 0.42],
    [0.85, 0.1],
    [1.55, 0.7],
  ];
  const flat = new THREE.CatmullRomCurve3(route.map(([x, y]) => new THREE.Vector3(-1.5 + ((x + 1.6) / 3.15) * 1.9, y * 0.72, 0)));
  const flatPoints = flat.getSpacedPoints(240);
  const panelOf = (x: number) => (x < -PW / 2 ? 0 : x > PW / 2 ? 2 : 1);
  const toLocal = (p: THREE.Vector3, panel: number) => new THREE.Vector3(p.x - (panel - 1) * (PW / 2), p.y, T / 2 + 0.006);

  const folds: THREE.Group[] = [];
  const pieces: { mesh: THREE.Mesh; from: number; to: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const fold = new THREE.Group();
    fold.position.x = i === 0 ? -PW / 2 : i === 2 ? PW / 2 : 0;
    const center = i === 0 ? -PW / 2 : i === 2 ? PW / 2 : 0;
    const sheet = new THREE.BoxGeometry(PW, PH, T, 1, 1, 1);
    const uv = sheet.attributes.uv;
    for (let n = 16; n < 20; n++) uv.setX(n, (uv.getX(n) + i) / 3);
    const panel = new THREE.Mesh(sheet, [ink.paper, ink.paper, ink.paper, ink.paper, print, ink.paper]);
    panel.position.x = center;
    fold.add(panel);
    // The route's run across this panel: the accent, raised on the paper.
    const indices = flatPoints.map((p, n) => (panelOf(p.x) === i ? n : -1)).filter((n) => n >= 0);
    if (indices.length > 1) {
      const from = Math.max(0, indices[0] - 1),
        to = Math.min(flatPoints.length - 1, indices[indices.length - 1] + 1);
      const local = flatPoints.slice(from, to + 1).map((p) => toLocal(p, i));
      // Clip the ends to the hinge so the ink meets across the crease.
      local.forEach((p) => (p.x = clamp(p.x, i === 0 ? -PW : -PW / 2, i === 2 ? PW : i === 0 ? 0 : PW / 2)));
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(local), local.length * 2, 0.019, 6, false),
        ink.accent,
      );
      fold.add(mesh);
      pieces.push({ mesh, from: from / (flatPoints.length - 1), to: to / (flatPoints.length - 1) });
    }
    folds.push(fold);
    map.add(fold);
  }
  // Where paper meets the table: along the valley crease, and where the far panel's edge props the
  // tent (only once it is standing).
  stage.add(contactShadow(PH * 1.04, 0.3, { x: 0, y: 0.002, z: HINGE.z - 0.05, opacity: 0.55 }));
  const propLine = contactShadow(PH * 1.04, 0.26, { x: 0, y: 0.002, z: HINGE.z + 2 * PW * Math.cos(STAND), opacity: 0 });
  stage.add(propLine);

  // Pins: a hollow one at the start, and the accent one that travels the route, each pushed into
  // the paper with a faint seat where it enters.
  const pin = (head: THREE.Material) => {
    const group = new THREE.Group();
    group.add(turned(cylinder(0.011, 0.11, ink.paper, 0, 0, 0.05, 8)));
    group.add(turned(cylinder(0.045, 0.04, head, 0, 0, 0.1, 16)));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), head);
    cap.position.z = 0.16;
    group.add(cap);
    const seat = contactShadow(0.2, 0.2, { x: 0.025, y: -0.025, z: T / 2 + 0.002, opacity: 0.55 });
    seat.rotation.x = 0;
    group.add(seat);
    group.userData.seat = seat;
    map.add(group);
    return group;
  };
  const start = pin(ink.paper);
  const traveller = pin(ink.accent);
  const place = (object: THREE.Object3D, u: number, lift: number, fade = 1) => {
    // A pin is pushed in and pulled out, never faded: it grows from its seat and shrinks back.
    object.visible = fade > 0.02;
    object.scale.setScalar(Math.max(0.001, fade));
    const p = flat.getPointAt(clamp(u));
    const panel = panelOf(p.x);
    const fold = folds[panel];
    fold.updateMatrix();
    object.position.copy(toLocal(p, panel).setZ(lift).applyMatrix4(fold.matrix));
    object.quaternion.copy(fold.quaternion);
    // The seat stays on the paper while the pin hovers, fainter until it is pushed home.
    const seat = object.userData.seat as THREE.Mesh;
    seat.position.z = (T / 2 + 0.002 - lift) / Math.max(0.001, fade);
    (seat.material as THREE.Material).opacity = 0.55 * clamp(1 - lift / 0.12) * fade;
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
  // One take, looped: the map unfolds into a tent, the route draws across it and the pin is pushed
  // home; then the pins are pulled, the ink retracts and the map folds shut for the next take.
  const LOOP = 10000;
  root.userData.loopDuration = LOOP;
  root.userData.restTime = 6000;
  root.userData.animate = (time: number) => {
    const t = wrap(time, LOOP);
    turntable(stage, -0.38, t, LOOP, 0.12);
    const lift = smootherstep(progress(t, 150, 1650)) * (1 - smootherstep(progress(t, 8400, 9800)));
    pose(lerp(0.04, STAND, lift));
    (propLine.material as THREE.Material).opacity = 0.5 * envelope(t, 1350, 1650, 8400, 8700);
    const draw = smootherstep(progress(t, 1700, 4650)) * (1 - smootherstep(progress(t, 7700, 8400)));
    for (const { mesh, from, to } of pieces) {
      const share = clamp((draw - from) / (to - from));
      const count = mesh.geometry.index!.count;
      mesh.geometry.setDrawRange(0, Math.floor((share * count) / 6) * 6);
      mesh.visible = share > 0;
    }
    const fade = envelope(t, 1650, 1900, 7300, 7700);
    const pulled = 0.25 * smootherstep(progress(t, 7200, 7700));
    place(start, 0, lerp(0.09, 0, smootherstep(progress(t, 1650, 1950))) + pulled, fade);
    const push = smootherstep(progress(t, 4650, 5100));
    place(traveller, draw, lerp(0.09, 0, push) + pulled, fade);
    root.userData.phase = t < 1650 ? "unfold-map" : t < 4650 ? "draw-route" : t < 7200 ? "arrive" : "fold-map";
    root.userData.pose = t / LOOP;
  };
  // A higher three-quarter, so the flat panel reads as a map and the standing one as a tent. The
  // sheet changes footprint through the take, so it is grounded by its own crease ellipses, not one
  // under the whole subject.
  return finish(root, { pitch: 24, fov: 30, fill: 0.8 }, { contactShadow: false });
}
