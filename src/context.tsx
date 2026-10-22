import { createContext, useContext } from "react";

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

export const FigureMotionContext = /*#__PURE__*/ createContext<FigureMotion>({
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

