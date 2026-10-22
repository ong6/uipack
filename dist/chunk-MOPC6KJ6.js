import {
  REDUCED_MOTION_QUERY
} from "./chunk-YUGHDI4S.js";

// src/context.tsx
import { createContext, useContext, useEffect, useState } from "react";
var noop = () => {
};
var FigureMotionContext = /* @__PURE__ */ createContext({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
function useFigureMotion() {
  return useContext(FigureMotionContext);
}
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
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
//# sourceMappingURL=chunk-MOPC6KJ6.js.map