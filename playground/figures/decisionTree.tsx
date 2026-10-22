import { Defs, Figure, Node } from "../../src";

// STUB: replaced by the ported reference example.
export function DecisionTreeFigure({ number }: { number: string }) {
  return (
    <Figure number={number} eyebrow="DecisionTree" title="DecisionTree" viewBox="0 0 1120 160" alt="DecisionTree placeholder.">
      <Defs id="decisionTree" />
      <Node x={440} y={56} w={240} h={48} label="DecisionTree" />
    </Figure>
  );
}
