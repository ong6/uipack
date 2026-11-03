import { CurvePlot, Figure, type CurvePoint } from "../../src";

// Annotated curve: one trend, three callouts. Adapted from the chart treatment
// in OpenAI's "Scaling Git at OpenAI" (2026-11): arrowed axes, tracked mono
// titles, one ink curve and a bracket for the part that never goes away.
// Made ours: the dot-grid ground, pinned mono callouts and the accent ring.
// Neutral content.

const POINTS: CurvePoint[] = [
  [0, 0.86],
  [0.1, 0.86],
  [0.14, 0.8],
  [0.18, 0.5],
  [0.22, 0.2],
  [0.26, 0.11],
  [0.3, 0.1],
  [0.36, 0.1],
  [1, 0.1],
];

const NOTES = [
  { at: 0.06, label: "Nothing cached", dy: 28 },
  { at: 0.26, label: "Cache the index", accent: true, dy: 40 },
];
// On a phone the pins stand taller so the two right-hand labels stack, not collide.
const NARROW_NOTES = [
  { at: 0.06, label: "Nothing cached", dy: 24 },
  { at: 0.26, label: "Cache the index", accent: true, dy: 76 },
];

export function AnnotatedCurveFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Annotated curve"
      title="Caching one index removes most of the download"
      caption="Read the shape, not the values: the download falls steeply once the index is cached, then flattens. What is left is data that changed since the last visit, which no cache can save."
      controls={false}
      viewBox="0 0 1104 408"
      narrow={
        <CurvePlot
          x={40}
          y={40}
          w={292}
          h={252}
          points={POINTS}
          yTitle="Download"
          xTitle="Cached"
          xEnds={["None", "All"]}
          notes={NARROW_NOTES}
          measure={{ at: 0.86, label: "Changed data" }}
          size={14}
        />
      }
      narrowViewBox="0 0 360 360"
      alt="A line chart of download size against how much is cached. With nothing cached the download is at its largest. It falls steeply and flattens once the index is cached, the highlighted point. The remaining height, marked as changed data, stays the same however much more is cached."
    >
      <CurvePlot
        x={232}
        y={48}
        w={640}
        h={300}
        points={POINTS}
        yTitle="Download size"
        xTitle="Items cached"
        xEnds={["None", "All"]}
        notes={NOTES}
        measure={{ at: 0.76, label: "Changed data" }}
      />
    </Figure>
  );
}
