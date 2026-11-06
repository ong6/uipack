import type { CSSProperties, ReactNode } from "react";

/* The product itself on a marketing page: a framed plate holding a photo, a render or a
   role-painted illustration (SVG or CSS drawn from --ui-media-* roles, so it repaints with the
   style), with pinned callouts, a readout, a small detail view and a caption strip. One layout in
   every style; the style draws the frame, the pins and leaders and the caption (Technical a drawing
   sheet with numbered balloons). Recipe: docs/system/layout.md, "Product visuals". */

export interface ProductShotCallout {
  /** The point the callout marks, in % of the plate: from the start edge (0–100) and from the top (0–100). */
  x: number;
  y: number;
  /** What is there: "Loft hatch". */
  label: ReactNode;
  /** The reading at that point, mono: "−7.4 °C", "3.8 mo payback". */
  value?: ReactNode;
  /** Side of the point the note sits on. Default: the side with more room (start when x > 55). */
  side?: "start" | "end";
}

export interface ProductShotReadout {
  label: ReactNode;
  value: ReactNode;
}

export interface ProductShotProps {
  /** Accessible name: what the picture shows, in words ("Thermal view of a loft hatch, 7 °C colder than the room"). */
  label: string;
  /** A role-painted illustration (an SVG or CSS drawing that reads --ui-media-* and the ink roles). */
  children?: ReactNode;
  /** Or a photo or render. Photos get the style's media treatment (--ui-media-filter, --ui-media-tint). */
  src?: string;
  /** Alt text for `src`; default `label`. */
  alt?: string;
  /** A short mono tag on the plate's top-start corner: "Thermal view", "Actual size". */
  tag?: ReactNode;
  /** One to three readings under the tag: [{ label: "Room", value: "19.6 °C" }]. */
  readouts?: ProductShotReadout[];
  /** Up to three pins with a leader and a note. Keep the top-end corner free: a split hero sticks its stamp there. */
  callouts?: ProductShotCallout[];
  /**
   * A small detail view on the plate's bottom-end corner (under the plate, as a row, below 520px):
   * the hardware, a close-up, the package. Keep callouts out of the plate's end quarter.
   */
  inset?: { label: ReactNode; children: ReactNode };
  /** The caption strip under the plate: what and where ("Landing ceiling, 21:40, 4 °C outside"). */
  caption?: ReactNode;
  /** A key for a colour ramp in the picture (a heat map, a thermal frame), drawn from --ui-media-ramp. */
  scale?: { start: ReactNode; end: ReactNode };
  /** Plate aspect ratio. Default "5 / 2", short enough to sit above a product table in a split hero. */
  aspect?: string;
  className?: string;
}

/** A framed picture of the product with pinned callouts: the device, the scan, the label, beside its output. */
export function ProductShot({
  label,
  children,
  src,
  alt,
  tag,
  readouts = [],
  callouts = [],
  inset,
  caption,
  scale,
  aspect = "5 / 2",
  className = "",
}: ProductShotProps) {
  return (
    <figure className={`uipack-web-shot ${className}`.trim()} aria-label={label}>
      <div className="uipack-web-shot__stage">
        <div className="uipack-web-shot__plate" style={{ "--shot-aspect": aspect } as CSSProperties}>
          <div className="uipack-web-shot__media" data-kind={src ? "image" : "drawing"}>
            {src ? <img src={src} alt={alt ?? label} loading="eager" decoding="async" /> : children}
          </div>
          {(tag || readouts.length > 0) && (
            <div className="uipack-web-shot__hud">
              {tag && <span className="uipack-web-shot__tag">{tag}</span>}
              {readouts.length > 0 && (
                <dl className="uipack-web-shot__readouts">
                  {readouts.map((r, i) => (
                    <div key={i}>
                      <dt>{r.label}</dt>
                      <dd>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}
          {callouts.length > 0 && (
            <ol className="uipack-web-shot__callouts">
              {callouts.map((c, i) => {
                const x = Math.min(100, Math.max(0, c.x));
                const y = Math.min(100, Math.max(0, c.y));
                return (
                  <li
                    key={i}
                    data-side={c.side ?? (x > 55 ? "start" : "end")}
                    data-rise={y < 34 ? "down" : "up"}
                    style={{ "--x": `${x}%`, "--y": `${y}%` } as CSSProperties}
                  >
                    <span className="uipack-web-shot__pin" aria-hidden="true" />
                    <svg className="uipack-web-shot__leader" viewBox="0 0 48 24" preserveAspectRatio="none" aria-hidden="true">
                      <polyline points="0,24 16,0 48,0" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <span className="uipack-web-shot__note">
                      <strong>{c.label}</strong>
                      {c.value !== undefined && <span>{c.value}</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        {inset && (
          <div className="uipack-web-shot__inset">
            <span className="uipack-web-shot__inset-label">{inset.label}</span>
            <div className="uipack-web-shot__inset-art">{inset.children}</div>
          </div>
        )}
      </div>
      {(caption || scale) && (
        <figcaption className="uipack-web-shot__caption">
          {caption && <span className="uipack-web-shot__caption-text">{caption}</span>}
          {scale && (
            <span className="uipack-web-shot__scale">
              <span>{scale.start}</span>
              <i aria-hidden="true" />
              <span>{scale.end}</span>
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
