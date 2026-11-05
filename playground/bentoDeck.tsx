import { Bento, BentoCell, Slide, endSlide, factSlide, sectionSlide, type DeckSlide } from "../src/deck";

const footer = "Search platform · Q3 review · Illustrative";

/** Cue lines for the speaker: one thought each, said in their own words. */
const cues = (...lines: string[]) => lines.join("\n");

const List = ({ rows }: { rows: [string, string][] }) => (
  <ul className="uipack-deck-bento-list">
    {rows.map(([a, b]) => (
      <li key={a}>
        <span>{a}</span>
        <span>{b}</span>
      </li>
    ))}
  </ul>
);

/** Q2 against Q3 as two bars on one scale, so the latency box shows the change. The numbers are
 * said once, in the value and the note under it, so the bars carry only their quarter. */
const BeforeAfter = () => (
  <dl className="deck-bento-ba" aria-label="p95 latency: Q2 412 ms, Q3 198 ms">
    {[
      ["Q2", 412],
      ["Q3", 198],
    ].map(([label, ms]) => (
      <div key={label} data-now={label === "Q3" ? "" : undefined}>
        <dt>{label}</dt>
        <dd>
          <span style={{ width: `${(Number(ms) / 412) * 100}%` }} />
        </dd>
      </div>
    ))}
  </dl>
);

/** The quarter's six launches on its calendar (1 July to 30 September), one mark each on the day it reached all traffic. */
const launches: [string, number][] = [
  ["18 July", 18],
  ["2 August", 33],
  ["21 August", 52],
  ["4 September", 66],
  ["16 September", 78],
  ["29 September", 91],
];
const ShippedStrip = () => (
  <div className="deck-bento-strip" role="img" aria-label={`Reached all traffic on ${launches.map(([d]) => d).join(", ")}.`}>
    <span className="deck-bento-strip__line">
      {launches.map(([d, day]) => (
        <i key={d} style={{ left: `${(day / 92) * 100}%` }} />
      ))}
    </span>
    <span className="deck-bento-strip__months" aria-hidden="true">
      <span>Jul</span>
      <span>Aug</span>
      <span>Sep</span>
    </span>
  </div>
);

/** Cache memory now against the limit, on one bar: the risk box's evidence at overview scale. */
const MemoryGauge = () => (
  <div className="deck-bento-gauge" role="img" aria-label="Cache memory is at 71% of the tier; the limit is 90%.">
    <span className="deck-bento-gauge__track">
      <i style={{ width: "71%" }} />
      <b style={{ left: "90%" }} />
    </span>
    <span className="deck-bento-gauge__scale" aria-hidden="true">
      <span>71% now</span>
      <span style={{ left: "90%" }}>90% limit</span>
    </span>
  </div>
);

/** Where the saving came from, as bars on one scale: the detail behind the latency box. */
const savings: [string, string, number][] = [
  ["Retrieval", "Cache in front of the index", 140],
  ["Ranking", "Smaller model on the long tail", 58],
  ["Render", "Streamed first results", 16],
  ["Query parse", "Unchanged", 0],
];
const SavingBars = () => (
  <ul className="deck-bento-bars">
    {savings.map(([part, how, ms]) => (
      <li key={part}>
        <span>
          <b>{part}</b> {how}
        </span>
        <span className="deck-bento-bars__track">
          <i style={{ width: `${(ms / 214) * 100}%` }} />
        </span>
        <span className="deck-bento-bars__value">{ms ? `−${ms} ms` : "0 ms"}</span>
      </li>
    ))}
  </ul>
);

/**
 * Cache memory, % of the tier, weekly. Measured from 11 Aug to 13 Oct (about three points a week),
 * then the same trend to 17 Nov, plus about four points when peak traffic starts on 23 Nov. The
 * notes, the risk slide and the tripwire all read these numbers.
 */
const memory = [44, 47, 49, 53, 56, 58, 62, 65, 68, 71];
const forecast = [71, 74, 77, 80, 83, 86, 93];
/** Forecast index of 10 Nov: the tripwire's deadline. Memory is forecast at 83% then. */
const TRIPWIRE_WEEK = memory.length - 1 + 4;
const MemoryForecast = () => {
  const w = 300;
  const h = 190;
  const n = memory.length + forecast.length - 1;
  const x = (i: number) => (i / (n - 1)) * w;
  const y = (v: number) => h - ((v - 40) / 60) * h;
  const line = (vals: number[], from: number) =>
    vals.map((v, i) => `${i ? "L" : "M"}${x(from + i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const now = memory.length - 1;
  return (
    <svg
      className="deck-bento-forecast"
      viewBox={`-4 -14 ${w + 64} ${h + 32}`}
      role="img"
      aria-label="Cache memory rose about three points a week, from 44% on 11 August to 71% on 13 October. On that trend it reaches 83% by 10 November and 86% by 17 November; peak traffic from 23 November takes it to about 93%, past the 90% limit. The tripwire is 85% before 10 November."
    >
      <line className="deck-bento-forecast__limit" x1={0} x2={w} y1={y(90)} y2={y(90)} />
      <text x={0} y={y(90) - 6}>
        90% limit
      </text>
      <line className="deck-bento-forecast__tripwire" x1={0} x2={x(TRIPWIRE_WEEK)} y1={y(85)} y2={y(85)} />
      <text x={0} y={y(85) + 15}>
        85% tripwire, until 10 Nov
      </text>
      <path className="deck-bento-forecast__measured" d={line(memory, 0)} />
      <path className="deck-bento-forecast__projected" d={line(forecast, now)} />
      <circle cx={x(now)} cy={y(71)} r={4} />
      <text x={x(now) + 8} y={y(71) + 16}>
        71% on 13 Oct
      </text>
      <circle className="deck-bento-forecast__peak" cx={x(n - 1)} cy={y(93)} r={4} />
      <text x={x(n - 1) + 8} y={y(93) + 4}>
        93%
      </text>
      <text x={0} y={h + 16}>
        11 Aug
      </text>
      <text x={w} y={h + 16} textAnchor="end">
        Peak, 24 Nov
      </text>
    </svg>
  );
};

/**
 * A quarterly review for a speaker who talks freely: the answer, the quarter on one bento slide, the
 * risk inside it, the plan and the ask. Short titles in mixed forms, numbers in fragments and on the
 * evidence, cue notes.
 */
export const bentoDeck: DeckSlide[] = [
  {
    id: "answer",
    title: "Twice as fast",
    headline: "Search: twice as fast, and cheaper",
    role: "answer",
    points: ["p95: 412 ms → 198 ms", "Cost per query −18%", "Searches ending in a click: 61% → 64%"],
    render: () => (
      <Slide footer={footer} layout="center">
        <h2 className="uipack-deck-title deck-bento-cover-title">Search: twice as fast, and cheaper</h2>
        <ul className="uipack-deck-points deck-bento-cover-points">
          <li>p95: 412 ms → 198 ms</li>
          <li>Cost per query −18%</li>
          <li>Searches ending in a click: 61% → 64%</li>
        </ul>
      </Slide>
    ),
    notes: {
      say: cues(
        "Twice as fast as Q2, and cheaper to serve.",
        "Clicks: more people found what they came for.",
        "Then: the evidence, one risk, one decision by 30 October.",
        "Source: the search latency, cost and click-through dashboards, Q2 against Q3.",
      ),
      delivery: "Speed and cost first, then the clicks. Don't explain yet.",
      next: "Where the speed came from",
    },
  },
  {
    id: "quarter",
    title: "Caching did most of it",
    headline: "Where the 214 ms went",
    role: "evidence",
    render: () => (
      <Slide footer={footer}>
        <h2 className="uipack-deck-heading">Where the 214{"\u00a0"}ms went</h2>
        <Bento columns={6} rows={4} tour={["latency", "shipped"]}>
          <BentoCell
            id="latency"
            col={3}
            row={2}
            tone="accent"
            detail={
              <>
                <p className="uipack-deck-bento-detail-title">Where the 214 ms went</p>
                <SavingBars />
                <p className="uipack-deck-bento-small deck-bento-source">
                  Q2 412 ms → Q3 198 ms. p95 over 7 days, all regions; search latency dashboard.
                </p>
              </>
            }
          >
            <p className="uipack-deck-bento-label">p95 latency</p>
            <BeforeAfter />
            <p className="uipack-deck-bento-value">
              198<small>ms</small>
            </p>
            <p className="uipack-deck-bento-note">
              down from 412 ms in Q2 · <b>−140 ms from caching</b>
            </p>
          </BentoCell>
          <BentoCell id="cost" col={3}>
            <p className="uipack-deck-bento-label">Cost per 1k queries</p>
            <p className="uipack-deck-bento-value" style={{ fontSize: 72 }}>
              $0.41<small>Q2 $0.50 · −18%</small>
            </p>
          </BentoCell>
          <BentoCell id="errors" col={3}>
            <p className="uipack-deck-bento-label">Error rate</p>
            <p className="uipack-deck-bento-value" style={{ fontSize: 72 }}>
              0.08%<small>Q2 0.09% · SLO 0.10%</small>
            </p>
          </BentoCell>
          <BentoCell
            id="shipped"
            col={2}
            row={2}
            detail={
              <>
                <p className="uipack-deck-bento-detail-title">Reached 100% of traffic</p>
                <List
                  rows={[
                    ["Index cache tier", "Jul 18"],
                    ["Long-tail ranker", "Aug 02"],
                    ["Streamed results", "Aug 21"],
                    ["Query rewrite v2", "Sep 04"],
                    ["Regional failover", "Sep 16"],
                    ["Cost dashboards", "Sep 29"],
                  ]}
                />
                <p className="uipack-deck-bento-small deck-bento-source">Each behind a flag; none rolled back.</p>
              </>
            }
          >
            <p className="uipack-deck-bento-label">Shipped</p>
            <p className="uipack-deck-bento-title">6 changes reached all traffic</p>
            <p className="uipack-deck-bento-note">No rollbacks</p>
            <ShippedStrip />
          </BentoCell>
          <BentoCell id="risk" col={2} row={2}>
            <p className="uipack-deck-bento-label">Risk</p>
            <p className="uipack-deck-bento-title">The cache fills up at the November peak</p>
            <p className="uipack-deck-bento-note">+3 points a week</p>
            <MemoryGauge />
          </BentoCell>
          <BentoCell id="next" col={2} row={2} tone="ink">
            <p className="uipack-deck-bento-label">Next quarter</p>
            <p className="uipack-deck-bento-title">Hold latency, cost −10%</p>
            <p className="uipack-deck-bento-value deck-bento-next">
              $0.37<small>per 1k queries by Jan</small>
            </p>
          </BentoCell>
        </Bento>
      </Slide>
    ),
    notes: {
      say: cues(
        "The whole quarter on one page.",
        "Cache 140 ms, ranker 58, streaming 16.",
        "Six changes, none rolled back.",
        "41 cents per 1k queries. Errors under the SLO.",
        "Source: search latency dashboard, p95 over 7 days, all regions.",
      ),
      delivery: "Next moves the camera: latency, then what shipped. The third press pulls back.",
      stops: {
        latency: cues(
          "Cache in front of the index: 140 of the 214 ms.",
          "Smaller long-tail ranker: 58. Streamed results: 16.",
          "Source: search latency dashboard, p95 over 7 days, all regions.",
        ),
        shipped: cues("Six changes reached all traffic.", "Each behind a flag. None rolled back."),
      },
      next: "The risk box: the cache is filling up",
    },
  },
  {
    id: "risk",
    title: "The cache fills before the peak",
    headline: "Will the cache hold in November?",
    role: "risk",
    // The risk box on the quarter slide opens into this one: same thing, closer.
    transition: { zoom: "risk" },
    render: () => (
      <Slide footer={footer} className="deck-bento-risk">
        <h2 className="uipack-deck-heading">Will the cache hold in November?</h2>
        <div className="deck-bento-risk__body">
          <dl className="deck-bento-risk__terms">
            <div>
              <dt>Impact</dt>
              <dd>Over 90%: evictions undo most of the 140 ms</dd>
            </div>
            <div>
              <dt>Mitigation</dt>
              <dd>Shard it: 2 engineers, 3 weeks, done 20 Nov</dd>
            </div>
            <div>
              <dt>Tripwire</dt>
              <dd>Over 85% before 10 Nov: cap long-tail caching</dd>
            </div>
          </dl>
          <MemoryForecast />
        </div>
      </Slide>
    ),
    notes: {
      say: cues(
        "No, not without a shard.",
        "71% today, about 3 points a week. 86% by 17 November.",
        "Peak from 23 November adds about 4: past 90%.",
        "Shard approved by 30 October lands 20 November.",
        "Source: the cache capacity forecast, search dashboard.",
      ),
      delivery: "Point at the dashed line crossing the limit, then the tripwire.",
      next: "The speed as one number",
    },
  },
  // The fact archetype: one number, its unit and its baseline, from across the room.
  factSlide({
    id: "latency",
    title: "198 ms at p95",
    headline: "The slowest search in 20",
    value: "198",
    unit: "ms p95",
    baseline: "Q2: 412 ms, same query mix",
    source: "Search latency dashboard, Q2 against Q3",
    footer,
    role: "evidence",
    notes: {
      say: cues(
        "p95: the slowest search in twenty. What people waiting actually feel.",
        "412 ms in Q2, 198 now, same queries.",
        "Source: the search latency dashboard, Q2 against Q3.",
      ),
      delivery: "Say the two numbers, then stop.",
      next: "Next quarter",
    },
  }),
  // The section archetype: a divider that still makes a claim; the part number fills the body.
  sectionSlide({
    id: "next",
    title: "Next quarter",
    number: "02",
    headline: "Next quarter",
    footer,
    role: "context",
    notes: {
      say: cues("Two jobs: hold the speed through the peak, keep cutting cost.", "The shard leads: it has the deadline."),
      delivery: "Pause on the part number. A breath, not a slide to read.",
      next: "The plan",
    },
  }),
  {
    id: "plan",
    title: "By January",
    headline: "Cost −10% by January",
    role: "plan",
    invert: true,
    render: () => (
      <Slide footer={footer}>
        <h2 className="uipack-deck-heading">Cost −10% by January</h2>
        <ol className="deck-bento-plan">
          {[
            ["Shard the cache", "Smaller nodes, the gain holds through the peak", "−1%", "20 Nov"],
            ["Batch the ranker", "Fewer, larger calls on GPUs we already pay for", "−3%", "Dec"],
            ["Retire the old index", "One fewer cluster to run", "−6%", "Jan"],
          ].map(([name, text, share, when], i) => (
            <li key={name}>
              <span className="uipack-deck-label">{String(i + 1).padStart(2, "0")}</span>
              <b>{name}</b>
              <span>{text}</span>
              <span className="deck-bento-plan__share">{share}</span>
              <span className="uipack-deck-label">{when}</span>
            </li>
          ))}
          <li className="deck-bento-plan__total">
            <span />
            <b>Together</b>
            <span>Cost per 1k queries: $0.41 → about $0.37</span>
            <span className="deck-bento-plan__share">−10%</span>
            <span className="uipack-deck-label">Jan</span>
          </li>
        </ol>
      </Slide>
    ),
    notes: {
      say: cues(
        "Shard first: done 20 November, three days before the peak.",
        "Ranker batching in December, old index out in January.",
        "1 + 3 + 6 points: 41 cents to about 37. Latency holds.",
        "Source: the search cost model, Q4 plan.",
      ),
      delivery: "Spend most of the time on the first item.",
      next: "The shard's one decision",
    },
  },
  // The end archetype: the ask as a claim, then its decision, owner and date in a row.
  endSlide({
    id: "ask",
    title: "Approve the shard by 30 October",
    headline: "Approve the shard by 30 October",
    action: "Two engineers for three weeks on the cache shard",
    owner: "Platform leads",
    date: "30 October",
    footer,
    role: "ask",
    tone: "accent",
    notes: {
      say: cues(
        "Platform leads: two engineers, three weeks.",
        "Approved by 30 October: starts 2 November, lands 20 November.",
        "Over 85% first? We cap long-tail caching. The date holds.",
      ),
      delivery: "Stop after the ask. Wait for an answer.",
    },
  }),
];
