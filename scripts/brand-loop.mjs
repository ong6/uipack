#!/usr/bin/env node
// Generates the header mark's landing loop (playground/showcase.css, "The landing loop") from its
// times: the four @keyframes blocks, whose percentages are all shares of one period. Change a time
// here, run it, and paste the output over the four blocks; then set the period and --brand-start
// in the rule that plays them (it prints both) and the times e2e/brand-mark.spec.ts seeks to.
//
//   node scripts/brand-loop.mjs
//
// Times are in seconds of a cell's own loop (0 = the dot arrives on the cell).
const STATE = 2; // each section state
const HOP = 0.56; // the hop out: the last 560ms of a state (the slow duration role)
const FLIGHT = 0.78; // the share of the hop in the air; the rest is the landing's squash
const TURN = 0.32; // the base duration role: a square redrawing, Check's dot turning to the ink
const STILL = 5.12; // the default logo, still, in the ink: five seconds and the rest of a whole-second period
const ENTER = 0.4; // a page load enters the loop this far into the rest, past the turn to the ink
const REST = TURN + STILL + HOP; // the default logo's slot: 6s
const PERIOD = 4 * STATE + REST; // 14s
const LAND = HOP * (1 - FLIGHT); // the dot coming round lands this long before the loop's end
const CLEAR = [0.344, 0.168]; // the square makes way: its line fades from 344ms to 168ms before the end

const pct = (t) => `${+((t / PERIOD) * 100).toFixed(3)}%`;
const look = (o) =>
  Object.entries(o)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join("\n");
const dot = (hue, extra = {}) => ({
  ...extra,
  fill: hue,
  "fill-opacity": 1,
  rx: "5px",
  stroke: hue,
  "stroke-dasharray": 37,
  "stroke-dashoffset": 0,
  "stroke-opacity": 1,
  translate: "0 0",
});
const square = (offset, opacity, extra = {}) => ({
  ...extra,
  fill: "currentColor",
  "fill-opacity": 0,
  rx: "2px",
  stroke: "currentColor",
  "stroke-dasharray": 37,
  "stroke-dashoffset": offset,
  "stroke-opacity": opacity,
  translate: "0 0",
});
const NEXT = "calc(var(--brand-next-x) * var(--brand-pitch)) calc(var(--brand-next-y) * var(--brand-pitch))";
const frame = (stops, body, comment) => `${comment ? `  /* ${comment} */\n` : ""}  ${stops.join(",\n  ")} {\n${look(body)}\n  }`;

/** A cell's look and travel: the dot rests from 0, hops out at `out`, and the cell is a square after. */
function turn(name, out, before = []) {
  const land = out + HOP * FLIGHT;
  const end = out + HOP;
  return `@keyframes ${name} {\n${[
    ...before,
    frame(
      [pct(out)],
      dot(out === STATE - HOP ? "var(--brand-hue)" : "currentColor", {
        "animation-timing-function": "var(--ui-ease-travel, ease-in-out)",
      }),
    ),
    frame([pct(land), pct(end)], { ...dot("var(--brand-next-hue)"), translate: NEXT }),
    frame([pct(end + 0.001)], square(37, 1, { "animation-timing-function": "var(--ui-ease-settle, ease-out)" })),
    frame([pct(end + TURN), pct(PERIOD - CLEAR[0])], square(0, 1)),
    frame(
      [pct(PERIOD - CLEAR[1]), "99.99%"],
      square(0, 0),
      `It makes way for the dot coming round, which lands ${Math.round(LAND * 1000)}ms before the loop's end.`,
    ),
    frame(["100%"], dot("var(--brand-hue)")),
  ].join("\n")}\n}`;
}

/** A cell's lift: the hop's arc and the landing's squash, on the dot leaving at `out`. */
function lift(name, out) {
  const land = out + HOP * FLIGHT;
  const settle = "var(--ui-ease-settle, ease-out)";
  return `@keyframes ${name} {\n${[
    frame(["0%", pct(out)], { "animation-timing-function": settle, transform: "none" }),
    frame([pct(out + (HOP * FLIGHT) / 2)], {
      "animation-timing-function": "ease-in",
      transform: "translateY(-5px) scale(0.97, 1.04)",
    }),
    frame([pct(land)], { "animation-timing-function": settle, transform: "none" }),
    frame([pct(land + 0.0505)], { "animation-timing-function": settle, transform: "scale(1.08, 0.9)" }),
    frame([pct(out + HOP), "100%"], { transform: "none" }),
  ].join("\n")}\n}`;
}

const homeOut = STATE + TURN + STILL;
console.log(
  [
    turn("showcase-brand-turn", STATE - HOP, [frame(["0%"], dot("var(--brand-hue)"))]),
    // The bottom right cell: Check's state, then the turn to the ink and the still default logo.
    turn("showcase-brand-turn-home", homeOut, [
      frame(["0%", pct(STATE)], dot("var(--brand-hue)")),
      frame([pct(STATE + TURN)], dot("currentColor")),
    ]),
    lift("showcase-brand-turn-lift", STATE - HOP),
    lift("showcase-brand-turn-home-lift", homeOut),
  ].join("\n"),
);
console.error(
  `period ${PERIOD}s; rest ${REST}s (turn ${TURN}s, still ${STILL}s, hop ${HOP}s); --brand-start: calc(${+(REST - ENTER).toFixed(2)}s + var(--brand-turn) * ${STATE}s); ` +
    `first hop ${+(REST - ENTER - HOP).toFixed(2)}s after a load`,
);
