import { Defs, Figure, Node } from "../../src";

// STUB: replaced by the ported reference example.
export function NestedGroupsFigure({ number }: { number: string }) {
  return (
    <Figure number={number} eyebrow="NestedGroups" title="NestedGroups" viewBox="0 0 1120 160" alt="NestedGroups placeholder.">
      <Defs id="nestedGroups" />
      <Node x={440} y={56} w={240} h={48} label="NestedGroups" />
    </Figure>
  );
}
