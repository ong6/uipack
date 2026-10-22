import { Defs, Figure, Node } from "../../src";

// STUB: replaced by the ported reference example.
export function NumberedStepsFigure({ number }: { number: string }) {
  return (
    <Figure number={number} eyebrow="NumberedSteps" title="NumberedSteps" viewBox="0 0 1120 160" alt="NumberedSteps placeholder.">
      <Defs id="numberedSteps" />
      <Node x={440} y={56} w={240} h={48} label="NumberedSteps" />
    </Figure>
  );
}
