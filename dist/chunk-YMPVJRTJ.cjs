"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/env.ts
var _react = require('react');
var useIsoLayoutEffect = typeof window === "undefined" ? _react.useEffect : _react.useLayoutEffect;
var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function prefersReducedMotion(win = typeof window === "undefined" ? void 0 : window) {
  return typeof _optionalChain([win, 'optionalAccess', _ => _.matchMedia]) === "function" && win.matchMedia(REDUCED_MOTION_QUERY).matches;
}
function onReducedMotionChange(listener) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {
  };
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  const changed = () => listener(query.matches);
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", changed);
    return () => query.removeEventListener("change", changed);
  }
  query.addListener(changed);
  return () => query.removeListener(changed);
}
function usePrefersReducedMotion() {
  return _react.useSyncExternalStore.call(void 0, onReducedMotionChange, prefersReducedMotion, serverSnapshot);
}
var serverSnapshot = () => false;
function keepFocusedInView(event) {
  _optionalChain([event, 'access', _2 => _2.target, 'optionalAccess', _3 => _3.scrollIntoView, 'optionalCall', _4 => _4({ block: "nearest", inline: "nearest" })]);
}







exports.useIsoLayoutEffect = useIsoLayoutEffect; exports.prefersReducedMotion = prefersReducedMotion; exports.onReducedMotionChange = onReducedMotionChange; exports.usePrefersReducedMotion = usePrefersReducedMotion; exports.keepFocusedInView = keepFocusedInView;
