import "../src/theme.css";
import "../src/canvas.css";
import { Figure, Node, Connector, Defs, Label } from "../src";
import { useState } from "react";
import { useShowcaseTheme } from "./ShowcaseShell";
import { visualStyles, writtenStyleSpecs } from "./catalog";
import { SlideScene, harnessDive } from "../src/slides";
import { SlideStarter } from "../src/presentations";
import { presentationStarters } from "./presentationExamples";
import { StylePreview } from "./StylePreviews";
import "../src/slides/slides.css";
import "../src/presentations/presentations.css";
import "./presentations.css";

// Each object card opens the travel study in its own direction, the scene its still shows.
/** Docs link to the repository, as the Foundations pages do. */
const REPO = "https://github.com/ong6/uipack/blob/main";

const objectLinks = {
  studio: "Open the woodland atlas",
  "paper-theatre": "Open the alpine passage",
  kinetic: "Open the armillary globe",
  cartoon: "Open the island express",
  realistic: "Open the field compass",
  abstract: "Open the glass passage",
};

/* A talk given from the slides: short titles, the points the speaker talks from, no eyebrow or lede. */
const chapters = [
  {
    name: "Opening",
    title: "The model is the start",
    points: ["Proposal → bounded action", "Action → an outcome we can inspect"],
    stop: "outside",
    kind: "opening",
  },
  {
    name: "Argument",
    title: "Every action needs a boundary",
    points: ["Supply relevant context", "Limit available actions", "Verify observable results"],
    stop: "inside",
    kind: "argument",
  },
  {
    name: "Explanation",
    title: "Inside the harness",
    points: ["Context goes in", "The action stays in bounds", "Proof comes out"],
    stop: "action",
    kind: "explanation",
  },
  {
    name: "Comparison",
    title: "Plausible or verified?",
    points: ["A response can sound right", "A verified outcome carries its evidence"],
    stop: "result",
    kind: "comparison",
  },
  {
    name: "Closing",
    title: "Start with one workflow",
    points: ["Pick it", "Define the checks", "Show the evidence, then expand"],
    stop: "result",
    kind: "closing",
  },
];

function VerificationFigure() {
  const drawing = (
    <>
      <Defs id="deck-verify" />
      <Label x={24} y={30} text="Before · direct response" />
      <Node x={24} y={48} w={148} h={52} label="Proposal" flow="before" />
      <Node x={228} y={48} w={148} h={52} label="Response" flow="before" />
      <Connector
        points={[
          [172, 74],
          [228, 74],
        ]}
        defs="deck-verify"
        kind="request"
        flow="before"
      />
      <Label x={24} y={168} text="After · verify the evidence" />
      <Node x={24} y={190} w={96} h={56} label="Proposal" size={12} flow="after" />
      <Node x={152} y={190} w={96} h={56} label="Check" size={12} accent flow="after" />
      <Node x={280} y={190} w={96} h={56} label="Result" size={12} flow="after" />
      <Connector
        points={[
          [120, 218],
          [152, 218],
        ]}
        defs="deck-verify"
        kind="request"
        flow="after"
      />
      <Connector
        points={[
          [248, 218],
          [280, 218],
        ]}
        defs="deck-verify"
        kind="response"
        flow="after"
      />
    </>
  );
  return (
    <Figure
      title="Where the check belongs"
      viewBox="0 0 400 280"
      controls={false}
      alt="Before: proposal flows to response. After: a check separates proposal from result."
    >
      {drawing}
    </Figure>
  );
}

export default function CatalogShowcase() {
  const { theme } = useShowcaseTheme();
  const styles = location.pathname.replace(/\/$/, "") === "/styles";
  const [index, setIndex] = useState(0);
  const [starterIndex, setStarterIndex] = useState(0);
  const chapter = chapters[index];
  const starter = presentationStarters[starterIndex];
  return (
    <>
      {styles ? (
        <section>
          <h2>Visual styles</h2>
          <p className="collection-intro">
            Choose a visual language first, then explore its diagrams, icons, and animations. Light and dark are themes within a
            style.
          </p>
          <div className="style-grid">
            {visualStyles.map((style) => (
              <article className="style-card" key={style.id}>
                <StylePreview id={style.id} theme={theme} />
                <h3>{style.name}</h3>
                <p>{style.description}</p>
                <div>
                  {style.id === "technical" ? (
                    <>
                      <a href={`/?theme=${theme}`}>Diagrams</a>
                      <a href={`/animations?theme=${theme}`}>3D animations</a>
                      <a href={`/presentations?theme=${theme}`}>Presentations</a>
                      <a href={`/web?theme=${theme}`}>Product page</a>
                      <a href={`/deck?theme=${theme}`}>Deck</a>
                    </>
                  ) : style.id === "mechanism" ? (
                    <a href={`/mechanism?theme=${theme}`}>Verification gate machine</a>
                  ) : (
                    <a href={`/animations?story=travel&variant=${"variant" in style ? style.variant : 0}&theme=${theme}`}>
                      {objectLinks[style.id as keyof typeof objectLinks]}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className="collection-intro style-grid__note">
            Technical diagrams and web pages, Mechanism machines, and six object art directions. Each object direction has its own
            models, materials, perspective and motion.
          </p>
          <h2 className="style-specs__heading">Written style specs</h2>
          <p className="collection-intro">
            Technical is the one implemented web style. Landing and Graphical are written specs that fill the same role contract;
            an agent builds a new style from a spec by adding one value set in <code>src/styles</code>, registering it in{" "}
            <code>uiStyles</code>, and testing it (<a href={`${REPO}/docs/system/styles/README.md`}>how</a>).
          </p>
          <ul className="style-specs">
            {writtenStyleSpecs.map((spec) => (
              <li key={spec.id} className="style-spec">
                <h3>{spec.name}</h3>
                <p>{spec.description}</p>
                <a href={`${REPO}/${spec.spec}`}>Read the {spec.name} spec</a>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section>
          <h2>Slide and speech starters</h2>
          <p className="collection-intro">
            Choose a layout to see the designed slide and the talk track that goes with it. The reusable component accepts
            content; these words belong to the playground example.
          </p>
          <nav className="deck-chapters" aria-label="Slide starter layouts">
            {presentationStarters.map((slide, i) => (
              <button key={slide.id} aria-pressed={i === starterIndex} onClick={() => setStarterIndex(i)}>
                {slide.title}
              </button>
            ))}
          </nav>
          <SlideStarter slide={starter} theme={theme} />
          <h2 className="deck-example-heading">Complete narrative example</h2>
          <p className="collection-intro">
            Opening, argument, visual explanation, comparison and closing. Animation supports the story.
          </p>
          <nav className="deck-chapters" aria-label="Presentation chapters">
            {chapters.map((c, i) => (
              <button key={c.name} aria-current={i === index ? "step" : undefined} onClick={() => setIndex(i)}>
                {String(i + 1).padStart(2, "0")} {c.name}
              </button>
            ))}
          </nav>
          <section
            className="composed-deck"
            data-layout={chapter.kind}
            tabIndex={0}
            aria-label="Agent systems presentation"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                setIndex((i) => Math.max(0, Math.min(chapters.length - 1, i + (e.key === "ArrowRight" ? 1 : -1))));
              }
            }}
          >
            <div className="composed-deck__copy" aria-live="polite">
              <h3 className="composed-deck__title">{chapter.title}</h3>
              <ul className="composed-deck__points">
                {chapter.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {chapter.kind === "comparison" && (
                <div className="deck-comparison">
                  <div>
                    <h4>Direct output</h4>
                    <p>Proposal → response</p>
                  </div>
                  <div>
                    <h4>Verified output</h4>
                    <p>Proposal → action → evidence → response</p>
                  </div>
                </div>
              )}
              {chapter.kind === "closing" && <p className="deck-takeaway">Which workflow do we prove first?</p>}
            </div>
            <div className="composed-deck__visual" hidden={chapter.kind === "comparison" || chapter.kind === "closing"}>
              <SlideScene story={harnessDive} stopId={chapter.stop} theme={theme} />
            </div>
            {chapter.kind === "comparison" && (
              <div className="composed-deck__figure">
                <VerificationFigure />
              </div>
            )}
            <footer>
              <span>UIPACK · Technical</span>
              <span>
                {index + 1} / {chapters.length}
              </span>
            </footer>
          </section>
          <div className="deck-navigation">
            <button disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
              Previous chapter
            </button>
            <button disabled={index === chapters.length - 1} onClick={() => setIndex((i) => i + 1)}>
              Next chapter
            </button>
          </div>
          <p className="collection-intro">
            This is a composition example, not a slide editor. Use Figure for 2D diagrams and SlideScene for 3D within these
            layouts. Both support separate canvas inspection.
          </p>
        </section>
      )}
    </>
  );
}
