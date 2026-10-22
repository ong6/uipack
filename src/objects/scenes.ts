import { createContactDirection } from "./contact-directions";
import * as THREE from "three";
import { createArtDirection } from "./art-directions";
import type { ObjectVariant, ObjectEdition } from "./variants";
import { marketBar, MARKET_BAR_MS, MARKET_LOOP_MS } from "./market";
import { tennisModelUrl } from "../package-assets";
import { clamp, lerp, progress, smootherstep } from "../math";
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
function ai(palette: ObjectPalette) {
  const group = new THREE.Group();
  group.rotation.set(0.22, -0.18, 0);
  // A real laptop silhouette, with a hinge, keyboard and a deep terminal screen.
  const keyboard = slab(2.7, 1.2, 0.1, palette.muted, 0, -0.95, 0.55);
  keyboard.material.metalness = 0.32;
  keyboard.material.roughness = 0.42;
  keyboard.rotation.x = -Math.PI / 2;
  group.add(keyboard);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 10; col++) {
      const key = slab(0.18, 0.09, 0.018, palette.ink, -0.98 + col * 0.215, -0.88, 0.18 + row * 0.13, 0.015);
      key.rotation.x = -Math.PI / 2;
      group.add(key);
    }
  const trackpad = slab(0.65, 0.29, 0.01, palette.paper, 0, -0.885, 0.93, 0.025);
  group.add(slab(2.2, 0.055, 0.06, palette.ink, 0, -0.82, 0.035, 0.02));
  trackpad.rotation.x = -Math.PI / 2;
  group.add(trackpad);
  group.add(slab(2.72, 1.85, 0.13, palette.ink, 0, 0.04, -0.1));
  group.add(slab(2.5, 1.61, 0.022, 0x18232d, 0, 0.04, -0.015));
  for (let i = 0; i < 3; i++)
    group.add(mesh(new THREE.SphereGeometry(0.032, 12, 8), [0xed6a64, 0xe4b75d, 0x6fba88][i], -1.1 + i * 0.11, 0.71, 0.016));
  group.add(label("AGENT / LOCAL", 0xa5b9bd, 0.32, 0.71, 0.034, 0.11));
  const code: THREE.Mesh[] = [];
  for (let row = 0; row < 7; row++) {
    const length = [0.92, 1.65, 1.26, 0.72, 1.42, 1.08, 0.58][row];
    const strip = slab(length, 0.047, 0.01, [0x79b6ed, 0xa6d5af, 0xddd7bd][row % 3], 0, 0.47 - row * 0.16, 0.03, 0.01);
    strip.userData.length = length;
    strip.userData.left = -1.06 + (row % 3) * 0.12;
    code.push(strip);
    group.add(strip);
  }
  const cursor = slab(0.055, 0.12, 0.012, 0xc2eadb, 0, 0, 0.04, 0.01);
  group.add(cursor);
  const satellites = [-1, 1].map((side) => {
    const chip = new THREE.Group();
    chip.position.set(side * 1.65, 0.6, 0.2);
    chip.add(slab(0.72, 0.72, 0.12, palette.paper), slab(0.58, 0.05, 0.018, palette.accent, 0, -0.21, 0.08, 0.008));
    chip.add(label(side < 0 ? "</>" : "AI", palette.ink, 0, 0.05, 0.09, 0.2));
    group.add(chip);
    return chip;
  });
  const paths = [-1, 1].map(
    (side) =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 1.6, 0.27, 0.24),
        new THREE.Vector3(side * 1.65, -0.3, 0.3),
        new THREE.Vector3(side * 1.4, -0.5, 0.2),
        new THREE.Vector3(side * 1.06, -0.52, 0.1),
      ]),
  );
  // Tool results travel along invisible paths; avoid cable-like clutter around the laptop.
  const packets = paths.map(() => {
    const m = mesh(new THREE.SphereGeometry(0.075, 16, 12), palette.accent);
    group.add(m);
    return m;
  });
  const result = new THREE.Group();
  result.add(slab(1.45, 0.37, 0.05, 0x235b47), label("TASK COMPLETE", 0xe1f4e6, 0, 0, 0.06, 0.15));
  result.position.set(0, -0.49, 0.16);
  group.add(result);
  group.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION),
      typing = progress(t, 100, 2700) * 7;
    code.forEach((strip, i) => {
      const f = smootherstep(clamp(typing - i));
      strip.visible = f > 0;
      strip.scale.x = Math.max(0.001, f);
      strip.position.x = strip.userData.left + (strip.userData.length * f) / 2;
    });
    const row = Math.min(6, Math.floor(typing));
    cursor.position.set(
      code[row].position.x + (code[row].userData.length * code[row].scale.x) / 2 + 0.06,
      0.47 - row * 0.16,
      0.04,
    );
    cursor.visible = t < 2850;
    satellites.forEach((chip, i) => {
      const f = smootherstep(progress(t, 300 + i * 300, 1100 + i * 300));
      chip.position.y = lerp(0.95, 0.6, f);
      chip.rotation.z = (i ? 1 : -1) * 0.07 * (1 - f);
    });
    packets.forEach((packet, i) => {
      const q = progress(t, 1100 + i * 400, 3450 + i * 400);
      packet.position.copy(paths[i].getPoint(smootherstep(q)));
      packet.scale.setScalar(Math.max(0.001, Math.sin(q * Math.PI)));
    });
    const done = smootherstep(progress(t, 4000, 4700));
    result.scale.setScalar(Math.max(0.001, done));
    phase(
      group,
      t,
      t < 700 ? "prompt" : t < 2100 ? "prompt-to-tools" : t < 2850 ? "tools" : t < 4250 ? "tools-to-check" : "check",
      progress(t, 700, 4250),
    );
  };
  return group;
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
async function tennis(_c: ObjectPalette, variant: ObjectEdition = 0, modelUrl?: string) {
  // The packaged model is meshopt-compressed (EXT_meshopt_compression, docs/objects.md). Three's
  // decoder is plain ESM with its WebAssembly inline, so it needs no file hosting or bundler setup.
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("three/addons/libs/meshopt_decoder.module.js"),
  ]);
  const model = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl ?? tennisModelUrl());
  const group = new THREE.Group();
  group.rotation.set(0.64, -0.25, 0);
  group.position.y = 0.1;
  model.scene.scale.setScalar(0.69);
  model.scene.position.y = -0.65;
  group.add(model.scene);
  const colors = [
    {
      Court: 0x326658,
      "Court stripe": 0x386e5e,
      "Court surround": 0x284c43,
      Jersey: 0xeee9db,
      "Kit accent": 0x27534a,
      Shorts: 0x283e48,
    },
    {
      Court: 0xa65e43,
      "Court stripe": 0xad6549,
      "Court surround": 0x704434,
      Jersey: 0xe6ddcc,
      "Kit accent": 0x6e4538,
      Shorts: 0x574036,
    },
    {
      Court: 0x446b89,
      "Court stripe": 0x4b7291,
      "Court surround": 0x304958,
      Jersey: 0xd5e7e3,
      "Kit accent": 0x24564d,
      Shorts: 0x203d4a,
    },
  ][variant];
  model.scene.traverse((item) => {
    const m = item as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = !m.name.startsWith("Court");
    m.receiveShadow = true;
    for (const material of Array.isArray(m.material) ? m.material : [m.material]) {
      const color = colors[material.name as keyof typeof colors];
      if (color !== undefined) (material as THREE.MeshStandardMaterial).color.setHex(color);
    }
  });
  const mixer = new THREE.AnimationMixer(model.scene);
  model.animations.forEach((clip) => mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play());
  const ball = model.scene.getObjectByName("Tennis_ball");
  const racket = model.scene.getObjectByName("Racket");
  group.userData.source = "blender";
  group.userData.contactTime = 1900;
  group.userData.contactTimes = [1900, 4900];
  group.userData.rackets = [racket, model.scene.getObjectByName("Far_Racket")];
  group.userData.loopDuration = 6000;
  group.userData.restTime = 1900;
  group.userData.ball = ball;
  group.userData.racket = racket;
  group.userData.racketContact = new THREE.Vector3(0, 0.63, 0);
  group.userData.dispose = () => {
    mixer.stopAllAction();
    mixer.uncacheRoot(model.scene);
  };
  group.userData.animate = (time: number) => {
    const t = ((time % 6000) + 6000) % 6000;
    mixer.setTime(t / 1000);
    group.userData.phase = t < 1900 || t >= 4900 ? "near-return" : "far-return";
    group.userData.pose = t / 6000;
  };
  return group;
}
function trading(_palette: ObjectPalette, variant: ObjectEdition = 0) {
  const group = new THREE.Group();
  group.rotation.set(0.06, -0.19, 0);
  const casing = slab(4.08, 2.62, 0.16, 0x263038, 0, 0.26, 0, 0.055);
  casing.material.metalness = 0.45;
  casing.material.roughness = 0.4;
  group.add(casing, slab(0.32, 0.6, 0.18, 0x303d45, 0, -1.18, -0.04, 0.035));
  const foot = slab(1.38, 0.5, 0.095, 0x3c4951, 0, -1.51, 0.16, 0.065);
  foot.rotation.x = -Math.PI / 2;
  group.add(foot);
  group.add(label("MARKET STUDY", 0x899b9f, 0, -0.94, 0.1, 0.075));
  group.add(mesh(new THREE.SphereGeometry(0.019, 12, 8), 0x51bfa6, 1.8, -0.94, 0.105));
  const canvas = document.createElement("canvas");
  canvas.width = 1056;
  canvas.height = 620;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(3.82, 2.24),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  display.position.set(0, 0.34, 0.12);
  group.add(display);
  const green = "#32c99a",
    red = "#ee6972";
  const left = 38,
    right = 958,
    top = 108,
    bottom = 422,
    volumeBottom = 543;
  const step = (right - left) / 24;
  const priceY = (value: number) => bottom - ((value - 96.5) / 7) * (bottom - top);
  const stroke = (x1: number, y1: number, x2: number, y2: number, color: string, width = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  group.userData.loopDuration = MARKET_LOOP_MS;
  group.userData.restTime = 3600;
  group.userData.marketBar = (index: number) => marketBar(index, variant);
  group.userData.animate = (time: number) => {
    const t = ((time % MARKET_LOOP_MS) + MARKET_LOOP_MS) % MARKET_LOOP_MS;
    const offset = Math.max(0, time) / MARKET_BAR_MS,
      first = Math.floor(offset),
      fraction = offset - first;
    ctx.fillStyle = "#111a22";
    ctx.fillRect(0, 0, 1056, 620);
    ctx.textAlign = "left";
    ctx.font = "600 23px monospace";
    ctx.fillStyle = "#e5ebee";
    ctx.fillText("DEMO / USD", 30, 39);
    ctx.font = "15px monospace";
    ctx.fillStyle = "#91a4b0";
    ctx.fillText("1m  ·  OHLC + VOLUME", 30, 70);
    ctx.textAlign = "right";
    ctx.fillStyle = "#c2ced4";
    ctx.fillText("SIMULATED · REPEATING STUDY", 1026, 39);
    stroke(28, 87, 1028, 87, "#2a3944");
    ctx.font = "14px monospace";
    for (let value = 97; value <= 103; value++) {
      const y = priceY(value);
      stroke(left, y, right, y, "#25323c");
      ctx.textAlign = "left";
      ctx.fillStyle = "#91a4b0";
      ctx.fillText(value.toFixed(2), right + 12, y + 5);
    }
    stroke(left, 456, right, 456, "#2c3a44");
    ctx.textAlign = "left";
    ctx.fillStyle = "#91a4b0";
    ctx.fillText("VOL", left, 478);
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, right - left, volumeBottom - top);
    ctx.clip();
    for (let i = first - 1; i <= first + 25; i++) {
      const bar = marketBar(i, variant),
        x = left + (i - first - fraction + 0.5) * step;
      if (i % 6 === 0) stroke(x, top, x, volumeBottom, "#1e2b35");
      const color = bar.close >= bar.open ? green : red;
      stroke(x, priceY(bar.high), x, priceY(bar.low), color, 2);
      ctx.fillStyle = color;
      ctx.fillRect(x - 9, priceY(Math.max(bar.open, bar.close)), 18, Math.max(2, Math.abs(priceY(bar.open) - priceY(bar.close))));
      const h = Math.min(57, bar.volume / 12);
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x - 9, volumeBottom - h, 18, h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.textAlign = "left";
    ctx.fillStyle = "#91a4b0";
    // Time advances with the viewport even when the authored OHLC pattern repeats.
    for (let i = first; i <= first + 24; i++)
      if (i % 4 === 0) {
        const x = left + (i - first - fraction + 0.5) * step;
        if (x >= left && x <= right - 40) {
          const minute = (570 + i) % 1440;
          ctx.fillText(
            String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0"),
            x - 12,
            569,
          );
        }
      }
    ctx.fillStyle = "#6f8695";
    ctx.font = "13px monospace";
    ctx.fillText("Illustrative prices · fixed USD scale · no live feed", left, 603);
    texture.needsUpdate = true;
    group.userData.phase = "market-pan";
    group.userData.pose = t / MARKET_LOOP_MS;
    group.userData.scroll = offset;
  };
  return group;
}
function server(palette: ObjectPalette) {
  const group = new THREE.Group();
  group.rotation.set(0.24, -0.46, -0.035);
  // Folded metal rails, storage, vented compute and a patch panel.
  const alloy = 0x74858b,
    graphite = 0x273139;
  const metal = (w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0) => {
    const part = slab(w, h, d, color, x, y, z, 0.025);
    part.material.metalness = 0.48;
    part.material.roughness = 0.38;
    return part;
  };
  group.add(metal(3.08, 0.11, 1.55, graphite, 0, -1.3), metal(3.08, 0.08, 1.55, alloy, 0, 1.3));
  for (const x of [-1.43, 1.43])
    for (const z of [-0.66, 0.66]) {
      group.add(metal(0.09, 2.55, 0.09, alloy, x, 0, z));
      if (z > 0)
        for (let n = 0; n < 13; n++)
          group.add(mesh(new THREE.BoxGeometry(0.034, 0.047, 0.008), graphite, x, -1.1 + n * 0.18, z + 0.051));
    }
  const trays: THREE.Group[] = [],
    fans: THREE.Group[] = [],
    lamps: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const tray = new THREE.Group();
    tray.position.y = 0.82 - i * 0.82;
    tray.add(metal(2.7, 0.61, 1.18, graphite), metal(2.69, 0.58, 0.035, i === 1 ? palette.accent : alloy, 0, 0, 0.607));
    for (const x of [-1.2, 1.2]) {
      tray.add(metal(0.04, 0.35, 0.1, 0xc2ccca, x, 0, 0.7));
      for (const y of [-0.22, 0.22]) {
        const screw = mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.013, 10), 0xced2cb, x, y, 0.647);
        screw.rotation.x = Math.PI / 2;
        tray.add(screw);
      }
    }
    if (i === 0) {
      for (let n = 0; n < 6; n++) {
        const x = -0.88 + n * 0.3;
        tray.add(metal(0.25, 0.37, 0.05, graphite, x, 0, 0.665), metal(0.17, 0.024, 0.01, 0xa8b5b5, x, -0.1, 0.7));
        const lamp = mesh(new THREE.SphereGeometry(0.018, 8, 6), palette.accent, x + 0.06, 0.11, 0.704);
        lamps.push(lamp);
        tray.add(lamp);
      }
    } else if (i === 1) {
      for (const x of [-0.7, 0, 0.7]) {
        tray.add(mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 32), graphite, x, 0, 0.662));
        const fan = new THREE.Group();
        fan.position.set(x, 0, 0.674);
        for (let blade = 0; blade < 7; blade++) {
          const vane = slab(0.073, 0.135, 0.014, 0x26383f, 0, 0.105, 0, 0.026);
          const pivot = new THREE.Group();
          pivot.rotation.z = (blade * Math.PI * 2) / 7;
          pivot.add(vane);
          fan.add(pivot);
        }
        const hub = mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.022, 16), alloy);
        hub.rotation.x = Math.PI / 2;
        fan.add(hub);
        fans.push(fan);
        tray.add(fan);
        for (let n = -2; n <= 2; n++)
          tray.add(
            line(
              [
                [-0.17 + x, n * 0.064, 0.703],
                [0.17 + x, n * 0.064, 0.703],
              ],
              0xa8b8b6,
              0.65,
            ),
          );
      }
    } else {
      for (let n = 0; n < 8; n++) {
        const x = -0.91 + n * 0.26;
        tray.add(metal(0.18, 0.15, 0.025, graphite, x, 0.04, 0.654));
        for (let k = 0; k < 3; k++)
          tray.add(mesh(new THREE.BoxGeometry(0.016, 0.042, 0.008), 0xc3ac70, x - 0.045 + k * 0.045, 0.075, 0.676));
      }
      for (let n = 0; n < 2; n++) {
        const wire = tube(
          [
            new THREE.Vector3(-0.78 + n * 0.75, 0.02, 0.7),
            new THREE.Vector3(-0.78 + n * 0.75, -0.23, 0.95),
            new THREE.Vector3(-0.34 + n * 0.75, -0.23, 0.95),
            new THREE.Vector3(-0.39 + n * 0.75, 0.02, 0.7),
          ],
          0.024,
          n ? 0xbd9166 : palette.accent,
        );
        tray.add(wire);
      }
    }
    trays.push(tray);
    group.add(tray);
  }
  group.add(label("INFERENCE / STUDY", palette.ink, 0, -1.59, 0.3, 0.17));
  group.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION);
    trays.forEach((tray, i) => {
      const q = smootherstep(progress(t, 180 + i * 650, 1500 + i * 650));
      tray.position.z = lerp(1.0, 0, q);
      tray.position.x = lerp(i % 2 ? -0.3 : 0.3, 0, q);
    });
    const power = smootherstep(progress(t, 2800, 4200));
    fans.forEach((fan, i) => (fan.rotation.z = power * (Math.PI * 3 + i * 0.35)));
    lamps.forEach((lamp) => {
      const material = lamp.material as THREE.MeshStandardMaterial;
      material.emissive.setHex(palette.accent);
      material.emissiveIntensity = 0.7 * power;
    });
    phase(
      group,
      t,
      t < 1500 ? "place-chassis" : t < 2450 ? "place-compute" : t < 3550 ? "place-memory" : "bandwidth-check",
      progress(t, 180, 4200),
    );
  };
  return group;
}
function travel(palette: ObjectPalette, variant: ObjectEdition = 0) {
  const group = new THREE.Group();
  group.rotation.set(0.38, -0.24, -0.1);
  const atlas = document.createElement("canvas");
  atlas.width = 1536;
  atlas.height = 1024;
  const ctx = atlas.getContext("2d")!;
  const looks = [
    { land: "#e8e8cd", contour: "#a0b692", water: "#9cbdc1", park: "#c6d1ad" },
    { land: "#ede7d2", contour: "#b2b59b", water: "#94bdcf", park: "#c5d2b7" },
    { land: "#ecdcc6", contour: "#c6ab89", water: "#adc4c0", park: "#d6c59d" },
  ];
  const look = looks[variant];
  ctx.fillStyle = look.land;
  ctx.fillRect(0, 0, 1536, 1024);
  // Original topographic print; no downloaded map or implied real destination.
  ctx.lineWidth = 2;
  ctx.strokeStyle = look.contour;
  for (let n = 0; n < 28; n++) {
    ctx.beginPath();
    for (let x = 0; x <= 1536; x += 12) {
      const y = n * 48 - 130 + 85 * Math.sin(x / 290 + variant * 0.8) + 35 * Math.sin(x / 110 + n * 0.32);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = look.water;
  ctx.lineWidth = variant === 1 ? 110 : 48;
  ctx.beginPath();
  for (let y = 0; y <= 1024; y += 12) {
    const x = 1080 + 110 * Math.sin(y / 180 + variant) + y * 0.12;
    if (y === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 9; col++) {
      const x = 90 + col * 146 + Math.sin(row * 2 + col) * 24,
        y = 120 + row * 142;
      ctx.fillStyle = (row + col) % 4 === 0 ? look.park : "#f3efdc";
      ctx.fillRect(x, y, 58 + (col % 3) * 16, 45 + (row % 2) * 22);
    }
  for (let road = 0; road < 4; road++) {
    ctx.beginPath();
    ctx.strokeStyle = "#faf5e6";
    ctx.lineWidth = 12;
    for (let x = 0; x <= 1536; x += 12) {
      const y = 180 + road * 205 + 45 * Math.sin(x / 260 + road);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(atlas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const folds: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const fold = new THREE.Group();
    fold.position.x = i === 0 ? -0.615 : i === 2 ? 0.615 : 0;
    const center = i === 0 ? -0.615 : i === 2 ? 0.615 : 0;
    fold.add(slab(1.23, 2.45, 0.013, palette.paper, center, 0, 0, 0.008));
    const geometry = new THREE.PlaneGeometry(1.23, 2.45);
    const uv = geometry.attributes.uv;
    for (let n = 0; n < uv.count; n++) uv.setX(n, (uv.getX(n) + i) / 3);
    const surface = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.96 }));
    surface.position.set(center, 0, 0.029);
    fold.add(surface);
    folds.push(fold);
    group.add(fold);
  }
  const paths = [
    [
      [-1.51, -0.69],
      [-0.91, -0.4],
      [-0.45, 0.27],
      [0.22, 0.47],
      [0.78, 0.26],
      [1.48, 0.76],
    ],
    [
      [-1.48, -0.76],
      [-0.92, -0.1],
      [-0.32, -0.24],
      [0.27, 0.34],
      [0.76, 0.74],
      [1.45, 0.62],
    ],
    [
      [-1.5, -0.58],
      [-1.0, 0.13],
      [-0.48, 0.62],
      [0.1, 0.27],
      [0.71, 0.51],
      [1.45, 0.81],
    ],
  ];
  const curve = new THREE.CatmullRomCurve3(paths[variant].map(([x, y]) => new THREE.Vector3(x, y, 0.075)));
  const route = mesh(new THREE.TubeGeometry(curve, 128, 0.019, 8, false), palette.accent);
  group.add(route);
  const pin = new THREE.Group();
  pin.add(mesh(new THREE.SphereGeometry(0.085, 20, 12), palette.accent, 0, 0, 0.23));
  const needle = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.21, 8), 0x615d50, 0, 0, 0.105);
  needle.rotation.x = Math.PI / 2;
  pin.add(needle);
  group.add(pin);
  const ring = mesh(new THREE.TorusGeometry(0.095, 0.012, 8, 32), palette.accent);
  ring.position.copy(curve.getPointAt(0));
  group.add(ring);
  const compass = new THREE.Group();
  compass.position.set(-1.49, 0.88, 0.05);
  compass.add(mesh(new THREE.TorusGeometry(0.14, 0.007, 6, 32), 0x687466));
  const north = mesh(new THREE.ConeGeometry(0.042, 0.21, 3), palette.accent, 0, 0.015, 0.015);
  compass.add(north);
  group.add(compass);
  const count = route.geometry.index!.count;
  group.userData.mapFolds = folds;
  group.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION),
      open = smootherstep(progress(t, 200, 1600)),
      draw = smootherstep(progress(t, 1700, 4650));
    folds[0].rotation.y = lerp(1.05, 0, open);
    folds[2].rotation.y = lerp(-1.05, 0, open);
    route.geometry.setDrawRange(0, Math.floor((draw * count) / 3) * 3);
    route.visible = pin.visible = ring.visible = t >= 1700;
    compass.visible = t >= 1600;
    pin.position.copy(curve.getPointAt(draw));
    phase(group, t, t < 1600 ? "unfold-map" : t < 4650 ? "draw-route" : "arrive", draw);
  };
  return group;
}

function reading(palette: ObjectPalette) {
  const group = new THREE.Group();
  group.rotation.set(0.56, -0.3, -0.13);
  const width = 1.46,
    height = 2.12;
  // Each half has its own cover and paper block, meeting at a rounded spine.
  const halves = [-1, 1].map((side) => {
    const half = new THREE.Group();
    half.position.x = side * 0.045;
    half.rotation.y = side * 0.12;
    half.add(slab(width + 0.11, height + 0.13, 0.065, palette.accent, (side * width) / 2, 0, -0.13, 0.035));
    // Thin curved leaves keep the book from reading as two rounded plastic blocks.
    for (let leaf = 8; leaf >= 0; leaf--) {
      const sheet = new THREE.PlaneGeometry(width, height, 32, 1);
      const vertices = sheet.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const u = vertices.getX(i) + width / 2;
        vertices.setXYZ(i, side * u, vertices.getY(i), 0.065 + 0.025 * Math.sin((u / width) * Math.PI) - 0.06 * u - leaf * 0.011);
      }
      sheet.computeVertexNormals();
      half.add(
        new THREE.Mesh(sheet, new THREE.MeshStandardMaterial({ color: palette.paper, roughness: 0.96, side: THREE.DoubleSide })),
      );
    }
    for (let i = 0; i < 5; i++)
      half.add(
        line(
          [
            [side * 0.04, -height / 2, -0.09 + i * 0.025],
            [side * (width - 0.025), -height / 2, -0.09 + i * 0.025],
          ],
          palette.muted,
          0.46,
        ),
      );
    for (let row = 0; row < 11; row++) {
      const start = 0.2,
        end = width - 0.16 - (row % 4) * 0.055;
      half.add(
        line(
          Array.from({ length: 17 }, (_, step) => {
            const u = lerp(start, end, step / 16);
            return [side * u, 0.64 - row * 0.145, 0.07 + 0.025 * Math.sin((u / width) * Math.PI) - 0.06 * u];
          }),
          palette.muted,
          0.65,
        ),
      );
    }
    half.add(label(side < 0 ? "FIELD NOTES" : "ON ATTENTION", palette.ink, side * 0.77, 0.85, 0.045, 0.1));
    for (let edge = 0; edge < 4; edge++)
      half.add(
        line(
          [
            [side * (width - 0.004), -height / 2 + 0.04, -0.06 + edge * 0.022],
            [side * (width - 0.004), height / 2 - 0.04, -0.06 + edge * 0.022],
          ],
          palette.muted,
          0.28,
        ),
      );
    group.add(half);
    return half;
  });
  const spine = mesh(new THREE.CylinderGeometry(0.072, 0.072, height + 0.14, 20), palette.accent, 0, 0, -0.08);
  group.add(spine);
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 256;
  textureCanvas.height = 512;
  const ctx = textureCanvas.getContext("2d")!;
  ctx.fillStyle = "#" + new THREE.Color(palette.paper).getHexString();
  ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = "#6b7064";
  ctx.font = "500 16px serif";
  ctx.fillText("On attention", 30, 52);
  for (let row = 0; row < 14; row++) ctx.fillRect(30, 86 + row * 25, 186 - (row % 5) * 13, 2);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.PlaneGeometry(width, height, 40, 8);
  geometry.translate(width / 2, 0, 0);
  const page = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, side: THREE.FrontSide, roughness: 0.96 }));
  // Paper has two printed faces. The back print must not mirror when the page turns.
  const reverseTexture = texture.clone();
  reverseTexture.repeat.x = -1;
  reverseTexture.offset.x = 1;
  reverseTexture.needsUpdate = true;
  const reverse = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ map: reverseTexture, side: THREE.BackSide, roughness: 0.96 }),
  );
  group.add(page, reverse);
  group.userData.pageGeometry = geometry;
  const positions = geometry.attributes.position,
    original = Float32Array.from(positions.array);
  // A short cloth ribbon peeks out beneath the pages rather than floating above them.
  const ribbon = slab(0.11, 0.48, 0.012, 0xb65748, 0.67, -1.04, -0.11, 0.005);
  group.add(ribbon);
  group.userData.animate = (time: number) => {
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
    phase(group, t, t < 750 ? "open-book" : t < 1500 ? "lift-page" : t < 4050 ? "turn-page" : "settle-page", q);
  };
  return group;
}
export const builders = {
  ai,
  contact,
  tennis,
  trading,
  server,
  travel,
  reading,
};
export async function createObject(
  kind: ObjectKind,
  palette: ObjectPalette,
  variant: ObjectVariant = 0,
  edition: ObjectEdition = 0,
  /** Overrides the packaged model file for scenes that load one (Studio tennis). */
  modelUrl?: string,
) {
  const finish: ObjectEdition = kind === "contact" ? ((variant % 3) as ObjectEdition) : edition;
  const accent = kind === "reading" ? [palette.accent, 0x793e43, 0x304a67][finish] : [palette.accent, 0x467b98, 0xa0694e][finish];
  const object =
    kind === "contact" && (variant === 3 || variant === 4)
      ? createContactDirection(variant)
      : kind !== "contact" && variant !== 0
        ? createArtDirection(kind, variant)
        : kind === "tennis"
          ? await tennis({ ...palette, accent }, finish, modelUrl)
          : await builders[kind]({ ...palette, accent }, finish);
  object.userData.style ??= "studio";
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
        const map = (material as THREE.MeshStandardMaterial).map;
        if (map) textures.add(map);
      }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}
