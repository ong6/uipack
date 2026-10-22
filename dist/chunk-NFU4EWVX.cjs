"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

var _chunkYMPVJRTJcjs = require('./chunk-YMPVJRTJ.cjs');

// src/CanvasView.tsx
var _react = require('react');

// src/canvas-gestures.ts

function useCanvasGestures(ref, open, zoom) {
  const latest = _react.useRef.call(void 0, zoom);
  latest.current = zoom;
  const pending = _react.useRef.call(void 0, );
  const queued = _react.useRef.call(void 0, zoom.value);
  const frame = _react.useRef.call(void 0, 0);
  _chunkYMPVJRTJcjs.useIsoLayoutEffect.call(void 0, () => {
    queued.current = zoom.value;
    const anchor = pending.current;
    if (!anchor) return;
    const rect = anchor.surface.getBoundingClientRect();
    const ratio = zoom.value / anchor.scale;
    anchor.surface.scrollLeft = anchor.x * ratio + anchor.inset.x - (anchor.point.x - rect.left);
    anchor.surface.scrollTop = anchor.y * ratio + anchor.inset.y - (anchor.point.y - rect.top);
    pending.current = void 0;
  }, [zoom.value]);
  const change = (value, point, surface) => {
    const config = latest.current;
    const next = Math.max(config.min, Math.min(config.max, value));
    if (next === queued.current) return;
    const viewport = _optionalChain([surface, 'optionalAccess', _ => _.matches, 'call', _2 => _2(".uipack__canvas")]) ? surface : void 0;
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const focal = _nullishCoalesce(point, () => ( {
        x: rect.left + viewport.clientWidth / 2,
        y: rect.top + viewport.clientHeight / 2
      }));
      const drawing = viewport.querySelector("svg").getBoundingClientRect();
      pending.current = {
        surface: viewport,
        x: focal.x - drawing.left,
        y: focal.y - drawing.top,
        point: focal,
        scale: config.value,
        inset: {
          x: drawing.left - rect.left + viewport.scrollLeft,
          y: drawing.top - rect.top + viewport.scrollTop
        }
      };
    }
    queued.current = next;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(
      () => config.onChange(queued.current)
    );
  };
  const changeRef = _react.useRef.call(void 0, change);
  changeRef.current = change;
  _react.useEffect.call(void 0, () => {
    const host = ref.current;
    if (!open || !host) return;
    let safariScale = null;
    let pinch = null;
    let suppressClickUntil = 0;
    const surfaceAt = (target) => {
      if (!(target instanceof Element) || target.closest("select, input, textarea"))
        return null;
      return target.closest(
        ".uipack__canvas, .uipack-slide-scene"
      );
    };
    const wheel = (event) => {
      const surface = surfaceAt(event.target);
      if (!event.ctrlKey || !surface) return;
      event.preventDefault();
      if (safariScale !== null || pinch) return;
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1;
      const delta = Math.max(-100, Math.min(100, event.deltaY * units));
      changeRef.current(
        queued.current * Math.exp(-delta * 8e-3),
        { x: event.clientX, y: event.clientY },
        surface
      );
    };
    const gestureStart = (raw) => {
      if (!surfaceAt(raw.target)) return;
      raw.preventDefault();
      if (!pinch) safariScale = queued.current;
    };
    const gestureChange = (raw) => {
      const surface = surfaceAt(raw.target);
      if (!surface) return;
      raw.preventDefault();
      if (safariScale === null || pinch) return;
      const event = raw;
      if (Number.isFinite(event.scale) && event.scale > 0)
        changeRef.current(
          safariScale * event.scale,
          { x: event.clientX, y: event.clientY },
          surface
        );
    };
    const gestureEnd = () => {
      safariScale = null;
    };
    const distance = (touches) => Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
    const touchStart = (event) => {
      const surface = surfaceAt(event.target);
      if (event.touches.length !== 2 || !surface) return;
      event.preventDefault();
      safariScale = null;
      suppressClickUntil = performance.now() + 400;
      pinch = {
        distance: Math.max(1, distance(event.touches)),
        scale: queued.current,
        surface
      };
    };
    const touchMove = (event) => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      suppressClickUntil = performance.now() + 400;
      changeRef.current(
        pinch.scale * distance(event.touches) / pinch.distance,
        {
          x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
          y: (event.touches[0].clientY + event.touches[1].clientY) / 2
        },
        pinch.surface
      );
    };
    const touchEnd = () => {
      if (pinch) suppressClickUntil = performance.now() + 400;
      pinch = null;
    };
    const click = (event) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    host.addEventListener("wheel", wheel, { passive: false });
    host.addEventListener("gesturestart", gestureStart, { passive: false });
    host.addEventListener("gesturechange", gestureChange, { passive: false });
    host.addEventListener("gestureend", gestureEnd);
    host.addEventListener("touchstart", touchStart, { passive: false });
    host.addEventListener("touchmove", touchMove, { passive: false });
    host.addEventListener("touchend", touchEnd);
    host.addEventListener("touchcancel", touchEnd);
    host.addEventListener("click", click, true);
    host.addEventListener("pointerup", click, true);
    return () => {
      cancelAnimationFrame(frame.current);
      pending.current = void 0;
      host.removeEventListener("wheel", wheel);
      host.removeEventListener("gesturestart", gestureStart);
      host.removeEventListener("gesturechange", gestureChange);
      host.removeEventListener("gestureend", gestureEnd);
      host.removeEventListener("touchstart", touchStart);
      host.removeEventListener("touchmove", touchMove);
      host.removeEventListener("touchend", touchEnd);
      host.removeEventListener("touchcancel", touchEnd);
      host.removeEventListener("click", click, true);
      host.removeEventListener("pointerup", click, true);
    };
  }, [open, ref]);
  return {
    step: (factor) => change(
      zoom.value * factor,
      void 0,
      _nullishCoalesce(_optionalChain([ref, 'access', _3 => _3.current, 'optionalAccess', _4 => _4.querySelector, 'call', _5 => _5(".uipack__canvas")]), () => ( void 0))
    ),
    reset: () => {
      cancelAnimationFrame(frame.current);
      pending.current = void 0;
      queued.current = 1;
      zoom.onChange(1);
      _optionalChain([ref, 'access', _6 => _6.current, 'optionalAccess', _7 => _7.querySelectorAll, 'call', _8 => _8(".uipack__canvas"), 'access', _9 => _9.forEach, 'call', _10 => _10((el) => el.scrollTo(0, 0))]);
    }
  };
}

// src/CanvasView.tsx
var _reactdom = require('react-dom');
var _jsxruntime = require('react/jsx-runtime');
var CANVAS_TOKENS = [
  "--uipack-bg",
  "--uipack-surface",
  "--uipack-fg",
  "--uipack-muted",
  "--uipack-border",
  "--uipack-accent"
];
function CanvasView({
  open,
  onClose,
  title,
  children,
  zoom,
  theme,
  restoreFocus,
  layout
}) {
  const content = _react.useRef.call(void 0, null);
  const gestures = useCanvasGestures(content, open, zoom);
  const dialog = _react.useRef.call(void 0, null);
  const actions = _react.useRef.call(void 0, gestures);
  actions.current = gestures;
  _react.useEffect.call(void 0, () => {
    if (!open) return;
    const keyboard = (event) => {
      const target = event.target;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || target.isContentEditable || target.closest("input, select, textarea"))
        return;
      if (!_optionalChain([dialog, 'access', _11 => _11.current, 'optionalAccess', _12 => _12.contains, 'call', _13 => _13(target)]) && target !== document.body) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        actions.current.step(1.25);
      }
      if (event.key === "-") {
        event.preventDefault();
        actions.current.step(0.8);
      }
      if (event.key === "0") {
        event.preventDefault();
        actions.current.reset();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => document.removeEventListener("keydown", keyboard);
  }, [open]);
  const close = _react.useRef.call(void 0, onClose);
  close.current = onClose;
  const restore = _react.useRef.call(void 0, restoreFocus);
  restore.current = restoreFocus;
  _react.useEffect.call(void 0, () => {
    if (!open) return;
    const opener = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    _optionalChain([dialog, 'access', _14 => _14.current, 'optionalAccess', _15 => _15.showModal, 'call', _16 => _16()]);
    return () => {
      document.body.style.overflow = previous;
      requestAnimationFrame(() => restore.current ? restore.current() : _optionalChain([opener, 'optionalAccess', _17 => _17.focus, 'call', _18 => _18()]));
    };
  }, [open]);
  _react.useEffect.call(void 0, () => {
    const node = dialog.current;
    if (!open || !node) return;
    const source = node.querySelector(".uipack");
    if (!source) return;
    const style = getComputedStyle(source);
    for (const name of CANVAS_TOKENS) {
      const value = style.getPropertyValue(name).trim();
      if (value) node.style.setProperty(name, value);
      else node.style.removeProperty(name);
    }
  }, [open, theme]);
  if (!open || typeof document === "undefined") return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children });
  return _reactdom.createPortal.call(void 0, 
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      "dialog",
      {
        ref: dialog,
        className: "uipack-canvas-dialog",
        "data-theme": _nullishCoalesce(theme, () => ( document.documentElement.dataset.theme)),
        "aria-label": title,
        onCancel: (e) => {
          e.preventDefault();
          close.current();
        },
        children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-canvas-toolbar", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "strong", { children: title }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                "button",
                {
                  type: "button",
                  "aria-label": "Zoom out",
                  title: "Zoom out (\u2212)",
                  disabled: zoom.value <= zoom.min,
                  onClick: () => gestures.step(0.8),
                  children: "\u2212"
                }
              ),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                "span",
                {
                  role: "meter",
                  "aria-label": "Zoom level",
                  "aria-valuemin": zoom.min * 100,
                  "aria-valuemax": zoom.max * 100,
                  "aria-valuenow": Math.round(zoom.value * 100),
                  "aria-valuetext": `${Math.round(zoom.value * 100)}%`,
                  children: [
                    Math.round(zoom.value * 100),
                    "%"
                  ]
                }
              ),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                "button",
                {
                  type: "button",
                  "aria-label": "Zoom in",
                  title: "Zoom in (+)",
                  disabled: zoom.value >= zoom.max,
                  onClick: () => gestures.step(1.25),
                  children: "+"
                }
              ),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "button", { type: "button", title: "Reset view (0)", onClick: gestures.reset, children: "Fit" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "button", { type: "button", onClick: onClose, autoFocus: true, children: "Close canvas" })
            ] })
          ] }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "uipack-canvas-hint", children: "Pinch to zoom \xB7 Two-finger scroll \xB7 + / \u2212 to zoom \xB7 0 to reset" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "div",
            {
              ref: content,
              className: `uipack-canvas-content${layout ? ` uipack-canvas-content--${layout}` : ""}`,
              children
            }
          )
        ]
      }
    ),
    document.body
  );
}



exports.CanvasView = CanvasView;
