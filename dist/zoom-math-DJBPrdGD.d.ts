interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
interface ZoomFrame {
    /** Scale at which the target fills the surface in its limiting dimension. */
    Z: number;
    /** The fixed point both layers scale about. */
    fx: number;
    fy: number;
}

/**
 * A zoom into `target` is a pure scale about one fixed point F, chosen so the
 * target ends centred and as large as the surface allows. The outer layer
 * scales by Z^p and the inner layer by Z^(p-1) about the same point, so the
 * inner layer stays locked inside the target for the whole flight and the zoom
 * feels even (exponential), not accelerating.
 */
declare function zoomFrame(target: Rect, width: number, height: number): ZoomFrame | null;
/** Where the target lands in the inner layer's own coordinates: the clip the inner layer opens from. */
declare function innerClipStart(target: Rect, frame: ZoomFrame, width: number, height: number): {
    top: number;
    right: number;
    bottom: number;
    left: number;
};
interface ZoomSample {
    offset: number;
    /** Eased progress 0..1 (forward), the exponent of Z. */
    p: number;
    outer: string;
    inner: string;
    clip: string;
    innerOpacity: number;
}
interface ZoomSampleOptions {
    samples?: number;
    /** Corner radius of the target box in surface pixels; the clip opens from it. Default 6. */
    radius?: number;
}
/** Sampled keyframes for a zoom. `forward` flies in; backwards plays the same path out. */
declare function zoomSamples(target: Rect, forward: boolean, width: number, height: number, { samples, radius }?: ZoomSampleOptions): ZoomSample[] | null;

export { type Rect as R, type ZoomFrame as Z, type ZoomSample as a, type ZoomSampleOptions as b, zoomSamples as c, innerClipStart as i, zoomFrame as z };
