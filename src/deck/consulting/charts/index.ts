// The consulting charts, one file per chart; `shared.tsx` holds the frame, text and fills they draw with.
export { Annotation, annotationGeometry, type AnnotationGeometry, type AnnotationProps, type ChartCallout } from "./Annotation";
export { BarChart, type BarChartProps, type BarDatum } from "./BarChart";
export { KpiTiles, Sparkline, type KpiDelta, type KpiItem } from "./KpiTiles";
export { LineChart, type LineChartProps, type LineSeries } from "./LineChart";
export { Matrix2x2, type Matrix2x2Props, type MatrixAxis, type MatrixPoint } from "./Matrix2x2";
export { StackedBar, type StackedBarProps } from "./StackedBar";
export { Waterfall, type WaterfallProps } from "./Waterfall";
export type { ChartSize } from "./shared";
