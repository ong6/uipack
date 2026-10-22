'use strict';

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

exports.clamp = clamp;
exports.easeInOutCubic = easeInOutCubic;
exports.easeOutCubic = easeOutCubic;
exports.easeOutExpo = easeOutExpo;
exports.lerp = lerp;
exports.progress = progress;
exports.smootherstep = smootherstep;
exports.smoothstep = smoothstep;
