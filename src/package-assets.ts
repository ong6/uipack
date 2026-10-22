// Binary assets that ship in the package's assets/ folder, beside dist/.
//
// This module sits at the top of src/ on purpose: tsup bundles it into a file at the top of dist/,
// so "../assets/…" resolves to the same file from the source (playground, tests) and the build.
// Keep each URL a literal `new URL("…", import.meta.url)`: Vite, Rollup, webpack 5 and Next
// recognise that exact pattern, copy the file into the consumer's build and rewrite the URL.
// CommonJS output has no import.meta, so there it throws; callers fall back or take a URL prop.

/** The Studio tennis rally (assets/objects/tennis-return.glb, 716 KB), fetched only when shown. */
export function tennisModelUrl(): string {
  return new URL("../assets/objects/tennis-return.glb", import.meta.url).href;
}
