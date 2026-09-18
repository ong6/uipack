import {
  resolveNodePose,
  slidePalettes
} from "./chunk-335WTXUP.js";

// src/slides/renderer.ts
import * as THREE from "three";
import { gsap } from "gsap";
function createSlideScene(host, labels, story, initial, theme, reduced, onLost, onSettled) {
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
    camera.position.set(cam.x, cam.y, cam.z).sub(target).multiplyScalar(Math.max(1, 1.45 / camera.aspect)).add(target);
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
            y: Math.max(4, Math.min(height - h - 4, y + dy)),
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
    transition = gsap.timeline({
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
  resize();
  onSettled(initial.id);
  wake();
  return {
    goTo,
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
      trackedGeometries.forEach((g) => g.dispose());
      trackedMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
}
export {
  createSlideScene
};
//# sourceMappingURL=renderer-CISWFHCW.js.map