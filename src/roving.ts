import { useEffect, type RefObject } from "react";

/** A part of a drawing that takes keyboard focus: a selectable node, a drill node, a node link. */
const ITEM = 'a[href], [role="button"]';
/** One drawing: a Figure's wide or narrow SVG, or a DrillFigure level's. */
const DRAWING = 'svg[role="group"]';

const itemsOf = (drawing: Element) =>
  Array.from(drawing.querySelectorAll<HTMLElement | SVGElement>(ITEM)).filter((el) => el.closest(DRAWING) === drawing);

const shown = (el: Element) => el.getClientRects().length > 0;

function setTabIndex(el: Element, value: "0" | "-1") {
  // Only on a change: an unchanged write would still queue a mutation, and the observer would loop.
  if (el.getAttribute("tabindex") !== value) el.setAttribute("tabindex", value);
}

/**
 * Roving tabindex for the drawings inside `ref`: each drawing is one Tab stop, however many parts
 * it has. The stop is the part last focused, else the selected part, else the first. Inside a
 * drawing the arrow keys move between parts in document order (Right and Down forward, Left and
 * Up back), Home and End go to the first and last, and Enter or Space still activates a part.
 * Parts that mount later (a drill level, a re-render) join on the next mutation. Pass `key` to
 * rebind when the drawings move to a new element (the figure opened in its canvas).
 */
export function useRovingFocus(ref: RefObject<HTMLElement | null>, key?: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof MutationObserver === "undefined") return;
    const stops = new WeakMap<Element, Element>();

    const settle = (drawing: Element, focused?: Element) => {
      const items = itemsOf(drawing);
      if (!items.length) return;
      const remembered = focused ?? stops.get(drawing);
      const stop =
        (remembered && items.includes(remembered as HTMLElement) ? remembered : null) ??
        items.find((el) => el.getAttribute("aria-pressed") === "true") ??
        items[0];
      stops.set(drawing, stop);
      for (const el of items) setTabIndex(el, el === stop ? "0" : "-1");
    };
    const settleAll = () => root.querySelectorAll(DRAWING).forEach((d) => settle(d));

    const itemAt = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null;
      const drawing = el?.matches(ITEM) ? el.closest(DRAWING) : null;
      return drawing && root.contains(drawing) ? { el: el!, drawing } : null;
    };

    const onFocusIn = (e: FocusEvent) => {
      const at = itemAt(e.target);
      if (at) settle(at.drawing, at.el);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const at = itemAt(e.target);
      if (!at) return;
      const items = itemsOf(at.drawing).filter(shown);
      const i = items.indexOf(at.el as HTMLElement);
      let next: Element | undefined;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          next = items[i + 1];
          break;
        case "ArrowLeft":
        case "ArrowUp":
          next = items[i - 1];
          break;
        case "Home":
          next = items[0];
          break;
        case "End":
          next = items[items.length - 1];
          break;
        default:
          return;
      }
      // Handled at the ends too, so an arrow never scrolls the page or turns a deck's slide instead.
      e.preventDefault();
      if (!next || next === at.el) return;
      settle(at.drawing, next);
      (next as HTMLElement).focus();
    };

    // Coalesce a render's mutations into one pass.
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        settleAll();
      });
    });
    settleAll();
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["tabindex", "role", "href"] });
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("keydown", onKeyDown);
    return () => {
      observer.disconnect();
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, key]);
}
