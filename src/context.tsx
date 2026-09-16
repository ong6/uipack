import { createContext, useContext, useEffect, useState } from "react";

export interface FigureMotion {
  /** False after Pause, or always false under prefers-reduced-motion. */
  playing: boolean;
  /** True when the viewer asked for reduced motion; packets render static. */
  reduced: boolean;
  /** Increments on Replay so animated children can restart. */
  cycle: number;
  /** Emit SMIL on the server render (static export); the client waits for mount. */
  prerender?: boolean;
  toggle: () => void;
  replay: () => void;
}

const noop = () => {};

export const FigureMotionContext = createContext<FigureMotion>({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop,
});

/** Motion state of the enclosing Figure. Outside a Figure it plays forever. */
export function useFigureMotion(): FigureMotion {
  return useContext(FigureMotionContext);
}

const QUERY = "(prefers-reduced-motion: reduce)";

/** True when the OS asks for reduced motion. Server render says false. */
export function usePrefersReducedMotion(): boolean {
  // Starts false on both server and client so hydration matches; the real
  // value lands in the effect, the same way Packet waits for mount.
  const [reduced, setReduced] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
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
