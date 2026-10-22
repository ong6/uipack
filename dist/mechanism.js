// src/mechanism/VerificationGate.tsx
import * as React2 from "react";

// src/mechanism/kit/iso-kit.ts
var AZIMUTH = 45;
var ELEVATION = 30;
var SHADES = 4;
var RADIANS = Math.PI / 180;
var UNIT = Math.sqrt(1.6);
function cameraOf({ scale, azimuth = AZIMUTH, elevation = ELEVATION }) {
  const a = azimuth * RADIANS;
  const e = elevation * RADIANS;
  return { sinA: Math.sin(a), cosA: Math.cos(a), sinE: Math.sin(e), cosE: Math.cos(e), k: scale * UNIT };
}
function iso([x, y, z], projection) {
  const { origin } = projection;
  const { sinA, cosA, sinE, cosE, k } = cameraOf(projection);
  return [origin[0] + (x * sinA - y * cosA) * k, origin[1] + ((x * cosA + y * sinA) * sinE - z * cosE) * k];
}
function towardViewer(projection) {
  const { sinA, cosA } = cameraOf(projection);
  return [cosA, sinA];
}
function depthOf([x, y, z], projection) {
  const { sinA, cosA, sinE, cosE } = cameraOf(projection);
  return (x * cosA + y * sinA) * cosE + z * sinE;
}
var tenth = (value) => {
  const text = (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, "");
  return text === "-0" ? "0" : text;
};
function pathOf(points, closed = false) {
  if (!points.length) return "";
  return points.map(([x, y], at2) => `${at2 ? "L" : "M"}${tenth(x)} ${tenth(y)}`).join("") + (closed ? "Z" : "");
}
var joinPaths = (paths) => paths.filter(Boolean).join("");
function roundedPlan({ x, y, w, d, r }, steps = 8) {
  const radius = Math.max(0, Math.min(r, w / 2, d / 2));
  const corners2 = [
    [x + w - radius, y + radius, -90],
    [x + w - radius, y + d - radius, 0],
    [x + radius, y + d - radius, 90],
    [x + radius, y + radius, 180]
  ];
  const out = [];
  for (const [cx, cy, start] of corners2) {
    const count = radius > 0 ? steps : 0;
    for (let step2 = 0; step2 <= count; step2++) {
      const angle = (start + (count ? 90 * step2 / count : 45)) * RADIANS;
      out.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
  }
  return out;
}
function signedArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index++) {
    const [ax, ay] = points[index];
    const [bx, by] = points[(index + 1) % points.length];
    area += ax * by - bx * ay;
  }
  return area / 2;
}
var oriented = (points) => signedArea(points) < 0 ? [...points].reverse() : points;
function convexHull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross2 = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross2(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper = [];
  for (let index = sorted.length - 1; index >= 0; index--) {
    const point = sorted[index];
    while (upper.length >= 2 && cross2(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
function runsOf(flags, want) {
  const count = flags.length;
  const runs = [];
  const start = flags.findIndex((flag, index) => flag !== flags[(index + count - 1) % count]);
  if (start < 0) return flags[0] === want ? [Array.from({ length: count + 1 }, (_, index) => index % count)] : [];
  let run = null;
  for (let step2 = 0; step2 < count; step2++) {
    const index = (start + step2) % count;
    if (flags[index] === want) {
      if (!run) run = [index];
      run.push((index + 1) % count);
    } else if (run) {
      runs.push(run);
      run = null;
    }
  }
  if (run) runs.push(run);
  return runs;
}
function extrude(ring2, z, height, projection, options = {}) {
  const convex = options.convex ?? true;
  const count = ring2.length;
  const counter = signedArea(ring2) > 0;
  const [vx, vy] = towardViewer(projection);
  const { sinA, cosA } = cameraOf(projection);
  const normals = ring2.map(([ax, ay], index) => {
    const [bx, by] = ring2[(index + 1) % count];
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.hypot(dx, dy) || 1;
    return counter ? [dy / length, -dx / length] : [-dy / length, dx / length];
  });
  const facing = normals.map(([nx, ny]) => nx * vx + ny * vy > 1e-9);
  const top = ring2.map(([x, y]) => iso([x, y, z + height], projection));
  const bottom = ring2.map(([x, y]) => iso([x, y, z], projection));
  const outline = [];
  const crease = [];
  for (const run of runsOf(facing, false)) outline.push(pathOf(run.map((index) => top[index])));
  for (const run of runsOf(facing, true)) {
    crease.push(pathOf(run.map((index) => top[index])));
    if (height > 0) outline.push(pathOf(run.map((index) => bottom[index])));
  }
  if (height > 0) {
    for (let index = 0; index < count; index++) {
      if (facing[(index + count - 1) % count] !== facing[index]) outline.push(pathOf([top[index], bottom[index]]));
    }
  }
  let fill;
  if (convex) {
    fill = pathOf(convexHull([...top, ...bottom]), true);
  } else {
    const parts = [pathOf(oriented(top), true), pathOf(oriented(bottom), true)];
    for (let index = 0; index < count; index++) {
      if (!facing[index]) continue;
      const next = (index + 1) % count;
      parts.push(pathOf(oriented([top[index], top[next], bottom[next], bottom[index]]), true));
    }
    fill = parts.join("");
  }
  const buckets = Array.from({ length: SHADES }, () => []);
  if (height > 0) {
    const [lx, ly] = [-sinA, cosA];
    for (let index = 0; index < count; index++) {
      if (!facing[index]) continue;
      const [nx, ny] = normals[index];
      const lit = (nx * lx + ny * ly + 1) / 2;
      const shade = Math.min(SHADES - 1, Math.max(0, Math.floor(lit * SHADES)));
      const next = (index + 1) % count;
      buckets[shade].push(pathOf(oriented([top[index], top[next], bottom[next], bottom[index]]), true));
    }
  }
  let bevel;
  if (options.bevel && options.bevel > 0) {
    const by = options.bevel;
    const inset = ring2.map(([x, y], index) => {
      const [ax, ay] = normals[(index + count - 1) % count];
      const [bx, by2] = normals[index];
      const mx = ax + bx;
      const my = ay + by2;
      const length = Math.hypot(mx, my) || 1;
      return [x - mx / length * by, y - my / length * by];
    });
    const insetTop = inset.map(([x, y]) => iso([x, y, z + height], projection));
    bevel = runsOf(facing, true).map((run) => pathOf([top[run[0]], ...run.slice(1, -1).map((index) => insetTop[index]), top[run[run.length - 1]]])).join("");
  }
  return {
    fill,
    outline: outline.join(""),
    crease: crease.join(""),
    top: pathOf(oriented(top), true),
    shades: buckets.map((paths) => paths.join("")),
    bevel
  };
}
var ringOf = (plan, steps = 8) => roundedPlan(plan, steps);
function slabOf(plan, z, height, projection, steps = 8, bevel = 0) {
  return extrude(ringOf(plan, steps), z, height, projection, { convex: true, bevel });
}
function circleRing(cx, cy, radius, steps = 40) {
  return Array.from({ length: steps }, (_, step2) => {
    const angle = step2 / steps * Math.PI * 2;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  });
}
function cylinder(cx, cy, radius, z, height, projection, steps = 32, bevel = 0) {
  return extrude(circleRing(cx, cy, radius, steps), z, height, projection, { convex: true, bevel });
}
var insetPlan = ({ x, y, w, d, r }, by) => ({ x: x + by, y: y + by, w: w - by * 2, d: d - by * 2, r: Math.max(0, r - by) });
function onTop(points, z, projection, closed = false) {
  return pathOf(
    points.map(([x, y]) => iso([x, y, z], projection)),
    closed
  );
}
var planOutline = (plan, z, projection, steps = 8) => onTop(ringOf(plan, steps), z, projection, true);
var lineOnTop = (from, to, z, projection) => onTop([from, to], z, projection);
var segment = (from, to, projection) => pathOf([iso(from, projection), iso(to, projection)]);
var rise = (at2, from, to, projection) => segment([at2[0], at2[1], from], [at2[0], at2[1], to], projection);
var ring = (cx, cy, radius, z, projection, steps = 40) => onTop(circleRing(cx, cy, radius, steps), z, projection, true);
var pointsAt = (points, projection) => points.map((point) => iso(point, projection));
function dotGrid(x, y, columns, rows, gap, z, projection) {
  const dots = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) dots.push(iso([x + column * gap, y + row * gap, z], projection));
  }
  return dots;
}
function corners({ x, y, w, d }, inset = 0) {
  return [
    [x + inset, y + inset],
    [x + w - inset, y + inset],
    [x + inset, y + d - inset],
    [x + w - inset, y + d - inset]
  ];
}
function boxCorners({ x, y, w, d }, z0, z1) {
  const out = [];
  for (const px of [x, x + w]) for (const py of [y, y + d]) for (const z of [z0, z1]) out.push([px, py, z]);
  return out;
}
function knurl(cx, cy, radius, z0, z1, count, projection, inset = 0.4) {
  const [vx, vy] = towardViewer(projection);
  const lines = [];
  for (let index = 0; index < count; index++) {
    const angle = index / count * Math.PI * 2;
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    if (nx * vx + ny * vy < 0.15) continue;
    lines.push(segment([cx + radius * nx, cy + radius * ny, z0 + inset], [cx + radius * nx, cy + radius * ny, z1 - inset], projection));
  }
  return lines.join("");
}
function sideArc(cx, cy, radius, z, projection, steps = 24) {
  const [vx, vy] = towardViewer(projection);
  const facing = Math.atan2(vy, vx);
  const points = [];
  for (let step2 = 0; step2 <= steps; step2++) {
    const angle = facing - Math.PI / 2 + step2 / steps * Math.PI;
    points.push(iso([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle), z], projection));
  }
  return pathOf(points);
}
function ringSeam(ring2, z, projection) {
  const count = ring2.length;
  const counter = signedArea(ring2) > 0;
  const [vx, vy] = towardViewer(projection);
  const facing = ring2.map(([ax, ay], index) => {
    const [bx, by] = ring2[(index + 1) % count];
    const dx = bx - ax;
    const dy = by - ay;
    const [nx, ny] = counter ? [dy, -dx] : [-dy, dx];
    return nx * vx + ny * vy > 1e-9;
  });
  return runsOf(facing, true).map((run) => pathOf(run.map((index) => iso([ring2[index][0], ring2[index][1], z], projection)))).join("");
}
var sideSeam = (plan, z, projection, steps = 8) => ringSeam(ringOf(plan, steps), z, projection);
function sideRing(center, radius, axis, projection, steps = 20) {
  const [px, py, pz] = center;
  const points = [];
  for (let step2 = 0; step2 < steps; step2++) {
    const angle = step2 / steps * Math.PI * 2;
    const u = radius * Math.cos(angle);
    const v = radius * Math.sin(angle);
    points.push(iso(axis === "x" ? [px, py + u, pz + v] : [px + u, py, pz + v], projection));
  }
  return pathOf(points, true);
}
function coil(from, to, center, radius, turns, axis, projection, perTurn = 16) {
  const count = Math.max(1, Math.round(turns * perTurn));
  const back = [];
  const front = [];
  let run = [];
  let near = null;
  for (let index = 0; index <= count; index++) {
    const share = index / count;
    const angle = share * turns * Math.PI * 2;
    const u = radius * Math.cos(angle);
    const v = radius * Math.sin(angle);
    const along = from + (to - from) * share;
    const point = axis === "x" ? [along, center[0] + u, center[1] + v] : [center[0] + u, along, center[1] + v];
    const normal = axis === "x" ? [0, Math.cos(angle), Math.sin(angle)] : [Math.cos(angle), 0, Math.sin(angle)];
    const facing = depthOf(normal, projection) > 0;
    const flat = iso(point, projection);
    if (near === null) near = facing;
    if (facing !== near) {
      run.push(flat);
      (near ? front : back).push(pathOf(run));
      run = [flat];
      near = facing;
      continue;
    }
    run.push(flat);
  }
  if (run.length > 1) (near ? front : back).push(pathOf(run));
  return { back: back.join(""), front: front.join("") };
}
function topTicks(from, to, step2, every, edge, z, lengths, projection, axis = "x") {
  const minor = [];
  const major = [];
  const first = Math.ceil(from / step2) * step2;
  for (let at2 = first, index = Math.round(first / step2); at2 <= to + 1e-9; at2 += step2, index++) {
    const big = index % every === 0;
    const length = big ? lengths[1] : lengths[0];
    const a = axis === "x" ? [at2, edge] : [edge, at2];
    const b = axis === "x" ? [at2, edge + length] : [edge + length, at2];
    (big ? major : minor).push(lineOnTop(a, b, z, projection));
  }
  return { minor: minor.join(""), major: major.join("") };
}
function sideTicks(from, to, step2, every, face, top, lengths, projection, axis = "x") {
  const minor = [];
  const major = [];
  const first = Math.ceil(from / step2) * step2;
  for (let at2 = first, index = Math.round(first / step2); at2 <= to + 1e-9; at2 += step2, index++) {
    const big = index % every === 0;
    const length = big ? lengths[1] : lengths[0];
    const a = axis === "x" ? [at2, face, top] : [face, at2, top];
    const b = axis === "x" ? [at2, face, top - length] : [face, at2, top - length];
    (big ? major : minor).push(segment(a, b, projection));
  }
  return { minor: minor.join(""), major: major.join("") };
}
function radialTicks(cx, cy, radius, count, every, z, lengths, projection, from = 0, span = Math.PI * 2) {
  const minor = [];
  const major = [];
  const closed = Math.abs(span - Math.PI * 2) < 1e-9;
  const steps = closed ? count : count + 1;
  for (let index = 0; index < steps; index++) {
    const angle = from + index / count * span;
    const big = index % every === 0;
    const inner = radius - (big ? lengths[1] : lengths[0]);
    const sx = Math.sin(angle);
    const sy = -Math.cos(angle);
    (big ? major : minor).push(lineOnTop([cx + sx * inner, cy + sy * inner], [cx + sx * radius, cy + sy * radius], z, projection));
  }
  return { minor: minor.join(""), major: major.join("") };
}
var haloOf = (plan, z, height, projection) => slabOf(plan, z, height, projection).fill;
function axisVector(projection, [dx, dy, dz]) {
  const origin = iso([0, 0, 0], projection);
  const moved = iso([dx, dy, dz], projection);
  return [moved[0] - origin[0], moved[1] - origin[1]];
}
var fine = (value) => Math.round(value * 100) / 100;
function translateAlong(projection, by) {
  const [x, y] = axisVector(projection, by);
  return `translate(${fine(x)} ${fine(y)})`;
}
var thousandth = (value) => Math.round(value * 1e3) / 1e3;
function axesAt(at2, z, projection) {
  const origin = iso([at2[0], at2[1], z], projection);
  const along = (point) => {
    const [px, py] = iso(point, projection);
    return [px - origin[0], py - origin[1]];
  };
  return { origin, x: along([at2[0] + 1, at2[1], z]), y: along([at2[0], at2[1] + 1, z]), z: along([at2[0], at2[1], z + 1]) };
}
var matrixOf = (u, v, origin) => `matrix(${thousandth(u[0])} ${thousandth(u[1])} ${thousandth(v[0])} ${thousandth(v[1])} ${thousandth(origin[0])} ${thousandth(origin[1])})`;
function holdStill(element, [dx, dy]) {
  const text = dx || dy ? `translate(${-dx} ${-dy})` : "";
  element.querySelectorAll("[data-hold]").forEach((node) => text ? node.setAttribute("transform", text) : node.removeAttribute("transform"));
}
function topMatrix(at2, z, projection, along = "x") {
  const { origin, x, y } = axesAt(at2, z, projection);
  return along === "x" ? matrixOf(x, y, origin) : matrixOf([-y[0], -y[1]], x, origin);
}
function sideMatrix(at2, z, projection, face) {
  const { origin, x, y, z: up } = axesAt(at2, z, projection);
  const down = [-up[0], -up[1]];
  return face === "left" ? matrixOf(x, down, origin) : matrixOf([-y[0], -y[1]], down, origin);
}
function screenRise(height, projection) {
  const { cosE, k } = cameraOf(projection);
  return height * cosE * k;
}
function fitProjection(points, width, height, { pad = 24, headroom = 0, azimuth = AZIMUTH, elevation = ELEVATION } = {}) {
  const unit2 = { origin: [0, 0], scale: 1, azimuth, elevation };
  const flat = points.map((point) => iso(point, unit2));
  const xs = flat.map(([x]) => x);
  const ys = flat.map(([, y]) => y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const up = Math.min(...ys);
  const down = Math.max(...ys);
  const scale = Math.min((width - pad * 2) / (right - left), (height - pad * 2 - headroom) / (down - up));
  return {
    origin: [width / 2 - (left + right) / 2 * scale, headroom + (height - headroom) / 2 - (up + down) / 2 * scale],
    scale,
    azimuth,
    elevation
  };
}
var escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var attrs = (pairs) => Object.entries(pairs).filter(([, value]) => value !== void 0 && value !== false).map(([key, value]) => ` ${key}="${escape(String(value))}"`).join("");
function solidSvg(paths, { tone = "hi", crease = "faint", halo = false, lit = false, flat = false, className, inner = "" } = {}) {
  const parts = [];
  if (halo) parts.push(`<path class="iso-halo" d="${paths.fill}"/>`);
  parts.push(`<path class="iso-fill" d="${paths.fill}"/>`);
  if (!flat) {
    paths.shades.forEach((d, shade) => {
      if (d) parts.push(`<path class="iso-shade" data-shade="${shade}" d="${d}"/>`);
    });
    parts.push(`<path class="iso-top" d="${paths.top}"/>`);
  }
  if (crease !== "none" && paths.crease) parts.push(`<path class="iso-line iso-crease" data-tone="${crease}" d="${paths.crease}"/>`);
  if (crease !== "none" && paths.bevel) parts.push(`<path class="iso-line iso-bevel" data-tone="${crease}" d="${paths.bevel}"/>`);
  if (inner) parts.push(inner);
  parts.push(`<path class="iso-line iso-edge" data-tone="${tone}" d="${paths.outline}"/>`);
  return `<g${attrs({ class: className ? `iso-solid ${className}` : "iso-solid", "data-lit": lit ? "" : void 0, "data-seamless": paths.seamless ? "" : void 0 })}>${parts.join("")}</g>`;
}
function lineSvg(d, { tone = "lo", dotted = false, dashed = false, flow = false, className, free } = {}) {
  if (!d) return "";
  return `<path${attrs({
    class: className ? `iso-line ${className}` : "iso-line",
    "data-tone": tone,
    "data-free": free === true ? "" : free || void 0,
    "data-dotted": dotted ? "" : void 0,
    "data-dashed": dashed ? "" : void 0,
    "data-flow": flow ? "" : void 0,
    d
  })}/>`;
}
function dotsSvg(points, { size = 0.5, tone = "mid", pulse = false } = {}) {
  const dots = points.map(([x, y, alpha], index) => `<circle cx="${tenth(x)}" cy="${tenth(y)}" r="${size}"${alpha !== void 0 && alpha < 1 ? ` fill-opacity="${Math.max(0, alpha).toFixed(2)}"` : ""}${pulse ? ` data-pulse="" style="--pulse-at:${index * 137 % 1600}ms"` : ""}/>`).join("");
  return `<g class="iso-dots" data-tone="${tone}">${dots}</g>`;
}
function fadedSvg(list, style = {}) {
  const groups = /* @__PURE__ */ new Map();
  for (const entry of list) {
    const [d, alpha] = Array.isArray(entry) ? entry : [entry.d, entry.alpha];
    if (!d || !(alpha > 0.02)) continue;
    const level = Math.min(1, Math.round(alpha * 20) / 20);
    groups.set(level, (groups.get(level) ?? "") + d);
  }
  return [...groups].map(([alpha, d]) => alpha >= 1 ? lineSvg(d, style) : `<g opacity="${alpha.toFixed(2)}">${lineSvg(d, style)}</g>`).join("");
}
function fadeLineSvg(points, { fade = [0, 0], tone = "lo", className, stops = 6 } = {}) {
  if (points.length < 2) return "";
  const ease = (t) => t * t * (3 - 2 * t);
  const hashOf = (text) => {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    return (hash >>> 0).toString(36);
  };
  const lengths = [0];
  for (let index = 1; index < points.length; index++) lengths.push(lengths[index - 1] + Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]));
  const at2 = (length) => {
    let index = 1;
    while (index < points.length - 1 && lengths[index] < length) index++;
    const span = lengths[index] - lengths[index - 1] || 1;
    const t = Math.max(0, Math.min(1, (length - lengths[index - 1]) / span));
    return [points[index - 1][0] + (points[index][0] - points[index - 1][0]) * t, points[index - 1][1] + (points[index][1] - points[index - 1][1]) * t];
  };
  const pieceOf = (from, to) => [at2(from), ...points.filter((_, index) => lengths[index] > from + 1e-6 && lengths[index] < to - 1e-6), at2(to)];
  const total = lengths[lengths.length - 1];
  if (total < 1e-6) return "";
  let [start, end] = Array.isArray(fade) ? fade : [fade, fade];
  if (start + end > total) {
    const share = total / (start + end);
    start *= share;
    end *= share;
  }
  const paint = `var(--anatomy-${tone})`;
  const ramp = (piece, rising) => {
    const d = pathOf(piece);
    const [x1, y1] = piece[0];
    const [x2, y2] = piece[piece.length - 1];
    const id = `iso-fade-${hashOf(`${d}|${tone}|${rising}`)}`;
    const marks = Array.from({ length: stops + 1 }, (_, index) => {
      const t = index / stops;
      const alpha = ease(rising ? t : 1 - t);
      return `<stop offset="${t.toFixed(3)}" stop-opacity="${alpha.toFixed(3)}" style="stop-color:${paint}"/>`;
    }).join("");
    const gradient = `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${tenth(x1)}" y1="${tenth(y1)}" x2="${tenth(x2)}" y2="${tenth(y2)}">${marks}</linearGradient>`;
    return `<defs>${gradient}</defs><path${attrs({ class: className ? `iso-line ${className}` : "iso-line", "data-tone": tone, "data-free": rising ? "start" : "end", d, style: `stroke:url(#${id})` })}/>`;
  };
  const parts = [];
  if (start > 0.05) parts.push(ramp(pieceOf(0, start), true));
  if (total - end - start > 0.05) parts.push(lineSvg(pathOf(pieceOf(start, total - end)), { tone, className }));
  if (end > 0.05) parts.push(ramp(pieceOf(total - end, total), false));
  return `<g class="iso-fade">${parts.join("")}</g>`;
}
function wireSvg(from, to, { via = [], tone = "lo", dotted = false, dashed = false, flow = false, ends = "both", size = 1.2 } = {}) {
  const d = pathOf([from, ...via, to]);
  const end = ([x, y]) => `<circle class="iso-wire-end" cx="${tenth(x)}" cy="${tenth(y)}" r="${size}"/>`;
  return `<g class="iso-wire" data-tone="${tone}">${lineSvg(d, { tone, dotted, dashed, flow })}${ends === "both" || ends === "from" ? end(from) : ""}${ends === "both" || ends === "to" ? end(to) : ""}</g>`;
}
function faceTextSvg(transform, text, { size = 3, tone = "mid", anchor = "start" } = {}) {
  return `<text class="iso-face-text" data-tone="${tone}" transform="${transform}" font-size="${size}" text-anchor="${anchor}">${escape(text)}</text>`;
}
function groupSvg(children, extra = {}) {
  return `<g${attrs(extra)}>${Array.isArray(children) ? children.join("") : children}</g>`;
}
function figureSvg({ width, height, label, body, standalone = false, className }) {
  const style = standalone ? `<style>${ISO_CSS}</style>` : "";
  return `<svg${attrs({
    xmlns: "http://www.w3.org/2000/svg",
    class: `iso-svg${standalone ? " iso" : ""}${className ? ` ${className}` : ""}`,
    "data-theme": standalone || void 0,
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": label
  })}>${style}${Array.isArray(body) ? body.join("") : body}</svg>`;
}
function swatchSvg(mark) {
  if (mark === "raised" || mark === "flat" || mark === "lit") {
    const body = mark === "flat" ? "M2 6.5 8 3.5 14 6.5 8 9.5Z" : "M2 4.5 8 1.5 14 4.5 14 6 8 9 2 6Z";
    const crease = mark === "flat" ? "" : `<path class="iso-swatch-crease" d="M2 4.5 8 7.5 14 4.5"/>`;
    return `<svg class="iso-swatch" data-mark="${mark}" viewBox="0 0 16 10" aria-hidden="true"><path d="${body}"/>${crease}</svg>`;
  }
  return `<svg class="iso-swatch" data-mark="${mark}" viewBox="0 0 16 10" aria-hidden="true"><path d="M1.5 5h13"/></svg>`;
}
function plateHtml({ fig, title, hint, readout = "", keys = [], caption, body }) {
  const corner = (name, text, extra = "") => `<span class="iso-plate-corner" data-corner="${name}"${extra}>${escape(text)}</span>`;
  const legend = keys.length || caption ? `<figcaption class="iso-legend">${keys.length ? `<span class="iso-keys">${keys.map((key) => `<span class="iso-key">${swatchSvg(key.mark)}${escape(key.label)}</span>`).join("")}</span>` : ""}${caption ? `<span class="iso-caption">${escape(caption)}</span>` : ""}</figcaption>` : "";
  return `<figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true">${corner("fig", fig)}${title ? corner("title", title) : ""}${hint ? corner("hint", hint) : ""}${corner("readout", readout, " data-readout")}</div>${body}</div>${legend}</figure>`;
}
function pageHtml({ title, theme = "dark", body, script = "", width = 650 }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title><style>${ISO_CSS}${PAGE_CSS.replace("__WIDTH__", String(width))}</style></head><body class="iso" data-theme="${theme}"><main class="iso-page">${body}</main>${script ? `<script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script>` : ""}</body></html>`;
}
var PAGE_CSS = `
*{box-sizing:border-box}
html{color-scheme:dark}
body[data-theme="light"]{color-scheme:light}
body{margin:0;background:var(--anatomy-page);color:var(--anatomy-text);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.iso-page{width:min(__WIDTH__px,100% - 32px);margin:64px auto 96px}
`;
var ISO_CSS = `
.iso{
  --anatomy-page:#0b0b0b;--anatomy-card:#131313;--anatomy-text:#a3a3a3;--anatomy-strong:#e6e6e6;--anatomy-muted:#6e6e6e;
  --anatomy-paper:#131313;--anatomy-face:#1b1b1b;--anatomy-top:#1c1c1c;
  --anatomy-shade-0:#0f0f0f;--anatomy-shade-1:#121212;--anatomy-shade-2:#151515;--anatomy-shade-3:#181818;
  --anatomy-lit-top:#262626;--anatomy-lit-shade:#1d1d1d;
  --anatomy-hi:#d4d4d4;--anatomy-mid:#6a6a6a;--anatomy-lo:#3e3e3e;--anatomy-faint:#2a2a2a;--anatomy-lit:#ffffff;
  --anatomy-halo:#050505;--anatomy-halo-opacity:.9;--anatomy-dot:#e6e6e6;
  --anatomy-red:#ff6b6b;--anatomy-green:#6be0a0;--anatomy-blue:#6b9bff;
  --anatomy-weight:.6px;--anatomy-ease:cubic-bezier(.32,.72,0,1);
  --anatomy-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --anatomy-lift:inset 0 1px 0 0 #ffffff0a,inset 0 0 0 1px #ffffff06,0 0 0 1px #00000026,0 1px 1px -.5px #00000014,0 3px 3px -1.5px #00000014,0 6px 6px -3px #00000014,0 12px 12px -6px #00000014;
}
.iso[data-theme="light"]{
  --anatomy-page:#f2f2ef;--anatomy-card:#fbfbfa;--anatomy-text:#57575a;--anatomy-strong:#18181a;--anatomy-muted:#8c8c90;
  --anatomy-paper:#fbfbfa;--anatomy-face:#ffffff;--anatomy-top:#ffffff;
  --anatomy-shade-0:#dcdcd9;--anatomy-shade-1:#e5e5e2;--anatomy-shade-2:#ededea;--anatomy-shade-3:#f4f4f1;
  --anatomy-lit-top:#ffffff;--anatomy-lit-shade:#eeeeeb;
  --anatomy-hi:#26262a;--anatomy-mid:#8a8a8f;--anatomy-lo:#b4b4b8;--anatomy-faint:#d4d4d6;--anatomy-lit:#000000;
  --anatomy-halo:#8a8a80;--anatomy-halo-opacity:.32;--anatomy-dot:#3a3a3e;
  --anatomy-red:#e5484d;--anatomy-green:#30a46c;--anatomy-blue:#3e63dd;
  --anatomy-lift:inset 0 1px 0 0 #ffffff,0 0 0 1px #0000000f,0 1px 1px -.5px #0000000a,0 3px 3px -1.5px #0000000a,0 6px 6px -3px #0000000a,0 12px 12px -6px #0000000a;
}
.iso-svg{display:block;width:100%;height:auto;overflow:visible}
.iso-svg path,.iso-svg circle{vector-effect:non-scaling-stroke}
.iso-fill{fill:var(--anatomy-paper);stroke:none}
.iso-solid[data-lit]>.iso-fill{fill:var(--anatomy-face)}
.iso-shade,.iso-top{stroke:none}
.iso-shade[data-shade="0"]{fill:var(--anatomy-shade-0)}
.iso-shade[data-shade="1"]{fill:var(--anatomy-shade-1)}
.iso-shade[data-shade="2"]{fill:var(--anatomy-shade-2)}
.iso-shade[data-shade="3"]{fill:var(--anatomy-shade-3)}
.iso-top{fill:var(--anatomy-top)}
.iso-solid[data-lit]>.iso-top{fill:var(--anatomy-lit-top)}
.iso-solid[data-lit]>.iso-shade{fill:var(--anatomy-lit-shade)}
.iso-solid[data-seamless]>.iso-shade,.iso-solid[data-seamless]>.iso-top{stroke-width:.4;stroke-linejoin:round}
.iso-solid[data-seamless]>.iso-shade[data-shade="0"]{stroke:var(--anatomy-shade-0)}
.iso-solid[data-seamless]>.iso-shade[data-shade="1"]{stroke:var(--anatomy-shade-1)}
.iso-solid[data-seamless]>.iso-shade[data-shade="2"]{stroke:var(--anatomy-shade-2)}
.iso-solid[data-seamless]>.iso-shade[data-shade="3"]{stroke:var(--anatomy-shade-3)}
.iso-solid[data-seamless]>.iso-top{stroke:var(--anatomy-top)}
.iso-solid[data-seamless][data-lit]>.iso-top{stroke:var(--anatomy-lit-top)}
.iso-solid[data-seamless][data-lit]>.iso-shade{stroke:var(--anatomy-lit-shade)}
.iso-solid[data-lit]>.iso-edge{stroke:var(--anatomy-lit)}
.iso-halo{fill:var(--anatomy-halo);stroke:none;filter:blur(9px);opacity:var(--anatomy-halo-opacity);transform:translateY(3px)}
.iso-line{fill:none;stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight);stroke-linecap:round;stroke-linejoin:round}
.iso-line[data-tone="hi"]{stroke:var(--anatomy-hi)}
.iso-line[data-tone="mid"]{stroke:var(--anatomy-mid)}
.iso-line[data-tone="lo"]{stroke:var(--anatomy-lo)}
.iso-line[data-tone="faint"]{stroke:var(--anatomy-faint)}
.iso-line[data-tone="lit"]{stroke:var(--anatomy-lit)}
.iso-line[data-tone="red"]{stroke:var(--anatomy-red)}
.iso-line[data-tone="green"]{stroke:var(--anatomy-green)}
.iso-line[data-tone="blue"]{stroke:var(--anatomy-blue)}
.iso-line[data-dotted]{stroke-dasharray:.01 3.5;stroke-width:1}
.iso-line[data-dashed]{stroke-dasharray:3 3}
.iso-line[data-flow]{stroke-dasharray:2 6}
.iso-wire-end{fill:var(--anatomy-paper);stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight)}
.iso-wire[data-tone="hi"] .iso-wire-end{stroke:var(--anatomy-hi)}
.iso-wire[data-tone="mid"] .iso-wire-end{stroke:var(--anatomy-mid)}
.iso-wire[data-tone="faint"] .iso-wire-end{stroke:var(--anatomy-faint)}
.iso-wire[data-tone="lit"] .iso-wire-end{stroke:var(--anatomy-lit)}
.iso-dots circle{fill:var(--anatomy-dot);stroke:none;opacity:.32}
.iso-dots[data-tone="hi"] circle{opacity:.85}
.iso-dots[data-tone="mid"] circle{opacity:.45}
.iso-dots[data-tone="lo"] circle{opacity:.22}
.iso-dots[data-tone="faint"] circle{opacity:.12}
.iso-face-text{fill:var(--anatomy-mid);font-family:var(--anatomy-mono);letter-spacing:.04em}
.iso-face-text[data-tone="hi"]{fill:var(--anatomy-hi)}
.iso-face-text[data-tone="lo"]{fill:var(--anatomy-lo)}
.iso-face-text[data-tone="faint"]{fill:var(--anatomy-faint)}
.tb-body{fill:var(--anatomy-shade-2);stroke:none}
.tb-shine{fill:var(--anatomy-top);stroke:none}
.tb-shade{fill:var(--anatomy-shade-0);stroke:none}
.tb-ring{fill:none;stroke:var(--anatomy-lo);stroke-width:.45;stroke-linecap:butt;stroke-linejoin:round}
.tb-ring[data-tone="mid"]{stroke:var(--anatomy-mid)}
.tb-ring[data-tone="faint"]{stroke:var(--anatomy-faint)}
.tb-ring[data-tone="hi"]{stroke:var(--anatomy-hi)}
@keyframes iso-flow{to{stroke-dashoffset:-32}}
@keyframes iso-pulse{0%,100%{opacity:.18}12%{opacity:1}40%{opacity:.18}}
.iso-line[data-flow]{animation:iso-flow 1600ms linear infinite}
.iso-dots circle[data-pulse]{animation:iso-pulse 1600ms steps(1,end) infinite;animation-delay:var(--pulse-at,0ms)}
.iso-figure{margin:32px 0 36px}
.iso-plate{position:relative;padding:52px 24px;border-radius:0;background:var(--anatomy-card);box-shadow:0 0 0 1px var(--anatomy-mid);--anatomy-paper:var(--anatomy-card)}
.iso-plate-corners{position:absolute;inset:18px 20px;pointer-events:none}
.iso-plate-corner{position:absolute;color:var(--anatomy-muted);font-family:var(--anatomy-mono);font-size:10.5px;line-height:1;letter-spacing:.04em;white-space:nowrap}
.iso-plate-corner[data-corner="fig"]{top:0;left:0;color:var(--anatomy-text)}
.iso-plate-corner[data-corner="title"]{top:0;right:0;text-transform:uppercase;letter-spacing:.1em}
.iso-plate-corner[data-corner="hint"]{bottom:0;left:0;text-transform:uppercase;letter-spacing:.1em}
.iso-plate-corner[data-corner="readout"]{right:0;bottom:0;color:var(--anatomy-text);font-variant-numeric:tabular-nums}
.iso-plate .iso-svg{margin:0 auto}
.iso-legend{display:grid;gap:8px;margin-top:12px;color:var(--anatomy-muted);font-size:13px;line-height:1.55}
.iso-keys{display:flex;flex-wrap:wrap;gap:6px 18px}
.iso-key{display:inline-flex;align-items:center;gap:7px}
.iso-swatch{width:16px;height:10px;flex:none;overflow:visible}
.iso-swatch path{fill:none;stroke:var(--anatomy-hi);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round}
.iso-swatch[data-mark="raised"] path,.iso-swatch[data-mark="flat"] path{stroke:var(--anatomy-mid)}
.iso-swatch[data-mark="lit"] path{stroke:var(--anatomy-lit)}
.iso-swatch[data-mark="dim"] path{stroke:var(--anatomy-lo)}
.iso-swatch[data-mark="dotted"] path{stroke-dasharray:.01 3;stroke-width:1.4}
.iso-swatch[data-mark="dashed"] path{stroke-dasharray:3 2.5}
.iso-swatch[data-mark="red"] path{stroke:var(--anatomy-red)}
.iso-swatch[data-mark="green"] path{stroke:var(--anatomy-green)}
.iso-swatch[data-mark="blue"] path{stroke:var(--anatomy-blue)}
.iso-swatch-crease{stroke:var(--anatomy-lo)!important}
@media (max-width:560px){.iso-plate{padding:48px 12px 70px}.iso-plate-corner[data-corner="hint"]{bottom:18px}}
@media (prefers-reduced-motion:reduce){.iso-line[data-flow],.iso-dots circle[data-pulse]{animation:none}}
`;

// src/mechanism/kit/live.tsx
import * as React from "react";
import { jsx } from "react/jsx-runtime";
var STILLNESS = "(prefers-reduced-motion: reduce)";
var LONGEST_FRAME = 1 / 30;
var asksForStillness = () => typeof window !== "undefined" && window.matchMedia(STILLNESS).matches;
function useStillness() {
  return React.useSyncExternalStore(
    (changed) => {
      const query = window.matchMedia(STILLNESS);
      query.addEventListener("change", changed);
      return () => query.removeEventListener("change", changed);
    },
    asksForStillness,
    () => false
  );
}
function follow(current, target, dt, seconds, calm = false) {
  if (calm) return target;
  const next = current + (target - current) * (1 - Math.exp(-dt / seconds));
  return Math.abs(target - next) < 1e-3 ? target : next;
}
function spring(state, target, dt, stiffness, damping, calm = false) {
  const drag = calm ? 2 * Math.sqrt(stiffness) : damping;
  const steps = Math.max(Math.ceil(dt * 240), 1);
  const slice = dt / steps;
  for (let step2 = 0; step2 < steps; step2++) {
    state.rate += (target - state.at) * stiffness * slice - state.rate * drag * slice;
    state.at += state.rate * slice;
  }
  if (Math.abs(target - state.at) < 5e-4 && Math.abs(state.rate) < 5e-4) {
    state.at = target;
    state.rate = 0;
  }
  return state.at === target && state.rate === 0;
}

// src/mechanism/kit/draw.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function Solid({ paths, tone = "hi", crease = "faint", halo = false, lit = false, flat = false, className, inner, children }) {
  return /* @__PURE__ */ jsxs("g", { className: className ? `iso-solid ${className}` : "iso-solid", "data-lit": lit ? "" : void 0, "data-seamless": paths.seamless ? "" : void 0, children: [
    halo ? /* @__PURE__ */ jsx2("path", { className: "iso-halo", d: paths.fill }) : null,
    /* @__PURE__ */ jsx2("path", { className: "iso-fill", d: paths.fill }),
    flat ? null : paths.shades.map((d, shade) => d ? /* @__PURE__ */ jsx2("path", { className: "iso-shade", "data-shade": shade, d }, shade) : null),
    flat ? null : /* @__PURE__ */ jsx2("path", { className: "iso-top", d: paths.top }),
    crease === "none" || !paths.crease ? null : /* @__PURE__ */ jsx2("path", { className: "iso-line iso-crease", "data-tone": crease, d: paths.crease }),
    crease === "none" || !paths.bevel ? null : /* @__PURE__ */ jsx2("path", { className: "iso-line iso-bevel", "data-tone": crease, d: paths.bevel }),
    inner,
    /* @__PURE__ */ jsx2("path", { className: "iso-line iso-edge", "data-tone": tone, d: paths.outline }),
    children
  ] });
}
function Line({ d, tone = "lo", dotted = false, dashed = false, flow = false, className, free }) {
  if (!d) return null;
  return /* @__PURE__ */ jsx2(
    "path",
    {
      className: className ? `iso-line ${className}` : "iso-line",
      "data-tone": tone,
      "data-dotted": dotted ? "" : void 0,
      "data-dashed": dashed ? "" : void 0,
      "data-flow": flow ? "" : void 0,
      "data-free": free === true ? "" : free || void 0,
      d
    }
  );
}
var tenth2 = (value) => Math.round(value * 10) / 10;
function Wire({ from, to, via = [], tone = "lo", dotted = false, dashed = false, flow = false, ends = "both", size = 1.2 }) {
  return /* @__PURE__ */ jsxs("g", { className: "iso-wire", "data-tone": tone, children: [
    /* @__PURE__ */ jsx2(Line, { d: pathOf([from, ...via, to]), tone, dotted, dashed, flow }),
    ends === "both" || ends === "from" ? /* @__PURE__ */ jsx2("circle", { className: "iso-wire-end", cx: tenth2(from[0]), cy: tenth2(from[1]), r: size }) : null,
    ends === "both" || ends === "to" ? /* @__PURE__ */ jsx2("circle", { className: "iso-wire-end", cx: tenth2(to[0]), cy: tenth2(to[1]), r: size }) : null
  ] });
}
function Dots({ points, size = 0.5, tone = "mid", pulse = false }) {
  return /* @__PURE__ */ jsx2("g", { className: "iso-dots", "data-tone": tone, children: points.map(([x, y, alpha], index) => /* @__PURE__ */ jsx2(
    "circle",
    {
      cx: tenth2(x),
      cy: tenth2(y),
      r: size,
      fillOpacity: alpha !== void 0 && alpha < 1 ? Math.max(0, alpha) : void 0,
      "data-pulse": pulse ? "" : void 0,
      style: pulse ? { "--pulse-at": `${index * 137 % 1600}ms` } : void 0
    },
    index
  )) });
}
function FaceText({
  transform,
  children,
  size = 3,
  tone = "mid",
  anchor = "start"
}) {
  return /* @__PURE__ */ jsx2("text", { className: "iso-face-text", "data-tone": tone, transform, fontSize: size, textAnchor: anchor, children });
}

// src/mechanism/solid3.ts
var sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
var add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
var cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
var dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
var unit = (a) => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};
function viewOf(projection) {
  const { sinA, cosA, sinE, cosE } = cameraOf(projection);
  return [cosA * cosE, sinA * cosE, sinE];
}
function hull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && turn(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper = [];
  for (let index = sorted.length - 1; index >= 0; index--) {
    const point = sorted[index];
    while (upper.length >= 2 && turn(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
function prismOf(face, along, projection) {
  const count = face.length;
  const far = face.map((point) => add(point, along));
  const vertices = [...face, ...far];
  const centre = vertices.reduce((sum, point) => add(sum, [point[0] / vertices.length, point[1] / vertices.length, point[2] / vertices.length]), [0, 0, 0]);
  const faces = [
    face.map((_, index) => index),
    face.map((_, index) => count + index),
    ...face.map((_, index) => {
      const next = (index + 1) % count;
      return [index, next, count + next, count + index];
    })
  ];
  const view = viewOf(projection);
  const { sinA, cosA } = cameraOf(projection);
  const light = [-sinA, cosA, 0];
  const normals = faces.map((ids) => {
    const [a, b, c] = [vertices[ids[0]], vertices[ids[1]], vertices[ids[2]]];
    let normal = unit(cross(sub(b, a), sub(c, a)));
    if (dot(normal, sub(a, centre)) < 0) normal = [-normal[0], -normal[1], -normal[2]];
    return normal;
  });
  const visible = normals.map((normal) => dot(normal, view) > 1e-6);
  const flat = vertices.map((point) => iso(point, projection));
  const polygon = (ids) => pathOf(ids.map((id) => flat[id]), true);
  const buckets = Array.from({ length: SHADES }, () => []);
  const tops = [];
  faces.forEach((ids, index) => {
    if (!visible[index]) return;
    const normal = normals[index];
    if (normal[2] > 0.72) {
      tops.push(polygon(ids));
      return;
    }
    const level = Math.hypot(normal[0], normal[1]) > 1e-6 ? (dot(unit([normal[0], normal[1], 0]), light) + 1) / 2 : 0;
    const darker = normal[2] < -0.2 ? 1 : 0;
    const shade = Math.min(SHADES - 1, Math.max(0, Math.floor(level * SHADES) - darker));
    buckets[shade].push(polygon(ids));
  });
  const edges = /* @__PURE__ */ new Map();
  faces.forEach((ids, index) => {
    ids.forEach((id, at2) => {
      const other = ids[(at2 + 1) % ids.length];
      const key = id < other ? `${id}-${other}` : `${other}-${id}`;
      const edge = edges.get(key) ?? { a: id, b: other, faces: [] };
      edge.faces.push(index);
      edges.set(key, edge);
    });
  });
  const outline = [];
  const crease = [];
  for (const edge of edges.values()) {
    const shown = edge.faces.map((index) => visible[index]);
    const segment2 = pathOf([flat[edge.a], flat[edge.b]]);
    if (shown[0] !== shown[1]) outline.push(segment2);
    else if (shown[0] && shown[1]) {
      const [n0, n1] = [normals[edge.faces[0]], normals[edge.faces[1]]];
      if (dot(n0, n1) < 0.95) crease.push(segment2);
    }
  }
  return {
    fill: pathOf(hull(flat), true),
    outline: outline.join(""),
    crease: crease.join(""),
    top: tops.join(""),
    shades: buckets.map((paths) => paths.join(""))
  };
}
function circleIn(centre, radius, axis, steps = 28) {
  return Array.from({ length: steps }, (_, step2) => {
    const angle = step2 / steps * Math.PI * 2;
    const u = radius * Math.cos(angle);
    const v = radius * Math.sin(angle);
    return axis === "y" ? [centre[0] + u, centre[1], centre[2] + v] : [centre[0], centre[1] + u, centre[2] + v];
  });
}
function faceCircle(centre, radius, axis, projection, steps = 24) {
  return pathOf([...circleIn(centre, radius, axis, steps), circleIn(centre, radius, axis, steps)[0]].map((point) => iso(point, projection)));
}

// src/mechanism/gate.ts
var LIMIT = 6;
var SCALE = 10;
var CYCLE = [
  [1, 1, 4.2],
  [2, 1, 5.1],
  [3, 1, 6.6],
  [4, 1, 3.8],
  [5, 1, 5.6],
  [3, 2, 4.9],
  [6, 1, 6.9],
  [7, 1, 4.4],
  [8, 1, 5.8],
  [6, 2, 5.3],
  [9, 1, 6.3],
  [9, 2, 5.5]
];
var CYCLE_LENGTH = CYCLE.length;
var verdictOf = (value) => value <= LIMIT + 1e-9 ? "pass" : "return";
function checkAt(index) {
  const at2 = (index % CYCLE_LENGTH + CYCLE_LENGTH) % CYCLE_LENGTH;
  const [proposal, attempt, value] = CYCLE[at2];
  return { index, proposal: proposal + Math.floor(index / CYCLE_LENGTH) * 9, attempt, value, verdict: verdictOf(value) };
}
function tallyOf(count) {
  const tally = { checked: 0, passed: 0, returned: 0 };
  for (let index = 0; index < Math.max(0, Math.floor(count)); index++) {
    tally.checked++;
    if (checkAt(index).verdict === "pass") tally.passed++;
    else tally.returned++;
  }
  return tally;
}
var tallyText = ({ checked, passed, returned }) => `checked ${checked} \xB7 passed ${passed} \xB7 returned ${returned}`;
var one = (value) => (Math.round(value * 10) / 10).toFixed(1);
var PASS_CHECK = checkAt(0);
var RETURN_CHECK = checkAt(2);
function verdictText(check) {
  return check.verdict === "pass" ? `reads ${one(check.value)} \u2264 ${one(LIMIT)} \xB7 passed` : `reads ${one(check.value)} > ${one(LIMIT)} \xB7 returned`;
}

// src/mechanism/view.ts
var WIDTH = 600;
var HEIGHT = 360;
var AZIMUTH2 = 57;
var BASE = { x: -152, y: -36, w: 304, d: 96, r: 8 };
var BASE_H = 9;
var FOOT_H = 5;
var BT = 30;
var BELT_X0 = -128;
var BELT_X1 = 96;
var DRUM_R = 5;
var BELT_HALF = 13;
var RAIL_IN = 13.5;
var RAIL_OUT = 16.5;
var RAIL_X0 = BELT_X0 - DRUM_R - 3;
var RAIL_X1 = BELT_X1 + DRUM_R + 3;
var RAIL_Z = BT - 13;
var LIP = 2;
var LEG_X = [-112, 80];
var LEG = 6;
var GAP = [14, 64];
var MAG = { x: -124, y: -RAIL_IN, w: 24, d: RAIL_IN * 2, r: 1.5 };
var MAG_Z = BT + 9;
var MAG_TOP = BT + 58;
var GX = -20;
var POST_Y = 20;
var POST = 6;
var BEAM_Z = BT + 36;
var BEAM_H = 6;
var DIAL_R = 15;
var DIAL_Z = BEAM_Z + BEAM_H + 2;
var DIAL_H = 8;
var DIAL_TOP = DIAL_Z + DIAL_H;
var DIAL_SWEEP = 300;
var ROD_R = 1.3;
var ROD_LONG = 40;
var TIP_R = 2.4;
var TIP_H = 2;
var LIFTED = 0;
var PIVOT = [-10, -21];
var ARM_LONG = 72;
var ARM_Z = BT + 2.5;
var ARM_H = 6.5;
var ARM_T = 2;
var ARM_SWING = 28;
var CHUTE_Y = [26, 42];
var CHUTE_WALL = 2;
var CHUTE_X0 = -86;
var CHUTE_X1 = 10;
var APRON = { x: CHUTE_X1, y: RAIL_OUT, w: 74, d: CHUTE_Y[1] - RAIL_OUT, r: 1 };
var APRON_TOP = BT - 1.5;
var CHUTE_LOW = 9;
var RETURN_TRAY = { x: -114, y: 22, w: 30, d: 26, r: 2 };
var TRAY_WALL = 7;
var RESULT_TRAY = { x: 106, y: -20, w: 38, d: 40, r: 2 };
var TRAY_FLOOR = 1.5;
var TOKEN_R = 7;
var CHUTE_MID = (CHUTE_Y[0] + CHUTE_Y[1]) / 2;
var chuteTop = (x) => CHUTE_LOW + (x - CHUTE_X0) / (CHUTE_X1 - CHUTE_X0) * (APRON_TOP - CHUTE_LOW);
var ASSEMBLIES = ["hopper", "gauge", "diverter", "chute", "tray", "conveyor"];
var MOVES = {
  hopper: [-30, 0, 22],
  gauge: [0, 0, 24],
  diverter: [0, -22, 16],
  chute: [0, 26, 0],
  tray: [30, 0, 0],
  conveyor: [0, 0, 10]
};
var P = fitProjection(
  [
    ...boxCorners(BASE, -BASE_H - FOOT_H, 0),
    [MAG.x + MOVES.hopper[0], MAG.y, MAG_TOP + 3 + MOVES.hopper[2]],
    [MAG.x + MAG.w, MAG.y, MAG_TOP + 3],
    [GX, -DIAL_R, DIAL_TOP + MOVES.gauge[2]],
    [RESULT_TRAY.x + RESULT_TRAY.w + MOVES.tray[0], RESULT_TRAY.y + RESULT_TRAY.d, 0]
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: AZIMUTH2 }
);
var at = (point) => iso(point, P);
var move = (by) => translateAlong(P, by);

// src/mechanism/geometry.ts
var slab = (plan, z, h, steps = 4, bevel = 0) => slabOf(plan, z, h, P, steps, bevel);
var cyl = (x, y, r, z, h, steps = 32, bevel = 0) => cylinder(x, y, r, z, h, P, steps, bevel);
var join = (paths) => paths.filter(Boolean).join("");
var seg = (a, b) => segment(a, b, P);
var byDepth = (points) => [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
var faceRect = (x0, x1, y, z0, z1) => pathOf([at([x0, y, z0]), at([x1, y, z0]), at([x1, y, z1]), at([x0, y, z1])], true);
var profile = (points, y0, y1) => prismOf(points.map(([x, z]) => [x, y0, z]), [0, y1 - y0, 0], P);
var FEET = byDepth(corners(BASE, 20));
var BASE_SCREWS = corners(BASE, 9);
var STRIP = { x: -120, y: BASE.y + BASE.d - 9, w: 196, d: 6, r: 1 };
var STRIP_TICKS = topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y + 0.8, 0.6, [1.8, 3.4], P);
var LABEL = { x: 92, y: 34, w: 46, d: 11, r: 2 };
var BASE_ART = {
  halo: haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P),
  feet: FEET.map(([x, y]) => [cyl(x, y, 7, -BASE_H - FOOT_H, 1.6, 28), cyl(x, y, 5.4, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, 28)]),
  slab: slab(BASE, -BASE_H, BASE_H, 8, 1.6),
  groove: planOutline(insetPlan(BASE, 4.5), 0, P),
  screwRings: join(BASE_SCREWS.map(([x, y]) => ring(x, y, 2.2, 0, P, 16))),
  screws: BASE_SCREWS.map(([x, y]) => at([x, y, 0])),
  strip: slab(STRIP, 0, 0.6, 3),
  stripMinor: STRIP_TICKS.minor,
  stripMajor: STRIP_TICKS.major,
  stripScrews: [at([STRIP.x + 2, STRIP.y + 3, 0.6]), at([STRIP.x + STRIP.w - 2, STRIP.y + 3, 0.6])],
  label: slab(LABEL, 0, 0.8, 4),
  labelLine: planOutline(insetPlan(LABEL, 1.6), 0.8, P),
  labelRule: join([0, 1, 2].map((row) => onTop([[LABEL.x + 7, LABEL.y + 3.4 + row * 2.1], [LABEL.x + (row === 1 ? 26 : 36), LABEL.y + 3.4 + row * 2.1]], 0.8, P))),
  labelScrews: [at([LABEL.x + 3.2, LABEL.y + LABEL.d / 2, 0.8]), at([LABEL.x + LABEL.w - 3.2, LABEL.y + LABEL.d / 2, 0.8])]
};
var legPlan = (x, y) => ({ x: x - LEG / 2, y: y - LEG / 2, w: LEG, d: LEG, r: 0.8 });
var LEGS = byDepth(LEG_X.flatMap((x) => [-15, 15].map((y) => [x, y])));
var stretcher = (y) => ({ x: LEG_X[0] + LEG / 2, y: y - 1.5, w: LEG_X[1] - LEG_X[0] - LEG, d: 3, r: 0.4 });
var railPlan = (y0, x0 = RAIL_X0, x1 = RAIL_X1) => ({ x: x0, y: y0, w: x1 - x0, d: RAIL_OUT - RAIL_IN, r: 0.6 });
var BACK_RAIL = railPlan(-RAIL_OUT);
var FRONT_RAIL = railPlan(RAIL_IN);
var BELT = { x: BELT_X0, y: -BELT_HALF, w: BELT_X1 - BELT_X0, d: BELT_HALF * 2, r: 0 };
var drum = (x) => prismOf(circleIn([x, -BELT_HALF, BT - DRUM_R], DRUM_R, "y", 28), [0, BELT_HALF * 2, 0], P);
var LIP_TICKS = topTicks(-96, 8, 4, 5, RAIL_OUT - 0.4, BT + LIP, [-1.1, -2], P);
var MOTOR_C = [BELT_X1, RAIL_OUT, BT - DRUM_R];
var MOTOR_LONG = 11.5;
var MOTOR_R = 6;
function motorBand(y) {
  const [vx, , vz] = viewOf(P);
  const facing = Math.atan2(vz, vx);
  const points = [];
  for (let step2 = 0; step2 <= 20; step2++) {
    const angle = facing - Math.PI / 2 + step2 / 20 * Math.PI;
    points.push(at([MOTOR_C[0] + MOTOR_R * Math.cos(angle), y, MOTOR_C[2] + MOTOR_R * Math.sin(angle)]));
  }
  return pathOf(points);
}
var BOX = { x: BELT_X1 - 4, y: RAIL_OUT + 2.5, w: 8, d: 6, r: 1 };
var CONVEYOR_BACK = {
  legs: LEGS.map(([x, y]) => ({ foot: slab(insetPlan(legPlan(x, y), -2.4), 0, 1.2, 3), post: slab(legPlan(x, y), 1.2, RAIL_Z - 1.2, 3), screws: [at([x - 3.6, y, 1.2]), at([x + 3.6, y, 1.2])] })),
  stretchers: [-15, 15].map((y) => slab(stretcher(y), 6, 3, 2)),
  backRail: slab(BACK_RAIL, RAIL_Z, BT - RAIL_Z, 3, 0.4),
  backLip: slab(BACK_RAIL, BT, LIP, 3, 0.3),
  backScrews: LEG_X.map((x) => at([x, -RAIL_OUT + 1.5, BT + LIP]))
};
var CONVEYOR_MID = {
  drums: [drum(BELT_X0), drum(BELT_X1)],
  belt: slab(BELT, BT - 1, 1, 2)
};
function slatsOf(phase) {
  const step2 = 8;
  const lines = [];
  const first = BELT_X0 + 3 + (phase % step2 + step2) % step2;
  for (let x = first; x < BELT_X1 - 2; x += step2) lines.push(lineOnTop([x, -BELT_HALF], [x, BELT_HALF], BT, P));
  return join(lines);
}
var FRONT_LIPS = [railPlan(RAIL_IN, RAIL_X0, GAP[0]), railPlan(RAIL_IN, GAP[1], RAIL_X1)];
var CONVEYOR_FRONT = {
  rail: slab(FRONT_RAIL, RAIL_Z, BT - RAIL_Z, 3, 0.4),
  railSeam: join(LEG_X.map((x) => seg([x, RAIL_OUT, RAIL_Z], [x, RAIL_OUT, BT]))),
  railScrews: LEG_X.flatMap((x) => [at([x - 4, RAIL_OUT, RAIL_Z + 4]), at([x + 4, RAIL_OUT, RAIL_Z + 4])]),
  lips: FRONT_LIPS.map((plan) => slab(plan, BT, LIP, 3, 0.3)),
  lipMinor: LIP_TICKS.minor,
  lipMajor: LIP_TICKS.major,
  zero: lineOnTop([GX, RAIL_OUT - 0.4], [GX, RAIL_OUT - 2.6], BT + LIP, P),
  bearing: prismOf(circleIn([BELT_X0, RAIL_OUT, BT - DRUM_R], 4.2, "y", 24), [0, 1.8, 0], P),
  bearingBore: faceCircle([BELT_X0, RAIL_OUT + 1.8, BT - DRUM_R], 1.6, "y", P, 16),
  bearingScrews: [at([BELT_X0 - 3, RAIL_OUT + 1.8, BT - DRUM_R + 0.2]), at([BELT_X0 + 3, RAIL_OUT + 1.8, BT - DRUM_R + 0.2])],
  motor: prismOf(circleIn(MOTOR_C, MOTOR_R, "y", 32), [0, MOTOR_LONG, 0], P),
  motorBands: join([4, 8].map((dy) => motorBand(MOTOR_C[1] + dy))),
  motorCap: faceCircle([MOTOR_C[0], MOTOR_C[1] + MOTOR_LONG, MOTOR_C[2]], MOTOR_R - 1.4, "y", P, 28),
  motorBolts: [0, 1, 2, 3].map((index) => {
    const angle = Math.PI / 4 + index * Math.PI / 2;
    return at([MOTOR_C[0] + (MOTOR_R - 2.6) * Math.cos(angle), MOTOR_C[1] + MOTOR_LONG, MOTOR_C[2] + (MOTOR_R - 2.6) * Math.sin(angle)]);
  }),
  motorShaft: at([MOTOR_C[0], MOTOR_C[1] + MOTOR_LONG, MOTOR_C[2]]),
  box: slab(BOX, MOTOR_C[2] + MOTOR_R - 0.6, 4.6, 3, 0.4),
  boxLine: planOutline(insetPlan(BOX, 1.4), MOTOR_C[2] + MOTOR_R + 4, P, 3),
  boxScrews: [at([BOX.x + 1.6, BOX.y + 1.6, MOTOR_C[2] + MOTOR_R + 4]), at([BOX.x + BOX.w - 1.6, BOX.y + BOX.d - 1.6, MOTOR_C[2] + MOTOR_R + 4])]
};
var CHEEK = (y) => ({ x: MAG.x + 2, y, w: MAG.w - 4, d: RAIL_OUT - RAIL_IN, r: 0.5 });
var WINDOW = [MAG.x + 8, MAG.x + 16, MAG_Z + 8, MAG_TOP - 7];
var STACK = [5.1, 6.6, 3.8, 5.6, 4.9, 6.9, 4.4];
var COLLAR = insetPlan(MAG, -2.6);
var GATE = { x: MAG.x + MAG.w, y: -9, w: 1.6, d: 18, r: 0.5 };
var HOPPER_BACK = {
  backCheek: slab(CHEEK(-RAIL_OUT), BT + LIP, MAG_Z + 6 - BT - LIP, 2),
  tube: slab(MAG, MAG_Z, MAG_TOP - MAG_Z, 3, 0.6),
  seams: join([MAG_Z + 14, MAG_TOP - 14].map((z) => sideSeam(MAG, z, P, 3))),
  window: faceRect(WINDOW[0], WINDOW[1], MAG.y + MAG.d, WINDOW[2], WINDOW[3]),
  stack: (() => {
    const lines = [];
    let z = WINDOW[2];
    for (const height of STACK) {
      z += height;
      if (z >= WINDOW[3] - 0.5) break;
      lines.push(seg([WINDOW[0], MAG.y + MAG.d, z], [WINDOW[1], MAG.y + MAG.d, z]));
    }
    return join(lines);
  })(),
  windowFill: faceRect(WINDOW[0], WINDOW[1], MAG.y + MAG.d, WINDOW[2], WINDOW[3]),
  collar: slab(COLLAR, MAG_TOP, 3, 3, 0.6),
  mouth: planOutline(insetPlan(MAG, 1.6), MAG_TOP + 3, P, 3),
  mouthFill: planOutline(insetPlan(MAG, 1.6), MAG_TOP + 3, P, 3),
  collarScrews: corners(COLLAR, 1.4).map(([x, y]) => at([x, y, MAG_TOP + 3])),
  gate: slab(GATE, MAG_Z, 7, 2, 0.3),
  gateScrews: [at([GATE.x + GATE.w, -5, MAG_Z + 4.4]), at([GATE.x + GATE.w, 5, MAG_Z + 4.4])]
};
var HOPPER_FRONT = {
  cheek: slab(CHEEK(RAIL_IN), BT + LIP, MAG_Z + 6 - BT - LIP, 2),
  cheekScrews: [at([MAG.x + 6, RAIL_OUT, MAG_Z + 2.4]), at([MAG.x + MAG.w - 6, RAIL_OUT, MAG_Z + 2.4])]
};
var postPlan = (y) => ({ x: GX - POST / 2, y: y - POST / 2, w: POST, d: POST, r: 0.8 });
var postArt = (y) => ({
  foot: slab(insetPlan(postPlan(y), -2.6), 0, 1.4, 3, 0.3),
  post: slab(postPlan(y), 1.4, BEAM_Z - 1.4, 3),
  screws: [at([GX - 4.4, y, 1.4]), at([GX + 4.4, y, 1.4])],
  seam: seg([GX + POST / 2, y + POST / 2, 1.4], [GX + POST / 2, y + POST / 2, BEAM_Z])
});
var BEAM = { x: GX - 5, y: -POST_Y - 5, w: 10, d: POST_Y * 2 + 10, r: 1.5 };
var DIAL_FROM = -DIAL_SWEEP / 2;
var angleOf = (reading) => (DIAL_FROM + reading / SCALE * DIAL_SWEEP) * Math.PI / 180;
var DIAL_TICKS = radialTicks(GX, 0, DIAL_R - 3, 20, 2, DIAL_TOP, [1.3, 2.8], P, angleOf(0), DIAL_SWEEP * Math.PI / 180);
var onDial = (reading, radius) => [GX + Math.sin(angleOf(reading)) * radius, -Math.cos(angleOf(reading)) * radius];
function arcOnDial(from, to, radius) {
  const points = [];
  for (let step2 = 0; step2 <= 24; step2++) points.push(onDial(from + (to - from) * step2 / 24, radius));
  return onTop(points, DIAL_TOP, P);
}
var GAUGE_BACK = postArt(-POST_Y);
var GAUGE_FRONT = {
  front: postArt(POST_Y),
  guide: cyl(GX, 0, 3, BEAM_Z - 3, 3, 24),
  beam: slab(BEAM, BEAM_Z, BEAM_H, 3, 0.6),
  beamScrews: [-POST_Y, POST_Y].map((y) => at([GX, y, BEAM_Z + BEAM_H])),
  beamLine: planOutline(insetPlan(BEAM, 2), BEAM_Z + BEAM_H, P, 3),
  neck: cyl(GX, 0, 4, BEAM_Z + BEAM_H, DIAL_Z - BEAM_Z - BEAM_H, 24),
  puck: cyl(GX, 0, DIAL_R, DIAL_Z, DIAL_H, 64, 0.8),
  knurl: knurl(GX, 0, DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3),
  band: sideArc(GX, 0, DIAL_R, DIAL_TOP - 3.4, P, 40),
  bezel: ring(GX, 0, DIAL_R - 2.2, DIAL_TOP, P, 64),
  minor: DIAL_TICKS.minor,
  major: DIAL_TICKS.major,
  /** The passing band, from 0 to the limit, along the inner ends of the major ticks. */
  band0: arcOnDial(0, LIMIT, DIAL_R - 3 - 2.8),
  limit: lineOnTop(onDial(LIMIT, DIAL_R - 0.8), onDial(LIMIT, DIAL_R - 3 - 2.8), DIAL_TOP + 0.05, P),
  limitDot: at([...onDial(LIMIT, DIAL_R - 0.8), DIAL_TOP + 0.05]),
  hub: ring(GX, 0, 1.6, DIAL_TOP, P, 16),
  crown: slab({ x: GX + DIAL_R - 1, y: -2.4, w: 5, d: 4.8, r: 1.2 }, DIAL_Z + 2, 4.4, 3),
  crownCap: slab({ x: GX + DIAL_R + 3.6, y: -3.2, w: 2.6, d: 6.4, r: 1.2 }, DIAL_Z + 1.4, 6, 3),
  crownKnurl: join([-2.2, -1.1, 0, 1.1, 2.2].map((y) => seg([GX + DIAL_R + 6.2, y, DIAL_Z + 1.9], [GX + DIAL_R + 6.2, y, DIAL_Z + 6.9])))
};
var PLUNGER = {
  rod: cyl(GX, 0, ROD_R, BT + TIP_H, ROD_LONG, 16),
  rodMarks: join([6, 9].map((rise2) => sideArc(GX, 0, ROD_R, BT + TIP_H + rise2, P, 12))),
  tip: cyl(GX, 0, TIP_R, BT, TIP_H, 20)
};
function needleOf(reading) {
  const angle = angleOf(reading);
  const ux = Math.sin(angle);
  const uy = -Math.cos(angle);
  const point = (along, across) => at([GX + ux * along - uy * across, uy * along + ux * across, DIAL_TOP + 0.1]);
  return pathOf([point(DIAL_R - 3.6, 0), point(0, 0.75), point(-3.2, 0.35), point(-3.2, -0.35), point(0, -0.75)], true);
}
function dragOf(reading) {
  return lineOnTop(onDial(reading, 1.6), onDial(reading, DIAL_R - 2.6), DIAL_TOP + 0.08, P);
}
var BRACKET = { x: PIVOT[0] - 6, y: PIVOT[1] - 6, w: 12, d: -RAIL_OUT - (PIVOT[1] - 6), r: 1 };
var HEAD_Z = ARM_Z + ARM_H + 1;
var DIVERTER = {
  bracket: slab(BRACKET, RAIL_Z + 3, 4, 3, 0.4),
  bracketScrews: [at([BRACKET.x + 2.4, -RAIL_OUT - 1.6, RAIL_Z + 7]), at([BRACKET.x + BRACKET.w - 2.4, -RAIL_OUT - 1.6, RAIL_Z + 7])],
  post: cyl(PIVOT[0], PIVOT[1], 2.2, RAIL_Z + 7, ARM_Z - RAIL_Z - 7, 20),
  hub: cyl(PIVOT[0], PIVOT[1], 3.4, ARM_Z, ARM_H + 1, 24, 0.3),
  head: cyl(PIVOT[0], PIVOT[1], 4.6, HEAD_Z, 5, 32, 0.5),
  headKnurl: knurl(PIVOT[0], PIVOT[1], 4.6, HEAD_Z, HEAD_Z + 5, 36, P),
  stops: [0, ARM_SWING].map((deg) => at([PIVOT[0] + Math.cos(deg * Math.PI / 180) * 3.6, PIVOT[1] + Math.sin(deg * Math.PI / 180) * 3.6, HEAD_Z + 5]))
};
function armOf(share) {
  const angle = share * ARM_SWING * Math.PI / 180;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const half = ARM_T / 2;
  const ringPoints = [];
  const cap = (cx, cy, start) => {
    for (let step2 = 0; step2 <= 6; step2++) {
      const a = start + step2 / 6 * Math.PI;
      ringPoints.push([cx + Math.cos(a) * half, cy + Math.sin(a) * half]);
    }
  };
  const base = Math.atan2(uy, ux);
  cap(PIVOT[0] + ux * ARM_LONG, PIVOT[1] + uy * ARM_LONG, base - Math.PI / 2);
  cap(PIVOT[0] + ux * 2, PIVOT[1] + uy * 2, base + Math.PI / 2);
  return extrude(ringPoints, ARM_Z, ARM_H, P, { convex: true, bevel: 0.3 });
}
function armPointerOf(share) {
  const angle = share * ARM_SWING * Math.PI / 180;
  return lineOnTop([PIVOT[0] - Math.cos(angle) * 1.4, PIVOT[1] - Math.sin(angle) * 1.4], [PIVOT[0] + Math.cos(angle) * 3.6, PIVOT[1] + Math.sin(angle) * 3.6], HEAD_Z + 5, P);
}
var floorBottom = 1.5;
var chuteFloor = profile(
  [
    [CHUTE_X0, CHUTE_LOW],
    [CHUTE_X1, chuteTop(CHUTE_X1)],
    [CHUTE_X1, chuteTop(CHUTE_X1) - floorBottom],
    [CHUTE_X0, CHUTE_LOW - floorBottom]
  ],
  CHUTE_Y[0],
  CHUTE_Y[1]
);
var wallOf = (y0, x1 = CHUTE_X1) => profile(
  [
    [CHUTE_X0, CHUTE_LOW + 3.5],
    [x1, chuteTop(x1) + 3.5],
    [x1, chuteTop(x1) - floorBottom],
    [CHUTE_X0, CHUTE_LOW - floorBottom]
  ],
  y0,
  y0 + CHUTE_WALL
);
var SUPPORTS = [-60, -16].map((x) => ({ x, top: chuteTop(x) - floorBottom }));
var APRON_POST = [APRON.x + APRON.w - 8, CHUTE_MID];
var trayWalls = (plan, height) => {
  const t = 2;
  return {
    back: { x: plan.x, y: plan.y, w: plan.w, d: t, r: 0.6 },
    left: { x: plan.x, y: plan.y + t, w: t, d: plan.d - t * 2, r: 0.4 },
    right: { x: plan.x + plan.w - t, y: plan.y + t, w: t, d: plan.d - t * 2, r: 0.4 },
    front: { x: plan.x, y: plan.y + plan.d - t, w: plan.w, d: t, r: 0.6 },
    height
  };
};
var RETURN_WALLS = trayWalls(RETURN_TRAY, TRAY_WALL);
var CHUTE_BACK = {
  supports: SUPPORTS.map(({ x, top }) => ({
    foot: slab({ x: x - 4, y: CHUTE_MID - 4, w: 8, d: 8, r: 0.8 }, 0, 1.2, 3, 0.3),
    post: slab({ x: x - 2.2, y: CHUTE_MID - 2.2, w: 4.4, d: 4.4, r: 0.6 }, 1.2, top - 1.2, 3)
  })),
  apronPost: slab({ x: APRON_POST[0] - 2.2, y: APRON_POST[1] - 2.2, w: 4.4, d: 4.4, r: 0.6 }, 1.2, APRON_TOP - 1.5 - 1.2, 3),
  apronFoot: slab({ x: APRON_POST[0] - 4, y: APRON_POST[1] - 4, w: 8, d: 8, r: 0.8 }, 0, 1.2, 3, 0.3),
  trayFloor: slab(RETURN_TRAY, 0, TRAY_FLOOR, 4, 0.3),
  trayBack: slab(RETURN_WALLS.back, TRAY_FLOOR, TRAY_WALL - TRAY_FLOOR, 2),
  trayLeft: slab(RETURN_WALLS.left, TRAY_FLOOR, TRAY_WALL - TRAY_FLOOR, 2),
  floor: chuteFloor,
  floorLines: join([CHUTE_Y[0] + 5.3, CHUTE_Y[1] - 5.3].map((y) => seg([CHUTE_X0, y, CHUTE_LOW], [CHUTE_X1, y, chuteTop(CHUTE_X1)]))),
  apronLines: join([CHUTE_Y[0] + 5.3, CHUTE_Y[1] - 5.3].map((y) => lineOnTop([APRON.x, y], [APRON.x + APRON.w, y], APRON_TOP, P))),
  apron: slab(APRON, APRON_TOP - floorBottom, floorBottom, 3, 0.3),
  backWall: wallOf(CHUTE_Y[0] - CHUTE_WALL)
};
var END_WALL = { x: APRON.x + APRON.w, y: RAIL_OUT, w: CHUTE_WALL, d: CHUTE_Y[1] + CHUTE_WALL - RAIL_OUT, r: 0.5 };
var APRON_FRONT = { x: APRON.x, y: CHUTE_Y[1], w: APRON.w, d: CHUTE_WALL, r: 0.5 };
var CHUTE_FRONT = {
  frontWall: wallOf(CHUTE_Y[1]),
  apronWall: slab(APRON_FRONT, APRON_TOP - floorBottom, 6.5, 2),
  endWall: slab(END_WALL, APRON_TOP - floorBottom, 6.5, 2),
  wallScrews: [-70, -40, -10].map((x) => at([x, CHUTE_Y[1] + CHUTE_WALL, chuteTop(x) + 2])),
  trayRight: slab(RETURN_WALLS.right, TRAY_FLOOR, TRAY_WALL - TRAY_FLOOR, 2),
  trayFront: slab(RETURN_WALLS.front, TRAY_FLOOR, TRAY_WALL - TRAY_FLOOR, 2)
};
var RESULT_WALLS = trayWalls(RESULT_TRAY, 8);
var TRAY_BACK = {
  floor: slab(RESULT_TRAY, 0, TRAY_FLOOR, 4, 0.3),
  floorGrid: join(
    [RESULT_TRAY.x + 19].map((x) => onTop([[x, RESULT_TRAY.y + 2], [x, RESULT_TRAY.y + RESULT_TRAY.d - 2]], TRAY_FLOOR, P))
  ),
  back: slab(RESULT_WALLS.back, TRAY_FLOOR, 8 - TRAY_FLOOR, 2),
  left: slab(RESULT_WALLS.left, TRAY_FLOOR, 8 - TRAY_FLOOR, 2)
};
var TRAY_FRONT = {
  right: slab(RESULT_WALLS.right, TRAY_FLOOR, 8 - TRAY_FLOOR, 2),
  front: slab(RESULT_WALLS.front, TRAY_FLOOR, 8 - TRAY_FLOOR, 2),
  screws: [RESULT_TRAY.x + 6, RESULT_TRAY.x + RESULT_TRAY.w - 6].map((x) => at([x, RESULT_TRAY.y + RESULT_TRAY.d - 1, 8]))
};
function tokenOf(height) {
  const solid = extrude(circleRing(0, 0, TOKEN_R, 36), 0, height, P, { convex: true, bevel: 0.6 });
  return { solid, face: ring(0, 0, TOKEN_R - 2.4, height, P, 32), mark: at([0, 0, height]) };
}
var ORIGIN = at([0, 0, 0]);

// src/mechanism/motion.ts
var SPEED = 52;
var X_IN = -104;
var X_SHOWN = -90;
var ARRIVE = (GX - X_IN) / SPEED;
var LOWER = 0.35;
var MEASURED = ARRIVE + 0.6;
var RAISE_AT = ARRIVE + 1;
var RAISED = ARRIVE + 1.3;
var SWING_AT = ARRIVE + 0.7;
var SWUNG = ARRIVE + 1.2;
var ARM_DIR = [Math.cos(ARM_SWING * Math.PI / 180), Math.sin(ARM_SWING * Math.PI / 180)];
var CONTACT_X = PIVOT[0] + ARM_DIR[0] * (-PIVOT[1] / ARM_DIR[1]) - (TOKEN_R + 2) / ARM_DIR[1];
var TO_CONTACT = (CONTACT_X - GX) / SPEED;
var SLIDE_SPEED = 40;
var SLIDE_LONG = CHUTE_MID / ARM_DIR[1];
var SLIDE = SLIDE_LONG / SLIDE_SPEED;
var OFF_BELT = RAIL_OUT + TOKEN_R;
var CHUTE_RUN = 1.7;
var DROP = 0.4;
var TRAY_SLOTS = [
  [RESULT_TRAY.x + 10, RESULT_TRAY.y + 12],
  [RESULT_TRAY.x + 27, RESULT_TRAY.y + 12],
  [RESULT_TRAY.x + 10, RESULT_TRAY.y + 29],
  [RESULT_TRAY.x + 27, RESULT_TRAY.y + 29]
];
var RETURN_AT = [RETURN_TRAY.x + 13, RETURN_TRAY.y + RETURN_TRAY.d / 2, TRAY_FLOOR];
var PERIOD = 5.4;
var IDLE_START = 4 * PERIOD + 0.4;
var KEEP_RETURNED = 1.8;
var clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
var smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
var lerp = (a, b, t) => a + (b - a) * t;
var mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function tokenAt(u, check, slot) {
  const onBelt = (x) => [x, 0, BT];
  if (u < ARRIVE) {
    const x = X_IN + SPEED * Math.max(0, u);
    return { pos: onBelt(x), layer: "belt", alpha: smooth((x - X_IN) / (X_SHOWN - X_IN)), done: false };
  }
  if (u < RAISED) return { pos: onBelt(GX), layer: "belt", alpha: 1, done: false };
  const v = u - RAISED;
  if (check.verdict === "pass") {
    const leave = (BELT_X1 + 4 - GX) / SPEED;
    if (v < leave) return { pos: onBelt(GX + SPEED * v), layer: "belt", alpha: 1, done: false };
    const [tx, ty] = TRAY_SLOTS[slot % TRAY_SLOTS.length];
    const fall2 = clamp((v - leave) / DROP);
    const from2 = onBelt(BELT_X1 + 4);
    const pos2 = [lerp(from2[0], tx, fall2), lerp(0, ty, fall2), BT - (BT - TRAY_FLOOR) * fall2 * fall2];
    return { pos: pos2, layer: pos2[0] > BELT_X1 + 6 ? "tray" : "belt", alpha: 1, done: fall2 >= 1 };
  }
  if (v < TO_CONTACT) return { pos: onBelt(GX + SPEED * v), layer: "belt", alpha: 1, done: false };
  const w = v - TO_CONTACT;
  if (w < SLIDE) {
    const along = SLIDE_SPEED * w;
    const y = ARM_DIR[1] * along;
    const drop = smooth((y - OFF_BELT) / 5) * (BT - APRON_TOP);
    return { pos: [CONTACT_X + ARM_DIR[0] * along, y, BT - drop], layer: y > 10 ? "chute" : "belt", alpha: 1, done: false };
  }
  const start = [CONTACT_X + ARM_DIR[0] * SLIDE_LONG, CHUTE_MID, APRON_TOP];
  const r = w - SLIDE;
  if (r < CHUTE_RUN) {
    const t = clamp(r / CHUTE_RUN);
    const ease = t * t * (1.6 - 0.6 * t);
    const x = lerp(start[0], CHUTE_X0, ease);
    return { pos: [x, CHUTE_MID, x > CHUTE_X1 ? APRON_TOP : chuteTop(x)], layer: "chute", alpha: 1, done: false };
  }
  const fall = clamp((r - CHUTE_RUN) / DROP);
  const from = [CHUTE_X0, CHUTE_MID, chuteTop(CHUTE_X0)];
  const pos = mix3(from, RETURN_AT, fall);
  pos[2] = from[2] - (from[2] - RETURN_AT[2]) * fall * fall;
  return { pos, layer: "chute", alpha: 1, done: fall >= 1 };
}
var RUN_LONG = {
  pass: RAISED + (BELT_X1 + 4 - GX) / SPEED + DROP,
  return: RAISED + TO_CONTACT + SLIDE + CHUTE_RUN + DROP
};
function liftAt(u) {
  if (u < ARRIVE || u > RAISED) return LIFTED;
  if (u < ARRIVE + LOWER) return LIFTED * (1 - smooth((u - ARRIVE) / LOWER));
  if (u < RAISE_AT) return 0;
  return LIFTED * smooth((u - RAISE_AT) / (RAISED - RAISE_AT));
}
function armAt(u, check) {
  if (check.verdict === "pass") return 0;
  const reopen = RAISED + TO_CONTACT + SLIDE * 0.8;
  if (u < SWING_AT) return 0;
  if (u < SWUNG) return smooth((u - SWING_AT) / (SWUNG - SWING_AT));
  if (u < reopen) return 1;
  return 1 - smooth((u - reopen) / 0.5);
}
var dwelling = (u) => u >= ARRIVE && u < RAISED;
function history(count) {
  return Array.from({ length: count }, (_, index) => {
    const check = checkAt([1, 3, 4][index] ?? 1);
    const [x, y] = TRAY_SLOTS[index];
    return { key: `history-${index}`, check, pos: [x, y, TRAY_FLOOR], layer: "tray", alpha: 1, lit: false };
  });
}
function idleScene(t) {
  const now = Math.floor(t / PERIOD);
  const tokens = [];
  let lift = LIFTED;
  let arm = 0;
  let belt = SPEED;
  let measured = 0;
  let drag = 0;
  const passesBefore = (index) => tallyOf(index).passed;
  for (let index = Math.max(0, now - 9); index <= now; index++) {
    const u = t - index * PERIOD;
    const check = checkAt(index);
    if (u >= MEASURED) {
      measured = index + 1;
      drag = check.value;
    }
    lift = Math.min(lift, liftAt(u));
    arm = Math.max(arm, armAt(u, check));
    if (dwelling(u)) belt = 0;
    const slot = passesBefore(index);
    const where = tokenAt(u, check, slot);
    if (check.verdict === "pass") {
      let replacedAt = Infinity;
      for (let later = index + 1, seen = 0; seen < 4 && later <= now + 1; later++) {
        if (checkAt(later).verdict !== "pass") continue;
        seen++;
        if (seen === 4) replacedAt = later * PERIOD;
      }
      if (t >= replacedAt) continue;
    } else if (u > RUN_LONG.return + KEEP_RETURNED) continue;
    tokens.push({ key: `run-${index}`, check, pos: where.pos, layer: where.layer, alpha: where.alpha, lit: !where.done });
  }
  const tally = tallyOf(measured);
  return { tokens, lift, arm, belt, apart: false, drag, readout: tallyText(tally), phase: `running, ${tallyText(tally)}` };
}
function singleScene(t, verdict, round = 0) {
  const check = verdict === "pass" ? PASS_CHECK : RETURN_CHECK;
  const tokens = history(verdict === "pass" ? 2 : 3);
  const where = tokenAt(t, check, 2);
  tokens.push({ key: `${verdict}-${round}`, check, pos: where.pos, layer: where.layer, alpha: where.alpha, lit: true });
  const done = t >= MEASURED;
  return {
    tokens,
    lift: liftAt(t),
    arm: armAt(t, check),
    belt: dwelling(t) || where.done || where.layer !== "belt" ? 0 : SPEED,
    apart: false,
    drag: done ? check.value : 0,
    readout: done ? verdictText(check) : `checking proposal ${check.proposal}`,
    phase: done ? verdictText(check) : "checking"
  };
}
function apartScene() {
  const tokens = history(3);
  const check = checkAt(4);
  tokens.push({ key: "apart-0", check, pos: [-60, 0, BT], layer: "belt", alpha: 1, lit: true });
  return { tokens, lift: 0, arm: 0, belt: 0, apart: true, drag: 0, readout: `apart \xB7 ${ASSEMBLIES.length} assemblies`, phase: "apart" };
}
function sceneAt(pose, t, round = 0) {
  if (pose === "apart") return apartScene();
  if (pose === "pass" || pose === "return") return singleScene(t, pose, round);
  return idleScene(IDLE_START + t);
}
var STILL_AT = {
  idle: ARRIVE + 0.75 - 0.4,
  pass: RAISED + 1.15,
  return: RAISED + TO_CONTACT + SLIDE * 0.62,
  apart: 0
};
var stillScene = (pose) => sceneAt(pose, STILL_AT[pose]);
function contactOver(distance, height) {
  return height * smooth((TOKEN_R + 1 - distance) / 4);
}

// src/mechanism/MechanismFrame.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function MechanismFrame({ fig, title, hint, readout, caption, theme, className, children }) {
  return /* @__PURE__ */ jsxs2("figure", { className: `uipack-mechanism um-frame${className ? ` ${className}` : ""}`, "data-theme": theme, children: [
    /* @__PURE__ */ jsxs2("div", { className: "um-plate", children: [
      /* @__PURE__ */ jsxs2("div", { className: "um-corners", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsx3("span", { className: "um-corner", "data-corner": "fig", children: fig }),
        title ? /* @__PURE__ */ jsx3("span", { className: "um-corner", "data-corner": "title", children: title }) : null,
        hint ? /* @__PURE__ */ jsx3("span", { className: "um-corner", "data-corner": "hint", children: hint }) : null,
        /* @__PURE__ */ jsx3("span", { className: "um-corner", "data-corner": "readout", "data-readout": "", children: readout })
      ] }),
      children
    ] }),
    caption ? /* @__PURE__ */ jsx3("figcaption", { className: "um-caption", children: caption }) : null
  ] });
}

// src/mechanism/VerificationGate.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var LAYERS = ["belt", "chute", "tray"];
var SLOTS = 8;
var LABEL2 = "A verification gate on a bench. Proposal tokens, machined pucks of different heights, leave a hopper on a short conveyor belt and stop under a dial indicator on a bridge. Its plunger rides up onto each token and the needle reads the token's height against a limit mark at 6. A token at or under the limit rides on and drops into the result tray. A taller one is pushed off the belt by a swinging arm into a chute that slides it back to a return tray beside the hopper, to be revised and fed again.";
var GATE_CAPTION = "Illustrative, not data from a real system. A dial indicator measures every proposal before it can become a result: tokens at or under the limit (6.0) ride on to the result tray, taller ones are swung into the return chute and slide back to the hopper's tray, to be revised and tried again.";
var HINTS = {
  idle: "Tap or Space to pause",
  pass: "Tap or Space to run again",
  return: "Tap or Space to run again",
  apart: "Tap or Space to reassemble"
};
var clamp2 = (value, low, high) => Math.min(high, Math.max(low, value));
var fine2 = (value) => Math.round(value * 100) / 100;
var sharesAt = (value) => Object.fromEntries(ASSEMBLIES.map((name) => [name, { at: value, rate: 0 }]));
function contactOf(slots) {
  let top = 0;
  for (const slot of slots) {
    if (!slot.key || slot.layer !== "belt" || slot.alpha < 0.5) continue;
    top = Math.max(top, contactOver(Math.hypot(slot.pos[0] - GX, slot.pos[1]), slot.value));
  }
  return top;
}
function displayOf(scene, shares = scene.apart ? 1 : 0) {
  const slots = Array.from({ length: SLOTS }, () => ({ key: null, value: 5, pos: [0, 0, 0], layer: "belt", alpha: 0, lit: false }));
  scene.tokens.slice(0, SLOTS).forEach((token, index) => {
    slots[index] = { key: token.key, value: token.check.value, pos: [...token.pos], layer: token.layer, alpha: token.alpha, lit: token.lit };
  });
  const tip = Math.max(scene.lift, contactOf(slots));
  return { slots, tip: { at: tip, rate: 0 }, arm: { at: scene.arm, rate: 0 }, drag: scene.drag, beltV: 0, phase: 0, shares: sharesAt(shares) };
}
function step(display, scene, dt, calm, targets) {
  let moving = false;
  const wanted = new Map(scene.tokens.map((token) => [token.key, token]));
  for (const slot of display.slots) {
    if (!slot.key || wanted.has(slot.key)) continue;
    slot.alpha = follow(slot.alpha, 0, dt, 0.16, calm);
    slot.lit = false;
    if (slot.alpha < 0.01) slot.key = null;
    else moving = true;
  }
  for (const token of scene.tokens) {
    let slot = display.slots.find((candidate) => candidate.key === token.key);
    if (!slot) {
      slot = display.slots.find((candidate) => !candidate.key) ?? [...display.slots].sort((a, b) => a.alpha - b.alpha)[0];
      Object.assign(slot, { key: token.key, value: token.check.value, pos: [...token.pos], layer: token.layer, alpha: calm ? token.alpha : 0, lit: token.lit });
      moving = true;
      continue;
    }
    slot.layer = token.layer;
    slot.lit = token.lit;
    for (let axis = 0; axis < 3; axis++) {
      slot.pos[axis] = follow(slot.pos[axis], token.pos[axis], dt, 0.05, calm);
      if (slot.pos[axis] !== token.pos[axis]) moving = true;
    }
    slot.alpha = follow(slot.alpha, token.alpha, dt, 0.12, calm);
    if (slot.alpha !== token.alpha) moving = true;
  }
  const tipWant = Math.max(scene.lift, contactOf(display.slots));
  if (!spring(display.tip, tipWant, dt, 320, 30, calm)) moving = true;
  if (!spring(display.arm, scene.arm, dt, 140, 22, calm)) moving = true;
  display.drag = follow(display.drag, scene.drag, dt, 0.28, calm);
  if (display.drag !== scene.drag) moving = true;
  display.beltV = follow(display.beltV, scene.belt, dt, 0.08, calm);
  if (Math.abs(display.beltV) < 0.05 && scene.belt === 0) display.beltV = 0;
  display.phase += display.beltV * dt;
  if (display.beltV !== 0 || scene.belt !== 0) moving = true;
  for (const name of ASSEMBLIES) {
    if (!spring(display.shares[name], targets[name], dt, 64, 14.2, calm)) moving = true;
  }
  return moving;
}
var tokenMove = (pos) => {
  const [x, y] = at(pos);
  return `translate(${fine2(x - ORIGIN[0])} ${fine2(y - ORIGIN[1])})`;
};
var shareMove = (name, share) => {
  if (share === 0) return "";
  const [x, y, z] = MOVES[name];
  return move([x * share, y * share, z * share]);
};
var readingOf = (display) => clamp2(display.tip.at, 0, SCALE);
function TokenArt({ paths }) {
  const { solid } = paths;
  return /* @__PURE__ */ jsxs3(Fragment, { children: [
    /* @__PURE__ */ jsx4("path", { className: "iso-fill", d: solid.fill }),
    solid.shades.map((d, shade) => /* @__PURE__ */ jsx4("path", { className: "iso-shade", "data-shade": shade, d }, shade)),
    /* @__PURE__ */ jsx4("path", { className: "iso-top", d: solid.top }),
    /* @__PURE__ */ jsx4("path", { className: "iso-line iso-crease", "data-tone": "lo", d: solid.crease }),
    /* @__PURE__ */ jsx4("path", { className: "iso-line iso-bevel", "data-tone": "faint", d: solid.bevel ?? "" }),
    /* @__PURE__ */ jsx4("path", { className: "iso-line um-token-face", "data-tone": "lo", d: paths.face }),
    /* @__PURE__ */ jsx4("path", { className: "iso-line iso-edge", "data-tone": "hi", d: solid.outline }),
    /* @__PURE__ */ jsx4("circle", { className: "um-token-mark", cx: fine2(paths.mark[0]), cy: fine2(paths.mark[1]), r: 0.7 })
  ] });
}
function writeSolid(group, solid) {
  if (!group) return;
  group.querySelector(":scope > .iso-fill")?.setAttribute("d", solid.fill);
  group.querySelectorAll(":scope > .iso-shade").forEach((node, shade) => node.setAttribute("d", solid.shades[shade] ?? ""));
  group.querySelector(":scope > .iso-top")?.setAttribute("d", solid.top);
  group.querySelector(":scope > .iso-crease")?.setAttribute("d", solid.crease);
  group.querySelector(":scope > .iso-bevel")?.setAttribute("d", solid.bevel ?? "");
  group.querySelector(":scope > .iso-edge")?.setAttribute("d", solid.outline);
}
function writeToken(group, paths) {
  writeSolid(group, paths.solid);
  group.querySelector(":scope > .um-token-face")?.setAttribute("d", paths.face);
  const mark = group.querySelector(":scope > .um-token-mark");
  mark?.setAttribute("cx", `${fine2(paths.mark[0])}`);
  mark?.setAttribute("cy", `${fine2(paths.mark[1])}`);
}
var tokenCache = /* @__PURE__ */ new Map();
var tokenPaths = (value) => {
  const key = Math.round(value * 10);
  let paths = tokenCache.get(key);
  if (!paths) tokenCache.set(key, paths = tokenOf(key / 10));
  return paths;
};
function setAttr(node, name, value) {
  if (!node) return;
  if (value === "") {
    if (node.hasAttribute(name)) node.removeAttribute(name);
  } else if (node.getAttribute(name) !== value) node.setAttribute(name, value);
}
function useId2() {
  const id = React2.useId();
  return `um${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
function GateMachine({ pose = "idle", theme, motion = "auto", interactive = true, label = LABEL2, onReadout, className, bare = true }) {
  const uid = useId2();
  const root = React2.useRef(null);
  const live = React2.useRef(null);
  const animated = interactive && motion === "auto";
  const start = React2.useRef(null);
  if (!start.current || !interactive) {
    const calm = !animated || asksForStillness();
    const t = calm || pose === "idle" ? STILL_AT[pose] : 0;
    const scene = calm ? stillScene(pose) : sceneAt(pose, t);
    start.current = { display: displayOf(scene, calm && pose === "apart" ? 1 : 0), scene, t: calm ? STILL_AT[pose] : t };
  }
  const first = start.current;
  const shown = first.display;
  const state = React2.useRef({
    display: first.display,
    t: first.t,
    round: 0,
    paused: false,
    visible: false,
    frame: 0,
    last: 0,
    targets: Object.fromEntries(ASSEMBLIES.map((name) => [name, first.display.shares[name].at])),
    timers: [],
    readout: "",
    phase: "",
    heights: []
  });
  const poseRef = React2.useRef(pose);
  const readoutRef = React2.useRef(onReadout);
  readoutRef.current = onReadout;
  const sceneNow = React2.useCallback(() => {
    const s = state.current;
    const calm = asksForStillness() || motion === "none";
    const scene = calm ? stillScene(poseRef.current) : sceneAt(poseRef.current, s.t, s.round);
    if (s.paused && poseRef.current === "idle") return { ...scene, belt: 0, readout: `${scene.readout} \xB7 paused`, phase: "paused" };
    return scene;
  }, [motion]);
  const draw = React2.useCallback(
    (scene) => {
      const node = root.current;
      if (!node) return;
      const s = state.current;
      const display = s.display;
      const svg = node.querySelector("svg");
      if (!svg) return;
      display.slots.forEach((slot, index) => {
        const value = Math.round(slot.value * 10);
        const rebuild = s.heights[index] !== value;
        s.heights[index] = value;
        for (const layer of LAYERS) {
          const group = svg.querySelector(`[data-slot="${index}"][data-layer="${layer}"]`);
          if (!group) continue;
          const on = slot.key !== null && slot.layer === layer && slot.alpha > 5e-3;
          if (rebuild) writeToken(group, tokenPaths(slot.value));
          setAttr(group, "display", on ? "" : "none");
          if (!on) continue;
          setAttr(group, "transform", tokenMove(slot.pos));
          setAttr(group, "opacity", slot.alpha >= 0.995 ? "" : slot.alpha.toFixed(2));
          if (slot.lit) group.setAttribute("data-lit", "");
          else group.removeAttribute("data-lit");
        }
      });
      setAttr(svg.querySelector("[data-part=slats]"), "d", slatsOf(display.phase));
      setAttr(svg.querySelector("[data-part=plunger]"), "transform", move([0, 0, display.tip.at]));
      setAttr(svg.querySelector("[data-part=needle]"), "d", needleOf(readingOf(display)));
      setAttr(svg.querySelector("[data-part=drag]"), "d", dragOf(clamp2(display.drag, 0, SCALE)));
      writeSolid(svg.querySelector("[data-part=arm]"), armOf(clamp2(display.arm.at, -0.05, 1.05)));
      setAttr(svg.querySelector("[data-part=pointer]"), "d", armPointerOf(clamp2(display.arm.at, -0.05, 1.05)));
      for (const name of ASSEMBLIES) {
        const transform = shareMove(name, Math.abs(display.shares[name].at) < 1e-4 ? 0 : display.shares[name].at);
        svg.querySelectorAll(`[data-assembly="${name}"]`).forEach((group) => setAttr(group, "transform", transform));
      }
      let text = scene.readout;
      if (poseRef.current === "apart" && ASSEMBLIES.some((name) => Math.abs(display.shares[name].at - 1) > 0.01)) text = "taking apart";
      else if (poseRef.current !== "apart" && ASSEMBLIES.some((name) => display.shares[name].at > 0.01)) text = "closing up";
      if (text !== s.readout) {
        s.readout = text;
        const slot = node.closest(".um-frame")?.querySelector("[data-readout]");
        if (slot && slot.textContent !== text) slot.textContent = text;
        readoutRef.current?.(text);
      }
      if (scene.phase !== s.phase && live.current) {
        s.phase = scene.phase;
        if (document.activeElement === node) live.current.textContent = scene.phase;
      }
    },
    []
  );
  const run = React2.useCallback(() => {
    const s = state.current;
    if (s.frame || !s.visible) return;
    s.last = 0;
    const tick = (now) => {
      const dt = s.last ? Math.min((now - s.last) / 1e3, 1 / 30) : 1 / 60;
      s.last = now;
      const calm = asksForStillness() || motion === "none";
      const current = poseRef.current;
      if (!s.paused && !calm) s.t += dt;
      const scene = sceneNow();
      const moving = step(s.display, scene, dt, calm, s.targets);
      draw(scene);
      const scripted = !calm && !s.paused && (current === "idle" || (current === "pass" || current === "return") && s.t < RUN_LONG[current] + 0.2);
      const pending = s.timers.length > 0;
      s.frame = s.visible && (moving || scripted || pending) ? requestAnimationFrame(tick) : 0;
    };
    s.frame = requestAnimationFrame(tick);
  }, [draw, motion, sceneNow]);
  const stop = React2.useCallback(() => {
    const s = state.current;
    cancelAnimationFrame(s.frame);
    s.frame = 0;
  }, []);
  const aim = React2.useCallback((apart, calm) => {
    const s = state.current;
    s.timers.forEach((timer) => window.clearTimeout(timer));
    s.timers = [];
    const order = apart ? [...ASSEMBLIES] : [...ASSEMBLIES].reverse();
    const changing = order.filter((name) => s.targets[name] !== (apart ? 1 : 0));
    changing.forEach((name, index) => {
      if (calm || index === 0) {
        s.targets[name] = apart ? 1 : 0;
        return;
      }
      const timer = window.setTimeout(() => {
        s.targets[name] = apart ? 1 : 0;
        s.timers = s.timers.filter((other) => other !== timer);
      }, index * 70);
      s.timers.push(timer);
    });
  }, []);
  React2.useEffect(() => {
    if (!interactive) return;
    const s = state.current;
    const changed = poseRef.current !== pose;
    poseRef.current = pose;
    const calm = asksForStillness() || motion === "none";
    if (changed) {
      s.t = calm ? STILL_AT[pose] : 0;
      s.round++;
      s.paused = false;
    }
    aim(pose === "apart", calm);
    if (calm) {
      const scene = sceneNow();
      step(s.display, scene, 1, true, s.targets);
      draw(scene);
      return;
    }
    run();
  }, [pose, interactive, motion, aim, draw, run, sceneNow]);
  React2.useEffect(() => {
    if (!interactive) return;
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      state.current.visible = true;
      run();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = Boolean(entries[entries.length - 1]?.isIntersecting);
        state.current.visible = visible;
        if (visible) run();
        else stop();
      },
      { rootMargin: "120px 0px" }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
      state.current.timers.forEach((timer) => window.clearTimeout(timer));
      state.current.timers = [];
    };
  }, [interactive, run, stop]);
  React2.useEffect(() => {
    if (!interactive || typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => {
      const s = state.current;
      if (query.matches) {
        stop();
        s.t = STILL_AT[poseRef.current];
        aim(poseRef.current === "apart", true);
        const scene = sceneNow();
        step(s.display, scene, 1, true, s.targets);
        draw(scene);
      } else run();
    };
    query.addEventListener?.("change", changed);
    return () => query.removeEventListener?.("change", changed);
  }, [interactive, aim, draw, run, sceneNow, stop]);
  const act = () => {
    const s = state.current;
    const current = poseRef.current;
    const calm = asksForStillness() || motion === "none";
    if (current === "idle") s.paused = !s.paused;
    else if (current === "apart") {
      const open = ASSEMBLIES.every((name) => s.targets[name] === 1);
      aim(!open, calm);
    } else {
      s.round++;
      s.t = calm ? STILL_AT[current] : 0;
    }
    if (calm) {
      const scene = sceneNow();
      step(s.display, scene, 1, true, s.targets);
      draw(scene);
    }
    run();
    if (live.current) live.current.textContent = current === "idle" ? s.paused ? "paused" : "running" : current === "apart" ? "reassembling or taking apart" : "running again";
  };
  const reading = readingOf(shown);
  const arm = armOf(shown.arm.at);
  const hint = HINTS[pose];
  const art = /* @__PURE__ */ jsxs3("svg", { className: "iso-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": label, focusable: "false", children: [
    /* @__PURE__ */ jsx4("title", { id: `${uid}-title`, children: "Verification gate" }),
    /* @__PURE__ */ jsxs3("g", { "data-part": "base", children: [
      /* @__PURE__ */ jsx4("path", { className: "iso-halo", d: BASE_ART.halo }),
      BASE_ART.feet.map((parts, index) => /* @__PURE__ */ jsx4("g", { children: parts.map((paths, part) => /* @__PURE__ */ jsx4(Solid, { paths, tone: part ? "mid" : "lo" }, part)) }, index)),
      /* @__PURE__ */ jsx4(Solid, { paths: BASE_ART.slab, tone: "mid" }),
      /* @__PURE__ */ jsx4(Line, { d: BASE_ART.groove, tone: "lo" }),
      /* @__PURE__ */ jsx4(Line, { d: BASE_ART.screwRings, tone: "lo" }),
      /* @__PURE__ */ jsx4(Dots, { points: BASE_ART.screws, size: 0.5, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: BASE_ART.strip, tone: "lo", crease: "none" }),
      /* @__PURE__ */ jsx4(Line, { d: BASE_ART.stripMinor, tone: "lo" }),
      /* @__PURE__ */ jsx4(Line, { d: BASE_ART.stripMajor, tone: "mid" }),
      /* @__PURE__ */ jsx4(Dots, { points: BASE_ART.stripScrews, size: 0.45, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: BASE_ART.label, tone: "lo", crease: "none" }),
      /* @__PURE__ */ jsx4(Line, { d: BASE_ART.labelLine, tone: "faint" }),
      /* @__PURE__ */ jsx4(Line, { d: BASE_ART.labelRule, tone: "lo", free: true }),
      /* @__PURE__ */ jsx4(Dots, { points: BASE_ART.labelScrews, size: 0.45, tone: "mid" })
    ] }),
    /* @__PURE__ */ jsxs3("g", { "data-assembly": "conveyor", transform: shareMove("conveyor", shown.shares.conveyor.at) || void 0, children: [
      CONVEYOR_BACK.legs.map((leg, index) => /* @__PURE__ */ jsxs3("g", { children: [
        /* @__PURE__ */ jsx4(Solid, { paths: leg.foot, tone: "lo" }),
        /* @__PURE__ */ jsx4(Dots, { points: leg.screws, size: 0.45, tone: "mid" }),
        /* @__PURE__ */ jsx4(Solid, { paths: leg.post, tone: "mid" })
      ] }, index)),
      CONVEYOR_BACK.stretchers.map((paths, index) => /* @__PURE__ */ jsx4(Solid, { paths, tone: "mid" }, index)),
      /* @__PURE__ */ jsx4(Solid, { paths: CONVEYOR_BACK.backRail, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CONVEYOR_BACK.backLip, tone: "mid" }),
      /* @__PURE__ */ jsx4(Dots, { points: CONVEYOR_BACK.backScrews, size: 0.45, tone: "mid" })
    ] }),
    /* @__PURE__ */ jsxs3("g", { "data-assembly": "gauge", transform: shareMove("gauge", shown.shares.gauge.at) || void 0, children: [
      /* @__PURE__ */ jsx4(Solid, { paths: GAUGE_BACK.foot, tone: "lo" }),
      /* @__PURE__ */ jsx4(Dots, { points: GAUGE_BACK.screws, size: 0.45, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: GAUGE_BACK.post, tone: "mid" })
    ] }),
    /* @__PURE__ */ jsxs3("g", { "data-assembly": "diverter", transform: shareMove("diverter", shown.shares.diverter.at) || void 0, children: [
      /* @__PURE__ */ jsx4(Solid, { paths: DIVERTER.bracket, tone: "mid" }),
      /* @__PURE__ */ jsx4(Dots, { points: DIVERTER.bracketScrews, size: 0.45, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: DIVERTER.post, tone: "mid", crease: "none" }),
      /* @__PURE__ */ jsx4(Solid, { paths: DIVERTER.hub, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: DIVERTER.head, tone: "mid" }),
      /* @__PURE__ */ jsx4(Line, { d: DIVERTER.headKnurl, tone: "lo" }),
      /* @__PURE__ */ jsx4(Dots, { points: DIVERTER.stops, size: 0.45, tone: "hi" }),
      /* @__PURE__ */ jsx4("path", { "data-part": "pointer", className: "iso-line", "data-tone": "hi", d: armPointerOf(shown.arm.at) })
    ] }),
    /* @__PURE__ */ jsxs3("g", { "data-assembly": "conveyor", transform: shareMove("conveyor", shown.shares.conveyor.at) || void 0, children: [
      CONVEYOR_MID.drums.map((paths, index) => /* @__PURE__ */ jsx4(Solid, { paths, tone: "mid" }, index)),
      /* @__PURE__ */ jsx4(Solid, { paths: CONVEYOR_MID.belt, tone: "mid", crease: "faint" }),
      /* @__PURE__ */ jsx4("path", { "data-part": "slats", className: "iso-line", "data-tone": "faint", d: slatsOf(shown.phase) })
    ] }),
    /* @__PURE__ */ jsxs3("g", { "data-assembly": "hopper", transform: shareMove("hopper", shown.shares.hopper.at) || void 0, children: [
      /* @__PURE__ */ jsx4(Solid, { paths: HOPPER_BACK.backCheek, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: HOPPER_BACK.tube, tone: "mid", inner: /* @__PURE__ */ jsx4(Line, { d: HOPPER_BACK.seams, tone: "faint" }) }),
      /* @__PURE__ */ jsx4("path", { className: "um-cavity", d: HOPPER_BACK.windowFill }),
      /* @__PURE__ */ jsx4(Line, { d: HOPPER_BACK.stack, tone: "mid" }),
      /* @__PURE__ */ jsx4(Line, { d: HOPPER_BACK.window, tone: "lo" }),
      /* @__PURE__ */ jsx4(Solid, { paths: HOPPER_BACK.collar, tone: "mid" }),
      /* @__PURE__ */ jsx4("path", { className: "um-cavity", d: HOPPER_BACK.mouthFill }),
      /* @__PURE__ */ jsx4(Line, { d: HOPPER_BACK.mouth, tone: "lo" }),
      /* @__PURE__ */ jsx4(Dots, { points: HOPPER_BACK.collarScrews, size: 0.45, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: HOPPER_BACK.gate, tone: "mid" }),
      /* @__PURE__ */ jsx4(Dots, { points: HOPPER_BACK.gateScrews, size: 0.45, tone: "mid" })
    ] }),
    /* @__PURE__ */ jsxs3("g", { "data-assembly": "diverter", transform: shareMove("diverter", shown.shares.diverter.at) || void 0, children: [
      /* @__PURE__ */ jsxs3("g", { "data-part": "arm", className: "iso-solid", children: [
        /* @__PURE__ */ jsx4("path", { className: "iso-fill", d: arm.fill }),
        arm.shades.map((d, shade) => /* @__PURE__ */ jsx4("path", { className: "iso-shade", "data-shade": shade, d }, shade)),
        /* @__PURE__ */ jsx4("path", { className: "iso-top", d: arm.top }),
        /* @__PURE__ */ jsx4("path", { className: "iso-line iso-crease", "data-tone": "faint", d: arm.crease }),
        /* @__PURE__ */ jsx4("path", { className: "iso-line iso-bevel", "data-tone": "faint", d: arm.bevel ?? "" }),
        /* @__PURE__ */ jsx4("path", { className: "iso-line iso-edge", "data-tone": "mid", d: arm.outline })
      ] }),
      /* @__PURE__ */ jsx4("g", { "data-assembly": "conveyor", transform: shareMove("conveyor", shown.shares.conveyor.at) || void 0, children: /* @__PURE__ */ jsx4(Tokens, { layer: "belt", slots: shown.slots }) }),
      /* @__PURE__ */ jsxs3("g", { "data-assembly": "conveyor", transform: shareMove("conveyor", shown.shares.conveyor.at) || void 0, children: [
        /* @__PURE__ */ jsx4(Solid, { paths: CONVEYOR_FRONT.rail, tone: "mid", inner: /* @__PURE__ */ jsx4(Line, { d: CONVEYOR_FRONT.railSeam, tone: "faint" }) }),
        /* @__PURE__ */ jsx4(Dots, { points: CONVEYOR_FRONT.railScrews, size: 0.45, tone: "mid" }),
        CONVEYOR_FRONT.lips.map((paths, index) => /* @__PURE__ */ jsx4(Solid, { paths, tone: "mid" }, index)),
        /* @__PURE__ */ jsx4(Line, { d: CONVEYOR_FRONT.lipMinor, tone: "lo" }),
        /* @__PURE__ */ jsx4(Line, { d: CONVEYOR_FRONT.lipMajor, tone: "mid" }),
        /* @__PURE__ */ jsx4(Line, { d: CONVEYOR_FRONT.zero, tone: "hi" }),
        /* @__PURE__ */ jsx4(Solid, { paths: CONVEYOR_FRONT.bearing, tone: "mid" }),
        /* @__PURE__ */ jsx4(Line, { d: CONVEYOR_FRONT.bearingBore, tone: "lo" }),
        /* @__PURE__ */ jsx4(Dots, { points: CONVEYOR_FRONT.bearingScrews, size: 0.45, tone: "mid" }),
        /* @__PURE__ */ jsx4(Solid, { paths: CONVEYOR_FRONT.motor, tone: "mid", inner: /* @__PURE__ */ jsx4(Line, { d: CONVEYOR_FRONT.motorBands, tone: "faint" }) }),
        /* @__PURE__ */ jsx4(Line, { d: CONVEYOR_FRONT.motorCap, tone: "lo" }),
        /* @__PURE__ */ jsx4(Dots, { points: CONVEYOR_FRONT.motorBolts, size: 0.45, tone: "mid" }),
        /* @__PURE__ */ jsx4(Dots, { points: [CONVEYOR_FRONT.motorShaft], size: 0.8, tone: "hi" }),
        /* @__PURE__ */ jsx4(Solid, { paths: CONVEYOR_FRONT.box, tone: "mid" }),
        /* @__PURE__ */ jsx4(Line, { d: CONVEYOR_FRONT.boxLine, tone: "faint" }),
        /* @__PURE__ */ jsx4(Dots, { points: CONVEYOR_FRONT.boxScrews, size: 0.4, tone: "mid" })
      ] }),
      /* @__PURE__ */ jsxs3("g", { "data-assembly": "hopper", transform: shareMove("hopper", shown.shares.hopper.at) || void 0, children: [
        /* @__PURE__ */ jsx4(Solid, { paths: HOPPER_FRONT.cheek, tone: "mid" }),
        /* @__PURE__ */ jsx4(Dots, { points: HOPPER_FRONT.cheekScrews, size: 0.45, tone: "mid" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs3("g", { "data-assembly": "gauge", transform: shareMove("gauge", shown.shares.gauge.at) || void 0, children: [
      /* @__PURE__ */ jsxs3("g", { "data-part": "plunger", transform: move([0, 0, shown.tip.at]), children: [
        /* @__PURE__ */ jsx4(Solid, { paths: PLUNGER.tip, tone: "hi" }),
        /* @__PURE__ */ jsx4(Solid, { paths: PLUNGER.rod, tone: "hi", crease: "none", inner: /* @__PURE__ */ jsx4(Line, { d: PLUNGER.rodMarks, tone: "lo" }) })
      ] }),
      /* @__PURE__ */ jsx4(Solid, { paths: GAUGE_FRONT.guide, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: GAUGE_FRONT.front.foot, tone: "lo" }),
      /* @__PURE__ */ jsx4(Dots, { points: GAUGE_FRONT.front.screws, size: 0.45, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: GAUGE_FRONT.front.post, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: GAUGE_FRONT.beam, tone: "mid" }),
      /* @__PURE__ */ jsx4(Line, { d: GAUGE_FRONT.beamLine, tone: "faint" }),
      /* @__PURE__ */ jsx4(Dots, { points: GAUGE_FRONT.beamScrews, size: 0.5, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: GAUGE_FRONT.neck, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: GAUGE_FRONT.crown, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: GAUGE_FRONT.crownCap, tone: "mid", inner: /* @__PURE__ */ jsx4(Line, { d: GAUGE_FRONT.crownKnurl, tone: "lo" }) }),
      /* @__PURE__ */ jsx4(Solid, { paths: GAUGE_FRONT.puck, tone: "hi", crease: "lo", inner: /* @__PURE__ */ jsx4(Line, { d: GAUGE_FRONT.band, tone: "faint" }) }),
      /* @__PURE__ */ jsx4(Line, { d: GAUGE_FRONT.knurl, tone: "lo" }),
      /* @__PURE__ */ jsx4(Line, { d: GAUGE_FRONT.bezel, tone: "lo" }),
      /* @__PURE__ */ jsx4(Line, { d: GAUGE_FRONT.minor, tone: "lo" }),
      /* @__PURE__ */ jsx4(Line, { d: GAUGE_FRONT.major, tone: "mid" }),
      /* @__PURE__ */ jsx4(Line, { d: GAUGE_FRONT.band0, tone: "mid" }),
      /* @__PURE__ */ jsx4("path", { className: "iso-line um-limit", d: GAUGE_FRONT.limit }),
      /* @__PURE__ */ jsx4("path", { "data-part": "drag", className: "iso-line um-drag", d: dragOf(clamp2(shown.drag, 0, SCALE)) }),
      /* @__PURE__ */ jsx4("path", { "data-part": "needle", className: "iso-line um-needle", d: needleOf(reading) }),
      /* @__PURE__ */ jsx4(Line, { d: GAUGE_FRONT.hub, tone: "mid" })
    ] }),
    /* @__PURE__ */ jsxs3("g", { "data-assembly": "chute", transform: shareMove("chute", shown.shares.chute.at) || void 0, children: [
      CHUTE_BACK.supports.map((support, index) => /* @__PURE__ */ jsxs3("g", { children: [
        /* @__PURE__ */ jsx4(Solid, { paths: support.foot, tone: "lo" }),
        /* @__PURE__ */ jsx4(Solid, { paths: support.post, tone: "mid" })
      ] }, index)),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_BACK.apronFoot, tone: "lo" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_BACK.apronPost, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_BACK.trayFloor, tone: "lo" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_BACK.trayBack, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_BACK.trayLeft, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_BACK.backWall, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_BACK.floor, tone: "mid", inner: /* @__PURE__ */ jsx4(Line, { d: CHUTE_BACK.floorLines, tone: "lo" }) }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_BACK.apron, tone: "mid", inner: /* @__PURE__ */ jsx4(Line, { d: CHUTE_BACK.apronLines, tone: "lo" }) }),
      /* @__PURE__ */ jsx4(Tokens, { layer: "chute", slots: shown.slots }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_FRONT.frontWall, tone: "mid" }),
      /* @__PURE__ */ jsx4(Dots, { points: CHUTE_FRONT.wallScrews, size: 0.45, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_FRONT.apronWall, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_FRONT.endWall, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_FRONT.trayRight, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: CHUTE_FRONT.trayFront, tone: "mid" })
    ] }),
    /* @__PURE__ */ jsxs3("g", { "data-assembly": "tray", transform: shareMove("tray", shown.shares.tray.at) || void 0, children: [
      /* @__PURE__ */ jsx4(Solid, { paths: TRAY_BACK.floor, tone: "lo" }),
      /* @__PURE__ */ jsx4(Line, { d: TRAY_BACK.floorGrid, tone: "faint" }),
      /* @__PURE__ */ jsx4(Solid, { paths: TRAY_BACK.back, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: TRAY_BACK.left, tone: "mid" }),
      /* @__PURE__ */ jsx4(Tokens, { layer: "tray", slots: shown.slots }),
      /* @__PURE__ */ jsx4(Solid, { paths: TRAY_FRONT.right, tone: "mid" }),
      /* @__PURE__ */ jsx4(Solid, { paths: TRAY_FRONT.front, tone: "mid" }),
      /* @__PURE__ */ jsx4(Dots, { points: TRAY_FRONT.screws, size: 0.45, tone: "mid" })
    ] })
  ] });
  const machine = /* @__PURE__ */ jsxs3(
    "div",
    {
      ref: root,
      className: `um-machine${bare ? " uipack-mechanism" : ""}${className ? ` ${className}` : ""}`,
      "data-theme": bare ? theme : void 0,
      "data-pose": pose,
      "data-interactive": interactive ? "" : void 0,
      role: interactive ? "button" : void 0,
      tabIndex: interactive ? 0 : void 0,
      "aria-label": interactive ? `Verification gate, ${pose} pose. ${hint}.` : void 0,
      "aria-describedby": interactive ? `${uid}-title` : void 0,
      onClick: interactive ? act : void 0,
      onKeyDown: interactive ? (event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          if (!event.repeat) act();
        }
      } : void 0,
      children: [
        art,
        interactive ? /* @__PURE__ */ jsx4("span", { ref: live, className: "um-hidden", "aria-live": "polite" }) : null
      ]
    }
  );
  return machine;
}
function Tokens({ layer, slots }) {
  return /* @__PURE__ */ jsx4(Fragment, { children: slots.map((slot, index) => {
    const on = slot.key !== null && slot.layer === layer && slot.alpha > 5e-3;
    return /* @__PURE__ */ jsx4(
      "g",
      {
        className: "iso-solid um-token",
        "data-slot": index,
        "data-layer": layer,
        "data-lit": on && slot.lit ? "" : void 0,
        display: on ? void 0 : "none",
        transform: tokenMove(slot.pos),
        opacity: on && slot.alpha < 0.995 ? slot.alpha.toFixed(2) : void 0,
        children: /* @__PURE__ */ jsx4(TokenArt, { paths: tokenPaths(slot.value) })
      },
      index
    );
  }) });
}
function VerificationGate({ frame = true, fig = "Fig 1", title = "Verification gate", hint, caption = GATE_CAPTION, theme, ...machine }) {
  const pose = machine.pose ?? "idle";
  if (!frame) return /* @__PURE__ */ jsx4(GateMachine, { ...machine, theme });
  const interactive = machine.interactive ?? true;
  const shownHint = hint ?? (interactive ? HINTS[pose] : void 0);
  return /* @__PURE__ */ jsx4(MechanismFrame, { fig, title, hint: shownHint, readout: stillScene(pose).readout, caption, theme, children: /* @__PURE__ */ jsx4(GateMachine, { ...machine, bare: false }) });
}
var GATE_LIMIT = LIMIT;
export {
  AZIMUTH,
  CYCLE_LENGTH,
  Dots,
  ELEVATION,
  FaceText,
  GATE_CAPTION,
  GATE_LIMIT,
  GateMachine,
  ISO_CSS,
  LIMIT,
  Line,
  MechanismFrame,
  PASS_CHECK,
  PERIOD,
  RETURN_CHECK,
  RUN_LONG,
  SCALE,
  SHADES,
  Solid,
  VerificationGate,
  Wire,
  asksForStillness,
  axisVector,
  boxCorners,
  cameraOf,
  checkAt,
  circleIn,
  circleRing,
  coil,
  corners,
  cylinder,
  depthOf,
  dotGrid,
  dotsSvg,
  extrude,
  faceCircle,
  faceTextSvg,
  fadeLineSvg,
  fadedSvg,
  figureSvg,
  fitProjection,
  follow,
  groupSvg,
  haloOf,
  holdStill,
  insetPlan,
  iso,
  joinPaths,
  knurl,
  lineOnTop,
  lineSvg,
  onTop,
  pageHtml,
  pathOf,
  planOutline,
  plateHtml,
  pointsAt,
  prismOf,
  radialTicks,
  ring,
  ringOf,
  ringSeam,
  rise,
  roundedPlan,
  sceneAt,
  screenRise,
  segment,
  sideArc,
  sideMatrix,
  sideRing,
  sideSeam,
  sideTicks,
  slabOf,
  solidSvg,
  spring,
  stillScene,
  tallyOf,
  tallyText,
  tokenAt,
  topMatrix,
  topTicks,
  towardViewer,
  translateAlong,
  useStillness,
  verdictOf,
  verdictText,
  viewOf,
  wireSvg
};
//# sourceMappingURL=mechanism.js.map