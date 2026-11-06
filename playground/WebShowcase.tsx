import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
  WebPage,
  ProductWindow,
  ItemList,
  type WebPageProps,
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
  curvePath,
  TextScramble,
  TiltCard,
  withViewTransition,
  withPaintTransition,
  DriftingGutters,
  SmoothScroll,
  FAQ,
  Proof,
  PricingPlans,
  ClosingCta,
  SiteFooter,
  Brand,
  JsonLd,
  useHead,
  headTagsToHtml,
  jsonLdTag,
} from "../src/web";
import { tidyFaq, tidySeo } from "./web-seo";
import "../src/web/fonts.css";
import "../src/web/web.css";
import "../src/web/web-styles.css";
import "../src/web/gutters.css";
import "./web-showcase.css";
import { usePrefersReducedMotion } from "../src/env";

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
  {
    title: "Ask in a sentence",
    body: "No rules to write. Describe the outcome and the agent plans the steps.",
  },
  {
    title: "Watch every action",
    body: "Each change is listed as it happens, so you can stop it or undo it.",
  },
  {
    title: "Decide what is left",
    body: "You see the few messages that need a person, with drafts ready.",
  },
];

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

/** Technical's three type roles, as the specimen labels them. */
const faces = { display: "IBM Plex Sans 600", text: "IBM Plex Sans 400 / 500 / 600", mono: "IBM Plex Mono 400 / 600" };

function TypeSpecimen({ theme }: { theme: "light" | "dark" }) {
  return (
    <section id="web-type" data-section="type" className="web-anchor">
      <h2>Type · 3 roles</h2>
      <p className="collection-intro">
        Three roles, each with one job. The display role carries headlines and big numbers, the text role is quiet enough to read
        and press, and the mono role marks labels and data. Technical fills them with two families, IBM Plex Sans and IBM Plex
        Mono: five self-hosted woff2 files in the package (latin only) that swap in over metric-matched fallbacks.
      </p>
      <WebSurface theme={theme} className="web-panel">
        <Grid>
          <GridItem span={[12, 8, 4]}>
            <div className="web-role" data-role="display">
              <Eyebrow>Display · {faces.display}</Eyebrow>
              <p className="web-role__display">
                Forty in. <em>Three</em> left.
              </p>
              <Body>
                Headings at steps 4–6 (39–61px, or 31px and up in narrow containers), the hero, big numbers and pull quotes. One
                weight; an amber underline marks the phrase that matters.
              </Body>
            </div>
          </GridItem>
          <GridItem span={[6, 4, 4]}>
            <div className="web-role" data-role="text">
              <Eyebrow>Text · {faces.text}</Eyebrow>
              <Heading level={3} size={2}>
                Watch every action
              </Heading>
              <Body emphasis="medium">
                Body, subheads, buttons, nav and headings at steps 0–3. The same family as the display role, so page, slide and
                figure titles share one voice.
              </Body>
              <div className="web-buttons">
                <CtaButton>Start free</CtaButton>
                <CtaButton variant="secondary">See how it works</CtaButton>
              </div>
            </div>
          </GridItem>
          <GridItem span={[6, 4, 4]}>
            <div className="web-role" data-role="mono">
              <Eyebrow>Mono · {faces.mono}</Eyebrow>
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
      </WebSurface>
    </section>
  );
}

/**
 * False for the first paint, then true. The page paints its intro and index first and renders
 * the example page and the sections under it in the next task: the first paint on a slow phone
 * no longer waits for the example's render and layout, and the faces it requests load after the
 * intro is up. Nothing above moves; the rest appears below it.
 */
function usePainted() {
  // A hidden tab never paints (and pauses animation frames), so it renders everything at once.
  const [painted, setPainted] = useState(() => document.visibilityState === "hidden");
  useEffect(() => {
    if (painted) return;
    let timer = 0;
    const frame = requestAnimationFrame(() => void (timer = window.setTimeout(() => setPainted(true))));
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [painted]);
  return painted;
}

// The mechanism figure (Figure, presets, theme.css) loads as its own chunk after the first paint:
// it sits below the fold in every order, and keeping it off the critical path holds /web's LCP.
const TidyFlow = lazy(() => import("./webTidyFlow"));

/**
 * True once the page has loaded and the browser is idle: below-the-fold and hero figures render
 * then, without waiting to be scrolled into view, and their chunk never competes with the first view.
 */
function useAfterLoad() {
  const [ready, setReady] = useState(() => typeof window === "undefined");
  useEffect(() => {
    if (ready) return;
    let timer = 0;
    let idle = 0;
    const ric = (window as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    // A second after load (or after mount, if the page has already loaded), then the next idle
    // moment: well after the first view's paint.
    const go = () => {
      timer = window.setTimeout(() => {
        if (ric) idle = ric(() => setReady(true), { timeout: 1500 });
        else setReady(true);
      }, 1000);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      clearTimeout(timer);
      (window as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(idle);
    };
  }, [ready]);
  return ready;
}

/** The mechanism figure, rendered once the page has loaded, over a placeholder of its height. */
function LazyFlow() {
  const ready = useAfterLoad();
  return (
    <div className="web-mechanism" data-section-id="mechanism">
      {ready ? (
        <Suspense fallback={<div className="web-mechanism__placeholder" />}>
          <TidyFlow />
        </Suspense>
      ) : (
        <div className="web-mechanism__placeholder" />
      )}
    </div>
  );
}

const demo = (
  <DemoPlayer
    label="Product demo: clearing an inbox"
    address="tidy.example/inbox"
    steps={demoSteps}
    initialMetric={40}
    metricLabel="in your inbox"
  />
);

/** The hero's still: the product's real output after one run, the three messages left for you. */
const heroResult = (
  <ProductWindow
    label="Tidy's inbox after one run: three messages need you"
    address="tidy.example/inbox"
    title="Needs you"
    status="3 of 40"
    footer="37 archived, filed, snoozed or drafted"
    footerEnd="Drafts wait for you"
  >
    <ItemList
      label="Messages that need you"
      items={inboxRows.map((r) => ({ title: r.subject, detail: r.from, meta: r.due, status: "attention" as const }))}
    />
  </ProductWindow>
);

/**
 * The sample page's content, by section id, in its own order: Hero, Steps, Mechanism, Demo,
 * Proof, FAQ, Pricing, Closing. The hero holds the product's real output; the working diagram and
 * the demo each have their own section.
 */
function exampleSections(seo: ReturnType<typeof tidySeo>): WebPageProps["sections"] {
  return {
    hero: (
      <div id="web-top" data-section-id="hero">
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
              <CtaButton size="lg" variant="secondary" href="#web-demo">
                Watch the demo
              </CtaButton>
            </>
          }
        >
          {heroResult}
        </StarHero>
      </div>
    ),
    how: (
      <Section
        id="web-how"
        eyebrow="How it works"
        title="Ask, watch, decide."
        intro="Each step is one thing you can check, in the order it happens."
      >
        <div data-section-id="how">
          <FeatureGrid features={features} spotlight numbered />
        </div>
      </Section>
    ),
    mechanism: (
      <Section
        id="web-mechanism"
        eyebrow="Mechanism"
        title="Nothing is sent without you."
        intro="Select a step to see what it does."
      >
        <LazyFlow />
      </Section>
    ),
    demo: (
      <Section
        id="web-demo"
        eyebrow="Demo"
        title="Watch one inbox clear."
        intro="The three steps, played on a sample inbox. Pick a step to see it."
      >
        <div data-section-id="demo">{demo}</div>
      </Section>
    ),
    proof: (
      <Section
        id="web-proof"
        tone="secondary"
        eyebrow="Proof"
        title={<RevealText as="span" text="Every action is listed." />}
        intro="The sample inbox from the demo, after one run. Each action can be stopped or undone from the list."
      >
        <div data-section-id="proof">
          <Proof
            lead={{
              value: <NumberTicker value={37} />,
              of: "of 40",
              label: "messages handled in the sample inbox",
              ratio: 37 / 40,
            }}
            stats={[
              { value: <NumberTicker value={22} />, label: "newsletters archived" },
              { value: <NumberTicker value={9} />, label: "receipts filed" },
              { value: <NumberTicker value={2} />, label: "threads snoozed" },
              { value: <NumberTicker value={4} />, label: "replies drafted" },
            ]}
          />
        </div>
      </Section>
    ),
    faq: (
      <FAQ
        id="web-faq"
        items={tidyFaq}
        url={seo.url}
        intro="Example answers for an illustrative product. Each first sentence answers the question on its own, so an answer engine can quote it alone."
      />
    ),
    pricing: (
      <Section
        id="web-pricing"
        align="center"
        eyebrow="Pricing"
        title="One plan, one inbox."
        intro="Free for 30 days with no card, then $8 a month."
      >
        <div data-section-id="pricing">
          <PricingPlans
            plans={[
              {
                name: "Personal",
                price: "$8",
                period: "a month",
                summary: "After a free 30-day trial.",
                features: [
                  "One inbox",
                  "Every action listed as it happens",
                  "Drafts wait for your approval",
                  "Nothing is deleted",
                ],
              },
            ]}
            note="Illustrative prices for a sample product."
          />
        </div>
      </Section>
    ),
    closing: (
      <ClosingCta
        id="web-closing"
        eyebrow="Start"
        title="Try it on your inbox."
        intro="Thirty days free. Tidy drafts replies but never sends them."
        action={{ label: "Start free", href: "#web-pricing" }}
        note="No card needed for the trial."
      />
    ),
  };
}

/** The sample page's section ids in its own order (the keys of its sections). */
export const exampleSectionIds = () => Object.keys(exampleSections(tidySeo("https://tidy.example")));

/**
 * `web-sample` (docs/examples/landing-page.md): the Tidy sample page, built from `uipack/web`, with
 * the head it publishes and the crawl files it generates. The page's h1 is the sample's hero.
 */
export function WebSample() {
  const { theme } = useShowcaseTheme();
  // The demo page publishes a real head (title, description, canonical, Open Graph), JSON-LD for
  // the product and its Pricing offer, and an FAQ, all from playground/web-seo.ts.
  const seo = useMemo(() => tidySeo(location.origin), []);
  // Its <title> stays in the generated head shown below; the tab keeps the playground's page name.
  const head = useMemo(() => seo.meta.filter((tag) => tag.tag !== "title"), [seo]);
  useHead(head);
  const painted = usePainted();
  return (
    <>
      <SmoothScroll />
      <section data-route="web" id="web-example" className="web-anchor">
        {painted && (
          <>
            <WebPage
              theme={theme}
              className="web-example"
              uiStyle="technical"
              nav={
                <>
                  <JsonLd data={seo.jsonLd} />
                  <GlassNav
                    brand={
                      <a href="#web-top" className="web-brand">
                        <RhymeIcon at={1} size={28} /> Tidy
                      </a>
                    }
                    links={[
                      { label: "How it works", href: "#web-how" },
                      { label: "Demo", href: "#web-demo" },
                      { label: "Proof", href: "#web-proof" },
                      { label: "Pricing", href: "#web-pricing" },
                    ]}
                    cta={<CtaButton href="#web-pricing">Start free</CtaButton>}
                  />
                </>
              }
              sections={exampleSections(seo)}
            >
              <SiteFooter
                brand={<Brand href="#web-top">Tidy</Brand>}
                links={[
                  { label: "How it works", href: "#web-how" },
                  { label: "Demo", href: "#web-demo" },
                  { label: "Proof", href: "#web-proof" },
                  { label: "Pricing", href: "#web-pricing" },
                ]}
                note="Tidy is an illustrative product for this sample page."
              />
            </WebPage>
            <GeneratedFiles seo={seo} />
          </>
        )}
      </section>
    </>
  );
}

/**
 * The sample page as a still for the Assets gallery: the same WebPage and sections as `WebSample`,
 * without the head, JSON-LD, smooth scroll or generated files, so it can sit inside a card.
 */
export function WebSampleStill() {
  const { theme } = useShowcaseTheme();
  const seo = useMemo(() => tidySeo("https://tidy.example"), []);
  return (
    <WebPage
      theme={theme}
      className="web-example"
      uiStyle="technical"
      nav={
        <GlassNav
          brand={
            <span className="web-brand">
              <RhymeIcon at={1} size={28} /> Tidy
            </span>
          }
          links={[
            { label: "How it works", href: "#web-how" },
            { label: "Demo", href: "#web-demo" },
            { label: "Proof", href: "#web-proof" },
            { label: "Pricing", href: "#web-pricing" },
          ]}
          cta={<CtaButton href="#web-pricing">Start free</CtaButton>}
        />
      }
      sections={exampleSections(seo)}
    />
  );
}

/**
 * `web-parts` (docs/examples/landing-page.md): every part the sample is made of, in the sample's
 * style: type, the flashy pieces, the low-key defaults, motion and backgrounds.
 */
export function WebParts() {
  const { theme, flip } = useShowcaseTheme();
  const flashy = webEntries.filter((e) => e.tags.includes("Flashy"));
  const lowKey = webEntries.filter((e) => e.tags.includes("Low-key"));
  const painted = usePainted();
  if (!painted) return null;
  return (
    <>
      <TypeSpecimen theme={theme} />

      <FlashySection count={flashy.length}>
        <WebSurface theme={theme} className="web-panel">
          <Grid as="ul">
            {flashy.map((entry) => (
              <GridItem as="li" key={entry.id} span={[3, 4, 4]}>
                <SpotlightCard>
                  <FlashyPreview id={entry.id} />
                  <Heading level={3} size={1}>
                    <a href={entry.id === "reveal-text" ? "#web-proof" : entry.id === "spotlight-card" ? "#web-how" : "#web-top"}>
                      {entry.title}
                    </a>
                  </Heading>
                  <Body>{flashyNotes[entry.id]}</Body>
                </SpotlightCard>
              </GridItem>
            ))}
          </Grid>
        </WebSurface>
      </FlashySection>

      <section id="web-lowkey" className="web-anchor">
        <h2>Low-key · {lowKey.length}</h2>
        <p className="collection-intro">
          The defaults that make a page read as designed: scale, hierarchy, one accent, and a grid.
        </p>
        <WebSurface theme={theme} className="web-panel web-lowkey">
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
                <Eyebrow>Grid · 12 / 8 / 4 columns, 32 / 24px gutters</Eyebrow>
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

      <MotionSection theme={theme} flip={flip} />
      <BackgroundsSection theme={theme} />
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

/**
 * The Flashy section: its intro and a Pause for the cards' looping previews, the same control as
 * Backgrounds (WCAG 2.2.2). Under reduced motion the previews are already still.
 */
function FlashySection({ count, children }: { count: number; children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  return (
    <section id="web-flashy" className="web-anchor" data-web-motion={paused && !reduced ? "paused" : undefined}>
      <h2>Flashy · {count}</h2>
      <div className="web-section-intro">
        <p className="collection-intro">
          Each one explains something. The demo proves the claim, the star carries the story, the spotlight shows what is
          interactive, and the reveal paces a single quote. Pointer effects are off on touch; every piece settles to a static,
          complete state under reduced motion. Each title jumps to the piece in the example above.
        </p>
        {!reduced && (
          <button type="button" className="web-motion-toggle" onClick={() => setPaused((p) => !p)}>
            {paused ? "Play motion" : "Pause motion"}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

const PREVIEW_CURVE = curvePath([0, 1, 2, 5, 9, 16, 22, 31, 33, 35, 37, 37], 200, 72, 8);

/**
 * A small looping sketch of each Flashy piece, drawn in the page's tokens: what it does at a
 * glance, before the title's link jumps to the real one. Decorative (the note says it in words);
 * still and complete under reduced motion, held by the section's Pause.
 */
function FlashyPreview({ id }: { id: string }) {
  return (
    <div className="web-flashy-preview" data-piece={id} aria-hidden="true">
      {id === "demo-player" ? (
        <div className="web-fp-demo">
          <span className="web-fp-demo__bar">
            <i />
            <i />
            <i />
          </span>
          <span className="web-fp-demo__prompt" />
          {[0, 1, 2].map((i) => (
            <span key={i} className="web-fp-demo__row" style={{ "--i": i } as CSSProperties}>
              <b>✓</b>
              <i />
            </span>
          ))}
        </div>
      ) : id === "star-hero" ? (
        <svg className="web-fp-star" viewBox="0 0 200 72" preserveAspectRatio="none">
          <path className="web-fp-star__area" d={`${PREVIEW_CURVE}L200 72L0 72Z`} />
          <path className="web-fp-star__line" d={PREVIEW_CURVE} pathLength={1} />
        </svg>
      ) : id === "spotlight-card" ? (
        <div className="web-fp-spot">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <p className="web-fp-reveal">
          {["It", "leaves", "me", "three", "things."].map((w, i) => (
            <span key={w} style={{ "--i": i } as CSSProperties}>
              {w}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

const flashyNotes: Record<string, string> = {
  "demo-player": "Types the prompt, ticks through actions, lands on the result. Plays in view, Pause and Replay, step tabs.",
  "star-hero": "One gradient derived from the product story, masked behind the headline, with inline noise.",
  "spotlight-card": "A radial light and border glow that follow a fine pointer. Keyboard focus shows it too.",
  "reveal-text": "Words rise in when the Proof heading scrolls into view. Plain text without JavaScript.",
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
  const [after, setAfter] = useState(false);
  return (
    <div className="web-block" data-sample>
      <Eyebrow>View transition · with fallback</Eyebrow>
      <div className="web-price" style={{ viewTransitionName: "web-price" } as CSSProperties}>
        <strong>{after ? "3" : "40"}</strong>
        <span>{after ? "need you, after one run" : "in your inbox"}</span>
      </div>
      <div className="web-buttons">
        <CtaButton
          variant="secondary"
          aria-pressed={after}
          onClick={() => void withViewTransition(() => flushSync(() => setAfter((a) => !a)))}
        >
          {after ? "Show before" : "Show after"}
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
        <CtaButton variant="secondary" onClick={() => void withPaintTransition(() => flushSync(flip))}>
          {theme === "dark" ? "Pour light theme" : "Pour dark theme"}
        </CtaButton>
      </div>
      <Body>
        The new theme runs down the whole page with drips that start, fall and thin out on their own, new every time. Instant
        without View Transitions and under reduced motion.
      </Body>
    </div>
  );
}

function MotionSection({ theme, flip }: { theme: "light" | "dark"; flip: () => void }) {
  const [revealKey, setRevealKey] = useState(0);
  const [scrambleKey, setScrambleKey] = useState(0);
  const [tickerKey, setTickerKey] = useState(0);
  return (
    <section data-section="motion" id="web-motion" className="web-anchor">
      <h2>Motion · {webEntries.filter((e) => e.tags.includes("Motion")).length}</h2>
      <p className="collection-intro">
        Motion explains change: something arrives, resolves, counts up or follows the reader. Everything here pauses off screen,
        uses only transform, opacity and filter so nothing shifts, and settles to its final state under reduced motion. Hover
        effects are mouse-only.
      </p>
      <WebSurface theme={theme} className="web-panel">
        <Grid>
          <GridItem span={[4, 4, 4]}>
            <div className="web-block" data-sample>
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
            <div className="web-block" data-sample key={scrambleKey}>
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
            <div className="web-block" data-sample>
              <Eyebrow>Number ticker · proof stats</Eyebrow>
              <dl className="web-stats" data-align="start" key={tickerKey}>
                <div>
                  <dt>handled</dt>
                  <dd>
                    <NumberTicker value={37} />
                  </dd>
                </div>
                <div>
                  <dt>drafted</dt>
                  <dd>
                    <NumberTicker value={4} />
                  </dd>
                </div>
              </dl>
              <Replay onClick={() => setTickerKey((k) => k + 1)} />
            </div>
          </GridItem>
          <GridItem span={[12, 8, 4]}>
            <div className="web-block">
              <Eyebrow>Marquee · pauses on hover, focus and its button</Eyebrow>
              <Marquee
                label="Tools"
                items={skills.map((s) => (
                  <span className="web-chip">{s}</span>
                ))}
              />
            </div>
          </GridItem>
          <GridItem span={[4, 8, 4]}>
            <div className="web-block" data-sample>
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
  {
    id: "grain",
    name: "Grain overlay",
    note: "feTurbulence noise at 7%. Quiet depth, no file, no motion.",
    bg: <GrainOverlay opacity={0.12} />,
  },
  { id: "dots", name: "Dot grid", note: "Radial fade. Lights under a mouse; still on touch.", bg: <DotGrid spotlight /> },
  { id: "lines", name: "Line grid", note: "Hairlines at 8% ink, faded toward the edges.", bg: <LineGrid spotlight size={32} /> },
  { id: "aurora", name: "Aurora", note: "Three blurred token colours drift slowly, capped at 28% opacity.", bg: <Aurora /> },
  { id: "star", name: "Masked star", note: "The hero's star, masked clear of the copy.", bg: <MaskedStar clear="top" /> },
  {
    id: "beams",
    name: "Beam lines",
    note: "Light rides the grid lines, like packets on a connector.",
    bg: <BeamLines clear="top" />,
  },
];

function BackgroundsSection({ theme }: { theme: "light" | "dark" }) {
  // The aurora, beams and gutters loop for as long as they are on screen; one Pause holds them all
  // (WCAG 2.2.2). Under reduced motion they are already still, so there is nothing to pause.
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  return (
    <section
      data-section="backgrounds"
      id="web-backgrounds"
      className="web-anchor"
      data-web-motion={paused && !reduced ? "paused" : undefined}
    >
      <h2>Backgrounds · {backgroundTiles.length + 1}</h2>
      <div className="web-section-intro">
        <p className="collection-intro">
          One ambient effect per viewport on a real page; this gallery breaks that rule to compare them. Backgrounds sit at low
          contrast so the text above keeps 4.5:1. Moving ones pause off screen and hold still under reduced motion.
        </p>
        {!reduced && (
          <button type="button" className="web-motion-toggle" onClick={() => setPaused((p) => !p)}>
            {paused ? "Play motion" : "Pause motion"}
          </button>
        )}
      </div>
      <WebSurface theme={theme} className="web-panel">
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
              <DriftingGutters contentWidth="var(--web-gutters-demo-column)" top={0} minViewport={0} drift={24} />
              <div className="web-gutters-column">
                <Eyebrow>gutters</Eyebrow>
                <Heading level={3} size={2}>
                  Drifting gutters
                </Heading>
                <Body>
                  A dotted grid drifts up the empty margins beside a centred column. Fixed, faded toward the content; hidden below
                  1280px by default.
                </Body>
              </div>
            </div>
          </GridItem>
        </Grid>
      </WebSurface>
    </section>
  );
}
