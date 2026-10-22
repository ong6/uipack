import { render } from "@testing-library/react";
import {
  SMOOTH_SCROLL_ATTR,
  SmoothScroll,
  WHEEL_LINE_PX,
  createSmoothScroll,
  easeOutExpo,
  followRate,
  followStep,
  normalizeWheel,
} from "../src/web";

describe("smooth scroll easing", () => {
  it("closes the lerp share of the gap per 1/60 s", () => {
    const rate = followRate(0.1);
    expect(followStep(0, 1000, rate, 1 / 60)).toBeCloseTo(100, 6);
    expect(followStep(1000, 0, rate, 1 / 60)).toBeCloseTo(900, 6);
  });

  it("lands in the same place at 30, 60, 120 and 144 Hz", () => {
    const rate = followRate(0.1);
    const after = (hz: number, seconds: number) => {
      let y = 0;
      for (let i = 0; i < Math.round(hz * seconds); i++) y = followStep(y, 1000, rate, 1 / hz);
      return y;
    };
    const ref = followStep(0, 1000, rate, 0.5);
    for (const hz of [30, 60, 120, 144]) expect(after(hz, 0.5)).toBeCloseTo(ref, 6);
  });

  it("never overshoots, ignores negative time and settles within about a second", () => {
    const rate = followRate(0.1);
    let y = 0;
    let frames = 0;
    while (Math.abs(1000 - y) >= 0.5) {
      const next = followStep(y, 1000, rate, 1 / 60);
      expect(next).toBeGreaterThan(y);
      expect(next).toBeLessThanOrEqual(1000);
      y = next;
      frames++;
    }
    expect(frames / 60).toBeGreaterThan(0.5);
    expect(frames / 60).toBeLessThan(1.3);
    expect(followStep(10, 50, rate, -1)).toBe(10);
    // A softer lerp takes longer; the rate is clamped to sane values.
    expect(followRate(0.05)).toBeLessThan(followRate(0.1));
    expect(Number.isFinite(followRate(1))).toBe(true);
  });

  it("eases fixed-duration scrolls out exponentially", () => {
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(1)).toBe(1);
    expect(easeOutExpo(-1)).toBe(0);
    expect(easeOutExpo(0.5)).toBeGreaterThan(0.9);
    let prev = 0;
    for (let t = 0.05; t <= 1; t += 0.05) {
      expect(easeOutExpo(t)).toBeGreaterThanOrEqual(prev);
      prev = easeOutExpo(t);
    }
  });
});

describe("wheel normalisation", () => {
  const viewport = { width: 1200, height: 800 };
  it("passes pixel deltas through (Chrome, Safari, trackpads)", () => {
    expect(normalizeWheel({ deltaX: 3, deltaY: -120, deltaMode: 0 }, viewport)).toEqual({ x: 3, y: -120 });
  });
  it("turns lines into pixels (Firefox mouse wheels)", () => {
    expect(normalizeWheel({ deltaX: 0, deltaY: 3, deltaMode: 1 }, viewport)).toEqual({ x: 0, y: 3 * WHEEL_LINE_PX });
    expect(normalizeWheel({ deltaX: -1, deltaY: -3, deltaMode: 1 }, viewport)).toEqual({ x: -WHEEL_LINE_PX, y: -3 * WHEEL_LINE_PX });
  });
  it("turns pages into the viewport less the Page Down overlap", () => {
    expect(normalizeWheel({ deltaX: 1, deltaY: 1, deltaMode: 2 }, viewport)).toEqual({ x: 1050, y: 700 });
    expect(normalizeWheel({ deltaX: 0, deltaY: -1, deltaMode: 2 }, viewport).y).toBe(-700);
  });
});

describe("createSmoothScroll", () => {
  const root = document.documentElement;
  const original = window.matchMedia;
  let frames: FrameRequestCallback[] = [];
  let now = 0;
  const flush = (ms = 16) => {
    now += ms;
    const run = frames;
    frames = [];
    run.forEach((cb) => cb(now));
  };
  const media = (fine: boolean, reduced: boolean) =>
    ((q: string) => ({
      matches: q.includes("reduced-motion") ? reduced : q.includes("pointer: fine") ? fine : false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    })) as unknown as typeof window.matchMedia;
  const wheel = (target: EventTarget, init: WheelEventInit) => {
    const e = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(e);
    return e;
  };

  beforeEach(() => {
    frames = [];
    now = 0;
    Object.defineProperty(root, "scrollHeight", { configurable: true, value: 5000 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal("cancelAnimationFrame", () => {
      frames = [];
    });
    window.scrollTo = ((x: number | ScrollToOptions, y?: number) => {
      (window as { scrollY: number }).scrollY = typeof x === "number" ? (y ?? 0) : (x.top ?? 0);
    }) as typeof window.scrollTo;
  });
  afterEach(() => {
    window.matchMedia = original;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("eases a wheel over several frames to the target, then stops", () => {
    window.matchMedia = media(true, false);
    const c = createSmoothScroll();
    expect(c.enabled).toBe(true);
    expect(root.hasAttribute(SMOOTH_SCROLL_ATTR)).toBe(true);
    expect(root.style.scrollBehavior).toBe("auto");
    expect(wheel(document.body, { deltaY: 400 }).defaultPrevented).toBe(true);
    const seen: number[] = [];
    for (let i = 0; i < 200 && frames.length; i++) {
      flush();
      seen.push(window.scrollY);
    }
    expect(seen.length).toBeGreaterThan(10);
    expect(seen[0]).toBeGreaterThan(0);
    expect(seen[0]).toBeLessThan(100);
    expect(seen.at(-1)).toBe(400);
    expect(frames).toHaveLength(0);
    c.destroy();
    expect(root.hasAttribute(SMOOTH_SCROLL_ATTR)).toBe(false);
    expect(root.style.scrollBehavior).toBe("");
  });

  it("leaves zoom, horizontal wheels and nested scrollers to the browser", () => {
    window.matchMedia = media(true, false);
    const c = createSmoothScroll();
    expect(wheel(document.body, { deltaY: 100, ctrlKey: true }).defaultPrevented).toBe(false);
    expect(wheel(document.body, { deltaX: 120, deltaY: 10 }).defaultPrevented).toBe(false);
    const box = document.createElement("div");
    box.style.overflowY = "auto";
    Object.defineProperty(box, "scrollHeight", { value: 900 });
    Object.defineProperty(box, "clientHeight", { value: 300 });
    const inner = document.createElement("p");
    box.append(inner);
    document.body.append(box);
    expect(wheel(inner, { deltaY: 100 }).defaultPrevented).toBe(false);
    const opted = document.createElement("div");
    opted.setAttribute("data-smooth-scroll-prevent", "");
    document.body.append(opted);
    expect(wheel(opted, { deltaY: 100 }).defaultPrevented).toBe(false);
    box.remove();
    opted.remove();
    c.destroy();
  });

  it("stays native on touch and under reduced motion, and scrollTo falls back", () => {
    for (const [fine, reduced] of [
      [false, false],
      [true, true],
    ]) {
      window.matchMedia = media(fine, reduced);
      const c = createSmoothScroll();
      expect(c.enabled).toBe(false);
      expect(root.hasAttribute(SMOOTH_SCROLL_ATTR)).toBe(false);
      expect(wheel(document.body, { deltaY: 100 }).defaultPrevented).toBe(false);
      c.scrollTo(250);
      expect(window.scrollY).toBe(250);
      c.destroy();
    }
  });

  it("scrollTo honours offset, duration and immediate", () => {
    window.matchMedia = media(true, false);
    const c = createSmoothScroll();
    c.scrollTo(1000, { offset: 80, duration: 400 });
    let steps = 0;
    while (frames.length && steps < 100) {
      flush();
      steps++;
    }
    expect(window.scrollY).toBe(920);
    expect(steps).toBeGreaterThanOrEqual(20);
    expect(steps).toBeLessThanOrEqual(30);
    c.scrollTo(10, { immediate: true });
    expect(window.scrollY).toBe(10);
    expect(frames).toHaveLength(0);
    // Past the end clamps to the last scrollable pixel.
    c.scrollTo(99999, { immediate: true });
    expect(window.scrollY).toBe(4200);
    c.destroy();
  });

  it("a scroll key or a dragged scrollbar stops the easing; a one-off anchoring shift is carried", () => {
    window.matchMedia = media(true, false);
    const c = createSmoothScroll();
    const external = (y: number) => {
      (window as { scrollY: number }).scrollY = y;
      window.dispatchEvent(new Event("scroll"));
    };
    // Scroll key, then a scroll the controller did not make: the reader wins at once.
    wheel(document.body, { deltaY: 600 });
    flush();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown" }));
    external(3000);
    expect(frames).toHaveLength(0);
    // Three frames running of outside scrolling (a scrollbar drag) also stop it.
    now += 1000;
    wheel(document.body, { deltaY: 600 });
    flush();
    for (const y of [3300, 3400, 3500]) {
      external(y);
      flush();
    }
    expect(frames).toHaveLength(0);
    expect(window.scrollY).toBe(3500);
    // One shift (content above resized, scroll anchoring) carries the target with it.
    external(0);
    wheel(document.body, { deltaY: 600 });
    flush();
    const at = window.scrollY;
    external(at + 120);
    while (frames.length) flush();
    expect(window.scrollY).toBe(720);
    c.destroy();
  });

  it("anchor links land below the offset, update the hash without a jump and move focus, eased or not", () => {
    const section = document.createElement("section");
    section.id = "pricing";
    section.style.scrollMarginTop = "80px";
    section.getBoundingClientRect = () => ({ top: 2000 - window.scrollY }) as DOMRect;
    const link = document.createElement("a");
    link.href = "#pricing";
    document.body.append(section, link);
    for (const [fine, reduced] of [
      [true, false],
      [true, true],
    ]) {
      (window as { scrollY: number }).scrollY = 0;
      history.replaceState(null, "", "/web");
      window.matchMedia = media(fine, reduced);
      const c = createSmoothScroll();
      const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
      link.dispatchEvent(click);
      expect(click.defaultPrevented).toBe(true);
      expect(location.hash).toBe("#pricing");
      expect(document.activeElement).toBe(section);
      expect(section.getAttribute("tabindex")).toBe("-1");
      if (reduced) expect(window.scrollY).toBe(1920);
      else {
        expect(window.scrollY).toBe(0);
        while (frames.length) flush();
        expect(window.scrollY).toBe(1920);
      }
      section.blur();
      expect(section.hasAttribute("tabindex")).toBe(false);
      c.destroy();
    }
    section.remove();
    link.remove();
  });

  it("re-measures an element target, so content resizing above it does not make it land short", () => {
    window.matchMedia = media(true, false);
    let docTop = 2000;
    const section = document.createElement("section");
    section.getBoundingClientRect = () => ({ top: docTop - window.scrollY }) as DOMRect;
    document.body.append(section);
    const c = createSmoothScroll();
    c.scrollTo(section, { offset: 80 });
    for (let i = 0; i < 5; i++) flush();
    docTop = 2300; // a demo above grew by 300px mid-scroll
    while (frames.length) flush();
    expect(window.scrollY).toBe(2220);
    section.remove();
    c.destroy();
  });

  it("mounts as a component and cleans up on unmount", () => {
    window.matchMedia = media(true, false);
    const { unmount } = render(<SmoothScroll />);
    expect(root.hasAttribute(SMOOTH_SCROLL_ATTR)).toBe(true);
    unmount();
    expect(root.hasAttribute(SMOOTH_SCROLL_ATTR)).toBe(false);
    expect(wheel(document.body, { deltaY: 100 }).defaultPrevented).toBe(false);
  });
});
