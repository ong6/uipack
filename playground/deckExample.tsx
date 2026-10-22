import { Build, Morph, Slide, deckMotion, type DeckSlide } from "../src/deck";
import { GateMachine, type GatePose } from "../src/mechanism";

const gatePoses: GatePose[] = ["pass", "return", "apart"];

const Arrow = () => (
  <svg className="deck-demo-arrow" viewBox="0 0 72 16" aria-hidden="true">
    <line x1="0" y1="8" x2="62" y2="8" />
    <path d="M60 2 L72 8 L60 14 Z" />
  </svg>
);

const parts = [
  { id: "context", name: "Context", sub: "What the model may see" },
  { id: "model", name: "Model", sub: "Proposes the next action" },
  { id: "tools", name: "Tools", sub: "The actions it may take" },
  { id: "checks", name: "Checks", sub: "Proof before it lands" },
] as const;

const tokens = [
  ["quick", deckMotion.quick, "Builds, hovers, small state"],
  ["base", deckMotion.base, "The outgoing slide leaving"],
  ["slow", deckMotion.slow, "The incoming slide settling"],
  ["morph", deckMotion.morph, "Shared elements travelling"],
  ["zoom", deckMotion.zoom, "Flying into one part"],
] as const;

const footer = "UIPACK · Deck player";

/** The playground deck: the player explaining its own transition grammar. */
export const deckExample: DeckSlide[] = [
  {
    id: "cover",
    title: "One deck, one way to move",
    role: "cover",
    render: () => (
      <Slide eyebrow="Deck player" footer={footer} layout="center">
        <Morph id="title" as="h1" className="uipack-deck-title">
          One deck. One way to move.
        </Morph>
        <p className="uipack-deck-lede">
          Every slide arrives the same way, unless the story needs a zoom or a morph.
        </p>
      </Slide>
    ),
    notes: {
      say: "This deck is the player explaining itself. Every slide arrives with the same move, so when something different happens, the audience knows it means something.",
      delivery: "Let the title sit for a beat before advancing.",
      next: "Watch the title: it shrinks into the running header of the next slide.",
    },
  },
  {
    id: "moves",
    title: "Three moves",
    headline: "Three moves, each with a job.",
    role: "answer",
    transition: "morph",
    render: () => (
      <Slide footer={footer}>
        <Morph id="title" as="p" className="deck-demo-running">
          One deck. One way to move.
        </Morph>
        <h2 className="uipack-deck-heading">Three moves, each with a job.</h2>
        <ol className="deck-demo-moves">
          {[
            ["Advance", "The default. The old slide steps aside and the new one settles in, block by block."],
            ["Morph", "Something on both slides travels to its new place. Everything else fades."],
            ["Zoom", "The camera flies into one part, and that part opens into the next slide."],
          ].map(([name, text], i) => (
            <Build key={name} as="li" step={i + 1}>
              <b>{String(i + 1).padStart(2, "0")}</b>
              <h3>{name}</h3>
              <p>{text}</p>
            </Build>
          ))}
        </ol>
      </Slide>
    ),
    notes: {
      say: "Three moves, and only three. Advance is the default. Morph says this is the same thing, look where it went. Zoom says look inside this part.",
      delivery: "Each card is a build: press next to reveal them one by one.",
      next: "Here is a system with four parts. We'll fly into one of them.",
    },
  },
  {
    id: "system",
    title: "An agent harness",
    headline: "Zoom in when one part deserves a closer look.",
    role: "mechanism",
    render: () => (
      <Slide eyebrow="Agent harness" footer={footer}>
        <h2 className="uipack-deck-heading">Zoom in when one part deserves a closer look.</h2>
        <div className="deck-demo-system">
          {parts.map((p, i) => (
            <div key={p.id} className="deck-demo-system__cell">
              <Morph id={p.id} className="uipack-deck-node">
                <b>{p.name}</b>
                <span>{p.sub}</span>
              </Morph>
              {i < parts.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
        <p className="uipack-deck-label deck-demo-hint">Next · inside Checks</p>
      </Slide>
    ),
    notes: {
      say: "Four parts: context, the model, the tools it can call, and the checks that decide whether an action lands. The interesting one is the last.",
      delivery: "Point at Checks before you advance.",
      next: "Let's go inside it.",
    },
  },
  {
    id: "checks",
    title: "Inside Checks",
    headline: "Every action proves itself before it lands.",
    role: "mechanism",
    transition: { zoom: "checks" },
    render: () => (
      <Slide eyebrow="Inside · Checks" footer={footer}>
        <h2 className="uipack-deck-heading">Every action proves itself before it lands.</h2>
        <ol className="deck-demo-checks">
          {[
            ["Schema", "The call matches the tool's contract."],
            ["Policy", "The action is allowed for this user and scope."],
            ["Evidence", "The result is observed, not assumed."],
          ].map(([name, text], i) => (
            <Build key={name} as="li" step={i + 1}>
              <span className="uipack-deck-label">{String(i + 1).padStart(2, "0")}</span>
              <b>{name}</b>
              <span>{text}</span>
            </Build>
          ))}
        </ol>
      </Slide>
    ),
    notes: {
      say: "Inside the checks there are three gates. The schema check, the policy check, and the evidence check. The last one is the one teams skip.",
      delivery: "Go back one slide to show the zoom reversing.",
      next: "All of these moves share one clock.",
    },
  },
  {
    id: "gate",
    title: "The check as a machine",
    headline: "A check is a gauge every proposal passes under before it lands.",
    role: "mechanism",
    render: ({ step, thumbnail, theme, reducedMotion }) => (
      <Slide eyebrow="Mechanism style" footer={footer} layout="split" className="deck-demo-gate">
        <div className="deck-demo-gate__copy">
          <h2 className="uipack-deck-heading">A check is a gauge every proposal passes under.</h2>
          <ol className="deck-demo-gate__beats">
            <li data-current="">Under the limit: it rides on to the result tray.</li>
            <Build as="li" step={1}>
              Over the limit: an arm pushes it back for another try.
            </Build>
            <Build as="li" step={2}>
              Taken apart: every assembly that does the checking.
            </Build>
          </ol>
        </div>
        <div className="deck-demo-gate__machine">
          <GateMachine
            pose={gatePoses[Math.min(Number.isFinite(step) ? step : 2, 2)]}
            theme={theme}
            motion={reducedMotion ? "none" : "auto"}
            interactive={!thumbnail}
          />
        </div>
      </Slide>
    ),
    notes: {
      say: "Same idea as the last slide, drawn as a machine. A proposal rides under a dial gauge. Under the limit it lands; over it, an arm swings it back to be revised. Taken apart, you can see what each piece of the check does.",
      delivery: "Press Next twice: first the return, then the exploded view.",
      next: "Every move in this deck shares one clock.",
    },
  },
  {
    id: "clock",
    title: "One clock",
    headline: "One clock for every move.",
    role: "mechanism",
    tone: "ink",
    render: () => (
      <Slide eyebrow="Timing" footer={footer} layout="split">
        <div className="deck-demo-clock">
          <Morph id="number" as="p" className="uipack-deck-number">
            {deckMotion.slow}
          </Morph>
          <p className="uipack-deck-label">milliseconds</p>
        </div>
        <div className="deck-demo-clock__copy">
          <h2 className="uipack-deck-heading">One clock for every move.</h2>
          <p className="uipack-deck-lede">Durations and easing are shared tokens, so a deck never mixes speeds.</p>
        </div>
      </Slide>
    ),
    notes: {
      say: "Every move reads the same five durations and three curves. That is what makes a deck feel designed rather than assembled.",
      delivery: "Pause on the number.",
      next: "The number is one row of the full table.",
    },
  },
  {
    id: "tokens",
    title: "Motion tokens",
    headline: "Five durations and three curves cover every move.",
    role: "evidence",
    tone: "ink",
    transition: "morph",
    render: () => (
      <Slide eyebrow="Timing" footer={footer}>
        <h2 className="uipack-deck-heading">Five durations and three curves cover every move.</h2>
        <table className="deck-demo-tokens">
          <tbody>
            {tokens.map(([name, ms, use]) => (
              <tr key={name} data-current={name === "slow" ? "" : undefined}>
                <th scope="row">{name}</th>
                <td>
                  {name === "slow" ? (
                    <Morph id="number" as="span" className="deck-demo-tokens__ms">
                      {ms}
                    </Morph>
                  ) : (
                    <span className="deck-demo-tokens__ms">{ms}</span>
                  )}
                  <small>ms</small>
                </td>
                <td>{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Slide>
    ),
    notes: {
      say: "Here's the whole table. Quick for builds, base for leaving, slow for arriving, and the two long ones for morph and zoom.",
      delivery: "Trace the highlighted row with your eyes, not a pointer.",
      next: "Last slide: what to do with this.",
    },
  },
  {
    id: "close",
    title: "Write the point first",
    headline: "Rebuild your next talk in this deck before its review date.",
    role: "ask",
    tone: "accent",
    render: () => (
      <Slide eyebrow="Next" footer={footer} layout="center">
        <h2 className="uipack-deck-title">Rebuild your next talk in this deck.</h2>
        <p className="uipack-deck-lede">← → or swipe to move · G for all slides · S for the speaker view · F for full screen</p>
      </Slide>
    ),
    notes: {
      say: "The rule is simple: write the point of each slide first, and only then decide how it arrives. Most slides should just advance.",
      delivery: "End on the rule; leave the keys on screen while you take questions.",
    },
  },
];
