import { createContext, useContext, type CSSProperties, type ElementType, type ReactNode } from "react";

export interface DeckSlideState {
  step: number;
  active: boolean;
  thumbnail: boolean;
  index: number;
  count: number;
}

export const DeckSlideContext = /*#__PURE__*/ createContext<DeckSlideState>({
  step: Infinity,
  active: true,
  thumbnail: false,
  index: 0,
  count: 1,
});

export const useDeckSlide = () => useContext(DeckSlideContext);

/**
 * Marks an element that is "the same thing" across slides. A `morph` transition moves it from its
 * place on the previous slide to its place here; a `zoom` transition flies into it.
 */
export function Morph({
  id,
  as: Tag = "div",
  fit,
  className,
  style,
  children,
}: {
  id: string;
  as?: ElementType;
  /** `auto` scales similar shapes uniformly (text stays undistorted) and stretches the rest. */
  fit?: "auto" | "uniform" | "stretch";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <Tag data-morph={id} data-morph-fit={fit} className={className} style={style}>
      {children}
    </Tag>
  );
}

/** Reveals its children at build `step` (1-based). Next reveals builds before it changes slide. */
export function Build({
  step,
  as: Tag = "div",
  className,
  style,
  children,
}: {
  step: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const { step: reached } = useDeckSlide();
  const built = reached >= step;
  return (
    <Tag
      data-build={step}
      data-built={built ? "" : undefined}
      aria-hidden={built ? undefined : true}
      className={className}
      style={style}
    >
      {children}
    </Tag>
  );
}

/**
 * The standard slide frame: canvas padding, an optional eyebrow and a footer with the page.
 * Children are the slide's blocks; `advance` staggers them in reading order.
 */
export function Slide({
  eyebrow,
  footer,
  layout = "stack",
  className,
  children,
}: {
  eyebrow?: ReactNode;
  footer?: ReactNode;
  /** `stack` flows top to bottom; `center` centres a statement; `split` is two columns. */
  layout?: "stack" | "center" | "split";
  className?: string;
  children?: ReactNode;
}) {
  const { index, count } = useDeckSlide();
  return (
    <div className={["uipack-deck-slide", className].filter(Boolean).join(" ")} data-layout={layout}>
      {eyebrow && <p className="uipack-deck-eyebrow">{eyebrow}</p>}
      {children}
      {footer !== null && (
        <footer className="uipack-deck-footer" data-morph="deck-footer" data-morph-fit="stretch">
          <span>{footer}</span>
          <span>
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        </footer>
      )}
    </div>
  );
}
