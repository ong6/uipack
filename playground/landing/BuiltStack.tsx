// "How it's built": docs/README.md's layers as a LayerStack (uipack/charts), bottom to top, each
// band a link to the page that documents the layer.
import { LayerStack } from "../../src/charts";
import { pageDefs, pageHref } from "../catalog";
import { LAYER_ZONES, LAYERS } from "./content";
import "../../src/charts/charts.css";

export default function BuiltStack({ theme }: { theme: string }) {
  const href = (id: string) =>
    pageHref(
      pageDefs.find((p) => p.id === id)!,
      theme,
    );
  return (
    <LayerStack
      id="landing-stack"
      headingLevel="none"
      zones={LAYER_ZONES.map((z) => ({ ...z }))}
      layers={LAYERS.map((l) => ({ id: l.id, label: l.label, zone: l.zone, summary: l.summary, href: href(l.page) }))}
      labels={{ go: "Open the page" }}
    />
  );
}
