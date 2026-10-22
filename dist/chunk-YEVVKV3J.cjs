"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/flight.ts
var _react = require('react');
function useLayerFlight(clearLayers) {
  const anims = _react.useRef.call(void 0, []);
  const generation = _react.useRef.call(void 0, 0);
  const clear = _react.useRef.call(void 0, clearLayers);
  clear.current = clearLayers;
  const settle = _react.useCallback.call(void 0, () => {
    generation.current += 1;
    for (const a of anims.current) a.cancel();
    anims.current = [];
    clear.current();
  }, []);
  const fly = _react.useCallback.call(void 0, (run, land) => {
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
  _react.useEffect.call(void 0, () => {
    const running = anims;
    return () => {
      generation.current += 1;
      for (const a of running.current) a.cancel();
    };
  }, []);
  return { anims, settle, fly };
}



exports.useLayerFlight = useLayerFlight;
//# sourceMappingURL=chunk-YEVVKV3J.cjs.map