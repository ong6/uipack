// The two-layer flight that DeckPlayer and DrillFigure share: the outgoing and incoming layers
// animate together (Web Animations), and the flight lands once every animation has finished,
// unless a newer settle has replaced it. Each owner keeps its own view state and builds its own
// animations; this owns their lifetime.
import { useCallback, useEffect, useRef } from "react";

/** `clearLayers` returns the owner's layers to rest (no inline z-index or visibility left behind). */
export function useLayerFlight(clearLayers: () => void) {
  const anims = useRef<Animation[]>([]);
  // Bumped by every settle and on unmount, so a flight that was replaced never lands.
  const generation = useRef(0);
  const clear = useRef(clearLayers);
  clear.current = clearLayers;

  /** Stop every running animation, drop its pending landing and leave the layers at rest. */
  const settle = useCallback(() => {
    generation.current += 1;
    for (const a of anims.current) a.cancel();
    anims.current = [];
    clear.current();
  }, []);

  /** Track `run`, and call `land` once all of it has finished: straight away if nothing runs. */
  const fly = useCallback((run: Animation[], land: () => void) => {
    anims.current = run;
    if (!run.length) return land();
    const at = generation.current;
    Promise.all(run.map((a) => a.finished)).then(
      () => {
        if (generation.current === at) land();
      },
      () => {},
    );
  }, []);

  // Unmounting mid-flight: stop the animations, so none outlives its owner or lands into it.
  useEffect(() => {
    const running = anims;
    return () => {
      generation.current += 1;
      for (const a of running.current) a.cancel();
    };
  }, []);

  return { anims, settle, fly };
}
