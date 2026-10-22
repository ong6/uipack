import { Defs, Figure, Node } from "../../src";

// STUB: replaced by the ported reference example.
export function FanOutFanInFigure({ number }: { number: string }) {
  return (
    <Figure number={number} eyebrow="FanOutFanIn" title="FanOutFanIn" viewBox="0 0 1120 160" alt="FanOutFanIn placeholder.">
      <Defs id="fanOutFanIn" />
      <Node x={440} y={56} w={240} h={48} label="FanOutFanIn" />
    </Figure>
  );
}
