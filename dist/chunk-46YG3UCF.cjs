'use strict';

// src/style.ts
var uiStyles = [
  {
    id: "technical",
    name: "Technical",
    summary: "Diagram-led blueprint: Prussian-blue ink, one amber mark, square hairlines, a drafting grid.",
    fonts: [
      "archivo-expanded-latin-600-normal.woff2",
      "archivo-latin-400-normal.woff2",
      "archivo-latin-500-normal.woff2",
      "archivo-latin-600-normal.woff2",
      "martian-mono-condensed-latin-400-normal.woff2",
      "martian-mono-condensed-latin-600-normal.woff2"
    ],
    preload: ["archivo-expanded-latin-600-normal.woff2"],
    prefers: ["hero", "how", "demo", "proof", "faq", "pricing"],
    layout: { hero: "figure", align: "start", steps: "rows" }
  },
  {
    id: "landing",
    name: "Landing",
    summary: "The generic landing page done well: cool neutrals, one cobalt CTA, editorial serif headlines, soft layered shadows.",
    fonts: [
      "instrument-serif-latin-400-normal.woff2",
      "instrument-serif-latin-400-italic.woff2",
      "ibm-plex-sans-latin-400-normal.woff2",
      "ibm-plex-sans-latin-500-normal.woff2",
      "ibm-plex-sans-latin-600-normal.woff2",
      "ibm-plex-mono-latin-400-normal.woff2",
      "ibm-plex-mono-latin-600-normal.woff2"
    ],
    preload: ["instrument-serif-latin-400-normal.woff2", "instrument-serif-latin-400-italic.woff2"],
    prefers: ["hero", "how", "mechanism", "proof", "faq", "pricing"],
    layout: { hero: "demo", align: "center", steps: "cards" }
  },
  {
    id: "graphical",
    name: "Graphical",
    summary: "Poster: bone paper, black ink, one signal-orange accent, condensed display caps, hard edges, one disc motif.",
    fonts: [
      "anton-latin-400-normal.woff2",
      "ibm-plex-sans-latin-400-normal.woff2",
      "ibm-plex-sans-latin-500-normal.woff2",
      "ibm-plex-sans-latin-600-normal.woff2",
      "ibm-plex-mono-latin-400-normal.woff2",
      "ibm-plex-mono-latin-600-normal.woff2"
    ],
    preload: ["anton-latin-400-normal.woff2"],
    prefers: ["hero", "proof", "how", "mechanism", "pricing", "faq"],
    layout: { hero: "demo", align: "center", steps: "cards" }
  }
];
var sharedSectionOrder = ["hero", "how", "mechanism", "proof", "faq", "pricing"];
function sectionOrder(style, available, layout = "shared") {
  if (layout === "shared") return [...available];
  const wanted = uiStyles.find((s) => s.id === style).prefers.filter((id) => available.includes(id));
  return [...wanted, ...available.filter((id) => !wanted.includes(id))];
}
var isUiStyle = (value) => uiStyles.some((s) => s.id === value);
function styleBootScript({
  param = "style",
  themeParam = "theme",
  storageKey = "uipack-style",
  fallback = "technical"
} = {}) {
  const ids = JSON.stringify(uiStyles.map((s) => s.id));
  return `(function(){try{var q=new URLSearchParams(location.search),d=document.documentElement,ids=${ids},s=q.get(${JSON.stringify(param)})||localStorage.getItem(${JSON.stringify(storageKey)});if(ids.indexOf(s)<0)s=${JSON.stringify(fallback)};d.setAttribute("data-ui-style",s);var t=q.get(${JSON.stringify(themeParam)});if(t==="light"||t==="dark")d.setAttribute("data-ui-theme",t)}catch(e){}})();`;
}

exports.isUiStyle = isUiStyle;
exports.sectionOrder = sectionOrder;
exports.sharedSectionOrder = sharedSectionOrder;
exports.styleBootScript = styleBootScript;
exports.uiStyles = uiStyles;
