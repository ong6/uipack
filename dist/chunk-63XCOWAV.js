import { createContext, useContext } from 'react';

// src/context.tsx
var noop = () => {
};
var FigureMotionContext = /* @__PURE__ */ createContext({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
function useFigureMotion() {
  return useContext(FigureMotionContext);
}
var FigureChromeContext = /* @__PURE__ */ createContext("full");
var FigureLayoutWidthContext = /* @__PURE__ */ createContext(void 0);

export { FigureChromeContext, FigureLayoutWidthContext, FigureMotionContext, useFigureMotion };
