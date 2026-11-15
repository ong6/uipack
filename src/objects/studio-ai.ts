// Studio subject "Coding & AI", drawn for Ink line art: an open laptop running an agent session.
// The screen is a terminal made of geometry, never text: a window header, the request on a prompt
// line, the agent's reply as strokes, one tool-call block, the result, and an input box with a
// blinking cursor. The one cobalt part is a rail beside whatever the agent is doing right now; it
// steps down the session as lines stream in, then the screen clears and the take starts again.
//
// Role contract (shared with the Ink renderer): every mesh carries `userData.inkRole`, one of
// "paper" (page-toned faces), "shade" (a slightly darker face), "dark" (an ink-filled part) or
// "accent" (the one cobalt part). The renderer takes the tone from that tag; the materials here are
// plain placeholders. Text strokes, key tops and panels are flat, camera-facing quads lifted a few
// thousandths off the face below (never coplanar), so they draw as ink fills and outlines with no
// silhouette of their own. Static parts are merged per role; parts that move are separate meshes.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ObjectLook } from "./look";
import type { InkRole } from "./ink";

/** Every Studio subject stands on the same tabletop. */
const FLOOR = -1;
/** The take, in ms. */
const LOOP = 8000;

/* ---------------------------------------------------------------- Small helpers (kept local) */

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const progress = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const wrap = (time: number, loop: number) => ((time % loop) + loop) % loop;

/** One plain material per ink role; the renderer swaps them for its own and reads the tag. */
function roleMaterials(): Record<InkRole, THREE.MeshBasicMaterial> {
  const make = (role: InkRole) => {
    const material = new THREE.MeshBasicMaterial();
    material.userData.inkRole = role;
    return material;
  };
  return { paper: make("paper"), shade: make("shade"), dark: make("dark"), accent: make("accent") };
}

/** Position and normal only, non-indexed, transformed: the common shape for merging. */
function baked(geometry: THREE.BufferGeometry, matrix?: THREE.Matrix4) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", source.getAttribute("position").clone());
  if (!source.getAttribute("normal")) source.computeVertexNormals();
  out.setAttribute("normal", source.getAttribute("normal").clone());
  if (matrix) out.applyMatrix4(matrix);
  if (source !== geometry) source.dispose();
  geometry.dispose();
  return out;
}

/** Collects static geometry per role and emits one merged mesh per role. */
class RoleBatch {
  private parts = new Map<InkRole, THREE.BufferGeometry[]>();
  add(role: InkRole, geometry: THREE.BufferGeometry, matrix?: THREE.Matrix4) {
    if (!this.parts.has(role)) this.parts.set(role, []);
    this.parts.get(role)!.push(baked(geometry, matrix));
  }
  meshes(materials: Record<InkRole, THREE.Material>) {
    const out: THREE.Mesh[] = [];
    for (const [role, geometries] of this.parts) {
      const merged = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      out.push(part(merged, role, materials));
    }
    return out;
  }
}

function part(geometry: THREE.BufferGeometry, role: InkRole, materials: Record<InkRole, THREE.Material>) {
  const mesh = new THREE.Mesh(geometry, materials[role]);
  mesh.userData.inkRole = role;
  // An ink-filled stroke is its own line: a crease in the paper tone would hollow it out.
  if (role === "dark") mesh.userData.inkCreases = false;
  return mesh;
}

/** A rounded rectangle centred on the origin, in the xy plane. */
function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2,
    y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/**
 * A rounded slab `w` × `h` in the xy plane, `t` thick from z = -t to 0 (front face at z = 0): hard
 * edges round both faces (crease lines), rounded corners that turn without one.
 */
function slab(w: number, h: number, t: number, r: number) {
  return new THREE.ExtrudeGeometry(roundedRect(w, h, r), { depth: t, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -t);
}

/** A flat rectangle `w` × `h` facing +z; `anchor` "left" puts its left edge on x = 0, "top" its top edge on y = 0. */
function flat(w: number, h: number, anchor: "centre" | "left" | "top" = "centre") {
  const g = new THREE.PlaneGeometry(w, h);
  if (anchor === "left") g.translate(w / 2, 0, 0);
  if (anchor === "top") g.translate(0, -h / 2, 0);
  return g;
}

const at = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(1, 1, 1),
  );

/* ---------------------------------------------------------------- The laptop */

/**
 * An open laptop running an agent session, for Ink line art. Returns a Studio subject: a group
 * with `userData.animate(time)`, `loopDuration`, `restTime`, `pose`, `phase`, `style` and `look`.
 */
export function ai() {
  const materials = roleMaterials();
  const root = new THREE.Group();
  const laptop = new THREE.Group();
  const BASE_YAW = 0.42;
  laptop.rotation.y = BASE_YAW;
  laptop.position.set(0, 0, 0.05);
  root.add(laptop);
  const batch = new RoleBatch();

  // Base: a rounded slab lying on the table, keys as flat tops on the deck, a trackpad, a hinge.
  const W = 3,
    D = 2.05,
    T = 0.09;
  const deckY = FLOOR + T;
  batch.add("paper", slab(W, D, T, 0.11), at(0, FLOOR, 0, Math.PI / 2));
  const KEY = 0.17,
    PITCH = 0.2;
  for (let row = 0; row < 5; row++) {
    const z = -0.8 + row * PITCH;
    const depth = row === 0 ? 0.1 : 0.165;
    if (row < 4) {
      for (let col = 0; col < 13; col++)
        batch.add("shade", flat(KEY, depth), at(-1.2 + col * PITCH, deckY + 0.004, z + (row === 0 ? 0.03 : 0), -Math.PI / 2));
    } else {
      for (const col of [0, 1, 2, 9, 10, 11, 12])
        batch.add("shade", flat(KEY, depth), at(-1.2 + col * PITCH, deckY + 0.004, z, -Math.PI / 2));
      // The space bar spans columns 3 to 8.
      batch.add("shade", flat(5 * PITCH + KEY, depth), at(-0.1, deckY + 0.004, z, -Math.PI / 2));
    }
  }
  batch.add("paper", new THREE.ShapeGeometry(roundedRect(1.1, 0.6, 0.05), 4), at(0, deckY + 0.004, 0.6, -Math.PI / 2));
  const hingeZ = -D / 2 + 0.08,
    hingeY = deckY + 0.05;
  batch.add("shade", new THREE.CylinderGeometry(0.045, 0.045, 2.3, 16), at(0, hingeY, hingeZ, 0, 0, Math.PI / 2));

  // Lid: leans back from the hinge. Its parts are baked into the laptop's frame; the moving
  // terminal parts ride in `screen`, which carries the same transform.
  const LID_LEAN = -0.3,
    LH = 1.95,
    LT = 0.055;
  const lid = at(0, hingeY, hingeZ + LT / 2, LID_LEAN);
  const onLid = (x: number, y: number, z: number) => lid.clone().multiply(at(x, y, z));
  batch.add("paper", slab(W, LH, LT, 0.11), onLid(0, 0.05 + LH / 2, 0));
  // Screen: an inset face with a thicker chin. y in [0.2, 1.9] in the lid's frame.
  const SX = 2.72,
    SY0 = 0.2,
    SY1 = 1.9;
  batch.add("shade", new THREE.ShapeGeometry(roundedRect(SX, SY1 - SY0, 0.035), 3), onLid(0, (SY0 + SY1) / 2, 0.004));
  const screen = new THREE.Group();
  lid.decompose(screen.position, screen.quaternion, screen.scale);
  laptop.add(screen);

  // The terminal, in the lid's frame (x right, y up, z out of the screen). Layers: screen face at
  // z 0.004, panels at 0.007, strokes on panels at 0.010, strokes on the screen at 0.008.
  const S = 0.027; // stroke thickness
  const X0 = -1.16; // text column
  // Window header: a lighter strip across the top with a short title stroke.
  batch.add("paper", flat(SX - 0.02, 0.13, "top"), onLid(0, SY1 - 0.01, 0.007));
  batch.add("dark", flat(0.42, S * 0.75, "left"), onLid(-0.21, SY1 - 0.075, 0.01));
  // The request, already on the prompt line: a chevron and two strokes. Static.
  // A ">" glyph: two short strokes running back from its tip.
  const chevron = (x: number, y: number, z: number, size = 0.075) => {
    const tip = x + size * Math.cos(0.62);
    for (const side of [1, -1])
      batch.add("dark", flat(size, S * 0.8, "left"), onLid(tip, y, z).multiply(at(0, 0, 0, 0, 0, Math.PI + side * 0.62)));
  };
  const ROW = 0.15;
  const yPrompt = 1.64;
  chevron(X0, yPrompt, 0.008);
  batch.add("dark", flat(1.12, S, "left"), onLid(X0 + 0.13, yPrompt, 0.008));
  batch.add("dark", flat(0.5, S, "left"), onLid(X0 + 1.33, yPrompt, 0.008));

  // Streaming lines: each a left-anchored stroke that wipes in (scale.x) and out.
  interface Line {
    mesh: THREE.Mesh;
    in: number;
    out: number;
  }
  const lines: Line[] = [];
  const stroke = (x: number, y: number, length: number, z: number, tIn: number, tOut: number) => {
    const mesh = part(flat(length, S, "left"), "dark", materials);
    mesh.position.set(x, y, z);
    screen.add(mesh);
    lines.push({ mesh, in: tIn, out: tOut });
    return mesh;
  };
  // The reply: two lines.
  const yReply = yPrompt - 0.18;
  stroke(X0, yReply, 1.95, 0.008, 700, 7650);
  stroke(X0, yReply - ROW, 1.25, 0.008, 1000, 7600);
  // The tool-call block: a lighter panel that drops open, with a head stroke and two body lines.
  const blockTop = yReply - ROW - 0.12,
    blockH = 0.4;
  const block = part(flat(2.3, blockH, "top"), "paper", materials);
  block.position.set(X0 + 1.15 - 0.04, blockTop, 0.006);
  screen.add(block);
  stroke(X0 + 0.1, blockTop - 0.1, 0.34, 0.01, 1750, 7550);
  stroke(X0 + 0.54, blockTop - 0.1, 0.92, 0.01, 1950, 7550);
  stroke(X0 + 0.1, blockTop - 0.22, 1.62, 0.01, 2400, 7500);
  stroke(X0 + 0.1, blockTop - 0.32, 0.98, 0.01, 3000, 7500);
  // The result: two lines under the block.
  const yResult = blockTop - blockH - 0.12;
  stroke(X0, yResult, 1.8, 0.008, 4200, 7400);
  stroke(X0, yResult - ROW, 0.86, 0.008, 4500, 7350);
  // The input box at the bottom: an outlined panel with a chevron and the cursor.
  const boxY = SY0 + 0.13;
  batch.add("paper", flat(SX - 0.32, 0.16), onLid(0.02, boxY, 0.006));
  chevron(X0, boxY, 0.01, 0.06);
  const cursor = part(flat(0.06, 0.11, "left"), "dark", materials);
  cursor.position.set(X0 + 0.11, boxY, 0.01);
  screen.add(cursor);

  // The accent: a rail in the margin beside the step in progress.
  const rail = part(flat(0.065, 1), "accent", materials);
  rail.position.set(-1.265, yPrompt, 0.008);
  screen.add(rail);
  /** The rail's span (centre, height) per step. */
  const spans = {
    prompt: [yPrompt, 0.1],
    reply: [yReply - ROW / 2, ROW + 0.1],
    tool: [blockTop - blockH / 2, blockH],
    result: [yResult - ROW / 2, ROW + 0.1],
    waiting: [boxY, 0.16],
  } as const;
  /** Where the rail is, when: [time it starts moving there, step]. Moves take 260ms. */
  const railPlan: [number, keyof typeof spans][] = [
    [0, "prompt"],
    [600, "reply"],
    [1600, "tool"],
    [4000, "result"],
    [5100, "waiting"],
    [7350, "prompt"],
  ];
  const railAt = (t: number) => {
    let [y, h] = spans.prompt as readonly number[];
    for (let i = 1; i < railPlan.length; i++) {
      const [start, step] = railPlan[i];
      const k = smootherstep(progress(t, start, start + 260));
      if (k <= 0) break;
      const [ty, th] = spans[step];
      y = lerp(y, ty, k);
      h = lerp(h, th, k);
    }
    return [y, h];
  };

  for (const mesh of batch.meshes(materials)) laptop.add(mesh);

  root.userData.style = "ink";
  root.userData.loopDuration = LOOP;
  // At rest the tool call has run and the rail sits on it, the cursor lit.
  root.userData.restTime = 3500;
  root.userData.animate = (time: number) => {
    const t = wrap(time, LOOP);
    laptop.rotation.y = BASE_YAW + 0.07 * Math.sin((t / LOOP) * Math.PI * 2);
    for (const line of lines) {
      // Wipe in over 300ms; wipe out (right to left) over 220ms when the screen clears.
      const k = smootherstep(progress(t, line.in, line.in + 300)) * (1 - smootherstep(progress(t, line.out, line.out + 220)));
      // Hidden below 3% of its length, so a line never shows as a stray dot.
      line.mesh.visible = k > 0.03;
      line.mesh.scale.x = Math.max(0.03, k);
    }
    const open = smootherstep(progress(t, 1600, 1800)) * (1 - smootherstep(progress(t, 7500, 7700)));
    block.visible = open > 0.03;
    block.scale.y = Math.max(0.03, open);
    cursor.visible = t % 1000 < 600;
    const [y, h] = railAt(t);
    rail.position.y = y;
    rail.scale.y = h;
    root.userData.phase =
      t < 600 ? "prompt" : t < 1600 ? "reply" : t < 4000 ? "tool-call" : t < 5100 ? "result" : t < 7350 ? "waiting" : "clear";
    root.userData.pose = t / LOOP;
  };
  // Studio's lens, a little above the deck, so the keyboard reads as a surface and the screen faces the lens.
  const look: ObjectLook = {
    camera: { projection: "perspective", fov: 30, pitch: 16 },
    framing: { fill: 0.78, maxWidth: 0.9, lift: 0 },
    contactShadow: { spread: 1.0, opacity: 0.32 },
  };
  root.userData.look = look;
  return root;
}
