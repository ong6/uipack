import type { ComponentProps } from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * Toasts: Sonner's `Toaster`, skinned by `uipack/widgets.css` on the site's roles. Every Sonner prop
 * passes through; the wrapper sets the defaults a site would otherwise get wrong: bottom right, three
 * visible at once, the skin's class, and a close button for anything that waits on the reader. Mount
 * one per page and call `toast("Saved")` from anywhere.
 */
export function Toaster({ className, toastOptions, ...props }: ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      position="bottom-right"
      visibleToasts={3}
      gap={8}
      className={["uipack-toaster", className].filter(Boolean).join(" ")}
      toastOptions={{ ...toastOptions, className: ["uipack-toast", toastOptions?.className].filter(Boolean).join(" ") }}
      {...props}
    />
  );
}

export { toast };
