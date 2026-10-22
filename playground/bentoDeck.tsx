import { Bento, BentoCell, Slide, type DeckSlide } from "../src/deck";

const footer = "Search platform · Q3 review · Illustrative";

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

/** Q2 against Q3 as two bars on one scale, so the latency box shows the change, not just the number. */
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
          <b>{ms} ms</b>
        </dd>
      </div>
    ))}
  </dl>
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

/** Cache memory by week: measured through early October, forecast to the November peak. */
const memory = [52, 55, 58, 61, 64, 67, 69, 71];
const forecast = [71, 76, 82, 88, 93];
const MemoryForecast = ({ compact = false }: { compact?: boolean }) => {
  const w = 300;
  const h = compact ? 70 : 120;
  const n = memory.length + forecast.length - 1;
  const x = (i: number) => (i / (n - 1)) * w;
  const y = (v: number) => h - ((v - 40) / 60) * h;
  const line = (vals: number[], from: number) => vals.map((v, i) => `${i ? "L" : "M"}${x(from + i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className="deck-bento-forecast" viewBox={`-4 -8 ${w + 70} ${h + 26}`} role="img" aria-label="Cache memory rises from 52% in July to 71% now, and is forecast to pass 90% at the late-November peak">
      <line className="deck-bento-forecast__limit" x1={0} x2={w} y1={y(90)} y2={y(90)} />
      <text x={w + 6} y={y(90) + 4}>90% limit</text>
      <path className="deck-bento-forecast__measured" d={line(memory, 0)} />
      <path className="deck-bento-forecast__projected" d={line(forecast, memory.length - 1)} />
      <circle cx={x(memory.length - 1)} cy={y(71)} r={4} />
      <text x={x(memory.length - 1) - 4} y={y(71) + 20} textAnchor="end">71% now</text>
      <text x={0} y={h + 16}>Jul</text>
      <text x={x(memory.length - 1)} y={h + 16} textAnchor="middle">Oct</text>
      <text x={w} y={h + 16} textAnchor="end">Peak</text>
    </svg>
  );
};

/** A quarterly review: the answer, the quarter on one bento slide, the plan, the risk and the ask. */
export const bentoDeck: DeckSlide[] = [
  {
    id: "answer",
    title: "Twice as fast",
    headline: "Search got twice as fast this quarter, and cheaper to run.",
    role: "answer",
    render: () => (
      <Slide eyebrow="Q3 review · Illustrative" footer={footer} layout="center">
        <h2 className="uipack-deck-title">Search got twice as fast this quarter, and cheaper to run.</h2>
        <p className="uipack-deck-lede">p95 latency fell from 412 ms to 198 ms while cost per query dropped 18%.</p>
      </Slide>
    ),
    notes: {
      say: "The headline first: search is twice as fast as it was in Q2, and it costs less to serve. Everything after this slide is the evidence and what we need next. Source: the search latency and cost dashboards, Q2 against Q3.",
      delivery: "State both numbers slowly. Don't explain yet.",
      next: "Here's where the speed came from.",
    },
  },
  {
    id: "quarter",
    title: "Caching did most of it",
    headline: "Caching did most of it: 140 of 214 ms saved, six launches, no rollbacks.",
    role: "evidence",
    render: () => (
      <Slide footer={footer}>
        <h2 className="uipack-deck-heading">Caching did most of it: 140 of 214{"\u00a0"}ms saved, six launches, no rollbacks.</h2>
        <Bento columns={6} rows={4} tour={["latency", "shipped", "risk"]}>
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
            <p className="uipack-deck-bento-note">down from 412 ms in Q2</p>
          </BentoCell>
          <BentoCell id="cost" col={3}>
            <p className="uipack-deck-bento-label">Cost per 1k queries</p>
            <p className="uipack-deck-bento-value" style={{ fontSize: 72 }}>
              $0.41<small>−18%</small>
            </p>
          </BentoCell>
          <BentoCell id="errors" col={3}>
            <p className="uipack-deck-bento-label">Error rate</p>
            <p className="uipack-deck-bento-value" style={{ fontSize: 72 }}>
              0.08%<small>SLO 0.10%</small>
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
          </BentoCell>
          <BentoCell
            id="risk"
            col={2}
            row={2}
            detail={
              <>
                <p className="uipack-deck-bento-detail-title">Cache memory, % of the tier</p>
                <MemoryForecast compact />
                <List
                  rows={[
                    ["Impact", "Evictions above 90%"],
                    ["Fix", "Shard by 17 Nov"],
                    ["Tripwire", "80% before then"],
                  ]}
                />
              </>
            }
          >
            <p className="uipack-deck-bento-label">Risk</p>
            <p className="uipack-deck-bento-title">The cache fills up at the November peak</p>
          </BentoCell>
          <BentoCell id="next" col={2} row={2} tone="ink">
            <p className="uipack-deck-bento-label">Next quarter</p>
            <p className="uipack-deck-bento-title">Hold latency. Cut cost another 10%.</p>
          </BentoCell>
        </Bento>
      </Slide>
    ),
    notes: {
      say: "This is the whole quarter on one page. The cache in front of the index saved 140 of the 214 milliseconds; ranking and streaming did the rest. Six changes reached all traffic and none rolled back. Underneath: the one risk and the plan. Source: search latency dashboard, p95 over seven days, all regions.",
      delivery: "Press Next to move the camera: latency, then what shipped, then the risk. The last press pulls back.",
      next: "The plan for next quarter is the box in the corner.",
    },
  },
  {
    id: "plan",
    title: "Next quarter",
    headline: "Next quarter we hold latency and cut cost another 10%.",
    role: "plan",
    transition: { zoom: "next" },
    tone: "ink",
    render: () => (
      <Slide eyebrow="Next quarter" footer={footer}>
        <h2 className="uipack-deck-heading">Hold latency. Cut cost another 10%.</h2>
        <ol className="deck-bento-plan">
          {[
            ["Shard the cache", "So the retrieval gain holds through the peak.", "17 Nov"],
            ["Batch the ranker", "Fewer, larger calls on GPUs we already pay for.", "Dec"],
            ["Retire the old index", "One fewer cluster to run: about 6% of cost.", "Jan"],
          ].map(([name, text, when], i) => (
            <li key={name}>
              <span className="uipack-deck-label">{String(i + 1).padStart(2, "0")}</span>
              <b>{name}</b>
              <span>{text}</span>
              <span className="uipack-deck-label">{when}</span>
            </li>
          ))}
        </ol>
      </Slide>
    ),
    notes: {
      say: "Three things next quarter. The cache shard is the urgent one, because of the November peak. Batching the ranker and retiring the old index take cost down another ten percent.",
      delivery: "Spend most of the time on the first item.",
      next: "Here's why the shard can't wait.",
    },
  },
  {
    id: "risk",
    title: "The cache fills before the peak",
    headline: "Without a shard, the cache passes 90% memory at the November peak.",
    role: "risk",
    render: () => (
      <Slide eyebrow="Risk" footer={footer} className="deck-bento-risk">
        <h2 className="uipack-deck-heading">Without a shard, the cache passes 90% memory at the November peak.</h2>
        <div className="deck-bento-risk__body">
          <dl className="deck-bento-risk__terms">
            <div>
              <dt>Impact</dt>
              <dd>Above 90%, evictions undo most of the 140 ms retrieval gain.</dd>
            </div>
            <div>
              <dt>Mitigation</dt>
              <dd>Two engineers shard the tier in four weeks, done by 17 November.</dd>
            </div>
            <div>
              <dt>Tripwire</dt>
              <dd>If memory passes 80% first, we cap long-tail caching.</dd>
            </div>
          </dl>
          <MemoryForecast />
        </div>
      </Slide>
    ),
    notes: {
      say: "The cache tier is at seventy-one percent memory and climbing about three points a week. Peak traffic starts on the twenty-third of November, which takes it past ninety percent, where evictions undo most of the gain. A shard takes two engineers four weeks. Source: the cache capacity forecast from the search dashboard.",
      delivery: "Point at the dashed line crossing the limit.",
      next: "Which is why there's one ask, and it's dated.",
    },
  },
  {
    id: "ask",
    title: "The ask",
    headline: "Platform leads: approve two engineers for the cache shard by 20 October.",
    role: "ask",
    tone: "accent",
    render: () => (
      <Slide eyebrow="Decision needed · Platform leads" footer={footer} layout="center">
        <h2 className="uipack-deck-title">Approve two engineers for the cache shard by 20 October.</h2>
        <p className="uipack-deck-lede">Four weeks of work lands the shard by 17 November, a week before the peak.</p>
      </Slide>
    ),
    notes: {
      say: "One decision for the Platform leads: two engineers for four weeks, approved by the twentieth of October, so the shard lands by the seventeenth of November, a week before peak traffic.",
      delivery: "Stop talking after the ask. Wait for an answer.",
    },
  },
];
