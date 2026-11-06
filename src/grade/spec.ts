/**
 * The site spec: every value the tier-1 grader holds a page to, in one JSON-shaped object, so the
 * same checks grade the UiPack playground, junxiong.dev or the blog. A spec file is JSON with any
 * subset of these fields; `resolveSpec` fills the rest from `DEFAULT_SPEC`. docs/grading/site-spec.md
 * documents the shape and where each default comes from.
 *
 * Plain data and pure functions: no DOM, no browser.
 */

export interface Viewport {
  /** Names the view in reports and file names ("1440", "390"). */
  name: string;
  width: number;
  height: number;
  /** A phone: touch, a coarse pointer and the coarse tap-target minimum. */
  touch?: boolean;
}

export interface ThemeSetup {
  /** Emulated `prefers-color-scheme`. */
  colorScheme: "light" | "dark";
  /** Query parameters added to the URL (the playground reads `?theme=dark`). */
  query?: Record<string, string>;
  /** Attributes set on <html> before any script runs (`{"data-theme": "dark"}`). */
  htmlAttributes?: Record<string, string>;
  /** localStorage entries set before any script runs (a site that remembers the theme there). */
  localStorage?: Record<string, string>;
}

export interface SiteSpec {
  /** Names the site in reports. */
  name: string;
  /**
   * Font families text may render in: the first family of every text element's stack must be one
   * of these, and every platform font Chromium actually used for letters must start with one.
   * `null` turns the face checks off (an external page whose faces are not ours to set).
   */
  faces: string[] | null;
  /** CSS custom properties on <body> whose first family is also allowed (`--ui-font-text`). */
  faceVars: string[];
  /** Platform fonts allowed to draw symbols the site faces lack (arrows, ⌘, emoji): warned, not failed. */
  symbolFaces: string[];
  /** The smallest rendered text, in CSS px. */
  minTextPx: number;
  /** Smaller floors inside some regions (`{"selector": "svg", "px": 11}`): the first match wins. */
  textFloors: { selector: string; px: number; why?: string }[];
  /** Smallest tap target, in CSS px: `coarse` on touch views, `fine` on the others. */
  tapTargetPx: { coarse: number; fine: number };
  /** WCAG contrast minimums: normal text, and large text (24px, or 18.66px at 700 and up). */
  contrast: { normal: number; large: number };
  /** Allowed height difference, in px, for cards sharing a row and for paired boxes. */
  rowTolerancePx: { cards: number; paired: number };
  /** Boxes shorter than this are not cards (a chip, a tag). */
  cardMinHeightPx: number;
  viewports: Viewport[];
  themes: { light: ThemeSetup; dark: ThemeSetup };
  /**
   * The page is ready when `selector` is visible and `gone` (a loading line) has left. Fonts and
   * a scroll to the bottom and back (so lazy sections mount) always follow.
   */
  ready: { selector?: string; gone?: string; settleMs: number };
  /** The region checked: elements outside it are not graded (the default is the whole body). */
  scope: string;
  /** Elements no check reads (a third-party embed, a 3D canvas). */
  ignore: string[];
  /** Elements one check skips, by check id: `{"contrast": [".hero-video *"]}`. */
  ignoreByCheck: Partial<Record<CheckId, string[]>>;
  /** Checks to skip entirely, with the reason recorded in the report. */
  skip: Partial<Record<CheckId, string>>;
  /** Most failing elements a check lists per view (the count is always exact). */
  maxFindings: number;
  /** Most screenshot crops a check saves per view. */
  maxCrops: number;
  /** Most Tab presses the focus walk makes per view. */
  maxTabs: number;
}

/** Every tier-1 check, in the order the report lists them. */
export const CHECK_IDS = [
  "overflow-x",
  "text-clip",
  "text-overlap",
  "row-heights",
  "tap-targets",
  "contrast",
  "font-faces",
  "text-size",
  "img-alt",
  "heading-order",
  "one-h1",
  "focus-visible",
  "reduced-motion",
] as const;
export type CheckId = (typeof CHECK_IDS)[number];

/** What each check proves, one line, for the Markdown summary and the docs. */
export const CHECK_TITLES: Record<CheckId, string> = {
  "overflow-x": "No page-wide horizontal overflow",
  "text-clip": "No text cut off by its box",
  "text-overlap": "No two runs of text drawn over each other",
  "row-heights": "Cards in a row share a height; paired boxes share a height",
  "tap-targets": "Every control meets the tap-target minimum",
  contrast: "Rendered text meets WCAG contrast",
  "font-faces": "Only the site's faces render",
  "text-size": "No text below the size floor",
  "img-alt": "Every image has alt text (empty for decoration)",
  "heading-order": "No skipped heading levels",
  "one-h1": "Exactly one visible h1",
  "focus-visible": "Keyboard focus is visible and not clipped",
  "reduced-motion": "Nothing keeps moving under reduced motion",
};

/**
 * The defaults: the UiPack documented values, each with its source. A site spec overrides any of them.
 * - 44px coarse target: docs/web-principles.md (menu "44px touch target"), docs/article.md, docs/charts.md.
 * - 24px fine target: WCAG 2.2 2.5.8; docs/charts.md ("the links in an opened row are 24px and 44px").
 * - 4.5 / 3 contrast: docs/web-principles.md rule 10, docs/design-direction.md.
 * - 12px text: docs/design-direction.md ("Mono captions and secondary text stay at 12px or more").
 * - 11px in figures and charts: e2e/geometry.spec.ts ("the 11px text floor"), docs/charts.md, docs/mechanism.md.
 * - 1px / 2px row tolerance and 80px / 40px card heights: e2e/page-audit.ts checkAlignment and checkPairedBoxes.
 */
export const DEFAULT_SPEC: SiteSpec = {
  name: "site",
  faces: null,
  faceVars: [],
  symbolFaces: [
    "Apple Symbols",
    "Apple Color Emoji",
    "Segoe UI Symbol",
    "Segoe UI Emoji",
    "Noto Color Emoji",
    "Noto Sans Symbols",
  ],
  minTextPx: 12,
  textFloors: [],
  tapTargetPx: { coarse: 44, fine: 24 },
  contrast: { normal: 4.5, large: 3 },
  rowTolerancePx: { cards: 1, paired: 2 },
  cardMinHeightPx: 80,
  viewports: [
    { name: "1440", width: 1440, height: 900 },
    { name: "390", width: 390, height: 844, touch: true },
  ],
  themes: { light: { colorScheme: "light" }, dark: { colorScheme: "dark" } },
  ready: { settleMs: 400 },
  scope: "body",
  ignore: [],
  ignoreByCheck: {},
  skip: {},
  maxFindings: 25,
  maxCrops: 6,
  maxTabs: 40,
};

/**
 * The UiPack playground and any page built on uipack/web: Technical's faces and the documented floors.
 * The CLI reads the faces from docs/specs/technical.md when it can find it; these are the fallback.
 */
export const UIPACK_SPEC: Partial<SiteSpec> = {
  name: "uipack-playground",
  // docs/design-direction.md: IBM Plex Sans for headings and text, IBM Plex Mono for labels.
  faces: ["IBM Plex Sans", "IBM Plex Mono"],
  faceVars: ["--ui-font-text", "--ui-font-display", "--ui-font-label"],
  textFloors: [
    { selector: "svg", px: 11, why: "figure text floor, e2e/geometry.spec.ts" },
    { selector: ".uipack-span, .uipack-stack", px: 11, why: "chart labels, docs/charts.md" },
  ],
  themes: {
    light: { colorScheme: "light", query: { theme: "light" } },
    dark: { colorScheme: "dark", query: { theme: "dark" } },
  },
  // Every page's h1 is in main: a Markdown docs page's own, a module page's title block, the Assets gallery's head.
  ready: { selector: "main h1", gone: ".showcase-loading", settleMs: 400 },
  // 3D scenes paint to a canvas; the ?host=notes stand-in copies another site's faces on purpose;
  // the Assets gallery's previews are inert, scaled-down pictures of parts graded on their own pages.
  ignore: ["canvas", "[data-host='notes']", ".gallery-preview"],
};

type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain => typeof v === "object" && v !== null && !Array.isArray(v);

/** `base` with `over` laid on top: objects merge key by key, arrays and values replace. */
export function mergeSpec<T>(base: T, over: unknown): T {
  if (!isPlain(base) || !isPlain(over)) return (over === undefined ? base : over) as T;
  const out: Plain = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = k in base ? mergeSpec(base[k], v) : v;
  return out as T;
}

/** Problems with a spec file's contents, as readable lines; empty when it is usable. */
export function validateSpec(input: unknown): string[] {
  const errors: string[] = [];
  if (!isPlain(input)) return ["the spec must be a JSON object"];
  const known = new Set([...Object.keys(DEFAULT_SPEC), "extends", "styleSpec", "$schema", "notes"]);
  for (const k of Object.keys(input)) if (!known.has(k)) errors.push(`unknown field "${k}"`);
  const num = (path: string, v: unknown, min = 0) => {
    if (v !== undefined && (typeof v !== "number" || !Number.isFinite(v) || v < min))
      errors.push(`${path} must be a number ≥ ${min}`);
  };
  num("minTextPx", input.minTextPx);
  num("cardMinHeightPx", input.cardMinHeightPx);
  num("maxFindings", input.maxFindings, 1);
  num("maxCrops", input.maxCrops);
  num("maxTabs", input.maxTabs);
  for (const [field, keys] of [
    ["tapTargetPx", ["coarse", "fine"]],
    ["contrast", ["normal", "large"]],
    ["rowTolerancePx", ["cards", "paired"]],
  ] as const) {
    const v = input[field];
    if (v === undefined) continue;
    if (!isPlain(v)) errors.push(`${field} must be an object`);
    else for (const k of keys) num(`${field}.${k}`, v[k], field === "contrast" ? 1 : 0);
  }
  if (
    input.faces !== undefined &&
    input.faces !== null &&
    !(Array.isArray(input.faces) && input.faces.every((f) => typeof f === "string"))
  )
    errors.push("faces must be a list of family names, or null");
  if (input.viewports !== undefined) {
    if (!Array.isArray(input.viewports) || !input.viewports.length) errors.push("viewports must be a non-empty list");
    else
      input.viewports.forEach((v, i) => {
        if (!isPlain(v) || typeof v.name !== "string") errors.push(`viewports[${i}].name must be a string`);
        else {
          num(`viewports[${i}].width`, v.width, 200);
          num(`viewports[${i}].height`, v.height, 200);
        }
      });
  }
  if (input.textFloors !== undefined) {
    if (!Array.isArray(input.textFloors)) errors.push("textFloors must be a list");
    else
      input.textFloors.forEach((f, i) => {
        if (!isPlain(f) || typeof f.selector !== "string") errors.push(`textFloors[${i}].selector must be a string`);
        else num(`textFloors[${i}].px`, f.px, 1);
      });
  }
  for (const field of ["ignoreByCheck", "skip"] as const) {
    const v = input[field];
    if (v === undefined) continue;
    if (!isPlain(v)) errors.push(`${field} must be an object keyed by check id`);
    else
      for (const k of Object.keys(v))
        if (!(CHECK_IDS as readonly string[]).includes(k))
          errors.push(`${field}.${k}: no check has that id (${CHECK_IDS.join(", ")})`);
  }
  if (input.styleSpec !== undefined && typeof input.styleSpec !== "string")
    errors.push("styleSpec must be a path to a style spec (.md)");
  if (input.extends !== undefined && !["default", "uipack"].includes(input.extends as string))
    errors.push(`extends must be "default" or "uipack"`);
  return errors;
}

/**
 * A full spec from a grade config's contents: `extends: "uipack"` starts from the UiPack values,
 * anything else from the defaults. `styleSpec` (a path) is read by the CLI's loadSpec, which lays
 * the style spec's faces under the config's own fields. Throws with every problem listed when the input is invalid.
 */
export function resolveSpec(input: unknown = {}): SiteSpec {
  const errors = validateSpec(input);
  if (errors.length) throw new Error(`invalid site spec:\n  ${errors.join("\n  ")}`);
  const { extends: base, styleSpec: _style, $schema: _s, notes: _n, ...rest } = input as Plain;
  const start = base === "uipack" ? mergeSpec(DEFAULT_SPEC, UIPACK_SPEC) : DEFAULT_SPEC;
  return mergeSpec(start, rest);
}
