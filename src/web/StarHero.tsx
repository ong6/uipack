import type { ReactNode } from "react";
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
   * revision tag, Landing's die-cut label. It belongs to the copy: under the actions in a split
   * hero and on a phone, on the empty end side of a stacked hero's headline. Never on the product.
   */
  stamp?: { value: ReactNode; label: ReactNode };
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
}: StarHeroProps) {
  const backdrop = visual ?? (children ? null : <StarChart values={values} />);
  return (
    <section
      className="uipack-web-hero"
      data-align={align}
      data-layout={layout}
      data-has-proof={children ? "" : undefined}
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
        {stamp && <Stamp {...stamp} />}
      </div>
      {children && <div className="uipack-web-hero__proof">{children}</div>}
    </section>
  );
}

function Stamp({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <p className="uipack-web-hero__stamp">
      <span className="uipack-web-hero__stamp-value">{value}</span>
      <span className="uipack-web-hero__stamp-label">{label}</span>
    </p>
  );
}
