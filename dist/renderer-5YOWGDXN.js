import { slidePalettes, resolveNodePose } from './chunk-BBBJN4JA.js';
import * as THREE from 'three';
import { gsap } from 'gsap';

var DEFAULT_NODE_SIZE = [1.65, 0.6, 1.05];
var FADE_OUT_S = 0.12;
var MOVE_S = 1.6;
var LINK_SEGMENTS = 24;
var GRID_HALF = 20;
var GRID_Y = -3.8;
var LABEL_INSET = 16;
var LABEL_TOP = 84;
var LABEL_GAP = 6;
var CLICK_SLOP_PX = 6;
function createSlideScene(host, labels, story, initial, theme, reduced, onLost, onSettled, onSelect) {
  let selected = null;
  let zoom = 1;
  const colors = slidePalettes[theme];
  const tone = (value) => colors[value === "neutral" || !value ? "rule" : value];
  const renderer = createRenderer(host, colors);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 160);
  addLights(scene, theme);
  const resources = createResourceTracker();
  const track = resources.track;
  scene.add(track(createFloorGrid(colors)));
  const nodes = /* @__PURE__ */ new Map();
  for (const n of story.nodes) {
    const label = [...labels.children].find((el) => el.dataset.node === n.id);
    nodes.set(n.id, buildNodeView(scene, n, initial, label, colors, tone, track));
  }
  const links = story.connections.map((c) => buildLinkView(scene, c, tone, track));
  let stop = initial, paused = false, isReduced = reduced, disposed = false, raf = 0, transition;
  let clock = 0, lastTime = 0, visible = true, width = 1, height = 1;
  const cam = cameraState(initial);
  const target = new THREE.Vector3();
  const presentation = { labels: 1, flow: 1 };
  function draw() {
    if (disposed) return;
    target.set(cam.tx, cam.ty, cam.tz);
    camera.position.set(cam.x, cam.y, cam.z).sub(target).multiplyScalar(Math.max(1, 1.45 / camera.aspect) / zoom).add(target);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    const shownLabels = stop.labels ? new Set(stop.labels) : void 0;
    const placed = [];
    for (const n of nodes.values()) {
      applyNodePose(n, selected === n.spec.id, colors);
      if (n.label) drawLabel(n, n.label, camera, width, height, shownLabels, presentation.labels, placed);
    }
    const active = new Set(stop.activeConnections ?? []);
    links.forEach((l, index) => {
      const flowProgress = isReduced ? 0.5 : (clock * 0.27 + index * 0.19) % 1;
      drawLink(l, nodes, active.has(l.spec.id), presentation.flow, flowProgress);
    });
    renderer.render(scene, camera);
  }
  function tick(time) {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    if (!paused && !isReduced) clock += Math.min((time - (lastTime || time)) / 1e3, 0.05);
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
  function sleep() {
    cancelAnimationFrame(raf);
    raf = 0;
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
    else sleep();
  }) : void 0;
  intersection?.observe(host);
  function visibilityChanged() {
    if (document.hidden) sleep();
    else {
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
    const duration = immediate || isReduced ? 0 : next.transition?.duration ?? MOVE_S;
    const destination = cameraState(next);
    if (!duration) {
      presentation.labels = presentation.flow = 1;
      Object.assign(cam, destination);
      nodes.forEach((n) => Object.assign(n.pose, poseAt(n.spec, next)));
      draw();
      onSettled(next.id);
      wake();
      return;
    }
    transition = gsap.timeline({
      onUpdate: wake,
      onComplete: () => {
        draw();
        onSettled(next.id);
      }
    });
    transition.to(presentation, { labels: 0, flow: 0, duration: FADE_OUT_S }, 0);
    if (next.transition?.camera === "dolly")
      transition.to(cam, { ...destination, duration, ease: "sine.inOut" }, FADE_OUT_S);
    else addOrbit(transition, cam, destination, duration, FADE_OUT_S);
    let arrival = 0;
    nodes.forEach((n) => {
      transition.to(
        n.pose,
        { ...poseAt(n.spec, next), duration, ease: "sine.inOut" },
        FADE_OUT_S + arrival++ * (next.transition?.stagger ?? 0)
      );
    });
    transition.to(presentation, { labels: 1, flow: 1, duration: 0.22, ease: "sine.out" });
    wake();
  }
  const raycaster = new THREE.Raycaster();
  let down = null;
  const pointerDown = (event) => {
    down = { x: event.clientX, y: event.clientY };
  };
  const pointerUp = (event) => {
    const click = down && Math.hypot(event.clientX - down.x, event.clientY - down.y) <= CLICK_SLOP_PX;
    down = null;
    if (!click) return;
    const hit = pickNode(event, renderer.domElement, camera, raycaster, nodes);
    onSelect(hit ? hit === selected ? null : hit : null);
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
      resources.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
}
function createRenderer(host, colors) {
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
  return renderer;
}
function addLights(scene, theme) {
  scene.add(new THREE.HemisphereLight(theme === "dark" ? 14286830 : 16777215, 2111019, 2.2));
  const key = new THREE.DirectionalLight(16777215, 3.1);
  key.position.set(4, 12, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(7462066, 1.2);
  fill.position.set(-8, 2, -6);
  scene.add(fill);
}
function createFloorGrid(colors) {
  const points = [];
  for (let x = -GRID_HALF; x <= GRID_HALF; x++) for (let z = -GRID_HALF; z <= GRID_HALF; z++) points.push(x, GRID_Y, z);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: colors.rule,
      size: 0.036,
      transparent: true,
      opacity: 0.6
    })
  );
}
function createResourceTracker() {
  const materials = /* @__PURE__ */ new Set();
  const geometries = /* @__PURE__ */ new Set();
  const track = (object) => {
    const mesh = object;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => materials.add(m));
    return object;
  };
  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };
  return { track, dispose };
}
function withBaseOpacity(material, baseOpacity) {
  material.userData.baseOpacity = baseOpacity;
  return material;
}
function buildNodeView(scene, n, initial, label, colors, tone, track) {
  const group = new THREE.Group();
  group.name = n.id;
  scene.add(group);
  const size = n.size ?? DEFAULT_NODE_SIZE;
  const geometry = n.kind === "sphere" ? new THREE.IcosahedronGeometry(size[0] / 2, 2) : new THREE.BoxGeometry(...size);
  const materials = [];
  const add = (object, material) => {
    group.add(track(object));
    materials.push(material);
    return object;
  };
  addNodeBody(n, geometry, colors, tone, add);
  if (n.kind === "sphere") addSphereRings(n, size, tone, add);
  if (n.kind === "layer" && size[0] > 4) addLayerRecords(n, size, tone, add);
  if (n.kind !== "boundary" && n.kind !== "sphere") addTopStripe(n, geometry, size, tone, add);
  return { spec: n, group, materials, label, pose: poseAt(n, initial) };
}
function addNodeBody(n, geometry, colors, tone, add) {
  const boundary = n.kind === "boundary";
  const material = withBaseOpacity(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.surface).lerp(new THREE.Color(tone(n.tone)), boundary ? 0 : 0.09),
      roughness: 0.52,
      metalness: 0.15,
      transparent: true,
      opacity: boundary ? 0.04 : 1,
      depthWrite: !boundary
    }),
    boundary ? 0.025 : 1
  );
  add(new THREE.Mesh(geometry, material), material);
  const edgeMaterial = withBaseOpacity(
    new THREE.LineBasicMaterial({
      color: boundary ? colors.accent : tone(n.tone),
      transparent: true,
      opacity: boundary ? 0.5 : 0.9
    }),
    boundary ? 0.72 : 0.85
  );
  add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial), edgeMaterial);
}
function addSphereRings(n, size, tone, add) {
  for (const angle of [0, Math.PI / 2]) {
    const ringMaterial = withBaseOpacity(new THREE.MeshBasicMaterial({ color: tone(n.tone), transparent: true, opacity: 0.35 }), 0.35);
    const ring = add(new THREE.Mesh(new THREE.TorusGeometry(size[0] * 0.66, 0.012, 6, 64), ringMaterial), ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = angle;
  }
}
function addLayerRecords(n, size, tone, add) {
  const COLUMNS = 7;
  const COUNT = 28;
  const recordMaterial = withBaseOpacity(
    new THREE.MeshStandardMaterial({ color: tone(n.tone), roughness: 0.8, transparent: true, opacity: 0.28 }),
    0.28
  );
  const records = new THREE.InstancedMesh(new THREE.BoxGeometry(0.48, 0.035, 0.6), recordMaterial, COUNT);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < COUNT; i++) {
    matrix.makeTranslation((i % COLUMNS - 3) * 0.76, size[1] / 2 + 0.04, (Math.floor(i / COLUMNS) - 1.5) * 0.86);
    records.setMatrixAt(i, matrix);
  }
  add(records, recordMaterial);
}
function addTopStripe(n, geometry, size, tone, add) {
  const stripeMaterial = withBaseOpacity(new THREE.MeshBasicMaterial({ color: tone(n.tone), transparent: true }), 0.85);
  const stripe = add(new THREE.Mesh(new THREE.BoxGeometry(size[0] * 0.72, 0.025, 0.025), stripeMaterial), stripeMaterial);
  stripe.position.set(0, size[1] / 2 + 0.012, size[2] * 0.32);
  if (n.kind !== "layer") return;
  for (let i = 1; i <= 2; i++) {
    const layerMaterial = withBaseOpacity(new THREE.LineBasicMaterial({ color: tone(n.tone), transparent: true, opacity: 0.35 }), 0.35);
    const edge = add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), layerMaterial), layerMaterial);
    edge.position.y = -i * 0.16;
  }
}
function poseAt(n, stop) {
  const pose = resolveNodePose(n, stop);
  return {
    x: pose.position[0],
    y: pose.position[1],
    z: pose.position[2],
    opacity: pose.opacity,
    scale: pose.scale
  };
}
function applyNodePose(n, isSelected, colors) {
  n.group.position.set(n.pose.x, n.pose.y, n.pose.z);
  n.group.scale.setScalar(n.pose.scale);
  n.group.visible = n.pose.opacity > 5e-3;
  n.materials.forEach((m) => {
    m.opacity = n.pose.opacity * (m.userData.baseOpacity ?? 1);
    if (m instanceof THREE.MeshStandardMaterial) {
      m.emissive.set(isSelected ? colors.accent : 0);
      m.emissiveIntensity = isSelected ? 0.3 : 0;
    }
  });
}
var projected = new THREE.Vector3();
function drawLabel(n, label, camera, width, height, shown, labelOpacity, placed) {
  const eligible = (shown ? shown.has(n.spec.id) : n.spec.kind !== "boundary") && n.pose.opacity >= 0.3 && labelOpacity > 0.01;
  projected.copy(n.group.position);
  projected.y += (n.spec.size?.[1] ?? DEFAULT_NODE_SIZE[1]) / 2 * n.pose.scale;
  projected.project(camera);
  const x = (projected.x * 0.5 + 0.5) * width, y = (-projected.y * 0.5 + 0.5) * height;
  const w = label.offsetWidth || 130, h = label.offsetHeight || 44;
  const onScreen = projected.z > -1 && projected.z < 1 && x >= 0 && x <= width && y >= 0 && y <= height;
  const placement = eligible && onScreen ? placeLabel(x, y, w, h, width, height, placed) : void 0;
  label.style.visibility = placement ? "visible" : "hidden";
  label.style.opacity = placement ? String(labelOpacity) : "0";
  if (placement) {
    placed.push(placement);
    label.style.transform = `translate(${placement.x}px, ${placement.y}px)`;
  }
}
function placeLabel(x, y, w, h, width, height, placed) {
  const offsets = [
    [0, -h - 10],
    [0, 20],
    [-w * 0.55, -h / 2],
    [w * 0.55, -h / 2],
    [0, -h * 2 - 16]
  ];
  for (const [dx, dy] of offsets) {
    const candidate = {
      x: Math.max(LABEL_INSET, Math.min(width - w - LABEL_INSET, x - w / 2 + dx)),
      y: Math.max(LABEL_TOP, Math.min(height - h - LABEL_INSET, y + dy)),
      w,
      h
    };
    const overlaps = placed.some(
      (b) => candidate.x < b.x + b.w + LABEL_GAP && candidate.x + w + LABEL_GAP > b.x && candidate.y < b.y + b.h + LABEL_GAP && candidate.y + h + LABEL_GAP > b.y
    );
    if (!overlaps) return candidate;
  }
  return void 0;
}
function buildLinkView(scene, c, tone, track) {
  const material = new THREE.LineBasicMaterial({
    color: tone(c.tone),
    transparent: true,
    opacity: 0.35
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array((LINK_SEGMENTS + 1) * 3), 3));
  const line = track(new THREE.Line(geometry, material));
  line.frustumCulled = false;
  scene.add(line);
  const packetGeometry = c.tone === "response" ? new THREE.SphereGeometry(0.07, 10, 6) : new THREE.BoxGeometry(0.12, 0.12, 0.12);
  const packet = track(new THREE.Mesh(packetGeometry, new THREE.MeshBasicMaterial({ color: tone(c.tone), transparent: true })));
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
  return { spec: c, line, material, packet, arrow, points: [] };
}
var up = new THREE.Vector3(0, 1, 0);
function drawLink(l, nodes, isActive, flow, flowProgress) {
  const source = nodes.get(l.spec.from), dest = nodes.get(l.spec.to);
  const visibility = Math.min(source.pose.opacity, dest.pose.opacity);
  const start = anchor(source, dest.group.position), end = anchor(dest, source.group.position);
  const bend1 = start.clone().lerp(end, 0.42), bend2 = start.clone().lerp(end, 0.58);
  bend1.y += 0.2;
  bend2.y += 0.2;
  l.points = new THREE.CubicBezierCurve3(start, bend1, bend2, end).getPoints(LINK_SEGMENTS);
  const attr = l.line.geometry.getAttribute("position");
  l.points.forEach((p, i) => attr.setXYZ(i, p.x, p.y, p.z));
  attr.needsUpdate = true;
  l.material.opacity = visibility * (isActive ? 0.12 + 0.83 * flow : 0.12);
  l.line.visible = visibility > 0.05;
  const heading = end.clone().sub(bend2).normalize();
  l.arrow.visible = visibility > 0.25 && isActive;
  l.arrow.position.copy(end.clone().sub(heading.clone().multiplyScalar(0.07)));
  l.arrow.quaternion.setFromUnitVectors(up, heading);
  l.packet.visible = visibility > 0.25 && isActive;
  if (l.packet.visible) {
    l.packet.position.copy(pointAt(l.points, flowProgress));
    l.packet.material.opacity = visibility * flow * Math.min(1, flowProgress * 10, (1 - flowProgress) * 10);
  }
}
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
  const size = node.spec.size ?? DEFAULT_NODE_SIZE;
  const distances = [d.x, d.y, d.z].map((v, i) => Math.abs(v) > 1e-4 ? size[i] * node.pose.scale / 2 / Math.abs(v) : Infinity);
  return center.addScaledVector(d, Math.min(...distances, 0.45)).addScaledVector(d.clone().normalize(), 0.11);
}
function cameraState(stop) {
  return {
    x: stop.camera.position[0],
    y: stop.camera.position[1],
    z: stop.camera.position[2],
    tx: stop.camera.target[0],
    ty: stop.camera.target[1],
    tz: stop.camera.target[2]
  };
}
function addOrbit(transition, cam, destination, duration, at) {
  const from = new THREE.Spherical().setFromVector3(new THREE.Vector3(cam.x - cam.tx, cam.y - cam.ty, cam.z - cam.tz));
  const to = new THREE.Spherical().setFromVector3(
    new THREE.Vector3(destination.x - destination.tx, destination.y - destination.ty, destination.z - destination.tz)
  );
  const orbit = {
    radius: from.radius,
    phi: from.phi,
    theta: from.theta,
    tx: cam.tx,
    ty: cam.ty,
    tz: cam.tz
  };
  const delta = Math.atan2(Math.sin(to.theta - from.theta), Math.cos(to.theta - from.theta));
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
    at
  );
}
function pickNode(event, canvas, camera, raycaster, nodes) {
  const rect = canvas.getBoundingClientRect();
  raycaster.setFromCamera(
    new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1),
    camera
  );
  const candidates = [...nodes.values()].filter((n) => n.spec.kind !== "boundary" && n.pose.opacity > 0.25);
  const hit = raycaster.intersectObjects(
    candidates.map((n) => n.group),
    true
  )[0];
  let object = hit?.object;
  while (object && !nodes.has(object.name)) object = object.parent ?? void 0;
  return object ? object.name : null;
}

export { createSlideScene };
