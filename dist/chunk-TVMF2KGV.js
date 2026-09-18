// src/CanvasView.tsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function CanvasView({
  open,
  onClose,
  title,
  children,
  toolbar,
  theme,
  restoreFocus
}) {
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previous;
      requestAnimationFrame(
        () => restoreFocus ? restoreFocus() : opener?.focus()
      );
    };
  }, [open]);
  if (!open || typeof document === "undefined") return /* @__PURE__ */ jsx(Fragment, { children });
  return createPortal(
    /* @__PURE__ */ jsxs(
      "dialog",
      {
        ref: dialog,
        className: "uipack-canvas-dialog",
        "data-theme": theme ?? document.documentElement.dataset.theme,
        "aria-label": title,
        onCancel: (e) => {
          e.preventDefault();
          close.current();
        },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "uipack-canvas-toolbar", children: [
            /* @__PURE__ */ jsx("strong", { children: title }),
            /* @__PURE__ */ jsxs("div", { children: [
              toolbar,
              /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, autoFocus: true, children: "Close canvas" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "uipack-canvas-content", children })
        ]
      }
    ),
    document.body
  );
}

export {
  CanvasView
};
//# sourceMappingURL=chunk-TVMF2KGV.js.map