import type { ReactNode } from "react";

export interface MechanismFrameProps {
  /** Top left, e.g. "Fig 3" (Figure's `number`). */
  number: string;
  /** Top right: a short title. */
  title?: string;
  /** Bottom left: how to interact. */
  hint?: ReactNode;
  /** Bottom right: the resting readout. A live machine inside rewrites it in place. */
  readout?: ReactNode;
  /** Under the card: a true caption. */
  caption?: ReactNode;
  theme?: "light" | "dark";
  className?: string;
  children: ReactNode;
}

/**
 * Anatomy's card in UI Pack's labelling language: figure number top left,
 * title top right, hint bottom left, live readout bottom right, caption
 * below. Any machine placed inside writes its readout into the corner.
 */
export function MechanismFrame({ number, title, hint, readout, caption, theme, className, children }: MechanismFrameProps) {
  return (
    <figure className={`uipack-mechanism um-frame${className ? ` ${className}` : ""}`} data-theme={theme}>
      <div className="um-plate">
        <div className="um-corners" aria-hidden="true">
          <span className="um-corner" data-corner="fig">
            {number}
          </span>
          {title ? (
            <span className="um-corner" data-corner="title">
              {title}
            </span>
          ) : null}
          {hint ? (
            <span className="um-corner" data-corner="hint">
              {hint}
            </span>
          ) : null}
          <span className="um-corner" data-corner="readout" data-readout="">
            {readout}
          </span>
        </div>
        {children}
      </div>
      {caption ? <figcaption className="um-caption">{caption}</figcaption> : null}
    </figure>
  );
}
