import { createContext, useContext, type ReactNode } from "react";
import type { UiStyleId } from "../style";
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
  /**
   * For sections well below the fold: skip their layout and paint until they near the viewport
   * (content-visibility: auto, with a remembered intrinsic size). The content stays in the DOM, so
   * crawlers, find-in-page and screen readers still get it. Leave it off for the first screen and
   * for sections above an in-page link target.
   */
  lazyRender?: boolean;
  /** Paint this section in another style (data-ui-style), e.g. one band in a second registered style. */
  uiStyle?: UiStyleId;
  /**
   * More for the head, under the intro: a short supporting note, a contact line or a CtaButton.
   * Use it where the head sits in a column of its own (FAQ at 1024px and up), so that column
   * carries something besides a title.
   */
  aside?: ReactNode;
}

/**
 * The section's place on its page (1, 2, 3…), provided by `WebPage` to each section slot after the
 * hero, in the page's order; a slot that renders nothing takes no number. A style that numbers its
 * sections (Technical) shows it before the eyebrow as `02 /`. Outside a WebPage there is no number.
 */
export const SectionIndexContext = createContext<number | undefined>(undefined);

/** Two digits, as a drawing sheet numbers its views: 1 → "01". */
export const sectionIndexLabel = (n: number) => String(n).padStart(2, "0");

/** A page section on the 8-pt rhythm, with an optional eyebrow, heading and intro. */
export function Section({
  eyebrow,
  title,
  intro,
  children,
  tone = "default",
  align = "start",
  id,
  className = "",
  lazyRender = false,
  uiStyle,
  aside,
}: SectionProps) {
  const headingId = id ? `${id}-title` : undefined;
  const index = useContext(SectionIndexContext);
  return (
    <section
      id={id}
      className={`uipack-web-section ${className}`.trim()}
      data-tone={tone}
      data-align={align}
      data-lazy={lazyRender || undefined}
      data-ui-style={uiStyle}
      aria-labelledby={title ? headingId : undefined}
    >
      <div className="uipack-web-section__inner">
        {(eyebrow || title || intro || aside) && (
          <div className="uipack-web-section__head">
            {eyebrow && (
              <Eyebrow>
                {/* The section's number on its page (Technical shows it: 01, 02…; hidden elsewhere). */}
                {index !== undefined && (
                  <span className="uipack-web-section__index" aria-hidden="true">
                    {sectionIndexLabel(index)}
                  </span>
                )}
                {eyebrow}
              </Eyebrow>
            )}
            {title && (
              <Heading level={2} id={headingId}>
                {title}
              </Heading>
            )}
            {intro && <Body>{intro}</Body>}
            {aside && <div className="uipack-web-section__aside">{aside}</div>}
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
  /**
   * Number the cards 1, 2, 3 in the style's display face and accent: for steps, where order is
   * the point. The number is decorative (aria-hidden); the list is already ordered.
   */
  numbered?: boolean;
}

/** Three across at 12 columns, two at 8, one at 4. */
export function FeatureGrid({ features, spotlight = false, numbered = false }: FeatureGridProps) {
  return (
    <Grid as={numbered ? "ol" : "ul"} className={`uipack-web-features${numbered ? " uipack-web-features--numbered" : ""}`}>
      {features.map((f, i) => {
        const inner = (
          <>
            {numbered && (
              <span className="uipack-web-feature__num" aria-hidden="true">
                {/* The leading zero shows where the style numbers with two digits (Technical's STEP 01). */}
                {i < 9 && <span className="uipack-web-feature__pad">0</span>}
                {i + 1}
              </span>
            )}
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
