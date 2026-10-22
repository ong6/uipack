import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useLatest } from "../../env";
import type { LintFinding } from "../storyline";
import type { DeckSlide, DeckTheme } from "../types";
import { pad } from "./format";
import { SlideThumbnail } from "./Layer";
import { Storyline } from "./Storyline";

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The dialog's own focusable controls, in order: not the inert slide thumbnails, not hidden ones. */
function focusables(root: HTMLElement | null) {
  return Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
    (el) => !el.closest("[inert]") && el.getClientRects().length > 0,
  );
}

/** The All slides dialog: a grid of thumbnails, or the storyline with its checks. */
export function Overview({
  slides,
  index,
  theme,
  findings,
  onPick,
  onClose,
}: {
  slides: DeckSlide[];
  index: number;
  theme: DeckTheme;
  findings?: LintFinding[];
  onPick: (index: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"slides" | "storyline">("slides");
  const closeRef = useLatest(onClose);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
    // aria-modal promises that nothing else on the page is reachable: make every sibling of the
    // dialog and of each of its ancestors inert until it closes, as a modal <dialog> would.
    const made: Element[] = [];
    for (let el: Element = root; el.parentElement && el !== document.body; el = el.parentElement) {
      for (const sibling of Array.from(el.parentElement.children)) {
        if (sibling === el || sibling.hasAttribute("inert")) continue;
        sibling.setAttribute("inert", "");
        made.push(sibling);
      }
    }
    // Keys that reach the document from outside the dialog (focus lost to the page or the body)
    // still close it or bring focus back in.
    const onDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || root.contains(e.target as Node)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      } else if (e.key === "Tab") {
        e.preventDefault();
        const items = focusables(root);
        items[e.shiftKey ? items.length - 1 : 0]?.focus();
      }
    };
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown);
      for (const el of made) el.removeAttribute("inert");
    };
  }, [closeRef]);
  const onKeyDown = (e: ReactKeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const items = focusables(ref.current);
    const at = items.indexOf(document.activeElement as HTMLElement);
    // Tab moves through the dialog's own controls and wraps. It is never left to the browser:
    // WebKit's default Tab skips buttons, which would carry focus out of the dialog.
    if (e.key === "Tab") {
      e.preventDefault();
      if (!items.length) return;
      const step = e.shiftKey ? -1 : 1;
      items[at < 0 ? (e.shiftKey ? items.length - 1 : 0) : (at + step + items.length) % items.length].focus();
      return;
    }
    const tiles = items.filter((b) => b.dataset.tile !== undefined);
    const ti = tiles.indexOf(document.activeElement as HTMLElement);
    if (ti >= 0 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      tiles[Math.min(Math.max(ti + (e.key === "ArrowRight" ? 1 : -1), 0), tiles.length - 1)].focus();
    }
  };
  return (
    <div
      ref={ref}
      className="uipack-deck-overview"
      role="dialog"
      aria-modal="true"
      aria-label="All slides"
      onKeyDown={onKeyDown}
      // A click on the dialog's own background, outside its header and tiles, closes it.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="uipack-deck-overview__head">
        <p>All slides · {slides.length}</p>
        <span className="uipack-deck-overview__tabs">
          <button type="button" aria-pressed={tab === "slides"} onClick={() => setTab("slides")}>
            Slides
          </button>
          <button type="button" aria-pressed={tab === "storyline"} onClick={() => setTab("storyline")}>
            Storyline
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </span>
      </div>
      {tab === "storyline" ? (
        <Storyline slides={slides} index={index} findings={findings} onPick={onPick} />
      ) : (
        <ol className="uipack-deck-overview__grid">
          {slides.map((s, i) => (
            <li key={s.id}>
              <button type="button" data-tile="" aria-current={i === index ? "true" : undefined} onClick={() => onPick(i)}>
                <SlideThumbnail slide={s} index={i} count={slides.length} theme={theme} />
                <span>
                  <b>{pad(i + 1)}</b> {s.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
