'use strict';

var chunk7OAMHGZK_cjs = require('./chunk-7OAMHGZK.cjs');
var chunkGZ2AJZYQ_cjs = require('./chunk-GZ2AJZYQ.cjs');
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
function playLoop(object, ticks, restTime, phase3) {
  object.userData.source = "procedural";
  object.userData.loopDuration = LOOP_MS;
  object.userData.restTime = restTime;
  object.userData.animate = (time) => {
    const progress2 = (time % LOOP_MS + LOOP_MS) % LOOP_MS / LOOP_MS;
    for (const tick of ticks) tick(progress2 * TAU);
    object.userData.phase = phase3;
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
  const wrap = (n) => (n % period + period) % period;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(wrap(xi), wrap(yi), seed), b = hash(wrap(xi + 1), wrap(yi), seed), c = hash(wrap(xi), wrap(yi + 1), seed), d = hash(wrap(xi + 1), wrap(yi + 1), seed);
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
    roughness: 0.02,
    thickness: 0.7,
    ior: 1.52,
    dispersion: 0.4,
    attenuationColor: new THREE9__namespace.Color(14674687),
    attenuationDistance: 3,
    envMapIntensity: 1.2,
    ...options
  });
}
function band(parent, color, width, height, x, y, z, rotation = 0) {
  const card2 = mesh(parent, new THREE9__namespace.BoxGeometry(width, height, 0.02), new THREE9__namespace.MeshBasicMaterial({ color }), x, y, z);
  card2.rotation.z = rotation;
  return card2;
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
  return mesh(parent, new THREE9__namespace.CircleGeometry(radius, 64), new THREE9__namespace.MeshBasicMaterial({ color, map: discShade }), x, y, z);
}
function backGlow(parent, width = 5.2) {
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
  const map = paintTexture(64, 64, (u, v) => {
    const across = smoothstep2(0, 0.3, u) * smoothstep2(1, 0.7, u);
    const along = smoothstep2(0, 0.25, v) * smoothstep2(1, 0.8, v);
    const t = across * along;
    return [24 + 150 * t, 29 + 155 * t, 54 + 190 * t];
  });
  const material = chunk7OAMHGZK_cjs.themed(new THREE9__namespace.MeshBasicMaterial({ map, depthWrite: false, toneMapped: false, side: THREE9__namespace.DoubleSide }), {
    light: { opacity: 0 }
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
function floor(parent, width, depth, hue, x = 0, z = 0) {
  parent.add(chunk7OAMHGZK_cjs.contactShadow(width, depth, { opacity: 0.32, color: 1775680, x, z, y: 2e-3 }));
  causticMap ?? (causticMap = () => paintTexture(
    64,
    64,
    (u, v) => {
      const r = Math.hypot(u - 0.5, v - 0.5) * 2;
      const ring = Math.exp(-(((r - 0.55) / 0.16) ** 2)) * 0.8 + Math.exp(-((r / 0.25) ** 2)) * 0.6;
      const a = Math.min(1, ring) * Math.max(0, 1 - r) * 255;
      return [a, a, a];
    },
    { srgb: false }
  ));
  const caustic = mesh(
    parent,
    new THREE9__namespace.PlaneGeometry(width * 0.62, depth * 0.62),
    new THREE9__namespace.MeshBasicMaterial({
      color: hue,
      alphaMap: causticMap(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE9__namespace.AdditiveBlending,
      toneMapped: false
    }),
    x,
    4e-3,
    z
  );
  caustic.rotation.x = -Math.PI / 2;
  caustic.renderOrder = -1;
  caustic.userData.frameIgnore = true;
}
var models = {
  /** Thought lattice: a hyperboloid of glass rods; its twist breathes, breaking a vermilion band into steps. */
  ai(root, ticks) {
    band(root, hues.vermilion, 3.2, 0.36, 0, 1, -1.1);
    band(root, hues.ultramarine, 0.22, 2.1, 0.55, 1.05, -1.3);
    const lattice = group(root, 0, 1, 0);
    const glass = opticalGlass({ thickness: 0.25 });
    const geometry = roundedBox(0.12, 1.9, 0.12, 0.05, 2);
    const rods = [];
    const N = 10, R = 0.6;
    for (let i = 0; i < N; i++) {
      const phi = i / N * TAU;
      const rod2 = mesh(lattice, geometry, glass, R * Math.cos(phi), 0, R * Math.sin(phi));
      rods.push({ rod: rod2, phi });
    }
    floor(root, 2.2, 1.6, hues.vermilion);
    const up = vec(0, 1), dir = new THREE9__namespace.Vector3();
    ticks.push((angle) => {
      const twist = 0.5 + 0.16 * Math.sin(angle);
      for (const { rod: rod2, phi } of rods) {
        dir.set(-Math.sin(phi) * Math.sin(twist), Math.cos(twist), Math.cos(phi) * Math.sin(twist));
        rod2.quaternion.setFromUnitVectors(up, dir);
      }
      lattice.rotation.y = 0.3 * Math.sin(angle);
      lattice.position.y = 0.95 * Math.cos(twist) + 0.02;
    });
  },
  /** Risk rhythm: a row of glass prisms of rising heights refracts an ultramarine band into a price line. */
  trading(root, ticks) {
    band(root, hues.ultramarine, 3.4, 0.26, 0, 0.42, -1);
    disc(root, hues.saffron, 0.32, 1.05, 1.55, -1.25);
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
  backGlow(root);
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
      hemisphere: { sky: 5926064, ground: 1581114, intensity: 1.1 },
      key: { color: 11123967, intensity: 1.25, position: [3.5, 6, 3] },
      rim: { color: 10467583, intensity: 2.2 },
      // A warm porch-light fill from the camera side, so faces keep their features at night.
      fill: { color: 16767144, intensity: 0.85, position: [1.5, 2.5, 7] }
    }
  },
  camera: { projection: "perspective", fov: 30, pitch: 28 },
  framing: { fill: 0.78, maxWidth: 0.88, lift: 0, sample: "loop" },
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
  const day = new THREE9__namespace.Color(color);
  return day.lerp(new THREE9__namespace.Color(2898542), character ? 0.18 : 0.38).multiplyScalar(character ? 0.96 : 0.82).getHex();
}
function toonFactory() {
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
  return (color, options = {}) => {
    const key = `${color}:${options.glow ?? ""}:${options.dayGlow ?? ""}:${options.transparent ?? ""}:${options.character ?? ""}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const material = new THREE9__namespace.MeshToonMaterial({ color, gradientMap: gradient });
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
}
function blob(rx, rz, seed, scale = 1) {
  const shape2 = new THREE9__namespace.Shape();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const a = i / N * TAU;
    const r = scale * (1 + 0.07 * Math.sin(3 * a + seed) + 0.045 * Math.sin(5 * a + seed * 2.3));
    const x = rx * r * Math.cos(a), y = rz * r * Math.sin(a);
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
function island(root, toon, rx, rz, seed) {
  mesh(root, slab(blob(rx, rz, seed), 0.08, -0.06, 0.06), toon(palette.grass));
  mesh(root, slab(blob(rx, rz, seed, 0.97), 0.3, -0.16, 0.05), toon(palette.soil));
  mesh(root, slab(blob(rx, rz, seed + 1, 0.74), 0.26, -0.5, 0.06), toon(palette.soilDark));
  const point = mesh(root, new THREE9__namespace.ConeGeometry(Math.min(rx, rz) * 0.55, 0.55, 7), toon(palette.rock), 0, -0.98, 0);
  point.rotation.x = Math.PI;
  point.rotation.y = seed;
  const random = mulberry(seed * 1e3);
  const flowers = [];
  for (let i = 0; i < 7; i++) {
    const a = random() * TAU, r = 0.86 + random() * 0.08;
    flowers.push(mergeable(placed(new THREE9__namespace.SphereGeometry(0.045, 8, 6), rx * r * Math.cos(a), 0.04, rz * r * Math.sin(a))));
  }
  mesh(root, BufferGeometryUtils_js.mergeGeometries(flowers), toon([palette.cream, palette.sun, palette.blush][seed % 3]));
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
    const foot = sphere2(root, 0.07, toon(shadeOf(color), { character: true }), [side * 0.08, 0.04, 0.03], 10);
    foot.scale.set(1, 0.6, 1.3);
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
    island(world, toon, 1.45, 1.05, 2);
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
    const idea = group(world, -1.05, 1.75, 0.2);
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
      idea.position.y = 1.65 + 0.12 * pop;
      bulbMaterial.emissiveIntensity = Math.sin(angle * 8) > 0 ? 1.6 : 0.1;
    });
  },
  /** Courtside club: two bean players rally on a clay court; the ball squashes on every hit. */
  tennis(world, ticks, toon) {
    island(world, toon, 1.6, 1.15, 5);
    const court2 = group(world, 0, 0.02, 0);
    court2.rotation.y = -0.18;
    block(court2, [2.3, 0.05, 1.3], toon(14710858), [0, 0, 0], 0.04);
    const line2 = toon(palette.white);
    const lines = [];
    for (const z of [-0.58, 0.58]) lines.push(mergeable(placed(new THREE9__namespace.BoxGeometry(2.1, 0.012, 0.045), 0, 0.03, z)));
    for (const x of [-1.03, 1.03, -0.55, 0.55])
      lines.push(mergeable(placed(new THREE9__namespace.BoxGeometry(0.045, 0.012, 1.2), x, 0.03, 0)));
    lines.push(mergeable(placed(new THREE9__namespace.BoxGeometry(1.1, 0.012, 0.04), 0, 0.03, 0)));
    mesh(court2, BufferGeometryUtils_js.mergeGeometries(lines), line2);
    for (const z of [-0.7, 0.7]) cylinder(court2, 0.03, 0.34, toon(palette.ink), [0, 0.17, z], 8);
    const netTexture = paintTexture(
      64,
      16,
      (_u, _v, x, y) => x % 4 === 0 || y % 4 === 0 ? [45, 42, 58, 255] : [45, 42, 58, 40]
    );
    netTexture.magFilter = THREE9__namespace.NearestFilter;
    const netMaterial = new THREE9__namespace.MeshToonMaterial({
      map: netTexture,
      transparent: true,
      side: THREE9__namespace.DoubleSide,
      depthWrite: false
    });
    const net = mesh(court2, new THREE9__namespace.PlaneGeometry(1.4, 0.24), netMaterial, 0, 0.16, 0);
    net.rotation.y = Math.PI / 2;
    block(court2, [0.05, 0.045, 1.42], line2, [0, 0.29, 0], 0.02);
    const players = [
      bean(court2, toon, palette.coral, -0.8, 0.12, Math.PI / 2 - 0.3),
      bean(court2, toon, palette.plum, 0.8, -0.12, -Math.PI / 2 - 0.3)
    ];
    const stringTexture = paintTexture(
      32,
      40,
      (_u, _v, x, y) => x % 4 === 1 || y % 4 === 1 ? [255, 250, 236, 255] : [0, 0, 0, 0]
    );
    stringTexture.magFilter = THREE9__namespace.NearestFilter;
    const stringMaterial = new THREE9__namespace.MeshToonMaterial({
      map: stringTexture,
      gradientMap: toon(palette.white).gradientMap,
      alphaTest: 0.5,
      side: THREE9__namespace.DoubleSide
    });
    chunk7OAMHGZK_cjs.themed(stringMaterial, { dark: { color: night(16777215) } });
    const frameGeometry = new THREE9__namespace.TorusGeometry(0.075, 0.014, 8, 28);
    frameGeometry.scale(1, 1.28, 1);
    const throatGeometry = BufferGeometryUtils_js.mergeGeometries([
      mergeable(placed(new THREE9__namespace.CylinderGeometry(0.011, 0.011, 0.1, 6), -0.024, 0.11, 0, 0, 0, 0.42)),
      mergeable(placed(new THREE9__namespace.CylinderGeometry(0.011, 0.011, 0.1, 6), 0.024, 0.11, 0, 0, 0, -0.42))
    ]);
    const stringGeometry = new THREE9__namespace.PlaneGeometry(0.15, 0.19);
    const rackets = players.map((player, p) => {
      const racket2 = group(player.right, 0.08, -0.16, 0.04);
      racket2.scale.setScalar(1.2);
      cylinder(racket2, 0.019, 0.13, toon(p ? palette.sun : palette.cream), [0, 0, 0], 8);
      cylinder(racket2, 0.024, 0.025, toon(palette.ink), [0, -0.07, 0], 8);
      mesh(racket2, throatGeometry, toon(palette.sky));
      mesh(racket2, frameGeometry, toon(palette.sky), 0, 0.245, 0);
      mesh(racket2, stringGeometry, stringMaterial, 0, 0.245, 0);
      racket2.rotation.set(0, 0, -0.5);
      return racket2;
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
    island(world, toon, 1.5, 1.08, 17);
    const oak = group(world, 0.55, 0, -0.45);
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
var subjectFill = { ai: 0.7 };
function cartoon(kind, ticks) {
  const root = new THREE9__namespace.Group();
  const fill = subjectFill[kind];
  if (fill) root.userData.look = { ...cartoonLook, framing: { ...cartoonLook.framing || {}, fill } };
  const world = group(root);
  world.rotation.y = -0.35;
  scenes[kind](world, ticks, toonFactory());
  ticks.push((angle) => world.position.y = 0.03 * Math.sin(angle));
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
var GROUND_WIDTH = 4.2;
var GROUND_DEPTH = 8.5;
var GROUND_NEAR = 2.4;
function groundFade() {
  return paintTexture(
    64,
    128,
    (u, v) => {
      const across = Math.abs(u - 0.5) * 2;
      const a = (1 - smoothstep2(0.68, 0.99, across)) * (1 - smoothstep2(0.34, 0.86, v));
      return [a * 255, a * 255, a * 255];
    },
    { srgb: false }
  );
}
function surface(root, map, normalMap, roughness, dark = 0.72) {
  const material = chunk7OAMHGZK_cjs.themed(
    new THREE9__namespace.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE9__namespace.Vector2(0.35, 0.35),
      roughness,
      metalness: 0,
      alphaMap: groundFade(),
      transparent: true,
      depthWrite: false
    }),
    { dark: { color: new THREE9__namespace.Color(dark, dark, dark).getHex() } }
  );
  const plane = mesh(root, new THREE9__namespace.PlaneGeometry(GROUND_WIDTH, GROUND_DEPTH), material, 0, 0, GROUND_NEAR - GROUND_DEPTH / 2);
  plane.rotation.x = -Math.PI / 2;
  plane.renderOrder = -2;
  plane.receiveShadow = true;
  plane.userData.frameIgnore = true;
  return plane;
}
var WOOD_TILE = 3;
var WOOD_SIZE = 512;
var woodField;
function woodData() {
  if (woodField) return woodField;
  const SIZE = WOOD_SIZE;
  const field = new Float32Array(SIZE * SIZE * 3), tones = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const u = (x + 0.5) / SIZE, v = (y + 0.5) / SIZE;
      const plank = Math.floor(v * 2);
      const w = v * 2 % 1;
      const n1 = valueNoise2(u * 6, w * 3, 6, 64, 11 + plank), n2 = valueNoise2(u * 3, w * 2, 3, 64, 5 + plank);
      const across = (w - 0.5) * 5 + 0.7 * (n1 - 0.5);
      const cut = 0.9 + 1.1 * (0.5 + 0.5 * Math.cos((u + plank * 0.43) * TAU)) + 0.6 * n2;
      const rings = Math.hypot(across, cut) * 8 + 0.8 * n1;
      const ring = rings % 1;
      const weight = 0.45 + 0.55 * valueNoise2(Math.floor(rings) * 7.3, plank * 3.1, 4096, 4096, 41);
      const late = weight * smoothstep2(0.6, 0.85, ring) * (1 - smoothstep2(0.9, 1, ring));
      const pores = smoothstep2(0.7, 0.95, valueNoise2(u * 40, v * 220, 40, 220, 23));
      const figure = valueNoise2(u * 4, v * 6, 4, 6, 31 + plank);
      const seam = smoothstep2(0.01, 0, Math.min(w, 1 - w));
      const i = (y * SIZE + x) * 3;
      field[i] = late;
      field[i + 1] = pores;
      field[i + 2] = seam;
      const tone = clamp01(0.6 + 0.18 * figure + (plank ? 0.05 : -0.04) - 0.22 * late - 0.08 * pores);
      tones[i / 3] = tone * (1 - 0.7 * seam);
    }
  return woodField = { field, tones };
}
function walnut(root) {
  const SIZE = WOOD_SIZE;
  const { field, tones } = woodData();
  const map = paintTexture(
    SIZE,
    SIZE,
    (_u, _v, x, y) => {
      const t = tones[y * SIZE + x];
      return mixRgb(2759184, 9069120, t);
    },
    { repeat: [GROUND_WIDTH / WOOD_TILE, GROUND_DEPTH / WOOD_TILE] }
  );
  map.anisotropy = 8;
  const normalMap = normalTexture(
    SIZE / 2,
    (u, v) => {
      const i = (Math.min(SIZE - 1, Math.floor(v * SIZE)) * SIZE + Math.min(SIZE - 1, Math.floor(u * SIZE))) * 3;
      return 0.6 - 0.3 * field[i] - 0.12 * field[i + 1] - 0.8 * field[i + 2];
    },
    2,
    [GROUND_WIDTH / WOOD_TILE, GROUND_DEPTH / WOOD_TILE]
  );
  normalMap.anisotropy = 8;
  return surface(root, map, normalMap, 0.46);
}
function court(root) {
  const map = paintTexture(
    128,
    128,
    (u, v) => {
      const speck = valueNoise(u * 128, v * 128, 128, 2);
      return mixRgb(2905719, 4618395, speck * 0.7 + 0.15 * fbm(u * 4, v * 4, 4, 2, 8));
    },
    { repeat: [6, 12] }
  );
  const normalMap = normalTexture(128, (u, v) => valueNoise(u * 128, v * 128, 128, 3), 2.5, [12, 24]);
  return surface(root, map, normalMap, 0.82);
}
function circuitBoard(root) {
  const W = 256, H = 512;
  const copper = new Float32Array(W * H);
  const random = seeded(77);
  const stroke = (x0, y0, x1, y1, width) => {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let s = 0; s <= steps; s++) {
      const x = x0 + (x1 - x0) * s / Math.max(steps, 1), y = y0 + (y1 - y0) * s / Math.max(steps, 1);
      for (let dy = -width; dy <= width; dy++)
        for (let dx = -width; dx <= width; dx++) {
          const px = Math.round(x + dx), py = Math.round(y + dy);
          if (px >= 0 && py >= 0 && px < W && py < H) copper[py * W + px] = 1;
        }
    }
  };
  for (let i = 0; i < 70; i++) {
    let x = random() * W, y = random() * H;
    const width = random() < 0.2 ? 2 : 1;
    for (let leg = 0; leg < 3; leg++) {
      const length = 20 + random() * 90;
      const dir = Math.floor(random() * 4);
      const diagonal = random() < 0.4;
      const nx = x + (dir === 0 ? length : dir === 1 ? -length : diagonal ? length * 0.5 : 0);
      const ny = y + (dir === 2 ? length : dir === 3 ? -length : diagonal ? length * 0.5 : 0);
      stroke(x, y, nx, ny, width);
      x = nx;
      y = ny;
    }
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9) stroke(x + dx, y + dy, x + dx, y + dy, 0);
  }
  const at2 = (x, y) => copper[(y + H) % H * W + (x + W) % W];
  const map = paintTexture(W, H, (_u, _v, x, y) => at2(x, y) ? [46, 104, 72] : [22, 64, 44]);
  const normalMap = paintTexture(
    W,
    H,
    (_u, _v, x, y) => {
      const n = vec(-(at2(x + 1, y) - at2(x - 1, y)) * 0.8, -(at2(x, y + 1) - at2(x, y - 1)) * 0.8, 1).normalize();
      return [(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255];
    },
    { srgb: false }
  );
  return surface(root, map, normalMap, 0.32, 0.55);
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
    const line2 = mesh(root, new THREE9__namespace.PlaneGeometry(GROUND_WIDTH, 0.5), paint, 0, 2e-3, 0.05);
    line2.rotation.x = -Math.PI / 2;
    line2.renderOrder = -1;
    line2.receiveShadow = true;
    line2.userData.frameIgnore = true;
    const blurred = paintTexture(192, 240, (u, v) => {
      const x = (u - 0.5) * 2, y = (v - 0.62) * 2.4;
      const r = Math.hypot(x / 0.86, y / 1.02);
      const frame = smoothstep2(0.24, 0.04, Math.abs(r - 0.93));
      const inside = smoothstep2(0.84, 0.66, r);
      const strings = inside * 0.5 * (smoothstep2(0.32, 0.05, Math.abs((x * 7 % 1 + 1) % 1 - 0.5) * 2 - 0.7) + smoothstep2(0.32, 0.05, Math.abs((y * 7 % 1 + 1) % 1 - 0.5) * 2 - 0.7));
      const throat = v < 0.3 ? smoothstep2(0.12, 0.03, Math.abs(x)) * smoothstep2(0, 0.08, v) : 0;
      const a = clamp01(Math.max(frame, strings * 0.55, throat));
      const [r1, g1, b1] = frame > strings ? [28, 31, 36] : [214, 214, 200];
      return [r1, g1, b1, a * 150];
    });
    const card2 = new THREE9__namespace.MeshBasicMaterial({ map: blurred, transparent: true, depthWrite: false, toneMapped: true });
    const racket2 = mesh(root, new THREE9__namespace.PlaneGeometry(1.3, 1.6), chunk7OAMHGZK_cjs.themed(card2, { dark: { color: 8028040 } }), 0.95, 0.42, -2.4);
    racket2.rotation.set(-0.3, -0.35, -0.6);
    racket2.userData.frameIgnore = true;
    const RADIUS = 0.42;
    const roller = group(root, 0, 0, 0.05);
    const ball = group(roller, 0, RADIUS, 0);
    const felt = chunk7OAMHGZK_cjs.lookMaterial("felt", 13621563, { grain: 3, sheenRoughness: 0.6, roughness: 1 });
    sphere2(ball, RADIUS, felt, [0, 0, 0], 48);
    const fuzzMap = paintTexture(
      128,
      64,
      (u, v) => {
        const n = valueNoise(u * 128, v * 64, 128, 31);
        const a = smoothstep2(0.55, 0.95, n) * 90;
        return [a, a, a];
      },
      { srgb: false }
    );
    const fuzz = new THREE9__namespace.MeshStandardMaterial({
      color: 15002746,
      roughness: 1,
      alphaMap: fuzzMap,
      transparent: true,
      depthWrite: false
    });
    decal(sphere2(ball, RADIUS * 1.025, fuzz, [0, 0, 0], 40));
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
    pool(roller, 0.9, 0.6, 0, 0, 0.7);
    ticks.push((angle) => {
      const x = 0.16 * Math.sin(angle);
      roller.position.x = x;
      ball.rotation.z = -x / RADIUS;
    });
  },
  /** Silicon detail: a finned heatsink with copper heat pipes and a fan, low across a board. */
  server(root, ticks) {
    circuitBoard(root);
    const sink = group(root, -0.15, 0, -0.1);
    sink.rotation.y = -0.55;
    const aluminium = chunk7OAMHGZK_cjs.lookMaterial("brushedMetal", 11449272, { roughness: 0.42, anisotropy: 0.45 });
    const copper = chunk7OAMHGZK_cjs.lookMaterial("metal", 12745292, { roughness: 0.22 });
    block(sink, [1.24, 0.12, 1.12], aluminium, [0, 0.06, 0], 0.02);
    const fins = [];
    for (let i = 0; i < 16; i++) fins.push(mergeable(placed(roundedBox(0.026, 0.86, 1.1, 0.01, 1), -0.6 + i * 0.08, 0.57, 0)));
    mesh(sink, BufferGeometryUtils_js.mergeGeometries(fins), chunk7OAMHGZK_cjs.lookMaterial("metal", 11844030, { roughness: 0.48 }));
    const pipes = [];
    for (const z of [-0.3, 0, 0.3])
      pipes.push(
        mergeable(
          tube(
            [
              vec(-0.75, 0.95, z),
              vec(-0.75, 0.25, z),
              vec(-0.62, 0.11, z),
              vec(0.62, 0.11, z),
              vec(0.75, 0.25, z),
              vec(0.75, 0.95, z)
            ],
            0.045,
            false,
            64,
            12
          )
        )
      );
    mesh(sink, BufferGeometryUtils_js.mergeGeometries(pipes), copper);
    for (const x of [-0.75, 0.75]) for (const z of [-0.3, 0, 0.3]) cylinder(sink, 0.05, 0.04, copper, [x, 0.97, z], 12);
    const fan = group(sink, 0.72, 0.53, 0);
    fan.rotation.y = Math.PI / 2;
    const frameShape = new THREE9__namespace.Shape();
    const S = 0.5, R = 0.08;
    frameShape.moveTo(-S + R, -S);
    frameShape.lineTo(S - R, -S);
    frameShape.quadraticCurveTo(S, -S, S, -S + R);
    frameShape.lineTo(S, S - R);
    frameShape.quadraticCurveTo(S, S, S - R, S);
    frameShape.lineTo(-S + R, S);
    frameShape.quadraticCurveTo(-S, S, -S, S - R);
    frameShape.lineTo(-S, -S + R);
    frameShape.quadraticCurveTo(-S, -S, -S + R, -S);
    const hole = new THREE9__namespace.Path();
    hole.absarc(0, 0, 0.46, 0, TAU, true);
    frameShape.holes.push(hole);
    const frameGeometry = new THREE9__namespace.ExtrudeGeometry(frameShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 40
    });
    const plastic = chunk7OAMHGZK_cjs.lookMaterial("plastic", 1908514, { roughness: 0.5 });
    mesh(fan, frameGeometry, plastic);
    const rotor = group(fan, 0, 0, 0.07);
    const blades = [
      mergeable(placed(new THREE9__namespace.CylinderGeometry(0.15, 0.15, 0.08, 32), 0, 0, 0, Math.PI / 2))
    ];
    for (let i = 0; i < 7; i++) {
      const blade = new THREE9__namespace.Shape();
      blade.moveTo(0.13, -0.05);
      blade.quadraticCurveTo(0.32, -0.12, 0.43, 0.02);
      blade.quadraticCurveTo(0.33, 0.12, 0.13, 0.08);
      blade.closePath();
      const geometry = new THREE9__namespace.ExtrudeGeometry(blade, { depth: 0.012, bevelEnabled: false, curveSegments: 10 });
      geometry.translate(0, 0, -6e-3);
      geometry.rotateX(0.45);
      geometry.rotateZ(i * TAU / 7);
      blades.push(mergeable(geometry));
    }
    mesh(rotor, BufferGeometryUtils_js.mergeGeometries(blades), chunk7OAMHGZK_cjs.lookMaterial("plastic", 2764081, { roughness: 0.42 }));
    const badge = mesh(
      rotor,
      new THREE9__namespace.CylinderGeometry(0.1, 0.1, 0.01, 32),
      chunk7OAMHGZK_cjs.lookMaterial("brushedMetal", 11120049),
      0,
      0,
      0.045
    );
    badge.rotation.x = Math.PI / 2;
    ticks.push((angle) => rotor.rotation.z = -angle * 6);
    pool(root, 1.9, 1.7, -0.15, -0.1, 0.65);
    const dressing = group(root);
    const can = chunk7OAMHGZK_cjs.lookMaterial("brushedMetal", 12172738, { roughness: 0.4 });
    const sleeve = chunk7OAMHGZK_cjs.lookMaterial("plastic", 2501168, { roughness: 0.45 });
    for (let i = 0; i < 5; i++) {
      const x = -1.05 + i * 0.2, z = 0.78;
      cylinder(dressing, 0.075, 0.16, can, [x, 0.08, z], 24);
      cylinder(dressing, 0.077, 0.06, sleeve, [x, 0.03, z], 24);
    }
    const chips = [];
    for (let i = 0; i < 6; i++)
      chips.push(mergeable(placed(roundedBox(0.09, 0.03, 0.05, 8e-3, 1), 0.55 + i * 0.13, 0.015, 0.75)));
    mesh(dressing, BufferGeometryUtils_js.mergeGeometries(chips), chunk7OAMHGZK_cjs.lookMaterial("plastic", 1315862, { roughness: 0.35 }));
    const slot = group(dressing, 0.6, 0, -1.3);
    slot.rotation.y = -0.55;
    block(slot, [2.2, 0.12, 0.12], chunk7OAMHGZK_cjs.lookMaterial("plastic", 1710620, { roughness: 0.5 }), [0, 0.06, 0], 0.02);
    block(slot, [2, 0.55, 0.03], chunk7OAMHGZK_cjs.lookMaterial("plastic", 1923902, { roughness: 0.4 }), [0, 0.38, 0], 0.01);
    for (let i = 0; i < 8; i++)
      block(slot, [0.2, 0.18, 0.02], chunk7OAMHGZK_cjs.lookMaterial("plastic", 1118740, { roughness: 0.4 }), [-0.84 + i * 0.24, 0.4, 0.025], 0.01);
    setDressing(dressing);
    const ledMaterial = new THREE9__namespace.MeshStandardMaterial({
      color: 1718822,
      emissive: 4063114,
      emissiveIntensity: 2,
      roughness: 0.3
    });
    const led = block(root, [0.07, 0.03, 0.04], ledMaterial, [0.42, 0.015, 0.62], 0.01);
    led.userData.frameIgnore = true;
    ticks.push((angle) => ledMaterial.emissiveIntensity = 0.4 + 2.6 * Math.max(0, Math.sin(angle * 6)) ** 4);
  },
  /** Quiet chapter: tortoiseshell glasses folded on an open book, a page lifting in the draught. */
  reading(root, ticks) {
    walnut(root);
    const W = 1.25, H = 1.7, THICK = 0.18;
    const pageCurve = (t) => THICK + 0.11 * Math.max(0, Math.sin(Math.min(1, Math.max(0, t) * 1.6) * (Math.PI / 2))) ** 0.7 - 0.04 * t;
    const textMap = paintTexture(256, 352, (u, v) => {
      const paper = mixRgb(15985884, 15459021, valueNoise(u * 30, v * 30, 30, 4));
      const margin = u < 0.14 || u > 0.88 || v < 0.1 || v > 0.9;
      if (margin) return paper;
      const line2 = Math.floor((v - 0.1) * 46);
      const inLine = (v - 0.1) * 46 % 1;
      const word = valueNoise(u * 34, line2 * 3.1, 34, line2 + 3);
      const ink = smoothstep2(0.32, 0.2, Math.abs(inLine - 0.45)) * smoothstep2(0.3, 0.36, word) * (line2 % 17 === 16 ? 0 : 1);
      return paper.map((c, i) => mix(c, [70, 64, 58][i], ink * 0.7));
    });
    const pageMaterial = new THREE9__namespace.MeshStandardMaterial({ map: textMap, roughness: 0.92 });
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
      for (let i = 0; i < uv2.count; i++) uv2.setXY(i, Math.abs(position.getX(i)) / W, 0.5 + position.getZ(i) / H);
      if (sign < 0) for (let i = 0; i < uv2.count; i++) uv2.setX(i, 1 - uv2.getX(i));
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
    const ribbon = ribbonGeometry(
      [
        vec(0.02, THICK + 0.02, -0.4),
        vec(0.12, THICK + 0.03, 0.3),
        vec(0.18, 0.12, H / 2 + 0.03),
        vec(0.22, 4e-3, H / 2 + 0.25)
      ],
      0.05,
      40
    );
    mesh(book, ribbon, chunk7OAMHGZK_cjs.lookMaterial("plastic", 10169125, { side: THREE9__namespace.DoubleSide, roughness: 0.42 }));
    const leaf = new THREE9__namespace.PlaneGeometry(W * 0.98, H * 0.97, 16, 1);
    leaf.rotateX(-Math.PI / 2);
    leaf.translate(W * 0.98 / 2, 0, 0);
    const lp = leaf.attributes.position;
    for (let i = 0; i < lp.count; i++) lp.setY(i, pageCurve(lp.getX(i) / W) - THICK + 4e-3 + 0.06 * (lp.getX(i) / W) ** 2);
    leaf.computeVertexNormals();
    const sheetPivot = group(book, 0, THICK, 0);
    mesh(sheetPivot, leaf, new THREE9__namespace.MeshStandardMaterial({ map: textMap, roughness: 0.92, side: THREE9__namespace.DoubleSide }));
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
    const acetate = chunk7OAMHGZK_cjs.lookMaterial("ceramic", 16777215, { map: tortoise, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
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
    const pin = chunk7OAMHGZK_cjs.lookMaterial("metal", 13157044, { roughness: 0.3 });
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
  tennis: { pitch: 13, fill: 0.62 },
  server: { pitch: 16, fill: 0.8 },
  reading: { pitch: 20, fill: 0.5, maxWidth: 0.7 }
};
var lampAt = {
  tennis: [0.9, 1.4, 0.9],
  server: [0.9, 1.6, 0.9],
  reading: [1.7, 1.1, 0.6]
};
function realistic(kind, ticks) {
  const root = new THREE9__namespace.Group();
  models2[kind](root, ticks);
  const lamp = new THREE9__namespace.PointLight(16757614, 0, 0, 2);
  lamp.position.set(...lampAt[kind]);
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
  if (variant === 3 && chunkGZ2AJZYQ_cjs.hasObjectLook(kind, 3)) return cartoon(kind, ticks);
  if (variant === 4 && chunkGZ2AJZYQ_cjs.hasObjectLook(kind, 4)) return realistic(kind, ticks);
  if (variant === 5 && chunkGZ2AJZYQ_cjs.hasObjectLook(kind, 5)) return abstract(kind, ticks);
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
function sculptureMaterials() {
  const ceramic = (color) => chunk7OAMHGZK_cjs.lookMaterial("ceramic", color, { roughness: 0.2, clearcoatRoughness: 0.05 });
  return {
    brass: chunk7OAMHGZK_cjs.lookMaterial("metal", K.brass, { roughness: 0.2 }),
    agedBrass: chunk7OAMHGZK_cjs.lookMaterial("metal", K.agedBrass, { roughness: 0.34 }),
    steel: chunk7OAMHGZK_cjs.lookMaterial("metal", 13948626, { roughness: 0.3 }),
    bone: ceramic(K.bone),
    celadon: ceramic(K.celadon),
    inkGlaze: ceramic(K.inkGlaze),
    oxblood: ceramic(K.oxblood),
    optic: ceramic(K.optic),
    // Dark slate stone; at night it turns a warm grey so the turned profile holds on a navy card.
    slate: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("plastic", K.slate, { roughness: 0.55, envMapIntensity: 0.8 }), {
      dark: { color: chunk7OAMHGZK_cjs.shade(K.slate, 0.13) }
    }),
    stone: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("plastic", K.stone, { roughness: 0.62, envMapIntensity: 0.6 }), {
      dark: { color: chunk7OAMHGZK_cjs.shade(K.stone, -0.22) }
    })
  };
}
var UP = new THREE9__namespace.Vector3(0, 1, 0);
function rodGeometry(from, to, radius) {
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
    this.add(material, rodGeometry(from, to, radius));
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
      b.add(m.brass, new THREE9__namespace.BoxGeometry(0.035, 0.1, 0.03).translate(at2.x + u, at2.y + side * (r + 0.04), at2.z));
    }
  }
  const z = at2.z + T / 2;
  b.add(m.bone, new RoundedBoxGeometry_js.RoundedBoxGeometry(1.15 * r, 1.15 * r, 0.03, 2, 0.012).translate(at2.x, at2.y, z));
  const nodes = [vec(-0.26, -0.2, 0), vec(0.26, -0.2, 0), vec(0, 0.26, 0)].map(
    (p) => p.multiplyScalar(r * 1).add(vec(at2.x, at2.y, z + 0.022))
  );
  nodes.forEach((p, i) => b.add(m.brass, rodGeometry(p, nodes[(i + 1) % 3], 0.012), ballGeometry(p, 0.04, 14)));
  b.add(m.oxblood, ballGeometry(vec(at2.x, at2.y - r * 0.04, z + 0.022), 0.035, 14));
}
var sculptures = {
  /** A neural orrery: a glazed silicon chip and two ceramic nodes on counterweighted arms turning at different rates. */
  ai(root, m, ticks) {
    const TOP = 1.08;
    new Batch(root).strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, TOP, 0), 0.034, [false, false]).add(
      m.brass,
      ballGeometry(vec(0, TOP + 0.06, 0), 0.085),
      new THREE9__namespace.CylinderGeometry(0.09, 0.11, 0.06, 24).translate(0, PLINTH_TOP + 0.03, 0)
    ).done();
    const arms = [
      { y: -0.34, reach: 1.1, back: 0.55, r: 0.3, body: m.inkGlaze, turns: 1, phase: -1.29, drop: 0.16 },
      { y: 0.24, reach: 0.92, back: 0.42, r: 0.21, body: m.bone, turns: -1, phase: 4.38, drop: 0.24 },
      { y: 0.8, reach: 0.64, back: 0.32, r: 0.16, body: m.oxblood, turns: 2, phase: -2.78, drop: 0.18 }
    ];
    for (const arm of arms) {
      const group2 = new THREE9__namespace.Group();
      group2.position.y = arm.y;
      root.add(group2);
      const b = new Batch(group2);
      b.strut(m.brass, vec(-arm.back, 0, 0), vec(arm.reach, 0, 0), 0.024, [false, true]);
      b.add(m.brass, new THREE9__namespace.CylinderGeometry(0.06, 0.06, 0.1, 20));
      b.strut(m.brass, vec(arm.reach, 0, 0), vec(arm.reach, -arm.drop, 0), 0.016, [false, false]);
      b.add(m.agedBrass, ballGeometry(vec(-arm.back, 0, 0), arm.r * 0.55));
      if (arm.turns === 1) chip(b, m, vec(arm.reach, -arm.drop - arm.r, 0), arm.r);
      else b.add(arm.body, ballGeometry(vec(arm.reach, -arm.drop - arm.r, 0), arm.r, 32));
      b.done();
      ticks.push((angle) => {
        group2.rotation.y = arm.phase + arm.turns * angle;
      });
    }
  },
  /** A market balance: ceramic candle weights on two pans, the beam tipping as the market moves. */
  trading(root, m, ticks) {
    const BEAM_Y = 0.9;
    const s = new Batch(root).strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, BEAM_Y, 0), 0.042, [false, false]).add(m.brass, new THREE9__namespace.CylinderGeometry(0.1, 0.13, 0.07, 24).translate(0, PLINTH_TOP + 0.035, 0));
    s.add(
      m.bone,
      new THREE9__namespace.CylinderGeometry(0.42, 0.42, 0.03, 48, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(0, BEAM_Y, -0.08)
    );
    s.add(m.brass, new THREE9__namespace.TorusGeometry(0.42, 0.016, 8, 48, Math.PI).translate(0, BEAM_Y, -0.08));
    for (let i = -4; i <= 4; i++) {
      const a = i / 4 * 0.7;
      s.add(
        m.brass,
        rodGeometry(
          vec(Math.sin(a) * 0.3, BEAM_Y + Math.cos(a) * 0.3, -0.06),
          vec(Math.sin(a) * 0.38, BEAM_Y + Math.cos(a) * 0.38, -0.06),
          i === 0 ? 0.012 : 8e-3
        )
      );
    }
    s.done();
    const beam = new THREE9__namespace.Group();
    beam.position.y = BEAM_Y;
    root.add(beam);
    new Batch(beam).strut(m.brass, vec(-1.12, 0, 0), vec(1.12, 0, 0), 0.032).add(m.brass, ballGeometry(vec(0, 0, 0), 0.085)).strut(m.brass, vec(0, 0, 0.02), vec(0, 0.36, 0.02), 0.012, [false, true]).done();
    const HEIGHTS = [
      [0.26, 0.42, 0.34],
      [0.36, 0.5, 0.3]
    ];
    const pans = [];
    for (const [side, glaze] of [
      [-1, m.celadon],
      [1, m.oxblood]
    ]) {
      const pan = new THREE9__namespace.Group();
      pan.position.x = side * 1.12;
      beam.add(pan);
      pans.push(pan);
      const b = new Batch(pan);
      for (const a of [0, TAU / 3, 2 * TAU / 3])
        b.add(m.brass, rodGeometry(vec(0, 0, 0), vec(Math.cos(a + 0.5) * 0.36, -0.92, Math.sin(a + 0.5) * 0.36), 8e-3));
      b.add(m.brass, ballGeometry(vec(0, 0, 0), 0.05));
      const dish = [
        [0, -1],
        [0.36, -0.995],
        [0.44, -0.95],
        [0.46, -0.92],
        [0.43, -0.93],
        [0.34, -0.975],
        [0, -0.98]
      ].map(([r, y]) => new THREE9__namespace.Vector2(r, y));
      b.add(m.bone, new THREE9__namespace.LatheGeometry(dish, 40));
      HEIGHTS[side < 0 ? 0 : 1].forEach((h, i) => {
        const x = (i - 1) * 0.22;
        b.add(glaze, new THREE9__namespace.CylinderGeometry(0.075, 0.075, h, 24).translate(x, -0.98 + h / 2, i % 2 * 0.08 - 0.04));
        b.add(
          m.brass,
          rodGeometry(vec(x, -0.98 + h, i % 2 * 0.08 - 0.04), vec(x, -0.98 + h + 0.12, i % 2 * 0.08 - 0.04), 8e-3)
        );
      });
      b.done();
    }
    ticks.push((angle) => {
      const tip = 0.24 * Math.sin(angle) + 0.04 * Math.sin(3 * angle);
      beam.rotation.z = tip;
      for (const [i, pan] of pans.entries()) pan.rotation.z = -tip + 0.08 * Math.sin(angle - 0.8 + i);
    });
  },
  /** A celadon globe in a tilted brass meridian on a cradle; a brass plane circles on an arm. */
  travel(root, m, ticks) {
    const C2 = 0.18;
    const R = 0.74;
    const fork = new Batch(root);
    fork.strut(m.brass, vec(0, PLINTH_TOP, 0), vec(0, C2 - 1.02, 0), 0.042, [false, true]);
    fork.add(m.brass, new THREE9__namespace.CylinderGeometry(0.1, 0.13, 0.07, 24).translate(0, PLINTH_TOP + 0.035, 0));
    fork.add(m.brass, new THREE9__namespace.TorusGeometry(1, 0.036, 12, 64, Math.PI).rotateZ(Math.PI).translate(0, C2, 0));
    for (const side of [-1, 1]) fork.add(m.brass, ballGeometry(vec(side * 1, C2, 0), 0.06));
    fork.done();
    const meridian = new THREE9__namespace.Group();
    meridian.position.y = C2;
    meridian.rotation.x = -0.36;
    root.add(meridian);
    new Batch(meridian).add(m.agedBrass, new THREE9__namespace.TorusGeometry(0.88, 0.03, 12, 72)).strut(m.brass, vec(-0.98, 0, 0), vec(-0.88, 0, 0), 0.03, [false, false]).strut(m.brass, vec(0.88, 0, 0), vec(0.98, 0, 0), 0.03, [false, false]).strut(m.brass, vec(0, -0.9, 0), vec(0, -R, 0), 0.02, [false, false]).strut(m.brass, vec(0, R, 0), vec(0, 0.9, 0), 0.02, [false, false]).add(m.brass, ballGeometry(vec(0, 0.92, 0), 0.045)).done();
    const globe = new THREE9__namespace.Mesh(
      new THREE9__namespace.SphereGeometry(R, 48, 32),
      chunk7OAMHGZK_cjs.lookMaterial("ceramic", 16777215, { roughness: 0.22, clearcoatRoughness: 0.05, map: globeTexture() })
    );
    globe.material.map.colorSpace = THREE9__namespace.SRGBColorSpace;
    meridian.add(globe);
    const arm = new THREE9__namespace.Group();
    arm.position.y = 0.92;
    meridian.add(arm);
    const b = new Batch(arm);
    b.strut(m.brass, vec(0, 0, 0), vec(0.62, 0.12, 0), 0.022, [false, true]);
    b.strut(m.brass, vec(0.62, 0.12, 0), vec(1.02, -0.52, 0), 0.02, [false, true]);
    const plane = new THREE9__namespace.Group();
    plane.position.set(1.02, -0.52, 0);
    plane.scale.setScalar(1.7);
    arm.add(plane);
    const p = new Batch(plane);
    p.add(m.brass, new THREE9__namespace.CapsuleGeometry(0.035, 0.26, 6, 14).rotateX(Math.PI / 2));
    p.add(m.brass, new THREE9__namespace.BoxGeometry(0.42, 0.014, 0.09).translate(0, 0, -0.02));
    p.add(m.brass, new THREE9__namespace.BoxGeometry(0.16, 0.012, 0.05).translate(0, 0, 0.13));
    p.add(m.oxblood, new THREE9__namespace.BoxGeometry(0.012, 0.08, 0.06).translate(0, 0.04, 0.14));
    p.done();
    b.done();
    ticks.push((angle) => {
      globe.rotation.y = angle;
      arm.rotation.y = -angle + 0.9;
      plane.rotation.z = 0.25 * Math.sin(angle * 2);
    });
  }
};
var kineticLook = {
  rig: {
    both: {
      toneMapping: "aces",
      environment: { kind: "softbox", intensity: 0.7, rotation: 0.5 },
      key: { color: 16771529, intensity: 2.3, position: [-3, 5, 5], shadowRadius: 6, shadowMapSize: 1024 },
      rim: { color: 10273791, position: [4, 3, -4] }
    },
    light: {
      exposure: 1.05,
      reflections: 1.05,
      hemisphere: { sky: 16052198, ground: 7037528, intensity: 0.75 },
      rim: { intensity: 1.6 }
    },
    dark: {
      exposure: 1.05,
      reflections: 1,
      hemisphere: { sky: 10466e3, ground: 1053720, intensity: 0.2 },
      rim: { intensity: 3.6, color: 11127039 },
      key: { intensity: 2.5 },
      // A warm kicker from back left: a second rim along the brass and the plinth's edge.
      fill: { color: 16765594, intensity: 1.6, position: [-5, 2.5, -3.5] },
      environment: { intensity: 0.9 }
    }
  },
  camera: { projection: "perspective", fov: 28, pitch: 8 },
  framing: { fill: 0.8, maxWidth: 0.82 },
  castShadows: true
};
function kineticWorld(kind, ticks) {
  const root = new THREE9__namespace.Group();
  const m = sculptureMaterials();
  plinth(root, m);
  sculptures[kind](root, m, ticks);
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
var CARD = 0.032;
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
    this.paper = chunk7OAMHGZK_cjs.lookMaterial("paper", 16777215, { vertexColors: true, grain: 1.15, normalScale: new THREE9__namespace.Vector2(0.4, 0.4) });
    chunk7OAMHGZK_cjs.themed(this.paper, { dark: { color: 13616827 } });
    this.lamp = chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("paper", 16777215, { vertexColors: true, grain: 1.15 }), {
      dark: { emissive: 16752714, emissiveIntensity: 1.6 }
    });
    this.build();
  }
  add(...geometries) {
    this.statics.push(...geometries);
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
    const { frame, trims, arch, backdrop, floor: floor2, walls = backdrop } = this.options;
    const outer = rect(-1.98, -1.42, 1.98, 1.44);
    this.add(card(withHoles(shape(rect(-2.05, -1.49, 2.05, 1.51)), [opening(arch, 0.02)]), C.cream, FRONT - 0.012, 0.012));
    this.add(card(withHoles(shape(outer), [opening(arch, 0)]), frame, FRONT));
    this.add(card(withHoles(shape(rect(-1.92, FLOOR - 0.05, 1.92, 1.38)), [opening(arch, 0.085)]), trims[0], FRONT - 0.07));
    this.add(card(withHoles(shape(rect(-1.88, FLOOR - 0.05, 1.88, 1.34)), [opening(arch, 0.15)]), trims[1], FRONT - 0.14));
    this.add(block2(3.7, 0.3, FRONT - BACK, floor2, 0, FLOOR - 0.15, (FRONT + BACK) / 2));
    for (const side of [-1, 1]) this.add(block2(0.04, 2.38, FRONT - BACK, walls, side * 1.83, 0.07, (FRONT + BACK) / 2));
    this.add(block2(3.7, 0.04, FRONT - BACK, walls, 0, 1.26, (FRONT + BACK) / 2));
    this.add(card(shape(rect(-1.85, FLOOR, 1.85, 1.3)), backdrop, BACK));
  }
  finish() {
    this.part(this.root, this.statics);
    this.statics = [];
    this.root.add(chunk7OAMHGZK_cjs.contactShadow(4.8, 2.5, { y: -1.42, z: 0.1, opacity: 0.38, color: 2759698 }));
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
var fir = (cx, base, h) => [
  [cx - 0.03 * h, base],
  [cx - 0.03 * h, base + 0.12 * h],
  [cx - 0.3 * h, base + 0.12 * h],
  [cx - 0.12 * h, base + 0.45 * h],
  [cx - 0.24 * h, base + 0.45 * h],
  [cx, base + h],
  [cx + 0.24 * h, base + 0.45 * h],
  [cx + 0.12 * h, base + 0.45 * h],
  [cx + 0.3 * h, base + 0.12 * h],
  [cx + 0.03 * h, base + 0.12 * h],
  [cx + 0.03 * h, base]
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
    train.position.set(0, FLOOR + 0.51 + 0.02, 0.2);
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
    const trainMesh = t.part(train, trainParts);
    trainMesh.userData.frameIgnore = true;
    const front = t.hinge(0.48);
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
      sunRod.position.y = -0.82 + 0.2 * Math.sin(angle - 0.6);
      const u = ((2 * angle / TAU + 0.25) % 1 + 1) % 1;
      train.position.x = -2 + 4.35 * u;
      mid.rotation.x = 0.025 * Math.sin(angle + 1);
      front.rotation.x = 0.035 * Math.sin(angle);
      drift.position.x = 0.12 * Math.sin(angle);
    });
    return t.finish();
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
    return t.finish();
  }
};
var pitches = { travel: 6, reading: 12 };
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
        key: { intensity: 3.6, color: 16764822, position: [-2.5, -0.6, 8] },
        rim: { intensity: 0.9, color: 10467583 }
      }
    },
    camera: { projection: "perspective", fov: 30, pitch: pitches[kind], yaw: 9 },
    framing: { fill: 0.72, maxWidth: 0.8, sample: "rest" },
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
  if (variant === 1 && chunkGZ2AJZYQ_cjs.hasObjectLook(kind, 1)) {
    root = paperWorld(kind, ticks);
    root.userData.look = paperLook(kind);
  } else if (variant === 2 && chunkGZ2AJZYQ_cjs.hasObjectLook(kind, 2)) {
    root = kineticWorld(kind, ticks);
    root.userData.look = kineticLook;
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
  const phase3 = (index % MARKET_BARS + MARKET_BARS) % MARKET_BARS;
  const high = Math.max(open, close) + 0.12 + 0.14 * (1 + Math.sin(phase3 * Math.PI / 8)) / 2;
  const low = Math.min(open, close) - 0.12 - 0.12 * (1 + Math.cos(phase3 * Math.PI / 8)) / 2;
  const volume = 120 + Math.abs(close - open) * 540 + 50 * (1 + Math.cos(phase3 * Math.PI / 4));
  return { open, high, low, close, volume };
}

// src/objects/studio.ts
var DURATION = 5400;
var FLOOR2 = -1;
var studioLook = {
  rig: {
    both: {
      toneMapping: "aces",
      exposure: 1,
      environment: { kind: "room", intensity: 0.55, rotation: 0.5 },
      reflections: 1,
      hemisphere: { sky: 16512748, ground: 6120029, intensity: 0.75 },
      key: { color: 16774112, intensity: 3, position: [-6, 6.5, 3], shadow: true, shadowMapSize: 1024, shadowRadius: 7 },
      fill: { color: 15134463, intensity: 0.45, position: [6, 2, 5] },
      rim: { color: 14740223, intensity: 1.6, position: [3, 4, -6] }
    },
    // Night: the key stays, the fill moves behind-left as a cool kicker, and the rim comes round
    // higher and brighter, so graphite and aluminium edges separate from the dark card.
    dark: {
      exposure: 1.05,
      environment: { intensity: 0.34 },
      reflections: 0.9,
      hemisphere: { sky: 11847378, ground: 1581086, intensity: 0.42 },
      key: { intensity: 2.8 },
      fill: { color: 13952255, intensity: 2.6, position: [-6, 2.2, -4.5] },
      rim: { color: 12769535, intensity: 4.6, position: [5, 5, -5] }
    }
  },
  camera: { projection: "perspective", fov: 36, pitch: 18 },
  framing: { fill: 0.66, maxWidth: 0.84, lift: 0.02 },
  contactShadow: { spread: 1, opacity: 0.3 }
};
var GRAPHITE = 2830126;
var ALUMINIUM = 13225158;
var AMBER = 15246141;
function studioMaterials(palette2) {
  return {
    aluminium: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("brushedMetal", ALUMINIUM, { roughness: 0.32 }), {
      dark: { color: 10001816, roughness: 0.42 }
    }),
    satin: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("brushedMetal", 12106934, { roughness: 0.22, anisotropy: 0.3 }), {
      dark: { color: 9738644, roughness: 0.36 }
    }),
    steel: chunk7OAMHGZK_cjs.lookMaterial("metal", 14277590, { roughness: 0.2 }),
    graphite: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("ceramic", GRAPHITE, { roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 }), {
      dark: { color: 3488570 }
    }),
    keycap: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("plastic", 3093555, { roughness: 0.62 }), { dark: { color: 3949121, roughness: 0.5 } }),
    rubber: chunk7OAMHGZK_cjs.lookMaterial("rubber", 1909025),
    accent: chunk7OAMHGZK_cjs.lookMaterial("ceramic", palette2.accent, { roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
    glass: chunk7OAMHGZK_cjs.lookMaterial("ceramic", 461066, { roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 }),
    paper: chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("paper", palette2.paper, { grain: 3 }), { dark: { color: chunk7OAMHGZK_cjs.shade(palette2.paper, -0.26) } })
  };
}
var printed = (options) => chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("paper", 16777215, options), { dark: { color: 12369080 } });
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
function phase(group2, t, name, pose) {
  group2.userData.phase = t >= DURATION ? "rest" : name;
  group2.userData.pose = pose;
}
var css = (color) => new THREE9__namespace.Color(color).getStyle();
function shadowFloor(radius = 2.5) {
  const material = chunk7OAMHGZK_cjs.themed(new THREE9__namespace.ShadowMaterial({ opacity: 0.26, depthWrite: false }), { dark: { opacity: 0.5 } });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("void main() {", "varying vec2 vFloor;\nvoid main() {\n  vFloor = uv - 0.5;").replace("#include <common>", "#include <common>");
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
function finish(root, look = studioLook) {
  root.traverse((item) => {
    const mesh3 = item;
    if (!mesh3.isMesh || item.userData.frameIgnore) return;
    const glowing = item.userData.glow === true;
    mesh3.castShadow = !glowing && item.userData.cast !== false;
    mesh3.receiveShadow = !glowing && item.userData.receive !== false;
  });
  root.add(shadowFloor());
  root.userData.style = "studio";
  root.userData.look = look;
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
function racket(mat) {
  const group2 = new THREE9__namespace.Group();
  const frameMaterial = chunk7OAMHGZK_cjs.lookMaterial("ceramic", GRAPHITE, { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
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
    const beam = new THREE9__namespace.CatmullRomCurve3([
      new THREE9__namespace.Vector3(0.78, 0, 0),
      new THREE9__namespace.Vector3(1.02, 0, side * 0.1),
      new THREE9__namespace.Vector3(1.2, 0, side * 0.27),
      new THREE9__namespace.Vector3(cx - a * 0.86, 0, side * b * 0.52)
    ]);
    const m = new THREE9__namespace.Mesh(new THREE9__namespace.TubeGeometry(beam, 32, 0.034, 10, false), frameMaterial);
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
  const stringMaterial = chunk7OAMHGZK_cjs.lookMaterial("plastic", 15525586, { roughness: 0.45 });
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
  const gripMaterial = chunk7OAMHGZK_cjs.lookMaterial("rubber", 15657954, { roughness: 0.8 });
  const grip = cylinder2(0.066, 0.58, gripMaterial, 0.27, 0, 0, 8);
  grip.rotation.z = Math.PI / 2;
  grip.rotation.x = Math.PI / 8;
  group2.add(grip);
  const wrap = [];
  for (let i = 0; i <= 200; i++) {
    const u = i / 200, angle = u * Math.PI * 2 * 9;
    wrap.push(new THREE9__namespace.Vector3(0.02 + u * 0.52, Math.cos(angle) * 0.067, Math.sin(angle) * 0.067));
  }
  group2.add(
    new THREE9__namespace.Mesh(
      new THREE9__namespace.TubeGeometry(new THREE9__namespace.CatmullRomCurve3(wrap), 400, 6e-3, 4, false),
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
async function tennis(palette2, edition = 0, modelUrl) {
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
  const canR = 0.155, canL = 0.92;
  can.position.set(1.1, FLOOR2 + canR, -0.15);
  can.rotation.y = 1.15;
  set.add(can);
  const body = new THREE9__namespace.Mesh(new THREE9__namespace.CylinderGeometry(canR, canR, canL, 40, 1, true), mat.aluminium);
  body.rotation.x = Math.PI / 2;
  can.add(body);
  const inside = new THREE9__namespace.Mesh(
    new THREE9__namespace.CylinderGeometry(canR - 8e-3, canR - 8e-3, canL, 40, 1, true),
    chunk7OAMHGZK_cjs.themed(chunk7OAMHGZK_cjs.lookMaterial("plastic", 2040867, { side: THREE9__namespace.BackSide, roughness: 0.7 }), {})
  );
  inside.rotation.x = Math.PI / 2;
  can.add(inside);
  const label2 = new THREE9__namespace.Mesh(new THREE9__namespace.CylinderGeometry(canR + 4e-3, canR + 4e-3, 0.42, 40, 1, true), mat.accent);
  label2.rotation.x = Math.PI / 2;
  label2.position.z = -0.05;
  can.add(label2);
  const lid = cylinder2(canR + 0.012, 0.05, mat.graphite, 0, 0, -canL / 2 - 0.02, 40);
  lid.rotation.x = Math.PI / 2;
  can.add(lid);
  const rim = new THREE9__namespace.Mesh(new THREE9__namespace.TorusGeometry(canR, 0.012, 8, 40), mat.steel);
  rim.position.z = canL / 2;
  can.add(rim);
  const inMouth = makeBall();
  inMouth.position.set(0, -canR + BALL_R + 0.012, canL / 2 - 0.06);
  inMouth.rotation.set(0.4, 1.1, 0.2);
  can.add(inMouth);
  const spare = makeBall();
  spare.position.set(1, FLOOR2 + BALL_R, 0.62);
  spare.rotation.set(1.2, 0.3, 0.6);
  set.add(spare);
  const { group: frame, head } = racket(mat);
  const pivot = new THREE9__namespace.Group();
  pivot.position.set(-1.45, FLOOR2 + 0.06, 0.25);
  pivot.rotation.y = 0.18;
  set.add(pivot);
  pivot.add(frame);
  const tilt = Math.asin((2 * canR - 0.04) / 2.25);
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
  blob2(canR * 3.2, canL * 1.25, can.position.x, can.position.z, can.rotation.y, 0.55);
  blob2(BALL_R * 3.4, BALL_R * 3.4, spare.position.x, spare.position.z);
  const butt = new THREE9__namespace.Vector3(0.2, 0, 0).applyMatrix4(frame.matrix).applyMatrix4(pivot.matrix);
  blob2(0.75, 0.32, butt.x, butt.z, pivot.rotation.y + Math.PI / 2, 0.4);
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
    const t = (time % LOOP + LOOP) % LOOP;
    const s = ((t - FIRST) % BOUNCE + BOUNCE) % BOUNCE;
    const u = s / BOUNCE;
    ball.position.set(contact2.x, contact2.y + APEX * 4 * u * (1 - u), contact2.z);
    const near = Math.min(s, BOUNCE - s);
    const squash = Math.max(0, 1 - near / 70) ** 2;
    ball.scale.set(1 + 0.12 * squash, 1 - 0.2 * squash, 1 + 0.12 * squash);
    ball.rotation.set(t / LOOP * Math.PI * 4, 0.5, t / LOOP * Math.PI * 2);
    const since = s;
    frame.rotation.z = tilt - 0.01 * Math.sin(since / 22) * Math.exp(-since / 110);
    root.userData.phase = u < 0.5 ? "rise" : "fall";
    root.userData.pose = t / LOOP;
  };
  return finish(root, { ...studioLook, contactShadow: false });
}
function trading(palette2, edition = 0) {
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
  const wickMaterial = chunk7OAMHGZK_cjs.lookMaterial("plastic", 5988959, { roughness: 0.4 });
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
    const t = (time % MARKET_LOOP_MS + MARKET_LOOP_MS) % MARKET_LOOP_MS;
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
  return finish(root);
}
function server(palette2) {
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
    const bezel = i === 1 ? mat.accent : mat.aluminium;
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
        const guard = [0.235, 0.16, 0.085].map((r) => new THREE9__namespace.TorusGeometry(r, 8e-3, 6, 40));
        for (const angle of [0, Math.PI / 2]) {
          const spoke = new THREE9__namespace.CylinderGeometry(7e-3, 7e-3, 0.47, 6);
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
          ledMatrices.push(at(x + 0.08, y + 0.08, front + 0.026));
          ledColours.push((n + r) % 3 === 0 ? AMBER : palette2.accent);
          ledUnit.push(i);
        }
      unit.add(instanced(new RoundedBoxGeometry_js.RoundedBoxGeometry(0.15, 0.12, 0.03, 1, 0.01), portMaterial, ports));
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
          new THREE9__namespace.Vector3(from[0], from[1], front + 0.05),
          new THREE9__namespace.Vector3(from[0], from[1] - 0.12, front + 0.22),
          new THREE9__namespace.Vector3((from[0] + to[0]) / 2, -0.4, front + 0.34),
          new THREE9__namespace.Vector3(to[0], to[1] - 0.12, front + 0.22),
          new THREE9__namespace.Vector3(to[0], to[1], front + 0.05)
        ]);
        unit.add(new THREE9__namespace.Mesh(new THREE9__namespace.TubeGeometry(curve, 48, 0.032, 10, false), material));
        for (const end of [from, to]) unit.add(box2(0.13, 0.11, 0.09, material, end[0], end[1], front + 0.07, 0.025));
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
  root.userData.animate = (time) => {
    const t = Math.min(time, DURATION);
    units.forEach((unit, i) => {
      const q = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 180 + i * 650, 1500 + i * 650));
      unit.position.z = chunkSDBNPDW6_cjs.lerp(1.1, 0, q);
      unit.position.y = unit.userData.y + 0.05 * Math.sin(q * Math.PI);
    });
    const power = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 2800, 4200));
    fans.forEach((fan, i) => fan.rotation.z = -power * (Math.PI * 4 + i * 0.6));
    rack.updateMatrixWorld(true);
    ledMatrices.forEach((matrix, n) => {
      ledMesh.setMatrixAt(n, ledScratch.multiplyMatrices(rack.matrix, unitOf(n).matrix).multiply(matrix));
      const lit = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 2800 + n * 45, 3100 + n * 45));
      ledMesh.setColorAt(n, ledColour.copy(off).lerp(new THREE9__namespace.Color(ledColours[n]).multiplyScalar(1.25), lit));
    });
    ledMesh.instanceMatrix.needsUpdate = true;
    if (ledMesh.instanceColor) ledMesh.instanceColor.needsUpdate = true;
    ledMesh.computeBoundingBox();
    phase(
      root,
      t,
      t < 1500 ? "place-chassis" : t < 2450 ? "place-compute" : t < 3550 ? "place-memory" : "bandwidth-check",
      chunkSDBNPDW6_cjs.progress(t, 180, 4200)
    );
  };
  return finish(root);
}
function travel(palette2, edition = 0) {
  const root = new THREE9__namespace.Group();
  const map = new THREE9__namespace.Group();
  map.rotation.y = -0.05;
  map.position.set(0, FLOOR2 + 1.225, 0.1);
  root.add(map);
  const mat = studioMaterials(palette2);
  const PW = 1.23, PH = 2.45, OPEN2 = 0.98;
  const atlas = document.createElement("canvas");
  atlas.width = 1536;
  atlas.height = 1024;
  const ctx = atlas.getContext("2d");
  const looks = [
    { land: 15394768, contour: 11122836, water: 9682116, wood: 12570790, road: 16513002 },
    { land: 15591380, contour: 11777951, water: 8960207, wood: 12899256, road: 16644590 },
    { land: 15654856, contour: 12888453, water: 10929087, wood: 14009500, road: 16511971 }
  ];
  const look = looks[edition];
  ctx.fillStyle = css(look.land);
  ctx.fillRect(0, 0, 1536, 1024);
  ctx.fillStyle = css(look.wood);
  ctx.globalAlpha = 0.6;
  for (let n = 0; n < 60; n++) {
    ctx.beginPath();
    ctx.ellipse?.(60 + n * 389 % 1420, 60 + n * 251 % 900, 26 + n % 4 * 12, 18 + n % 3 * 9, n, 0, Math.PI * 2);
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
  for (const x of [512, 1024]) {
    const crease = ctx.createLinearGradient?.(x - 40, 0, x + 40, 0);
    if (crease) {
      crease.addColorStop(0, "rgba(90,84,68,0)");
      crease.addColorStop(0.42, "rgba(90,84,68,0.26)");
      crease.addColorStop(0.5, "rgba(90,84,68,0.1)");
      crease.addColorStop(0.58, "rgba(90,84,68,0.26)");
      crease.addColorStop(1, "rgba(90,84,68,0)");
      ctx.fillStyle = crease;
      ctx.fillRect(x - 40, 0, 80, 1024);
    }
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = css(16776434);
    ctx.fillRect(x - 2, 0, 4, 1024);
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = css(5919812);
  ctx.fillRect(0, 504, 1536, 16);
  ctx.globalAlpha = 1;
  const texture = new THREE9__namespace.CanvasTexture(atlas);
  texture.colorSpace = THREE9__namespace.SRGBColorSpace;
  texture.anisotropy = 4;
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
  const flat = new THREE9__namespace.CatmullRomCurve3(routes.map(([x, y]) => new THREE9__namespace.Vector3(x * 0.74, y * 0.85, 0)));
  const flatPoints = flat.getSpacedPoints(240);
  const panelOf = (x) => x < -PW / 2 ? 0 : x > PW / 2 ? 2 : 1;
  const toLocal = (p, panel) => new THREE9__namespace.Vector3(p.x - (panel - 1) * (PW / 2), p.y, 0.013);
  const routeMaterial = chunk7OAMHGZK_cjs.lookMaterial("plastic", palette2.accent, { roughness: 0.5 });
  const folds = [];
  const pieces = [];
  for (let i = 0; i < 3; i++) {
    const fold = new THREE9__namespace.Group();
    fold.position.x = i === 0 ? -PW / 2 : i === 2 ? PW / 2 : 0;
    const center = i === 0 ? -PW / 2 : i === 2 ? PW / 2 : 0;
    const sheet = new THREE9__namespace.BoxGeometry(PW, PH, 0.01, 1, 1, 1);
    const uv = sheet.attributes.uv;
    for (let n = 16; n < 20; n++) uv.setX(n, (uv.getX(n) + i) / 3);
    const print = printed({ map: texture, roughness: 0.9 });
    const panel = new THREE9__namespace.Mesh(sheet, [mat.paper, mat.paper, mat.paper, mat.paper, print, mat.paper]);
    panel.position.x = center;
    fold.add(panel);
    const seat = chunk7OAMHGZK_cjs.contactShadow(PW * 1.04, 0.17, { x: center, y: -PH / 2 + 3e-3, opacity: 0.78 });
    fold.add(seat);
    const indices = flatPoints.map((p, n) => panelOf(p.x) === i ? n : -1).filter((n) => n >= 0);
    if (indices.length > 1) {
      const from = Math.max(0, indices[0] - 1), to = Math.min(flatPoints.length - 1, indices[indices.length - 1] + 1);
      const local = flatPoints.slice(from, to + 1).map((p) => toLocal(p, i));
      const clipX = (p) => p.x = chunkSDBNPDW6_cjs.clamp(p.x, i === 0 ? -PW : -PW / 2, i === 2 ? PW : i === 0 ? 0 : PW / 2);
      local.forEach(clipX);
      const mesh3 = new THREE9__namespace.Mesh(
        new THREE9__namespace.TubeGeometry(new THREE9__namespace.CatmullRomCurve3(local), local.length * 2, 0.02, 6, false),
        routeMaterial
      );
      mesh3.userData.cast = false;
      fold.add(mesh3);
      pieces.push({ mesh: mesh3, from: from / (flatPoints.length - 1), to: to / (flatPoints.length - 1) });
    }
    folds.push(fold);
    map.add(fold);
  }
  const pin = (head) => {
    const group2 = new THREE9__namespace.Group();
    group2.add(turned(cylinder2(0.011, 0.11, mat.steel, 0, 0, 0.05, 8)));
    const collar = cylinder2(0.045, 0.04, head, 0, 0, 0.1, 20);
    collar.rotation.x = Math.PI / 2;
    group2.add(collar);
    const cap = new THREE9__namespace.Mesh(new THREE9__namespace.SphereGeometry(0.08, 24, 16), head);
    cap.position.z = 0.16;
    group2.add(cap);
    const seat = chunk7OAMHGZK_cjs.contactShadow(0.2, 0.2, { x: 0.025, y: -0.025, z: 0.012, opacity: 0.55 });
    seat.rotation.x = 0;
    group2.add(seat);
    group2.userData.seat = seat;
    map.add(group2);
    return group2;
  };
  const start = pin(mat.graphite);
  const traveller = pin(mat.accent);
  const place = (object, u, lift) => {
    const p = flat.getPointAt(chunkSDBNPDW6_cjs.clamp(u));
    const panel = panelOf(p.x);
    const fold = folds[panel];
    fold.updateMatrix();
    object.position.copy(toLocal(p, panel).setZ(lift).applyMatrix4(fold.matrix));
    object.quaternion.copy(fold.quaternion);
    const seat = object.userData.seat;
    seat.position.z = 0.012 - lift;
    seat.material.opacity = 0.55 * (1 - lift / 0.12);
  };
  root.userData.mapFolds = folds;
  root.userData.animate = (time) => {
    const t = Math.min(time, DURATION);
    const left = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 150, 1350)), right = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 450, 1650));
    folds[0].rotation.y = chunkSDBNPDW6_cjs.lerp(Math.PI - 0.07, OPEN2, left);
    folds[2].rotation.y = chunkSDBNPDW6_cjs.lerp(Math.PI - 0.035, OPEN2, right);
    const draw = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 1700, 4650));
    for (const { mesh: mesh3, from, to } of pieces) {
      const share = chunkSDBNPDW6_cjs.clamp((draw - from) / (to - from));
      const count = mesh3.geometry.index.count;
      mesh3.geometry.setDrawRange(0, Math.floor(share * count / 6) * 6);
      mesh3.visible = share > 0;
    }
    const visible = t >= 1650;
    start.visible = traveller.visible = visible;
    place(start, 0, 0);
    const push = chunkSDBNPDW6_cjs.smootherstep(chunkSDBNPDW6_cjs.progress(t, 4650, 5100));
    place(traveller, draw, chunkSDBNPDW6_cjs.lerp(0.09, 0, push));
    phase(root, t, t < 1600 ? "unfold-map" : t < 4650 ? "draw-route" : "arrive", draw);
  };
  const both = studioLook.rig.both;
  return finish(root, {
    ...studioLook,
    rig: { ...studioLook.rig, both: { ...both, hemisphere: { ...both.hemisphere, intensity: 0.45 } } }
  });
}

// src/package-assets.ts
function tennisModelUrl() {
  throw new Error("uipack: the CommonJS build cannot locate assets/objects/tennis-return.glb; pass modelUrl");
}

// src/objects/scenes.ts
var DURATION2 = 5400;
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
function phase2(group2, t, name, pose) {
  group2.userData.phase = t >= DURATION2 ? "rest" : name;
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
    const t = Math.min(time, DURATION2);
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
    phase2(
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
  const variant = chunkGZ2AJZYQ_cjs.normalizeObjectVariant(kind, requested ?? chunkGZ2AJZYQ_cjs.objectLooks[kind][0]);
  const finish2 = kind === "contact" ? variant % 3 : edition;
  const accent = [palette2.accent, 4619160, 10512718][finish2];
  const object = kind === "contact" ? variant === 3 ? createContactDirection() : contact({ ...palette2, accent }) : variant !== 0 ? createArtDirection(kind, variant) : kind === "tennis" ? await tennis({ ...palette2, accent }, finish2, modelUrl ?? tennisModelUrl()) : chunkGZ2AJZYQ_cjs.hasObjectLook(kind, 0) ? await studioBuilders[kind]({ ...palette2, accent }, finish2) : null;
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

exports.DURATION = DURATION2;
exports.createObject = createObject;
exports.disposeObject = disposeObject;
