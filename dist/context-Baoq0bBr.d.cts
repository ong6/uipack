import * as react from 'react';

interface FigureMotion {
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
declare const FigureMotionContext: react.Context<FigureMotion>;
/** Motion state of the enclosing Figure. Outside a Figure it plays forever. */
declare function useFigureMotion(): FigureMotion;
/**
 * How much tool chrome a Figure shows. "full" (the default, for articles and docs): Open canvas
 * and every legend. "quiet" (marketing pages; `WebSurface` provides it): no Open canvas, and a
 * legend only when it tells two or more kinds apart. A Figure's own `chrome` or `expandable` prop wins.
 */
type FigureChrome = "full" | "quiet";
declare const FigureChromeContext: react.Context<FigureChrome>;

export { type FigureChrome as F, FigureChromeContext as a, type FigureMotion as b, FigureMotionContext as c, useFigureMotion as u };
