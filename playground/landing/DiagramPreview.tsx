// The parts bento's diagram tile: the agent-loop preset from uipack/presets, drawn live at the
// tile's width with quiet chrome (no title, no Open canvas), its packets running, hover live.
import { useId } from "react";
import { Figure } from "../../src";
import { agentLoopParts, defaultAgentLoop } from "../../src/presets";
import "../../src/theme.css";

export default function DiagramPreview() {
  const id = `landing-loop-${useId().replace(/:/g, "")}`;
  const parts = agentLoopParts(defaultAgentLoop, id);
  return (
    <Figure
      chrome="quiet"
      controls={false}
      viewBox={parts.viewBox}
      narrow={parts.narrow}
      narrowViewBox={parts.narrowViewBox}
      legend={parts.legend}
      alt={defaultAgentLoop.figure.alt}
    >
      {parts.wide}
    </Figure>
  );
}
