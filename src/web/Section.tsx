import type { ReactNode } from "react";
import { Body, Eyebrow, Heading } from "./Text";
import { Grid, GridItem } from "./Surface";
import { SpotlightCard } from "./SpotlightCard";

export interface SectionProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  /** "secondary" paints the 30% colour band behind the section. */
  tone?: "default" | "secondary";
  align?: "start" | "center";
  id?: string;
  className?: string;
}

/** A page section on the 8-pt rhythm, with an optional eyebrow, heading and intro. */
export function Section({ eyebrow, title, intro, children, tone = "default", align = "start", id, className = "" }: SectionProps) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      className={`uipack-web-section ${className}`.trim()}
      data-tone={tone}
      data-align={align}
      aria-labelledby={title ? headingId : undefined}
    >
      <div className="uipack-web-section__inner">
        {(eyebrow || title || intro) && (
          <div className="uipack-web-section__head">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && (
              <Heading level={2} id={headingId}>
                {title}
              </Heading>
            )}
            {intro && <Body>{intro}</Body>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export interface Feature {
  title: string;
  body: ReactNode;
  icon?: ReactNode;
  href?: string;
}

export interface FeatureGridProps {
  features: Feature[];
  /** Upgrade the quiet cards to pointer-following spotlight cards. */
  spotlight?: boolean;
}

/** Three across at 12 columns, two at 8, one at 4. */
export function FeatureGrid({ features, spotlight = false }: FeatureGridProps) {
  return (
    <Grid as="ul" className="uipack-web-features">
      {features.map((f) => {
        const inner = (
          <>
            {f.icon && <div className="uipack-web-feature__icon">{f.icon}</div>}
            <Heading level={3} size={1}>
              {f.href ? <a href={f.href}>{f.title}</a> : f.title}
            </Heading>
            <Body>{f.body}</Body>
          </>
        );
        return (
          <GridItem as="li" key={f.title} span={[4, 4, 4]}>
            {spotlight ? <SpotlightCard>{inner}</SpotlightCard> : <div className="uipack-web-feature">{inner}</div>}
          </GridItem>
        );
      })}
    </Grid>
  );
}
