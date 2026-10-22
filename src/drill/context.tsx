import { createContext, useContext } from "react";
import type { DrillLevel } from "./model";

/** What a DrillNode needs from the figure (or static render) that draws it. */
export interface DrillContextValue {
  levels: ReadonlyMap<string, DrillLevel>;
  /** Stage frame viewBoxes; a ghost uses the one its drawing sits in. */
  frame: { wide: string; narrow?: string };
  /** Prefix for ghost ids. */
  idPrefix: string;
  /** Drawing this node sits in. */
  variant: "wide" | "narrow";
  /** False in static export and inside a ghost: draw the affordance, no button. */
  interactive: boolean;
  /** Inside a ghost preview: draw a plain node, no glow or nested ghost. */
  ghost: boolean;
  open?: (id: string) => void;
}

export const DrillContext = /*#__PURE__*/ createContext<DrillContextValue | null>(null);

export const useDrill = () => useContext(DrillContext);
