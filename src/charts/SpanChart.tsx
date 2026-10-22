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
import { CaseSafe } from "./caseSafe";

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

/** A break opportunity after each hyphen: WebKit does not break there on its own. */
const breakable = (text: string) =>
  text.split(/(?<=-)/).map((part, i, parts) => (i < parts.length - 1 ? [part, <wbr key={i} />] : part));

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
              <span className="uipack-span__nv">
                <b title={item.name.length > 18 ? item.name : undefined}>{item.name}</b>
                {item.valueLabel ? (
                  <em title={item.valueLabel.length > 8 ? item.valueLabel : undefined}>{item.valueLabel}</em>
                ) : null}
              </span>
              {row.badge || item.tags?.length ? (
                <span className="uipack-span__sub">
                  {row.badge && item.status ? (
                    <span className="uipack-span__badge" data-kind={item.status.kind}>
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

/** Template text with `{n}` set in mono: "Show all {n} companies" → "Show all <num>158</num> companies". */
function withCount(template: string, n: number) {
  const [before, after = ""] = template.split("{n}");
  return template.includes("{n}") ? (
    <>
      {before}
      <span className="uipack-span__num">{n}</span>
      {after}
    </>
  ) : (
    template
  );
}

/**
 * The key: one bordered strip of sections ("BARS", "DEALS", "SIZE", "TYPE"),
 * each with samples in the chart's own marks. On phones the same sections sit
 * in the drawer as a two-column grid.
 */
function Key({ model }: { model: SpanChartModel }) {
  const { labels, samples } = model;
  const word = (kind: string) => labels[`legend${kind[0].toUpperCase()}${kind.slice(1)}` as "legendAcquired"];
  return (
    <ul className="uipack-span__key" role="list">
      <li>
        <span className="uipack-span__key-label">{labels.keyBars}</span>
        <span className="uipack-span__key-item">
          <span className="uipack-span__swatch uipack-span__swatch--main" aria-hidden="true" />
          {labels.keyMain}
        </span>
        <span className="uipack-span__key-item">
          <span className="uipack-span__swatch uipack-span__swatch--also" aria-hidden="true" />
          {labels.keyAlso}
        </span>
      </li>
      {samples.badges.length ? (
        <li>
          <span className="uipack-span__key-label">{labels.keyDeals}</span>
          {/* A small sample of each badge as rows show it, then the word in plain ink, like the
              bar swatches: the key explains the badges without four more coloured pills. */}
          {samples.badges.map((kind) => (
            <span className="uipack-span__key-item" key={kind}>
              <span className="uipack-span__badge" data-kind={kind} aria-hidden="true">
                {kind === "shutdown" ? "shut" : kind === "licensed" ? "↝" : "→"}
              </span>
              {word(kind)}
            </span>
          ))}
        </li>
      ) : null}
      {samples.value ? (
        <li>
          <span className="uipack-span__key-label">{labels.keySize}</span>
          <span className="uipack-span__key-item">
            <em className="uipack-span__sample">{samples.value}</em>
            {labels.valueLegend}
          </span>
        </li>
      ) : null}
      {samples.tag ? (
        <li>
          <span className="uipack-span__key-label">{labels.keyType}</span>
          <span className="uipack-span__key-item">
            <span className="uipack-span__tag">{samples.tag}</span>
            {labels.tagLegend}
          </span>
        </li>
      ) : null}
    </ul>
  );
}

/** The size filter as a segmented control: a SIZE cell, then "All", then each tier with its count. Labels for the hidden radios. */
function SizeControl({ model }: { model: SpanChartModel }) {
  const { id, labels, tiers } = model;
  if (!tiers.length) return null;
  return (
    <span className="uipack-span__seg" aria-hidden="true">
      <span className="uipack-span__seg-label">{labels.size}</span>
      <label htmlFor={inputId.tierAll(id)} className="uipack-span__chip uipack-span__chip--all" data-t="*">
        {labels.allSizes}
        <span className="uipack-span__num">{model.total}</span>
      </label>
      {tiers.map((tier, k) => (
        <label
          htmlFor={inputId.tier(id, tier.id)}
          className="uipack-span__chip"
          data-t={tier.id}
          key={tier.id}
          title={tier.range}
        >
          {tier.label}
          <span className="uipack-span__num">{model.tierCounts[k]}</span>
        </label>
      ))}
    </span>
  );
}

function DealsToggle({ model }: { model: SpanChartModel }) {
  return model.deals ? (
    <label htmlFor={inputId.deals(model.id)} className="uipack-span__chip uipack-span__chip--toggle" data-d="" aria-hidden="true">
      {model.labels.deals}
      <span className="uipack-span__num">{model.deals}</span>
    </label>
  ) : null;
}

/** Layer chips for the drawer, where column headers show codes: each chip is also the code's key. */
function LayerChips({ model }: { model: SpanChartModel }) {
  const { id, labels, layers } = model;
  return (
    <span className="uipack-span__wrap" aria-hidden="true">
      <span className="uipack-span__seg-label">{labels.layer}</span>
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
        <span className="uipack-span__more">{withCount(labels.showAll, model.total)}</span>
        <span className="uipack-span__less">{withCount(labels.showFeatured, model.featured)}</span>
      </label>
    ) : null;

  return (
    <section
      className="uipack-span"
      id={id}
      aria-labelledby={props.title ? `${id}-title` : undefined}
      data-group-by={props.groupBy === "none" ? "none" : "primary"}
      data-lean={!tiers.length && !model.deals ? "" : undefined}
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

          {/* Open when the column headers carry words: the key strip, then the toolbar below. */}
          <div className="uipack-span__panel">
            <Key model={model} />
          </div>
          {/* With code headers (phones): the key and every filter fold into one closed disclosure. */}
          <details className="uipack-span__drawer">
            <summary>
              <span className="uipack-span__drawer-title">{labels.filtersAndKey}</span>
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
            <Key model={model} />
            <div className="uipack-span__filters">
              <LayerChips model={model} />
              <span className="uipack-span__wrap">
                <SizeControl model={model} />
                <DealsToggle model={model} />
              </span>
            </div>
          </details>
          {/* Phones: enough key to read the bars without opening the drawer, and Deals in one tap. */}
          <p className="uipack-span__keyline">
            <span>
              <span className="uipack-span__swatch uipack-span__swatch--main" aria-hidden="true" />
              {labels.keyMain}
            </span>
            <span>
              <span className="uipack-span__swatch uipack-span__swatch--also" aria-hidden="true" />
              {labels.keyAlso}
            </span>
            <DealsToggle model={model} />
          </p>
          {/* Size, Deals, then the search field: the Tab order follows what the eye
              meets. The size and deals inputs sit here, beside the controls that
              label them, so focusing one (Chromium focuses a radio when its label
              is clicked) never scrolls the page; the layer radios live in the
              sticky header for the same reason. */}
          <div className="uipack-span__toolbar">
            {tiers.length || model.deals ? (
              <div className="uipack-span__inputs">
                {tiers.length ? (
                  <div role="radiogroup" aria-label={labels.size}>
                    <input
                      type="radio"
                      className="uipack-span__tier-all"
                      name={`${id}-tier`}
                      id={inputId.tierAll(id)}
                      value="*"
                      defaultChecked
                      aria-label={labels.allSizes}
                    />
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
                  <input
                    type="checkbox"
                    className="uipack-span__deals-input"
                    id={inputId.deals(id)}
                    aria-label={`${labels.deals}, ${model.deals}`}
                  />
                ) : null}
              </div>
            ) : null}
            <SizeControl model={model} />
            <DealsToggle model={model} />
            <p className="uipack-span__hint uipack-span__hint--toolbar" aria-hidden="true">
              <span>{labels.layerHint}</span>
              <span>{labels.layerHintTouch}</span>
            </p>
            {/* Shown by enhanceSpanChart; without script, find-in-page reaches every row. */}
            <label className="uipack-span__find" hidden>
              <span className="uipack-span__sr">{labels.find}</span>
              <input type="search" placeholder={labels.find} autoComplete="off" spellCheck={false} data-span-search="" />
            </label>
          </div>
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
            {/* The layer state (and the expand toggle). Every visible control is a
                label for one of these. They live in the sticky header, with the column
                headers that label them, so focusing one never scrolls the page. */}
            <div className="uipack-span__inputs">
              <div role="radiogroup" aria-label={labels.layer}>
                <input
                  type="radio"
                  className="uipack-span__all-input"
                  name={`${id}-layer`}
                  id={inputId.layerAll(id)}
                  value="*"
                  defaultChecked
                  aria-label={labels.allLayers}
                />
                {layers.map((layer) => (
                  <input
                    type="radio"
                    className="uipack-span__layer-input"
                    name={`${id}-layer`}
                    id={inputId.layer(id, layer.id)}
                    value={layer.id}
                    aria-label={layer.label}
                    key={layer.id}
                  />
                ))}
              </div>
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
            {model.zones.length ? (
              <div className="uipack-span__zones" aria-hidden="true">
                {model.zones.map(({ zone, start, end }) => (
                  <span
                    key={zone.id}
                    data-zone-start={zoneStarts.has(start) ? "" : undefined}
                    style={{ gridColumn: `${start + 2} / ${end + 3}` }}
                    title={zone.label}
                  >
                    <span>
                      <CaseSafe text={zone.label} keep="uipack-span__keep" />
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
            <div className="uipack-span__cols" aria-hidden="true">
              <span className="uipack-span__corner">
                <span className="uipack-span__hint">
                  <span>{labels.layerHint}</span>
                  <span>{labels.layerHintTouch}</span>
                </span>
                {labels.company}
              </span>
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
                  <span className="uipack-span__short">{breakable(layer.short ?? layer.abbr)}</span>
                  <span className="uipack-span__full">{layer.label}</span>
                  <span className="uipack-span__ccount">{model.layerCounts[k]}</span>
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
                      <span>
                        <CaseSafe text={group.layer.label} keep="uipack-span__keep" />
                      </span>
                      {model.hasToggle ? (
                        <span className="uipack-span__count uipack-span__count--featured">
                          {group.featured} of {group.rows.length}
                        </span>
                      ) : null}
                      <span className="uipack-span__count uipack-span__count--total">{group.rows.length}</span>
                      <span className="uipack-span__count uipack-span__count--live" data-span-count="" />
                      <span className="uipack-span__mark" aria-hidden="true" style={vars({ "--k": group.index })} />
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
            <div className="uipack-span__nomatch" hidden data-span-nomatch={labels.noMatch}>
              <p />
              <button type="button" className="uipack-span__clear" data-span-clear-search="">
                {labels.clearSearch}
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
