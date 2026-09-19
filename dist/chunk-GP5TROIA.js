// src/CanvasView.tsx
import { useEffect as useEffect2, useRef as useRef2 } from "react";

// src/canvas-gestures.ts
import { useEffect, useLayoutEffect, useRef } from "react";
var useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
function useCanvasGestures(ref, open, zoom) {
  const latest = useRef(zoom);
  latest.current = zoom;
  const pending = useRef();
  const queued = useRef(zoom.value);
  const frame = useRef(0);
  useBrowserLayoutEffect(() => {
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
    const viewport = surface?.matches(".uipack__canvas") ? surface : void 0;
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const focal = point ?? {
        x: rect.left + viewport.clientWidth / 2,
        y: rect.top + viewport.clientHeight / 2
      };
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
  const changeRef = useRef(change);
  changeRef.current = change;
  useEffect(() => {
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
      ref.current?.querySelector(".uipack__canvas") ?? void 0
    ),
    reset: () => {
      cancelAnimationFrame(frame.current);
      pending.current = void 0;
      queued.current = 1;
      zoom.onChange(1);
      ref.current?.querySelectorAll(".uipack__canvas").forEach((el) => el.scrollTo(0, 0));
    }
  };
}

// src/CanvasView.tsx
import { createPortal } from "react-dom";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function CanvasView({
  open,
  onClose,
  title,
  children,
  zoom,
  theme,
  restoreFocus
}) {
  const content = useRef2(null);
  const gestures = useCanvasGestures(content, open, zoom);
  const dialog = useRef2(null);
  const actions = useRef2(gestures);
  actions.current = gestures;
  useEffect2(() => {
    if (!open) return;
    const keyboard = (event) => {
      const target = event.target;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || target.isContentEditable || target.closest("input, select, textarea"))
        return;
      if (!dialog.current?.contains(target) && target !== document.body) return;
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
  const close = useRef2(onClose);
  close.current = onClose;
  useEffect2(() => {
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
  if (!open || typeof document === "undefined") return /* @__PURE__ */ jsx(Fragment, { children });
  return createPortal(
    /* @__PURE__ */ jsxs(
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
          /* @__PURE__ */ jsxs("div", { className: "uipack-canvas-toolbar", children: [
            /* @__PURE__ */ jsx("strong", { children: title }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(
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
              /* @__PURE__ */ jsxs(
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
              /* @__PURE__ */ jsx(
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
              /* @__PURE__ */ jsx("button", { type: "button", title: "Reset view (0)", onClick: gestures.reset, children: "Fit" }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, autoFocus: true, children: "Close canvas" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "uipack-canvas-hint", children: "Pinch to zoom \xB7 Two-finger scroll \xB7 + / \u2212 to zoom \xB7 0 to reset" }),
          /* @__PURE__ */ jsx("div", { ref: content, className: "uipack-canvas-content", children })
        ]
      }
    ),
    document.body
  );
}

export {
  CanvasView
};
//# sourceMappingURL=chunk-GP5TROIA.js.map