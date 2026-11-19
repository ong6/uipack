// SimGrid's truth: a run the caller simulated (when each cell starts and finishes), prepared once so
// any simulated time t reads in O(log n), and the grid geometry drawn as one SVG path per state.
// Pure: no React, no DOM. The component (SimGrid.tsx) owns playback; this owns what t looks like.

/**
 * One simulated run: for each cell (a writer, a job, an agent), the simulated time it starts work
 * and the time it is done, in the caller's unit (seconds unless `formatTime` says otherwise). The
 * caller computes it, seeded and deterministic, so the content is the site's and the playback is
 * uipack's. `start` omitted: every cell starts at 0.
 */
export interface SimRun {
  readonly start?: ArrayLike<number>;
  readonly end: ArrayLike<number>;
}

/** What the reader picked: a design's id and each option's checked state. */
export interface SimChoice {
  readonly design: string;
  readonly options: Readonly<Record<string, boolean>>;
}

/** The three states a cell passes through, in order. */
export type SimState = "waiting" | "running" | "done";
export const SIM_STATES: readonly SimState[] = ["waiting", "running", "done"];

/** A run prepared for reading at any t. */
export interface PreparedRun {
  readonly count: number;
  readonly start: Float64Array;
  readonly end: Float64Array;
  /** Every start, ascending. */
  readonly starts: Float64Array;
  /** Every end, ascending. */
  readonly ends: Float64Array;
  /** prefix[k] = the sum of (end - start) over the k cells that finish first. */
  readonly prefix: Float64Array;
  /** When the last cell is done: the run's length. */
  readonly finish: number;
  /** The longest single cell (end - start): the widest the mean can read. */
  readonly longest: number;
}

/** Checks a run and prepares it. Throws on a length mismatch or a time that is not a finite number. */
export function prepareRun(run: SimRun): PreparedRun {
  const n = run.end.length;
  if (run.start && run.start.length !== n)
    throw new Error(`SimGrid: run.start has ${run.start.length} cells and run.end has ${n}; give one time per cell in both.`);
  const start = new Float64Array(n);
  const end = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const s = run.start ? Number(run.start[i]) : 0;
    const e = Number(run.end[i]);
    if (!Number.isFinite(s) || !Number.isFinite(e)) throw new Error(`SimGrid: cell ${i} has a time that is not a finite number.`);
    start[i] = Math.max(0, s);
    // A cell is never done before it starts.
    end[i] = Math.max(start[i], e);
  }
  const starts = Float64Array.from(start).sort();
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => end[a] - end[b]);
  const ends = new Float64Array(n);
  const prefix = new Float64Array(n + 1);
  let longest = 0;
  order.forEach((cell, k) => {
    ends[k] = end[cell];
    const d = end[cell] - start[cell];
    prefix[k + 1] = prefix[k] + d;
    if (d > longest) longest = d;
  });
  return { count: n, start, end, starts, ends, prefix, finish: n ? ends[n - 1] : 0, longest };
}

/** How many values in an ascending array are at or below t. */
export function countAtOrBelow(sorted: Float64Array, t: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** The counters at simulated time t. */
export interface SimSnapshot {
  readonly t: number;
  /** Cells that have started (running or done). */
  readonly started: number;
  readonly done: number;
  /** Mean of (end - start) over the cells done by t; null before the first is done. */
  readonly mean: number | null;
}

export function simAt(run: PreparedRun, t: number): SimSnapshot {
  const done = countAtOrBelow(run.ends, t);
  const started = countAtOrBelow(run.starts, t);
  return { t, started, done, mean: done ? run.prefix[done] / done : null };
}

/** The state of one cell at t. */
export function cellState(run: PreparedRun, cell: number, t: number): SimState {
  if (run.end[cell] <= t) return "done";
  return run.start[cell] <= t ? "running" : "waiting";
}

/** Grid pitch in user units: an 8-unit square and a 2-unit gap. */
export const CELL = 8;
export const PITCH = 10;

/**
 * Columns for n cells: about 5:2 in a wide frame, about 2:3 below 720px, so a thousand cells are 50
 * by 20 on a desktop and 25 by 40 on a phone.
 */
export function gridColumns(n: number, narrow: boolean): number {
  if (n <= 0) return 1;
  return Math.max(1, Math.min(n, Math.ceil(Math.sqrt(n * (narrow ? 0.625 : 2.5)))));
}

export function gridViewBox(n: number, columns: number): string {
  const rows = Math.max(1, Math.ceil(n / columns));
  return `0 0 ${columns * PITCH - (PITCH - CELL)} ${rows * PITCH - (PITCH - CELL)}`;
}

/**
 * Each state's mark for every cell, as path fragments, built once per grid shape. Shape carries the
 * state as well as colour: waiting is a hollow outline, running a small solid square, done the full
 * solid square.
 */
export interface CellMarks {
  readonly columns: number;
  readonly waiting: readonly string[];
  readonly running: readonly string[];
  readonly done: readonly string[];
}

export function cellMarks(n: number, columns: number): CellMarks {
  const waiting: string[] = new Array(n);
  const running: string[] = new Array(n);
  const done: string[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i % columns) * PITCH;
    const y = Math.floor(i / columns) * PITCH;
    // An outline drawn with a 1-unit stroke on the half unit, so it sits inside the 8-unit square.
    waiting[i] = `M${x + 0.5} ${y + 0.5}h7v7h-7z`;
    running[i] = `M${x + 2} ${y + 2}h4v4h-4z`;
    done[i] = `M${x} ${y}h8v8h-8z`;
  }
  return { columns, waiting, running, done };
}

/** One path per state at t. O(n): call it when the counts change, not on every frame. */
export function statePaths(run: PreparedRun, marks: CellMarks, t: number): Record<SimState, string> {
  const out: Record<SimState, string[]> = { waiting: [], running: [], done: [] };
  const n = Math.min(run.count, marks.done.length);
  for (let i = 0; i < n; i++) {
    const s = cellState(run, i, t);
    out[s].push(marks[s][i]);
  }
  return { waiting: out.waiting.join(""), running: out.running.join(""), done: out.done.join("") };
}

/** A stable key for a choice, so each design and option set is simulated once. */
export function choiceKey(choice: SimChoice): string {
  const opts = Object.keys(choice.options)
    .sort()
    .map((k) => `${k}=${choice.options[k] ? 1 : 0}`)
    .join("&");
  return `${choice.design}?${opts}`;
}

/** Default number format for counters: en-US grouping, so the server and the browser agree. */
export const formatCount = (n: number) => n.toLocaleString("en-US");

/** Default time format: one decimal and the unit, "3.2 s". */
export const formatSeconds = (s: number) => `${s.toFixed(1)} s`;
