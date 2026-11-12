/**
 * Back and Forward return the reader to where they were (docs/specs/docs-site.md, "Back and
 * Forward"). Every page is a full load whose content mounts after the browser has tried to restore
 * the scroll position: the document is still one screen tall then, so the browser gives up at the
 * top. So the site keeps each history entry's position itself (sessionStorage, written as the page
 * is left) and, on a back or forward load, scrolls there as soon as the document is tall enough,
 * then holds it while what is above settles (lazy parts, faces, images), until the reader scrolls,
 * taps or types. A fresh navigation is untouched: it starts at the top, or on its #fragment.
 * `history.scrollRestoration` stays `auto`, so Back between two #fragments of one page is still the
 * browser's.
 */
const STORE = "uipack-scroll";
/** How many entries are kept: the visit's latest. */
const KEPT = 50;
/** What tells the reader has taken over: the restore stops there. */
export const READER_INPUT = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
/** How long the restore waits for the document to grow tall enough, in ms. */
const DEADLINE = 5000;
/** How long the position is held once reached, while content above it settles, in ms. */
const HOLD = 2000;
/** A document this long unchanged, still too short, is scrolled as far as it goes, so the lazy parts below mount. */
const STALL = 400;

/** What is kept for a history entry: the scroll position, and the lazy parts that had mounted. */
interface Place {
  y: number;
  parts: string[];
}
type Places = Record<string, Place>;

/** This history entry's key: the Navigation API's, which tells two visits to one address apart, else the address. */
function entryKey(): string {
  const nav = (window as { navigation?: { currentEntry?: { key?: string } | null } }).navigation;
  return nav?.currentEntry?.key ?? location.pathname + location.search + location.hash;
}

function read(): Places {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(STORE) ?? "{}");
    return value && typeof value === "object" ? (value as Places) : {};
  } catch {
    return {};
  }
}

function write(key: string, place: Place) {
  try {
    const all = read();
    // Latest last, so the oldest entries are the ones dropped.
    delete all[key];
    all[key] = place;
    const keys = Object.keys(all);
    for (const old of keys.slice(0, Math.max(0, keys.length - KEPT))) delete all[old];
    sessionStorage.setItem(STORE, JSON.stringify(all));
  } catch {
    /* no storage: Back opens the page at its top, as before */
  }
}

/** Whether this load is a back or forward one (not a link, an address typed, or a reload). */
function cameBack() {
  const entry = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type === "back_forward";
}

// The position being restored, until it is reached and held or the reader takes over.
let target: number | null = null;
// The lazy parts mounted on this page, and those that were when the reader left the entry being restored.
const mounted = new Set<string>();
let left: ReadonlySet<string> = new Set();

/**
 * For a part that mounts only near the viewport and is taller mounted (`name` is unique on its
 * page): `partMounted` says it has mounted, and `partWasMounted` whether it had when the reader
 * left the page this back or forward load returns to. Such a part mounts at once on the way back,
 * so the page above the reader's place is as tall as it was and the position is the same place.
 */
export const partMounted = (name: string) => void mounted.add(name);
export const partWasMounted = (name: string) => left.has(name);

/**
 * Starts keeping this page's scroll position, and, on a back or forward load with one kept,
 * restores it. Returns whether it is restoring: the page's #fragment is then not opened (the
 * reader's own position wins, as in a browser). Call once, before the page renders.
 */
export function keepScrollPosition(): boolean {
  if (typeof window === "undefined") return false;
  const saved = cameBack() ? read()[entryKey()] : undefined;
  if (saved && Array.isArray(saved.parts)) left = new Set(saved.parts);
  target = saved && typeof saved.y === "number" && saved.y > 0 ? saved.y : null;
  // Leaving before the restore has finished keeps the position it was making for.
  const save = () => write(entryKey(), { y: Math.round(target ?? scrollY), parts: [...mounted] });
  addEventListener("pagehide", save);
  // A phone can drop a hidden page without `pagehide`.
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && save());
  if (target === null) return false;

  const y = target;
  const root = document.documentElement;
  const start = performance.now();
  let reached = 0;
  let height = 0;
  let changed = start;
  let frame = 0;
  const finish = () => {
    target = null;
    cancelAnimationFrame(frame);
    resized?.disconnect();
    for (const type of READER_INPUT) removeEventListener(type, finish, true);
  };
  const attempt = () => {
    if (target === null) return;
    const now = performance.now();
    if (root.scrollHeight !== height) {
      height = root.scrollHeight;
      changed = now;
    }
    const fits = height - innerHeight >= y - 1;
    if (fits && !reached) reached = now;
    const late = now - start > DEADLINE;
    // Still too short with nothing loading and nothing growing: go as far as there is, so the
    // parts that mount near the viewport do, and carry on from there.
    const stalled = now - changed > STALL && !document.querySelector(".showcase-loading");
    if ((reached || stalled || late) && Math.abs(scrollY - y) > 1) scrollTo({ top: y, behavior: "instant" });
    if (reached ? now - reached > HOLD : late) finish();
  };
  // Growth is seen as it is laid out (before that frame is painted), and each frame besides.
  const resized = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(attempt);
  resized?.observe(root);
  if (document.body) resized?.observe(document.body);
  const tick = () => {
    attempt();
    if (target !== null) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  for (const type of READER_INPUT) addEventListener(type, finish, { capture: true, passive: true });
  return true;
}
