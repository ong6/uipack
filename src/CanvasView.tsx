import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Native modal semantics: focus containment, Escape, and a deliberate return to the opener. */
export function CanvasView({
  open,
  onClose,
  title,
  children,
  toolbar,
  theme,
  restoreFocus,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  toolbar?: ReactNode;
  theme?: string;
  restoreFocus?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
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
          {toolbar}
          <button type="button" onClick={onClose} autoFocus>
            Close canvas
          </button>
        </div>
      </div>
      <div className="uipack-canvas-content">{children}</div>
    </dialog>,
    document.body,
  );
}
