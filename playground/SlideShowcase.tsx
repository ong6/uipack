import { useState } from "react";
import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";
import { SlidePlayer, slideStories } from "../src/slides";
import "../src/slides/slides.css";
import "./slides-showcase.css";

export default function Slides() {
  const params = new URLSearchParams(location.search);
  const [storyId, setStoryId] = useState(
    params.get("story") ?? slideStories[0].id,
  );
  const { theme, flip } = useShowcaseTheme();
  const story = slideStories.find((s) => s.id === storyId) ?? slideStories[0];
  const choose = (id: string) => {
    setStoryId(id);
    const url = new URL(location.href);
    url.searchParams.set("story", id);
    url.searchParams.delete("stop");
    history.replaceState(null, "", url);
  };
  const onStopChange = (id: string) => {
    const url = new URL(location.href);
    url.searchParams.set("stop", id);
    history.replaceState(null, "", url);
  };
  return (
    <ShowcaseShell active="slides" theme={theme} flip={flip}>
      <section className="slides-showcase">
        <h2>Slides · {slideStories.length} examples</h2>
        <p className="slides-showcase__intro">
          Live 3D scenes with camera moves, animated flows, and presentation
          controls.
        </p>
        <nav className="slides-showcase__tabs" aria-label="Example stories">
          {slideStories.map((s, i) => (
            <button
              key={s.id}
              aria-pressed={s.id === story.id}
              onClick={() => choose(s.id)}
            >
              <span>0{i + 1}</span>
              {
                [
                  "Harness dive",
                  "Retrieval layers",
                  "Parallel agents",
                  "Quarter turn",
                  "Staged assembly",
                  "Before / after",
                ][i]
              }
            </button>
          ))}
        </nav>
        <SlidePlayer
          story={story}
          theme={theme}
          defaultStopId={params.get("stop") ?? undefined}
          onStopChange={onStopChange}
          renderMode={params.get("mode") === "diagram" ? "diagram" : "auto"}
          motion={params.get("motion") === "none" ? "none" : "auto"}
        />
        <div className="slides-showcase__below">
          <p>{story.description}</p>
          <p>
            Illustrative systems <span aria-hidden="true">/</span> Use Next, the
            numbered stops, or arrow keys inside the presentation.
          </p>
        </div>
        <details className="slides-showcase__usage">
          <summary>Use in your own deck</summary>
          <pre>{`import { SlidePlayer, harnessDive } from "uipack/slides";\nimport "uipack/slides.css";\n\n<SlidePlayer story={harnessDive} />`}</pre>
          <p>
            Install the optional Three.js and GSAP dependencies for live 3D. Use
            a named stop with <code>SlideScene</code> when another deck controls
            navigation. The main website is a separate integration.
          </p>
        </details>
      </section>
    </ShowcaseShell>
  );
}
