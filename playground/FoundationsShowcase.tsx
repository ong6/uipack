import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import "../src/styles/landing.css";
import "../src/styles/graphical.css";
import "../src/web/fonts.css";
import "../src/theme.css";
import "../src/canvas.css";
import "../src/deck/deck.css";
import "../src/web/web.css";
import "../src/web/web-styles.css";
import "../src/docs/docs.css";
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
import { DocsMarkdown } from "../src/docs";
import { pipeline } from "../src/presets";
import { uiStyles, type UiStyleId } from "../src/style";
import { routePath } from "./routes";
import { useShowcaseTheme } from "./ShowcaseShell";
import overviewDoc from "../docs/system/README.md?raw";
import styleDoc from "../docs/system/style.md?raw";
import writingDoc from "../docs/system/writing.md?raw";
import layoutDoc from "../docs/system/layout.md?raw";

const REPO = "https://github.com/ong6/uipack/blob/main/docs";

/**
 * A system doc as page prose: its h1 dropped (the page has one) and its links pointed at these
 * pages or at the repo.
 */
function guide(source: string) {
  const pages: Record<string, string> = {
    "README.md": "/foundations",
    "style.md": "/foundations/style",
    "writing.md": "/foundations/writing",
    "layout.md": "/foundations/layout",
  };
  return source
    .replace(/^# .*\n+/, "")
    .replace(/\]\(([A-Za-z0-9-]+\.md)(#[^)]*)?\)/g, (_m, file: string, hash = "") =>
      pages[file] ? `](${pages[file]}${hash})` : `](${REPO}/system/${file}${hash})`,
    )
    .replace(/\]\(\.\.\/([^)]+)\)/g, `](${REPO}/$1)`);
}

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

type DocSection = { title: string; id: string; body: string };

/** A doc split at its h2s: the lead before the first, then one entry per section. */
function splitDoc(source: string): { lead: string; sections: DocSection[] } {
  const [lead, ...rest] = guide(source).split(/^## /m);
  return {
    lead: lead.trim(),
    sections: rest.map((chunk) => {
      const title = chunk.slice(0, chunk.indexOf("\n")).trim();
      return { title, id: slug(title), body: chunk.slice(chunk.indexOf("\n") + 1).trim() };
    }),
  };
}

const MEDIA = ["Diagrams", "Slides", "Web", "Motion", "3D"] as const;

/** Opens a closed disclosure when the address points at something inside it. */
function useHashOpens() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      const details = target?.closest("details");
      if (!target || !details) return;
      details.open = true;
      target.scrollIntoView();
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
}

/**
 * One doc's per-medium sections as tabs (Diagrams, Slides, Web, Motion, 3D). Real tabs: arrow
 * keys, Home and End move between them; each panel is the doc's own section for that medium.
 */
function MediumTabs({ source, label }: { source: string; label: string }) {
  const { theme } = useShowcaseTheme();
  const media = splitDoc(source).sections.filter((sec) => (MEDIA as readonly string[]).includes(sec.title));
  const [current, setCurrent] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();
  const move = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let next = current;
    if (e.key in keys) next = (current + keys[e.key] + media.length) % media.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = media.length - 1;
    else return;
    e.preventDefault();
    setCurrent(next);
    tabs.current[next]?.focus();
  };
  const shown = media[current];
  return (
    <section>
      <h2>{label} by medium</h2>
      <div className="fdn-tabs" role="tablist" aria-label={`${label} by medium`} onKeyDown={move}>
        {media.map((m, i) => (
          <button
            key={m.id}
            ref={(el) => void (tabs.current[i] = el)}
            type="button"
            role="tab"
            id={`${base}-tab-${i}`}
            aria-selected={i === current}
            aria-controls={`${base}-panel`}
            tabIndex={i === current ? 0 : -1}
            onClick={() => setCurrent(i)}
          >
            {m.title}
          </button>
        ))}
      </div>
      <div
        className="uipack-docs fdn-guide fdn-tabpanel"
        data-palette="technical"
        data-theme={theme}
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${current}`}
      >
        {shown && <DocsMarkdown source={shown.body} headingOffset={0} />}
      </div>
    </section>
  );
}

/** The rest of a doc, closed until asked for, with the source a link away. */
function FullSpec({
  source,
  page,
  file,
  skip = [],
  open = false,
}: {
  source: string;
  page: string;
  file: string;
  skip?: string[];
  open?: boolean;
}) {
  const { theme } = useShowcaseTheme();
  useHashOpens();
  const { lead, sections } = splitDoc(source);
  const rest = sections.filter((sec) => !(MEDIA as readonly string[]).includes(sec.title) && !skip.includes(sec.title));
  const body = [lead, ...rest.map((sec) => `## ${sec.title}\n\n${sec.body}`)].filter(Boolean).join("\n\n");
  return (
    <section>
      <h2>The full {page} specification</h2>
      <p className="collection-intro">
        Every rule and value, as the library documents them. The same text is in the repository:{" "}
        <a href={`${REPO}/system/${file}`}>{page} on GitHub</a>.
      </p>
      <details className="fdn-spec" open={open}>
        <summary>Read the full {page} specification</summary>
        <div className="uipack-docs fdn-guide" data-palette="technical" data-theme={theme}>
          <DocsMarkdown source={body} headingOffset={1} />
        </div>
      </details>
    </section>
  );
}

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

const styleOptions = uiStyles.map((s) => ({ id: s.id, label: s.name }));

/* ---------------------------------------------------------------- one unit, three layers */

/** One unit's words, written for a presented slide: a short title and the fragments it's spoken from. */
type Content = { title: string; points: string[]; value: string; unit: string; baseline: string; source: string };

const writings: Record<"search" | "reviews", Content> = {
  search: {
    title: "Search: twice as fast since March",
    points: ["p95 198 ms, half of March", "5 indexes → 1", "The cache serves the rest"],
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

function LayerToggle() {
  const { theme } = useShowcaseTheme();
  const [style, setStyle] = useState<UiStyleId>("technical");
  const [writing, setWriting] = useState<keyof typeof writings>("search");
  const [layout, setLayout] = useState<LayoutId>("fact");
  const content = writings[writing];
  return (
    <section>
      <h2>Swap one layer at a time</h2>
      <p className="collection-intro">
        One unit, rendered twice: as a deck slide and as a web section. Each control changes one layer. Style changes only tokens
        and ornaments; writing changes only the words; layout changes only where the slots sit.
      </p>
      <div className="fdn-toggles">
        <Choice legend="Style" value={style} options={styleOptions} onChange={setStyle} />
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
      </div>
      <div className="fdn-unit">
        <div className="fdn-unit__deck">
          <DeckPlayer
            key={`${writing}-${layout}`}
            id="foundations-unit"
            title="One slide, three layers"
            slides={[unitSlide(content, layout)]}
            theme={theme}
            uiStyle={style}
            motion="none"
          />
        </div>
        <WebSurface theme={theme} uiStyle={style} className="fdn-unit__web">
          <UnitSection c={content} layout={layout} />
        </WebSurface>
      </div>
      <p className="fdn-note" aria-live="polite">
        <code>{`<DeckPlayer uiStyle="${style}" slides={[${layout}Slide(${writing})]} />`}</code>
      </p>
    </section>
  );
}

function ContractSection() {
  const { theme } = useShowcaseTheme();
  const layers = splitDoc(overviewDoc).sections.find((sec) => sec.title.startsWith("Three layers"))!;
  return (
    <section>
      <h2>The contract between the layers</h2>
      <div className="uipack-docs fdn-guide" data-palette="technical" data-theme={theme}>
        <DocsMarkdown source={layers.body} headingOffset={1} />
      </div>
      <ul className="fdn-links">
        <li>
          <a href="/foundations/style">Style roles</a>: the roles, ornament slots and values.
        </li>
        <li>
          <a href="/foundations/writing">Writing</a>: the content schema and slot budgets.
        </li>
        <li>
          <a href="/foundations/layout">Layout</a>: regions, archetypes and narrow forms.
        </li>
        <li>
          <a href="/foundations/mix">Mix and match</a>: what swaps cleanly and where it leaks.
        </li>
      </ul>
    </section>
  );
}

function Overview() {
  return (
    <>
      <LayerToggle />
      <ContractSection />
      <FullSpec
        source={overviewDoc}
        page="Foundations overview"
        file="README.md"
        skip={["Three layers, swapped independently", "Skills that use this spec"]}
      />
    </>
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
        <span style={{ color: "var(--ui-ink)" }}>Ink</span> <span style={{ color: "var(--ui-ink-2)" }}>ink 2</span>{" "}
        <span style={{ color: "var(--ui-ink-3)" }}>ink 3</span>
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

function StylePage() {
  return (
    <>
      <section>
        <h2>Roles in light and dark</h2>
        <p className="collection-intro">
          Every swatch is the live CSS variable, read inside <code>data-ui-style</code> and <code>data-ui-theme</code>. A role
          keeps its meaning in every style; only the value changes.
        </p>
        <div className="fdn-styles">
          {uiStyles.map((s) => (
            <article key={s.id} className="fdn-style">
              <h3>{s.name}</h3>
              <p>{s.summary}</p>
              <div className="fdn-style__themes">
                <Swatches style={s.id} theme="light" />
                <Swatches style={s.id} theme="dark" />
              </div>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2>Ornament slots</h2>
        <p className="collection-intro">
          The same markup in each style: the backdrop behind the hero, the marker before the eyebrow, the card frame and the
          primary button. Ornaments never take space, so no box moves when the style changes.
        </p>
        <div className="fdn-grid3">
          {uiStyles.map((s) => (
            <OrnamentPanel key={s.id} style={s.id} />
          ))}
        </div>
      </section>
      <section>
        <h2>Faces and what each style loads</h2>
        <div className="fdn-table" tabIndex={0} role="region" aria-label="Fonts per style">
          <table>
            <thead>
              <tr>
                <th scope="col">Style</th>
                <th scope="col">Files fetched</th>
                <th scope="col">Preloaded</th>
              </tr>
            </thead>
            <tbody>
              {uiStyles.map((s) => (
                <tr key={s.id}>
                  <th scope="row">{s.name}</th>
                  <td>
                    {s.fonts.length}: {s.fonts.map((f) => f.replace(/-latin-|\.woff2/g, " ").trim()).join(", ")}
                  </td>
                  <td>
                    {s.preload.length ? s.preload.map((f) => f.replace(/-latin-|\.woff2/g, " ").trim()).join(", ") : "nothing"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="collection-intro">
          Every style is shown in the <a href="/styles">styles gallery</a>, with Mechanism and the 3D art directions.
        </p>
      </section>
      <MediumTabs source={styleDoc} label="Style" />
      <FullSpec source={styleDoc} page="Style roles" file="style.md" />
    </>
  );
}

/* ---------------------------------------------------------------- writing */

function BudgetChecker() {
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
      <p className="fdn-checker__result" role="status">
        {problems.length ? `Over budget: ${problems.join("; ")}.` : "Fits the budget."}
      </p>
    </div>
  );
}

function budgetText(b: (typeof SLOT_BUDGETS)[SlotName]) {
  const parts: string[] = [];
  if (b.minWords !== undefined || b.maxWords !== undefined)
    parts.push(b.minWords !== undefined ? `${b.minWords}–${b.maxWords ?? "∞"} words` : `≤ ${b.maxWords} words`);
  if (b.maxChars !== undefined) parts.push(`≤ ${b.maxChars} characters`);
  if (b.maxLines !== undefined) parts.push(`≤ ${b.maxLines} lines`);
  if (b.maxSentences !== undefined) parts.push(b.maxSentences === 0 ? "not a sentence" : `≤ ${b.maxSentences} sentences`);
  return parts.join(", ");
}

function WritingPage() {
  return (
    <>
      <section>
        <h2>Slot budgets</h2>
        <p className="collection-intro">
          Read live from <code>SLOT_BUDGETS</code> in <code>uipack/deck</code>; <code>lintDeck</code> reports a slot over budget
          as <code>slot-budget</code>. A budget belongs to the slot, so it holds in every layout and style.
        </p>
        <div className="fdn-table" tabIndex={0} role="region" aria-label="Slot budgets">
          <table>
            <thead>
              <tr>
                <th scope="col">Slot</th>
                <th scope="col">What it holds</th>
                <th scope="col">Budget</th>
                <th scope="col">Overflow</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(SLOT_BUDGETS) as [SlotName, (typeof SLOT_BUDGETS)[SlotName]][]).map(([name, b]) => (
                <tr key={name}>
                  <th scope="row">
                    <code>{name}</code>
                  </th>
                  <td>{b.role}</td>
                  <td>{budgetText(b)}</td>
                  <td>{b.overflow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>Check your words</h2>
        <p className="collection-intro">The same check the linter runs, on one slot.</p>
        <BudgetChecker />
      </section>
      <MediumTabs source={writingDoc} label="Writing" />
      <FullSpec source={writingDoc} page="Writing" file="writing.md" />
    </>
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

function LayoutPage() {
  const { theme } = useShowcaseTheme();
  const [style, setStyle] = useState<UiStyleId>("technical");
  return (
    <>
      <section>
        <h2>Slide archetypes on one region map</h2>
        <p className="collection-intro">
          Points (the default for a presented deck), section, quote, fact, inverted points and end. The headline and footer stay
          in the same place on every slide, and so would an eyebrow on the rare slide that has one; only the body region changes.
          Step through with the arrows, and swap the style to see the map hold.
        </p>
        <div className="fdn-toggles">
          <Choice legend="Style" value={style} options={styleOptions} onChange={setStyle} />
        </div>
        <div className="fdn-deck">
          <DeckPlayer id="foundations-archetypes" title="Slide archetypes" slides={archetypeDeck} theme={theme} uiStyle={style} />
        </div>
      </section>
      <section>
        <h2>Narrow forms</h2>
        <p className="collection-intro">
          Below 720px a figure switches to its authored narrow drawing instead of shrinking the wide one. Narrow the window to see
          it.
        </p>
        {pipeline(undefined, "foundations-narrow")}
      </section>
      <MediumTabs source={layoutDoc} label="Layout" />
      <FullSpec source={layoutDoc} page="Layout" file="layout.md" />
    </>
  );
}

/* ---------------------------------------------------------------- mix and match */

const swaps = [
  [
    "Style",
    "Colours, faces, radii, motion feel, ornaments",
    "Words, regions, reading order, slide order",
    "/web?style=graphical&layout=shared",
  ],
  ["Writing", "The words in each slot", "Style, regions, order", "/foundations"],
  ["Layout", "Where slots sit, the archetype, section order", "Words, style", "/web?style=technical"],
];

const leaks = [
  ["Text length", "A 24-word headline wraps to three lines in any style and pushes the body down.", "Slot budgets, linted"],
  [
    "Fonts",
    "Anton caps are narrower than Plex Sans and taller at 1.3×, so a heading changes height.",
    "Region order and columns stay fixed; heights may move",
  ],
  ["Density", "A style that wanted roomier cards would change every box.", "Density is a style role; all three use 1"],
  [
    "Ornaments",
    "A poster disc behind the copy would hide words.",
    "Ornament slots never take space and sit behind or beside text",
  ],
];

const longHeadline =
  "Answer-first reviews were decided in one meeting instead of three, across every team we measured from April to September";

function MixPage() {
  const { theme } = useShowcaseTheme();
  return (
    <>
      <section>
        <h2>What each swap changes</h2>
        <div className="fdn-table" tabIndex={0} role="region" aria-label="What each swap changes">
          <table>
            <thead>
              <tr>
                <th scope="col">Swap</th>
                <th scope="col">Changes</th>
                <th scope="col">Stays put</th>
                <th scope="col">See it</th>
              </tr>
            </thead>
            <tbody>
              {swaps.map(([what, changes, stays, href]) => (
                <tr key={what}>
                  <th scope="row">{what}</th>
                  <td>{changes}</td>
                  <td>{stays}</td>
                  <td>
                    <a href={href}>Open</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>Where a layer still leaks</h2>
        <div className="fdn-table" tabIndex={0} role="region" aria-label="Where a layer leaks">
          <table>
            <thead>
              <tr>
                <th scope="col">Leak</th>
                <th scope="col">What happens</th>
                <th scope="col">What holds it</th>
              </tr>
            </thead>
            <tbody>
              {leaks.map(([leak, what, fix]) => (
                <tr key={leak}>
                  <th scope="row">{leak}</th>
                  <td>{what}</td>
                  <td>{fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>The same title in three faces</h2>
        <p className="collection-intro">
          One title, one layout, three styles. The column and the order hold; the line breaks follow each face.
        </p>
        <div className="fdn-grid3">
          {uiStyles.map((s) => (
            <WebSurface key={s.id} theme={theme} uiStyle={s.id} className="fdn-mini">
              <Eyebrow>{s.name}</Eyebrow>
              <Heading level={3} size={4}>
                Search: <em>twice as fast</em> since March
              </Heading>
              <Body>p95 198 ms, half of March · 5 indexes → 1</Body>
            </WebSurface>
          ))}
        </div>
      </section>
      <section>
        <h2>A headline over budget</h2>
        <p className="collection-intro">
          The linter catches it before any style is chosen: <code>{slotProblems("headline", longHeadline).join("; ")}</code>.
        </p>
        <WebSurface theme={theme} className="fdn-mini">
          <Heading level={3} size={4}>
            {longHeadline}
          </Heading>
        </WebSurface>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- recipes */

const recipes: { name: string; style: string; sequence: string[]; template: string; href: string; link: string }[] = [
  {
    name: "Talk deck",
    style: "Technical",
    sequence: ["cover", "answer", "evidence", "mechanism", "plan", "end"],
    template: "DeckSlide { role, headline (2–5 words), points[2–4], notes { say: cues, next } }",
    href: "/deck?deck=moves",
    link: "Tech talk deck",
  },
  {
    name: "Landing page (generic)",
    style: "Landing",
    sequence: ["hero + demo", "steps", "mechanism", "proof", "FAQ", "pricing"],
    template: "hero { eyebrow, headline, subhead, cta }, features[3], faq[], offer",
    href: "/web?style=landing",
    link: "The page in Landing",
  },
  {
    name: "Product page (Technical)",
    style: "Technical",
    sequence: ["hero, start edge", "mechanism figure", "proof", "steps", "FAQ", "pricing"],
    template: "hero { … }, figure spec { stages, queue, caption }, stats[], faq[]",
    href: "/web?style=technical",
    link: "The page in Technical",
  },
  {
    name: "Technical article",
    style: "Technical",
    sequence: ["layer head", "prose", "figure", "callout", "link list"],
    template: "LayerSection { index, title, metric }, Figure { title as claim, caption }",
    href: "/article",
    link: "Article parts",
  },
  {
    name: "Motion explainer",
    style: "Technical",
    sequence: ["still frame", "beat 01", "beat 02", "beat 03", "rest frame"],
    template: "beats[] { line, change }, packets on the claim's flows only",
    href: "/",
    link: "Diagrams with packets",
  },
  {
    name: "3D hero",
    style: "Studio (3D)",
    sequence: ["establishing stop", "detail stops", "2D fallback"],
    template: "stops[] { narration, labels[2–3 words] }",
    href: "/animations",
    link: "3D animations",
  },
];

function RecipesPage() {
  return (
    <section>
      <h2>Six jobs, three layers each</h2>
      <p className="collection-intro">
        Pick the style, follow the sequence, fill the template, then check it against the live page.
      </p>
      <ul className="fdn-recipes">
        {recipes.map((r) => (
          <li key={r.name} className="fdn-recipe">
            <h3>{r.name}</h3>
            <dl>
              <div>
                <dt>Style</dt>
                <dd>{r.style}</dd>
              </div>
              <div>
                <dt>Sequence</dt>
                <dd>
                  <ol className="fdn-sequence">
                    {r.sequence.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </dd>
              </div>
              <div>
                <dt>Content</dt>
                <dd>
                  <code>{r.template}</code>
                </dd>
              </div>
            </dl>
            <a href={r.href}>{r.link}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------------------------------------------------------- do and don't */

function Pair({ title, dont, doit, why }: { title: string; dont: ReactNode; doit: ReactNode; why: string }) {
  return (
    <article className="fdn-pair">
      <h3>{title}</h3>
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
      <p>{why}</p>
    </article>
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

const tropes = [
  [
    "Purple or indigo accent on a grey page",
    "Technical's forest and Graphical's orange; Landing keeps indigo only when the brief is a generic landing page",
  ],
  ["Inter or Roboto everywhere", "IBM Plex on the web, system type in figures, Anton for posters"],
  [
    "Centred hero, one CTA, three icon cards",
    "Technical leads with a working diagram on the start edge; each style reorders the sections",
  ],
  ["Rounded everything", "6px in Technical, 0 in Graphical"],
  ["Floating dashboard screenshot as the hero", "A live mechanism figure or the product demo"],
  ["Instrument Serif as the default headline face", "Only in Landing, the generic option"],
  ["Glassy blobs and ambient glow", "Glow means selection; grain and aurora only in Landing, one per viewport"],
  ["Emoji as icons", "Shape-coded flow tokens and the icon set"],
  ["Gradient text and gradient buttons", "One flat accent on one thing"],
];

/** A slide's words as a small sketch: the optional eyebrow, the title, the optional lede and the points. */
function SlideSketch({ eyebrow, title, lede, points }: { eyebrow?: string; title: string; lede?: string; points?: string[] }) {
  const { theme } = useShowcaseTheme();
  return (
    <WebSurface theme={theme} className="fdn-mini">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading level={4} size={3}>
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

/** Patterns that make slide text read as generated. Any one is fine now and then; on every slide it's a template. */
const slideTells = [
  [
    "“X, not Y” on every slide",
    "decided in one meeting, not three",
    "State the fact (3 meetings → 1); say the contrast if it matters",
  ],
  [
    "Two balanced clauses on a semicolon",
    "Same teams and the same six months; only the order of the slides changed.",
    "Two points, or keep one and say the other",
  ],
  [
    "A comparison bolted onto every claim",
    "198 ms at p95, twice as fast as March",
    "The baseline as its own point, or said aloud",
  ],
  ["Matched number pairs", "one meeting, not three · one index replaced five", "One number per point, with its baseline"],
  ["A tidy closing clause", "…and the cache serves the rest", "Stop at the fact"],
  ["A coined term used as if established", "Answer-first reviews", "Say what happened: reviews that opened with the answer"],
  [
    "The same three-part shape on every slide",
    "Eyebrow, sentence headline, lede, ten times",
    "Mix labels, verdicts and the odd question; no eyebrow or lede by default",
  ],
  ["A one-word caps eyebrow", "REVIEWS, SEARCH", "Drop it; the title names the topic"],
];

function DontPage() {
  const { theme } = useShowcaseTheme();
  return (
    <>
      <section>
        <h2>Slide writing</h2>
        <p className="collection-intro">
          A presented slide is a short title and the fragments the speaker talks from; the speaker says the because. Full-sentence
          titles are for decks read without the speaker, and there the title must state the real conclusion.
        </p>
        <div className="fdn-pairs">
          <Pair
            title="A review result"
            dont={
              <SlideSketch
                eyebrow="Reviews"
                title="Answer-first reviews were decided in one meeting, not three"
                lede="Same teams and the same six months; only the order of the slides changed."
              />
            }
            doit={
              <SlideSketch
                title="Review decisions: 3 meetings → 1"
                points={["Same teams, same 6 months", "Only change: the answer moved to slide 1"]}
              />
            }
            why="The sentence and its lede are a script to read out, built on a contrast, a semicolon and a coined term. The short title is a cue, the points carry the numbers, and the speaker says why it matters."
          />
          <Pair
            title="A speed result"
            dont={
              <SlideSketch
                eyebrow="Search"
                title="Search answers in 198 ms at p95, twice as fast as March"
                lede="One index replaced five, and the cache serves the rest."
              />
            }
            doit={
              <SlideSketch
                title="Search: twice as fast since March"
                points={["p95 198 ms, half of March", "5 indexes → 1", "The cache serves the rest"]}
              />
            }
            why="A comparison bolted onto the claim and a tidy closing clause read as generated. As fragments, the same facts sit on screen to point at, and the speaker words them fresh each time."
          />
        </div>
        <div className="fdn-table" tabIndex={0} role="region" aria-label="AI tells in slide text">
          <table>
            <thead>
              <tr>
                <th scope="col">Tell</th>
                <th scope="col">Looks like</th>
                <th scope="col">Instead</th>
              </tr>
            </thead>
            <tbody>
              {slideTells.map(([tell, looks, instead]) => (
                <tr key={tell}>
                  <th scope="row">{tell}</th>
                  <td>{looks}</td>
                  <td>{instead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>Paired examples</h2>
        <div className="fdn-pairs">
          <Pair
            title="Titles name the topic or the verdict"
            dont={
              <WebSurface theme={theme} className="fdn-mini">
                <Heading level={4} size={3}>
                  Results
                </Heading>
              </WebSurface>
            }
            doit={
              <WebSurface theme={theme} className="fdn-mini">
                <Heading level={4} size={3}>
                  Index freshness: 40 → 6 min
                </Heading>
              </WebSurface>
            }
            why="“Results” could head any slide. A topic or a short verdict gives the speaker something to talk from; the full claim is said aloud, or written out as the title in a deck sent without you."
          />
          <Pair
            title="Labels, not sentences, in the drawing"
            dont={<NodeSketch label="This service checks that" wrapped="each request is valid" />}
            doit={<NodeSketch label="Validate" sub="schema · 1 ms" />}
            why="A label that wraps is doing two jobs. Two or three words in the box; the sentence goes in the caption or the selection note."
          />
          <Pair
            title="One accent per unit"
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
            why="Two filled buttons compete. The accent marks the one action the page is for."
          />
          <Pair
            title="Glow only for selection"
            dont={
              <div className="fdn-glow" data-glow="ambient">
                Card
              </div>
            }
            doit={<div className="fdn-glow">Card</div>}
            why="An ambient glow says everything is selected. Technical and Graphical turn it off (--ui-glow: 0)."
          />
        </div>
      </section>
      <section>
        <h2>Generic AI-landing tropes</h2>
        <p className="collection-intro">
          Each of these makes a page read as generated. Check a page against the list before it ships.
        </p>
        <div className="fdn-table" tabIndex={0} role="region" aria-label="Trope checklist">
          <table>
            <thead>
              <tr>
                <th scope="col">Trope</th>
                <th scope="col">Instead</th>
              </tr>
            </thead>
            <tbody>
              {tropes.map(([t, instead]) => (
                <tr key={t}>
                  <th scope="row">{t}</th>
                  <td>{instead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- router */

const pagesByPath: Record<string, () => ReactNode> = {
  "/foundations": Overview,
  "/foundations/style": StylePage,
  "/foundations/writing": WritingPage,
  "/foundations/layout": LayoutPage,
  "/foundations/mix": MixPage,
  "/foundations/recipes": RecipesPage,
  "/foundations/do-and-dont": DontPage,
};

export default function FoundationsShowcase() {
  const Page = pagesByPath[routePath(location.pathname)] ?? Overview;
  // Sections sit straight under the shell's <main>, like every page (showcase.css styles `main > section > h2`).
  return <Page />;
}
