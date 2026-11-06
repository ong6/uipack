// Entry: ?style= picks a registered style (Technical, the default and only one today) and
// ?theme=light|dark forces a theme; without ?theme the page follows the system (prefers-color-scheme).
// Set both before the first paint with uipack's boot script; with Vite, one line in vite.config.ts
// inlines it into index.html (at its <!--uipack-boot--> comment):
//   import { styleBootPlugin } from "uipack";
//   export default defineConfig({ plugins: [styleBootPlugin({ aliases }), react()] });
// readStyle() reads the same choice back (aliases included; a stored style only with persist).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { readStyle } from "uipack";
import "uipack/theme.css";
import "uipack/web.css";
import App from "./App";

// Extra ?style= values, e.g. ?style=1. Pass the same map to styleBootPlugin.
const aliases = { "1": "technical" } as const;
const t = new URLSearchParams(location.search).get("theme");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App uiStyle={readStyle({ aliases })} theme={t === "dark" || t === "light" ? t : undefined} />
  </StrictMode>,
);
