// src/zoom-math.ts
var easeInOutCubic = (p) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
var smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function zoomFrame(target, width, height) {
  const Z = Math.min(width / target.w, height / target.h);
  if (!Number.isFinite(Z) || Z < 1.05) return null;
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  return {
    Z,
    fx: (cx * Z - width / 2) / (Z - 1),
    fy: (cy * Z - height / 2) / (Z - 1)
  };
}
function innerClipStart(target, frame, width, height) {
  const map = (v, f) => (v - f) * frame.Z + f;
  const left = map(target.x, frame.fx);
  const top = map(target.y, frame.fy);
  const right = width - map(target.x + target.w, frame.fx);
  const bottom = height - map(target.y + target.h, frame.fy);
  return { top, right, bottom, left };
}
function zoomSamples(target, forward, width, height, { samples = 24, radius = 6 } = {}) {
  const frame = zoomFrame(target, width, height);
  if (!frame) return null;
  const start = innerClipStart(target, frame, width, height);
  const radiusStart = radius * frame.Z;
  const out = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = easeInOutCubic(forward ? t : 1 - t);
    const clipT = smoothstep(0.15, 0.85, p);
    const inset = (v) => (v * (1 - clipT)).toFixed(2);
    out.push({
      offset: t,
      p,
      outer: `scale(${Math.pow(frame.Z, p).toFixed(5)})`,
      inner: `scale(${Math.pow(frame.Z, p - 1).toFixed(5)})`,
      clip: `inset(${inset(start.top)}px ${inset(start.right)}px ${inset(start.bottom)}px ${inset(start.left)}px round ${(radiusStart * (1 - clipT)).toFixed(2)}px)`,
      innerOpacity: smoothstep(0.08, 0.4, p)
    });
  }
  return out;
}

export {
  easeInOutCubic,
  smoothstep,
  zoomFrame,
  innerClipStart,
  zoomSamples
};
//# sourceMappingURL=chunk-QVG5ZQTT.js.map