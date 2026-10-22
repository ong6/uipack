// src/math.ts
var clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
var progress = (value, start, end) => clamp((value - start) / (end - start));
var lerp = (a, b, t) => a + (b - a) * t;
var smoothstep = (edge0, edge1, x) => {
  const t = progress(x, edge0, edge1);
  return t * t * (3 - 2 * t);
};
var smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10);
var easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
var easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function easeOutExpo(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(2, -10 * t);
}
var lerpRect = (a, b, t) => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t)
});
function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (t) => ((ax * t + bx) * t + cx) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (time) => {
    let t = time;
    for (let i = 0; i < 8; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t = clamp(t - (x(t) - time) / d);
    }
    return ((ay * t + by) * t + cy) * t;
  };
}

export { clamp, cubicBezier, easeInOutCubic, easeOutCubic, easeOutExpo, lerp, lerpRect, progress, smootherstep, smoothstep };
