import { useEffect, useRef, type ReactNode } from "react";
import { useCanvasGestures, type CanvasZoom } from "./canvas-gestures";
import { createPortal } from "react-dom";

/** Native modal semantics: focus containment, Escape, and a deliberate return to the opener. */
export function CanvasView({
  open,
  onClose,
  title,
  children,
  zoom,
  theme,
  restoreFocus,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  zoom: CanvasZoom;
  theme?: string;
  restoreFocus?: () => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const gestures = useCanvasGestures(content, open, zoom);
  const dialog = useRef<HTMLDialogElement>(null);
  const actions = useRef(gestures);
  actions.current = gestures;
  useEffect(() => {
    if (!open) return;
    const keyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        target.isContentEditable ||
        target.closest("input, select, textarea")
      )
        return;
      // A zoom button becoming disabled can return focus to body. The modal
      // still owns keyboard shortcuts until it closes.
      if (!dialog.current?.contains(target) && target !== document.body) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        actions.current.step(1.25);
      }
      if (event.key === "-") {
        event.preventDefault();
        actions.current.step(0.8);
      }
      if (event.key === "0") {
        event.preventDefault();
        actions.current.reset();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => document.removeEventListener("keydown", keyboard);
  }, [open]);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previous;
      requestAnimationFrame(() =>
        restoreFocus ? restoreFocus() : opener?.focus(),
      );
    };
  }, [open]);
  if (!open || typeof document === "undefined") return <>{children}</>;
  return createPortal(
    <dialog
      ref={dialog}
      className="uipack-canvas-dialog"
      data-theme={theme ?? document.documentElement.dataset.theme}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
    >
      <div className="uipack-canvas-toolbar">
        <strong>{title}</strong>
        <div>
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out (−)"
            disabled={zoom.value <= zoom.min}
            onClick={() => gestures.step(0.8)}
          >
            −
          </button>
          <span
            role="meter"
            aria-label="Zoom level"
            aria-valuemin={zoom.min * 100}
            aria-valuemax={zoom.max * 100}
            aria-valuenow={Math.round(zoom.value * 100)}
            aria-valuetext={`${Math.round(zoom.value * 100)}%`}
          >
            {Math.round(zoom.value * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in (+)"
            disabled={zoom.value >= zoom.max}
            onClick={() => gestures.step(1.25)}
          >
            +
          </button>
          <button type="button" title="Reset view (0)" onClick={gestures.reset}>
            Fit
          </button>
          <button type="button" onClick={onClose} autoFocus>
            Close canvas
          </button>
        </div>
      </div>
      <p className="uipack-canvas-hint">
        Pinch to zoom · Two-finger scroll · + / − to zoom · 0 to reset
      </p>
      <div ref={content} className="uipack-canvas-content">
        {children}
      </div>
    </dialog>,
    document.body,
  );
}
