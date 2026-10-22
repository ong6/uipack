// DrillFigure's header pieces: the breadcrumb trail of levels and the row of controls.
import type { Ref } from "react";
import { PauseGlyph, PlayGlyph, ReplayGlyph } from "../Figure";
import type { DrillPath } from "./model";

const BackGlyph = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M7.5 2.5 4 6l3.5 3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Each level above the current one is a button back to it; the current one takes focus after a move up. */
export function DrillCrumbs({
  crumbs,
  labelOf,
  navigate,
  currentRef,
}: {
  crumbs: DrillPath;
  labelOf: (id: string) => string;
  navigate: (path: DrillPath) => void;
  currentRef: Ref<HTMLSpanElement>;
}) {
  const depth = crumbs.length - 1;
  return (
    <nav className="uipack-drill__crumbs" aria-label="Figure levels">
      <ol>
        {crumbs.map((lid, i) => (
          <li key={lid}>
            {i > 0 ? (
              <span className="uipack-drill__sep" aria-hidden="true">
                ›
              </span>
            ) : null}
            {i < depth ? (
              <button type="button" className="uipack-drill__crumb" onClick={() => navigate(crumbs.slice(0, i + 1))}>
                {labelOf(lid)}
              </button>
            ) : (
              <span className="uipack-drill__here" aria-current="location" tabIndex={-1} ref={currentRef}>
                {labelOf(lid)}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface DrillControlsProps {
  /** The level Back returns to; none at the root. */
  parentLabel: string | null;
  onBack: () => void;
  /** Open canvas, when the figure is expandable and not already open. */
  onOpen: (() => void) | null;
  openerRef: Ref<HTMLButtonElement>;
  /** Replay and Pause/Play, unless the figure hides them or the viewer asks for reduced motion. */
  motion: { playing: boolean; replay: () => void; toggle: () => void } | null;
}

export function DrillControls({ parentLabel, onBack, onOpen, openerRef, motion }: DrillControlsProps) {
  return (
    <div className="uipack__controls">
      {parentLabel !== null ? (
        <button type="button" className="uipack__ctl uipack-drill__back" aria-label={`Back to ${parentLabel}`} onClick={onBack}>
          <BackGlyph /> Back
        </button>
      ) : null}
      {onOpen ? (
        <button type="button" className="uipack__ctl" ref={openerRef} onClick={onOpen}>
          Open canvas
        </button>
      ) : null}
      {motion ? (
        <>
          <button type="button" className="uipack__ctl uipack__ctl--motion" onClick={motion.replay}>
            <ReplayGlyph /> Replay
          </button>
          <button
            type="button"
            className="uipack__ctl uipack__ctl--motion"
            onClick={motion.toggle}
            aria-pressed={!motion.playing}
          >
            {motion.playing ? <PauseGlyph /> : <PlayGlyph />} {motion.playing ? "Pause" : "Play"}
          </button>
        </>
      ) : null}
    </div>
  );
}
