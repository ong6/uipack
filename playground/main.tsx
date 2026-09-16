import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/theme.css";
import { App } from "./App";

const params = new URLSearchParams(location.search);
const theme = params.get("theme");
if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
