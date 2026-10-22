// Full screen for the deck's root, through the standard API or the WebKit-prefixed one (older iPad
// Safari). Whether it is available is known only in the browser: false in server HTML and while
// hydrating, so the server and the first client render agree.
import { useEffect, useState, type RefObject } from "react";
import { useHydrated } from "../../env";

type PrefixedElement = HTMLElement & { webkitRequestFullscreen?: () => void };
type PrefixedDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};

const fullscreenElement = () => document.fullscreenElement ?? (document as PrefixedDocument).webkitFullscreenElement ?? null;

/**
 * iPhone Safari has no element full screen: fullscreenEnabled is undefined there, so it counts only
 * where the standard API is on, or the prefixed one exists. (Where the standard API says false, a
 * frame's policy forbids it: the prefixed method is no use then.)
 */
function fullscreenAvailable(): boolean {
  const doc = document as PrefixedDocument;
  const prefixed =
    doc.fullscreenEnabled === undefined &&
    doc.webkitFullscreenEnabled !== false &&
    typeof (doc.documentElement as PrefixedElement).webkitRequestFullscreen === "function";
  return doc.fullscreenEnabled === true || prefixed;
}

export function useFullscreen(rootRef: RefObject<HTMLElement | null>) {
  const hydrated = useHydrated();
  const available = hydrated && fullscreenAvailable();
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setFullscreen(fullscreenElement() === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [rootRef]);

  /** Enter or leave full screen, keeping keyboard focus on the deck. */
  const toggle = () => {
    if (!available) return;
    const doc = document as PrefixedDocument;
    const root = rootRef.current as PrefixedElement | null;
    if (fullscreenElement()) {
      if (doc.exitFullscreen) void doc.exitFullscreen();
      else doc.webkitExitFullscreen?.();
    } else if (root?.requestFullscreen) void root.requestFullscreen();
    else root?.webkitRequestFullscreen?.();
    root?.focus();
  };

  return { available, fullscreen, toggle };
}
