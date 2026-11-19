import { useState } from "react";
import { ObjectScene, objectScenes, type ObjectKind } from "../src/objects";
import "../src/objects/objects.css";
import { useShowcaseTheme } from "./ShowcaseShell";
import { mugSubject } from "./siteSubject";
import "./objects-showcase.css";

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
        return (
          <figure key={scene.id} className="object-subjects__tile" data-kind={scene.id}>
            <div className="object-subjects__stage">
              <ObjectScene
                kind={scene.id}
                label={scene.title}
                theme={theme}
                surface="page"
                controls="playback"
                preload
                active={playing === scene.id}
              />
            </div>
            <figcaption>
              <button type="button" aria-pressed={playing === scene.id} onClick={() => setPlaying(scene.id)}>
                {scene.title}
              </button>
              <small>{scene.description}</small>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/**
 * `object-site-subject` (docs/objects.md, "A site's own subject"): a subject built outside uipack
 * (siteSubject.tsx, which imports no `three`) in the same player, style and lifecycle.
 */
export function ObjectSiteSubject() {
  const { theme } = useShowcaseTheme();
  return (
    <figure className="object-site-subject" data-kind={mugSubject.id}>
      <div className="object-site-subject__stage">
        <ObjectScene subject={mugSubject} label="Coffee, a site's own subject" theme={theme} surface="page" controls="playback" />
      </div>
      <figcaption>
        <small>Built by the page, drawn and played by uipack: a mug of coffee, steam rising in a 6 s loop.</small>
      </figcaption>
    </figure>
  );
}
