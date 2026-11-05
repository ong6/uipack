// Studio objects: product photography of one beautiful object on a seamless sweep, shot close and
// low, doing its job. State shows through physical cues (a key mid-press, an LED, a page mid-turn,
// a bead sliding on its rod), never readable screen text. One lens, one height, one light for all.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { contactShadow, lookMaterial, themed, shade, type ObjectLook } from "./look";
import type { ObjectEdition } from "./variants";
import type { ObjectPalette } from "./scenes";
import { marketBar, MARKET_BAR_MS, MARKET_LOOP_MS } from "./market";
import { clamp, lerp, progress, smootherstep } from "../math";

const DURATION = 5400;
/** Every Studio subject stands on the same tabletop. */
const FLOOR = -1;

/**
 * Studio's look: a large soft key from the top left with a real (soft) shadow on the sweep, a cool
 * fill from the right, a rim from behind, and a room environment for reflections. The same 36° lens
 * 18° above the tabletop for every subject. Dark mode is a lower-key room with a stronger rim.
 */
export const studioLook: ObjectLook = {
  rig: {
    both: {
      toneMapping: "aces",
      exposure: 1,
      environment: { kind: "room", intensity: 0.55, rotation: 0.5 },
      reflections: 1,
      hemisphere: { sky: 0xfbf6ec, ground: 0x5d625d, intensity: 0.75 },
      key: { color: 0xfff3e0, intensity: 3, position: [-6, 6.5, 3], shadow: true, shadowMapSize: 1024, shadowRadius: 7 },
      fill: { color: 0xe6eeff, intensity: 0.45, position: [6, 2, 5] },
      rim: { color: 0xe0eaff, intensity: 1.6, position: [3, 4, -6] },
    },
    dark: {
      exposure: 1,
      environment: { intensity: 0.3 },
      reflections: 0.8,
      hemisphere: { sky: 0xa8bccb, ground: 0x0e1514, intensity: 0.32 },
      key: { intensity: 2.7 },
      fill: { intensity: 0.22 },
      rim: { color: 0xb6d2ff, intensity: 3.4 },
    },
  },
  camera: { projection: "perspective", fov: 36, pitch: 18 },
  framing: { fill: 0.66, maxWidth: 0.84, lift: 0.02 },
  contactShadow: { spread: 1.0, opacity: 0.3 },
};

/* ---------------------------------------------------------------- Materials and helpers */

/** The Studio palette: graphite, anodised aluminium, one store-green accent, an amber signal. */
const GRAPHITE = 0x2b2f2e,
  ALUMINIUM = 0xc9ccc6,
  AMBER = 0xe8a33d;

function studioMaterials(palette: ObjectPalette) {
  return {
    aluminium: themed(lookMaterial("brushedMetal", ALUMINIUM, { roughness: 0.32 }), {
      dark: { color: 0x8c918d, roughness: 0.5 },
    }),
    satin: themed(lookMaterial("brushedMetal", 0xb8bcb6, { roughness: 0.22, anisotropy: 0.3 }), {
      dark: { color: 0x7f8480, roughness: 0.42 },
    }),
    steel: lookMaterial("metal", 0xd9dbd6, { roughness: 0.2 }),
    graphite: themed(lookMaterial("ceramic", GRAPHITE, { roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 }), {
      dark: { color: 0x232726 },
    }),
    keycap: lookMaterial("plastic", 0x2f3433, { roughness: 0.62 }),
    rubber: lookMaterial("rubber", 0x1d2121),
    accent: lookMaterial("ceramic", palette.accent, { roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
    glass: lookMaterial("ceramic", 0x07090a, { roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 }),
    paper: themed(lookMaterial("paper", palette.paper, { grain: 3 }), { dark: { color: shade(palette.paper, -0.26) } }),
  };
}

/** Printed paper (its colour comes from the map); a little dimmer at night so it does not outshine the scene. */
const printed = (options: Parameters<typeof lookMaterial>[2]) =>
  themed(lookMaterial("paper", 0xffffff, options), { dark: { color: 0xbcbcb8 } });

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

/** Every subject mesh casts and receives the key's shadow, except glowing parts. */
function finish(root: THREE.Group, look: ObjectLook = studioLook) {
  root.traverse((item) => {
    const mesh = item as THREE.Mesh;
    if (!mesh.isMesh || item.userData.frameIgnore) return;
    const glowing = item.userData.glow === true;
    mesh.castShadow = !glowing && item.userData.cast !== false;
    // Thin rods and posts at grazing angles to the key show shadow acne; they only cast.
    mesh.receiveShadow = !glowing && item.userData.receive !== false;
  });
  root.add(shadowFloor());
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

/* ---------------------------------------------------------------- AI: agent laptop */

export function ai(palette: ObjectPalette, edition: ObjectEdition = 0) {
  const root = new THREE.Group();
  const laptop = new THREE.Group();
  laptop.rotation.y = 0.5;
  laptop.position.set(0.05, 0, 0.1);
  root.add(laptop);
  const mat = studioMaterials(palette);
  const W = 3,
    D = 2.05,
    T = 0.12;
  const deckY = FLOOR + T;
  laptop.add(box(W, T, D, mat.aluminium, 0, FLOOR + T / 2, 0, 0.055));
  // Keyboard well, keys, space bar and trackpad.
  laptop.add(box(2.72, 0.01, 1.12, mat.graphite, 0, deckY + 0.001, -0.3, 0.02));
  const keyGeometry = new RoundedBoxGeometry(0.168, 0.05, 0.158, 2, 0.022);
  const keys: THREE.Matrix4[] = [];
  const keyRest: [number, number][] = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 13; col++) {
      if (row === 4 && col >= 4 && col <= 8) continue;
      const x = -1.2 + col * 0.2 + (row % 2) * 0.03,
        z = -0.75 + row * 0.2;
      keyRest.push([x, z]);
      keys.push(at(x, deckY + 0.02, z));
    }
  const keyboard = instanced(keyGeometry, mat.keycap, keys);
  laptop.add(keyboard);
  laptop.add(box(0.95, 0.05, 0.158, mat.keycap, 0.03, deckY + 0.02, 0.05, 0.022));
  laptop.add(box(1.05, 0.006, 0.62, mat.satin, 0, deckY + 0.002, 0.6, 0.04));
  // Status light on the deck, beside the keyboard: amber while working, green when done.
  const statusMaterial = glow(AMBER, 0);
  const status = box(0.09, 0.02, 0.03, statusMaterial, 1.28, deckY + 0.004, -0.83, 0.01);
  status.userData.glow = true;
  laptop.add(status);
  // Hinge and lid.
  const hinge = cylinder(0.055, 2.3, mat.satin, 0, deckY + 0.02, -D / 2 + 0.06, 24);
  hinge.rotation.z = Math.PI / 2;
  laptop.add(hinge);
  const lid = new THREE.Group();
  lid.position.set(0, deckY + 0.02, -D / 2 + 0.06);
  laptop.add(lid);
  const LH = 1.98;
  lid.add(box(W, LH, 0.065, mat.aluminium, 0, LH / 2, -0.04, 0.05));
  lid.add(box(W - 0.06, LH - 0.06, 0.012, mat.glass, 0, LH / 2, -0.002, 0.04));
  // The display: an out-of-focus glow of windows, never legible text.
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 512;
  screenCanvas.height = 320;
  const ctx = screenCanvas.getContext("2d")!;
  const tint = [palette.accent, 0x2f5a7a, 0x8a5a3c][edition];
  const g = ctx.createLinearGradient?.(0, 0, 512, 320);
  if (g) {
    g.addColorStop(0, css(shade(tint, -0.35)));
    g.addColorStop(1, css(0x0b1214));
    ctx.fillStyle = g;
  } else ctx.fillStyle = css(0x0b1214);
  ctx.fillRect(0, 0, 512, 320);
  if ("filter" in ctx) ctx.filter = "blur(7px)";
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = css(shade(tint, 0.35));
  ctx.fillRect(36, 40, 250, 230);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = css(0xdfe8e4);
  for (let row = 0; row < 7; row++) ctx.fillRect(60, 64 + row * 26, 120 + ((row * 53) % 90), 9);
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = css(shade(tint, 0.6));
  ctx.fillRect(310, 40, 168, 110);
  ctx.globalAlpha = 1;
  if ("filter" in ctx) ctx.filter = "none";
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  const screenMaterial = lookMaterial("plastic", 0x050607, {
    roughness: 0.34,
    emissive: 0xffffff,
    emissiveMap: screenTexture,
    emissiveIntensity: 0,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.74, 1.7), screenMaterial);
  screen.position.set(0, LH / 2 + 0.03, 0.006);
  screen.userData.glow = true;
  lid.add(screen);
  // A progress bar of light along the bottom of the display.
  const barMaterial = glow(shade(palette.accent, 0.45), 0);
  barMaterial.toneMapped = false;
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.05), barMaterial);
  bar.position.set(0, 0.32, 0.009);
  bar.userData.glow = true;
  lid.add(bar);
  // Screen light spills onto the keys.
  const spill = new THREE.PointLight(shade(tint, 0.55), 0, 3.2, 2);
  spill.position.set(0, 0.2, 0.55);
  lid.add(spill);
  const pressed = [27, 31, 14, 40, 22, 35, 18];
  const scratch = new THREE.Matrix4();
  root.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION);
    const open = smootherstep(progress(t, 0, 1350));
    const settle = progress(t, 1350, 2100);
    lid.rotation.x = lerp(1.5, -0.27, open) + 0.035 * Math.sin(settle * Math.PI * 3) * (1 - settle);
    const wake = smootherstep(progress(t, 600, 1600));
    const done = smootherstep(progress(t, 4200, 4700));
    screenMaterial.emissiveIntensity = 0.75 * wake + 0.12 * done;
    spill.intensity = 1.6 * wake + 0.4 * done;
    // Keys press in a typing rhythm, one at a time.
    keyRest.forEach(([x, z], i) => {
      let depth = 0;
      pressed.forEach((key, n) => {
        if (key !== i) return;
        const s = progress(t, 1550 + n * 260, 1550 + n * 260 + 170);
        depth = Math.max(depth, Math.sin(s * Math.PI));
      });
      keyboard.setMatrixAt(i, scratch.makeTranslation(x, deckY + 0.02 - 0.022 * depth, z));
    });
    keyboard.instanceMatrix.needsUpdate = true;
    const work = smootherstep(progress(t, 2700, 4200));
    bar.scale.x = Math.max(0.001, work);
    bar.position.x = -0.95 * (1 - work);
    barMaterial.emissiveIntensity = 1.4 * Math.min(1, wake * 4) * (work > 0 ? 1 : 0) + 0.8 * done;
    const working = t > 1500 && t < 4400 ? 0.55 + 0.45 * Math.sin(t / 140) : 0;
    statusMaterial.emissive.setHex(done > 0.5 ? palette.accent : AMBER);
    statusMaterial.color.setHex(done > 0.5 ? palette.accent : AMBER);
    statusMaterial.emissiveIntensity = done > 0.5 ? 2.2 * done : 1.8 * working;
    phase(
      root,
      t,
      t < 700 ? "prompt" : t < 2100 ? "prompt-to-tools" : t < 2850 ? "tools" : t < 4250 ? "tools-to-check" : "check",
      progress(t, 700, 4250),
    );
  };
  return finish(root);
}

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

export async function tennis(palette: ObjectPalette, edition: ObjectEdition = 0, modelUrl: string) {
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

export function trading(palette: ObjectPalette, edition: ObjectEdition = 0) {
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

export function server(palette: ObjectPalette) {
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
    const bezel = i === 1 ? mat.accent : mat.aluminium;
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
        const guard: THREE.BufferGeometry[] = [0.235, 0.16, 0.085].map((r) => new THREE.TorusGeometry(r, 0.008, 6, 40));
        for (const angle of [0, Math.PI / 2]) {
          const spoke = new THREE.CylinderGeometry(0.007, 0.007, 0.47, 6);
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
          ledMatrices.push(at(x + 0.08, y + 0.08, front + 0.026));
          ledColours.push((n + r) % 3 === 0 ? AMBER : palette.accent);
          ledUnit.push(i);
        }
      unit.add(instanced(new RoundedBoxGeometry(0.15, 0.12, 0.03, 1, 0.01), portMaterial, ports));
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
          new THREE.Vector3(from[0], from[1], front + 0.05),
          new THREE.Vector3(from[0], from[1] - 0.12, front + 0.22),
          new THREE.Vector3((from[0] + to[0]) / 2, -0.4, front + 0.34),
          new THREE.Vector3(to[0], to[1] - 0.12, front + 0.22),
          new THREE.Vector3(to[0], to[1], front + 0.05),
        ]);
        unit.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.032, 10, false), material));
        for (const end of [from, to]) unit.add(box(0.13, 0.11, 0.09, material, end[0], end[1], front + 0.07, 0.025));
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

/* ---------------------------------------------------------------- Travel: a Z-folded atlas */

export function travel(palette: ObjectPalette, edition: ObjectEdition = 0) {
  const root = new THREE.Group();
  const map = new THREE.Group();
  map.rotation.y = -0.05;
  map.position.set(0, FLOOR + 1.225, 0.1);
  root.add(map);
  const mat = studioMaterials(palette);
  const PW = 1.23,
    PH = 2.45,
    OPEN = 0.78;
  // An original topographic print: contours, a lake and river, woods, roads and a fold grid.
  const atlas = document.createElement("canvas");
  atlas.width = 1536;
  atlas.height = 1024;
  const ctx = atlas.getContext("2d")!;
  const looks = [
    { land: 0xeae7d0, contour: 0xa9b894, water: 0x93bcc4, wood: 0xbfd0a6, road: 0xfbf7ea },
    { land: 0xede7d4, contour: 0xb3b79f, water: 0x88b8cf, wood: 0xc4d3b8, road: 0xfdf9ee },
    { land: 0xeedfc8, contour: 0xc4a985, water: 0xa6c3bf, wood: 0xd5c49c, road: 0xfbf3e3 },
  ];
  const look = looks[edition];
  ctx.fillStyle = css(look.land);
  ctx.fillRect(0, 0, 1536, 1024);
  ctx.fillStyle = css(look.wood);
  ctx.globalAlpha = 0.6;
  for (let n = 0; n < 60; n++) {
    ctx.beginPath();
    ctx.ellipse?.(60 + ((n * 389) % 1420), 60 + ((n * 251) % 900), 26 + (n % 4) * 12, 18 + (n % 3) * 9, n, 0, Math.PI * 2);
    ctx.fill?.();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 3;
  ctx.strokeStyle = css(look.contour);
  for (let n = 0; n < 22; n++) {
    ctx.beginPath();
    for (let x = 0; x <= 1536; x += 12) {
      const yy = n * 56 - 120 + 80 * Math.sin(x / 300 + edition * 0.8) + 30 * Math.sin(x / 120 + n * 0.35);
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = css(look.water);
  ctx.lineWidth = 42;
  ctx.beginPath();
  for (let yy = 0; yy <= 1024; yy += 12) {
    const x = 1120 + 100 * Math.sin(yy / 170 + edition) + yy * 0.1;
    if (yy === 0) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
  }
  ctx.stroke();
  ctx.fillStyle = css(look.water);
  ctx.beginPath();
  ctx.ellipse?.(330, 760, 150, 85, -0.3, 0, Math.PI * 2);
  ctx.fill?.();
  ctx.strokeStyle = css(look.road);
  ctx.lineWidth = 14;
  for (let road = 0; road < 3; road++) {
    ctx.beginPath();
    for (let x = 0; x <= 1536; x += 12) {
      const yy = 230 + road * 290 + 50 * Math.sin(x / 250 + road);
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  // Wear along the folds: a faint shade either side of each crease, and the horizontal half-fold.
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = css(0x5a5444);
  for (const x of [512, 1024]) ctx.fillRect(x - 6, 0, 12, 1024);
  ctx.fillRect(0, 506, 1536, 12);
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(atlas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  /** Route in flat map coordinates (x across all three panels, y up). */
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
  const flat = new THREE.CatmullRomCurve3(routes.map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const flatPoints = flat.getSpacedPoints(240);
  const panelOf = (x: number) => (x < -PW / 2 ? 0 : x > PW / 2 ? 2 : 1);
  const toLocal = (p: THREE.Vector3, panel: number) => new THREE.Vector3(p.x - (panel - 1) * (PW / 2), p.y, 0.013);

  const routeMaterial = lookMaterial("plastic", palette.accent, { roughness: 0.5 });
  const folds: THREE.Group[] = [];
  const pieces: { mesh: THREE.Mesh; from: number; to: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const fold = new THREE.Group();
    fold.position.x = i === 0 ? -PW / 2 : i === 2 ? PW / 2 : 0;
    const center = i === 0 ? -PW / 2 : i === 2 ? PW / 2 : 0;
    const sheet = new THREE.BoxGeometry(PW, PH, 0.01, 1, 1, 1);
    const uv = sheet.attributes.uv;
    for (let n = 16; n < 20; n++) uv.setX(n, (uv.getX(n) + i) / 3);
    const print = printed({ map: texture, roughness: 0.9 });
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
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(local), local.length * 2, 0.02, 6, false),
        routeMaterial,
      );
      mesh.userData.cast = false;
      fold.add(mesh);
      pieces.push({ mesh, from: from / (flatPoints.length - 1), to: to / (flatPoints.length - 1) });
    }
    folds.push(fold);
    map.add(fold);
  }
  // Pins: a graphite one at the start, and the accent one that travels the route.
  const pin = (head: THREE.Material) => {
    const group = new THREE.Group();
    group.add(turned(cylinder(0.009, 0.24, mat.steel, 0, 0, 0.12, 8)));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), head);
    cap.position.z = 0.25;
    group.add(cap);
    const collar = cylinder(0.05, 0.05, head, 0, 0, 0.19, 20);
    collar.rotation.x = Math.PI / 2;
    group.add(collar);
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
  };
  root.userData.mapFolds = folds;
  root.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION);
    const left = smootherstep(progress(t, 150, 1350)),
      right = smootherstep(progress(t, 450, 1650));
    // Closed, the left panel lies over the front and the right one behind; open, a standing Z.
    folds[0].rotation.y = lerp(Math.PI - 0.07, OPEN, left);
    folds[2].rotation.y = lerp(Math.PI - 0.035, OPEN, right);
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
    phase(root, t, t < 1600 ? "unfold-map" : t < 4650 ? "draw-route" : "arrive", draw);
  };
  return finish(root);
}

/* ---------------------------------------------------------------- Reading: a hardcover on a stand */

export function reading(palette: ObjectPalette) {
  const root = new THREE.Group();
  const set = new THREE.Group();
  set.rotation.y = -0.32;
  root.add(set);
  const mat = studioMaterials(palette);
  const cloth = themed(
    lookMaterial("felt", palette.accent, {
      roughness: 0.9,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xdce6df),
      sheenRoughness: 0.6,
      grain: 3,
    }),
    {},
  );
  const width = 1.46,
    height = 2.12;
  // The book's own frame: x across, y up the page, z out of the page. It leans back on the stand.
  const book = new THREE.Group();
  const lean = 0.52;
  book.rotation.x = -lean;
  set.add(book);
  // Place the book so its bottom edge sits on the stand's shelf.
  const shelfLocal = new THREE.Vector3(0, -height / 2 - 0.1, -0.02);
  book.updateMatrix();
  const shelfWorld = shelfLocal.clone().applyMatrix4(new THREE.Matrix4().makeRotationX(-lean));
  book.position.set(0, FLOOR + 0.11 - shelfWorld.y, 0.25 - shelfWorld.z);

  /** Grey bars standing in for type; a heading and a figure on the left-hand page. */
  const pageTexture = (heading: boolean, figure: boolean) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 384;
    const c = canvas.getContext("2d")!;
    c.fillStyle = css(palette.paper);
    c.fillRect(0, 0, 256, 384);
    c.fillStyle = css(0x8a8f86);
    let y = 40;
    if (heading) {
      c.fillStyle = css(0x5d625a);
      c.fillRect(34, y, 120, 9);
      y += 30;
      c.fillStyle = css(0x8a8f86);
    }
    if (figure) {
      c.fillStyle = css(shade(palette.accent, 0.55));
      c.fillRect(34, y, 188, 92);
      y += 112;
      c.fillStyle = css(0x8a8f86);
    }
    for (let row = 0; y < 350; row++, y += 15) {
      if (row % 7 === 6) continue;
      c.fillRect(row % 7 === 0 ? 46 : 34, y, row % 7 === 5 ? 110 : 188, 4);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };
  const halves = [-1, 1].map((side) => {
    const half = new THREE.Group();
    half.position.x = side * 0.045;
    half.rotation.y = side * 0.12;
    // Cover board, cloth over it, and the page block's edge.
    half.add(box(width + 0.1, height + 0.14, 0.06, cloth, (side * (width + 0.02)) / 2, 0, -0.13, 0.025));
    half.add(box(width - 0.02, height - 0.02, 0.1, mat.paper, (side * width) / 2, 0, -0.06, 0.01));
    // The top leaf bulges near the spine, as open pages do.
    const sheet = new THREE.PlaneGeometry(width, height, 24, 1);
    const vertices = sheet.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const u = vertices.getX(i) + width / 2;
      vertices.setXYZ(i, side * u, vertices.getY(i), 0.06 + 0.035 * Math.sin((u / width) * Math.PI) - 0.05 * u);
    }
    if (side < 0) {
      const uv = sheet.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
    }
    sheet.computeVertexNormals();
    half.add(new THREE.Mesh(sheet, printed({ map: pageTexture(side > 0, side < 0), roughness: 0.92, side: THREE.DoubleSide })));
    book.add(half);
    return half;
  });
  const spine = cylinder(0.075, height + 0.14, cloth, 0, 0, -0.1, 20);
  book.add(spine);
  for (const end of [-1, 1]) {
    const band = cylinder(
      0.05,
      0.03,
      lookMaterial("plastic", AMBER, { roughness: 0.6 }),
      0,
      end * (height / 2 + 0.005),
      -0.04,
      12,
    );
    book.add(band);
  }
  // The turning leaf, printed on both faces; the back print must not mirror as it turns.
  const front = pageTexture(false, false);
  const geometry = new THREE.PlaneGeometry(width, height, 40, 8);
  geometry.translate(width / 2, 0, 0);
  const page = new THREE.Mesh(geometry, printed({ map: front, side: THREE.FrontSide, roughness: 0.92 }));
  const reverseTexture = front.clone();
  reverseTexture.repeat.x = -1;
  reverseTexture.offset.x = 1;
  reverseTexture.needsUpdate = true;
  const reverse = new THREE.Mesh(geometry, printed({ map: reverseTexture, side: THREE.BackSide, roughness: 0.92 }));
  book.add(page, reverse);
  root.userData.pageGeometry = geometry;
  const positions = geometry.attributes.position,
    original = Float32Array.from(positions.array);
  // A satin ribbon from the spine, draped over the shelf.
  const ribbon = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.02, -height / 2 + 0.2, 0.07),
        new THREE.Vector3(0.12, -height / 2 - 0.02, 0.1),
        new THREE.Vector3(0.24, -height / 2 - 0.1, 0.22),
        new THREE.Vector3(0.3, -height / 2 - 0.22, 0.24),
        new THREE.Vector3(0.36, -height / 2 - 0.5, 0.22),
      ]),
      24,
      0.024,
      6,
      false,
    ),
    lookMaterial("ceramic", 0xb65748, { roughness: 0.35, clearcoat: 0.6 }),
  );
  ribbon.scale.z = 0.35;
  book.add(ribbon);
  // The stand: a back plate, a shelf with a lip under the book, a kickstand and a base on the table.
  book.add(box(2.5, 1.7, 0.04, mat.aluminium, 0, -0.15, -0.2, 0.03));
  book.add(box(3.25, 0.04, 0.42, mat.aluminium, 0, -height / 2 - 0.12, -0.04, 0.015));
  book.add(box(3.25, 0.16, 0.035, mat.aluminium, 0, -height / 2 - 0.06, 0.17, 0.015));
  book.updateMatrix();
  const brace = new THREE.Vector3(0, 0.45, -0.22).applyMatrix4(book.matrix);
  const foot = new THREE.Vector3(0, FLOOR + 0.03, brace.z - 0.75);
  for (const x of [-0.9, 0.9]) {
    const strut = box(
      0.06,
      brace.distanceTo(foot),
      0.04,
      mat.aluminium,
      x,
      (brace.y + foot.y) / 2,
      (brace.z + foot.z) / 2,
      0.015,
    );
    strut.rotation.x = Math.atan2(brace.z - foot.z, brace.y - foot.y);
    set.add(strut);
  }
  set.add(box(2.4, 0.035, Math.abs(foot.z - 0.3) + 0.2, mat.aluminium, 0, FLOOR + 0.0175, (foot.z + 0.3) / 2, 0.012));
  root.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION),
      q = smootherstep(progress(t, 750, 4050)),
      theta = Math.PI * q;
    for (let i = 0; i < positions.count; i++) {
      const u = original[i * 3],
        v = original[i * 3 + 1];
      // Integrate tangent angles of a curling strip, retaining its paper length.
      const curl = 0.62 * Math.sin(theta),
        segments = 12;
      let x = 0,
        z = 0;
      for (let n = 0; n < segments; n++) {
        const along = (u * (n + 0.5)) / segments;
        const angle = theta + curl * Math.sin((along / width) * Math.PI) - 0.18 * Math.cos(theta);
        x += (Math.cos(angle) * u) / segments;
        z += (Math.sin(angle) * u) / segments;
      }
      positions.setXYZ(i, x + 0.045 * Math.cos(theta), v + (0.025 * Math.sin(theta) * u) / width, 0.11 + z);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    halves[0].rotation.y = -0.12;
    halves[1].rotation.y = 0.12;
    phase(root, t, t < 750 ? "open-book" : t < 1500 ? "lift-page" : t < 4050 ? "turn-page" : "settle-page", q);
  };
  return finish(root);
}
