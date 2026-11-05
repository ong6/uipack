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
    summary: "Product marketing as a two-ink riso print: plum ink and one fluorescent-pink spot on cool off-white stock, printed slightly off register, halftone screens, upright serif headlines.",
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
    summary: "Poster: bone paper, black ink, one signal-orange accent, condensed display caps, hard edges, one disc motif (the hero stamp).",
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
var styleMap = (aliases = {}) => {
  const map = { ...aliases };
  for (const s of uiStyles) map[s.id] = s.id;
  return map;
};
function styleBootScript({
  param = "style",
  themeParam = "theme",
  storageKey = "uipack-style",
  themeStorageKey = "uipack-theme",
  fallback = "technical",
  aliases = {},
  persist = false
} = {}) {
  const map = styleMap(aliases);
  const j = JSON.stringify;
  const stored = persist ? `g(L.getItem(${j(storageKey)}))||` : "";
  return `(function(){try{var q=new URLSearchParams(location.search),d=document.documentElement,m=${j(map)},L=localStorage,g=function(k){return k&&Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},s=g(q.get(${j(param)}))||${stored}${j(fallback)};d.setAttribute("data-ui-style",s);var t=q.get(${j(themeParam)});if(t==="system"){L.removeItem(${j(themeStorageKey)});t=null}if(t!=="light"&&t!=="dark")t=L.getItem(${j(themeStorageKey)});if(t==="light"||t==="dark"){d.setAttribute("data-theme",t);d.setAttribute("data-ui-theme",t)}}catch(e){}})();`;
}
function styleBootPlugin(options = {}) {
  const tag = `<script>${styleBootScript(options)}</script>`;
  return {
    name: "uipack-style-boot",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => html.includes("<!--uipack-boot-->") ? html.replace("<!--uipack-boot-->", tag) : html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}
    ${tag}`)
    }
  };
}
function readStyle({ param = "style", fallback = "technical", aliases = {} } = {}) {
  const map = styleMap(aliases);
  const pick = (k) => k && Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null;
  if (typeof document !== "undefined") {
    const set = pick(document.documentElement.getAttribute("data-ui-style"));
    if (set) return set;
  }
  const search = typeof location !== "undefined" ? location.search : "";
  return pick(new URLSearchParams(search).get(param)) ?? fallback;
}

export { isUiStyle, readStyle, sectionOrder, sharedSectionOrder, styleBootPlugin, styleBootScript, uiStyles };
