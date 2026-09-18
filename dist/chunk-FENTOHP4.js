// src/context.tsx
import { createContext, useContext, useEffect, useState } from "react";
var noop = () => {
};
var FigureMotionContext = createContext({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
function useFigureMotion() {
  return useContext(FigureMotionContext);
}
var QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setReduced(e.matches);
    setReduced(mq.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);
  return reduced;
}

export {
  FigureMotionContext,
  useFigureMotion,
  usePrefersReducedMotion
};
//# sourceMappingURL=chunk-FENTOHP4.js.map