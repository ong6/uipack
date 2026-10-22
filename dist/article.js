// src/article/NoteCard.tsx
import { Children } from "react";

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
  } catch {
    return void 0;
  }
}
var layerIndex = (index) => typeof index === "number" ? String(index).padStart(2, "0") : index;
var cx = (...names) => names.filter(Boolean).join(" ");
var fail = (part, message) => {
  throw new Error(`${part}: ${message}`);
};

// src/article/NoteCard.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
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
  const body = /* @__PURE__ */ jsxs(Fragment, { children: [
    kicker != null && kicker !== "" ? /* @__PURE__ */ jsx("span", { className: "uipack-notecard__kicker", children: kicker }) : null,
    " ",
    /* @__PURE__ */ jsx("span", { className: "uipack-notecard__title", children: title }),
    " ",
    description != null && description !== "" ? /* @__PURE__ */ jsx("span", { className: "uipack-notecard__desc", children: description }) : null,
    " ",
    /* @__PURE__ */ jsx("span", { className: "uipack-notecard__meta", children: planned ? /* @__PURE__ */ jsx("span", { className: "uipack-notecard__status", children: plannedLabel }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      date ? /* @__PURE__ */ jsx("time", { className: "uipack-notecard__date", dateTime: ISO.test(date.trim()) ? date.trim() : void 0, children: formatNoteDate(date) }) : null,
      " ",
      minutes != null ? /* @__PURE__ */ jsxs("span", { className: "uipack-notecard__time", children: [
        Math.round(minutes),
        " ",
        minutesLabel
      ] }) : null,
      /* @__PURE__ */ jsx("span", { className: "uipack-notecard__go", "aria-hidden": "true", children: "\u2192" })
    ] }) })
  ] });
  return planned ? /* @__PURE__ */ jsx("div", { id, className: cx("uipack-notecard", "uipack-notecard--planned", className), children: body }) : /* @__PURE__ */ jsx("a", { id, className: cx("uipack-notecard", className), href, children: body });
}
function NoteCluster({ label, note, notes, children, count, wide, id, className }) {
  if (label == null || label === "") fail("NoteCluster", "every cluster needs a `label`");
  const cards = notes ? notes.map((n, i) => /* @__PURE__ */ jsx(NoteCard, { ...n }, n.href ?? n.id ?? i)) : Children.toArray(children);
  if (!cards.length) fail(`NoteCluster "${typeof label === "string" ? label : "cluster"}"`, "give it at least one note");
  const shown = count === false ? null : count ?? cards.length;
  return /* @__PURE__ */ jsxs("div", { id, className: cx("uipack-cluster", wide && "uipack-cluster--wide", className), children: [
    /* @__PURE__ */ jsxs("p", { className: "uipack-cluster__head", children: [
      /* @__PURE__ */ jsx("span", { className: "uipack-cluster__label", children: label }),
      shown != null ? /* @__PURE__ */ jsx("span", { className: "uipack-cluster__count", "aria-hidden": "true", children: shown }) : null
    ] }),
    note != null && note !== "" ? /* @__PURE__ */ jsx("p", { className: "uipack-cluster__note", children: note }) : null,
    /* @__PURE__ */ jsx("ul", { className: "uipack-cluster__grid", role: "list", children: cards.map((card, i) => /* @__PURE__ */ jsx("li", { className: "uipack-cluster__item", children: card }, i)) })
  ] });
}

// src/article/parts.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var present = (node) => node != null && node !== false && node !== "";
function LayerHead({ index, zone, metric, mapHref, mapLabel = "Map", indexLabel = "Layer", id, className }) {
  if (index == null || index === "") fail("LayerHead", "`index` is required");
  if (metric && !present(metric.value)) fail(`LayerHead ${layerIndex(index)}`, "`metric.value` is required when `metric` is given");
  return /* @__PURE__ */ jsx2("div", { id, className: cx("uipack-layerhead", className), children: /* @__PURE__ */ jsxs2("div", { className: "uipack-layerhead__row", children: [
    /* @__PURE__ */ jsxs2("p", { className: "uipack-layerhead__where", children: [
      /* @__PURE__ */ jsxs2("span", { className: "uipack-layerhead__index", children: [
        /* @__PURE__ */ jsxs2("span", { className: "uipack-layerhead__sr", children: [
          indexLabel,
          " "
        ] }),
        layerIndex(index)
      ] }),
      " ",
      present(zone) ? /* @__PURE__ */ jsx2("span", { className: "uipack-layerhead__zone", children: zone }) : null
    ] }),
    metric ? /* @__PURE__ */ jsxs2("p", { className: "uipack-layerhead__metric", children: [
      /* @__PURE__ */ jsx2("span", { className: "uipack-layerhead__value", children: metric.value }),
      present(metric.label) ? /* @__PURE__ */ jsxs2(Fragment2, { children: [
        " ",
        /* @__PURE__ */ jsx2("span", { className: "uipack-layerhead__label", children: metric.label })
      ] }) : null
    ] }) : null,
    mapHref ? /* @__PURE__ */ jsx2("a", { className: "uipack-layerhead__map", href: mapHref, children: mapLabel }) : null
  ] }) });
}
function TermList({ terms, label = "Learn", id, className }) {
  const items = (terms ?? []).filter(present);
  if (!items.length) fail("TermList", "`terms` must list at least one term");
  return /* @__PURE__ */ jsxs2("div", { id, className: cx("uipack-terms", className), children: [
    /* @__PURE__ */ jsx2("p", { className: "uipack-terms__label", children: label }),
    /* @__PURE__ */ jsx2("ul", { className: "uipack-terms__list", role: "list", children: items.map((term, i) => /* @__PURE__ */ jsx2("li", { className: "uipack-terms__term", children: term }, typeof term === "string" ? term : i)) })
  ] });
}
function Callout({ kind = "selftest", label, children, id, className }) {
  if (kind !== "selftest" && kind !== "note") fail("Callout", `unknown kind "${kind}"`);
  if (!present(children)) fail("Callout", "give it some content");
  return /* @__PURE__ */ jsxs2("div", { id, className: cx("uipack-callout", `uipack-callout--${kind}`, className), children: [
    /* @__PURE__ */ jsx2("p", { className: "uipack-callout__label", children: label ?? (kind === "selftest" ? "Self-test" : "Note") }),
    /* @__PURE__ */ jsx2("div", { className: "uipack-callout__body", children })
  ] });
}
function ChangeNote({ label = "What changed", kicker, children, id, className }) {
  if (!present(children)) fail("ChangeNote", "give it some content");
  return /* @__PURE__ */ jsxs2("div", { id, className: cx("uipack-change", className), children: [
    /* @__PURE__ */ jsxs2("p", { className: "uipack-change__label", children: [
      label,
      present(kicker) ? /* @__PURE__ */ jsxs2(Fragment2, { children: [
        " ",
        /* @__PURE__ */ jsx2("span", { className: "uipack-change__kicker", children: kicker })
      ] }) : null
    ] }),
    /* @__PURE__ */ jsx2("div", { className: "uipack-change__body", children })
  ] });
}
function LinkList({ label = "Go deeper", links, children, id, className }) {
  const rows = links ?? [];
  if (!rows.length && !present(children)) fail("LinkList", "give it `links` or inline children");
  rows.forEach((link, i) => {
    if (!link?.href) fail("LinkList", `link ${i} needs an \`href\``);
    if (!present(link.title)) fail("LinkList", `link ${i} (${link.href}) needs a \`title\``);
  });
  return /* @__PURE__ */ jsxs2("div", { id, className: cx("uipack-links", className), children: [
    /* @__PURE__ */ jsx2("p", { className: "uipack-links__label", children: label }),
    rows.length ? /* @__PURE__ */ jsx2("ul", { className: "uipack-links__list", role: "list", children: rows.map((link, i) => {
      const domain = link.domain === false ? void 0 : link.domain ?? linkDomain(link.href);
      return /* @__PURE__ */ jsx2("li", { className: "uipack-links__item", children: /* @__PURE__ */ jsxs2("a", { className: "uipack-links__link", href: link.href, children: [
        /* @__PURE__ */ jsx2("span", { className: "uipack-links__title", children: link.title }),
        domain ? /* @__PURE__ */ jsxs2(Fragment2, { children: [
          " ",
          /* @__PURE__ */ jsx2("span", { className: "uipack-links__domain", children: domain })
        ] }) : null
      ] }) }, `${link.href}-${i}`);
    }) }) : null,
    present(children) ? /* @__PURE__ */ jsx2("div", { className: "uipack-links__body", children }) : null
  ] });
}
export {
  Callout,
  ChangeNote,
  LayerHead,
  LinkList,
  NoteCard,
  NoteCluster,
  TermList,
  formatNoteDate,
  layerIndex,
  linkDomain
};
