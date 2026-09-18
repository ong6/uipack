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

// src/slides/model.ts
function clampStop(index, count) {
  return Math.max(
    0,
    Math.min(
      Math.max(0, count - 1),
      Number.isFinite(index) ? Math.trunc(index) : 0
    )
  );
}
function resolveNodePose(node, stop) {
  const pose = stop.nodes?.[node.id];
  return {
    position: [...pose?.position ?? node.position],
    opacity: pose?.opacity ?? 1,
    scale: pose?.scale ?? 1
  };
}
function validateSlideStory(story) {
  const issues = [];
  const ids = /* @__PURE__ */ new Set();
  const finite3 = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
  if (!story.stops.length) issues.push("A story needs at least one stop.");
  for (const n of story.nodes) {
    if (!n.id || ids.has(n.id))
      issues.push(`Duplicate or empty node id: ${n.id}`);
    ids.add(n.id);
    if (!finite3(n.position)) issues.push(`Invalid position: ${n.id}`);
    if (n.size && (!finite3(n.size) || n.size.some((v) => v <= 0)))
      issues.push(`Invalid size: ${n.id}`);
  }
  const edges = /* @__PURE__ */ new Set();
  for (const c of story.connections) {
    if (edges.has(c.id)) issues.push(`Duplicate connection id: ${c.id}`);
    edges.add(c.id);
    if (!ids.has(c.from) || !ids.has(c.to))
      issues.push(`Unknown connection endpoint: ${c.id}`);
    if (c.from === c.to)
      issues.push(`Self-connections are unsupported: ${c.id}`);
  }
  const stops = /* @__PURE__ */ new Set();
  for (const s of story.stops) {
    if (stops.has(s.id)) issues.push(`Duplicate stop id: ${s.id}`);
    stops.add(s.id);
    if (s.transition) {
      const t = s.transition;
      if (t.camera && !["orbit", "dolly"].includes(t.camera))
        issues.push(`Invalid camera motion: ${s.id}`);
      if (t.duration !== void 0 && (!Number.isFinite(t.duration) || t.duration < 0.2 || t.duration > 5))
        issues.push(`Invalid duration: ${s.id}`);
      if (t.stagger !== void 0 && (!Number.isFinite(t.stagger) || t.stagger < 0 || t.stagger > 0.15))
        issues.push(`Invalid stagger: ${s.id}`);
    }
    if (!finite3(s.camera.position) || !finite3(s.camera.target) || s.camera.position.every((v, i) => v === s.camera.target[i]))
      issues.push(`Invalid camera: ${s.id}`);
    for (const [id, pose] of Object.entries(s.nodes ?? {})) {
      if (!ids.has(id)) issues.push(`Unknown node: ${id}`);
      if (pose.position && !finite3(pose.position))
        issues.push(`Invalid pose position: ${id}`);
      if (pose.opacity !== void 0 && (!Number.isFinite(pose.opacity) || pose.opacity < 0 || pose.opacity > 1))
        issues.push(`Invalid opacity: ${id}`);
      if (pose.scale !== void 0 && (!Number.isFinite(pose.scale) || pose.scale <= 0))
        issues.push(`Invalid scale: ${id}`);
    }
    for (const id of s.labels ?? [])
      if (!ids.has(id)) issues.push(`Unknown label: ${id}`);
    for (const id of s.activeConnections ?? [])
      if (!edges.has(id)) issues.push(`Unknown active connection: ${id}`);
  }
  return issues;
}
var slidePalettes;
var init_model = __esm({
  "src/slides/model.ts"() {
    "use strict";
    slidePalettes = {
      dark: {
        background: "#0e1512",
        surface: "#14201b",
        ink: "#e8ece9",
        muted: "#9aa39e",
        rule: "#43544b",
        accent: "#71dcb2",
        request: "#8ea4ff",
        response: "#5fd39b",
        change: "#c39aff"
      },
      light: {
        background: "#ffffff",
        surface: "#ffffff",
        ink: "#1a1c1a",
        muted: "#5c625e",
        rule: "#bac3bc",
        accent: "#205f49",
        request: "#4f6fe6",
        response: "#3fb27f",
        change: "#9a63e0"
      }
    };
  }
});

// src/slides/renderer.ts
var renderer_exports = {};
__export(renderer_exports, {
  createSlideScene: () => createSlideScene
});
function createSlideScene(host, labels, story, initial, theme, reduced, onLost, onSettled, onSelect) {
  let selected = null;
  let zoom = 1;
  const colors = slidePalettes[theme];
  const tone = (value) => colors[value === "neutral" || !value ? "rule" : value];
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(colors.background, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.dataset.slideCanvas = "true";
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 160);
  const ambient = new THREE.HemisphereLight(
    theme === "dark" ? 14286830 : 16777215,
    2111019,
    2.2
  );
  scene.add(ambient);
  const key = new THREE.DirectionalLight(16777215, 3.1);
  key.position.set(4, 12, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(7462066, 1.2);
  fill.position.set(-8, 2, -6);
  scene.add(fill);
  const gridData = [];
  for (let x = -20; x <= 20; x++)
    for (let z = -20; z <= 20; z++) gridData.push(x, -3.8, z);
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(gridData, 3)
  );
  const grid = new THREE.Points(
    gridGeometry,
    new THREE.PointsMaterial({
      color: colors.rule,
      size: 0.036,
      transparent: true,
      opacity: 0.6
    })
  );
  scene.add(grid);
  const nodes = /* @__PURE__ */ new Map();
  const trackedMaterials = /* @__PURE__ */ new Set();
  const trackedGeometries = /* @__PURE__ */ new Set();
  function track(object) {
    const mesh = object;
    if (mesh.geometry) trackedGeometries.add(mesh.geometry);
    if (mesh.material)
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(
        (m) => trackedMaterials.add(m)
      );
    return object;
  }
  track(grid);
  for (const n of story.nodes) {
    const group = new THREE.Group();
    group.name = n.id;
    scene.add(group);
    const size = n.size ?? [1.65, 0.6, 1.05];
    const geometry = n.kind === "sphere" ? new THREE.IcosahedronGeometry(size[0] / 2, 2) : new THREE.BoxGeometry(...size);
    const materials = [];
    const boundary = n.kind === "boundary";
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.surface).lerp(
        new THREE.Color(tone(n.tone)),
        boundary ? 0 : 0.09
      ),
      roughness: 0.52,
      metalness: 0.15,
      transparent: true,
      opacity: boundary ? 0.04 : 1,
      depthWrite: !boundary
    });
    material.userData.baseOpacity = boundary ? 0.025 : 1;
    const mesh = track(new THREE.Mesh(geometry, material));
    group.add(mesh);
    materials.push(material);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: boundary ? colors.accent : tone(n.tone),
      transparent: true,
      opacity: boundary ? 0.5 : 0.9
    });
    edgeMaterial.userData.baseOpacity = boundary ? 0.72 : 0.85;
    group.add(
      track(
        new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial)
      )
    );
    materials.push(edgeMaterial);
    if (n.kind === "sphere") {
      for (const angle of [0, Math.PI / 2]) {
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: tone(n.tone),
          transparent: true,
          opacity: 0.35
        });
        ringMaterial.userData.baseOpacity = 0.35;
        const ring = track(
          new THREE.Mesh(
            new THREE.TorusGeometry(size[0] * 0.66, 0.012, 6, 64),
            ringMaterial
          )
        );
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = angle;
        group.add(ring);
        materials.push(ringMaterial);
      }
    }
    if (n.kind === "layer" && size[0] > 4) {
      const recordMaterial = new THREE.MeshStandardMaterial({
        color: tone(n.tone),
        roughness: 0.8,
        transparent: true,
        opacity: 0.28
      });
      recordMaterial.userData.baseOpacity = 0.28;
      const records = track(
        new THREE.InstancedMesh(
          new THREE.BoxGeometry(0.48, 0.035, 0.6),
          recordMaterial,
          28
        )
      );
      const matrix = new THREE.Matrix4();
      for (let i = 0; i < 28; i++) {
        matrix.makeTranslation(
          (i % 7 - 3) * 0.76,
          size[1] / 2 + 0.04,
          (Math.floor(i / 7) - 1.5) * 0.86
        );
        records.setMatrixAt(i, matrix);
      }
      group.add(records);
      materials.push(recordMaterial);
    }
    if (!boundary && n.kind !== "sphere") {
      const stripeMaterial = new THREE.MeshBasicMaterial({
        color: tone(n.tone),
        transparent: true
      });
      stripeMaterial.userData.baseOpacity = 0.85;
      const stripe = track(
        new THREE.Mesh(
          new THREE.BoxGeometry(size[0] * 0.72, 0.025, 0.025),
          stripeMaterial
        )
      );
      stripe.position.set(0, size[1] / 2 + 0.012, size[2] * 0.32);
      group.add(stripe);
      materials.push(stripeMaterial);
      if (n.kind === "layer") {
        for (let i = 1; i <= 2; i++) {
          const layerMat = new THREE.LineBasicMaterial({
            color: tone(n.tone),
            transparent: true,
            opacity: 0.35
          });
          layerMat.userData.baseOpacity = 0.35;
          const edge = track(
            new THREE.LineSegments(new THREE.EdgesGeometry(geometry), layerMat)
          );
          edge.position.y = -i * 0.16;
          group.add(edge);
          materials.push(layerMat);
        }
      }
    }
    const pose = resolveNodePose(n, initial);
    const label = [...labels.children].find(
      (el) => el.dataset.node === n.id
    );
    nodes.set(n.id, {
      spec: n,
      group,
      materials,
      label,
      pose: {
        x: pose.position[0],
        y: pose.position[1],
        z: pose.position[2],
        opacity: pose.opacity,
        scale: pose.scale
      }
    });
  }
  const links = story.connections.map((c) => {
    const material = new THREE.LineBasicMaterial({
      color: tone(c.tone),
      transparent: true,
      opacity: 0.35
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(75), 3)
    );
    const line = track(new THREE.Line(geometry, material));
    line.frustumCulled = false;
    scene.add(line);
    const packetGeometry = c.tone === "response" ? new THREE.SphereGeometry(0.07, 10, 6) : new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const packet = track(
      new THREE.Mesh(
        packetGeometry,
        new THREE.MeshBasicMaterial({ color: tone(c.tone), transparent: true })
      )
    );
    if (c.tone === "change") packet.rotation.z = Math.PI / 4;
    scene.add(packet);
    const arrow = track(
      new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.15, 8),
        new THREE.MeshBasicMaterial({
          color: tone(c.tone),
          transparent: true,
          opacity: 0.6
        })
      )
    );
    scene.add(arrow);
    return {
      spec: c,
      line,
      material,
      packet,
      arrow,
      points: []
    };
  });
  let stop = initial, paused = false, isReduced = reduced, disposed = false, raf = 0, transition;
  let clock = 0, lastTime = 0, visible = true, width = 1, height = 1;
  const cam = {
    x: initial.camera.position[0],
    y: initial.camera.position[1],
    z: initial.camera.position[2],
    tx: initial.camera.target[0],
    ty: initial.camera.target[1],
    tz: initial.camera.target[2]
  };
  const projected = new THREE.Vector3();
  const target = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const presentation = { labels: 1, flow: 1 };
  const active = () => new Set(stop.activeConnections ?? []);
  function pointAt(points, progress) {
    const lengths = points.slice(1).map((p, i) => p.distanceTo(points[i]));
    const total = lengths.reduce((a, b) => a + b, 0);
    let distance = total * progress;
    for (let i = 0; i < lengths.length; i++) {
      if (distance <= lengths[i] || i === lengths.length - 1)
        return points[i].clone().lerp(points[i + 1], lengths[i] ? distance / lengths[i] : 0);
      distance -= lengths[i];
    }
    return points[0].clone();
  }
  function anchor(node, toward) {
    const center = node.group.position.clone(), d = toward.clone().sub(center);
    const size = node.spec.size ?? [1.65, 0.6, 1.05];
    const distances = [d.x, d.y, d.z].map(
      (v, i) => Math.abs(v) > 1e-4 ? size[i] * node.pose.scale / 2 / Math.abs(v) : Infinity
    );
    return center.addScaledVector(d, Math.min(...distances, 0.45)).addScaledVector(d.clone().normalize(), 0.11);
  }
  function draw() {
    if (disposed) return;
    target.set(cam.tx, cam.ty, cam.tz);
    camera.position.set(cam.x, cam.y, cam.z).sub(target).multiplyScalar(Math.max(1, 1.45 / camera.aspect) / zoom).add(target);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    const ids = stop.labels ? new Set(stop.labels) : void 0;
    const boxes = [];
    for (const n of nodes.values()) {
      n.group.position.set(n.pose.x, n.pose.y, n.pose.z);
      n.group.scale.setScalar(n.pose.scale);
      n.group.visible = n.pose.opacity > 5e-3;
      n.materials.forEach((m) => {
        m.opacity = n.pose.opacity * (m.userData.baseOpacity ?? 1);
        if (m instanceof THREE.MeshStandardMaterial) {
          m.emissive.set(selected === n.spec.id ? colors.accent : 0);
          m.emissiveIntensity = selected === n.spec.id ? 0.3 : 0;
        }
      });
      if (!n.label) continue;
      const eligible = (ids ? ids.has(n.spec.id) : n.spec.kind !== "boundary") && n.pose.opacity >= 0.3 && presentation.labels > 0.01;
      projected.copy(n.group.position);
      projected.y += (n.spec.size?.[1] ?? 0.6) / 2 * n.pose.scale;
      projected.project(camera);
      const x = (projected.x * 0.5 + 0.5) * width, y = (-projected.y * 0.5 + 0.5) * height;
      const w = n.label.offsetWidth || 130, h = n.label.offsetHeight || 44;
      let placement;
      if (eligible && projected.z > -1 && projected.z < 1 && x >= 0 && x <= width && y >= 0 && y <= height) {
        for (const [dx, dy] of [
          [0, -h - 10],
          [0, 20],
          [-w * 0.55, -h / 2],
          [w * 0.55, -h / 2],
          [0, -h * 2 - 16]
        ]) {
          const candidate = {
            x: Math.max(4, Math.min(width - w - 4, x - w / 2 + dx)),
            y: Math.max(84, Math.min(height - h - 4, y + dy)),
            w,
            h
          };
          if (!boxes.some(
            (b) => candidate.x < b.x + b.w + 6 && candidate.x + w + 6 > b.x && candidate.y < b.y + b.h + 6 && candidate.y + h + 6 > b.y
          )) {
            placement = candidate;
            break;
          }
        }
      }
      n.label.style.visibility = placement ? "visible" : "hidden";
      n.label.style.opacity = placement ? String(presentation.labels) : "0";
      if (placement) {
        boxes.push(placement);
        n.label.style.transform = `translate(${placement.x}px, ${placement.y}px)`;
      }
    }
    const currentActive = active();
    for (const l of links) {
      const source = nodes.get(l.spec.from), dest = nodes.get(l.spec.to);
      const visibility = Math.min(source.pose.opacity, dest.pose.opacity);
      const start = anchor(source, dest.group.position), end = anchor(dest, source.group.position);
      const bend1 = start.clone().lerp(end, 0.42), bend2 = start.clone().lerp(end, 0.58);
      bend1.y += 0.2;
      bend2.y += 0.2;
      l.points = new THREE.CubicBezierCurve3(
        start,
        bend1,
        bend2,
        end
      ).getPoints(24);
      const attr = l.line.geometry.getAttribute(
        "position"
      );
      l.points.forEach((p, i) => attr.setXYZ(i, p.x, p.y, p.z));
      attr.needsUpdate = true;
      l.material.opacity = visibility * (currentActive.has(l.spec.id) ? 0.12 + 0.83 * presentation.flow : 0.12);
      l.line.visible = visibility > 0.05;
      l.arrow.visible = visibility > 0.25 && currentActive.has(l.spec.id);
      l.arrow.position.copy(
        end.clone().sub(end.clone().sub(bend2).normalize().multiplyScalar(0.07))
      );
      l.arrow.quaternion.setFromUnitVectors(
        up,
        end.clone().sub(bend2).normalize()
      );
      l.packet.visible = visibility > 0.25 && currentActive.has(l.spec.id);
      if (l.packet.visible) {
        const progress = isReduced ? 0.5 : (clock * 0.27 + links.indexOf(l) * 0.19) % 1;
        l.packet.position.copy(pointAt(l.points, progress));
        l.packet.material.opacity = visibility * presentation.flow * Math.min(1, progress * 10, (1 - progress) * 10);
      }
    }
    renderer.render(scene, camera);
  }
  function tick(time) {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    if (!paused && !isReduced)
      clock += Math.min((time - (lastTime || time)) / 1e3, 0.05);
    lastTime = time;
    draw();
    if (!paused && !isReduced && (stop.activeConnections?.length ?? 0) > 0 || transition?.isActive())
      raf = requestAnimationFrame(tick);
  }
  function wake() {
    if (!disposed && !raf && visible && !document.hidden) {
      lastTime = 0;
      raf = requestAnimationFrame(tick);
    }
  }
  function resize() {
    const rect = host.getBoundingClientRect();
    width = Math.max(rect.width, 1);
    height = Math.max(rect.height, 1);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
    wake();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) wake();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }) : void 0;
  intersection?.observe(host);
  function visibilityChanged() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      draw();
      wake();
    }
  }
  document.addEventListener("visibilitychange", visibilityChanged);
  const lost = (event) => {
    event.preventDefault();
    onLost();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  function goTo(next, immediate = false) {
    transition?.kill();
    stop = next;
    const duration = immediate || isReduced ? 0 : next.transition?.duration ?? 1.6;
    const destination = {
      x: next.camera.position[0],
      y: next.camera.position[1],
      z: next.camera.position[2],
      tx: next.camera.target[0],
      ty: next.camera.target[1],
      tz: next.camera.target[2]
    };
    if (!duration) {
      presentation.labels = presentation.flow = 1;
      Object.assign(cam, destination);
      nodes.forEach((n) => {
        const p = resolveNodePose(n.spec, next);
        Object.assign(n.pose, {
          x: p.position[0],
          y: p.position[1],
          z: p.position[2],
          scale: p.scale,
          opacity: p.opacity
        });
      });
      draw();
      onSettled(next.id);
      wake();
      return;
    }
    transition = import_gsap.gsap.timeline({
      onUpdate: wake,
      onComplete: () => {
        draw();
        onSettled(next.id);
      }
    });
    transition.to(presentation, { labels: 0, flow: 0, duration: 0.12 }, 0);
    if (next.transition?.camera === "dolly") {
      transition.to(
        cam,
        { ...destination, duration, ease: "sine.inOut" },
        0.12
      );
    } else {
      const from = new THREE.Spherical().setFromVector3(
        new THREE.Vector3(cam.x - cam.tx, cam.y - cam.ty, cam.z - cam.tz)
      );
      const to = new THREE.Spherical().setFromVector3(
        new THREE.Vector3(
          destination.x - destination.tx,
          destination.y - destination.ty,
          destination.z - destination.tz
        )
      );
      const orbit = {
        radius: from.radius,
        phi: from.phi,
        theta: from.theta,
        tx: cam.tx,
        ty: cam.ty,
        tz: cam.tz
      };
      const delta = Math.atan2(
        Math.sin(to.theta - from.theta),
        Math.cos(to.theta - from.theta)
      );
      const offset = new THREE.Vector3();
      transition.to(
        orbit,
        {
          radius: to.radius,
          phi: to.phi,
          theta: from.theta + delta,
          tx: destination.tx,
          ty: destination.ty,
          tz: destination.tz,
          duration,
          ease: "sine.inOut",
          onUpdate: () => {
            offset.setFromSphericalCoords(orbit.radius, orbit.phi, orbit.theta);
            Object.assign(cam, {
              x: orbit.tx + offset.x,
              y: orbit.ty + offset.y,
              z: orbit.tz + offset.z,
              tx: orbit.tx,
              ty: orbit.ty,
              tz: orbit.tz
            });
          }
        },
        0.12
      );
    }
    let arrival = 0;
    nodes.forEach((n) => {
      const p = resolveNodePose(n.spec, next);
      transition.to(
        n.pose,
        {
          x: p.position[0],
          y: p.position[1],
          z: p.position[2],
          scale: p.scale,
          opacity: p.opacity,
          duration,
          ease: "sine.inOut"
        },
        0.12 + arrival++ * (next.transition?.stagger ?? 0)
      );
    });
    transition.to(presentation, {
      labels: 1,
      flow: 1,
      duration: 0.22,
      ease: "sine.out"
    });
    wake();
  }
  const raycaster = new THREE.Raycaster();
  let down = null;
  const pointerDown = (event) => {
    down = { x: event.clientX, y: event.clientY };
  };
  const pointerUp = (event) => {
    if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) {
      down = null;
      return;
    }
    down = null;
    const rect = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        (event.clientX - rect.left) / rect.width * 2 - 1,
        -(event.clientY - rect.top) / rect.height * 2 + 1
      ),
      camera
    );
    const candidates = [...nodes.values()].filter(
      (n) => n.spec.kind !== "boundary" && n.pose.opacity > 0.25
    );
    const hit = raycaster.intersectObjects(
      candidates.map((n) => n.group),
      true
    )[0];
    let object = hit?.object;
    while (object && !nodes.has(object.name))
      object = object.parent ?? void 0;
    onSelect(object ? object.name === selected ? null : object.name : null);
  };
  renderer.domElement.addEventListener("pointerdown", pointerDown);
  renderer.domElement.addEventListener("pointerup", pointerUp);
  resize();
  onSettled(initial.id);
  wake();
  return {
    goTo,
    setSelected(id) {
      selected = id;
      draw();
      wake();
    },
    setZoom(value) {
      zoom = Math.max(0.75, Math.min(2, value));
      draw();
      wake();
    },
    setPaused(value) {
      paused = value;
      wake();
    },
    setReducedMotion(value) {
      isReduced = value;
      if (value) goTo(stop, true);
      else wake();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      transition?.kill();
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection?.disconnect();
      document.removeEventListener("visibilitychange", visibilityChanged);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      trackedGeometries.forEach((g) => g.dispose());
      trackedMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
}
var THREE, import_gsap;
var init_renderer = __esm({
  "src/slides/renderer.ts"() {
    "use strict";
    THREE = __toESM(require("three"), 1);
    import_gsap = require("gsap");
    init_model();
  }
});

// src/slides/index.ts
var slides_exports = {};
__export(slides_exports, {
  SlidePlayer: () => SlidePlayer,
  SlideScene: () => SlideScene,
  architectureShift: () => architectureShift,
  clampStop: () => clampStop,
  harnessDive: () => harnessDive,
  parallelAgents: () => parallelAgents,
  quarterTurn: () => quarterTurn,
  resolveNodePose: () => resolveNodePose,
  retrievalLayers: () => retrievalLayers,
  slidePalettes: () => slidePalettes,
  slideStories: () => slideStories,
  stagedAssembly: () => stagedAssembly,
  validateSlideStory: () => validateSlideStory
});
module.exports = __toCommonJS(slides_exports);

// src/CanvasView.tsx
var import_react = require("react");
var import_react_dom = require("react-dom");
var import_jsx_runtime = require("react/jsx-runtime");
function CanvasView({
  open,
  onClose,
  title,
  children,
  toolbar,
  theme,
  restoreFocus
}) {
  const dialog = (0, import_react.useRef)(null);
  const close = (0, import_react.useRef)(onClose);
  close.current = onClose;
  (0, import_react.useEffect)(() => {
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
              toolbar,
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: onClose, autoFocus: true, children: "Close canvas" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "uipack-canvas-content", children })
        ]
      }
    ),
    document.body
  );
}

// src/slides/SlidePlayer.tsx
var import_react3 = require("react");

// src/context.tsx
var import_react2 = require("react");
var noop = () => {
};
var FigureMotionContext = (0, import_react2.createContext)({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
var QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  const [reduced, setReduced] = (0, import_react2.useState)(false);
  (0, import_react2.useEffect)(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setReduced(e.matches);
    setReduced(mq.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);
  return reduced;
}

// src/slides/SlidePlayer.tsx
init_model();
var import_jsx_runtime2 = require("react/jsx-runtime");
function Diagram({ story, stop }) {
  const visible = story.nodes.filter(
    (n) => n.kind !== "boundary" && resolveNodePose(n, stop).opacity > 0.25
  );
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-slide-diagram", "data-testid": "slide-diagram", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "uipack-slide-diagram__heading", children: "Diagram view" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-slide-diagram__nodes", children: visible.map((n) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { "data-tone": n.tone, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: n.label }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: n.detail })
    ] }, n.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { "aria-label": "Highlighted connections", children: story.connections.filter((c) => stop.activeConnections?.includes(c.id)).map((c) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
      story.nodes.find((n) => n.id === c.from)?.label,
      " ",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-label": "to", children: "\u2192" }),
      " ",
      story.nodes.find((n) => n.id === c.to)?.label
    ] }, c.id)) })
  ] });
}
function SceneViewport({
  story,
  stopId,
  zoom = 1,
  theme = "dark",
  motion = "auto",
  paused = false,
  renderMode = "auto",
  className = "",
  onSettled
}) {
  const host = (0, import_react3.useRef)(null), labels = (0, import_react3.useRef)(null), runtime = (0, import_react3.useRef)();
  const prefersReduced = usePrefersReducedMotion();
  const reduced = motion === "none" || prefersReduced;
  const stop = story.stops.find((s) => s.id === stopId) ?? story.stops[0];
  const latest = (0, import_react3.useRef)({ stop, reduced, paused, onSettled });
  latest.current = { stop, reduced, paused, onSettled };
  const [status, setStatus] = (0, import_react3.useState)(
    "loading"
  );
  const [selected, setSelected] = (0, import_react3.useState)(null);
  const [failed, setFailed] = (0, import_react3.useState)(false);
  const [settled, setSettled] = (0, import_react3.useState)("");
  const [transitioning, setTransitioning] = (0, import_react3.useState)(false);
  (0, import_react3.useEffect)(() => {
    let cancelled = false;
    if (renderMode === "diagram" || failed) {
      setStatus("fallback");
      setTransitioning(false);
      setSettled(latest.current.stop.id);
      return;
    }
    setStatus("loading");
    void Promise.resolve().then(() => (init_renderer(), renderer_exports)).then(({ createSlideScene: createSlideScene2 }) => {
      if (cancelled || !host.current || !labels.current) return;
      try {
        runtime.current = createSlideScene2(
          host.current,
          labels.current,
          story,
          latest.current.stop,
          theme,
          latest.current.reduced,
          () => setFailed(true),
          (id) => {
            if (!cancelled) {
              setSettled(id);
              setTransitioning(false);
              latest.current.onSettled?.(id);
            }
          },
          setSelected
        );
        runtime.current.setPaused(latest.current.paused);
        setStatus("ready");
      } catch {
        if (!cancelled) setFailed(true);
      }
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
      runtime.current?.dispose();
      runtime.current = void 0;
    };
  }, [story, theme, renderMode, failed]);
  (0, import_react3.useEffect)(() => {
    if (renderMode === "diagram" || failed) {
      setSettled(stop.id);
      setTransitioning(false);
      onSettled?.(stop.id);
      return;
    }
    if (runtime.current) {
      setTransitioning(!reduced);
      runtime.current.goTo(stop, reduced);
    }
  }, [stop, renderMode, failed]);
  (0, import_react3.useEffect)(() => {
    runtime.current?.setReducedMotion(reduced);
  }, [reduced]);
  (0, import_react3.useEffect)(() => {
    runtime.current?.setPaused(paused);
  }, [paused]);
  (0, import_react3.useEffect)(() => {
    runtime.current?.setSelected(selected);
  }, [selected, status]);
  (0, import_react3.useEffect)(() => {
    runtime.current?.setZoom(zoom);
  }, [zoom, status]);
  (0, import_react3.useEffect)(() => {
    setSelected(null);
  }, [stop.id]);
  const chosen = story.nodes.find((n) => n.id === selected);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      className: `uipack-slide-scene ${className}`,
      "data-theme": theme,
      "data-renderer": status,
      "data-stop": stop.id,
      "data-settled-stop": settled,
      "data-transitioning": transitioning,
      "data-motion": reduced ? "reduced" : "full",
      "aria-label": `${story.title}: ${stop.title}`,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "div",
          {
            className: "uipack-slide-scene__webgl",
            ref: host,
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { ref: labels, className: "uipack-slide-labels", children: story.nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "button",
          {
            type: "button",
            "aria-label": `Inspect ${n.label}`,
            "aria-pressed": selected === n.id,
            onClick: () => setSelected(selected === n.id ? null : n.id),
            "data-node": n.id,
            "data-tone": n.tone,
            className: "uipack-slide-label",
            style: { visibility: "hidden" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: n.label }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: n.detail })
            ]
          },
          n.id
        )) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-slide-inspect", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { children: [
            "Inspect component",
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "select",
              {
                "aria-label": "Inspect component",
                value: selected ?? "",
                onChange: (e) => setSelected(e.target.value || null),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "Choose a component" }),
                  story.nodes.filter(
                    (n) => n.kind !== "boundary" && resolveNodePose(n, stop).opacity > 0.25
                  ).map((n) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: n.id, children: n.label }, n.id))
                ]
              }
            )
          ] }),
          chosen && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { role: "status", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: chosen.label }),
            chosen.detail && ` \xB7 ${chosen.detail}`,
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => setSelected(null), children: "Clear selection" })
          ] })
        ] }),
        status !== "ready" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Diagram, { story, stop }),
        status === "ready" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-slide-scene__badge", children: [
          "Live 3D ",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\xB7" }),
          " ",
          reduced ? "Reduced motion" : "Authored camera"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-slide-sr", children: story.nodes.filter(
          (n) => n.kind !== "boundary" && resolveNodePose(n, stop).opacity > 0.25
        ).map((n) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
          n.label,
          ": ",
          n.detail
        ] }, n.id)) })
      ]
    }
  );
}
function SlideScene(props) {
  const [canvas, setCanvas] = (0, import_react3.useState)(false);
  const [zoom, setZoom] = (0, import_react3.useState)(1);
  const opener = (0, import_react3.useRef)(null);
  const errors = validateSlideStory(props.story);
  if (errors.length)
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { role: "alert", className: "uipack-slide-error", children: [
      "Invalid slide story: ",
      errors.join(" ")
    ] });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    CanvasView,
    {
      restoreFocus: () => opener.current?.focus(),
      open: canvas,
      onClose: () => {
        setCanvas(false);
        setZoom(1);
      },
      title: props.story.title,
      theme: props.theme ?? "dark",
      toolbar: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            "aria-label": "Zoom out",
            disabled: zoom <= 0.75,
            onClick: () => setZoom((z) => Math.max(0.75, z - 0.25)),
            children: "\u2212"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => setZoom(1), children: "Fit" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            "aria-label": "Zoom in",
            disabled: zoom >= 2,
            onClick: () => setZoom((z) => Math.min(2, z + 0.25)),
            children: "+"
          }
        )
      ] }),
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-scene-card", "data-theme": props.theme ?? "dark", children: [
        !canvas && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            className: "uipack-scene-card__open",
            ref: opener,
            type: "button",
            onClick: () => setCanvas(true),
            children: "Open canvas"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          SceneViewport,
          {
            ...props,
            zoom: canvas ? zoom : props.zoom
          },
          props.story.id
        )
      ] })
    }
  );
}
function Player({
  story,
  stopId,
  defaultStopId,
  onStopChange,
  theme = "dark",
  motion = "auto",
  paused: externalPaused,
  renderMode,
  footer,
  className = "",
  style,
  onSettled
}) {
  const initial = Math.max(
    0,
    story.stops.findIndex((s) => s.id === defaultStopId)
  );
  const [internal, setInternal] = (0, import_react3.useState)(initial), [paused, setPaused] = (0, import_react3.useState)(false), [present, setPresent] = (0, import_react3.useState)(false), [diagram, setDiagram] = (0, import_react3.useState)(false), [canvas, setCanvas] = (0, import_react3.useState)(false), [zoom, setZoom] = (0, import_react3.useState)(1);
  const reduced = usePrefersReducedMotion() || motion === "none";
  const opener = (0, import_react3.useRef)(null);
  const root = (0, import_react3.useRef)(null);
  const titleId = (0, import_react3.useId)();
  const index = stopId === void 0 ? clampStop(internal, story.stops.length) : Math.max(
    0,
    story.stops.findIndex((s) => s.id === stopId)
  );
  const stop = story.stops[index];
  const navigate = (value) => {
    const next = clampStop(value, story.stops.length);
    if (stopId === void 0) setInternal(next);
    if (next !== index) onStopChange?.(story.stops[next].id);
  };
  function keyboard(event) {
    const target = event.target;
    if (target.matches("input, textarea, select") || target.isContentEditable || event.altKey || event.ctrlKey || event.metaKey)
      return;
    const to = event.key === "ArrowRight" || event.key === "PageDown" ? index + 1 : event.key === "ArrowLeft" || event.key === "PageUp" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? story.stops.length - 1 : void 0;
    if (to !== void 0) {
      event.preventDefault();
      navigate(to);
    }
    if (event.key === "Escape") setPresent(false);
  }
  (0, import_react3.useEffect)(() => {
    if (!present) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [present]);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    CanvasView,
    {
      restoreFocus: () => opener.current?.focus(),
      open: canvas,
      onClose: () => {
        setCanvas(false);
        setZoom(1);
      },
      title: story.title,
      theme,
      toolbar: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            "aria-label": "Zoom out",
            disabled: zoom <= 0.75,
            onClick: () => setZoom((z) => Math.max(0.75, z - 0.25)),
            children: "\u2212"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => setZoom(1), children: "Fit" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            "aria-label": "Zoom in",
            disabled: zoom >= 2,
            onClick: () => setZoom((z) => Math.min(2, z + 0.25)),
            children: "+"
          }
        )
      ] }),
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "section",
        {
          ref: root,
          tabIndex: 0,
          onKeyDown: keyboard,
          "aria-label": `${story.title} presentation`,
          className: `uipack-slide-player ${present ? "uipack-slide-player--present" : ""} ${className}`,
          style,
          "data-theme": theme,
          "data-story": story.id,
          "data-stop": stop.id,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-slide-player__top", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: story.title }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
                !canvas && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    ref: opener,
                    type: "button",
                    onClick: () => {
                      setPresent(false);
                      setCanvas(true);
                    },
                    children: "Open canvas"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: () => setDiagram((v) => !v),
                    "aria-pressed": diagram,
                    children: diagram ? "3D view" : "Diagram view"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    type: "button",
                    disabled: reduced || externalPaused !== void 0,
                    onClick: () => setPaused((v) => !v),
                    "aria-pressed": paused,
                    children: paused ? "Resume flow" : "Pause flow"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    type: "button",
                    disabled: canvas,
                    onClick: () => setPresent((v) => !v),
                    "aria-pressed": present,
                    children: present ? "Exit presentation" : "Present"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-slide-player__body", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                "header",
                {
                  className: "uipack-slide-player__copy",
                  "aria-live": "polite",
                  "aria-atomic": "true",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-slide-player__count", children: [
                      String(index + 1).padStart(2, "0"),
                      " /",
                      " ",
                      String(story.stops.length).padStart(2, "0")
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { id: titleId, children: stop.title }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: stop.caption }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-slide-legend", "aria-label": "Flow colors", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "data-tone": "request", children: "Request" }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "data-tone": "response", children: "Response" }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "data-tone": "change", children: "Change" })
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                SceneViewport,
                {
                  story,
                  zoom,
                  stopId: stop.id,
                  theme,
                  motion,
                  paused: externalPaused ?? paused,
                  renderMode: diagram ? "diagram" : renderMode,
                  onSettled
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "nav",
              {
                className: "uipack-slide-player__navigation",
                "aria-label": "Presentation stops",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "button",
                    {
                      type: "button",
                      "aria-label": "Previous stop",
                      disabled: index === 0,
                      onClick: () => navigate(index - 1),
                      children: "\u2190 Previous"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-slide-player__stops", children: story.stops.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "button",
                    {
                      type: "button",
                      "aria-label": `Go to ${s.title}`,
                      "aria-current": index === i ? "step" : void 0,
                      title: s.title,
                      onClick: () => navigate(i),
                      children: String(i + 1).padStart(2, "0")
                    },
                    s.id
                  )) }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "button",
                    {
                      type: "button",
                      "aria-label": "Next stop",
                      disabled: index === story.stops.length - 1,
                      onClick: () => navigate(index + 1),
                      children: "Next \u2192"
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("footer", { className: "uipack-slide-player__footer", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: footer ?? "UIPACK / Spatial stories" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                "\u2190 \u2192 to navigate ",
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\xB7" }),
                " ",
                reduced ? "Reduced motion" : "Click any stop to jump"
              ] })
            ] }),
            stop.notes && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: "uipack-slide-player__notes", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: "Presenter notes" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: stop.notes })
            ] })
          ]
        }
      )
    }
  );
}
function SlidePlayer(props) {
  const errors = validateSlideStory(props.story);
  if (errors.length)
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { role: "alert", className: "uipack-slide-error", children: [
      "Invalid slide story: ",
      errors.join(" ")
    ] });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Player, { ...props }, props.story.id);
}

// src/slides/stories.ts
var harnessDive = {
  id: "harness-dive",
  title: "Inside the agent harness",
  description: "Enter the boundary. Follow the context, tools, and checks around a model.",
  nodes: [
    {
      id: "harness",
      label: "Agent harness",
      position: [0, 0, 0],
      size: [9, 4, 6],
      kind: "boundary"
    },
    {
      id: "input",
      label: "Request",
      detail: "A goal enters",
      position: [-6.5, 0, 0],
      size: [1.6, 0.65, 1],
      tone: "request"
    },
    {
      id: "context",
      label: "Context",
      detail: "Instructions + state",
      position: [-2.8, 0, 0.5],
      tone: "request"
    },
    {
      id: "model",
      kind: "sphere",
      label: "Model",
      detail: "Proposes the next action",
      position: [0, 0, 0],
      size: [2, 1.3, 1.7],
      tone: "accent"
    },
    {
      id: "memory",
      label: "Memory",
      detail: "Retrieve what matters",
      position: [-2.8, 0, -2],
      kind: "layer",
      tone: "change"
    },
    {
      id: "tools",
      label: "Tools",
      detail: "Bounded capabilities",
      position: [2.8, 0, -2],
      tone: "change"
    },
    {
      id: "checks",
      label: "Checks",
      detail: "Permissions + evidence",
      position: [2.8, 0, 0.8],
      tone: "response"
    },
    {
      id: "output",
      label: "Result",
      detail: "Only after verification",
      position: [6.5, 0, 0],
      size: [1.6, 0.65, 1],
      tone: "response"
    }
  ],
  connections: [
    { id: "request", from: "input", to: "context", tone: "request" },
    { id: "context-model", from: "context", to: "model", tone: "request" },
    { id: "memory-context", from: "memory", to: "context", tone: "change" },
    { id: "model-tools", from: "model", to: "tools", tone: "change" },
    { id: "tools-checks", from: "tools", to: "checks", tone: "response" },
    { id: "model-checks", from: "model", to: "checks", tone: "request" },
    { id: "verified", from: "checks", to: "output", tone: "response" }
  ],
  stops: [
    {
      id: "outside",
      title: "The model lives inside a system.",
      caption: "A harness surrounds the model with context, capabilities, and a boundary for what may leave.",
      camera: { position: [14, 10, 20], target: [0, 0, 0] },
      labels: ["input", "model", "output"],
      nodes: {
        context: { opacity: 0.2 },
        memory: { opacity: 0.2 },
        tools: { opacity: 0.2 },
        checks: { opacity: 0.2 }
      },
      notes: "Start with the contract. The model is one component, not the entire agent."
    },
    {
      id: "inside",
      transition: { camera: "dolly", duration: 1.8 },
      title: "Open the harness.",
      caption: "The surrounding machinery becomes visible: context and memory on one side, tools and checks on the other.",
      camera: { position: [8, 9, 13], target: [0, 0, -0.4] },
      labels: ["context", "model", "memory", "tools", "checks"],
      nodes: {
        harness: { opacity: 0.12, scale: 1.12 },
        input: { opacity: 0.12 },
        output: { opacity: 0.12 }
      }
    },
    {
      id: "context",
      title: "Give the model the right context.",
      caption: "Instructions and retrieved memory shape the next decision. More context is useful only when it is relevant.",
      camera: { position: [-5, 7, 10], target: [-1.4, 0, -0.6] },
      labels: ["context", "model", "memory"],
      activeConnections: ["memory-context", "context-model"],
      nodes: {
        harness: { opacity: 0.05 },
        input: { opacity: 0.08 },
        output: { opacity: 0.08 },
        tools: { opacity: 0.16 },
        checks: { opacity: 0.16 }
      }
    },
    {
      id: "action",
      title: "A proposal becomes a tool call.",
      caption: "The model chooses an action; the harness supplies the capability and records what actually happened.",
      camera: { position: [8, 6, 9], target: [1.2, 0, -0.5] },
      labels: ["model", "tools", "checks"],
      activeConnections: ["model-tools", "tools-checks", "model-checks"],
      nodes: {
        harness: { opacity: 0.05 },
        input: { opacity: 0.08 },
        output: { opacity: 0.12 },
        context: { opacity: 0.14 },
        memory: { opacity: 0.14 }
      }
    },
    {
      id: "result",
      title: "Evidence decides what leaves.",
      caption: "A completed action is checked before it becomes a result. The boundary belongs to the harness.",
      camera: { position: [8, 6, 15], target: [3, 0, 0.3] },
      labels: ["model", "checks", "output"],
      activeConnections: ["model-checks", "verified"],
      nodes: {
        harness: { opacity: 0.14 },
        input: { opacity: 0.1 },
        context: { opacity: 0.14 },
        memory: { opacity: 0.14 },
        tools: { opacity: 0.18 }
      }
    }
  ]
};
var retrievalLayers = {
  id: "retrieval-layers",
  title: "A dive through retrieval",
  description: "Explode the knowledge stack, then follow a question into evidence and an answer.",
  nodes: [
    {
      id: "sources",
      label: "Sources",
      detail: "Documents + records",
      position: [0, -2.2, 0],
      size: [7, 0.25, 4.5],
      kind: "layer",
      tone: "neutral"
    },
    {
      id: "index",
      label: "Index",
      detail: "Chunks + embeddings",
      position: [0, -0.9, 0],
      size: [6.3, 0.25, 4],
      kind: "layer",
      tone: "change"
    },
    {
      id: "retrieve",
      label: "Retrieve",
      detail: "Find candidate evidence",
      position: [-2, 0.6, 0],
      tone: "request"
    },
    {
      id: "rank",
      label: "Rerank",
      detail: "Keep the relevant pieces",
      position: [2, 0.6, 0],
      tone: "change"
    },
    {
      id: "question",
      label: "Question",
      detail: "What needs answering?",
      position: [-4.8, 2.1, 0],
      tone: "request"
    },
    {
      id: "answer",
      label: "Answer",
      detail: "Grounded in evidence",
      position: [3, 2.5, 0],
      tone: "response"
    }
  ],
  connections: [
    { id: "ingest", from: "sources", to: "index", tone: "change" },
    { id: "ask", from: "question", to: "retrieve", tone: "request" },
    { id: "lookup", from: "index", to: "retrieve", tone: "response" },
    { id: "rank", from: "retrieve", to: "rank", tone: "change" },
    { id: "answer", from: "rank", to: "answer", tone: "response" }
  ],
  stops: [
    {
      id: "stack",
      title: "Knowledge has layers.",
      caption: "Sources, an index, and a retrieval path sit beneath every grounded answer.",
      camera: { position: [12, 9, 17], target: [0, 0, 0] },
      labels: ["sources", "index", "question", "answer"]
    },
    {
      id: "explode",
      transition: { stagger: 0.08, duration: 1.5 },
      title: "Separate storage from selection.",
      caption: "The index makes evidence findable. Retrieval and ranking decide what the model will actually see.",
      camera: { position: [11, 7, 15], target: [0, 0.1, 0] },
      nodes: {
        sources: { position: [0, -3.3, 0] },
        index: { position: [0, -1.5, 0] },
        retrieve: { position: [-2.3, 0.7, 0] },
        rank: { position: [2.3, 0.7, 0] },
        question: { opacity: 0.15 },
        answer: { position: [3, 3, 0], opacity: 0.15 }
      },
      labels: ["sources", "index", "retrieve", "rank"],
      activeConnections: ["ingest", "lookup"]
    },
    {
      id: "query",
      title: "Trace one question.",
      caption: "A query finds candidates; ranking narrows them to the evidence worth carrying forward.",
      camera: { position: [-8, 7, 13], target: [-0.4, 0.8, 0] },
      labels: ["question", "retrieve", "rank"],
      activeConnections: ["ask", "lookup", "rank"],
      nodes: {
        sources: { opacity: 0.13 },
        index: { opacity: 0.35 },
        answer: { opacity: 0.2 }
      }
    },
    {
      id: "grounded",
      title: "Bring the evidence back up.",
      caption: "The answer depends on selected evidence, not merely on having a large collection of documents.",
      camera: { position: [8, 6, 12], target: [1, 1.2, 0] },
      labels: ["rank", "answer", "index"],
      activeConnections: ["answer"],
      nodes: {
        sources: { opacity: 0.12 },
        question: { opacity: 0.12 },
        retrieve: { opacity: 0.25 }
      }
    }
  ]
};
var parallelAgents = {
  id: "parallel-agents",
  title: "Fan out. Bring evidence back.",
  description: "Turn a single task into parallel investigations, then converge on a reviewed result.",
  nodes: [
    {
      id: "goal",
      label: "Goal",
      detail: "One clear outcome",
      position: [-6, 0, 0],
      tone: "request"
    },
    {
      id: "planner",
      label: "Coordinator",
      detail: "Bounded assignments",
      position: [-3, 0, 0],
      tone: "accent"
    },
    {
      id: "research",
      label: "Research",
      detail: "Sources + facts",
      position: [0, 0, 0],
      tone: "request"
    },
    {
      id: "build",
      label: "Build",
      detail: "An inspectable change",
      position: [0, 0, 0],
      tone: "change"
    },
    {
      id: "review",
      label: "Review",
      detail: "Independent checks",
      position: [0, 0, 0],
      tone: "response"
    },
    {
      id: "merge",
      label: "Synthesis",
      detail: "Resolve disagreements",
      position: [3.6, 0, 0],
      tone: "accent"
    },
    {
      id: "result",
      label: "Result",
      detail: "Evidence attached",
      position: [6.5, 0, 0],
      tone: "response"
    }
  ],
  connections: [
    { id: "goal", from: "goal", to: "planner", tone: "request" },
    ...["research", "build", "review"].flatMap((id, i) => [
      {
        id: `out-${id}`,
        from: "planner",
        to: id,
        tone: ["request", "change", "response"][i]
      },
      {
        id: `in-${id}`,
        from: id,
        to: "merge",
        tone: ["request", "change", "response"][i]
      }
    ]),
    { id: "result", from: "merge", to: "result", tone: "response" }
  ],
  stops: [
    {
      id: "goal",
      title: "Start with a bounded goal.",
      caption: "A coordinator owns the outcome and splits only the work that can proceed independently.",
      camera: { position: [10, 9, 19], target: [0, 0, 0] },
      labels: ["goal", "planner", "result"],
      activeConnections: ["goal"],
      nodes: {
        research: { opacity: 0 },
        build: { opacity: 0 },
        review: { opacity: 0 },
        merge: { opacity: 0.25 }
      }
    },
    {
      id: "fanout",
      transition: { stagger: 0.07, duration: 1.5 },
      title: "Give independent work its own lane.",
      caption: "Research, implementation, and review spread into separate lanes with explicit responsibilities.",
      camera: { position: [10, 11, 18], target: [0, 0, 0] },
      labels: ["planner", "research", "build", "review", "merge"],
      activeConnections: ["out-research", "out-build", "out-review"],
      nodes: {
        research: { position: [0, 0, -3.4] },
        build: { position: [0, 0, 0] },
        review: { position: [0, 0, 3.4] },
        goal: { opacity: 0.18 },
        result: { opacity: 0.18 }
      }
    },
    {
      id: "inspect",
      title: "Look across the lanes.",
      caption: "A change and its review are different artifacts. Independent evidence is useful precisely because it can disagree.",
      camera: { position: [-3, 12, 13], target: [0, 0, 0] },
      labels: ["research", "build", "review"],
      nodes: {
        research: { position: [-2.8, 0, -2] },
        build: { position: [0, 1.2, 0] },
        review: { position: [2.8, 0, 2] },
        goal: { opacity: 0.1 },
        planner: { opacity: 0.15 },
        merge: { opacity: 0.15 },
        result: { opacity: 0.1 }
      }
    },
    {
      id: "converge",
      title: "Converge on one reviewed result.",
      caption: "The coordinator reconciles the evidence. More agents do not remove the need for one accountable decision.",
      camera: { position: [11, 8, 16], target: [2, 0, 0] },
      labels: ["research", "build", "review", "merge", "result"],
      activeConnections: ["in-research", "in-build", "in-review", "result"],
      nodes: {
        research: { position: [0, 0, -2.6] },
        build: { position: [0, 0, 0] },
        review: { position: [0, 0, 2.6] },
        goal: { opacity: 0.08 },
        planner: { opacity: 0.15 }
      }
    }
  ]
};
var quarterTurn = {
  id: "quarter-turn",
  title: "One system, four perspectives",
  description: "A constant-radius quarter turn reveals a different architectural slice without rearranging the system.",
  nodes: [
    {
      id: "core",
      label: "Runtime",
      position: [0, 0, 0],
      kind: "sphere",
      size: [2, 2, 2],
      tone: "accent"
    },
    {
      id: "api",
      label: "Interface",
      detail: "The caller's view",
      position: [0, 0, 3.8],
      tone: "request"
    },
    {
      id: "tools",
      label: "Execution",
      detail: "Capabilities + actions",
      position: [3.8, 0, 0],
      tone: "change"
    },
    {
      id: "data",
      label: "State",
      detail: "Memory + persistence",
      position: [0, 0, -3.8],
      tone: "response"
    },
    {
      id: "policy",
      label: "Control",
      detail: "Permissions + checks",
      position: [-3.8, 0, 0],
      tone: "neutral"
    }
  ],
  connections: ["api", "tools", "data", "policy"].map((id) => ({
    id,
    from: id,
    to: "core",
    tone: "accent"
  })),
  stops: [
    {
      id: "front",
      title: "Start with the interface.",
      caption: "One architecture stays in place. Each turn changes what you explain.",
      camera: { position: [0, 10, 19], target: [0, 0, 0] },
      labels: ["api", "core"]
    },
    {
      id: "right",
      title: "Turn 90\xB0 to execution.",
      caption: "Keep the runtime as the anchor while capabilities come to the foreground.",
      camera: { position: [19, 10, 0], target: [0, 0, 0] },
      labels: ["tools", "core"],
      activeConnections: ["tools"]
    },
    {
      id: "back",
      title: "Another turn reveals state.",
      caption: "The same system, viewed through its memory and persistence boundary.",
      camera: { position: [0, 10, -19], target: [0, 0, 0] },
      labels: ["data", "core"],
      activeConnections: ["data"]
    },
    {
      id: "left",
      title: "Finish with control.",
      caption: "Policy decides which actions may cross the runtime boundary.",
      camera: { position: [-19, 10, 0], target: [0, 0, 0] },
      labels: ["policy", "core"],
      activeConnections: ["policy"]
    }
  ]
};
var stagedAssembly = {
  id: "staged-assembly",
  title: "Build the explanation in layers",
  description: "A fixed camera lets components arrive in sequence, then separates them for inspection.",
  nodes: [
    {
      id: "data",
      label: "Evidence",
      detail: "A reliable foundation",
      position: [0, -2, 0],
      size: [6, 0.3, 4],
      kind: "layer",
      tone: "response"
    },
    {
      id: "tools",
      label: "Capabilities",
      detail: "Bounded operations",
      position: [0, -0.6, 0],
      size: [5, 0.3, 3.4],
      kind: "layer",
      tone: "change"
    },
    {
      id: "runtime",
      label: "Runtime",
      detail: "Coordinate the work",
      position: [0, 0.8, 0],
      size: [4, 0.3, 2.8],
      kind: "layer",
      tone: "request"
    },
    {
      id: "experience",
      label: "Experience",
      detail: "The user's outcome",
      position: [0, 2.2, 0],
      size: [3, 0.3, 2.2],
      kind: "layer",
      tone: "accent"
    }
  ],
  connections: [],
  stops: [
    {
      id: "foundation",
      title: "Begin with evidence.",
      caption: "Introduce the foundation before adding the machinery above it.",
      camera: { position: [11, 8, 17], target: [0, 0, 0] },
      labels: ["data"],
      nodes: {
        tools: { position: [0, 5, 0], opacity: 0 },
        runtime: { position: [0, 6, 0], opacity: 0 },
        experience: { position: [0, 7, 0], opacity: 0 }
      }
    },
    {
      id: "assemble",
      title: "Build up the capabilities.",
      caption: "Each layer arrives in order. The camera stays still so the assembly is the only movement.",
      camera: { position: [11, 8, 17], target: [0, 0, 0] },
      transition: { stagger: 0.14, duration: 1.7 },
      labels: ["tools", "runtime", "experience"]
    },
    {
      id: "separate",
      title: "Pull apart the responsibilities.",
      caption: "Lift the layers to explain what each owns and where the boundaries sit.",
      camera: { position: [11, 8, 17], target: [0, 0, 0] },
      transition: { stagger: 0.1 },
      nodes: {
        data: { position: [0, -3, 0] },
        tools: { position: [0, -1, 0] },
        runtime: { position: [0, 1.2, 0] },
        experience: { position: [0, 3.4, 0] }
      }
    }
  ]
};
var architectureShift = {
  id: "architecture-shift",
  title: "From handoffs to a shared workflow",
  description: "Use a spatial before-and-after: preserve component identities while reorganizing their relationships.",
  nodes: [
    {
      id: "request",
      label: "Request",
      position: [-4.5, 0, 0],
      tone: "request"
    },
    { id: "plan", label: "Plan", position: [-1.5, 0, 0], tone: "accent" },
    { id: "execute", label: "Execute", position: [1.5, 0, 0], tone: "change" },
    { id: "verify", label: "Verify", position: [4.5, 0, 0], tone: "response" },
    {
      id: "state",
      label: "Shared state",
      detail: "Context + evidence",
      position: [0, -0.5, 0],
      kind: "sphere",
      tone: "accent"
    }
  ],
  connections: [
    { id: "a", from: "request", to: "plan", tone: "request" },
    { id: "b", from: "plan", to: "execute", tone: "change" },
    { id: "c", from: "execute", to: "verify", tone: "response" },
    ...["request", "plan", "execute", "verify"].map((id) => ({
      id,
      from: id,
      to: "state",
      tone: "accent"
    }))
  ],
  stops: [
    {
      id: "before",
      title: "A chain of handoffs.",
      caption: "Each stage passes its output onward. Context has to travel with the handoff.",
      camera: { position: [5, 10, 20], target: [0, 0, 0] },
      nodes: { state: { opacity: 0 } },
      labels: ["request", "plan", "execute", "verify"],
      activeConnections: ["a", "b", "c"]
    },
    {
      id: "after",
      title: "Organize around shared state.",
      caption: "The same components gather around a common record of progress and evidence.",
      camera: { position: [5, 10, 20], target: [0, 0, 0] },
      transition: { duration: 2, stagger: 0.06 },
      nodes: {
        request: { position: [-3.4, 0, 0] },
        plan: { position: [0, 0, -3.4] },
        execute: { position: [3.4, 0, 0] },
        verify: { position: [0, 0, 3.4] }
      },
      labels: ["request", "plan", "execute", "verify", "state"],
      activeConnections: ["request", "plan", "execute", "verify"]
    },
    {
      id: "focus",
      title: "Keep the evidence in view.",
      caption: "Move closer to the shared record while preserving the surrounding responsibilities.",
      camera: { position: [3, 8, 13], target: [0, -0.5, 0] },
      transition: { camera: "dolly", duration: 1.8 },
      nodes: {
        request: { position: [-3.4, 0, 0], opacity: 0.25 },
        plan: { position: [0, 0, -3.4], opacity: 0.25 },
        execute: { position: [3.4, 0, 0], opacity: 0.25 },
        verify: { position: [0, 0, 3.4], opacity: 0.25 }
      },
      labels: ["state"]
    }
  ]
};
var slideStories = [
  harnessDive,
  retrievalLayers,
  parallelAgents,
  quarterTurn,
  stagedAssembly,
  architectureShift
];

// src/slides/index.ts
init_model();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SlidePlayer,
  SlideScene,
  architectureShift,
  clampStop,
  harnessDive,
  parallelAgents,
  quarterTurn,
  resolveNodePose,
  retrievalLayers,
  slidePalettes,
  slideStories,
  stagedAssembly,
  validateSlideStory
});
//# sourceMappingURL=slides.cjs.map