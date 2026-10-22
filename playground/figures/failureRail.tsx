import { Defs, Figure, Node } from "../../src";

// STUB: replaced by the ported reference example.
export function FailureRailFigure({ number }: { number: string }) {
  return (
    <Figure number={number} eyebrow="FailureRail" title="FailureRail" viewBox="0 0 1120 160" alt="FailureRail placeholder.">
      <Defs id="failureRail" />
      <Node x={440} y={56} w={240} h={48} label="FailureRail" />
    </Figure>
  );
}
