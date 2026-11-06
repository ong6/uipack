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
/**
 * The width, in CSS px, that Figures inside lay out at, for a host that draws them scaled down with
 * a transform (a gallery card, a thumbnail). The text floor (`minFont`) then reads this width
 * instead of the scaled on-screen one, so labels keep their designed size. A Figure's own
 * `measuredWidth` wins. Unset (the default), each Figure measures itself.
 */
declare const FigureLayoutWidthContext: react.Context<number | undefined>;

export { type FigureChrome as F, FigureChromeContext as a, FigureLayoutWidthContext as b, type FigureMotion as c, FigureMotionContext as d, useFigureMotion as u };
