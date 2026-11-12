import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import "../src/web/fonts.css";
import "../src/theme.css";
import "../src/canvas.css";
import "../src/deck/deck.css";
import "../src/web/web.css";
import "../src/web/web-styles.css";
import "./foundations.css";
import {
  DeckPlayer,
  SLOT_BUDGETS,
  endSlide,
  factSlide,
  pointsSlide,
  quoteSlide,
  sectionSlide,
  slotProblems,
  type DeckSlide,
} from "../src/deck";
import type { SlotName } from "../src/deck/budgets";
import { Body, CtaButton, Eyebrow, Heading, Section, WebSurface } from "../src/web";
import { pipeline } from "../src/presets";
import { uiStyles, type UiStyleId } from "../src/style";
import { useShowcaseTheme } from "./ShowcaseShell";

/*
 * The live demos of the Rules pages (docs/system/), registered in playground/demos.tsx and
 * embedded in their Markdown as `uipack-demo` blocks. They show; the Markdown explains. No rule,
 * table or budget is written here: the words around each demo are in its doc.
 */

/* ---------------------------------------------------------------- controls */

/** A labelled radio group: real inputs, so it works with a keyboard, a screen reader and touch. */
function Choice<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="fdn-choice">
      <legend>{legend}</legend>
      <div>
        {options.map((o) => (
          <label key={o.id}>
            <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The style layer, under the live controls: the site spec, not a control. Here it is Technical,
 * the package's default spec; another site's spec fills the same roles.
 */
function StyleLayer() {
  return (
    <p className="fdn-fixed">
      <span className="fdn-fixed__label">Style:</span> <a href="/specs/technical">{uiStyles[0].name}</a> (this site&rsquo;s spec)
      · <a href="/styles">one spec per site</a>
    </p>
  );
}

/* ---------------------------------------------------------------- one unit, three layers */

/** One unit's words, written for a presented slide: a short title and the fragments it's spoken from. */
type Content = { title: string; points: string[]; value: string; unit: string; baseline: string; source: string };

const writings: Record<"search" | "reviews", Content> = {
  search: {
    title: "Search: twice as fast since March",
    points: ["p95 198 ms, was 410 ms", "5 indexes → 1"],
    value: "198",
    unit: "ms at p95",
    baseline: "410 ms in March",
    source: "The search latency dashboard, October",
  },
  reviews: {
    title: "Review decisions: 3 meetings → 1",
    points: ["Same teams, same 6 months", "Only change: the answer moved to slide 1"],
    value: "1",
    unit: "meeting",
    baseline: "3 when the answer came last",
    source: "The platform review log, April to September",
  },
};

type LayoutId = "fact" | "points";

function unitSlide(c: Content, layout: LayoutId): DeckSlide {
  if (layout === "fact")
    return factSlide({
      id: "unit",
      title: c.title,
      role: "evidence",
      headline: c.title,
      value: c.value,
      unit: c.unit,
      baseline: c.baseline,
      source: c.source,
      footer: "Foundations",
    });
  return pointsSlide({ id: "unit", title: c.title, role: "answer", headline: c.title, points: c.points, footer: "Foundations" });
}

/** The same content as a web section: the layout picks a number block or the points. */
function UnitSection({ c, layout }: { c: Content; layout: LayoutId }) {
  return (
    <Section title={c.title}>
      {layout === "fact" && (
        <div className="fdn-fact">
          <span className="fdn-fact__value">
            {c.value}
            <small>{c.unit}</small>
          </span>
          <span className="fdn-fact__baseline">
            {c.baseline} · {c.source}
          </span>
        </div>
      )}
      {layout === "points" && (
        <ul className="fdn-points">
          {c.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/**
 * The live swap demo (`uipack-demo layer-swap` in docs/system/README.md, the Overview page): one
 * unit as a slide and a web section, with the writing and the layout swapped independently.
 */
export function LayerToggle() {
  const { theme } = useShowcaseTheme();
  const [writing, setWriting] = useState<keyof typeof writings>("search");
  const [layout, setLayout] = useState<LayoutId>("fact");
  const content = writings[writing];
  // The web card matches the slide's stage (not the stage plus its controls), so the two frames of
  // one unit end on one line.
  const unitRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const unit = unitRef.current;
    const stage = unit?.querySelector<HTMLElement>(".uipack-deck-stage");
    if (!unit || !stage) return;
    const sync = () => unit.style.setProperty("--fdn-stage-h", `${stage.getBoundingClientRect().height}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [writing, layout]);

  return (
    <section>
      <h3>Swap one layer at a time</h3>
      <div className="fdn-toggles">
        <Choice
          legend="Writing"
          value={writing}
          options={[
            { id: "search", label: "Search latency" },
            { id: "reviews", label: "Review meetings" },
          ]}
          onChange={setWriting}
        />
        <Choice
          legend="Layout"
          value={layout}
          options={[
            { id: "fact", label: "Fact" },
            { id: "points", label: "Points" },
          ]}
          onChange={setLayout}
        />
        <StyleLayer />
      </div>
      <div className="fdn-unit" ref={unitRef}>
        <div className="fdn-unit__deck">
          <DeckPlayer
            key={`${writing}-${layout}`}
            id="foundations-unit"
            title="One slide, three layers"
            slides={[unitSlide(content, layout)]}
            theme={theme}
            motion="none"
          />
        </div>
        <WebSurface theme={theme} className="fdn-unit__web">
          <UnitSection c={content} layout={layout} />
        </WebSurface>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- style */

const swatchRoles = [
  ["paper", "Paper"],
  ["surface", "Surface"],
  ["surface-2", "Surface 2"],
  ["ink", "Ink"],
  ["ink-2", "Ink 2"],
  ["ink-3", "Ink 3"],
  ["line", "Line"],
  ["accent", "Accent"],
  ["flow-request", "Request"],
  ["flow-response", "Response"],
  ["flow-change", "Change"],
  ["data-neg", "Data −"],
] as const;

function Swatches({ style, theme }: { style: UiStyleId; theme: "light" | "dark" }) {
  return (
    <div className="fdn-swatches" data-ui-style={style} data-ui-theme={theme}>
      <p className="fdn-swatches__head">{theme}</p>
      <ul>
        {swatchRoles.map(([role, name]) => (
          <li key={role}>
            <span className="fdn-swatch" style={{ background: `var(--ui-${role})` }} />
            <span>
              {name}
              <code>--ui-{role}</code>
            </span>
          </li>
        ))}
      </ul>
      <p className="fdn-swatches__text">
        Text: <span style={{ color: "var(--ui-ink)" }}>Ink</span> · <span style={{ color: "var(--ui-ink-2)" }}>Ink 2</span> ·{" "}
        <span style={{ color: "var(--ui-ink-3)" }}>Ink 3</span>
      </p>
    </div>
  );
}

/** The ornament slots, painted by each style on the same markup. */
function OrnamentPanel({ style }: { style: UiStyleId }) {
  const { theme } = useShowcaseTheme();
  return (
    <WebSurface theme={theme} uiStyle={style} className="fdn-ornaments">
      <div className="fdn-ornaments__stage">
        <div className="uipack-web-hero__backdrop" aria-hidden="true" />
        <Eyebrow>Inbox agent</Eyebrow>
        <p className="fdn-display">
          Three that <em>need you.</em>
        </p>
        <div className="uipack-web-feature fdn-ornaments__card">
          <Body emphasis="medium">A card in the style&rsquo;s frame.</Body>
        </div>
        <CtaButton>Start free</CtaButton>
      </div>
    </WebSurface>
  );
}

/** `role-swatches` (docs/system/style.md): each registered style's colour roles in light and dark, and the fonts it loads. */
export function RoleSwatches() {
  return (
    <div className="fdn-styles">
      {uiStyles.map((s) => (
        <article key={s.id} className="fdn-style">
          <h3>{s.name}</h3>
          <div className="fdn-style__themes">
            <Swatches style={s.id} theme="light" />
            <Swatches style={s.id} theme="dark" />
          </div>
          <p className="fdn-style__fonts">
            Fonts fetched: {s.fonts.map((f) => f.replace(/-latin-|\.woff2/g, " ").trim()).join(", ")}. Preloaded:{" "}
            {s.preload.length ? s.preload.map((f) => f.replace(/-latin-|\.woff2/g, " ").trim()).join(", ") : "nothing"}.
          </p>
        </article>
      ))}
    </div>
  );
}

/** `ornament-slots` (docs/system/style.md): the ornament slots, painted by this site's style. */
export function OrnamentSlots() {
  return <OrnamentPanel style={uiStyles[0].id} />;
}

/* ---------------------------------------------------------------- writing */

/** `budget-checker` (docs/system/writing/general.md): one slot, live, through slotProblems. */
export function BudgetChecker() {
  const [slot, setSlot] = useState<SlotName>("point");
  const [text, setText] = useState("The first response now takes two hours, down from nine.");
  const problems = slotProblems(slot, text);
  const inputId = useId();
  return (
    <div className="fdn-checker">
      <label className="fdn-checker__slot">
        <span>Slot</span>
        <select value={slot} onChange={(e) => setSlot(e.target.value as SlotName)}>
          {(Object.keys(SLOT_BUDGETS) as SlotName[]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="fdn-checker__text" htmlFor={inputId}>
        <span>Words</span>
      </label>
      <textarea id={inputId} rows={2} value={text} onChange={(e) => setText(e.target.value)} />
      <p className="fdn-checker__result" role="status" data-verdict={problems.length ? "over" : "fits"}>
        <span className="fdn-checker__icon" aria-hidden="true">
          {problems.length ? "✕" : "✓"}
        </span>
        <span>{problems.length ? `Over budget: ${problems.join("; ")}.` : "Fits the budget."}</span>
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- layout */

const archetypeDeck: DeckSlide[] = [
  { ...unitSlide(writings.reviews, "points"), id: "points", title: "Points" },
  sectionSlide({
    id: "section",
    title: "Section",
    role: "context",
    number: "02",
    headline: "Where latency comes from",
    footer: "Archetypes",
  }),
  quoteSlide({
    id: "quote",
    title: "Quote",
    role: "evidence",
    headline: "What support agents say",
    quote: "I search once now. The answer is on the first screen.",
    attribution: "Support lead, EMEA",
    footer: "Archetypes",
  }),
  { ...unitSlide(writings.search, "fact"), id: "fact", title: "Fact" },
  { ...unitSlide(writings.search, "points"), id: "invert", title: "Points, inverted", invert: true },
  endSlide({
    id: "end",
    title: "End",
    role: "ask",
    headline: "Approve the rollout by 20 November",
    action: "Approve the rollout plan",
    owner: "Platform leads",
    date: "20 November",
    footer: "Archetypes",
  }),
];

/** `slide-archetypes` (docs/system/layout/deck-slide.md): the archetypes on one region map. */
export function SlideArchetypes() {
  const { theme } = useShowcaseTheme();
  return (
    <div className="fdn-deck">
      <DeckPlayer id="foundations-archetypes" title="Slide archetypes" slides={archetypeDeck} theme={theme} />
    </div>
  );
}

/** `narrow-form` (docs/system/layout/README.md): a preset that swaps to its authored narrow drawing. */
export function NarrowForm() {
  return <>{pipeline(undefined, "foundations-narrow")}</>;
}

/** `title-widths` (docs/system/layout/README.md): one title at three column widths. */
export function TitleWidths() {
  const { theme } = useShowcaseTheme();
  return (
    <div className="fdn-widths">
      {(["Wide", "Medium", "Narrow"] as const).map((w) => (
        <WebSurface key={w} theme={theme} className={`fdn-mini fdn-width--${w.toLowerCase()}`}>
          <Eyebrow>{w}</Eyebrow>
          <Heading level={3} size={4}>
            Search: <em>twice as fast</em> since March
          </Heading>
          <Body>p95 198 ms, was 410 ms · 5 indexes → 1</Body>
        </WebSurface>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- do and don't */

/** A don't and a do, side by side; the doc around the demo says which rule they show and why. */
function Pair({ dont, doit, wide }: { dont: ReactNode; doit: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "fdn-pair fdn-pair--wide" : "fdn-pair"}>
      <div className="fdn-pair__row">
        <figure data-verdict="dont">
          <figcaption>Don&rsquo;t</figcaption>
          {dont}
        </figure>
        <figure data-verdict="do">
          <figcaption>Do</figcaption>
          {doit}
        </figure>
      </div>
    </div>
  );
}

/** A figure node: a label, and a mono sub-label or a second line of label (the "don't"). */
function NodeSketch({ label, sub, wrapped }: { label: string; sub?: string; wrapped?: string }) {
  return (
    <svg
      className="fdn-node"
      viewBox="0 0 240 72"
      role="img"
      aria-label={`A node labelled ${[label, wrapped].filter(Boolean).join(" ")}`}
    >
      <rect x="1" y="1" width="238" height="70" rx="6" />
      <text x="16" y={sub || wrapped ? 32 : 41}>
        {label}
      </text>
      {wrapped && (
        <text x="16" y="52">
          {wrapped}
        </text>
      )}
      {sub && (
        <text x="16" y="52" className="fdn-node__sub">
          {sub}
        </text>
      )}
    </svg>
  );
}

/** A headline with the words past its budget marked, so the overflow is visible, not just counted. */
function OverBudget({ text, max }: { text: string; max: number }) {
  const words = text.split(/\s+/);
  return (
    <>
      {words.slice(0, max).join(" ")}{" "}
      <mark className="fdn-over" title="Past the budget">
        {words.slice(max).join(" ")}
      </mark>
    </>
  );
}

/** A slide's words as a small sketch: the optional eyebrow, the title, the optional lede and the points. */
function SlideSketch({ eyebrow, title, lede, points }: { eyebrow?: string; title: string; lede?: string; points?: string[] }) {
  const { theme } = useShowcaseTheme();
  return (
    <WebSurface theme={theme} className="fdn-mini">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading level={3} size={3}>
        {title}
      </Heading>
      {lede && <Body>{lede}</Body>}
      {points && (
        <ul className="fdn-points">
          {points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </WebSurface>
  );
}

const longHeadline =
  "Answer-first reviews were decided in one meeting instead of three, across every team we measured from April to September";

/** `pair-presented` (docs/system/do-and-dont.md). */
export function PairPresented() {
  return (
    <Pair
      dont={
        <SlideSketch
          eyebrow="Search"
          title="Search answers in 198 ms at p95, twice as fast as March"
          lede="One index replaced five."
        />
      }
      doit={<SlideSketch title="Search: twice as fast since March" points={["p95 198 ms, was 410 ms", "5 indexes → 1"]} />}
    />
  );
}

/** `pair-read-alone` (docs/system/do-and-dont.md). */
export function PairReadAlone() {
  return <Pair dont={<SlideSketch title="Results" />} doit={<SlideSketch title="Index freshness fell from 40 to 6 minutes" />} />;
}

/** `pair-over-budget` (docs/system/do-and-dont.md): the linter's own verdict on the long headline. */
export function PairOverBudget() {
  const { theme } = useShowcaseTheme();
  return (
    <>
      <Pair
        dont={
          <WebSurface theme={theme} className="fdn-mini">
            <Heading level={3} size={3}>
              <OverBudget text={longHeadline} max={SLOT_BUDGETS.headline.maxWords ?? 14} />
            </Heading>
          </WebSurface>
        }
        doit={
          <WebSurface theme={theme} className="fdn-mini">
            <Heading level={3} size={3}>
              Review decisions: 3 meetings → 1
            </Heading>
            <ul className="fdn-points">
              <li>Every team, April to September</li>
              <li>Only change: the answer moved to slide 1</li>
            </ul>
          </WebSurface>
        }
      />
      <p className="fdn-verdict" role="note">
        slotProblems(&quot;headline&quot;, …): {slotProblems("headline", longHeadline).join("; ")}
      </p>
    </>
  );
}

/** `pair-labels` (docs/system/do-and-dont.md). */
export function PairLabels() {
  const { theme } = useShowcaseTheme();
  return (
    <Pair
      dont={
        <WebSurface theme={theme} className="fdn-mini fdn-mini--node">
          <NodeSketch label="This service checks that" wrapped="each request is valid" />
        </WebSurface>
      }
      doit={
        <WebSurface theme={theme} className="fdn-mini fdn-mini--node">
          <NodeSketch label="Validate" sub="schema · 1 ms" />
        </WebSurface>
      }
    />
  );
}

/** `pair-accent` (docs/system/do-and-dont.md). */
export function PairAccent() {
  const { theme } = useShowcaseTheme();
  return (
    <Pair
      dont={
        <WebSurface theme={theme} className="fdn-mini fdn-mini--row">
          <CtaButton>Start free</CtaButton>
          <CtaButton>Book a demo</CtaButton>
        </WebSurface>
      }
      doit={
        <WebSurface theme={theme} className="fdn-mini fdn-mini--row">
          <CtaButton>Start free</CtaButton>
          <CtaButton variant="secondary">See how it works</CtaButton>
        </WebSurface>
      }
    />
  );
}

/** `pair-glow` (docs/system/do-and-dont.md). */
export function PairGlow() {
  return (
    <Pair
      wide
      dont={
        <div className="fdn-glow" data-glow="ambient">
          Card
        </div>
      }
      doit={
        <div className="fdn-glow-row">
          <div className="fdn-glow">Card</div>
          <div className="fdn-glow" data-selected="">
            <span className="fdn-glow__tick" aria-hidden="true">
              ✓
            </span>
            Selected
          </div>
          <div className="fdn-glow">Card</div>
        </div>
      }
    />
  );
}
