// One level's drawings inside DrillFigure's stage: the wide drawing, and the narrow one when the
// figure has a narrow frame. Each carries the drill context its DrillNodes open children through.
import { memo, type ReactNode } from "react";
import { FigureScaleContext } from "../scale";
import { DrillContext, type DrillContextValue } from "./context";
import { cleanId, type DrillLevel } from "./model";

interface LayerProps {
  level: DrillLevel;
  figId: string;
  frame: { wide: string; narrow?: string };
  floorWide: number;
  floorNarrow: number;
  levels: ReadonlyMap<string, DrillLevel>;
  open: (from: string, id: string) => void;
  current: boolean;
}

/** One level's drawings. Memoised: a move re-renders the head, not the drawings. */
export const DrillLayer = /*#__PURE__*/ memo(function DrillLayer({
  level,
  figId,
  frame,
  floorWide,
  floorNarrow,
  levels,
  open,
  current,
}: LayerProps) {
  const lid = `${figId}-${cleanId(level.id)}`;
  const ctx = (variant: "wide" | "narrow"): DrillContextValue => ({
    levels,
    frame,
    idPrefix: `${lid}-${variant[0]}`,
    variant,
    interactive: true,
    ghost: false,
    open: (id) => open(level.id, id),
  });
  const draw = (variant: "wide" | "narrow", render: DrillLevel["render"], vb: string, floor: number): ReactNode => (
    <svg
      className={`uipack-drill__${variant}`}
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={level.alt}
    >
      <DrillContext.Provider value={ctx(variant)}>
        <FigureScaleContext.Provider value={{ floor }}>
          {render({ id: variant === "wide" ? lid : `${lid}-n`, variant, ghost: false, level })}
        </FigureScaleContext.Provider>
      </DrillContext.Provider>
    </svg>
  );
  return (
    <div className="uipack-drill__layer" data-level={level.id} data-current={current ? "true" : undefined}>
      {draw("wide", level.render, level.viewBox ?? frame.wide, floorWide)}
      {frame.narrow ? draw("narrow", level.narrow ?? level.render, level.narrowViewBox ?? frame.narrow, floorNarrow) : null}
    </div>
  );
});
