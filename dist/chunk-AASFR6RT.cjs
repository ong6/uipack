'use strict';

var react = require('react');

// src/flight.ts
function useLayerFlight(clearLayers) {
  const anims = react.useRef([]);
  const generation = react.useRef(0);
  const clear = react.useRef(clearLayers);
  clear.current = clearLayers;
  const settle = react.useCallback(() => {
    generation.current += 1;
    for (const a of anims.current) a.cancel();
    anims.current = [];
    clear.current();
  }, []);
  const fly = react.useCallback((run, land) => {
    const at = ++generation.current;
    anims.current = run;
    if (!run.length) return land();
    Promise.all(run.map((a) => a.finished)).then(
      () => {
        if (generation.current === at) land();
      },
      () => {
      }
    );
  }, []);
  react.useEffect(() => {
    const running = anims;
    return () => {
      generation.current += 1;
      for (const a of running.current) a.cancel();
    };
  }, []);
  return { anims, settle, fly };
}

exports.useLayerFlight = useLayerFlight;
