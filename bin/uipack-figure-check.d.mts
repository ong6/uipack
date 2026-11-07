// Types for the figure geometry check (uipack-figure-check.mjs), for the tests that import it.
export interface FigurePlate {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface FigureBox extends FigurePlate {
  kind: "node" | "chip";
}
export interface FigureDrawing {
  name: string;
  drawing: "wide" | "narrow";
  labels: FigurePlate[];
  lines: { pts: [number, number][] }[];
  boxes: FigureBox[];
}
export function figureFindings(fig: Pick<FigureDrawing, "labels" | "lines" | "boxes">): {
  problems: string[];
  unlabelled: string[];
};
export function collectFigures(): FigureDrawing[];
export function main(argv: string[]): Promise<number>;
