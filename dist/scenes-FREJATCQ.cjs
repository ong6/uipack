'use strict';

var chunk7OAMHGZK_cjs = require('./chunk-7OAMHGZK.cjs');
var chunkHPYRAZ5N_cjs = require('./chunk-HPYRAZ5N.cjs');
var chunkSDBNPDW6_cjs = require('./chunk-SDBNPDW6.cjs');
var THREE9 = require('three');
var RoundedBoxGeometry_js = require('three/addons/geometries/RoundedBoxGeometry.js');
var BufferGeometryUtils_js = require('three/addons/utils/BufferGeometryUtils.js');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var THREE9__namespace = /*#__PURE__*/_interopNamespace(THREE9);

var TAU = Math.PI * 2;
var LOOP_MS = 12e3;
var vec = (x, y, z = 0) => new THREE9__namespace.Vector3(x, y, z);
function playLoop(object, ticks, restTime, phase2) {
  object.userData.source = "procedural";
  object.userData.loopDuration = LOOP_MS;
  object.userData.restTime = restTime;
  object.userData.animate = (time) => {
    const progress2 = (time % LOOP_MS + LOOP_MS) % LOOP_MS / LOOP_MS;
    for (const tick of ticks) tick(progress2 * TAU);
    object.userData.phase = phase2;
    object.userData.pose = progress2;
  };
}

// src/objects/contact-directions.ts
var colors = { cream: 16181706, coral: 15301725, blue: 6920109, green: 9155483, dark: 2703177, gold: 12490332 };
var REST_MS = 3200;
function addMesh(parent, geometry, color, x = 0, y = 0, z = 0, metal = false) {
  const mesh3 = new THREE9__namespace.Mesh(
    geometry,
    new THREE9__namespace.MeshStandardMaterial({ color, roughness: metal ? 0.28 : 0.65, metalness: metal ? 0.65 : 0.02 })
  );
  mesh3.position.set(x, y, z);
  parent.add(mesh3);
  return mesh3;
}
function box(parent, width, height, depth, color, x = 0, y = 0, z = 0) {
  return addMesh(
    parent,
    new RoundedBoxGeometry_js.RoundedBoxGeometry(width, height, depth, 2, Math.min(0.09, width / 4, height / 4, depth / 4)),
    color,
    x,
    y,
    z
  );
}
function rod(parent, from, to, color = colors.gold, radius = 0.018) {
  const delta = to.clone().sub(from), mesh3 = addMesh(parent, new THREE9__namespace.CylinderGeometry(radius, radius, delta.length(), 12), color, 0, 0, 0, true);
  mesh3.position.copy(from).add(to).multiplyScalar(0.5);
  mesh3.quaternion.setFromUnitVectors(vec(0, 1), delta.normalize());
  return mesh3;
}
function sphere(parent, radius, color, x = 0, y = 0, z = 0) {
  return addMesh(parent, new THREE9__namespace.SphereGeometry(radius, 24, 16), color, x, y, z);
}
function envelope(parent, color = colors.cream) {
  const letter = new THREE9__namespace.Group();
  parent.add(letter);
  box(letter, 0.64, 0.43, 0.07, color);
  for (const z of [-0.041, 0.041]) {
    rod(letter, vec(-0.28, 0.17, z), vec(0, -0.025, z), colors.gold, 9e-3);
    rod(letter, vec(0, -0.025, z), vec(0.28, 0.17, z), colors.gold, 9e-3);
  }
  return letter;
}
function cartoonMailbox(root, ticks) {
  const world = new THREE9__namespace.Group();
  root.add(world);
  world.rotation.set(0.35, -0.38, 0);
  world.position.y = -0.57;
  box(world, 2.7, 0.28, 2.05, colors.cream, 0, -0.35);
  box(world, 2.6, 0.07, 1.95, 12242604, 0, -0.17);
  for (let i = 0; i < 4; i++) box(world, 0.48, 0.045, 0.24, 15324594, 0.22, -0.1, 0.48 + i * 0.25);
  box(world, 0.17, 0.62, 0.17, colors.cream, 0, 0.15, -0.18);
  box(world, 0.55, 0.08, 0.43, colors.coral, 0, -0.12, -0.18);
  const mailbox = new THREE9__namespace.Group();
  world.add(mailbox);
  mailbox.position.set(0, 0.85, -0.18);
  box(mailbox, 1.16, 0.88, 0.87, colors.coral);
  box(mailbox, 0.99, 0.72, 0.045, colors.cream, 0, 0, 0.455);
  box(mailbox, 0.72, 0.11, 0.02, colors.dark, 0, 0.17, 0.486);
  for (const x of [-0.24, 0.24]) sphere(mailbox, 0.043, colors.dark, x, -0.1, 0.49);
  const smile = addMesh(mailbox, new THREE9__namespace.TorusGeometry(0.12, 0.015, 8, 24, Math.PI), colors.coral, 0, -0.14, 0.49);
  smile.rotation.z = Math.PI;
  const flag = new THREE9__namespace.Group();
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
    const p = angle / TAU;
    const fly = p > 0.8 ? (1 - p) / 0.2 : chunkSDBNPDW6_cjs.clamp((p - 0.1) / 0.62);
    const ease = chunkSDBNPDW6_cjs.smoothstep(0, 1, fly);
    letter.position.set(-1 * (1 - ease), 1.02 + 0.86 * Math.sin(Math.PI * fly), 0.31 + 1.15 * (1 - ease));
    letter.rotation.set(0.12 * (1 - ease), -0.24 * (1 - ease), -0.22 * (1 - ease));
    const scale = chunkSDBNPDW6_cjs.clamp((p - 0.06) / 0.08) * chunkSDBNPDW6_cjs.clamp((0.79 - p) / 0.09);
    letter.scale.setScalar(scale * 0.85);
    letter.visible = scale > 0;
    flag.rotation.z = -0.65 + 0.65 * Math.sin(Math.PI * chunkSDBNPDW6_cjs.clamp((p - 0.55) / 0.35));
  });
}
function createContactDirection() {
  const root = new THREE9__namespace.Group(), ticks = [];
  cartoonMailbox(root, ticks);
  root.userData.look = { castShadows: true };
  root.userData.style = "cartoon";
  playLoop(root, ticks, REST_MS, "letter-delivery");
  return root;
}
function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE9__namespace.Mesh(geometry, material);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}
function roundedBox(width, height, depth, radius = 0.05, segments = 3) {
  return new RoundedBoxGeometry_js.RoundedBoxGeometry(width, height, depth, segments, Math.min(radius, width / 3, height / 3, depth / 3));
}
function block(parent, size, material, at2 = [0, 0, 0], radius = 0.05) {
  return mesh(parent, roundedBox(size[0], size[1], size[2], radius), material, ...at2);
}
function group(parent, x = 0, y = 0, z = 0) {
  const container = new THREE9__namespace.Group();
  container.position.set(x, y, z);
  parent.add(container);
  return container;
}
function cylinder(parent, radius, height, material, at2 = [0, 0, 0], segments = 32, bottom = radius) {
  return mesh(parent, new THREE9__namespace.CylinderGeometry(radius, bottom, height, segments), material, ...at2);
}
function sphere2(parent, radius, material, at2 = [0, 0, 0], detail = 24) {
  return mesh(parent, new THREE9__namespace.SphereGeometry(radius, detail, Math.round(detail * 0.67)), material, ...at2);
}
function tube(points, radius, closed = false, segments = 64, radial = 8) {
  return new THREE9__namespace.TubeGeometry(new THREE9__namespace.CatmullRomCurve3(points, closed), segments, radius, radial, closed);
}
function rodGeometry(from, to, radius, segments = 12) {
  const delta = to.clone().sub(from);
  const geometry = new THREE9__namespace.CylinderGeometry(radius, radius, delta.length(), segments);
  geometry.applyQuaternion(new THREE9__namespace.Quaternion().setFromUnitVectors(vec(0, 1), delta.normalize()));
  geometry.translate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
  return geometry;
}
function placed(geometry, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) {
  const matrix = new THREE9__namespace.Matrix4().compose(
    vec(x, y, z),
    new THREE9__namespace.Quaternion().setFromEuler(new THREE9__namespace.Euler(rx, ry, rz)),
    Array.isArray(s) ? vec(...s) : vec(s, s, s)
  );
  return geometry.applyMatrix4(matrix);
}
function mergeable(geometry, keepUv = false) {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  for (const name of Object.keys(flat.attributes))
    if (name !== "position" && name !== "normal" && !(keepUv && name === "uv")) flat.deleteAttribute(name);
  if (!flat.attributes.normal) flat.computeVertexNormals();
  return flat;
}
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = state * 1664525 + 1013904223 >>> 0;
    return state / 4294967296;
  };
}
function hash(x, y, seed) {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647 | 0;
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function valueNoise(x, y, period = 256, seed = 1) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const wrap2 = (n) => (n % period + period) % period;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(wrap2(xi), wrap2(yi), seed), b = hash(wrap2(xi + 1), wrap2(yi), seed), c = hash(wrap2(xi), wrap2(yi + 1), seed), d = hash(wrap2(xi + 1), wrap2(yi + 1), seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function valueNoise2(x, y, periodX, periodY, seed = 1) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const wx = (n) => (n % periodX + periodX) % periodX, wy = (n) => (n % periodY + periodY) % periodY;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(wx(xi), wy(yi), seed), b = hash(wx(xi + 1), wy(yi), seed), c = hash(wx(xi), wy(yi + 1), seed), d = hash(wx(xi + 1), wy(yi + 1), seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, period, octaves = 4, seed = 1) {
  let sum = 0, amplitude = 0.5, frequency = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amplitude * valueNoise(x * frequency, y * frequency, period * frequency, seed + o);
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return sum / total;
}
function themeProbe(parent) {
  const material = new THREE9__namespace.MeshBasicMaterial({ color: 16777215 });
  material.userData.themes = { dark: { color: 0 } };
  const probe = new THREE9__namespace.Mesh(new THREE9__namespace.PlaneGeometry(1e-3, 1e-3), material);
  probe.visible = false;
  probe.userData.frameIgnore = true;
  parent.add(probe);
  return () => material.color.r < 0.5;
}
function paintTexture(width, height, paint, options = {}) {
  const { srgb = true, repeat } = options;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a = 255] = paint((x + 0.5) / width, (y + 0.5) / height, x, y);
      data.set([r, g, b, a], (y * width + x) * 4);
    }
  const texture = new THREE9__namespace.DataTexture(data, width, height, THREE9__namespace.RGBAFormat);
  texture.magFilter = THREE9__namespace.LinearFilter;
  texture.minFilter = THREE9__namespace.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE9__namespace.RepeatWrapping;
    texture.repeat.set(...repeat);
  }
  if (srgb) texture.colorSpace = THREE9__namespace.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
function normalTexture(size, height, strength = 2, repeat = [1, 1]) {
  const field = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) field[y * size + x] = height((x + 0.5) / size, (y + 0.5) / size);
  const at2 = (x, y) => field[(y + size) % size * size + (x + size) % size];
  const normal = new THREE9__namespace.Vector3();
  return paintTexture(
    size,
    size,
    (_u, _v, x, y) => {
      normal.set(-(at2(x + 1, y) - at2(x - 1, y)) * strength, -(at2(x, y + 1) - at2(x, y - 1)) * strength, 1).normalize();
      return [(normal.x * 0.5 + 0.5) * 255, (normal.y * 0.5 + 0.5) * 255, (normal.z * 0.5 + 0.5) * 255];
    },
    { srgb: false, repeat }
  );
}
var clamp01 = (n) => Math.min(1, Math.max(0, n));
var smoothstep2 = (a, b, n) => {
  const t = clamp01((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};
var mix = (a, b, t) => a + (b - a) * t;
function mixRgb(a, b, t) {
  return [mix(a >> 16 & 255, b >> 16 & 255, t), mix(a >> 8 & 255, b >> 8 & 255, t), mix(a & 255, b & 255, t)];
}
function ribbonGeometry(points, width, segments = 96, thickness = 0) {
  const curve = new THREE9__namespace.CatmullRomCurve3(points, false, "centripetal");
  const positions = [], uvs = [], indices = [];
  const up = vec(0, 1), side = new THREE9__namespace.Vector3(), point = new THREE9__namespace.Vector3(), tangent = new THREE9__namespace.Vector3(), normal = new THREE9__namespace.Vector3();
  let length = 0;
  const previous = new THREE9__namespace.Vector3();
  const layers = thickness > 0 ? [thickness / 2, -thickness / 2] : [0];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, point);
    curve.getTangentAt(t, tangent);
    if (i > 0) length += point.distanceTo(previous);
    previous.copy(point);
    side.crossVectors(tangent, up);
    if (side.lengthSq() < 1e-6) side.set(0, 0, 1);
    side.normalize();
    normal.crossVectors(side, tangent).normalize();
    for (const offset of layers)
      for (const s of [-0.5, 0.5]) {
        positions.push(
          point.x + side.x * s * width + normal.x * offset,
          point.y + side.y * s * width + normal.y * offset,
          point.z + side.z * s * width + normal.z * offset
        );
        uvs.push(length, s + 0.5);
      }
  }
  const stride = layers.length * 2;
  for (let i = 0; i < segments; i++) {
    const a = i * stride, b = (i + 1) * stride;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
    if (layers.length === 2) indices.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);
  }
  const geometry = new THREE9__namespace.BufferGeometry();
  geometry.setAttribute("position", new THREE9__namespace.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE9__namespace.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.length = length;
  return geometry;
}

// src/objects/expanded-abstract.ts
var abstractLook = {
  rig: {
    both: {
      toneMapping: "neutral",
      exposure: 1.05,
      environment: { kind: "softbox", intensity: 0.7, rotation: 0.45 },
      hemisphere: { sky: 15987455, ground: 3814752, intensity: 0.9 },
      key: { color: 16777215, intensity: 2.2, position: [-3, 5, 6] },
      rim: { color: 14476543, intensity: 2.2, position: [4, 3, -4] }
    },
    dark: {
      hemisphere: { sky: 9278166, ground: 855578, intensity: 0.6 },
      environment: { intensity: 0.8 },
      rim: { intensity: 3.4 },
      reflections: 1
    }
  },
  camera: { projection: "perspective", fov: 24, pitch: 5 },
  framing: { fill: 0.68, maxWidth: 0.8, lift: 0.02, sample: "loop" },
  transmissionBackdrop: { light: 15329270, dark: 1580342 }
};
var hues = { vermilion: 16734774, ultramarine: 4020990, saffron: 16761405 };
function opticalGlass(options = {}) {
  return chunk7OAMHGZK_cjs.lookMaterial("glass", 16777215, {
    roughness: 0,
    thickness: 1.1,
    ior: 1.5,
    dispersion: 0.9,
    attenuationColor: new THREE9__namespace.Color(15923199),
    attenuationDistance: 8,
    envMapIntensity: 0.75,
    specularIntensity: 1,
    ...options
  });
}
var lacquers = /* @__PURE__ */ new Map();
function lacquer(color) {
  let material = lacquers.get(color);
  if (!material) {
    material = chunk7OAMHGZK_cjs.lookMaterial("ceramic", color, {
      roughness: 0.42,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 0.8
    });
    lacquers.set(color, material);
  }
  return material;
}
function band(parent, color, width, height, x, y, z, rotation = 0) {
  const depth = Math.min(0.2, Math.max(0.1, Math.min(width, height) * 0.9));
  const card2 = mesh(parent, roundedBox(width, height, depth, Math.min(width, height, depth) * 0.48, 5), lacquer(color), x, y, z);
  card2.rotation.z = rotation;
  return card2;
}
function beam(parent, color, from, to, thickness, z) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  return band(parent, color, Math.hypot(dx, dy), thickness, (from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z, Math.atan2(dy, dx));
}
function stroke(parent, color, points, width, z) {
  const shape2 = new THREE9__namespace.Shape();
  points.forEach(([x, y], i) => i ? shape2.lineTo(x, y + width / 2) : shape2.moveTo(x, y + width / 2));
  for (let i = points.length - 1; i >= 0; i--) shape2.lineTo(points[i][0], points[i][1] - width / 2);
  shape2.closePath();
  const geometry = new THREE9__namespace.ExtrudeGeometry(shape2, {
    depth: 0.06,
    bevelEnabled: true,
    bevelSize: width * 0.3,
    bevelThickness: 0.05,
    bevelSegments: 5
  });
  return mesh(parent, geometry, lacquer(color), 0, 0, z - 0.03);
}
var discShade;
function disc(parent, color, radius, x, y, z) {
  discShade ?? (discShade = paintTexture(128, 128, (u, v) => {
    const r = Math.hypot(u - 0.5, v - 0.5) * 2;
    const toKey = Math.hypot(u - 0.3, v - 0.72) * 1.4;
    const t = 1.12 - 0.3 * Math.min(1, toKey) ** 1.5 - 0.1 * Math.max(0, r - 0.8) / 0.2;
    const c = Math.min(255, 255 * t * 0.89);
    return [c, c, c];
  }));
  const material = lacquer(color).clone();
  material.map = discShade;
  const coin = mesh(parent, new THREE9__namespace.CylinderGeometry(radius, radius, 0.06, 96), material, x, y, z);
  coin.rotation.x = Math.PI / 2;
  return coin;
}
function backGlow(parent, theme, width = 5.2) {
  const profile = [];
  const FLOOR3 = -0.05, WALL = -1.45, TOP = 2.15, BEND = 0.45;
  for (let i = 0; i <= 8; i++) profile.push([FLOOR3, 0.9 - i / 8 * (0.9 - (WALL + BEND))]);
  for (let i = 1; i <= 8; i++) {
    const a = i / 8 * (Math.PI / 2);
    profile.push([FLOOR3 + BEND - BEND * Math.cos(a), WALL + BEND - BEND * Math.sin(a)]);
  }
  for (let i = 1; i <= 8; i++) profile.push([FLOOR3 + BEND + i / 8 * (TOP - FLOOR3 - BEND), WALL]);
  const positions = [], uvs = [], indices = [];
  profile.forEach(([y, z], j) => {
    for (const side of [0, 1]) {
      positions.push((side - 0.5) * width, y, z);
      uvs.push(side, j / (profile.length - 1));
    }
    if (j > 0) indices.push((j - 1) * 2, (j - 1) * 2 + 1, j * 2, j * 2, (j - 1) * 2 + 1, j * 2 + 1);
  });
  const geometry = new THREE9__namespace.BufferGeometry();
  geometry.setAttribute("position", new THREE9__namespace.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE9__namespace.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const map = paintTexture(256, 96, (u, v) => {
    const strip = (centre, width2) => Math.exp(-(((u - centre) / width2) ** 2));
    const wall = smoothstep2(0.5, 0.7, v) * smoothstep2(1, 0.92, v);
    const top = Math.exp(-(((v - 0.9) / 0.05) ** 2)) * smoothstep2(0.1, 0.35, u) * smoothstep2(0.9, 0.65, u);
    const bend = 0.3 * Math.exp(-(((v - 0.52) / 0.05) ** 2)) * smoothstep2(0, 0.3, u) * smoothstep2(1, 0.7, u);
    if (theme === "dark") {
      const strips = strip(0.36, 0.05) + strip(0.64, 0.05) + 0.55 * (strip(0.18, 0.04) + strip(0.82, 0.04));
      const pool2 = Math.exp(-(((u - 0.5) / 0.2) ** 2) - ((v - 0.68) / 0.22) ** 2);
      const t = Math.min(1, strips * wall * 1.15 + 0.8 * top + bend);
      return [44 + 120 * pool2 + 186 * t, 52 + 112 * pool2 + 190 * t, 96 + 120 * pool2 + 150 * t];
    }
    const lines = strip(0.3, 8e-3) + strip(0.7, 8e-3) + 0.7 * (strip(0.42, 5e-3) + strip(0.58, 5e-3)) + 0.6 * strip(0.12, 0.012);
    const horizon = Math.exp(-(((v - 0.6) / 0.012) ** 2));
    const d = Math.min(1, 0.85 * lines * smoothstep2(0.52, 0.62, v) + 0.6 * horizon + 0.25 * smoothstep2(0.5, 0.3, v));
    return [236 - 190 * d, 234 - 186 * d, 248 - 170 * d];
  });
  const material = chunk7OAMHGZK_cjs.themed(new THREE9__namespace.MeshBasicMaterial({ map, depthWrite: false, toneMapped: false, side: THREE9__namespace.DoubleSide }), {
    [theme === "dark" ? "light" : "dark"]: { opacity: 0 }
  });
  const glow2 = mesh(parent, geometry, material);
  glow2.renderOrder = -5;
  glow2.userData.frameIgnore = true;
  glow2.onBeforeRender = (renderer) => {
    material.colorWrite = renderer.getRenderTarget() !== null;
  };
  return glow2;
}
var causticMap;
function spectralCaustic() {
  causticMap ?? (causticMap = paintTexture(128, 128, (u, v) => {
    const r = Math.hypot(u - 0.5, v - 0.5) * 2;
    const ring = (radius) => Math.exp(-(((r - radius) / 0.07) ** 2));
    const core = Math.exp(-((r / 0.16) ** 2));
    const fade = Math.max(0, 1 - r);
    const channel = (radius) => Math.min(1, (0.9 * ring(radius) + 0.35 * ring(radius * 0.6) + core) * fade) * 255;
    return [channel(0.62), channel(0.56), channel(0.5)];
  }));
  return causticMap;
}
function floor(parent, width, depth, hue, x = 0, z = 0) {
  parent.add(chunk7OAMHGZK_cjs.contactShadow(width, depth, { opacity: 0.3, color: 1775680, x, z, y: 2e-3 }));
  const material = new THREE9__namespace.MeshBasicMaterial({
    color: new THREE9__namespace.Color(hue).lerp(new THREE9__namespace.Color(16777215), 0.15),
    map: spectralCaustic(),
    // Its brightness is its coverage too. Normal blending, not additive: added light vanishes on the
    // pale day card, while a saturated patch reads as focused coloured light on both cards.
    alphaMap: spectralCaustic(),
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    toneMapped: false
  });
  const caustic = mesh(
    parent,
    new THREE9__namespace.PlaneGeometry(width * 0.55, depth * 0.5),
    material,
    x + width * 0.14,
    4e-3,
    z - depth * 0.06
  );
  caustic.rotation.x = -Math.PI / 2;
  caustic.renderOrder = -1;
  caustic.userData.frameIgnore = true;
  return caustic;
}
function poolLight(root, ticks) {
  const light = new THREE9__namespace.PointLight(16773858, 0, 10, 2);
  light.position.set(-1.5, 2.6, 2);
  root.add(light);
  const rim = new THREE9__namespace.PointLight(10466559, 0, 8, 2);
  rim.position.set(1.9, 0.6, -1.6);
  root.add(rim);
  const dark = themeProbe(root);
  ticks.push(() => {
    const night2 = dark();
    light.intensity = night2 ? 18 : 9;
    light.color.setHex(night2 ? 15000319 : 16773858);
    rim.intensity = night2 ? 10 : 0;
  });
}
var models = {
  /**
   * Thought lattice: one glass prism, standing on an edge, takes a single white beam and fans it
   * into the three hues (input in, ideas out). The beams run behind the glass, so the prism visibly
   * bends and splits them; it turns a little as the fan breathes.
   */
  ai(root, ticks) {
    const Z = -0.95, PIVOT = [0.1, 0.66];
    beam(root, 16053243, [-2, 0.28], PIVOT, 0.11, Z);
    const fan = group(root, PIVOT[0], PIVOT[1], 0);
    const rays = [
      { color: hues.vermilion, angle: 0.36 },
      { color: hues.saffron, angle: 0.15 },
      { color: hues.ultramarine, angle: -0.06 }
    ].map(({ color, angle }) => {
      const ray = group(fan);
      ray.rotation.z = angle;
      band(ray, color, 1.95, 0.11, 0.975, 0, Z - 0.01);
      return { ray, angle };
    });
    const SIDE = 1.5, tall = SIDE * Math.sqrt(3) / 2;
    const triangle = new THREE9__namespace.Shape();
    triangle.moveTo(-SIDE / 2, 0);
    triangle.lineTo(SIDE / 2, 0);
    triangle.lineTo(0, tall);
    triangle.closePath();
    const prismGeometry = new THREE9__namespace.ExtrudeGeometry(triangle, {
      depth: 0.62,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.05,
      bevelSegments: 4
    });
    prismGeometry.translate(0, 0.05, -0.31);
    const prism = mesh(root, prismGeometry, opticalGlass({ thickness: 0.9, dispersion: 1.2 }), 0, 0, 0);
    const caustic = floor(root, 2, 1.1, hues.saffron);
    const causticX = caustic.position.x;
    ticks.push((angle) => {
      prism.rotation.y = 0.32 + 0.14 * Math.sin(angle);
      caustic.position.x = causticX + 0.18 * Math.sin(angle);
      caustic.material.opacity = 0.75 + 0.25 * Math.sin(angle);
      const spread = 1 + 0.12 * Math.sin(angle * 2);
      for (const { ray, angle: base2 } of rays) ray.rotation.z = 0.15 + (base2 - 0.15) * spread;
    });
  },
  /** Risk rhythm: a row of glass prisms of rising heights refracts an ultramarine band into a price line. */
  trading(root, ticks) {
    stroke(
      root,
      hues.ultramarine,
      [
        [-1.7, 0.3],
        [-1.2, 0.48],
        [-0.82, 0.38],
        [-0.4, 0.72],
        [0, 0.6],
        [0.4, 0.98],
        [0.8, 0.86],
        [1.2, 1.3],
        [1.7, 1.42]
      ],
      0.13,
      -1
    );
    disc(root, hues.saffron, 0.32, 1.05, 1.62, -1.25);
    const glass = opticalGlass({ thickness: 0.4 });
    const prismGeometry = new THREE9__namespace.CylinderGeometry(0.2, 0.2, 1, 3, 1);
    prismGeometry.translate(0, 0.5, 0);
    const heights = [0.55, 0.8, 0.68, 1.05, 0.95, 1.35, 1.55];
    const prisms = heights.map((height, i) => {
      const prism = mesh(root, prismGeometry, glass, -1.2 + i * 0.4, 0, 0);
      prism.rotation.y = i % 2 ? Math.PI : 0;
      prism.scale.y = height;
      return prism;
    });
    floor(root, 3.2, 1, hues.ultramarine);
    ticks.push((angle) => {
      prisms.forEach((prism, i) => prism.scale.y = heights[i] * (1 + 0.1 * Math.sin(angle * 2 - i * 0.7)));
    });
  }
};
function abstract(kind, ticks) {
  const root = new THREE9__namespace.Group();
  models[kind](root, ticks);
  poolLight(root, ticks);
  backGlow(root, "dark");
  backGlow(root, "light");
  return root;
}
var cartoonLook = {
  rig: {
    both: {
      toneMapping: "neutral",
      exposure: 1,
      environment: { kind: "none", intensity: 0 },
      hemisphere: { sky: 14086143, ground: 8958066, intensity: 1.5 },
      key: { color: 16773590, intensity: 2.4, position: [-3.5, 7, 4.5], shadow: true, shadowRadius: 3 },
      rim: { color: 16777215, intensity: 1.1, position: [4, 3, -4] }
    },
    dark: {
      // Moonlight is a clean blue-teal, not periwinkle: periwinkle light on the warm soil, wood and
      // white steam turned them all mauve.
      hemisphere: { sky: 6259364, ground: 1714736, intensity: 1.15 },
      key: { color: 12375022, intensity: 1.25, position: [3.5, 6, 3] },
      rim: { color: 11062015, intensity: 2.2 },
      // A warm porch-light fill from the camera side, so faces keep their features at night.
      fill: { color: 16767144, intensity: 0.85, position: [1.5, 2.5, 7] }
    }
  },
  camera: { projection: "perspective", fov: 30, pitch: 28 },
  // Fits the shared frame box (frameProxy), not each scene's props.
  framing: { fill: 0.9, maxWidth: 0.9, lift: 0, sample: "loop" },
  castShadows: true
};
var palette = {
  grass: 8700023,
  grassDark: 5939803,
  soil: 10514506,
  soilDark: 8016438,
  rock: 9277088,
  sky: 7258608,
  coral: 16743001,
  sun: 16763196,
  plum: 7032475,
  ink: 2959930,
  cream: 16774368,
  white: 16777215,
  wood: 13208405,
  blush: 16752048,
  glow: 16765562
};
function night(color, character = false) {
  const hsl2 = { h: 0, s: 0, l: 0 };
  new THREE9__namespace.Color(color).getHSL(hsl2);
  if (character) return new THREE9__namespace.Color().setHSL(hsl2.h, Math.min(1, hsl2.s * 1.05), Math.min(0.62, hsl2.l * 0.92 + 0.06)).getHex();
  const earthy = hsl2.h > 0.03 && hsl2.h < 0.12 && hsl2.l < 0.55;
  const purple = hsl2.h > 0.68 && hsl2.h < 0.86;
  return new THREE9__namespace.Color().setHSL(hsl2.h, hsl2.s * (earthy ? 0.5 : 0.95), hsl2.l * (earthy ? 0.58 : purple ? 0.85 : 0.68)).lerp(new THREE9__namespace.Color(earthy ? 2240570 : 1848440), earthy ? 0.1 : 0.12).getHex();
}
var MOON = new THREE9__namespace.Vector3(-0.45, 0.8, -0.4).normalize();
var FINISH = {
  vinyl: { shine: 70, edge: 0.45, spec: 0.5, fresnel: 0.14 },
  satin: { shine: 14, edge: 0.55, spec: 0.13, fresnel: 0.07 },
  flock: { shine: 1, edge: 2, spec: 0, fresnel: 0.32 },
  matte: { shine: 1, edge: 2, spec: 0, fresnel: 0 }
};
var flockMap;
function flockTexture() {
  flockMap ?? (flockMap = paintTexture(
    128,
    128,
    (u, v) => {
      const n = 0.6 * valueNoise(u * 64, v * 64, 64, 4) + 0.4 * valueNoise(u * 128, v * 128, 128, 9);
      const c = 214 + 41 * n;
      return [c, c, c];
    },
    { repeat: [3, 3] }
  ));
  return flockMap;
}
function withMoonRim(material, strength, finish2 = "satin") {
  const f = FINISH[finish2];
  if (finish2 === "flock" && !material.map) material.map = flockTexture();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.moonRim = strength;
    shader.uniforms.moonDir = { value: MOON };
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nuniform float moonRim;\nuniform vec3 moonDir;").replace(
      "#include <opaque_fragment>",
      `{
          vec3 n = normalize(normal);
          vec3 eye = normalize(vViewPosition);
          float facingEye = clamp(dot(n, eye), 0.0, 1.0);
          float edge = 1.0 - facingEye;
          float facing = smoothstep(-0.05, 0.25, dot(n, moonDir));
          float band = smoothstep(0.52, 0.58, edge) * facing;
          outgoingLight += vec3(0.62, 0.74, 1.0) * band * moonRim * (0.35 + 0.65 * max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b));
          #if NUM_DIR_LIGHTS > 0
          float gloss = 0.0;
          for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
            vec3 h = normalize(directionalLights[i].direction + eye);
            float s = pow(max(dot(n, h), 0.0), ${f.shine.toFixed(1)});
            gloss += smoothstep(${(f.edge - 0.05).toFixed(3)}, ${(f.edge + 0.05).toFixed(3)}, s) * dot(directionalLights[i].color, vec3(0.3333));
          }
          outgoingLight += vec3(gloss * ${f.spec.toFixed(3)});
          #endif
          outgoingLight += diffuseColor.rgb * pow(edge, 2.5) * ${f.fresnel.toFixed(3)};
        }
        #include <opaque_fragment>`
    );
  };
  material.customProgramCacheKey = () => `cartoon-toy-${finish2}`;
  return material;
}
function toonFactory(rim) {
  const gradient = paintTexture(
    4,
    1,
    (u) => {
      const v = u < 0.25 ? 110 : u < 0.5 ? 170 : u < 0.75 ? 225 : 255;
      return [v, v, v];
    },
    { srgb: false }
  );
  gradient.minFilter = gradient.magFilter = THREE9__namespace.NearestFilter;
  gradient.generateMipmaps = false;
  const cache = /* @__PURE__ */ new Map();
  const make = (color, options = {}) => {
    const finish2 = options.finish ?? (options.character ? "vinyl" : options.glow !== void 0 ? "matte" : "satin");
    const key = `${color}:${options.glow ?? ""}:${options.dayGlow ?? ""}:${options.transparent ?? ""}:${options.character ?? ""}:${finish2}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const material = withMoonRim(new THREE9__namespace.MeshToonMaterial({ color, gradientMap: gradient }), rim, finish2);
    if (options.transparent !== void 0) {
      material.transparent = true;
      material.opacity = options.transparent;
      material.depthWrite = false;
    }
    if (options.glow !== void 0) {
      material.emissive.set(options.glow);
      material.emissiveIntensity = options.dayGlow ?? 0;
      chunk7OAMHGZK_cjs.themed(material, { dark: { color: night(color), emissiveIntensity: 1.6 } });
    } else chunk7OAMHGZK_cjs.themed(material, { dark: { color: night(color, options.character) } });
    cache.set(key, material);
    return material;
  };
  return Object.assign(make, { rim });
}
function blob(rx, rz, seed, scale = 1, square = 2) {
  const shape2 = new THREE9__namespace.Shape();
  const N = 48;
  const e = 2 / square;
  for (let i = 0; i <= N; i++) {
    const a = i / N * TAU;
    const r = scale * (1 + 0.07 * Math.sin(3 * a + seed) + 0.045 * Math.sin(5 * a + seed * 2.3));
    const c = Math.cos(a), s = Math.sin(a);
    const x = rx * r * Math.sign(c) * Math.abs(c) ** e, y = rz * r * Math.sign(s) * Math.abs(s) ** e;
    if (i === 0) shape2.moveTo(x, y);
    else shape2.lineTo(x, y);
  }
  return shape2;
}
function slab(shape2, depth, top, bevel) {
  const geometry = new THREE9__namespace.ExtrudeGeometry(shape2, {
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 4
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, top, 0);
  return geometry;
}
var ISLAND_RX = 1.6;
var ISLAND_RZ = 1.15;
function island(root, toon, form, ticks) {
  const { seed, under, rx = ISLAND_RX, rz = ISLAND_RZ, square = 2 } = form;
  const cap = form.cap ?? palette.grass, soil = form.soil ?? palette.soil, soilDark = form.soilDark ?? palette.soilDark, rock = form.rock ?? palette.rock;
  mesh(root, slab(blob(rx, rz, seed, 1, square), 0.08, -0.06, 0.06), toon(cap, { finish: form.capFinish ?? "flock" }));
  if (under === "terraces") {
    [soil, shadeOf(soil), soilDark].forEach(
      (color, i) => mesh(
        root,
        slab(blob(rx, rz, seed + i, 0.97 - i * 0.12, square), 0.24, -0.16 - i * 0.26, 0.05),
        toon(color, { finish: "matte" })
      )
    );
  } else {
    mesh(root, slab(blob(rx, rz, seed, 0.97, square), 0.3, -0.16, 0.05), toon(soil, { finish: "matte" }));
    mesh(root, slab(blob(rx, rz, seed + 1, 0.74, square), 0.26, -0.5, 0.06), toon(soilDark, { finish: "matte" }));
  }
  const random = mulberry(seed * 1e3);
  const cone = (radius, height, x, z, top, color = rock) => {
    const point = mesh(root, new THREE9__namespace.ConeGeometry(radius, height, 7), toon(color, { finish: "matte" }), x, top - height / 2, z);
    point.rotation.x = Math.PI;
    point.rotation.y = random() * TAU;
    return point;
  };
  const tipRadius = Math.min(rx, rz) * 0.55;
  if (under === "stalactites") {
    cone(tipRadius * 0.8, 0.5, -0.2, 0, -0.66);
    cone(tipRadius * 0.45, 0.42, 0.55, 0.15, -0.6);
    cone(tipRadius * 0.38, 0.34, -0.75, -0.1, -0.58);
  } else
    cone(
      under === "roots" ? tipRadius * 0.75 : tipRadius,
      under === "terraces" ? 0.4 : 0.55,
      0,
      0,
      under === "terraces" ? -0.84 : -0.7
    );
  if (under === "crystals") {
    const crystal = toon(9434111, { glow: 6088959, dayGlow: 0.35, finish: "vinyl" });
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + 0.4;
      const length = 0.22 + random() * 0.2;
      const gem = mesh(
        root,
        new THREE9__namespace.ConeGeometry(0.07, length, 6),
        crystal,
        Math.cos(a) * 0.5,
        -0.66 - length / 2,
        Math.sin(a) * 0.35
      );
      gem.rotation.set(Math.PI + Math.sin(a) * 0.35, 0, Math.cos(a) * 0.35);
    }
  }
  if (under === "roots") {
    const roots = [];
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU + random() * 0.4;
      const r0 = 0.75 + random() * 0.2;
      const x0 = Math.cos(a) * rx * r0 * 0.8, z0 = Math.sin(a) * rz * r0 * 0.8;
      roots.push(
        mergeable(
          tube(
            [
              vec(x0, -0.5, z0),
              vec(x0 * 0.9, -0.72, z0 * 0.9),
              vec(x0 * 0.7 + 0.05, -0.92 - random() * 0.12, z0 * 0.7),
              vec(x0 * 0.55, -1.02 - random() * 0.12, z0 * 0.55)
            ],
            0.03,
            false,
            12,
            6
          )
        )
      );
    }
    mesh(root, BufferGeometryUtils_js.mergeGeometries(roots), toon(shadeOf(palette.wood), { finish: "matte" }));
  }
  if (under === "pipes") {
    const steel = toon(10134456, { finish: "vinyl" });
    const flange = toon(palette.ink, { finish: "matte" });
    for (const [a, y, length] of [
      [0.5, -0.3, 0.2],
      [1.35, -0.42, 0.16],
      [2.4, -0.3, 0.18]
    ]) {
      const pipe = group(root, Math.cos(a) * rx * 0.9, y, Math.sin(a) * rz * 0.9);
      pipe.rotation.y = -a;
      cylinder(pipe, 0.055, length, steel, [length / 2, 0, 0], 12).rotation.z = Math.PI / 2;
      cylinder(pipe, 0.075, 0.04, flange, [length, 0, 0], 12).rotation.z = Math.PI / 2;
    }
  }
  if (under === "falls") {
    const water = paintTexture(16, 64, (_u, v) => {
      const streak = Math.floor(v * 8) % 2 ? 255 : 205;
      return [streak * 0.62, streak * 0.88, streak];
    });
    water.wrapS = water.wrapT = THREE9__namespace.RepeatWrapping;
    water.magFilter = THREE9__namespace.NearestFilter;
    const flow = withMoonRim(
      new THREE9__namespace.MeshToonMaterial({ map: water, transparent: true, opacity: 0.92, side: THREE9__namespace.DoubleSide }),
      toon.rim,
      "vinyl"
    );
    chunk7OAMHGZK_cjs.themed(flow, { dark: { color: 10470655 } });
    const a = 0.95;
    const ex = Math.cos(a) * rx * 0.99, ez = Math.sin(a) * rz * 0.99;
    const out = vec(Math.cos(a), 0, Math.sin(a));
    const fall = ribbon(
      [
        vec(ex - out.x * 0.25, 0.012, ez - out.z * 0.25),
        vec(ex + out.x * 0.04, 0, ez + out.z * 0.04),
        vec(ex + out.x * 0.16, -0.3, ez + out.z * 0.16),
        vec(ex + out.x * 0.2, -0.95, ez + out.z * 0.2)
      ],
      0.2
    );
    mesh(root, fall, flow);
    const pool2 = mesh(
      root,
      new THREE9__namespace.CircleGeometry(0.2, 20),
      toon(8178162, { finish: "vinyl" }),
      ex - out.x * 0.28,
      0.025,
      ez - out.z * 0.28
    );
    pool2.rotation.x = -Math.PI / 2;
    pool2.scale.set(1.2, 0.8, 1);
    ticks.push((angle) => water.offset.y = angle / TAU * 4);
  }
  const flowers = [];
  for (let i = 0; i < 7; i++) {
    const a = random() * TAU, r = 0.86 + random() * 0.08;
    flowers.push(mergeable(placed(new THREE9__namespace.SphereGeometry(0.045, 8, 6), rx * r * Math.cos(a), 0.04, rz * r * Math.sin(a))));
  }
  mesh(root, BufferGeometryUtils_js.mergeGeometries(flowers), toon([palette.cream, palette.sun, palette.blush][seed % 3], { finish: "vinyl" }));
}
function ribbon(points, width) {
  const curve = new THREE9__namespace.CatmullRomCurve3(points);
  const positions = [], uvs = [], indices = [];
  const SEG = 24;
  const side = vec(0, 0, 0);
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    side.crossVectors(tangent, vec(0, 1, 0));
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize().multiplyScalar(width / 2);
    positions.push(p.x - side.x, p.y, p.z - side.z, p.x + side.x, p.y, p.z + side.z);
    uvs.push(0, t, 1, t);
    if (i < SEG) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geometry = new THREE9__namespace.BufferGeometry();
  geometry.setAttribute("position", new THREE9__namespace.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE9__namespace.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function bean(parent, toon, color, x, z, facing = 0) {
  const root = group(parent, x, 0, z);
  root.rotation.y = facing;
  const body = group(root);
  mesh(body, new THREE9__namespace.CapsuleGeometry(0.19, 0.22, 6, 18), toon(color, { character: true }), 0, 0.3, 0);
  const ink = toon(palette.ink);
  for (const side of [-1, 1]) {
    const eye = sphere2(body, 0.034, ink, [side * 0.075, 0.42, 0.172], 12);
    eye.scale.set(1, 1.3, 0.6);
    const cheek = sphere2(body, 0.035, toon(palette.blush, { character: true }), [side * 0.125, 0.36, 0.16], 10);
    cheek.scale.set(1, 0.7, 0.4);
    const foot2 = sphere2(root, 0.07, toon(shadeOf(color), { character: true }), [side * 0.08, 0.04, 0.03], 10);
    foot2.scale.set(1, 0.6, 1.3);
  }
  const smile = mesh(body, new THREE9__namespace.TorusGeometry(0.035, 0.011, 6, 12, Math.PI), ink, 0, 0.375, 0.178);
  smile.rotation.z = Math.PI;
  const arm = (side) => {
    const pivot = group(body, side * 0.19, 0.33, 0);
    const limb = mesh(
      pivot,
      new THREE9__namespace.CapsuleGeometry(0.045, 0.12, 4, 8),
      toon(color, { character: true }),
      side * 0.04,
      -0.08,
      0
    );
    limb.rotation.z = side * 0.4;
    return pivot;
  };
  return { root, body, left: arm(-1), right: arm(1) };
}
var shadeOf = (color) => new THREE9__namespace.Color(color).multiplyScalar(0.72).getHex();
function tree(parent, toon, x, z, scale = 1, crown = palette.grassDark) {
  const container = group(parent, x, 0, z);
  container.scale.setScalar(scale);
  cylinder(container, 0.06, 0.4, toon(palette.wood), [0, 0.2, 0], 8, 0.08);
  sphere2(container, 0.26, toon(crown), [0, 0.55, 0], 14);
  sphere2(container, 0.18, toon(crown), [0.16, 0.45, 0.08], 12);
  return container;
}
function pine(parent, toon, x, z, scale = 1) {
  const container = group(parent, x, 0, z);
  container.scale.setScalar(scale);
  cylinder(container, 0.05, 0.16, toon(palette.wood), [0, 0.08, 0], 8);
  mesh(container, new THREE9__namespace.ConeGeometry(0.22, 0.36, 8), toon(4168291), 0, 0.3, 0);
  mesh(container, new THREE9__namespace.ConeGeometry(0.17, 0.3, 8), toon(4168291), 0, 0.5, 0);
  return container;
}
var scenes = {
  /** Night workshop: a little robot taps at a workbench under a desk lamp; an idea pops above it. */
  ai(world, ticks, toon) {
    island(
      world,
      toon,
      { seed: 2, under: "crystals", cap: 10397373, capFinish: "matte", soil: 9076614, soilDark: 6971504, rock: 8355742 },
      ticks
    );
    const bench = group(world, 0.05, 0, -0.1);
    block(bench, [1.7, 0.1, 0.7], toon(palette.wood), [0, 0.56, 0], 0.04);
    for (const x of [-0.75, 0.75])
      for (const z of [-0.26, 0.26]) block(bench, [0.08, 0.52, 0.08], toon(shadeOf(palette.wood)), [x, 0.26, z], 0.03);
    block(bench, [0.56, 0.05, 0.2], toon(palette.cream), [-0.05, 0.635, 0.16], 0.025);
    const screen = group(bench, -0.05, 0.62, -0.18);
    block(screen, [0.62, 0.42, 0.06], toon(palette.ink), [0, 0.28, 0], 0.05);
    block(screen, [0.52, 0.32, 0.02], toon(2871472, { glow: 2871472, dayGlow: 0.55 }), [0, 0.29, 0.035], 0.03);
    cylinder(screen, 0.03, 0.08, toon(palette.ink), [0, 0.04, 0], 8);
    const lamp = group(bench, 0.62, 0.61, -0.05);
    cylinder(lamp, 0.11, 0.05, toon(palette.coral), [0, 0.025, 0], 16);
    const armGeometry = BufferGeometryUtils_js.mergeGeometries([
      mergeable(placed(new THREE9__namespace.CylinderGeometry(0.022, 0.022, 0.42, 8), -0.07, 0.22, 0, 0, 0, 0.35)),
      mergeable(placed(new THREE9__namespace.CylinderGeometry(0.022, 0.022, 0.36, 8), -0.06, 0.52, 0, 0, 0, -0.9))
    ]);
    mesh(lamp, armGeometry, toon(palette.ink));
    const shade2 = mesh(lamp, new THREE9__namespace.ConeGeometry(0.13, 0.17, 18, 1, true), toon(palette.coral), 0.07, 0.6, 0);
    shade2.rotation.z = 0.85;
    shade2.material.side = THREE9__namespace.DoubleSide;
    sphere2(lamp, 0.055, toon(palette.glow, { glow: palette.glow, dayGlow: 1 }), [0.035, 0.57, 0], 10);
    cylinder(world, 0.16, 0.36, toon(palette.plum), [-1.05, 0.18, 0.2], 14);
    const bot = group(world, -1.05, 0.36, 0.2);
    bot.scale.setScalar(1.25);
    bot.rotation.y = -Math.PI / 2 - 0.75;
    block(bot, [0.42, 0.34, 0.3], toon(palette.sky), [0, 0.2, 0], 0.1);
    const head = group(bot, 0, 0.5, 0);
    block(head, [0.5, 0.36, 0.36], toon(palette.sky), [0, 0, 0], 0.13);
    block(head, [0.4, 0.24, 0.04], toon(palette.ink), [0, 0, -0.18], 0.06);
    const eyes = toon(8385279, { glow: 8385279, dayGlow: 1.2 });
    for (const side of [-1, 1]) block(head, [0.07, 0.09, 0.02], eyes, [side * 0.09, 0.01, -0.2], 0.03);
    block(head, [0.24, 0.14, 0.02], toon(palette.cream), [0, 0, 0.185], 0.04);
    cylinder(head, 0.015, 0.16, toon(palette.ink), [0, 0.25, 0], 6);
    const bulbMaterial = toon(palette.coral, { glow: palette.coral, dayGlow: 0.4 });
    sphere2(head, 0.05, bulbMaterial, [0, 0.35, 0], 10);
    const arms = [];
    for (const side of [-1, 1]) {
      const pivot = group(bot, side * 0.23, 0.28, 0);
      const limb = mesh(pivot, new THREE9__namespace.CapsuleGeometry(0.045, 0.16, 4, 8), toon(palette.sky), 0, -0.04, -0.1);
      limb.rotation.x = Math.PI / 2.4;
      arms.push(pivot);
    }
    const idea = group(world, -0.82, 1.6, 0.2);
    sphere2(idea, 0.12, toon(palette.sun, { glow: palette.sun, dayGlow: 0.6 }), [0, 0, 0], 14);
    cylinder(idea, 0.055, 0.08, toon(palette.cream), [0, -0.13, 0], 10);
    tree(world, toon, -1.05, -0.35, 0.9);
    pine(world, toon, 1.1, 0.45, 0.7);
    ticks.push((angle) => {
      arms[0].rotation.x = 0.25 * Math.max(0, Math.sin(angle * 12));
      arms[1].rotation.x = 0.25 * Math.max(0, Math.sin(angle * 12 + Math.PI));
      head.rotation.z = 0.08 * Math.sin(angle * 2);
      head.position.y = 0.5 + 0.02 * Math.abs(Math.sin(angle * 6));
      const pop = Math.max(0, Math.sin(angle * 2 - 0.6));
      const scale = pop < 0.02 ? 0 : Math.min(1, pop * 3) * (1 + 0.15 * Math.sin(pop * 18));
      idea.scale.set(scale, scale * (1 + 0.1 * Math.cos(angle * 8)), scale);
      idea.position.y = 1.52 + 0.1 * pop;
      bulbMaterial.emissiveIntensity = Math.sin(angle * 8) > 0 ? 1.6 : 0.1;
    });
  },
  /** Courtside club: two bean players rally on a clay court; the ball squashes on every hit. */
  tennis(world, ticks, toon) {
    island(world, toon, { seed: 5, under: "terraces", square: 3.4, soil: 14256730, soilDark: 10902074 }, ticks);
    const court2 = group(world, 0, 0.02, 0);
    court2.rotation.y = -0.18;
    block(court2, [2.3, 0.05, 1.3], toon(14710858), [0, 0, 0], 0.04);
    const line2 = toon(palette.white);
    const lines = [];
    for (const z of [-0.56, 0.56]) lines.push(mergeable(placed(new THREE9__namespace.BoxGeometry(2.14, 0.016, 0.085), 0, 0.03, z)));
    for (const x of [-1.03, 1.03, -0.55, 0.55])
      lines.push(mergeable(placed(new THREE9__namespace.BoxGeometry(0.085, 0.016, 1.2), x, 0.03, 0)));
    lines.push(mergeable(placed(new THREE9__namespace.BoxGeometry(1.1, 0.016, 0.075), 0, 0.03, 0)));
    mesh(court2, BufferGeometryUtils_js.mergeGeometries(lines), line2);
    for (const z of [-0.7, 0.7]) cylinder(court2, 0.03, 0.34, toon(palette.ink), [0, 0.17, z], 8);
    const netTexture = paintTexture(
      64,
      16,
      (_u, _v, x, y) => x % 4 === 0 || y % 4 === 0 ? [45, 42, 58, 255] : [45, 42, 58, 40]
    );
    netTexture.magFilter = THREE9__namespace.NearestFilter;
    const netMaterial = withMoonRim(
      new THREE9__namespace.MeshToonMaterial({
        map: netTexture,
        transparent: true,
        side: THREE9__namespace.DoubleSide,
        depthWrite: false
      }),
      toon.rim
    );
    const net = mesh(court2, new THREE9__namespace.PlaneGeometry(1.4, 0.24), netMaterial, 0, 0.16, 0);
    net.rotation.y = Math.PI / 2;
    block(court2, [0.05, 0.045, 1.42], line2, [0, 0.29, 0], 0.02);
    const players = [
      bean(court2, toon, palette.coral, -0.8, 0.12, Math.PI / 2 - 0.3),
      bean(court2, toon, palette.plum, 0.8, -0.12, -Math.PI / 2 - 0.3)
    ];
    const stringTexture = paintTexture(
      16,
      20,
      (_u, _v, x, y) => x % 4 === 1 || x % 4 === 2 || y % 4 === 1 || y % 4 === 2 ? [255, 250, 236, 255] : [0, 0, 0, 0]
    );
    stringTexture.magFilter = THREE9__namespace.NearestFilter;
    const stringMaterial = withMoonRim(
      new THREE9__namespace.MeshToonMaterial({
        map: stringTexture,
        gradientMap: toon(palette.white).gradientMap,
        alphaTest: 0.5,
        side: THREE9__namespace.DoubleSide
      }),
      toon.rim
    );
    chunk7OAMHGZK_cjs.themed(stringMaterial, { dark: { color: night(16777215) } });
    const frameGeometry = new THREE9__namespace.TorusGeometry(0.075, 0.021, 8, 28);
    frameGeometry.scale(1, 1.28, 1);
    const throatGeometry = BufferGeometryUtils_js.mergeGeometries([
      mergeable(placed(new THREE9__namespace.CylinderGeometry(0.011, 0.011, 0.1, 6), -0.024, 0.11, 0, 0, 0, 0.42)),
      mergeable(placed(new THREE9__namespace.CylinderGeometry(0.011, 0.011, 0.1, 6), 0.024, 0.11, 0, 0, 0, -0.42))
    ]);
    const stringGeometry = new THREE9__namespace.PlaneGeometry(0.15, 0.19);
    const rackets = players.map((player, p) => {
      const racket3 = group(player.right, 0.08, -0.16, 0.04);
      racket3.scale.setScalar(1.8);
      cylinder(racket3, 0.019, 0.13, toon(p ? palette.sun : palette.cream), [0, 0, 0], 8);
      cylinder(racket3, 0.024, 0.025, toon(palette.ink), [0, -0.07, 0], 8);
      mesh(racket3, throatGeometry, toon(palette.sky));
      mesh(racket3, frameGeometry, toon(palette.sky), 0, 0.245, 0);
      mesh(racket3, stringGeometry, stringMaterial, 0, 0.245, 0);
      racket3.rotation.set(0, 0, -0.5);
      return racket3;
    });
    for (const player of players) player.root.scale.setScalar(1.25);
    const ball = sphere2(court2, 0.095, toon(15265866), [0, 0, 0], 14);
    const chair = group(world, 0.25, 0, -0.95);
    for (const x of [-0.12, 0.12]) block(chair, [0.05, 0.75, 0.05], toon(palette.white), [x, 0.375, 0], 0.02);
    block(chair, [0.34, 0.06, 0.3], toon(palette.sky), [0, 0.75, 0], 0.03);
    block(chair, [0.34, 0.26, 0.05], toon(palette.sky), [0, 0.9, -0.13], 0.03);
    block(world, [0.6, 0.1, 0.18], toon(palette.wood), [-0.9, 0.18, 0.85], 0.04);
    block(world, [0.2, 0.06, 0.16], toon(palette.sun), [-1, 0.26, 0.85], 0.03);
    tree(world, toon, 1.3, -0.5, 0.85);
    tree(world, toon, -1.35, -0.4, 0.7);
    const flood = group(world, -1.15, 0, 0.55);
    cylinder(flood, 0.03, 1.25, toon(palette.ink), [0, 0.625, 0], 8);
    block(flood, [0.26, 0.14, 0.1], toon(palette.ink), [0.06, 1.28, 0], 0.03);
    block(flood, [0.22, 0.1, 0.02], toon(palette.cream, { glow: palette.glow, dayGlow: 0.2 }), [0.06, 1.28, 0.055], 0.02);
    const from = vec(-0.62, 0.42, 0.18), to = vec(0.62, 0.42, -0.18);
    ticks.push((angle) => {
      const s = 0.5 - 0.5 * Math.cos(angle * 3);
      ball.position.lerpVectors(from, to, s);
      ball.position.y = 0.42 + 0.55 * Math.sin(Math.PI * s);
      const squash = Math.max(0, 1 - Math.min(s, 1 - s) * 14);
      ball.scale.set(1 + 0.35 * squash, 1 - 0.3 * squash, 1 + 0.35 * squash);
      rackets[0].rotation.z = -0.5 - 1.1 * Math.max(0, 1 - s * 2) ** 2;
      rackets[1].rotation.z = -0.5 - 1.1 * Math.max(0, s * 2 - 1) ** 2;
      players[0].root.position.z = 0.12 + 0.1 * Math.sin(angle * 3);
      players[1].root.position.z = -0.12 + 0.1 * Math.sin(angle * 3 + 1);
      players[0].body.position.y = 0.04 * Math.abs(Math.sin(angle * 6));
      players[1].body.position.y = 0.04 * Math.abs(Math.sin(angle * 6 + 1));
    });
  },
  /** Reading nook: a reader in an armchair under a big tree, a lamp, a sleeping cat and a butterfly. */
  reading(world, ticks, toon) {
    island(world, toon, { seed: 17, under: "roots", cap: 7912808 }, ticks);
    const oak = group(world, 0.55, 0, -0.45);
    oak.scale.setScalar(0.9);
    cylinder(oak, 0.13, 1.1, toon(palette.wood), [0, 0.55, 0], 10, 0.18);
    for (const [x, y, z, r] of [
      [0, 1.35, 0, 0.5],
      [-0.4, 1.15, 0.1, 0.36],
      [0.38, 1.2, 0.05, 0.38],
      [0.05, 1.05, 0.3, 0.3]
    ])
      sphere2(oak, r, toon(palette.grassDark), [x, y, z], 16);
    const rug = cylinder(world, 0.55, 0.02, toon(palette.coral), [-0.15, 0.01, 0.2], 28);
    rug.scale.z = 0.7;
    const chair = group(world, -0.2, 0, 0.1);
    chair.rotation.y = 0.35;
    block(chair, [0.7, 0.24, 0.55], toon(palette.sky), [0, 0.18, 0], 0.1);
    block(chair, [0.7, 0.58, 0.18], toon(palette.sky), [0, 0.45, -0.22], 0.09);
    for (const side of [-1, 1]) block(chair, [0.16, 0.38, 0.6], toon(palette.sky), [side * 0.33, 0.3, 0], 0.08);
    const reader = bean(chair, toon, palette.sun, 0, 0, 0);
    reader.root.position.y = 0.26;
    reader.root.scale.setScalar(1.05);
    const book = group(reader.body, 0, 0.28, 0.24);
    book.rotation.x = -0.5;
    for (const side of [-1, 1]) {
      const cover = group(book);
      cover.rotation.y = side * 0.35;
      block(cover, [0.17, 0.22, 0.02], toon(palette.plum), [side * 0.085, 0, 0], 0.01);
      block(cover, [0.15, 0.2, 0.02], toon(palette.cream), [side * 0.08, 0, 0.015], 8e-3);
    }
    const page = group(book, 0, 0, 0.03);
    block(page, [0.15, 0.2, 6e-3], toon(palette.white), [0.075, 0, 0], 3e-3);
    reader.left.rotation.x = reader.right.rotation.x = -1.1;
    const lamp = group(world, -0.85, 0, -0.25);
    cylinder(lamp, 0.12, 0.04, toon(palette.ink), [0, 0.02, 0], 14);
    cylinder(lamp, 0.02, 0.95, toon(palette.ink), [0, 0.5, 0], 8);
    const lampShade = toon(palette.cream, { glow: palette.glow, dayGlow: 0.35 });
    lampShade.side = THREE9__namespace.DoubleSide;
    mesh(lamp, new THREE9__namespace.CylinderGeometry(0.12, 0.2, 0.22, 18, 1, true), lampShade, 0, 1, 0);
    const pile = group(world, 0.35, 0, 0.45);
    [palette.coral, palette.sky, palette.grass].forEach((c, i) => {
      const b = block(pile, [0.36, 0.08, 0.26], toon(c), [0, 0.04 + i * 0.085, 0], 0.02);
      b.rotation.y = i * 0.25 - 0.2;
    });
    const cat = group(pile, 0, 0.26, 0);
    const catBody = sphere2(cat, 0.14, toon(9080734), [0, 0.06, 0], 14);
    catBody.scale.set(1.3, 0.75, 1);
    const catHead = group(cat, 0.15, 0.1, 0.04);
    sphere2(catHead, 0.08, toon(9080734), [0, 0, 0], 12);
    for (const side of [-1, 1]) mesh(catHead, new THREE9__namespace.ConeGeometry(0.03, 0.06, 6), toon(9080734), 0, 0.07, side * 0.04);
    mesh(cat, tube([vec(-0.16, 0.03, 0), vec(-0.2, 0.02, 0.1), vec(-0.08, 0, 0.16)], 0.025, false, 12, 6), toon(9080734));
    const fly = group(world, 0, 0.9, 0.3);
    const wings = [];
    for (const side of [-1, 1]) {
      const wing = mesh(fly, new THREE9__namespace.CircleGeometry(0.11, 12), toon(palette.coral), 0, 0, 0);
      wing.geometry.translate(side * 0.1, 0, 0);
      wing.material.side = THREE9__namespace.DoubleSide;
      wings.push(wing);
    }
    ticks.push((angle) => {
      page.rotation.y = -Math.PI * 0.5 * (0.5 - 0.5 * Math.cos(angle * 3)) * 0.8;
      catBody.scale.y = 0.75 + 0.04 * Math.sin(angle * 4);
      fly.position.set(0.9 * Math.sin(angle), 0.95 + 0.15 * Math.sin(angle * 3), 0.35 + 0.35 * Math.cos(angle));
      fly.rotation.y = -angle + Math.PI / 2;
      const flap = 0.8 * Math.sin(angle * 18);
      wings[0].rotation.y = flap;
      wings[1].rotation.y = -flap;
      reader.body.rotation.z = 0.04 * Math.sin(angle * 2);
    });
  }
};
var FRAME_RINGS = [
  [0.06, 1.82, 1.32],
  [-0.5, 1.58, 1.12],
  [1, 1.7, 1.15],
  [1.85, 1.5, 0.75]
];
var FRAME_TIP = -1.26;
function frameProxy() {
  const points = [0, FRAME_TIP, 0, 0, FRAME_TIP, 0];
  for (const [y, rx, rz] of FRAME_RINGS)
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * TAU, b = (i + 1) / 32 * TAU;
      points.push(rx * Math.cos(a), y, rz * Math.sin(a), rx * Math.cos(b), y, rz * Math.sin(b));
    }
  const geometry = new THREE9__namespace.BufferGeometry();
  geometry.setAttribute("position", new THREE9__namespace.Float32BufferAttribute(points, 3));
  const proxy = new THREE9__namespace.LineSegments(geometry, new THREE9__namespace.LineBasicMaterial({ colorWrite: false, depthWrite: false }));
  proxy.rotation.y = -0.35;
  return proxy;
}
var lampAt = {
  ai: [0.7, 1.15, 0],
  tennis: [-1.05, 1.2, 0.7],
  reading: [-0.8, 0.95, -0.12]
};
function cartoon(kind, ticks) {
  const root = new THREE9__namespace.Group();
  root.userData.look = cartoonLook;
  const world = group(root);
  world.rotation.y = -0.35;
  const rim = { value: 0 };
  scenes[kind](world, ticks, toonFactory(rim));
  world.traverse((item) => {
    if (item !== world) item.userData.frameIgnore = true;
  });
  root.add(frameProxy());
  const practical = new THREE9__namespace.PointLight(16758886, 0, 3.4, 1.4);
  practical.position.set(...lampAt[kind]);
  world.add(practical);
  const dark = themeProbe(root);
  ticks.push((angle) => {
    rim.value = dark() ? 1 : 0;
    practical.intensity = dark() ? 5.5 : 0;
    world.position.y = 0.03 * Math.sin(angle);
  });
  return root;
}
var realisticLook = {
  rig: {
    both: {
      toneMapping: "neutral",
      exposure: 1,
      environment: { kind: "room", intensity: 0.4, rotation: 0.5 },
      hemisphere: { sky: 16051682, ground: 3879209, intensity: 0.7 },
      // A low window to the left: long shadows and grazing light across every texture.
      key: { color: 16770754, intensity: 4.4, position: [-6, 2.3, 2.6], shadow: true, shadowRadius: 5 },
      fill: { color: 14542576, intensity: 0.5, position: [5, 1.6, 5] },
      rim: { color: 16777215, intensity: 1.3, position: [3, 2.6, -5] }
    },
    light: { reflections: 1 },
    // Night: the window is gone. A warm desk lamp up to the right is the key (with a pool of light
    // from the practical in realistic()), and a cool moonlit rim from behind left cuts the silhouettes.
    dark: {
      exposure: 1,
      hemisphere: { sky: 8425648, ground: 920586, intensity: 0.16 },
      environment: { intensity: 0.16 },
      key: { color: 16762252, intensity: 0.9, position: [4.5, 3.6, 2.8] },
      fill: { color: 10136272, intensity: 0.12, position: [-5, 1.5, 5] },
      rim: { color: 11059199, intensity: 2.8, position: [-3.5, 0.9, -5] },
      // Presets take their image light from `reflections`, not the environment intensity: keep it
      // low, or the room's even light washes the lamp's falloff out.
      reflections: 0.32
    }
  },
  camera: { projection: "perspective", fov: 20, pitch: 15 },
  framing: { fill: 0.8, maxWidth: 0.98, lift: -0.03, sample: "loop" },
  castShadows: true
};
var GROUND_NEAR = 2.4;
var WALL_Z = -4.6;
var GROUND_WIDTH = 16;
var GROUND_DEPTH = GROUND_NEAR - WALL_Z;
var tile = (x, z) => [x * GROUND_WIDTH / 4.2, z * GROUND_DEPTH / 8.5];
var EXPAND = 64;
function expanded(geometry) {
  return geometry.scale(1 / EXPAND, 1 / EXPAND, 1 / EXPAND);
}
function defocus(material, object, strength = 6) {
  object.frustumCulled = false;
  const focus = { value: 8 };
  const origin = new THREE9__namespace.Vector3(), lens = new THREE9__namespace.Vector3();
  object.onBeforeRender = (_renderer, _scene, camera) => {
    (object.parent ?? object).getWorldPosition(origin);
    camera.getWorldPosition(lens);
    focus.value = lens.distanceTo(origin);
  };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.focusDepth = focus;
    const bias = "dofBias";
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
transformed *= ${EXPAND.toFixed(1)};`
    );
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nuniform float focusDepth;").replace(
      "#include <map_fragment>",
      `float ${bias} = clamp(pow(abs(vViewPosition.z - focusDepth) / focusDepth, 1.3) * ${strength.toFixed(2)}, 0.0, 5.0);
` + THREE9__namespace.ShaderChunk.map_fragment.replace("texture2D( map, vMapUv )", `texture2D( map, vMapUv, ${bias} )`)
    ).replace(
      "#include <roughnessmap_fragment>",
      THREE9__namespace.ShaderChunk.roughnessmap_fragment.replace(
        "texture2D( roughnessMap, vRoughnessMapUv )",
        `texture2D( roughnessMap, vRoughnessMapUv, ${bias} )`
      )
    ).replace(
      "#include <normal_fragment_maps>",
      THREE9__namespace.ShaderChunk.normal_fragment_maps.split("texture2D( normalMap, vNormalMapUv )").join(`texture2D( normalMap, vNormalMapUv, ${bias} )`)
    );
  };
  material.customProgramCacheKey = () => `realistic-defocus-${strength}`;
  return material;
}
function surface(root, map, normalMap, roughness, dark = 0.72) {
  const material = chunk7OAMHGZK_cjs.themed(
    new THREE9__namespace.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE9__namespace.Vector2(0.45, 0.45),
      roughness,
      metalness: 0
    }),
    { dark: { color: new THREE9__namespace.Color(dark, dark, dark).getHex() } }
  );
  for (const texture of [map, normalMap]) if (texture) texture.anisotropy = 16;
  const ground = new THREE9__namespace.PlaneGeometry(GROUND_WIDTH, GROUND_DEPTH).rotateX(-Math.PI / 2).translate(0, 0, GROUND_NEAR - GROUND_DEPTH / 2);
  const plane = mesh(root, expanded(ground), material);
  plane.renderOrder = -2;
  plane.receiveShadow = true;
  plane.userData.frameIgnore = true;
  defocus(material, plane);
  return plane;
}
function backdrop(root, kind) {
  const disc2 = (u, v, cu, cv, r, aspect = 2) => smoothstep2(r, r * 0.55, Math.hypot((u - cu) * aspect, v - cv));
  const painter = {
    room(u, v) {
      const window = smoothstep2(0.02, 0.12, u) * smoothstep2(0.5, 0.36, u) * smoothstep2(0.22, 0.34, v) * smoothstep2(0.98, 0.84, v);
      const mullion = 1 - 0.35 * smoothstep2(0.035, 0, Math.abs(u - 0.26)) - 0.35 * smoothstep2(0.03, 0, Math.abs(v - 0.62));
      const fall = 0.62 + 0.38 * smoothstep2(1, 0.1, u);
      const corner = smoothstep2(0, 0.16, v);
      const plant = 0.55 * disc2(u, v, 0.78, 0.36, 0.13) + 0.35 * disc2(u, v, 0.86, 0.5, 0.09);
      const light = clamp01(fall * (0.55 + 0.45 * corner) + 0.5 * window * mullion);
      const base2 = mixRgb(9404784, 15918800, light);
      return base2.map((c, i) => mix(c, [74, 86, 60][i], plant * 0.7));
    },
    court(u, v) {
      const screen = smoothstep2(0.66, 0.6, v);
      const post = smoothstep2(0.03, 0, Math.abs((u * 4 + 0.3) % 1 - 0.5) - 0.47);
      const sky = mixRgb(12375270, 15331056, smoothstep2(1, 0.6, v));
      const cloth = mixRgb(2047795, 3103303, 0.5 + 0.5 * valueNoise(u * 6, v * 3, 6, 4));
      const shade2 = cloth.map((c) => c * (1 - 0.25 * post));
      return sky.map((c, i) => mix(c, shade2[i], screen));
    },
    rack(u, v) {
      const door = 0.5 + 0.5 * smoothstep2(0.08, 0, Math.abs(u * 5 % 1 - 0.5) - 0.42);
      let c = mixRgb(1382429, 2830392, 0.4 * door + 0.3 * smoothstep2(0, 0.7, v));
      const random = seeded(91);
      for (let k = 0; k < 26; k++) {
        const cu = random(), cv = 0.2 + random() * 0.7, hue = random();
        const glow2 = disc2(u, v, cu, cv, 0.035 + 0.02 * random());
        const tint2 = hue < 0.55 ? [70, 150, 255] : hue < 0.85 ? [80, 255, 150] : [255, 170, 70];
        c = c.map((x, i) => mix(x, tint2[i], glow2 * 0.75));
      }
      return c;
    }
  };
  const texture = paintTexture(160, 80, (u, v) => painter[kind](u, v));
  const material = chunk7OAMHGZK_cjs.themed(new THREE9__namespace.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 }), {
    dark: { color: kind === "rack" ? 11579568 : 6974058 }
  });
  if (kind === "rack") Object.assign(material, { emissiveMap: texture, emissive: new THREE9__namespace.Color(7829367) });
  const wall = mesh(root, expanded(new THREE9__namespace.PlaneGeometry(GROUND_WIDTH, 8).translate(0, 3.6, WALL_Z)), material);
  wall.renderOrder = -3;
  wall.userData.frameIgnore = true;
  defocus(material, wall, 2);
  return wall;
}
var WOOD_TILE = 3;
var WOOD_SIZE = 512;
var WOOD_LINES = 78;
var woodField;
function woodData() {
  if (woodField) return woodField;
  const SIZE = WOOD_SIZE;
  const field = new Float32Array(SIZE * SIZE * 3), tones = new Float32Array(SIZE * SIZE);
  const lineHash = (n, salt) => valueNoise2(n * 13.7 + salt, salt * 3.3, 4096, 4096, 41);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const u = (x + 0.5) / SIZE, v = (y + 0.5) / SIZE;
      const drift = 0.5 * (valueNoise2(u * 2, v * 3, 2, 3, 11) - 0.5) + 0.18 * (valueNoise2(u * 7, v * 9, 7, 9, 3) - 0.5);
      const g = (v + drift * 0.03) * WOOD_LINES + 5 * (valueNoise2(0, v * 9, 1, 9, 51) - 0.5) + 2 * (valueNoise2(0, v * 23, 1, 23, 52) - 0.5);
      const line2 = Math.floor(g), ring = g - line2;
      const weight = 0.35 + 0.65 * lineHash(line2, 1), width = 0.16 + 0.22 * lineHash(line2, 2);
      const late = weight * smoothstep2(1 - width - 0.18, 1 - width, ring) * (1 - smoothstep2(0.93, 1, ring));
      const pores = smoothstep2(0.7, 0.95, valueNoise2(u * 56, v * 420, 56, 420, 23));
      const streak = valueNoise2(u * 2, v * 16, 2, 16, 31) * 0.7 + valueNoise2(u * 1, v * 5, 1, 5, 37) * 0.3;
      const seam = smoothstep2(6e-3, 0, Math.min(v, 1 - v));
      const i = (y * SIZE + x) * 3;
      field[i] = late;
      field[i + 1] = pores;
      field[i + 2] = seam;
      const tone = clamp01(0.46 + 0.44 * streak - 0.17 * late - 0.12 * pores);
      tones[i / 3] = tone * (1 - 0.75 * seam);
    }
  return woodField = { field, tones };
}
function walnut(root) {
  const SIZE = WOOD_SIZE;
  const { field, tones } = woodData();
  const repeat = [GROUND_WIDTH / WOOD_TILE, GROUND_DEPTH / WOOD_TILE];
  const map = paintTexture(SIZE, SIZE, (_u, _v, x, y) => mixRgb(2759184, 9726015, tones[y * SIZE + x]), { repeat });
  map.anisotropy = 8;
  const normalMap = normalTexture(
    SIZE,
    (u, v) => {
      const i = (Math.min(SIZE - 1, Math.floor(v * SIZE)) * SIZE + Math.min(SIZE - 1, Math.floor(u * SIZE))) * 3;
      return 0.6 - 0.2 * field[i] - 0.2 * field[i + 1] - 0.8 * field[i + 2];
    },
    2,
    repeat
  );
  normalMap.anisotropy = 8;
  const roughnessMap = paintTexture(
    SIZE / 2,
    SIZE / 2,
    (_u, _v, x, y) => {
      const i = (y * 2 * SIZE + x * 2) * 3;
      const r = clamp01(0.72 - 0.16 * field[i] + 0.25 * field[i + 1] + 0.3 * field[i + 2]) * 255;
      return [r, r, r];
    },
    { srgb: false, repeat }
  );
  const plane = surface(root, map, normalMap, 0.62);
  plane.material.roughnessMap = roughnessMap;
  return plane;
}
var wearMaps = /* @__PURE__ */ new Map();
function wearMap(scratches, repeat = 1, seed = 1) {
  const key = `${scratches}:${repeat}:${seed}`;
  const cached = wearMaps.get(key);
  if (cached) return cached;
  const SIZE = 256;
  const lines = new Float32Array(SIZE * SIZE);
  const random = seeded(seed * 97 + 13);
  for (let n = 0; n < scratches; n++) {
    const x0 = random() * SIZE, y0 = random() * SIZE, angle = random() * Math.PI, length = 12 + random() * 110, strength = 0.35 + 0.65 * random();
    for (let t = 0; t < length; t++) {
      const px = Math.floor(x0 + Math.cos(angle) * t), py = Math.floor(y0 + Math.sin(angle) * t);
      const i = (py % SIZE + SIZE) % SIZE * SIZE + (px % SIZE + SIZE) % SIZE;
      lines[i] = Math.max(lines[i], strength * Math.sin(t / length * Math.PI));
    }
  }
  const texture = paintTexture(
    SIZE,
    SIZE,
    (u, v, x, y) => {
      const smudge = fbm(u * 4, v * 4, 4, 4, seed + 2), mottle = valueNoise(u * 64, v * 64, 64, seed + 5);
      const r = clamp01(0.4 + 0.5 * smudge + 0.1 * mottle + 0.26 * lines[y * SIZE + x]) * 255;
      return [r, r, r];
    },
    { srgb: false, repeat: [repeat, repeat] }
  );
  wearMaps.set(key, texture);
  return texture;
}
function worn(material, scratches = 0, repeat = 1, seed = 1) {
  material.roughnessMap = wearMap(scratches, repeat, seed);
  material.roughness = Math.min(1, material.roughness / 0.78);
  return material;
}
function projectUv(geometry, scale = 2) {
  const position = geometry.attributes.position;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getX(i) + position.getZ(i) * 0.7) * scale;
    uv[i * 2 + 1] = (position.getY(i) + position.getZ(i) * 0.4) * scale;
  }
  geometry.setAttribute("uv", new THREE9__namespace.BufferAttribute(uv, 2));
  return geometry;
}
function court(root) {
  const map = paintTexture(
    128,
    128,
    (u, v) => {
      const speck = valueNoise(u * 128, v * 128, 128, 2);
      return mixRgb(2905719, 4618395, speck * 0.7 + 0.15 * fbm(u * 4, v * 4, 4, 2, 8));
    },
    { repeat: tile(6, 12) }
  );
  const normalMap = normalTexture(128, (u, v) => valueNoise(u * 128, v * 128, 128, 3), 2.5, tile(12, 24));
  return surface(root, map, normalMap, 0.82);
}
function steelLid(root) {
  const map = paintTexture(
    128,
    128,
    (u, v) => mixRgb(2895668, 3882821, 0.55 * fbm(u * 3, v * 3, 3, 3, 14) + 0.25 * valueNoise(u * 128, v * 128, 128, 6)),
    { repeat: tile(5, 10) }
  );
  const normalMap = normalTexture(128, (u, v) => fbm(u * 24, v * 24, 24, 2, 9), 1.6, tile(16, 32));
  const plane = surface(root, map, normalMap, 0.5 / 0.78, 0.6);
  plane.material.roughnessMap = wearMap(40, 11, 4);
  return plane;
}
function ssdBoardMaterial() {
  const W = 128, H = 256;
  const copper = new Float32Array(W * H), gold = new Float32Array(W * H), silk = new Float32Array(W * H);
  const random = seeded(77);
  const dot = (target, x, y, r) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const px = Math.round(x + dx), py = Math.round(y + dy);
        if (px >= 0 && py >= 0 && px < W && py < H && dx * dx + dy * dy <= r * r + 0.5) target[py * W + px] = 1;
      }
  };
  const stroke2 = (target, x0, y0, x1, y1, r) => {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let n = 0; n <= steps; n++)
      dot(target, x0 + (x1 - x0) * n / Math.max(1, steps), y0 + (y1 - y0) * n / Math.max(1, steps), r);
  };
  for (let bus = 0; bus < 9; bus++) {
    const x = 8 + random() * (W - 16), y = 20 + random() * (H - 40), count = 3 + Math.floor(random() * 4), run = 18 + random() * 50, turn = random() < 0.5 ? -1 : 1;
    for (let k = 0; k < count; k++) {
      const ox = x + k * 3, oy = y + k * 3;
      stroke2(copper, ox, oy, ox, oy + run, 0.6);
      stroke2(copper, ox, oy + run, ox + turn * 14, oy + run + 14, 0.6);
      dot(gold, ox + turn * 14, oy + run + 14, 1.4);
    }
  }
  for (let k = 0; k < 22; k++)
    for (let y = H - 10; y < H - 1; y++) for (let x = 6 + k * 5; x < 9 + k * 5; x++) gold[y * W + x] = 1;
  for (const [x0, y0, x1, y1] of [
    [12, 18, 58, 70],
    [70, 18, 116, 70],
    [12, 92, 58, 144],
    [70, 92, 116, 144],
    [34, 166, 94, 214]
  ]) {
    stroke2(silk, x0, y0, x1, y0, 0.4);
    stroke2(silk, x0, y1, x1, y1, 0.4);
    stroke2(silk, x0, y0, x0, y1, 0.4);
    stroke2(silk, x1, y0, x1, y1, 0.4);
  }
  const height = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          sum += copper[Math.min(H - 1, Math.max(0, y + dy)) * W + Math.min(W - 1, Math.max(0, x + dx))];
      height[y * W + x] = sum / 9 + 0.6 * gold[y * W + x];
    }
  const at2 = (x, y) => height[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  const map = paintTexture(W, H, (u, v, x, y) => {
    const i = y * W + x;
    if (gold[i]) return [214, 172, 92];
    if (silk[i]) return [226, 230, 222];
    const n = valueNoise(u * 40, v * 80, 40, 3);
    return mixRgb(1195306, 3109712, clamp01(0.75 * height[i] + 0.12 * n));
  });
  const normalMap = paintTexture(
    W,
    H,
    (_u, _v, x, y) => {
      const n = vec(-(at2(x + 1, y) - at2(x - 1, y)) * 1.4, -(at2(x, y + 1) - at2(x, y - 1)) * 1.4, 1).normalize();
      return [(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255];
    },
    { srgb: false }
  );
  const surfaceMap = paintTexture(
    W,
    H,
    (u, v, x, y) => {
      const i = y * W + x;
      const rough = gold[i] ? 0.3 : silk[i] ? 0.8 : 0.34 + 0.12 * valueNoise(u * 16, v * 32, 16, 8);
      return [0, rough * 255, gold[i] ? 255 : 0];
    },
    { srgb: false }
  );
  const material = new THREE9__namespace.MeshStandardMaterial({
    map,
    normalMap,
    roughnessMap: surfaceMap,
    metalnessMap: surfaceMap,
    metalness: 1,
    roughness: 1
  });
  material.userData.lookReflections = 1;
  return material;
}
function pool(parent, width, depth, x = 0, z = 0, opacity = 0.6, y = 4e-3) {
  const shadow = chunk7OAMHGZK_cjs.contactShadow(width, depth, { opacity, x, y, z, color: 1182470 });
  parent.add(shadow);
  return shadow;
}
function setDressing(object) {
  object.traverse((item) => {
    item.userData.frameIgnore = true;
    const part = item;
    if (part.isMesh) {
      part.castShadow = true;
      part.receiveShadow = true;
    }
  });
  return object;
}
var decal = (object) => {
  object.userData.frameIgnore = true;
  return object;
};
var clearGlass = () => chunk7OAMHGZK_cjs.lookMaterial("ceramic", 16054527, {
  transparent: true,
  opacity: 0.16,
  roughness: 0.02,
  clearcoat: 1,
  clearcoatRoughness: 0.02,
  depthWrite: false,
  envMapIntensity: 2.2
});
function racket(root) {
  const A = 1.62, B = 1.27, BEAM = 0.13, DEPTH = 0.2;
  const set = group(root, -0.36, 0, -1.55);
  set.rotation.y = 1.25;
  const ellipse = (a, b, reverse = false) => Array.from({ length: 97 }, (_, i) => {
    const t = (reverse ? 96 - i : i) / 96 * TAU;
    return new THREE9__namespace.Vector2(a * Math.cos(t), b * Math.sin(t));
  });
  const hoop = new THREE9__namespace.Shape(ellipse(A, B));
  hoop.holes.push(new THREE9__namespace.Path(ellipse(A - BEAM, B - BEAM, true)));
  const hoopGeometry = new THREE9__namespace.ExtrudeGeometry(hoop, {
    depth: DEPTH - 0.04,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 3,
    curveSegments: 96
  });
  hoopGeometry.rotateX(-Math.PI / 2);
  hoopGeometry.translate(0, 0.02, 0);
  const paint = worn(chunk7OAMHGZK_cjs.lookMaterial("ceramic", 1447964, { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }), 70, 2, 31);
  const accent = worn(chunk7OAMHGZK_cjs.lookMaterial("ceramic", 14833438, { roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.15 }), 30, 2, 32);
  const hoopMesh = mesh(set, projectUv(hoopGeometry, 1.5), paint);
  hoopMesh.castShadow = true;
  const throat = BufferGeometryUtils_js.mergeGeometries([
    mergeable(rodGeometry(vec(A - 0.25, DEPTH / 2, 0.66), vec(A + 1.05, DEPTH / 2, 0.14), 0.07, 16)),
    mergeable(rodGeometry(vec(A - 0.25, DEPTH / 2, -0.66), vec(A + 1.05, DEPTH / 2, -0.14), 0.07, 16))
  ]);
  throat.scale(1, 1.25, 1);
  mesh(set, projectUv(throat, 1.5), accent).castShadow = true;
  const gripLength = 2.4;
  const wrap2 = paintTexture(64, 256, (u, v) => {
    const t = (u + v * 9) % 1;
    const ridge2 = smoothstep2(0.06, 0, Math.min(t, 1 - t));
    const dirt = 0.9 + 0.1 * valueNoise(u * 8, v * 40, 8, 6);
    const c = (232 - 40 * ridge2) * dirt;
    return [c, c * 0.985, c * 0.95];
  });
  const wrapNormal = normalTexture(
    64,
    (u, v) => {
      const t = (u + v * 4) % 1;
      return smoothstep2(0.08, 0, Math.min(t, 1 - t)) * 0.6 + 0.08 * valueNoise(u * 32, v * 32, 32, 2);
    },
    3,
    [1, 2]
  );
  const grip = mesh(
    set,
    new THREE9__namespace.CylinderGeometry(0.15, 0.15, gripLength, 8, 1).rotateY(Math.PI / 8),
    chunk7OAMHGZK_cjs.lookMaterial("rubber", 16777215, { map: wrap2, normalMap: wrapNormal, roughness: 0.85 }),
    A + 1.05 + gripLength / 2,
    0.15,
    0
  );
  grip.rotation.z = Math.PI / 2;
  grip.castShadow = true;
  setDressing(grip);
  const collar = cylinder(set, 0.13, 0.22, accent, [A + 1.1, 0.15, 0], 8);
  collar.rotation.z = Math.PI / 2;
  setDressing(collar);
  const string = worn(chunk7OAMHGZK_cjs.lookMaterial("plastic", 15986656, { roughness: 0.38 }), 0, 4, 33);
  const IA = A - BEAM - 0.01, IB = B - BEAM - 0.01;
  const strand = new THREE9__namespace.CylinderGeometry(0.017, 0.017, 1, 6, 1);
  strand.rotateZ(Math.PI / 2);
  const MAINS = 16, CROSSES = 19;
  const strings = new THREE9__namespace.InstancedMesh(strand, string, MAINS + CROSSES);
  const matrix = new THREE9__namespace.Matrix4(), turn = new THREE9__namespace.Quaternion().setFromAxisAngle(vec(0, 1, 0), Math.PI / 2);
  let n = 0;
  for (let i = 0; i < MAINS; i++) {
    const z = -IB + (i + 0.5) / MAINS * 2 * IB;
    const half = IA * Math.sqrt(Math.max(0, 1 - (z / IB) ** 2));
    matrix.compose(vec(0, DEPTH / 2 + 0.012, z), new THREE9__namespace.Quaternion(), vec(half * 2, 1, 1));
    strings.setMatrixAt(n++, matrix);
  }
  for (let i = 0; i < CROSSES; i++) {
    const x = -IA + (i + 0.5) / CROSSES * 2 * IA;
    const half = IB * Math.sqrt(Math.max(0, 1 - (x / IA) ** 2));
    matrix.compose(vec(x, DEPTH / 2 - 0.012, 0), turn, vec(half * 2, 1, 1));
    strings.setMatrixAt(n++, matrix);
  }
  strings.castShadow = true;
  set.add(strings);
  set.traverse((item) => item.userData.frameIgnore = true);
  pool(set, 3.4, 2.6, 0, 0, 0.25);
  return set;
}
var BOOK_TEXT = [
  "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
  "However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.",
  "\u201CMy dear Mr. Bennet,\u201D said his lady to him one day, \u201Chave you heard that Netherfield Park is let at last?\u201D",
  "Mr. Bennet replied that he had not.",
  "\u201CBut it is,\u201D returned she; \u201Cfor Mrs. Long has just been here, and she told me all about it.\u201D",
  "Mr. Bennet made no answer.",
  "\u201CDo you not want to know who has taken it?\u201D cried his wife impatiently.",
  "\u201CYou want to tell me, and I have no objection to hearing it.\u201D This was invitation enough.",
  "\u201CWhy, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it that he agreed with Mr. Morris immediately; that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week.\u201D",
  "\u201CWhat is his name?\u201D \u201CBingley.\u201D \u201CIs he married or single?\u201D",
  "\u201COh! single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!\u201D",
  "\u201CHow so? how can it affect them?\u201D",
  "\u201CMy dear Mr. Bennet,\u201D replied his wife, \u201Chow can you be so tiresome! You must know that I am thinking of his marrying one of them.\u201D",
  "\u201CIs that his design in settling here?\u201D",
  "\u201CDesign! nonsense, how can you talk so! But it is very likely that he may fall in love with one of them, and therefore you must visit him as soon as he comes.\u201D"
];
function bookSpread() {
  const canvas = typeof document === "undefined" ? null : document.createElement("canvas");
  const context = canvas?.getContext("2d");
  if (!canvas || !context || typeof context.createLinearGradient !== "function" || typeof context.measureText !== "function")
    return null;
  const PAGE_W = 1024, PAGE_H = 1392;
  canvas.width = PAGE_W * 2;
  canvas.height = PAGE_H;
  const g = context;
  for (let page = 0; page < 2; page++) {
    const gradient = g.createLinearGradient(page * PAGE_W, 0, (page + 1) * PAGE_W, 0);
    const [inner, outer] = ["rgb(230, 220, 198)", "rgb(244, 237, 221)"];
    gradient.addColorStop(0, page ? inner : outer);
    gradient.addColorStop(0.12, page ? "rgb(239, 231, 212)" : outer);
    gradient.addColorStop(0.88, page ? outer : "rgb(239, 231, 212)");
    gradient.addColorStop(1, page ? outer : inner);
    g.fillStyle = gradient;
    g.fillRect(page * PAGE_W, 0, PAGE_W, PAGE_H);
  }
  const random = seeded(7);
  for (let k = 0; k < 9e3; k++) {
    g.fillStyle = `rgba(120, 100, 70, ${0.03 + 0.05 * random()})`;
    g.fillRect(random() * PAGE_W * 2, random() * PAGE_H, 1 + random() * 2, 1);
  }
  const SIZE = 34, LEAD = 46, INK = "rgb(43, 38, 34)";
  const serif = (size, style = "") => `${style} ${size}px Georgia, "Times New Roman", Times, serif`;
  const words = BOOK_TEXT.map((paragraph2) => paragraph2.split(" "));
  let paragraph = 0, word = 0;
  const setColumn = (left, top, width, bottom) => {
    g.font = serif(SIZE);
    g.fillStyle = INK;
    g.textBaseline = "alphabetic";
    let y = top;
    while (y < bottom && paragraph < words.length) {
      const indent = word === 0 ? SIZE * 1.4 : 0;
      const line2 = [];
      let used = 0;
      const space = g.measureText(" ").width;
      while (word < words[paragraph].length) {
        const w = g.measureText(words[paragraph][word]).width;
        if (line2.length && used + space + w > width - indent) break;
        used += (line2.length ? space : 0) + w;
        line2.push(words[paragraph][word++]);
      }
      const last = word >= words[paragraph].length;
      const gap = last || line2.length < 2 ? space : space + (width - indent - used) / (line2.length - 1);
      let x = left + indent;
      for (const w of line2) {
        g.fillText(w, x, y);
        x += g.measureText(w).width + gap;
      }
      if (last) {
        paragraph++;
        word = 0;
      }
      y += LEAD;
    }
  };
  const MARGIN_OUT = 120, MARGIN_IN = 150, TOP = 170, BOTTOM = PAGE_H - 150;
  g.font = serif(24, "italic");
  g.fillStyle = "rgb(90, 81, 72)";
  g.textAlign = "center";
  g.fillText("PRIDE AND PREJUDICE", PAGE_W * 1.5, 100);
  g.fillText("1", PAGE_W / 2, PAGE_H - 80);
  g.fillText("2", PAGE_W * 1.5, PAGE_H - 80);
  g.font = serif(46);
  g.fillStyle = INK;
  g.fillText("CHAPTER I.", PAGE_W / 2, 300);
  g.fillRect(PAGE_W / 2 - 60, 330, 120, 3);
  g.textAlign = "left";
  setColumn(MARGIN_OUT, 420, PAGE_W - MARGIN_IN - MARGIN_OUT, BOTTOM);
  setColumn(PAGE_W + MARGIN_IN, TOP, PAGE_W - MARGIN_IN - MARGIN_OUT, BOTTOM);
  const texture = new THREE9__namespace.CanvasTexture(canvas);
  texture.colorSpace = THREE9__namespace.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.flipY = false;
  return texture;
}
var models2 = {
  /** Match point: a felt ball resting on the baseline, a racket out of focus behind it. */
  tennis(root, ticks) {
    court(root);
    const lineFade = paintTexture(
      64,
      4,
      (u) => {
        const a = 1 - smoothstep2(0.55, 0.98, Math.abs(u - 0.5) * 2);
        return [a * 255, a * 255, a * 255];
      },
      { srgb: false }
    );
    const paint = chunk7OAMHGZK_cjs.themed(
      new THREE9__namespace.MeshStandardMaterial({
        color: 15921642,
        roughness: 0.7,
        alphaMap: lineFade,
        transparent: true,
        depthWrite: false
      }),
      { dark: { color: 11119270 } }
    );
    const line2 = mesh(root, expanded(new THREE9__namespace.PlaneGeometry(GROUND_WIDTH, 0.5)), paint, 0, 2e-3, 0.05);
    defocus(paint, line2);
    line2.rotation.x = -Math.PI / 2;
    line2.renderOrder = -1;
    line2.receiveShadow = true;
    line2.userData.frameIgnore = true;
    racket(root);
    const RADIUS = 0.42;
    const roller = group(root, 0, 0, 0.05);
    const ball = group(roller, 0, RADIUS, 0);
    const feltTone = paintTexture(256, 128, (u, v) => {
      const n = fbm(u * 6, v * 3, 6, 4, 17);
      return mixRgb(12173870, 14213702, clamp01(0.25 + 0.9 * n));
    });
    const felt = chunk7OAMHGZK_cjs.lookMaterial("felt", 16777215, { map: feltTone, grain: 3, sheenRoughness: 0.6, roughness: 1 });
    sphere2(ball, RADIUS, felt, [0, 0, 0], 48);
    const strands = paintTexture(
      512,
      256,
      (u, v, x, y) => {
        const strand = valueNoise2(x * 0.9, y * 1.8, 512 * 0.9, 256 * 1.8, 31) * 0.65 + valueNoise(u * 512, v * 256, 512, 32) * 0.35;
        const a = strand * 255;
        return [a, a, a];
      },
      { srgb: false }
    );
    const SHELLS = 5;
    for (let k = 1; k <= SHELLS; k++) {
      const t = k / SHELLS;
      const nap = chunk7OAMHGZK_cjs.lookMaterial("felt", new THREE9__namespace.Color(13094970).lerp(new THREE9__namespace.Color(15791528), 0.15 + 0.55 * t), {
        alphaMap: strands,
        alphaTest: 0.52 + 0.22 * t,
        sheenRoughness: 0.5
      });
      chunk7OAMHGZK_cjs.themed(nap, {
        dark: {
          color: new THREE9__namespace.Color(13094970).lerp(new THREE9__namespace.Color(15791528), 0.1 + 0.4 * t).multiplyScalar(0.9).getHex()
        }
      });
      decal(sphere2(ball, RADIUS * (1 + 7e-3 * k), nap, [0, 0, 0], 48));
    }
    const seam = Array.from({ length: 129 }, (_, i) => {
      const a = i / 128 * TAU;
      const r = RADIUS * 0.997;
      return vec(
        r * Math.cos(a),
        r * Math.sin(a) * Math.cos(0.55 * Math.cos(a * 2)),
        r * Math.sin(a) * Math.sin(0.55 * Math.cos(a * 2))
      );
    });
    decal(mesh(ball, tube(seam, 0.018, true, 160, 6), chunk7OAMHGZK_cjs.lookMaterial("rubber", 15987174, { roughness: 0.55 })));
    ball.rotation.set(0.5, 0.3, 0);
    const shadow = pool(roller, 0.9, 0.6, 0, 0, 0.7);
    const HOP = 0.56;
    ticks.push((angle) => {
      const arc = Math.abs(Math.sin(angle * 4 - 0.53));
      const squash = smoothstep2(0.12, 0, arc);
      ball.position.y = RADIUS * (1 - 0.14 * squash) + HOP * arc;
      ball.scale.set(1 + 0.1 * squash, 1 - 0.14 * squash, 1 + 0.1 * squash);
      ball.rotation.x = 0.5 + angle * 2;
      const spread = 1 + 0.8 * arc;
      shadow.scale.set(0.9 * spread, 0.6 * spread, 1);
      shadow.material.opacity = 0.7 / (spread * spread);
    });
  },
  /**
   * Hot swap: the front of a rack server in macro. A zinc rack ear with its pull handle and a
   * captive thumbscrew, a row of hot-swap sled bezels, and one sled pulled out on its rails, latch
   * open, showing the bare SSD board it carries. Activity LEDs blink.
   */
  server(root, ticks) {
    steelLid(root);
    const rack = group(root, -0.95, 0, 0.15);
    rack.rotation.y = 0.42;
    const HEIGHT = 0.66;
    const powder = worn(chunk7OAMHGZK_cjs.lookMaterial("plastic", 2369324, { roughness: 0.5 }), 30, 2, 3);
    const zinc = worn(chunk7OAMHGZK_cjs.lookMaterial("metal", 10988722, { roughness: 0.36 }), 90, 1, 5);
    const chrome = worn(chunk7OAMHGZK_cjs.lookMaterial("metal", 14212320, { roughness: 0.16 }), 60, 2, 6);
    const bezelPlastic = worn(chunk7OAMHGZK_cjs.lookMaterial("plastic", 1513499, { roughness: 0.42 }), 0, 2, 7);
    const recess = chunk7OAMHGZK_cjs.lookMaterial("plastic", 460810, { roughness: 0.7 });
    const chassis = group(rack);
    block(chassis, [3.05, HEIGHT, 1], powder, [1.5, HEIGHT / 2, -0.52], 0.02);
    block(chassis, [2.95, HEIGHT - 0.08, 0.02], recess, [1.5, HEIGHT / 2, 0], 5e-3);
    setDressing(chassis);
    pool(root, 3.4, 1.2, 0.35, -0.2, 0.55);
    const ear = new THREE9__namespace.Shape();
    ear.moveTo(-0.44, 0);
    ear.lineTo(0, 0);
    ear.lineTo(0, HEIGHT);
    ear.lineTo(-0.44 + 0.05, HEIGHT);
    ear.quadraticCurveTo(-0.44, HEIGHT, -0.44, HEIGHT - 0.05);
    ear.lineTo(-0.44, 0.05);
    ear.quadraticCurveTo(-0.44, 0, -0.44 + 0.05, 0);
    const slot = new THREE9__namespace.Path();
    slot.absellipse(-0.12, 0.17, 0.045, 0.032, 0, TAU, true);
    ear.holes.push(slot);
    const screwHole = new THREE9__namespace.Path();
    screwHole.absarc(-0.12, HEIGHT - 0.17, 0.042, 0, TAU, true);
    ear.holes.push(screwHole);
    mesh(
      rack,
      new THREE9__namespace.ExtrudeGeometry(ear, {
        depth: 0.035,
        bevelEnabled: true,
        bevelSize: 6e-3,
        bevelThickness: 6e-3,
        bevelSegments: 2,
        curveSegments: 24
      }),
      zinc,
      -0.02,
      0,
      0
    );
    block(rack, [0.035, HEIGHT, 0.42], zinc, [-0.035, HEIGHT / 2, -0.2], 8e-3);
    mesh(
      rack,
      tube(
        [vec(-0.33, 0.1, 0.04), vec(-0.33, 0.12, 0.17), vec(-0.33, 0.3, 0.2), vec(-0.33, 0.5, 0.17), vec(-0.33, 0.56, 0.04)],
        0.024,
        false,
        48,
        12
      ),
      chrome
    );
    for (const y of [0.1, 0.56]) cylinder(rack, 0.04, 0.03, chrome, [-0.33, y, 0.045], 16).rotation.x = Math.PI / 2;
    const knurl = new THREE9__namespace.CylinderGeometry(0.075, 0.075, 0.07, 48, 1);
    const kp = knurl.attributes.position;
    for (let i = 0; i < kp.count; i++) {
      const a = Math.atan2(kp.getZ(i), kp.getX(i));
      if (Math.hypot(kp.getX(i), kp.getZ(i)) > 0.05) {
        const k = 1 + 0.04 * Math.max(0, Math.cos(a * 18)) ** 0.5;
        kp.setX(i, kp.getX(i) * k);
        kp.setZ(i, kp.getZ(i) * k);
      }
    }
    knurl.computeVertexNormals();
    const screw = group(rack, -0.14, HEIGHT - 0.17, 0.035);
    screw.rotation.x = Math.PI / 2;
    cylinder(screw, 0.06, 0.012, chrome, [0, -8e-3, 0], 32);
    mesh(screw, knurl, chrome, 0, -0.05, 0);
    const vent = paintTexture(128, 96, (u, v) => {
      const gx = u * 12, gy = v * 9 * 1.1547;
      const row = Math.floor(gy), shift = row % 2 ? 0.5 : 0;
      const dx = (gx + shift) % 1 - 0.5, dy = gy % 1 - 0.5;
      const hex = Math.max(Math.abs(dx), Math.abs(dx) * 0.5 + Math.abs(dy) * 0.866);
      const hole = smoothstep2(0.36, 0.3, hex);
      const c = 30 - 26 * hole;
      return [c, c, c + 2];
    });
    const ventNormal = paintTexture(
      128,
      96,
      (u, v) => {
        const gx = u * 12, gy = v * 9 * 1.1547;
        const row = Math.floor(gy), shift = row % 2 ? 0.5 : 0;
        const dx = (gx + shift) % 1 - 0.5, dy = gy % 1 - 0.5;
        const hex = Math.max(Math.abs(dx), Math.abs(dx) * 0.5 + Math.abs(dy) * 0.866);
        const rim = smoothstep2(0.3, 0.36, hex) * smoothstep2(0.44, 0.36, hex);
        const len = Math.hypot(dx, dy) || 1;
        const n = vec(dx / len * rim * 0.7, dy / len * rim * 0.7, 1).normalize();
        return [(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255];
      },
      { srgb: false }
    );
    const ventMaterial = chunk7OAMHGZK_cjs.lookMaterial("plastic", 16777215, { map: vent, normalMap: ventNormal, roughness: 0.5 });
    const lever = worn(chunk7OAMHGZK_cjs.lookMaterial("metal", 9343897, { roughness: 0.3 }), 40, 1, 8);
    const touch = chunk7OAMHGZK_cjs.lookMaterial("plastic", 14180906, { roughness: 0.45 });
    const leds = [];
    const SLED = 0.62, PITCH = 0.68, BH = HEIGHT - 0.12;
    const sled = (x, out, index) => {
      const front = group(rack, x, HEIGHT / 2, 0);
      block(front, [SLED, BH, 0.07], bezelPlastic, [0, 0, 0.035], 0.012);
      decal(mesh(front, new THREE9__namespace.PlaneGeometry(SLED - 0.12, BH * 0.5), ventMaterial, -0.02, 0.07, 0.0715));
      const hinge = group(front, -SLED / 2 + 0.05, -BH / 2 + 0.07, 0.085);
      hinge.rotation.y = out ? -0.75 : 0;
      block(hinge, [SLED - 0.12, 0.07, 0.03], lever, [(SLED - 0.12) / 2, 0, 0], 0.012);
      block(hinge, [0.08, 0.072, 0.036], touch, [SLED - 0.17, 0, 4e-3], 0.012);
      cylinder(hinge, 0.018, 0.08, chrome, [0, 0, 0], 12);
      for (const [k, color] of [
        [0, 4652940],
        [1, index === 1 ? 16753978 : 4892927]
      ]) {
        const led = new THREE9__namespace.MeshStandardMaterial({ color: 1053712, emissive: color, emissiveIntensity: 1.6, roughness: 0.2 });
        leds.push(led);
        decal(block(front, [0.03, 0.03, 0.02], led, [SLED / 2 - 0.05, BH / 2 - 0.06 - k * 0.06, 0.075], 6e-3));
      }
      return front;
    };
    const fronts = [];
    for (let i = 0; i < 4; i++) fronts.push(sled(0.38 + i * PITCH, i === 1, i));
    for (const front of fronts.slice(3)) setDressing(front);
    const pulled = fronts[1];
    const tray = group(pulled, 0, -BH / 2 + 0.02, -0.02);
    for (const side of [-1, 1]) block(tray, [0.03, 0.07, 1.25], zinc, [side * (SLED / 2 - 0.03), 0.03, -0.6], 8e-3);
    block(tray, [SLED - 0.08, 0.012, 1.2], ssdBoardMaterial(), [0, 0.03, -0.62], 4e-3);
    const chip2 = worn(chunk7OAMHGZK_cjs.lookMaterial("plastic", 1316120, { roughness: 0.38 }), 0, 3, 9);
    const chips = [];
    for (const [cx, cz, w, d] of [
      [-0.12, -0.25, 0.2, 0.22],
      [0.12, -0.25, 0.2, 0.22],
      [-0.12, -0.6, 0.2, 0.22],
      [0.12, -0.6, 0.2, 0.22],
      [0, -0.95, 0.24, 0.2]
    ])
      chips.push(mergeable(placed(roundedBox(w, 0.025, d, 6e-3, 1), cx, 0.05, cz), true));
    mesh(tray, BufferGeometryUtils_js.mergeGeometries(chips), chip2);
    pulled.position.z = 0.85;
    pool(root, 0.9, 1.2, -0.1, 0.75, 0.4);
    ticks.push((angle) => {
      leds.forEach(
        (led, i) => led.emissiveIntensity = i % 2 ? 1.4 : 0.3 + 2.2 * Math.max(0, Math.sin(angle * 9 + i * 1.3)) ** 6
      );
      pulled.position.z = 0.85 + 0.05 * Math.sin(angle);
    });
  },
  /** Quiet chapter: tortoiseshell glasses folded on an open book, a page lifting in the draught. */
  reading(root, ticks) {
    walnut(root);
    const W = 1.25, H = 1.7, THICK = 0.18;
    const pageCurve = (t) => THICK + 0.11 * Math.max(0, Math.sin(Math.min(1, Math.max(0, t) * 1.6) * (Math.PI / 2))) ** 0.7 - 0.04 * t;
    const textMap = bookSpread() ?? paintTexture(512, 352, (spreadU, v) => {
      const u = spreadU * 2 % 1;
      const paper = mixRgb(15985884, 15459021, valueNoise(u * 30, v * 30, 30, 4));
      const margin = u < 0.14 || u > 0.88 || v < 0.1 || v > 0.9;
      if (margin) return paper;
      const line2 = Math.floor((v - 0.1) * 46);
      const inLine = (v - 0.1) * 46 % 1;
      const word = valueNoise(u * 34, line2 * 3.1, 34, line2 + 3);
      const ink = smoothstep2(0.32, 0.2, Math.abs(inLine - 0.45)) * smoothstep2(0.3, 0.36, word) * (line2 % 17 === 16 ? 0 : 1);
      return paper.map((c, i) => mix(c, [70, 64, 58][i], ink * 0.7));
    });
    const pageMaterial = chunk7OAMHGZK_cjs.lookMaterial("paper", 16777215, { map: textMap, roughness: 0.92, grain: 3 });
    pageMaterial.normalScale.set(0.25, 0.25);
    const edgeMaterial = chunk7OAMHGZK_cjs.lookMaterial("paper", 15129796, { roughness: 0.95, grain: 2 });
    const pageBlock = (sign) => {
      const shape2 = new THREE9__namespace.Shape();
      shape2.moveTo(0, 0);
      shape2.lineTo(sign * W, 0);
      for (let i = 24; i >= 0; i--) shape2.lineTo(sign * W * (i / 24), pageCurve(i / 24));
      shape2.closePath();
      const geometry = new THREE9__namespace.ExtrudeGeometry(shape2, { depth: H, bevelEnabled: false, curveSegments: 4 });
      geometry.translate(0, 0, -H / 2);
      const uv2 = geometry.attributes.uv, position = geometry.attributes.position;
      for (let i = 0; i < uv2.count; i++) {
        const across = Math.abs(position.getX(i)) / W;
        uv2.setXY(i, sign < 0 ? 0.5 * (1 - across) : 0.5 + 0.5 * across, 0.5 + position.getZ(i) / H);
      }
      return geometry;
    };
    const book = group(root, 0.05, 0.03, 0.05);
    book.rotation.y = 0.12;
    for (const sign of [-1, 1]) mesh(book, pageBlock(sign), [edgeMaterial, pageMaterial]);
    const cloth = chunk7OAMHGZK_cjs.lookMaterial("felt", 2968126, { grain: 6, roughness: 0.95 });
    for (const sign of [-1, 1]) {
      const board = block(book, [W + 0.06, 0.03, H + 0.08], cloth, [sign * (W / 2 + 0.02), -0.015, 0], 0.012);
      board.rotation.z = sign * 0.015;
    }
    const ribbon2 = ribbonGeometry(
      [
        vec(0.02, THICK + 0.02, -0.4),
        vec(0.12, THICK + 0.03, 0.3),
        vec(0.18, 0.12, H / 2 + 0.03),
        vec(0.22, 4e-3, H / 2 + 0.25)
      ],
      0.05,
      40
    );
    mesh(book, ribbon2, chunk7OAMHGZK_cjs.lookMaterial("plastic", 10169125, { side: THREE9__namespace.DoubleSide, roughness: 0.42 }));
    const leaf = new THREE9__namespace.PlaneGeometry(W * 0.98, H * 0.97, 16, 1);
    leaf.rotateX(-Math.PI / 2);
    leaf.translate(W * 0.98 / 2, 0, 0);
    const lp = leaf.attributes.position;
    for (let i = 0; i < lp.count; i++) lp.setY(i, pageCurve(lp.getX(i) / W) - THICK + 4e-3 + 0.06 * (lp.getX(i) / W) ** 2);
    leaf.computeVertexNormals();
    const leafUv = leaf.attributes.uv;
    for (let i = 0; i < leafUv.count; i++) leafUv.setXY(i, 0.5 + 0.5 * leafUv.getX(i), 1 - leafUv.getY(i));
    const sheetPivot = group(book, 0, THICK, 0);
    mesh(sheetPivot, leaf, chunk7OAMHGZK_cjs.lookMaterial("paper", 16777215, { map: textMap, roughness: 0.92, grain: 3, side: THREE9__namespace.DoubleSide }));
    setDressing(book);
    ticks.push((angle) => sheetPivot.rotation.z = 0.02 + 0.07 * (0.5 + 0.5 * Math.sin(angle)));
    const tortoise = paintTexture(
      128,
      128,
      (u, v) => {
        const n = fbm(u * 5, v * 5, 5, 4, 41);
        const spot = smoothstep2(0.45, 0.62, n);
        return mixRgb(1838342, 9064222, spot * 0.85 + 0.1 * valueNoise(u * 40, v * 40, 40, 2));
      },
      { repeat: [2, 2] }
    );
    const acetate = worn(
      chunk7OAMHGZK_cjs.lookMaterial("ceramic", 16777215, { map: tortoise, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }),
      30,
      2,
      27
    );
    const glasses = group(root, 0.5, 0.64, 0.3);
    glasses.rotation.set(-0.06, -0.22, 0);
    const RX = 0.25, RY = 0.2, BAND = 0.032, DEPTH = 0.03;
    const lensPoint = (cx, t, grow) => {
      const c = Math.cos(t), s = Math.sin(t);
      const k = 0.86;
      const x = Math.sign(c) * Math.abs(c) ** k, y = Math.sign(s) * Math.abs(s) ** k;
      return new THREE9__namespace.Vector2(cx + x * (RX + grow), y * (RY + grow) - 0.012 * (1 - s));
    };
    const outline = (cx, grow, reverse) => {
      const points = Array.from({ length: 129 }, (_, i) => lensPoint(cx, (reverse ? 128 - i : i) / 128 * TAU, grow));
      return points;
    };
    const rim = (cx) => {
      const shape2 = new THREE9__namespace.Shape(outline(cx, BAND, false));
      shape2.holes.push(new THREE9__namespace.Path(outline(cx, 0, true)));
      return shape2;
    };
    const front = new THREE9__namespace.ExtrudeGeometry([rim(-0.3), rim(0.3)], {
      depth: DEPTH,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 5,
      curveSegments: 128
    });
    front.translate(0, 0, -DEPTH / 2);
    const uv = front.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.8, uv.getY(i) * 0.8);
    const smoothFront = BufferGeometryUtils_js.mergeVertices(front.deleteAttribute("normal"), 1e-4);
    smoothFront.computeVertexNormals();
    mesh(glasses, smoothFront, acetate);
    mesh(glasses, tube([vec(-0.07, 0.07, 0), vec(0, 0.1, 0), vec(0.07, 0.07, 0)], 0.026, false, 16, 12), acetate);
    const pin = worn(chunk7OAMHGZK_cjs.lookMaterial("metal", 13157044, { roughness: 0.3 }), 60, 1, 26);
    for (const side of [-1, 1]) {
      const edge = side * (0.3 + RX + BAND);
      mesh(glasses, roundedBox(0.05, 0.075, 0.07, 0.02), acetate, edge - side * 0.012, 0.09, -0.04);
      cylinder(glasses, 9e-3, 0.085, pin, [edge - side * 4e-3, 0.09, -0.075], 10);
      const temple = mesh(
        glasses,
        tube(
          [
            vec(edge - side * 6e-3, 0.09, -0.07),
            vec(edge + side * 4e-3, 0.088, -0.16),
            vec(edge + side * 0.01, 0.07, -0.55),
            vec(edge + side * 6e-3, 0.04, -0.85),
            vec(edge - side * 4e-3, -0.06, -0.97),
            vec(edge - side * 0.01, -0.26, -1)
          ],
          0.013,
          false,
          64,
          10
        ),
        acetate
      );
      temple.castShadow = true;
      const lensShape = new THREE9__namespace.Shape(outline(side * 0.3, 4e-3, false));
      const lens = mesh(glasses, new THREE9__namespace.ShapeGeometry(lensShape, 64), clearGlass(), 0, 0, 4e-3);
      decal(lens);
    }
    pool(root, 1.3, 0.5, 0.55, 0.05, 0.4, 0.32);
  }
};
var subjectCamera = {
  tennis: { pitch: 22, fill: 0.5 },
  server: { pitch: 20, fill: 0.8 },
  reading: { pitch: 20, fill: 0.5, maxWidth: 0.7 }
};
var lampAt2 = {
  tennis: [0.9, 1.4, 0.9],
  server: [0.9, 1.6, 0.9],
  reading: [1.7, 1.1, 0.6]
};
function realistic(kind, ticks) {
  const root = new THREE9__namespace.Group();
  models2[kind](root, ticks);
  backdrop(root, kind === "tennis" ? "court" : kind === "server" ? "rack" : "room");
  const lamp = new THREE9__namespace.PointLight(16757614, 0, 0, 2);
  lamp.position.set(...lampAt2[kind]);
  root.add(lamp);
  const dark = themeProbe(root);
  ticks.push(() => lamp.intensity = dark() ? 9 : 0);
  const { pitch, yaw = 0, fill, maxWidth } = subjectCamera[kind];
  root.userData.look = {
    ...realisticLook,
    camera: { ...realisticLook.camera, pitch, yaw },
    framing: { ...realisticLook.framing || {}, ...fill ? { fill } : {}, ...maxWidth ? { maxWidth } : {} }
  };
  return root;
}

// src/objects/expanded-directions.ts
var REST_MS2 = 1800;
var LOOKS = [cartoonLook, realisticLook, abstractLook];
var STYLES = ["cartoon", "realistic", "abstract"];
function build(kind, variant, ticks) {
  if (variant === 3 && chunkHPYRAZ5N_cjs.hasObjectLook(kind, 3)) return cartoon(kind, ticks);
  if (variant === 4 && chunkHPYRAZ5N_cjs.hasObjectLook(kind, 4)) return realistic(kind, ticks);
  if (variant === 5 && chunkHPYRAZ5N_cjs.hasObjectLook(kind, 5)) return abstract(kind, ticks);
  throw new Error(`${kind} has no ${STYLES[variant - 3]} look`);
}
function createExpandedDirection(kind, variant) {
  var _a;
  const ticks = [];
  const object = build(kind, variant, ticks);
  const style = STYLES[variant - 3];
  object.userData.style = style;
  (_a = object.userData).look ?? (_a.look = LOOKS[variant - 3]);
  playLoop(object, ticks, REST_MS2, `${style}-study`);
  return object;
}
var sculptureTokens = {
  brass: 14267242,
  agedBrass: 11108671,
  bone: 15591388,
  celadon: 10470064,
  inkGlaze: 2902618,
  oxblood: 12076858,
  optic: 14212183,
  slate: 2830904,
  stone: 14208959
};
var K = sculptureTokens;
var PLINTH_TOP = -1.36;
var NOISE_GLSL = (
  /* glsl */
  `
varying vec3 vFinish;
float fHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float fNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fHash(i), fHash(i + vec3(1, 0, 0)), f.x), mix(fHash(i + vec3(0, 1, 0)), fHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(fHash(i + vec3(0, 0, 1)), fHash(i + vec3(1, 0, 1)), f.x), mix(fHash(i + vec3(0, 1, 1)), fHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
vec3 fGrad(vec3 p) {
  return vec3(fNoise(p + vec3(0.5, 0, 0)) - fNoise(p - vec3(0.5, 0, 0)), fNoise(p + vec3(0, 0.5, 0)) - fNoise(p - vec3(0, 0.5, 0)),
    fNoise(p + vec3(0, 0, 0.5)) - fNoise(p - vec3(0, 0, 0.5)));
}
`
);
function surfaceFinish(material, key, parts) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vFinish;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvFinish = position;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
${NOISE_GLSL}`).replace("#include <color_fragment>", `#include <color_fragment>
vec3 p = vFinish;
${parts.color ?? ""}`).replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
${parts.rough ?? ""}`).replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
${parts.normal ?? ""}`).replace("#include <clearcoat_normal_fragment_maps>", `#include <clearcoat_normal_fragment_maps>
${parts.coat ?? ""}`);
  };
  material.customProgramCacheKey = () => `finish-${key}`;
  return material;
}
function glazeFinish(material) {
  material.setValues({ roughness: 0.46, clearcoat: 1, clearcoatRoughness: 0.035, ior: 1.52 });
  return surfaceFinish(material, "glaze", {
    color: `float mottle = fNoise(p * 4.0) * 0.6 + fNoise(p * 11.0) * 0.4;
      diffuseColor.rgb *= 0.88 + 0.22 * mottle;
      float fleck = smoothstep(0.8, 0.86, fNoise(p * 34.0 + 7.0)) * smoothstep(0.35, 0.6, fNoise(p * 3.0 + 2.0));
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.3 + vec3(0.05, 0.03, 0.02), fleck * 0.85);`,
    rough: "roughnessFactor = clamp(roughnessFactor + 0.2 * (mottle - 0.5), 0.05, 1.0);",
    normal: "vec3 peel = fGrad(p * 16.0); normal = normalize(normal + 0.22 * peel);",
    coat: "clearcoatNormal = normalize(clearcoatNormal + 0.12 * peel);"
  });
}
function brassFinish(material) {
  return surfaceFinish(material, "brass", {
    rough: "float rings = fNoise(vec3(p.y * 150.0, p.x * 4.0, p.z * 4.0)); roughnessFactor = clamp(roughnessFactor * (0.85 + 0.3 * rings), 0.04, 1.0);",
    normal: "normal = normalize(normal + 0.012 * fGrad(p * 60.0));"
  });
}
function slateFinish(material) {
  return surfaceFinish(material, "slate", {
    color: `float bed = fNoise(vec3(p.x * 2.0, p.y * 38.0, p.z * 2.0)) * 0.7 + fNoise(p * 9.0) * 0.3;
      diffuseColor.rgb *= 0.82 + 0.32 * bed;`,
    rough: "roughnessFactor = clamp(roughnessFactor + 0.18 * (bed - 0.5), 0.2, 1.0);",
    normal: "normal = normalize(normal + 0.08 * fGrad(p * 22.0));"
  });
}
function sculptureMaterials(night2 = false) {
  const ceramic = (color) => glazeFinish(chunk7OAMHGZK_cjs.lookMaterial("ceramic", color));
  return {
    brass: brassFinish(chunk7OAMHGZK_cjs.lookMaterial("metal", K.brass, { roughness: 0.17 })),
    agedBrass: brassFinish(chunk7OAMHGZK_cjs.lookMaterial("metal", K.agedBrass, { roughness: 0.3 })),
    steel: chunk7OAMHGZK_cjs.lookMaterial("metal", 13948626, { roughness: 0.3 }),
    bone: ceramic(K.bone),
    celadon: ceramic(K.celadon),
    inkGlaze: ceramic(K.inkGlaze),
    oxblood: ceramic(K.oxblood),
    optic: ceramic(K.optic),
    /** One glaze for every turned ceramic body: colour per vertex (see `glazed`), so pooling and breaks cost no extra program. */
    glaze: glazeFinish(chunk7OAMHGZK_cjs.lookMaterial("ceramic", 16777215, { vertexColors: true })),
    slate: chunk7OAMHGZK_cjs.themed(slateFinish(chunk7OAMHGZK_cjs.lookMaterial("plastic", K.slate, { roughness: 0.5, envMapIntensity: 0.8 })), {
      dark: { color: night2 ? chunk7OAMHGZK_cjs.shade(K.slate, -0.05) : chunk7OAMHGZK_cjs.shade(K.slate, 0.13) }
    }),
    stone: chunk7OAMHGZK_cjs.themed(slateFinish(chunk7OAMHGZK_cjs.lookMaterial("plastic", K.stone, { roughness: 0.58, envMapIntensity: 0.6 })), {
      dark: { color: chunk7OAMHGZK_cjs.shade(K.stone, night2 ? -0.38 : -0.22) }
    })
  };
}
function themeSwitch(root, ticks, apply) {
  const probe = new THREE9__namespace.Mesh(
    new THREE9__namespace.BufferGeometry().setAttribute("position", new THREE9__namespace.Float32BufferAttribute(new Float32Array(9), 3)),
    chunk7OAMHGZK_cjs.themed(new THREE9__namespace.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), {
      light: { opacity: 1 },
      dark: { opacity: 0.5 }
    })
  );
  probe.visible = false;
  probe.userData.frameIgnore = true;
  root.add(probe);
  ticks.push(() => apply(probe.material.opacity < 0.75));
}
var WHITE = new THREE9__namespace.Color(16777215);
function glazed(geometry, color, foot2 = 0) {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const span = Math.max(1e-6, max.y - min.y);
  const base2 = new THREE9__namespace.Color(color), pool2 = base2.clone().multiplyScalar(0.72), bisque = new THREE9__namespace.Color(K.stone).multiplyScalar(0.92);
  const position = geometry.attributes.position;
  const colors2 = new Float32Array(position.count * 3);
  const c = new THREE9__namespace.Color();
  for (let i = 0; i < position.count; i++) {
    const t = (position.getY(i) - min.y) / span;
    if (t < foot2) c.copy(bisque);
    else if (t < 0.4) c.copy(base2).lerp(pool2, ((0.4 - t) / 0.4) ** 1.4);
    else c.copy(base2).lerp(WHITE, Math.max(0, (t - 0.72) / 0.28) * 0.16);
    colors2.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute("color", new THREE9__namespace.BufferAttribute(colors2, 3));
  return geometry;
}
function beadProfile() {
  const points = [new THREE9__namespace.Vector2(0, -0.98), new THREE9__namespace.Vector2(0.3, -0.98), new THREE9__namespace.Vector2(0.33, -0.9)];
  for (let i = 0; i <= 14; i++) {
    const a = -1.2 + i / 14 * 2.45;
    points.push(new THREE9__namespace.Vector2(Math.cos(a) * (1 - 0.06 * Math.max(0, a)), Math.sin(a) * 0.92));
  }
  points.push(new THREE9__namespace.Vector2(0.24, 0.96), new THREE9__namespace.Vector2(0.2, 1.04), new THREE9__namespace.Vector2(0, 1.05));
  return points;
}
var BEAD = beadProfile();
function bob(b, m, at2, r, color) {
  b.add(m.glaze, glazed(new THREE9__namespace.LatheGeometry(BEAD, 40).scale(r, r, r).translate(at2.x, at2.y, at2.z), color, 0.04));
  b.add(m.brass, new THREE9__namespace.CylinderGeometry(r * 0.24, r * 0.3, r * 0.16, 18).translate(at2.x, at2.y + r * 1.07, at2.z));
}
function foot(b, m, x, color = K.celadon, z = 0) {
  const profile = [
    [0, 0],
    [0.17, 0],
    [0.18, 0.025],
    [0.13, 0.06],
    [0.15, 0.085],
    [0.1, 0.12],
    [0.12, 0.145],
    [0.075, 0.18],
    [0.07, 0.22],
    [0, 0.22]
  ].map(([r, y]) => new THREE9__namespace.Vector2(r, y));
  b.add(m.glaze, glazed(new THREE9__namespace.LatheGeometry(profile, 40).translate(x, PLINTH_TOP, z), color));
}
var UP = new THREE9__namespace.Vector3(0, 1, 0);
function rodGeometry2(from, to, radius) {
  const delta = to.clone().sub(from);
  const g = new THREE9__namespace.CylinderGeometry(radius, radius, delta.length(), 14, 1);
  g.applyQuaternion(new THREE9__namespace.Quaternion().setFromUnitVectors(UP, delta.clone().normalize()));
  g.translate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
  return g;
}
function ballGeometry(at2, radius, segments = 20) {
  return new THREE9__namespace.SphereGeometry(radius, segments, Math.round(segments * 0.7)).translate(at2.x, at2.y, at2.z);
}
var Batch = class {
  constructor(parent) {
    this.parent = parent;
    this.sets = /* @__PURE__ */ new Map();
  }
  add(material, ...geometries) {
    const list = this.sets.get(material) ?? [];
    list.push(...geometries);
    this.sets.set(material, list);
    return this;
  }
  /** A rod with a ball joint (twice its radius) at each end. */
  strut(material, from, to, radius, joints = [true, true]) {
    this.add(material, rodGeometry2(from, to, radius));
    if (joints[0]) this.add(material, ballGeometry(from, radius * 2, 14));
    if (joints[1]) this.add(material, ballGeometry(to, radius * 2, 14));
    return this;
  }
  done() {
    for (const [material, list] of this.sets) {
      const merged = BufferGeometryUtils_js.mergeGeometries(list);
      list.forEach((g) => g.dispose());
      this.parent.add(new THREE9__namespace.Mesh(merged, material));
    }
    this.sets.clear();
  }
};
function base(root, m, form) {
  if (form === "turned") return plinth(root, m);
  const batch = new Batch(root);
  const top = PLINTH_TOP;
  if (form === "drum") {
    const profile = [
      [0, -1.6],
      [1.18, -1.6],
      [1.22, -1.575],
      [1.22, -1.43],
      [1.17, -1.4],
      [1.12, -1.385],
      [1.12, top],
      [0, top]
    ].map(([r, y2]) => new THREE9__namespace.Vector2(r, y2));
    batch.add(m.slate, new THREE9__namespace.LatheGeometry(profile, 80));
    batch.add(m.brass, new THREE9__namespace.TorusGeometry(1.215, 0.024, 10, 80).rotateX(Math.PI / 2).translate(0, -1.5, 0));
    batch.add(m.stone, new THREE9__namespace.CylinderGeometry(1.06, 1.06, 0.014, 80).translate(0, top + 7e-3, 0));
    batch.done();
    root.add(chunk7OAMHGZK_cjs.contactShadow(3.1, 3.1, { y: -1.6, opacity: 0.42, color: 1709068 }));
    return;
  }
  const [w, h, d, y] = [2.95, 0.28, 1, top - 0.14];
  batch.add(m.slate, new RoundedBoxGeometry_js.RoundedBoxGeometry(w, h, d, 3, 0.035).translate(0, y, 0));
  for (const z of [-d / 2 - 4e-3, d / 2 + 4e-3])
    batch.add(m.brass, new THREE9__namespace.CylinderGeometry(0.018, 0.018, w - 0.1, 10).rotateZ(Math.PI / 2).translate(0, y - h * 0.12, z));
  batch.add(m.stone, new RoundedBoxGeometry_js.RoundedBoxGeometry(w - 0.14, 0.02, d - 0.14, 2, 8e-3).translate(0, top + 2e-3, 0));
  batch.done();
  root.add(chunk7OAMHGZK_cjs.contactShadow(w + 0.7, d + 0.7, { y: y - h / 2, opacity: 0.42, color: 1709068 }));
}
function plinth(root, m, radius = 1) {
  const profile = [
    [0, -1.68],
    [1.02, -1.68],
    [1.065, -1.655],
    [1.075, -1.6],
    [1.05, -1.565],
    [0.95, -1.545],
    [0.905, -1.51],
    [0.89, -1.45],
    [0.91, -1.415],
    [0.955, -1.395],
    [0.965, -1.375],
    [0.95, -1.36],
    [0, -1.36]
  ].map(([r, y]) => new THREE9__namespace.Vector2(r * radius, y));
  const batch = new Batch(root);
  batch.add(m.slate, new THREE9__namespace.LatheGeometry(profile, 72));
  batch.add(m.brass, new THREE9__namespace.TorusGeometry(0.902 * radius, 0.022, 10, 72).rotateX(Math.PI / 2).translate(0, -1.478, 0));
  batch.add(m.stone, new THREE9__namespace.CylinderGeometry(0.86 * radius, 0.86 * radius, 0.014, 72).translate(0, PLINTH_TOP + 7e-3, 0));
  batch.done();
  root.add(chunk7OAMHGZK_cjs.contactShadow(2.7 * radius, 2.7 * radius, { y: -1.68, opacity: 0.42, color: 1709068 }));
}
function globeTexture() {
  const w = 256, h = 128;
  let seed = 20942;
  const random = () => (seed = seed * 1664525 + 1013904223 >>> 0, seed / 4294967296);
  const blobs = Array.from({ length: 26 }, () => ({ x: random() * w, y: 20 + random() * (h - 40), r: 6 + random() * 12 }));
  const data = new Uint8Array(w * h * 4);
  const ocean = new THREE9__namespace.Color(K.celadon), land = new THREE9__namespace.Color(K.bone);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (const b of blobs) {
        const dx = Math.min(Math.abs(x - b.x), w - Math.abs(x - b.x)), dy = y - b.y;
        v += Math.exp(-(dx * dx + dy * dy) / (b.r * b.r));
      }
      v += 0.25 * Math.sin(x * 0.22 + y * 0.15) * Math.sin(y * 0.35);
      const c = ocean.clone().lerp(land, Math.min(1, Math.max(0, (v - 0.66) / 0.08)));
      data.set([c.r * 255, c.g * 255, c.b * 255, 255].map(Math.round), (y * w + x) * 4);
    }
  const texture = new THREE9__namespace.DataTexture(data, w, h, THREE9__namespace.RGBAFormat);
  texture.wrapS = THREE9__namespace.RepeatWrapping;
  texture.magFilter = THREE9__namespace.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
function chip(b, m, at2, r) {
  const T = 0.09;
  b.add(m.inkGlaze, new RoundedBoxGeometry_js.RoundedBoxGeometry(2 * r, 2 * r, T, 3, 0.03).translate(at2.x, at2.y, at2.z));
  for (let i = 0; i < 5; i++) {
    const u = -r * 0.66 + i * r * 1.32 / 4;
    for (const side of [-1, 1]) {
      b.add(m.brass, new THREE9__namespace.BoxGeometry(0.1, 0.035, 0.03).translate(at2.x + side * (r + 0.04), at2.y + u, at2.z));
      if (!(side > 0 && i === 2))
        b.add(m.brass, new THREE9__namespace.BoxGeometry(0.035, 0.1, 0.03).translate(at2.x + u, at2.y + side * (r + 0.04), at2.z));
    }
  }
  b.add(m.brass, new THREE9__namespace.BoxGeometry(0.2, 0.15, T + 0.05).translate(at2.x, at2.y + r + 0.03, at2.z));
  b.add(m.brass, ballGeometry(vec(at2.x, at2.y + r + 0.12, at2.z), 0.05, 16));
  const z = at2.z + T / 2;
  b.add(m.bone, new RoundedBoxGeometry_js.RoundedBoxGeometry(1.15 * r, 1.15 * r, 0.03, 2, 0.012).translate(at2.x, at2.y, z));
  const nodes = [vec(-0.26, -0.2, 0), vec(0.26, -0.2, 0), vec(0, 0.26, 0)].map(
    (p) => p.multiplyScalar(r * 1).add(vec(at2.x, at2.y, z + 0.022))
  );
  nodes.forEach((p, i) => b.add(m.brass, rodGeometry2(p, nodes[(i + 1) % 3], 0.018), ballGeometry(p, 0.048, 14)));
  b.add(m.oxblood, ballGeometry(vec(at2.x, at2.y - r * 0.04, z + 0.022), 0.035, 14));
}
var sculptures = {
  /** A neural orrery: a glazed silicon chip and two ceramic nodes on counterweighted arms turning at different rates. */
  ai(root, m, ticks) {
    const TOP = 1.08;
    const stand = new Batch(root).strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, TOP, 0), 0.06, [false, false]).add(m.brass, ballGeometry(vec(0, TOP + 0.07, 0), 0.1));
    foot(stand, m, 0, K.inkGlaze);
    stand.done();
    const arms = [
      // Heights keep every hanging body clear of the arm below it (and the chip clear of the stone top).
      { y: -0.38, reach: 1.08, back: 0.52, r: 0.28, body: K.inkGlaze, weight: K.celadon, turns: 1, phase: -1.29, drop: 0.1 },
      { y: 0.3, reach: 0.9, back: 0.42, r: 0.24, body: K.bone, weight: K.inkGlaze, turns: -1, phase: 4.38, drop: 0.1 },
      { y: 0.87, reach: 0.64, back: 0.34, r: 0.18, body: K.oxblood, weight: K.celadon, turns: 2, phase: -2.78, drop: 0.1 }
    ];
    for (const arm of arms) {
      const group2 = new THREE9__namespace.Group();
      group2.position.y = arm.y;
      root.add(group2);
      const b = new Batch(group2);
      b.strut(m.brass, vec(-arm.back, 0, 0), vec(arm.reach, 0, 0), 0.046, [false, true]);
      b.add(m.brass, new THREE9__namespace.CylinderGeometry(0.09, 0.09, 0.13, 24));
      b.strut(m.brass, vec(arm.reach, 0, 0), vec(arm.reach, -arm.drop, 0), 0.036, [false, false]);
      bob(b, m, vec(-arm.back, -arm.r * 0.58, 0), arm.r * 0.5, arm.weight);
      if (arm.turns === 1) chip(b, m, vec(arm.reach, -arm.drop - arm.r - 0.12, 0), arm.r);
      else bob(b, m, vec(arm.reach, -arm.drop - arm.r * 1.1, 0), arm.r, arm.body);
      b.done();
      ticks.push((angle) => {
        group2.rotation.y = arm.phase + arm.turns * angle;
      });
    }
  },
  /** A market balance: ceramic candle weights on two pans, the beam tipping as the market moves. */
  trading(root, m, ticks) {
    const BEAM_Y = 0.9;
    const s = new Batch(root).strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, BEAM_Y, 0), 0.054, [false, false]);
    foot(s, m, 0, K.inkGlaze);
    const DIAL = 0.46, DZ = -0.12;
    const dome = Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      return new THREE9__namespace.Vector2(DIAL * Math.sin(t * Math.PI / 2), 0.07 * Math.cos(t * Math.PI / 2));
    });
    dome.push(new THREE9__namespace.Vector2(DIAL, 0));
    const face = new THREE9__namespace.LatheGeometry(dome.reverse(), 64).rotateX(Math.PI / 2).translate(0, BEAM_Y, DZ);
    face.computeBoundingBox();
    const fp = face.attributes.position, fc = new Float32Array(fp.count * 3), bone = new THREE9__namespace.Color(K.bone), rim = bone.clone().multiplyScalar(0.82), tmp = new THREE9__namespace.Color();
    for (let i = 0; i < fp.count; i++) {
      const r2 = Math.hypot(fp.getX(i), fp.getY(i) - BEAM_Y) / DIAL;
      tmp.copy(bone).lerp(WHITE, 0.25 * (1 - r2)).lerp(rim, r2 ** 3);
      fc.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    face.setAttribute("color", new THREE9__namespace.BufferAttribute(fc, 3));
    s.add(m.glaze, face);
    s.add(m.brass, new THREE9__namespace.TorusGeometry(DIAL, 0.032, 12, 72).translate(0, BEAM_Y, DZ + 0.01));
    const arc = (from, to, color) => s.add(
      m.glaze,
      glazed(
        new THREE9__namespace.RingGeometry(DIAL * 0.46, DIAL * 0.72, 32, 1, Math.PI / 2 - to, to - from).translate(0, BEAM_Y, DZ + 0.066),
        color
      )
    );
    arc(-1.15, -0.06, K.oxblood);
    arc(0.06, 1.15, K.celadon);
    for (let i = -4; i <= 4; i++) {
      const a = i / 4 * 1.15, outer = DIAL * (i % 2 ? 0.86 : 0.9);
      s.add(
        m.inkGlaze,
        rodGeometry2(
          vec(Math.sin(a) * DIAL * 0.77, BEAM_Y + Math.cos(a) * DIAL * 0.77, DZ + 0.05),
          vec(Math.sin(a) * outer, BEAM_Y + Math.cos(a) * outer, DZ + 0.05),
          i === 0 ? 0.022 : 0.016
        )
      );
    }
    s.done();
    const beam2 = new THREE9__namespace.Group();
    beam2.position.y = BEAM_Y;
    root.add(beam2);
    new Batch(beam2).strut(m.brass, vec(-1.12, 0, 0), vec(1.12, 0, 0), 0.05).add(m.brass, ballGeometry(vec(0, 0, 0), 0.1)).strut(m.brass, vec(0, 0, 0.03), vec(0, DIAL * 0.84, 0.03), 0.024, [false, true]).done();
    const HEIGHTS = [
      [0.26, 0.5, 0.36],
      [0.36, 0.5, 0.26]
    ];
    const pans = [];
    for (const [side, glaze] of [
      [-1, K.celadon],
      [1, K.oxblood]
    ]) {
      const pan = new THREE9__namespace.Group();
      pan.position.x = side * 1.12;
      beam2.add(pan);
      pans.push(pan);
      const b = new Batch(pan);
      for (const a of [0, TAU / 3, 2 * TAU / 3])
        b.add(m.brass, rodGeometry2(vec(0, 0, 0), vec(Math.cos(a + 0.5) * 0.4, -0.92, Math.sin(a + 0.5) * 0.4), 0.026));
      b.add(m.brass, ballGeometry(vec(0, 0, 0), 0.065));
      const dish = [
        [0, -1.02],
        [0.38, -1.015],
        [0.48, -0.96],
        [0.51, -0.91],
        [0.475, -0.92],
        [0.37, -0.975],
        [0, -0.98]
      ].map(([r2, y]) => new THREE9__namespace.Vector2(r2, y));
      b.add(m.glaze, glazed(new THREE9__namespace.LatheGeometry(dish, 48), K.bone, 0.12));
      HEIGHTS[side < 0 ? 0 : 1].forEach((h, i) => {
        const x = (i - 1) * 0.25, z = i % 2 * 0.09 - 0.045;
        b.add(m.glaze, glazed(new THREE9__namespace.CylinderGeometry(0.095, 0.1, h, 28).translate(x, -0.98 + h / 2, z), glaze));
        b.add(m.brass, rodGeometry2(vec(x, -0.98 + h, z), vec(x, -0.98 + h + 0.12, z), 0.024));
      });
      b.done();
    }
    const RAIL = 0.28;
    new Batch(beam2).strut(m.brass, vec(-0.95, 0, RAIL), vec(0.95, 0, RAIL), 0.03).strut(m.brass, vec(-0.95, 0, 0), vec(-0.95, 0, RAIL), 0.03, [false, false]).strut(m.brass, vec(0.95, 0, 0), vec(0.95, 0, RAIL), 0.03, [false, false]).done();
    const rider = new THREE9__namespace.Group();
    rider.position.z = RAIL;
    beam2.add(rider);
    const r = new Batch(rider);
    r.add(m.glaze, glazed(new THREE9__namespace.LatheGeometry(BEAD, 36).scale(0.15, 0.15, 0.15).rotateZ(Math.PI / 2), K.oxblood, 0.04));
    r.add(m.brass, new THREE9__namespace.TorusGeometry(0.06, 0.018, 8, 20).rotateY(Math.PI / 2).translate(-0.16, 0, 0));
    r.add(m.brass, new THREE9__namespace.TorusGeometry(0.06, 0.018, 8, 20).rotateY(Math.PI / 2).translate(0.16, 0, 0));
    r.done();
    const RIDE = 0.7;
    ticks.push((angle) => {
      rider.position.x = RIDE * Math.sin(angle);
      const tip = -0.22 * Math.sin(angle - 0.35) - 0.03 * Math.sin(3 * angle - 1.05);
      beam2.rotation.z = tip;
      for (const [i, pan] of pans.entries()) pan.rotation.z = -tip + 0.08 * Math.sin(angle - 0.8 + i);
    });
  },
  /** A celadon globe in a tilted brass meridian on a cradle; a brass plane circles on an arm. */
  travel(root, m, ticks) {
    const C2 = 0.18;
    const R = 0.74;
    const fork = new Batch(root);
    fork.strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, C2 - 1.02, 0), 0.054, [false, true]);
    foot(fork, m, 0, K.inkGlaze);
    fork.add(m.brass, new THREE9__namespace.TorusGeometry(1, 0.044, 12, 64, Math.PI).rotateZ(Math.PI).translate(0, C2, 0));
    for (const side of [-1, 1]) fork.add(m.brass, ballGeometry(vec(side * 1, C2, 0), 0.07));
    fork.done();
    const meridian = new THREE9__namespace.Group();
    meridian.position.y = C2;
    meridian.rotation.x = -0.36;
    root.add(meridian);
    new Batch(meridian).add(m.agedBrass, new THREE9__namespace.TorusGeometry(0.88, 0.036, 12, 72)).strut(m.brass, vec(-0.98, 0, 0), vec(-0.88, 0, 0), 0.036, [false, false]).strut(m.brass, vec(0.88, 0, 0), vec(0.98, 0, 0), 0.036, [false, false]).strut(m.brass, vec(0, -0.9, 0), vec(0, -R, 0), 0.04, [false, false]).strut(m.brass, vec(0, R, 0), vec(0, 0.9, 0), 0.04, [false, false]).add(m.brass, ballGeometry(vec(0, 0.92, 0), 0.055)).done();
    const globe = new THREE9__namespace.Mesh(
      new THREE9__namespace.SphereGeometry(R, 48, 32),
      glazeFinish(chunk7OAMHGZK_cjs.lookMaterial("ceramic", 16777215, { map: globeTexture() }))
    );
    globe.material.map.colorSpace = THREE9__namespace.SRGBColorSpace;
    meridian.add(globe);
    const arm = new THREE9__namespace.Group();
    arm.position.y = 0.92;
    meridian.add(arm);
    const b = new Batch(arm);
    b.strut(m.brass, vec(0, 0, 0), vec(0.62, 0.12, 0), 0.042, [false, true]);
    b.strut(m.brass, vec(0.62, 0.12, 0), vec(1.02, -0.52, 0), 0.038, [false, true]);
    const plane = new THREE9__namespace.Group();
    plane.position.set(1.02, -0.52, 0);
    plane.scale.setScalar(2.5);
    arm.add(plane);
    const p = new Batch(plane);
    p.add(m.glaze, glazed(new THREE9__namespace.CapsuleGeometry(0.04, 0.26, 6, 16).rotateX(Math.PI / 2), K.bone));
    p.add(m.brass, new THREE9__namespace.BoxGeometry(0.42, 0.016, 0.09).translate(0, 0, -0.02));
    p.add(m.brass, new THREE9__namespace.BoxGeometry(0.16, 0.014, 0.05).translate(0, 0, 0.13));
    p.add(m.oxblood, new THREE9__namespace.BoxGeometry(0.014, 0.08, 0.06).translate(0, 0.04, 0.14));
    p.done();
    b.done();
    ticks.push((angle) => {
      globe.rotation.y = angle;
      arm.rotation.y = -angle + 0.9;
      plane.rotation.z = 0.25 * Math.sin(angle * 2);
    });
  }
};
var staging = {
  ai: { base: "turned", pitch: 11, yaw: -16 },
  trading: { base: "bench", pitch: 4, yaw: -8 },
  travel: { base: "drum", pitch: 16, yaw: 10 }
};
function kineticLook(kind) {
  const stage = staging[kind];
  return {
    rig: {
      both: {
        toneMapping: "aces",
        environment: { kind: "softbox", intensity: 0.7, rotation: 0.5 },
        key: { color: 16771529, intensity: 2.3, position: [-3, 5, 5], shadowRadius: 6, shadowMapSize: 1024 },
        rim: { color: 10273791, position: [4, 3, -4] }
      },
      light: {
        exposure: 1.05,
        reflections: 1.3,
        hemisphere: { sky: 16052198, ground: 7037528, intensity: 0.75 },
        rim: { intensity: 1.6 }
      },
      dark: {
        exposure: 1.1,
        reflections: 1.25,
        hemisphere: { sky: 9413572, ground: 790291, intensity: 0.1 },
        rim: { intensity: 4.2, color: 11127039 },
        key: { intensity: 0.7, color: 13227775 },
        // A warm kicker from back left: a second rim along the brass and the base's edge.
        fill: { color: 16763274, intensity: 2.2, position: [-5, 2.5, -3.5] },
        environment: { intensity: 0.9 }
      }
    },
    camera: { projection: "perspective", fov: 28, pitch: stage.pitch, yaw: stage.yaw },
    framing: { fill: 0.84, maxWidth: 0.86, lift: -5e-3 },
    castShadows: true
  };
}
function kineticWorld(kind, ticks) {
  const root = new THREE9__namespace.Group();
  const m = sculptureMaterials(true);
  base(root, m, staging[kind].base);
  sculptures[kind](root, m, ticks);
  const spot = new THREE9__namespace.SpotLight(16767400, 0, 0, 0.36, 0.85, 2);
  spot.position.set(0.6, 5.2, 3);
  spot.target.position.set(0, -0.6, 0);
  root.add(spot, spot.target);
  themeSwitch(root, ticks, (dark) => {
    spot.intensity = dark ? 150 : 30;
  });
  return root;
}
var cardStock = {
  cream: 15985629,
  persimmon: 15298891,
  viridian: 3112819,
  deepViridian: 2055253,
  sage: 10337178,
  dusty: 9417668,
  apricot: 15910560,
  sand: 15258548,
  ink: 2633796,
  lemon: 15326578
};
var C = cardStock;
var FLOOR = -1.12;
var BACK = -0.8;
var FRONT = 0.95;
var OPEN = 1.62;
var SPRING = 0.5;
var CARD = 0.036;
var FRAME_X = 1.86;
function cardFinish(material) {
  return surfaceFinish(material, "card", {
    color: `float cloud = fNoise(p * 3.5) * 0.55 + fNoise(p * 11.0) * 0.45;
      float strand = smoothstep(0.9, 0.98, fNoise(vec3(p.x * 55.0 + p.y * 20.0, p.y * 14.0 - p.x * 4.0, p.z * 14.0)));
      diffuseColor.rgb *= 0.9 + 0.13 * cloud;
      diffuseColor.rgb = mix(diffuseColor.rgb, min(diffuseColor.rgb * 1.08 + 0.02, vec3(1.0)), strand * 0.35);`,
    rough: "roughnessFactor = clamp(roughnessFactor - 0.12 * strand, 0.6, 1.0);",
    normal: "normal = normalize(normal + 0.16 * fGrad(p * 70.0) + 0.1 * fGrad(p * 18.0));"
  });
}
var edgeOf = (color) => new THREE9__namespace.Color(color).lerp(new THREE9__namespace.Color(16775404), color === C.cream ? 0.6 : 0.5);
function tint(geometry, color, edge = edgeOf(color)) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const face = new THREE9__namespace.Color(color);
  const sides = g.groups.find((group2) => group2.materialIndex === 1);
  const count = g.attributes.position.count;
  const colors2 = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const c = sides && i >= sides.start && i < sides.start + sides.count ? edge : face;
    colors2.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE9__namespace.BufferAttribute(colors2, 3));
  g.clearGroups();
  return g;
}
function poly(points, hole = false) {
  const path = hole ? new THREE9__namespace.Path() : new THREE9__namespace.Shape();
  points.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y));
  path.closePath();
  return path;
}
var shape = (points) => poly(points);
var rect = (x0, y0, x1, y1) => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1]
];
function circle(cx, cy, r, hole = false) {
  const path = hole ? new THREE9__namespace.Path() : new THREE9__namespace.Shape();
  path.absarc(cx, cy, r, 0, TAU, false);
  return path;
}
var sample = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
function card(outline, color, z, depth = CARD) {
  const g = new THREE9__namespace.ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelThickness: 5e-3,
    bevelSize: 5e-3,
    bevelSegments: 1,
    curveSegments: 24
  });
  g.translate(0, 0, z);
  return tint(g, color);
}
function withHoles(outline, holes) {
  outline.holes.push(...holes);
  return outline;
}
function block2(w, h, d, color, x, y, z) {
  const g = new THREE9__namespace.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return tint(g, color, new THREE9__namespace.Color(color));
}
var arches = {
  round: (x) => 0.62 * Math.sqrt(Math.max(0, 1 - x * x)),
  scallop: (x) => 0.7 - 0.13 * Math.abs(Math.sin(Math.PI * 3.5 * (x + 1)))
};
function opening(arch, inset) {
  const hw = OPEN - inset;
  const top = sample(48, (t) => {
    const x = -1 + 2 * t;
    return [x * hw, SPRING + arches[arch](x) * (hw / OPEN) - inset * 0.6];
  });
  return poly([[-hw, FLOOR - 0.02], ...top, [hw, FLOOR - 0.02]], true);
}
var FRAMES = { viridian: C.viridian, persimmon: C.persimmon };
var Theatre = class {
  constructor(options) {
    this.options = options;
    this.root = new THREE9__namespace.Group();
    this.statics = [];
    this.paper = cardFinish(
      chunk7OAMHGZK_cjs.lookMaterial("paper", 16777215, { vertexColors: true, grain: 1.15, normalScale: new THREE9__namespace.Vector2(0.55, 0.55) })
    );
    chunk7OAMHGZK_cjs.themed(this.paper, { dark: { color: 14208964 } });
    this.lamp = chunk7OAMHGZK_cjs.themed(cardFinish(chunk7OAMHGZK_cjs.lookMaterial("paper", 16777215, { vertexColors: true, grain: 1.15 })), {
      dark: { emissive: 16752714, emissiveIntensity: 1.6 }
    });
    this.build();
  }
  add(...geometries) {
    this.statics.push(...geometries);
  }
  /**
   * How a flat stands up in a real paper theatre: a glue tab folded back along its foot and lying on
   * the stage floor (the fold is the flat's hinge), and, for flats that never move, a pair of
   * triangular braces behind it at `braces` x positions, cut card standing square to the flat.
   */
  stand(x0, x1, z, color, braces = [], height = 0.32) {
    const TAB = 0.11;
    this.add(block2(x1 - x0, 0.01, TAB, color, (x0 + x1) / 2, FLOOR + 5e-3, z - TAB / 2 + 2e-3));
    for (const x of braces)
      this.add(
        card(
          shape([
            [0, FLOOR],
            [0.2, FLOOR],
            [0, FLOOR + height]
          ]),
          color,
          0,
          0.02
        ).rotateY(Math.PI / 2).translate(x - 0.01, 0, z)
      );
  }
  /** A moving part: geometries merged into one mesh under `parent`. */
  part(parent, geometries, material = this.paper) {
    const mesh3 = new THREE9__namespace.Mesh(BufferGeometryUtils_js.mergeGeometries(geometries), material);
    geometries.forEach((g) => g.dispose());
    parent.add(mesh3);
    return mesh3;
  }
  /** A group hinged on the stage floor at depth `z`, so a flat can sway like scenery on a pin. */
  hinge(z, y = FLOOR) {
    const group2 = new THREE9__namespace.Group();
    group2.position.set(0, y, z);
    this.root.add(group2);
    return group2;
  }
  build() {
    const { frame, trims, arch, backdrop: backdrop2, floor: floor2, walls = backdrop2 } = this.options;
    const outer = rect(-FRAME_X, FLOOR - 0.2, FRAME_X, 1.44);
    this.add(
      card(
        withHoles(shape(rect(-FRAME_X - 0.05, FLOOR - 0.25, FRAME_X + 0.05, 1.49)), [opening(arch, 0.02)]),
        C.cream,
        FRONT - 0.012,
        0.012
      )
    );
    this.add(card(withHoles(shape(outer), [opening(arch, 0)]), frame, FRONT));
    this.add(card(withHoles(shape(rect(-1.84, FLOOR - 0.05, 1.84, 1.38)), [opening(arch, 0.05)]), trims[0], FRONT - 0.07));
    this.add(card(withHoles(shape(rect(-1.83, FLOOR - 0.05, 1.83, 1.34)), [opening(arch, 0.09)]), trims[1], FRONT - 0.14));
    this.add(block2(3.7, 0.2, FRONT - BACK, floor2, 0, FLOOR - 0.1, (FRONT + BACK) / 2));
    for (const side of [-1, 1]) {
      this.add(block2(0.04, 2.38, FRONT - BACK, walls, side * 1.83, 0.07, (FRONT + BACK) / 2));
      this.add(block2(0.14, 2.3, 0.012, walls, side * 1.78, 0.07, BACK + CARD + 8e-3));
    }
    this.add(block2(3.7, 0.04, FRONT - BACK, walls, 0, 1.26, (FRONT + BACK) / 2));
    this.add(card(shape(rect(-1.85, FLOOR, 1.85, 1.3)), backdrop2, BACK));
  }
  finish(ticks) {
    this.part(this.root, this.statics);
    this.statics = [];
    this.root.add(chunk7OAMHGZK_cjs.contactShadow(4.6, 2.5, { y: FLOOR - 0.2, z: 0.1, opacity: 0.38, color: 2759698 }));
    const lantern = new THREE9__namespace.SpotLight(16763276, 0, 0, 0.42, 0.9, 2);
    lantern.position.set(-0.6, 3.4, 4.2);
    lantern.target.position.set(0.1, -0.5, -0.2);
    this.root.add(lantern, lantern.target);
    themeSwitch(this.root, ticks, (dark) => {
      lantern.intensity = dark ? 120 : 22;
    });
    return this.root;
  }
};
var star = (cx, cy, r) => sample(8, (t) => {
  const a = t * TAU + Math.PI / 2, rr = Math.round(t * 8) % 2 ? r * 0.38 : r;
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
}).slice(0, 8);
var cloud = (cx, cy, s) => {
  const outline = new THREE9__namespace.Shape();
  outline.moveTo(cx - 0.42 * s, cy);
  outline.absarc(cx - 0.24 * s, cy + 0.08 * s, 0.17 * s, Math.PI, Math.PI / 2, true);
  outline.absarc(cx + 0.02 * s, cy + 0.14 * s, 0.22 * s, Math.PI * 0.85, Math.PI * 0.15, true);
  outline.absarc(cx + 0.28 * s, cy + 0.06 * s, 0.15 * s, Math.PI / 2, 0, true);
  outline.lineTo(cx + 0.43 * s, cy);
  outline.closePath();
  return outline;
};
var fir = (cx, base2, h) => [
  [cx - 0.03 * h, base2],
  [cx - 0.03 * h, base2 + 0.12 * h],
  [cx - 0.3 * h, base2 + 0.12 * h],
  [cx - 0.12 * h, base2 + 0.45 * h],
  [cx - 0.24 * h, base2 + 0.45 * h],
  [cx, base2 + h],
  [cx + 0.24 * h, base2 + 0.45 * h],
  [cx + 0.12 * h, base2 + 0.45 * h],
  [cx + 0.3 * h, base2 + 0.12 * h],
  [cx + 0.03 * h, base2 + 0.12 * h],
  [cx + 0.03 * h, base2]
];
var ridge = (peaks) => [[-1.85, FLOOR], ...peaks, [1.85, FLOOR]];
var scenes2 = {
  /** Five mountain flats, a road winding back between them, a train on a slot and a sun on a rod. */
  travel(ticks) {
    const t = new Theatre({
      frame: FRAMES.viridian,
      trims: [C.cream, C.persimmon],
      arch: "round",
      backdrop: 16176820,
      floor: C.sand
    });
    const sunRod = t.hinge(BACK + 0.08, FLOOR);
    t.part(sunRod, [
      card(circle(0.75, 1.55, 0.34), C.persimmon, 0),
      card(shape(rect(0.73, 0, 0.77, 1.3)), C.ink, -0.03, 0.02)
    ]);
    const far = ridge([
      [-1.85, 0.1],
      [-1.2, 0.72],
      [-0.55, 0.15],
      [0.05, 0.62],
      [0.55, 0.3],
      [1.1, 0.85],
      [1.85, 0.2]
    ]);
    t.add(card(shape(far), 12176595, -0.62));
    for (const [x, y] of [
      [-1.2, 0.72],
      [1.1, 0.85]
    ])
      t.add(
        card(
          shape([
            [x - 0.2, y - 0.25],
            [x, y],
            [x + 0.2, y - 0.25],
            [x + 0.07, y - 0.18],
            [x - 0.06, y - 0.24]
          ]),
          C.cream,
          -0.62 + CARD + 4e-3,
          0.012
        )
      );
    t.add(
      card(
        shape(
          ridge([
            [-1.85, -0.05],
            [-0.85, 0.45],
            [-0.25, -0.05],
            [0.35, 0.32],
            [1, -0.1],
            [1.85, 0.3]
          ])
        ),
        C.dusty,
        -0.38
      )
    );
    t.stand(-1.85, 1.85, -0.62, 12176595);
    t.stand(-1.85, 1.85, -0.38, C.dusty);
    t.add(
      card(
        shape([
          [-1, 0.25],
          [-0.85, 0.45],
          [-0.7, 0.25],
          [-0.8, 0.3]
        ]),
        C.cream,
        -0.38 + CARD + 4e-3,
        0.012
      )
    );
    t.add(
      card(
        shape(
          ridge([
            [-1.85, -0.35],
            [-1.3, 0.05],
            [-0.6, -0.42],
            [0.45, 0.02],
            [1.2, -0.38],
            [1.85, -0.15]
          ])
        ),
        6266511,
        -0.12
      )
    );
    t.stand(-1.85, 1.85, -0.12, 6266511, [-1.5, 1.5]);
    t.add(
      card(
        shape([
          [0.18, -0.42],
          [0.3, -0.42],
          [0.42, -0.2],
          [0.36, -0.2]
        ]),
        C.cream,
        -0.12 + CARD + 4e-3,
        0.01
      )
    );
    const mid = t.hinge(0.12);
    t.stand(-1.85, 1.85, 0.12, C.viridian);
    t.part(mid, [
      card(
        shape(
          ridge([
            [-1.85, -0.55],
            [-1, -0.2],
            [-0.2, -0.62],
            [0.9, -0.28],
            [1.85, -0.5]
          ]).map(([x, y]) => [x, y - FLOOR])
        ),
        C.viridian,
        0
      ),
      card(
        shape([
          [-0.15, -0],
          [0.25, 0],
          [0.4, 0.42],
          [0.28, 0.42]
        ]),
        C.cream,
        CARD + 4e-3,
        0.01
      ),
      card(shape(rect(-1.85, 0.47, 1.85, 0.51)), C.ink, CARD + 4e-3, 0.01)
    ]);
    const train = new THREE9__namespace.Group();
    train.position.set(0, FLOOR + 0.51 + 0.02, 0.235);
    t.root.add(train);
    const trainParts = [
      card(
        shape([
          [-0.2, 0],
          [0.13, 0],
          [0.2, 0.06],
          [0.2, 0.13],
          [-0.05, 0.13],
          [-0.05, 0.22],
          [-0.2, 0.22]
        ]),
        C.persimmon,
        0,
        0.03
      ),
      card(shape(rect(0.06, 0.13, 0.12, 0.22)), C.ink, 0, 0.03),
      card(shape(rect(-0.17, 0.14, -0.08, 0.19)), C.cream, 0.035, 0.01)
    ];
    for (const x of [-0.42]) {
      trainParts.push(card(shape(rect(x - 0.12, 0.02, x + 0.12, 0.17)), C.cream, 0, 0.03));
      trainParts.push(card(shape(rect(x - 0.08, 0.09, x + 0.08, 0.13)), C.ink, 0.035, 0.01));
    }
    for (const x of [-0.5, -0.34, -0.12, 0.1]) trainParts.push(card(circle(x, 0.02, 0.035), C.ink, 0.035, 0.012));
    t.part(train, trainParts);
    const TRACK = FLOOR + 0.53;
    const ROCK = 9083532;
    for (const side of [-1, 1]) {
      const at2 = (u) => side * (1 + u);
      const rock = shape(
        [
          [0, 0],
          [0.84, 0],
          [0.84, 0.82],
          [0.62, 0.96],
          [0.36, 1.02],
          [0.1, 0.92],
          [0, 0.82]
        ].map(([u, y]) => [at2(u), FLOOR + y])
      );
      t.add(card(rock, ROCK, 0.3));
      const portal = new THREE9__namespace.Shape();
      const cx = at2(0.2);
      portal.moveTo(cx - 0.15, TRACK - 0.03);
      portal.lineTo(cx - 0.15, TRACK + 0.18);
      portal.absarc(cx, TRACK + 0.18, 0.15, Math.PI, 0, true);
      portal.lineTo(cx + 0.15, TRACK - 0.03);
      portal.closePath();
      t.add(card(portal, C.ink, 0.3 + CARD + 3e-3, 0.012));
      const ring = shape(sample(24, (s) => [cx + 0.19 * Math.cos(Math.PI * s), TRACK + 0.18 + 0.19 * Math.sin(Math.PI * s)]));
      ring.holes.push(
        poly(
          sample(24, (s) => [cx + 0.15 * Math.cos(Math.PI * (1 - s)), TRACK + 0.18 + 0.15 * Math.sin(Math.PI * (1 - s))]),
          true
        )
      );
      t.add(card(ring, C.cream, 0.3 + CARD + 3e-3, 0.014));
      const [x0, x1] = [at2(0.05), at2(0.8)].sort((a, b) => a - b);
      t.stand(x0, x1, 0.3, ROCK, [at2(0.5)]);
    }
    const front = t.hinge(0.48);
    t.stand(-1.85, 1.85, 0.48, C.sage);
    const frontParts = [
      card(
        shape(
          ridge([
            [-1.85, -0.72],
            [-1.2, -0.62],
            [-0.5, -0.85],
            [0.6, -0.68],
            [1.4, -0.82],
            [1.85, -0.7]
          ]).map(([x, y]) => [x, y - FLOOR])
        ),
        C.sage,
        0
      ),
      card(
        shape([
          [-0.45, 0],
          [0.25, 0],
          [0.12, 0.16],
          [0.02, 0.27],
          [-0.12, 0.27]
        ]),
        C.cream,
        CARD + 4e-3,
        0.01
      )
    ];
    for (const [x, h] of [
      [-1.42, 0.62],
      [-1.12, 0.48],
      [0.95, 0.56],
      [1.25, 0.72]
    ])
      frontParts.push(card(shape(fir(x, 0.2, h)), C.deepViridian, 0.05, 0.03));
    t.part(front, frontParts);
    const drift = t.hinge(BACK + 0.3, 0);
    t.part(drift, [card(cloud(-0.9, 0.95, 1), C.cream, 0), card(cloud(0.2, 1.12, 0.62), C.cream, 0.05)]);
    ticks.push((angle) => {
      sunRod.position.y = -0.86 + 0.32 * Math.sin(angle - 0.6);
      const u = ((2 * angle / TAU + 0.25) % 1 + 1) % 1;
      train.position.x = -1.25 + 2.85 * u;
      mid.rotation.x = 0.04 * Math.sin(angle + 1);
      front.rotation.x = 0.09 * Math.sin(angle);
      drift.position.x = 0.3 * Math.sin(angle);
    });
    return t.finish(ticks);
  },
  /** An open book on a raked floor; a castle pops up from its gutter as the pages breathe. */
  reading(ticks) {
    const t = new Theatre({
      frame: FRAMES.persimmon,
      trims: [C.cream, C.ink],
      arch: "scallop",
      backdrop: 7311267,
      floor: C.sand,
      walls: 6258579
    });
    const moon = shape(sample(40, (s) => [-1.12 + 0.24 * Math.cos(s * TAU), 0.66 + 0.24 * Math.sin(s * TAU)]));
    moon.holes.push(circle(-1.03, 0.72, 0.2, true));
    t.add(card(moon, C.cream, BACK + CARD + 0.02));
    for (const [x, y, r] of [
      [1.15, 0.78, 0.09],
      [0.75, 0.95, 0.06],
      [-0.55, 0.9, 0.06],
      [1.42, 0.45, 0.06],
      [-1.5, 0.3, 0.05]
    ])
      t.add(card(shape(star(x, y, r)), C.lemon, BACK + CARD + 0.02, 0.015));
    const book = new THREE9__namespace.Group();
    book.position.set(0, FLOOR + 0.08, 0.25);
    book.rotation.x = 0.42;
    t.root.add(book);
    const pages = [];
    for (const side of [-1, 1]) {
      const leaf = new THREE9__namespace.Group();
      book.add(leaf);
      pages.push(leaf);
      const parts = [block2(1.42, 0.04, 1.36, C.deepViridian, side * 0.72, -0.03, 0)];
      for (let i = 0; i < 3; i++)
        parts.push(block2(1.34, 0.025, 1.28, i === 2 ? C.cream : 15195339, side * 0.69, 0.01 + i * 0.026, 0));
      t.part(leaf, parts);
    }
    const castle = new THREE9__namespace.Group();
    castle.position.set(0, 0.1, 0.12);
    book.add(castle);
    const keep = new THREE9__namespace.Group();
    keep.position.set(0, 0.1, -0.32);
    book.add(keep);
    const towers = (x, w, h) => [
      [x - w, 0],
      [x + w, 0],
      [x + w, h],
      [x + w * 0.5, h],
      [x + w * 0.5, h - 0.06],
      [x - w * 0.5 + 0, h - 0.06],
      [x - w * 0.5, h],
      [x - w, h]
    ];
    const wall = [
      [-0.62, 0],
      [0.62, 0],
      [0.62, 0.48]
    ];
    for (let i = 0; i < 7; i++) {
      const x = 0.62 - i * 1.24 / 7;
      wall.push([x, 0.48], [x, 0.56], [x - 0.09, 0.56], [x - 0.09, 0.48]);
    }
    wall.push([-0.62, 0.48]);
    const gate = new THREE9__namespace.Path();
    gate.moveTo(-0.12, 0);
    gate.lineTo(-0.12, 0.2);
    gate.absarc(0, 0.2, 0.12, Math.PI, 0, true);
    gate.lineTo(0.12, 0);
    gate.closePath();
    const front = shape(wall);
    front.holes.push(gate);
    const keepOutline = shape(towers(0, 0.32, 1.05));
    keepOutline.holes.push(
      circle(0, 0.78, 0.07, true),
      poly(rect(-0.18, 0.45, -0.1, 0.58), true),
      poly(rect(0.1, 0.45, 0.18, 0.58), true)
    );
    t.part(keep, [
      card(keepOutline, C.dusty, 0),
      card(
        shape([
          [-0.38, 1.05],
          [0, 1.45],
          [0.38, 1.05]
        ]),
        C.persimmon,
        0.01
      ),
      card(
        shape([
          [0, 1.45],
          [0, 1.62],
          [0.17, 1.56],
          [0.02, 1.5]
        ]),
        C.persimmon,
        5e-3,
        0.015
      )
    ]);
    t.part(keep, [card(shape(rect(-0.3, 0.2, 0.3, 1)), C.apricot, -0.03, 0.01)], t.lamp);
    const towerParts = [card(front, C.apricot, 0)];
    for (const side of [-1, 1]) {
      const x = side * 0.6;
      const tower = shape(towers(x, 0.17, 0.82));
      tower.holes.push(poly(rect(x - 0.04, 0.45, x + 0.04, 0.6), true));
      towerParts.push(
        card(tower, C.apricot, 0.04),
        card(
          shape([
            [x - 0.22, 0.82],
            [x, 1.18],
            [x + 0.22, 0.82]
          ]),
          C.persimmon,
          0.05
        )
      );
    }
    t.part(castle, towerParts);
    t.part(castle, [card(shape(rect(-0.15, 0, 0.15, 0.36)), C.apricot, -0.03, 0.01)], t.lamp);
    const firs = new THREE9__namespace.Group();
    firs.position.set(0, 0.1, 0.45);
    book.add(firs);
    t.part(firs, [
      card(shape(fir(-1, 0, 0.62)), C.viridian, 0),
      card(shape(fir(-0.75, 0, 0.42)), C.deepViridian, 0.03),
      card(shape(fir(1, 0, 0.55)), C.viridian, 0)
    ]);
    ticks.push((angle) => {
      const open = 0.5 + 0.5 * Math.sin(angle);
      const lift = 0.2 * (1 - open);
      pages[0].rotation.z = -lift;
      pages[1].rotation.z = lift;
      castle.rotation.x = -0.55 * (1 - open);
      keep.rotation.x = -0.75 * (1 - open);
      firs.rotation.x = -0.9 * (1 - open);
    });
    return t.finish(ticks);
  }
};
var seats = {
  travel: { pitch: 7, yaw: 14 },
  reading: { pitch: 14, yaw: -10 }
};
function paperLook(kind) {
  return {
    rig: {
      both: {
        toneMapping: "aces",
        environment: { kind: "room", intensity: 0.25 },
        key: { color: 16770759, intensity: 3.1, position: [-4, 6, 8], shadowRadius: 5, shadowMapSize: 1024 },
        rim: { intensity: 0.5 }
      },
      light: { exposure: 1, hemisphere: { sky: 16774372, ground: 9073762, intensity: 1.15 } },
      // A lamp-lit theatre: little ambient, the warm key pooling on the stage.
      dark: {
        exposure: 1,
        hemisphere: { sky: 8885944, ground: 1381916, intensity: 0.16 },
        // Footlights: the key comes from low in front, so flats throw their shadows up the stage.
        key: { intensity: 2.3, color: 16764822, position: [-2.5, -0.6, 8] },
        rim: { intensity: 0.9, color: 10467583 }
      }
    },
    camera: { projection: "perspective", fov: 30, ...seats[kind] },
    framing: { fill: 0.82, maxWidth: 0.9, sample: "rest" },
    castShadows: true
  };
}
function paperWorld(kind, ticks) {
  return scenes2[kind](ticks);
}

// src/objects/art-directions.ts
var REST_MS3 = 1800;
function createArtDirection(kind, variant) {
  if (variant >= 3) return createExpandedDirection(kind, variant);
  const ticks = [];
  let root;
  if (variant === 1 && chunkHPYRAZ5N_cjs.hasObjectLook(kind, 1)) {
    root = paperWorld(kind, ticks);
    root.userData.look = paperLook(kind);
  } else if (variant === 2 && chunkHPYRAZ5N_cjs.hasObjectLook(kind, 2)) {
    root = kineticWorld(kind, ticks);
    root.userData.look = kineticLook(kind);
  } else throw new Error(`${kind} has no ${variant === 1 ? "paper" : "kinetic"} look`);
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

// src/objects/studio.ts
var FLOOR2 = -1;
var hsl = (h, s, l) => new THREE9__namespace.Color().setHSL(h, s, l, THREE9__namespace.SRGBColorSpace).getHex();
var hslOf = (color) => new THREE9__namespace.Color(color).getHSL({ h: 0, s: 0, l: 0 }, THREE9__namespace.SRGBColorSpace);
function nightRoom(palette2) {
  const ink = hslOf(palette2.ink), accent = hslOf(palette2.accent);
  const s = chunkSDBNPDW6_cjs.clamp(ink.s * 2, 0.22, 0.42);
  return {
    pool: hsl(ink.h, s, 0.34),
    shadow: hsl(ink.h, s * 0.6, 0.02),
    sky: hsl(ink.h, s * 0.7, 0.72),
    ground: hsl(ink.h, s * 0.6, 0.06),
    kicker: hsl(ink.h, s * 0.9, 0.74),
    rim: hsl(accent.h, chunkSDBNPDW6_cjs.clamp(accent.s, 0.3, 0.6), 0.74)
  };
}
function studioLook(palette2, shot = { pitch: 14 }) {
  const room = nightRoom(palette2);
  return {
    rig: {
      both: {
        toneMapping: "aces",
        exposure: 1,
        environment: { kind: "room", intensity: 0.45, rotation: 0.35 },
        reflections: 1,
        hemisphere: { sky: 16512748, ground: 4540490, intensity: 0.32 },
        key: { color: 16773596, intensity: 3.6, position: [-5.5, 7, 3.5], shadow: true, shadowMapSize: 1024, shadowRadius: 5 },
        fill: { color: 15134463, intensity: 0.22, position: [6, 1.5, 5] },
        rim: { color: 16054271, intensity: 3, position: [3.5, 4.5, -6] }
      },
      dark: {
        exposure: 1.06,
        environment: { kind: "softbox", intensity: 0.3 },
        reflections: 0.62,
        hemisphere: { sky: room.sky, ground: room.ground, intensity: 0.14 },
        key: { color: 16770756, intensity: 3.3, position: [-1.4, 9, 1.6] },
        fill: { color: room.kicker, intensity: 1.5, position: [-6, 1.2, -4.5] },
        rim: { color: room.rim, intensity: 5.5, position: [6, 1.6, -5] }
      }
    },
    camera: { projection: "perspective", fov: shot.fov ?? 32, pitch: shot.pitch },
    framing: { fill: shot.fill ?? 0.78, maxWidth: shot.maxWidth ?? 0.9, lift: shot.lift ?? 0 },
    contactShadow: { spread: 1, opacity: 0.32 }
  };
}
var GRAPHITE = 2830126;
var ALUMINIUM = 13225158;
var AMBER = 15246141;
function studioPalette(palette2) {
  const { l } = hslOf(palette2.accent);
  return l > 0.4 ? { ...palette2, accent: chunk7OAMHGZK_cjs.shade(palette2.accent, -0.42) } : palette2;
}
function noise(seed) {
  return () => (seed = seed * 1664525 + 1013904223 >>> 0) / 4294967296;
}
function dataTexture(data, size, repeat) {
  const t = new THREE9__namespace.DataTexture(data, size, size, THREE9__namespace.RGBAFormat);
  t.wrapS = t.wrapT = THREE9__namespace.RepeatWrapping;
  t.repeat.set(...repeat);
  t.magFilter = THREE9__namespace.LinearFilter;
  t.minFilter = THREE9__namespace.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}
function brushedGrain(repeat = [1, 2], depth = 0.35) {
  const W = 256;
  const random = noise(24301);
  const field = new Float32Array(W * W);
  for (let y = 0; y < W; y++) {
    const row = random();
    for (let x = 0; x < W; x++) field[y * W + x] = row * 0.7 + random() * 0.3;
  }
  for (let pass = 0; pass < 3; pass++)
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++)
        field[y * W + x] = (field[y * W + x] * 2 + field[y * W + (x + 1) % W] + field[y * W + (x + W - 1) % W]) / 4;
  const rough = new Uint8Array(W * W * 4), normal = new Uint8Array(W * W * 4);
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, v = field[y * W + x];
      const r = Math.round(255 * (0.78 + 0.22 * v));
      rough.set([r, r, r, 255], i);
      const dy = field[(y + 1) % W * W + x] - field[(y + W - 1) % W * W + x];
      const n = new THREE9__namespace.Vector3(0, -dy * 1.6, 1).normalize();
      normal.set([128, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255, 255], i);
    }
  return {
    roughnessMap: dataTexture(rough, W, repeat),
    normalMap: dataTexture(normal, W, repeat),
    normalScale: new THREE9__namespace.Vector2(depth, depth)
  };
}
function stipple(repeat = 6, depth = 0.5) {
  const W = 64;
  const random = noise(22439);
  const field = new Float32Array(W * W).map(() => random());
  const soft = field.map((_, i) => {
    const x = i % W, y = Math.floor(i / W);
    return (field[i] * 4 + field[y * W + (x + 1) % W] + field[y * W + (x + W - 1) % W] + field[(y + 1) % W * W + x] + field[(y + W - 1) % W * W + x]) / 8;
  });
  const rough = new Uint8Array(W * W * 4), normal = new Uint8Array(W * W * 4);
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, v = soft[y * W + x];
      const r = Math.round(255 * (0.82 + 0.18 * v));
      rough.set([r, r, r, 255], i);
      const dx = soft[y * W + (x + 1) % W] - soft[y * W + (x + W - 1) % W], dy = soft[(y + 1) % W * W + x] - soft[(y + W - 1) % W * W + x];
      const n = new THREE9__namespace.Vector3(-dx * 2, -dy * 2, 1).normalize();
      normal.set([(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255, 255], i);
    }
  return {
    roughnessMap: dataTexture(rough, W, [repeat, repeat]),
    normalMap: dataTexture(normal, W, [repeat, repeat]),
    normalScale: new THREE9__namespace.Vector2(depth, depth)
  };
}
function studioMaterials(palette2) {
  return {
    aluminium: chunk7OAMHGZK_cjs.themed(
      chunk7OAMHGZK_cjs.lookMaterial("brushedMetal", 12764864, { roughness: 0.32, anisotropy: 0.75, ...brushedGrain([1, 2], 0.18) }),
      { dark: { color: 10133659, roughness: 0.38 } }
    ),
    /** Bead-blasted aluminium: a fine matte metal, no direction. */
    satin: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("brushedMetal", 12435643, { roughness: 0.46, anisotropy: 0.15, ...stipple(10, 0.12) }), {
      dark: { color: 10264988 }
    }),
    steel: chunk7OAMHGZK_cjs.lookMaterial("metal", 15132901, { roughness: 0.08 }),
    graphite: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("ceramic", GRAPHITE, { roughness: 0.62, clearcoat: 1, clearcoatRoughness: 0.05 }), {
      dark: { color: 3488570 }
    }),
    keycap: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("plastic", 2830126, { roughness: 0.8, ...stipple(2, 0.35) }), {
      dark: { color: 3817535 }
    }),
    rubber: chunk7OAMHGZK_cjs.lookMaterial("rubber", 1777182, { roughness: 0.92, ...stipple(4, 0.8) }),
    accent: chunk7OAMHGZK_cjs.lookMaterial("ceramic", palette2.accent, { roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.04 }),
    glass: chunk7OAMHGZK_cjs.lookMaterial("ceramic", 461066, { roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 }),
    paper: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("paper", palette2.paper, { grain: 3 }), { dark: { color: chunk7OAMHGZK_cjs.shade(palette2.paper, -0.26) } })
  };
}
var printed = (options) => chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("paper", 15263198, options), { dark: { color: 12369080 } });
var glow = (color, intensity = 1.6) => chunk7OAMHGZK_cjs.lookMaterial("plastic", color, { emissive: color, emissiveIntensity: intensity, roughness: 0.3 });
function box2(w, h, d, material, x = 0, y = 0, z = 0, radius = 0.03) {
  const r = Math.min(radius, w / 2.01, h / 2.01, d / 2.01);
  const m = new THREE9__namespace.Mesh(new RoundedBoxGeometry_js.RoundedBoxGeometry(w, h, d, 3, r), material);
  m.position.set(x, y, z);
  return m;
}
function cylinder2(r, h, material, x = 0, y = 0, z = 0, segments = 32) {
  const m = new THREE9__namespace.Mesh(new THREE9__namespace.CylinderGeometry(r, r, h, segments), material);
  m.position.set(x, y, z);
  return m;
}
function turned(mesh3) {
  mesh3.rotation.x = Math.PI / 2;
  return mesh3;
}
var css = (color) => new THREE9__namespace.Color(color).getStyle();
var wrap = (time, loop) => (time % loop + loop) % loop;
var envelope2 = (t, a, b, c, d) => chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, a, b)) * (1 - chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, c, d)));
var turntable = (group2, base2, t, loop, amplitude = 0.12) => group2.rotation.y = base2 + amplitude * Math.sin(t / loop * Math.PI * 2);
function shadowFloor(radius = 2.5) {
  const material = chunk7OAMHGZK_cjs.themed(new THREE9__namespace.ShadowMaterial({ opacity: 0.3, depthWrite: false }), { dark: { opacity: 0.6 } });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "void main() {",
      "varying vec2 vFloor;\nvoid main() {\n  vFloor = uv - 0.5;"
    );
    shader.fragmentShader = shader.fragmentShader.replace("void main() {", "varying vec2 vFloor;\nvoid main() {").replace(
      "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );",
      "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) * ( 1.0 - smoothstep( 0.28, 0.5, length( vFloor ) ) ) );"
    );
  };
  const floor2 = new THREE9__namespace.Mesh(new THREE9__namespace.CircleGeometry(radius, 48), material);
  floor2.rotation.x = -Math.PI / 2;
  floor2.position.y = FLOOR2 + 2e-3;
  floor2.receiveShadow = true;
  floor2.name = "studio-floor";
  floor2.userData.frameIgnore = true;
  return floor2;
}
var RIM_DIRECTION = new THREE9__namespace.Vector3(0.78, 0.3, -0.55).normalize();
var RIM_STRENGTH = { ceramic: 1, plastic: 0.8, rubber: 0.45, felt: 0.5 };
function addRim(material, rim) {
  const weight = RIM_STRENGTH[material.userData.lookPreset] ?? 0;
  if (!weight || material.userData.studioRim || material.emissiveMap || material.emissive.getHex() !== 0) return;
  material.userData.studioRim = true;
  const themes = material.userData.themes ?? {};
  material.userData.themes = {
    ...themes,
    light: { ...themes.light, emissive: 16777215, emissiveIntensity: 0.28 * weight },
    dark: { ...themes.dark, emissive: rim, emissiveIntensity: 1.5 * weight }
  };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.studioRimDirection = { value: RIM_DIRECTION };
    shader.fragmentShader = shader.fragmentShader.replace("void main() {", "uniform vec3 studioRimDirection;\nvoid main() {").replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
        {
          vec3 rimView = normalize( ( viewMatrix * vec4( studioRimDirection, 0.0 ) ).xyz );
          float grazing = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 3.0 );
          float facing = smoothstep( 0.2, 0.8, dot( normal, rimView ) );
          totalEmissiveRadiance *= grazing * facing;
        }`
    );
  };
  material.customProgramCacheKey = () => "studio-rim";
}
function sweep(palette2) {
  const room = nightRoom(palette2);
  const WALL = -3.6, BEND = 1.6;
  const profile = [];
  profile.push(new THREE9__namespace.Vector2(14, FLOOR2 - 6e-3), new THREE9__namespace.Vector2(WALL + BEND, FLOOR2 - 6e-3));
  for (let i = 1; i < 12; i++) {
    const a = i / 12 * (Math.PI / 2);
    profile.push(new THREE9__namespace.Vector2(WALL + BEND - Math.sin(a) * BEND, FLOOR2 - 6e-3 + (1 - Math.cos(a)) * BEND));
  }
  profile.push(new THREE9__namespace.Vector2(WALL, FLOOR2 + BEND), new THREE9__namespace.Vector2(WALL, FLOOR2 + 14));
  const positions = [], index = [];
  const SCALE = 16;
  profile.forEach((p, i) => {
    positions.push(-16 / SCALE, p.y / SCALE, p.x / SCALE, 16 / SCALE, p.y / SCALE, p.x / SCALE);
    if (i > 0) index.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
  });
  const geometry = new THREE9__namespace.BufferGeometry();
  geometry.setAttribute("position", new THREE9__namespace.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  const layer = (profile2, changes) => {
    const material = chunk7OAMHGZK_cjs.themed(
      new THREE9__namespace.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0, depthWrite: false, side: THREE9__namespace.DoubleSide }),
      changes
    );
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace("void main() {", `varying vec3 vSweep;
void main() {
  vSweep = position * ${SCALE.toFixed(1)};`).replace("#include <begin_vertex>", `vec3 transformed = position * ${SCALE.toFixed(1)};`);
      shader.fragmentShader = shader.fragmentShader.replace("void main() {", "varying vec3 vSweep;\nvoid main() {").replace(
        "#include <opaque_fragment>",
        `{ float r = length( ( vSweep - vec3( 0.0, ${(FLOOR2 + 1.1).toFixed(2)}, ${(WALL + 0.4).toFixed(2)} ) ) * vec3( 0.8, 1.0, 1.0 ) );
             diffuseColor.a *= ${profile2}; }
           #include <opaque_fragment>`
      );
    };
    material.customProgramCacheKey = () => `studio-sweep-${profile2}`;
    const mesh3 = new THREE9__namespace.Mesh(geometry, material);
    mesh3.userData.frameIgnore = true;
    mesh3.frustumCulled = false;
    mesh3.renderOrder = -2;
    return mesh3;
  };
  const group2 = new THREE9__namespace.Group();
  group2.name = "studio-sweep";
  group2.userData.frameIgnore = true;
  group2.add(
    layer("smoothstep( 3.0, 9.0, r )", { light: { color: 6249042, opacity: 0.14 }, dark: { color: room.shadow, opacity: 0.7 } }),
    layer("pow( 1.0 - smoothstep( 0.0, 4.4, r ), 1.5 )", {
      light: { color: 16777215, opacity: 0 },
      dark: { color: room.pool, opacity: 0.7 }
    }),
    // The night key's pool on the tabletop under the subject: warm, tight, only on the floor.
    layer(
      `( 1.0 - smoothstep( ${(FLOOR2 + 0.05).toFixed(2)}, ${(FLOOR2 + 0.6).toFixed(2)}, vSweep.y ) ) * pow( 1.0 - smoothstep( 0.0, 3.2, length( vSweep.xz - vec2( 0.0, 0.2 ) ) ), 1.6 )`,
      { light: { color: 16777215, opacity: 0 }, dark: { color: 16769725, opacity: 0.32 } }
    )
  );
  return group2;
}
function finish(root, palette2, shot, change = {}) {
  const rim = nightRoom(palette2).rim;
  root.traverse((item) => {
    const mesh3 = item;
    if (!mesh3.isMesh || item.userData.frameIgnore) return;
    const glowing = item.userData.glow === true;
    mesh3.castShadow = !glowing && item.userData.cast !== false;
    mesh3.receiveShadow = !glowing && item.userData.receive !== false;
    if (glowing) return;
    for (const material of Array.isArray(mesh3.material) ? mesh3.material : [mesh3.material])
      if (material.isMeshStandardMaterial && material.userData.lookPreset)
        addRim(material, rim);
  });
  root.add(sweep(palette2), shadowFloor());
  root.userData.style = "studio";
  root.userData.look = { ...studioLook(palette2, shot), ...change };
  return root;
}
function instanced(geometry, material, matrices) {
  const m = new THREE9__namespace.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((matrix, i) => m.setMatrixAt(i, matrix));
  m.instanceMatrix.needsUpdate = true;
  m.computeBoundingBox();
  m.computeBoundingSphere();
  return m;
}
var at = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE9__namespace.Matrix4().compose(
  new THREE9__namespace.Vector3(x, y, z),
  new THREE9__namespace.Quaternion().setFromEuler(new THREE9__namespace.Euler(rx, ry, rz)),
  new THREE9__namespace.Vector3(sx, sy, sz)
);
var BALL_R = 0.13;
function racket2(mat) {
  const group2 = new THREE9__namespace.Group();
  const frameMaterial = chunk7OAMHGZK_cjs.lookMaterial("ceramic", GRAPHITE, {
    roughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 0.5
  });
  const cx = 1.86, a = 0.62, b = 0.47;
  const headCurve = new THREE9__namespace.EllipseCurve(cx, 0, a, b, 0, Math.PI * 2, false, 0);
  const headPoints = headCurve.getPoints(120).map((p) => new THREE9__namespace.Vector3(p.x, 0, p.y));
  const frame = new THREE9__namespace.Mesh(
    new THREE9__namespace.TubeGeometry(new THREE9__namespace.CatmullRomCurve3(headPoints, true), 140, 0.036, 10, true),
    frameMaterial
  );
  frame.scale.y = 1.45;
  group2.add(frame);
  for (const side of [-1, 1]) {
    const beam2 = new THREE9__namespace.CatmullRomCurve3([
      new THREE9__namespace.Vector3(0.78, 0, 0),
      new THREE9__namespace.Vector3(1.02, 0, side * 0.1),
      new THREE9__namespace.Vector3(1.2, 0, side * 0.27),
      new THREE9__namespace.Vector3(cx - a * 0.86, 0, side * b * 0.52)
    ]);
    const m = new THREE9__namespace.Mesh(new THREE9__namespace.TubeGeometry(beam2, 32, 0.034, 10, false), frameMaterial);
    m.scale.y = 1.4;
    group2.add(m);
  }
  const bridge = new THREE9__namespace.Mesh(
    new THREE9__namespace.TubeGeometry(
      new THREE9__namespace.QuadraticBezierCurve3(
        new THREE9__namespace.Vector3(1.26, 0, -0.29),
        new THREE9__namespace.Vector3(1.36, 0, 0),
        new THREE9__namespace.Vector3(1.26, 0, 0.29)
      ),
      24,
      0.03,
      8,
      false
    ),
    mat.accent
  );
  bridge.scale.y = 1.3;
  group2.add(bridge);
  const stringMaterial = chunk7OAMHGZK_cjs.lookMaterial("plastic", 15525586, { roughness: 0.6 });
  const strings = [];
  const innerA = a - 0.03, innerB = b - 0.03;
  for (let i = 0; i < 16; i++) {
    const z = -innerB * 0.92 + i * (innerB * 1.84) / 15;
    const half = innerA * Math.sqrt(Math.max(0, 1 - (z / innerB) ** 2));
    const x0 = Math.min(cx - half, i >= 6 && i <= 9 ? 1.3 : cx - half);
    strings.push(at((x0 + cx + half) / 2, 4e-3, z, 0, 0, Math.PI / 2, 1, cx + half - x0, 1));
  }
  for (let i = 0; i < 19; i++) {
    const x = cx - innerA * 0.93 + i * innerA * 1.86 / 18;
    const half = innerB * Math.sqrt(Math.max(0, 1 - ((x - cx) / innerA) ** 2));
    strings.push(at(x, -4e-3, 0, Math.PI / 2, 0, 0, 1, 2 * half, 1));
  }
  group2.add(instanced(new THREE9__namespace.CylinderGeometry(75e-4, 75e-4, 1, 5), stringMaterial, strings));
  const shaft = cylinder2(0.042, 0.3, frameMaterial, 0.68, 0, 0, 12);
  shaft.rotation.z = Math.PI / 2;
  shaft.scale.z = 1.35;
  group2.add(shaft);
  const gripMaterial = chunk7OAMHGZK_cjs.lookMaterial("rubber", 15657954, { roughness: 0.82, ...stipple(3, 0.6) });
  const grip = cylinder2(0.066, 0.58, gripMaterial, 0.27, 0, 0, 8);
  grip.rotation.z = Math.PI / 2;
  grip.rotation.x = Math.PI / 8;
  group2.add(grip);
  const wrap2 = [];
  for (let i = 0; i <= 200; i++) {
    const u = i / 200, angle = u * Math.PI * 2 * 9;
    wrap2.push(new THREE9__namespace.Vector3(0.02 + u * 0.52, Math.cos(angle) * 0.067, Math.sin(angle) * 0.067));
  }
  group2.add(
    new THREE9__namespace.Mesh(
      new THREE9__namespace.TubeGeometry(new THREE9__namespace.CatmullRomCurve3(wrap2), 400, 6e-3, 4, false),
      chunk7OAMHGZK_cjs.lookMaterial("rubber", 13815490)
    )
  );
  const cap = cylinder2(0.075, 0.05, frameMaterial, -0.015, 0, 0, 8);
  cap.rotation.z = Math.PI / 2;
  cap.rotation.x = Math.PI / 8;
  group2.add(cap);
  const collar = cylinder2(0.07, 0.04, mat.accent, 0.57, 0, 0, 16);
  collar.rotation.z = Math.PI / 2;
  group2.add(collar);
  return { group: group2, head: new THREE9__namespace.Vector3(cx, 0, 0) };
}
async function tennis(sourcePalette, edition = 0, modelUrl) {
  const palette2 = studioPalette(sourcePalette);
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/libs/meshopt_decoder.module.js')
  ]);
  const model = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl);
  const root = new THREE9__namespace.Group();
  const set = new THREE9__namespace.Group();
  set.rotation.y = -0.38;
  set.position.set(-0.1, 0, 0);
  root.add(set);
  const mat = studioMaterials(palette2);
  const feltColor = [14081866, 14672730, 13621576][edition];
  const felt = chunk7OAMHGZK_cjs.lookMaterial("felt", feltColor, { sheenColor: new THREE9__namespace.Color(16054212), grain: 2 });
  const seamMaterial = chunk7OAMHGZK_cjs.lookMaterial("rubber", 15987174, { roughness: 0.7 });
  const source = model.scene.getObjectByName("Tennis_ball") ?? model.scene.getObjectByName("Tennis ball");
  const makeBall = () => {
    const pivot2 = new THREE9__namespace.Group();
    if (!source) {
      pivot2.add(new THREE9__namespace.Mesh(new THREE9__namespace.SphereGeometry(BALL_R, 32, 20), felt));
      return pivot2;
    }
    const copy = source.clone(true);
    copy.position.set(0, 0, 0);
    copy.rotation.set(0, 0, 0);
    copy.scale.setScalar(1);
    copy.updateMatrixWorld(true);
    const bounds = new THREE9__namespace.Box3().setFromObject(copy);
    const size = bounds.getSize(new THREE9__namespace.Vector3());
    const scale = 2 * BALL_R / Math.max(size.x, size.y, size.z, 1e-6);
    copy.scale.setScalar(scale);
    copy.position.copy(bounds.getCenter(new THREE9__namespace.Vector3()).multiplyScalar(-scale));
    copy.traverse((item) => {
      const m = item;
      if (!m.isMesh) return;
      const name = (Array.isArray(m.material) ? m.material[0] : m.material).name;
      m.material = name === "Ball" ? felt : seamMaterial;
    });
    pivot2.add(copy);
    return pivot2;
  };
  const can = new THREE9__namespace.Group();
  const canR = 0.155, canL = 0.92, LIP = 0.012;
  can.position.set(1.1, FLOOR2 + canR + LIP, -0.15);
  can.rotation.y = 1.15;
  set.add(can);
  const body = new THREE9__namespace.Mesh(new THREE9__namespace.CylinderGeometry(canR, canR, canL, 40, 1, true), mat.aluminium);
  body.rotation.x = Math.PI / 2;
  can.add(body);
  const inside = new THREE9__namespace.Mesh(
    new THREE9__namespace.CylinderGeometry(canR - 8e-3, canR - 8e-3, canL, 40, 1, true),
    chunk7OAMHGZK_cjs.lookMaterial("plastic", 2040867, { side: THREE9__namespace.BackSide, roughness: 0.7 })
  );
  inside.rotation.x = Math.PI / 2;
  can.add(inside);
  const label2 = new THREE9__namespace.Mesh(new THREE9__namespace.CylinderGeometry(canR + 3e-3, canR + 3e-3, 0.42, 40, 1, true), mat.accent);
  label2.rotation.x = Math.PI / 2;
  label2.position.z = -0.05;
  label2.userData.receive = false;
  can.add(label2);
  const lid = cylinder2(canR + LIP, 0.05, mat.graphite, 0, 0, -canL / 2 - 0.02, 40);
  lid.rotation.x = Math.PI / 2;
  can.add(lid);
  const rim = new THREE9__namespace.Mesh(new THREE9__namespace.TorusGeometry(canR, LIP, 10, 40), mat.steel);
  rim.position.z = canL / 2;
  can.add(rim);
  const spare = makeBall();
  const rolled = new THREE9__namespace.Vector3(0.12, 0, canL / 2 + BALL_R + 0.08).applyEuler(can.rotation).add(can.position);
  spare.position.set(rolled.x, FLOOR2 + BALL_R, rolled.z);
  spare.rotation.set(1.2, 0.3, 0.6);
  set.add(spare);
  const { group: frame, head } = racket2(mat);
  frame.updateMatrixWorld(true);
  const points = [];
  frame.traverse((item) => {
    const m = item;
    if (!m.isMesh || m.isInstancedMesh) return;
    const position = m.geometry.attributes.position;
    const step = Math.max(1, Math.floor(position.count / 1200));
    for (let i = 0; i < position.count; i += step)
      points.push(new THREE9__namespace.Vector3().fromBufferAttribute(position, i).applyMatrix4(m.matrixWorld));
  });
  const pivot = new THREE9__namespace.Group();
  pivot.position.set(-1.45, 0, 0.25);
  pivot.rotation.y = 0.18;
  set.add(pivot);
  pivot.add(frame);
  can.updateMatrix();
  const intoCan = can.matrix.clone().invert();
  const tiltMatrix = new THREE9__namespace.Matrix4(), placed2 = new THREE9__namespace.Matrix4(), probe = new THREE9__namespace.Vector3();
  const reach = canR + LIP + 4e-3;
  let tilt = -0.08, lowest = new THREE9__namespace.Vector3();
  for (; tilt < 0.6; tilt += 15e-4) {
    tiltMatrix.makeRotationZ(tilt);
    let low = Infinity;
    for (const q of points) {
      probe.copy(q).applyMatrix4(tiltMatrix);
      if (probe.y < low) {
        low = probe.y;
        lowest = q;
      }
    }
    pivot.position.y = FLOOR2 - low;
    pivot.updateMatrix();
    placed2.multiplyMatrices(pivot.matrix, tiltMatrix);
    if (lowest.x > 0.4) continue;
    const inside2 = points.some((q) => {
      probe.copy(q).applyMatrix4(placed2).applyMatrix4(intoCan);
      return Math.abs(probe.z) < canL / 2 + 0.03 && probe.x * probe.x + probe.y * probe.y < reach * reach;
    });
    if (!inside2) break;
  }
  frame.rotation.z = tilt;
  const ball = makeBall();
  set.add(ball);
  const racketContact = head.clone().add(new THREE9__namespace.Vector3(0, BALL_R, 0));
  frame.updateMatrix();
  pivot.updateMatrix();
  const contact2 = racketContact.clone().applyMatrix4(frame.matrix).applyMatrix4(pivot.matrix);
  const blob2 = (width, depth, x, z, angle = 0, opacity = 0.5) => {
    const shadow = chunk7OAMHGZK_cjs.contactShadow(width, depth, { x, y: FLOOR2 + 3e-3, z, opacity });
    shadow.rotation.z = angle;
    set.add(shadow);
  };
  blob2(canR * 3, canL * 1.2, can.position.x, can.position.z, can.rotation.y, 0.55);
  blob2(BALL_R * 3.2, BALL_R * 3.2, spare.position.x, spare.position.z, 0, 0.6);
  const butt = new THREE9__namespace.Vector3(0.1, 0, 0).applyMatrix4(frame.matrix).applyMatrix4(pivot.matrix);
  blob2(0.6, 0.3, butt.x, butt.z, pivot.rotation.y + Math.PI / 2, 0.45);
  model.scene.traverse((item) => {
    const m = item;
    if (!m.isMesh) return;
    m.geometry.dispose();
    for (const material of Array.isArray(m.material) ? m.material : [m.material]) material.dispose();
  });
  const LOOP = 6e3, BOUNCE = 3e3, FIRST = 1900, APEX = 1.05;
  root.userData.source = "blender";
  root.userData.contactTime = FIRST;
  root.userData.contactTimes = [FIRST, FIRST + BOUNCE];
  root.userData.rackets = [frame, frame];
  root.userData.racketContact = racketContact;
  root.userData.loopDuration = LOOP;
  root.userData.restTime = FIRST + 760;
  root.userData.ball = ball;
  root.userData.racket = frame;
  root.userData.animate = (time) => {
    const t = wrap(time, LOOP);
    turntable(set, -0.38, t, LOOP, 0.1);
    const s = wrap(t - FIRST, BOUNCE);
    const u = s / BOUNCE;
    ball.position.set(contact2.x, contact2.y + APEX * 4 * u * (1 - u), contact2.z);
    const near = Math.min(s, BOUNCE - s);
    const squash = Math.max(0, 1 - near / 70) ** 2;
    ball.scale.set(1 + 0.12 * squash, 1 - 0.2 * squash, 1 + 0.12 * squash);
    ball.rotation.set(t / LOOP * Math.PI * 4, 0.5, t / LOOP * Math.PI * 2);
    frame.rotation.z = tilt + 0.012 * Math.sin(s / 22) ** 2 * Math.exp(-s / 110);
    root.userData.phase = u < 0.5 ? "rise" : "fall";
    root.userData.pose = t / LOOP;
  };
  return finish(root, palette2, { pitch: 10, fov: 30, fill: 0.8 }, { contactShadow: false });
}
function trading(sourcePalette, edition = 0) {
  const palette2 = studioPalette(sourcePalette);
  const root = new THREE9__namespace.Group();
  const desk = new THREE9__namespace.Group();
  desk.rotation.y = 0.42;
  root.add(desk);
  const mat = studioMaterials(palette2);
  const COLS = 12, PITCH = 0.27, baseTop = FLOOR2 + 0.34, railY = 1.08;
  const span = (COLS - 1) * PITCH;
  desk.add(box2(span + 0.62, 0.3, 0.86, mat.graphite, 0, FLOOR2 + 0.15, 0, 0.07));
  desk.add(box2(span + 0.5, 0.04, 0.74, mat.aluminium, 0, FLOOR2 + 0.32, 0, 0.02));
  const frameParts = [-1, 1].map(
    (side) => box2(0.08, railY - baseTop + 0.05, 0.12, mat.aluminium, side * (span / 2 + 0.2), (railY + baseTop) / 2, 0, 0.025)
  );
  frameParts.push(box2(span + 0.48, 0.08, 0.12, mat.aluminium, 0, railY, 0, 0.025));
  for (const part of frameParts) {
    part.userData.receive = false;
    desk.add(part);
  }
  const rods = Array.from(
    { length: COLS },
    (_, i) => at(-span / 2 + i * PITCH, (railY + baseTop) / 2, 0, 0, 0, 0, 1, railY - baseTop, 1)
  );
  const rodMesh = instanced(new THREE9__namespace.CylinderGeometry(0.014, 0.014, 1, 8), mat.steel, rods);
  rodMesh.userData.receive = false;
  desk.add(rodMesh);
  const wickMaterial = chunk7OAMHGZK_cjs.lookMaterial("metal", 7172720, { roughness: 0.28 });
  const wicks = instanced(new THREE9__namespace.CylinderGeometry(0.034, 0.034, 1, 12), wickMaterial, rods);
  const bodyMaterial = chunk7OAMHGZK_cjs.lookMaterial("ceramic", 16777215, { roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  const bodies = instanced(new THREE9__namespace.CylinderGeometry(0.108, 0.108, 1, 28), bodyMaterial, rods);
  const up = new THREE9__namespace.Color(palette2.accent), down = new THREE9__namespace.Color(GRAPHITE);
  for (let i = 0; i < COLS; i++) bodies.setColorAt(i, up);
  desk.add(wicks, bodies);
  const leds = [glow(AMBER, 0), glow(palette2.accent, 1.4), glow(palette2.accent, 0)];
  leds.forEach((material, i) => {
    const led = cylinder2(0.028, 0.02, material, span / 2 - 0.36 + i * 0.13, FLOOR2 + 0.2, 0.431, 16);
    led.rotation.x = Math.PI / 2;
    led.userData.glow = true;
    desk.add(led);
  });
  desk.add(box2(span - 0.3, 0.012, 0.01, mat.aluminium, -0.42, FLOOR2 + 0.2, 0.432, 4e-3));
  const low = 97.2, high = 102.8;
  const y = (price) => chunkSDBNPDW6_cjs.lerp(baseTop + 0.1, railY - 0.1, (price - low) / (high - low));
  const scratch = new THREE9__namespace.Matrix4();
  const colour = new THREE9__namespace.Color();
  root.userData.loopDuration = MARKET_LOOP_MS;
  root.userData.restTime = 3600;
  root.userData.marketBar = (index) => marketBar(index, edition);
  root.userData.animate = (time) => {
    const t = wrap(time, MARKET_LOOP_MS);
    turntable(desk, 0.42, t, MARKET_LOOP_MS, 0.12);
    const offset = t / MARKET_BAR_MS, first = Math.floor(offset), fraction = offset - first;
    const tick = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.clamp((fraction - 0.66) / 0.3));
    for (let i = 0; i < COLS; i++) {
      const from = marketBar(first - (COLS - 1) + i, edition), to = marketBar(first - (COLS - 2) + i, edition);
      const o = chunkSDBNPDW6_cjs.lerp(from.open, to.open, tick), c = chunkSDBNPDW6_cjs.lerp(from.close, to.close, tick), h = chunkSDBNPDW6_cjs.lerp(from.high, to.high, tick), l = chunkSDBNPDW6_cjs.lerp(from.low, to.low, tick);
      const x = -span / 2 + i * PITCH;
      wicks.setMatrixAt(
        i,
        scratch.compose(
          new THREE9__namespace.Vector3(x, (y(h) + y(l)) / 2, 0),
          new THREE9__namespace.Quaternion(),
          new THREE9__namespace.Vector3(1, Math.max(0.02, y(h) - y(l)), 1)
        )
      );
      bodies.setMatrixAt(
        i,
        scratch.compose(
          new THREE9__namespace.Vector3(x, (y(o) + y(c)) / 2, 0),
          new THREE9__namespace.Quaternion(),
          new THREE9__namespace.Vector3(1, Math.max(0.035, Math.abs(y(o) - y(c))), 1)
        )
      );
      const rising = (tick < 0.5 ? from : to).close >= (tick < 0.5 ? from : to).open;
      bodies.setColorAt(i, colour.copy(rising ? up : down));
    }
    wicks.instanceMatrix.needsUpdate = true;
    bodies.instanceMatrix.needsUpdate = true;
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    const latest = marketBar(first + (tick > 0.5 ? 1 : 0), edition);
    leds[0].emissiveIntensity = 2.4 * Math.sin(Math.PI * chunkSDBNPDW6_cjs.clamp((fraction - 0.66) / 0.3));
    leds[2].emissiveIntensity = latest.close >= latest.open ? 1.8 : 0.15;
    root.userData.phase = "market-pan";
    root.userData.pose = t / MARKET_LOOP_MS;
    root.userData.scroll = offset;
  };
  return finish(root, palette2, { pitch: 19, fov: 30, fill: 0.74, maxWidth: 0.92 });
}
function server(sourcePalette) {
  const palette2 = studioPalette(sourcePalette);
  const root = new THREE9__namespace.Group();
  const rack = new THREE9__namespace.Group();
  rack.rotation.y = -0.55;
  root.add(rack);
  const mat = studioMaterials(palette2);
  const W = 2.9, D = 1.45, H = 2.42;
  const bottom = FLOOR2;
  rack.add(box2(W + 0.12, 0.1, D + 0.1, mat.graphite, 0, bottom + 0.05, 0, 0.04));
  rack.add(box2(W + 0.12, 0.07, D + 0.1, mat.graphite, 0, bottom + H - 0.035, 0, 0.03));
  for (const x of [-W / 2, W / 2])
    for (const z of [-D / 2, D / 2]) {
      const post = box2(0.09, H - 0.17, 0.09, mat.aluminium, x, bottom + H / 2, z, 0.02);
      post.userData.receive = false;
      rack.add(post);
    }
  for (const x of [-W / 2 + 0.15, W / 2 - 0.15])
    for (const z of [-D / 2 + 0.1, D / 2 - 0.1]) rack.add(cylinder2(0.06, 0.03, mat.rubber, x, bottom - 5e-3, z, 16));
  const units = [], fans = [];
  const ledMaterial = new THREE9__namespace.MeshBasicMaterial({ color: 16777215, toneMapped: false });
  const ledMatrices = [];
  const ledColours = [];
  const ledUnit = [];
  const unitH = 0.64, front = D / 2 - 0.02;
  const portMaterial = chunk7OAMHGZK_cjs.lookMaterial("plastic", 1185045, { roughness: 0.6 });
  const brushed = chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("brushedMetal", ALUMINIUM, { roughness: 0.4, anisotropy: 0.85, ...brushedGrain() }), {
    dark: { color: 10725796, roughness: 0.46 }
  });
  const anodised = chunk7OAMHGZK_cjs.lookMaterial("brushedMetal", palette2.accent, { roughness: 0.42, anisotropy: 0.8, ...brushedGrain() });
  for (let i = 0; i < 3; i++) {
    const unit = new THREE9__namespace.Group();
    const cy = bottom + 0.18 + unitH / 2 + (2 - i) * (unitH + 0.1);
    unit.userData.y = cy;
    unit.position.y = cy;
    rack.add(unit);
    units.push(unit);
    unit.add(box2(W - 0.14, unitH, D - 0.1, mat.graphite, 0, 0, -0.03, 0.03));
    for (const side of [-1, 1]) {
      unit.add(box2(0.12, unitH - 0.04, 0.03, mat.satin, side * (W / 2 - 0.02), 0, front + 0.01, 0.012));
      for (const sy of [-0.19, 0.19]) {
        const screw = cylinder2(0.024, 0.02, mat.steel, side * (W / 2 - 0.02), sy, front + 0.03, 12);
        screw.rotation.x = Math.PI / 2;
        unit.add(screw);
      }
    }
    const bezel = i === 1 ? anodised : brushed;
    unit.add(box2(W - 0.2, unitH - 0.06, 0.04, bezel, 0, 0, front, 0.02));
    if (i === 0) {
      const sledGeometry = new RoundedBoxGeometry_js.RoundedBoxGeometry(0.36, 0.44, 0.04, 2, 0.015);
      const sleds = [], bars = [];
      for (let n = 0; n < 6; n++) {
        const x = -1 + n * 0.4;
        sleds.push(at(x, 0, front + 0.035));
        bars.push(at(x, -0.13, front + 0.065));
        ledMatrices.push(at(x + 0.12, 0.15, front + 0.058));
        ledColours.push(n === 3 ? AMBER : palette2.accent);
        ledUnit.push(i);
      }
      unit.add(instanced(sledGeometry, mat.graphite, sleds));
      unit.add(instanced(new RoundedBoxGeometry_js.RoundedBoxGeometry(0.24, 0.035, 0.03, 2, 0.012), mat.steel, bars));
    } else if (i === 1) {
      for (const x of [-0.72, 0, 0.72]) {
        unit.add(turned(cylinder2(0.24, 0.02, chunk7OAMHGZK_cjs.lookMaterial("plastic", 1119252, { roughness: 0.7 }), x, 0, front + 0.012, 40)));
        const blades = [];
        for (let n = 0; n < 7; n++) {
          const blade = new THREE9__namespace.BoxGeometry(0.075, 0.17, 0.012);
          blade.translate(0, 0.12, 0);
          blade.rotateY(0.45);
          blade.rotateZ(n * Math.PI * 2 / 7);
          blades.push(blade);
        }
        const hub = new THREE9__namespace.CylinderGeometry(0.06, 0.06, 0.03, 20);
        hub.rotateX(Math.PI / 2);
        blades.push(hub);
        const fan = new THREE9__namespace.Mesh(BufferGeometryUtils_js.mergeGeometries(blades), mat.graphite);
        fan.position.set(x, 0, front + 0.03);
        unit.add(fan);
        fans.push(fan);
        const guard = [0.235, 0.16, 0.085].map((r) => new THREE9__namespace.TorusGeometry(r, 0.012, 6, 40));
        for (const angle of [0, Math.PI / 2]) {
          const spoke = new THREE9__namespace.CylinderGeometry(0.011, 0.011, 0.47, 6);
          spoke.rotateZ(angle);
          guard.push(spoke);
        }
        const guardMesh = new THREE9__namespace.Mesh(BufferGeometryUtils_js.mergeGeometries(guard), mat.steel);
        guardMesh.position.set(x, 0, front + 0.07);
        unit.add(guardMesh);
      }
      const holes = [];
      for (const side of [-1, 1])
        for (let r = 0; r < 5; r++)
          for (let c = 0; c < 2; c++) holes.push(at(side * (1.18 + c * 0.08), -0.2 + r * 0.1, front + 0.021, Math.PI / 2));
      unit.add(instanced(new THREE9__namespace.CylinderGeometry(0.022, 0.022, 6e-3, 10), portMaterial, holes));
      for (const x of [-1.18, 1.18]) {
        ledMatrices.push(at(x + 0.04, 0.23, front + 0.026));
        ledColours.push(palette2.accent);
        ledUnit.push(i);
      }
    } else {
      const ports = [];
      for (let r = 0; r < 2; r++)
        for (let n = 0; n < 8; n++) {
          const x = -0.98 + n * 0.25, y = -0.1 + r * 0.2;
          ports.push(at(x, y, front + 0.02));
          ledMatrices.push(at(x + 0.112, y + 0.05, front + 0.026));
          ledColours.push((n + r) % 3 === 0 ? AMBER : palette2.accent);
          ledUnit.push(i);
        }
      const shroud = chunk7OAMHGZK_cjs.lookMaterial("metal", 8225407, { roughness: 0.38 });
      const DEPTH = 0.065, OW = 0.17, OH = 0.14, WALL = 0.018;
      const along = (dx, dy) => ports.map((m) => m.clone().multiply(at(dx, dy, DEPTH / 2)));
      unit.add(
        instanced(new THREE9__namespace.BoxGeometry(OW, WALL, DEPTH), shroud, [...along(0, (OH - WALL) / 2), ...along(0, -0.12200000000000001 / 2)]),
        instanced(new THREE9__namespace.BoxGeometry(WALL, OH - 2 * WALL, DEPTH), shroud, [
          ...along((OW - WALL) / 2, 0),
          ...along(-0.15200000000000002 / 2, 0)
        ]),
        instanced(
          new THREE9__namespace.BoxGeometry(OW - 2 * WALL, OH - 2 * WALL, 6e-3),
          portMaterial,
          along(0, 0).map((m) => m.multiply(at(0, 0, -DEPTH / 2 + 4e-3)))
        ),
        instanced(
          new THREE9__namespace.BoxGeometry(0.09, 0.014, 0.012),
          chunk7OAMHGZK_cjs.lookMaterial("metal", 13804874, { roughness: 0.3 }),
          along(0, 0).map((m) => m.multiply(at(0, (OH - 2 * WALL) / 2 - 0.012, -DEPTH / 2 + 0.014)))
        )
      );
      const cables = [
        {
          from: [-0.98, -0.1],
          to: [-0.48, -0.1],
          material: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("rubber", palette2.accent, { roughness: 0.75 }), {})
        },
        { from: [0.02, 0.1], to: [0.77, -0.1], material: chunk7OAMHGZK_cjs.lookMaterial("rubber", AMBER, { roughness: 0.75 }) }
      ];
      for (const { from, to, material } of cables) {
        const curve = new THREE9__namespace.CatmullRomCurve3([
          new THREE9__namespace.Vector3(from[0], from[1], front + 0.12),
          new THREE9__namespace.Vector3(from[0], from[1] - 0.12, front + 0.28),
          new THREE9__namespace.Vector3((from[0] + to[0]) / 2, -0.4, front + 0.4),
          new THREE9__namespace.Vector3(to[0], to[1] - 0.12, front + 0.28),
          new THREE9__namespace.Vector3(to[0], to[1], front + 0.12)
        ]);
        unit.add(new THREE9__namespace.Mesh(new THREE9__namespace.TubeGeometry(curve, 48, 0.032, 10, false), material));
        for (const end of [from, to]) unit.add(box2(0.122, 0.096, 0.12, material, end[0], end[1], front + 0.09, 0.022));
      }
    }
  }
  const ledMesh = new THREE9__namespace.InstancedMesh(new THREE9__namespace.SphereGeometry(0.022, 10, 8), ledMaterial, ledMatrices.length);
  ledMesh.userData.glow = true;
  const unitOf = (n) => units[ledUnit[n]];
  const ledColour = new THREE9__namespace.Color();
  const off = new THREE9__namespace.Color(1711902);
  root.add(ledMesh);
  ledMesh.frustumCulled = false;
  const ledScratch = new THREE9__namespace.Matrix4();
  const LOOP = 8e3;
  const power = (t) => 1 - envelope2(t, 1e3, 1400, 5e3, 5600);
  const pull = (t) => envelope2(t, 1400, 2600, 3800, 5e3);
  const STEP = 10, spin = [0];
  for (let t = STEP; t <= LOOP; t += STEP) spin.push(spin[spin.length - 1] + power(t - STEP / 2) * STEP);
  const turns = Math.PI * 2 * Math.round(spin[spin.length - 1] / LOOP * 8);
  const fanAngle = (t) => {
    const i = Math.min(spin.length - 2, Math.floor(t / STEP));
    return chunkSDBNPDW6_cjs.lerp(spin[i], spin[i + 1], t / STEP - i) / spin[spin.length - 1] * turns;
  };
  const colourOf = ledColours.map((c) => new THREE9__namespace.Color(c).multiplyScalar(1.25));
  root.userData.loopDuration = LOOP;
  root.userData.restTime = 600;
  root.userData.animate = (time) => {
    const t = wrap(time, LOOP);
    turntable(rack, -0.55, t, LOOP, 0.12);
    const on = power(t), out = pull(t);
    units.forEach((unit, i) => {
      unit.position.z = i === 1 ? 0.62 * out : 0;
      unit.position.y = unit.userData.y + (i === 1 ? 0.012 * Math.sin(out * Math.PI) : 0);
    });
    const angle = fanAngle(t);
    fans.forEach((fan, i) => fan.rotation.z = -(angle + i * 0.6));
    rack.updateMatrix();
    ledMatrices.forEach((matrix, n) => {
      unitOf(n).updateMatrix();
      ledMesh.setMatrixAt(n, ledScratch.multiplyMatrices(rack.matrix, unitOf(n).matrix).multiply(matrix));
      const unit = ledUnit[n];
      const phaseN = t / LOOP * Math.PI * 2;
      const lit = unit === 1 ? on : unit === 0 ? 0.55 + 0.45 * Math.sin(phaseN * (6 + n) + n * 1.7) : 0.65 + 0.35 * Math.sin(phaseN * (11 + n % 4) + n);
      ledMesh.setColorAt(n, ledColour.copy(off).lerp(colourOf[n], lit));
    });
    ledMesh.instanceMatrix.needsUpdate = true;
    if (ledMesh.instanceColor) ledMesh.instanceColor.needsUpdate = true;
    ledMesh.computeBoundingBox();
    root.userData.phase = t < 1400 ? "running" : t < 2600 ? "pull-compute" : t < 3800 ? "hot-swap" : t < 5e3 ? "seat-compute" : "power-up";
    root.userData.pose = t / LOOP;
  };
  return finish(root, palette2, { pitch: 5, fov: 32, fill: 0.8 });
}
function atlasPrint(edition) {
  const W = 3072, H = 2048;
  const atlas = document.createElement("canvas");
  atlas.width = W;
  atlas.height = H;
  const ctx = atlas.getContext("2d");
  const looks = [
    {
      land: 15854294,
      contour: 11044444,
      water: 8238792,
      shore: 4884384,
      wood: 11915154,
      woodEdge: 8232290,
      road: 16776435,
      casing: 9072469,
      main: 15246141
    },
    {
      land: 15789279,
      contour: 11117966,
      water: 8829394,
      shore: 5212328,
      wood: 13359808,
      woodEdge: 9415050,
      road: 16776694,
      casing: 8221540,
      main: 14251082
    },
    {
      land: 15853265,
      contour: 12556911,
      water: 10733250,
      shore: 6986390,
      wood: 14471078,
      woodEdge: 11573864,
      road: 16775920,
      casing: 9202252,
      main: 12735807
    }
  ];
  const look = looks[edition];
  const blob2 = (cx, cy, r, seed) => {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = i / 48 * Math.PI * 2;
      const k = r * (1 + 0.22 * Math.sin(a * 3 + seed) + 0.12 * Math.sin(a * 5 + seed * 1.7));
      const x = cx + Math.cos(a) * k * 1.25, y = cy + Math.sin(a) * k;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  };
  const line2 = (points) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.stroke();
  };
  const wave = (from, to, step, f) => {
    const points = [];
    for (let t = from; t <= to; t += step) points.push(f(t));
    return points;
  };
  ctx.fillStyle = css(look.land);
  ctx.fillRect(0, 0, W, H);
  const woods = [
    [420, 420, 210],
    [1500, 1560, 260],
    [2560, 520, 200],
    [2350, 1700, 170],
    [900, 1500, 130]
  ];
  woods.forEach(([x, y, r], n) => {
    blob2(x, y, r, n * 1.9 + edition);
    ctx.fillStyle = css(look.wood);
    ctx.fill?.();
    ctx.lineWidth = 5;
    ctx.strokeStyle = css(look.woodEdge);
    ctx.stroke();
  });
  ctx.strokeStyle = css(look.contour);
  for (const [cx, cy, rings] of [
    [1100, 700, 9],
    [2250, 1150, 7]
  ])
    for (let n = 1; n <= rings; n++) {
      ctx.lineWidth = n % 5 === 0 ? 6 : 3;
      ctx.globalAlpha = n % 5 === 0 ? 0.95 : 0.75;
      blob2(cx, cy, n * 62, cx * 0.01 + n * 0.08);
      ctx.stroke();
    }
  ctx.globalAlpha = 1;
  const river = wave(-40, H + 40, 16, (y) => [1980 + 160 * Math.sin(y / 300 + edition) + y * 0.12, y]);
  ctx.strokeStyle = css(look.shore);
  ctx.lineWidth = 50;
  line2(river);
  ctx.strokeStyle = css(look.water);
  ctx.lineWidth = 40;
  line2(river);
  blob2(640, 1540, 190, 2 + edition);
  ctx.fillStyle = css(look.water);
  ctx.fill?.();
  ctx.lineWidth = 6;
  ctx.strokeStyle = css(look.shore);
  ctx.stroke();
  const roads = [0, 1, 2].map(
    (r) => wave(-40, W + 40, 16, (x) => [x, 380 + r * 640 + 90 * Math.sin(x / 420 + r * 1.3)])
  );
  roads.forEach((road, r) => {
    ctx.strokeStyle = css(look.casing);
    ctx.lineWidth = r === 1 ? 30 : 22;
    line2(road);
    ctx.strokeStyle = css(r === 1 ? look.main : look.road);
    ctx.lineWidth = r === 1 ? 20 : 13;
    line2(road);
  });
  ctx.strokeStyle = css(7311008);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2.5;
  for (let x = 256; x < W; x += 256)
    line2([
      [x, 0],
      [x, H]
    ]);
  for (let y = 256; y < H; y += 256)
    line2([
      [0, y],
      [W, y]
    ]);
  ctx.globalAlpha = 1;
  ctx.fillStyle = css(16513264);
  ctx.fillRect(0, 0, W, 56);
  ctx.fillRect(0, H - 56, W, 56);
  ctx.fillRect(0, 0, 56, H);
  ctx.fillRect(W - 56, 0, 56, H);
  ctx.strokeStyle = css(4868674);
  ctx.lineWidth = 4;
  ctx.strokeRect?.(56, 56, W - 112, H - 112);
  for (const x of [W / 3, 2 * W / 3]) {
    const crease = ctx.createLinearGradient?.(x - 70, 0, x + 70, 0);
    if (crease) {
      crease.addColorStop(0, "rgba(80,72,58,0)");
      crease.addColorStop(0.42, "rgba(80,72,58,0.22)");
      crease.addColorStop(0.5, "rgba(80,72,58,0.06)");
      crease.addColorStop(0.58, "rgba(80,72,58,0.22)");
      crease.addColorStop(1, "rgba(80,72,58,0)");
      ctx.fillStyle = crease;
      ctx.fillRect(x - 70, 0, 140, H);
    }
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = css(16776434);
    ctx.fillRect(x - 2, 0, 4, H);
    ctx.globalAlpha = 1;
  }
  const texture = new THREE9__namespace.CanvasTexture(atlas);
  texture.colorSpace = THREE9__namespace.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
function travel(sourcePalette, edition = 0) {
  const palette2 = studioPalette(sourcePalette);
  const root = new THREE9__namespace.Group();
  const stage = new THREE9__namespace.Group();
  stage.rotation.y = -0.38;
  stage.position.set(0.05, FLOOR2, 0.15);
  root.add(stage);
  const map = new THREE9__namespace.Group();
  stage.add(map);
  const mat = studioMaterials(palette2);
  const PW = 1.23, PH = 2.45, T = 0.014;
  const HINGE = new THREE9__namespace.Vector3(0, T / 2, 0.55);
  const STAND = Math.PI - 0.96;
  const texture = atlasPrint(edition);
  const routes = [
    [
      [-1.6, -0.8],
      [-1, -0.35],
      [-0.4, 0.3],
      [0.25, 0.42],
      [0.85, 0.1],
      [1.55, 0.7]
    ],
    [
      [-1.55, -0.9],
      [-0.95, -0.1],
      [-0.3, -0.3],
      [0.3, 0.35],
      [0.8, 0.75],
      [1.5, 0.6]
    ],
    [
      [-1.6, -0.6],
      [-1.05, 0.15],
      [-0.45, 0.65],
      [0.1, 0.25],
      [0.75, 0.5],
      [1.5, 0.85]
    ]
  ][edition];
  const flat = new THREE9__namespace.CatmullRomCurve3(
    routes.map(([x, y]) => new THREE9__namespace.Vector3(-1.5 + (x + 1.6) / 3.15 * 1.9, y * 0.72, 0))
  );
  const flatPoints = flat.getSpacedPoints(240);
  const panelOf = (x) => x < -PW / 2 ? 0 : x > PW / 2 ? 2 : 1;
  const toLocal = (p, panel) => new THREE9__namespace.Vector3(p.x - (panel - 1) * (PW / 2), p.y, T / 2 + 6e-3);
  const routeMaterial = chunk7OAMHGZK_cjs.lookMaterial("plastic", palette2.accent, { roughness: 0.5 });
  const folds = [];
  const pieces = [];
  for (let i = 0; i < 3; i++) {
    const fold = new THREE9__namespace.Group();
    fold.position.x = i === 0 ? -PW / 2 : i === 2 ? PW / 2 : 0;
    const center = i === 0 ? -PW / 2 : i === 2 ? PW / 2 : 0;
    const sheet = new THREE9__namespace.BoxGeometry(PW, PH, T, 1, 1, 1);
    const uv = sheet.attributes.uv;
    for (let n = 16; n < 20; n++) uv.setX(n, (uv.getX(n) + i) / 3);
    const print = printed({ map: texture, roughness: 0.86 });
    const panel = new THREE9__namespace.Mesh(sheet, [mat.paper, mat.paper, mat.paper, mat.paper, print, mat.paper]);
    panel.position.x = center;
    fold.add(panel);
    const indices = flatPoints.map((p, n) => panelOf(p.x) === i ? n : -1).filter((n) => n >= 0);
    if (indices.length > 1) {
      const from = Math.max(0, indices[0] - 1), to = Math.min(flatPoints.length - 1, indices[indices.length - 1] + 1);
      const local = flatPoints.slice(from, to + 1).map((p) => toLocal(p, i));
      const clipX = (p) => p.x = chunkSDBNPDW6_cjs.clamp(p.x, i === 0 ? -PW : -PW / 2, i === 2 ? PW : i === 0 ? 0 : PW / 2);
      local.forEach(clipX);
      const mesh3 = new THREE9__namespace.Mesh(
        new THREE9__namespace.TubeGeometry(new THREE9__namespace.CatmullRomCurve3(local), local.length * 2, 0.019, 6, false),
        routeMaterial
      );
      mesh3.userData.cast = false;
      fold.add(mesh3);
      pieces.push({ mesh: mesh3, from: from / (flatPoints.length - 1), to: to / (flatPoints.length - 1) });
    }
    folds.push(fold);
    map.add(fold);
  }
  const valley = chunk7OAMHGZK_cjs.contactShadow(PH * 1.04, 0.3, { x: 0, y: 2e-3, z: HINGE.z - 0.05, opacity: 0.55 });
  stage.add(valley);
  const propLine = chunk7OAMHGZK_cjs.contactShadow(PH * 1.04, 0.26, { x: 0, y: 2e-3, z: HINGE.z + 2 * PW * Math.cos(STAND), opacity: 0 });
  stage.add(propLine);
  const propMaterial = propLine.material;
  const pin = (color) => {
    const group2 = new THREE9__namespace.Group();
    const needle = chunk7OAMHGZK_cjs.lookMaterial("metal", 15132901, { roughness: 0.08, transparent: true });
    const head = chunk7OAMHGZK_cjs.lookMaterial("ceramic", color, { roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true });
    group2.userData.materials = [needle, head];
    group2.add(turned(cylinder2(0.011, 0.11, needle, 0, 0, 0.05, 8)));
    const collar = cylinder2(0.045, 0.04, head, 0, 0, 0.1, 20);
    collar.rotation.x = Math.PI / 2;
    group2.add(collar);
    const cap = new THREE9__namespace.Mesh(new THREE9__namespace.SphereGeometry(0.085, 24, 16), head);
    cap.position.z = 0.16;
    group2.add(cap);
    const seat = chunk7OAMHGZK_cjs.contactShadow(0.2, 0.2, { x: 0.025, y: -0.025, z: T / 2 + 2e-3, opacity: 0.55 });
    seat.rotation.x = 0;
    group2.add(seat);
    group2.userData.seat = seat;
    map.add(group2);
    return group2;
  };
  const start = pin(GRAPHITE);
  const traveller = pin(palette2.accent);
  const place = (object, u, lift, fade = 1) => {
    object.visible = fade > 1e-3;
    for (const material of object.userData.materials) material.opacity = fade;
    const p = flat.getPointAt(chunkSDBNPDW6_cjs.clamp(u));
    const panel = panelOf(p.x);
    const fold = folds[panel];
    fold.updateMatrix();
    object.position.copy(toLocal(p, panel).setZ(lift).applyMatrix4(fold.matrix));
    object.quaternion.copy(fold.quaternion);
    const seat = object.userData.seat;
    seat.position.z = T / 2 + 2e-3 - lift;
    seat.material.opacity = 0.55 * chunkSDBNPDW6_cjs.clamp(1 - lift / 0.12) * fade;
  };
  const basis = new THREE9__namespace.Matrix4();
  const xAxis = new THREE9__namespace.Vector3(), yAxis = new THREE9__namespace.Vector3(-1, 0, 0), zAxis = new THREE9__namespace.Vector3();
  const pose = (phi) => {
    xAxis.set(0, Math.sin(phi), Math.cos(phi));
    zAxis.set(0, -Math.cos(phi), Math.sin(phi));
    map.quaternion.setFromRotationMatrix(basis.makeBasis(xAxis, yAxis, zAxis));
    map.position.copy(HINGE).addScaledVector(xAxis, PW / 2);
    folds[0].rotation.y = Math.PI - phi;
    folds[2].rotation.y = Math.min(Math.PI - 0.03, 2 * (Math.PI - phi));
  };
  root.userData.mapFolds = folds;
  const LOOP = 1e4;
  root.userData.loopDuration = LOOP;
  root.userData.restTime = 6e3;
  root.userData.animate = (time) => {
    const t = wrap(time, LOOP);
    turntable(stage, -0.38, t, LOOP, 0.12);
    const lift = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 150, 1650)) * (1 - chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 8400, 9800)));
    pose(chunkSDBNPDW6_cjs.lerp(0.04, STAND, lift));
    propMaterial.opacity = 0.5 * envelope2(t, 1350, 1650, 8400, 8700);
    const draw = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 1700, 4650)) * (1 - chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 7700, 8400)));
    for (const { mesh: mesh3, from, to } of pieces) {
      const share = chunkSDBNPDW6_cjs.clamp((draw - from) / (to - from));
      const count = mesh3.geometry.index.count;
      mesh3.geometry.setDrawRange(0, Math.floor(share * count / 6) * 6);
      mesh3.visible = share > 0;
    }
    const fade = envelope2(t, 1650, 1900, 7300, 7700);
    const pull = 0.25 * chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 7200, 7700));
    place(start, 0, chunkSDBNPDW6_cjs.lerp(0.09, 0, chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 1650, 1950))) + pull, fade);
    const push = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 4650, 5100));
    place(traveller, draw, chunkSDBNPDW6_cjs.lerp(0.09, 0, push) + pull, fade);
    root.userData.phase = t < 1650 ? "unfold-map" : t < 4650 ? "draw-route" : t < 7200 ? "arrive" : "fold-map";
    root.userData.pose = t / LOOP;
  };
  return finish(root, palette2, { pitch: 24, fov: 30, fill: 0.8 }, { contactShadow: false });
}

// src/package-assets.ts
function tennisModelUrl() {
  throw new Error("uipack: the CommonJS build cannot locate assets/objects/tennis-return.glb; pass modelUrl");
}

// src/objects/scenes.ts
var DURATION = 5400;
var matteMaterial = (color) => new THREE9__namespace.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04 });
var mesh2 = (geometry, color, x = 0, y = 0, z = 0) => {
  const placed2 = new THREE9__namespace.Mesh(geometry, matteMaterial(color));
  placed2.position.set(x, y, z);
  return placed2;
};
function slab2(width, height, depth, color, x = 0, y = 0, z = 0, radius = 0.06) {
  const r = Math.min(radius, width / 2, height / 2);
  const outline = new THREE9__namespace.Shape();
  const left = -width / 2, bottom = -height / 2;
  const right = left + width, top = bottom + height;
  outline.moveTo(left + r, bottom);
  outline.lineTo(right - r, bottom);
  outline.quadraticCurveTo(right, bottom, right, bottom + r);
  outline.lineTo(right, top - r);
  outline.quadraticCurveTo(right, top, right - r, top);
  outline.lineTo(left + r, top);
  outline.quadraticCurveTo(left, top, left, top - r);
  outline.lineTo(left, bottom + r);
  outline.quadraticCurveTo(left, bottom, left + r, bottom);
  const geometry = new THREE9__namespace.ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    curveSegments: 8
  });
  geometry.translate(0, 0, -depth / 2);
  return mesh2(geometry, color, x, y, z);
}
function line(points, color, opacity = 1) {
  return new THREE9__namespace.Line(
    new THREE9__namespace.BufferGeometry().setFromPoints(points.map((v) => new THREE9__namespace.Vector3(v[0], v[1], v[2] ?? 0))),
    new THREE9__namespace.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  );
}
function tube2(points, radius, color) {
  return mesh2(new THREE9__namespace.TubeGeometry(new THREE9__namespace.CatmullRomCurve3(points), 64, radius, 8, false), color);
}
function label(text, color, x, y, z, size = 0.16) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#" + new THREE9__namespace.Color(color).getHexString();
  ctx.font = "500 32px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 32);
  const texture = new THREE9__namespace.CanvasTexture(canvas);
  texture.colorSpace = THREE9__namespace.SRGBColorSpace;
  const m = new THREE9__namespace.Mesh(
    new THREE9__namespace.PlaneGeometry(size * 8, size),
    new THREE9__namespace.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    })
  );
  m.position.set(x, y, z);
  return m;
}
function phase(group2, t, name, pose) {
  group2.userData.phase = t >= DURATION ? "rest" : name;
  group2.userData.pose = pose;
}
function contact(palette2) {
  const group2 = new THREE9__namespace.Group();
  group2.rotation.set(0.1, -0.2, -0.025);
  const sourceY = [0.9, 0, -0.9];
  const sources = sourceY.map((y, index) => {
    const source = new THREE9__namespace.Group();
    source.position.set(-1.62, y, 0.05);
    source.add(slab2(0.75, 0.58, 0.11, palette2.paper));
    if (index === 0) {
      source.add(
        line(
          [
            [-0.24, 0.14, 0.13],
            [0, -0.03, 0.13],
            [0.24, 0.14, 0.13]
          ],
          palette2.accent
        ),
        line(
          [
            [-0.24, 0.14, 0.13],
            [-0.24, -0.15, 0.13],
            [0.24, -0.15, 0.13],
            [0.24, 0.14, 0.13]
          ],
          palette2.accent
        )
      );
    } else if (index === 1) {
      source.add(
        slab2(0.48, 0.3, 0.018, palette2.accent, 0, 0.03, 0.13, 0.07),
        mesh2(new THREE9__namespace.ConeGeometry(0.075, 0.15, 3), palette2.accent, -0.14, -0.18, 0.13)
      );
    } else {
      source.add(
        mesh2(new THREE9__namespace.TorusGeometry(0.2, 0.018, 8, 36), palette2.accent, 0, 0, 0.13),
        line(
          [
            [-0.2, 0, 0.135],
            [0.2, 0, 0.135]
          ],
          palette2.accent
        ),
        line(
          [
            [0, -0.2, 0.135],
            [0, 0.2, 0.135]
          ],
          palette2.accent
        )
      );
    }
    group2.add(source);
    return source;
  });
  const inboxPoint = new THREE9__namespace.Vector3(0.72, 0, 0.2);
  const routes = sourceY.map(
    (y) => new THREE9__namespace.CatmullRomCurve3([
      new THREE9__namespace.Vector3(-1.22, y, 0.08),
      new THREE9__namespace.Vector3(-0.52, y * 0.82, 0.25),
      new THREE9__namespace.Vector3(0.08, y * 0.35, 0.3),
      inboxPoint.clone()
    ])
  );
  routes.forEach((route) => group2.add(tube2(route.getPoints(32), 0.014, palette2.muted)));
  const packets = routes.map((route, index) => {
    const packet = mesh2(
      index === 1 ? new THREE9__namespace.OctahedronGeometry(0.09) : index === 2 ? new THREE9__namespace.BoxGeometry(0.14, 0.14, 0.14) : new THREE9__namespace.SphereGeometry(0.085, 16, 12),
      palette2.accent
    );
    packet.position.copy(route.getPoint(0));
    group2.add(packet);
    return packet;
  });
  const inbox = new THREE9__namespace.Group();
  inbox.position.set(1.12, 0, 0);
  inbox.add(
    slab2(1.42, 1.55, 0.16, palette2.ink),
    slab2(1.22, 1.35, 0.025, palette2.paper, 0, 0, 0.1),
    label("INBOX", palette2.ink, 0, 0.53, 0.14, 0.15)
  );
  const tray = slab2(1.05, 0.53, 0.16, palette2.accent, 0, -0.37, 0.19, 0.055);
  tray.rotation.x = -0.18;
  inbox.add(tray);
  const receipts = sourceY.map((_, index) => {
    const receipt = slab2(0.72, 0.18, 0.025, palette2.paper, 0, -0.25 + index * 0.14, 0.34, 0.025);
    inbox.add(receipt);
    return receipt;
  });
  const status = mesh2(new THREE9__namespace.TorusGeometry(0.12, 0.027, 10, 40), palette2.accent, 0.43, 0.53, 0.14);
  inbox.add(status);
  group2.add(inbox);
  group2.userData.contact = { inboxPoint, routes, packets, receipts };
  group2.userData.animate = (time) => {
    const t = Math.min(time, DURATION);
    sources.forEach((source, index) => {
      const enter = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 120 + index * 140, 780 + index * 140));
      source.position.x = chunkSDBNPDW6_cjs.lerp(-1.9, -1.62, enter);
      source.rotation.z = (index - 1) * 0.055 * (1 - enter);
    });
    packets.forEach((packet, index) => {
      const travel2 = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 700 + index * 430, 2750 + index * 430));
      packet.position.copy(routes[index].getPoint(travel2));
      packet.rotation.z = travel2 * Math.PI * 2;
      packet.scale.setScalar(Math.max(1e-3, Math.sin(travel2 * Math.PI)));
      const received = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 2600 + index * 430, 3300 + index * 430));
      receipts[index].scale.x = Math.max(1e-3, received);
      receipts[index].position.x = chunkSDBNPDW6_cjs.lerp(-0.18, 0, received);
    });
    const acknowledge = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 3900, 4750));
    status.scale.setScalar(Math.max(1e-3, acknowledge));
    status.rotation.z = chunkSDBNPDW6_cjs.lerp(-Math.PI, 0, acknowledge);
    inbox.position.y = 0.035 * Math.sin(chunkSDBNPDW6_cjs.progress(t, 3900, 4750) * Math.PI);
    phase(
      group2,
      t,
      t < 900 ? "open-channels" : t < 3650 ? "route-signals" : t < 4750 ? "collect-messages" : "contact-ready",
      chunkSDBNPDW6_cjs.progress(t, 700, 4750)
    );
  };
  return group2;
}
var studioBuilders = {
  contact,
  trading,
  server,
  travel
};
async function createObject(kind, palette2, requested, edition = 0, modelUrl) {
  var _a, _b;
  const variant = chunkHPYRAZ5N_cjs.normalizeObjectVariant(kind, requested ?? chunkHPYRAZ5N_cjs.objectLooks[kind][0]);
  const finish2 = kind === "contact" ? variant % 3 : edition;
  const accent = [palette2.accent, 4619160, 10512718][finish2];
  const object = kind === "contact" ? variant === 3 ? createContactDirection() : contact({ ...palette2, accent }) : variant !== 0 ? createArtDirection(kind, variant) : kind === "tennis" ? await tennis({ ...palette2, accent }, finish2, modelUrl ?? tennisModelUrl()) : chunkHPYRAZ5N_cjs.hasObjectLook(kind, 0) ? await studioBuilders[kind]({ ...palette2, accent }, finish2) : null;
  if (!object) throw new Error(`${kind} has no Studio look`);
  (_a = object.userData).style ?? (_a.style = "studio");
  (_b = object.userData).look ?? (_b.look = {
    castShadows: kind === "contact" && variant > 0,
    rig: kind === "tennis" ? { both: { key: { shadow: true } } } : void 0
  });
  object.userData.variant = variant;
  object.userData.animate(0);
  return object;
}
function disposeObject(scene) {
  scene.traverse((item) => item.userData.dispose?.());
  const geometries = /* @__PURE__ */ new Set(), materials = /* @__PURE__ */ new Set(), textures = /* @__PURE__ */ new Set();
  scene.traverse((item) => {
    const drawable = item;
    if (drawable.geometry) geometries.add(drawable.geometry);
    if (drawable.material)
      for (const material of Array.isArray(drawable.material) ? drawable.material : [drawable.material]) {
        materials.add(material);
        for (const texture of chunk7OAMHGZK_cjs.materialTextures(material)) textures.add(texture);
      }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

exports.DURATION = DURATION;
exports.createObject = createObject;
exports.disposeObject = disposeObject;
