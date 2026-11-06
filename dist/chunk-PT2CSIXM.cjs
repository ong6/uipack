'use strict';

var react = require('react');

// src/context.tsx
var noop = () => {
};
var FigureMotionContext = /* @__PURE__ */ react.createContext({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
function useFigureMotion() {
  return react.useContext(FigureMotionContext);
}
var FigureChromeContext = /* @__PURE__ */ react.createContext("full");
var FigureLayoutWidthContext = /* @__PURE__ */ react.createContext(void 0);

exports.FigureChromeContext = FigureChromeContext;
exports.FigureLayoutWidthContext = FigureLayoutWidthContext;
exports.FigureMotionContext = FigureMotionContext;
exports.useFigureMotion = useFigureMotion;
