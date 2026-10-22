import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia; tests set `globalThis.__reduced` to flip it.
declare global {
  var __reduced: boolean;
}
globalThis.__reduced = false;
// Tests marked `@vitest-environment node` (the server path) have no window to patch.
const browser = typeof window !== "undefined";
if (browser)
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (q: string) => ({
      matches: q.includes("reduced-motion") && globalThis.__reduced,
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });

// jsdom has no PointerEvent, so `pointerType` never reached the handlers and
// the touch guard was untestable. A minimal constructor carries it through.
if (browser && typeof window.PointerEvent === "undefined") {
  class PointerEvent extends MouseEvent {
    pointerType: string;
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? "";
      this.pointerId = init.pointerId ?? 1;
    }
  }
  Object.defineProperty(window, "PointerEvent", { writable: true, value: PointerEvent });
}
