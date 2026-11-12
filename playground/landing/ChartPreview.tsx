// The parts bento's chart tile: the span chart (uipack/charts) with the docs' AI-stack data, without
// its title and caption (the tile names it), scaled into the tile as an inert picture; /charts shows
// it whole, with its filters.
import { SpanChart } from "../../src/charts";
import { aiStack } from "../../examples/aiStack";
import "../../src/charts/charts.css";

export default function ChartPreview() {
  return <SpanChart {...aiStack} id="landing-ai-stack" title={undefined} caption={undefined} headingLevel="none" />;
}
