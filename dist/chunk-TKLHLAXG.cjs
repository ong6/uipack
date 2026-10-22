"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkJ7BYXE6Qcjs = require('./chunk-J7BYXE6Q.cjs');

// src/context.tsx
var _react = require('react');
var noop = () => {
};
var FigureMotionContext = _react.createContext.call(void 0, {
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
function useFigureMotion() {
  return _react.useContext.call(void 0, FigureMotionContext);
}
function usePrefersReducedMotion() {
  const [reduced, setReduced] = _react.useState.call(void 0, false);
  _react.useEffect.call(void 0, () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(_chunkJ7BYXE6Qcjs.REDUCED_MOTION_QUERY);
    const onChange = (e) => setReduced(e.matches);
    setReduced(mq.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);
  return reduced;
}





exports.FigureMotionContext = FigureMotionContext; exports.useFigureMotion = useFigureMotion; exports.usePrefersReducedMotion = usePrefersReducedMotion;
//# sourceMappingURL=chunk-TKLHLAXG.cjs.map