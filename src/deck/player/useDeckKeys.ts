// The deck's keyboard and touch input: arrow keys, Space, Home/End and the G/F/S shortcuts, on the
// deck or (keyboard="global") anywhere on the page, and a horizontal swipe on the stage.
import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { useLatest } from "../../env";

export interface DeckKeyActions {
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  overview: () => void;
  fullscreen: () => void;
  /** Open the speaker view; absent in the speaker view itself. */
  presenter?: () => void;
}

export interface DeckKeyOptions {
  rootRef: RefObject<HTMLElement | null>;
  /** `focus`: keys work while the deck has focus. `global`: anywhere on the page. */
  keyboard: "focus" | "global";
  /** False while a view that owns the keys is open (the overview, the read view). */
  enabled: boolean;
  actions: DeckKeyActions;
}

/** Returns the root's keydown handler, and listens on the window too when the keys are global. */
export function useDeckKeys({ rootRef, keyboard, enabled, actions }: DeckKeyOptions) {
  const onKeyDown = (e: KeyboardEvent | ReactKeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !enabled) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest?.('input, textarea, select, [contenteditable="true"], [contenteditable=""], [data-deck-keys="own"]')) return;
    const onControl = Boolean(t?.closest?.("button, a, summary")) && t !== rootRef.current;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        actions.next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        actions.prev();
        break;
      case " ":
      case "Enter":
        // Space and Enter on a button press the button.
        if (onControl) return;
        if (e.shiftKey) actions.prev();
        else actions.next();
        break;
      case "Home":
        actions.first();
        break;
      case "End":
        actions.last();
        break;
      case "g":
      case "G":
      case "o":
        actions.overview();
        break;
      case "f":
      case "F":
        actions.fullscreen();
        break;
      case "s":
      case "S":
        if (!actions.presenter) return;
        actions.presenter();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const handlerRef = useLatest(onKeyDown);
  useEffect(() => {
    if (keyboard !== "global") return;
    const handler = (e: KeyboardEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return; // the root handler already ran
      handlerRef.current(e);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyboard, rootRef, handlerRef]);

  return onKeyDown;
}

/** A horizontal touch or pen swipe of 48px or more (and mostly sideways) moves a slide. */
export function useSwipe(next: () => void, prev: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: ReactPointerEvent) => {
      start.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: ReactPointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}
