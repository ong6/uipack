import type { ReactNode } from "react";
import { Eyebrow, Heading, Subhead } from "./Text";
import { NoiseLayer, StarChart } from "./motif";

export interface StarHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** The CTA(s). Put the page's one goal here, then repeat it in the nav and at the end. */
  actions?: ReactNode;
  /** The star of the show. Defaults to StarChart; pass a still, an SVG, or a 3D scene. */
  visual?: ReactNode;
  /** Values for the default StarChart, taken from your product story. */
  values?: number[];
  /** Below the copy, e.g. a DemoPlayer that proves the claim. */
  children?: ReactNode;
  /** Noise opacity; 0 turns it off. */
  noise?: number;
  headingId?: string;
}

/**
 * One focal visual derived from the product story, masked so it never fights the headline,
 * with a quiet noise layer for depth. Copy uses opacity hierarchy, not extra colours.
 */
export function StarHero({ eyebrow, title, subtitle, actions, visual, values, children, noise = 0.07, headingId }: StarHeroProps) {
  return (
    <section className="uipack-web-hero" aria-labelledby={headingId}>
      <div className="uipack-web-hero__visual">{visual ?? <StarChart values={values} />}</div>
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
