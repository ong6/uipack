import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia; tests set `globalThis.__reduced` to flip it.
declare global {
  // eslint-disable-next-line no-var
  var __reduced: boolean;
}
globalThis.__reduced = false;
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
if (typeof window.PointerEvent === "undefined") {
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
