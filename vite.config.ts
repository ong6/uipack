import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: "playground",
  publicDir: false,
  appType: "spa",
  server: { fs: { allow: [".."] } },
  define: { __UIPACK_ROOT__: JSON.stringify(process.cwd()) },
});
