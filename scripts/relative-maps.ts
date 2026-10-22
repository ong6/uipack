// tsup's CJS splitting writes absolute paths into its CJS sourcemaps. Make those
// sources relative so dist/ is identical on every checkout and no local path ships.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const dist = join(process.cwd(), "dist");
for (const name of readdirSync(dist)) {
  if (!name.endsWith(".map")) continue;
  const file = join(dist, name);
  const map = JSON.parse(readFileSync(file, "utf8")) as { sources: string[]; file?: string };
  if (!map.file?.startsWith("/") && !map.sources.some((s) => s.startsWith("/"))) continue;
  map.sources = map.sources.map((s) => (s.startsWith("/") ? relative(dist, s) : s));
  if (map.file?.startsWith("/")) map.file = relative(dist, map.file);
  writeFileSync(file, JSON.stringify(map));
}
