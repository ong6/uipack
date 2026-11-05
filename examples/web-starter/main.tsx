// Entry: ?style=technical|graphical|landing and ?theme=light|dark pick the look; nothing else changes.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { isUiStyle } from "uipack";
import "uipack/theme.css";
import "uipack/web.css";
import App from "./App";

const params = new URLSearchParams(location.search);
const s = params.get("style");
const theme = params.get("theme") === "dark" ? "dark" : "light";
document.documentElement.dataset.uiTheme = theme;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App uiStyle={isUiStyle(s) ? s : "technical"} theme={theme} />
  </StrictMode>,
);
