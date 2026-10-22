import { Defs, Figure, Node } from "../../src";

// STUB: replaced by the ported reference example.
export function LayeredChecksFigure({ number }: { number: string }) {
  return (
    <Figure number={number} eyebrow="LayeredChecks" title="LayeredChecks" viewBox="0 0 1120 160" alt="LayeredChecks placeholder.">
      <Defs id="layeredChecks" />
      <Node x={440} y={56} w={240} h={48} label="LayeredChecks" />
    </Figure>
  );
}
