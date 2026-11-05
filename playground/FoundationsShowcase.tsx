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
  TITLE_WORDS,
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
import { guideSources, wordRules, words } from "./guideFacts";
import { libraryPages } from "./catalog";
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

/* ---------------------------------------------------------------- guide frame */

/** The seven guides in reading order, from the catalog (one source for labels and intros). */
const guides = libraryPages.filter((p) => p.group === "foundations" && p.path.startsWith("/foundations"));

/**
 * Code names for the reader who builds with the library: a closed aside, so the guide scans as
 * ideas and examples and the API is one click away.
 */
function Implementers({ children }: { children: ReactNode }) {
  return (
    <details className="fdn-impl">
      <summary className="fdn-impl__label">For implementers: the code names</summary>
      <div className="fdn-impl__body">{children}</div>
    </details>
  );
}

/** A short pre-ship checklist: real checkboxes, so a reader can tick through it on a draft. */
function Checklist({ items }: { items: string[] }) {
  return (
    <section>
      <h2>Before you ship</h2>
      <ul className="fdn-checklist">
        {items.map((item) => (
          <li key={item}>
            <label>
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Previous and next guide, with where this one sits in the series. */
function GuidePager({ path }: { path: string }) {
  const i = guides.findIndex((g) => g.path === path);
  if (i < 0) return null;
  const prev = guides[i - 1];
  const next = guides[i + 1];
  return (
    <nav className="fdn-pager" aria-label="Foundations guides">
      <p className="fdn-pager__count">
        Guide {i + 1} of {guides.length}
      </p>
      <div className="fdn-pager__links">
        {prev ? (
          <a href={prev.path} rel="prev" className="fdn-pager__link">
            <span className="fdn-pager__dir">Previous</span>
            <span className="fdn-pager__title">{prev.label}</span>
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a href={next.path} rel="next" className="fdn-pager__link fdn-pager__link--next">
            <span className="fdn-pager__dir">Next</span>
            <span className="fdn-pager__title">{next.label}</span>
          </a>
        )}
      </div>
    </nav>
  );
}

/**
 * Every table in the guides, the rendered docs included, gets each cell's column name as
 * `data-label`, so below 640px the CSS can stack a row into a card (the key on top, each value
 * under its column name) instead of scrolling the columns that decide it out of view. The first
 * column is the key and needs no label.
 */
function useLabelledTables() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const label = () => {
      for (const table of main.querySelectorAll<HTMLTableElement>(".fdn-table table, .fdn-guide table")) {
        const heads = [...table.querySelectorAll("thead th")].map((th) => th.textContent?.trim() ?? "");
        for (const row of table.querySelectorAll("tbody tr")) {
          [...row.children].forEach((cell, i) => {
            if (i > 0 && heads[i] && cell.getAttribute("data-label") !== heads[i]) cell.setAttribute("data-label", heads[i]);
          });
        }
      }
    };
    label();
    const mo = new MutationObserver(label);
    mo.observe(main, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
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
        One unit, shown twice: as a slide and as a web section. Each control changes one layer. Style changes colours, faces and
        decoration. Writing changes the words. Layout changes where the words sit. Try each one and watch what stays still.
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
      <Implementers>
        <p aria-live="polite">
          The slide above is <code>{`<DeckPlayer uiStyle="${style}" slides={[${layout}Slide(${writing})]} />`}</code>; the web
          section is the same content in <code>{`<WebSurface uiStyle="${style}">`}</code>.
        </p>
      </Implementers>
    </section>
  );
}

function ContractSection() {
  const { theme } = useShowcaseTheme();
  const layers = splitDoc(overviewDoc).sections.find((sec) => sec.title.startsWith("Three layers"))!;
  // The doc ends the section with its code names; the page sets them apart.
  const [prose, code = ""] = layers.body.split(/^\*\*For implementers\.\*\*\s*/m);
  return (
    <section>
      <h2>The contract between the layers</h2>
      <div className="uipack-docs fdn-guide" data-palette="technical" data-theme={theme}>
        <DocsMarkdown source={prose} headingOffset={1} />
      </div>
      {code && (
        <Implementers>
          <div className="uipack-docs fdn-guide" data-palette="technical" data-theme={theme}>
            <DocsMarkdown source={code} headingOffset={1} />
          </div>
        </Implementers>
      )}
    </section>
  );
}

/** The guides after this one, as an index: what each teaches, in reading order. */
function GuideIndex() {
  return (
    <section>
      <h2>The guides</h2>
      <p className="collection-intro">
        Read them in order, or jump to the layer you are working on. Each ends with a checklist and a link to its full
        specification.
      </p>
      <ol className="fdn-index">
        {guides.slice(1).map((g, i) => (
          <li key={g.path}>
            <a href={g.path}>
              <span className="fdn-index__num">{String(i + 2).padStart(2, "0")}</span>
              <span className="fdn-index__title">{g.label}</span>
              <span className="fdn-index__intro">{g.intro}</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Overview() {
  return (
    <>
      <LayerToggle />
      <ContractSection />
      <GuideIndex />
      <Checklist
        items={[
          "Each unit makes one claim you could say in a sentence.",
          "Colours, faces and decoration come from the style, never from the layout or the words.",
          "The words live in a content object, not inside the layout.",
          "Every slot is within its text budget; the linter reports nothing.",
          "Swapping the style once moves nothing but the paint.",
        ]}
      />
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

function StylePage() {
  return (
    <>
      <section>
        <h2>Roles in light and dark</h2>
        <p className="collection-intro">
          A role is a job a colour does, such as the page background, body text or the one highlighted thing. Every style fills
          the same twelve roles; only the values change, so a role means the same in every style. These swatches are live: each is
          read from the style itself, in its light and dark halves.
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
      <Implementers>
        <p>
          Each role is a CSS custom property, named under its swatch (<code>--ui-accent</code>). A style is one value set keyed by{" "}
          <code>data-ui-style</code> on any element, with <code>data-ui-theme</code> for light or dark; components take it as the{" "}
          <code>uiStyle</code> prop. <code>uiStyles</code> lists the styles with their fonts and preloads.
        </p>
      </Implementers>
      <MediumTabs source={styleDoc} label="Style" />
      <Checklist
        items={[
          "One accent, on the one thing the unit is about.",
          "Every colour is a role; no raw colour values in a layout or component.",
          "Small text reaches 4.5:1 contrast and large text 3:1, in light and in dark.",
          "Glow marks a selection, never the whole page.",
          "Only the active style's fonts load.",
        ]}
      />
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
      <p className="fdn-checker__result" role="status" data-verdict={problems.length ? "over" : "fits"}>
        <span className="fdn-checker__icon" aria-hidden="true">
          {problems.length ? "✕" : "✓"}
        </span>
        <span>{problems.length ? `Over budget: ${problems.join("; ")}.` : "Fits the budget."}</span>
      </p>
    </div>
  );
}

function budgetText(b: (typeof SLOT_BUDGETS)[SlotName]) {
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  const parts: string[] = [];
  if (b.minWords !== undefined || b.maxWords !== undefined)
    parts.push(b.minWords !== undefined ? `${b.minWords}–${b.maxWords ?? "∞"} words` : `at most ${b.maxWords} words`);
  if (b.maxChars !== undefined) parts.push(`at most ${b.maxChars} characters`);
  if (b.maxLines !== undefined) parts.push(b.maxLines === 1 ? "one line" : `at most ${n(b.maxLines, "line", "lines")}`);
  if (b.maxSentences !== undefined)
    parts.push(
      b.maxSentences === 0 ? "not a sentence" : b.maxSentences === 1 ? "one sentence" : `at most ${b.maxSentences} sentences`,
    );
  return parts.join(", ");
}

/** What the slot does with text past its measure, in words. */
const overflowText: Record<string, string> = {
  ellipsis: "Cut with an ellipsis",
  wrap: "Wraps",
  "wrap-balance": "Wraps, lines balanced",
};

function WritingPage() {
  return (
    <>
      <section>
        <h2>Headlines: presented or read alone</h2>
        <p className="collection-intro">
          Decide first who carries the argument. When you present, you do: the title is a short verdict and you say the claim.
          When the piece goes out without you, the title has to carry it: write the claim as a full sentence.
        </p>
        <div className="fdn-table" tabIndex={0} role="region" aria-label="Headline modes">
          <table>
            <thead>
              <tr>
                <th scope="col">Mode</th>
                <th scope="col">When</th>
                <th scope="col">Title</th>
                <th scope="col">Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Presented (the default for slides)</th>
                <td>You give it and the room hears you</td>
                <td>
                  {words(wordRules.presentedTitleAim)} (the check stops at {wordRules.presentedTitleMax}), a verdict you&rsquo;d
                  say aloud; a bare label only on agenda, section and mechanism slides
                </td>
                <td>Search: twice as fast since March</td>
              </tr>
              <tr>
                <th scope="row">Read alone</th>
                <td>A pre-read, a forwarded deck, a figure</td>
                <td>The real conclusion as one sentence, {words(wordRules.readAloneTitle)}</td>
                <td>Index freshness fell from 40 to 6 minutes</td>
              </tr>
              <tr>
                <th scope="row">Web page</th>
                <td>Read alone, by a visitor</td>
                <td>
                  The hero says what changed for the reader; section heads are {words(wordRules.webSectionHead)} naming what they
                  get
                </td>
                <td>Pull requests check in about 7 minutes</td>
              </tr>
            </tbody>
          </table>
        </div>
        <HeadlinePairs />
      </section>
      <section>
        <h2>Slot budgets</h2>
        <p className="collection-intro">
          A slot is a named place for words: the headline, a point, a label. Each holds a fixed amount before it stops reading at
          a glance. The budget belongs to the slot, so it holds in every layout and every style; a narrow display face is no
          excuse for a longer headline.
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
                  <td>
                    {name === "headline"
                      ? `presented: at most ${TITLE_WORDS.presented} words (aim for ${words(wordRules.presentedTitleAim)}); read alone: at most ${TITLE_WORDS["read-alone"]}, on at most ${b.maxLines} lines`
                      : budgetText(b)}
                  </td>
                  <td>{overflowText[b.overflow] ?? b.overflow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>Check your words</h2>
        <p className="collection-intro">Pick a slot and type. The verdict is the same one the linter gives a whole deck.</p>
        <BudgetChecker />
        <Implementers>
          <p>
            The table is read live from <code>SLOT_BUDGETS</code> in <code>uipack/deck</code>. <code>lintDeck</code> reports a
            slot over budget as <code>slot-budget</code>, and <code>slotProblems(slot, text)</code> checks one string, as this
            checker does.
          </p>
        </Implementers>
      </section>
      <section>
        <h2>Name the parts, not the system</h2>
        <p className="collection-intro">
          A drawing earns its place by showing how something works. One box with the system&rsquo;s name says nothing a heading
          couldn&rsquo;t; the stages the claim depends on, with what travels between them, explain it.
        </p>
        <div className="fdn-pairs fdn-pairs--one">
          <Pair
            title="A retrieval pipeline"
            dont={<NodeSketch label="RAG pipeline" />}
            doit={<ChainSketch />}
            why="Each box is a label of two or three words, each arrow says what moves, and the sentence that explains it goes in the caption."
          />
        </div>
      </section>
      <MediumTabs source={writingDoc} label="Writing" />
      <Checklist
        items={[
          "A presented slide's title is a short spoken verdict; a read-alone slide or a figure states the claim as one sentence.",
          "Every number has a baseline, a window and a source.",
          "Labels are two or three words; sentences go in the caption or the notes.",
          "Nothing you were not given: a missing fact is left out or pinned to the data in a note, never guessed.",
          "The linter reports no slot over budget.",
        ]}
      />
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
      <Checklist
        items={[
          "The archetype comes from the claim's shape: a flow left to right, layers top to bottom.",
          "Positions sit on the 8px grid; nothing is nudged by eye.",
          "Reading order, build order and keyboard order are the same.",
          "Checked at 390px: an authored narrow form or an internal scroll, and no page overflow.",
          "No rendered text under 11px.",
        ]}
      />
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
  [
    "Density",
    "Technical pads sections at 0.9, Graphical 0.95, Landing 1.1, so a page grows or shrinks vertically.",
    "Density scales vertical section padding only; columns and boxes keep their widths",
  ],
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
              <Body>p95 198 ms, was 410 ms · 5 indexes → 1</Body>
            </WebSurface>
          ))}
        </div>
      </section>
      <section>
        <h2>A headline over budget</h2>
        <p className="collection-intro">
          Length is the one leak no style can fix, so it is caught in the words, before any style is chosen. The linter&rsquo;s
          verdict on this headline, measured on a full-width slide: {slotProblems("headline", longHeadline).join("; ")}. In a
          narrow card it wraps further. The words past the budget are marked.
        </p>
        <div className="fdn-pairs fdn-pairs--one">
          <Pair
            title="A review result, as a headline"
            dont={
              <WebSurface theme={theme} className="fdn-mini">
                <Heading level={3} size={4}>
                  <OverBudget text={longHeadline} max={SLOT_BUDGETS.headline.maxWords ?? 14} />
                </Heading>
              </WebSurface>
            }
            doit={
              <WebSurface theme={theme} className="fdn-mini">
                <Heading level={3} size={4}>
                  Review decisions: 3 meetings → 1
                </Heading>
                <ul className="fdn-points">
                  <li>Every team, April to September</li>
                  <li>Only change: the answer moved to slide 1</li>
                </ul>
              </WebSurface>
            }
            why="Fix it in the words, not the type: a short title the speaker talks from, with the window and the cause moved into points. Shrinking the font to fit would break the budget's promise in every other style."
          />
        </div>
      </section>
      <Checklist
        items={[
          "Swap each layer once and compare: only that layer changed.",
          "Headings may change height between faces; regions and their order must not.",
          "Ornaments sit behind or beside text, never over it.",
          "Long text is fixed in the words, never by shrinking the type.",
        ]}
      />
    </>
  );
}

/* ---------------------------------------------------------------- recipes */

export const recipes: { name: string; style: string; sequence: string[]; template: string; href: string; link: string }[] = [
  {
    name: "Talk deck",
    style: "Technical",
    sequence: ["cover", "answer", "evidence", "mechanism", "plan", "end"],
    template: `DeckSlide { role, headline (${words(wordRules.presentedTitleAim)}), points[${wordRules.pointsPerSlide.join("–")}], notes { say: cues, next } }`,
    href: "/deck?deck=moves",
    link: "Tech talk deck",
  },
  {
    name: "Landing page (generic)",
    style: "Landing",
    sequence: ["hero + product output", "steps", "mechanism", "demo", "proof", "FAQ", "pricing", "closing"],
    template: "hero { eyebrow, headline, subhead, cta }, features[3], faq[], offer",
    href: "/web?style=landing",
    link: "The page in Landing",
  },
  {
    name: "Product page (Technical)",
    style: "Technical",
    sequence: ["hero + product output", "steps", "mechanism figure", "demo", "proof", "FAQ", "pricing", "closing"],
    template: "hero { … }, figure spec { stages, queue, caption }, demo steps[], stats[], faq[]",
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
    template: `stops[] { narration, labels[${words(wordRules.drawingLabel)}] }`,
    href: "/animations",
    link: "3D animations",
  },
];

function RecipesPage() {
  return (
    <>
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
      <Checklist
        items={[
          "The style fits the job: Technical by default, Landing only for a generic landing page, Graphical for a poster.",
          "The sequence is followed, or you can say why it changed.",
          "Every template field is filled from real facts, with a TODO where one is missing.",
          "The draft is compared side by side with the live example.",
        ]}
      />
    </>
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

/** Three stages with labelled arrows: the "do" for a box that names the whole system. */
function ChainSketch() {
  const stages = ["Chunk", "Embed", "pgvector"];
  const arrows = ["~1000 chars", "1536-dim"];
  return (
    <svg
      className="fdn-node fdn-chain"
      viewBox="0 0 360 96"
      role="img"
      aria-label="Chunk, then Embed, then pgvector; the arrows carry about 1000 characters and 1536-dimension vectors"
    >
      {stages.map((label, i) => (
        <g key={label} transform={`translate(${i * 128}, 32)`}>
          <rect x="1" y="1" width="102" height="46" rx="6" />
          <text x="52" y="29" textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      {arrows.map((label, i) => (
        <g key={label} transform={`translate(${104 + i * 128}, 0)`}>
          <line x1="2" y1="56" x2="20" y2="56" className="fdn-chain__line" />
          <path d="M18,52 L24,56 L18,60 z" className="fdn-chain__head" />
          <text x="12" y="20" textAnchor="middle" className="fdn-node__sub">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

const tropes = [
  [
    "Purple or indigo accent on a grey page",
    "Technical's Prussian blue and amber, Graphical's orange; Landing's cobalt only when the brief is a generic landing page",
  ],
  ["Inter or Roboto everywhere", "Archivo Expanded headings on page, slide and figure; Martian Mono labels; Anton for posters"],
  [
    "Centred hero, one CTA, three icon cards",
    "The product's real output in the first screen, straight after the headline; one section order in every style",
  ],
  ["Rounded everything", "Square corners in Technical and Graphical; Landing's 12px cards only on a generic landing page"],
  ["Floating dashboard screenshot as the hero", "The product's real output drawn from data, the mechanism figure or the demo"],
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
  [
    "A one-word caps eyebrow on a slide",
    "REVIEWS, SEARCH",
    "Drop it; the title names the topic (a web page's numbered section eyebrow is wayfinding and stays)",
  ],
];

/**
 * The two headline modes from writing.md, each with its do and don't: a presented slide (a short
 * spoken verdict over fragments) and a read-alone deck, figure or web page (the claim written out).
 */
function HeadlinePairs() {
  const { theme } = useShowcaseTheme();
  return (
    <div className="fdn-pairs">
      <Pair
        title="Presented slide: a short verdict you'd say aloud"
        dont={
          <SlideSketch
            eyebrow="Search"
            title="Search answers in 198 ms at p95, twice as fast as March"
            lede="One index replaced five."
          />
        }
        doit={<SlideSketch title="Search: twice as fast since March" points={["p95 198 ms, was 410 ms", "5 indexes → 1"]} />}
        why={`With a speaker in the room, a sentence title and a lede are a script: the room reads ahead while the speaker recites it. A verdict of ${words(wordRules.presentedTitleAim)} is the cue, the points carry the numbers, and the speaker says why it matters.`}
      />
      <Pair
        title="Read alone, a figure or the web: the claim as a sentence"
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
              Index freshness fell from 40 to 6 minutes
            </Heading>
          </WebSurface>
        }
        why={`Forwarded without you, a label or a bare verdict says nothing. Write the real conclusion as one sentence of ${words(wordRules.readAloneTitle)}; on a web page, the hero says what changed for the reader and each section head names what they get in ${words(wordRules.webSectionHead)}.`}
      />
    </div>
  );
}

function DontPage() {
  const { theme } = useShowcaseTheme();
  return (
    <>
      <section>
        <h2>Headlines: two modes</h2>
        <p className="collection-intro">
          Claim headlines are right when nobody is there to say the claim. A presented slide gets a short verdict, and the speaker
          says the because. A deck read without its speaker, a figure and a web page write the claim out. Each mode has its own
          way to go wrong.
        </p>
        <HeadlinePairs />
      </section>
      <section>
        <h2>Slide text that reads as generated</h2>
        <p className="collection-intro">Any one of these is fine now and then. On every slide it reads as a template.</p>
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
            why="An ambient glow says everything is selected. Mark the one selected card with a ring, a tick and the word, so it reads without colour; the rest stay plain."
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
      <Checklist
        items={[
          "No trope from the list above without a reason you could defend.",
          "One filled button per view; everything else is secondary.",
          "Shape-coded marks and icons, never emoji.",
          "Presented titles are short spoken verdicts; read-alone titles state the claim; never just \u201cResults\u201d.",
          "Drawings carry labels; captions carry the sentences.",
        ]}
      />
    </>
  );
}

/**
 * "On this page": the guide's sections as links, so a long guide can be scanned and entered at any
 * section. Built from the rendered h2s after mount (each gets an id from its text if it has none).
 */
function OnThisPage() {
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);
  useEffect(() => {
    // Read once the page's sections have painted (the same frame a hash link would land in).
    const frame = requestAnimationFrame(() => {
      const heads = [...document.querySelectorAll<HTMLHeadingElement>("main > section > h2")];
      setItems(
        heads.map((h) => {
          const title = h.textContent?.trim() ?? "";
          if (!h.id) h.id = slug(title);
          return { id: h.id, title };
        }),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  if (items.length < 3) return null;
  return (
    <nav className="fdn-toc" aria-label="On this page">
      <span className="fdn-toc__label">On this page</span>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The guides that teach across several docs link to each part instead of embedding one. */
const linkedSources = ["/foundations/mix", "/foundations/recipes", "/foundations/do-and-dont"];

/** Where the rules a guide teaches are written in full, as links into the library's docs. */
function SpecLinks({ path }: { path: string }) {
  const sources = guideSources[path] ?? [];
  return (
    <section>
      <h2>Where the full rules live</h2>
      <p className="collection-intro">
        This guide draws on these parts of the library&rsquo;s documentation; each one is the canonical text.
      </p>
      <ul className="fdn-sources">
        {sources.map((src) => {
          const file = src.file.startsWith("../") ? src.file.slice(3) : `system/${src.file}`;
          return (
            <li key={src.label}>
              <a href={`${REPO}/${file}${src.anchor ? `#${src.anchor}` : ""}`}>{src.label}</a>
              <code>docs/{file}</code>
            </li>
          );
        })}
      </ul>
    </section>
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
  const path = routePath(location.pathname);
  const Page = pagesByPath[path] ?? Overview;
  useLabelledTables();
  // Sections sit straight under the shell's <main>, like every page (showcase.css styles `main > section > h2`).
  return (
    <>
      <OnThisPage />
      <Page />
      {linkedSources.includes(path) && <SpecLinks path={path} />}
      <GuidePager path={pagesByPath[path] ? path : "/foundations"} />
    </>
  );
}
