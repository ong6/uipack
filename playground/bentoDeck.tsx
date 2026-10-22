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

/** A quarterly review on one bento slide: overview first, then the camera visits three boxes. */
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
      say: "The headline first: search is twice as fast as it was in Q2, and it costs less to serve. Everything after this slide is the evidence and what we need next.",
      delivery: "State both numbers slowly. Don't explain yet.",
      next: "Here's the quarter on one page.",
    },
  },
  {
    id: "quarter",
    title: "The quarter on one page",
    headline: "Four numbers and two lists tell the whole quarter.",
    role: "evidence",
    render: () => (
      <Slide footer={footer}>
        <h2 className="uipack-deck-heading">Four numbers and two lists tell the whole quarter.</h2>
        <Bento columns={6} rows={4} tour={["latency", "shipped", "risk"]}>
          <BentoCell
            id="latency"
            col={3}
            row={2}
            detail={
              <>
                <p className="uipack-deck-bento-detail-title">Where the 214 ms went</p>
                <List
                  rows={[
                    ["Retrieval: cache in front of the index", "−140 ms"],
                    ["Ranking: smaller model on the long tail", "−58 ms"],
                    ["Render: streamed first results", "−16 ms"],
                    ["Query parse", "0 ms"],
                  ]}
                />
                <p className="uipack-deck-bento-small" style={{ marginTop: "auto" }}>
                  p95 over 7 days, all regions. Q2 412 ms → Q3 198 ms.
                </p>
              </>
            }
          >
            <p className="uipack-deck-bento-label">p95 latency</p>
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
          <BentoCell id="errors" col={3} tone="accent">
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
                <p className="uipack-deck-bento-detail-title">Cache tier at 71% memory</p>
                <p className="uipack-deck-bento-small">
                  Peak traffic in November would push it past 90%. Above that, evictions undo most of the retrieval
                  gain. Two engineers for four weeks shard it before the peak.
                </p>
              </>
            }
          >
            <p className="uipack-deck-bento-label">Risk</p>
            <p className="uipack-deck-bento-title">The cache fills up in November</p>
          </BentoCell>
          <BentoCell id="next" col={2} row={2} tone="ink">
            <p className="uipack-deck-bento-label">Next quarter</p>
            <p className="uipack-deck-bento-title">Hold latency. Cut cost another 10%.</p>
          </BentoCell>
        </Bento>
      </Slide>
    ),
    notes: {
      say: "This is the whole quarter on one page. Latency, cost and errors across the top; what shipped, the one risk and the plan underneath. Let me walk three of these.",
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
        <ol className="deck-demo-checks">
          {[
            ["Shard the cache", "Before the November peak, so the retrieval gain holds."],
            ["Batch the ranker", "Fewer, larger calls on GPUs we already pay for."],
            ["Retire the old index", "One fewer cluster to run."],
          ].map(([name, text], i) => (
            <li key={name}>
              <span className="uipack-deck-label">{String(i + 1).padStart(2, "0")}</span>
              <b>{name}</b>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </Slide>
    ),
    notes: {
      say: "Three things next quarter. The cache shard is the urgent one because of the November peak. The other two take cost down another ten percent.",
      delivery: "Spend most of the time on the first item.",
      next: "Which is why there's one ask.",
    },
  },
  {
    id: "ask",
    title: "The ask",
    headline: "Platform leads: approve two engineers for the cache shard by 15 November.",
    role: "ask",
    tone: "accent",
    render: () => (
      <Slide eyebrow="Decision needed" footer={footer} layout="center">
        <h2 className="uipack-deck-title">Approve two engineers for the cache shard by 15 November.</h2>
        <p className="uipack-deck-lede">Platform leads. Four weeks of work keeps search twice as fast through the peak.</p>
      </Slide>
    ),
    notes: {
      say: "One decision: two engineers for four weeks, approved by the fifteenth of November, so the shard lands before peak traffic.",
      delivery: "Stop talking after the ask. Wait for an answer.",
    },
  },
];
