import { Defs, Figure, Node } from "../../src";

// STUB: replaced by the ported reference example.
export function FlowVolumesFigure({ number }: { number: string }) {
  return (
    <Figure number={number} eyebrow="FlowVolumes" title="FlowVolumes" viewBox="0 0 1120 160" alt="FlowVolumes placeholder.">
      <Defs id="flowVolumes" />
      <Node x={440} y={56} w={240} h={48} label="FlowVolumes" />
    </Figure>
  );
}
