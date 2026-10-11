import type { CSSProperties, ReactNode } from "react";
import type { ChartHeadingLevel } from "./SpanChart";

/* LayerStack: a stacked-layer diagram. Layers are given bottom to top and
   numbered that way (01 at the bottom), but drawn and read top-down, so the
   eye, the Tab key and a screen reader meet them in the same order. Bands are
   native <details>, rails and their list are links, and one CSS grid places
   everything, so static HTML needs no JavaScript. */

export interface StackZone {
  id: string;
  label: string;
  /** A short phrase after the label, e.g. "built once per model". */
  note?: string;
}

export interface StackLayer {
  id: string;
  label: string;
  /** Zone id; layers of one zone must be consecutive. */
  zone: string;
  /** One line: the constraint this layer lives under. */
  summary: string;
  metric?: { value: string; label: string };
  /** Shown when the band is opened, e.g. a self-test question. */
  detail?: string;
  /** The article section about this layer. */
  href?: string;
}

/** A cross-cutting topic beside the stack, spanning a contiguous range of layers. */
export interface StackRail {
  id: string;
  label: string;
  /** Lowest layer id the rail covers. */
  from: string;
  /** Highest layer id the rail covers. */
  to: string;
  summary?: string;
  href?: string;
}

/** A side annotation over a contiguous range of layers (a left column from 1000px, a label above the zone below that). */
export interface StackBracket {
  label: string;
  from: string;
  to: string;
}

export interface LayerStackLabels {
  /** Prefix read before each band's number. */
  layer: string;
  /** Rail range word, e.g. "layers 7–10". */
  layers: string;
  /** Singular of `layers`, for a one-layer range. */
  layerOne: string;
  /** Lead-in of the opened band's detail. */
  check: string;
  /** Link to the band's section. */
  read: string;
  /** Heading of the rail list under the stack. */
  rails: string;
}

export const LAYER_STACK_LABELS: LayerStackLabels = {
  layer: "Layer",
  layers: "layers",
  layerOne: "layer",
  check: "Check yourself",
  read: "Read the section",
  rails: "Across the stack",
};

export interface LayerStackProps {
  /** Unique on the page; prefixes element ids. */
  id: string;
  title?: ReactNode;
  caption?: ReactNode;
  zones: StackZone[];
  /** Bottom to top: the first layer is drawn at the bottom of the stack and numbered 01. */
  layers: StackLayer[];
  rails?: StackRail[];
  brackets?: StackBracket[];
  labels?: Partial<LayerStackLabels>;
  /**
   * Heading level of the title; zone and rail-list headings sit one level
   * below it. Default 3. "none" (or false) renders them as text, each zone a
   * `role="group"` named by its label.
   */
  headingLevel?: ChartHeadingLevel;
}

const fail = (chart: string, message: string): never => {
  throw new Error(`LayerStack "${chart}": ${message}`);
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Grid rows: `wide` from 1000px with a bracket column; `compact` below, with bracket labels above zones. */
interface Placed {
  wide: [number, number];
  compact: [number, number];
}

/** Validates the stack and assigns grid rows. Exported for tests. */
export function buildLayerStack(props: LayerStackProps) {
  const { id, layers, zones } = props;
  if (typeof id !== "string" || !/^\S+$/.test(id)) fail(String(id), "`id` must be a non-empty string without spaces");
  if (!Array.isArray(layers) || !layers.length) fail(id, "`layers` must list at least one layer");
  const labels = { ...LAYER_STACK_LABELS, ...props.labels };

  const zoneById = new Map<string, StackZone>();
  for (const zone of zones ?? []) {
    if (!zone?.id) fail(id, "every zone needs an `id`");
    if (zoneById.has(zone.id)) fail(id, `zone id "${zone.id}" is used twice`);
    zoneById.set(zone.id, zone);
  }
  const index = new Map<string, number>();
  layers.forEach((layer, i) => {
    if (!layer?.id) fail(id, `layer ${i} needs an \`id\``);
    if (index.has(layer.id)) fail(id, `layer id "${layer.id}" is used twice`);
    if (!layer.label) fail(id, `layer "${layer.id}" needs a \`label\``);
    if (!zoneById.has(layer.zone)) fail(id, `layer "${layer.id}" names unknown zone "${layer.zone}"`);
    index.set(layer.id, i);
  });

  // Zones bottom to top, each a contiguous run of layers.
  const runs: { zone: StackZone; start: number; end: number }[] = [];
  layers.forEach((layer, i) => {
    const last = runs[runs.length - 1];
    if (last?.zone.id === layer.zone) last.end = i;
    else if (runs.some((g) => g.zone.id === layer.zone)) fail(id, `zone "${layer.zone}" must cover consecutive layers; "${layer.id}" is separated from the rest`);
    else runs.push({ zone: zoneById.get(layer.zone)!, start: i, end: i });
  });

  const range = (kind: string, name: string, from: string, to: string) => {
    const a = index.get(from);
    const b = index.get(to);
    if (a === undefined) fail(id, `${kind} "${name}" starts at unknown layer "${from}"`);
    if (b === undefined) fail(id, `${kind} "${name}" ends at unknown layer "${to}"`);
    return [Math.min(a!, b!), Math.max(a!, b!)] as const;
  };
  const railIds = new Set<string>();
  const rails = (props.rails ?? []).map((rail) => {
    if (!rail?.id) fail(id, "every rail needs an `id`");
    if (railIds.has(rail.id)) fail(id, `rail id "${rail.id}" is used twice`);
    railIds.add(rail.id);
    if (!rail.label) fail(id, `rail "${rail.id}" needs a \`label\``);
    const [lo, hi] = range("rail", rail.id, rail.from, rail.to);
    const span = lo === hi ? `${labels.layerOne} ${lo + 1}` : `${labels.layers} ${lo + 1}–${hi + 1}`;
    return { rail, lo, hi, span };
  });
  const brackets = (props.brackets ?? []).map((bracket) => {
    if (!bracket?.label) fail(id, "every bracket needs a `label`");
    const [lo, hi] = range("bracket", bracket.label, bracket.from, bracket.to);
    return { bracket, lo, hi };
  });

  // Rows, top to bottom. Compact rows put each bracket's label just above
  // the zone heading of its top layer, or above that layer mid-zone.
  const rows = (compact: boolean) => {
    const at = new Map<string, number>();
    let r = 1;
    for (const g of [...runs].reverse()) {
      if (compact) brackets.forEach((b, k) => b.hi === g.end && at.set(`bracket:${k}`, r++));
      at.set(`zone:${g.zone.id}`, r++);
      for (let i = g.end; i >= g.start; i--) {
        if (compact) brackets.forEach((b, k) => b.hi === i && i !== g.end && at.set(`bracket:${k}`, r++));
        at.set(`layer:${i}`, r++);
      }
    }
    return at;
  };
  const wide = rows(false);
  const compact = rows(true);
  const one = (key: string): Placed => ({ wide: [wide.get(key) ?? 0, 1], compact: [compact.get(key)!, 1] });
  const span = (lo: number, hi: number, map: Map<string, number>): [number, number] => {
    const top = map.get(`layer:${hi}`)!;
    return [top, map.get(`layer:${lo}`)! - top + 1];
  };

  // Top zone first. Edges ramp up the stack in the accent; tints alternate.
  const zoneCount = runs.length;
  const zonesTopDown = [...runs].reverse().map((g) => {
    const k = runs.indexOf(g);
    return {
      ...g,
      ramp: zoneCount === 1 ? 70 : Math.round(30 + (60 * k) / (zoneCount - 1)),
      alt: k % 2 === 0,
      place: one(`zone:${g.zone.id}`),
      layers: layers
        .map((layer, i) => ({ layer, i, number: pad(i + 1), place: one(`layer:${i}`) }))
        .filter(({ i }) => i >= g.start && i <= g.end)
        .reverse(),
      brackets: brackets
        .map((b, k2) => ({ ...b, place: { wide: span(b.lo, b.hi, wide), compact: [compact.get(`bracket:${k2}`)!, 1] } as Placed }))
        .filter((b) => b.hi >= g.start && b.hi <= g.end),
    };
  });

  return {
    id,
    labels,
    zones: zonesTopDown,
    rails: rails.map((x) => ({ ...x, place: { wide: span(x.lo, x.hi, wide), compact: span(x.lo, x.hi, compact) } as Placed })),
    brackets: brackets.length,
  };
}

const place = (p: Placed, extra: Record<string, string | number> = {}) =>
  ({ "--rw": `${p.wide[0]} / span ${p.wide[1]}`, "--rc": `${p.compact[0]} / span ${p.compact[1]}`, ...extra }) as CSSProperties;

/**
 * A stacked-layer diagram for walking a stack bottom-up. Each band opens to
 * show its detail and a link to the section; rails beside the stack and the
 * list under it link to cross-cutting topics. Works as static HTML.
 */
export function LayerStack(props: LayerStackProps) {
  const model = buildLayerStack(props);
  const { id, labels } = model;
  const level = props.headingLevel ?? 3;
  const plain = level === "none" || level === false;
  const Title = plain ? "p" : (`h${level}` as "h3");
  const Sub = plain ? "p" : (`h${props.title ? Math.min(level + 1, 6) : level}` as "h4");

  return (
    <section
      className="uipack-stack"
      id={id}
      aria-labelledby={props.title ? `${id}-title` : undefined}
      data-rails={model.rails.length}
      data-brackets={model.brackets ? "" : undefined}
      style={{ "--ls-rails": model.rails.length } as CSSProperties}
    >
      {props.title || props.caption ? (
        <div className="uipack-stack__head">
          {props.title ? (
            <Title className="uipack-stack__title" id={`${id}-title`}>
              {props.title}
            </Title>
          ) : null}
          {props.caption ? <p className="uipack-stack__caption">{props.caption}</p> : null}
        </div>
      ) : null}
      <div className="uipack-stack__grid">
        {model.zones.map((g) => {
          const headId = `${id}-z-${g.zone.id}`;
          const tone = { "--ls-ramp": `${g.ramp}%` };
          return (
            <div className="uipack-stack__zone" key={g.zone.id} role={plain ? "group" : undefined} aria-labelledby={plain ? headId : undefined}>
              {g.brackets.map(({ bracket, lo, hi, place: p }) => (
                <p className="uipack-stack__bracket" key={`${bracket.label}-${lo}`} style={place(p)}>
                  {bracket.label}
                  <span className="uipack-stack__sr">
                    {", "}
                    {labels.layers} {lo + 1}–{hi + 1}
                  </span>
                </p>
              ))}
              <Sub className="uipack-stack__zone-head" id={headId} data-alt={g.alt ? "" : undefined} style={place(g.place, tone)}>
                <span>{g.zone.label}</span>
                {g.zone.note ? <span className="uipack-stack__note">{g.zone.note}</span> : null}
              </Sub>
              {g.layers.map(({ layer, number, place: p }) => {
                const face = (
                  <>
                    <i aria-hidden="true" />
                    <span className="uipack-stack__index">
                      <span className="uipack-stack__sr">{labels.layer} </span>
                      {number}
                    </span>
                    <span className="uipack-stack__text">
                      <b>{layer.label}</b>
                      <span className="uipack-stack__sr">. </span> <span className="uipack-stack__summary">{layer.summary}</span>
                    </span>
                    {layer.metric ? (
                      <span className="uipack-stack__metric">
                        <span className="uipack-stack__sr">. </span>
                        <strong>{layer.metric.value}</strong> <span>{layer.metric.label}</span>
                      </span>
                    ) : null}
                  </>
                );
                const attrs = {
                  className: "uipack-stack__band",
                  id: `${id}-${layer.id}`,
                  "data-alt": g.alt ? "" : undefined,
                  style: place(p, tone),
                };
                return layer.detail || layer.href ? (
                  <details {...attrs} key={layer.id}>
                    <summary className="uipack-stack__face">{face}</summary>
                    <div className="uipack-stack__detail">
                      {layer.detail ? (
                        <p>
                          <span className="uipack-stack__check">{labels.check}</span> {layer.detail}
                        </p>
                      ) : null}
                      {layer.href ? (
                        <a className="uipack-stack__read" href={layer.href}>
                          {labels.read} <span aria-hidden="true">→</span>
                        </a>
                      ) : null}
                    </div>
                  </details>
                ) : (
                  <div {...attrs} key={layer.id}>
                    <div className="uipack-stack__face" data-static="">
                      {face}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {model.rails.map(({ rail, place: p }, k) => {
          // The bars are a pointer shortcut; the list under the stack is the accessible route.
          // Rail columns: after the stack, or after the bracket column from 1000px.
          const style = place(p, { "--cn": k + 2, "--cw": k + 3 });
          return rail.href ? (
            <a className="uipack-stack__rail" href={rail.href} key={rail.id} style={style} aria-hidden="true" tabIndex={-1}>
              <span>{rail.label}</span>
            </a>
          ) : (
            <span className="uipack-stack__rail" key={rail.id} style={style} aria-hidden="true">
              <span>{rail.label}</span>
            </span>
          );
        })}
      </div>
      {model.rails.length ? (
        <div className="uipack-stack__across">
          <Sub className="uipack-stack__across-head" id={`${id}-across`}>
            {labels.rails}
          </Sub>
          <ul role="list" aria-labelledby={`${id}-across`}>
            {model.rails.map(({ rail, span }) => (
              <li key={rail.id}>
                <span className="uipack-stack__across-name">
                  {rail.href ? <a href={rail.href}>{rail.label}</a> : <strong>{rail.label}</strong>}
                  <span className="uipack-stack__span">{span}</span>
                </span>
                {rail.summary ? <span className="uipack-stack__across-summary">{rail.summary}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
