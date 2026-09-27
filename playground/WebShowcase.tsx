import type { CSSProperties } from "react";
import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";
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
} from "../src/web";
import "../src/web/web.css";
import "./presentations.css";
import "./web-showcase.css";

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

export default function WebShowcase() {
  const { theme, flip } = useShowcaseTheme();
  const flashy = webEntries.filter((e) => e.tags.includes("Flashy"));
  const lowKey = webEntries.filter((e) => e.tags.includes("Low-key"));
  return (
    <ShowcaseShell active="web" theme={theme} flip={flip} styleName="Landing">
      <section data-route="web">
        <h2>Web UI · Landing style</h2>
        <p className="collection-intro">
          Landing-page building blocks from <code>uipack/web</code>. The example below is one page with one goal: a demo-first hero
          that shows the product working, one star visual, rhyming icons, and the call to action repeated three times. Flashy pieces
          each earn their motion; the low-key pieces are the defaults.
        </p>
        <WebSurface theme={theme} className="web-example">
          <GlassNav
            brand={
              <a href="#web-top" className="web-brand">
                <RhymeIcon at={1} size={28} /> Tidy
              </a>
            }
            links={[
              { label: "How it works", href: "#web-how" },
              { label: "Proof", href: "#web-proof" },
              { label: "Pricing", href: "#web-start" },
            ]}
            cta={<CtaButton href="#web-start">Start free</CtaButton>}
          />
          <div id="web-top">
            <StarHero
              headingId="web-hero-title"
              eyebrow="Inbox agent"
              title="Forty emails in. Three that need you."
              subtitle="Tidy reads, files and drafts while you watch. You keep the decisions only you can make."
              actions={
                <>
                  <CtaButton size="lg" href="#web-start">
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
                  <CtaButton variant="secondary" href="#web-start">
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
            </div>
          </Section>
          <Section id="web-start" align="center" title="Get your morning back." intro="The same one goal as the hero and the nav.">
            <div className="web-closing">
              <CtaButton size="lg">Start free</CtaButton>
            </div>
          </Section>
        </WebSurface>
      </section>

      <section>
        <h2>Flashy · {flashy.length}</h2>
        <p className="collection-intro">
          Each one explains something. The demo proves the claim, the star carries the story, the spotlight shows what is
          interactive, and the reveal paces a single quote. Pointer effects are off on touch; every piece settles to a static,
          complete state under reduced motion.
        </p>
        <WebSurface theme={theme} className="web-panel">
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

      <section>
        <h2>Low-key · {lowKey.length}</h2>
        <p className="collection-intro">The defaults that make a page read as designed: scale, hierarchy, one accent, and a grid.</p>
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

      <section>
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
    </ShowcaseShell>
  );
}

const flashyNotes: Record<string, string> = {
  "demo-player": "Types the prompt, ticks through actions, lands on the result. Plays in view, Pause and Replay, step tabs.",
  "star-hero": "One gradient derived from the product story, masked behind the headline, with inline noise.",
  "spotlight-card": "A radial light and border glow that follow a fine pointer. Keyboard focus shows it too.",
  "reveal-text": "Words rise in when the quote scrolls into view. Plain text without JavaScript.",
};
