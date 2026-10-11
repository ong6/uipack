import type { CSSProperties, ReactNode } from "react";
import {
  buildSpanModel,
  fill,
  inputId,
  spanChartCss,
  type SpanChartInput,
  type SpanChartLabels,
  type SpanChartModel,
  type SpanRowModel,
} from "./model";

/** A heading level, or "none"/false to render titles and group labels as plain text with group roles. */
export type ChartHeadingLevel = 2 | 3 | 4 | 5 | "none" | false;

export interface SpanChartProps extends SpanChartInput {
  /** Unique on the page, no spaces. Prefixes the input ids and keys the chart's own rules. */
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
  /**
   * Heading level of the title; group headings sit one level below it.
   * Default 3. "none" (or false) renders them as text, with each group a
   * `role="group"` named by its label, for charts placed before the page's
   * first heading.
   */
  headingLevel?: ChartHeadingLevel;
}

const vars = (values: Record<string, string | number>) => values as CSSProperties;

function Row({ row, labels }: { row: SpanRowModel; labels: SpanChartLabels }) {
  const { item } = row;
  const meta = [
    `${labels.main}: ${row.layerLabels[0]}`,
    row.layerLabels.length > 1 ? `${labels.also}: ${row.layerLabels.slice(1).join(", ")}` : null,
    item.valueLabel || row.tier ? `${labels.size}: ${[item.valueLabel, row.tier?.label].filter(Boolean).join(", ")}` : null,
    row.statusText,
  ].filter(Boolean);
  return (
    <li
      className="uipack-span__item"
      data-item={item.id}
      data-layers={row.layerIds.join(" ")}
      data-tier={row.tier?.id}
      data-deal={row.deal ? "" : undefined}
      data-featured={item.featured ? "" : undefined}
    >
      <details>
        <summary>
          <span className="uipack-span__sr">{row.sentence}</span>
          <span className="uipack-span__line" aria-hidden="true">
            <span className="uipack-span__name">
              <i />
              {item.logo ? (
                <span className="uipack-span__logo">
                  <img src={item.logo} alt="" width={20} height={20} loading="lazy" decoding="async" />
                </span>
              ) : (
                <span className="uipack-span__logo uipack-span__logo--mono">{row.monogram}</span>
              )}
              <b>{item.name}</b>
              {item.valueLabel ? <em>{item.valueLabel}</em> : null}
              {row.badge || item.tags?.length ? (
                <span className="uipack-span__sub">
                  {row.badge && item.status ? <span className="uipack-span__badge" data-kind={item.status.kind}>{row.badge}</span> : null}
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
                <span key={run.start} style={vars({ "--a": run.start + 1, "--n": run.end - run.start + 1 })}>
                  {run.main !== null ? <span style={vars({ "--at": run.main - run.start })} /> : null}
                </span>
              ))}
            </span>
          </span>
        </summary>
        <div className="uipack-span__detail">
          {item.note ? <p>{item.note}</p> : null}
          <p className="uipack-span__meta">
            {meta.map((text) => (
              <span key={text}>{text}</span>
            ))}
            {item.href ? (
              <span>
                <a href={item.href}>{labels.website}</a>
              </span>
            ) : null}
            {item.source ? (
              <span>
                <a href={item.source}>{labels.source}</a>
              </span>
            ) : null}
          </p>
        </div>
      </details>
    </li>
  );
}

function Legend({ model }: { model: SpanChartModel }) {
  const { labels, samples } = model;
  return (
    <ul className="uipack-span__legend" role="list">
      <li>
        <span className="uipack-span__swatch uipack-span__swatch--main" aria-hidden="true" />
        {labels.main}
      </li>
      <li>
        <span className="uipack-span__swatch uipack-span__swatch--also" aria-hidden="true" />
        {labels.also}
      </li>
      {samples.value ? (
        <li>
          <em className="uipack-span__sample" aria-hidden="true">
            {samples.value}
          </em>
          {labels.valueLegend}
        </li>
      ) : null}
      {samples.badge ? (
        <li>
          <span className="uipack-span__badge" data-kind="acquired" aria-hidden="true">
            {samples.badge}
          </span>
          {labels.legendChange}
        </li>
      ) : null}
      {samples.shut ? (
        <li>
          <span className="uipack-span__badge" data-kind="shutdown" aria-hidden="true">
            shut
          </span>
          {labels.legendShutdown}
        </li>
      ) : null}
      {samples.tag ? (
        <li>
          <span className="uipack-span__tag" aria-hidden="true">
            {samples.tag}
          </span>
          {labels.tagLegend}
        </li>
      ) : null}
    </ul>
  );
}

/** Chip rows: labels for the hidden inputs, so every copy stays in sync. Hidden from screen readers, which use the inputs. */
function Filters({ model }: { model: SpanChartModel }) {
  const { id, labels, layers, tiers } = model;
  return (
    <div className="uipack-span__filters" aria-hidden="true">
      <div className="uipack-span__frow">
        <span className="uipack-span__flabel">{labels.layer}</span>
        <span className="uipack-span__scroll">
          <label htmlFor={inputId.layerAll(id)} className="uipack-span__chip uipack-span__chip--all" data-l="*">
            {labels.allLayers}
          </label>
          {layers.map((layer) => (
            <label htmlFor={inputId.layer(id, layer.id)} className="uipack-span__chip" data-l={layer.id} key={layer.id}>
              <span className="uipack-span__code">{layer.abbr}</span>
              {layer.short ?? layer.label}
            </label>
          ))}
        </span>
      </div>
      {tiers.length || model.deals ? (
        <div className="uipack-span__frow">
          {tiers.length ? (
            <>
              <span className="uipack-span__flabel">{labels.size}</span>
              <span className="uipack-span__wrap">
                <label htmlFor={inputId.tierAll(id)} className="uipack-span__chip uipack-span__chip--all" data-t="*">
                  {labels.allSizes}
                </label>
                {tiers.map((tier) => (
                  <label htmlFor={inputId.tier(id, tier.id)} className="uipack-span__chip" data-t={tier.id} key={tier.id}>
                    {tier.label}
                    {tier.range ? <span className="uipack-span__range">{tier.range}</span> : null}
                  </label>
                ))}
              </span>
            </>
          ) : null}
          {model.deals ? (
            <label htmlFor={inputId.deals(id)} className="uipack-span__chip uipack-span__chip--toggle" data-d="">
              {labels.deals}
              <span className="uipack-span__range">{model.deals}</span>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A sideways bar chart that places items on the ordered layers of a stack.
 * Every behaviour (expand, layer, size and deals filters, row detail) is
 * native form state and CSS, so `renderToStaticMarkup` output works without
 * JavaScript. `enhanceSpanChart` optionally adds repeat-to-clear, Escape,
 * live counts, scroll restoration and find-in-page for hidden rows.
 */
export function SpanChart(props: SpanChartProps) {
  const model = buildSpanModel(props);
  const { id, labels, layers, tiers } = model;
  const level = props.headingLevel ?? 3;
  const plain = level === "none" || level === false;
  const Title = plain ? "p" : (`h${level}` as "h3");
  const GroupHead = plain ? "p" : (`h${props.title ? Math.min(level + 1, 6) : level}` as "h4");
  const zoneStarts = new Set(model.zones.slice(1).map((z) => z.start));
  const toggle = (where: string) =>
    model.hasToggle ? (
      <label htmlFor={inputId.expand(id)} className={`uipack-span__toggle uipack-span__toggle--${where}`}>
        <span className="uipack-span__more">{fill(labels.showAll, { n: model.total })}</span>
        <span className="uipack-span__less">{fill(labels.showFeatured, { n: model.featured })}</span>
      </label>
    ) : null;

  return (
    <section
      className="uipack-span"
      id={id}
      aria-labelledby={props.title ? `${id}-title` : undefined}
      data-group-by={props.groupBy === "none" ? "none" : "primary"}
      style={vars({ "--sp-cols": layers.length })}
    >
      <style dangerouslySetInnerHTML={{ __html: spanChartCss(model) }} />
      {/* method="dialog" outside a dialog makes submission a no-op; the form exists for its reset buttons. */}
      <form className="uipack-span__form" method="dialog" id={`${id}-form`} data-shown={labels.shown}>
        <div className="uipack-span__head">
          {props.title ? (
            <Title className="uipack-span__title" id={`${id}-title`}>
              {props.title}
            </Title>
          ) : null}
          {props.caption ? <p className="uipack-span__caption">{props.caption}</p> : null}

          {/* The filter state. Every visible control is a label for one of these. */}
          <div className="uipack-span__inputs">
            <div role="radiogroup" aria-label={labels.layer}>
              <input type="radio" className="uipack-span__all-input" name={`${id}-layer`} id={inputId.layerAll(id)} value="*" defaultChecked aria-label={labels.allLayers} />
              {layers.map((layer) => (
                <input type="radio" className="uipack-span__layer-input" name={`${id}-layer`} id={inputId.layer(id, layer.id)} value={layer.id} aria-label={layer.label} key={layer.id} />
              ))}
            </div>
            {tiers.length ? (
              <div role="radiogroup" aria-label={labels.size}>
                <input type="radio" className="uipack-span__tier-all" name={`${id}-tier`} id={inputId.tierAll(id)} value="*" defaultChecked aria-label={labels.allSizes} />
                {tiers.map((tier) => (
                  <input
                    type="radio"
                    className="uipack-span__tier-input"
                    name={`${id}-tier`}
                    id={inputId.tier(id, tier.id)}
                    value={tier.id}
                    aria-label={tier.range ? `${tier.label}, ${tier.range}` : tier.label}
                    key={tier.id}
                  />
                ))}
              </div>
            ) : null}
            {model.deals ? (
              <input type="checkbox" className="uipack-span__deals-input" id={inputId.deals(id)} aria-label={`${labels.deals}, ${model.deals}`} />
            ) : null}
            {model.hasToggle ? (
              // Outside the form, so "Clear filters" does not collapse the list.
              <input
                type="checkbox"
                className="uipack-span__expand"
                id={inputId.expand(id)}
                form={`${id}-keep`}
                defaultChecked={model.initialAll}
                aria-label={fill(labels.showAll, { n: model.total })}
              />
            ) : null}
          </div>

          <div className="uipack-span__panel">
            <Legend model={model} />
            <Filters model={model} />
          </div>
          <details className="uipack-span__drawer">
            <summary>
              {labels.filtersAndKey}
              <span className="uipack-span__now-text" data-l="*">
                {labels.allLayers}
              </span>
              {layers.map((layer) => (
                <span className="uipack-span__now-text" data-l={layer.id} key={layer.id}>
                  {layer.short ?? layer.label}
                </span>
              ))}
              {tiers.length ? (
                <span className="uipack-span__now-text" data-t="*">
                  {labels.allSizes}
                </span>
              ) : null}
              {tiers.map((tier) => (
                <span className="uipack-span__now-text" data-t={tier.id} key={tier.id}>
                  {tier.label}
                </span>
              ))}
              {model.deals ? (
                <span className="uipack-span__now-text" data-d="">
                  {labels.deals}
                </span>
              ) : null}
            </summary>
            <Legend model={model} />
            <Filters model={model} />
          </details>
        </div>

        <div className="uipack-span__chart">
          <div className="uipack-span__header">
            <div className="uipack-span__now-row">
              <span className="uipack-span__now-label">{labels.showing}</span>
              {layers.map((layer) => (
                <label htmlFor={inputId.layerAll(id)} className="uipack-span__now" data-l={layer.id} key={layer.id}>
                  {layer.short ?? layer.label}
                  <span aria-hidden="true">×</span>
                </label>
              ))}
              {tiers.map((tier) => (
                <label htmlFor={inputId.tierAll(id)} className="uipack-span__now" data-t={tier.id} key={tier.id}>
                  {tier.label}
                  <span aria-hidden="true">×</span>
                </label>
              ))}
              {model.deals ? (
                <label htmlFor={inputId.deals(id)} className="uipack-span__now" data-d="">
                  {labels.deals}
                  <span aria-hidden="true">×</span>
                </label>
              ) : null}
              <button type="reset" className="uipack-span__clear" aria-label={labels.clearFilters}>
                {labels.clear}
              </button>
            </div>
            {model.zones.length ? (
              <div className="uipack-span__zones" aria-hidden="true">
                {model.zones.map(({ zone, start, end }) => (
                  <span key={zone.id} data-zone-start={zoneStarts.has(start) ? "" : undefined} style={{ gridColumn: `${start + 2} / ${end + 3}` }} title={zone.label}>
                    <span>{zone.label}</span>
                  </span>
                ))}
              </div>
            ) : null}
            <div className="uipack-span__cols" aria-hidden="true">
              <span className="uipack-span__corner">{labels.company}</span>
              {layers.map((layer, k) => (
                <label
                  htmlFor={inputId.layer(id, layer.id)}
                  className="uipack-span__col"
                  data-l={layer.id}
                  data-zone-start={zoneStarts.has(k) ? "" : undefined}
                  style={{ gridColumn: String(k + 2) }}
                  title={layer.label}
                  key={layer.id}
                >
                  <span className="uipack-span__abbr">{layer.abbr}</span>
                  <span className="uipack-span__short">{layer.short ?? layer.abbr}</span>
                  <span className="uipack-span__full">{layer.label}</span>
                </label>
              ))}
            </div>
          </div>

          {model.hasToggle ? (
            <p className="uipack-span__top">
              <span className="uipack-span__more">{fill(labels.shown, { n: model.featured, total: model.total })}</span>
              <span className="uipack-span__less">{fill(labels.shown, { n: model.total, total: model.total })}</span>
              {toggle("top")}
            </p>
          ) : null}

          <div className="uipack-span__body">
            {model.zones.slice(1).map(({ zone, start }) => (
              <span className="uipack-span__rule" key={zone.id} aria-hidden="true" style={vars({ "--k": start })} />
            ))}
            {model.groups.map((group) => {
              const headId = `${id}-g-${group.layer?.id ?? "all"}`;
              return (
                <div
                  className="uipack-span__group"
                  key={group.layer?.id ?? "all"}
                  data-layers={group.layerIds.join(" ")}
                  data-tiers={group.tierIds.length ? group.tierIds.join(" ") : undefined}
                  data-deals={group.hasDeal ? "" : undefined}
                  data-k={group.keys.length ? group.keys.join(" ") : undefined}
                  data-featured={group.featured ? "" : undefined}
                  role={plain && group.layer ? "group" : undefined}
                  aria-labelledby={plain && group.layer ? headId : undefined}
                >
                  {group.layer ? (
                    <GroupHead className="uipack-span__group-head" id={headId}>
                      <span>{group.layer.label}</span>
                      {model.hasToggle ? (
                        <span className="uipack-span__count uipack-span__count--featured">
                          {group.featured} of {group.rows.length}
                        </span>
                      ) : null}
                      <span className="uipack-span__count uipack-span__count--total">{group.rows.length}</span>
                      <span className="uipack-span__count uipack-span__count--live" data-span-count="" />
                      <span className="uipack-span__tick" aria-hidden="true" style={vars({ "--k": group.index })} />
                    </GroupHead>
                  ) : null}
                  <ul className="uipack-span__rows" role="list">
                    {group.rows.map((row) => (
                      <Row row={row} labels={labels} key={row.item.id} />
                    ))}
                  </ul>
                </div>
              );
            })}
            <div className="uipack-span__empty">
              <p>{labels.empty}</p>
              <button type="reset" className="uipack-span__clear">
                {labels.clearFilters}
              </button>
            </div>
          </div>

          <div className="uipack-span__foot">
            {toggle("foot")}
            <span className="uipack-span__status" data-span-status="" />
            {props.asOf ? <span className="uipack-span__asof">{fill(labels.asOf, { date: props.asOf })}</span> : null}
          </div>
        </div>
      </form>
      <p className="uipack-span__sr" aria-live="polite" data-span-live="" />
    </section>
  );
}
