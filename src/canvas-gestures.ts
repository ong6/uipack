import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export interface CanvasZoom {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
type Point = { x: number; y: number };
type GestureEvent = Event & { scale: number; clientX: number; clientY: number };

/** Native input adapter shared by SVG sizing and real 3D camera zoom. */
export function useCanvasGestures(
  ref: RefObject<HTMLDivElement>,
  open: boolean,
  zoom: CanvasZoom,
) {
  const latest = useRef(zoom);
  latest.current = zoom;
  const pending = useRef<{
    surface: HTMLElement;
    x: number;
    y: number;
    point: Point;
    scale: number;
    inset: Point;
  }>();
  const queued = useRef(zoom.value);
  const frame = useRef(0);

  useBrowserLayoutEffect(() => {
    queued.current = zoom.value;
    const anchor = pending.current;
    if (!anchor) return;
    const rect = anchor.surface.getBoundingClientRect();
    const ratio = zoom.value / anchor.scale;
    anchor.surface.scrollLeft =
      anchor.x * ratio + anchor.inset.x - (anchor.point.x - rect.left);
    anchor.surface.scrollTop =
      anchor.y * ratio + anchor.inset.y - (anchor.point.y - rect.top);
    pending.current = undefined;
  }, [zoom.value]);

  const change = (value: number, point?: Point, surface?: HTMLElement) => {
    const config = latest.current;
    const next = Math.max(config.min, Math.min(config.max, value));
    if (next === queued.current) return;
    // The SVG scroll viewport stays fixed while its drawing grows. Capture the
    // actual DOM scale once per frame, including multiple coalesced wheel events.
    const viewport = surface?.matches(".uipack__canvas") ? surface : undefined;
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const focal = point ?? {
        x: rect.left + viewport.clientWidth / 2,
        y: rect.top + viewport.clientHeight / 2,
      };
      const drawing = viewport.querySelector("svg")!.getBoundingClientRect();
      pending.current = {
        surface: viewport,
        x: focal.x - drawing.left,
        y: focal.y - drawing.top,
        point: focal,
        scale: config.value,
        inset: {
          x: drawing.left - rect.left + viewport.scrollLeft,
          y: drawing.top - rect.top + viewport.scrollTop,
        },
      };
    }
    queued.current = next;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() =>
      config.onChange(queued.current),
    );
  };
  const changeRef = useRef(change);
  changeRef.current = change;

  useEffect(() => {
    const host = ref.current;
    if (!open || !host) return;
    let safariScale: number | null = null;
    let pinch: {
      distance: number;
      scale: number;
      surface: HTMLElement;
    } | null = null;
    let suppressClickUntil = 0;
    const surfaceAt = (target: EventTarget | null) => {
      if (
        !(target instanceof Element) ||
        target.closest("select, input, textarea")
      )
        return null;
      return target.closest<HTMLElement>(
        ".uipack__canvas, .uipack-slide-scene",
      );
    };
    const wheel = (event: WheelEvent) => {
      const surface = surfaceAt(event.target);
      if (!event.ctrlKey || !surface) return; // Two-finger scroll remains native.
      event.preventDefault();
      if (safariScale !== null || pinch) return;
      const units =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? host.clientHeight
            : 1;
      const delta = Math.max(-100, Math.min(100, event.deltaY * units));
      changeRef.current(
        queued.current * Math.exp(-delta * 0.008),
        { x: event.clientX, y: event.clientY },
        surface,
      );
    };
    const gestureStart = (raw: Event) => {
      if (!surfaceAt(raw.target)) return;
      raw.preventDefault();
      if (!pinch) safariScale = queued.current;
    };
    const gestureChange = (raw: Event) => {
      const surface = surfaceAt(raw.target);
      if (!surface) return;
      raw.preventDefault();
      if (safariScale === null || pinch) return;
      const event = raw as GestureEvent;
      if (Number.isFinite(event.scale) && event.scale > 0)
        changeRef.current(
          safariScale * event.scale,
          { x: event.clientX, y: event.clientY },
          surface,
        );
    };
    const gestureEnd = () => {
      safariScale = null;
    };
    const distance = (touches: TouchList) =>
      Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
      );
    const touchStart = (event: TouchEvent) => {
      const surface = surfaceAt(event.target);
      if (event.touches.length !== 2 || !surface) return;
      event.preventDefault();
      safariScale = null;
      suppressClickUntil = performance.now() + 400;
      pinch = {
        distance: Math.max(1, distance(event.touches)),
        scale: queued.current,
        surface,
      };
    };
    const touchMove = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      suppressClickUntil = performance.now() + 400;
      changeRef.current(
        (pinch.scale * distance(event.touches)) / pinch.distance,
        {
          x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
          y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
        },
        pinch.surface,
      );
    };
    const touchEnd = () => {
      if (pinch) suppressClickUntil = performance.now() + 400;
      pinch = null;
    };
    const click = (event: MouseEvent) => {
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
      pending.current = undefined;
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
    step: (factor: number) =>
      change(
        zoom.value * factor,
        undefined,
        ref.current?.querySelector<HTMLElement>(".uipack__canvas") ?? undefined,
      ),
    reset: () => {
      cancelAnimationFrame(frame.current);
      pending.current = undefined;
      queued.current = 1;
      zoom.onChange(1);
      ref.current
        ?.querySelectorAll(".uipack__canvas")
        .forEach((el) => el.scrollTo(0, 0));
    },
  };
}
