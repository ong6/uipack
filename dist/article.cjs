"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/article/NoteCard.tsx
var _react = require('react');

// src/article/format.ts
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatNoteDate(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!m) return date;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > days) return date;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
function linkDomain(href) {
  if (!/^https?:\/\//i.test(href.trim())) return void 0;
  try {
    return new URL(href.trim()).hostname.replace(/^www\./, "") || void 0;
  } catch (e) {
    return void 0;
  }
}
var layerIndex = (index) => typeof index === "number" ? String(index).padStart(2, "0") : index;
var cx = (...names) => names.filter(Boolean).join(" ");
var fail = (part, message) => {
  throw new Error(`${part}: ${message}`);
};

// src/article/NoteCard.tsx
var _jsxruntime = require('react/jsx-runtime');
var ISO = /^\d{4}-\d{2}-\d{2}$/;
function NoteCard({
  href,
  title,
  description,
  date,
  minutes,
  kicker,
  status = "published",
  plannedLabel = "Coming next",
  minutesLabel = "min read",
  id,
  className
}) {
  const name = typeof title === "string" ? title : "a note";
  if (title == null || title === "") fail("NoteCard", "every note needs a `title`");
  if (status !== "published" && status !== "planned") fail(`NoteCard "${name}"`, `unknown status "${status}"`);
  if (minutes != null && !(Number.isFinite(minutes) && minutes > 0)) fail(`NoteCard "${name}"`, "`minutes` must be a positive number");
  const planned = status === "planned";
  if (!planned && !href) fail(`NoteCard "${name}"`, 'a published note needs an `href` (or set status="planned")');
  const body = /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    kicker != null && kicker !== "" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-notecard__kicker", children: kicker }) : null,
    " ",
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-notecard__title", children: title }),
    " ",
    description != null && description !== "" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-notecard__desc", children: description }) : null,
    " ",
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-notecard__meta", children: planned ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-notecard__status", children: plannedLabel }) : /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
      date ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "time", { className: "uipack-notecard__date", dateTime: ISO.test(date.trim()) ? date.trim() : void 0, children: formatNoteDate(date) }) : null,
      " ",
      minutes != null ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "uipack-notecard__time", children: [
        Math.round(minutes),
        " ",
        minutesLabel
      ] }) : null,
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-notecard__go", "aria-hidden": "true", children: "\u2192" })
    ] }) })
  ] });
  return planned ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { id, className: cx("uipack-notecard", "uipack-notecard--planned", className), children: body }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "a", { id, className: cx("uipack-notecard", className), href, children: body });
}
function NoteCluster({ label, note, notes, children, count, wide, id, className }) {
  if (label == null || label === "") fail("NoteCluster", "every cluster needs a `label`");
  const cards = notes ? notes.map((n, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, NoteCard, { ...n }, _nullishCoalesce(_nullishCoalesce(n.href, () => ( n.id)), () => ( i)))) : _react.Children.toArray(children);
  if (!cards.length) fail(`NoteCluster "${typeof label === "string" ? label : "cluster"}"`, "give it at least one note");
  const shown = count === false ? null : _nullishCoalesce(count, () => ( cards.length));
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { id, className: cx("uipack-cluster", wide && "uipack-cluster--wide", className), children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "uipack-cluster__head", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-cluster__label", children: label }),
      shown != null ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-cluster__count", "aria-hidden": "true", children: shown }) : null
    ] }),
    note != null && note !== "" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "uipack-cluster__note", children: note }) : null,
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ul", { className: "uipack-cluster__grid", role: "list", children: cards.map((card, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "li", { className: "uipack-cluster__item", children: card }, i)) })
  ] });
}

// src/article/parts.tsx

var present = (node) => node != null && node !== false && node !== "";
function LayerHead({ index, zone, metric, mapHref, mapLabel = "Map", indexLabel = "Layer", id, className }) {
  if (index == null || index === "") fail("LayerHead", "`index` is required");
  if (metric && !present(metric.value)) fail(`LayerHead ${layerIndex(index)}`, "`metric.value` is required when `metric` is given");
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { id, className: cx("uipack-layerhead", className), children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-layerhead__row", children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "uipack-layerhead__where", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "uipack-layerhead__index", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "uipack-layerhead__sr", children: [
          indexLabel,
          " "
        ] }),
        layerIndex(index)
      ] }),
      " ",
      present(zone) ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-layerhead__zone", children: zone }) : null
    ] }),
    metric ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "uipack-layerhead__metric", children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-layerhead__value", children: metric.value }),
      present(metric.label) ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
        " ",
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-layerhead__label", children: metric.label })
      ] }) : null
    ] }) : null,
    mapHref ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "a", { className: "uipack-layerhead__map", href: mapHref, children: mapLabel }) : null
  ] }) });
}
function TermList({ terms, label = "Learn", id, className }) {
  const items = (_nullishCoalesce(terms, () => ( []))).filter(present);
  if (!items.length) fail("TermList", "`terms` must list at least one term");
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { id, className: cx("uipack-terms", className), children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "uipack-terms__label", children: label }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ul", { className: "uipack-terms__list", role: "list", children: items.map((term, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "li", { className: "uipack-terms__term", children: term }, typeof term === "string" ? term : i)) })
  ] });
}
function Callout({ kind = "selftest", label, children, id, className }) {
  if (kind !== "selftest" && kind !== "note") fail("Callout", `unknown kind "${kind}"`);
  if (!present(children)) fail("Callout", "give it some content");
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { id, className: cx("uipack-callout", `uipack-callout--${kind}`, className), children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "uipack-callout__label", children: _nullishCoalesce(label, () => ( (kind === "selftest" ? "Self-test" : "Note"))) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "uipack-callout__body", children })
  ] });
}
function ChangeNote({ label = "What changed", kicker, children, id, className }) {
  if (!present(children)) fail("ChangeNote", "give it some content");
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { id, className: cx("uipack-change", className), children: [
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "uipack-change__label", children: [
      label,
      present(kicker) ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
        " ",
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-change__kicker", children: kicker })
      ] }) : null
    ] }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "uipack-change__body", children })
  ] });
}
function LinkList({ label = "Go deeper", links, children, id, className }) {
  const rows = _nullishCoalesce(links, () => ( []));
  if (!rows.length && !present(children)) fail("LinkList", "give it `links` or inline children");
  rows.forEach((link, i) => {
    if (!_optionalChain([link, 'optionalAccess', _ => _.href])) fail("LinkList", `link ${i} needs an \`href\``);
    if (!present(link.title)) fail("LinkList", `link ${i} (${link.href}) needs a \`title\``);
  });
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { id, className: cx("uipack-links", className), children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "uipack-links__label", children: label }),
    rows.length ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ul", { className: "uipack-links__list", role: "list", children: rows.map((link, i) => {
      const domain = link.domain === false ? void 0 : _nullishCoalesce(link.domain, () => ( linkDomain(link.href)));
      return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "li", { className: "uipack-links__item", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "a", { className: "uipack-links__link", href: link.href, children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-links__title", children: link.title }),
        domain ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
          " ",
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-links__domain", children: domain })
        ] }) : null
      ] }) }, `${link.href}-${i}`);
    }) }) : null,
    present(children) ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "uipack-links__body", children }) : null
  ] });
}











exports.Callout = Callout; exports.ChangeNote = ChangeNote; exports.LayerHead = LayerHead; exports.LinkList = LinkList; exports.NoteCard = NoteCard; exports.NoteCluster = NoteCluster; exports.TermList = TermList; exports.formatNoteDate = formatNoteDate; exports.layerIndex = layerIndex; exports.linkDomain = linkDomain;
