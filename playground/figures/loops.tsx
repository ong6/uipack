import { Defs, Figure, Node } from "../../src";

// STUB: replaced by the ported reference example.
export function LoopsFigure({ number }: { number: string }) {
  return (
    <Figure number={number} eyebrow="Loops" title="Loops" viewBox="0 0 1120 160" alt="Loops placeholder.">
      <Defs id="loops" />
      <Node x={440} y={56} w={240} h={48} label="Loops" />
    </Figure>
  );
}
