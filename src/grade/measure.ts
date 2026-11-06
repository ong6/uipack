/**
 * What the tier-1 grader reads from a rendered page. Each function here runs INSIDE the page (via
 * `page.evaluate`), so it is self-contained: no imports, no outer variables, only its argument.
 * They measure; they do not judge. rules.ts turns these measurements into pass/fail against a
 * site spec, which keeps every threshold testable without a browser.
 *
 * Generalised from e2e/page-audit.ts (cardRows, pairedBoxRows, controlRows, outline, checkTextFaces,
 * checkFocusRingsNotClipped, checkNoOverflow) and e2e/geometry.spec.ts (the SVG text floor), so a
 * page outside the playground is held to the same rules. Boxes are in document coordinates (CSS px
 * from the page's top-left), ready for a full-page screenshot clip.
 */
import type { RGBA } from "./color";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One element a check points at. */
export interface Spot {
  selector: string;
  text: string;
  box: Box;
}

export interface TextSample extends Spot {
  px: number;
  weight: number;
  family: string;
  /** Text colour with every ancestor's opacity folded into its alpha; null when not a flat colour. */
  color: RGBA | null;
  /** Backgrounds from the element outwards, until an opaque one; null when an image or gradient is behind. */
  layers: RGBA[] | null;
  /** The page base under every layer (the canvas colour). */
  base: RGBA;
  /** Index into spec.textFloors of the first floor whose selector matches, or -1. */
  floor: number;
  inSvg: boolean;
  disabled: boolean;
  /** Whether the contrast check reads this sample (spec ignore lists applied in the page). */
  contrastable: boolean;
  /**
   * When `layers` is null: the darkest and lightest background behind the text, read from a
   * screenshot with the text hidden (10th and 90th percentile of luminance, so an underline or a
   * stray pixel does not decide it).
   */
  sampled?: RGBA[];
}

export interface ClipSample extends Spot {
  /** The clipping box: the element itself or the ancestor that hides the overflow. */
  clipBy: string;
  overflowPx: number;
}

export interface RowSample {
  kind: "cards" | "paired" | "controls";
  where: string;
  heights: number[];
  /** Top of each card's last action (link or button), or null when a card has none. */
  actions: (number | null)[] | null;
  boxes: Box[];
}

export interface TargetSample extends Spot {
  inline: boolean;
}

export interface Measurements {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  scrollWidth: number;
  docHeight: number;
  /** Elements that start the horizontal overflow (their right edge is past the viewport, their parent's is not). */
  overflowers: Spot[];
  clipped: ClipSample[];
  texts: TextSample[];
  /** Each text node's line boxes, for the overlap check; `owner` indexes `texts`. */
  lines: { owner: number; rects: Box[] }[];
  rows: RowSample[];
  targets: TargetSample[];
  images: (Spot & { issue: string })[];
  headings: (Spot & { level: number })[];
  /** Platform-font sample: elements marked with data-uipack-grade-font for the CDP pass. */
  fontSamples: number;
  bodyBackground: string;
}

export interface MeasureOptions {
  scope: string;
  ignore: string[];
  ignoreByCheck: Record<string, string[] | undefined>;
  floors: string[];
  cardMinHeight: number;
  maxFontSamples: number;
}

/** Measures one rendered page. Runs in the browser. */
export function measurePage(opt: MeasureOptions): Measurements {
  const doc = document;
  const root = doc.querySelector(opt.scope) ?? doc.body;
  const ignoreSel = opt.ignore.join(", ");
  const ignoredFor = (check: string) => [...opt.ignore, ...(opt.ignoreByCheck[check] ?? [])].join(", ");
  const skipped = (el: Element, sel: string) => (sel ? !!el.closest(sel) : false);
  const sx = window.scrollX;
  const sy = window.scrollY;
  const boxOf = (r: DOMRect | { left: number; top: number; width: number; height: number }): Box => ({
    x: Math.round(r.left + sx),
    y: Math.round(r.top + sy),
    w: Math.round(r.width),
    h: Math.round(r.height),
  });
  const label = (el: Element) => {
    const cls = [...el.classList].filter((c) => !c.startsWith("css-")).slice(0, 3);
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls.length ? `.${cls.join(".")}` : ""}`;
  };
  // A short path that names the element and up to three ancestors; ids end the walk.
  const cssPath = (el: Element) => {
    const parts: string[] = [];
    for (let e: Element | null = el; e && e !== doc.documentElement && parts.length < 4; e = e.parentElement) {
      let part = label(e);
      const parent: Element | null = e.parentElement;
      if (parent && !e.id) {
        const same = [...parent.children].filter((c) => c.tagName === e!.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(e) + 1})`;
      }
      parts.unshift(part);
      if (e.id) break;
    }
    return parts.join(" > ");
  };
  const textOf = (el: Element) =>
    (el.textContent || el.getAttribute("aria-label") || el.getAttribute("alt") || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const spot = (el: Element, r?: DOMRect): Spot => ({
    selector: cssPath(el),
    text: textOf(el),
    box: boxOf(r ?? el.getBoundingClientRect()),
  });

  const styleCache = new Map<Element, CSSStyleDeclaration>();
  const cs = (el: Element) => {
    let s = styleCache.get(el);
    if (!s) styleCache.set(el, (s = getComputedStyle(el)));
    return s;
  };
  // Screen-reader-only text and anything hidden, transparent or collapsed is not drawn.
  const hiddenCache = new Map<Element, boolean>();
  const hidden = (el: Element): boolean => {
    const known = hiddenCache.get(el);
    if (known !== undefined) return known;
    const s = cs(el);
    let out =
      s.display === "none" ||
      s.opacity === "0" ||
      s.clipPath === "inset(50%)" ||
      s.clip === "rect(0px, 0px, 0px, 0px)" ||
      el.hasAttribute("hidden") ||
      (el instanceof HTMLElement && el.offsetWidth <= 1 && el.offsetHeight <= 1 && s.overflow === "hidden");
    if (!out && el.parentElement) out = hidden(el.parentElement);
    hiddenCache.set(el, out);
    return out;
  };
  // checkVisibility also sees content-visibility: hidden (a closed <details>, whose children keep stale boxes).
  const checks = (el: Element) =>
    typeof el.checkVisibility !== "function" ||
    el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true });
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && cs(el).visibility !== "hidden" && !hidden(el) && checks(el);
  };

  // Any CSS colour to RGBA, through a 1px canvas, so oklch(), color-mix() and color(srgb …) all read.
  const canvas = doc.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const colorCache = new Map<string, [number, number, number, number]>();
  const rgba = (c: string): [number, number, number, number] => {
    const known = colorCache.get(c);
    if (known) return known;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const out: [number, number, number, number] = [d[0], d[1], d[2], d[3] / 255];
    colorCache.set(c, out);
    return out;
  };
  const htmlBg = rgba(cs(doc.documentElement).backgroundColor);
  const bodyBg = rgba(cs(doc.body).backgroundColor);
  const base: [number, number, number, number] = htmlBg[3] >= 1 ? htmlBg : bodyBg[3] >= 1 ? bodyBg : [255, 255, 255, 1];
  const layersCache = new Map<Element, [number, number, number, number][] | null>();
  const layersOf = (el: Element): [number, number, number, number][] | null => {
    if (layersCache.has(el)) return layersCache.get(el)!;
    const s = cs(el);
    let out: [number, number, number, number][] | null;
    if (s.backgroundImage !== "none" && !(el === doc.body || el === doc.documentElement)) out = null;
    else {
      const own = rgba(s.backgroundColor);
      const rest = own[3] >= 1 || !el.parentElement ? [] : layersOf(el.parentElement);
      out = rest === null ? null : own[3] > 0 ? [own, ...rest] : rest;
    }
    layersCache.set(el, out);
    return out;
  };
  const opacityOf = (el: Element) => {
    let o = 1;
    for (let e: Element | null = el; e; e = e.parentElement) o *= parseFloat(cs(e).opacity) || 0;
    return o;
  };

  const inScope = (el: Element) => root.contains(el) && !skipped(el, ignoreSel);
  const all = [...root.querySelectorAll("*")].filter((el) => !el.closest("script, style, noscript, template, head"));

  // overflow-x: the elements that start it. An element inside a box that scrolls or clips sideways is contained.
  const vw = doc.documentElement.clientWidth;
  const contained = (el: Element) => {
    for (let a = el.parentElement; a && a !== doc.body && a !== doc.documentElement; a = a.parentElement)
      if (/(auto|scroll|hidden|clip)/.test(cs(a).overflowX)) return true;
    return false;
  };
  const overflowers: Spot[] = [];
  const pastEdge = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.right + sx > vw + 1;
  };
  for (const el of all) {
    if (!inScope(el) || !pastEdge(el) || cs(el).position === "fixed" || hidden(el) || contained(el)) continue;
    if (el.parentElement && el.parentElement !== root && pastEdge(el.parentElement) && !contained(el.parentElement)) continue;
    overflowers.push(spot(el));
  }

  // Text: every visible element with its own words.
  const texts: TextSample[] = [];
  const lines: { owner: number; rects: Box[] }[] = [];
  const clipped: ClipSample[] = [];
  const contrastIgnore = ignoredFor("contrast");
  const clipIgnore = ignoredFor("text-clip");
  const overlapIgnore = ignoredFor("text-overlap");
  let fontSamples = 0;
  const seenStacks = new Set<string>();
  for (const el of all) {
    const own = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && /\S/.test(n.textContent ?? ""));
    if (!own.length || !inScope(el) || !visible(el)) continue;
    const s = cs(el);
    const inSvg = el instanceof SVGElement;
    let px = parseFloat(s.fontSize);
    if (inSvg) {
      const m = (el as SVGGraphicsElement).getScreenCTM?.();
      if (m) px *= Math.hypot(m.a, m.b);
    }
    const ink = inSvg ? s.fill : s.color;
    const fg = /^url\(/.test(ink) ? null : ([...rgba(ink)] as [number, number, number, number]);
    const fill = s.getPropertyValue("-webkit-text-fill-color");
    // Text painted by its background (background-clip: text) is drawn, but not in a flat colour.
    const clipText = s.getPropertyValue("background-clip") === "text" || s.getPropertyValue("-webkit-background-clip") === "text";
    if (fg && fill && fill !== ink && !clipText) fg.splice(0, 4, ...rgba(fill));
    // Transparent text that nothing paints is a spacer (a width-holding ghost), not drawn text.
    if (fg && fg[3] < 0.02 && !clipText) continue;
    if (fg) fg[3] *= opacityOf(el);
    const floor = opt.floors.findIndex((f) => !!el.closest(f));
    const disabled = !!el.closest(":disabled, [aria-disabled='true']");
    const sample: TextSample = {
      ...spot(el),
      text: own
        .map((n) => n.textContent)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60),
      px: Math.round(px * 100) / 100,
      weight: parseInt(s.fontWeight, 10) || 400,
      family: s.fontFamily,
      color: clipText ? null : fg,
      layers: layersOf(el),
      base,
      floor,
      inSvg,
      disabled,
      contrastable: !inSvg && !skipped(el, contrastIgnore),
    };
    const index = texts.push(sample) - 1;
    el.setAttribute("data-uipack-grade-t", String(index));
    // Over an image or gradient: run.ts samples the pixels behind it with the text hidden.
    if (sample.contrastable && !disabled && sample.color && !sample.layers)
      el.setAttribute("data-uipack-grade-bg", String(index));
    // Line boxes of each text node: the overlap check compares them across elements.
    if (!skipped(el, overlapIgnore)) {
      const rects: Box[] = [];
      for (const n of own) {
        const range = doc.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1) rects.push(boxOf(r));
      }
      if (rects.length) lines.push({ owner: index, rects });
    }
    // Clipping: the nearest box that hides overflow (not one that scrolls) cuts part of the text.
    if (!skipped(el, clipIgnore) && !inSvg) {
      const lineClamp = s.getPropertyValue("-webkit-line-clamp");
      const intended = s.textOverflow === "ellipsis" || (lineClamp && lineClamp !== "none");
      if (!intended) {
        let clip: Element | null = null;
        for (let a: Element | null = el; a && a !== doc.body; a = a.parentElement) {
          const as = cs(a);
          if (/(auto|scroll)/.test(as.overflowX + as.overflowY)) break;
          if (/(hidden|clip)/.test(as.overflowX + as.overflowY)) {
            clip = a;
            break;
          }
        }
        if (clip && !(cs(clip).textOverflow === "ellipsis")) {
          const c = clip.getBoundingClientRect();
          const range = doc.createRange();
          range.selectNodeContents(el);
          const t = range.getBoundingClientRect();
          const intersects = t.right > c.left && t.left < c.right && t.bottom > c.top && t.top < c.bottom;
          const over = Math.max(c.left - t.left, t.right - c.right, c.top - t.top, t.bottom - c.bottom);
          if (intersects && over > 1.5)
            clipped.push({ ...spot(el, t), clipBy: cssPath(clip), overflowPx: Math.round(over * 10) / 10 });
        }
      }
    }
    // Platform-font sample for the CDP pass: every distinct stack first, then the rest up to the cap.
    const key = `${s.fontFamily}|${s.fontWeight}|${s.fontStyle}`;
    if (
      fontSamples < opt.maxFontSamples &&
      (!seenStacks.has(key) || fontSamples < opt.maxFontSamples / 2 || /[^\x20-\x7e]/.test(sample.text))
    ) {
      seenStacks.add(key);
      el.setAttribute("data-uipack-grade-font", String(index));
      fontSamples++;
    }
  }

  // Rows: cards sharing a row, paired boxes, and controls side by side (e2e/page-audit.ts).
  const rows: RowSample[] = [];
  const rowIgnore = ignoredFor("row-heights");
  const boxed = (el: Element) => {
    const s = cs(el);
    return parseFloat(s.borderTopWidth) > 0 || rgba(s.backgroundColor)[3] > 0;
  };
  const shown = (el: Element) => {
    const r = el.getBoundingClientRect();
    const s = cs(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const h = (el: Element) => Math.round(el.getBoundingClientRect().height);
  for (const parent of all) {
    if (!inScope(parent) || parent.closest("svg, canvas") || skipped(parent, rowIgnore) || hidden(parent)) continue;
    const s = cs(parent);
    const grid = s.display.includes("grid");
    const flexRow = s.display.includes("flex") && s.flexDirection.startsWith("row");
    if (!grid && !flexRow) continue;
    const byTop = new Map<number, Element[]>();
    for (const kid of [...parent.children].filter(shown)) {
      const top = Math.round(kid.getBoundingClientRect().top);
      byTop.set(top, [...(byTop.get(top) ?? []), kid]);
    }
    for (const row of byTop.values()) {
      if (row.length < 2) continue;
      const cardsRow = (grid || s.flexWrap === "wrap") && row.every((k) => boxed(k) && h(k) > opt.cardMinHeight);
      if (cardsRow) {
        rows.push({
          kind: "cards",
          where: `${label(parent)} > ${label(row[0])}`,
          heights: row.map(h),
          actions: row.map((k) => {
            const last = [...k.querySelectorAll("a, button")].filter(shown).pop();
            return last ? Math.round(last.getBoundingClientRect().top) : null;
          }),
          boxes: row.map((k) => boxOf(k.getBoundingClientRect())),
        });
        continue;
      }
      // Paired: unboxed wrappers with the same number of children, whose i-th children are boxes.
      const n = row[0].children.length;
      if (n < 2 || row.some(boxed) || row.some((k) => k.children.length !== n)) continue;
      for (let i = 0; i < n; i++) {
        const boxes = row.map((k) => k.children[i]);
        if (!boxes.every((b) => shown(b) && boxed(b) && b.tagName.toLowerCase() !== "svg")) continue;
        const heights = boxes.map(h);
        if (Math.max(...heights) < 40) continue;
        rows.push({
          kind: "paired",
          where: `${label(parent)} > ${label(boxes[0])}`,
          heights,
          actions: null,
          boxes: boxes.map((b) => boxOf(b.getBoundingClientRect())),
        });
      }
    }
  }
  const controls = [...root.querySelectorAll("button, select, input:not([type=radio], [type=checkbox], [type=hidden])")].filter(
    (c) => visible(c) && inScope(c) && !c.closest("svg") && !skipped(c, rowIgnore),
  );
  const byParent = new Map<Element, Element[]>();
  for (const c of controls) byParent.set(c.parentElement!, [...(byParent.get(c.parentElement!) ?? []), c]);
  for (const [parent, list] of byParent) {
    const lineMap = new Map<number, Element[]>();
    for (const c of list) {
      const r = c.getBoundingClientRect();
      const mid = Math.round(r.top + r.height / 2);
      const key = [...lineMap.keys()].find((k) => Math.abs(k - mid) < 6) ?? mid;
      lineMap.set(key, [...(lineMap.get(key) ?? []), c]);
    }
    for (const row of lineMap.values())
      if (row.length > 1)
        rows.push({
          kind: "controls",
          where: `${label(parent)}: ${row.map((c) => textOf(c).slice(0, 16)).join(" | ")}`,
          heights: row.map(h),
          actions: null,
          boxes: row.map((c) => boxOf(c.getBoundingClientRect())),
        });
  }

  // Tap targets. A link inside a run of text is exempt (WCAG 2.5.8's inline exception); a check box
  // or radio counts its label's box.
  const targetIgnore = ignoredFor("tap-targets");
  const targets: TargetSample[] = [];
  const interactive =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=checkbox], [role=switch], [role=menuitem], [role=option], [tabindex]:not([tabindex='-1'])";
  for (const el of root.querySelectorAll(interactive)) {
    if (!inScope(el) || skipped(el, targetIgnore) || !visible(el)) continue;
    if (el.parentElement?.closest(interactive)) continue; // the outer control is the target
    let r = el.getBoundingClientRect();
    if (el instanceof HTMLInputElement && ["checkbox", "radio"].includes(el.type)) {
      const lab = el.closest("label") ?? (el.id ? doc.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null);
      if (lab) r = lab.getBoundingClientRect();
    }
    const display = cs(el).display;
    const block = el.parentElement;
    const inline =
      display === "inline" &&
      !!block &&
      [...block.childNodes].some((n) => n !== el && n.nodeType === Node.TEXT_NODE && /\w/.test(n.textContent ?? ""));
    targets.push({ ...spot(el, r), inline });
  }

  // Images: alt present (empty marks decoration); role=img named.
  const images: (Spot & { issue: string })[] = [];
  const imgIgnore = ignoredFor("img-alt");
  for (const el of root.querySelectorAll("img, input[type=image], [role=img], area[href]")) {
    if (!inScope(el) || skipped(el, imgIgnore) || el.closest("[aria-hidden='true']")) continue;
    const named = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby") || el.hasAttribute("title");
    if (el.matches("img, input[type=image], area") && !el.hasAttribute("alt") && !named)
      images.push({ ...spot(el), text: el.getAttribute("src")?.slice(-60) ?? "", issue: "no alt attribute" });
    else if (el.getAttribute("role") === "img" && !named && !el.querySelector(":scope > title"))
      images.push({ ...spot(el), issue: "role=img without an accessible name" });
  }

  // Headings in document order, visible ones only.
  const headings: (Spot & { level: number })[] = [];
  for (const el of root.querySelectorAll("h1, h2, h3, h4, h5, h6, [role=heading][aria-level]")) {
    if (!inScope(el) || skipped(el, ignoredFor("heading-order")) || !visible(el)) continue;
    const level = /^H\d$/.test(el.tagName) ? Number(el.tagName[1]) : Number(el.getAttribute("aria-level"));
    headings.push({ ...spot(el), level });
  }

  return {
    url: location.href,
    title: doc.title,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    scrollWidth: doc.documentElement.scrollWidth,
    docHeight: doc.documentElement.scrollHeight,
    overflowers,
    clipped,
    texts,
    lines,
    rows,
    targets,
    images,
    headings,
    fontSamples,
    bodyBackground: cs(doc.body).backgroundColor,
  };
}

/** One step of the keyboard walk: the focused element, its focus styles, and whether a box clips its ring. Runs in the browser. */
export interface FocusSample extends Spot {
  /** Whether any drawn property differs between focused and unfocused, or a ring is drawn. */
  indicator: boolean;
  /** Why the indicator reads as visible ("outline 2px", "box-shadow", "background"…), or empty. */
  how: string;
  /** Set when the ring reaches past a box that clips or scrolls. */
  clippedBy: string | null;
  /** A crop taken while the element held focus (run.ts), relative to the report. */
  crop?: string;
}

export function measureFocus(ignore: string): FocusSample | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body || el === document.documentElement) return null;
  if (ignore && el.closest(ignore))
    return { selector: "", text: "", box: { x: 0, y: 0, w: 0, h: 0 }, indicator: true, how: "ignored", clippedBy: null };
  const props = [
    "outlineStyle",
    "outlineWidth",
    "outlineColor",
    "boxShadow",
    "borderTopColor",
    "borderBottomColor",
    "backgroundColor",
    "color",
    "textDecorationLine",
    "display",
    "visibility",
    "opacity",
    "stroke",
    "strokeWidth",
    "fill",
  ] as const;
  const read = (e: Element | null, pseudo?: string) => {
    if (!e) return "";
    const s = getComputedStyle(e, pseudo);
    return [...props.map((p) => s[p]), pseudo ? s.content : ""].join("|");
  };
  // The element, its pseudo-elements, its parent (:focus-within) and its first descendants (an SVG
  // focus ring drawn as a child, a node border that turns accent).
  const parts = () => [el, el.parentElement, ...[...el.querySelectorAll("*")].slice(0, 12)];
  const snapshot = () => [
    read(el),
    read(el, "::before"),
    read(el, "::after"),
    ...parts()
      .slice(1)
      .map((e) => read(e)),
  ];
  const s = getComputedStyle(el);
  const ringWidth = s.outlineStyle !== "none" ? parseFloat(s.outlineWidth) : 0;
  const shadow = s.boxShadow !== "none";
  const focused = snapshot();
  el.blur();
  const plain = snapshot();
  el.focus({ preventScroll: true });
  const names = [
    "self",
    "::before",
    "::after",
    "parent",
    ...parts()
      .slice(2)
      .map((e) => e?.tagName.toLowerCase() ?? ""),
  ];
  const changed = [...new Set(names.filter((_, i) => focused[i] !== plain[i]))];
  const how =
    ringWidth >= 1
      ? `outline ${ringWidth}px`
      : shadow && changed.includes("self")
        ? "box-shadow"
        : changed.length
          ? `changes ${changed.join(", ")}`
          : "";
  // A ring needs room inside the nearest box that scrolls or clips (page-audit checkFocusRingsNotClipped).
  let clippedBy: string | null = null;
  if (ringWidth >= 1 && !el.closest("svg")) {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const as = getComputedStyle(a);
      if (/(hidden|clip|auto|scroll)/.test(as.overflowX + as.overflowY)) {
        const reach = ringWidth + parseFloat(s.outlineOffset);
        const r = el.getBoundingClientRect();
        const c = a.getBoundingClientRect();
        const onScreen = !(r.right < c.left || r.left > c.right);
        const room = Math.min(r.left - c.left, c.right - r.right, r.top - c.top, c.bottom - r.bottom);
        if (onScreen && room < reach - 0.5 && r.left >= c.left - 0.5 && r.right <= c.right + 0.5)
          clippedBy = `${a.tagName.toLowerCase()}.${[...a.classList].join(".")} (needs ${reach}px, has ${room.toFixed(1)}px)`;
        break;
      }
    }
  }
  const r = el.getBoundingClientRect();
  const cls = [...el.classList].slice(0, 3);
  return {
    selector: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls.length ? `.${cls.join(".")}` : ""}`,
    text: (el.textContent || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 40),
    box: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
    indicator: !!how,
    how,
    clippedBy,
  };
}

/** Animations still running at rest, and SVG animations not paused. Runs in the browser. */
export interface MotionSample extends Spot {
  what: string;
}

export function measureMotion(ignore: string): MotionSample[] {
  const out: MotionSample[] = [];
  const name = (el: Element) =>
    `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${[...el.classList]
      .slice(0, 3)
      .map((c) => `.${c}`)
      .join("")}`;
  const boxOf = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  };
  for (const a of document.getAnimations()) {
    if (a.playState !== "running") continue;
    const effect = a.effect as KeyframeEffect | null;
    const target = effect?.target as Element | null;
    if (!target || (ignore && target.closest(ignore))) continue;
    const timing = effect!.getComputedTiming();
    const remaining = (Number(timing.endTime) || 0) - (Number(a.currentTime) || 0);
    if (timing.iterations !== Infinity && remaining <= 1000) continue;
    const props = [
      ...new Set(
        effect!
          .getKeyframes()
          .flatMap((k) => Object.keys(k).filter((p) => !["offset", "easing", "composite", "computedOffset"].includes(p))),
      ),
    ];
    const label = (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? "script animation";
    out.push({
      selector: name(target),
      text: (target.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
      box: boxOf(target),
      what: `${label} (${props.join(", ") || "?"}; ${timing.iterations === Infinity ? "loops" : `${Math.round(remaining)}ms left`})`,
    });
  }
  for (const svg of document.querySelectorAll("svg")) {
    if ((ignore && svg.closest(ignore)) || !svg.getClientRects().length) continue;
    // Only looping ones: a finished, frozen animation is not motion.
    const smil = [...svg.querySelectorAll("animate, animateMotion, animateTransform")].filter(
      (a) => a.getAttribute("repeatCount") === "indefinite" || a.getAttribute("repeatDur") === "indefinite",
    );
    if (smil.length && !svg.animationsPaused())
      out.push({
        selector: name(svg),
        text: svg.getAttribute("aria-label")?.slice(0, 40) ?? "",
        box: boxOf(svg),
        what: `${smil.length} looping SVG animation(s) running`,
      });
  }
  return out;
}
