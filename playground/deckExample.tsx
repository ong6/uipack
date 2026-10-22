import { Build, Morph, Slide, deckMotion, type DeckSlide } from "../src/deck";
import { GateMachine, type GatePose } from "../src/mechanism";

const Arrow = () => (
  <svg className="deck-demo-arrow" viewBox="0 0 72 16" aria-hidden="true">
    <line x1="0" y1="8" x2="62" y2="8" />
    <path d="M60 2 L72 8 L60 14 Z" />
  </svg>
);

const parts = [
  { id: "context", name: "Context", sub: "What the model may see", eg: "Ticket, repo, user scope" },
  { id: "model", name: "Model", sub: "Proposes the next action", eg: "One step at a time" },
  { id: "tools", name: "Tools", sub: "The actions it may take", eg: "Shell, search, deploy" },
  { id: "checks", name: "Checks", sub: "Proof before it lands", eg: "Schema · policy · evidence" },
] as const;

const checks = [
  ["Schema", "The call matches the tool's contract.", "deploy(env: \"prod2\"): no such environment"],
  ["Policy", "The action is allowed for this user and scope.", "A viewer asks to delete 4,000 rows"],
  ["Evidence", "The result is observed, not assumed.", "\"Tests pass\" with no test log attached"],
] as const;

/** Ten slides of a talk as a strip: nine advance, one moves. The same strip morphs from the cover onto the answer slide. */
const DeckStrip = () => (
  <Morph id="strip" className="deck-demo-strip">
    <span className="uipack-deck-sr">Ten slides: nine advance, one zooms.</span>
    {Array.from({ length: 10 }, (_, i) => (
      <span key={i} className="deck-demo-strip__slide" data-move={i === 6 ? "" : undefined} aria-hidden="true">
        {i === 6 ? "⤢" : "→"}
      </span>
    ))}
  </Morph>
);

/** What the machine shows at each build: its pose, where the camera looks and what the status line says. */
const gateSteps: { pose: GatePose; view: string; status: string }[] = [
  { pose: "pass", view: "whole", status: "4.2 under the 6.0 limit · rides on to the result tray" },
  { pose: "return", view: "arm", status: "7.8 over the limit · the arm swings it into the return chute" },
  { pose: "apart", view: "whole", status: "Taken apart · hopper, gauge, arm, chute, tray, belt" },
];

const durations = [
  ["quick", deckMotion.quick, "Builds and small state"],
  ["base", deckMotion.base, "The old slide leaving"],
  ["slow", deckMotion.slow, "The new slide settling"],
  ["morph", deckMotion.morph, "Shared things travelling"],
  ["zoom", deckMotion.zoom, "Flying into one part"],
] as const;

const curves = [
  ["settle", deckMotion.settle, "Arrivals"],
  ["exit", deckMotion.exit, "Departures"],
  ["travel", deckMotion.travel, "Morph and camera"],
] as const;

/** The easing curve itself, drawn: x is time, y is progress. */
function CurveGlyph({ easing }: { easing: string }) {
  const [x1, y1, x2, y2] = (easing.match(/[\d.]+/g) ?? []).map(Number);
  const s = 120;
  const p = (x: number, y: number) => `${(x * s).toFixed(1)} ${((1 - y) * s).toFixed(1)}`;
  return (
    <svg className="deck-demo-curve" viewBox={`-6 -6 ${s + 12} ${s + 12}`} aria-hidden="true">
      <path className="deck-demo-curve__frame" d={`M${p(0, 0)} L${p(1, 0)} M${p(0, 0)} L${p(0, 1)}`} />
      <path d={`M${p(0, 0)} C${p(x1, y1)} ${p(x2, y2)} ${p(1, 1)}`} />
    </svg>
  );
}

const footer = "UIPACK · Deck player";

/** The playground deck: the player explaining its own transition grammar. */
export const deckExample: DeckSlide[] = [
  {
    id: "cover",
    title: "Motion that means something",
    headline: "When every slide moves, nobody notices the move that matters.",
    role: "cover",
    render: () => (
      <Slide eyebrow="Deck player" footer={footer} layout="center">
        <h2 className="uipack-deck-title deck-demo-cover-title">When every slide moves, nobody notices the move that matters.</h2>
        <p className="uipack-deck-lede">
          A review gets one pass from a busy reader. This deck is the player explaining its own moves, so each one earns its place.
        </p>
        <DeckStrip />
      </Slide>
    ),
    notes: {
      say: "Most internal decks animate everything: every bullet flies in, every slide spins. The room learns quickly that motion means nothing, and then the one change you needed them to see goes past unnoticed. A review gets one pass from a busy reader, so motion has to spend that attention on purpose. This deck is the player explaining its own moves, using only those moves.",
      delivery: "Let the title sit for a beat before advancing.",
      next: "Watch the strip of ten slides at the bottom: it comes forward.",
    },
  },
  {
    id: "moves",
    title: "Nine in ten advance",
    headline: "Nine slides in ten should advance; morph and zoom mark the tenth.",
    role: "answer",
    transition: "morph",
    render: () => (
      <Slide footer={footer} className="deck-demo-moves-slide">
        <h2 className="uipack-deck-heading">Nine slides in ten should advance; morph and zoom mark the tenth.</h2>
        <DeckStrip />
        <ol className="deck-demo-moves">
          {[
            ["Advance", "9 in 10", "The default. The old slide steps aside and the new one settles in, block by block."],
            ["Morph", "1 in 20", "The same thing on both slides travels to its new place, like this strip. Everything else fades."],
            ["Zoom", "1 in 20", "The camera flies into one part, and that part opens into the next slide."],
          ].map(([name, share, text], i) => (
            <Build key={name} as="li" step={i + 1}>
              <b>{share}</b>
              <h3>{name}</h3>
              <p>{text}</p>
            </Build>
          ))}
        </ol>
      </Slide>
    ),
    notes: {
      say: "Here's the whole idea. In a ten-slide talk, nine slides should simply advance; the tenth gets a morph or a zoom, and that rarity is what makes it mean something. Advance is the default: the argument moves on. Morph says this is the same thing, look where it went; the strip you just watched is a morph. Zoom says look inside this part. If you can't say what the audience should watch, the slide should advance.",
      delivery: "Each card is a build: press Next to reveal them one by one.",
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
                <small>{p.eg}</small>
              </Morph>
              {i < parts.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
        <p className="uipack-deck-label deck-demo-hint">Next · inside Checks, the part teams skip</p>
      </Slide>
    ),
    notes: {
      say: "An agent harness has four parts. Context is what the model may see: the ticket, the repository, the user's scope. The model proposes the next action, one step at a time. Tools are the actions it may take, from a shell to a deploy. And checks decide whether an action lands. The first three get the attention; the last one is where incidents come from, so that's the part we'll look inside.",
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
        <div className="deck-demo-checks">
          <p className="uipack-deck-label" aria-hidden="true">
            <span />
            <span>Gate</span>
            <span>Passes when</span>
            <span>Stops</span>
          </p>
          <ol>
            {checks.map(([name, text, stops], i) => (
              <Build key={name} as="li" step={i + 1}>
                <span className="uipack-deck-label">{String(i + 1).padStart(2, "0")}</span>
                <b>{name}</b>
                <span>{text}</span>
                <code>{stops}</code>
              </Build>
            ))}
          </ol>
        </div>
      </Slide>
    ),
    notes: {
      say: "Inside the checks there are three gates, and every action passes all three. Schema: the call matches the tool's contract, so a deploy to an environment that doesn't exist never leaves the harness. Policy: the action is allowed for this user and scope, so a viewer can't delete four thousand rows. Evidence: the result is observed, not assumed; 'tests pass' with no test log is a claim, not a result. Evidence is the one teams skip.",
      delivery: "Read each gate's example aloud. Go back one slide to show the zoom reversing.",
      next: "Here is the same check, drawn as a machine.",
    },
  },
  {
    id: "gate",
    title: "The check as a machine",
    headline: "A check is a gauge every proposal passes under before it lands.",
    role: "mechanism",
    render: ({ step, thumbnail, theme, reducedMotion }) => {
      const at = gateSteps[Math.min(Number.isFinite(step) ? step : 2, 2)];
      return (
        <Slide eyebrow="Mechanism style" footer={footer} layout="split" className="deck-demo-gate">
          <div className="deck-demo-gate__copy">
            <h2 className="uipack-deck-heading">A check is a gauge every proposal passes under.</h2>
            <ol className="deck-demo-gate__beats">
              {["Under the limit: it rides on to the result tray.", "Over the limit: an arm pushes it back for another try.", "Taken apart: every assembly that does the checking."].map(
                (text, i) => {
                  const now = gateSteps[i] === at ? "deck-demo-gate__now" : undefined;
                  return i === 0 ? (
                    <li key={text} className={now}>
                      {text}
                    </li>
                  ) : (
                    <Build key={text} as="li" step={i} className={now}>
                      {text}
                    </Build>
                  );
                },
              )}
            </ol>
          </div>
          <div className="deck-demo-gate__machine" data-view={at.view} data-pose={at.pose}>
            <div className="deck-demo-gate__camera">
              <GateMachine pose={at.pose} theme={theme} motion={reducedMotion ? "none" : "auto"} interactive={!thumbnail} />
            </div>
            <p className="deck-demo-gate__status" aria-live={thumbnail ? undefined : "polite"}>
              {at.status}
            </p>
          </div>
        </Slide>
      );
    },
    notes: {
      say: "Same idea as the last slide, drawn as a machine. A proposal rides under a dial gauge. Under the limit it lands in the result tray. Press once more and we look closer: a taller proposal, over the limit, and an arm swings it into the chute, back to the start, to be revised. One more press takes the machine apart, so you can see the six assemblies that do the checking. Each press changes what the machine shows, which is the only reason to build a slide in steps.",
      delivery: "Press Next twice: first the camera moves in on the return, then the exploded view.",
      next: "Every move in this deck shares one clock.",
    },
  },
  {
    id: "clock",
    title: "One clock",
    headline: "One clock: five durations and three curves time every move.",
    role: "mechanism",
    tone: "ink",
    render: () => (
      <Slide eyebrow="Timing" footer={footer} layout="split" className="deck-demo-timing">
        <div className="deck-demo-timing__copy">
          <h2 className="uipack-deck-heading">One clock: five durations and three curves time every move.</h2>
          <ul className="deck-demo-curves">
            {curves.map(([name, easing, use]) => (
              <li key={name}>
                <CurveGlyph easing={easing} />
                <b>{name}</b>
                <span>{use}</span>
              </li>
            ))}
          </ul>
        </div>
        <table className="deck-demo-durations">
          <caption className="uipack-deck-label">Durations, ms</caption>
          <tbody>
            {durations.map(([name, ms, use]) => (
              <tr key={name} data-current={name === "slow" ? "" : undefined}>
                <th scope="row">{name}</th>
                <td>
                  <span className="deck-demo-durations__bar" style={{ width: `${(ms / deckMotion.zoom) * 100}%` }} />
                  <span className="deck-demo-durations__ms">{ms}</span>
                  <span className="deck-demo-durations__use">{use}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Slide>
    ),
    notes: {
      say: "Every move reads the same five durations and three curves. Quick for builds, base for the slide leaving, slow for the one arriving, and the two long ones for morph and zoom. Arrivals settle, departures accelerate away, and anything that travels eases at both ends. That shared clock is what makes a deck feel designed rather than assembled. It also means nobody on your team picks durations by eye: a new slide part reads the same five numbers, so a deck built by three people still moves like one.",
      delivery: "Point at the highlighted row: 560 ms is the move the audience sees most.",
      next: "Last slide: what to do with this.",
    },
  },
  {
    id: "close",
    title: "Rebuild your next review",
    headline: "Rebuild your next review here and send me its ghost deck by 31 October.",
    role: "ask",
    tone: "accent",
    render: () => (
      <Slide eyebrow="The ask · team leads" footer={footer} layout="center">
        <h2 className="uipack-deck-title deck-demo-cover-title">
          Rebuild your next review here and send me its ghost deck by 31 October.
        </h2>
        <p className="uipack-deck-lede">← → or swipe to move · G for all slides · S for the speaker view · F for full screen</p>
      </Slide>
    ),
    notes: {
      say: "One ask, for the team leads here. Take the next review your team gives, rebuild it in this player, and send me its ghost deck, the titles alone, by the thirty-first of October. Write the point of each slide first, and only then decide how it arrives. Nine slides in ten should just advance; save morph for the thing that changes and zoom for the part worth a closer look. I'll read every ghost deck and send back the three titles I'd rewrite.",
      delivery: "End on the date; leave the keys on screen while you take questions.",
    },
  },
];
