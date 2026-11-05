// src/style.ts
var uiStyles = [
  {
    id: "technical",
    name: "Technical",
    summary: "Diagram-led blueprint: Prussian-blue ink, one amber mark, square hairlines, a drafting grid.",
    fonts: [
      "ibm-plex-sans-latin-400-normal.woff2",
      "ibm-plex-sans-latin-500-normal.woff2",
      "ibm-plex-sans-latin-600-normal.woff2",
      "ibm-plex-mono-latin-400-normal.woff2",
      "ibm-plex-mono-latin-600-normal.woff2"
    ],
    preload: ["ibm-plex-sans-latin-600-normal.woff2"],
    prefers: ["hero", "how", "demo", "proof", "faq", "pricing"],
    layout: { hero: "figure", align: "start", steps: "rows" }
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
  themeStorageKey = "uipack-theme",
  fallback = "technical",
  aliases = {}
} = {}) {
  const map = { ...aliases };
  for (const s of uiStyles) map[s.id] = s.id;
  const j = JSON.stringify;
  return `(function(){try{var q=new URLSearchParams(location.search),d=document.documentElement,m=${j(map)},L=localStorage,g=function(k){return k&&Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},s=g(q.get(${j(param)}))||g(L.getItem(${j(storageKey)}))||${j(fallback)};d.setAttribute("data-ui-style",s);var t=q.get(${j(themeParam)});if(t==="system"){L.removeItem(${j(themeStorageKey)});t=null}if(t!=="light"&&t!=="dark")t=L.getItem(${j(themeStorageKey)});if(t==="light"||t==="dark"){d.setAttribute("data-theme",t);d.setAttribute("data-ui-theme",t)}}catch(e){}})();`;
}

export { isUiStyle, sectionOrder, sharedSectionOrder, styleBootScript, uiStyles };
