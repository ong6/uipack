// Entry: ?style= picks a registered style (Technical, the default and only one today) and
// ?theme=light|dark forces a theme; without ?theme the page follows the system (prefers-color-scheme). For a page served as HTML,
// inline `styleBootScript()` (from "uipack") in <head> so the style and theme are set before paint.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { isUiStyle } from "uipack";
import "uipack/theme.css";
import "uipack/web.css";
import App from "./App";

const params = new URLSearchParams(location.search);
const s = params.get("style");
const t = params.get("theme");
const theme = t === "dark" || t === "light" ? t : undefined;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App uiStyle={isUiStyle(s) ? s : "technical"} theme={theme} />
  </StrictMode>,
);
