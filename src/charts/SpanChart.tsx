import type { CSSProperties, ReactNode } from "react";
import {
  buildSpanModel,
  fill,
  filterStatus,
  spanChartCss,
  type SpanChartInput,
  type SpanChartLabels,
  type SpanRowModel,
} from "./model";

export interface SpanChartProps extends SpanChartInput {
  /** Unique on the page. Prefixes the input ids and scopes the chart's own rules. */
  id: string;
  title?: ReactNode;
  caption?: ReactNode;
  /** Date the placements were checked, shown in the footer, e.g. "2026-10". */
  asOf?: string;
  /** "featured" (the default when any item is featured) or "all". */
  initial?: "featured" | "all";
  /** "primary" groups rows under their main layer in column order; "none" is one list. */
  groupBy?: "primary" | "none";
  labels?: Partial<SpanChartLabels>;
  /** Heading level of the title; group headings sit one level below it. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5;
}

const vars = (values: Record<string, string | number>) => values as CSSProperties;

function Row({ row, labels }: { row: SpanRowModel; labels: SpanChartLabels }) {
  const { item } = row;
  return (
    <li
      className="uipack-span__item"
      data-item={item.id}
      data-layers={row.layerIds.join(" ")}
      data-tier={row.tier?.id}
      data-featured={item.featured ? "" : undefined}
    >
      <details className="uipack-span__row">
        <summary className="uipack-span__summary">
          <span className="uipack-span__sr">{row.sentence}</span>
          <span className="uipack-span__line" aria-hidden="true">
            <span className="uipack-span__name">
              <span className="uipack-span__chevron" />
              {item.logo ? (
                <span className="uipack-span__logo">
                  <img src={item.logo} alt="" width={20} height={20} loading="lazy" decoding="async" />
                </span>
              ) : (
                <span className="uipack-span__logo uipack-span__logo--mono">{row.monogram}</span>
              )}
              <span className="uipack-span__label" title={item.name}>
                {item.name}
              </span>
              {item.valueLabel ? <span className="uipack-span__value">{item.valueLabel}</span> : null}
              {row.badge || item.tags?.length ? (
                <span className="uipack-span__sub">
                  {row.badge && item.status ? (
                    <span className="uipack-span__badge" data-kind={item.status.kind} title={row.statusText ?? undefined}>
                      {row.badge}
                    </span>
                  ) : null}
                  {item.tags?.map((tag) => (
                    <span className="uipack-span__tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
            <span className="uipack-span__track">
              {row.runs.map((run) => (
                <span
                  className="uipack-span__run"
                  key={run.start}
                  style={vars({ gridColumn: `${run.start + 1} / ${run.end + 2}`, "--len": run.end - run.start + 1 })}
                >
                  {run.main !== null ? (
                    <span className="uipack-span__main" style={vars({ "--at": run.main - run.start })} />
                  ) : null}
                </span>
              ))}
            </span>
          </span>
        </summary>
        <div className="uipack-span__detail">
          <p className="uipack-span__note">
            <strong>{item.name}</strong>
            {item.note ? <span> — {item.note}</span> : null}
          </p>
          <p className="uipack-span__meta">
            <span>
              {labels.main}: {row.layerLabels[0]}
            </span>
            {row.layerLabels.length > 1 ? (
              <span>
                {labels.also}: {row.layerLabels.slice(1).join(", ")}
              </span>
            ) : null}
            {item.valueLabel || row.tier ? (
              <span>
                {labels.size}: {[item.valueLabel, row.tier?.label].filter(Boolean).join(", ")}
              </span>
            ) : null}
            {row.statusText ? <span>{row.statusText}</span> : null}
            {item.href ? <a href={item.href}>{labels.website}</a> : null}
            {item.source ? <a href={item.source}>{labels.source}</a> : null}
          </p>
        </div>
      </details>
    </li>
  );
}

/**
 * A sideways bar chart that places items on the ordered layers of a stack.
 * Every behaviour (expand, layer and size filters, row detail) is native form
 * state and CSS, so `renderToStaticMarkup` output works without JavaScript.
 * `enhanceSpanChart` optionally adds repeat-to-clear and Escape.
 */
export function SpanChart(props: SpanChartProps) {
  const model = buildSpanModel(props);
  const { id, labels, layers, tiers } = model;
  const level = props.headingLevel ?? 3;
  const Title = `h${level}` as const;
  const Group = `h${props.title ? Math.min(level + 1, 6) : level}` as "h3";
  const zoneStarts = new Set(model.zones.slice(1).map((z) => z.start));

  return (
    <section
      className="uipack-span"
      id={id}
      aria-labelledby={props.title ? `${id}-title` : undefined}
      data-group-by={props.groupBy === "none" ? "none" : "primary"}
      style={vars({ "--sp-cols": layers.length })}
    >
      <style dangerouslySetInnerHTML={{ __html: spanChartCss(model) }} />
      <div className="uipack-span__head">
        {props.title ? (
          <Title className="uipack-span__title" id={`${id}-title`}>
            {props.title}
          </Title>
        ) : null}
        {props.caption ? <p className="uipack-span__caption">{props.caption}</p> : null}
        <ul className="uipack-span__legend" role="list">
          <li>
            <span className="uipack-span__swatch uipack-span__swatch--main" aria-hidden="true" />
            {labels.main}
          </li>
          <li>
            <span className="uipack-span__swatch uipack-span__swatch--also" aria-hidden="true" />
            {labels.also}
          </li>
          {model.valueSample ? (
            <li>
              <span className="uipack-span__value" aria-hidden="true">
                {model.valueSample}
              </span>
              {labels.valueLegend}
            </li>
          ) : null}
          {model.hasChange ? (
            <li>
              <span className="uipack-span__badge" data-kind="acquired" aria-hidden="true">
                →
              </span>
              {labels.legendChange}
            </li>
          ) : null}
          {model.hasShutdown ? (
            <li>
              <span className="uipack-span__badge" data-kind="shutdown" aria-hidden="true">
                shut
              </span>
              {labels.legendShutdown}
            </li>
          ) : null}
        </ul>
        {tiers.length ? (
          <div className="uipack-span__sizes" role="radiogroup" aria-label={labels.size}>
            <span className="uipack-span__sizes-label" aria-hidden="true">
              {labels.size}
            </span>
            <label className="uipack-span__chip">
              <input
                type="radio"
                className="uipack-span__input uipack-span__tier-all"
                name={`${id}-tier`}
                id={`${id}-tier-all`}
                value="*"
                defaultChecked
              />
              <span className="uipack-span__chip-label">{labels.allSizes}</span>
            </label>
            {tiers.map((tier) => (
              <label className="uipack-span__chip" key={tier.id}>
                <input
                  type="radio"
                  className="uipack-span__input uipack-span__tier-input"
                  name={`${id}-tier`}
                  id={`${id}-tier-${tier.id}`}
                  value={tier.id}
                />
                <span className="uipack-span__chip-label">{tier.label}</span>
                {tier.range ? <span className="uipack-span__chip-range">{tier.range}</span> : null}
              </label>
            ))}
          </div>
        ) : null}
        <dl className="uipack-span__key">
          {layers.map((layer) => (
            <div key={layer.id}>
              <dt>{layer.abbr}</dt>
              <dd>{layer.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="uipack-span__chart">
        <div className="uipack-span__header">
          {model.zones.length ? (
            <div className="uipack-span__zones" aria-hidden="true">
              {model.zones.map(({ zone, start, end }) => (
                <span
                  className="uipack-span__zone"
                  key={zone.id}
                  data-zone-start={zoneStarts.has(start) ? "" : undefined}
                  style={{ gridColumn: `${start + 2} / ${end + 3}` }}
                  title={zone.label}
                >
                  <span>{zone.label}</span>
                </span>
              ))}
            </div>
          ) : null}
          <div className="uipack-span__cols" role="radiogroup" aria-label={labels.filter}>
            <label className="uipack-span__corner">
              <input
                type="radio"
                className="uipack-span__input uipack-span__all-input"
                name={`${id}-layer`}
                id={`${id}-layer-all`}
                value="*"
                defaultChecked
                aria-label={labels.allLayers}
              />
              <span className="uipack-span__corner-idle">{labels.company}</span>
              <span className="uipack-span__corner-reset">{labels.allLayers}</span>
            </label>
            {layers.map((layer, k) => (
              <label
                className="uipack-span__col"
                key={layer.id}
                title={layer.label}
                data-zone-start={zoneStarts.has(k) ? "" : undefined}
                style={{ gridColumn: String(k + 2) }}
              >
                <input
                  type="radio"
                  className="uipack-span__input uipack-span__layer-input"
                  name={`${id}-layer`}
                  id={`${id}-layer-${layer.id}`}
                  value={layer.id}
                  aria-label={layer.label}
                />
                <span className="uipack-span__full">{layer.label}</span>
                <span className="uipack-span__abbr">{layer.abbr}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="uipack-span__body">
          {model.zones.slice(1).map(({ zone, start }) => (
            <span className="uipack-span__rule" key={zone.id} aria-hidden="true" style={vars({ "--k": start })} />
          ))}
          {model.groups.map((group) => (
            <div
              className="uipack-span__group"
              key={group.layer?.id ?? "all"}
              data-layers={group.layerIds.join(" ")}
              data-tiers={group.tierIds.length ? group.tierIds.join(" ") : undefined}
              data-pairs={group.pairs.length ? group.pairs.join(" ") : undefined}
              data-featured={group.featured ? "" : undefined}
            >
              {group.layer ? (
                <Group className="uipack-span__group-head">
                  <span className="uipack-span__group-name">{group.layer.label}</span>
                  <span className="uipack-span__count">{group.rows.length}</span>
                  {[...group.counts.entries()].map(([key, count]) => (
                    <span className="uipack-span__count" data-span-key={key} key={key}>
                      {count}
                    </span>
                  ))}
                </Group>
              ) : null}
              <ul className="uipack-span__rows" role="list">
                {group.rows.map((row) => (
                  <Row row={row} labels={labels} key={row.item.id} />
                ))}
              </ul>
            </div>
          ))}
          <p className="uipack-span__empty">{labels.empty}</p>
        </div>

        <div className="uipack-span__foot">
          {model.hasToggle ? (
            <label className="uipack-span__toggle">
              <input
                type="checkbox"
                className="uipack-span__input uipack-span__expand"
                id={`${id}-all`}
                defaultChecked={model.initialAll}
              />
              <span className="uipack-span__toggle-icon" aria-hidden="true" />
              <span className="uipack-span__more">{fill(labels.showAll, { n: model.total })}</span>
              <span className="uipack-span__less">{fill(labels.showFeatured, { n: model.featured })}</span>
            </label>
          ) : null}
          <span className="uipack-span__status">
            {model.filters.map(({ filter, key, count }) => (
              <span data-span-key={key} key={key}>
                {filterStatus(model, filter, count)}
              </span>
            ))}
          </span>
          {props.asOf ? <span className="uipack-span__asof">{fill(labels.asOf, { date: props.asOf })}</span> : null}
        </div>
      </div>
      <p className="uipack-span__sr" aria-live="polite" data-span-live="" />
    </section>
  );
}
