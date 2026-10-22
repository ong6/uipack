"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/presentations/renderSlideSvg.ts
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
  const theme = _nullishCoalesce(options.theme, () => ( "light"));
  const colors = palettes[theme];
  const width = _nullishCoalesce(options.width, () => ( 1200));
  const height = Math.round(width * 9 / 16);
  const text = (x, y, value, size = 26, color = colors.ink, weight = 400, mono = false, anchor = "start") => `<text x="${x}" y="${y}"${anchor === "end" ? ' text-anchor="end"' : ""} font-family="${mono ? "IBM Plex Mono, ui-monospace, monospace" : "IBM Plex Sans, system-ui, sans-serif"}" font-size="${size}" fill="${color}" font-weight="${weight}">${escapeSvgText(value)}</text>`;
  const rule = (x1, y, x2) => `<path d="M${x1} ${y}H${x2}" stroke="${colors.rule}" stroke-width="2"/>`;
  const footer = slide.footer ? rule(64, 592, 1136) + text(64, 635, slide.footer.label, 18, colors.muted, 400, true) + (slide.footer.page ? text(1136, 635, slide.footer.page, 18, colors.muted, 400, true, "end") : "") : "";
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
var _react = require('react');
var _jsxruntime = require('react/jsx-runtime');
function estimateSpeechSeconds(say) {
  const words = _nullishCoalesce(_optionalChain([say, 'access', _ => _.trim, 'call', _2 => _2(), 'access', _3 => _3.match, 'call', _4 => _4(/\S+/g), 'optionalAccess', _5 => _5.length]), () => ( 0));
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
  if (_optionalChain([navigator, 'access', _6 => _6.clipboard, 'optionalAccess', _7 => _7.writeText])) {
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
  const copied = _nullishCoalesce(_optionalChain([document, 'access', _8 => _8.execCommand, 'optionalCall', _9 => _9("copy")]), () => ( false));
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
  const headingId = _react.useId.call(void 0, );
  const [status, setStatus] = _react.useState.call(void 0, 
    "idle"
  );
  const seconds = estimateSpeechSeconds(speech.say);
  const text = formatSpeechGuide(speech);
  const copy = async () => {
    try {
      await copyText(text);
      setStatus("copied");
      _optionalChain([onCopy, 'optionalCall', _10 => _10(text)]);
    } catch (e) {
      setStatus("error");
    }
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    "aside",
    {
      className: `uipack-speaker-guide ${className}`.trim(),
      "aria-labelledby": headingId,
      "data-theme": theme,
      children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-speaker-guide__heading", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h3", { id: headingId, children: "Speaker guide" }),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { "aria-label": `Estimated speaking time ${seconds} seconds`, children: [
            "~",
            seconds,
            " sec"
          ] })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-speaker-guide__section", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h4", { children: "Say this" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: speech.say })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-speaker-guide__section", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h4", { children: "Delivery" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: speech.delivery })
        ] }),
        speech.next && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-speaker-guide__section", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h4", { children: "Into the next slide" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: speech.next })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-speaker-guide__action", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "button", { type: "button", onClick: copy, children: "Copy talk track" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { role: "status", "aria-live": "polite", "aria-atomic": "true", children: status === "copied" ? `${slideTitle} talk track copied.` : status === "error" ? "Could not copy the talk track. Select the text instead." : "" })
        ] })
      ]
    }
  );
}

// src/presentations/SlideStarter.tsx

function SlideStarter({
  slide,
  theme = "light",
  showSpeech = true,
  className = "",
  onCopySpeech
}) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    "section",
    {
      className: `uipack-slide-starter ${className}`.trim(),
      "data-theme": theme,
      "data-layout": slide.layout,
      children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "figure", { className: "uipack-slide-starter__figure", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
            "div",
            {
              className: "uipack-slide-starter__preview",
              dangerouslySetInnerHTML: {
                __html: renderSlideSvg(slide, { theme })
              }
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "figcaption", { children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "strong", { children: slide.title }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: slide.description })
          ] })
        ] }),
        showSpeech && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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







exports.SlideStarter = SlideStarter; exports.SpeakerGuide = SpeakerGuide; exports.escapeSvgText = escapeSvgText; exports.estimateSpeechSeconds = estimateSpeechSeconds; exports.formatSpeechGuide = formatSpeechGuide; exports.renderSlideSvg = renderSlideSvg;
//# sourceMappingURL=presentations.cjs.map