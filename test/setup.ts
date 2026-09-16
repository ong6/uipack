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
