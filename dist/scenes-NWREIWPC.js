// src/objects/contact-directions.ts
import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
var C = { cream: 16181706, coral: 15301725, blue: 6920109, green: 9155483, dark: 2703177, gold: 12490332 };
var tau = Math.PI * 2;
var v = (x, y, z = 0) => new T.Vector3(x, y, z);
function mesh(g, geo, color, x = 0, y = 0, z = 0, metal = false) {
  const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color, roughness: metal ? 0.28 : 0.65, metalness: metal ? 0.65 : 0.02 }));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}
function box(g, w, h, d, color, x = 0, y = 0, z = 0) {
  return mesh(g, new RoundedBoxGeometry(w, h, d, 2, Math.min(0.09, w / 4, h / 4, d / 4)), color, x, y, z);
}
function rod(g, a, b, color = C.gold, r = 0.018) {
  const delta = b.clone().sub(a), m = mesh(g, new T.CylinderGeometry(r, r, delta.length(), 12), color, 0, 0, 0, true);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(v(0, 1), delta.normalize());
  return m;
}
function sphere(g, r, color, x = 0, y = 0, z = 0) {
  return mesh(g, new T.SphereGeometry(r, 24, 16), color, x, y, z);
}
function envelope(parent, color = C.cream) {
  const g = new T.Group();
  parent.add(g);
  box(g, 0.64, 0.43, 0.07, color);
  for (const z of [-0.041, 0.041]) {
    rod(g, v(-0.28, 0.17, z), v(0, -0.025, z), C.gold, 9e-3);
    rod(g, v(0, -0.025, z), v(0.28, 0.17, z), C.gold, 9e-3);
  }
  return g;
}
function createContactDirection(variant) {
  const g = new T.Group(), ticks = [];
  if (variant === 3) {
    const world = new T.Group();
    g.add(world);
    world.rotation.set(0.35, -0.38, 0);
    world.position.y = -0.57;
    box(world, 2.7, 0.28, 2.05, C.cream, 0, -0.35);
    box(world, 2.6, 0.07, 1.95, 12242604, 0, -0.17);
    for (let i = 0; i < 4; i++) box(world, 0.48, 0.045, 0.24, 15324594, 0.22, -0.1, 0.48 + i * 0.25);
    box(world, 0.17, 0.62, 0.17, C.cream, 0, 0.15, -0.18);
    box(world, 0.55, 0.08, 0.43, C.coral, 0, -0.12, -0.18);
    const mailbox = new T.Group();
    world.add(mailbox);
    mailbox.position.set(0, 0.85, -0.18);
    box(mailbox, 1.16, 0.88, 0.87, C.coral);
    box(mailbox, 0.99, 0.72, 0.045, C.cream, 0, 0, 0.455);
    box(mailbox, 0.72, 0.11, 0.02, C.dark, 0, 0.17, 0.486);
    for (const x of [-0.24, 0.24]) sphere(mailbox, 0.043, C.dark, x, -0.1, 0.49);
    const smile = mesh(mailbox, new T.TorusGeometry(0.12, 0.015, 8, 24, Math.PI), C.coral, 0, -0.14, 0.49);
    smile.rotation.z = Math.PI;
    const flag = new T.Group();
    mailbox.add(flag);
    flag.position.set(0.62, -0.12, 0);
    rod(flag, v(0, 0), v(0, 0.78), C.gold, 0.025);
    box(flag, 0.28, 0.2, 0.055, C.blue, 0.12, 0.68);
    sphere(flag, 0.06, C.gold);
    for (const [x, z, s] of [[-0.98, -0.55, 0.8], [0.97, -0.6, 0.55]]) {
      rod(world, v(x, -0.13, z), v(x, 0.6 * s, z), 10584928, 0.045);
      sphere(world, 0.32 * s, C.green, x, 0.72 * s, z).scale.y = 1.4;
      sphere(world, 0.24 * s, 6525819, x + 0.13, 0.55 * s, z);
    }
    const letter = envelope(world);
    letter.name = "arriving-letter";
    ticks.push((a) => {
      const p2 = a / tau, fly = p2 > 0.8 ? (1 - p2) / 0.2 : Math.min(1, Math.max(0, (p2 - 0.1) / 0.62));
      const ease2 = fly * fly * (3 - 2 * fly);
      letter.position.set(-1 * (1 - ease2), 1.02 + 0.86 * Math.sin(Math.PI * fly), 0.31 + 1.15 * (1 - ease2));
      letter.rotation.set(0.12 * (1 - ease2), -0.24 * (1 - ease2), -0.22 * (1 - ease2));
      const scale = Math.min(1, Math.max(0, (p2 - 0.06) / 0.08)) * Math.min(1, Math.max(0, (0.79 - p2) / 0.09));
      letter.scale.setScalar(scale * 0.85);
      letter.visible = scale > 0;
      flag.rotation.z = -0.65 + 0.65 * Math.sin(Math.PI * Math.min(1, Math.max(0, (p2 - 0.55) / 0.35)));
    });
  } else {
    g.rotation.set(0.12, -0.2, 0);
    mesh(g, new T.CylinderGeometry(0.98, 1.04, 0.16, 64), C.dark, 0, -1.45);
    const rim = mesh(g, new T.TorusGeometry(0.98, 0.022, 8, 80), C.gold, 0, -1.36, 0, true);
    rim.rotation.x = Math.PI / 2;
    rod(g, v(0, -1.37, -0.3), v(0, 1.45, -0.3), C.gold, 0.04);
    const mobile = new T.Group();
    g.add(mobile);
    mobile.position.set(0, 0.95, -0.3);
    rod(mobile, v(-1.18, 0), v(1.18, 0), C.gold, 0.028);
    sphere(mobile, 0.09, C.gold);
    for (let i = 0; i < 3; i++) {
      const hanger = new T.Group();
      mobile.add(hanger);
      hanger.position.x = (i - 1) * 0.98;
      const length = [0.65, 1.05, 0.48][i];
      rod(hanger, v(0, 0), v(0, -length), C.gold, 9e-3);
      const letter = envelope(hanger, [C.cream, C.blue, C.coral][i]);
      letter.position.y = -length - 0.21;
      ticks.push((a) => {
        hanger.rotation.z = 0.085 * Math.sin(a + i * 1.8);
        letter.rotation.y = 0.32 * Math.sin(a + i);
      });
    }
    box(g, 1.25, 0.1, 0.78, C.cream, 0, -1.23, 0.16);
    for (const x of [-0.59, 0.59]) box(g, 0.08, 0.18, 0.78, C.cream, x, -1.11, 0.16);
    box(g, 1.25, 0.18, 0.08, C.cream, 0, -1.11, -0.2);
    const orbit = new T.Group();
    g.add(orbit);
    orbit.rotation.set(0.85, 0.3, 0);
    orbit.position.y = -0.05;
    mesh(orbit, new T.TorusGeometry(1.39, 0.012, 8, 80), C.gold, 0, 0, 0, true);
    const signal = sphere(orbit, 0.075, C.gold);
    ticks.push((a) => {
      mobile.rotation.y = 0.3 + 0.38 * Math.sin(a);
      mobile.rotation.z = 0.06 * Math.sin(a);
      signal.position.set(1.39 * Math.cos(a), 1.39 * Math.sin(a), 0);
    });
  }
  g.userData.style = variant === 3 ? "cartoon" : "kinetic";
  g.userData.source = "procedural";
  g.userData.loopDuration = 12e3;
  g.userData.restTime = 3200;
  g.userData.animate = (time) => {
    const progress = (time % 12e3 + 12e3) % 12e3 / 12e3;
    for (const tick of ticks) tick(progress * tau);
    g.userData.phase = variant === 3 ? "letter-delivery" : "correspondence-mobile";
    g.userData.pose = progress;
  };
  return g;
}

// src/objects/scenes.ts
import * as THREE from "three";

// src/objects/art-directions.ts
import * as T3 from "three";
import { RoundedBoxGeometry as RoundedBoxGeometry3 } from "three/addons/geometries/RoundedBoxGeometry.js";

// src/objects/expanded-directions.ts
import * as T2 from "three";
import { RoundedBoxGeometry as RoundedBoxGeometry2 } from "three/addons/geometries/RoundedBoxGeometry.js";
var tau2 = Math.PI * 2;
var V = (x, y, z = 0) => new T2.Vector3(x, y, z);
var C2 = { cream: 15983547, coral: 15497563, blue: 6331070, mint: 8436128, ink: 2504523, gold: 12884824, white: 16446953 };
var standard = (color, roughness = 0.68, metalness = 0.04) => new T2.MeshStandardMaterial({ color, roughness, metalness });
function mesh2(parent, geo, material2, x = 0, y = 0, z = 0) {
  const m = new T2.Mesh(geo, typeof material2 === "number" ? standard(material2) : material2);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function block(parent, w, h, d, material2, x = 0, y = 0, z = 0, radius = 0.055) {
  return mesh2(parent, new RoundedBoxGeometry2(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)), material2, x, y, z);
}
function sphere2(parent, r, material2, x = 0, y = 0, z = 0) {
  return mesh2(parent, new T2.SphereGeometry(r, 24, 16), material2, x, y, z);
}
function ring(parent, r, tube2, material2, x = 0, y = 0, z = 0) {
  return mesh2(parent, new T2.TorusGeometry(r, tube2, 8, 64), material2, x, y, z);
}
function cylinder(parent, r, h, material2, x = 0, y = 0, z = 0) {
  return mesh2(parent, new T2.CylinderGeometry(r, r, h, 40), material2, x, y, z);
}
function path(parent, points, color, radius = 0.018, closed = false) {
  return mesh2(parent, new T2.TubeGeometry(new T2.CatmullRomCurve3(points, closed), 80, radius, 6, closed), color);
}
function rod2(parent, a, b, color, radius = 0.02) {
  const delta = b.clone().sub(a), m = cylinder(parent, radius, delta.length(), color);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1), delta.normalize());
  return m;
}
function group(parent, x = 0, y = 0, z = 0) {
  const g = new T2.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
function tree(parent, x, z, s = 1) {
  const g = group(parent, x, 0, z);
  g.scale.setScalar(s);
  cylinder(g, 0.065, 0.55, 9728348, 0, 0.26);
  sphere2(g, 0.27, C2.mint, 0, 0.7).scale.y = 1.35;
  sphere2(g, 0.21, 6198647, 0.19, 0.58);
  return g;
}
function cloud(parent, x, y, z) {
  const g = group(parent, x, y, z);
  for (const [dx, dy, r] of [[-0.23, 0, 0.22], [0, 0.08, 0.3], [0.25, 0, 0.21]]) sphere2(g, r, C2.white, dx, dy).scale.z = 0.6;
  return g;
}
function roof(parent, w, h, d, x = 0, y = 0, z = 0) {
  const shape = new T2.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(0, h);
  shape.lineTo(w / 2, 0);
  shape.closePath();
  const geo = new T2.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.025, bevelSegments: 2, steps: 1 });
  geo.translate(0, 0, -d / 2);
  return mesh2(parent, geo, C2.coral, x, y, z);
}
function toyHouse(parent, x, z) {
  const h = group(parent, x, 0, z);
  block(h, 0.72, 0.68, 0.66, C2.cream, 0, 0.34);
  roof(h, 0.88, 0.36, 0.83, 0, 0.67);
  block(h, 0.2, 0.31, 0.03, C2.blue, 0, 0.17, 0.35);
  for (const side of [-1, 1]) block(h, 0.13, 0.14, 0.035, C2.white, side * 0.23, 0.46, 0.35);
  return h;
}
function cartoon(kind, ticks) {
  const g = new T2.Group(), world = group(g, 0, -0.48, 0);
  world.rotation.set(0.48, -0.55, 0);
  block(world, 2.65, 0.32, 2.16, C2.cream, 0, -0.2, 0, 0.16);
  block(world, 2.56, 0.08, 2.07, 12177325, 0, 0, 0, 0.13);
  if (kind === "travel") {
    block(world, 2.45, 0.06, 0.7, C2.blue, 0, 0.055, 0.55, 0.2);
    toyHouse(world, -0.7, -0.45);
    tree(world, 0.87, -0.56, 0.85);
    tree(world, 1.04, 0.03, 0.55);
    const hill = sphere2(world, 0.61, C2.mint, 0.52, 0.08, -0.62);
    hill.scale.set(1, 1.18, 0.8);
    const train = group(world, 0, 0.22, 0.54);
    block(train, 0.72, 0.3, 0.31, C2.coral);
    block(train, 0.43, 0.19, 0.29, C2.cream, -0.08, 0.23);
    for (const x of [-0.23, 0.23]) for (const z of [-0.17, 0.17]) cylinder(train, 0.095, 0.04, C2.ink, x, -0.14, z).rotation.x = Math.PI / 2;
    for (const x of [-0.2, 0]) block(train, 0.13, 0.11, 0.015, C2.blue, x, 0.25, 0.16);
    ticks.push((a) => {
      train.position.x = 0.68 * Math.sin(a);
      train.rotation.y = 0.08 * Math.sin(a);
    });
  } else if (kind === "reading") {
    block(world, 1.5, 0.18, 1.48, C2.coral, 0, 0.14, 0);
    block(world, 1.38, 0.2, 1.37, C2.white, 0, 0.32, 0);
    for (let i = 0; i < 4; i++) block(world, 1.4, 0.012, 1.38, 14207397, 0, 0.25 + i * 0.043);
    const seat = group(world, 0.1, 0.43, 0);
    block(seat, 0.66, 0.13, 0.59, C2.blue, 0, 0.15);
    block(seat, 0.67, 0.7, 0.16, C2.blue, 0, 0.49, -0.27, 0.1);
    for (const x of [-0.32, 0.32]) block(seat, 0.12, 0.24, 0.61, C2.blue, x, 0.32);
    const book = group(seat, 0, 0.47, 0.13);
    block(book, 0.43, 0.05, 0.34, C2.cream);
    book.rotation.x = -0.2;
    const lamp = group(world, -0.86, 0.06, -0.36);
    rod2(lamp, V(0, 0), V(0, 1.32), C2.gold, 0.045);
    mesh2(lamp, new T2.ConeGeometry(0.28, 0.34, 32), C2.coral, 0, 1.35);
    sphere2(lamp, 0.1, 16767363, 0, 1.2);
    tree(world, 0.93, 0.5, 0.68);
    ticks.push((a) => {
      book.rotation.z = 0.06 * Math.sin(a);
      seat.rotation.y = 0.06 * Math.sin(a);
    });
  } else if (kind === "tennis") {
    block(world, 1.78, 0.05, 1.8, 6662026, 0, 0.075);
    for (const x of [-0.74, 0.74]) block(world, 0.024, 0.012, 1.55, C2.white, x, 0.11);
    for (const z of [-0.78, 0, 0.78]) block(world, 1.5, 0.012, 0.024, C2.white, 0, 0.11, z);
    for (const x of [-0.88, 0.88]) cylinder(world, 0.035, 0.43, C2.white, x, 0.28);
    block(world, 1.78, 0.28, 0.025, C2.ink, 0, 0.33);
    for (let i = -8; i <= 8; i++) block(world, 0.012, 0.26, 0.03, C2.cream, i * 0.1, 0.33);
    const ball2 = sphere2(world, 0.12, 15064432), a = group(world, -0.33, 0.16, 0.67), b = group(world, 0.33, 0.16, -0.67);
    for (const [r, color] of [[a, C2.coral], [b, C2.blue]]) {
      cylinder(r, 0.17, 0.09, color);
      sphere2(r, 0.17, color, 0, 0.18).scale.y = 0.45;
      ring(r, 0.19, 0.032, C2.cream, 0, 0.25).rotation.x = -Math.PI / 2;
    }
    ticks.push((t) => {
      const q = Math.sin(t);
      ball2.position.set(0.33 * q, 0.53 + 0.51 * (1 - q * q), -0.67 * q);
      a.rotation.y = 0.22 * Math.cos(t);
      b.rotation.y = -0.22 * Math.cos(t);
    });
    tree(world, 1.02, -0.75, 0.75);
  } else if (kind === "ai") {
    block(world, 1.6, 0.14, 0.85, 13080950, 0, 0.63);
    for (const x of [-0.63, 0.63]) block(world, 0.1, 0.59, 0.1, C2.cream, x, 0.29);
    const bot = group(world, -0.26, 0.98, -0.1);
    block(bot, 0.81, 0.62, 0.34, C2.blue, 0, 0, 0, 0.14);
    block(bot, 0.62, 0.35, 0.045, C2.ink, 0, 0.035, 0.19, 0.09);
    for (const x of [-0.16, 0.16]) sphere2(bot, 0.055, 16112775, x, 0.06, 0.23);
    rod2(bot, V(0, 0.3), V(0, 0.49), C2.coral);
    sphere2(bot, 0.075, C2.coral, 0, 0.54);
    block(world, 0.66, 0.045, 0.28, C2.cream, -0.22, 0.73, 0.28);
    const mug = cylinder(world, 0.13, 0.23, C2.coral, 0.58, 0.81, 0.15);
    ring(mug, 0.1, 0.025, C2.coral, 0.14, 0).rotation.y = 0.2;
    tree(world, 1, -0.7, 0.78);
    ticks.push((a) => {
      bot.rotation.z = 0.06 * Math.sin(a);
      bot.position.y = 0.98 + 0.035 * (1 - Math.cos(a * 2));
    });
  } else if (kind === "server") {
    for (let i = 0; i < 3; i++) {
      const building = group(world, -0.72 + i * 0.69, 0, -0.15 + i % 2 * 0.28), height = 0.87 + i % 2 * 0.38;
      block(building, 0.58, height, 0.66, [C2.blue, C2.coral, C2.mint][i], 0, height / 2);
      for (let j = 0; j < 3; j++) {
        block(building, 0.4, 0.11, 0.04, C2.cream, 0, 0.18 + j * 0.22, 0.35);
        sphere2(building, 0.024, 6202527, -0.12, 0.18 + j * 0.22, 0.38);
      }
      const fan = ring(building, 0.17, 0.04, C2.ink, 0, height - 0.15, 0.35);
      for (let n = 0; n < 4; n++) {
        const blade = block(fan, 0.045, 0.2, 0.025, C2.white);
        blade.rotation.z = n * Math.PI / 2;
      }
      ticks.push((a) => fan.rotation.z = a * 2);
    }
    const puff = cloud(world, 0.1, 1.65, -0.16);
    puff.scale.setScalar(0.75);
    ticks.push((a) => puff.position.y = 1.65 + 0.055 * Math.sin(a));
  } else {
    for (let i = 0; i < 5; i++) {
      const h = [0.48, 0.83, 1.2, 0.73, 0.99][i], x = -0.91 + i * 0.46;
      block(world, 0.35, h, 0.62, i === 3 ? C2.coral : C2.blue, x, h / 2, -0.23);
      for (let j = 0; j < Math.floor(h / 0.22); j++) for (const dx of [-0.09, 0.09]) block(world, 0.075, 0.1, 0.018, C2.cream, x + dx, 0.17 + j * 0.21, 0.09);
    }
    const tram = group(world, 0, 0.2, 0.59);
    block(tram, 0.6, 0.23, 0.29, C2.coral);
    block(tram, 0.35, 0.12, 0.25, C2.cream, 0, 0.17);
    ticks.push((a) => tram.position.x = 0.85 * Math.sin(a));
  }
  if (kind !== "server") {
    const puff = cloud(g, 0.75, 1.24, -0.65);
    puff.scale.setScalar(0.68);
    ticks.push((a) => {
      puff.position.x = 0.75 + 0.12 * Math.sin(a);
    });
  }
  ticks.push((a) => world.rotation.y = -0.55 + 0.065 * Math.sin(a));
  g.scale.setScalar(0.98);
  return g;
}
function grain() {
  const size = 64, data = new Uint8Array(size * size * 4);
  let seed = 17;
  for (let i = 0; i < size * size; i++) {
    seed = seed * 1664525 + 1013904223 >>> 0;
    const value = 160 + seed % 80;
    data.set([value, value, value, 255], i * 4);
  }
  const texture = new T2.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = T2.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.needsUpdate = true;
  return texture;
}
function realistic(kind, ticks) {
  const g = new T2.Group(), texture = grain();
  const steel = standard(10200490, 0.28, 0.82), graphite = standard(2370866, 0.52, 0.3), paper = standard(15787213, 0.95), leather = standard(8603956, 0.84);
  for (const m of [steel, graphite, paper, leather]) m.roughnessMap = texture;
  g.userData.dispose = () => texture.dispose();
  const stage = group(g);
  stage.rotation.set(0.48, -0.3, -0.06);
  block(stage, 2.95, 0.1, 2.05, standard(13222323, 0.95), 0, -0.84, 0, 0.035);
  if (kind === "ai") {
    const keyboard = group(stage, 0, -0.48, 0.16);
    block(keyboard, 2.5, 0.25, 1.2, graphite);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) {
      const key = block(keyboard, 0.25, 0.16, 0.27, col === 7 ? leather : paper, -1.04 + col * 0.296, 0.17, -0.4 + row * 0.34, 0.035);
      block(key, 0.07, 6e-3, 0.025, col === 7 ? paper : graphite, -0.055, 0.083, -0.04, 2e-3);
      const phase2 = (row * 8 + col) / 24 * tau2;
      ticks.push((a) => key.position.y = 0.17 - 0.055 * Math.max(0, Math.cos(a - phase2)) ** 18);
    }
    const cable = path(stage, [V(1, -0.42, -0.49), V(1.3, -0.27, -0.9), V(0.5, -0.13, -1), V(-0.5, -0.1, -0.78)], graphite, 0.037);
    cable.rotation.y = 0.02;
    const cap = group(stage, 0.36, 0.67, 0.05);
    block(cap, 0.64, 0.32, 0.64, paper, 0, 0.09, 0, 0.09);
    block(cap, 0.3, 0.16, 0.3, leather, 0, -0.17);
    ticks.push((a) => {
      cap.position.y = 0.67 + 0.09 * Math.sin(a);
      cap.rotation.y = 0.25 + 0.12 * Math.sin(a);
    });
  } else if (kind === "tennis") {
    const felt = standard(12765251, 0.99);
    felt.roughnessMap = texture;
    const ball2 = sphere2(stage, 0.57, felt, -0.5, -0.2, 0.15);
    const seamPoints = Array.from({ length: 97 }, (_, i) => {
      const a = i / 96 * tau2;
      return V(0.567 * Math.cos(a), 0.567 * Math.sin(a) * Math.cos(0.5 * Math.cos(a * 2)), 0.567 * Math.sin(a) * Math.sin(0.5 * Math.cos(a * 2)));
    });
    path(ball2, seamPoints, paper, 0.015, true);
    const r = group(stage, 0.57, 0.22, -0.1);
    r.rotation.set(0.3, -0.2, -0.43);
    const hoop = ring(r, 0.57, 0.043, graphite, 0, 0.22);
    hoop.scale.y = 1.24;
    ring(r, 0.533, 0.012, steel, 0, 0.22).scale.y = 1.24;
    for (let i = -5; i <= 5; i++) {
      const x = i * 0.085, dy = Math.sqrt(0.52 ** 2 - x * x) * 1.24;
      rod2(r, V(x, 0.22 - dy, 0.015), V(x, 0.22 + dy, 0.015), 12631465, 4e-3);
      const y = i * 0.108, dx = Math.sqrt(0.52 ** 2 - (y / 1.24) ** 2);
      rod2(r, V(-dx, 0.22 + y, 0.017), V(dx, 0.22 + y, 0.017), 12631465, 4e-3);
    }
    rod2(r, V(-0.23, -0.37), V(0, -0.7), 3489604, 0.026);
    rod2(r, V(0.23, -0.37), V(0, -0.7), 3489604, 0.026);
    block(r, 0.14, 0.48, 0.13, leather, 0, -0.91);
    for (let i = 0; i < 8; i++) ring(r, 0.081, 6e-3, graphite, 0, -0.71 - i * 0.05).rotation.x = Math.PI / 2;
    block(stage, 2.6, 9e-3, 0.025, paper, 0, -0.775, 0.59, 2e-3);
    ticks.push((a) => ball2.rotation.set(0.08 * Math.sin(a), a, 0));
  } else if (kind === "travel") {
    const compass = group(stage, -0.18, -0.69, 0.1);
    compass.rotation.x = -Math.PI / 2;
    cylinder(compass, 0.85, 0.14, steel).rotation.x = Math.PI / 2;
    cylinder(compass, 0.77, 0.02, paper, 0, 0, 0.09).rotation.x = Math.PI / 2;
    ring(compass, 0.78, 0.033, graphite, 0, 0, 0.105);
    for (let i = 0; i < 48; i++) {
      const a = i * tau2 / 48;
      const mark = block(compass, 0.014, i % 4 === 0 ? 0.12 : 0.05, 0.012, graphite, 0.67 * Math.sin(a), 0.67 * Math.cos(a), 0.12, 2e-3);
      mark.rotation.z = -a;
    }
    const needle = group(compass, 0, 0, 0.15);
    const shape = new T2.Shape();
    shape.moveTo(-0.1, 0);
    shape.lineTo(0, 0.57);
    shape.lineTo(0.1, 0);
    shape.lineTo(0, -0.45);
    shape.closePath();
    mesh2(needle, new T2.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false }), leather);
    sphere2(compass, 0.055, steel, 0, 0, 0.21);
    ring(compass, 0.17, 0.033, steel, 0, 1.01, 0.03);
    for (let i = 0; i < 8; i++) path(stage, Array.from({ length: 20 }, (_, j) => {
      const x = -1.32 + j * 0.14;
      return V(x, -0.775, -0.8 + i * 0.21 + 0.065 * Math.sin(x * 4 + i));
    }), 10203027, 5e-3);
    ticks.push((a) => needle.rotation.z = 0.32 + 0.24 * Math.sin(a) * (0.75 + 0.25 * Math.cos(a)));
  } else if (kind === "reading") {
    for (let i = 0; i < 2; i++) {
      const book = group(stage, -0.18 + i * 0.15, -0.58 + i * 0.31, 0);
      book.rotation.y = i ? -0.13 : 0.08;
      block(book, 1.85, 0.055, 1.22, i ? graphite : leather, 0, -0.12);
      block(book, 1.77, 0.2, 1.15, paper);
      block(book, 1.85, 0.055, 1.22, i ? graphite : leather, 0, 0.12);
      for (let n = 0; n < 7; n++) block(book, 1.77, 6e-3, 1.15, 13090216, 0, -0.077 + n * 0.023, 5e-3, 1e-3);
    }
    const glasses = group(stage, 0, 0.08, 0.05);
    glasses.rotation.x = -Math.PI / 2;
    for (const x of [-0.39, 0.39]) {
      ring(glasses, 0.3, 0.019, steel, x, 0);
      rod2(glasses, V(x + Math.sign(x) * 0.28, 0), V(x + Math.sign(x) * 0.27, 0.62, -0.04), 7632760, 0.016);
    }
    path(glasses, [V(-0.09, 0), V(0, 0.055), V(0.09, 0)], steel, 0.018);
    const bookmark = block(stage, 0.17, 0.018, 0.9, leather, 0.65, -0.05, 0.44);
    bookmark.rotation.y = 0.09;
    ticks.push((a) => stage.rotation.z = -0.06 + 0.025 * Math.sin(a));
  } else if (kind === "server") {
    const board = group(stage, 0, -0.57, 0);
    block(board, 2.35, 0.08, 1.45, standard(3431756, 0.7));
    for (let i = 0; i < 12; i++) block(board, 0.014, 5e-3, 1.15, steel, -1.05 + i * 0.19, 0.047);
    for (const x of [-0.65, 0.55]) {
      const fan = group(board, x, 0.23, 0);
      cylinder(fan, 0.44, 0.13, graphite);
      ring(fan, 0.405, 0.018, steel).rotation.x = Math.PI / 2;
      const rotor = group(fan, 0, 0.08, 0);
      for (let j = 0; j < 7; j++) {
        const blade = block(rotor, 0.16, 0.025, 0.26, graphite, Math.sin(j * tau2 / 7) * 0.21, 0, Math.cos(j * tau2 / 7) * 0.21);
        blade.rotation.y = j * tau2 / 7 + 0.5;
      }
      cylinder(rotor, 0.12, 0.04, steel);
      ticks.push((a) => rotor.rotation.y = a * 3);
    }
    for (let i = 0; i < 9; i++) block(board, 0.035, 0.21, 0.6, steel, -0.3 + i * 0.065, 0.16, -0.42);
    for (let i = 0; i < 10; i++) block(board, 0.06, 0.014, 0.12, standard(C2.gold, 0.3, 0.8), -0.8 + i * 0.17, 0.05, 0.72);
    const chip = block(stage, 0.64, 0.1, 0.64, steel, 0, 0.77, -0.08);
    block(chip, 0.43, 0.012, 0.43, graphite, 0, 0.06);
    ticks.push((a) => {
      chip.position.y = 0.77 + 0.08 * Math.sin(a);
      chip.rotation.y = 0.15 * Math.sin(a);
    });
  } else {
    const roll = group(stage, -0.87, 0.03, -0.1);
    roll.rotation.z = Math.PI / 2;
    cylinder(roll, 0.44, 0.7, paper);
    cylinder(roll, 0.13, 0.71, graphite);
    const tape = group(stage, 0.27, -0.3, 0.17);
    tape.rotation.set(-Math.PI / 2, 0, -0.08);
    block(tape, 1.78, 0.7, 0.018, paper);
    for (let i = 0; i < 12; i++) {
      const h = 0.09 + 0.12 * (i * 7 % 5) / 5;
      block(tape, 0.035, h, 0.012, i % 3 ? graphite : leather, -0.72 + i * 0.13, 0.03, 0.023, 2e-3);
      block(tape, 6e-3, h + 0.1, 0.012, graphite, -0.72 + i * 0.13, 0.03, 0.018, 1e-3);
    }
    for (let i = 0; i < 16; i++) block(tape, 0.028, 0.035, 0.012, graphite, -0.75 + i * 0.1, -0.23, 0.023, 1e-3);
    const wheel = ring(stage, 0.56, 0.032, steel, -0.87, 0.03, -0.1);
    wheel.rotation.y = Math.PI / 2;
    ticks.push((a) => {
      roll.rotation.x = a;
      wheel.rotation.x = a;
    });
  }
  ticks.push((a) => stage.rotation.y = -0.3 + 0.07 * Math.sin(a));
  return g;
}
function abstract(kind, ticks) {
  const g = new T2.Group();
  g.rotation.set(0.12, -0.25, 0);
  const glass = new T2.MeshPhysicalMaterial({ color: 10868961, roughness: 0.12, metalness: 0.05, transmission: 0.72, thickness: 0.6, ior: 1.45, clearcoat: 1, envMapIntensity: 1.2 });
  const amber = new T2.MeshPhysicalMaterial({ color: 15377510, roughness: 0.16, metalness: 0.05, transmission: 0.55, thickness: 0.5, ior: 1.4, clearcoat: 1 });
  const chrome = standard(11057353, 0.18, 0.86), cobalt = standard(4414154, 0.32, 0.25);
  if (kind === "ai") {
    const lattice = group(g);
    lattice.rotation.set(0.35, 0.5, 0.25);
    for (let i = 0; i < 3; i++) {
      const hoop = ring(lattice, 0.84 + i * 0.18, 0.09, i === 1 ? glass : chrome);
      hoop.rotation.set(i * 0.8, i * 0.6, 0.2);
      ticks.push((a) => hoop.rotation.z = a * (i % 2 ? 1 : -1));
    }
    mesh2(lattice, new T2.OctahedronGeometry(0.49), amber);
    for (let i = 0; i < 6; i++) {
      const dot = sphere2(g, 0.105, cobalt);
      ticks.push((a) => {
        const q = a + i * tau2 / 6;
        dot.position.set(1.4 * Math.cos(q), 0.85 * Math.sin(q), 0.4 * Math.sin(q * 2));
      });
    }
  } else if (kind === "tennis") {
    const pair = [group(g, -1, 0), group(g, 1, 0)];
    for (let i = 0; i < 2; i++) {
      const hoop = ring(pair[i], 0.64, 0.14, i ? glass : amber);
      hoop.scale.y = 1.42;
      pair[i].rotation.y = (i ? 1 : -1) * 0.35;
    }
    const ball2 = sphere2(g, 0.27, cobalt);
    const arc = path(g, Array.from({ length: 49 }, (_, i) => {
      const t = i / 48 * tau2;
      return V(1.16 * Math.sin(t), 0.65 * Math.cos(t), 0.5 * Math.sin(t * 2));
    }), chrome, 0.015, true);
    ticks.push((a) => {
      ball2.position.set(1.16 * Math.sin(a), 0.65 * Math.cos(a), 0.5 * Math.sin(a * 2));
      pair[0].scale.x = 1 - 0.1 * Math.max(0, -Math.sin(a)) ** 8;
      pair[1].scale.x = 1 - 0.1 * Math.max(0, Math.sin(a)) ** 8;
      arc.rotation.y = 0.04 * Math.sin(a);
    });
  } else if (kind === "trading") {
    for (let i = 0; i < 7; i++) {
      const h = 0.7 + i * 3 % 5 * 0.22;
      const bar = block(g, 0.27, h, 0.42, i % 3 === 0 ? amber : i % 2 === 0 ? glass : cobalt, -1.17 + i * 0.39, 0, 0, 0.12);
      rod2(g, V(-1.17 + i * 0.39, -1.3), V(-1.17 + i * 0.39, 1.3), 11057353, 9e-3);
      ticks.push((a) => bar.position.y = 0.36 * Math.sin(a + i * 0.62));
    }
    const brace = ring(g, 1.53, 0.016, chrome);
    brace.scale.y = 0.82;
    brace.rotation.x = 0.4;
  } else if (kind === "server") {
    for (let i = 0; i < 5; i++) {
      const slab2 = block(g, 1.65, 0.14, 1.03, i % 2 ? glass : chrome, 0, -1.03 + i * 0.51, 0, 0.06);
      const core = block(slab2, 0.5, 0.11, 0.4, i % 2 ? cobalt : amber, 0, 0.13, 0, 0.045);
      ticks.push((a) => {
        slab2.rotation.y = 0.35 * Math.sin(a + i * 0.55);
        core.rotation.y = -0.35 * Math.sin(a + i * 0.55);
      });
    }
    for (const x of [-0.98, 0.98]) path(g, [V(x, -1.2), V(x * 1.22, -0.5, 0.2), V(x * 1.22, 0.5, -0.2), V(x, 1.2)], cobalt, 0.03);
  } else if (kind === "travel") {
    for (let i = 0; i < 4; i++) {
      const portal = ring(g, 1.06 - i * 0.1, 0.12, i % 2 ? glass : amber, -0.48 + i * 0.32, 0, -0.7 + i * 0.43);
      portal.scale.y = 1.18;
      portal.rotation.y = -0.4;
      ticks.push((a) => portal.rotation.z = 0.2 * Math.sin(a + i * 0.4));
    }
    const journey = sphere2(g, 0.16, cobalt);
    ticks.push((a) => journey.position.set(1.37 * Math.cos(a), 0.75 * Math.sin(a), 0.7 * Math.sin(a)));
    path(g, Array.from({ length: 65 }, (_, i) => {
      const a = i / 64 * tau2;
      return V(1.37 * Math.cos(a), 0.75 * Math.sin(a), 0.7 * Math.sin(a));
    }), chrome, 0.014, true);
  } else {
    for (let i = 0; i < 7; i++) {
      const points = Array.from({ length: 33 }, (_, j) => {
        const t = j / 32;
        return V((t - 0.5) * 2.2, Math.sin(t * Math.PI) * 0.8, 0);
      });
      const ribbon = new T2.Shape();
      ribbon.moveTo(-1.1, 0);
      for (let j = 1; j < 33; j++) ribbon.lineTo(points[j].x, points[j].y);
      for (let j = 32; j >= 0; j--) ribbon.lineTo(points[j].x, points[j].y - 0.05);
      ribbon.closePath();
      const geo = new T2.ExtrudeGeometry(ribbon, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, steps: 1 });
      geo.translate(0, 0, -0.275);
      const leaf = mesh2(g, geo, i % 3 === 0 ? glass : i % 2 ? chrome : amber, 0, -1.12 + i * 0.27, (i - 3) * 0.11);
      leaf.rotation.y = 0.4;
      ticks.push((a) => {
        leaf.rotation.z = 0.08 * Math.sin(a + i * 0.38);
        leaf.position.y = -1.12 + i * 0.27 + 0.045 * Math.sin(a + i * 0.38);
      });
    }
  }
  ticks.push((a) => g.rotation.y = -0.25 + 0.12 * Math.sin(a));
  return g;
}
function createExpandedDirection(kind, variant) {
  const ticks = [];
  const object = variant === 3 ? cartoon(kind, ticks) : variant === 4 ? realistic(kind, ticks) : abstract(kind, ticks);
  object.userData.style = ["cartoon", "realistic", "abstract"][variant - 3];
  object.userData.source = "procedural";
  object.userData.loopDuration = 12e3;
  object.userData.restTime = 1800;
  object.userData.animate = (time) => {
    const p2 = (time % 12e3 + 12e3) % 12e3 / 12e3;
    for (const tick of ticks) tick(p2 * tau2);
    object.userData.phase = `${object.userData.style}-study`;
    object.userData.pose = p2;
  };
  return object;
}

// src/objects/art-directions.ts
var directionTokens = {
  paper: { cream: 16771261, peach: 15311480, coral: 12473919, blue: 5799313, teal: 3567208, ink: 3423825 },
  kinetic: { ivory: 15984588, gold: 12357970, dark: 2504777, blue: 6654873, orange: 12676166 }
};
var tau3 = Math.PI * 2;
var material = (color, metal = false) => new T3.MeshStandardMaterial({ color, roughness: metal ? 0.3 : 0.87, metalness: metal ? 0.55 : 0.02 });
function add(g, geometry, color, x = 0, y = 0, z = 0, metal = false) {
  const m = new T3.Mesh(geometry, material(color, metal));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}
function box2(g, w, h, d, color, x = 0, y = 0, z = 0) {
  return add(g, new RoundedBoxGeometry3(w, h, d, 1, Math.min(0.018, w / 4, h / 4, d / 4)), color, x, y, z);
}
function ball(g, r, color, x = 0, y = 0, z = 0, metal = false) {
  return add(g, new T3.SphereGeometry(r, 24, 16), color, x, y, z, metal);
}
function disc(g, r, depth, color, x = 0, y = 0, z = 0) {
  const m = add(g, new T3.CylinderGeometry(r, r, depth, 64), color, x, y, z);
  m.rotation.x = Math.PI / 2;
  return m;
}
function ring2(g, r, width, color, x = 0, y = 0, z = 0, metal = false) {
  return add(g, new T3.TorusGeometry(r, width, 10, 80), color, x, y, z, metal);
}
function cut(g, points, color, z = 0, depth = 0.065) {
  const s = new T3.Shape();
  points.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
  s.closePath();
  return add(g, new T3.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 6e-3, bevelSize: 8e-3, bevelSegments: 1, steps: 1 }), color, 0, 0, z);
}
function curve(g, points, color, radius = 0.018) {
  return add(g, new T3.TubeGeometry(new T3.CatmullRomCurve3(points), 64, radius, 6, false), color);
}
function rod3(g, a, b, color, radius = 0.015) {
  const d = b.clone().sub(a);
  const m = add(g, new T3.CylinderGeometry(radius, radius, d.length(), 8), color);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T3.Vector3(0, 1, 0), d.normalize());
  return m;
}
var v2 = (x, y, z = 0) => new T3.Vector3(x, y, z);
function paperTree(g, x, y, z, s = 1) {
  const t = new T3.Group();
  t.position.set(x, y, z);
  t.scale.setScalar(s);
  g.add(t);
  box2(t, 0.045, 0.6, 0.08, 8149317, 0, 0.18);
  cut(t, [[-0.28, 0.24], [0, 0.91], [0.28, 0.24]], directionTokens.paper.teal, 0.02);
  cut(t, [[-0.22, 0.5], [0, 1.08], [0.22, 0.5]], 6657413, 0.07);
  return t;
}
function plane(g, color) {
  const a = new T3.Group();
  cut(a, [[0, 0.32], [-0.28, -0.18], [0, -0.06], [0.28, -0.18]], color, 0, 0.04);
  cut(a, [[0, 0.32], [-0.045, -0.23], [0.045, -0.23]], 16775141, 0.045, 0.03);
  g.add(a);
  return a;
}
function racket(g, color, metal = false) {
  const a = new T3.Group();
  g.add(a);
  const hoop = ring2(a, 0.47, 0.038, color, 0, 0.2, 0, metal);
  hoop.scale.y = 1.25;
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.105, y = i * 0.135;
    const dy = Math.sqrt(0.44 ** 2 - x * x) * 1.25;
    rod3(a, v2(x, 0.2 - dy, 0.01), v2(x, 0.2 + dy, 0.01), 11909547, 6e-3);
    const dx = Math.sqrt(Math.max(0, 0.44 ** 2 - (y / 1.25) ** 2));
    rod3(a, v2(-dx, 0.2 + y, 0.012), v2(dx, 0.2 + y, 0.012), 11909547, 6e-3);
  }
  rod3(a, v2(-0.2, -0.32), v2(0, -0.66), color, 0.023);
  rod3(a, v2(0.2, -0.32), v2(0, -0.66), color, 0.023);
  box2(a, 0.12, 0.47, 0.12, 3754571, 0, -0.86);
  for (let i = 0; i < 6; i++) box2(a, 0.127, 0.013, 0.126, 8096133, 0, -0.68 - i * 0.062);
  return a;
}
function paperWorld(kind, c, ticks) {
  const g = new T3.Group(), C3 = directionTokens.paper;
  disc(g, 1.74, 0.14, C3.peach, 0, 0, -0.45);
  disc(g, 1.6, 0.08, C3.cream, 0, 0, -0.34);
  const halo = ring2(g, 1.68, 0.035, C3.coral, 0, 0, -0.28);
  halo.scale.y = 1.02;
  if (kind === "travel") {
    disc(g, 0.34, 0.045, C3.coral, 0.78, 0.88, -0.2);
    cut(g, [[-1.53, -0.54], [-0.93, 0.9], [-0.27, -0.05], [0.28, 0.77], [1.51, -0.55], [1.25, -1.05], [-1.25, -1.05]], C3.blue, -0.11);
    cut(g, [[-1.45, -0.65], [-0.62, 0.38], [0.13, -0.21], [0.9, 0.48], [1.46, -0.62], [1.16, -1.15], [-1.16, -1.15]], C3.teal, 0.17);
    cut(g, [[-1.25, -1.02], [-0.91, -0.48], [-0.18, -0.77], [0.57, -0.44], [1.24, -0.97], [0.74, -1.42], [-0.64, -1.42]], 9547149, 0.43);
    curve(g, [v2(-0.83, -1.04, 0.52), v2(-0.17, -0.75, 0.53), v2(0.12, -0.46, 0.28), v2(0.54, -0.35, 0.25)], C3.cream, 0.055);
    paperTree(g, -0.89, -0.82, 0.5, 0.55);
    paperTree(g, 0.9, -0.87, 0.49, 0.4);
    const flyer = plane(g, C3.cream);
    flyer.scale.setScalar(0.65);
    ticks.push((a) => {
      flyer.position.set(Math.cos(a) * 1.25, 0.92 + Math.sin(a) * 0.21, 0.6 + Math.sin(a) * 0.12);
      flyer.rotation.z = Math.atan2(0.21 * Math.cos(a), -1.25 * Math.sin(a)) - Math.PI / 2;
    });
  } else if (kind === "reading") {
    const book = new T3.Group();
    g.add(book);
    book.position.set(0, -0.85, 0.63);
    book.rotation.x = 0.65;
    for (const side of [-1, 1]) {
      const leaf = new T3.Group();
      book.add(leaf);
      leaf.rotation.y = side * 0.14;
      box2(leaf, 1.25, 0.14, 1.48, C3.coral, side * 0.64, 0, 0);
      for (let i = 0; i < 5; i++) box2(leaf, 1.2, 0.024, 1.4, C3.cream, side * 0.62, 0.1 + i * 0.032, 0);
    }
    const portal = new T3.Group();
    portal.position.set(0, -0.49, 0.5);
    g.add(portal);
    box2(portal, 0.3, 1.25, 0.14, C3.blue, -0.58, 0.53);
    box2(portal, 0.3, 1.25, 0.14, C3.blue, 0.58, 0.53);
    cut(portal, [[-0.84, 1.05], [0, 1.69], [0.84, 1.05]], C3.coral, 0.02);
    for (let i = 0; i < 5; i++) box2(g, 0.78, 0.1, 0.22, C3.peach, 0, -0.91 + i * 0.1, 1.13 - i * 0.14);
    paperTree(g, -1.04, -0.64, 0.71, 0.53);
    paperTree(g, 1.06, -0.64, 0.64, 0.4);
    for (let i = 0; i < 5; i++) {
      const slip = box2(g, 0.26, 0.36, 0.025, i % 2 ? C3.blue : C3.cream, -1 + i * 0.5, 1.03, 0.32);
      ticks.push((a) => {
        slip.position.y = 1.1 + 0.15 * Math.sin(a + i);
        slip.rotation.z = 0.2 * Math.sin(a + i);
        slip.rotation.y = 0.25 * Math.cos(a + i);
      });
    }
    ticks.push((a) => portal.rotation.y = 0.1 * Math.sin(a));
  } else if (kind === "tennis") {
    const court = new T3.Group();
    g.add(court);
    court.rotation.z = -0.25;
    box2(court, 1.83, 2.62, 0.08, C3.teal, 0, 0, 0.12);
    for (const x of [-0.79, -0.57, 0.57, 0.79]) box2(court, 0.014, 2.35, 0.012, C3.cream, x, 0, 0.175);
    for (const y of [-1.17, -0.57, 0.57, 1.17]) box2(court, 1.58, 0.015, 0.012, C3.cream, 0, y, 0.175);
    box2(court, 0.014, 1.14, 0.012, C3.cream, 0, 0, 0.175);
    box2(court, 1.96, 0.035, 0.33, C3.ink, 0, 0, 0.29);
    for (let i = -12; i <= 12; i++) box2(court, 0.012, 0.018, 0.31, C3.cream, i * 0.073, -0.025, 0.3);
    const r1 = racket(court, C3.coral), r2 = racket(court, C3.peach);
    r1.scale.setScalar(0.43);
    r2.scale.setScalar(0.43);
    r2.rotation.z = Math.PI;
    r1.position.set(-0.34, -1.1, 0.36);
    r2.position.set(0.34, 1.1, 0.36);
    const b = ball(court, 0.075, 16372320);
    ticks.push((a) => {
      b.position.set(0.34 * Math.sin(a), 1.02 * Math.sin(a), 0.4 + 0.46 * Math.cos(a) ** 2);
      r1.rotation.z = 0.25 * Math.cos(a);
      r2.rotation.z = Math.PI + 0.25 * Math.cos(a);
    });
  } else if (kind === "ai") {
    const head = new T3.Group();
    g.add(head);
    head.position.set(-0.54, 0.14, 0.47);
    box2(head, 1.14, 0.94, 0.3, C3.blue);
    box2(head, 0.91, 0.55, 0.06, C3.cream, 0, 0.03, 0.18);
    for (const x of [-0.24, 0.24]) disc(head, 0.09, 0.03, C3.ink, x, 0.08, 0.23);
    box2(head, 0.31, 0.025, 0.035, C3.coral, 0, -0.14, 0.23);
    rod3(head, v2(0, 0.47), v2(0, 0.73), C3.coral, 0.028);
    ball(head, 0.085, C3.coral, 0, 0.78);
    for (let i = 0; i < 3; i++) {
      const card = new T3.Group();
      g.add(card);
      card.position.set(0.64 + i * 0.15, 0.23 - i * 0.4, 0.05 + i * 0.28);
      card.rotation.z = -0.12;
      box2(card, 0.85, 0.52, 0.07, [C3.peach, C3.cream, C3.teal][i]);
      for (let j = 0; j < 3; j++) box2(card, 0.55 - j * 0.08, 0.025, 0.01, i === 2 ? C3.cream : C3.ink, -j * 0.04, 0.13 - j * 0.11, 0.045);
      ticks.push((a) => {
        card.position.x = 0.64 + i * 0.15 + 0.06 * Math.sin(a + i * 0.9);
        card.rotation.y = 0.14 * Math.sin(a + i * 0.9);
      });
    }
    cut(g, [[-1.07, -0.58], [-0.1, -0.58], [-0.1, -0.87], [0.1, -0.7], [-0.1, -0.48], [-0.1, -0.65], [-1.07, -0.65]], C3.coral, 0.58);
    ticks.push((a) => {
      head.rotation.z = 0.06 * Math.sin(a);
      head.position.y = 0.14 + 0.06 * Math.cos(a);
    });
  } else if (kind === "server") {
    const tower = new T3.Group();
    g.add(tower);
    tower.rotation.y = -0.35;
    for (let i = 0; i < 4; i++) {
      const layer = new T3.Group();
      tower.add(layer);
      layer.position.y = -0.94 + i * 0.61;
      box2(layer, 1.6, 0.42, 0.55, [C3.blue, C3.teal, C3.coral, C3.blue][i]);
      box2(layer, 1.38, 0.25, 0.025, C3.cream, 0, 0, 0.29);
      for (let j = 0; j < 6; j++) box2(layer, 0.075, 0.12, 0.024, C3.ink, -0.5 + j * 0.145, 0, 0.32);
      disc(layer, 0.042, 0.03, C3.coral, 0.54, 0, 0.33);
      const tab = cut(layer, [[0.8, -0.12], [1.02, -0.12], [1.02, 0.12], [0.8, 0.12]], C3.peach, -0.05);
      ticks.push((a) => {
        layer.position.x = 0.12 * Math.sin(a + i * 0.7);
        tab.rotation.y = 0.15 * Math.sin(a);
      });
    }
    for (let i = 0; i < 4; i++) {
      const dot = disc(g, 0.055, 0.04, C3.coral, -1.18, -0.9 + i * 0.55, 0.1);
      ticks.push((a) => dot.position.y = -0.9 + i * 0.55 + 0.06 * Math.sin(a + i));
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const panel = new T3.Group();
      g.add(panel);
      panel.position.set(-1.2 + i * 0.39, 0, 0.12 + i * 0.055);
      panel.rotation.y = (i % 2 ? 1 : -1) * 0.2;
      box2(panel, 0.39, 1.8, 0.045, i % 2 ? C3.cream : 16177059);
      const height = [0.37, 0.64, 0.47, 0.88, 0.69, 1.02, 0.87][i];
      box2(panel, 0.15, height, 0.055, i === 2 || i === 4 ? C3.coral : C3.teal, 0, -0.55 + height / 2, 0.065);
      box2(panel, 0.018, height + 0.26, 0.045, C3.ink, 0, -0.55 + height / 2, 0.05);
      box2(panel, 0.19, 0.12 + i % 3 * 0.045, 0.025, C3.blue, 0, -0.74, 0.08);
      ticks.push((a) => panel.rotation.y = (i % 2 ? 1 : -1) * (0.18 + 0.11 * Math.sin(a)));
    }
    curve(g, [v2(-1.3, -1.14, 0.66), v2(-0.6, -1.02, 0.66), v2(0.3, -1.1, 0.66), v2(1.27, -0.9, 0.66)], C3.coral, 0.025);
  }
  ticks.push((a) => {
    g.rotation.set(-0.18 + 0.035 * Math.cos(a), -0.34 + 0.1 * Math.sin(a), -0.035);
  });
  return g;
}
function kineticWorld(kind, c, ticks) {
  const g = new T3.Group(), C3 = directionTokens.kinetic;
  const base = add(g, new T3.CylinderGeometry(0.93, 1.05, 0.16, 64), C3.dark, 0, -1.49, 0);
  base.rotation.x = 0;
  ring2(g, 0.96, 0.012, C3.gold, 0, -1.48, 0, true).rotation.x = Math.PI / 2;
  const foot = add(g, new T3.CylinderGeometry(0.85, 0.91, 0.06, 64), C3.dark, 0, -1.59, 0);
  ring2(g, 0.94, 0.018, C3.gold, 0, -1.4, 0, true).rotation.x = Math.PI / 2;
  if (kind === "ai") {
    const core = add(g, new T3.IcosahedronGeometry(0.52, 0), C3.gold, 0, 0.1, 0, true);
    for (let i = 0; i < 3; i++) {
      const orbit = new T3.Group();
      g.add(orbit);
      orbit.position.y = 0.1;
      orbit.rotation.set(0.7 + i * 0.6, i * 0.8, 0.3 + i * 0.7);
      ring2(orbit, 1.2 + i * 0.12, 0.018, C3.gold, 0, 0, 0, true);
      const chip = box2(orbit, 0.3, 0.3, 0.12, [C3.dark, C3.blue, C3.orange][i]);
      for (let j = -1; j <= 1; j++) {
        box2(chip, 0.035, 0.06, 0.05, C3.gold, j * 0.075, 0.18);
        box2(chip, 0.035, 0.06, 0.05, C3.gold, j * 0.075, -0.18);
      }
      ticks.push((a) => {
        const q = a + i * tau3 / 3;
        chip.position.set(Math.cos(q) * (1.2 + i * 0.12), Math.sin(q) * (1.2 + i * 0.12), 0);
        chip.rotation.z = q;
      });
    }
    ticks.push((a) => {
      core.rotation.set(a / 1, 0.5 * Math.sin(a), a);
    });
  } else if (kind === "travel") {
    const globe = new T3.Group();
    g.add(globe);
    globe.position.y = 0.08;
    globe.rotation.z = -0.28;
    ball(globe, 0.83, C3.blue);
    for (let i = 0; i < 6; i++) {
      const r = ring2(globe, 0.85, 9e-3, C3.ivory);
      r.rotation.y = i * Math.PI / 6;
    }
    for (const latitude of [-0.5, 0, 0.5]) {
      const r = ring2(globe, Math.sqrt(0.85 ** 2 - latitude ** 2), 9e-3, C3.ivory, 0, latitude);
      r.rotation.x = Math.PI / 2;
    }
    const meridian = ring2(g, 1.08, 0.045, C3.gold, 0, 0.08, 0, true);
    meridian.rotation.y = 0.3;
    meridian.rotation.z = -0.28;
    rod3(g, v2(0, -1.41), v2(0, -1), C3.gold, 0.055);
    const orbit = new T3.Group();
    g.add(orbit);
    orbit.position.y = 0.08;
    orbit.rotation.set(0.6, -0.3, -0.35);
    ring2(orbit, 1.34, 0.014, C3.gold, 0, 0, 0, true);
    const flyer = plane(orbit, C3.ivory);
    flyer.scale.setScalar(0.53);
    ticks.push((a) => {
      globe.rotation.y = a;
      flyer.position.set(1.34 * Math.cos(a), 1.34 * Math.sin(a), 0);
      flyer.rotation.z = a;
    });
  } else if (kind === "tennis") {
    const r = racket(g, C3.gold, true);
    r.scale.setScalar(1.17);
    r.position.set(-0.34, 0.12, 0.12);
    r.rotation.set(0.15, -0.4, -0.4);
    const path2 = new T3.Group();
    g.add(path2);
    path2.rotation.set(0.65, -0.4, -0.35);
    path2.position.set(0.22, 0.35, 0.1);
    ring2(path2, 1.18, 0.012, C3.gold, 0, 0, 0, true);
    const b = ball(path2, 0.19, 14014838);
    ring2(b, 0.189, 8e-3, C3.ivory).rotation.y = Math.PI / 2;
    ticks.push((a) => {
      b.position.set(1.18 * Math.cos(a), 1.18 * Math.sin(a), 0);
      b.rotation.z = a * 2;
      r.rotation.y = -0.4 + 0.18 * Math.sin(a);
    });
    rod3(g, v2(-0.3, -1.4), v2(-0.3, -0.8), C3.gold, 0.035);
  } else if (kind === "server") {
    const tower = new T3.Group();
    g.add(tower);
    tower.rotation.set(0.4, -0.48, 0);
    for (let i = 0; i < 4; i++) {
      const layer = new T3.Group();
      tower.add(layer);
      box2(layer, 1.4, 0.1, 0.95, i % 2 ? C3.ivory : C3.dark);
      const fan = ring2(layer, 0.28, 0.024, C3.gold, 0, 0.09, 0, true);
      fan.rotation.x = -Math.PI / 2;
      for (let blade = 0; blade < 6; blade++) {
        const b = box2(fan, 0.12, 0.23, 0.025, C3.blue, Math.cos(blade * tau3 / 6) * 0.14, Math.sin(blade * tau3 / 6) * 0.14);
        b.rotation.z = blade * tau3 / 6 - 0.4;
      }
      for (const x of [-0.58, 0.58]) for (const z of [-0.36, 0.36]) ball(layer, 0.037, C3.gold, x, 0.08, z, true);
      ticks.push((a) => {
        layer.position.y = -0.91 + i * 0.61 + 0.075 * Math.sin(a + i * 0.65);
        fan.rotation.z = a * 2;
      });
    }
    for (const x of [-0.61, 0.61]) rod3(tower, v2(x, -1.3, -0.4), v2(x, 1.21, -0.4), C3.gold, 0.018);
    ticks.push((a) => tower.rotation.y = -0.48 + 0.12 * Math.sin(a));
  } else if (kind === "reading") {
    const book = new T3.Group();
    g.add(book);
    book.name = "kinetic-folio";
    book.rotation.set(0.32, -0.4, -0.15);
    book.position.y = 0.12;
    for (let i = 0; i < 13; i++) {
      const hinge = new T3.Group();
      book.add(hinge);
      hinge.rotation.y = -1.3 + i * 0.21;
      box2(hinge, 1.16, 1.59, 0.025, i === 0 || i === 12 ? C3.dark : C3.ivory, 0.59, 0, 0);
      if (i % 3 === 0 && i > 0 && i < 12) for (let j = 0; j < 7; j++) box2(hinge, 0.72, 0.012, 7e-3, C3.gold, 0.62, 0.49 - j * 0.15, 0.017);
      ticks.push((a) => hinge.rotation.y = -1.3 + i * 0.21 + 0.045 * Math.sin(a + i * 0.22));
    }
    rod3(book, v2(0, -0.91), v2(0, 0.91), C3.gold, 0.06);
    const ribbon = curve(g, [v2(-0.85, -1.03, 0.3), v2(-1.2, -0.4, 0.5), v2(-1.05, 0.5, 0.2), v2(-0.48, 1.3, -0.2), v2(0.58, 1.15, -0.4)], C3.gold, 0.022);
    ticks.push((a) => {
      book.rotation.y = -0.4 + a;
      book.rotation.z = -0.15 + 0.075 * Math.sin(a);
      ribbon.rotation.y = 0.15 * Math.sin(a);
    });
  } else {
    rod3(g, v2(0, -1.4), v2(0, 0.94), C3.gold, 0.045);
    ball(g, 0.09, C3.gold, 0, 0.94, 0, true);
    const beam = new T3.Group();
    g.add(beam);
    beam.position.y = 0.94;
    rod3(beam, v2(-1.2, 0), v2(1.2, 0), C3.gold, 0.037);
    for (const side of [-1, 1]) {
      const tray = new T3.Group();
      beam.add(tray);
      tray.position.x = side * 0.91;
      for (const x of [-0.37, 0.37]) rod3(tray, v2(0, 0), v2(x, -0.95), C3.gold, 0.012);
      const platter = add(tray, new T3.CylinderGeometry(0.48, 0.4, 0.08, 40), C3.ivory, 0, -1, 0);
      for (let i = 0; i < 3; i++) {
        const h = [0.32, 0.57, 0.43][i];
        box2(tray, 0.12, h, 0.12, side < 0 ? C3.blue : C3.orange, -0.22 + i * 0.22, -0.92 + h / 2, 0);
        rod3(tray, v2(-0.22 + i * 0.22, -0.91), v2(-0.22 + i * 0.22, -0.85 + h), C3.gold, 9e-3);
      }
      ticks.push((a) => {
        tray.rotation.z = -0.14 * Math.sin(a);
        platter.rotation.y = a;
      });
    }
    ticks.push((a) => beam.rotation.z = 0.14 * Math.sin(a));
  }
  ticks.push((a) => g.rotation.y = 0.18 + 0.12 * Math.sin(a));
  return g;
}
function createArtDirection(kind, palette, variant) {
  if (variant >= 3) return createExpandedDirection(kind, variant);
  const ticks = [];
  const g = variant === 1 ? paperWorld(kind, palette, ticks) : kineticWorld(kind, palette, ticks);
  g.userData.style = variant === 1 ? "paper-theatre" : "kinetic";
  g.userData.source = "procedural";
  g.userData.loopDuration = 12e3;
  g.userData.restTime = 1800;
  g.userData.animate = (time) => {
    const progress = (time % 12e3 + 12e3) % 12e3 / 12e3;
    for (const tick of ticks) tick(progress * tau3);
    g.userData.phase = variant === 1 ? "paper-parallax" : "kinetic-orbit";
    g.userData.pose = progress;
  };
  return g;
}

// src/objects/market.ts
var MARKET_BARS = 64;
var MARKET_BAR_MS = 480;
var MARKET_LOOP_MS = MARKET_BARS * MARKET_BAR_MS;
function marketBar(index, variant = 0) {
  const closeAt = (i) => {
    const t = (i % MARKET_BARS + MARKET_BARS) % MARKET_BARS * Math.PI * 2 / MARKET_BARS;
    return 100 + 1.65 * Math.sin(t + variant) + 0.65 * Math.sin(t * 7 + variant * 0.6) + 0.28 * Math.sin(t * 13);
  };
  const open = closeAt(index - 1), close = closeAt(index);
  const phase2 = (index % MARKET_BARS + MARKET_BARS) % MARKET_BARS;
  const high = Math.max(open, close) + 0.12 + 0.14 * (1 + Math.sin(phase2 * Math.PI / 8)) / 2;
  const low = Math.min(open, close) - 0.12 - 0.12 * (1 + Math.cos(phase2 * Math.PI / 8)) / 2;
  const volume = 120 + Math.abs(close - open) * 540 + 50 * (1 + Math.cos(phase2 * Math.PI / 4));
  return { open, high, low, close, volume };
}

// src/objects/scenes.ts
var DURATION = 5400;
var p = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
var ease = (x) => x * x * x * (x * (x * 6 - 15) + 10);
var mix = THREE.MathUtils.lerp;
var mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04 });
var mesh3 = (g, color, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(g, mat(color));
  m.position.set(x, y, z);
  return m;
};
function slab(w, h, d, color, x = 0, y = 0, z = 0, r = 0.06) {
  r = Math.min(r, w / 2, h / 2);
  const s = new THREE.Shape();
  const a = -w / 2, b = -h / 2;
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
    curveSegments: 8
  });
  g.translate(0, 0, -d / 2);
  return mesh3(g, color, x, y, z);
}
function line(points, color, opacity = 1) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      points.map((v3) => new THREE.Vector3(v3[0], v3[1], v3[2] ?? 0))
    ),
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  );
}
function tube(points, radius, color) {
  return mesh3(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      64,
      radius,
      8,
      false
    ),
    color
  );
}
function label(text, color, x, y, z, size = 0.16) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
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
      depthWrite: false
    })
  );
  m.position.set(x, y, z);
  return m;
}
function phase(g, t, name, pose) {
  g.userData.phase = t >= DURATION ? "rest" : name;
  g.userData.pose = pose;
}
function ai(c) {
  const g = new THREE.Group();
  g.rotation.set(0.22, -0.18, 0);
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
        0.015
      );
      key.rotation.x = -Math.PI / 2;
      g.add(key);
    }
  const trackpad = slab(0.65, 0.29, 0.01, c.paper, 0, -0.885, 0.93, 0.025);
  g.add(slab(2.2, 0.055, 0.06, c.ink, 0, -0.82, 0.035, 0.02));
  trackpad.rotation.x = -Math.PI / 2;
  g.add(trackpad);
  g.add(slab(2.72, 1.85, 0.13, c.ink, 0, 0.04, -0.1));
  g.add(slab(2.5, 1.61, 0.022, 1581869, 0, 0.04, -0.015));
  for (let i = 0; i < 3; i++)
    g.add(
      mesh3(
        new THREE.SphereGeometry(0.032, 12, 8),
        [15559268, 14989149, 7322248][i],
        -1.1 + i * 0.11,
        0.71,
        0.016
      )
    );
  g.add(label("AGENT / LOCAL", 10860989, 0.32, 0.71, 0.034, 0.11));
  const code = [];
  for (let row = 0; row < 7; row++) {
    const length = [0.92, 1.65, 1.26, 0.72, 1.42, 1.08, 0.58][row];
    const strip = slab(
      length,
      0.047,
      0.01,
      [7976685, 10933679, 14538685][row % 3],
      0,
      0.47 - row * 0.16,
      0.03,
      0.01
    );
    strip.userData.length = length;
    strip.userData.left = -1.06 + row % 3 * 0.12;
    code.push(strip);
    g.add(strip);
  }
  const cursor = slab(0.055, 0.12, 0.012, 12774107, 0, 0, 0.04, 0.01);
  g.add(cursor);
  const satellites = [-1, 1].map((side) => {
    const chip = new THREE.Group();
    chip.position.set(side * 1.65, 0.6, 0.2);
    chip.add(
      slab(0.72, 0.72, 0.12, c.paper),
      slab(0.58, 0.05, 0.018, c.accent, 0, -0.21, 0.08, 8e-3)
    );
    chip.add(label(side < 0 ? "</>" : "AI", c.ink, 0, 0.05, 0.09, 0.2));
    g.add(chip);
    return chip;
  });
  const paths = [-1, 1].map(
    (side) => new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 1.6, 0.27, 0.24),
      new THREE.Vector3(side * 1.65, -0.3, 0.3),
      new THREE.Vector3(side * 1.4, -0.5, 0.2),
      new THREE.Vector3(side * 1.06, -0.52, 0.1)
    ])
  );
  const packets = paths.map(() => {
    const m = mesh3(new THREE.SphereGeometry(0.075, 16, 12), c.accent);
    g.add(m);
    return m;
  });
  const result = new THREE.Group();
  result.add(
    slab(1.45, 0.37, 0.05, 2317127),
    label("TASK COMPLETE", 14808294, 0, 0, 0.06, 0.15)
  );
  result.position.set(0, -0.49, 0.16);
  g.add(result);
  g.userData.animate = (time) => {
    const t = Math.min(time, DURATION), typing = p(t, 100, 2700) * 7;
    code.forEach((strip, i) => {
      const f = ease(Math.max(0, Math.min(1, typing - i)));
      strip.visible = f > 0;
      strip.scale.x = Math.max(1e-3, f);
      strip.position.x = strip.userData.left + strip.userData.length * f / 2;
    });
    const row = Math.min(6, Math.floor(typing));
    cursor.position.set(
      code[row].position.x + code[row].userData.length * code[row].scale.x / 2 + 0.06,
      0.47 - row * 0.16,
      0.04
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
      packet.scale.setScalar(Math.max(1e-3, Math.sin(q * Math.PI)));
    });
    const done = ease(p(t, 4e3, 4700));
    result.scale.setScalar(Math.max(1e-3, done));
    phase(
      g,
      t,
      t < 700 ? "prompt" : t < 2100 ? "prompt-to-tools" : t < 2850 ? "tools" : t < 4250 ? "tools-to-check" : "check",
      p(t, 700, 4250)
    );
  };
  return g;
}
function contact(c) {
  const g = new THREE.Group();
  g.rotation.set(0.1, -0.2, -0.025);
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
            [0.24, 0.14, 0.13]
          ],
          c.accent
        ),
        line(
          [
            [-0.24, 0.14, 0.13],
            [-0.24, -0.15, 0.13],
            [0.24, -0.15, 0.13],
            [0.24, 0.14, 0.13]
          ],
          c.accent
        )
      );
    } else if (index === 1) {
      source.add(
        slab(0.48, 0.3, 0.018, c.accent, 0, 0.03, 0.13, 0.07),
        mesh3(
          new THREE.ConeGeometry(0.075, 0.15, 3),
          c.accent,
          -0.14,
          -0.18,
          0.13
        )
      );
    } else {
      source.add(
        mesh3(new THREE.TorusGeometry(0.2, 0.018, 8, 36), c.accent, 0, 0, 0.13),
        line(
          [
            [-0.2, 0, 0.135],
            [0.2, 0, 0.135]
          ],
          c.accent
        ),
        line(
          [
            [0, -0.2, 0.135],
            [0, 0.2, 0.135]
          ],
          c.accent
        )
      );
    }
    g.add(source);
    return source;
  });
  const inboxPoint = new THREE.Vector3(0.72, 0, 0.2);
  const routes = sourceY.map(
    (y) => new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.22, y, 0.08),
      new THREE.Vector3(-0.52, y * 0.82, 0.25),
      new THREE.Vector3(0.08, y * 0.35, 0.3),
      inboxPoint.clone()
    ])
  );
  routes.forEach((route) => g.add(tube(route.getPoints(32), 0.014, c.muted)));
  const packets = routes.map((route, index) => {
    const packet = mesh3(
      index === 1 ? new THREE.OctahedronGeometry(0.09) : index === 2 ? new THREE.BoxGeometry(0.14, 0.14, 0.14) : new THREE.SphereGeometry(0.085, 16, 12),
      c.accent
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
    label("INBOX", c.ink, 0, 0.53, 0.14, 0.15)
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
      0.025
    );
    inbox.add(receipt);
    return receipt;
  });
  const status = mesh3(
    new THREE.TorusGeometry(0.12, 0.027, 10, 40),
    c.accent,
    0.43,
    0.53,
    0.14
  );
  inbox.add(status);
  g.add(inbox);
  g.userData.contact = { inboxPoint, routes, packets, receipts };
  g.userData.animate = (time) => {
    const t = Math.min(time, DURATION);
    sources.forEach((source, index) => {
      const enter = ease(p(t, 120 + index * 140, 780 + index * 140));
      source.position.x = mix(-1.9, -1.62, enter);
      source.rotation.z = (index - 1) * 0.055 * (1 - enter);
    });
    packets.forEach((packet, index) => {
      const travel2 = ease(p(t, 700 + index * 430, 2750 + index * 430));
      packet.position.copy(routes[index].getPoint(travel2));
      packet.rotation.z = travel2 * Math.PI * 2;
      packet.scale.setScalar(Math.max(1e-3, Math.sin(travel2 * Math.PI)));
      const received = ease(p(t, 2600 + index * 430, 3300 + index * 430));
      receipts[index].scale.x = Math.max(1e-3, received);
      receipts[index].position.x = mix(-0.18, 0, received);
    });
    const acknowledge = ease(p(t, 3900, 4750));
    status.scale.setScalar(Math.max(1e-3, acknowledge));
    status.rotation.z = mix(-Math.PI, 0, acknowledge);
    inbox.position.y = 0.035 * Math.sin(p(t, 3900, 4750) * Math.PI);
    phase(
      g,
      t,
      t < 900 ? "open-channels" : t < 3650 ? "route-signals" : t < 4750 ? "collect-messages" : "contact-ready",
      p(t, 700, 4750)
    );
  };
  return g;
}
async function tennis(_c, variant = 0) {
  const [{ GLTFLoader }, { default: encoded }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("./tennis-asset-WGSCT2NA.js")
  ]);
  const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  const model = await new GLTFLoader().parseAsync(bytes.buffer, "");
  const g = new THREE.Group();
  g.rotation.set(0.64, -0.25, 0);
  g.position.y = 0.1;
  model.scene.scale.setScalar(0.69);
  model.scene.position.y = -0.65;
  g.add(model.scene);
  const colors = [
    { Court: 3303e3, "Court stripe": 3698270, "Court surround": 2640963, Jersey: 15657435, "Kit accent": 2577226, Shorts: 2637384 },
    { Court: 10903107, "Court stripe": 11363657, "Court surround": 7357492, Jersey: 15130060, "Kit accent": 7226680, Shorts: 5718070 },
    { Court: 4483977, "Court stripe": 4944529, "Court surround": 3164504, Jersey: 14018531, "Kit accent": 2381389, Shorts: 2112842 }
  ][variant];
  model.scene.traverse((item) => {
    const m = item;
    if (!m.isMesh) return;
    m.castShadow = !m.name.startsWith("Court");
    m.receiveShadow = true;
    for (const material2 of Array.isArray(m.material) ? m.material : [m.material]) {
      const color = colors[material2.name];
      if (color !== void 0) material2.color.setHex(color);
    }
  });
  const mixer = new THREE.AnimationMixer(model.scene);
  model.animations.forEach((clip) => mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play());
  const ball2 = model.scene.getObjectByName("Tennis_ball");
  const racket2 = model.scene.getObjectByName("Racket");
  g.userData.source = "blender";
  g.userData.contactTime = 1900;
  g.userData.contactTimes = [1900, 4900];
  g.userData.rackets = [racket2, model.scene.getObjectByName("Far_Racket")];
  g.userData.loopDuration = 6e3;
  g.userData.restTime = 1900;
  g.userData.ball = ball2;
  g.userData.racket = racket2;
  g.userData.racketContact = new THREE.Vector3(0, 0.63, 0);
  g.userData.dispose = () => {
    mixer.stopAllAction();
    mixer.uncacheRoot(model.scene);
  };
  g.userData.animate = (time) => {
    const t = (time % 6e3 + 6e3) % 6e3;
    mixer.setTime(t / 1e3);
    g.userData.phase = t < 1900 || t >= 4900 ? "near-return" : "far-return";
    g.userData.pose = t / 6e3;
  };
  return g;
}
function trading(c, variant = 0) {
  const g = new THREE.Group();
  g.rotation.set(0.06, -0.19, 0);
  const casing = slab(4.08, 2.62, 0.16, 2502712, 0, 0.26, 0, 0.055);
  casing.material.metalness = 0.45;
  casing.material.roughness = 0.4;
  g.add(casing, slab(0.32, 0.6, 0.18, 3161413, 0, -1.18, -0.04, 0.035));
  const foot = slab(1.38, 0.5, 0.095, 3950929, 0, -1.51, 0.16, 0.065);
  foot.rotation.x = -Math.PI / 2;
  g.add(foot);
  g.add(label("MARKET STUDY", 9018271, 0, -0.94, 0.1, 0.075));
  g.add(mesh3(new THREE.SphereGeometry(0.019, 12, 8), 5357478, 1.8, -0.94, 0.105));
  const canvas = document.createElement("canvas");
  canvas.width = 1056;
  canvas.height = 620;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const display = new THREE.Mesh(new THREE.PlaneGeometry(3.82, 2.24), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
  display.position.set(0, 0.34, 0.12);
  g.add(display);
  const green = "#32c99a", red = "#ee6972";
  const left = 38, right = 958, top = 108, bottom = 422, volumeBottom = 543;
  const step = (right - left) / 24;
  const priceY = (value) => bottom - (value - 96.5) / 7 * (bottom - top);
  const stroke = (x1, y1, x2, y2, color, width = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  g.userData.loopDuration = MARKET_LOOP_MS;
  g.userData.restTime = 3600;
  g.userData.marketBar = (index) => marketBar(index, variant);
  g.userData.animate = (time) => {
    const t = (time % MARKET_LOOP_MS + MARKET_LOOP_MS) % MARKET_LOOP_MS;
    const offset = Math.max(0, time) / MARKET_BAR_MS, first = Math.floor(offset), fraction = offset - first;
    ctx.fillStyle = "#111a22";
    ctx.fillRect(0, 0, 1056, 620);
    ctx.textAlign = "left";
    ctx.font = "600 23px monospace";
    ctx.fillStyle = "#e5ebee";
    ctx.fillText("DEMO / USD", 30, 39);
    ctx.font = "15px monospace";
    ctx.fillStyle = "#91a4b0";
    ctx.fillText("1m  \xB7  OHLC + VOLUME", 30, 70);
    ctx.textAlign = "right";
    ctx.fillStyle = "#c2ced4";
    ctx.fillText("SIMULATED \xB7 REPEATING STUDY", 1026, 39);
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
      const bar = marketBar(i, variant), x = left + (i - first - fraction + 0.5) * step;
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
    for (let i = first; i <= first + 24; i++) if (i % 4 === 0) {
      const x = left + (i - first - fraction + 0.5) * step;
      if (x >= left && x <= right - 40) {
        const minute = (570 + i) % 1440;
        ctx.fillText(String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0"), x - 12, 569);
      }
    }
    ctx.fillStyle = "#6f8695";
    ctx.font = "13px monospace";
    ctx.fillText("Illustrative prices \xB7 fixed USD scale \xB7 no live feed", left, 603);
    texture.needsUpdate = true;
    g.userData.phase = "market-pan";
    g.userData.pose = t / MARKET_LOOP_MS;
    g.userData.scroll = offset;
  };
  return g;
}
function server(c) {
  const g = new THREE.Group();
  g.rotation.set(0.24, -0.46, -0.035);
  const alloy = 7636363, graphite = 2568505;
  const metal = (w, h, d, color, x = 0, y = 0, z = 0) => {
    const part = slab(w, h, d, color, x, y, z, 0.025);
    part.material.metalness = 0.48;
    part.material.roughness = 0.38;
    return part;
  };
  g.add(metal(3.08, 0.11, 1.55, graphite, 0, -1.3), metal(3.08, 0.08, 1.55, alloy, 0, 1.3));
  for (const x of [-1.43, 1.43]) for (const z of [-0.66, 0.66]) {
    g.add(metal(0.09, 2.55, 0.09, alloy, x, 0, z));
    if (z > 0) for (let n = 0; n < 13; n++) g.add(mesh3(new THREE.BoxGeometry(0.034, 0.047, 8e-3), graphite, x, -1.1 + n * 0.18, z + 0.051));
  }
  const trays = [], fans = [], lamps = [];
  for (let i = 0; i < 3; i++) {
    const tray = new THREE.Group();
    tray.position.y = 0.82 - i * 0.82;
    tray.add(metal(2.7, 0.61, 1.18, graphite), metal(2.69, 0.58, 0.035, i === 1 ? c.accent : alloy, 0, 0, 0.607));
    for (const x of [-1.2, 1.2]) {
      tray.add(metal(0.04, 0.35, 0.1, 12766410, x, 0, 0.7));
      for (const y of [-0.22, 0.22]) {
        const screw = mesh3(new THREE.CylinderGeometry(0.027, 0.027, 0.013, 10), 13554379, x, y, 0.647);
        screw.rotation.x = Math.PI / 2;
        tray.add(screw);
      }
    }
    if (i === 0) {
      for (let n = 0; n < 6; n++) {
        const x = -0.88 + n * 0.3;
        tray.add(metal(0.25, 0.37, 0.05, graphite, x, 0, 0.665), metal(0.17, 0.024, 0.01, 11056565, x, -0.1, 0.7));
        const lamp = mesh3(new THREE.SphereGeometry(0.018, 8, 6), c.accent, x + 0.06, 0.11, 0.704);
        lamps.push(lamp);
        tray.add(lamp);
      }
    } else if (i === 1) {
      for (const x of [-0.7, 0, 0.7]) {
        tray.add(mesh3(new THREE.TorusGeometry(0.2, 0.025, 8, 32), graphite, x, 0, 0.662));
        const fan = new THREE.Group();
        fan.position.set(x, 0, 0.674);
        for (let blade = 0; blade < 7; blade++) {
          const vane = slab(0.073, 0.135, 0.014, 2504767, 0, 0.105, 0, 0.026);
          const pivot = new THREE.Group();
          pivot.rotation.z = blade * Math.PI * 2 / 7;
          pivot.add(vane);
          fan.add(pivot);
        }
        const hub = mesh3(new THREE.CylinderGeometry(0.054, 0.054, 0.022, 16), alloy);
        hub.rotation.x = Math.PI / 2;
        fan.add(hub);
        fans.push(fan);
        tray.add(fan);
        for (let n = -2; n <= 2; n++) tray.add(line([[-0.17 + x, n * 0.064, 0.703], [0.17 + x, n * 0.064, 0.703]], 11057334, 0.65));
      }
    } else {
      for (let n = 0; n < 8; n++) {
        const x = -0.91 + n * 0.26;
        tray.add(metal(0.18, 0.15, 0.025, graphite, x, 0.04, 0.654));
        for (let k = 0; k < 3; k++) tray.add(mesh3(new THREE.BoxGeometry(0.016, 0.042, 8e-3), 12823664, x - 0.045 + k * 0.045, 0.075, 0.676));
      }
      for (let n = 0; n < 2; n++) {
        const wire = tube([new THREE.Vector3(-0.78 + n * 0.75, 0.02, 0.7), new THREE.Vector3(-0.78 + n * 0.75, -0.23, 0.95), new THREE.Vector3(-0.34 + n * 0.75, -0.23, 0.95), new THREE.Vector3(-0.39 + n * 0.75, 0.02, 0.7)], 0.024, n ? 12423526 : c.accent);
        tray.add(wire);
      }
    }
    trays.push(tray);
    g.add(tray);
  }
  g.add(label("INFERENCE / STUDY", c.ink, 0, -1.59, 0.3, 0.17));
  g.userData.animate = (time) => {
    const t = Math.min(time, DURATION);
    trays.forEach((tray, i) => {
      const q = ease(p(t, 180 + i * 650, 1500 + i * 650));
      tray.position.z = mix(1, 0, q);
      tray.position.x = mix(i % 2 ? -0.3 : 0.3, 0, q);
    });
    const power = ease(p(t, 2800, 4200));
    fans.forEach((fan, i) => fan.rotation.z = power * (Math.PI * 3 + i * 0.35));
    lamps.forEach((lamp) => {
      const material2 = lamp.material;
      material2.emissive.setHex(c.accent);
      material2.emissiveIntensity = 0.7 * power;
    });
    phase(g, t, t < 1500 ? "place-chassis" : t < 2450 ? "place-compute" : t < 3550 ? "place-memory" : "bandwidth-check", p(t, 180, 4200));
  };
  return g;
}
function travel(c, variant = 0) {
  const g = new THREE.Group();
  g.rotation.set(0.38, -0.24, -0.1);
  const atlas = document.createElement("canvas");
  atlas.width = 1536;
  atlas.height = 1024;
  const ctx = atlas.getContext("2d");
  const looks = [{ land: "#e8e8cd", contour: "#a0b692", water: "#9cbdc1", park: "#c6d1ad" }, { land: "#ede7d2", contour: "#b2b59b", water: "#94bdcf", park: "#c5d2b7" }, { land: "#ecdcc6", contour: "#c6ab89", water: "#adc4c0", park: "#d6c59d" }];
  const look = looks[variant];
  ctx.fillStyle = look.land;
  ctx.fillRect(0, 0, 1536, 1024);
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
  for (let row = 0; row < 6; row++) for (let col = 0; col < 9; col++) {
    const x = 90 + col * 146 + Math.sin(row * 2 + col) * 24, y = 120 + row * 142;
    ctx.fillStyle = (row + col) % 4 === 0 ? look.park : "#f3efdc";
    ctx.fillRect(x, y, 58 + col % 3 * 16, 45 + row % 2 * 22);
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
  const folds = [];
  for (let i = 0; i < 3; i++) {
    const fold = new THREE.Group();
    fold.position.x = i === 0 ? -0.615 : i === 2 ? 0.615 : 0;
    const center = i === 0 ? -0.615 : i === 2 ? 0.615 : 0;
    fold.add(slab(1.23, 2.45, 0.013, c.paper, center, 0, 0, 8e-3));
    const geometry = new THREE.PlaneGeometry(1.23, 2.45);
    const uv = geometry.attributes.uv;
    for (let n = 0; n < uv.count; n++) uv.setX(n, (uv.getX(n) + i) / 3);
    const surface = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.96 }));
    surface.position.set(center, 0, 0.029);
    fold.add(surface);
    folds.push(fold);
    g.add(fold);
  }
  const paths = [
    [[-1.51, -0.69], [-0.91, -0.4], [-0.45, 0.27], [0.22, 0.47], [0.78, 0.26], [1.48, 0.76]],
    [[-1.48, -0.76], [-0.92, -0.1], [-0.32, -0.24], [0.27, 0.34], [0.76, 0.74], [1.45, 0.62]],
    [[-1.5, -0.58], [-1, 0.13], [-0.48, 0.62], [0.1, 0.27], [0.71, 0.51], [1.45, 0.81]]
  ];
  const curve2 = new THREE.CatmullRomCurve3(paths[variant].map(([x, y]) => new THREE.Vector3(x, y, 0.075)));
  const route = mesh3(new THREE.TubeGeometry(curve2, 128, 0.019, 8, false), c.accent);
  g.add(route);
  const pin = new THREE.Group();
  pin.add(mesh3(new THREE.SphereGeometry(0.085, 20, 12), c.accent, 0, 0, 0.23));
  const needle = mesh3(new THREE.CylinderGeometry(0.014, 0.014, 0.21, 8), 6380880, 0, 0, 0.105);
  needle.rotation.x = Math.PI / 2;
  pin.add(needle);
  g.add(pin);
  const ring3 = mesh3(new THREE.TorusGeometry(0.095, 0.012, 8, 32), c.accent);
  ring3.position.copy(curve2.getPointAt(0));
  g.add(ring3);
  const compass = new THREE.Group();
  compass.position.set(-1.49, 0.88, 0.05);
  compass.add(mesh3(new THREE.TorusGeometry(0.14, 7e-3, 6, 32), 6845542));
  const north = mesh3(new THREE.ConeGeometry(0.042, 0.21, 3), c.accent, 0, 0.015, 0.015);
  compass.add(north);
  g.add(compass);
  const count = route.geometry.index.count;
  g.userData.mapFolds = folds;
  g.userData.animate = (time) => {
    const t = Math.min(time, DURATION), open = ease(p(t, 200, 1600)), draw = ease(p(t, 1700, 4650));
    folds[0].rotation.y = mix(1.05, 0, open);
    folds[2].rotation.y = mix(-1.05, 0, open);
    route.geometry.setDrawRange(0, Math.floor(draw * count / 3) * 3);
    route.visible = pin.visible = ring3.visible = t >= 1700;
    compass.visible = t >= 1600;
    pin.position.copy(curve2.getPointAt(draw));
    phase(g, t, t < 1600 ? "unfold-map" : t < 4650 ? "draw-route" : "arrive", draw);
  };
  return g;
}
function reading(c) {
  const g = new THREE.Group();
  g.rotation.set(0.56, -0.3, -0.13);
  const width = 1.46, height = 2.12;
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
        side * width / 2,
        0,
        -0.13,
        0.035
      )
    );
    for (let leaf = 8; leaf >= 0; leaf--) {
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
            [side * (width - 0.025), -height / 2, -0.09 + i * 0.025]
          ],
          c.muted,
          0.46
        )
      );
    for (let row = 0; row < 11; row++) {
      const start = 0.2, end = width - 0.16 - row % 4 * 0.055;
      half.add(line(Array.from({ length: 17 }, (_, step) => {
        const u = mix(start, end, step / 16);
        return [side * u, 0.64 - row * 0.145, 0.07 + 0.025 * Math.sin(u / width * Math.PI) - 0.06 * u];
      }), c.muted, 0.65));
    }
    half.add(label(side < 0 ? "FIELD NOTES" : "ON ATTENTION", c.ink, side * 0.77, 0.85, 0.045, 0.1));
    for (let edge = 0; edge < 4; edge++)
      half.add(line([[side * (width - 4e-3), -height / 2 + 0.04, -0.06 + edge * 0.022], [side * (width - 4e-3), height / 2 - 0.04, -0.06 + edge * 0.022]], c.muted, 0.28));
    g.add(half);
    return half;
  });
  const spine = mesh3(
    new THREE.CylinderGeometry(0.072, 0.072, height + 0.14, 20),
    c.accent,
    0,
    0,
    -0.08
  );
  g.add(spine);
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 256;
  textureCanvas.height = 512;
  const ctx = textureCanvas.getContext("2d");
  ctx.fillStyle = "#" + new THREE.Color(c.paper).getHexString();
  ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = "#6b7064";
  ctx.font = "500 16px serif";
  ctx.fillText("On attention", 30, 52);
  for (let row = 0; row < 14; row++)
    ctx.fillRect(30, 86 + row * 25, 186 - row % 5 * 13, 2);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.PlaneGeometry(width, height, 40, 8);
  geometry.translate(width / 2, 0, 0);
  const page = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, side: THREE.FrontSide, roughness: 0.96 }));
  const reverseTexture = texture.clone();
  reverseTexture.repeat.x = -1;
  reverseTexture.offset.x = 1;
  reverseTexture.needsUpdate = true;
  const reverse = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: reverseTexture, side: THREE.BackSide, roughness: 0.96 }));
  g.add(page, reverse);
  g.userData.pageGeometry = geometry;
  const positions = geometry.attributes.position, original = Float32Array.from(positions.array);
  const ribbon = slab(0.11, 0.48, 0.012, 11949896, 0.67, -1.04, -0.11, 5e-3);
  g.add(ribbon);
  g.userData.animate = (time) => {
    const t = Math.min(time, DURATION), q = ease(p(t, 750, 4050)), theta = Math.PI * q;
    for (let i = 0; i < positions.count; i++) {
      const u = original[i * 3], v3 = original[i * 3 + 1];
      const curl = 0.62 * Math.sin(theta), segments = 12;
      let x = 0, z = 0;
      for (let n = 0; n < segments; n++) {
        const along = u * (n + 0.5) / segments;
        const angle = theta + curl * Math.sin(along / width * Math.PI) - 0.18 * Math.cos(theta);
        x += Math.cos(angle) * u / segments;
        z += Math.sin(angle) * u / segments;
      }
      positions.setXYZ(i, x + 0.045 * Math.cos(theta), v3 + 0.025 * Math.sin(theta) * u / width, 0.11 + z);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    halves[0].rotation.y = -0.12;
    halves[1].rotation.y = 0.12;
    phase(
      g,
      t,
      t < 750 ? "open-book" : t < 1500 ? "lift-page" : t < 4050 ? "turn-page" : "settle-page",
      q
    );
  };
  return g;
}
var builders = {
  ai,
  contact,
  tennis,
  trading,
  server,
  travel,
  reading
};
async function createObject(kind, palette, variant = 0, edition = 0) {
  var _a;
  const finish = kind === "contact" ? variant % 3 : edition;
  const accent = kind === "reading" ? [palette.accent, 7945795, 3164775][finish] : [palette.accent, 4619160, 10512718][finish];
  const object = kind === "contact" && (variant === 3 || variant === 4) ? createContactDirection(variant) : kind !== "contact" && variant !== 0 ? createArtDirection(kind, palette, variant) : await builders[kind]({ ...palette, accent }, finish);
  (_a = object.userData).style ?? (_a.style = "studio");
  object.userData.variant = variant;
  object.userData.animate(0);
  return object;
}
function disposeObject(scene) {
  scene.traverse((item) => item.userData.dispose?.());
  const geometries = /* @__PURE__ */ new Set(), materials = /* @__PURE__ */ new Set(), textures = /* @__PURE__ */ new Set();
  scene.traverse((item) => {
    const m = item;
    if (m.geometry) geometries.add(m.geometry);
    if (m.material)
      for (const a of Array.isArray(m.material) ? m.material : [m.material]) {
        materials.add(a);
        const map = a.map;
        if (map) textures.add(map);
      }
  });
  textures.forEach((t) => t.dispose());
  materials.forEach((m) => m.dispose());
  geometries.forEach((g) => g.dispose());
}
export {
  DURATION,
  builders,
  createObject,
  disposeObject
};
//# sourceMappingURL=scenes-NWREIWPC.js.map