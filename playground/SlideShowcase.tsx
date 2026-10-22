import {
  transferObjectVariant,
  objectDirectionIndex,
  normalizeObjectVariant,
  ObjectScene,
  ObjectInspector,
  AnimationWorkspace,
  objectDirections,
  objectScenes,
  parseObjectVariant,
  type ObjectEdition,
  type ObjectVariant,
} from "../src/objects";
import "../src/objects/objects.css";
import { animationEntries } from "./catalog";
import { useState } from "react";
import { useShowcaseNote, useShowcaseTheme } from "./ShowcaseShell";
import { SlidePlayer, slideStories } from "../src/slides";
import "../src/slides/slides.css";
import "../src/canvas.css";
import "./slides-showcase.css";
import { keepFocusedInView } from "../src/env";

export default function Slides() {
  const params = new URLSearchParams(location.search);
  const surface = params.get("surface") === "page" ? "page" : "styled";
  const defaultStory = location.pathname === "/slides" ? slideStories[0].id : objectScenes[0].id;
  const knownStory = (id: string | null) => !!id && [...objectScenes, ...slideStories].some((s) => s.id === id);
  const [storyId, setStoryId] = useState(() => (knownStory(params.get("story")) ? params.get("story")! : defaultStory));
  const { theme } = useShowcaseTheme();
  const [variant, setVariant] = useState<ObjectVariant>(parseObjectVariant(params.get("variant")));
  const [edition, setEdition] = useState<ObjectEdition>(
    ["0", "1", "2"].includes(params.get("edition") ?? "") ? (Number(params.get("edition")) as ObjectEdition) : 0,
  );
  const chooseEdition = (next: ObjectEdition) => {
    setEdition(next);
    const url = new URL(location.href);
    url.searchParams.set("edition", String(next));
    history.replaceState(null, "", url);
  };
  const chooseDirection = (next: ObjectVariant) => {
    setVariant(next);
    const url = new URL(location.href);
    url.searchParams.set("variant", String(next));
    history.replaceState(null, "", url);
  };
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const entries = animationEntries.filter(
    (e) =>
      (category === "All" || e.tags.includes(category)) &&
      `${e.title} ${e.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()),
  );
  const object = objectScenes.find((s) => s.id === storyId);
  const story = slideStories.find((s) => s.id === storyId) ?? slideStories[0];
  // A bad ?story= or ?variant= says what it fell back to, like the deck's "not found" line. It reads
  // the address each render, so it goes once a choice rewrites the address.
  const current = new URLSearchParams(location.search);
  const badStory = current.get("story");
  const badVariant = current.get("variant");
  const notFound: string[] = [];
  if (badStory !== null && !knownStory(badStory))
    notFound.push(`Story “${badStory}” not found, showing ${object?.title ?? story.title}.`);
  // A variant names an art direction only if it parses and the object has it (contact keeps five).
  // A slide story has one look; it keeps a valid variant in the address (carried between stories)
  // without comment, but says so for one that names nothing.
  const parsedVariant = parseObjectVariant(badVariant);
  if (badVariant !== null && !object && String(parsedVariant) !== badVariant)
    notFound.push(`Variant “${badVariant}” not found, showing ${story.title} in its one look.`);
  else if (
    object &&
    badVariant !== null &&
    (String(parsedVariant) !== badVariant || normalizeObjectVariant(object.id, parsedVariant) !== parsedVariant)
  )
    notFound.push(
      `Variant “${badVariant}” not found, showing ${objectDirections[objectDirectionIndex(object.id, variant)].name}.`,
    );
  useShowcaseNote(notFound.length ? notFound.join(" ") : null);
  const clearFilters = () => {
    setQuery("");
    setCategory("All");
  };
  const choose = (id: string) => {
    const nextObject = objectScenes.find((item) => item.id === id);
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
    <>
      <section className="slides-showcase">
        <h2>Scene library and preview</h2>
        <AnimationWorkspace
          theme={theme}
          library={
            <>
              <h3>Animation library</h3>
              <div className="catalog-filters">
                <label>
                  Search animations
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Topic or technique"
                  />
                </label>
                <label>
                  Technique
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {["All", "Camera", "Layers", "Transform", "Objects"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <span role="status">{entries.length} examples</span>
              </div>
              <nav className="uipack-scene-list" aria-label="Example stories" onFocus={keepFocusedInView}>
                {entries.map((entry) => (
                  <button key={entry.id} aria-pressed={entry.id === storyId} onClick={() => choose(entry.id)}>
                    {entry.title}
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </nav>
              {entries.length === 0 && (
                <div className="slides-showcase__empty">
                  <p>
                    Nothing matches{query ? ` “${query}”` : ""}
                    {category !== "All" ? ` in ${category}` : ""}.
                  </p>
                  <button type="button" onClick={clearFilters}>
                    {category !== "All" && query ? "Clear filters" : category !== "All" ? "Show all techniques" : "Clear search"}
                  </button>
                </div>
              )}
            </>
          }
        >
          <header className="uipack-animation-heading">
            <h3>{object?.title ?? story.title}</h3>
            <span>{object ? "Live 3D preview" : "Guided animation"}</span>
          </header>
          <div className={object ? "uipack-object-review" : undefined}>
            {object ? (
              <div className="uipack-gallery-stage">
                <ObjectScene
                  key={object.id}
                  kind={object.id}
                  label={object.title}
                  surface={surface}
                  theme={theme}
                  variant={normalizeObjectVariant(object.id, variant)}
                  edition={edition}
                />
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
            {object && (
              <ObjectInspector
                kind={object.id}
                variant={normalizeObjectVariant(object.id, variant)}
                edition={edition}
                onVariantChange={chooseDirection}
                onEditionChange={chooseEdition}
              />
            )}
          </div>
          <div className="slides-showcase__below">
            <p>
              {object && objectDirectionIndex(object.id, variant) !== 0
                ? `${objectDirections[objectDirectionIndex(object.id, variant)].description} Original animated study; no live data.`
                : (object?.description ?? story.description)}
            </p>
            <p>
              {object
                ? objectDirectionIndex(object.id, variant) !== 0 || object.id === "tennis" || object.id === "trading"
                  ? "Continuous motion. Pause and resume at your own pace."
                  : "One sequence, then rest. Pause or replay at your own pace."
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
              Install the optional Three.js and GSAP dependencies for live 3D. Use a named stop with <code>SlideScene</code> when
              another deck controls navigation. For a complete title, argument, figure, and closing sequence, see the
              Presentations collection.
            </p>
          </details>
        </AnimationWorkspace>
      </section>
    </>
  );
}
