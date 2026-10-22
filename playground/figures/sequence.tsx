import { Defs, Figure, Node } from "../../src";

// STUB: replaced by the ported reference example.
export function SequenceFigure({ number }: { number: string }) {
  return (
    <Figure number={number} eyebrow="Sequence" title="Sequence" viewBox="0 0 1120 160" alt="Sequence placeholder.">
      <Defs id="sequence" />
      <Node x={440} y={56} w={240} h={48} label="Sequence" />
    </Figure>
  );
}
