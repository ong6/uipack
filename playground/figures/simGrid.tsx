import "../../src/theme.css";
import { SimGrid, type SimChoice, type SimRun } from "../../src";

// Simulation grid: a thousand writers commit through one of three designs, each a seeded queue
// simulation computed here (the content is the page's; SimGrid plays it). Inspired by the
// "Simulating Git Server Implementations" figure in OpenAI's "Scaling Git at OpenAI" (2026-11):
// many identical agents that finish at different times, live counters, designs on one control.
// Made ours: role colours with a shape per state, the title-block counters, neutral content.

const WRITERS = 1000;
const MAX_BATCH = 64;

/** mulberry32: a small seeded generator, so every run of a design is the same run. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const designs = [
  { id: "lock", label: "One lock" },
  { id: "sharded", label: "Eight shards" },
  { id: "batched", label: "Batched" },
] as const;

export const options = [
  { id: "burst", label: "Burst arrivals" },
  { id: "slow", label: "Slow disk" },
] as const;

/** Each writer arrives (starts), queues for its design's lock and is done when its write lands. */
export function simulateWriters({ design, options }: SimChoice): SimRun {
  const rand = seeded(7);
  const spread = options.burst ? 0.3 : 2;
  const disk = options.slow ? 2.5 : 1;
  const start = new Float64Array(WRITERS);
  const end = new Float64Array(WRITERS);
  const work = new Float64Array(WRITERS);
  for (let i = 0; i < WRITERS; i++) {
    start[i] = rand() * spread;
    work[i] = (0.004 + rand() * 0.004) * disk;
  }
  const order = Array.from({ length: WRITERS }, (_, i) => i).sort((a, b) => start[a] - start[b]);
  if (design === "batched") {
    // One lock, but each turn takes every writer already waiting (up to 64) in one write.
    let free = 0;
    let k = 0;
    while (k < WRITERS) {
      const begin = Math.max(free, start[order[k]]);
      const batch: number[] = [];
      while (k < WRITERS && batch.length < MAX_BATCH && start[order[k]] <= begin) batch.push(order[k++]);
      free = begin + (0.012 + 0.0006 * batch.length) * disk;
      for (const w of batch) end[w] = free;
    }
  } else {
    const lanes = design === "sharded" ? 8 : 1;
    const free = new Float64Array(lanes);
    for (const w of order) {
      const lane = w % lanes;
      // A shard's lock costs a little more to take than the single one.
      const cost = lanes > 1 ? work[w] * 1.4 : work[w];
      free[lane] = Math.max(free[lane], start[w]) + cost;
      end[w] = free[lane];
    }
  }
  return { start, end };
}

const formatTime = (t: number) => (t < 1 ? `${Math.round(t * 1000)} ms` : `${t.toFixed(2)} s`);

export function SimGridFigure({ number }: { number?: string }) {
  return (
    <SimGrid
      number={number}
      eyebrow="Simulation grid"
      title="Batching keeps up where one lock falls behind"
      caption="A thousand writers commit at once. Pick a design and watch when each one's write lands; the counters say how long it took."
      alt="A grid of 1,000 squares, one per writer, that fill in as each writer's commit lands under the chosen design."
      designs={designs}
      options={options}
      simulate={simulateWriters}
      formatTime={formatTime}
      labels={{
        waiting: "Not arrived",
        running: "Waiting on the lock",
        done: "Written",
        mean: "Mean latency",
        count: "Writers done",
      }}
    />
  );
}

/** The docs page's live demo. */
export function SimGridDemo() {
  return <SimGridFigure number="Figure 01" />;
}
