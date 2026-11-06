import * as THREE from 'three';

// src/objects/look.ts
var lightRigs = {
  light: {
    toneMapping: "aces",
    exposure: 1.05,
    environment: { kind: "room", intensity: 0.35, rotation: 0 },
    reflections: 1,
    hemisphere: { sky: 16119019, ground: 5859192, intensity: 2 },
    key: { color: 16773852, intensity: 2.5, position: [-3, 5, 7], shadow: false, shadowMapSize: 1024, shadowRadius: 4 },
    fill: { color: 16777215, intensity: 0, position: [5, 1, 6] },
    rim: { color: 13032959, intensity: 1.4, position: [4, 2, -3] }
  },
  dark: {
    toneMapping: "aces",
    exposure: 1,
    environment: { kind: "room", intensity: 0.2, rotation: 0 },
    reflections: 0.75,
    hemisphere: { sky: 11846880, ground: 1844272, intensity: 1.15 },
    key: { color: 16771272, intensity: 2.4, position: [-3, 5, 7], shadow: false, shadowMapSize: 1024, shadowRadius: 4 },
    fill: { color: 16777215, intensity: 0, position: [5, 1, 6] },
    rim: { color: 11060991, intensity: 3, position: [4, 3, -4] }
  }
};
function merge(base, patch) {
  if (!patch) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === void 0) continue;
    const current = out[key];
    out[key] = value && typeof value === "object" && !Array.isArray(value) && current && typeof current === "object" ? merge(current, value) : value;
  }
  return out;
}
function resolveLook(look, theme) {
  let rig = merge(merge(lightRigs[theme], look?.rig?.both), look?.rig?.[theme]);
  if (look?.castShadows) rig = merge(rig, { key: { shadow: true } });
  const shadow = look?.contactShadow;
  return {
    rig,
    framing: look?.framing === false ? false : { fill: 0.62, maxWidth: 0.78, lift: 0.02, sample: "loop", ...look?.framing },
    camera: { projection: "orthographic", fov: 30, pitch: 0, yaw: 0, ...look?.camera },
    contactShadow: shadow ? { opacity: theme === "dark" ? 0.5 : 0.42, spread: 1.3, color: 0, ...shadow === true ? {} : shadow } : false,
    castShadows: Boolean(look?.castShadows),
    transmissionBackdrop: look?.transmissionBackdrop?.[theme] ?? (theme === "dark" ? 1844275 : 15527657),
    phoneMultisample: look?.phoneMultisample ?? true
  };
}
function toneMappingFor(rig) {
  return { aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, neutral: THREE.NeutralToneMapping }[rig.toneMapping];
}
function addRigLights(scene, rig, phone = false) {
  scene.add(new THREE.HemisphereLight(rig.hemisphere.sky, rig.hemisphere.ground, rig.hemisphere.intensity));
  const key = new THREE.DirectionalLight(rig.key.color, rig.key.intensity);
  key.position.set(...rig.key.position);
  key.castShadow = rig.key.shadow;
  const texels = phone ? 0.5 : 1;
  key.shadow.mapSize.set(rig.key.shadowMapSize * texels, rig.key.shadowMapSize * texels);
  key.shadow.radius = rig.key.shadowRadius * texels;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -3e-4;
  scene.add(key);
  if (rig.fill.intensity > 0) {
    const fill = new THREE.DirectionalLight(rig.fill.color, rig.fill.intensity);
    fill.position.set(...rig.fill.position);
    scene.add(fill);
  }
  const rim = new THREE.DirectionalLight(rig.rim.color, rig.rim.intensity);
  rim.position.set(...rig.rim.position);
  scene.add(rim);
}
var SoftboxEnvironment = class extends THREE.Scene {
  constructor() {
    super();
    const room = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 12),
      new THREE.MeshBasicMaterial({ color: 1776930, side: THREE.BackSide })
    );
    room.position.y = 2;
    this.add(room);
    const panel = (w, h, intensity, position, color = 16777215) => {
      const light = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
      );
      light.position.set(...position);
      light.lookAt(0, 0, 0);
      this.add(light);
    };
    panel(5, 3.5, 6, [-3, 5, 3], 16774374);
    panel(0.6, 6, 8, [5.5, 1.5, -1]);
    panel(0.6, 6, 3, [-5.5, 1.5, -2], 15134975);
    panel(4, 1.2, 2, [0, 1.5, 5.8]);
    panel(10, 10, 0.25, [0, -1.9, 0], 15789026);
  }
  dispose() {
    this.traverse((item) => {
      const mesh = item;
      mesh.geometry?.dispose();
      mesh.material?.dispose();
    });
  }
};
async function buildEnvironment(renderer, rig) {
  if (rig.environment.kind === "none") return null;
  const source = rig.environment.kind === "softbox" ? new SoftboxEnvironment() : new (await import('three/addons/environments/RoomEnvironment.js')).RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(source, 0.04);
  source.dispose();
  pmrem.dispose();
  return target;
}
var presetReflections = {
  metal: 1.15,
  brushedMetal: 1,
  glass: 1.1,
  ceramic: 0.9,
  paper: 0.3,
  plastic: 0.6,
  rubber: 0.25,
  felt: 0.3
};
function lookMaterial(preset, color, options = {}) {
  const { grain = 4, ...overrides } = options;
  let material;
  switch (preset) {
    case "metal":
      material = new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: 0.24 });
      break;
    case "brushedMetal":
      material = new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.36, anisotropy: 0.65 });
      break;
    case "glass":
      material = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0,
        roughness: 0.04,
        transmission: 1,
        thickness: 0.6,
        ior: 1.5,
        attenuationColor: new THREE.Color(13953279),
        attenuationDistance: 2,
        specularIntensity: 1
      });
      break;
    case "ceramic":
      material = new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.06 });
      break;
    case "paper": {
      const { map, normalMap } = fibreTextures(grain);
      material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0,
        roughness: 0.94,
        map,
        normalMap,
        normalScale: new THREE.Vector2(0.18, 0.18)
      });
      break;
    }
    case "plastic":
      material = new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.48 });
      break;
    case "rubber":
      material = new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.9 });
      break;
    case "felt": {
      const { normalMap } = fibreTextures(grain);
      const tint = new THREE.Color(color).lerp(new THREE.Color(16777215), 0.45);
      material = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0,
        roughness: 1,
        sheen: 1,
        sheenRoughness: 0.8,
        sheenColor: tint,
        normalMap,
        normalScale: new THREE.Vector2(0.35, 0.35)
      });
      break;
    }
  }
  material.setValues(overrides);
  material.userData.lookPreset = preset;
  material.userData.lookReflections = presetReflections[preset] * (overrides.envMapIntensity ?? 1);
  return material;
}
function themed(material, changes) {
  material.userData.themes = changes;
  return material;
}
function shade(color, amount) {
  const value = new THREE.Color(color);
  return amount < 0 ? value.multiplyScalar(1 + amount).getHex() : value.lerp(new THREE.Color(16777215), amount).getHex();
}
function fibreField(size) {
  let seed = 3107663;
  const random = () => {
    seed = seed * 1664525 + 1013904223 >>> 0;
    return seed / 4294967296;
  };
  const field = new Float32Array(size * size);
  for (let i = 0; i < field.length; i++) field[i] = random() * 0.35;
  for (let f = 0; f < size * 3; f++) {
    let x = random() * size, y = random() * size;
    const angle = (random() - 0.5) * 1.2, length = 6 + random() * 18, weight = 0.25 + random() * 0.4;
    for (let s = 0; s < length; s++) {
      field[Math.floor(y + size) % size * size + Math.floor(x + size) % size] += weight;
      x += Math.cos(angle);
      y += Math.sin(angle);
    }
  }
  let max = 0;
  for (const v of field) max = Math.max(max, v);
  for (let i = 0; i < field.length; i++) field[i] /= max;
  return field;
}
var FIBRE_SIZE = 128;
var fibreCache;
function fibreTextures(repeat) {
  const size = FIBRE_SIZE;
  const field = fibreCache ?? (fibreCache = fibreField(size));
  const albedo = new Uint8Array(size * size * 4), normal = new Uint8Array(size * size * 4);
  const at = (x, y) => field[(y + size) % size * size + (x + size) % size];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const tone = Math.round(255 * (0.93 + 0.07 * (1 - field[y * size + x])));
      albedo.set([tone, tone, tone, 255], i);
      const dx = at(x + 1, y) - at(x - 1, y), dy = at(x, y + 1) - at(x, y - 1);
      const n = new THREE.Vector3(-dx * 2, -dy * 2, 1).normalize();
      normal.set([(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255, 255], i);
    }
  const texture = (data, srgb) => {
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };
  return { map: texture(albedo, true), normalMap: texture(normal, false) };
}
function materialTextures(material) {
  return Object.entries(material).filter(([key, value]) => key !== "envMap" && value?.isTexture).map(([, value]) => value);
}
function applyMaterials(object, environment, rig, theme) {
  const seen = /* @__PURE__ */ new Set();
  object.traverse((item) => {
    const mesh = item;
    if (!mesh.material) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (seen.has(material)) continue;
      seen.add(material);
      const standard = material;
      if (environment && material.userData.lookReflections !== void 0 && standard.isMeshStandardMaterial) {
        standard.envMap = environment;
        standard.envMapIntensity = material.userData.lookReflections * rig.reflections;
        standard.envMapRotation.y = rig.environment.rotation;
      }
      const change = material.userData.themes?.[theme];
      if (change) {
        const target = material;
        if (change.color !== void 0) target.color?.set(change.color);
        if (change.emissive !== void 0) target.emissive?.set(change.emissive);
        if (change.emissiveIntensity !== void 0) target.emissiveIntensity = change.emissiveIntensity;
        if (change.roughness !== void 0) target.roughness = change.roughness;
        if (change.opacity !== void 0) {
          target.opacity = change.opacity;
          target.transparent = change.opacity < 1;
        }
      }
      material.needsUpdate = true;
    }
  });
}
function usesTransmission(object) {
  let found = false;
  object.traverse((item) => {
    const mesh = item;
    for (const material of Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [])
      if ((material.transmission ?? 0) > 0) found = true;
  });
  return found;
}
function addTransmissionBackdrop(camera, color) {
  const material = new THREE.MeshBasicMaterial({ color, depthWrite: false, toneMapped: false });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  backdrop.userData.frameIgnore = true;
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -10;
  backdrop.onBeforeRender = (renderer) => {
    material.colorWrite = renderer.getRenderTarget() !== null;
  };
  camera.add(backdrop);
  const fit = () => {
    const depth = camera.far * 0.9;
    backdrop.position.set(0, 0, -depth);
    backdrop.scale.setScalar(Math.max(depth * 4, 200));
  };
  fit();
  return { backdrop, fit };
}
function shadowTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const r = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const a = Math.max(0, 1 - r);
      data.set([255, 255, 255, Math.round(255 * a * a * (3 - 2 * a))], (y * size + x) * 4);
    }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
function contactShadow(width, depth, options = {}) {
  const { opacity = 0.42, color = 0, x = 0, y = 0, z = 0 } = options;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: shadowTexture(),
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(width, depth, 1);
  mesh.position.set(x, y, z);
  mesh.renderOrder = -1;
  mesh.name = "contact-shadow";
  mesh.userData.frameIgnore = true;
  return mesh;
}
function addContactShadow(object, options) {
  object.updateMatrixWorld(true);
  const toLocal = object.matrixWorld.clone().invert();
  const box = new THREE.Box3();
  eachSubjectPoint(object, (point2) => box.expandByPoint(point2.applyMatrix4(toLocal)));
  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const footprint = Math.max(size.x, size.z, 0.2);
  const shadow = contactShadow(
    Math.max(size.x, footprint * 0.5) * options.spread,
    Math.max(size.z, footprint * 0.5) * options.spread,
    {
      ...options,
      x: centre.x,
      y: (options.y ?? box.min.y) + 3e-3,
      z: centre.z
    }
  );
  object.add(shadow);
  return shadow;
}
var POINTS_PER_POSE = 3e3;
var MIN_POINTS_PER_MESH = 48;
var point = new THREE.Vector3();
function framedParts(object) {
  const parts = [];
  object.traverseVisible((item) => {
    if (item.userData.frameIgnore) return;
    const mesh = item;
    const position = mesh.geometry?.getAttribute("position");
    if (!position || !(mesh.isMesh || item.isLine)) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (materials.every((m) => !m || !m.visible || m.opacity === 0)) return;
    parts.push({ mesh, position });
  });
  return parts;
}
function eachSubjectPoint(object, visit) {
  const parts = framedParts(object);
  const total = parts.reduce((sum, part) => sum + part.position.count, 0);
  for (const { mesh, position } of parts) {
    const allowed = Math.max(Math.min(position.count, MIN_POINTS_PER_MESH), POINTS_PER_POSE * position.count / total);
    const stride = Math.max(1, Math.ceil(position.count / allowed));
    for (let i = 0; i < position.count; i += stride) {
      if (mesh.isMesh) mesh.getVertexPosition(i, point);
      else point.fromBufferAttribute(position, i);
      visit(point.applyMatrix4(mesh.matrixWorld));
    }
  }
}
function cameraRotation(camera) {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(THREE.MathUtils.degToRad(-camera.pitch), THREE.MathUtils.degToRad(camera.yaw), 0, "YXZ")
  );
}
function measureSubject(object, rotation, times) {
  const inverse = rotation.clone().invert();
  const points = [];
  for (const time of times) {
    object.userData.animate?.(time);
    object.updateMatrixWorld(true);
    eachSubjectPoint(object, (p) => {
      p.applyQuaternion(inverse);
      points.push(p.x, p.y, p.z);
    });
  }
  return Float32Array.from(points);
}
function framingTimes(object, framing, restTime) {
  const loop = object.userData.loopDuration;
  if (!loop || framing.sample === "rest") return [restTime];
  return [restTime, ...Array.from({ length: 8 }, (_, i) => loop * i / 8)];
}
function fitCamera(camera, points, aspect, framing, rotation) {
  if (points.length < 3) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < points.length; i += 3) {
    minX = Math.min(minX, points[i]);
    maxX = Math.max(maxX, points[i]);
    minY = Math.min(minY, points[i + 1]);
    maxY = Math.max(maxY, points[i + 1]);
    minZ = Math.min(minZ, points[i + 2]);
    maxZ = Math.max(maxZ, points[i + 2]);
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const spanX = Math.max(maxX - minX, 1e-3), spanY = Math.max(maxY - minY, 1e-3);
  let halfHeight;
  let distance;
  if (camera.isPerspectiveCamera) {
    const perspective = camera;
    perspective.aspect = aspect;
    const tanV = Math.tan(THREE.MathUtils.degToRad(perspective.fov / 2)), tanH = tanV * aspect;
    distance = 0;
    for (let i = 0; i < points.length; i += 3) {
      const need = points[i + 2] + Math.max(Math.abs(points[i] - cx) / (tanH * framing.maxWidth), Math.abs(points[i + 1] - cy) / (tanV * framing.fill));
      distance = Math.max(distance, need);
    }
    halfHeight = (distance - (minZ + maxZ) / 2) * tanV;
    perspective.near = Math.max(0.05, (distance - maxZ) * 0.5);
    perspective.far = distance - minZ + 20;
  } else {
    const ortho = camera;
    halfHeight = Math.max(spanY / (2 * framing.fill), spanX / (2 * framing.maxWidth * aspect));
    ortho.left = -halfHeight * aspect;
    ortho.right = halfHeight * aspect;
    ortho.top = halfHeight;
    ortho.bottom = -halfHeight;
    distance = maxZ + 10;
    ortho.near = 0.1;
    ortho.far = maxZ - minZ + 20;
  }
  const lens = new THREE.Vector3(cx, cy - framing.lift * 2 * halfHeight, distance).applyQuaternion(rotation);
  camera.position.copy(lens);
  camera.quaternion.copy(rotation);
  camera.updateProjectionMatrix();
  return { halfHeight, fillHeight: spanY / (2 * halfHeight), fillWidth: spanX / (2 * halfHeight * aspect) };
}
function lineRadius(subjectHeight, px = 1.5, cardHeight = 225, fill = 0.62) {
  return px / 2 * (subjectHeight / (fill * cardHeight));
}

export { SoftboxEnvironment, addContactShadow, addRigLights, addTransmissionBackdrop, applyMaterials, buildEnvironment, cameraRotation, contactShadow, fitCamera, framingTimes, lightRigs, lineRadius, lookMaterial, materialTextures, measureSubject, resolveLook, shade, themed, toneMappingFor, usesTransmission };
