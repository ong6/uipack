import * as THREE5 from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// src/objects/contact-directions.ts
var TAU = Math.PI * 2;
var LOOP_MS = 12e3;
var vec = (x, y, z = 0) => new THREE5.Vector3(x, y, z);
function playLoop(object, ticks, restTime, phase2) {
  object.userData.source = "procedural";
  object.userData.loopDuration = LOOP_MS;
  object.userData.restTime = restTime;
  object.userData.animate = (time) => {
    const progress = (time % LOOP_MS + LOOP_MS) % LOOP_MS / LOOP_MS;
    for (const tick of ticks) tick(progress * TAU);
    object.userData.phase = phase2;
    object.userData.pose = progress;
  };
}

// src/objects/contact-directions.ts
var colors = { cream: 16181706, coral: 15301725, blue: 6920109, green: 9155483, dark: 2703177, gold: 12490332 };
var REST_MS = 3200;
function addMesh(parent, geometry, color, x = 0, y = 0, z = 0, metal = false) {
  const mesh3 = new THREE5.Mesh(
    geometry,
    new THREE5.MeshStandardMaterial({ color, roughness: metal ? 0.28 : 0.65, metalness: metal ? 0.65 : 0.02 })
  );
  mesh3.position.set(x, y, z);
  parent.add(mesh3);
  return mesh3;
}
function box(parent, width, height, depth, color, x = 0, y = 0, z = 0) {
  return addMesh(
    parent,
    new RoundedBoxGeometry(width, height, depth, 2, Math.min(0.09, width / 4, height / 4, depth / 4)),
    color,
    x,
    y,
    z
  );
}
function rod(parent, from, to, color = colors.gold, radius = 0.018) {
  const delta = to.clone().sub(from), mesh3 = addMesh(parent, new THREE5.CylinderGeometry(radius, radius, delta.length(), 12), color, 0, 0, 0, true);
  mesh3.position.copy(from).add(to).multiplyScalar(0.5);
  mesh3.quaternion.setFromUnitVectors(vec(0, 1), delta.normalize());
  return mesh3;
}
function sphere(parent, radius, color, x = 0, y = 0, z = 0) {
  return addMesh(parent, new THREE5.SphereGeometry(radius, 24, 16), color, x, y, z);
}
function envelope(parent, color = colors.cream) {
  const letter = new THREE5.Group();
  parent.add(letter);
  box(letter, 0.64, 0.43, 0.07, color);
  for (const z of [-0.041, 0.041]) {
    rod(letter, vec(-0.28, 0.17, z), vec(0, -0.025, z), colors.gold, 9e-3);
    rod(letter, vec(0, -0.025, z), vec(0.28, 0.17, z), colors.gold, 9e-3);
  }
  return letter;
}
var clamp01 = (value) => Math.min(1, Math.max(0, value));
function cartoonMailbox(root, ticks) {
  const world = new THREE5.Group();
  root.add(world);
  world.rotation.set(0.35, -0.38, 0);
  world.position.y = -0.57;
  box(world, 2.7, 0.28, 2.05, colors.cream, 0, -0.35);
  box(world, 2.6, 0.07, 1.95, 12242604, 0, -0.17);
  for (let i = 0; i < 4; i++) box(world, 0.48, 0.045, 0.24, 15324594, 0.22, -0.1, 0.48 + i * 0.25);
  box(world, 0.17, 0.62, 0.17, colors.cream, 0, 0.15, -0.18);
  box(world, 0.55, 0.08, 0.43, colors.coral, 0, -0.12, -0.18);
  const mailbox = new THREE5.Group();
  world.add(mailbox);
  mailbox.position.set(0, 0.85, -0.18);
  box(mailbox, 1.16, 0.88, 0.87, colors.coral);
  box(mailbox, 0.99, 0.72, 0.045, colors.cream, 0, 0, 0.455);
  box(mailbox, 0.72, 0.11, 0.02, colors.dark, 0, 0.17, 0.486);
  for (const x of [-0.24, 0.24]) sphere(mailbox, 0.043, colors.dark, x, -0.1, 0.49);
  const smile = addMesh(mailbox, new THREE5.TorusGeometry(0.12, 0.015, 8, 24, Math.PI), colors.coral, 0, -0.14, 0.49);
  smile.rotation.z = Math.PI;
  const flag = new THREE5.Group();
  mailbox.add(flag);
  flag.position.set(0.62, -0.12, 0);
  rod(flag, vec(0, 0), vec(0, 0.78), colors.gold, 0.025);
  box(flag, 0.28, 0.2, 0.055, colors.blue, 0.12, 0.68);
  sphere(flag, 0.06, colors.gold);
  for (const [x, z, scale] of [
    [-0.98, -0.55, 0.8],
    [0.97, -0.6, 0.55]
  ]) {
    rod(world, vec(x, -0.13, z), vec(x, 0.6 * scale, z), 10584928, 0.045);
    sphere(world, 0.32 * scale, colors.green, x, 0.72 * scale, z).scale.y = 1.4;
    sphere(world, 0.24 * scale, 6525819, x + 0.13, 0.55 * scale, z);
  }
  const letter = envelope(world);
  letter.name = "arriving-letter";
  ticks.push((angle) => {
    const p2 = angle / TAU;
    const fly = p2 > 0.8 ? (1 - p2) / 0.2 : clamp01((p2 - 0.1) / 0.62);
    const ease2 = fly * fly * (3 - 2 * fly);
    letter.position.set(-1 * (1 - ease2), 1.02 + 0.86 * Math.sin(Math.PI * fly), 0.31 + 1.15 * (1 - ease2));
    letter.rotation.set(0.12 * (1 - ease2), -0.24 * (1 - ease2), -0.22 * (1 - ease2));
    const scale = clamp01((p2 - 0.06) / 0.08) * clamp01((0.79 - p2) / 0.09);
    letter.scale.setScalar(scale * 0.85);
    letter.visible = scale > 0;
    flag.rotation.z = -0.65 + 0.65 * Math.sin(Math.PI * clamp01((p2 - 0.55) / 0.35));
  });
}
function kineticMobile(root, ticks) {
  const ORBIT_RADIUS = 1.39;
  const HANGER_LENGTHS = [0.65, 1.05, 0.48];
  root.rotation.set(0.12, -0.2, 0);
  addMesh(root, new THREE5.CylinderGeometry(0.98, 1.04, 0.16, 64), colors.dark, 0, -1.45);
  const rim = addMesh(root, new THREE5.TorusGeometry(0.98, 0.022, 8, 80), colors.gold, 0, -1.36, 0, true);
  rim.rotation.x = Math.PI / 2;
  rod(root, vec(0, -1.37, -0.3), vec(0, 1.45, -0.3), colors.gold, 0.04);
  const mobile = new THREE5.Group();
  root.add(mobile);
  mobile.position.set(0, 0.95, -0.3);
  rod(mobile, vec(-1.18, 0), vec(1.18, 0), colors.gold, 0.028);
  sphere(mobile, 0.09, colors.gold);
  for (let i = 0; i < 3; i++) {
    const hanger = new THREE5.Group();
    mobile.add(hanger);
    hanger.position.x = (i - 1) * 0.98;
    const length = HANGER_LENGTHS[i];
    rod(hanger, vec(0, 0), vec(0, -length), colors.gold, 9e-3);
    const letter = envelope(hanger, [colors.cream, colors.blue, colors.coral][i]);
    letter.position.y = -length - 0.21;
    ticks.push((angle) => {
      hanger.rotation.z = 0.085 * Math.sin(angle + i * 1.8);
      letter.rotation.y = 0.32 * Math.sin(angle + i);
    });
  }
  box(root, 1.25, 0.1, 0.78, colors.cream, 0, -1.23, 0.16);
  for (const x of [-0.59, 0.59]) box(root, 0.08, 0.18, 0.78, colors.cream, x, -1.11, 0.16);
  box(root, 1.25, 0.18, 0.08, colors.cream, 0, -1.11, -0.2);
  const orbit = new THREE5.Group();
  root.add(orbit);
  orbit.rotation.set(0.85, 0.3, 0);
  orbit.position.y = -0.05;
  addMesh(orbit, new THREE5.TorusGeometry(ORBIT_RADIUS, 0.012, 8, 80), colors.gold, 0, 0, 0, true);
  const signal = sphere(orbit, 0.075, colors.gold);
  ticks.push((angle) => {
    mobile.rotation.y = 0.3 + 0.38 * Math.sin(angle);
    mobile.rotation.z = 0.06 * Math.sin(angle);
    signal.position.set(ORBIT_RADIUS * Math.cos(angle), ORBIT_RADIUS * Math.sin(angle), 0);
  });
}
function createContactDirection(variant) {
  const root = new THREE5.Group(), ticks = [];
  if (variant === 3) cartoonMailbox(root, ticks);
  else kineticMobile(root, ticks);
  if (variant === 3) root.userData.narrowFrame = { halfWidth: 1.9, halfHeight: 1.5, y: -0.15 };
  root.userData.style = variant === 3 ? "cartoon" : "kinetic";
  playLoop(root, ticks, REST_MS, variant === 3 ? "letter-delivery" : "correspondence-mobile");
  return root;
}
var colors2 = {
  cream: 15983547,
  coral: 15497563,
  blue: 6331070,
  mint: 8436128,
  ink: 2504523,
  gold: 12884824,
  white: 16446953
};
var REST_MS2 = 1800;
var standard = (color, roughness = 0.68, metalness = 0.04) => new THREE5.MeshStandardMaterial({ color, roughness, metalness });
function mesh(parent, geometry, surface, x = 0, y = 0, z = 0) {
  const object = new THREE5.Mesh(geometry, typeof surface === "number" ? standard(surface) : surface);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}
function block(parent, width, height, depth, surface, x = 0, y = 0, z = 0, radius = 0.055) {
  return mesh(
    parent,
    new RoundedBoxGeometry(width, height, depth, 2, Math.min(radius, width / 3, height / 3, depth / 3)),
    surface,
    x,
    y,
    z
  );
}
function sphere2(parent, radius, surface, x = 0, y = 0, z = 0) {
  return mesh(parent, new THREE5.SphereGeometry(radius, 24, 16), surface, x, y, z);
}
function ring(parent, radius, tube2, surface, x = 0, y = 0, z = 0) {
  return mesh(parent, new THREE5.TorusGeometry(radius, tube2, 8, 64), surface, x, y, z);
}
function cylinder(parent, radius, height, surface, x = 0, y = 0, z = 0) {
  return mesh(parent, new THREE5.CylinderGeometry(radius, radius, height, 40), surface, x, y, z);
}
function path(parent, points, surface, radius = 0.018, closed = false) {
  return mesh(parent, new THREE5.TubeGeometry(new THREE5.CatmullRomCurve3(points, closed), 80, radius, 6, closed), surface);
}
function rod2(parent, from, to, color, radius = 0.02) {
  const delta = to.clone().sub(from), object = cylinder(parent, radius, delta.length(), color);
  object.position.copy(from).add(to).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(vec(0, 1), delta.normalize());
  return object;
}
function group(parent, x = 0, y = 0, z = 0) {
  const container = new THREE5.Group();
  container.position.set(x, y, z);
  parent.add(container);
  return container;
}
function tree(parent, x, z, scale = 1) {
  const container = group(parent, x, 0, z);
  container.scale.setScalar(scale);
  cylinder(container, 0.065, 0.55, 9728348, 0, 0.26);
  sphere2(container, 0.27, colors2.mint, 0, 0.7).scale.y = 1.35;
  sphere2(container, 0.21, 6198647, 0.19, 0.58);
  return container;
}
function cloud(parent, x, y, z) {
  const container = group(parent, x, y, z);
  for (const [dx, dy, radius] of [
    [-0.23, 0, 0.22],
    [0, 0.08, 0.3],
    [0.25, 0, 0.21]
  ])
    sphere2(container, radius, colors2.white, dx, dy).scale.z = 0.6;
  return container;
}
function roof(parent, width, height, depth, x = 0, y = 0, z = 0) {
  const shape = new THREE5.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(0, height);
  shape.lineTo(width / 2, 0);
  shape.closePath();
  const geometry = new THREE5.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.025,
    bevelSegments: 2,
    steps: 1
  });
  geometry.translate(0, 0, -depth / 2);
  return mesh(parent, geometry, colors2.coral, x, y, z);
}
function toyHouse(parent, x, z) {
  const house = group(parent, x, 0, z);
  block(house, 0.72, 0.68, 0.66, colors2.cream, 0, 0.34);
  roof(house, 0.88, 0.36, 0.83, 0, 0.67);
  block(house, 0.2, 0.31, 0.03, colors2.blue, 0, 0.17, 0.35);
  for (const side of [-1, 1]) block(house, 0.13, 0.14, 0.035, colors2.white, side * 0.23, 0.46, 0.35);
  return house;
}
var cartoonModels = {
  /** A toy train runs along a river past a house, trees and a hill. */
  travel(world, ticks) {
    block(world, 2.45, 0.06, 0.7, colors2.blue, 0, 0.055, 0.55, 0.2);
    toyHouse(world, -0.7, -0.45);
    tree(world, 0.87, -0.56, 0.85);
    tree(world, 1.04, 0.03, 0.55);
    const hill = sphere2(world, 0.61, colors2.mint, 0.52, 0.08, -0.62);
    hill.scale.set(1, 1.18, 0.8);
    const train = group(world, 0, 0.22, 0.54);
    block(train, 0.72, 0.3, 0.31, colors2.coral);
    block(train, 0.43, 0.19, 0.29, colors2.cream, -0.08, 0.23);
    for (const x of [-0.23, 0.23])
      for (const z of [-0.17, 0.17]) cylinder(train, 0.095, 0.04, colors2.ink, x, -0.14, z).rotation.x = Math.PI / 2;
    for (const x of [-0.2, 0]) block(train, 0.13, 0.11, 0.015, colors2.blue, x, 0.25, 0.16);
    ticks.push((angle) => {
      train.position.x = 0.68 * Math.sin(angle);
      train.rotation.y = 0.08 * Math.sin(angle);
    });
  },
  /** An armchair reader on a giant book, under a standing lamp. */
  reading(world, ticks) {
    block(world, 1.5, 0.18, 1.48, colors2.coral, 0, 0.14, 0);
    block(world, 1.38, 0.2, 1.37, colors2.white, 0, 0.32, 0);
    for (let i = 0; i < 4; i++) block(world, 1.4, 0.012, 1.38, 14207397, 0, 0.25 + i * 0.043);
    const seat = group(world, 0.1, 0.43, 0);
    block(seat, 0.66, 0.13, 0.59, colors2.blue, 0, 0.15);
    block(seat, 0.67, 0.7, 0.16, colors2.blue, 0, 0.49, -0.27, 0.1);
    for (const x of [-0.32, 0.32]) block(seat, 0.12, 0.24, 0.61, colors2.blue, x, 0.32);
    const book = group(seat, 0, 0.47, 0.13);
    block(book, 0.43, 0.05, 0.34, colors2.cream);
    book.rotation.x = -0.2;
    const lamp = group(world, -0.86, 0.06, -0.36);
    rod2(lamp, vec(0, 0), vec(0, 1.32), colors2.gold, 0.045);
    mesh(lamp, new THREE5.ConeGeometry(0.28, 0.34, 32), colors2.coral, 0, 1.35);
    sphere2(lamp, 0.1, 16767363, 0, 1.2);
    tree(world, 0.93, 0.5, 0.68);
    ticks.push((angle) => {
      book.rotation.z = 0.06 * Math.sin(angle);
      seat.rotation.y = 0.06 * Math.sin(angle);
    });
  },
  /** A court with a net; the ball arcs between two bats. */
  tennis(world, ticks) {
    block(world, 1.78, 0.05, 1.8, 6662026, 0, 0.075);
    for (const x of [-0.74, 0.74]) block(world, 0.024, 0.012, 1.55, colors2.white, x, 0.11);
    for (const z of [-0.78, 0, 0.78]) block(world, 1.5, 0.012, 0.024, colors2.white, 0, 0.11, z);
    for (const x of [-0.88, 0.88]) cylinder(world, 0.035, 0.43, colors2.white, x, 0.28);
    block(world, 1.78, 0.28, 0.025, colors2.ink, 0, 0.33);
    for (let i = -8; i <= 8; i++) block(world, 0.012, 0.26, 0.03, colors2.cream, i * 0.1, 0.33);
    const ball2 = sphere2(world, 0.12, 15064432), nearBat = group(world, -0.33, 0.16, 0.67), farBat = group(world, 0.33, 0.16, -0.67);
    for (const [bat, color] of [
      [nearBat, colors2.coral],
      [farBat, colors2.blue]
    ]) {
      cylinder(bat, 0.17, 0.09, color);
      sphere2(bat, 0.17, color, 0, 0.18).scale.y = 0.45;
      ring(bat, 0.19, 0.032, colors2.cream, 0, 0.25).rotation.x = -Math.PI / 2;
    }
    ticks.push((angle) => {
      const swing = Math.sin(angle);
      ball2.position.set(0.33 * swing, 0.53 + 0.51 * (1 - swing * swing), -0.67 * swing);
      nearBat.rotation.y = 0.22 * Math.cos(angle);
      farBat.rotation.y = -0.22 * Math.cos(angle);
    });
    tree(world, 1.02, -0.75, 0.75);
  },
  /** A bobbing robot at a desk, with a keyboard and a mug. */
  ai(world, ticks) {
    block(world, 1.6, 0.14, 0.85, 13080950, 0, 0.63);
    for (const x of [-0.63, 0.63]) block(world, 0.1, 0.59, 0.1, colors2.cream, x, 0.29);
    const bot = group(world, -0.26, 0.98, -0.1);
    block(bot, 0.81, 0.62, 0.34, colors2.blue, 0, 0, 0, 0.14);
    block(bot, 0.62, 0.35, 0.045, colors2.ink, 0, 0.035, 0.19, 0.09);
    for (const x of [-0.16, 0.16]) sphere2(bot, 0.055, 16112775, x, 0.06, 0.23);
    rod2(bot, vec(0, 0.3), vec(0, 0.49), colors2.coral);
    sphere2(bot, 0.075, colors2.coral, 0, 0.54);
    block(world, 0.66, 0.045, 0.28, colors2.cream, -0.22, 0.73, 0.28);
    const mug = cylinder(world, 0.13, 0.23, colors2.coral, 0.58, 0.81, 0.15);
    ring(mug, 0.1, 0.025, colors2.coral, 0.14, 0).rotation.y = 0.2;
    tree(world, 1, -0.7, 0.78);
    ticks.push((angle) => {
      bot.rotation.z = 0.06 * Math.sin(angle);
      bot.position.y = 0.98 + 0.035 * (1 - Math.cos(angle * 2));
    });
  },
  /** Three server buildings with rooftop fans, under their own cloud. */
  server(world, ticks) {
    for (let i = 0; i < 3; i++) {
      const building = group(world, -0.72 + i * 0.69, 0, -0.15 + i % 2 * 0.28), height = 0.87 + i % 2 * 0.38;
      block(building, 0.58, height, 0.66, [colors2.blue, colors2.coral, colors2.mint][i], 0, height / 2);
      for (let j = 0; j < 3; j++) {
        block(building, 0.4, 0.11, 0.04, colors2.cream, 0, 0.18 + j * 0.22, 0.35);
        sphere2(building, 0.024, 6202527, -0.12, 0.18 + j * 0.22, 0.38);
      }
      const fan = ring(building, 0.17, 0.04, colors2.ink, 0, height - 0.15, 0.35);
      for (let n = 0; n < 4; n++) {
        const blade = block(fan, 0.045, 0.2, 0.025, colors2.white);
        blade.rotation.z = n * Math.PI / 2;
      }
      ticks.push((angle) => fan.rotation.z = angle * 2);
    }
    const puff = cloud(world, 0.1, 1.65, -0.16);
    puff.scale.setScalar(0.75);
    ticks.push((angle) => puff.position.y = 1.65 + 0.055 * Math.sin(angle));
  },
  /** A street of towers with lit windows, and a tram passing in front. */
  trading(world, ticks) {
    const TOWER_HEIGHTS = [0.48, 0.83, 1.2, 0.73, 0.99];
    for (let i = 0; i < 5; i++) {
      const height = TOWER_HEIGHTS[i], x = -0.91 + i * 0.46;
      block(world, 0.35, height, 0.62, i === 3 ? colors2.coral : colors2.blue, x, height / 2, -0.23);
      for (let j = 0; j < Math.floor(height / 0.22); j++)
        for (const dx of [-0.09, 0.09]) block(world, 0.075, 0.1, 0.018, colors2.cream, x + dx, 0.17 + j * 0.21, 0.09);
    }
    const tram = group(world, 0, 0.2, 0.59);
    block(tram, 0.6, 0.23, 0.29, colors2.coral);
    block(tram, 0.35, 0.12, 0.25, colors2.cream, 0, 0.17);
    ticks.push((angle) => tram.position.x = 0.85 * Math.sin(angle));
  }
};
function cartoon(kind, ticks) {
  const root = new THREE5.Group(), world = group(root, 0, -0.48, 0);
  world.rotation.set(0.48, -0.55, 0);
  block(world, 2.65, 0.32, 2.16, colors2.cream, 0, -0.2, 0, 0.16);
  block(world, 2.56, 0.08, 2.07, 12177325, 0, 0, 0, 0.13);
  cartoonModels[kind](world, ticks);
  if (kind !== "server") {
    const puff = cloud(root, 0.75, 1.24, -0.65);
    puff.scale.setScalar(0.68);
    ticks.push((angle) => {
      puff.position.x = 0.75 + 0.12 * Math.sin(angle);
    });
  }
  ticks.push((angle) => world.rotation.y = -0.55 + 0.065 * Math.sin(angle));
  root.scale.setScalar(0.98);
  return root;
}
function grain() {
  const size = 64, data = new Uint8Array(size * size * 4);
  let seed = 17;
  for (let i = 0; i < size * size; i++) {
    seed = seed * 1664525 + 1013904223 >>> 0;
    const value = 160 + seed % 80;
    data.set([value, value, value, 255], i * 4);
  }
  const texture = new THREE5.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE5.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.needsUpdate = true;
  return texture;
}
var realisticModels = {
  /** A keyboard whose keys press in a wave, a cable and a floating key cap. */
  ai(stage, ticks, { graphite, paper: paper2, leather }) {
    const keyboard = group(stage, 0, -0.48, 0.16);
    block(keyboard, 2.5, 0.25, 1.2, graphite);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 8; col++) {
        const key = block(
          keyboard,
          0.25,
          0.16,
          0.27,
          col === 7 ? leather : paper2,
          -1.04 + col * 0.296,
          0.17,
          -0.4 + row * 0.34,
          0.035
        );
        block(key, 0.07, 6e-3, 0.025, col === 7 ? paper2 : graphite, -0.055, 0.083, -0.04, 2e-3);
        const phase2 = (row * 8 + col) / 24 * TAU;
        ticks.push((angle) => key.position.y = 0.17 - 0.055 * Math.max(0, Math.cos(angle - phase2)) ** 18);
      }
    const cable = path(
      stage,
      [vec(1, -0.42, -0.49), vec(1.3, -0.27, -0.9), vec(0.5, -0.13, -1), vec(-0.5, -0.1, -0.78)],
      graphite,
      0.037
    );
    cable.rotation.y = 0.02;
    const cap = group(stage, 0.36, 0.67, 0.05);
    block(cap, 0.64, 0.32, 0.64, paper2, 0, 0.09, 0, 0.09);
    block(cap, 0.3, 0.16, 0.3, leather, 0, -0.17);
    ticks.push((angle) => {
      cap.position.y = 0.67 + 0.09 * Math.sin(angle);
      cap.rotation.y = 0.25 + 0.12 * Math.sin(angle);
    });
  },
  /** A felt ball with its seam beside a strung racket. */
  tennis(stage, ticks, { texture, steel, graphite, paper: paper2, leather }) {
    const BALL_RADIUS = 0.57;
    const HOOP_ASPECT = 1.24;
    const STRING_RADIUS = 0.52;
    const STRING_COLOR = 12631465;
    const felt = standard(12765251, 0.99);
    felt.roughnessMap = texture;
    const ball2 = sphere2(stage, BALL_RADIUS, felt, -0.5, -0.2, 0.15);
    const seamPoints = Array.from({ length: 97 }, (_, i) => {
      const a = i / 96 * TAU;
      return vec(
        0.567 * Math.cos(a),
        0.567 * Math.sin(a) * Math.cos(0.5 * Math.cos(a * 2)),
        0.567 * Math.sin(a) * Math.sin(0.5 * Math.cos(a * 2))
      );
    });
    path(ball2, seamPoints, paper2, 0.015, true);
    const racket2 = group(stage, 0.57, 0.22, -0.1);
    racket2.rotation.set(0.3, -0.2, -0.43);
    const hoop = ring(racket2, 0.57, 0.043, graphite, 0, 0.22);
    hoop.scale.y = HOOP_ASPECT;
    ring(racket2, 0.533, 0.012, steel, 0, 0.22).scale.y = HOOP_ASPECT;
    for (let i = -5; i <= 5; i++) {
      const x = i * 0.085, halfHeight = Math.sqrt(STRING_RADIUS ** 2 - x * x) * HOOP_ASPECT;
      rod2(racket2, vec(x, 0.22 - halfHeight, 0.015), vec(x, 0.22 + halfHeight, 0.015), STRING_COLOR, 4e-3);
      const y = i * 0.108, halfWidth = Math.sqrt(STRING_RADIUS ** 2 - (y / HOOP_ASPECT) ** 2);
      rod2(racket2, vec(-halfWidth, 0.22 + y, 0.017), vec(halfWidth, 0.22 + y, 0.017), STRING_COLOR, 4e-3);
    }
    rod2(racket2, vec(-0.23, -0.37), vec(0, -0.7), 3489604, 0.026);
    rod2(racket2, vec(0.23, -0.37), vec(0, -0.7), 3489604, 0.026);
    block(racket2, 0.14, 0.48, 0.13, leather, 0, -0.91);
    for (let i = 0; i < 8; i++) ring(racket2, 0.081, 6e-3, graphite, 0, -0.71 - i * 0.05).rotation.x = Math.PI / 2;
    block(stage, 2.6, 9e-3, 0.025, paper2, 0, -0.775, 0.59, 2e-3);
    ticks.push((angle) => ball2.rotation.set(0.08 * Math.sin(angle), angle, 0));
  },
  /** A steel compass lying on a contour map; its needle hunts and settles. */
  travel(stage, ticks, { steel, graphite, paper: paper2, leather }) {
    const compass = group(stage, -0.18, -0.69, 0.1);
    compass.rotation.x = -Math.PI / 2;
    cylinder(compass, 0.85, 0.14, steel).rotation.x = Math.PI / 2;
    cylinder(compass, 0.77, 0.02, paper2, 0, 0, 0.09).rotation.x = Math.PI / 2;
    ring(compass, 0.78, 0.033, graphite, 0, 0, 0.105);
    for (let i = 0; i < 48; i++) {
      const a = i * TAU / 48;
      const mark = block(
        compass,
        0.014,
        i % 4 === 0 ? 0.12 : 0.05,
        0.012,
        graphite,
        0.67 * Math.sin(a),
        0.67 * Math.cos(a),
        0.12,
        2e-3
      );
      mark.rotation.z = -a;
    }
    const needle = group(compass, 0, 0, 0.15);
    const shape = new THREE5.Shape();
    shape.moveTo(-0.1, 0);
    shape.lineTo(0, 0.57);
    shape.lineTo(0.1, 0);
    shape.lineTo(0, -0.45);
    shape.closePath();
    mesh(needle, new THREE5.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false }), leather);
    sphere2(compass, 0.055, steel, 0, 0, 0.21);
    ring(compass, 0.17, 0.033, steel, 0, 1.01, 0.03);
    for (let i = 0; i < 8; i++)
      path(
        stage,
        Array.from({ length: 20 }, (_, j) => {
          const x = -1.32 + j * 0.14;
          return vec(x, -0.775, -0.8 + i * 0.21 + 0.065 * Math.sin(x * 4 + i));
        }),
        10203027,
        5e-3
      );
    ticks.push((angle) => needle.rotation.z = 0.32 + 0.24 * Math.sin(angle) * (0.75 + 0.25 * Math.cos(angle)));
  },
  /** Two stacked books, reading glasses and a leather bookmark. */
  reading(stage, ticks, { steel, graphite, paper: paper2, leather }) {
    for (let i = 0; i < 2; i++) {
      const book = group(stage, -0.18 + i * 0.15, -0.58 + i * 0.31, 0);
      book.rotation.y = i ? -0.13 : 0.08;
      const cover = i ? graphite : leather;
      block(book, 1.85, 0.055, 1.22, cover, 0, -0.12);
      block(book, 1.77, 0.2, 1.15, paper2);
      block(book, 1.85, 0.055, 1.22, cover, 0, 0.12);
      for (let n = 0; n < 7; n++) block(book, 1.77, 6e-3, 1.15, 13090216, 0, -0.077 + n * 0.023, 5e-3, 1e-3);
    }
    const glasses = group(stage, 0, 0.08, 0.05);
    glasses.rotation.x = -Math.PI / 2;
    for (const x of [-0.39, 0.39]) {
      ring(glasses, 0.3, 0.019, steel, x, 0);
      rod2(glasses, vec(x + Math.sign(x) * 0.28, 0), vec(x + Math.sign(x) * 0.27, 0.62, -0.04), 7632760, 0.016);
    }
    path(glasses, [vec(-0.09, 0), vec(0, 0.055), vec(0.09, 0)], steel, 0.018);
    const bookmark = block(stage, 0.17, 0.018, 0.9, leather, 0.65, -0.05, 0.44);
    bookmark.rotation.y = 0.09;
    ticks.push((angle) => stage.rotation.z = -0.06 + 0.025 * Math.sin(angle));
  },
  /** A circuit board with two spinning fans, a heat sink, contacts and a floating chip. */
  server(stage, ticks, { steel, graphite }) {
    const board = group(stage, 0, -0.57, 0);
    block(board, 2.35, 0.08, 1.45, standard(3431756, 0.7));
    for (let i = 0; i < 12; i++) block(board, 0.014, 5e-3, 1.15, steel, -1.05 + i * 0.19, 0.047);
    for (const x of [-0.65, 0.55]) {
      const fan = group(board, x, 0.23, 0);
      cylinder(fan, 0.44, 0.13, graphite);
      ring(fan, 0.405, 0.018, steel).rotation.x = Math.PI / 2;
      const rotor = group(fan, 0, 0.08, 0);
      for (let j = 0; j < 7; j++) {
        const bladeAngle = j * TAU / 7;
        const blade = block(rotor, 0.16, 0.025, 0.26, graphite, Math.sin(bladeAngle) * 0.21, 0, Math.cos(bladeAngle) * 0.21);
        blade.rotation.y = bladeAngle + 0.5;
      }
      cylinder(rotor, 0.12, 0.04, steel);
      ticks.push((angle) => rotor.rotation.y = angle * 3);
    }
    for (let i = 0; i < 9; i++) block(board, 0.035, 0.21, 0.6, steel, -0.3 + i * 0.065, 0.16, -0.42);
    for (let i = 0; i < 10; i++) block(board, 0.06, 0.014, 0.12, standard(colors2.gold, 0.3, 0.8), -0.8 + i * 0.17, 0.05, 0.72);
    const chip = block(stage, 0.64, 0.1, 0.64, steel, 0, 0.77, -0.08);
    block(chip, 0.43, 0.012, 0.43, graphite, 0, 0.06);
    ticks.push((angle) => {
      chip.position.y = 0.77 + 0.08 * Math.sin(angle);
      chip.rotation.y = 0.15 * Math.sin(angle);
    });
  },
  /** A ticker-tape roll unwinding a strip of printed candles. */
  trading(stage, ticks, { steel, graphite, paper: paper2, leather }) {
    const roll = group(stage, -0.87, 0.03, -0.1);
    roll.rotation.z = Math.PI / 2;
    cylinder(roll, 0.44, 0.7, paper2);
    cylinder(roll, 0.13, 0.71, graphite);
    const tape = group(stage, 0.27, -0.3, 0.17);
    tape.rotation.set(-Math.PI / 2, 0, -0.08);
    block(tape, 1.78, 0.7, 0.018, paper2);
    for (let i = 0; i < 12; i++) {
      const height = 0.09 + 0.12 * (i * 7 % 5) / 5;
      block(tape, 0.035, height, 0.012, i % 3 ? graphite : leather, -0.72 + i * 0.13, 0.03, 0.023, 2e-3);
      block(tape, 6e-3, height + 0.1, 0.012, graphite, -0.72 + i * 0.13, 0.03, 0.018, 1e-3);
    }
    for (let i = 0; i < 16; i++) block(tape, 0.028, 0.035, 0.012, graphite, -0.75 + i * 0.1, -0.23, 0.023, 1e-3);
    const wheel = ring(stage, 0.56, 0.032, steel, -0.87, 0.03, -0.1);
    wheel.rotation.y = Math.PI / 2;
    ticks.push((angle) => {
      roll.rotation.x = angle;
      wheel.rotation.x = angle;
    });
  }
};
function realistic(kind, ticks) {
  const root = new THREE5.Group(), texture = grain();
  const finishes = {
    texture,
    steel: standard(10200490, 0.28, 0.82),
    graphite: standard(2370866, 0.52, 0.3),
    paper: standard(15787213, 0.95),
    leather: standard(8603956, 0.84)
  };
  for (const finish of [finishes.steel, finishes.graphite, finishes.paper, finishes.leather]) finish.roughnessMap = texture;
  root.userData.dispose = () => texture.dispose();
  const stage = group(root);
  stage.rotation.set(0.48, -0.3, -0.06);
  block(stage, 2.95, 0.1, 2.05, standard(13222323, 0.95), 0, -0.84, 0, 0.035);
  realisticModels[kind](stage, ticks, finishes);
  ticks.push((angle) => stage.rotation.y = -0.3 + 0.07 * Math.sin(angle));
  return root;
}
var abstractModels = {
  /** Counter-rotating hoops round an amber octahedron, with six cobalt beads on a figure-eight orbit. */
  ai(root, ticks, { glass, amber, chrome, cobalt }) {
    const lattice = group(root);
    lattice.rotation.set(0.35, 0.5, 0.25);
    for (let i = 0; i < 3; i++) {
      const hoop = ring(lattice, 0.84 + i * 0.18, 0.09, i === 1 ? glass : chrome);
      hoop.rotation.set(i * 0.8, i * 0.6, 0.2);
      ticks.push((angle) => hoop.rotation.z = angle * (i % 2 ? 1 : -1));
    }
    mesh(lattice, new THREE5.OctahedronGeometry(0.49), amber);
    for (let i = 0; i < 6; i++) {
      const dot = sphere2(root, 0.105, cobalt);
      ticks.push((angle) => {
        const orbitAngle = angle + i * TAU / 6;
        dot.position.set(1.4 * Math.cos(orbitAngle), 0.85 * Math.sin(orbitAngle), 0.4 * Math.sin(orbitAngle * 2));
      });
    }
  },
  /** Two hoops squash as a cobalt ball passes through them on a looping track. */
  tennis(root, ticks, { glass, amber, chrome, cobalt }) {
    const pair = [group(root, -1, 0), group(root, 1, 0)];
    for (let i = 0; i < 2; i++) {
      const hoop = ring(pair[i], 0.64, 0.14, i ? glass : amber);
      hoop.scale.y = 1.42;
      pair[i].rotation.y = (i ? 1 : -1) * 0.35;
    }
    const ball2 = sphere2(root, 0.27, cobalt);
    const arc = path(
      root,
      Array.from({ length: 49 }, (_, i) => {
        const t = i / 48 * TAU;
        return vec(1.16 * Math.sin(t), 0.65 * Math.cos(t), 0.5 * Math.sin(t * 2));
      }),
      chrome,
      0.015,
      true
    );
    ticks.push((angle) => {
      ball2.position.set(1.16 * Math.sin(angle), 0.65 * Math.cos(angle), 0.5 * Math.sin(angle * 2));
      pair[0].scale.x = 1 - 0.1 * Math.max(0, -Math.sin(angle)) ** 8;
      pair[1].scale.x = 1 - 0.1 * Math.max(0, Math.sin(angle)) ** 8;
      arc.rotation.y = 0.04 * Math.sin(angle);
    });
  },
  /** Seven bars rising and falling on rails, inside a tilted brace. */
  trading(root, ticks, { glass, amber, chrome, cobalt }) {
    for (let i = 0; i < 7; i++) {
      const height = 0.7 + i * 3 % 5 * 0.22;
      const x = -1.17 + i * 0.39;
      const bar = block(root, 0.27, height, 0.42, i % 3 === 0 ? amber : i % 2 === 0 ? glass : cobalt, x, 0, 0, 0.12);
      rod2(root, vec(x, -1.3), vec(x, 1.3), 11057353, 9e-3);
      ticks.push((angle) => bar.position.y = 0.36 * Math.sin(angle + i * 0.62));
    }
    const brace = ring(root, 1.53, 0.016, chrome);
    brace.scale.y = 0.82;
    brace.rotation.x = 0.4;
  },
  /** Five twisting slabs, each with a counter-twisting core, between two cobalt cables. */
  server(root, ticks, { glass, amber, chrome, cobalt }) {
    for (let i = 0; i < 5; i++) {
      const slab2 = block(root, 1.65, 0.14, 1.03, i % 2 ? glass : chrome, 0, -1.03 + i * 0.51, 0, 0.06);
      const core = block(slab2, 0.5, 0.11, 0.4, i % 2 ? cobalt : amber, 0, 0.13, 0, 0.045);
      ticks.push((angle) => {
        slab2.rotation.y = 0.35 * Math.sin(angle + i * 0.55);
        core.rotation.y = -0.35 * Math.sin(angle + i * 0.55);
      });
    }
    for (const x of [-0.98, 0.98])
      path(root, [vec(x, -1.2), vec(x * 1.22, -0.5, 0.2), vec(x * 1.22, 0.5, -0.2), vec(x, 1.2)], cobalt, 0.03);
  },
  /** A cobalt traveller loops through four receding portals. */
  travel(root, ticks, { glass, amber, chrome, cobalt }) {
    for (let i = 0; i < 4; i++) {
      const portal = ring(root, 1.06 - i * 0.1, 0.12, i % 2 ? glass : amber, -0.48 + i * 0.32, 0, -0.7 + i * 0.43);
      portal.scale.y = 1.18;
      portal.rotation.y = -0.4;
      ticks.push((angle) => portal.rotation.z = 0.2 * Math.sin(angle + i * 0.4));
    }
    const journey = sphere2(root, 0.16, cobalt);
    ticks.push((angle) => journey.position.set(1.37 * Math.cos(angle), 0.75 * Math.sin(angle), 0.7 * Math.sin(angle)));
    path(
      root,
      Array.from({ length: 65 }, (_, i) => {
        const a = i / 64 * TAU;
        return vec(1.37 * Math.cos(a), 0.75 * Math.sin(a), 0.7 * Math.sin(a));
      }),
      chrome,
      0.014,
      true
    );
  },
  /** Individual curved leaves form an open, breathing ribbon sculpture. */
  reading(root, ticks, { glass, amber, chrome }) {
    for (let i = 0; i < 7; i++) {
      const points = Array.from({ length: 33 }, (_, j) => {
        const t = j / 32;
        return vec((t - 0.5) * 2.2, Math.sin(t * Math.PI) * 0.8, 0);
      });
      const ribbon = new THREE5.Shape();
      ribbon.moveTo(-1.1, 0);
      for (let j = 1; j < 33; j++) ribbon.lineTo(points[j].x, points[j].y);
      for (let j = 32; j >= 0; j--) ribbon.lineTo(points[j].x, points[j].y - 0.05);
      ribbon.closePath();
      const geometry = new THREE5.ExtrudeGeometry(ribbon, {
        depth: 0.55,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.012,
        bevelSegments: 2,
        steps: 1
      });
      geometry.translate(0, 0, -0.275);
      const leaf = mesh(root, geometry, i % 3 === 0 ? glass : i % 2 ? chrome : amber, 0, -1.12 + i * 0.27, (i - 3) * 0.11);
      leaf.rotation.y = 0.4;
      ticks.push((angle) => {
        leaf.rotation.z = 0.08 * Math.sin(angle + i * 0.38);
        leaf.position.y = -1.12 + i * 0.27 + 0.045 * Math.sin(angle + i * 0.38);
      });
    }
  }
};
function abstract(kind, ticks) {
  const root = new THREE5.Group();
  root.rotation.set(0.12, -0.25, 0);
  const glazes = {
    glass: new THREE5.MeshPhysicalMaterial({
      color: 10868961,
      roughness: 0.12,
      metalness: 0.05,
      transmission: 0.72,
      thickness: 0.6,
      ior: 1.45,
      clearcoat: 1,
      envMapIntensity: 1.2
    }),
    amber: new THREE5.MeshPhysicalMaterial({
      color: 15377510,
      roughness: 0.16,
      metalness: 0.05,
      transmission: 0.55,
      thickness: 0.5,
      ior: 1.4,
      clearcoat: 1
    }),
    chrome: standard(11057353, 0.18, 0.86),
    cobalt: standard(4414154, 0.32, 0.25)
  };
  abstractModels[kind](root, ticks, glazes);
  ticks.push((angle) => root.rotation.y = -0.25 + 0.12 * Math.sin(angle));
  return root;
}
var STYLES = ["cartoon", "realistic", "abstract"];
var BUILDERS = [cartoon, realistic, abstract];
function createExpandedDirection(kind, variant) {
  const ticks = [];
  const object = BUILDERS[variant - 3](kind, ticks);
  const style = STYLES[variant - 3];
  object.userData.style = style;
  playLoop(object, ticks, REST_MS2, `${style}-study`);
  return object;
}

// src/objects/art-directions.ts
var directionTokens = {
  paper: { cream: 16771261, peach: 15311480, coral: 12473919, blue: 5799313, teal: 3567208, ink: 3423825 },
  kinetic: { ivory: 15984588, gold: 12357970, dark: 2504777, blue: 6654873, orange: 12676166 }
};
var paper = directionTokens.paper;
var kinetic = directionTokens.kinetic;
var REST_MS3 = 1800;
var material = (color, metal = false) => new THREE5.MeshStandardMaterial({ color, roughness: metal ? 0.3 : 0.87, metalness: metal ? 0.55 : 0.02 });
function addMesh2(parent, geometry, color, x = 0, y = 0, z = 0, metal = false) {
  const mesh3 = new THREE5.Mesh(geometry, material(color, metal));
  mesh3.position.set(x, y, z);
  parent.add(mesh3);
  return mesh3;
}
function box2(parent, width, height, depth, color, x = 0, y = 0, z = 0) {
  return addMesh2(
    parent,
    new RoundedBoxGeometry(width, height, depth, 1, Math.min(0.018, width / 4, height / 4, depth / 4)),
    color,
    x,
    y,
    z
  );
}
function ball(parent, radius, color, x = 0, y = 0, z = 0, metal = false) {
  return addMesh2(parent, new THREE5.SphereGeometry(radius, 24, 16), color, x, y, z, metal);
}
function disc(parent, radius, depth, color, x = 0, y = 0, z = 0) {
  const mesh3 = addMesh2(parent, new THREE5.CylinderGeometry(radius, radius, depth, 64), color, x, y, z);
  mesh3.rotation.x = Math.PI / 2;
  return mesh3;
}
function ring2(parent, radius, tube2, color, x = 0, y = 0, z = 0, metal = false) {
  return addMesh2(parent, new THREE5.TorusGeometry(radius, tube2, 10, 80), color, x, y, z, metal);
}
function cutout(parent, points, color, z = 0, depth = 0.065) {
  const shape = new THREE5.Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  const geometry = new THREE5.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 6e-3,
    bevelSize: 8e-3,
    bevelSegments: 1,
    steps: 1
  });
  return addMesh2(parent, geometry, color, 0, 0, z);
}
function curve(parent, points, color, radius = 0.018) {
  return addMesh2(parent, new THREE5.TubeGeometry(new THREE5.CatmullRomCurve3(points), 64, radius, 6, false), color);
}
function rod3(parent, from, to, color, radius = 0.015) {
  const delta = to.clone().sub(from);
  const mesh3 = addMesh2(parent, new THREE5.CylinderGeometry(radius, radius, delta.length(), 8), color);
  mesh3.position.copy(from).add(to).multiplyScalar(0.5);
  mesh3.quaternion.setFromUnitVectors(new THREE5.Vector3(0, 1, 0), delta.normalize());
  return mesh3;
}
function paperTree(parent, x, y, z, scale = 1) {
  const tree2 = new THREE5.Group();
  tree2.position.set(x, y, z);
  tree2.scale.setScalar(scale);
  parent.add(tree2);
  box2(tree2, 0.045, 0.6, 0.08, 8149317, 0, 0.18);
  cutout(
    tree2,
    [
      [-0.28, 0.24],
      [0, 0.91],
      [0.28, 0.24]
    ],
    paper.teal,
    0.02
  );
  cutout(
    tree2,
    [
      [-0.22, 0.5],
      [0, 1.08],
      [0.22, 0.5]
    ],
    6657413,
    0.07
  );
  return tree2;
}
function plane(parent, color) {
  const craft = new THREE5.Group();
  cutout(
    craft,
    [
      [0, 0.32],
      [-0.28, -0.18],
      [0, -0.06],
      [0.28, -0.18]
    ],
    color,
    0,
    0.04
  );
  cutout(
    craft,
    [
      [0, 0.32],
      [-0.045, -0.23],
      [0.045, -0.23]
    ],
    16775141,
    0.045,
    0.03
  );
  parent.add(craft);
  return craft;
}
function racket(parent, color, metal = false) {
  const HOOP_Y = 0.2;
  const HOOP_ASPECT = 1.25;
  const STRING_RADIUS = 0.44;
  const STRING_COLOR = 11909547;
  const model = new THREE5.Group();
  parent.add(model);
  const hoop = ring2(model, 0.47, 0.038, color, 0, HOOP_Y, 0, metal);
  hoop.scale.y = HOOP_ASPECT;
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.105, y = i * 0.135;
    const halfHeight = Math.sqrt(STRING_RADIUS ** 2 - x * x) * HOOP_ASPECT;
    rod3(model, vec(x, HOOP_Y - halfHeight, 0.01), vec(x, HOOP_Y + halfHeight, 0.01), STRING_COLOR, 6e-3);
    const halfWidth = Math.sqrt(Math.max(0, STRING_RADIUS ** 2 - (y / HOOP_ASPECT) ** 2));
    rod3(model, vec(-halfWidth, HOOP_Y + y, 0.012), vec(halfWidth, HOOP_Y + y, 0.012), STRING_COLOR, 6e-3);
  }
  rod3(model, vec(-0.2, -0.32), vec(0, -0.66), color, 0.023);
  rod3(model, vec(0.2, -0.32), vec(0, -0.66), color, 0.023);
  box2(model, 0.12, 0.47, 0.12, 3754571, 0, -0.86);
  for (let i = 0; i < 6; i++) box2(model, 0.127, 0.013, 0.126, 8096133, 0, -0.68 - i * 0.062);
  return model;
}
function paperStage(root) {
  disc(root, 1.74, 0.14, paper.peach, 0, 0, -0.45);
  disc(root, 1.6, 0.08, paper.cream, 0, 0, -0.34);
  const halo = ring2(root, 1.68, 0.035, paper.coral, 0, 0, -0.28);
  halo.scale.y = 1.02;
}
var paperModels = {
  /** Layered hills, a road and trees, with a paper plane looping overhead. */
  travel(root, ticks) {
    disc(root, 0.34, 0.045, paper.coral, 0.78, 0.88, -0.2);
    cutout(
      root,
      [
        [-1.53, -0.54],
        [-0.93, 0.9],
        [-0.27, -0.05],
        [0.28, 0.77],
        [1.51, -0.55],
        [1.25, -1.05],
        [-1.25, -1.05]
      ],
      paper.blue,
      -0.11
    );
    cutout(
      root,
      [
        [-1.45, -0.65],
        [-0.62, 0.38],
        [0.13, -0.21],
        [0.9, 0.48],
        [1.46, -0.62],
        [1.16, -1.15],
        [-1.16, -1.15]
      ],
      paper.teal,
      0.17
    );
    cutout(
      root,
      [
        [-1.25, -1.02],
        [-0.91, -0.48],
        [-0.18, -0.77],
        [0.57, -0.44],
        [1.24, -0.97],
        [0.74, -1.42],
        [-0.64, -1.42]
      ],
      9547149,
      0.43
    );
    curve(
      root,
      [vec(-0.83, -1.04, 0.52), vec(-0.17, -0.75, 0.53), vec(0.12, -0.46, 0.28), vec(0.54, -0.35, 0.25)],
      paper.cream,
      0.055
    );
    paperTree(root, -0.89, -0.82, 0.5, 0.55);
    paperTree(root, 0.9, -0.87, 0.49, 0.4);
    const flyer = plane(root, paper.cream);
    flyer.scale.setScalar(0.65);
    ticks.push((angle) => {
      flyer.position.set(Math.cos(angle) * 1.25, 0.92 + Math.sin(angle) * 0.21, 0.6 + Math.sin(angle) * 0.12);
      flyer.rotation.z = Math.atan2(0.21 * Math.cos(angle), -1.25 * Math.sin(angle)) - Math.PI / 2;
    });
  },
  /** An open book with a pop-up portal, steps and drifting paper slips. */
  reading(root, ticks) {
    const book = new THREE5.Group();
    root.add(book);
    book.position.set(0, -0.85, 0.63);
    book.rotation.x = 0.65;
    for (const side of [-1, 1]) {
      const leaf = new THREE5.Group();
      book.add(leaf);
      leaf.rotation.y = side * 0.14;
      box2(leaf, 1.25, 0.14, 1.48, paper.coral, side * 0.64, 0, 0);
      for (let i = 0; i < 5; i++) box2(leaf, 1.2, 0.024, 1.4, paper.cream, side * 0.62, 0.1 + i * 0.032, 0);
    }
    const portal = new THREE5.Group();
    portal.position.set(0, -0.49, 0.5);
    root.add(portal);
    box2(portal, 0.3, 1.25, 0.14, paper.blue, -0.58, 0.53);
    box2(portal, 0.3, 1.25, 0.14, paper.blue, 0.58, 0.53);
    cutout(
      portal,
      [
        [-0.84, 1.05],
        [0, 1.69],
        [0.84, 1.05]
      ],
      paper.coral,
      0.02
    );
    for (let i = 0; i < 5; i++) box2(root, 0.78, 0.1, 0.22, paper.peach, 0, -0.91 + i * 0.1, 1.13 - i * 0.14);
    paperTree(root, -1.04, -0.64, 0.71, 0.53);
    paperTree(root, 1.06, -0.64, 0.64, 0.4);
    for (let i = 0; i < 5; i++) {
      const slip = box2(root, 0.26, 0.36, 0.025, i % 2 ? paper.blue : paper.cream, -1 + i * 0.5, 1.03, 0.32);
      ticks.push((angle) => {
        slip.position.y = 1.1 + 0.15 * Math.sin(angle + i);
        slip.rotation.z = 0.2 * Math.sin(angle + i);
        slip.rotation.y = 0.25 * Math.cos(angle + i);
      });
    }
    ticks.push((angle) => portal.rotation.y = 0.1 * Math.sin(angle));
  },
  /** Top-down graphic court, floating above the paper disc, with a physically raised net. */
  tennis(root, ticks) {
    const court = new THREE5.Group();
    root.add(court);
    court.rotation.z = -0.25;
    box2(court, 1.83, 2.62, 0.08, paper.teal, 0, 0, 0.12);
    for (const x of [-0.79, -0.57, 0.57, 0.79]) box2(court, 0.014, 2.35, 0.012, paper.cream, x, 0, 0.175);
    for (const y of [-1.17, -0.57, 0.57, 1.17]) box2(court, 1.58, 0.015, 0.012, paper.cream, 0, y, 0.175);
    box2(court, 0.014, 1.14, 0.012, paper.cream, 0, 0, 0.175);
    box2(court, 1.96, 0.035, 0.33, paper.ink, 0, 0, 0.29);
    for (let i = -12; i <= 12; i++) box2(court, 0.012, 0.018, 0.31, paper.cream, i * 0.073, -0.025, 0.3);
    const nearRacket = racket(court, paper.coral), farRacket = racket(court, paper.peach);
    nearRacket.scale.setScalar(0.43);
    farRacket.scale.setScalar(0.43);
    farRacket.rotation.z = Math.PI;
    nearRacket.position.set(-0.34, -1.1, 0.36);
    farRacket.position.set(0.34, 1.1, 0.36);
    const tennisBall = ball(court, 0.075, 16372320);
    ticks.push((angle) => {
      tennisBall.position.set(0.34 * Math.sin(angle), 1.02 * Math.sin(angle), 0.4 + 0.46 * Math.cos(angle) ** 2);
      nearRacket.rotation.z = 0.25 * Math.cos(angle);
      farRacket.rotation.z = Math.PI + 0.25 * Math.cos(angle);
    });
  },
  /** A cut-paper automaton feeding a cascade of physical instruction cards. */
  ai(root, ticks) {
    const head = new THREE5.Group();
    root.add(head);
    head.position.set(-0.54, 0.14, 0.47);
    box2(head, 1.14, 0.94, 0.3, paper.blue);
    box2(head, 0.91, 0.55, 0.06, paper.cream, 0, 0.03, 0.18);
    for (const x of [-0.24, 0.24]) disc(head, 0.09, 0.03, paper.ink, x, 0.08, 0.23);
    box2(head, 0.31, 0.025, 0.035, paper.coral, 0, -0.14, 0.23);
    rod3(head, vec(0, 0.47), vec(0, 0.73), paper.coral, 0.028);
    ball(head, 0.085, paper.coral, 0, 0.78);
    for (let i = 0; i < 3; i++) {
      const card = new THREE5.Group();
      root.add(card);
      card.position.set(0.64 + i * 0.15, 0.23 - i * 0.4, 0.05 + i * 0.28);
      card.rotation.z = -0.12;
      box2(card, 0.85, 0.52, 0.07, [paper.peach, paper.cream, paper.teal][i]);
      for (let j = 0; j < 3; j++)
        box2(card, 0.55 - j * 0.08, 0.025, 0.01, i === 2 ? paper.cream : paper.ink, -j * 0.04, 0.13 - j * 0.11, 0.045);
      ticks.push((angle) => {
        card.position.x = 0.64 + i * 0.15 + 0.06 * Math.sin(angle + i * 0.9);
        card.rotation.y = 0.14 * Math.sin(angle + i * 0.9);
      });
    }
    cutout(
      root,
      [
        [-1.07, -0.58],
        [-0.1, -0.58],
        [-0.1, -0.87],
        [0.1, -0.7],
        [-0.1, -0.48],
        [-0.1, -0.65],
        [-1.07, -0.65]
      ],
      paper.coral,
      0.58
    );
    ticks.push((angle) => {
      head.rotation.z = 0.06 * Math.sin(angle);
      head.position.y = 0.14 + 0.06 * Math.cos(angle);
    });
  },
  /** A tower of four sliding server drawers, with status dots climbing beside it. */
  server(root, ticks) {
    const tower = new THREE5.Group();
    root.add(tower);
    tower.rotation.y = -0.35;
    for (let i = 0; i < 4; i++) {
      const layer = new THREE5.Group();
      tower.add(layer);
      layer.position.y = -0.94 + i * 0.61;
      box2(layer, 1.6, 0.42, 0.55, [paper.blue, paper.teal, paper.coral, paper.blue][i]);
      box2(layer, 1.38, 0.25, 0.025, paper.cream, 0, 0, 0.29);
      for (let j = 0; j < 6; j++) box2(layer, 0.075, 0.12, 0.024, paper.ink, -0.5 + j * 0.145, 0, 0.32);
      disc(layer, 0.042, 0.03, paper.coral, 0.54, 0, 0.33);
      const tab = cutout(
        layer,
        [
          [0.8, -0.12],
          [1.02, -0.12],
          [1.02, 0.12],
          [0.8, 0.12]
        ],
        paper.peach,
        -0.05
      );
      ticks.push((angle) => {
        layer.position.x = 0.12 * Math.sin(angle + i * 0.7);
        tab.rotation.y = 0.15 * Math.sin(angle);
      });
    }
    for (let i = 0; i < 4; i++) {
      const dot = disc(root, 0.055, 0.04, paper.coral, -1.18, -0.9 + i * 0.55, 0.1);
      ticks.push((angle) => dot.position.y = -0.9 + i * 0.55 + 0.06 * Math.sin(angle + i));
    }
  },
  /** Price history as a dimensional paper accordion, intentionally labelled a study by the host. */
  trading(root, ticks) {
    const BAR_HEIGHTS = [0.37, 0.64, 0.47, 0.88, 0.69, 1.02, 0.87];
    for (let i = 0; i < 7; i++) {
      const panel = new THREE5.Group();
      root.add(panel);
      panel.position.set(-1.2 + i * 0.39, 0, 0.12 + i * 0.055);
      panel.rotation.y = (i % 2 ? 1 : -1) * 0.2;
      box2(panel, 0.39, 1.8, 0.045, i % 2 ? paper.cream : 16177059);
      const height = BAR_HEIGHTS[i];
      box2(panel, 0.15, height, 0.055, i === 2 || i === 4 ? paper.coral : paper.teal, 0, -0.55 + height / 2, 0.065);
      box2(panel, 0.018, height + 0.26, 0.045, paper.ink, 0, -0.55 + height / 2, 0.05);
      box2(panel, 0.19, 0.12 + i % 3 * 0.045, 0.025, paper.blue, 0, -0.74, 0.08);
      ticks.push((angle) => panel.rotation.y = (i % 2 ? 1 : -1) * (0.18 + 0.11 * Math.sin(angle)));
    }
    curve(
      root,
      [vec(-1.3, -1.14, 0.66), vec(-0.6, -1.02, 0.66), vec(0.3, -1.1, 0.66), vec(1.27, -0.9, 0.66)],
      paper.coral,
      0.025
    );
  }
};
function paperWorld(kind, ticks) {
  const root = new THREE5.Group();
  paperStage(root);
  paperModels[kind](root, ticks);
  ticks.push((angle) => {
    root.rotation.set(-0.18 + 0.035 * Math.cos(angle), -0.34 + 0.1 * Math.sin(angle), -0.035);
  });
  return root;
}
function kineticPlinth(root) {
  const base = addMesh2(root, new THREE5.CylinderGeometry(0.93, 1.05, 0.16, 64), kinetic.dark, 0, -1.49, 0);
  base.rotation.x = 0;
  ring2(root, 0.96, 0.012, kinetic.gold, 0, -1.48, 0, true).rotation.x = Math.PI / 2;
  addMesh2(root, new THREE5.CylinderGeometry(0.85, 0.91, 0.06, 64), kinetic.dark, 0, -1.59, 0);
  ring2(root, 0.94, 0.018, kinetic.gold, 0, -1.4, 0, true).rotation.x = Math.PI / 2;
}
var kineticModels = {
  /** A brass icosahedron core with three chips on tilted orbits. */
  ai(root, ticks) {
    const core = addMesh2(root, new THREE5.IcosahedronGeometry(0.52, 0), kinetic.gold, 0, 0.1, 0, true);
    for (let i = 0; i < 3; i++) {
      const orbit = new THREE5.Group();
      root.add(orbit);
      orbit.position.y = 0.1;
      orbit.rotation.set(0.7 + i * 0.6, i * 0.8, 0.3 + i * 0.7);
      const radius = 1.2 + i * 0.12;
      ring2(orbit, radius, 0.018, kinetic.gold, 0, 0, 0, true);
      const chip = box2(orbit, 0.3, 0.3, 0.12, [kinetic.dark, kinetic.blue, kinetic.orange][i]);
      for (let j = -1; j <= 1; j++) {
        box2(chip, 0.035, 0.06, 0.05, kinetic.gold, j * 0.075, 0.18);
        box2(chip, 0.035, 0.06, 0.05, kinetic.gold, j * 0.075, -0.18);
      }
      ticks.push((angle) => {
        const orbitAngle = angle + i * TAU / 3;
        chip.position.set(Math.cos(orbitAngle) * radius, Math.sin(orbitAngle) * radius, 0);
        chip.rotation.z = orbitAngle;
      });
    }
    ticks.push((angle) => {
      core.rotation.set(angle, 0.5 * Math.sin(angle), angle);
    });
  },
  /** A turning globe in a brass meridian, with a plane on an orbit ring. */
  travel(root, ticks) {
    const GLOBE_RADIUS = 0.85;
    const globe = new THREE5.Group();
    root.add(globe);
    globe.position.y = 0.08;
    globe.rotation.z = -0.28;
    ball(globe, 0.83, kinetic.blue);
    for (let i = 0; i < 6; i++) {
      const longitude = ring2(globe, GLOBE_RADIUS, 9e-3, kinetic.ivory);
      longitude.rotation.y = i * Math.PI / 6;
    }
    for (const latitude of [-0.5, 0, 0.5]) {
      const parallel = ring2(globe, Math.sqrt(GLOBE_RADIUS ** 2 - latitude ** 2), 9e-3, kinetic.ivory, 0, latitude);
      parallel.rotation.x = Math.PI / 2;
    }
    const meridian = ring2(root, 1.08, 0.045, kinetic.gold, 0, 0.08, 0, true);
    meridian.rotation.y = 0.3;
    meridian.rotation.z = -0.28;
    rod3(root, vec(0, -1.41), vec(0, -1), kinetic.gold, 0.055);
    const orbit = new THREE5.Group();
    root.add(orbit);
    orbit.position.y = 0.08;
    orbit.rotation.set(0.6, -0.3, -0.35);
    ring2(orbit, 1.34, 0.014, kinetic.gold, 0, 0, 0, true);
    const flyer = plane(orbit, kinetic.ivory);
    flyer.scale.setScalar(0.53);
    ticks.push((angle) => {
      globe.rotation.y = angle;
      flyer.position.set(1.34 * Math.cos(angle), 1.34 * Math.sin(angle), 0);
      flyer.rotation.z = angle;
    });
  },
  /** A brass racket on a stand, with a ball circling it on a ring. */
  tennis(root, ticks) {
    const brassRacket = racket(root, kinetic.gold, true);
    brassRacket.scale.setScalar(1.17);
    brassRacket.position.set(-0.34, 0.12, 0.12);
    brassRacket.rotation.set(0.15, -0.4, -0.4);
    const path2 = new THREE5.Group();
    root.add(path2);
    path2.rotation.set(0.65, -0.4, -0.35);
    path2.position.set(0.22, 0.35, 0.1);
    ring2(path2, 1.18, 0.012, kinetic.gold, 0, 0, 0, true);
    const tennisBall = ball(path2, 0.19, 14014838);
    ring2(tennisBall, 0.189, 8e-3, kinetic.ivory).rotation.y = Math.PI / 2;
    ticks.push((angle) => {
      tennisBall.position.set(1.18 * Math.cos(angle), 1.18 * Math.sin(angle), 0);
      tennisBall.rotation.z = angle * 2;
      brassRacket.rotation.y = -0.4 + 0.18 * Math.sin(angle);
    });
    rod3(root, vec(-0.3, -1.4), vec(-0.3, -0.8), kinetic.gold, 0.035);
  },
  /** Four bobbing server trays, each with a spinning fan, between two brass posts. */
  server(root, ticks) {
    const tower = new THREE5.Group();
    root.add(tower);
    tower.rotation.set(0.4, -0.48, 0);
    for (let i = 0; i < 4; i++) {
      const layer = new THREE5.Group();
      tower.add(layer);
      box2(layer, 1.4, 0.1, 0.95, i % 2 ? kinetic.ivory : kinetic.dark);
      const fan = ring2(layer, 0.28, 0.024, kinetic.gold, 0, 0.09, 0, true);
      fan.rotation.x = -Math.PI / 2;
      for (let blade = 0; blade < 6; blade++) {
        const bladeAngle = blade * TAU / 6;
        const vane = box2(fan, 0.12, 0.23, 0.025, kinetic.blue, Math.cos(bladeAngle) * 0.14, Math.sin(bladeAngle) * 0.14);
        vane.rotation.z = bladeAngle - 0.4;
      }
      for (const x of [-0.58, 0.58]) for (const z of [-0.36, 0.36]) ball(layer, 0.037, kinetic.gold, x, 0.08, z, true);
      ticks.push((angle) => {
        layer.position.y = -0.91 + i * 0.61 + 0.075 * Math.sin(angle + i * 0.65);
        fan.rotation.z = angle * 2;
      });
    }
    for (const x of [-0.61, 0.61]) rod3(tower, vec(x, -1.3, -0.4), vec(x, 1.21, -0.4), kinetic.gold, 0.018);
    ticks.push((angle) => tower.rotation.y = -0.48 + 0.12 * Math.sin(angle));
  },
  /** A suspended fan of individual rigid leaves, each with its own hinge, and a ribbon bookmark. */
  reading(root, ticks) {
    const LEAVES = 13;
    const book = new THREE5.Group();
    root.add(book);
    book.name = "kinetic-folio";
    book.rotation.set(0.32, -0.4, -0.15);
    book.position.y = 0.12;
    for (let i = 0; i < LEAVES; i++) {
      const hinge = new THREE5.Group();
      book.add(hinge);
      hinge.rotation.y = -1.3 + i * 0.21;
      const cover = i === 0 || i === LEAVES - 1;
      box2(hinge, 1.16, 1.59, 0.025, cover ? kinetic.dark : kinetic.ivory, 0.59, 0, 0);
      if (i % 3 === 0 && i > 0 && i < LEAVES - 1)
        for (let j = 0; j < 7; j++) box2(hinge, 0.72, 0.012, 7e-3, kinetic.gold, 0.62, 0.49 - j * 0.15, 0.017);
      ticks.push((angle) => hinge.rotation.y = -1.3 + i * 0.21 + 0.045 * Math.sin(angle + i * 0.22));
    }
    rod3(book, vec(0, -0.91), vec(0, 0.91), kinetic.gold, 0.06);
    const ribbon = curve(
      root,
      [vec(-0.85, -1.03, 0.3), vec(-1.2, -0.4, 0.5), vec(-1.05, 0.5, 0.2), vec(-0.48, 1.3, -0.2), vec(0.58, 1.15, -0.4)],
      kinetic.gold,
      0.022
    );
    ticks.push((angle) => {
      book.rotation.y = -0.4 + angle;
      book.rotation.z = -0.15 + 0.075 * Math.sin(angle);
      ribbon.rotation.y = 0.15 * Math.sin(angle);
    });
  },
  /** Market balance: candles are hanging weights, not a fabricated live feed. */
  trading(root, ticks) {
    const BEAM_Y = 0.94;
    const CANDLE_HEIGHTS = [0.32, 0.57, 0.43];
    rod3(root, vec(0, -1.4), vec(0, BEAM_Y), kinetic.gold, 0.045);
    ball(root, 0.09, kinetic.gold, 0, BEAM_Y, 0, true);
    const beam = new THREE5.Group();
    root.add(beam);
    beam.position.y = BEAM_Y;
    rod3(beam, vec(-1.2, 0), vec(1.2, 0), kinetic.gold, 0.037);
    for (const side of [-1, 1]) {
      const tray = new THREE5.Group();
      beam.add(tray);
      tray.position.x = side * 0.91;
      for (const x of [-0.37, 0.37]) rod3(tray, vec(0, 0), vec(x, -0.95), kinetic.gold, 0.012);
      const platter = addMesh2(tray, new THREE5.CylinderGeometry(0.48, 0.4, 0.08, 40), kinetic.ivory, 0, -1, 0);
      for (let i = 0; i < 3; i++) {
        const height = CANDLE_HEIGHTS[i];
        const x = -0.22 + i * 0.22;
        box2(tray, 0.12, height, 0.12, side < 0 ? kinetic.blue : kinetic.orange, x, -0.92 + height / 2, 0);
        rod3(tray, vec(x, -0.91), vec(x, -0.85 + height), kinetic.gold, 9e-3);
      }
      ticks.push((angle) => {
        tray.rotation.z = -0.14 * Math.sin(angle);
        platter.rotation.y = angle;
      });
    }
    ticks.push((angle) => beam.rotation.z = 0.14 * Math.sin(angle));
  }
};
function kineticWorld(kind, ticks) {
  const root = new THREE5.Group();
  kineticPlinth(root);
  kineticModels[kind](root, ticks);
  ticks.push((angle) => root.rotation.y = 0.18 + 0.12 * Math.sin(angle));
  return root;
}
function createArtDirection(kind, variant) {
  if (variant >= 3) return createExpandedDirection(kind, variant);
  const ticks = [];
  const root = variant === 1 ? paperWorld(kind, ticks) : kineticWorld(kind, ticks);
  root.userData.style = variant === 1 ? "paper-theatre" : "kinetic";
  playLoop(root, ticks, REST_MS3, variant === 1 ? "paper-parallax" : "kinetic-orbit");
  return root;
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

// src/package-assets.ts
function tennisModelUrl() {
  if (!import.meta.url)
    throw new Error("uipack: the CommonJS build cannot locate assets/objects/tennis-return.glb; pass modelUrl");
  return new URL("../assets/objects/tennis-return.glb", import.meta.url).href;
}

// src/objects/scenes.ts
var DURATION = 5400;
var p = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
var ease = (x) => x * x * x * (x * (x * 6 - 15) + 10);
var mix = THREE5.MathUtils.lerp;
var mat = (color) => new THREE5.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04 });
var mesh2 = (g, color, x = 0, y = 0, z = 0) => {
  const m = new THREE5.Mesh(g, mat(color));
  m.position.set(x, y, z);
  return m;
};
function slab(w, h, d, color, x = 0, y = 0, z = 0, r = 0.06) {
  r = Math.min(r, w / 2, h / 2);
  const s = new THREE5.Shape();
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
  const g = new THREE5.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    curveSegments: 8
  });
  g.translate(0, 0, -d / 2);
  return mesh2(g, color, x, y, z);
}
function line(points, color, opacity = 1) {
  return new THREE5.Line(
    new THREE5.BufferGeometry().setFromPoints(points.map((v) => new THREE5.Vector3(v[0], v[1], v[2] ?? 0))),
    new THREE5.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  );
}
function tube(points, radius, color) {
  return mesh2(new THREE5.TubeGeometry(new THREE5.CatmullRomCurve3(points), 64, radius, 8, false), color);
}
function label(text, color, x, y, z, size = 0.16) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#" + new THREE5.Color(color).getHexString();
  ctx.font = "500 32px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 32);
  const texture = new THREE5.CanvasTexture(canvas);
  texture.colorSpace = THREE5.SRGBColorSpace;
  const m = new THREE5.Mesh(
    new THREE5.PlaneGeometry(size * 8, size),
    new THREE5.MeshBasicMaterial({
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
  const g = new THREE5.Group();
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
    g.add(mesh2(new THREE5.SphereGeometry(0.032, 12, 8), [15559268, 14989149, 7322248][i], -1.1 + i * 0.11, 0.71, 0.016));
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
    const chip = new THREE5.Group();
    chip.position.set(side * 1.65, 0.6, 0.2);
    chip.add(slab(0.72, 0.72, 0.12, c.paper), slab(0.58, 0.05, 0.018, c.accent, 0, -0.21, 0.08, 8e-3));
    chip.add(label(side < 0 ? "</>" : "AI", c.ink, 0, 0.05, 0.09, 0.2));
    g.add(chip);
    return chip;
  });
  const paths = [-1, 1].map(
    (side) => new THREE5.CatmullRomCurve3([
      new THREE5.Vector3(side * 1.6, 0.27, 0.24),
      new THREE5.Vector3(side * 1.65, -0.3, 0.3),
      new THREE5.Vector3(side * 1.4, -0.5, 0.2),
      new THREE5.Vector3(side * 1.06, -0.52, 0.1)
    ])
  );
  const packets = paths.map(() => {
    const m = mesh2(new THREE5.SphereGeometry(0.075, 16, 12), c.accent);
    g.add(m);
    return m;
  });
  const result = new THREE5.Group();
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
  const g = new THREE5.Group();
  g.rotation.set(0.1, -0.2, -0.025);
  const sourceY = [0.9, 0, -0.9];
  const sources = sourceY.map((y, index) => {
    const source = new THREE5.Group();
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
        mesh2(new THREE5.ConeGeometry(0.075, 0.15, 3), c.accent, -0.14, -0.18, 0.13)
      );
    } else {
      source.add(
        mesh2(new THREE5.TorusGeometry(0.2, 0.018, 8, 36), c.accent, 0, 0, 0.13),
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
  const inboxPoint = new THREE5.Vector3(0.72, 0, 0.2);
  const routes = sourceY.map(
    (y) => new THREE5.CatmullRomCurve3([
      new THREE5.Vector3(-1.22, y, 0.08),
      new THREE5.Vector3(-0.52, y * 0.82, 0.25),
      new THREE5.Vector3(0.08, y * 0.35, 0.3),
      inboxPoint.clone()
    ])
  );
  routes.forEach((route) => g.add(tube(route.getPoints(32), 0.014, c.muted)));
  const packets = routes.map((route, index) => {
    const packet = mesh2(
      index === 1 ? new THREE5.OctahedronGeometry(0.09) : index === 2 ? new THREE5.BoxGeometry(0.14, 0.14, 0.14) : new THREE5.SphereGeometry(0.085, 16, 12),
      c.accent
    );
    packet.position.copy(route.getPoint(0));
    g.add(packet);
    return packet;
  });
  const inbox = new THREE5.Group();
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
  const status = mesh2(new THREE5.TorusGeometry(0.12, 0.027, 10, 40), c.accent, 0.43, 0.53, 0.14);
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
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/libs/meshopt_decoder.module.js')
  ]);
  const model = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl ?? tennisModelUrl());
  const g = new THREE5.Group();
  g.rotation.set(0.64, -0.25, 0);
  g.position.y = 0.1;
  model.scene.scale.setScalar(0.69);
  model.scene.position.y = -0.65;
  g.add(model.scene);
  const colors3 = [
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
      const color = colors3[material2.name];
      if (color !== void 0) material2.color.setHex(color);
    }
  });
  const mixer = new THREE5.AnimationMixer(model.scene);
  model.animations.forEach((clip) => mixer.clipAction(clip).setLoop(THREE5.LoopRepeat, Infinity).play());
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
  g.userData.racketContact = new THREE5.Vector3(0, 0.63, 0);
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
function trading(_palette, variant = 0) {
  const g = new THREE5.Group();
  g.rotation.set(0.06, -0.19, 0);
  const casing = slab(4.08, 2.62, 0.16, 2502712, 0, 0.26, 0, 0.055);
  casing.material.metalness = 0.45;
  casing.material.roughness = 0.4;
  g.add(casing, slab(0.32, 0.6, 0.18, 3161413, 0, -1.18, -0.04, 0.035));
  const foot = slab(1.38, 0.5, 0.095, 3950929, 0, -1.51, 0.16, 0.065);
  foot.rotation.x = -Math.PI / 2;
  g.add(foot);
  g.add(label("MARKET STUDY", 9018271, 0, -0.94, 0.1, 0.075));
  g.add(mesh2(new THREE5.SphereGeometry(0.019, 12, 8), 5357478, 1.8, -0.94, 0.105));
  const canvas = document.createElement("canvas");
  canvas.width = 1056;
  canvas.height = 620;
  const ctx = canvas.getContext("2d");
  const texture = new THREE5.CanvasTexture(canvas);
  texture.colorSpace = THREE5.SRGBColorSpace;
  const display = new THREE5.Mesh(
    new THREE5.PlaneGeometry(3.82, 2.24),
    new THREE5.MeshBasicMaterial({ map: texture, toneMapped: false })
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
  const g = new THREE5.Group();
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
          g.add(mesh2(new THREE5.BoxGeometry(0.034, 0.047, 8e-3), graphite, x, -1.1 + n * 0.18, z + 0.051));
    }
  const trays = [], fans = [], lamps = [];
  for (let i = 0; i < 3; i++) {
    const tray = new THREE5.Group();
    tray.position.y = 0.82 - i * 0.82;
    tray.add(metal(2.7, 0.61, 1.18, graphite), metal(2.69, 0.58, 0.035, i === 1 ? c.accent : alloy, 0, 0, 0.607));
    for (const x of [-1.2, 1.2]) {
      tray.add(metal(0.04, 0.35, 0.1, 12766410, x, 0, 0.7));
      for (const y of [-0.22, 0.22]) {
        const screw = mesh2(new THREE5.CylinderGeometry(0.027, 0.027, 0.013, 10), 13554379, x, y, 0.647);
        screw.rotation.x = Math.PI / 2;
        tray.add(screw);
      }
    }
    if (i === 0) {
      for (let n = 0; n < 6; n++) {
        const x = -0.88 + n * 0.3;
        tray.add(metal(0.25, 0.37, 0.05, graphite, x, 0, 0.665), metal(0.17, 0.024, 0.01, 11056565, x, -0.1, 0.7));
        const lamp = mesh2(new THREE5.SphereGeometry(0.018, 8, 6), c.accent, x + 0.06, 0.11, 0.704);
        lamps.push(lamp);
        tray.add(lamp);
      }
    } else if (i === 1) {
      for (const x of [-0.7, 0, 0.7]) {
        tray.add(mesh2(new THREE5.TorusGeometry(0.2, 0.025, 8, 32), graphite, x, 0, 0.662));
        const fan = new THREE5.Group();
        fan.position.set(x, 0, 0.674);
        for (let blade = 0; blade < 7; blade++) {
          const vane = slab(0.073, 0.135, 0.014, 2504767, 0, 0.105, 0, 0.026);
          const pivot = new THREE5.Group();
          pivot.rotation.z = blade * Math.PI * 2 / 7;
          pivot.add(vane);
          fan.add(pivot);
        }
        const hub = mesh2(new THREE5.CylinderGeometry(0.054, 0.054, 0.022, 16), alloy);
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
          tray.add(mesh2(new THREE5.BoxGeometry(0.016, 0.042, 8e-3), 12823664, x - 0.045 + k * 0.045, 0.075, 0.676));
      }
      for (let n = 0; n < 2; n++) {
        const wire = tube(
          [
            new THREE5.Vector3(-0.78 + n * 0.75, 0.02, 0.7),
            new THREE5.Vector3(-0.78 + n * 0.75, -0.23, 0.95),
            new THREE5.Vector3(-0.34 + n * 0.75, -0.23, 0.95),
            new THREE5.Vector3(-0.39 + n * 0.75, 0.02, 0.7)
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
  const g = new THREE5.Group();
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
  const texture = new THREE5.CanvasTexture(atlas);
  texture.colorSpace = THREE5.SRGBColorSpace;
  const folds = [];
  for (let i = 0; i < 3; i++) {
    const fold = new THREE5.Group();
    fold.position.x = i === 0 ? -0.615 : i === 2 ? 0.615 : 0;
    const center = i === 0 ? -0.615 : i === 2 ? 0.615 : 0;
    fold.add(slab(1.23, 2.45, 0.013, c.paper, center, 0, 0, 8e-3));
    const geometry = new THREE5.PlaneGeometry(1.23, 2.45);
    const uv = geometry.attributes.uv;
    for (let n = 0; n < uv.count; n++) uv.setX(n, (uv.getX(n) + i) / 3);
    const surface = new THREE5.Mesh(geometry, new THREE5.MeshStandardMaterial({ map: texture, roughness: 0.96 }));
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
  const curve2 = new THREE5.CatmullRomCurve3(paths[variant].map(([x, y]) => new THREE5.Vector3(x, y, 0.075)));
  const route = mesh2(new THREE5.TubeGeometry(curve2, 128, 0.019, 8, false), c.accent);
  g.add(route);
  const pin = new THREE5.Group();
  pin.add(mesh2(new THREE5.SphereGeometry(0.085, 20, 12), c.accent, 0, 0, 0.23));
  const needle = mesh2(new THREE5.CylinderGeometry(0.014, 0.014, 0.21, 8), 6380880, 0, 0, 0.105);
  needle.rotation.x = Math.PI / 2;
  pin.add(needle);
  g.add(pin);
  const ring3 = mesh2(new THREE5.TorusGeometry(0.095, 0.012, 8, 32), c.accent);
  ring3.position.copy(curve2.getPointAt(0));
  g.add(ring3);
  const compass = new THREE5.Group();
  compass.position.set(-1.49, 0.88, 0.05);
  compass.add(mesh2(new THREE5.TorusGeometry(0.14, 7e-3, 6, 32), 6845542));
  const north = mesh2(new THREE5.ConeGeometry(0.042, 0.21, 3), c.accent, 0, 0.015, 0.015);
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
  const g = new THREE5.Group();
  g.rotation.set(0.56, -0.3, -0.13);
  const width = 1.46, height = 2.12;
  const halves = [-1, 1].map((side) => {
    const half = new THREE5.Group();
    half.position.x = side * 0.045;
    half.rotation.y = side * 0.12;
    half.add(slab(width + 0.11, height + 0.13, 0.065, c.accent, side * width / 2, 0, -0.13, 0.035));
    for (let leaf = 8; leaf >= 0; leaf--) {
      const sheet = new THREE5.PlaneGeometry(width, height, 32, 1);
      const vertices = sheet.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const u = vertices.getX(i) + width / 2;
        vertices.setXYZ(i, side * u, vertices.getY(i), 0.065 + 0.025 * Math.sin(u / width * Math.PI) - 0.06 * u - leaf * 0.011);
      }
      sheet.computeVertexNormals();
      half.add(
        new THREE5.Mesh(sheet, new THREE5.MeshStandardMaterial({ color: c.paper, roughness: 0.96, side: THREE5.DoubleSide }))
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
  const spine = mesh2(new THREE5.CylinderGeometry(0.072, 0.072, height + 0.14, 20), c.accent, 0, 0, -0.08);
  g.add(spine);
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 256;
  textureCanvas.height = 512;
  const ctx = textureCanvas.getContext("2d");
  ctx.fillStyle = "#" + new THREE5.Color(c.paper).getHexString();
  ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = "#6b7064";
  ctx.font = "500 16px serif";
  ctx.fillText("On attention", 30, 52);
  for (let row = 0; row < 14; row++) ctx.fillRect(30, 86 + row * 25, 186 - row % 5 * 13, 2);
  const texture = new THREE5.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE5.SRGBColorSpace;
  const geometry = new THREE5.PlaneGeometry(width, height, 40, 8);
  geometry.translate(width / 2, 0, 0);
  const page = new THREE5.Mesh(geometry, new THREE5.MeshStandardMaterial({ map: texture, side: THREE5.FrontSide, roughness: 0.96 }));
  const reverseTexture = texture.clone();
  reverseTexture.repeat.x = -1;
  reverseTexture.offset.x = 1;
  reverseTexture.needsUpdate = true;
  const reverse = new THREE5.Mesh(
    geometry,
    new THREE5.MeshStandardMaterial({ map: reverseTexture, side: THREE5.BackSide, roughness: 0.96 })
  );
  g.add(page, reverse);
  g.userData.pageGeometry = geometry;
  const positions = geometry.attributes.position, original = Float32Array.from(positions.array);
  const ribbon = slab(0.11, 0.48, 0.012, 11949896, 0.67, -1.04, -0.11, 5e-3);
  g.add(ribbon);
  g.userData.animate = (time) => {
    const t = Math.min(time, DURATION), q = ease(p(t, 750, 4050)), theta = Math.PI * q;
    for (let i = 0; i < positions.count; i++) {
      const u = original[i * 3], v = original[i * 3 + 1];
      const curl = 0.62 * Math.sin(theta), segments = 12;
      let x = 0, z = 0;
      for (let n = 0; n < segments; n++) {
        const along = u * (n + 0.5) / segments;
        const angle = theta + curl * Math.sin(along / width * Math.PI) - 0.18 * Math.cos(theta);
        x += Math.cos(angle) * u / segments;
        z += Math.sin(angle) * u / segments;
      }
      positions.setXYZ(i, x + 0.045 * Math.cos(theta), v + 0.025 * Math.sin(theta) * u / width, 0.11 + z);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    halves[0].rotation.y = -0.12;
    halves[1].rotation.y = 0.12;
    phase(g, t, t < 750 ? "open-book" : t < 1500 ? "lift-page" : t < 4050 ? "turn-page" : "settle-page", q);
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
async function createObject(kind, palette, variant = 0, edition = 0, modelUrl) {
  var _a;
  const finish = kind === "contact" ? variant % 3 : edition;
  const accent = kind === "reading" ? [palette.accent, 7945795, 3164775][finish] : [palette.accent, 4619160, 10512718][finish];
  const object = kind === "contact" && (variant === 3 || variant === 4) ? createContactDirection(variant) : kind !== "contact" && variant !== 0 ? createArtDirection(kind, variant) : kind === "tennis" ? await tennis({ ...palette}, finish, modelUrl) : await builders[kind]({ ...palette, accent }, finish);
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

export { DURATION, builders, createObject, disposeObject };
