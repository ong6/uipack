import { useState } from "react";
import { VerificationGate, type GatePose } from "../src/mechanism";
import "../src/mechanism/mechanism.css";
import { mechanismEntries } from "./catalog";
import { useShowcaseTheme } from "./ShowcaseShell";
import "./mechanism-showcase.css";

/* The Mechanism style: one crafted machine, driven by a controlled pose the
   way a deck would drive it per slide, plus the static thumbnails a deck
   renders for every slide. ?pose=idle|pass|return|apart picks the start. */

const POSES: { id: GatePose; label: string; note: string }[] = [
  { id: "idle", label: "Idle tour", note: "Proposals keep coming; the tally grows." },
  { id: "pass", label: "Pass", note: "One proposal measures under the limit and reaches the result tray." },
  { id: "return", label: "Return", note: "One proposal measures over the limit and is swung back toward the hopper." },
  { id: "apart", label: "Apart", note: "The six assemblies come apart on staggered springs." },
];

function initialPose(): GatePose {
  const value = new URLSearchParams(location.search).get("pose");
  return POSES.some((pose) => pose.id === value) ? (value as GatePose) : "idle";
}

export default function MechanismShowcase() {
  const { theme } = useShowcaseTheme();
  const [pose, setPose] = useState<GatePose>(initialPose);
  const choose = (next: GatePose) => {
    setPose(next);
    const url = new URL(location.href);
    url.searchParams.set("pose", next);
    window.history.replaceState(null, "", url);
  };
  const entry = mechanismEntries[0]!;
  return (
    <>
      <section data-catalog-entry={entry.id} id={entry.id} className="mechanism-page">
        <h2>{entry.title}</h2>
        <p className="collection-intro">
          The object is the explanation: an agent proposes, a check stands between proposal and result. Choose a pose the way a slide would; the
          machine moves there from wherever it is.
        </p>
        <div className="mechanism-poses" role="group" aria-label="Pose">
          {POSES.map((item) => (
            <button key={item.id} type="button" aria-pressed={item.id === pose} onClick={() => choose(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="mechanism-note">{POSES.find((item) => item.id === pose)!.note}</p>
        <div className="mechanism-stage">
          <VerificationGate pose={pose} theme={theme} number="Fig 1" title="Verification gate" />
        </div>
      </section>
      <section className="mechanism-page" id="thumbnails">
        <h2>Thumbnails</h2>
        <p className="collection-intro">
          <code>interactive={"{false}"}</code> and <code>frame={"{false}"}</code>: one still frame per pose, no loops and no card, as a deck renders
          its slide strip.
        </p>
        <ul className="mechanism-thumbs">
          {POSES.map((item) => (
            <li key={item.id}>
              <button type="button" aria-pressed={item.id === pose} onClick={() => choose(item.id)} aria-label={`Verification gate, ${item.label} pose`}>
                <span className="mechanism-thumb">
                  <VerificationGate pose={item.id} theme={theme} frame={false} interactive={false} />
                </span>{" "}
                <span className="mechanism-thumb-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
