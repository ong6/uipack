"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/objects/contact-directions.ts
function mesh(g, geo, color, x = 0, y = 0, z = 0, metal = false) {
  const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color, roughness: metal ? 0.28 : 0.65, metalness: metal ? 0.65 : 0.02 }));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}
function box(g, w, h, d, color, x = 0, y = 0, z = 0) {
  return mesh(g, new import_RoundedBoxGeometry.RoundedBoxGeometry(w, h, d, 2, Math.min(0.09, w / 4, h / 4, d / 4)), color, x, y, z);
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
  if (variant === 3) g.userData.narrowFrame = { halfWidth: 1.9, halfHeight: 1.5, y: -0.15 };
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
var T, import_RoundedBoxGeometry, C, tau, v;
var init_contact_directions = __esm({
  "src/objects/contact-directions.ts"() {
    "use strict";
    T = __toESM(require("three"), 1);
    import_RoundedBoxGeometry = require("three/addons/geometries/RoundedBoxGeometry.js");
    C = { cream: 16181706, coral: 15301725, blue: 6920109, green: 9155483, dark: 2703177, gold: 12490332 };
    tau = Math.PI * 2;
    v = (x, y, z = 0) => new T.Vector3(x, y, z);
  }
});

// src/objects/expanded-directions.ts
function mesh2(parent, geo, material2, x = 0, y = 0, z = 0) {
  const m = new T2.Mesh(geo, typeof material2 === "number" ? standard(material2) : material2);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function block(parent, w, h, d, material2, x = 0, y = 0, z = 0, radius = 0.055) {
  return mesh2(parent, new import_RoundedBoxGeometry2.RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)), material2, x, y, z);
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
var T2, import_RoundedBoxGeometry2, tau2, V, C2, standard;
var init_expanded_directions = __esm({
  "src/objects/expanded-directions.ts"() {
    "use strict";
    T2 = __toESM(require("three"), 1);
    import_RoundedBoxGeometry2 = require("three/addons/geometries/RoundedBoxGeometry.js");
    tau2 = Math.PI * 2;
    V = (x, y, z = 0) => new T2.Vector3(x, y, z);
    C2 = { cream: 15983547, coral: 15497563, blue: 6331070, mint: 8436128, ink: 2504523, gold: 12884824, white: 16446953 };
    standard = (color, roughness = 0.68, metalness = 0.04) => new T2.MeshStandardMaterial({ color, roughness, metalness });
  }
});

// src/objects/art-directions.ts
function add(g, geometry, color, x = 0, y = 0, z = 0, metal = false) {
  const m = new T3.Mesh(geometry, material(color, metal));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}
function box2(g, w, h, d, color, x = 0, y = 0, z = 0) {
  return add(g, new import_RoundedBoxGeometry3.RoundedBoxGeometry(w, h, d, 1, Math.min(0.018, w / 4, h / 4, d / 4)), color, x, y, z);
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
var T3, import_RoundedBoxGeometry3, directionTokens, tau3, material, v2;
var init_art_directions = __esm({
  "src/objects/art-directions.ts"() {
    "use strict";
    T3 = __toESM(require("three"), 1);
    import_RoundedBoxGeometry3 = require("three/addons/geometries/RoundedBoxGeometry.js");
    init_expanded_directions();
    directionTokens = {
      paper: { cream: 16771261, peach: 15311480, coral: 12473919, blue: 5799313, teal: 3567208, ink: 3423825 },
      kinetic: { ivory: 15984588, gold: 12357970, dark: 2504777, blue: 6654873, orange: 12676166 }
    };
    tau3 = Math.PI * 2;
    material = (color, metal = false) => new T3.MeshStandardMaterial({ color, roughness: metal ? 0.3 : 0.87, metalness: metal ? 0.55 : 0.02 });
    v2 = (x, y, z = 0) => new T3.Vector3(x, y, z);
  }
});

// src/objects/market.ts
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
var MARKET_BARS, MARKET_BAR_MS, MARKET_LOOP_MS;
var init_market = __esm({
  "src/objects/market.ts"() {
    "use strict";
    MARKET_BARS = 64;
    MARKET_BAR_MS = 480;
    MARKET_LOOP_MS = MARKET_BARS * MARKET_BAR_MS;
  }
});

// src/package-assets.ts
function tennisModelUrl() {
  return new URL("../assets/objects/tennis-return.glb", import_meta.url).href;
}
var import_meta;
var init_package_assets = __esm({
  "src/package-assets.ts"() {
    "use strict";
    import_meta = {};
  }
});

// src/objects/scenes.ts
var scenes_exports = {};
__export(scenes_exports, {
  DURATION: () => DURATION,
  builders: () => builders,
  createObject: () => createObject,
  disposeObject: () => disposeObject
});
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
    new THREE.BufferGeometry().setFromPoints(points.map((v3) => new THREE.Vector3(v3[0], v3[1], v3[2] ?? 0))),
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  );
}
function tube(points, radius, color) {
  return mesh3(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, radius, 8, false), color);
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
      const key = slab(0.18, 0.09, 0.018, c.ink, -0.98 + col * 0.215, -0.88, 0.18 + row * 0.13, 0.015);
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
    g.add(mesh3(new THREE.SphereGeometry(0.032, 12, 8), [15559268, 14989149, 7322248][i], -1.1 + i * 0.11, 0.71, 0.016));
  g.add(label("AGENT / LOCAL", 10860989, 0.32, 0.71, 0.034, 0.11));
  const code = [];
  for (let row = 0; row < 7; row++) {
    const length = [0.92, 1.65, 1.26, 0.72, 1.42, 1.08, 0.58][row];
    const strip = slab(length, 0.047, 0.01, [7976685, 10933679, 14538685][row % 3], 0, 0.47 - row * 0.16, 0.03, 0.01);
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
    chip.add(slab(0.72, 0.72, 0.12, c.paper), slab(0.58, 0.05, 0.018, c.accent, 0, -0.21, 0.08, 8e-3));
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
  result.add(slab(1.45, 0.37, 0.05, 2317127), label("TASK COMPLETE", 14808294, 0, 0, 0.06, 0.15));
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
        mesh3(new THREE.ConeGeometry(0.075, 0.15, 3), c.accent, -0.14, -0.18, 0.13)
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
    const receipt = slab(0.72, 0.18, 0.025, c.paper, 0, -0.25 + index * 0.14, 0.34, 0.025);
    inbox.add(receipt);
    return receipt;
  });
  const status = mesh3(new THREE.TorusGeometry(0.12, 0.027, 10, 40), c.accent, 0.43, 0.53, 0.14);
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
async function tennis(_c, variant = 0, modelUrl) {
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const model = await new GLTFLoader().loadAsync(modelUrl ?? tennisModelUrl());
  const g = new THREE.Group();
  g.rotation.set(0.64, -0.25, 0);
  g.position.y = 0.1;
  model.scene.scale.setScalar(0.69);
  model.scene.position.y = -0.65;
  g.add(model.scene);
  const colors = [
    {
      Court: 3303e3,
      "Court stripe": 3698270,
      "Court surround": 2640963,
      Jersey: 15657435,
      "Kit accent": 2577226,
      Shorts: 2637384
    },
    {
      Court: 10903107,
      "Court stripe": 11363657,
      "Court surround": 7357492,
      Jersey: 15130060,
      "Kit accent": 7226680,
      Shorts: 5718070
    },
    {
      Court: 4483977,
      "Court stripe": 4944529,
      "Court surround": 3164504,
      Jersey: 14018531,
      "Kit accent": 2381389,
      Shorts: 2112842
    }
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
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(3.82, 2.24),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
  );
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
    for (let i = first; i <= first + 24; i++)
      if (i % 4 === 0) {
        const x = left + (i - first - fraction + 0.5) * step;
        if (x >= left && x <= right - 40) {
          const minute = (570 + i) % 1440;
          ctx.fillText(
            String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0"),
            x - 12,
            569
          );
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
  for (const x of [-1.43, 1.43])
    for (const z of [-0.66, 0.66]) {
      g.add(metal(0.09, 2.55, 0.09, alloy, x, 0, z));
      if (z > 0)
        for (let n = 0; n < 13; n++)
          g.add(mesh3(new THREE.BoxGeometry(0.034, 0.047, 8e-3), graphite, x, -1.1 + n * 0.18, z + 0.051));
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
        for (let n = -2; n <= 2; n++)
          tray.add(
            line(
              [
                [-0.17 + x, n * 0.064, 0.703],
                [0.17 + x, n * 0.064, 0.703]
              ],
              11057334,
              0.65
            )
          );
      }
    } else {
      for (let n = 0; n < 8; n++) {
        const x = -0.91 + n * 0.26;
        tray.add(metal(0.18, 0.15, 0.025, graphite, x, 0.04, 0.654));
        for (let k = 0; k < 3; k++)
          tray.add(mesh3(new THREE.BoxGeometry(0.016, 0.042, 8e-3), 12823664, x - 0.045 + k * 0.045, 0.075, 0.676));
      }
      for (let n = 0; n < 2; n++) {
        const wire = tube(
          [
            new THREE.Vector3(-0.78 + n * 0.75, 0.02, 0.7),
            new THREE.Vector3(-0.78 + n * 0.75, -0.23, 0.95),
            new THREE.Vector3(-0.34 + n * 0.75, -0.23, 0.95),
            new THREE.Vector3(-0.39 + n * 0.75, 0.02, 0.7)
          ],
          0.024,
          n ? 12423526 : c.accent
        );
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
    phase(
      g,
      t,
      t < 1500 ? "place-chassis" : t < 2450 ? "place-compute" : t < 3550 ? "place-memory" : "bandwidth-check",
      p(t, 180, 4200)
    );
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
  const looks = [
    { land: "#e8e8cd", contour: "#a0b692", water: "#9cbdc1", park: "#c6d1ad" },
    { land: "#ede7d2", contour: "#b2b59b", water: "#94bdcf", park: "#c5d2b7" },
    { land: "#ecdcc6", contour: "#c6ab89", water: "#adc4c0", park: "#d6c59d" }
  ];
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
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 9; col++) {
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
    [
      [-1.51, -0.69],
      [-0.91, -0.4],
      [-0.45, 0.27],
      [0.22, 0.47],
      [0.78, 0.26],
      [1.48, 0.76]
    ],
    [
      [-1.48, -0.76],
      [-0.92, -0.1],
      [-0.32, -0.24],
      [0.27, 0.34],
      [0.76, 0.74],
      [1.45, 0.62]
    ],
    [
      [-1.5, -0.58],
      [-1, 0.13],
      [-0.48, 0.62],
      [0.1, 0.27],
      [0.71, 0.51],
      [1.45, 0.81]
    ]
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
    half.add(slab(width + 0.11, height + 0.13, 0.065, c.accent, side * width / 2, 0, -0.13, 0.035));
    for (let leaf = 8; leaf >= 0; leaf--) {
      const sheet = new THREE.PlaneGeometry(width, height, 32, 1);
      const vertices = sheet.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const u = vertices.getX(i) + width / 2;
        vertices.setXYZ(i, side * u, vertices.getY(i), 0.065 + 0.025 * Math.sin(u / width * Math.PI) - 0.06 * u - leaf * 0.011);
      }
      sheet.computeVertexNormals();
      half.add(
        new THREE.Mesh(sheet, new THREE.MeshStandardMaterial({ color: c.paper, roughness: 0.96, side: THREE.DoubleSide }))
      );
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
      half.add(
        line(
          Array.from({ length: 17 }, (_, step) => {
            const u = mix(start, end, step / 16);
            return [side * u, 0.64 - row * 0.145, 0.07 + 0.025 * Math.sin(u / width * Math.PI) - 0.06 * u];
          }),
          c.muted,
          0.65
        )
      );
    }
    half.add(label(side < 0 ? "FIELD NOTES" : "ON ATTENTION", c.ink, side * 0.77, 0.85, 0.045, 0.1));
    for (let edge = 0; edge < 4; edge++)
      half.add(
        line(
          [
            [side * (width - 4e-3), -height / 2 + 0.04, -0.06 + edge * 0.022],
            [side * (width - 4e-3), height / 2 - 0.04, -0.06 + edge * 0.022]
          ],
          c.muted,
          0.28
        )
      );
    g.add(half);
    return half;
  });
  const spine = mesh3(new THREE.CylinderGeometry(0.072, 0.072, height + 0.14, 20), c.accent, 0, 0, -0.08);
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
  for (let row = 0; row < 14; row++) ctx.fillRect(30, 86 + row * 25, 186 - row % 5 * 13, 2);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.PlaneGeometry(width, height, 40, 8);
  geometry.translate(width / 2, 0, 0);
  const page = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, side: THREE.FrontSide, roughness: 0.96 }));
  const reverseTexture = texture.clone();
  reverseTexture.repeat.x = -1;
  reverseTexture.offset.x = 1;
  reverseTexture.needsUpdate = true;
  const reverse = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ map: reverseTexture, side: THREE.BackSide, roughness: 0.96 })
  );
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
    phase(g, t, t < 750 ? "open-book" : t < 1500 ? "lift-page" : t < 4050 ? "turn-page" : "settle-page", q);
  };
  return g;
}
async function createObject(kind, palette, variant = 0, edition = 0, modelUrl) {
  var _a;
  const finish = kind === "contact" ? variant % 3 : edition;
  const accent = kind === "reading" ? [palette.accent, 7945795, 3164775][finish] : [palette.accent, 4619160, 10512718][finish];
  const object = kind === "contact" && (variant === 3 || variant === 4) ? createContactDirection(variant) : kind !== "contact" && variant !== 0 ? createArtDirection(kind, palette, variant) : kind === "tennis" ? await tennis({ ...palette, accent }, finish, modelUrl) : await builders[kind]({ ...palette, accent }, finish);
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
var THREE, DURATION, p, ease, mix, mat, mesh3, builders;
var init_scenes = __esm({
  "src/objects/scenes.ts"() {
    "use strict";
    init_contact_directions();
    THREE = __toESM(require("three"), 1);
    init_art_directions();
    init_market();
    init_package_assets();
    DURATION = 5400;
    p = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
    ease = (x) => x * x * x * (x * (x * 6 - 15) + 10);
    mix = THREE.MathUtils.lerp;
    mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04 });
    mesh3 = (g, color, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(g, mat(color));
      m.position.set(x, y, z);
      return m;
    };
    builders = {
      ai,
      contact,
      tennis,
      trading,
      server,
      travel,
      reading
    };
  }
});

// src/objects/index.ts
var objects_exports = {};
__export(objects_exports, {
  AnimationWorkspace: () => AnimationWorkspace,
  ObjectDirectionPicker: () => ObjectDirectionPicker,
  ObjectGallery: () => ObjectGallery,
  ObjectInspector: () => ObjectInspector,
  ObjectScene: () => ObjectScene,
  chooseObjectVariant: () => chooseObjectVariant,
  directionSymbols: () => directionSymbols,
  normalizeObjectVariant: () => normalizeObjectVariant,
  objectDirectionIndex: () => objectDirectionIndex,
  objectDirections: () => objectDirections,
  objectEditions: () => objectEditions,
  objectPalettes: () => objectPalettes,
  objectScenes: () => objectScenes,
  objectVariants: () => objectVariants,
  parseObjectVariant: () => parseObjectVariant,
  transferObjectVariant: () => transferObjectVariant
});
module.exports = __toCommonJS(objects_exports);

// src/objects/ObjectScene.tsx
var import_react4 = require("react");

// src/objects/variants.ts
var objectDirections = [
  { id: "studio", name: "Studio objects", description: "Physical details, soft light, close-up choreography." },
  { id: "paper-theatre", name: "Paper worlds", description: "Cut-paper stages, layered landscapes and pop-up architecture." },
  { id: "kinetic", name: "Kinetic sculptures", description: "Brass mechanisms, ceramic forms and suspended motion." },
  { id: "cartoon", name: "Cartoon worlds", description: "Rounded little places, toy-like details and playful motion." },
  { id: "realistic", name: "Realistic close-ups", description: "Tactile materials, precision details and intimate camera angles." },
  { id: "abstract", name: "Abstract forms", description: "Optical glass, sculptural rhythms and unexpected silhouettes." }
];
var objectVariants = {
  ai: ["Studio \xB7 Agent laptop", "Paper \xB7 Thinking machine", "Kinetic \xB7 Neural orrery", "Cartoon \xB7 Night workshop", "Realistic \xB7 Key travel", "Abstract \xB7 Thought lattice"],
  contact: ["Signature inbox", "Blue inbox", "Terracotta inbox", "Cartoon \xB7 Little post office", "Kinetic \xB7 Correspondence mobile"],
  tennis: ["Studio \xB7 Club rally", "Paper \xB7 Centre court", "Kinetic \xB7 Racket study", "Cartoon \xB7 Courtside club", "Realistic \xB7 Match point", "Abstract \xB7 Elastic exchange"],
  trading: ["Studio \xB7 Market terminal", "Paper \xB7 Market accordion", "Kinetic \xB7 Market balance", "Cartoon \xB7 Exchange avenue", "Realistic \xB7 Ticker study", "Abstract \xB7 Risk rhythm"],
  server: ["Studio \xB7 Inference hardware", "Paper \xB7 Server architecture", "Kinetic \xB7 Floating compute", "Cartoon \xB7 Cloud factory", "Realistic \xB7 Silicon detail", "Abstract \xB7 Signal stack"],
  travel: ["Studio \xB7 Folded atlas", "Paper \xB7 Alpine passage", "Kinetic \xB7 Armillary globe", "Cartoon \xB7 Island express", "Realistic \xB7 Field compass", "Abstract \xB7 Passage"],
  reading: ["Studio \xB7 Turning pages", "Paper \xB7 A world inside", "Kinetic \xB7 Suspended folio", "Cartoon \xB7 Reading nook", "Realistic \xB7 Quiet chapter", "Abstract \xB7 Unwritten"]
};
function chooseObjectVariant(random = Math.random, count = objectDirections.length) {
  return Math.min(count - 1, Math.max(0, Math.floor(random() * count)));
}
var objectEditions = {
  ai: ["Signature terminal", "Midnight terminal", "Warm graphite"],
  contact: ["Signature inbox", "Blue inbox", "Terracotta inbox"],
  tennis: ["Grass club", "Clay club", "Blue hardcourt"],
  trading: ["Breakout", "Pullback", "Range reversal"],
  server: ["Signature hardware", "Blue hardware", "Copper hardware"],
  travel: ["Woodland atlas", "Coastal atlas", "Desert atlas"],
  reading: ["Signature cloth", "Oxblood cloth", "Midnight cloth"]
};
var directionSymbols = ["\u25D2", "\u25B1", "\u25CE", "\u25A7", "\u25C9", "\u25C7"];
function parseObjectVariant(value) {
  const index = Number(value);
  return value != null && value !== "" && Number.isInteger(index) && index >= 0 && index < objectDirections.length ? index : 0;
}
function objectDirectionIndex(kind, variant) {
  return kind === "contact" ? variant === 3 ? 3 : variant === 4 ? 2 : 0 : variant;
}
function normalizeObjectVariant(kind, variant) {
  return kind === "contact" && variant > 4 ? 0 : variant;
}
function transferObjectVariant(from, to, variant) {
  if (from === to) return normalizeObjectVariant(to, variant);
  const direction = objectDirectionIndex(from, variant);
  return to === "contact" ? direction === 2 ? 4 : direction === 3 ? 3 : 0 : direction;
}

// src/CanvasView.tsx
var import_react3 = require("react");

// src/canvas-gestures.ts
var import_react2 = require("react");

// src/env.ts
var import_react = require("react");
var useIsoLayoutEffect = typeof window === "undefined" ? import_react.useEffect : import_react.useLayoutEffect;
var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function keepFocusedInView(event) {
  event.target?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

// src/canvas-gestures.ts
function useCanvasGestures(ref, open, zoom) {
  const latest = (0, import_react2.useRef)(zoom);
  latest.current = zoom;
  const pending = (0, import_react2.useRef)();
  const queued = (0, import_react2.useRef)(zoom.value);
  const frame = (0, import_react2.useRef)(0);
  useIsoLayoutEffect(() => {
    queued.current = zoom.value;
    const anchor = pending.current;
    if (!anchor) return;
    const rect = anchor.surface.getBoundingClientRect();
    const ratio = zoom.value / anchor.scale;
    anchor.surface.scrollLeft = anchor.x * ratio + anchor.inset.x - (anchor.point.x - rect.left);
    anchor.surface.scrollTop = anchor.y * ratio + anchor.inset.y - (anchor.point.y - rect.top);
    pending.current = void 0;
  }, [zoom.value]);
  const change = (value, point, surface) => {
    const config = latest.current;
    const next = Math.max(config.min, Math.min(config.max, value));
    if (next === queued.current) return;
    const viewport = surface?.matches(".uipack__canvas") ? surface : void 0;
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const focal = point ?? {
        x: rect.left + viewport.clientWidth / 2,
        y: rect.top + viewport.clientHeight / 2
      };
      const drawing = viewport.querySelector("svg").getBoundingClientRect();
      pending.current = {
        surface: viewport,
        x: focal.x - drawing.left,
        y: focal.y - drawing.top,
        point: focal,
        scale: config.value,
        inset: {
          x: drawing.left - rect.left + viewport.scrollLeft,
          y: drawing.top - rect.top + viewport.scrollTop
        }
      };
    }
    queued.current = next;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(
      () => config.onChange(queued.current)
    );
  };
  const changeRef = (0, import_react2.useRef)(change);
  changeRef.current = change;
  (0, import_react2.useEffect)(() => {
    const host = ref.current;
    if (!open || !host) return;
    let safariScale = null;
    let pinch = null;
    let suppressClickUntil = 0;
    const surfaceAt = (target) => {
      if (!(target instanceof Element) || target.closest("select, input, textarea"))
        return null;
      return target.closest(
        ".uipack__canvas, .uipack-slide-scene"
      );
    };
    const wheel = (event) => {
      const surface = surfaceAt(event.target);
      if (!event.ctrlKey || !surface) return;
      event.preventDefault();
      if (safariScale !== null || pinch) return;
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1;
      const delta = Math.max(-100, Math.min(100, event.deltaY * units));
      changeRef.current(
        queued.current * Math.exp(-delta * 8e-3),
        { x: event.clientX, y: event.clientY },
        surface
      );
    };
    const gestureStart = (raw) => {
      if (!surfaceAt(raw.target)) return;
      raw.preventDefault();
      if (!pinch) safariScale = queued.current;
    };
    const gestureChange = (raw) => {
      const surface = surfaceAt(raw.target);
      if (!surface) return;
      raw.preventDefault();
      if (safariScale === null || pinch) return;
      const event = raw;
      if (Number.isFinite(event.scale) && event.scale > 0)
        changeRef.current(
          safariScale * event.scale,
          { x: event.clientX, y: event.clientY },
          surface
        );
    };
    const gestureEnd = () => {
      safariScale = null;
    };
    const distance = (touches) => Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
    const touchStart = (event) => {
      const surface = surfaceAt(event.target);
      if (event.touches.length !== 2 || !surface) return;
      event.preventDefault();
      safariScale = null;
      suppressClickUntil = performance.now() + 400;
      pinch = {
        distance: Math.max(1, distance(event.touches)),
        scale: queued.current,
        surface
      };
    };
    const touchMove = (event) => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      suppressClickUntil = performance.now() + 400;
      changeRef.current(
        pinch.scale * distance(event.touches) / pinch.distance,
        {
          x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
          y: (event.touches[0].clientY + event.touches[1].clientY) / 2
        },
        pinch.surface
      );
    };
    const touchEnd = () => {
      if (pinch) suppressClickUntil = performance.now() + 400;
      pinch = null;
    };
    const click = (event) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    host.addEventListener("wheel", wheel, { passive: false });
    host.addEventListener("gesturestart", gestureStart, { passive: false });
    host.addEventListener("gesturechange", gestureChange, { passive: false });
    host.addEventListener("gestureend", gestureEnd);
    host.addEventListener("touchstart", touchStart, { passive: false });
    host.addEventListener("touchmove", touchMove, { passive: false });
    host.addEventListener("touchend", touchEnd);
    host.addEventListener("touchcancel", touchEnd);
    host.addEventListener("click", click, true);
    host.addEventListener("pointerup", click, true);
    return () => {
      cancelAnimationFrame(frame.current);
      pending.current = void 0;
      host.removeEventListener("wheel", wheel);
      host.removeEventListener("gesturestart", gestureStart);
      host.removeEventListener("gesturechange", gestureChange);
      host.removeEventListener("gestureend", gestureEnd);
      host.removeEventListener("touchstart", touchStart);
      host.removeEventListener("touchmove", touchMove);
      host.removeEventListener("touchend", touchEnd);
      host.removeEventListener("touchcancel", touchEnd);
      host.removeEventListener("click", click, true);
      host.removeEventListener("pointerup", click, true);
    };
  }, [open, ref]);
  return {
    step: (factor) => change(
      zoom.value * factor,
      void 0,
      ref.current?.querySelector(".uipack__canvas") ?? void 0
    ),
    reset: () => {
      cancelAnimationFrame(frame.current);
      pending.current = void 0;
      queued.current = 1;
      zoom.onChange(1);
      ref.current?.querySelectorAll(".uipack__canvas").forEach((el) => el.scrollTo(0, 0));
    }
  };
}

// src/CanvasView.tsx
var import_react_dom = require("react-dom");
var import_jsx_runtime = require("react/jsx-runtime");
var CANVAS_TOKENS = [
  "--uipack-bg",
  "--uipack-surface",
  "--uipack-fg",
  "--uipack-muted",
  "--uipack-border",
  "--uipack-accent"
];
function CanvasView({
  open,
  onClose,
  title,
  children,
  zoom,
  theme,
  restoreFocus,
  layout
}) {
  const content = (0, import_react3.useRef)(null);
  const gestures = useCanvasGestures(content, open, zoom);
  const dialog = (0, import_react3.useRef)(null);
  const actions = (0, import_react3.useRef)(gestures);
  actions.current = gestures;
  (0, import_react3.useEffect)(() => {
    if (!open) return;
    const keyboard = (event) => {
      const target = event.target;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || target.isContentEditable || target.closest("input, select, textarea"))
        return;
      if (!dialog.current?.contains(target) && target !== document.body) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        actions.current.step(1.25);
      }
      if (event.key === "-") {
        event.preventDefault();
        actions.current.step(0.8);
      }
      if (event.key === "0") {
        event.preventDefault();
        actions.current.reset();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => document.removeEventListener("keydown", keyboard);
  }, [open]);
  const close = (0, import_react3.useRef)(onClose);
  close.current = onClose;
  (0, import_react3.useEffect)(() => {
    if (!open) return;
    const opener = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previous;
      requestAnimationFrame(
        () => restoreFocus ? restoreFocus() : opener?.focus()
      );
    };
  }, [open]);
  (0, import_react3.useEffect)(() => {
    const node = dialog.current;
    if (!open || !node) return;
    const source = node.querySelector(".uipack");
    if (!source) return;
    const style = getComputedStyle(source);
    for (const name of CANVAS_TOKENS) {
      const value = style.getPropertyValue(name).trim();
      if (value) node.style.setProperty(name, value);
      else node.style.removeProperty(name);
    }
  }, [open, theme]);
  if (!open || typeof document === "undefined") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "dialog",
      {
        ref: dialog,
        className: "uipack-canvas-dialog",
        "data-theme": theme ?? document.documentElement.dataset.theme,
        "aria-label": title,
        onCancel: (e) => {
          e.preventDefault();
          close.current();
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-canvas-toolbar", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  type: "button",
                  "aria-label": "Zoom out",
                  title: "Zoom out (\u2212)",
                  disabled: zoom.value <= zoom.min,
                  onClick: () => gestures.step(0.8),
                  children: "\u2212"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "span",
                {
                  role: "meter",
                  "aria-label": "Zoom level",
                  "aria-valuemin": zoom.min * 100,
                  "aria-valuemax": zoom.max * 100,
                  "aria-valuenow": Math.round(zoom.value * 100),
                  "aria-valuetext": `${Math.round(zoom.value * 100)}%`,
                  children: [
                    Math.round(zoom.value * 100),
                    "%"
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  type: "button",
                  "aria-label": "Zoom in",
                  title: "Zoom in (+)",
                  disabled: zoom.value >= zoom.max,
                  onClick: () => gestures.step(1.25),
                  children: "+"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", title: "Reset view (0)", onClick: gestures.reset, children: "Fit" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: onClose, autoFocus: true, children: "Close canvas" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "uipack-canvas-hint", children: "Pinch to zoom \xB7 Two-finger scroll \xB7 + / \u2212 to zoom \xB7 0 to reset" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              ref: content,
              className: `uipack-canvas-content${layout ? ` uipack-canvas-content--${layout}` : ""}`,
              children
            }
          )
        ]
      }
    ),
    document.body
  );
}

// src/objects/ObjectScene.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var objectPalettes = {
  light: { paper: 15986663, ink: 2698802, muted: 10136485, accent: 2121545 },
  dark: { paper: 14212825, ink: 3755080, muted: 8492426, accent: 7454115 }
};
var objectScenes = [
  {
    id: "ai",
    title: "Agent session",
    description: "Code streams into a laptop while tool calls return a completed result."
  },
  {
    id: "contact",
    title: "Contact inbox",
    description: "Email, chat and web signals converge into one inbox."
  },
  {
    id: "tennis",
    title: "Tennis practice",
    description: "Two players trade returns across the net in a continuous rally."
  },
  {
    id: "trading",
    title: "Trading journal",
    description: "A continuously panning candlestick chart with consistent OHLC prices and volume. Simulation; no live data."
  },
  {
    id: "server",
    title: "Inference study",
    description: "An exploded hardware study assembles inside a chassis outline."
  },
  {
    id: "travel",
    title: "Local map",
    description: "A paper map opens and a route traces continuously to its destination."
  },
  {
    id: "reading",
    title: "Open book",
    description: "Layered paper, a cloth spine and a thin page curling across an open book."
  }
];
var REST_START_MS = 5400;
var NARROW_STAGE_PX = 480;
var MOBILE_FRAME_MS = 1e3 / 30;
var styles = {
  scene: "uipack-object",
  canvas: "uipack-object__canvas",
  fallback: "uipack-object__fallback",
  fallbackSvg: "uipack-object__illustration",
  pause: "uipack-object__motion"
};
var Fallback = ({ kind, label: label2 }) => {
  const scenes = {
    ai: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "83", y: "36", width: "194", height: "126", rx: "8" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M83 162l-25 25h244l-25-25" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "path",
        {
          className: "soft",
          d: "M104 62h88m-88 22h143m-126 22h92m-109 22h120"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "20", y: "56", width: "42", height: "48", rx: "5" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M32 72l-6 8 6 8m16-16l6 8-6 8M62 102l32 43" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "298", y: "56", width: "42", height: "48", rx: "5" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M306 80l8 8 16-19M298 104l-32 40" })
    ] }),
    contact: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "28", y: "28", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "28", y: "86", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "28", y: "144", width: "76", height: "42", rx: "6" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "path",
        {
          className: "soft",
          d: "M104 49c62 0 76 50 126 58M104 107h126M104 165c62 0 76-50 126-58"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "142", cy: "58", r: "6", fill: "currentColor" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M48 42l18 13 18-13M48 42v17h36V42M49 101h34v17H61l-8 7 2-7h-6z" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "66", cy: "165", r: "12" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M54 165h24m-12-12v24" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "230", y: "52", width: "102", height: "110", rx: "8" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M246 116h70v29h-70zM254 108h54m-54-12h54m-54-12h54" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("text", { x: "281", y: "72", children: "INBOX" })
    ] }),
    tennis: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { className: "soft", d: "M45 187l55-162h160l55 162zM69 113h222M86 64h187M180 64v94M62 158h238" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M70 106h220m-220 0v23m220-23v23" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "151", cy: "125", r: "8" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M140 137h22l5 25h-30zM142 163l-8 19m23-19l10 19M160 141l17 9 12-9" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ellipse", { cx: "199", cy: "133", rx: "10", ry: "14", transform: "rotate(40 199 133)" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "213", cy: "42", r: "7" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M202 53h21l4 23h-29zM202 77l-9 17m27-17l8 17M202 57l-18 9-10-8" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ellipse", { cx: "165", cy: "50", rx: "8", ry: "12", transform: "rotate(-40 165 50)" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "190", cy: "90", r: "5" })
    ] }),
    trading: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "26", y: "24", width: "308", height: "152", rx: "8" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M161 176v18h38v-18m-60 22h82" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { className: "soft", d: "M43 70h268M43 100h268M43 130h268M43 151h268" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { stroke: "#269764", d: "M62 98V131M55 108h14v16h-14zM109 89V130M102 102h14v20h-14zM170 86V108M163 95h14v22h-14zM218 80V102M211 86h14v11h-14zM55 163v-8h14v8m33 0v-11h14v11m54 0v-14h14v14m41 0v-18h14v18" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { stroke: "#d85b65", d: "M85 109V140M78 116h14v16h-14zM135 93V125M128 102h14v15h-14zM193 70V100M186 79h14v13h-14zM243 44V78M236 54h14v16h-14zM78 163v-6h14v6m36 0v-9h14v9m51 0v-11h14v11m43 0v-8h14v8" })
    ] }),
    server: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M78 38h204v142H78zM96 58h168v26H96zM96 96h168v26H96zM96 134h168v26H96z" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { className: "soft", d: "M114 66h112m-112 38h112m-112 38h112" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "246", cy: "71", r: "5", fill: "currentColor" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "246", cy: "109", r: "5", fill: "currentColor" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M58 28l20 10m204 0l20-10M58 190l20-10m204 0l20 10" })
    ] }),
    travel: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M34 46l96-24 100 28 96-24v142l-96 24-100-28-96 24zM130 22v142m100-114v142" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { className: "soft", d: "M62 78l52 28m36 16l56-34m44 20l48 30" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M62 78c36 30 68 18 88 44s70 18 100-14 48 30 48 30" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "62", cy: "78", r: "7", fill: "currentColor" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "298", cy: "138", r: "7", fill: "currentColor" })
    ] }),
    reading: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M34 52c54-20 102-16 146 8v132c-44-24-92-28-146-8zM326 52c-54-20-102-16-146 8v132c44-24 92-28 146-8z" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "path",
        {
          className: "soft",
          d: "M58 84h88m-88 24h96m-96 24h78m166-48h-88m88 24h-96m96 24h-78"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M180 60v132" })
    ] })
  };
  const captions = {
    trading: "DEMO / USD \xB7 SIMULATED"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      className: styles.fallback,
      role: "img",
      "aria-label": `${label2} illustration`,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "svg",
          {
            className: styles.fallbackSvg,
            viewBox: "0 0 360 214",
            "aria-hidden": "true",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "3",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: scenes[kind]
          }
        ),
        captions[kind] && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-object__fallback-caption", "aria-hidden": "true", children: captions[kind] })
      ]
    }
  );
};
function ObjectStage({
  kind,
  label: label2,
  active = true,
  theme = "light",
  palette,
  zoom = 1,
  variant = 0,
  edition = 0,
  controls = "full",
  surface = "styled",
  modelUrl
}) {
  const hostRef = (0, import_react4.useRef)(null);
  const canvasRef = (0, import_react4.useRef)(null);
  const frameRef = (0, import_react4.useRef)(null);
  const drawRef = (0, import_react4.useRef)(null);
  const replayRef = (0, import_react4.useRef)(null);
  const resumeRef = (0, import_react4.useRef)(null);
  const activeRef = (0, import_react4.useRef)(active);
  const pausedRef = (0, import_react4.useRef)(false);
  const completedRef = (0, import_react4.useRef)(false);
  const reducedRef = (0, import_react4.useRef)(false);
  const settleRef = (0, import_react4.useRef)(null);
  const [ready, setReady] = (0, import_react4.useState)(false);
  const [paused, setPaused] = (0, import_react4.useState)(false);
  const [completed, setCompleted] = (0, import_react4.useState)(false);
  const [reduced, setReduced] = (0, import_react4.useState)(false);
  const colorMode = theme;
  const zoomRef = (0, import_react4.useRef)(zoom);
  zoomRef.current = zoom;
  const resizeRef = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    resizeRef.current?.();
  }, [zoom]);
  (0, import_react4.useEffect)(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => {
      reducedRef.current = media.matches;
      setReduced(media.matches);
      if (media.matches) settleRef.current?.();
      if (media.matches && frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (!media.matches && activeRef.current && !pausedRef.current && !completedRef.current)
        resumeRef.current?.();
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  (0, import_react4.useEffect)(() => {
    activeRef.current = active;
    if (active && !pausedRef.current && !reducedRef.current)
      drawRef.current?.();
  }, [active]);
  (0, import_react4.useEffect)(() => {
    if (!active || !canvasRef.current) {
      setReady(false);
      return void 0;
    }
    setReady(false);
    pausedRef.current = false;
    completedRef.current = false;
    setPaused(false);
    setCompleted(false);
    let disposed = false;
    let contextLost = false;
    let renderer;
    let environment;
    let scene;
    let resizeObserver;
    let viewportObserver;
    let inViewport = true;
    const canvas = canvasRef.current;
    const handleContextLost = (event) => {
      event.preventDefault();
      contextLost = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      canvas.dataset.renderer = "fallback";
      setReady(false);
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    Promise.all([import("three"), Promise.resolve().then(() => (init_scenes(), scenes_exports)), import("three/addons/environments/RoomEnvironment.js")]).then(async ([THREE2, { createObject: createObject2, disposeObject: disposeObject2 }, { RoomEnvironment }]) => {
      if (disposed) return;
      try {
        renderer = new THREE2.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "default"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.outputColorSpace = THREE2.SRGBColorSpace;
        scene = new THREE2.Scene();
        const room = new RoomEnvironment();
        const pmrem = new THREE2.PMREMGenerator(renderer);
        environment = pmrem.fromScene(room, 0.04);
        scene.environment = environment.texture;
        scene.environmentIntensity = variant === 5 ? 0.85 : 0.35;
        room.dispose();
        pmrem.dispose();
        const camera = new THREE2.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
        camera.position.set(0, variant === 4 && kind !== "contact" ? -0.15 : 0, 10);
        const colors = palette ?? objectPalettes[colorMode];
        const object = await createObject2(kind, colors, variant === "random" ? 0 : variant, edition, modelUrl);
        if (disposed || contextLost) {
          disposeObject2(object);
          return;
        }
        canvas.dataset.source = object.userData.source ?? "procedural";
        canvas.dataset.artDirection = object.userData.style;
        const shadows = kind === "tennis" || variant !== 0 && variant !== 5;
        if (variant !== 0 && variant !== 5) object.traverse((item) => {
          if (item instanceof THREE2.Mesh) {
            item.castShadow = true;
            item.receiveShadow = true;
          }
        });
        if (shadows) {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE2.PCFSoftShadowMap;
        }
        scene.add(object, new THREE2.HemisphereLight(16119019, 5859192, 2));
        const key = new THREE2.DirectionalLight(16773852, 2.5);
        key.position.set(-3, 5, 7);
        key.castShadow = shadows;
        key.shadow.mapSize.set(1024, 1024);
        Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
        key.shadow.normalBias = 0.025;
        key.shadow.bias = -3e-4;
        renderer.toneMapping = THREE2.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        scene.add(key);
        const rim = new THREE2.DirectionalLight(13032959, 1.4);
        rim.position.set(4, 2, -3);
        scene.add(rim);
        const loopDuration = object.userData.loopDuration;
        const restTime = object.userData.restTime ?? REST_START_MS;
        canvas.dataset.playback = loopDuration ? "loop" : "once";
        let frames = 0;
        let elapsed = 0;
        let lastTickAt;
        let lastPaintAt = -Infinity;
        const frameInterval = window.matchMedia("(max-width: 767px)").matches ? MOBILE_FRAME_MS : 0;
        const paint = (sceneTime, time) => {
          object.userData.animate?.(sceneTime);
          renderer.render(scene, camera);
          canvas.dataset.drawCalls = String(renderer.info.render.calls);
          canvas.dataset.triangles = String(renderer.info.render.triangles);
          lastPaintAt = frameInterval ? time - (Number.isFinite(lastPaintAt) ? (time - lastPaintAt) % frameInterval : 0) : time;
          frames += 1;
          canvas.dataset.frames = String(frames);
          canvas.dataset.phase = reducedRef.current ? "rest" : object.userData.phase;
          canvas.dataset.pose = object.userData.pose.toFixed(3);
          if (hostRef.current)
            hostRef.current.dataset.phase = reducedRef.current ? "rest" : object.userData.phase;
        };
        settleRef.current = () => {
          paint(restTime, performance.now());
        };
        const render = (time = 0) => {
          frameRef.current = null;
          if (disposed || contextLost) return;
          if (document.hidden || !inViewport) {
            lastTickAt = void 0;
            return;
          }
          if (lastTickAt !== void 0)
            elapsed += Math.min(time - lastTickAt, 50);
          lastTickAt = time;
          const completing = !loopDuration && !reducedRef.current && elapsed >= REST_START_MS && !completedRef.current;
          const shouldPaint = completing || time - lastPaintAt >= frameInterval;
          if (shouldPaint) {
            paint(
              reducedRef.current ? restTime : completing ? REST_START_MS : elapsed,
              time
            );
          }
          if (completing) {
            completedRef.current = true;
            setCompleted(true);
          }
          if (activeRef.current && !pausedRef.current && !reducedRef.current && !completedRef.current) {
            frameRef.current = requestAnimationFrame(render);
          }
        };
        drawRef.current = () => {
          if (!frameRef.current && !disposed)
            frameRef.current = requestAnimationFrame(render);
        };
        resumeRef.current = () => {
          lastTickAt = void 0;
          drawRef.current?.();
        };
        replayRef.current = () => {
          elapsed = 0;
          lastTickAt = void 0;
          lastPaintAt = -Infinity;
          completedRef.current = false;
          pausedRef.current = false;
          setCompleted(false);
          setPaused(false);
          drawRef.current?.();
        };
        const resize = () => {
          const width = canvas.clientWidth || 1;
          const height = canvas.clientHeight || 1;
          renderer.setSize(width, height, false);
          const aspect = width / height;
          const narrow = width < NARROW_STAGE_PX ? object.userData.narrowFrame : void 0;
          const halfWidth = narrow?.halfWidth ?? (variant === 4 && kind !== "contact" ? 2.15 : kind === "server" && variant === 0 ? 3.25 : 2.65);
          const halfHeight = Math.max(narrow?.halfHeight ?? (variant === 4 && kind !== "contact" ? 1.75 : 2.2), halfWidth / aspect);
          camera.position.y = narrow?.y ?? (variant === 4 && kind !== "contact" ? -0.15 : 0);
          camera.left = -halfHeight * aspect;
          camera.right = halfHeight * aspect;
          camera.top = halfHeight;
          camera.bottom = -halfHeight;
          camera.zoom = zoomRef.current;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        };
        resizeRef.current = resize;
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        viewportObserver = new IntersectionObserver(([entry]) => {
          inViewport = entry.isIntersecting;
          if (!inViewport) {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
            lastTickAt = void 0;
          } else if (activeRef.current && !pausedRef.current && !completedRef.current && !reducedRef.current) {
            resumeRef.current?.();
          }
        });
        viewportObserver.observe(canvas);
        resize();
        canvas.dataset.renderer = "webgl";
        setReady(true);
        if (reducedRef.current) render();
        else if (activeRef.current) drawRef.current?.();
      } catch {
        canvas.dataset.renderer = "fallback";
      }
    }).catch(() => {
      if (!disposed) {
        canvas.dataset.renderer = "fallback";
        setReady(false);
      }
    });
    const visibility = () => {
      if (!document.hidden && !pausedRef.current && !completedRef.current && !reducedRef.current)
        resumeRef.current?.();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      resizeRef.current = null;
      settleRef.current = null;
      disposed = true;
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      resizeObserver?.disconnect();
      viewportObserver?.disconnect();
      if (scene)
        scene.traverse((item) => {
          item.userData.dispose?.();
          item.shadow?.dispose();
          const drawable = item;
          drawable.geometry?.dispose();
          const materials = Array.isArray(drawable.material) ? drawable.material : drawable.material ? [drawable.material] : [];
          materials.forEach((entry) => {
            entry.map?.dispose();
            entry.dispose();
          });
        });
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      drawRef.current = null;
      replayRef.current = null;
      resumeRef.current = null;
    };
  }, [active, kind, colorMode, palette, variant, edition, modelUrl]);
  const togglePaused = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next && frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (!next) resumeRef.current?.();
  };
  const replay = () => replayRef.current?.();
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      ref: hostRef,
      "data-theme": theme,
      "data-surface": surface,
      className: styles.scene,
      "data-active": active ? "true" : "false",
      "data-kind": kind,
      "data-variant": variant,
      "data-edition": edition,
      "data-art-direction": objectDirections[objectDirectionIndex(kind, variant === "random" ? 0 : variant)].id,
      "data-controls": controls,
      "data-variant-label": objectVariants[kind][variant === "random" ? 0 : variant],
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Fallback, { kind, label: label2 }),
        active && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "canvas",
          {
            ref: canvasRef,
            className: styles.canvas,
            "data-ready": ready ? "true" : "false",
            "aria-hidden": "true"
          }
        ),
        ready && !reduced && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: styles.pause,
            onClick: completed ? replay : togglePaused,
            "aria-pressed": completed ? void 0 : paused,
            "aria-label": completed ? "Replay motion" : paused ? "Resume motion" : "Pause motion",
            children: controls === "playback" ? completed ? "Replay" : paused ? "Resume" : "Pause" : completed ? "Replay motion" : paused ? "Resume motion" : "Pause motion"
          }
        )
      ]
    }
  );
}
function ObjectScene(props) {
  const [open, setOpen] = (0, import_react4.useState)(false), [zoom, setZoom] = (0, import_react4.useState)(1);
  const opener = (0, import_react4.useRef)(null);
  const [randomVariant, setRandomVariant] = (0, import_react4.useState)(null);
  (0, import_react4.useEffect)(() => {
    setRandomVariant(chooseObjectVariant(Math.random, props.kind === "contact" ? 5 : objectDirections.length));
  }, []);
  const canVary = props.variant === void 0 || props.variant === "random";
  const controls = props.controls ?? "full";
  const chosenVariant = canVary ? randomVariant : props.variant;
  const variant = chosenVariant === null ? null : normalizeObjectVariant(props.kind, chosenVariant);
  const anotherLook = () => setRandomVariant((current) => ((current ?? 0) + 1) % (props.kind === "contact" ? 5 : objectDirections.length));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-object-frame", "data-theme": props.theme ?? "light", "data-controls": controls, children: [
    controls === "full" && variant !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-object-edition", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: variant === 0 && props.kind !== "contact" ? `Studio \xB7 ${objectEditions[props.kind][props.edition ?? 0]}` : objectVariants[props.kind][variant] }),
      canVary && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: anotherLook, "aria-label": "Another look", children: "\u21BB" })
    ] }),
    controls === "full" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        ref: opener,
        type: "button",
        className: "uipack-object-open",
        onClick: () => setOpen(true),
        children: "Open canvas"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      CanvasView,
      {
        open,
        onClose: () => setOpen(false),
        title: props.label,
        theme: props.theme,
        restoreFocus: () => opener.current?.focus(),
        zoom: { value: zoom, min: 0.75, max: 2, onChange: setZoom },
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          ObjectStage,
          {
            ...props,
            active: (props.active ?? true) && variant !== null,
            variant: variant ?? 0,
            zoom
          },
          `${props.kind}-${props.theme ?? "light"}-${variant ?? "pending"}-${props.edition ?? 0}`
        )
      }
    )
  ] });
}
function ObjectDirectionPicker({ value, onChange }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-object-directions", role: "group", "aria-label": "3D art direction", children: objectDirections.map((direction, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "button",
    {
      type: "button",
      "aria-pressed": value === index,
      onClick: () => onChange(index),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: directionSymbols[index] }),
        direction.name
      ]
    },
    direction.id
  )) });
}

// src/objects/gallery.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function AnimationWorkspace({
  library,
  children,
  theme = "light"
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack-animation-workspace", "data-theme": theme, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("aside", { className: "uipack-animation-library", children: library }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "uipack-animation-detail", children })
  ] });
}
function ObjectInspector({
  kind,
  variant,
  edition = 0,
  onVariantChange,
  onEditionChange
}) {
  variant = normalizeObjectVariant(kind, variant);
  const contact2 = kind === "contact";
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "uipack-object-inspector", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: "Art direction" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { role: "group", "aria-label": "3D art direction", className: "uipack-direction-list", children: objectDirections.map((direction, index) => ({ direction, index })).filter(({ index }) => !contact2 || [0, 2, 3].includes(index)).map(({ direction, index }) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "button",
        {
          type: "button",
          "aria-label": direction.name,
          "aria-pressed": objectDirectionIndex(kind, variant) === index,
          onClick: () => onVariantChange(contact2 && index === 2 ? 4 : index),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-direction-symbol", "aria-hidden": "true", children: directionSymbols[index] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: direction.name }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: direction.description })
            ] })
          ]
        },
        direction.id
      )) })
    ] }),
    (contact2 ? variant < 3 : variant === 0) && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "uipack-edition-select", children: [
      contact2 ? "Inbox edition" : "Studio edition",
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "select",
        {
          value: contact2 ? variant % 3 : edition,
          onChange: (e) => (contact2 ? onVariantChange : onEditionChange)(Number(e.target.value)),
          children: objectEditions[kind].map((name, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: index, children: name }, name))
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: contact2 ? "Three original inbox finishes." : "The original looks, kept together in Studio." })
    ] })
  ] });
}
function ObjectGallery({
  kind,
  variant = 0,
  edition = 0,
  theme = "light",
  palette,
  modelUrl,
  onChange
}) {
  variant = normalizeObjectVariant(kind, variant);
  const scene = objectScenes.find((item) => item.id === kind);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    AnimationWorkspace,
    {
      theme,
      library: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: "Object library" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("nav", { "aria-label": "Choose an object", className: "uipack-scene-list", onFocus: keepFocusedInView, children: objectScenes.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "button",
          {
            type: "button",
            "aria-pressed": kind === item.id,
            onClick: () => onChange(item.id, transferObjectVariant(kind, item.id, variant), edition),
            children: [
              item.title,
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { "aria-hidden": "true", children: "\u2197" })
            ]
          },
          item.id
        )) })
      ] }),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "uipack-animation-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: scene.title }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "Live 3D preview" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack-object-review", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "uipack-gallery-stage", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            ObjectScene,
            {
              kind,
              label: scene.title,
              variant,
              edition,
              theme,
              palette,
              modelUrl
            },
            kind
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            ObjectInspector,
            {
              kind,
              variant,
              edition,
              onVariantChange: (value) => onChange(kind, value, edition),
              onEditionChange: (value) => onChange(kind, variant, value)
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "uipack-gallery-description", children: objectDirectionIndex(kind, variant) === 0 ? scene.description : objectDirections[objectDirectionIndex(kind, variant)].description })
      ]
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AnimationWorkspace,
  ObjectDirectionPicker,
  ObjectGallery,
  ObjectInspector,
  ObjectScene,
  chooseObjectVariant,
  directionSymbols,
  normalizeObjectVariant,
  objectDirectionIndex,
  objectDirections,
  objectEditions,
  objectPalettes,
  objectScenes,
  objectVariants,
  parseObjectVariant,
  transferObjectVariant
});
//# sourceMappingURL=objects.cjs.map