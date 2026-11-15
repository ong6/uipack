import type { ReactNode } from "react";
import { ObjectScene } from "./ObjectScene";
import { objectScenes } from "./scene-list";
import type { ObjectKind } from "./scenes";
import { keepFocusedInView } from "../env";

/** One scene library, one mounted preview. Consumers own routing. */
export function AnimationWorkspace({
  library,
  children,
  theme = "light",
}: {
  library: ReactNode;
  children: ReactNode;
  theme?: "light" | "dark";
}) {
  return (
    <div className="uipack-animation-workspace" data-theme={theme}>
      {/* Not an aside: inside the page's main it is no landmark of its own. */}
      <div className="uipack-animation-library">{library}</div>
      <div className="uipack-animation-detail">{children}</div>
    </div>
  );
}

/** The object library beside one live preview. The consumer owns the chosen kind (and its URL). */
export function ObjectGallery({
  kind,
  theme = "light",
  onChange,
}: {
  kind: ObjectKind;
  theme?: "light" | "dark";
  onChange: (kind: ObjectKind) => void;
}) {
  const scene = objectScenes.find((item) => item.id === kind)!;
  return (
    <AnimationWorkspace
      theme={theme}
      library={
        <>
          <h3>Object library</h3>
          <nav aria-label="Choose an object" className="uipack-scene-list" onFocus={keepFocusedInView}>
            {objectScenes.map((item) => (
              <button type="button" key={item.id} aria-pressed={kind === item.id} onClick={() => onChange(item.id)}>
                {item.title}
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </nav>
        </>
      }
    >
      <header className="uipack-animation-heading">
        <h3>{scene.title}</h3>
        <span>Live 3D preview</span>
      </header>
      <div className="uipack-gallery-stage">
        <ObjectScene key={kind} kind={kind} label={scene.title} theme={theme} />
      </div>
      <p className="uipack-gallery-description">{scene.description}</p>
    </AnimationWorkspace>
  );
}
