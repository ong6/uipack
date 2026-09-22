import { transferObjectVariant, objectDirectionIndex, normalizeObjectVariant, ObjectScene, ObjectInspector, AnimationWorkspace, objectDirections, objectScenes, parseObjectVariant, type ObjectEdition, type ObjectVariant } from "../src/objects";
import "../src/objects/objects.css";
import { animationEntries } from "./catalog";
import { useState } from "react";
import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";
import { SlidePlayer, slideStories } from "../src/slides";
import "../src/slides/slides.css";
import "./slides-showcase.css";

export default function Slides() {
  const params = new URLSearchParams(location.search);
  const [storyId, setStoryId] = useState(
    params.get("story") ?? (location.pathname === "/slides" ? slideStories[0].id : objectScenes[0].id),
  );
  const { theme, flip } = useShowcaseTheme();
  const [variant, setVariant] = useState<ObjectVariant>(
    parseObjectVariant(params.get("variant")));
  const [edition, setEdition] = useState<ObjectEdition>(["0", "1", "2"].includes(params.get("edition") ?? "") ? Number(params.get("edition")) as ObjectEdition : 0);
  const chooseEdition = (next: ObjectEdition) => {
    setEdition(next);
    const url = new URL(location.href); url.searchParams.set("edition", String(next)); history.replaceState(null, "", url);
  };
  const chooseDirection = (next: ObjectVariant) => {
    setVariant(next);
    const url = new URL(location.href); url.searchParams.set("variant", String(next)); history.replaceState(null, "", url);
  };
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const entries = animationEntries.filter(
    (e) =>
      (category === "All" || e.tags.includes(category)) &&
      `${e.title} ${e.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const object = objectScenes.find((s) => s.id === storyId);
  const story = slideStories.find((s) => s.id === storyId) ?? slideStories[0];
  const choose = (id: string) => {
    const nextObject = objectScenes.find(item => item.id === id);
    const nextVariant = object && nextObject ? transferObjectVariant(object.id, nextObject.id, variant) : variant;
    setVariant(nextVariant);
    setStoryId(id);
    const url = new URL(location.href);
    url.searchParams.set("story", id);
    url.searchParams.set("variant", String(nextVariant));
    url.searchParams.delete("stop");
    history.replaceState(null, "", url);
  };
  const onStopChange = (id: string) => {
    const url = new URL(location.href);
    url.searchParams.set("stop", id);
    history.replaceState(null, "", url);
  };
  return (
    <ShowcaseShell active="animations" theme={theme} flip={flip}>
      <section className="slides-showcase">
        <h2>3D animations · {animationEntries.length} examples</h2>
        <p className="slides-showcase__intro">
          Live 3D scenes with camera moves, animated flows, and presentation
          controls.
        </p>
        <AnimationWorkspace theme={theme} library={<>
        <h3>Animation library</h3>
        <div className="catalog-filters">
          <label>
            Search animations
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by topic or technique"
            />
          </label>
          <label>
            Technique
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["All", "Camera", "Layers", "Transform", "Objects"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <span role="status">{entries.length} examples</span>
        </div>
        <nav className="uipack-scene-list" aria-label="Example stories">
          {entries.map((entry) => (
            <button
              key={entry.id}
              aria-pressed={entry.id === storyId}
              onClick={() => choose(entry.id)}
            >
              {entry.title}
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </nav>
        {entries.length === 0 && (
          <p>No matching examples. Try another search or technique.</p>
        )}
        </>}>
        <header className="uipack-animation-heading"><h3>{object?.title ?? story.title}</h3><span>{object ? 'Live 3D preview' : 'Guided animation'}</span></header>
        <div className={object ? "uipack-object-review" : undefined}>
        {object ? (
          <div className="uipack-gallery-stage">
            <ObjectScene key={object.id} kind={object.id} label={object.title} theme={theme} variant={normalizeObjectVariant(object.id, variant)} edition={edition} />
          </div>
        ) : (
          <SlidePlayer
            story={story}
            theme={theme}
            defaultStopId={params.get("stop") ?? undefined}
            onStopChange={onStopChange}
            renderMode={params.get("mode") === "diagram" ? "diagram" : "auto"}
            motion={params.get("motion") === "none" ? "none" : "auto"}
          />
        )}
        {object && <ObjectInspector kind={object.id} variant={normalizeObjectVariant(object.id, variant)} edition={edition} onVariantChange={chooseDirection} onEditionChange={chooseEdition} />}
        </div>
        <div className="slides-showcase__below">
          <p>{object && objectDirectionIndex(object.id, variant) !== 0 ? `${objectDirections[objectDirectionIndex(object.id, variant)].description} Original animated study; no live data.` : object?.description ?? story.description}</p>
          <p>
            {object
              ? (objectDirectionIndex(object.id, variant) !== 0 || object.id === "tennis" || object.id === "trading" ? "Continuous motion. Pause and resume at your own pace." : "One sequence, then rest. Pause or replay at your own pace.")
              : "Illustrative systems / Use Next, the numbered stops, or arrow keys inside the presentation."}
          </p>
        </div>
        <details className="slides-showcase__usage">
          <summary>Use this animation</summary>
          <pre>
            {object
              ? `import { ObjectScene } from "uipack/objects";\nimport "uipack/objects.css";\n\n<ObjectScene kind="${object.id}" label="${object.title}" variant={${normalizeObjectVariant(object.id, variant)}} edition={${edition}} />`
              : `import { SlidePlayer, harnessDive } from "uipack/slides";\nimport "uipack/slides.css";\n\n<SlidePlayer story={harnessDive} />`}
          </pre>
          <p>
            Install the optional Three.js and GSAP dependencies for live 3D. Use
            a named stop with <code>SlideScene</code> when another deck controls
            navigation. For a complete title, argument, figure, and closing
            sequence, see the Presentations collection.
          </p>
        </details>
        </AnimationWorkspace>
      </section>
    </ShowcaseShell>
  );
}
