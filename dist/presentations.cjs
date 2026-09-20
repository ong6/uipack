"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/presentations/index.ts
var presentations_exports = {};
__export(presentations_exports, {
  SlideStarter: () => SlideStarter,
  SpeakerGuide: () => SpeakerGuide,
  escapeSvgText: () => escapeSvgText,
  estimateSpeechSeconds: () => estimateSpeechSeconds,
  formatSpeechGuide: () => formatSpeechGuide,
  renderSlideSvg: () => renderSlideSvg
});
module.exports = __toCommonJS(presentations_exports);

// src/presentations/renderSlideSvg.ts
var palettes = {
  light: {
    paper: "#f6f5f1",
    surface: "#ffffff",
    ink: "#1a1c1a",
    muted: "#5c625e",
    accent: "#205f49",
    rule: "#bac3bc"
  },
  dark: {
    paper: "#0a100d",
    surface: "#14201b",
    ink: "#e8ece9",
    muted: "#9aa39e",
    accent: "#71dcb2",
    rule: "#43544b"
  }
};
function escapeSvgText(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function accessibleTitle(slide) {
  return slide.layout === "opening" ? slide.content.headline.join(" ") : slide.content.headline;
}
function renderSlideSvg(slide, options = {}) {
  const theme = options.theme ?? "light";
  const colors = palettes[theme];
  const width = options.width ?? 1200;
  const height = Math.round(width * 9 / 16);
  const text = (x, y, value, size = 26, color = colors.ink, weight = 400, mono = false) => `<text x="${x}" y="${y}" font-family="${mono ? "IBM Plex Mono, ui-monospace, monospace" : "IBM Plex Sans, system-ui, sans-serif"}" font-size="${size}" fill="${color}" font-weight="${weight}">${escapeSvgText(value)}</text>`;
  const rule = (x1, y, x2) => `<path d="M${x1} ${y}H${x2}" stroke="${colors.rule}" stroke-width="2"/>`;
  const footer = slide.footer ? rule(64, 592, 1136) + text(64, 635, slide.footer.label, 18, colors.muted, 400, true) + (slide.footer.page ? text(1010, 635, slide.footer.page, 18, colors.muted, 400, true) : "") : "";
  let body = "";
  if (slide.layout === "opening") {
    body = text(64, 105, slide.content.eyebrow, 22, colors.accent, 700, true) + text(64, 277, slide.content.headline[0], 78, colors.ink, 600) + text(64, 371, slide.content.headline[1], 78, colors.ink, 600) + text(64, 457, slide.content.context, 28, colors.muted);
  } else if (slide.layout === "explanation") {
    const [first, second] = slide.content.applications;
    body = text(64, 105, slide.content.eyebrow, 22, colors.accent, 700, true) + text(64, 196, slide.content.headline, 52, colors.ink, 600) + `<rect x="64" y="264" width="440" height="256" fill="${colors.surface}" stroke="${colors.rule}"/>` + text(96, 328, slide.content.foundation.title, 22, colors.accent, 700, true) + text(96, 399, slide.content.foundation.detail, 30, colors.ink, 600) + text(568, 310, first.title, 30, colors.ink, 600) + text(568, 358, first.detail, 24, colors.muted) + text(568, 442, second.title, 30, colors.ink, 600) + text(568, 490, second.detail, 24, colors.muted);
  } else {
    body = text(64, 105, slide.content.eyebrow, 22, colors.accent, 700, true) + text(64, 196, slide.content.headline, 52, colors.ink, 600);
    slide.content.steps.forEach((step, index) => {
      const x = 64 + index * 392;
      body += `<rect x="${x}" y="295" width="288" height="138" fill="${colors.surface}" stroke="${colors.rule}" stroke-width="2"/>` + text(x + 24, 351, step.title, 30, colors.ink, 600) + text(x + 24, 394, step.detail, 20, colors.muted, 400, true);
      if (index < slide.content.steps.length - 1) {
        const arrow = x + 302;
        body += `<path d="M${arrow} 364h70m-10-8 10 8-10 8" fill="none" stroke="${colors.accent}" stroke-width="3"/>`;
      }
    });
    body += text(64, 521, slide.content.caption, 27, colors.muted);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 675" role="img"><title>${escapeSvgText(`${slide.title}: ${accessibleTitle(slide)}`)}</title><desc>${escapeSvgText(slide.description)}</desc><rect width="1200" height="675" fill="${colors.paper}"/>${body}${footer}</svg>`;
}

// src/presentations/SpeakerGuide.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function estimateSpeechSeconds(say) {
  const words = say.trim().match(/\S+/g)?.length ?? 0;
  if (!words) return 0;
  return Math.max(5, Math.round(words / 135 * 12) * 5);
}
function formatSpeechGuide(speech) {
  return [
    `Say this
${speech.say}`,
    `Delivery
${speech.delivery}`,
    speech.next ? `Into the next slide
${speech.next}` : void 0
  ].filter(Boolean).join("\n\n");
}
async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.readOnly = true;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand?.("copy") ?? false;
  field.remove();
  if (!copied) throw new Error("Copy is unavailable.");
}
function SpeakerGuide({
  speech,
  slideTitle = "Slide",
  onCopy,
  className = "",
  theme = "light"
}) {
  const headingId = (0, import_react.useId)();
  const [status, setStatus] = (0, import_react.useState)(
    "idle"
  );
  const seconds = estimateSpeechSeconds(speech.say);
  const text = formatSpeechGuide(speech);
  const copy = async () => {
    try {
      await copyText(text);
      setStatus("copied");
      onCopy?.(text);
    } catch {
      setStatus("error");
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "aside",
    {
      className: `uipack-speaker-guide ${className}`.trim(),
      "aria-labelledby": headingId,
      "data-theme": theme,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-speaker-guide__heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { id: headingId, children: "Speaker guide" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { "aria-label": `Estimated speaking time ${seconds} seconds`, children: [
            "~",
            seconds,
            " sec"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-speaker-guide__section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "Say this" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: speech.say })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-speaker-guide__section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "Delivery" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: speech.delivery })
        ] }),
        speech.next && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-speaker-guide__section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "Into the next slide" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: speech.next })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-speaker-guide__action", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: copy, children: "Copy talk track" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { role: "status", "aria-live": "polite", "aria-atomic": "true", children: status === "copied" ? `${slideTitle} talk track copied.` : status === "error" ? "Could not copy the talk track. Select the text instead." : "" })
        ] })
      ]
    }
  );
}

// src/presentations/SlideStarter.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function SlideStarter({
  slide,
  theme = "light",
  showSpeech = true,
  className = "",
  onCopySpeech
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "section",
    {
      className: `uipack-slide-starter ${className}`.trim(),
      "data-theme": theme,
      "data-layout": slide.layout,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("figure", { className: "uipack-slide-starter__figure", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "div",
            {
              className: "uipack-slide-starter__preview",
              dangerouslySetInnerHTML: {
                __html: renderSlideSvg(slide, { theme })
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("figcaption", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: slide.title }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: slide.description })
          ] })
        ] }),
        showSpeech && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          SpeakerGuide,
          {
            speech: slide.speech,
            slideTitle: slide.title,
            theme,
            onCopy: onCopySpeech
          }
        )
      ]
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SlideStarter,
  SpeakerGuide,
  escapeSvgText,
  estimateSpeechSeconds,
  formatSpeechGuide,
  renderSlideSvg
});
//# sourceMappingURL=presentations.cjs.map