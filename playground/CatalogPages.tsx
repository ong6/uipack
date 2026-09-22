import { Figure, Node, Connector, Defs, Label } from "../src";
import { useState } from "react";
import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";
import { visualStyles } from "./catalog";
import { SlideScene, harnessDive } from "../src/slides";
import { SlideStarter } from "../src/presentations";
import { presentationStarters } from "./presentationExamples";
import "../src/slides/slides.css";
import "../src/presentations/presentations.css";
import "./presentations.css";

const chapters = [
  {
    name: "Opening",
    eyebrow: "Agent systems",
    title: "A model is only the beginning.",
    text: "The harness turns a proposal into a bounded action, and an action into an outcome we can inspect.",
    stop: "outside",
    kind: "opening",
  },
  {
    name: "Argument",
    eyebrow: "The design problem",
    title: "Every action needs a boundary.",
    text: "Separate what the model proposes from what the system permits. Keep the evidence that connects the two.",
    stop: "inside",
    kind: "argument",
  },
  {
    name: "Explanation",
    eyebrow: "Inside the system",
    title: "Give context. Bound the action. Keep the proof.",
    text: "Use one visual to explain the responsibilities around the model. Reveal details at the pace of the argument.",
    stop: "action",
    kind: "explanation",
  },
  {
    name: "Comparison",
    eyebrow: "Before / after",
    title: "Make verification part of the path.",
    text: "A plausible response and a verified outcome are different deliverables.",
    stop: "result",
    kind: "comparison",
  },
  {
    name: "Closing",
    eyebrow: "A practical starting point",
    title: "One goal. One bounded workflow. One inspectable result.",
    text: "Choose a workflow, define the checks, and demonstrate the evidence before expanding the system.",
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
      <Node
        x={24}
        y={190}
        w={96}
        h={56}
        label="Proposal"
        size={12}
        flow="after"
      />
      <Node
        x={152}
        y={190}
        w={96}
        h={56}
        label="Check"
        size={12}
        accent
        flow="after"
      />
      <Node
        x={280}
        y={190}
        w={96}
        h={56}
        label="Result"
        size={12}
        flow="after"
      />
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

export default function CatalogPages() {
  const { theme, flip } = useShowcaseTheme();
  const styles = location.pathname.replace(/\/$/, "") === "/styles";
  const [index, setIndex] = useState(0);
  const [starterIndex, setStarterIndex] = useState(0);
  const chapter = chapters[index];
  const starter = presentationStarters[starterIndex];
  return (
    <ShowcaseShell
      active={styles ? "styles" : "presentations"}
      theme={theme}
      flip={flip}
    >
      {styles ? (
        <section>
          <h2>Visual styles</h2>
          <p className="collection-intro">
            Choose a visual language first, then explore its figures, assets,
            and animations. Light and dark are themes within a style.
          </p>
          <div className="style-grid">
            {visualStyles.map((style) => (
              <article className="style-card" key={style.id}>
                <div className="style-swatch" data-style={style.id} aria-hidden="true">
                  <span>{style.id === "technical" ? "Request" : style.name}</span>
                  <i>→</i>
                  <span>{style.id === "technical" ? "System" : "3D"}</span>
                  <i>→</i>
                  <span>{style.id === "technical" ? "Evidence" : "Motion"}</span>
                </div>
                <h3>{style.name}</h3>
                <p>{style.description}</p>
                <div>
                  {style.id === 'technical' ? <>
                    <a href={`/?theme=${theme}`}>Figures</a>
                    <a href={`/animations?theme=${theme}`}>3D animations</a>
                    <a href={`/presentations?theme=${theme}`}>Presentations</a>
                  </> : <a href={`/animations?story=travel&variant=${'variant' in style ? style.variant : 0}&theme=${theme}`}>Explore six animated studies</a>}
                </div>
              </article>
            ))}
          </div>
          <p className="collection-intro">
            Technical diagrams and six object art directions. Each object direction has its own models, materials, perspective and motion.
          </p>
        </section>
      ) : (
        <section>
          <h2>Presentations · Technical style</h2>
          <p className="collection-intro">
            A complete narrative example: opening, argument, visual explanation,
            comparison, and closing. Animation supports the story.
          </p>
          <h3>Slide and speech starters</h3>
          <p className="collection-intro">
            Choose a layout to see the designed slide and the talk track that goes
            with it. The reusable component accepts content; these words belong to
            the playground example.
          </p>
          <nav className="deck-chapters" aria-label="Slide starter layouts">
            {presentationStarters.map((slide, i) => (
              <button
                key={slide.id}
                aria-pressed={i === starterIndex}
                onClick={() => setStarterIndex(i)}
              >
                {slide.title}
              </button>
            ))}
          </nav>
          <SlideStarter slide={starter} theme={theme} />
          <h3 className="deck-example-heading">Complete narrative example</h3>
          <nav className="deck-chapters" aria-label="Presentation chapters">
            {chapters.map((c, i) => (
              <button
                key={c.name}
                aria-current={i === index ? "step" : undefined}
                onClick={() => setIndex(i)}
              >
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
                setIndex((i) =>
                  Math.max(
                    0,
                    Math.min(
                      chapters.length - 1,
                      i + (e.key === "ArrowRight" ? 1 : -1),
                    ),
                  ),
                );
              }
            }}
          >
            <div className="composed-deck__copy" aria-live="polite">
              <p className="deck-eyebrow">{chapter.eyebrow}</p>
              <h1>{chapter.title}</h1>
              <p>{chapter.text}</p>
              {chapter.kind === "argument" && (
                <ol>
                  <li>Supply relevant context</li>
                  <li>Limit available actions</li>
                  <li>Verify observable results</li>
                </ol>
              )}
              {chapter.kind === "comparison" && (
                <div className="deck-comparison">
                  <div>
                    <h3>Direct output</h3>
                    <p>Proposal → response</p>
                  </div>
                  <div>
                    <h3>Verified output</h3>
                    <p>Proposal → action → evidence → response</p>
                  </div>
                </div>
              )}
              {chapter.kind === "closing" && (
                <p className="deck-takeaway">
                  Next decision: which workflow should we prove first?
                </p>
              )}
            </div>
            <div
              className="composed-deck__visual"
              hidden={
                chapter.kind === "comparison" || chapter.kind === "closing"
              }
            >
              <SlideScene
                story={harnessDive}
                stopId={chapter.stop}
                theme={theme}
              />
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
            <button
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              Previous chapter
            </button>
            <button
              disabled={index === chapters.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next chapter
            </button>
          </div>
          <p className="collection-intro">
            This is a composition example, not a slide editor. Use Figure for 2D
            diagrams and SlideScene for 3D within these layouts. Both support
            separate canvas inspection.
          </p>
        </section>
      )}
    </ShowcaseShell>
  );
}
