import * as THREE from "three";
import type { ObjectVariant } from "./variants";
import { marketBar, MARKET_BAR_MS, MARKET_LOOP_MS } from "./market";
export type ObjectKind =
  "ai" | "contact" | "tennis" | "trading" | "server" | "travel" | "reading";
export interface ObjectPalette {
  paper: number;
  ink: number;
  muted: number;
  accent: number;
}
export const DURATION = 5400;
const p = (t: number, a: number, b: number) =>
  Math.max(0, Math.min(1, (t - a) / (b - a)));
const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
const mix = THREE.MathUtils.lerp;
const mat = (color: number) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04 });
const mesh = (g: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(g, mat(color));
  m.position.set(x, y, z);
  return m;
};
function slab(
  w: number,
  h: number,
  d: number,
  color: number,
  x = 0,
  y = 0,
  z = 0,
  r = 0.06,
) {
  const s = new THREE.Shape();
  const a = -w / 2,
    b = -h / 2;
  s.moveTo(a + r, b);
  s.lineTo(a + w - r, b);
  s.quadraticCurveTo(a + w, b, a + w, b + r);
  s.lineTo(a + w, b + h - r);
  s.quadraticCurveTo(a + w, b + h, a + w - r, b + h);
  s.lineTo(a + r, b + h);
  s.quadraticCurveTo(a, b + h, a, b + h - r);
  s.lineTo(a, b + r);
  s.quadraticCurveTo(a, b, a + r, b);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    curveSegments: 8,
  });
  g.translate(0, 0, -d / 2);
  return mesh(g, color, x, y, z);
}
function line(points: number[][], color: number, opacity = 1) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      points.map((v) => new THREE.Vector3(v[0], v[1], v[2] ?? 0)),
    ),
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
}
function tube(points: THREE.Vector3[], radius: number, color: number) {
  return mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      64,
      radius,
      8,
      false,
    ),
    color,
  );
}
function label(
  text: string,
  color: number,
  x: number,
  y: number,
  z: number,
  size = 0.16,
) {
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
function phase(g: THREE.Group, t: number, name: string, pose: number) {
  g.userData.phase = t >= DURATION ? "rest" : name;
  g.userData.pose = pose;
}
function ai(c: ObjectPalette) {
  const g = new THREE.Group();
  g.rotation.set(0.22, -0.18, 0);
  // A real laptop silhouette, with a hinge, keyboard and a deep terminal screen.
  const keyboard = slab(2.7, 1.2, 0.1, c.muted, 0, -0.95, 0.55);
  keyboard.material.metalness = 0.32;
  keyboard.material.roughness = 0.42;
  keyboard.rotation.x = -Math.PI / 2;
  g.add(keyboard);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 10; col++) {
      const key = slab(
        0.18,
        0.09,
        0.018,
        c.ink,
        -0.98 + col * 0.215,
        -0.88,
        0.18 + row * 0.13,
        0.015,
      );
      key.rotation.x = -Math.PI / 2;
      g.add(key);
    }
  const trackpad = slab(0.65, 0.29, 0.01, c.paper, 0, -0.885, 0.93, 0.025);
  g.add(slab(2.2, 0.055, 0.06, c.ink, 0, -0.82, 0.035, 0.02));
  trackpad.rotation.x = -Math.PI / 2;
  g.add(trackpad);
  g.add(slab(2.72, 1.85, 0.13, c.ink, 0, 0.04, -0.1));
  g.add(slab(2.5, 1.61, 0.022, 0x18232d, 0, 0.04, -0.015));
  for (let i = 0; i < 3; i++)
    g.add(
      mesh(
        new THREE.SphereGeometry(0.032, 12, 8),
        [0xed6a64, 0xe4b75d, 0x6fba88][i],
        -1.1 + i * 0.11,
        0.71,
        0.016,
      ),
    );
  g.add(label("AGENT / LOCAL", 0xa5b9bd, 0.32, 0.71, 0.034, 0.11));
  const code: THREE.Mesh[] = [];
  for (let row = 0; row < 7; row++) {
    const length = [0.92, 1.65, 1.26, 0.72, 1.42, 1.08, 0.58][row];
    const strip = slab(
      length,
      0.047,
      0.01,
      [0x79b6ed, 0xa6d5af, 0xddd7bd][row % 3],
      0,
      0.47 - row * 0.16,
      0.03,
      0.01,
    );
    strip.userData.length = length;
    strip.userData.left = -1.06 + (row % 3) * 0.12;
    code.push(strip);
    g.add(strip);
  }
  const cursor = slab(0.055, 0.12, 0.012, 0xc2eadb, 0, 0, 0.04, 0.01);
  g.add(cursor);
  const satellites = [-1, 1].map((side) => {
    const chip = new THREE.Group();
    chip.position.set(side * 1.65, 0.6, 0.2);
    chip.add(
      slab(0.72, 0.72, 0.12, c.paper),
      slab(0.58, 0.05, 0.018, c.accent, 0, -0.21, 0.08, 0.008),
    );
    chip.add(label(side < 0 ? "</>" : "AI", c.ink, 0, 0.05, 0.09, 0.2));
    g.add(chip);
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
    const m = mesh(new THREE.SphereGeometry(0.075, 16, 12), c.accent);
    g.add(m);
    return m;
  });
  const result = new THREE.Group();
  result.add(
    slab(1.45, 0.37, 0.05, 0x235b47),
    label("TASK COMPLETE", 0xe1f4e6, 0, 0, 0.04, 0.15),
  );
  result.position.set(0, -0.49, 0.16);
  g.add(result);
  g.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION),
      typing = p(t, 100, 2700) * 7;
    code.forEach((strip, i) => {
      const f = ease(Math.max(0, Math.min(1, typing - i)));
      strip.visible = f > 0;
      strip.scale.x = Math.max(0.001, f);
      strip.position.x = strip.userData.left + (strip.userData.length * f) / 2;
    });
    const row = Math.min(6, Math.floor(typing));
    cursor.position.set(
      code[row].position.x +
        (code[row].userData.length * code[row].scale.x) / 2 +
        0.06,
      0.47 - row * 0.16,
      0.04,
    );
    cursor.visible = t < 2850;
    satellites.forEach((chip, i) => {
      const f = ease(p(t, 300 + i * 300, 1100 + i * 300));
      chip.position.y = mix(0.95, 0.6, f);
      chip.rotation.z = (i ? 1 : -1) * 0.07 * (1 - f);
    });
    packets.forEach((packet, i) => {
      const q = p(t, 1100 + i * 400, 3450 + i * 400);
      packet.position.copy(paths[i].getPoint(ease(q)));
      packet.scale.setScalar(Math.max(0.001, Math.sin(q * Math.PI)));
    });
    const done = ease(p(t, 4000, 4700));
    result.scale.setScalar(Math.max(0.001, done));
    phase(
      g,
      t,
      t < 700
        ? "prompt"
        : t < 2100
          ? "prompt-to-tools"
          : t < 2850
            ? "tools"
            : t < 4250
              ? "tools-to-check"
              : "check",
      p(t, 700, 4250),
    );
  };
  return g;
}
function contact(c: ObjectPalette) {
  const g = new THREE.Group();
  g.rotation.set(0.1, -0.2, -0.025);

  // Symbols and route geometry keep the three-to-one relationship legible
  // without relying on colour.
  const sourceY = [0.9, 0, -0.9];
  const sources = sourceY.map((y, index) => {
    const source = new THREE.Group();
    source.position.set(-1.62, y, 0.05);
    source.add(slab(0.75, 0.58, 0.11, c.paper));
    if (index === 0) {
      source.add(
        line(
          [
            [-0.24, 0.14, 0.13],
            [0, -0.03, 0.13],
            [0.24, 0.14, 0.13],
          ],
          c.accent,
        ),
        line(
          [
            [-0.24, 0.14, 0.13],
            [-0.24, -0.15, 0.13],
            [0.24, -0.15, 0.13],
            [0.24, 0.14, 0.13],
          ],
          c.accent,
        ),
      );
    } else if (index === 1) {
      source.add(
        slab(0.48, 0.3, 0.018, c.accent, 0, 0.03, 0.13, 0.07),
        mesh(
          new THREE.ConeGeometry(0.075, 0.15, 3),
          c.accent,
          -0.14,
          -0.18,
          0.13,
        ),
      );
    } else {
      source.add(
        mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 36), c.accent, 0, 0, 0.13),
        line(
          [
            [-0.2, 0, 0.135],
            [0.2, 0, 0.135],
          ],
          c.accent,
        ),
        line(
          [
            [0, -0.2, 0.135],
            [0, 0.2, 0.135],
          ],
          c.accent,
        ),
      );
    }
    g.add(source);
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
  routes.forEach((route) => g.add(tube(route.getPoints(32), 0.014, c.muted)));

  const packets = routes.map((route, index) => {
    const packet = mesh(
      index === 1
        ? new THREE.OctahedronGeometry(0.09)
        : index === 2
          ? new THREE.BoxGeometry(0.14, 0.14, 0.14)
          : new THREE.SphereGeometry(0.085, 16, 12),
      c.accent,
    );
    packet.position.copy(route.getPoint(0));
    g.add(packet);
    return packet;
  });

  const inbox = new THREE.Group();
  inbox.position.set(1.12, 0, 0);
  inbox.add(
    slab(1.42, 1.55, 0.16, c.ink),
    slab(1.22, 1.35, 0.025, c.paper, 0, 0, 0.1),
    label("INBOX", c.ink, 0, 0.53, 0.14, 0.15),
  );
  const tray = slab(1.05, 0.53, 0.16, c.accent, 0, -0.37, 0.19, 0.055);
  tray.rotation.x = -0.18;
  inbox.add(tray);
  const receipts = sourceY.map((_, index) => {
    const receipt = slab(
      0.72,
      0.18,
      0.025,
      c.paper,
      0,
      -0.25 + index * 0.14,
      0.34,
      0.025,
    );
    inbox.add(receipt);
    return receipt;
  });
  const status = mesh(
    new THREE.TorusGeometry(0.12, 0.027, 10, 40),
    c.accent,
    0.43,
    0.53,
    0.14,
  );
  inbox.add(status);
  g.add(inbox);

  g.userData.contact = { inboxPoint, routes, packets, receipts };
  g.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION);
    sources.forEach((source, index) => {
      const enter = ease(p(t, 120 + index * 140, 780 + index * 140));
      source.position.x = mix(-1.9, -1.62, enter);
      source.rotation.z = (index - 1) * 0.055 * (1 - enter);
    });
    packets.forEach((packet, index) => {
      const travel = ease(p(t, 700 + index * 430, 2750 + index * 430));
      packet.position.copy(routes[index].getPoint(travel));
      packet.rotation.z = travel * Math.PI * 2;
      packet.scale.setScalar(Math.max(0.001, Math.sin(travel * Math.PI)));
      const received = ease(p(t, 2600 + index * 430, 3300 + index * 430));
      receipts[index].scale.x = Math.max(0.001, received);
      receipts[index].position.x = mix(-0.18, 0, received);
    });
    const acknowledge = ease(p(t, 3900, 4750));
    status.scale.setScalar(Math.max(0.001, acknowledge));
    status.rotation.z = mix(-Math.PI, 0, acknowledge);
    inbox.position.y = 0.035 * Math.sin(p(t, 3900, 4750) * Math.PI);
    phase(
      g,
      t,
      t < 900
        ? "open-channels"
        : t < 3650
          ? "route-signals"
          : t < 4750
            ? "collect-messages"
            : "contact-ready",
      p(t, 700, 4750),
    );
  };
  return g;
}
async function tennis(_c: ObjectPalette, variant: ObjectVariant = 0) {
  const [{ GLTFLoader }, { default: encoded }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"), import("./tennis-asset"),
  ]);
  const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  const model = await new GLTFLoader().parseAsync(bytes.buffer, "");
  const g = new THREE.Group();
  g.rotation.set(0.64, -0.25, 0);
  g.position.y = 0.10;
  model.scene.scale.setScalar(0.69);
  model.scene.position.y = -0.65;
  g.add(model.scene);
  const colors = [
    { Court: 0x326658, "Court surround": 0x284c43, Jersey: 0xeee9db, "Kit accent": 0x27534a, Shorts: 0x283e48 },
    { Court: 0xa65e43, "Court surround": 0x704434, Jersey: 0xe6ddcc, "Kit accent": 0x6e4538, Shorts: 0x574036 },
    { Court: 0x446b89, "Court surround": 0x304958, Jersey: 0xd5e7e3, "Kit accent": 0x24564d, Shorts: 0x203d4a },
  ][variant];
  model.scene.traverse((item) => {
    const m = item as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = true; m.receiveShadow = true;
    for (const material of Array.isArray(m.material) ? m.material : [m.material]) {
      const color = colors[material.name as keyof typeof colors];
      if (color !== undefined) (material as THREE.MeshStandardMaterial).color.setHex(color);
    }
  });
  const mixer = new THREE.AnimationMixer(model.scene);
  model.animations.forEach((clip) => mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play());
  const ball = model.scene.getObjectByName("Tennis_ball");
  const racket = model.scene.getObjectByName("Racket");
  g.userData.source = "blender";
  g.userData.contactTime = 1900;
  g.userData.contactTimes = [1900, 4900];
  g.userData.rackets = [racket, model.scene.getObjectByName("Far_Racket")];
  g.userData.loopDuration = 6000;
  g.userData.restTime = 1900;
  g.userData.ball = ball;
  g.userData.racket = racket;
  g.userData.racketContact = new THREE.Vector3(0, 0.63, 0);
  g.userData.dispose = () => { mixer.stopAllAction(); mixer.uncacheRoot(model.scene); };
  g.userData.animate = (time: number) => {
    const t = ((time % 6000) + 6000) % 6000;
    mixer.setTime(t / 1000);
    g.userData.phase = t < 1900 || t >= 4900 ? "near-return" : "far-return";
    g.userData.pose = t / 6000;
  };
  return g;
}
function trading(c: ObjectPalette, variant: ObjectVariant = 0) {
  const g = new THREE.Group();
  g.rotation.set(0.06, -0.19, 0);
  const casing = slab(4.08, 2.62, 0.16, 0x263038, 0, 0.26, 0, 0.055);
  casing.material.metalness = 0.45; casing.material.roughness = 0.4;
  g.add(casing, slab(0.32, 0.6, 0.18, 0x303d45, 0, -1.18, -0.04, 0.035));
  const foot = slab(1.38, 0.5, 0.095, 0x3c4951, 0, -1.51, 0.16, 0.065);
  foot.rotation.x = -Math.PI / 2; g.add(foot);
  g.add(label("MARKET STUDY", 0x899b9f, 0, -0.94, 0.10, 0.075));
  g.add(mesh(new THREE.SphereGeometry(0.019, 12, 8), 0x51bfa6, 1.8, -0.94, 0.105));
  const canvas = document.createElement("canvas"); canvas.width = 1056; canvas.height = 620;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const display = new THREE.Mesh(new THREE.PlaneGeometry(3.82, 2.24), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
  display.position.set(0, 0.34, 0.12); g.add(display);
  const green = "#32c99a", red = "#ee6972";
  const left = 38, right = 958, top = 108, bottom = 422, volumeBottom = 543;
  const step = (right - left) / 24;
  const priceY = (value: number) => bottom - (value - 96.5) / 7 * (bottom - top);
  const stroke = (x1: number, y1: number, x2: number, y2: number, color: string, width = 1) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  g.userData.loopDuration = MARKET_LOOP_MS;
  g.userData.restTime = 3600;
  g.userData.marketBar = (index: number) => marketBar(index, variant);
  g.userData.animate = (time: number) => {
    const t = ((time % MARKET_LOOP_MS) + MARKET_LOOP_MS) % MARKET_LOOP_MS;
    const offset = Math.max(0, time) / MARKET_BAR_MS, first = Math.floor(offset), fraction = offset - first;
    ctx.fillStyle = "#111a22"; ctx.fillRect(0, 0, 1056, 620);
    ctx.textAlign = "left"; ctx.font = "600 23px monospace"; ctx.fillStyle = "#e5ebee"; ctx.fillText("DEMO / USD", 30, 39);
    ctx.font = "15px monospace"; ctx.fillStyle = "#91a4b0"; ctx.fillText("1m  ·  OHLC + VOLUME", 30, 70);
    ctx.textAlign = "right"; ctx.fillStyle = "#c2ced4"; ctx.fillText("SIMULATED · REPEATING STUDY", 1026, 39);
    stroke(28, 87, 1028, 87, "#2a3944");
    ctx.font = "14px monospace";
    for (let value = 97; value <= 103; value++) {
      const y = priceY(value); stroke(left, y, right, y, "#25323c");
      ctx.textAlign = "left"; ctx.fillStyle = "#91a4b0"; ctx.fillText(value.toFixed(2), right + 12, y + 5);
    }
    stroke(left, 456, right, 456, "#2c3a44");
    ctx.textAlign = "left"; ctx.fillStyle = "#91a4b0"; ctx.fillText("VOL", left, 478);
    ctx.save(); ctx.beginPath(); ctx.rect(left, top, right - left, volumeBottom - top); ctx.clip();
    for (let i = first - 1; i <= first + 25; i++) {
      const bar = marketBar(i, variant), x = left + (i - first - fraction + .5) * step;
      if (i % 6 === 0) stroke(x, top, x, volumeBottom, "#1e2b35");
      const color = bar.close >= bar.open ? green : red;
      stroke(x, priceY(bar.high), x, priceY(bar.low), color, 2);
      ctx.fillStyle = color;
      ctx.fillRect(x - 9, priceY(Math.max(bar.open, bar.close)), 18, Math.max(2, Math.abs(priceY(bar.open) - priceY(bar.close))));
      const h = Math.min(57, bar.volume / 12);
      ctx.globalAlpha = .50; ctx.fillRect(x - 9, volumeBottom - h, 18, h); ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.textAlign = "left"; ctx.fillStyle = "#91a4b0";
    // Time advances with the viewport even when the authored OHLC pattern repeats.
    for (let i = first; i <= first + 24; i++) if (i % 4 === 0) {
      const x = left + (i - first - fraction + .5) * step;
      if (x >= left && x <= right - 40) {
        const minute = (570 + i) % 1440;
        ctx.fillText(String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0"), x - 12, 569);
      }
    }
    ctx.fillStyle = "#6f8695"; ctx.font = "13px monospace"; ctx.fillText("Illustrative prices · fixed USD scale · no live feed", left, 603);
    texture.needsUpdate = true;
    g.userData.phase = "market-pan"; g.userData.pose = t / MARKET_LOOP_MS;
    g.userData.scroll = offset;
  };
  return g;
}
function server(c: ObjectPalette) {
  const g = new THREE.Group();
  g.rotation.set(-0.16, -0.38, 0);
  const chassis = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(3.1, 2.6, 1.65),
  );
  g.add(
    new THREE.LineSegments(
      chassis,
      new THREE.LineBasicMaterial({
        color: c.muted,
        transparent: true,
        opacity: 0.65,
      }),
    ),
  );
  const trays: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const tray = new THREE.Group();
    tray.add(slab(2.85, 0.6, 0.95, i === 1 ? c.accent : c.ink));
    for (let j = 0; j < 11; j++)
      tray.add(
        slab(0.08, 0.28, 0.012, c.muted, -1.14 + j * 0.15, 0, 0.5, 0.008),
      );
    tray.add(
      mesh(new THREE.SphereGeometry(0.045, 16, 12), c.paper, 1.22, 0.13, 0.51),
    );
    tray.position.y = 0.82 - i * 0.82;
    trays.push(tray);
    g.add(tray);
  }
  g.add(label("INFERENCE / STUDY", c.ink, 0, -1.65, 0.3, 0.19));
  g.userData.animate = (t: number) => {
    trays.forEach((tray, i) => {
      tray.position.x = mix(
        i % 2 ? -1 : 1,
        0,
        ease(p(t, 350 + i * 700, 1750 + i * 700)),
      );
      tray.position.z = mix(1.4, 0, ease(p(t, 350 + i * 700, 1750 + i * 700)));
    });
    phase(
      g,
      t,
      t < 1750
        ? "place-chassis"
        : t < 2450
          ? "place-compute"
          : t < 3550
            ? "place-memory"
            : "bandwidth-check",
      p(t, 350, 3550),
    );
  };
  return g;
}
function travel(c: ObjectPalette) {
  const g = new THREE.Group();
  g.rotation.set(-0.48, -0.12, -0.08);
  const folds: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const fold = new THREE.Group();
    fold.position.x = (i - 1) * 1.23;
    fold.add(slab(1.21, 2.45, 0.045, c.paper, 0, 0, 0, 0.025));
    for (let j = 0; j < 4; j++)
      fold.add(
        line(
          [
            [-0.52, -0.88 + j * 0.54, 0.065],
            [0.52, -0.63 + j * 0.46, 0.065],
          ],
          c.muted,
          0.7,
        ),
      );
    for (let j = 0; j < 2; j++)
      fold.add(
        line(
          [
            [-0.3 + j * 0.52, -1.1, 0.065],
            [-0.14 + j * 0.44, 1.1, 0.065],
          ],
          c.muted,
          0.7,
        ),
      );
    g.add(fold);
    folds.push(fold);
  }
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.5, -0.66, 0.12),
    new THREE.Vector3(-0.8, -0.2, 0.12),
    new THREE.Vector3(-0.1, 0.4, 0.12),
    new THREE.Vector3(0.7, 0.2, 0.12),
    new THREE.Vector3(1.46, 0.75, 0.12),
  ]);
  const route = tube(curve.getPoints(60), 0.025, c.accent);
  g.add(route);
  const pin = new THREE.Group();
  pin.add(
    mesh(new THREE.SphereGeometry(0.105, 24, 16), c.accent, 0, 0, 0.26),
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 12), c.ink),
  );
  pin.children[1].rotation.x = Math.PI / 2;
  pin.children[1].position.z = 0.12;
  g.add(pin);
  const count = route.geometry.index!.count;
  g.userData.animate = (t: number) => {
    const open = ease(p(t, 250, 1500)),
      draw = ease(p(t, 1550, 4600));
    folds[0].rotation.y = mix(0.55, 0, open);
    folds[2].rotation.y = mix(-0.55, 0, open);
    route.geometry.setDrawRange(0, Math.floor((draw * count) / 3) * 3);
    route.visible = t >= 1550;
    pin.visible = t >= 1550;
    pin.position.copy(curve.getPoint(draw));
    phase(
      g,
      t,
      t < 1500 ? "unfold-map" : t < 4600 ? "draw-route" : "arrive",
      draw,
    );
  };
  return g;
}
function reading(c: ObjectPalette) {
  const g = new THREE.Group();
  g.rotation.set(0.26, -0.22, -0.08);
  const width = 1.46,
    height = 2.12;
  // Each half has its own cover and paper block, meeting at a rounded spine.
  const halves = [-1, 1].map((side) => {
    const half = new THREE.Group();
    half.position.x = side * 0.045;
    half.rotation.y = side * 0.12;
    half.add(
      slab(
        width + 0.11,
        height + 0.13,
        0.065,
        c.accent,
        (side * width) / 2,
        0,
        -0.13,
        0.035,
      ),
    );
    // Thin curved leaves keep the book from reading as two rounded plastic blocks.
    for (let leaf = 4; leaf >= 0; leaf--) {
      const sheet = new THREE.PlaneGeometry(width, height, 32, 1);
      const vertices = sheet.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const u = vertices.getX(i) + width / 2;
        vertices.setXYZ(i, side * u, vertices.getY(i), 0.065 + 0.025 * Math.sin(u / width * Math.PI) - 0.06 * u - leaf * 0.011);
      }
      sheet.computeVertexNormals();
      half.add(new THREE.Mesh(sheet, new THREE.MeshStandardMaterial({ color: c.paper, roughness: 0.96, side: THREE.DoubleSide })));
    }
    for (let i = 0; i < 5; i++)
      half.add(
        line(
          [
            [side * 0.04, -height / 2, -0.09 + i * 0.025],
            [side * (width - 0.025), -height / 2, -0.09 + i * 0.025],
          ],
          c.muted,
          0.46,
        ),
      );
    for (let row = 0; row < 11; row++) {
      const start = 0.2, end = width - 0.16 - (row % 4) * 0.055;
      half.add(line(Array.from({ length: 17 }, (_, step) => {
        const u = mix(start, end, step / 16);
        return [side * u, 0.81 - row * 0.145, 0.07 + 0.025 * Math.sin(u / width * Math.PI) - 0.06 * u];
      }), c.muted, 0.65));
    }
    for (let edge = 0; edge < 4; edge++)
      half.add(line([[side * (width - 0.004), -height / 2 + 0.04, -0.06 + edge * 0.022], [side * (width - 0.004), height / 2 - 0.04, -0.06 + edge * 0.022]], c.muted, 0.28));
    g.add(half);
    return half;
  });
  const spine = mesh(
    new THREE.CylinderGeometry(0.072, 0.072, height + 0.14, 20),
    c.accent,
    0,
    0,
    -0.08,
  );
  g.add(spine);
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 256;
  textureCanvas.height = 512;
  const ctx = textureCanvas.getContext("2d")!;
  ctx.fillStyle = "#" + new THREE.Color(c.paper).getHexString();
  ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = "#" + new THREE.Color(c.muted).getHexString();
  for (let row = 0; row < 14; row++)
    ctx.fillRect(30, 58 + row * 27, 192 - (row % 4) * 9, 2);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.PlaneGeometry(width, height, 40, 8);
  geometry.translate(width / 2, 0, 0);
  const page = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      roughness: 0.96,
    }),
  );
  g.add(page);
  const positions = geometry.attributes.position,
    original = Float32Array.from(positions.array);
  // A short cloth ribbon peeks out beneath the pages rather than floating above them.
  const ribbon = slab(0.11, 0.48, 0.012, 0xb65748, 0.67, -1.04, -0.11, 0.005);
  g.add(ribbon);
  g.userData.animate = (time: number) => {
    const t = Math.min(time, DURATION),
      q = ease(p(t, 750, 4050)),
      theta = Math.PI * q;
    for (let i = 0; i < positions.count; i++) {
      const u = original[i * 3],
        v = original[i * 3 + 1],
        bend = Math.sin((u / width) * Math.PI) * Math.sin(theta) * 0.24;
      positions.setXYZ(
        i,
        (u + 0.045) * Math.cos(theta),
        v + 0.035 * Math.sin(theta) * (u / width),
        0.10 + 0.025 * Math.sin(u / width * Math.PI) - u * 0.18 + u * Math.sin(theta) + bend,
      );
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    halves[0].rotation.y = -0.12;
    halves[1].rotation.y = 0.12;
    phase(
      g,
      t,
      t < 750
        ? "open-book"
        : t < 1500
          ? "lift-page"
          : t < 4050
            ? "turn-page"
            : "settle-page",
      q,
    );
  };
  return g;
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
export async function createObject(kind: ObjectKind, palette: ObjectPalette, variant: ObjectVariant = 0) {
  const accent = kind === "reading" ? [palette.accent, 0x793e43, 0x304a67][variant] : [palette.accent, 0x467b98, 0xa0694e][variant];
  const object = await builders[kind]({ ...palette, accent }, variant);
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
    const m = item as THREE.Mesh;
    if (m.geometry) geometries.add(m.geometry);
    if (m.material)
      for (const a of Array.isArray(m.material) ? m.material : [m.material]) {
        materials.add(a);
        const map = (a as THREE.MeshStandardMaterial).map;
        if (map) textures.add(map);
      }
  });
  textures.forEach((t) => t.dispose());
  materials.forEach((m) => m.dispose());
  geometries.forEach((g) => g.dispose());
}
