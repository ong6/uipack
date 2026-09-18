import { useState } from "react";
import { SlidePlayer, slideStories } from "../src/slides";
import "../src/slides/slides.css";
import "./slides-showcase.css";

export default function Slides() {
  const params = new URLSearchParams(location.search);
  const [storyId, setStoryId] = useState(
    params.get("story") ?? slideStories[0].id,
  );
  const [theme, setTheme] = useState<"dark" | "light">(
    params.get("theme") === "light" ? "light" : "dark",
  );
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
    <div className="slides-showcase" data-theme={theme}>
      <header className="slides-showcase__header">
        <a href="/" className="slides-showcase__brand">
          ui<span>pack</span>
          <small> / slides</small>
        </a>
        <div>
          <a href="/">Figures</a>
          <a href="/assets">Assets</a>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "Light" : "Dark"} theme
          </button>
        </div>
      </header>
      <main className="slides-showcase__main">
        <div className="slides-showcase__intro">
          <div>
            <p className="slides-showcase__eyebrow">Spatial stories</p>
            <h1>Go inside the explanation.</h1>
          </div>
          <p>
            One scene, several points of view. Move through a system without
            losing where you are.
          </p>
        </div>
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
      </main>
    </div>
  );
}
