import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { useShowcaseTheme } from "./ShowcaseShell";
import { webEntries } from "./catalog";
import {
  Body,
  CtaButton,
  DemoPlayer,
  Eyebrow,
  FeatureGrid,
  GlassNav,
  Grid,
  GridItem,
  Heading,
  RevealText,
  RhymeIcon,
  Section,
  SpotlightCard,
  StarHero,
  Subhead,
  WebSurface,
  typeScale,
  type DemoStep,
  Aurora,
  BackgroundFrame,
  BeamLines,
  DotGrid,
  GrainOverlay,
  LineGrid,
  MagneticButton,
  Marquee,
  MaskedStar,
  NumberTicker,
  Reveal,
  ScrollTransform,
  StarChart,
  TextScramble,
  TiltCard,
  withViewTransition,
  withPaintTransition,
  DriftingGutters,
  SmoothScroll,
  TYPE_FACES,
  FAQ,
  JsonLd,
  useHead,
  headTagsToHtml,
  jsonLdTag,
} from "../src/web";
import { tidyFaq, tidySeo } from "./web-seo";
import "../src/web/web.css";
// Playground-only display alternates for the type specimen's comparison toggle. Not shipped:
// the package carries Instrument Serif, IBM Plex Sans and IBM Plex Mono only.
import "@fontsource/ibm-plex-serif/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "../src/web/gutters.css";
import "./web-showcase.css";
import { keepFocusedInView } from "../src/env";

// Example content. The player owns timing and playback; these words belong to the playground.
const inboxRows = [
  { from: "Finance", subject: "Q3 budget sign-off", due: "today" },
  { from: "Legal", subject: "Contract redline, v4", due: "5 pm" },
  { from: "Family", subject: "Dinner on Sunday?", due: "reply" },
];

const demoSteps: DemoStep[] = [
  {
    id: "ask",
    label: "Ask",
    title: "Say what you want in one sentence.",
    prompt: "Clear my inbox. Keep only what needs me today.",
    screen: (
      <ul className="web-demo-rows" data-skeleton aria-label="Unread messages">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i}>
            <i style={{ width: `${40 + ((i * 17) % 35)}%` }} />
            <i style={{ width: `${20 + ((i * 11) % 25)}%` }} />
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "act",
    label: "Act",
    title: "Watch each action as it happens.",
    actions: [
      { label: "Archived newsletters", detail: "22", metric: 18 },
      { label: "Filed receipts to Finance", detail: "9", metric: 9 },
      { label: "Snoozed threads to Monday", detail: "2", metric: 7 },
      { label: "Drafted replies for review", detail: "4", metric: 3 },
    ],
  },
  {
    id: "review",
    label: "Review",
    title: "Three things need you. Everything else is handled.",
    metric: 3,
    screen: (
      <ul className="web-demo-rows" aria-label="Messages that need you">
        {inboxRows.map((r) => (
          <li key={r.subject}>
            <strong>{r.subject}</strong>
            <span>
              {r.from} · {r.due}
            </span>
          </li>
        ))}
      </ul>
    ),
  },
];

const features = [
  { title: "Ask in a sentence", body: "No rules to write. Describe the outcome and the agent plans the steps.", icon: <RhymeIcon at={0.1} /> },
  { title: "Watch every action", body: "Each change is listed as it happens, so you can stop it or undo it.", icon: <RhymeIcon at={0.55} /> },
  { title: "Decide what is left", body: "You see the few messages that need a person, with drafts ready.", icon: <RhymeIcon at={1} /> },
];

const principles = [
  "One goal per page; the CTA sits in the hero, the nav and again at the end.",
  "Show the product working. Proof of value beats decoration.",
  "One star of the show, derived from the product story.",
  "Visual rhyming: repeat one shape motif down the page.",
  "Quiet depth: noise and glass, never loud.",
  "Hierarchy by opacity: 100 / 87 / 66.",
  "Type scale 16px × 1.25; 12 / 8 / 4 grid on 8-pt spacing.",
  "60 / 30 / 10 colour; contrast 4.5:1 small text, 3:1 large.",
  "Choose the headline font first, then pair it.",
  "Make a radically different version before refining.",
  "Start from an 80% snippet, then tune it.",
  "Motion explains change and respects reduced motion.",
];

const docsUrl = "https://github.com/ong6/uipack/blob/main/docs/web-principles.md";

function TypeScaleSpecimen() {
  return (
    <ol className="web-scale" aria-label="Type scale">
      {[6, 5, 4, 3, 2, 1, 0, -1].map((step) => (
        <li key={step}>
          <code>
            step {step} · {typeScale(step)}rem · {Math.round(typeScale(step) * 16 * 10) / 10}px
          </code>
          <span className="web-scale__sample" data-step={step} style={{ fontSize: `var(--web-step-${step})` } as CSSProperties}>
            Forty in, three left
          </span>
        </li>
      ))}
    </ol>
  );
}

type DisplayFaceId = "instrument-serif" | "ibm-plex-serif" | "space-grotesk";

// Each alternate brings its own weight and tracking: a grotesk needs more weight and tighter
// tracking than a hairline serif to hold the same headline.
const displayFaces: { id: DisplayFaceId; name: string; family: string; note: string; style?: CSSProperties }[] = [
  {
    id: "instrument-serif",
    name: "Instrument Serif",
    family: "var(--web-font-display)",
    note: "Default. A high-contrast editorial serif with one weight and a real italic.",
  },
  {
    id: "ibm-plex-serif",
    name: "IBM Plex Serif",
    family: '"IBM Plex Serif", "Instrument Serif Fallback", Georgia, serif',
    note: "Plex's own serif: calmer and wider, the same voice as the text face. Its italic is synthesised here.",
    style: { "--web-display-weight": 400, "--web-display-tracking": "-0.02em" } as CSSProperties,
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    family: '"Space Grotesk", "IBM Plex Sans Fallback", system-ui, sans-serif',
    note: "A geometric grotesk at 500: technical and punchy, close to the text face. It has no italic.",
    style: { "--web-display-weight": 500, "--web-display-tracking": "-0.03em" } as CSSProperties,
  },
];

const faceStyle = (id: DisplayFaceId): CSSProperties | undefined => {
  const f = displayFaces.find((d) => d.id === id)!;
  return f.style ? ({ ...f.style, "--web-font-display": f.family } as CSSProperties) : undefined;
};

const pageIndex = [
  { href: "#web-example", label: "Example page" },
  { href: "#web-type", label: "Type" },
  { href: "#web-flashy", label: "Flashy" },
  { href: "#web-lowkey", label: "Low-key" },
  { href: "#web-motion", label: "Motion" },
  { href: "#web-backgrounds", label: "Backgrounds" },
  { href: "#web-principles", label: "Principles" },
];

function PageIndex() {
  return (
    <nav className="web-index" aria-label="On this page">
      <ol onFocus={keepFocusedInView}>
        {pageIndex.map((l) => (
          <li key={l.href}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function TypeSpecimen({ theme, face, setFace }: { theme: "light" | "dark"; face: DisplayFaceId; setFace: (id: DisplayFaceId) => void }) {
  const current = displayFaces.find((f) => f.id === face)!;
  return (
    <section id="web-type" data-section="type" className="web-anchor">
      <h2>Type · 3 roles</h2>
      <p className="collection-intro">
        Three faces, each with one job. The display face carries the brand in headlines and big numbers, the text face is quiet enough to
        read and press, and the mono face marks labels and data. All three are self-hosted woff2 files in the package (latin only) and swap in
        over metric-matched fallbacks.
      </p>
      <WebSurface theme={theme} className="web-panel" style={faceStyle(face)}>
        <Grid>
          <GridItem span={[12, 8, 4]}>
            <div className="web-role" data-role="display">
              <Eyebrow>Display · {face === "instrument-serif" ? `${TYPE_FACES.display} 400 + italic` : `${current.name} (preview)`}</Eyebrow>
              <p className="web-role__display">
                Forty in. <em>Three</em> left.
              </p>
              <Body>
                Headings at steps 4–6 (39–61px, or 31px and up in narrow containers), the hero, big numbers and pull quotes. One weight;
                the italic marks the phrase that matters.
              </Body>
            </div>
          </GridItem>
          <GridItem span={[6, 4, 4]}>
            <div className="web-role" data-role="text">
              <Eyebrow>Text · {TYPE_FACES.text} 400 / 500 / 600</Eyebrow>
              <Heading level={3} size={2}>
                Watch every action
              </Heading>
              <Body emphasis="medium">
                Body, subheads, buttons, nav and headings at steps 0–3. At those sizes a hairline serif loses its contrast, so small
                headings stay in the sans at 600.
              </Body>
              <div className="web-buttons">
                <CtaButton>Start free</CtaButton>
                <CtaButton variant="secondary">See how it works</CtaButton>
              </div>
            </div>
          </GridItem>
          <GridItem span={[6, 4, 4]}>
            <div className="web-role" data-role="mono">
              <Eyebrow>Mono · {TYPE_FACES.mono} 400 / 600</Eyebrow>
              <dl className="web-role__data">
                <div>
                  <dt>step</dt>
                  <dd>03 / 03</dd>
                </div>
                <div>
                  <dt>handled</dt>
                  <dd>37 messages</dd>
                </div>
                <div>
                  <dt>address</dt>
                  <dd>tidy.example/inbox</dd>
                </div>
              </dl>
              <Body>Eyebrows, labels, step numbers, data, code and metadata. Fixed widths keep columns of figures aligned.</Body>
            </div>
          </GridItem>
        </Grid>
        <fieldset className="web-face-toggle">
          <legend>Compare display faces</legend>
          <div className="web-face-toggle__options">
            {displayFaces.map((f) => (
              <label key={f.id}>
                <input type="radio" name="web-display-face" value={f.id} checked={face === f.id} onChange={() => setFace(f.id)} />
                <span style={{ fontFamily: f.family }}>{f.name}</span>
              </label>
            ))}
          </div>
          <p className="web-face-toggle__note" aria-live="polite">
            {current.note} The choice previews on every Landing surface on this page; the package ships Instrument Serif only.
          </p>
        </fieldset>
      </WebSurface>
    </section>
  );
}

/**
 * False for the first paint, then true. The page paints its intro and index first and renders
 * the Landing example and the sections under it in the next task: the first paint on a slow phone
 * no longer waits for the example's render and layout, and the Landing faces (requested by that
 * layout) load after the intro is up. Nothing above moves; the rest appears below it.
 */
function usePainted() {
  const [painted, setPainted] = useState(false);
  useEffect(() => {
    // A hidden tab never paints (and pauses animation frames), so render at once there.
    if (document.visibilityState === "hidden") return void setPainted(true);
    let timer = 0;
    const frame = requestAnimationFrame(() => void (timer = window.setTimeout(() => setPainted(true))));
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);
  return painted;
}

export default function WebShowcase() {
  const { theme, flip } = useShowcaseTheme();
  const [face, setFace] = useState<DisplayFaceId>("instrument-serif");
  const surfaceStyle = faceStyle(face);
  // The demo page publishes a real head (title, description, canonical, Open Graph), JSON-LD for
  // the product and its Pricing offer, and an FAQ, all from playground/web-seo.ts.
  const seo = useMemo(() => tidySeo(location.origin), []);
  // Its <title> stays in the generated head shown below; the tab keeps the playground's "Web UI · uipack".
  const head = useMemo(() => seo.meta.filter((tag) => tag.tag !== "title"), [seo]);
  useHead(head);
  const flashy = webEntries.filter((e) => e.tags.includes("Flashy"));
  const lowKey = webEntries.filter((e) => e.tags.includes("Low-key"));
  const painted = usePainted();
  return (
    <>
      <SmoothScroll />
      <section data-route="web" id="web-example" className="web-anchor">
        <p className="collection-intro">
          The example below, built from <code>uipack/web</code>, is one page with one goal: a demo-first hero
          that shows the product working, one star visual, rhyming icons, and the call to action repeated three times. Flashy pieces
          each earn their motion; the low-key pieces are the defaults. Wheel scrolling on this page is eased by <code>SmoothScroll</code>;
          touch and reduced motion keep native scrolling. The page also sets its own head, JSON-LD and FAQ from the discoverability
          kit; the disclosures under the example show what it publishes.
        </p>
        <PageIndex />
        {painted && (
          <>
            <WebSurface theme={theme} className="web-example" style={surfaceStyle}>
              <JsonLd data={seo.jsonLd} />
              <GlassNav
                brand={
                  <a href="#web-top" className="web-brand">
                    <RhymeIcon at={1} size={28} /> Tidy
                  </a>
                }
                links={[
                  { label: "How it works", href: "#web-how" },
                  { label: "Proof", href: "#web-proof" },
                  { label: "Pricing", href: "#web-pricing" },
                ]}
                cta={<CtaButton href="#web-pricing">Start free</CtaButton>}
              />
              <div id="web-top">
                <StarHero
                  headingId="web-hero-title"
                  eyebrow="Inbox agent"
                  title={
                    <>
                      Forty emails in. Three that <em>need you.</em>
                    </>
                  }
                  subtitle="Tidy reads, files and drafts while you watch. You keep the decisions only you can make."
                  actions={
                    <>
                      <CtaButton size="lg" href="#web-pricing">
                        Start free
                      </CtaButton>
                      <CtaButton size="lg" variant="secondary" href="#web-how">
                        See how it works
                      </CtaButton>
                    </>
                  }
                >
                  <DemoPlayer
                    label="Product demo: clearing an inbox"
                    address="tidy.example/inbox"
                    steps={demoSteps}
                    initialMetric={40}
                    metricLabel="in your inbox"
                    cta={
                      <CtaButton variant="secondary" href="#web-pricing">
                        Try it yourself
                      </CtaButton>
                    }
                  />
                </StarHero>
              </div>
              <Section id="web-how" eyebrow="How it works" title="Three steps, all of them visible." intro="The same curve from the hero marks each step, so the page reads as one idea.">
                <FeatureGrid features={features} spotlight />
              </Section>
              <Section id="web-proof" tone="secondary" align="center" eyebrow="Social proof slot">
                <div className="web-quote">
                  <RevealText
                    as="blockquote"
                    className="web-quote__text"
                    text="I stopped opening my inbox before coffee. It leaves me three things, and they are the right three."
                  />
                  <Body>Placeholder quote. Replace it with a named customer and a number before you ship.</Body>
                  <dl className="web-stats">
                    <div>
                      <dt>messages handled this morning</dt>
                      <dd>
                        <NumberTicker value={37} />
                      </dd>
                    </div>
                    <div>
                      <dt>fewer unread</dt>
                      <dd>
                        <NumberTicker value={92} suffix="%" />
                      </dd>
                    </div>
                    <div>
                      <dt>to watch the demo</dt>
                      <dd>
                        <NumberTicker value={9.4} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix=" s" />
                      </dd>
                    </div>
                  </dl>
                </div>
              </Section>
              <FAQ
                id="web-faq"
                items={tidyFaq}
                url={seo.url}
                intro="Example answers for an illustrative product. Each first sentence answers the question on its own, so an answer engine can quote it alone."
              />
              <Section
                id="web-pricing"
                align="center"
                eyebrow="Pricing"
                title={
                  <>
                    Get your morning back for <em>$8 a month.</em>
                  </>
                }
                intro="Free for 30 days, no card needed. One inbox, every action visible."
              >
                <div className="web-closing">
                  <CtaButton size="lg">Start free</CtaButton>
                </div>
              </Section>
            </WebSurface>
            <GeneratedFiles seo={seo} />
          </>
        )}
      </section>

      {painted && (
        <>
          <TypeSpecimen theme={theme} face={face} setFace={setFace} />

          <section id="web-flashy" className="web-anchor">
            <h2>Flashy · {flashy.length}</h2>
            <p className="collection-intro">
              Each one explains something. The demo proves the claim, the star carries the story, the spotlight shows what is
              interactive, and the reveal paces a single quote. Pointer effects are off on touch; every piece settles to a static,
              complete state under reduced motion.
            </p>
            <WebSurface theme={theme} className="web-panel" style={surfaceStyle}>
              <Grid as="ul">
                {flashy.map((entry) => (
                  <GridItem as="li" key={entry.id} span={[3, 4, 4]}>
                    <SpotlightCard>
                      <Heading level={3} size={1}>
                        <a href={entry.id === "reveal-text" ? "#web-proof" : entry.id === "spotlight-card" ? "#web-how" : "#web-top"}>{entry.title}</a>
                      </Heading>
                      <Body>{flashyNotes[entry.id]}</Body>
                    </SpotlightCard>
                  </GridItem>
                ))}
              </Grid>
            </WebSurface>
          </section>

          <section id="web-lowkey" className="web-anchor">
            <h2>Low-key · {lowKey.length}</h2>
            <p className="collection-intro">The defaults that make a page read as designed: scale, hierarchy, one accent, and a grid.</p>
            <WebSurface theme={theme} className="web-panel web-lowkey" style={surfaceStyle}>
              <Grid>
                <GridItem span={[7, 8, 4]}>
                  <div className="web-block">
                    <Eyebrow>Type scale · 16 × 1.25</Eyebrow>
                    <TypeScaleSpecimen />
                  </div>
                </GridItem>
                <GridItem span={[5, 8, 4]}>
                  <div className="web-block">
                    <Eyebrow>Hierarchy by opacity</Eyebrow>
                    <div className="web-hierarchy">
                      <Eyebrow>Eyebrow · 66%</Eyebrow>
                      <Heading level={3} size={4}>
                        Heading · 100%
                      </Heading>
                      <Subhead>Subhead at 87%, one step above body.</Subhead>
                      <Body>Body at 66%. One ink colour, three emphasis levels, no extra greys to maintain.</Body>
                    </div>
                    <Eyebrow>Colour roles · 60 / 30 / 10</Eyebrow>
                    <div className="web-roles" role="img" aria-label="Neutral 60 percent, secondary 30 percent, accent 10 percent">
                      <span data-role="neutral">60 neutral</span>
                      <span data-role="secondary">30</span>
                      <span data-role="accent">10</span>
                    </div>
                    <Eyebrow>CTA · accent is reserved for the goal</Eyebrow>
                    <div className="web-buttons">
                      <CtaButton>Start free</CtaButton>
                      <CtaButton variant="secondary">See how it works</CtaButton>
                    </div>
                  </div>
                </GridItem>
                <GridItem span={[12, 8, 4]}>
                  <div className="web-block">
                    <Eyebrow>Grid · 12 / 8 / 4 columns, 8-pt gutters</Eyebrow>
                    <Grid className="web-columns">
                      {Array.from({ length: 12 }, (_, i) => (
                        <GridItem key={i} span={[1, 1, 1]}>
                          <span>{i + 1}</span>
                        </GridItem>
                      ))}
                    </Grid>
                  </div>
                </GridItem>
              </Grid>
            </WebSurface>
          </section>

          <MotionSection theme={theme} flip={flip} surfaceStyle={surfaceStyle} />
          <BackgroundsSection theme={theme} surfaceStyle={surfaceStyle} />

          <section id="web-principles" className="web-anchor">
            <h2>Principles · {principles.length}</h2>
            <ol className="web-principles">
              {principles.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            <p className="collection-intro">
              Each rule has its number and source video in <a href={docsUrl}>docs/web-principles.md</a>.
            </p>
          </section>
        </>
      )}
    </>
  );
}

function GeneratedFiles({ seo }: { seo: ReturnType<typeof tidySeo> }) {
  const head = headTagsToHtml([...seo.meta, jsonLdTag(seo.jsonLd)]);
  return (
    <div className="web-generated">
      <details>
        <summary>View generated robots.txt / sitemap.xml / llms.txt</summary>
        <p className="web-generated__note">
          <code>buildCrawlFiles()</code> output for this origin. A real site serves these at its root; the AI crawler stance is{" "}
          <code>allow-all</code>, with a comment per crawler.
        </p>
        {Object.entries(seo.files).map(([name, body]) => (
          <figure key={name}>
            <figcaption>
              <code>{name}</code>
            </figcaption>
            <pre tabIndex={0} aria-label={name}>
              <code>{body}</code>
            </pre>
          </figure>
        ))}
      </details>
      <details>
        <summary>View generated head tags and JSON-LD</summary>
        <p className="web-generated__note">
          <code>pageMeta()</code> and <code>jsonLd()</code> output. This playground applies it with <code>useHead</code>; a
          server-rendered page puts the same tags in its HTML with <code>HeadTags</code> or <code>headTagsToHtml</code>.
        </p>
        <figure>
          <figcaption>
            <code>&lt;head&gt;</code>
          </figcaption>
          <pre tabIndex={0} aria-label="Head tags">
            <code>{head}</code>
          </pre>
        </figure>
      </details>
    </div>
  );
}

const flashyNotes: Record<string, string> = {
  "demo-player": "Types the prompt, ticks through actions, lands on the result. Plays in view, Pause and Replay, step tabs.",
  "star-hero": "One gradient derived from the product story, masked behind the headline, with inline noise.",
  "spotlight-card": "A radial light and border glow that follow a fine pointer. Keyboard focus shows it too.",
  "reveal-text": "Words rise in when the quote scrolls into view. Plain text without JavaScript.",
};

const skills = ["React", "TypeScript", "SVG", "Three.js", "Blender", "Node", "Postgres", "Playwright", "Vite", "Design systems"];

function Replay({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="web-replay" onClick={onClick}>
      Replay
    </button>
  );
}

function ViewTransitionDemo() {
  const [yearly, setYearly] = useState(false);
  return (
    <div className="web-block">
      <Eyebrow>View transition · with fallback</Eyebrow>
      <div className="web-price" style={{ viewTransitionName: "web-price" } as CSSProperties}>
        <strong>{yearly ? "$96" : "$10"}</strong>
        <span>{yearly ? "per year, two months free" : "per month"}</span>
      </div>
      <div className="web-buttons">
        <CtaButton variant="secondary" aria-pressed={yearly} onClick={() => withViewTransition(() => flushSync(() => setYearly((y) => !y)))}>
          {yearly ? "Show monthly" : "Show yearly"}
        </CtaButton>
      </div>
      <Body>Cross-fades where the browser supports View Transitions; swaps instantly elsewhere and under reduced motion.</Body>
    </div>
  );
}

function PaintTransitionDemo({ theme, flip }: { theme: "light" | "dark"; flip: () => void }) {
  return (
    <div className="web-block">
      <Eyebrow>Paint transition · theme change</Eyebrow>
      <div className="web-paint-swatch" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="web-buttons">
        <CtaButton variant="secondary" onClick={() => withPaintTransition(() => flushSync(flip))}>
          {theme === "dark" ? "Pour light theme" : "Pour dark theme"}
        </CtaButton>
      </div>
      <Body>The new theme runs down the whole page with drips that start, fall and thin out on their own, new every time. Instant without View Transitions and under reduced motion.</Body>
    </div>
  );
}

function MotionSection({ theme, flip, surfaceStyle }: { theme: "light" | "dark"; flip: () => void; surfaceStyle?: CSSProperties }) {
  const [revealKey, setRevealKey] = useState(0);
  const [scrambleKey, setScrambleKey] = useState(0);
  const [tickerKey, setTickerKey] = useState(0);
  return (
    <section data-section="motion" id="web-motion" className="web-anchor">
      <h2>Motion · {webEntries.filter((e) => e.tags.includes("Motion")).length}</h2>
      <p className="collection-intro">
        Motion explains change: something arrives, resolves, counts up or follows the reader. Everything here pauses off screen, uses only transform,
        opacity and filter so nothing shifts, and settles to its final state under reduced motion. Hover effects are mouse-only.
      </p>
      <WebSurface theme={theme} className="web-panel" style={surfaceStyle}>
        <Grid>
          <GridItem span={[4, 4, 4]}>
            <div className="web-block">
              <Eyebrow>Reveal on scroll · staggered</Eyebrow>
              <Reveal key={revealKey} variant="blur" className="web-reveal-list">
                <div>Ask in a sentence</div>
                <div>Watch every action</div>
                <div>Decide what is left</div>
              </Reveal>
              <Replay onClick={() => setRevealKey((k) => k + 1)} />
            </div>
          </GridItem>
          <GridItem span={[4, 4, 4]}>
            <div className="web-block" key={scrambleKey}>
              <Eyebrow>Text scramble · typewriter</Eyebrow>
              <Heading level={3} size={3}>
                <TextScramble text="Forty in. Three left." />
              </Heading>
              <Subhead>
                <TextScramble text="Typed once, the first time you see it." mode="type" duration={1600} />
              </Subhead>
              <Replay onClick={() => setScrambleKey((k) => k + 1)} />
            </div>
          </GridItem>
          <GridItem span={[4, 8, 4]}>
            <div className="web-block">
              <Eyebrow>Number ticker · proof stats</Eyebrow>
              <dl className="web-stats" data-align="start" key={tickerKey}>
                <div>
                  <dt>handled</dt>
                  <dd>
                    <NumberTicker value={37} />
                  </dd>
                </div>
                <div>
                  <dt>saved each week</dt>
                  <dd>
                    <NumberTicker value={4.5} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix=" h" />
                  </dd>
                </div>
              </dl>
              <Replay onClick={() => setTickerKey((k) => k + 1)} />
            </div>
          </GridItem>
          <GridItem span={[12, 8, 4]}>
            <div className="web-block">
              <Eyebrow>Marquee · pauses on hover, focus and its button</Eyebrow>
              <Marquee label="Tools" items={skills.map((s) => <span className="web-chip">{s}</span>)} />
            </div>
          </GridItem>
          <GridItem span={[4, 8, 4]}>
            <div className="web-block">
              <Eyebrow>Tilt card · magnetic button</Eyebrow>
              <TiltCard href="#web-how">
                <RhymeIcon at={0.55} />
                <Heading level={3} size={1}>
                  Watch every action
                </Heading>
                <Body>Tilts a few degrees toward a mouse. Touch and keyboard get a still card with a focus lift.</Body>
              </TiltCard>
              <div className="web-buttons">
                <MagneticButton href="#web-pricing">Start free</MagneticButton>
              </div>
            </div>
          </GridItem>
          <GridItem span={[4, 4, 4]}>
            <ViewTransitionDemo />
          </GridItem>
          <GridItem span={[4, 4, 4]}>
            <PaintTransitionDemo theme={theme} flip={flip} />
          </GridItem>
          <GridItem span={[12, 8, 4]}>
            <div className="web-block">
              <Eyebrow>Scroll transform · the hero's star, reused down the page</Eyebrow>
              <BackgroundFrame className="web-scroll-stage" background={<GrainOverlay opacity={0.05} />}>
                <ScrollTransform rotate={[-8, 4]} scale={[0.86, 1.08]} translateY={[48, -48]} opacity={[0.5, 1]}>
                  <div className="web-scroll-star">
                    <StarChart />
                  </div>
                </ScrollTransform>
                <p className="web-scroll-caption">Scroll: the same curve turns and grows with the reader.</p>
              </BackgroundFrame>
            </div>
          </GridItem>
        </Grid>
      </WebSurface>
    </section>
  );
}

const backgroundTiles = [
  { id: "grain", name: "Grain overlay", note: "feTurbulence noise at 7%. Quiet depth, no file, no motion.", bg: <GrainOverlay opacity={0.12} /> },
  { id: "dots", name: "Dot grid", note: "Radial fade. Lights under a mouse; still on touch.", bg: <DotGrid spotlight /> },
  { id: "lines", name: "Line grid", note: "Hairlines at 8% ink, faded toward the edges.", bg: <LineGrid spotlight size={32} /> },
  { id: "aurora", name: "Aurora", note: "Three blurred token colours drift slowly, capped at 28% opacity.", bg: <Aurora /> },
  { id: "star", name: "Masked star", note: "The hero's star, masked clear of the copy.", bg: <MaskedStar clear="start" /> },
  { id: "beams", name: "Beam lines", note: "Light rides the grid lines, like packets on a connector.", bg: <BeamLines /> },
];

function BackgroundsSection({ theme, surfaceStyle }: { theme: "light" | "dark"; surfaceStyle?: CSSProperties }) {
  return (
    <section data-section="backgrounds" id="web-backgrounds" className="web-anchor">
      <h2>Backgrounds · {backgroundTiles.length + 1}</h2>
      <p className="collection-intro">
        One ambient effect per viewport on a real page; this gallery breaks that rule to compare them. Backgrounds sit at low contrast so the
        text above keeps 4.5:1. Moving ones pause off screen and hold still under reduced motion.
      </p>
      <WebSurface theme={theme} className="web-panel" style={surfaceStyle}>
        <Grid>
          {backgroundTiles.map((tile) => (
            <GridItem key={tile.id} span={[4, 4, 4]}>
              <BackgroundFrame className="web-bg-tile" background={tile.bg}>
                <Eyebrow>{tile.id}</Eyebrow>
                <Heading level={3} size={2}>
                  {tile.name}
                </Heading>
                <Body>{tile.note}</Body>
              </BackgroundFrame>
            </GridItem>
          ))}
          <GridItem span={[12, 8, 4]}>
            <div className="web-bg-tile web-gutters-stage" data-bg-tile="gutters">
              {/* The stage's transform contains the fixed gutters, standing in for the viewport. */}
              <DriftingGutters contentWidth="56%" top={0} minViewport={0} drift={24} />
              <div className="web-gutters-column">
                <Eyebrow>gutters</Eyebrow>
                <Heading level={3} size={2}>
                  Drifting gutters
                </Heading>
                <Body>A dotted grid drifts up the empty margins beside a centred column. Fixed, faded toward the content; hidden below 1280px by default.</Body>
              </div>
            </div>
          </GridItem>
        </Grid>
      </WebSurface>
    </section>
  );
}
