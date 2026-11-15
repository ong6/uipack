import { useState } from "react";
import { ObjectScene, objectScenes, type ObjectKind } from "../src/objects";
import "../src/objects/objects.css";
import { useShowcaseTheme } from "./ShowcaseShell";
import "./objects-showcase.css";

/** Kinds whose 3D subject is still being built: their tiles show the fallback drawing. */
const pending: readonly ObjectKind[] = ["ai", "reading"];

/**
 * `object-subjects` (docs/objects.md): every subject in the one style, ink line art, on the page.
 * Each built subject is held on its first frame (`preload`); the chosen one plays. Choosing another
 * moves playback, never rebuilds a scene.
 */
export function ObjectSubjects() {
  const { theme } = useShowcaseTheme();
  const [playing, setPlaying] = useState<ObjectKind>("travel");
  return (
    <div className="object-subjects" data-theme={theme}>
      {objectScenes.map((scene) => {
        const built = !pending.includes(scene.id);
        return (
          <figure key={scene.id} className="object-subjects__tile" data-kind={scene.id}>
            <div className="object-subjects__stage">
              <ObjectScene
                kind={scene.id}
                label={scene.title}
                theme={theme}
                surface="page"
                controls="playback"
                preload={built}
                active={built && playing === scene.id}
              />
            </div>
            <figcaption>
              {built ? (
                <button type="button" aria-pressed={playing === scene.id} onClick={() => setPlaying(scene.id)}>
                  {scene.title}
                </button>
              ) : (
                <span>{scene.title}</span>
              )}
              <small>{built ? scene.description : "Its 3D subject is on its way; the drawing stands in."}</small>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
