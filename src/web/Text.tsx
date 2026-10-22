import type { ElementType, ReactNode } from "react";
import type { TypeStep } from "./tokens";

type Emphasis = "high" | "medium" | "low";

interface TextProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
}

/** Small uppercase label above a heading. Low emphasis by opacity, not by colour. */
export function Eyebrow({ children, className = "", as: Tag = "p", id }: TextProps) {
  return (
    <Tag id={id} className={`uipack-web-eyebrow ${className}`.trim()}>
      {children}
    </Tag>
  );
}

export interface HeadingProps extends TextProps {
  /** The real heading level, h1–h6: one h1 per page (StarHero's title), then no skipped levels. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Type-scale step; defaults to 6 / 4 / 2 / 1 / 0 / 0 by level. Size is separate from level. */
  size?: TypeStep;
}

const DEFAULT_STEP: Record<number, TypeStep> = { 1: 6, 2: 4, 3: 2, 4: 1, 5: 0, 6: 0 };

export function Heading({ children, level = 2, size, className = "", id }: HeadingProps) {
  const Tag = `h${level}` as ElementType;
  const step = size ?? DEFAULT_STEP[level];
  return (
    <Tag id={id} className={`uipack-web-heading ${className}`.trim()} data-step={step}>
      {children}
    </Tag>
  );
}

/** One step above body, medium emphasis (~87%). */
export function Subhead({ children, className = "", as: Tag = "p", id }: TextProps) {
  return (
    <Tag id={id} className={`uipack-web-subhead ${className}`.trim()}>
      {children}
    </Tag>
  );
}

export interface BodyProps extends TextProps {
  emphasis?: Emphasis;
}

/** Body copy: 1rem, line-height 1.5, emphasis by opacity. */
export function Body({ children, emphasis = "low", className = "", as: Tag = "p", id }: BodyProps) {
  return (
    <Tag id={id} className={`uipack-web-body ${className}`.trim()} data-emphasis={emphasis}>
      {children}
    </Tag>
  );
}
