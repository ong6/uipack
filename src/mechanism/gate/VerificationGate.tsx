import * as React from "react";
import { usePrefersReducedMotion } from "../../env";
import { LIMIT } from "./model";
import { stillScene, type GatePose } from "./motion";
import { GateArt } from "./GateArt";
import { useGateLoop } from "./useGateLoop";
import { MechanismFrame } from "../MechanismFrame";

export type { GatePose } from "./motion";

export interface GateMachineProps {
  /** What the machine shows. Controlled: change it per slide and the machine moves there smoothly. */
  pose?: GatePose;
  /** Sets the palette on the machine's own root; omit it to follow an ancestor's `data-theme`. */
  theme?: "light" | "dark";
  /** "none" holds each pose's still frame, as reduced motion does. */
  motion?: "auto" | "none";
  /** false renders one still frame of the pose: no loops, observers or handlers (deck thumbnails). */
  interactive?: boolean;
  /** The SVG's accessible description (as Figure's `alt`); a default describes the machine. */
  alt?: string;
  /** Called with the readout text whenever it changes. */
  onReadout?: (text: string) => void;
  className?: string;
}

export interface VerificationGateProps extends GateMachineProps {
  /** false renders the bare machine with no card, for a slide that places it itself. */
  frame?: boolean;
  /** Top-left corner, as Figure's `number`: "Fig 1". */
  number?: string;
  title?: string;
  hint?: React.ReactNode;
  caption?: React.ReactNode;
}

const LABEL =
  "A verification gate on a bench. Proposal tokens, machined pucks of different heights, leave a hopper on a short conveyor belt and stop under a dial indicator on a bridge. Its plunger rides up onto each token and the needle reads the token's height against a limit mark at 6. A token at or under the limit rides on and drops into the result tray. A taller one is pushed off the belt by a swinging arm into a chute that slides it back to a return tray beside the hopper, to be revised and fed again.";

export const GATE_CAPTION =
  "Illustrative, not data from a real system. A dial indicator measures every proposal before it can become a result: tokens at or under the limit (6.0) ride on to the result tray, taller ones are swung into the return chute and slide back to the hopper's tray, to be revised and tried again.";

const HINTS: Record<GatePose, string> = {
  idle: "Tap or Space to pause",
  pass: "Tap or Space to run again",
  return: "Tap or Space to run again",
  apart: "Tap or Space to reassemble",
};

function useId() {
  const id = React.useId();
  return `um${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** The verification gate without its card. */
/** `bare` (internal): the machine is its own styled root; VerificationGate passes false inside its card, which carries the theme. */
export function GateMachine({
  pose = "idle",
  theme,
  motion = "auto",
  interactive = true,
  alt = LABEL,
  onReadout,
  className,
  bare = true,
}: GateMachineProps & { bare?: boolean }) {
  const uid = useId();
  const animated = interactive && motion === "auto";
  // The viewer's setting, read once per change rather than through matchMedia on every frame.
  const reduced = usePrefersReducedMotion();
  const { root, live, shown, paused, act } = useGateLoop({ pose, motion, interactive, reduced, onReadout });
  const hint = HINTS[pose];

  const machine = (
    <div
      ref={root}
      className={`um-machine${bare ? " uipack-mechanism" : ""}${className ? ` ${className}` : ""}`}
      data-theme={bare ? theme : undefined}
      data-pose={pose}
      data-interactive={interactive ? "" : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Verification gate, ${pose} pose. ${hint}.` : undefined}
      aria-describedby={interactive ? `${uid}-title` : undefined}
      onClick={interactive ? act : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                if (!event.repeat) act();
              }
            }
          : undefined
      }
    >
      <GateArt uid={uid} alt={alt} shown={shown} fit={!interactive} />
      {interactive ? <span ref={live} className="um-hidden" aria-live="polite" /> : null}
    </div>
  );
  // The idle tour loops for as long as it is on screen, so it carries a visible Pause control
  // (WCAG 2.2.2), beside the machine rather than inside it: the machine is a button already.
  if (!animated || reduced || pose !== "idle") return machine;
  const control = (
    <button type="button" className="um-motion" onClick={act}>
      {paused ? "Resume motion" : "Pause motion"}
    </button>
  );
  return bare ? (
    <div className="uipack-mechanism um-live" data-theme={theme}>
      {machine}
      {control}
    </div>
  ) : (
    <>
      {machine}
      {control}
    </>
  );
}

/**
 * The verification gate for an agent-harness talk: proposals leave a hopper,
 * a dial indicator measures each against a limit, passing ones reach the
 * result tray and failing ones are swung into a chute back to the hopper.
 */
export function VerificationGate({
  frame = true,
  number = "Fig 1",
  title = "Verification gate",
  hint,
  caption = GATE_CAPTION,
  theme,
  ...machine
}: VerificationGateProps) {
  const pose = machine.pose ?? "idle";
  if (!frame) return <GateMachine {...machine} theme={theme} />;
  const interactive = machine.interactive ?? true;
  const shownHint = hint ?? (interactive ? HINTS[pose] : undefined);
  return (
    <MechanismFrame
      number={number}
      title={title}
      hint={shownHint}
      readout={stillScene(pose).readout}
      caption={caption}
      theme={theme}
    >
      <GateMachine {...machine} bare={false} />
    </MechanismFrame>
  );
}

export const GATE_LIMIT = LIMIT;
