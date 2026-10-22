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

// A unit run fails on any console.error it did not expect: a React warning (a server-side layout
// effect, a miscased SVG element, a missing key), an act() warning or jsdom's "Not implemented"
// each mean a bug or a test that should say it expects one. A test that expects an error spies on
// console.error itself (vi.spyOn(console, "error").mockImplementation(…)), which this never sees.
// ALLOWED_ERRORS lists the expected ones that cannot be scoped to one test, each with its reason.
const ALLOWED_ERRORS: { pattern: RegExp; reason: string }[] = [];
const unexpected: string[] = [];
const reportError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const text = args.map((a) => (a instanceof Error ? (a.stack ?? a.message) : String(a))).join(" ");
  if (!ALLOWED_ERRORS.some(({ pattern }) => pattern.test(text))) unexpected.push(text.split("\n").slice(0, 4).join("\n"));
  reportError(...args);
};
afterEach(() => {
  if (!unexpected.length) return;
  const found = unexpected.splice(0);
  throw new Error(
    `Unexpected console.error (${found.length}); fix the cause, or expect it in the test:\n\n${found.join("\n\n")}`,
  );
});
