// Data only, no component imports: the entry chunk (main.tsx, the shell, routes, the build's
// route table) reads it; LandingShowcase.tsx renders the page.

/** The landing page: the site's front door, outside the docs manifest like the Assets gallery. */
export const LANDING_PATH = "/";

/** The playground module that renders it (main.tsx loads `./<name>.tsx`; the build preloads it for "/"). */
export const LANDING_MODULE = "LandingShowcase";

/** Its tab title and meta description (playground/site.ts writes them into index.html). */
export const LANDING_TITLE = "UiPack, the design system for every site that installs it · uipack";
export const LANDING_DESCRIPTION =
  "Jun Xiong's own design system: diagrams, slides, web pages, motion and 3D, as React and SVG components with the rules for writing and laying them out. Agents read its docs as Markdown.";

/**
 * The landing page's section ids. "/" used to be the "What UiPack is" page: an old link to one of
 * that page's headings ("/#install") moves to the page's own address (main.tsx).
 */
export const LANDING_SECTIONS = ["top", "jobs", "built", "parts", "agents", "site-map"] as const;
