import type { CSSProperties, ReactNode } from "react";
import { Eyebrow, Heading, Subhead } from "./Text";
import { NoiseLayer, StarChart } from "./motif";

export interface StarHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** The CTA(s). Put the page's one goal here, then repeat it in the nav and at the end. */
  actions?: ReactNode;
  /**
   * A backdrop visual behind the copy: a still, an SVG or a 3D scene. Without one, a StarChart is
   * drawn only when the hero has no proof below the copy; with a demo or figure as `children`,
   * that proof is the star, and a second curve would only peek out around it.
   */
  visual?: ReactNode;
  /** Values for the default StarChart, taken from your product story. */
  values?: number[];
  /** Below the copy, e.g. a DemoPlayer that proves the claim. */
  children?: ReactNode;
  /**
   * The product itself, shown above `children` in the proof column: a `ProductShot` framing a
   * photo, a render or a role-painted illustration (a thermal frame, the device, the label). Use
   * it whenever the product is physical or visual, so the hero shows the thing next to its output.
   */
  media?: ReactNode;
  /** Noise opacity; 0 turns it off. */
  noise?: number;
  headingId?: string;
  /** Copy on the start edge, in the sections' column (default), or centred over the proof. */
  align?: "center" | "start";
  /**
   * "split": copy on the start half, the proof (`children`, e.g. a DemoPlayer) beside it on the end
   * half from 1024px, so a wide screen has no empty half above the product; stacked below that.
   * "stack" (default): the proof under the copy, full column width. Same boxes in every style.
   */
  layout?: "stack" | "split";
  /**
   * One short fact the page proves (a measured number and a few words, e.g. `{ value: "18%",
   * label: "lower postage" }`), worn as the style's stamp: Graphical's orange postmark, Technical's
   * revision tag, Landing's riso sticker. Split hero: stuck on the proof's top-end corner (the
   * media's, if there is one; keep that corner of the visual quiet). Stacked hero: on the empty end
   * side of the headline. Below 1024px: a one-line strip. Keep the value to 4 characters ("64%",
   * "£40", "3×") and the label to about 28 characters (three short lines); the stamp sizes its
   * figure to the value and clamps the label at three lines.
   */
  stamp?: { value: ReactNode; label: ReactNode };
  /**
   * Two or three plain facts under the actions, as a ruled row (value, then a few words): the
   * price, the time it takes, what it works with, e.g. `{ value: "£40", label: "one-off, app
   * included" }`. They fill the copy column of a split hero, whose proof is taller than the copy.
   * Not the stamp's number again: each fact once on the page.
   */
  facts?: { value: ReactNode; label: ReactNode }[];
}

/**
 * One focal visual derived from the product story, masked so it never fights the headline,
 * with a quiet noise layer for depth. Copy uses opacity hierarchy, not extra colours.
 */
export function StarHero({
  eyebrow,
  title,
  subtitle,
  actions,
  visual,
  values,
  children,
  noise = 0.07,
  headingId,
  align = "start",
  layout = "stack",
  stamp,
  media,
  facts,
}: StarHeroProps) {
  const hasProof = Boolean(children || media);
  const backdrop = visual ?? (hasProof ? null : <StarChart values={values} />);
  // A split hero sticks the stamp on the proof's corner; otherwise it belongs to the copy.
  const stampOnProof = Boolean(stamp && layout === "split" && hasProof);
  return (
    <section
      className="uipack-web-hero"
      data-align={align}
      data-layout={layout}
      data-has-proof={hasProof ? "" : undefined}
      aria-labelledby={headingId}
    >
      {/* The backdrop ornament slot: empty here, painted by the style (--ui-backdrop). */}
      <div className="uipack-web-hero__backdrop" aria-hidden="true" />
      {backdrop && <div className="uipack-web-hero__visual">{backdrop}</div>}
      {noise > 0 && <NoiseLayer opacity={noise} />}
      <div className="uipack-web-hero__copy">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading level={1} id={headingId}>
          {title}
        </Heading>
        {subtitle && <Subhead>{subtitle}</Subhead>}
        {actions && <div className="uipack-web-hero__actions">{actions}</div>}
        {facts && facts.length > 0 && (
          <dl className="uipack-web-hero__facts">
            {facts.slice(0, 3).map((f, i) => (
              <div key={i}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {stamp && !stampOnProof && <Stamp {...stamp} />}
      </div>
      {hasProof && (
        <div className="uipack-web-hero__proof" data-stamped={stampOnProof ? "" : undefined}>
          {stamp && stampOnProof && <Stamp {...stamp} />}
          {media && <div className="uipack-web-hero__media">{media}</div>}
          {children}
        </div>
      )}
    </section>
  );
}

const DEV = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

function Stamp({ value, label }: { value: ReactNode; label: ReactNode }) {
  const len = typeof value === "string" || typeof value === "number" ? String(value).length : 3;
  if (DEV && typeof label === "string" && label.length > 32)
    console.warn(
      `uipack/web: StarHero stamp label "${label}" is ${label.length} characters; keep it to about 28 (three short lines), or it is clamped.`,
    );
  return (
    <p className="uipack-web-hero__stamp" style={{ "--stamp-len": Math.max(2, len) } as CSSProperties}>
      <span className="uipack-web-hero__stamp-value">{value}</span>
      <span className="uipack-web-hero__stamp-label">{label}</span>
    </p>
  );
}
