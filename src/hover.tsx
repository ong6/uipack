import { createContext, useContext } from "react";

export type Flow = string | string[];

export interface FigureHover {
  /** Flow name under the pointer, or null. */
  flow: string | null;
  /** Legend kind under the pointer, or null. */
  kind: string | null;
  setFlow: (flow: string | null) => void;
  setKind: (kind: string | null) => void;
}

const noop = () => {};

export const FigureHoverContext = createContext<FigureHover>({ flow: null, kind: null, setFlow: noop, setKind: noop });

export function useFigureHover(): FigureHover {
  return useContext(FigureHoverContext);
}

export const flowList = (flow?: Flow): string[] => (flow == null ? [] : Array.isArray(flow) ? flow : [flow]);

/**
 * Data attributes for an element that takes part in hover highlighting.
 * `data-state` is "hit" when the element shares the hovered flow or kind,
 * "dim" when something else is hovered, absent when nothing is.
 */
export function hoverAttrs(flow: Flow | undefined, kind: string | undefined, hover: FigureHover) {
  const flows = flowList(flow);
  const attrs: Record<string, string> = {};
  if (flows.length) attrs["data-flow"] = flows.join(" ");
  if (kind) attrs["data-kind"] = kind;
  let state: "hit" | "dim" | undefined;
  if (hover.flow) state = flows.includes(hover.flow) ? "hit" : "dim";
  else if (hover.kind && kind) state = kind === hover.kind ? "hit" : "dim";
  if (state) attrs["data-state"] = state;
  return attrs;
}

/** Ignore touch so a tap does not leave a figure stuck in hover state. */
export const isPointer = (e: { pointerType?: string }) => e.pointerType !== "touch";
