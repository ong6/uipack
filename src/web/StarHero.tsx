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
  /** Layout: copy on the start edge, in the sections' column (default), or centred over the proof. */
  align?: "center" | "start";
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
}: StarHeroProps) {
  const backdrop = visual ?? (children ? null : <StarChart values={values} />);
  return (
    <section className="uipack-web-hero" data-align={align} aria-labelledby={headingId}>
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
      </div>
      {children && <div className="uipack-web-hero__proof">{children}</div>}
    </section>
  );
}
