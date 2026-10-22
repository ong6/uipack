import { useRef, useCallback, useEffect } from 'react';

// src/flight.ts
function useLayerFlight(clearLayers) {
  const anims = useRef([]);
  const generation = useRef(0);
  const clear = useRef(clearLayers);
  clear.current = clearLayers;
  const settle = useCallback(() => {
    generation.current += 1;
    for (const a of anims.current) a.cancel();
    anims.current = [];
    clear.current();
  }, []);
  const fly = useCallback((run, land) => {
    anims.current = run;
    if (!run.length) return land();
    const at = generation.current;
    Promise.all(run.map((a) => a.finished)).then(
      () => {
        if (generation.current === at) land();
      },
      () => {
      }
    );
  }, []);
  useEffect(() => {
    const running = anims;
    return () => {
      generation.current += 1;
      for (const a of running.current) a.cancel();
    };
  }, []);
  return { anims, settle, fly };
}

export { useLayerFlight };
