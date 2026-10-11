import type { CSSProperties, ReactNode } from "react";

/* LayerStack: a stacked-layer diagram, bottom layer drawn at the bottom.
   Bands are native <details>, rails are links, brackets are annotations; one
   CSS grid places all of them, so static HTML needs no JavaScript. */

export interface StackZone {
  id: string;
  label: string;
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

/** A cross-cutting column beside the stack, spanning a contiguous range of layers. */
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

/** A side annotation over a contiguous range of layers. */
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
  /** Heading of the opened band's detail. */
  check: string;
  /** Link to the band's section. */
  read: string;
  /** Caption over the rail chips on narrow screens. */
  rails: string;
}

export const LAYER_STACK_LABELS: LayerStackLabels = {
  layer: "Layer",
  layers: "layers",
  layerOne: "layer",
  check: "Check yourself",
  read: "Read the section",
  rails: "Across layers",
};

export interface LayerStackProps {
  /** Unique on the page; prefixes element ids. */
  id: string;
  title?: ReactNode;
  caption?: ReactNode;
  zones: StackZone[];
  /** Bottom to top: the first layer is drawn at the bottom of the stack. */
  layers: StackLayer[];
  rails?: StackRail[];
  brackets?: StackBracket[];
  labels?: Partial<LayerStackLabels>;
  /** Heading level of the title; zone headings sit one level below it. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5;
}

const fail = (chart: string, message: string): never => {
  throw new Error(`LayerStack "${chart}": ${message}`);
};

const pad = (n: number) => String(n).padStart(2, "0");

interface Placed {
  /** Wide grid: first row and row count. */
  wide: [number, number];
  /** Narrow grid: row. */
  narrow: number;
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
  const groups: { zone: StackZone; tone: number; start: number; end: number }[] = [];
  layers.forEach((layer, i) => {
    const last = groups[groups.length - 1];
    if (last?.zone.id === layer.zone) last.end = i;
    else if (groups.some((g) => g.zone.id === layer.zone)) fail(id, `zone "${layer.zone}" must cover consecutive layers; "${layer.id}" is separated from the rest`);
    else groups.push({ zone: zoneById.get(layer.zone)!, tone: groups.length % 4, start: i, end: i });
  });
  const zoneOf = (i: number) => groups.find((g) => i >= g.start && i <= g.end)!;

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

  // Wide rows, top to bottom: each zone's heading, then its layers, top first.
  const wideRow = new Map<string, number>();
  let r = 1;
  for (const g of [...groups].reverse()) {
    wideRow.set(`zone:${g.zone.id}`, r++);
    for (let i = g.end; i >= g.start; i--) wideRow.set(`layer:${i}`, r++);
  }
  const wideSpan = (lo: number, hi: number): [number, number] => {
    const top = wideRow.get(`layer:${hi}`)!;
    return [top, wideRow.get(`layer:${lo}`)! - top + 1];
  };

  // Narrow rows: a bracket's label sits just above the zone heading of its
  // top layer (or above that layer when the bracket starts mid-zone).
  const narrowRow = new Map<string, number>();
  const bracketRows: number[] = new Array(brackets.length);
  r = 1;
  for (const g of [...groups].reverse()) {
    brackets.forEach((b, k) => {
      if (b.hi === g.end) bracketRows[k] = r++;
    });
    narrowRow.set(`zone:${g.zone.id}`, r++);
    for (let i = g.end; i >= g.start; i--) {
      brackets.forEach((b, k) => {
        if (b.hi === i && i !== g.end) bracketRows[k] = r++;
      });
      narrowRow.set(`layer:${i}`, r++);
    }
  }
  // The narrow rail list starts with its caption row.
  const railsRow = r + 1;

  return {
    id,
    labels,
    layers: layers.map((layer, i) => ({
      layer,
      number: pad(i + 1),
      tone: zoneOf(i).tone,
      place: { wide: [wideRow.get(`layer:${i}`)!, 1], narrow: narrowRow.get(`layer:${i}`)! } as Placed,
    })),
    zones: groups.map((g) => {
      const narrow = narrowRow.get(`zone:${g.zone.id}`)!;
      return {
        ...g,
        place: { wide: [wideRow.get(`zone:${g.zone.id}`)!, 1], narrow } as Placed,
        /** A bracket label sits directly above this zone heading on narrow screens. */
        afterBracket: bracketRows.includes(narrow - 1),
      };
    }),
    rails: rails.map((x, k) => ({ ...x, place: { wide: wideSpan(x.lo, x.hi), narrow: railsRow + k } as Placed })),
    railsCaptionRow: railsRow - 1,
    brackets: brackets.map((x, k) => ({ ...x, place: { wide: wideSpan(x.lo, x.hi), narrow: bracketRows[k] } as Placed })),
  };
}

const place = (p: Placed, extra: Record<string, string | number> = {}) =>
  ({ "--rw": `${p.wide[0]} / span ${p.wide[1]}`, "--rn": p.narrow, ...extra }) as CSSProperties;

/**
 * A stacked-layer diagram for walking a stack bottom-up. Each band opens to
 * show its detail and a link to the section; rails beside the stack link to
 * cross-cutting topics; brackets annotate ranges. Works as static HTML.
 */
export function LayerStack(props: LayerStackProps) {
  const model = buildLayerStack(props);
  const { id, labels } = model;
  const level = props.headingLevel ?? 3;
  const Title = `h${level}` as const;
  const Zone = `h${props.title ? Math.min(level + 1, 6) : level}` as "h4";

  return (
    <section
      className="uipack-stack"
      id={id}
      aria-labelledby={props.title ? `${id}-title` : undefined}
      data-rails={model.rails.length}
      data-brackets={model.brackets.length ? "" : undefined}
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
        {model.zones.map((g) => (
          <Zone
            className="uipack-stack__zone"
            key={g.zone.id}
            data-tone={g.tone}
            data-top-wide={g.place.wide[0] === 1 ? "" : undefined}
            data-top-narrow={g.place.narrow === 1 ? "" : undefined}
            data-after-bracket={g.afterBracket ? "" : undefined}
            style={place(g.place)}
          >
            {g.zone.label}
          </Zone>
        ))}
        {model.layers.map(({ layer, number, tone, place: p }) => {
          const body = (
            <>
              <span className="uipack-stack__index">
                <span className="uipack-stack__sr">{labels.layer} </span>
                {number}
              </span>
              <span className="uipack-stack__name">{layer.label}</span>
              <span className="uipack-stack__summary">{layer.summary}</span>
              {layer.metric ? (
                <span className="uipack-stack__metric">
                  <span className="uipack-stack__metric-value">{layer.metric.value}</span>
                  <span className="uipack-stack__metric-label">{layer.metric.label}</span>
                </span>
              ) : null}
            </>
          );
          const open = layer.detail || layer.href;
          return open ? (
            <details className="uipack-stack__band" key={layer.id} id={`${id}-${layer.id}`} data-tone={tone} style={place(p)}>
              <summary className="uipack-stack__face">
                {body}
                <span className="uipack-stack__chevron" aria-hidden="true" />
              </summary>
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
            <div className="uipack-stack__band" key={layer.id} id={`${id}-${layer.id}`} data-tone={tone} style={place(p)}>
              <div className="uipack-stack__face">{body}</div>
            </div>
          );
        })}
        {model.brackets.map(({ bracket, lo, hi, place: p }) => (
          <p
            className="uipack-stack__bracket"
            key={`${bracket.label}-${lo}`}
            data-top-narrow={p.narrow === 1 ? "" : undefined}
            style={place(p)}
          >
            <span className="uipack-stack__bracket-label">{bracket.label}</span>
            <span className="uipack-stack__sr">
              {", "}
              {labels.layers} {lo + 1}–{hi + 1}
            </span>
          </p>
        ))}
        {model.rails.length ? (
          <p className="uipack-stack__rails-caption" aria-hidden="true" style={{ "--rn": model.railsCaptionRow } as CSSProperties}>
            {labels.rails}
          </p>
        ) : null}
        {model.rails.map(({ rail, span, place: p }, k) => {
          const inner = (
            <>
              <span className="uipack-stack__rail-label">{rail.label}</span>
              <span className="uipack-stack__rail-span">{span}</span>
              {rail.summary ? <span className="uipack-stack__rail-tip">{rail.summary}</span> : null}
            </>
          );
          const style = place(p, { "--c": k + 3 });
          return rail.href ? (
            <a className="uipack-stack__rail" href={rail.href} key={rail.id} style={style}>
              {inner}
            </a>
          ) : (
            <span className="uipack-stack__rail" key={rail.id} style={style}>
              {inner}
            </span>
          );
        })}
      </div>
    </section>
  );
}
